"""
sync_router.py — Per-item price syncing against the official Maruti Suzuki website.
"""
from typing import Annotated, Any, Dict, List
import httpx
import urllib.parse
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models import User, AppRole, Inventory, StockAuditLog
from backend.auth import require_min_role
from backend.schemas import InventoryOut
from backend.websocket import manager

router = APIRouter(prefix="/api/sync", tags=["sync"])

MARUTI_GRAPHQL_URL = "https://www.marutisuzuki.com/genuine-parts/api/graphql"
MARUTI_HEADERS = {
    "Magento-Environment-Id": "f965c128-4aa4-4044-aaf9-3dcae2ad92b9",
    "Magento-Website-Code": "genuine_parts",
    "Magento-Store-View-Code": "parts",
    "Magento-Store-Code": "genuine_parts_store",
    "Magento-Customer-Group": "b6589fc6ab0dc82cf12099d1c2d40ab994e8410c",
}

MARUTI_QUERY = """query productSearch($phrase: String!, $pageSize: Int) {
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
            regular {
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
}"""


async def _fetch_maruti_price(oem_number: str) -> dict | None:
    """
    Fetch the live price for a single OEM number from Maruti's GraphQL API.
    Uses GET method (the only method Maruti's API accepts).
    Returns dict with sku, name, price, inStock or None if not found.
    """
    import json
    search_term = oem_number.replace(" ", "").replace("-", "")
    
    variables = json.dumps({"phrase": search_term, "pageSize": 3})
    params = {
        "query": MARUTI_QUERY,
        "variables": variables,
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            MARUTI_GRAPHQL_URL,
            headers=MARUTI_HEADERS,
            params=params,
            timeout=15.0,
        )
        
        data = response.json()
        items = data.get("data", {}).get("productSearch", {}).get("items", [])
        
        if not items:
            return None
        
        product_view = items[0].get("productView", {})
        price_info = product_view.get("price", {}).get("final", {}).get("amount", {})
        
        if not price_info or "value" not in price_info:
            return None
        
        return {
            "sku": product_view.get("sku", ""),
            "name": product_view.get("name", ""),
            "price": int(price_info["value"]),
            "in_stock": product_view.get("inStock", False),
        }


@router.get("/check/{item_id}")
async def check_price(
    item_id: int,
    current_user: Annotated[User, Depends(require_min_role(AppRole.admin))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Check the live Maruti price for a single inventory item.
    Returns the current price, live price, and the difference.
    """
    result = await db.execute(select(Inventory).where(Inventory.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if item.quality_tier != "MGP Genuine":
        raise HTTPException(status_code=400, detail="Only MGP Genuine parts can be synced")
    
    try:
        maruti_data = await _fetch_maruti_price(item.oem_number)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to reach Maruti website: {str(e)}")
    
    if not maruti_data:
        return {
            "found": False,
            "item_id": item.id,
            "oem_number": item.oem_number,
            "current_price": float(item.selling_price),
            "maruti_price": None,
            "message": "Part not found on Maruti website",
        }
    
    current_price = float(item.selling_price)
    maruti_price = maruti_data["price"]
    
    return {
        "found": True,
        "item_id": item.id,
        "oem_number": item.oem_number,
        "part_name": item.part_name,
        "maruti_name": maruti_data["name"],
        "maruti_sku": maruti_data["sku"],
        "current_price": current_price,
        "maruti_price": maruti_price,
        "price_changed": current_price != maruti_price,
        "difference": maruti_price - current_price,
        "in_stock": maruti_data["in_stock"],
    }


@router.post("/apply/{item_id}")
async def apply_price(
    item_id: int,
    current_user: Annotated[User, Depends(require_min_role(AppRole.admin))],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Fetch the live Maruti price for a single item and apply it to the database.
    Logs the change in the audit log.
    """
    result = await db.execute(select(Inventory).where(Inventory.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if item.quality_tier != "MGP Genuine":
        raise HTTPException(status_code=400, detail="Only MGP Genuine parts can be synced")
    
    try:
        maruti_data = await _fetch_maruti_price(item.oem_number)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to reach Maruti website: {str(e)}")
    
    if not maruti_data:
        raise HTTPException(status_code=404, detail="Part not found on Maruti website")
    
    old_price = float(item.selling_price)
    new_price = maruti_data["price"]
    
    if old_price == new_price:
        return {
            "status": "no_change",
            "message": "Price is already up to date",
            "current_price": old_price,
        }
    
    # Update the price
    item.selling_price = new_price
    
    # Create audit log entry
    worker_name = current_user.worker.name if current_user.worker else current_user.email
    audit = StockAuditLog(
        worker_name=worker_name,
        worker_role=current_user.role_entry.role.value if current_user.role_entry else "staff",
        part_name=item.part_name,
        oem_number=item.oem_number,
        car_model=item.car_model,
        generation_type=item.generation_type,
        action_type="price_synced",
        reason=f"Price synced from Maruti website: ₹{int(old_price)} → ₹{new_price}",
        previous_stock=None,
        new_stock=None,
        delta=None,
    )
    db.add(audit)
    
    await db.commit()
    await db.refresh(item)
    
    # Broadcast updates
    item_dict = InventoryOut.model_validate(item).model_dump(mode="json")
    await manager.broadcast("inventory_updated", item_dict)
    
    from backend.schemas import AuditLogOut
    audit_dict = AuditLogOut.model_validate(audit).model_dump(mode="json")
    await manager.broadcast("audit_log", audit_dict)
    
    return {
        "status": "updated",
        "item_id": item.id,
        "old_price": old_price,
        "new_price": new_price,
        "difference": new_price - old_price,
    }
