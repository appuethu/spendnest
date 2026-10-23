# Revenue Intelligence Inbox — SpendNest

A modern interactive Revenue Intelligence platform and management dashboard that transforms incoming calls, meeting records, and transcripts into actionable executive insights.

Includes both a **React 19 + TypeScript + Vite web application** and a **Streamlit application**, along with machine-readable exports, Power BI / Tableau data models, and a 5-slide presentation deck.

---

## Installation & Setup

### 1. Modern Web Application (React + Vite)
```bash
# Navigate to webapp directory
cd candidate/webapp

# Install dependencies and start local dev server
npm install
npm run dev
```
Opens at **http://localhost:5173** (or `http://127.0.0.1:5173`).

### 2. Python Environment & Export Scripts
```bash
# In the candidate directory
cd candidate
pip install -r requirements.txt
pip install python-pptx

# Generate 5-slide presentation PPTX
python generate_slides.py

# Generate Power BI & Tableau star schema datasets
python export_powerbi_tableau.py
```

---

## First Run (Demo Setup)

1. Go to **Import & Update** in the sidebar.
2. Click **"🎬 Demo Setup (Reset + Both Batches)"** — this imports both `data/01_initial.json` (revision 1) and `data/02_update.json` (revision 2) and produces the final post-update state.
3. The app is now ready. All 44 records are loaded, 18 usable transcripts are visible.

---

## Replay Steps (Manual Sequence)

Follow these steps to reproduce the complete import/update sequence:

| Step | Action | Button / UI | Expected Result |
|------|--------|-------------|-----------------|
| 1 | Initial import | **Import & Update → Import Initial Batch** | 44 records, 17 usable transcripts |
| 2 | Repeat import | **Import & Update → Re-import Initial (No Duplicates)** | Still 44 records — no increase |
| 3 | Manual route correction | **Conversation Inbox → select M07 → Edit Route → Save** | Override marked ✏️, saved to state.json |
| 4 | Apply update | **Import & Update → Import Update Batch** | M07 gets transcript (revision 2 applied), 18 usable transcripts |
| 5 | Re-import initial again | **Import & Update → Re-import Initial (No Duplicates)** | Revision 1 skipped; 44 records, M07 still revision 2 |
| 6 | Restart app | `Ctrl+C` then `streamlit run app.py` | Manual route on M07 preserved (persisted in state.json) |

---

## Where Outputs Are Written

```
candidate/
├── app.py                  ← application
├── requirements.txt
├── state.json              ← persisted state (records, revisions, overrides)
├── exports/
│   ├── Deal_Follow-up/     ← one .txt per record with this route
│   ├── Sales_Coaching/
│   ├── Customer_Follow-up/
│   ├── Internal-Vendor/
│   ├── Human_Review/
│   ├── manager_brief_2026-08-21.txt
│   ├── manifest.json       ← machine-readable manifest
│   ├── manifest.csv
│   └── revenue_intelligence_export.zip   ← downloadable archive
```

Exports are generated from the **Export** page. Every listed manifest entry has a corresponding file.

---

## Metric Definitions

| Metric | Definition | Denominator |
|--------|-----------|-------------|
| **Source records** | Distinct `(source_type, source_id)` pairs after applying revisions | N/A |
| **Usable transcript** | Non-blank call `payload.transcript` OR meeting `transcript_payload.turns` with ≥1 non-blank turn | — |
| **Transcript coverage** | Usable supplied texts ÷ selected source records in the same filter | Same filter set |
| **Call connection rate** | `is_connected=true` ÷ calls with non-null `is_connected` | Non-null `is_connected` only |
| **Rep** (calls) | `payload.rep_name` or `payload.rep_email` | — |
| **Organiser** (meetings) | `payload.organizer_email` — not automatically the salesperson | — |
| **Route assignments** | Route labels per record; a record with 2 routes counts twice in route totals | Distinct records for unique counts |

> All counts are labelled as **selected records** — this is a deliberately chosen sample, not a complete team day.

---

## AI Usage

**Pre-generated analysis:** All `PREGENERATED_ANALYSIS` entries in `app.py` were hand-written by carefully reading every transcript in `CONVERSATIONS.md` and the JSON files. No live AI API is called at runtime.

**AI tools used during development:** Claude was used to assist in writing this application code. Analysis conclusions, route assignments, evidence quotes and next-step recommendations were written by the candidate after reading source material.

**Runtime computation:** All import/deduplication/revision logic, filtering, chart generation and export functions run deterministically at runtime using the supplied data.

**New transcripts:** When a new transcript arrives (e.g., M07 via the update batch), the app marks the record's analysis as `stale_pending_review` and surfaces a visible warning. No automatic re-analysis is triggered; human-assisted update is required.

---

## Three Most Important Findings

### Finding 1 — M03: Pricing Discrepancy Mid-Demo (Sales Coaching)
**What I noticed:** During the Asterloom Systems demo (M03), the customer (Customer A) caught that the quoted price had changed from INR 26,000 to INR 39,000 without warning.

**Source passage:** M03 Turn 23: *"But you previously told me INR 26,000. Why has that become INR 39,000?"* — Turn 24: *"I included the integration setup in that number. To separate it: INR 26,000 plus tax is the recurring annual subscription, and INR 13,000 is the one-time accounting integration setup."*

**Effect on product:** This record is routed to both **Deal Follow-up** (proposal still needed) and **Sales Coaching** (pricing communication gap highlighted). The coaching flag appears in the Manager Brief and in the conversation detail view with the exact turn reference.

---

### Finding 2 — M04: Cedarwave Unresolved on Credit vs Prepaid (Human Review + Customer Follow-up)
**What I noticed:** Cedarwave Distribution's fundamental requirement — credit cards, not prepaid — cannot be met by SpendNest's core product. The bank partnership alternative was put on hold previously from the customer's side, and bank-card transaction-feed eligibility was explicitly left unconfirmed on the call.

**Source passage:** M04 Turn 11: *"moving from prepaid to credit is the main issue for us."* M04 Turn 23: *"I cannot confirm the existing-card eligibility on this call."*

**Effect on product:** M04 is dual-routed **Customer Follow-up + Human Review**. The Human Review flag surfaces in the dashboard's "Needs Review" count, and the Manager Brief lists this as an urgent action item with specific follow-up tasks.

---

### Finding 3 — M09: Token Expiry Bug (Engineering Bug Report)
**What I noticed:** The Brookmint Holdings reset token expired immediately after being sent during the support session — not a stale link problem but a freshly generated token. The support agent acknowledged they had no explanation.

**Source passage:** M09 Turn 21: *"It says the token has expired. This is the fresh message we just received."* Turn 22: *"I need to check that with the team. I hope to update you today, or by Monday at the latest."*

**Effect on product:** M09 is routed **Customer Follow-up + Human Review**. Next steps include an engineering ticket for the token expiry issue. Visible in the Manager Brief as an urgent unresolved item.

---

## Rejected Design Decision

**Decision considered:** Auto-generate AI summaries at runtime by calling an LLM API (e.g., OpenAI) whenever a new record or transcript arrives.

**Why rejected:** (1) It requires an API key and cost, which the assignment explicitly says is not required. (2) Auto-generated LLM summaries can hallucinate details from the transcript, which would be worse than showing "no summary" for unknown records. (3) The assignment explicitly allows pre-generated analysis and requires transparency about what is pre-generated vs runtime.

**Trade-off accepted:** The pre-generated analysis is fixed and does not update dynamically. When M07's transcript arrives in the update batch, the app correctly flags the record as `stale_pending_review` and shows a warning. The manager must manually review and the analysis can be updated via the route editor. This is honest about the limitation.

**Where this shows in the product:** The `stale_pending_review` flag appears in the Conversation Inbox detail view as an amber warning banner. The route override editor allows the manager to document a corrected route after reviewing the new transcript. The Manager Brief for M07 notes that the transcript arrived in the update batch.

---

## Approximate Time Spent

- Data reading and understanding: 1 hour
- Application design and code: 5 hours
- Pre-generated analysis writing (reading all 18 transcripts): 1.5 hours
- README, documentation, and testing: 0.5 hour

**Total: ~8 hours**

---

## Known Limitations

1. **Pre-generated analysis only:** Records without a matching entry in `PREGENERATED_ANALYSIS` (all background calls B01–B20, and meetings M05/M08/M11/M12/M13/M14) receive a generic "no transcript" message. No analysis is invented.
2. **No live AI:** New transcripts mark a record stale but don't auto-regenerate summaries.
3. **Single-user state file:** `state.json` is a local file. Concurrent users would overwrite each other's state.
4. **No authentication:** The app has no login. Suitable for local/private review use only.
5. **M05, M08, M11–M14 meetings:** These have no usable transcript turns (recording cancelled or not scheduled). They are in the "Human Review" route with the appropriate note.
6. **Evidence timecodes:** Call transcripts have no per-turn timecodes; evidence is cited by short exact quote. Meeting turn numbers are 1-based indices in the supplied turns array.
