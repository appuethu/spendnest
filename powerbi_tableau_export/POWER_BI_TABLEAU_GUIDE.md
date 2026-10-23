# SpendNest Revenue Intelligence — Power BI & Tableau Data Guide

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
