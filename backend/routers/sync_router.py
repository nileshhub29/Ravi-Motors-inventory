from typing import Annotated, Any, Dict, List
import asyncio
import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import json

from backend.database import get_db
from backend.models import User, AppRole, Inventory
from backend.auth import require_min_role
from pydantic import BaseModel

router = APIRouter(prefix="/api/sync", tags=["sync"])

MARUTI_GRAPHQL_URL = "https://www.marutisuzuki.com/genuine-parts/api/graphql"
MARUTI_HEADERS = {
    "Magento-Environment-Id": "f965c128-4aa4-4044-aaf9-3dcae2ad92b9",
    "Magento-Website-Code": "genuine_parts",
    "Magento-Store-View-Code": "parts",
    "Magento-Store-Code": "genuine_parts_store",
    "Magento-Customer-Group": "b6589fc6ab0dc82cf12099d1c2d40ab994e8410c",
    "Content-Type": "application/json"
}

MARUTI_QUERY = """
query productSearch($phrase: String!, $pageSize: Int) {
  productSearch(phrase: $phrase, page_size: $pageSize) {
    total_count
    items {
      productView {
        sku
        name
        inStock
        ... on SimpleProductView {
          price {
            final {
              amount {
                value
                currency
              }
            }
          }
        }
      }
    }
  }
}
"""

@router.get("/prices")
async def sync_prices(
    current_user: Annotated[User, Depends(require_min_role(AppRole.admin))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Server-Sent Events (SSE) endpoint that scans all MGP Genuine parts,
    fetches live prices from Maruti's website, and streams the progress.
    """
    
    # Get all MGP Genuine parts
    result = await db.execute(
        select(Inventory).where(Inventory.quality_tier == "MGP Genuine")
    )
    parts = result.scalars().all()
    total = len(parts)

    async def event_generator():
        yield f"data: {json.dumps({'status': 'start', 'total': total})}\n\n"

        async with httpx.AsyncClient() as client:
            for idx, part in enumerate(parts):
                # Clean up the OEM number for searching (Maruti handles missing dashes well)
                search_term = part.oem_number.replace(" ", "").replace("-", "")
                
                try:
                    response = await client.post(
                        MARUTI_GRAPHQL_URL,
                        headers=MARUTI_HEADERS,
                        json={
                            "query": MARUTI_QUERY,
                            "variables": {"phrase": search_term, "pageSize": 3}
                        },
                        timeout=10.0
                    )
                    
                    data = response.json()
                    items = data.get("data", {}).get("productSearch", {}).get("items", [])
                    
                    new_price = None
                    if items:
                        # Find the best match if there are multiple
                        # We just take the first one since it's an exact SKU match usually
                        product_view = items[0].get("productView", {})
                        price_info = product_view.get("price", {}).get("final", {}).get("amount", {})
                        if price_info and "value" in price_info:
                            new_price = int(price_info["value"])

                    yield f"data: {json.dumps({'status': 'progress', 'current': idx + 1, 'total': total, 'id': part.id, 'part_name': part.part_name, 'oem_number': part.oem_number, 'old_price': part.selling_price, 'new_price': new_price})}\n\n"
                    
                except Exception as e:
                    yield f"data: {json.dumps({'status': 'progress', 'current': idx + 1, 'total': total, 'id': part.id, 'part_name': part.part_name, 'oem_number': part.oem_number, 'old_price': part.selling_price, 'new_price': None, 'error': str(e)})}\n\n"

                # Wait 1 second to avoid rate limiting
                await asyncio.sleep(1.0)
                
        yield f"data: {json.dumps({'status': 'done'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

class SyncApplyRequest(BaseModel):
    updates: List[Dict[str, Any]]

@router.post("/apply")
async def apply_sync_prices(
    req: SyncApplyRequest,
    current_user: Annotated[User, Depends(require_min_role(AppRole.admin))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Applies the approved price updates to the database.
    """
    updated_count = 0
    for update in req.updates:
        item_id = update.get("id")
        new_price = update.get("new_price")
        
        if item_id and new_price is not None:
            result = await db.execute(select(Inventory).where(Inventory.id == item_id))
            item = result.scalar_one_or_none()
            if item:
                item.selling_price = int(new_price)
                updated_count += 1
                
    await db.commit()
    return {"status": "success", "updated_count": updated_count}
