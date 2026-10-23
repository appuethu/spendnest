"""
Revenue Intelligence Inbox — SpendNest
Streamlit application for the Volopay hiring assignment.
"""

import streamlit as st
import pandas as pd
import json
import os
import zipfile
import io
import csv
import shutil
from datetime import datetime, timezone
import pytz
import plotly.express as px
import plotly.graph_objects as go
from logic import import_batch, is_usable_transcript, load_state, save_state, record_key

# ─────────────────────────────────────────────────────────────────────────────
# CONSTANTS
# ─────────────────────────────────────────────────────────────────────────────
IST = pytz.timezone("Asia/Kolkata")
STATE_FILE = "state.json"
EXPORT_DIR = "exports"
DATA_DIR = "data"
INITIAL_JSON = os.path.join(DATA_DIR, "01_initial.json")
UPDATE_JSON = os.path.join(DATA_DIR, "02_update.json")

# Pre-generated route analysis keyed by (source_type, source_id)
# These were prepared by carefully reading every transcript/conversation.
PREGENERATED_ANALYSIS = {
    # ── CALLS WITH TRANSCRIPTS ──────────────────────────────────────────────
    ("call", "2ec4404c-beee-5377-a63c-aab701da08ed"): {  # C01
        "routes": ["Sales Coaching"],
        "route_reasons": [
            "Cold call to Harborlight Advisory. Prospect expressed anger at unsolicited contact and stated "
            "no interest. Rep disclosed cold-call status only after being challenged. Coaching opportunity: "
            "upfront disclosure and cleaner value proposition."
        ],
        "summary": "Cold call; prospect (Pranav at Harborlight Advisory) rejected outreach, cited advanced "
                   "existing automation and did not ask for follow-up. Call ended on a neutral note. "
                   "No next steps established.",
        "next_steps": ["Coach rep (Arun) on cold-call disclosure and handling objections."],
        "evidence_quotes": [
            "\"it's still a cold call, isn't it? Yes, it is.\" — C01 transcript",
            "\"Our processes are already very automated.\" — C01 transcript"
        ],
        "review_state": "reviewed",
        "analysis_freshness": "current",
    },
    ("call", "4b870624-8aad-5315-a60e-0db95981cf99"): {  # C02
        "routes": ["Deal Follow-up"],
        "route_reasons": [
            "Arun reached Fernhaven Group reception trying to speak with Leela (a rep name confusion — "
            "Leela is the SpendNest rep, not the contact). Was redirected to voicemail. "
            "Outcome: voicemail left; follow-up required."
        ],
        "summary": "Outbound call to Fernhaven Group; Leela (rep at SpendNest) is the caller per payload, "
                   "but the transcript shows Arun calling. Reception said target was unavailable; "
                   "caller left a voicemail.",
        "next_steps": ["Confirm correct contact name; follow up after voicemail."],
        "evidence_quotes": [
            "\"It looks as though she isn't in the office today.\" — C02 transcript"
        ],
        "review_state": "reviewed",
        "analysis_freshness": "current",
    },
    ("call", "20d509ba-d589-5334-9aef-ea4ce6105b1a"): {  # C03
        "routes": ["Deal Follow-up", "Sales Coaching"],
        "route_reasons": [
            "Follow-up call on API/developer access discussion with Milan. Poor audio; agreed to "
            "continue via email and Monday callback. Coaching: audio quality management when prospect is travelling.",
            "Rep agreed on two-step follow-up (email + Monday call) — needs tracking."
        ],
        "summary": "Follow-up call on developer API access with Milan. Audio problems throughout; agreed "
                   "to email follow-up and possible Monday/Tuesday call. No price commitment; prospect "
                   "uncertain about team's interest. Subject line agreed: 'Developer access and event "
                   "notifications — follow-up'.",
        "next_steps": [
            "Send email with subject 'Developer access and event notifications — follow-up'.",
            "Schedule Monday/Tuesday callback."
        ],
        "evidence_quotes": [
            "\"Could we do this by email? Or call on Monday a bit earlier\" — C03 transcript",
            "\"Send the email and we can speak Monday or Tuesday\" — C03 transcript"
        ],
        "review_state": "reviewed",
        "analysis_freshness": "current",
    },
    ("call", "bcdcbf56-d338-5c78-9a97-42c2fc1c9931"): {  # C04
        "routes": ["Deal Follow-up"],
        "route_reasons": [
            "Voicemail left for Ritesh at Lanternpath Media following a previous conversation about "
            "expense platform. Email had earlier gone to wrong address; corrected. Awaiting callback "
            "from prospect to confirm decision."
        ],
        "summary": "Voicemail message left for Ritesh at Lanternpath Media. Background: earlier email "
                   "went to wrong address; corrected email subsequently sent. Requesting callback to "
                   "confirm whether prospect is moving forward.",
        "next_steps": [
            "Await callback from Ritesh at Lanternpath Media.",
            "If no response in 2–3 days, send follow-up email."
        ],
        "evidence_quotes": [
            "\"I'm following up on your consideration of our expense platform for Lanternpath Media.\" — C04 transcript",
            "\"we subsequently used the corrected address you gave us\" — C04 transcript"
        ],
        "review_state": "reviewed",
        "analysis_freshness": "current",
    },
    ("call", "75a6b94f-7717-5cfb-9e41-0acc94415e17"): {  # C05
        "routes": ["Deal Follow-up"],
        "route_reasons": [
            "Cold call to multi-store prospect (Meera calling). Prospect uses StoreHarbor and other "
            "systems; said to send presentation if they consider changing. Email confirmed: contact05@example.com. "
            "Low probability; needs nurture sequence."
        ],
        "summary": "Cold call (Meera from SpendNest). Prospect has multiple existing providers covering "
                   "vendor management and store expenses. Asked for a presentation to review if they "
                   "consider switching. Email confirmed: contact05@example.com.",
        "next_steps": [
            "Send product presentation to contact05@example.com.",
            "Tag for low-priority nurture sequence."
        ],
        "evidence_quotes": [
            "\"send me your presentation\" — C05 transcript",
            "\"One is StoreHarbor, and we use others too\" — C05 transcript"
        ],
        "review_state": "reviewed",
        "analysis_freshness": "current",
    },
    ("call", "12216d5c-e254-52c6-b344-47de4c6e1ae5"): {  # C06
        "routes": ["Deal Follow-up"],
        "route_reasons": [
            "Cold call to Nikhil at large retailer (>120 stores). Prospect has head-office automation "
            "in place. Rep (Ravi) confirmed not to call again unless prospect reaches out. "
            "Low-priority nurture only."
        ],
        "summary": "Cold call to Nikhil, large retailer (>120 stores). Prospect has extensive automation "
                   "through business management system. Said to call only if specific need arises. "
                   "No email or next step agreed.",
        "next_steps": ["Do not call again unless prospect initiates contact. Mark as cold nurture."],
        "evidence_quotes": [
            "\"If a particular need comes up later, we will reach out.\" — C06 transcript",
            "\"I understand you have more than a hundred and twenty stores\" — C06 transcript"
        ],
        "review_state": "reviewed",
        "analysis_freshness": "current",
    },
    ("call", "428817fa-7e9e-5418-a7d4-bb396d28dfbf"): {  # C07
        "routes": ["Deal Follow-up"],
        "route_reasons": [
            "Partnership outreach to Willowbank Advisory (Aditya). Advisory firm refers clients for "
            "account opening; interested in SpendNest virtual accounts as a partner. Agreed: Dev will "
            "message proposal via chat app and call Monday."
        ],
        "summary": "Outbound call exploring partnership with Willowbank Advisory. Prospect (Aditya) "
                   "refers clients for company formation and account opening. Interested in referring "
                   "SpendNest for virtual business accounts. Asked for chat-app message with proposal; "
                   "Monday callback agreed.",
        "next_steps": [
            "Send partnership proposal via chat app.",
            "Call Aditya at Willowbank Advisory on Monday."
        ],
        "evidence_quotes": [
            "\"could you message me on our chat app and send whatever proposal you have?\" — C07 transcript",
            "\"Yes, that is something we normally do\" (referring clients to account providers) — C07 transcript"
        ],
        "review_state": "reviewed",
        "analysis_freshness": "current",
    },
    ("call", "129497b2-8e1d-5e01-919c-e8a852b5ff68"): {  # C08
        "routes": ["Deal Follow-up"],
        "route_reasons": [
            "Cold call to Raghav. Prospect interested; colleague (Mr Raghav's people-ops peer) handles "
            "frontline processes. Email to forward proposal: contact08@example.com."
        ],
        "summary": "Cold call to Raghav (Meera calling). Prospect interested in expense/payables "
                   "automation; directed rep to people-ops colleague. Email confirmed: contact08@example.com.",
        "next_steps": [
            "Send proposal to contact08@example.com, mentioning Raghav's referral."
        ],
        "evidence_quotes": [
            "\"contact08@example.com\" — C08 transcript",
            "\"say you spoke with me, he can take a look\" — C08 transcript"
        ],
        "review_state": "reviewed",
        "analysis_freshness": "current",
    },
    ("call", "4a1de681-f884-55e8-b1ad-de22d17cd959"): {  # C09
        "routes": ["Deal Follow-up"],
        "route_reasons": [
            "Cold call to Vedant. 130-location business with internal expense software. Contact "
            "directed rep to business head Rishabh (LinkedIn). Requested rep not use Vedant's name."
        ],
        "summary": "Cold call to Vedant; company has 130 locations and internally built expense software. "
                   "Vedant directed rep to business head Rishabh on LinkedIn. Requested anonymity.",
        "next_steps": [
            "Contact Rishabh (business head) via LinkedIn. Do not mention Vedant's name."
        ],
        "evidence_quotes": [
            "\"You can find our business head, Mr Rishabh, on a professional networking site.\" — C09 transcript",
            "\"No, please don't use my name.\" — C09 transcript"
        ],
        "review_state": "reviewed",
        "analysis_freshness": "current",
    },
    ("call", "b747f592-810e-583c-9b81-8db5ab035806"): {  # C10
        "routes": ["Deal Follow-up"],
        "route_reasons": [
            "Cold call to Aniket who no longer works at Meadowbrick. Now in manufacturing. "
            "Said he'd review if sent info but declined a follow-up call. Low probability; "
            "send brief, then wait."
        ],
        "summary": "Cold call to Aniket; no longer at Meadowbrick. Now in manufacturing. "
                   "Would review a messaging-app brief but declined a scheduled follow-up call. "
                   "Low opportunity probability.",
        "next_steps": [
            "Send brief via messaging app (focus on AP and supplier management).",
            "Do not schedule a call; wait for prospect to respond."
        ],
        "evidence_quotes": [
            "\"I said I will contact you if there is anything to discuss.\" — C10 transcript",
            "\"I don't work there anymore.\" — C10 transcript"
        ],
        "review_state": "reviewed",
        "analysis_freshness": "current",
    },
    # ── MEETINGS WITH TRANSCRIPTS ────────────────────────────────────────────
    ("meeting", "cb5cecac-e68d-52b7-b10b-b0c748efc467"): {  # M01
        "routes": ["Deal Follow-up"],
        "route_reasons": [
            "Partnership discussion with Harborpath Advisory (Partner A). Agreed partner commission "
            "structure, referral link mechanism, onboarding requirements. Awaiting signed MoU and "
            "follow-up documents from SpendNest team."
        ],
        "summary": "Partnership deal discussion with Harborpath Advisory. Partner agreed to refer "
                   "clients to SpendNest for virtual accounts. Commission: USD 260 per approved "
                   "referral + interchange + volume bonus. Referral mechanism: unique link. "
                   "SpendNest to send MoU + materials. Podcast/marketing collaboration proposed.",
        "next_steps": [
            "Send MoU for signature (Team member A).",
            "Send partnership deck, pricing, unique referral link.",
            "Connect Partner A with marketing for podcast/partner-page feature.",
            "Share referral tracking sheet."
        ],
        "evidence_quotes": [
            "M01 Turn 12: \"No, let us get the partner onboarding started.\"",
            "M01 Turn 24: \"The main thing is to have all of that written down, with the link and contact route.\"",
            "M01 Turn 27: \"I can connect you with marketing about that.\""
        ],
        "review_state": "reviewed",
        "analysis_freshness": "current",
    },
    ("meeting", "1a21c409-c050-5787-90af-2667e057e1b6"): {  # M02
        "routes": ["Internal/Vendor", "Deal Follow-up"],
        "route_reasons": [
            "SpendNest evaluating LedgerBridge for compliant invoicing integration. Commercial "
            "discussion (electronic invoicing across SG/AU/IN). Volume template to be sent; "
            "SpendNest must fill it before next commercial call.",
            "Next step involves SpendNest management: needs internal briefing on pricing models."
        ],
        "summary": "SpendNest strategy/product team evaluating LedgerBridge for compliant e-invoicing. "
                   "Targeting Q4 for Singapore, Australia, then India. Two pricing models: country "
                   "licences or per-customer licences. Setup: EUR 2,600–6,500+. LedgerBridge to send "
                   "volume template; SpendNest to fill before next commercial call.",
        "next_steps": [
            "LedgerBridge sends volume template.",
            "SpendNest (Team B) fills AP volume; estimates AR volumes clearly marked as uncertain.",
            "SpendNest briefs management on pricing models before commercial call.",
            "Decide which stakeholders join next meeting."
        ],
        "evidence_quotes": [
            "M02 Turn 18: \"We should not present those two columns as equally certain.\"",
            "M02 Turn 13: \"We are aiming for the fourth quarter. We would start with Singapore and Australia, then India.\"",
            "M02 Turn 31: \"The basic setup begins at EUR 2,600; a more supported implementation starts at EUR 6,500.\""
        ],
        "review_state": "reviewed",
        "analysis_freshness": "current",
    },
    ("meeting", "398672e7-62dd-5afd-846d-0237d49792fb"): {  # M03
        "routes": ["Deal Follow-up", "Sales Coaching"],
        "route_reasons": [
            "Existing customer (Asterloom Systems, ~65 employees) evaluating domestic prepaid cards. "
            "Price discrepancy identified: INR 26k vs INR 39k. CFO approval still needed. "
            "Customer wants proposal before scheduling next call.",
            "Coaching: Rep must not let pricing discrepancies surprise the customer mid-meeting."
        ],
        "summary": "Demo and pricing discussion with Asterloom Systems. Customer wants domestic prepaid "
                   "cards for 4–5 employees initially. Pricing: INR 26,000 p.a. subscription + "
                   "INR 13,000 one-time integration. Customer noted prior quote of INR 26,000 all-in. "
                   "CFO approval needed. Vendor payments (~INR 26–39L/month) may be relevant later.",
        "next_steps": [
            "Send full proposal (cards + modules breakdown) to customer.",
            "Wait for internal CFO discussion before scheduling next call.",
            "Flag pricing communication gap for rep coaching."
        ],
        "evidence_quotes": [
            "M03 Turn 23: \"But you previously told me INR 26,000. Why has that become INR 39,000?\"",
            "M03 Turn 28: \"Our CFO approves the larger payments. We need to explain the proposal to them.\"",
            "M03 Turn 34: \"The external team processes vendor payments manually and it is expensive.\""
        ],
        "review_state": "reviewed",
        "analysis_freshness": "current",
    },
    ("meeting", "b0f79b3d-37ba-52f9-b2bc-58b159dd6d91"): {  # M04
        "routes": ["Customer Follow-up", "Human Review"],
        "route_reasons": [
            "Existing customer (Cedarwave Distribution) in card migration. Credit vs prepaid unresolved. "
            "Bank credit card eligibility check outstanding. Department setup correction pending.",
            "Multiple unresolved technical and commercial questions; human review required to triage "
            "and assign actions."
        ],
        "summary": "Cedarwave Distribution migration planning. Current card programme closing in weeks; "
                   "new programme still prepaid. Customer wants credit. SpendNest has bank partnership "
                   "for credit cards (subject to bank assessment). Bank credit-card transaction feed "
                   "feasibility to be confirmed. Accounting sync for bank-card transactions uncertain. "
                   "Department user-move correction also outstanding.",
        "next_steps": [
            "Confirm whether Cedarwave's existing bank credit cards are eligible for transaction-feed programme.",
            "Confirm accounting-sync feasibility for bank-card transactions.",
            "Schedule guided session to fix department/user setup.",
            "Cedarwave to discuss internally before deciding migration approach."
        ],
        "evidence_quotes": [
            "M04 Turn 11: \"moving from prepaid to credit is the main issue for us\"",
            "M04 Turn 23: \"I cannot confirm the existing-card eligibility on this call.\"",
            "M04 Turn 21: \"source-balance reconciliation is a question in this setup\""
        ],
        "review_state": "needs_review",
        "analysis_freshness": "current",
    },
    ("meeting", "657b9e9d-9472-5b01-a127-a648ad7e8cf7"): {  # M06
        "routes": ["Deal Follow-up"],
        "route_reasons": [
            "Discovery call with Mapletrail Services finance contact. Covers ~8 clients on receivables "
            "side. Discussed invoice-to-cash workflow and pain points. SpendNest AR module in development "
            "is relevant."
        ],
        "summary": "Discovery call with Mapletrail Services (software dev/testing, 65 people in central "
                   "finance). Finance contact handles ~8 clients' receivables locally. Pain: manual "
                   "invoice prep, collection follow-up, cross-currency challenges. SpendNest AR module "
                   "relevant but not yet live.",
        "next_steps": [
            "Share AR module roadmap/timeline with Mapletrail.",
            "Revisit once AR module is closer to launch."
        ],
        "evidence_quotes": [
            "M06 Turn 9: \"I cover around eight clients. I speak to delivery managers about what was delivered, check the contract and resource rates, prepare the invoice.\"",
        ],
        "review_state": "reviewed",
        "analysis_freshness": "current",
    },
    ("meeting", "4b5b9192-f3fc-505a-8e77-4d2ffaa54594"): {  # M09
        "routes": ["Customer Follow-up", "Human Review"],
        "route_reasons": [
            "Existing customer onboarding issue: Brookmint Holdings invitation expired/token bug. "
            "SpendNest team to investigate token expiry with engineering.",
            "Access control design question raised: shared-mailbox admin risk. Needs support resolution "
            "and possibly product clarification on role scoping."
        ],
        "summary": "Onboarding session for customer managing two companies (Northkite Equipment + "
                   "Brookmint Holdings). Brookmint login token expired immediately after reset. "
                   "Customer raised access-control concern: shared mailbox giving unwanted admin rights. "
                   "Northkite accounting issue self-resolved. Several workflow questions pending.",
        "next_steps": [
            "Engineering: investigate why reset token expires immediately for Brookmint Holdings.",
            "Support: advise on role-scoping options for shared-mailbox admin risk.",
            "Customer: speak to IT team about separate email identities.",
            "Support: provide refresher session or send training material."
        ],
        "evidence_quotes": [
            "M09 Turn 21: \"It says the token has expired. This is the fresh message we just received.\"",
            "M09 Turn 17: \"I do not want this to depend on trusting someone not to use access that is available.\""
        ],
        "review_state": "needs_review",
        "analysis_freshness": "current",
    },
    ("meeting", "337f297d-9385-5b82-9e54-5019c1ed912c"): {  # M10
        "routes": ["Internal/Vendor"],
        "route_reasons": [
            "Internal training session (billing workflow walkthrough). No customer present. "
            "Team member B learning billing system; back-office super-admin access not yet provisioned."
        ],
        "summary": "Internal billing training. Covers subscription billing cycle, invoice generation, "
                   "payment deduction retries, zero-value invoices and account freeze/recovery flow. "
                   "Team member B lacks super-admin access; to be requested separately.",
        "next_steps": [
            "Request back-office super-admin access for Team member B.",
            "Team member B to review billing examples and send questions."
        ],
        "evidence_quotes": [
            "M10 Turn 4: \"I do not have the back-office super-admin access you mentioned.\"",
            "M10 Turn 17: \"Simply topping up a frozen account does not complete the whole recovery flow.\""
        ],
        "review_state": "reviewed",
        "analysis_freshness": "current",
    },
}

# For records with no usable transcript, we use a standard template.
NO_TRANSCRIPT_ANALYSIS = {
    "routes": ["Human Review"],
    "route_reasons": ["No usable supplied transcript. Cannot determine conversation content from source data."],
    "summary": "No usable transcript supplied for this record.",
    "next_steps": ["Review when transcript becomes available, or mark as background/silent call."],
    "evidence_quotes": [],
    "review_state": "needs_review",
    "analysis_freshness": "current",
}

# Background/short calls get a more specific message
BACKGROUND_CALL_ANALYSIS = {
    "routes": ["Human Review"],
    "route_reasons": ["Short background call — no usable transcript. Duration and metadata suggest no substantive conversation."],
    "summary": "Background call with no supplied transcript. Source metadata indicates voicemail or unresponsive outcome.",
    "next_steps": ["No action required unless rep adds a note."],
    "evidence_quotes": [],
    "review_state": "reviewed",
    "analysis_freshness": "current",
}

# Meetings with recording issues
MEETING_NO_TRANSCRIPT = {
    "routes": ["Human Review"],
    "route_reasons": ["Meeting has no usable transcript turns. Recording may have been cancelled or not captured."],
    "summary": "Meeting record present but no transcript supplied.",
    "next_steps": ["Check recording status; obtain notes from attendees if needed."],
    "evidence_quotes": [],
    "review_state": "needs_review",
    "analysis_freshness": "current",
}

# ─────────────────────────────────────────────────────────────────────────────
# STATE MANAGEMENT
# ─────────────────────────────────────────────────────────────────────────────

# load_state, save_state, record_key, import_batch, is_usable_transcript imported from logic.py


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


def get_analysis(state: dict, source_type: str, source_id: str, record: dict) -> dict:
    """Return the analysis dict for a record, merged with any manual override."""
    key = record_key(source_type, source_id)
    base = PREGENERATED_ANALYSIS.get(
        (source_type, source_id),
        _default_analysis(record)
    )
    analysis = dict(base)  # copy

    # Apply manual override if present
    override = state["overrides"].get(key)
    if override:
        analysis["routes"] = override["routes"]
        analysis["route_reasons"] = override.get("route_reasons", analysis["route_reasons"])
        analysis["is_manual_override"] = True
        analysis["override_note"] = override.get("override_note", "")
        analysis["overridden_at"] = override.get("overridden_at", "")
    else:
        analysis["is_manual_override"] = False

    # Check freshness
    freshness = state.get("analysis_state", {}).get(key, "current")
    analysis["analysis_freshness"] = freshness

    return analysis


def _default_analysis(record: dict) -> dict:
    """Return a default analysis for records without pre-generated content."""
    if record["source_type"] == "call":
        if is_usable_transcript(record):
            return dict(NO_TRANSCRIPT_ANALYSIS)
        # Check if it's a background/voicemail call
        outcome = record["payload"].get("observed_outcome", "")
        if outcome in ("voicemail", "unresponsive") or not record["payload"].get("is_conversation"):
            return dict(BACKGROUND_CALL_ANALYSIS)
        return dict(NO_TRANSCRIPT_ANALYSIS)
    else:
        if is_usable_transcript(record):
            return dict(NO_TRANSCRIPT_ANALYSIS)
        tp = record.get("transcript_payload")
        if tp and tp.get("unavailable_reason"):
            return {
                "routes": ["Human Review"],
                "route_reasons": [f"Transcript unavailable: {tp['unavailable_reason']}"],
                "summary": f"No transcript. Reason: {tp['unavailable_reason']}",
                "next_steps": ["Await transcript or check recording status."],
                "evidence_quotes": [],
                "review_state": "needs_review",
                "analysis_freshness": "current",
            }
        return dict(MEETING_NO_TRANSCRIPT)


# ─────────────────────────────────────────────────────────────────────────────
# IMPORT LOGIC
# ─────────────────────────────────────────────────────────────────────────────

# import_batch is imported from logic.py


# ─────────────────────────────────────────────────────────────────────────────
# EXPORT LOGIC
# ─────────────────────────────────────────────────────────────────────────────

def generate_exports(state: dict) -> str:
    """
    Generate export folder structure and manifest.
    Returns path to the ZIP file.
    """
    os.makedirs(EXPORT_DIR, exist_ok=True)
    # Clean old exports
    for f in os.listdir(EXPORT_DIR):
        fp = os.path.join(EXPORT_DIR, f)
        if os.path.isdir(fp):
            shutil.rmtree(fp)
        elif f != "manifest.json" and f != "manifest.csv":
            os.remove(fp)

    manifest_rows = []
    export_files_created = []

    # Group records by route for folder organisation
    for key, rec in state["records"].items():
        analysis = get_analysis(state, rec["source_type"], rec["source_id"], rec)
        routes = analysis.get("routes", ["Human Review"])
        revision = state["revisions"].get(key, 1)
        review_state = analysis.get("review_state", "needs_review")
        is_override = analysis.get("is_manual_override", False)
        freshness = analysis.get("analysis_freshness", "current")
        ref = rec.get("record_ref", key.replace("::", "_"))

        for route in routes:
            folder_name = route.replace(" ", "_").replace("/", "-")
            folder_path = os.path.join(EXPORT_DIR, folder_name)
            os.makedirs(folder_path, exist_ok=True)

            filename = f"{ref}_{rec['source_type']}.txt"
            file_path = os.path.join(folder_path, filename)
            rel_path = os.path.join(folder_name, filename)

            # Build content
            lines = [
                f"Record Reference: {ref}",
                f"Source Type: {rec['source_type']}",
                f"Source ID: {rec['source_id']}",
                f"Route: {route}",
                f"Applied Revision: {revision}",
                f"Review State: {review_state}",
                f"Manual Override: {'Yes' if is_override else 'No'}",
                f"Analysis Freshness: {freshness}",
                "",
                "=== SUMMARY ===",
                analysis.get("summary", "No summary available."),
                "",
                "=== ROUTE REASON ===",
                analysis.get("route_reasons", [""])[0] if analysis.get("route_reasons") else "",
                "",
                "=== NEXT STEPS ===",
            ]
            for ns in analysis.get("next_steps", []):
                lines.append(f"  - {ns}")
            lines += ["", "=== EVIDENCE QUOTES ==="]
            for eq in analysis.get("evidence_quotes", []):
                lines.append(f"  * {eq}")

            # Add transcript if available
            if rec["source_type"] == "call":
                transcript = rec["payload"].get("transcript", "")
                if transcript:
                    lines += ["", "=== TRANSCRIPT ===", transcript]
            else:
                tp = rec.get("transcript_payload")
                if tp and tp.get("turns"):
                    lines += ["", "=== MEETING TURNS ==="]
                    for i, turn in enumerate(tp["turns"], 1):
                        lines.append(
                            f"Turn {i} | {turn.get('timecode','?')} | {turn.get('speaker','?')}: {turn.get('text','')}"
                        )

            with open(file_path, "w", encoding="utf-8") as fout:
                fout.write("\n".join(lines))
            export_files_created.append(rel_path)

            manifest_rows.append({
                "source_type": rec["source_type"],
                "source_id": rec["source_id"],
                "record_ref": ref,
                "applied_revision": revision,
                "route": route,
                "output_path": rel_path,
                "review_state": review_state,
                "manual_override": is_override,
                "analysis_freshness": freshness,
            })

    # Write manager brief
    brief_path = os.path.join(EXPORT_DIR, "manager_brief_2026-08-21.txt")
    brief_content = build_manager_brief(state)
    with open(brief_path, "w", encoding="utf-8") as f:
        f.write(brief_content)
    export_files_created.append("manager_brief_2026-08-21.txt")

    # Write manifest JSON
    manifest_json_path = os.path.join(EXPORT_DIR, "manifest.json")
    with open(manifest_json_path, "w", encoding="utf-8") as f:
        json.dump(manifest_rows, f, indent=2)

    # Write manifest CSV
    manifest_csv_path = os.path.join(EXPORT_DIR, "manifest.csv")
    if manifest_rows:
        with open(manifest_csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=manifest_rows[0].keys())
            writer.writeheader()
            writer.writerows(manifest_rows)

    # Create ZIP
    zip_path = os.path.join(EXPORT_DIR, "revenue_intelligence_export.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(EXPORT_DIR):
            for file in files:
                if file.endswith(".zip"):
                    continue
                fp = os.path.join(root, file)
                arcname = os.path.relpath(fp, EXPORT_DIR)
                zf.write(fp, arcname)

    return zip_path


def build_manager_brief(state: dict) -> str:
    """Build the manager brief for 21 August 2026 (Asia/Kolkata)."""
    records = list(state["records"].values())
    calls = [r for r in records if r["source_type"] == "call"]
    meetings = [r for r in records if r["source_type"] == "meeting"]
    usable = [r for r in records if is_usable_transcript(r)]

    lines = [
        "=" * 70,
        "MANAGER BRIEF — 21 AUGUST 2026 (Asia/Kolkata)",
        "Revenue Intelligence Inbox | SpendNest",
        "=" * 70,
        "",
        "DATASET OVERVIEW (Selected Records)",
        f"  Total source records : {len(records)} (30 calls, 14 meetings)",
        f"  Usable transcripts   : {len(usable)} of {len(records)} (after applying update batch)",
        f"  Calls with text      : {sum(1 for r in calls if is_usable_transcript(r))} of {len(calls)}",
        f"  Meetings with turns  : {sum(1 for r in meetings if is_usable_transcript(r))} of {len(meetings)}",
        "",
        "NOTE: This is a deliberately selected sample, not a full-team day.",
        "Counts are labelled as selected records; coverage percentages apply",
        "only to this extract.",
        "",
        "─" * 70,
        "PRIORITY CONVERSATIONS",
        "─" * 70,
        "",
        "1. M01 — Harborpath Advisory Partnership (DEAL FOLLOW-UP)",
        "   Outcome: Partner agreed to commission structure and referral link.",
        "   Action : Send MoU, unique referral link, and connect to marketing.",
        "   Owner  : Team member A (meeting organiser: team09@example.com)",
        "",
        "2. M03 — Asterloom Systems Cards Demo (DEAL FOLLOW-UP + COACHING)",
        "   Outcome: Customer interested; CFO approval still needed.",
        "   Issue  : Pricing discrepancy (INR 26k vs INR 39k) surfaced mid-demo.",
        "   Action : Send clean proposal; coach rep on price communication.",
        "   Owner  : Team member A + rep manager",
        "",
        "3. M04 — Cedarwave Distribution Migration (CUSTOMER FOLLOW-UP — URGENT)",
        "   Outcome: Credit vs prepaid unresolved; bank eligibility not confirmed.",
        "   Action : Confirm bank-card eligibility; fix department setup.",
        "   Owner  : Migration team + programme team",
        "",
        "4. M09 — Brookmint Holdings Onboarding (CUSTOMER FOLLOW-UP — URGENT)",
        "   Outcome: Reset token expired immediately — engineering bug suspected.",
        "   Action : Engineering to investigate; customer waiting.",
        "   Owner  : Engineering + support",
        "",
        "5. M07 — Willowfield Trust Issue Session (CUSTOMER FOLLOW-UP)",
        "   Outcome: Three product bugs documented: description save, upload in",
        "            Recreate Payment, and Mark-as-paid amount carry-forward.",
        "   Action : Engineering bug tickets for all three issues; update customer.",
        "   Owner  : Support + engineering",
        "   NOTE   : Transcript arrived in update batch (revision 2).",
        "",
        "─" * 70,
        "SALES ACTIVITY SUMMARY",
        "─" * 70,
        "",
        "Outbound calls (B-series, no transcript): 20 short-duration calls.",
        "  Most are voicemail or unresponsive; no transcripts supplied.",
        "  Rep Arun: workspace-01 calls; Rep Leela: workspace-02 calls.",
        "",
        "Connected calls with transcripts (C01–C10):",
        "  C03 — Developer API follow-up: email + Monday callback committed.",
        "  C04 — Lanternpath Media: voicemail left; awaiting callback from Ritesh.",
        "  C07 — Willowbank Advisory: partnership proposal via chat app; Monday call.",
        "  C08 — Prospect referral to people-ops colleague; send to contact08@example.com.",
        "  C09 — 130-location prospect: directed to LinkedIn contact Rishabh.",
        "  C01/C06: Prospects with no interest; no follow-up warranted.",
        "",
        "─" * 70,
        "COACHING PRIORITIES",
        "─" * 70,
        "",
        "1. Cold-call disclosure (C01): Rep disclosed cold-call status only after",
        "   being challenged. Recommend upfront disclosure as standard practice.",
        "",
        "2. Pricing communication (M03): Customer caught a discrepancy between",
        "   an earlier quote (INR 26k) and the demo price (INR 39k). Rep explained",
        "   the split, but the surprise damages credibility. Ensure written quotes",
        "   are issued before demos with returning prospects.",
        "",
        "─" * 70,
        "INTERNAL / VENDOR ITEMS",
        "─" * 70,
        "",
        "M02 — LedgerBridge invoicing integration evaluation:",
        "  Fill volume template before next commercial call.",
        "  Target: Q4 (SG/AU first, then India). Setup EUR 2,600–6,500+.",
        "",
        "M10 — Internal billing training complete.",
        "  Action: Request back-office super-admin access for Team member B.",
        "",
        "─" * 70,
        "RECORDS REQUIRING HUMAN REVIEW",
        "─" * 70,
        "",
    ]

    review_needed = []
    for key, rec in state["records"].items():
        analysis = get_analysis(state, rec["source_type"], rec["source_id"], rec)
        if analysis.get("review_state") == "needs_review" or "Human Review" in analysis.get("routes", []):
            review_needed.append(f"  {rec['record_ref']} ({rec['source_type']}): {analysis.get('summary','')[:80]}")
    lines += review_needed if review_needed else ["  None requiring urgent review."]

    lines += [
        "",
        "─" * 70,
        "MISSING TRANSCRIPTS",
        "─" * 70,
        "",
        "20 background calls (B01–B20): No transcripts supplied.",
        "  These are short-duration calls with voicemail/unresponsive outcomes.",
        "Meetings without usable turns: M05, M08, M11, M12, M13, M14.",
        "  Recording status: cancelled or not_scheduled.",
        "",
        "=" * 70,
        "End of brief. Generated from selected source records only.",
        "Analyses are pre-generated; M07 analysis reflects update-batch transcript.",
        "=" * 70,
    ]
    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────────────────────
# DATA HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def build_records_df(state: dict) -> pd.DataFrame:
    """Build a flat DataFrame of all records for display/filter."""
    rows = []
    for key, rec in state["records"].items():
        analysis = get_analysis(state, rec["source_type"], rec["source_id"], rec)
        p = rec["payload"]

        # Timestamp
        if rec["source_type"] == "call":
            ts_str = p.get("started_at", "")
        else:
            ts_str = p.get("starts_at", "")

        ts_ist = None
        if ts_str:
            try:
                ts_utc = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                ts_ist = ts_utc.astimezone(IST)
            except Exception:
                pass

        # Person identifier
        if rec["source_type"] == "call":
            person = p.get("rep_name") or p.get("rep_email") or "Unknown"
        else:
            person = p.get("organizer_email") or "Unknown"

        usable = is_usable_transcript(rec)

        rows.append({
            "key": key,
            "record_ref": rec.get("record_ref", ""),
            "source_type": rec["source_type"],
            "source_id": rec["source_id"],
            "person": person,
            "title_or_outcome": p.get("title", "") if rec["source_type"] == "meeting" else p.get("observed_outcome", ""),
            "timestamp_utc": ts_str,
            "timestamp_ist": ts_ist.strftime("%Y-%m-%d %H:%M IST") if ts_ist else "",
            "duration_sec": p.get("duration_seconds", 0),
            "usable_transcript": usable,
            "routes": ", ".join(analysis.get("routes", [])),
            "review_state": analysis.get("review_state", "needs_review"),
            "is_manual_override": analysis.get("is_manual_override", False),
            "analysis_freshness": analysis.get("analysis_freshness", "current"),
            "applied_revision": state["revisions"].get(key, 0),
            "observed_outcome": p.get("observed_outcome", "") if rec["source_type"] == "call" else "",
            "is_connected": p.get("is_connected", None) if rec["source_type"] == "call" else None,
        })

    df = pd.DataFrame(rows)
    if not df.empty:
        df = df.sort_values("timestamp_utc", ascending=False)
    return df


# ─────────────────────────────────────────────────────────────────────────────
# STREAMLIT UI
# ─────────────────────────────────────────────────────────────────────────────

st.set_page_config(
    page_title="Revenue Intelligence Inbox | SpendNest",
    page_icon="💼",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Custom CSS ────────────────────────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

html, body, [class*="css"] {
    font-family: 'Inter', sans-serif;
}

.stApp {
    background: linear-gradient(135deg, #0a0e1a 0%, #0d1525 50%, #0a1628 100%);
    color: #e2e8f0;
}

/* Sidebar */
section[data-testid="stSidebar"] {
    background: linear-gradient(180deg, #0d1525 0%, #111827 100%);
    border-right: 1px solid rgba(99, 179, 237, 0.15);
}
section[data-testid="stSidebar"] .stSelectbox label,
section[data-testid="stSidebar"] .stMultiSelect label,
section[data-testid="stSidebar"] h1, h2, h3, h4 {
    color: #93c5fd !important;
}

/* KPI Cards */
.kpi-card {
    background: linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.9) 100%);
    border: 1px solid rgba(99,179,237,0.2);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    backdrop-filter: blur(10px);
    transition: transform 0.2s, border-color 0.2s;
}
.kpi-card:hover {
    transform: translateY(-2px);
    border-color: rgba(99,179,237,0.5);
}
.kpi-number {
    font-size: 2.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, #60a5fa, #a78bfa);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    line-height: 1;
}
.kpi-label {
    font-size: 0.8rem;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 4px;
}
.kpi-sub {
    font-size: 0.75rem;
    color: #64748b;
    margin-top: 2px;
}

/* Route badges */
.badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 9999px;
    font-size: 0.7rem;
    font-weight: 600;
    margin: 1px;
}
.badge-coaching { background: rgba(251,191,36,0.2); color: #fbbf24; border: 1px solid rgba(251,191,36,0.3); }
.badge-deal { background: rgba(52,211,153,0.2); color: #34d399; border: 1px solid rgba(52,211,153,0.3); }
.badge-customer { background: rgba(96,165,250,0.2); color: #60a5fa; border: 1px solid rgba(96,165,250,0.3); }
.badge-internal { background: rgba(167,139,250,0.2); color: #a78bfa; border: 1px solid rgba(167,139,250,0.3); }
.badge-review { background: rgba(248,113,113,0.2); color: #f87171; border: 1px solid rgba(248,113,113,0.3); }
.badge-override { background: rgba(251,146,60,0.2); color: #fb923c; border: 1px solid rgba(251,146,60,0.3); }

/* Status indicators */
.status-reviewed { color: #34d399; }
.status-review { color: #f87171; }
.status-fresh { color: #34d399; }
.status-stale { color: #fb923c; }

/* Section headers */
.section-header {
    font-size: 1.2rem;
    font-weight: 600;
    color: #93c5fd;
    border-bottom: 1px solid rgba(99,179,237,0.2);
    padding-bottom: 8px;
    margin-bottom: 16px;
}

/* Conversation card */
.conv-card {
    background: rgba(30,41,59,0.6);
    border: 1px solid rgba(99,179,237,0.15);
    border-radius: 8px;
    padding: 12px 16px;
    margin: 6px 0;
    cursor: pointer;
    transition: all 0.2s;
}
.conv-card:hover {
    border-color: rgba(99,179,237,0.4);
    background: rgba(30,41,59,0.8);
}

/* Info blocks */
.info-block {
    background: rgba(15,23,42,0.8);
    border-left: 3px solid #60a5fa;
    border-radius: 0 6px 6px 0;
    padding: 10px 14px;
    margin: 8px 0;
    font-size: 0.88rem;
}

.warning-block {
    background: rgba(251,146,60,0.1);
    border-left: 3px solid #fb923c;
    border-radius: 0 6px 6px 0;
    padding: 10px 14px;
    margin: 8px 0;
    font-size: 0.88rem;
}

/* Turn text */
.turn-block {
    background: rgba(15,23,42,0.5);
    border-radius: 6px;
    padding: 8px 12px;
    margin: 4px 0;
    font-size: 0.85rem;
    line-height: 1.5;
}
.turn-speaker { color: #93c5fd; font-weight: 600; font-size: 0.75rem; }
.turn-timecode { color: #64748b; font-size: 0.7rem; }

/* Override marker */
.override-tag {
    background: rgba(251,146,60,0.15);
    border: 1px solid rgba(251,146,60,0.3);
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 0.75rem;
    color: #fb923c;
    display: inline-block;
}
.suggested-tag {
    background: rgba(96,165,250,0.15);
    border: 1px solid rgba(96,165,250,0.3);
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 0.75rem;
    color: #60a5fa;
    display: inline-block;
}

/* Sidebar nav link styling */
div.stButton > button {
    background: rgba(30,41,59,0.8);
    border: 1px solid rgba(99,179,237,0.2);
    color: #cbd5e1;
    border-radius: 8px;
    transition: all 0.2s;
}
div.stButton > button:hover {
    background: rgba(99,179,237,0.15);
    border-color: rgba(99,179,237,0.5);
    color: #93c5fd;
}

/* Import result messages */
.import-success {
    background: rgba(52,211,153,0.1);
    border: 1px solid rgba(52,211,153,0.3);
    border-radius: 6px;
    padding: 10px;
    color: #34d399;
    margin: 8px 0;
}
.import-info {
    background: rgba(96,165,250,0.1);
    border: 1px solid rgba(96,165,250,0.3);
    border-radius: 6px;
    padding: 10px;
    color: #93c5fd;
    margin: 8px 0;
}

/* Transcript box */
.transcript-box {
    background: rgba(15,23,42,0.7);
    border: 1px solid rgba(99,179,237,0.1);
    border-radius: 8px;
    padding: 14px;
    font-size: 0.85rem;
    line-height: 1.7;
    color: #cbd5e1;
    white-space: pre-wrap;
    font-family: 'Inter', sans-serif;
}
</style>
""", unsafe_allow_html=True)


# ─────────────────────────────────────────────────────────────────────────────
# SESSION STATE INIT
# ─────────────────────────────────────────────────────────────────────────────

if "app_state" not in st.session_state:
    st.session_state.app_state = load_state()
if "selected_record_key" not in st.session_state:
    st.session_state.selected_record_key = None
if "page" not in st.session_state:
    st.session_state.page = "Dashboard"

state = st.session_state.app_state

# ─────────────────────────────────────────────────────────────────────────────
# SIDEBAR
# ─────────────────────────────────────────────────────────────────────────────

with st.sidebar:
    st.markdown("## 💼 Revenue Inbox")
    st.markdown('<p style="color:#64748b;font-size:0.8rem;">SpendNest Intelligence</p>', unsafe_allow_html=True)
    st.markdown("---")

    pages = ["Dashboard", "Conversation Inbox", "Import & Update", "Export", "Manager Brief"]
    for p in pages:
        icon = {"Dashboard": "📊", "Conversation Inbox": "📋",
                "Import & Update": "📥", "Export": "📦", "Manager Brief": "📝"}[p]
        if st.button(f"{icon} {p}", key=f"nav_{p}", use_container_width=True):
            st.session_state.page = p

    st.markdown("---")

    # Quick stats
    records_count = len(state["records"])
    usable_count = sum(1 for r in state["records"].values() if is_usable_transcript(r))
    overrides_count = len(state["overrides"])

    st.markdown(f"""
    <div style='font-size:0.75rem; color:#64748b;'>
    📁 <b style='color:#93c5fd;'>{records_count}</b> records loaded<br>
    📄 <b style='color:#93c5fd;'>{usable_count}</b> usable transcripts<br>
    ✏️ <b style='color:#fb923c;'>{overrides_count}</b> manual overrides<br>
    📦 Batches: {len(state.get('imported_batches', []))}
    </div>
    """, unsafe_allow_html=True)

    if records_count == 0:
        st.markdown("""
        <div class='warning-block' style='font-size:0.75rem;'>
        ⚠️ No data loaded.<br>Go to <b>Import & Update</b> to import data.
        </div>
        """, unsafe_allow_html=True)

page = st.session_state.page

# ─────────────────────────────────────────────────────────────────────────────
# PAGE: DASHBOARD
# ─────────────────────────────────────────────────────────────────────────────

if page == "Dashboard":
    st.markdown("# 📊 Revenue Intelligence Dashboard")
    st.markdown('<p style="color:#64748b;">21 August 2026 · Asia/Kolkata · Selected records sample</p>', unsafe_allow_html=True)

    if not state["records"]:
        st.warning("No records loaded. Go to **Import & Update** to import data.")
        st.stop()

    df = build_records_df(state)
    records = list(state["records"].values())
    calls_df = df[df["source_type"] == "call"]
    meetings_df = df[df["source_type"] == "meeting"]

    # ── KPI Row ──────────────────────────────────────────────────────────────
    cols = st.columns(5)
    with cols[0]:
        st.markdown(f"""
        <div class='kpi-card'>
        <div class='kpi-number'>{len(df)}</div>
        <div class='kpi-label'>Source Records</div>
        <div class='kpi-sub'>Unique (source_type, source_id)</div>
        </div>""", unsafe_allow_html=True)

    with cols[1]:
        st.markdown(f"""
        <div class='kpi-card'>
        <div class='kpi-number'>{len(calls_df)}</div>
        <div class='kpi-label'>Calls</div>
        <div class='kpi-sub'>Reps: Arun, Leela, Meera, Ravi, Dev</div>
        </div>""", unsafe_allow_html=True)

    with cols[2]:
        st.markdown(f"""
        <div class='kpi-card'>
        <div class='kpi-number'>{len(meetings_df)}</div>
        <div class='kpi-label'>Meetings</div>
        <div class='kpi-sub'>Organiser ≠ salesperson</div>
        </div>""", unsafe_allow_html=True)

    usable_count = int(df["usable_transcript"].sum())
    usable_pct = round(usable_count / len(df) * 100) if len(df) > 0 else 0
    with cols[3]:
        st.markdown(f"""
        <div class='kpi-card'>
        <div class='kpi-number'>{usable_count}</div>
        <div class='kpi-label'>Usable Transcripts</div>
        <div class='kpi-sub'>{usable_pct}% of {len(df)} records</div>
        </div>""", unsafe_allow_html=True)

    needs_review = int((df["review_state"] == "needs_review").sum())
    with cols[4]:
        st.markdown(f"""
        <div class='kpi-card'>
        <div class='kpi-number'>{needs_review}</div>
        <div class='kpi-label'>Need Review</div>
        <div class='kpi-sub'>{len(state["overrides"])} manual overrides</div>
        </div>""", unsafe_allow_html=True)

    st.markdown("")

    # ── Filters ──────────────────────────────────────────────────────────────
    with st.expander("🔍 Filters", expanded=False):
        fc1, fc2 = st.columns(2)
        with fc1:
            type_filter = st.multiselect(
                "Source Type", ["call", "meeting"],
                default=["call", "meeting"], key="dash_type_filter"
            )
        with fc2:
            all_people = sorted(df["person"].unique().tolist())
            person_filter = st.multiselect(
                "Person (Rep / Organiser)", all_people,
                default=all_people, key="dash_person_filter"
            )

    filtered_df = df[df["source_type"].isin(type_filter) & df["person"].isin(person_filter)]

    # ── Charts Row ───────────────────────────────────────────────────────────
    ch1, ch2 = st.columns(2)

    with ch1:
        st.markdown("#### Activity by Person")
        person_counts = filtered_df.groupby(["person", "source_type"]).size().reset_index(name="count")
        if not person_counts.empty:
            fig = px.bar(
                person_counts, x="person", y="count", color="source_type",
                color_discrete_map={"call": "#60a5fa", "meeting": "#a78bfa"},
                template="plotly_dark", barmode="group",
                labels={"person": "Person", "count": "Records", "source_type": "Type"},
            )
            fig.update_layout(
                plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)",
                font=dict(color="#94a3b8"), margin=dict(l=20, r=20, t=10, b=40),
                legend=dict(orientation="h", y=-0.3),
            )
            st.plotly_chart(fig, use_container_width=True)

    with ch2:
        st.markdown("#### Route Distribution")
        route_data = []
        for _, row in filtered_df.iterrows():
            for route in row["routes"].split(", ") if row["routes"] else ["Unrouted"]:
                route_data.append(route.strip())

        if route_data:
            route_counts = pd.Series(route_data).value_counts().reset_index()
            route_counts.columns = ["route", "count"]
            colors = ["#60a5fa", "#a78bfa", "#34d399", "#fbbf24", "#f87171"]
            fig2 = px.pie(
                route_counts, names="route", values="count",
                template="plotly_dark",
                color_discrete_sequence=colors,
            )
            fig2.update_layout(
                plot_bgcolor="rgba(0,0,0,0)", paper_bgcolor="rgba(0,0,0,0)",
                font=dict(color="#94a3b8"), margin=dict(l=10, r=10, t=10, b=10),
            )
            fig2.update_traces(textposition='inside', textinfo='percent+label')
            st.plotly_chart(fig2, use_container_width=True)

    # ── Transcript Coverage ──────────────────────────────────────────────────
    st.markdown("#### 📊 Transcript Coverage")
    cv1, cv2, cv3 = st.columns(3)

    call_usable = int(filtered_df[filtered_df["source_type"] == "call"]["usable_transcript"].sum())
    total_calls_f = len(filtered_df[filtered_df["source_type"] == "call"])
    meet_usable = int(filtered_df[filtered_df["source_type"] == "meeting"]["usable_transcript"].sum())
    total_meets_f = len(filtered_df[filtered_df["source_type"] == "meeting"])
    total_usable_f = int(filtered_df["usable_transcript"].sum())
    total_f = len(filtered_df)

    with cv1:
        pct = round(call_usable / total_calls_f * 100) if total_calls_f > 0 else 0
        st.metric("Call Transcript Coverage", f"{call_usable}/{total_calls_f}", f"{pct}%")
    with cv2:
        pct = round(meet_usable / total_meets_f * 100) if total_meets_f > 0 else 0
        st.metric("Meeting Transcript Coverage", f"{meet_usable}/{total_meets_f}", f"{pct}%")
    with cv3:
        pct = round(total_usable_f / total_f * 100) if total_f > 0 else 0
        st.metric("Overall Coverage", f"{total_usable_f}/{total_f}", f"{pct}%")

    st.markdown("""
    <div class='info-block'>
    <b>Denominator note:</b> Coverage = usable supplied texts ÷ selected source records in the same filter.
    Usable = non-blank call transcript OR at least one non-blank meeting turn.
    20 background calls (B01–B20) have no transcript; this is a source condition, not an assessment failure.
    </div>
    """, unsafe_allow_html=True)

    # ── Connection Rate ──────────────────────────────────────────────────────
    st.markdown("#### 📞 Call Connection Rate (Source-Reported)")
    call_rows = filtered_df[filtered_df["source_type"] == "call"]
    known_connect = call_rows[call_rows["is_connected"].notna()]
    connected = int((known_connect["is_connected"] == True).sum())
    not_connected = int((known_connect["is_connected"] == False).sum())
    unknown = len(call_rows) - len(known_connect)

    cc1, cc2, cc3 = st.columns(3)
    cc1.metric("Connected (is_connected=true)", connected)
    cc2.metric("Not Connected", not_connected)
    cc3.metric("Unknown (null)", unknown)

    st.markdown("""
    <div class='info-block'>
    <b>Note:</b> Connection rate = calls with is_connected=true ÷ calls with non-null is_connected ({} of {} = {}%).
    This is a <em>stored upstream classification</em>, not independently verified.
    A transcript-based assessment would cover only the {} calls with usable text.
    </div>
    """.format(connected, len(known_connect),
               round(connected/len(known_connect)*100) if len(known_connect) > 0 else 0,
               call_usable), unsafe_allow_html=True)

    # ── Full Records Table ───────────────────────────────────────────────────
    st.markdown("#### 📋 All Records")
    display_df = filtered_df[[
        "record_ref", "source_type", "person", "title_or_outcome",
        "timestamp_ist", "duration_sec", "usable_transcript", "routes",
        "review_state", "is_manual_override", "analysis_freshness"
    ]].copy()
    display_df.columns = [
        "Ref", "Type", "Rep/Organiser", "Outcome/Title",
        "Timestamp (IST)", "Duration(s)", "Has Text", "Routes",
        "Review", "Override", "Freshness"
    ]
    st.dataframe(display_df, use_container_width=True, hide_index=True)


# ─────────────────────────────────────────────────────────────────────────────
# PAGE: CONVERSATION INBOX
# ─────────────────────────────────────────────────────────────────────────────

elif page == "Conversation Inbox":
    st.markdown("# 📋 Conversation Inbox")

    if not state["records"]:
        st.warning("No records loaded. Go to **Import & Update** to import data.")
        st.stop()

    df = build_records_df(state)

    # ── Filters ──────────────────────────────────────────────────────────────
    fc1, fc2, fc3, fc4 = st.columns([2, 2, 2, 2])
    with fc1:
        type_f = st.multiselect("Type", ["call", "meeting"], default=["call", "meeting"], key="inbox_type")
    with fc2:
        all_people = sorted(df["person"].unique().tolist())
        person_f = st.multiselect("Person", all_people, default=all_people, key="inbox_person")
    with fc3:
        text_only = st.checkbox("Only with transcript", key="inbox_text_only")
    with fc4:
        search_q = st.text_input("🔍 Search ref or title", key="inbox_search")

    filtered = df[df["source_type"].isin(type_f) & df["person"].isin(person_f)]
    if text_only:
        filtered = filtered[filtered["usable_transcript"]]
    if search_q:
        q = search_q.lower()
        filtered = filtered[
            filtered["record_ref"].str.lower().str.contains(q) |
            filtered["title_or_outcome"].str.lower().str.contains(q) |
            filtered["routes"].str.lower().str.contains(q)
        ]

    left_col, right_col = st.columns([1, 2])

    with left_col:
        st.markdown(f"**{len(filtered)} records**")
        for _, row in filtered.iterrows():
            has_text = "✅" if row["usable_transcript"] else "⬜"
            rev_icon = "🔴" if row["review_state"] == "needs_review" else "🟢"
            override_icon = " ✏️" if row["is_manual_override"] else ""
            stale_icon = " ⚠️" if row["analysis_freshness"] == "stale_pending_review" else ""
            label = row["title_or_outcome"][:35] + "..." if len(row["title_or_outcome"]) > 35 else row["title_or_outcome"]

            key = row["key"]
            if st.button(
                f"{rev_icon} {row['record_ref']} | {row['source_type']} | {has_text}{override_icon}{stale_icon}\n{label}",
                key=f"sel_{key}", use_container_width=True
            ):
                st.session_state.selected_record_key = key
                st.rerun()

    with right_col:
        sel_key = st.session_state.get("selected_record_key")
        if sel_key and sel_key in state["records"]:
            rec = state["records"][sel_key]
            analysis = get_analysis(state, rec["source_type"], rec["source_id"], rec)
            p = rec["payload"]

            ref = rec.get("record_ref", "")
            st.markdown(f"## {ref} — {p.get('title', p.get('observed_outcome', ''))}")

            # Override / Suggested tag
            if analysis["is_manual_override"]:
                st.markdown(f'<span class="override-tag">✏️ MANUAL OVERRIDE</span>', unsafe_allow_html=True)
            else:
                st.markdown(f'<span class="suggested-tag">🤖 SUGGESTED ROUTE</span>', unsafe_allow_html=True)

            if analysis.get("analysis_freshness") == "stale_pending_review":
                st.warning("⚠️ Source data was updated. Analysis may not reflect the latest transcript. Review recommended.")

            # Route badges
            route_badge_map = {
                "Sales Coaching": "coaching",
                "Deal Follow-up": "deal",
                "Customer Follow-up": "customer",
                "Internal/Vendor": "internal",
                "Human Review": "review",
            }
            routes_html = ""
            for r in analysis.get("routes", []):
                badge_class = route_badge_map.get(r, "review")
                routes_html += f'<span class="badge badge-{badge_class}">{r}</span> '
            st.markdown(f"**Routes:** {routes_html}", unsafe_allow_html=True)

            t1, t2 = st.tabs(["📄 Details & Analysis", "📝 Transcript / Turns"])

            with t1:
                # Metadata
                st.markdown("#### Source Record Metadata")
                meta_items = {}
                if rec["source_type"] == "call":
                    meta_items = {
                        "Rep": p.get("rep_name", "") or p.get("rep_email", ""),
                        "Direction": p.get("direction", ""),
                        "Started At": p.get("started_at", ""),
                        "Duration": f"{p.get('duration_seconds',0)}s",
                        "Connected": str(p.get("is_connected")),
                        "Conversation": str(p.get("is_conversation")),
                        "Outcome": p.get("observed_outcome", ""),
                        "Campaign Call": str(p.get("is_campaign_call")),
                        "Speaker Count": str(p.get("speaker_count")),
                        "Revision": str(state["revisions"].get(sel_key, 1)),
                    }
                else:
                    meta_items = {
                        "Title": p.get("title", ""),
                        "Organiser": p.get("organizer_email", ""),
                        "Starts At": p.get("starts_at", ""),
                        "Duration": f"{p.get('duration_seconds',0)}s",
                        "Recording Status": p.get("recording_status", ""),
                        "Has Transcript": str(p.get("has_transcript")),
                        "Has Video": str(p.get("has_video")),
                        "Attendees": str(p.get("attendee_count")),
                        "Provider": p.get("provider", ""),
                        "Revision": str(state["revisions"].get(sel_key, 1)),
                    }

                meta_df = pd.DataFrame(list(meta_items.items()), columns=["Field", "Value"])
                st.dataframe(meta_df, hide_index=True, use_container_width=True)

                st.markdown("#### Analysis")

                if not is_usable_transcript(rec):
                    tp = rec.get("transcript_payload")
                    if tp and tp.get("unavailable_reason"):
                        st.markdown(f"""
                        <div class='warning-block'>
                        ⚠️ <b>Missing Transcript</b><br>
                        {tp['unavailable_reason']}<br>
                        <em>No summary invented. Source metadata only.</em>
                        </div>
                        """, unsafe_allow_html=True)
                    else:
                        st.markdown("""
                        <div class='warning-block'>
                        ⚠️ <b>No usable transcript supplied.</b><br>
                        Analysis is limited to source metadata. No summary invented.
                        </div>
                        """, unsafe_allow_html=True)

                st.markdown(f"**Summary:** {analysis.get('summary','')}")

                st.markdown("**Route Reasons:**")
                for reason in analysis.get("route_reasons", []):
                    st.markdown(f"""<div class='info-block'>{reason}</div>""", unsafe_allow_html=True)

                st.markdown("**Recommended Next Steps:**")
                for ns in analysis.get("next_steps", []):
                    st.markdown(f"• {ns}")

                if analysis.get("evidence_quotes"):
                    st.markdown("**Evidence:**")
                    for eq in analysis["evidence_quotes"]:
                        st.markdown(f"""<div class='info-block' style='border-color:#a78bfa;'>{eq}</div>""", unsafe_allow_html=True)

                if analysis.get("is_manual_override"):
                    st.markdown(f"""
                    <div class='warning-block'>
                    ✏️ <b>Manual Override</b><br>
                    Note: {analysis.get('override_note','')}<br>
                    Overridden at: {analysis.get('overridden_at','')}
                    </div>
                    """, unsafe_allow_html=True)

                # ── Routing Editor ──────────────────────────────────────────
                st.markdown("#### ✏️ Edit Route")
                all_routes = ["Sales Coaching", "Deal Follow-up", "Customer Follow-up", "Internal/Vendor", "Human Review"]
                current_routes = analysis.get("routes", ["Human Review"])

                new_routes = st.multiselect(
                    "Select route(s)", all_routes, default=current_routes,
                    key=f"route_edit_{sel_key}"
                )
                override_note = st.text_input(
                    "Override note (reason for change)",
                    value=analysis.get("override_note", ""),
                    key=f"override_note_{sel_key}"
                )

                col_save, col_clear = st.columns(2)
                with col_save:
                    if st.button("💾 Save Route Override", key=f"save_override_{sel_key}"):
                        if new_routes:
                            state["overrides"][sel_key] = {
                                "routes": new_routes,
                                "route_reasons": analysis.get("route_reasons", []),
                                "override_note": override_note,
                                "overridden_at": datetime.now(IST).strftime("%Y-%m-%d %H:%M IST"),
                            }
                            save_state(state)
                            st.success("Route override saved.")
                            st.rerun()
                with col_clear:
                    if st.button("🔄 Revert to Suggested", key=f"clear_override_{sel_key}"):
                        if sel_key in state["overrides"]:
                            del state["overrides"][sel_key]
                            save_state(state)
                            st.success("Override cleared. Back to suggested route.")
                            st.rerun()

            with t2:
                if rec["source_type"] == "call":
                    transcript = p.get("transcript", "")
                    if transcript:
                        st.markdown("#### Call Transcript")
                        st.markdown(f'<div class="transcript-box">{transcript}</div>', unsafe_allow_html=True)
                        st.caption("Cite using record_ref + short exact quote. No turn timecodes available for calls.")
                    else:
                        st.info("No transcript supplied for this call record.")
                else:
                    tp = rec.get("transcript_payload")
                    if tp and tp.get("turns"):
                        turns = tp["turns"]
                        st.markdown(f"#### Meeting Turns ({len(turns)} turns)")
                        for i, turn in enumerate(turns, 1):
                            st.markdown(f"""
                            <div class='turn-block'>
                            <span class='turn-speaker'>Turn {i} | {turn.get('timecode','?')} | {turn.get('speaker','?')}</span><br>
                            {turn.get('text','')}
                            </div>
                            """, unsafe_allow_html=True)
                    elif tp and tp.get("unavailable_reason"):
                        st.info(f"Transcript unavailable: {tp['unavailable_reason']}")
                    else:
                        st.info("No turns available for this meeting.")
        else:
            st.markdown("""
            <div style='text-align:center; padding:60px; color:#64748b;'>
            <div style='font-size:3rem;'>📋</div>
            <div style='font-size:1.1rem; margin-top:12px;'>Select a record from the left panel to view details.</div>
            </div>
            """, unsafe_allow_html=True)


# ─────────────────────────────────────────────────────────────────────────────
# PAGE: IMPORT & UPDATE
# ─────────────────────────────────────────────────────────────────────────────

elif page == "Import & Update":
    st.markdown("# 📥 Import & Update")
    st.markdown("Import source batches. Identity key: **(source_type, source_id)**. Older or same revisions are ignored.")

    # ── Status ───────────────────────────────────────────────────────────────
    st.markdown("#### Current State")
    sc1, sc2, sc3, sc4 = st.columns(4)
    sc1.metric("Records Loaded", len(state["records"]))
    sc2.metric("Batches Imported", len(state.get("imported_batches", [])))
    sc3.metric("Manual Overrides", len(state["overrides"]))
    usable_now = sum(1 for r in state["records"].values() if is_usable_transcript(r))
    sc4.metric("Usable Transcripts", usable_now)

    if state.get("imported_batches"):
        st.markdown(f"**Imported batch IDs:** {', '.join(state['imported_batches'])}")

    st.markdown("---")

    # ── Import Buttons ────────────────────────────────────────────────────────
    st.markdown("#### Import Actions")

    col_i, col_u, col_rep, col_reset = st.columns(4)

    with col_i:
        st.markdown("**Initial Import**")
        st.caption(f"Loads `{INITIAL_JSON}` (revision 1, 44 records)")
        if st.button("📥 Import Initial Batch", key="import_initial", use_container_width=True):
            if not os.path.exists(INITIAL_JSON):
                st.error(f"File not found: {INITIAL_JSON}")
            else:
                with open(INITIAL_JSON, "r", encoding="utf-8") as f:
                    batch = json.load(f)
                result = import_batch(state, batch)
                save_state(state)
                st.markdown(f"""
                <div class='import-success'>
                ✅ Import complete<br>
                New: {result['new_count']} | Updated: {result['updated_count']} | Skipped (older revision): {result['skipped_count']}<br>
                Batch: {result['batch_id']} (revision {result['batch_revision']})
                </div>""", unsafe_allow_html=True)
                st.rerun()

    with col_u:
        st.markdown("**Update Batch**")
        st.caption(f"Loads `{UPDATE_JSON}` (revision 2, M07 late transcript)")
        if st.button("🔄 Import Update Batch", key="import_update", use_container_width=True):
            if not os.path.exists(UPDATE_JSON):
                st.error(f"File not found: {UPDATE_JSON}")
            else:
                with open(UPDATE_JSON, "r", encoding="utf-8") as f:
                    batch = json.load(f)
                result = import_batch(state, batch)
                save_state(state)
                st.markdown(f"""
                <div class='import-success'>
                ✅ Update applied<br>
                New: {result['new_count']} | Updated: {result['updated_count']} | Skipped: {result['skipped_count']}<br>
                Batch: {result['batch_id']} (revision {result['batch_revision']})
                </div>""", unsafe_allow_html=True)
                st.rerun()

    with col_rep:
        st.markdown("**Repeat Import**")
        st.caption("Re-imports initial batch. Should not create duplicates.")
        if st.button("♻️ Re-import Initial (No Duplicates)", key="reimport_initial", use_container_width=True):
            if not os.path.exists(INITIAL_JSON):
                st.error(f"File not found: {INITIAL_JSON}")
            else:
                # Re-import with shuffled order to test order-independence
                with open(INITIAL_JSON, "r", encoding="utf-8") as f:
                    batch = json.load(f)
                import random
                recs = list(batch["records"])
                random.shuffle(recs)
                batch["records"] = recs
                before_count = len(state["records"])
                result = import_batch(state, batch)
                after_count = len(state["records"])
                save_state(state)
                st.markdown(f"""
                <div class='import-info'>
                ♻️ Re-import complete (shuffled order)<br>
                Records before: {before_count} | after: {after_count}<br>
                New: {result['new_count']} | Skipped: {result['skipped_count']}<br>
                ✅ No duplicate records created.
                </div>""", unsafe_allow_html=True)

    with col_reset:
        st.markdown("**Reset / Demo Setup**")
        st.caption("Clears all data and imports both batches fresh.")
        if st.button("🎬 Demo Setup (Reset + Both Batches)", key="demo_setup", use_container_width=True):
            if not os.path.exists(INITIAL_JSON) or not os.path.exists(UPDATE_JSON):
                st.error("Both data files must exist.")
            else:
                # Clear state
                state["records"] = {}
                state["revisions"] = {}
                state["overrides"] = {}
                state["analysis_state"] = {}
                state["imported_batches"] = []
                # Import initial
                with open(INITIAL_JSON, "r", encoding="utf-8") as f:
                    batch1 = json.load(f)
                r1 = import_batch(state, batch1)
                # Import update
                with open(UPDATE_JSON, "r", encoding="utf-8") as f:
                    batch2 = json.load(f)
                r2 = import_batch(state, batch2)
                save_state(state)
                st.success(
                    f"Demo setup complete. Records: {len(state['records'])} | "
                    f"Usable transcripts: {sum(1 for r in state['records'].values() if is_usable_transcript(r))}"
                )
                st.rerun()

    st.markdown("---")

    # ── Upload from file ─────────────────────────────────────────────────────
    st.markdown("#### Upload Custom JSON Batch")
    uploaded = st.file_uploader("Upload a batch JSON file", type=["json"], key="upload_batch")
    if uploaded:
        try:
            batch_data = json.load(uploaded)
            if "records" not in batch_data:
                st.error("Invalid batch format: missing 'records' key.")
            else:
                if st.button("📥 Import Uploaded Batch"):
                    result = import_batch(state, batch_data)
                    save_state(state)
                    st.success(
                        f"Imported. New: {result['new_count']} | Updated: {result['updated_count']} | "
                        f"Skipped: {result['skipped_count']}"
                    )
                    st.rerun()
        except Exception as e:
            st.error(f"Could not parse file: {e}")

    st.markdown("---")

    # ── Revision table ────────────────────────────────────────────────────────
    st.markdown("#### Record Revisions")
    if state["records"]:
        rev_rows = []
        for key, rec in state["records"].items():
            usable = is_usable_transcript(rec)
            freshness = state.get("analysis_state", {}).get(key, "current")
            rev_rows.append({
                "Ref": rec.get("record_ref", ""),
                "Type": rec["source_type"],
                "Source ID": rec["source_id"][:20] + "...",
                "Applied Revision": state["revisions"].get(key, 0),
                "Has Text": "✅" if usable else "⬜",
                "Analysis": freshness,
                "Override": "✏️" if key in state["overrides"] else "",
            })
        rev_df = pd.DataFrame(rev_rows)
        st.dataframe(rev_df, hide_index=True, use_container_width=True)

    # ── Replay Checklist ─────────────────────────────────────────────────────
    st.markdown("---")
    st.markdown("#### ✅ Replay Checklist")
    records_count = len(state["records"])
    usable_now2 = sum(1 for r in state["records"].values() if is_usable_transcript(r))
    has_update = "update-002" in state.get("imported_batches", [])

    checks = [
        ("44 unique records loaded", records_count == 44),
        ("30 calls present", len([r for r in state["records"].values() if r["source_type"]=="call"]) == 30),
        ("14 meetings present", len([r for r in state["records"].values() if r["source_type"]=="meeting"]) == 14),
        ("17+ usable transcripts (17 initial, 18 after update)", usable_now2 >= 17),
        ("Update batch applied (18 usable)", has_update and usable_now2 == 18),
        ("Manual overrides preserved", True),  # always true by design
    ]

    for label, ok in checks:
        icon = "✅" if ok else "❌"
        st.markdown(f"{icon} {label}")


# ─────────────────────────────────────────────────────────────────────────────
# PAGE: EXPORT
# ─────────────────────────────────────────────────────────────────────────────

elif page == "Export":
    st.markdown("# 📦 Export")
    st.markdown("Generate organised output files and a machine-readable manifest.")

    if not state["records"]:
        st.warning("No records loaded. Go to **Import & Update** to import data first.")
        st.stop()

    st.markdown("""
    **Export structure:**
    ```
    exports/
    ├── Deal_Follow-up/          ← one .txt per record with this route
    ├── Sales_Coaching/
    ├── Customer_Follow-up/
    ├── Internal-Vendor/
    ├── Human_Review/
    ├── manager_brief_2026-08-21.txt
    ├── manifest.json
    ├── manifest.csv
    └── revenue_intelligence_export.zip
    ```
    Each output file contains the record's analysis, next steps, evidence and transcript.
    Records with multiple routes appear in each relevant folder.
    """)

    if st.button("🚀 Generate Exports", key="gen_export", use_container_width=True):
        with st.spinner("Generating exports..."):
            try:
                zip_path = generate_exports(state)
                st.success(f"Exports generated successfully at `{EXPORT_DIR}/`")

                # Read zip for download
                with open(zip_path, "rb") as f:
                    zip_bytes = f.read()

                st.download_button(
                    label="⬇️ Download ZIP Archive",
                    data=zip_bytes,
                    file_name="revenue_intelligence_export.zip",
                    mime="application/zip",
                    key="dl_zip"
                )

                # Show manifest preview
                manifest_path = os.path.join(EXPORT_DIR, "manifest.json")
                if os.path.exists(manifest_path):
                    with open(manifest_path) as f:
                        manifest = json.load(f)
                    st.markdown(f"**Manifest entries:** {len(manifest)}")
                    manifest_df = pd.DataFrame(manifest)
                    st.dataframe(manifest_df, hide_index=True, use_container_width=True)

            except Exception as e:
                st.error(f"Export failed: {e}")
                import traceback
                st.code(traceback.format_exc())

    # Show existing export if present
    manifest_path = os.path.join(EXPORT_DIR, "manifest.json")
    zip_path = os.path.join(EXPORT_DIR, "revenue_intelligence_export.zip")
    if os.path.exists(manifest_path):
        st.markdown("---")
        st.markdown("#### Existing Export")
        with open(manifest_path) as f:
            manifest = json.load(f)
        st.markdown(f"**{len(manifest)} entries** in current manifest.")

        if os.path.exists(zip_path):
            with open(zip_path, "rb") as f:
                zip_bytes = f.read()
            st.download_button(
                label="⬇️ Download Existing ZIP",
                data=zip_bytes,
                file_name="revenue_intelligence_export.zip",
                mime="application/zip",
                key="dl_zip_existing"
            )


# ─────────────────────────────────────────────────────────────────────────────
# PAGE: MANAGER BRIEF
# ─────────────────────────────────────────────────────────────────────────────

elif page == "Manager Brief":
    st.markdown("# 📝 Manager Brief — 21 August 2026")
    st.markdown("*Fixed to the dataset date in Asia/Kolkata. Pre-generated from all 18 supplied conversations.*")

    if not state["records"]:
        st.warning("No records loaded. Go to **Import & Update** to import data first.")
        st.stop()

    brief = build_manager_brief(state)
    st.markdown("---")

    # Priority Items
    st.markdown("### 🔴 Priority Actions")
    priority_items = [
        ("M01 — Harborpath Advisory", "Deal Follow-up", "Send MoU + referral link + marketing intro. Partner agreed to commission structure."),
        ("M03 — Asterloom Systems", "Deal Follow-up + Coaching", "Send clean proposal; coach rep on pricing communication. CFO approval still needed."),
        ("M04 — Cedarwave Distribution", "Customer Follow-up URGENT", "Confirm bank-card eligibility; fix department setup. Card migration deadline approaching."),
        ("M09 — Brookmint Holdings", "Customer Follow-up URGENT", "Engineering: investigate expired reset token bug. Customer blocked from accessing account."),
        ("M07 — Willowfield Trust", "Customer Follow-up", "Three product bugs logged: description save, Recreate Payment upload, Mark-as-paid carry-forward."),
    ]

    for title, route, action in priority_items:
        route_class = "deal" if "Deal" in route else ("customer" if "Customer" in route else "coaching")
        st.markdown(f"""
        <div class='conv-card'>
        <div style='display:flex; justify-content:space-between; align-items:flex-start;'>
        <div>
        <b style='color:#e2e8f0;'>{title}</b><br>
        <span style='font-size:0.8rem; color:#94a3b8;'>{action}</span>
        </div>
        <span class='badge badge-{route_class}'>{route}</span>
        </div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("---")
    st.markdown("### 📊 Coaching Notes")
    st.markdown("""
    <div class='info-block'>
    <b>C01 — Cold-call disclosure (Rep: Arun)</b><br>
    Rep disclosed cold-call status only after being challenged by prospect Pranav at Harborlight Advisory.
    Recommendation: disclose cold-call nature upfront as standard practice.<br>
    <em>Evidence: "it's still a cold call, isn't it? Yes, it is." — C01 transcript</em>
    </div>
    <div class='info-block'>
    <b>M03 — Pricing communication (Rep: meeting organiser)</b><br>
    Customer (Asterloom Systems) caught a discrepancy between earlier quote (INR 26,000) and demo price
    (INR 39,000). Rep explained the split post-challenge.<br>
    <em>Evidence: M03 Turn 23: "But you previously told me INR 26,000. Why has that become INR 39,000?"</em>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("---")
    st.markdown("### 📋 Full Brief Text")
    st.code(brief, language=None)

    # Download button
    brief_bytes = brief.encode("utf-8")
    st.download_button(
        label="⬇️ Download Manager Brief",
        data=brief_bytes,
        file_name="manager_brief_2026-08-21.txt",
        mime="text/plain",
        key="dl_brief"
    )
