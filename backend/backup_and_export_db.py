"""
backup_and_export_db.py — Export all data from SQLite to timestamped JSON & SQL.
"""
import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "parts_inventory.db")
BACKUP_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "backups")

def run_backup():
    os.makedirs(BACKUP_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    json_path = os.path.join(BACKUP_DIR, f"backup_{timestamp}.json")
    sql_path = os.path.join(BACKUP_DIR, f"backup_{timestamp}.sql")
    latest_json = os.path.join(BACKUP_DIR, "backup_latest.json")

    if not os.path.exists(DB_PATH):
        print(f"Error: {DB_PATH} not found!")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Get all table names
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    tables = [row[0] for row in cursor.fetchall()]

    data_dump = {}
    print(f"--- Backing up database from {DB_PATH} ---")
    for table in tables:
        cursor.execute(f"SELECT * FROM {table}")
        rows = [dict(row) for row in cursor.fetchall()]
        data_dump[table] = rows
        print(f"Table '{table}': {len(rows)} rows dumped")

    # Save JSON dump
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data_dump, f, indent=2, default=str)
    
    # Save latest copy
    with open(latest_json, "w", encoding="utf-8") as f:
        json.dump(data_dump, f, indent=2, default=str)

    # Save SQL dump
    with open(sql_path, "w", encoding="utf-8") as f:
        for line in conn.iterdump():
            f.write(f"{line}\n")

    conn.close()

    print(f"\nSUCCESS: Backup created safely!")
    print(f"JSON Backup: {json_path}")
    print(f"SQL Dump:    {sql_path}")
    print(f"Latest JSON: {latest_json}")
    return json_path

if __name__ == "__main__":
    run_backup()
