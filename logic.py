"""
Core business logic for Revenue Intelligence Inbox.
Importable without Streamlit.
"""

import json
import os
import zipfile
import csv
import shutil
from datetime import datetime
import pytz

IST = pytz.timezone("Asia/Kolkata")


def is_usable_transcript(record: dict) -> bool:
    """Return True if this record has usable supplied text."""
    if record["source_type"] == "call":
        transcript = record["payload"].get("transcript")
        return bool(transcript and transcript.strip())
    else:  # meeting
        tp = record.get("transcript_payload")
        if not tp:
            return False
        turns = tp.get("turns", [])
        return bool(turns and any(t.get("text", "").strip() for t in turns))


def record_key(source_type: str, source_id: str) -> str:
    return f"{source_type}::{source_id}"


def import_batch(state: dict, batch_data: dict) -> dict:
    """
    Import a batch of records into state.
    Identity: (source_type, source_id). Older revisions are ignored.
    """
    batch_revision = batch_data.get("revision", 1)
    batch_id = batch_data.get("batch_id", "unknown")
    new_count = updated_count = skipped_count = 0
    errors = []

    for rec in batch_data.get("records", []):
        st = rec.get("source_type")
        sid = rec.get("source_id")
        if not st or not sid:
            errors.append(f"Record missing source_type or source_id: {rec.get('record_ref', '?')}")
            continue

        key = record_key(st, sid)
        existing_revision = state["revisions"].get(key, 0)

        if batch_revision <= existing_revision:
            skipped_count += 1
            continue

        is_new = key not in state["records"]

        state["records"][key] = {
            "record_ref": rec.get("record_ref", ""),
            "source_type": st,
            "source_id": sid,
            "payload": rec.get("payload", {}),
            "transcript_payload": rec.get("transcript_payload"),
        }
        state["revisions"][key] = batch_revision

        if not is_new:
            state.setdefault("analysis_state", {})[key] = "stale_pending_review"
            updated_count += 1
        else:
            state.setdefault("analysis_state", {})[key] = "current"
            new_count += 1

    if batch_id not in state["imported_batches"]:
        state["imported_batches"].append(batch_id)

    return {
        "new_count": new_count,
        "updated_count": updated_count,
        "skipped_count": skipped_count,
        "errors": errors,
        "batch_id": batch_id,
        "batch_revision": batch_revision,
    }


def load_state(state_file: str = "state.json") -> dict:
    if os.path.exists(state_file):
        try:
            with open(state_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "records": {},
        "revisions": {},
        "overrides": {},
        "analysis_state": {},
        "imported_batches": [],
    }


def save_state(state: dict, state_file: str = "state.json"):
    with open(state_file, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, ensure_ascii=False)
