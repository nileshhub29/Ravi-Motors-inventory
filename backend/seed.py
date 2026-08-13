"""
seed.py — Seed the database with ~31 realistic spare parts.
Run: python -m backend.seed
"""
import asyncio
from sqlalchemy import select, func
from backend.database import engine, async_session, create_tables
from backend.models import Inventory


SEED_PARTS = [
    # SWIFT Type 3 (2018-2021)
    {"part_name": "Swift Type 3 Headlight Assembly LH", "car_model": "Swift", "generation_type": "Type 3 (2018-2021)", "part_category": "Headlights", "position": "Front", "side": "LH", "quality_tier": "MGP Genuine", "oem_number": "35120-M78J10", "selling_price": 4250, "stock": 4, "low_stock_threshold": 3, "compatible_models": ["Dzire Type 3"]},
    {"part_name": "Swift Type 3 Headlight Assembly RH", "car_model": "Swift", "generation_type": "Type 3 (2018-2021)", "part_category": "Headlights", "position": "Front", "side": "RH", "quality_tier": "MGP Genuine", "oem_number": "35110-M78J10", "selling_price": 4250, "stock": 3, "low_stock_threshold": 3, "compatible_models": ["Dzire Type 3"]},
    {"part_name": "Swift Type 3 Tail Light LH", "car_model": "Swift", "generation_type": "Type 3 (2018-2021)", "part_category": "Backlights", "position": "Back", "side": "LH", "quality_tier": "MGP Genuine", "oem_number": "36510-M78J20", "selling_price": 2950, "stock": 2, "low_stock_threshold": 3, "compatible_models": []},
    {"part_name": "Swift Type 3 Tail Light RH", "car_model": "Swift", "generation_type": "Type 3 (2018-2021)", "part_category": "Backlights", "position": "Back", "side": "RH", "quality_tier": "MGP Genuine", "oem_number": "36520-M78J20", "selling_price": 2950, "stock": 1, "low_stock_threshold": 3, "compatible_models": []},
    {"part_name": "Swift Type 3 Front Bumper", "car_model": "Swift", "generation_type": "Type 3 (2018-2021)", "part_category": "Bumpers", "position": "Front", "side": "Universal", "quality_tier": "MGP Genuine", "oem_number": "71110-M78J50", "selling_price": 6800, "stock": 1, "low_stock_threshold": 2, "compatible_models": []},
    {"part_name": "Swift Type 3 Rear Bumper", "car_model": "Swift", "generation_type": "Type 3 (2018-2021)", "part_category": "Bumpers", "position": "Back", "side": "Universal", "quality_tier": "MGP Genuine", "oem_number": "71510-M78J50", "selling_price": 5900, "stock": 2, "low_stock_threshold": 2, "compatible_models": []},
    {"part_name": "Swift Type 3 Headlight LH (Aftermarket)", "car_model": "Swift", "generation_type": "Type 3 (2018-2021)", "part_category": "Headlights", "position": "Front", "side": "LH", "quality_tier": "Aftermarket", "oem_number": "AFT-SW3-HL-LH", "selling_price": 2150, "stock": 8, "low_stock_threshold": 3, "compatible_models": []},
    {"part_name": "Swift Type 3 Headlight RH (Aftermarket)", "car_model": "Swift", "generation_type": "Type 3 (2018-2021)", "part_category": "Headlights", "position": "Front", "side": "RH", "quality_tier": "Aftermarket", "oem_number": "AFT-SW3-HL-RH", "selling_price": 2150, "stock": 6, "low_stock_threshold": 3, "compatible_models": []},

    # SWIFT Type 4 (2022+)
    {"part_name": "Swift Type 4 LED Headlight LH", "car_model": "Swift", "generation_type": "Type 4 (2022+)", "part_category": "Headlights", "position": "Front", "side": "LH", "quality_tier": "MGP Genuine", "oem_number": "35120-M95J10", "selling_price": 7850, "stock": 2, "low_stock_threshold": 3, "compatible_models": []},
    {"part_name": "Swift Type 4 LED Headlight RH", "car_model": "Swift", "generation_type": "Type 4 (2022+)", "part_category": "Headlights", "position": "Front", "side": "RH", "quality_tier": "MGP Genuine", "oem_number": "35110-M95J10", "selling_price": 7850, "stock": 3, "low_stock_threshold": 3, "compatible_models": []},
    {"part_name": "Swift Type 4 Front Bumper", "car_model": "Swift", "generation_type": "Type 4 (2022+)", "part_category": "Bumpers", "position": "Front", "side": "Universal", "quality_tier": "MGP Genuine", "oem_number": "71110-M95J50", "selling_price": 8450, "stock": 1, "low_stock_threshold": 2, "compatible_models": []},

    # DZIRE Type 3 (2017-2020)
    {"part_name": "Dzire Type 3 Headlight LH", "car_model": "Dzire", "generation_type": "Type 3 (2017-2020)", "part_category": "Headlights", "position": "Front", "side": "LH", "quality_tier": "MGP Genuine", "oem_number": "35120-M79J00", "selling_price": 4100, "stock": 3, "low_stock_threshold": 3, "compatible_models": ["Swift Type 3"]},
    {"part_name": "Dzire Type 3 Headlight RH", "car_model": "Dzire", "generation_type": "Type 3 (2017-2020)", "part_category": "Headlights", "position": "Front", "side": "RH", "quality_tier": "MGP Genuine", "oem_number": "35110-M79J00", "selling_price": 4100, "stock": 2, "low_stock_threshold": 3, "compatible_models": ["Swift Type 3"]},
    {"part_name": "Dzire Type 3 Tail Light LH", "car_model": "Dzire", "generation_type": "Type 3 (2017-2020)", "part_category": "Backlights", "position": "Back", "side": "LH", "quality_tier": "MGP Genuine", "oem_number": "36510-M79J20", "selling_price": 2750, "stock": 4, "low_stock_threshold": 3, "compatible_models": []},
    {"part_name": "Dzire Type 3 Tail Light RH", "car_model": "Dzire", "generation_type": "Type 3 (2017-2020)", "part_category": "Backlights", "position": "Back", "side": "RH", "quality_tier": "MGP Genuine", "oem_number": "36520-M79J20", "selling_price": 2750, "stock": 0, "low_stock_threshold": 3, "compatible_models": []},
    {"part_name": "Dzire Type 3 Front Bumper (Aftermarket)", "car_model": "Dzire", "generation_type": "Type 3 (2017-2020)", "part_category": "Bumpers", "position": "Front", "side": "Universal", "quality_tier": "Aftermarket", "oem_number": "AFT-DZ3-FB-01", "selling_price": 3200, "stock": 5, "low_stock_threshold": 3, "compatible_models": []},

    # BALENO Type 2 (2022+)
    {"part_name": "Baleno Type 2 LED Headlight LH", "car_model": "Baleno", "generation_type": "Type 2 (2022+)", "part_category": "Headlights", "position": "Front", "side": "LH", "quality_tier": "MGP Genuine", "oem_number": "35120-M80J10", "selling_price": 8950, "stock": 2, "low_stock_threshold": 2, "compatible_models": []},
    {"part_name": "Baleno Type 2 LED Headlight RH", "car_model": "Baleno", "generation_type": "Type 2 (2022+)", "part_category": "Headlights", "position": "Front", "side": "RH", "quality_tier": "MGP Genuine", "oem_number": "35110-M80J10", "selling_price": 8950, "stock": 1, "low_stock_threshold": 2, "compatible_models": []},
    {"part_name": "Baleno Type 2 Tail Light LH", "car_model": "Baleno", "generation_type": "Type 2 (2022+)", "part_category": "Backlights", "position": "Back", "side": "LH", "quality_tier": "MGP Genuine", "oem_number": "36510-M80J20", "selling_price": 3450, "stock": 3, "low_stock_threshold": 3, "compatible_models": []},
    {"part_name": "Baleno Type 2 Tail Light RH", "car_model": "Baleno", "generation_type": "Type 2 (2022+)", "part_category": "Backlights", "position": "Back", "side": "RH", "quality_tier": "MGP Genuine", "oem_number": "36520-M80J20", "selling_price": 3450, "stock": 4, "low_stock_threshold": 3, "compatible_models": []},
    {"part_name": "Baleno Type 2 Front Bumper", "car_model": "Baleno", "generation_type": "Type 2 (2022+)", "part_category": "Bumpers", "position": "Front", "side": "Universal", "quality_tier": "MGP Genuine", "oem_number": "71110-M80J50", "selling_price": 7200, "stock": 1, "low_stock_threshold": 2, "compatible_models": []},

    # WAGONR Type 3 (2019+)
    {"part_name": "WagonR Type 3 Headlight LH", "car_model": "WagonR", "generation_type": "Type 3 (2019+)", "part_category": "Headlights", "position": "Front", "side": "LH", "quality_tier": "MGP Genuine", "oem_number": "35120-M83J00", "selling_price": 3950, "stock": 2, "low_stock_threshold": 3, "compatible_models": []},
    {"part_name": "WagonR Type 3 Headlight RH", "car_model": "WagonR", "generation_type": "Type 3 (2019+)", "part_category": "Headlights", "position": "Front", "side": "RH", "quality_tier": "MGP Genuine", "oem_number": "35110-M83J00", "selling_price": 3950, "stock": 1, "low_stock_threshold": 3, "compatible_models": []},
    {"part_name": "WagonR Type 3 Tail Light LH", "car_model": "WagonR", "generation_type": "Type 3 (2019+)", "part_category": "Backlights", "position": "Back", "side": "LH", "quality_tier": "Aftermarket", "oem_number": "AFT-WR3-TL-LH", "selling_price": 1850, "stock": 7, "low_stock_threshold": 3, "compatible_models": []},
    {"part_name": "WagonR Type 3 Tail Light RH", "car_model": "WagonR", "generation_type": "Type 3 (2019+)", "part_category": "Backlights", "position": "Back", "side": "RH", "quality_tier": "Aftermarket", "oem_number": "AFT-WR3-TL-RH", "selling_price": 1850, "stock": 5, "low_stock_threshold": 3, "compatible_models": []},
    {"part_name": "WagonR Type 3 Front Bumper", "car_model": "WagonR", "generation_type": "Type 3 (2019+)", "part_category": "Bumpers", "position": "Front", "side": "Universal", "quality_tier": "MGP Genuine", "oem_number": "71110-M83J50", "selling_price": 4900, "stock": 2, "low_stock_threshold": 2, "compatible_models": []},
    {"part_name": "WagonR Type 3 Rear Bumper (Aftermarket)", "car_model": "WagonR", "generation_type": "Type 3 (2019+)", "part_category": "Bumpers", "position": "Back", "side": "Universal", "quality_tier": "Aftermarket", "oem_number": "AFT-WR3-RB-01", "selling_price": 2800, "stock": 3, "low_stock_threshold": 3, "compatible_models": []},

    # SUPER CARRY (Commercial)
    {"part_name": "Super Carry Headlight LH", "car_model": "Super Carry", "generation_type": "Type 1 (Commercial)", "part_category": "Headlights", "position": "Front", "side": "LH", "quality_tier": "Aftermarket", "oem_number": "AFT-SC1-HL-LH", "selling_price": 2650, "stock": 4, "low_stock_threshold": 3, "compatible_models": []},
    {"part_name": "Super Carry Headlight RH", "car_model": "Super Carry", "generation_type": "Type 1 (Commercial)", "part_category": "Headlights", "position": "Front", "side": "RH", "quality_tier": "Aftermarket", "oem_number": "AFT-SC1-HL-RH", "selling_price": 2650, "stock": 3, "low_stock_threshold": 3, "compatible_models": []},
    {"part_name": "Super Carry Front Bumper", "car_model": "Super Carry", "generation_type": "Type 1 (Commercial)", "part_category": "Bumpers", "position": "Front", "side": "Universal", "quality_tier": "Aftermarket", "oem_number": "AFT-SC1-FB-01", "selling_price": 3450, "stock": 2, "low_stock_threshold": 2, "compatible_models": []},
    {"part_name": "Super Carry Tail Light LH", "car_model": "Super Carry", "generation_type": "Type 1 (Commercial)", "part_category": "Backlights", "position": "Back", "side": "LH", "quality_tier": "MGP Genuine", "oem_number": "36510-M77J20", "selling_price": 2200, "stock": 0, "low_stock_threshold": 3, "compatible_models": []},
]


async def seed():
    await create_tables()
    async with async_session() as session:
        # Check if already seeded
        result = await session.execute(select(func.count()).select_from(Inventory))
        count = result.scalar() or 0
        if count > 0:
            print(f"Database already has {count} items. Skipping seed.")
            return

        for part_data in SEED_PARTS:
            item = Inventory(**part_data)
            session.add(item)

        await session.commit()
        print(f"Seeded {len(SEED_PARTS)} inventory items.")


if __name__ == "__main__":
    asyncio.run(seed())
