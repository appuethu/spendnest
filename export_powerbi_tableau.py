"""
SpendNest Revenue Intelligence — Tableau & Power BI Data Model Exporter
Converts JSON batches into a relational Star Schema for Power BI & Tableau Desktop.
"""

import json
import csv
import os
from logic import import_batch, is_usable_transcript, record_key

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, "data")
    output_dir = os.path.join(base_dir, "powerbi_tableau_export")
    os.makedirs(output_dir, exist_ok=True)

    # 1. Load Initial and Update Batches (respecting revisions)
    state = {"records": {}, "revisions": {}, "overrides": {}, "analysis_state": {}, "imported_batches": []}
    
    with open(os.path.join(data_dir, "01_initial.json"), "r", encoding="utf-8") as f:
        batch1 = json.load(f)
    import_batch(state, batch1)

    with open(os.path.join(data_dir, "02_update.json"), "r", encoding="utf-8") as f:
        batch2 = json.load(f)
    import_batch(state, batch2)

    # Import analysis definitions from app.py
    from app import PREGENERATED_ANALYSIS, NO_TRANSCRIPT_ANALYSIS, BACKGROUND_CALL_ANALYSIS

    # Prepare Tables
    fact_conversations = []
    bridge_routes = []
    dim_routes = set()
    dim_team = set()
    fact_turns = []
    fact_evidence = []

    for key, rec in state["records"].items():
        st = rec["source_type"]
        sid = rec["source_id"]
        ref = rec["record_ref"]
        rev = state["revisions"].get(key, 1)
        p = rec.get("payload", {})
        tp = rec.get("transcript_payload")
        usable = is_usable_transcript(rec)

        # Team member
        if st == "call":
            rep_name = p.get("rep_name") or p.get("rep_email") or "Unknown Rep"
            role = "Call Sales Rep"
            company = p.get("company_name", "")
            contact = p.get("contact_name", "")
            title = f"{company} · {contact}" if company else f"Call {ref}"
            duration = p.get("duration_seconds", 0)
            is_connected = p.get("is_connected")
            disposition = p.get("disposition", "")
            transcript_text = p.get("transcript", "") or ""
            turn_count = 1 if transcript_text.strip() else 0
            word_count = len(transcript_text.split()) if transcript_text else 0
            started_at = p.get("started_at", "2026-08-21T00:00:00Z")
        else: # meeting
            organizer = p.get("organizer_email", "unknown@example.com")
            rep_name = organizer.split("@")[0] if "@" in organizer else organizer
            role = "Meeting Organiser"
            title = p.get("title", f"Meeting {ref}")
            company = title.split("/")[0].strip() if "/" in title else title
            contact = f"{p.get('attendee_count', 1)} Attendees"
            duration = p.get("duration_seconds", 0)
            is_connected = True
            disposition = p.get("recording_status", "recorded")
            turns = tp.get("turns", []) if tp else []
            turn_count = len(turns)
            transcript_text = " ".join(t.get("text", "") for t in turns)
            word_count = len(transcript_text.split())
            started_at = p.get("starts_at", "2026-08-21T00:00:00Z")

            for t_idx, t in enumerate(turns, start=1):
                fact_turns.append({
                    "record_id": key,
                    "record_ref": ref,
                    "turn_number": t_idx,
                    "speaker": t.get("speaker", "Unknown"),
                    "timecode": t.get("timecode", ""),
                    "starts_at_seconds": t.get("starts_at_seconds", 0),
                    "dialogue_text": t.get("text", ""),
                    "word_count": len(t.get("text", "").split())
                })

        dim_team.add((rep_name, role))

        # Analysis
        analysis = PREGENERATED_ANALYSIS.get((st, sid))
        if not analysis:
            if st == "call" and duration < 60:
                analysis = BACKGROUND_CALL_ANALYSIS
            else:
                analysis = NO_TRANSCRIPT_ANALYSIS

        review_state = state["analysis_state"].get(key, analysis.get("review_state", "needs_review"))
        routes = analysis.get("routes", ["Human Review"])
        summary = analysis.get("summary", "")

        for r in routes:
            bridge_routes.append({"record_id": key, "route_name": r})
            dim_routes.add(r)

        for q in analysis.get("evidence_quotes", []):
            fact_evidence.append({
                "record_id": key,
                "record_ref": ref,
                "evidence_type": "Verbatim Quote",
                "content": q
            })

        for s in analysis.get("next_steps", []):
            fact_evidence.append({
                "record_id": key,
                "record_ref": ref,
                "evidence_type": "Action Item",
                "content": s
            })

        fact_conversations.append({
            "record_id": key,
            "record_ref": ref,
            "source_type": st,
            "source_id": sid,
            "title": title,
            "company_name": company,
            "contact_name": contact,
            "team_member": rep_name,
            "role": role,
            "started_at": started_at,
            "duration_seconds": duration,
            "duration_minutes": round(duration / 60, 1),
            "is_connected": "Connected" if is_connected is True else ("Not Connected" if is_connected is False else "Unknown"),
            "disposition": disposition,
            "has_usable_transcript": "Yes" if usable else "No",
            "turn_count": turn_count,
            "word_count": word_count,
            "revision": rev,
            "review_state": review_state,
            "primary_route": routes[0] if routes else "Human Review",
            "route_count": len(routes),
            "executive_summary": summary
        })

    # Write CSV files
    def write_csv(filename, rows, fieldnames):
        filepath = os.path.join(output_dir, filename)
        with open(filepath, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
        print(f"Created: {filepath} ({len(rows)} rows)")

    # 1. Fact Conversations
    write_csv("fact_conversations.csv", fact_conversations, list(fact_conversations[0].keys()))

    # 2. Bridge Record Routes
    write_csv("bridge_record_routes.csv", bridge_routes, ["record_id", "route_name"])

    # 3. Dim Routes
    route_rows = [{"route_name": r, "route_category": "Standard"} for r in sorted(dim_routes)]
    write_csv("dim_routes.csv", route_rows, ["route_name", "route_category"])

    # 4. Dim Team Members
    team_rows = [{"team_member": t[0], "role": t[1]} for t in sorted(dim_team)]
    write_csv("dim_team_members.csv", team_rows, ["team_member", "role"])

    # 5. Fact Dialogue Turns
    if fact_turns:
        write_csv("fact_dialogue_turns.csv", fact_turns, list(fact_turns[0].keys()))

    # 6. Fact Evidence & Actions
    if fact_evidence:
        write_csv("fact_evidence_and_actions.csv", fact_evidence, list(fact_evidence[0].keys()))

    # Generate Setup Guide
    guide_path = os.path.join(output_dir, "POWER_BI_TABLEAU_GUIDE.md")
    with open(guide_path, "w", encoding="utf-8") as f:
        f.write("""# SpendNest Revenue Intelligence — Power BI & Tableau Data Guide

This package provides a production Star Schema designed for Power BI Desktop and Tableau Desktop.

## Star Schema Tables Included
1. **`fact_conversations.csv`**: Granular records of all 44 calls and meetings, durations, connection flags, transcripts, and summaries.
2. **`bridge_record_routes.csv`**: Many-to-many bridge resolving records tagged with multiple routes (prevents double counting).
3. **`dim_routes.csv`**: Dimension table for routing categories (`Deal Follow-up`, `Sales Coaching`, `Customer Follow-up`, `Internal/Vendor`, `Human Review`).
4. **`dim_team_members.csv`**: Team dimension separating Call Reps from Meeting Organisers.
5. **`fact_dialogue_turns.csv`**: Granular meeting turns with speaker timestamps and word counts.
6. **`fact_evidence_and_actions.csv`**: Verbatim evidence quotes and actionable owner next steps.

---

## Power BI Quick Setup
1. Open **Power BI Desktop**.
2. Click **Get Data → Text/CSV** and import all 6 CSV files.
3. In **Model View**, configure relationships:
   - `fact_conversations[record_id]` 1 ── * `bridge_record_routes[record_id]` (Cross filter direction: Both)
   - `dim_routes[route_name]` 1 ── * `bridge_record_routes[route_name]`
   - `dim_team_members[team_member]` 1 ── * `fact_conversations[team_member]`
   - `fact_conversations[record_id]` 1 ── * `fact_dialogue_turns[record_id]`

### Recommended DAX Measures
```dax
Total Records = COUNTROWS(fact_conversations)

Usable Transcripts = CALCULATE(COUNTROWS(fact_conversations), fact_conversations[has_usable_transcript] = "Yes")

Transcript Coverage % = DIVIDE([Usable Transcripts], [Total Records], 0)

Connected Calls = CALCULATE(COUNTROWS(fact_conversations), fact_conversations[is_connected] = "Connected")

Eligible Calls = CALCULATE(COUNTROWS(fact_conversations), fact_conversations[is_connected] IN {"Connected", "Not Connected"})

Call Connection Rate % = DIVIDE([Connected Calls], [Eligible Calls], 0)

Review Queue = CALCULATE(COUNTROWS(fact_conversations), fact_conversations[review_state] IN {"needs_review", "stale_pending_review"})
```

---

## Tableau Quick Setup
1. Open **Tableau Desktop**.
2. Under **Connect → To a File**, select **Text file** and open `fact_conversations.csv`.
3. Drag `bridge_record_routes.csv` and `dim_routes.csv` onto the canvas to form Relationships on `record_id` and `route_name`.
4. Create Calculated Fields:
   - **`[Transcript Coverage %]`**: `SUM(IIF([has_usable_transcript] = 'Yes', 1, 0)) / COUNT([fact_conversations])`
   - **`[Connection Rate %]`**: `SUM(IIF([is_connected] = 'Connected', 1, 0)) / SUM(IIF([is_connected] != 'Unknown', 1, 0))`
""")
    print(f"Created: {guide_path}")
    print("\nPower BI & Tableau Export Complete!")

if __name__ == "__main__":
    main()
