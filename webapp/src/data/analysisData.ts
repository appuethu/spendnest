import { RecordAnalysis } from '../types';

export const PREGENERATED_ANALYSES: Record<string, RecordAnalysis> = {
  // ── CALLS WITH TRANSCRIPTS ──────────────────────────────────────────────
  'call::2ec4404c-beee-5377-a63c-aab701da08ed': { // C01
    routes: ['Sales Coaching'],
    route_reasons: [
      'Cold call to Harborlight Advisory. Prospect expressed frustration at unsolicited contact and stated no interest. Rep disclosed cold-call status only after being challenged. Coaching opportunity: upfront disclosure and cleaner value proposition.'
    ],
    summary: 'Cold call; prospect (Pranav at Harborlight Advisory) rejected outreach, cited advanced existing automation and did not ask for follow-up. Call ended on a neutral note. No next steps established.',
    next_steps: ['Coach rep (Arun) on cold-call disclosure and handling objections.'],
    evidence_quotes: [
      '"it\'s still a cold call, isn\'t it? Yes, it is." — C01 transcript',
      '"Our processes are already very automated." — C01 transcript'
    ],
    review_state: 'reviewed',
    analysis_freshness: 'current',
  },
  'call::4b870624-8aad-5315-a60e-0db95981cf99': { // C02
    routes: ['Deal Follow-up'],
    route_reasons: [
      'Arun reached Fernhaven Group reception trying to speak with Leela (a rep name confusion — Leela is the SpendNest rep, not the contact). Was redirected to voicemail. Outcome: voicemail left; follow-up required.'
    ],
    summary: 'Outbound call to Fernhaven Group; Leela (rep at SpendNest) is the caller per payload, but the transcript shows Arun calling. Reception said target was unavailable; caller left a voicemail.',
    next_steps: ['Confirm correct contact name; follow up after voicemail.'],
    evidence_quotes: [
      '"It looks as though she isn\'t in the office today." — C02 transcript'
    ],
    review_state: 'reviewed',
    analysis_freshness: 'current',
  },
  'call::20d509ba-d589-5334-9aef-ea4ce6105b1a': { // C03
    routes: ['Deal Follow-up', 'Sales Coaching'],
    route_reasons: [
      'Follow-up call on API/developer access discussion with Milan. Poor audio; agreed to continue via email and Monday callback. Coaching: audio quality management when prospect is travelling.',
      'Rep agreed on two-step follow-up (email + Monday call) — needs tracking.'
    ],
    summary: 'Follow-up call on developer API access with Milan. Audio problems throughout; agreed to email follow-up and possible Monday/Tuesday call. No price commitment; prospect uncertain about team\'s interest. Subject line agreed: \'Developer access and event notifications — follow-up\'.',
    next_steps: [
      'Send email with subject "Developer access and event notifications — follow-up".',
      'Schedule Monday/Tuesday callback.'
    ],
    evidence_quotes: [
      '"Could we do this by email? Or call on Monday a bit earlier" — C03 transcript',
      '"Send the email and we can speak Monday or Tuesday" — C03 transcript'
    ],
    review_state: 'reviewed',
    analysis_freshness: 'current',
  },
  'call::bcdcbf56-d338-5c78-9a97-42c2fc1c9931': { // C04
    routes: ['Deal Follow-up'],
    route_reasons: [
      'Voicemail left for Ritesh at Lanternpath Media following a previous conversation about expense platform. Email had earlier gone to wrong address; corrected. Awaiting callback from prospect to confirm decision.'
    ],
    summary: 'Voicemail message left for Ritesh at Lanternpath Media. Earlier email went to wrong address; corrected email subsequently sent. Requesting callback to confirm whether prospect is moving forward.',
    next_steps: [
      'Await callback from Ritesh at Lanternpath Media.',
      'If no response in 2–3 days, send follow-up email.'
    ],
    evidence_quotes: [
      '"I\'m following up on your consideration of our expense platform for Lanternpath Media." — C04 transcript',
      '"we subsequently used the corrected address you gave us" — C04 transcript'
    ],
    review_state: 'reviewed',
    analysis_freshness: 'current',
  },
  'call::75a6b94f-7717-5cfb-9e41-0acc94415e17': { // C05
    routes: ['Deal Follow-up'],
    route_reasons: [
      'Cold call to multi-store prospect (Meera calling). Prospect uses StoreHarbor and other systems; said to send presentation if they consider changing. Email confirmed: contact05@example.com. Low probability; needs nurture sequence.'
    ],
    summary: 'Cold call (Meera from SpendNest). Prospect has multiple existing providers covering vendor management and store expenses. Asked for a presentation to review if they consider switching. Email confirmed: contact05@example.com.',
    next_steps: [
      'Send product presentation to contact05@example.com.',
      'Tag for low-priority nurture sequence.'
    ],
    evidence_quotes: [
      '"send me your presentation" — C05 transcript',
      '"One is StoreHarbor, and we use others too" — C05 transcript'
    ],
    review_state: 'reviewed',
    analysis_freshness: 'current',
  },
  'call::12216d5c-e254-52c6-b344-47de4c6e1ae5': { // C06
    routes: ['Deal Follow-up'],
    route_reasons: [
      'Cold call to Nikhil at large retailer (>120 stores). Prospect has head-office automation in place. Rep (Ravi) confirmed not to call again unless prospect reaches out. Low-priority nurture only.'
    ],
    summary: 'Cold call to Nikhil, large retailer (>120 stores). Prospect has extensive automation through business management system. Said to call only if specific need arises. No email or next step agreed.',
    next_steps: ['Do not call again unless prospect initiates contact. Mark as cold nurture.'],
    evidence_quotes: [
      '"If a particular need comes up later, we will reach out." — C06 transcript',
      '"I understand you have more than a hundred and twenty stores" — C06 transcript'
    ],
    review_state: 'reviewed',
    analysis_freshness: 'current',
  },
  'call::428817fa-7e9e-5418-a7d4-bb396d28dfbf': { // C07
    routes: ['Deal Follow-up'],
    route_reasons: [
      'Partnership outreach to Willowbank Advisory (Aditya). Advisory firm refers clients for account opening; interested in SpendNest virtual accounts as a partner. Agreed: Dev will message proposal via chat app and call Monday.'
    ],
    summary: 'Outbound call exploring partnership with Willowbank Advisory. Prospect (Aditya) refers clients for company formation and account opening. Interested in referring SpendNest for virtual business accounts. Asked for chat-app message with proposal; Monday callback agreed.',
    next_steps: [
      'Send partnership proposal via chat app.',
      'Call Aditya at Willowbank Advisory on Monday.'
    ],
    evidence_quotes: [
      '"could you message me on our chat app and send whatever proposal you have?" — C07 transcript',
      '"Yes, that is something we normally do" (referring clients to account providers) — C07 transcript'
    ],
    review_state: 'reviewed',
    analysis_freshness: 'current',
  },
  'call::129497b2-8e1d-5e01-919c-e8a852b5ff68': { // C08
    routes: ['Deal Follow-up'],
    route_reasons: [
      'Cold call to Raghav. Prospect interested; colleague (Mr Raghav\'s people-ops peer) handles frontline processes. Email to forward proposal: contact08@example.com.'
    ],
    summary: 'Cold call to Raghav (Meera calling). Prospect interested in expense/payables automation; directed rep to people-ops colleague. Email confirmed: contact08@example.com.',
    next_steps: [
      'Send proposal to contact08@example.com, mentioning Raghav\'s referral.'
    ],
    evidence_quotes: [
      '"contact08@example.com" — C08 transcript',
      '"say you spoke with me, he can take a look" — C08 transcript'
    ],
    review_state: 'reviewed',
    analysis_freshness: 'current',
  },
  'call::4a1de681-f884-55e8-b1ad-de22d17cd959': { // C09
    routes: ['Deal Follow-up'],
    route_reasons: [
      'Cold call to Vedant. 130-location business with internal expense software. Contact directed rep to business head Rishabh (LinkedIn). Requested rep not use Vedant\'s name.'
    ],
    summary: 'Cold call to Vedant; company has 130 locations and internally built expense software. Vedant directed rep to business head Rishabh on LinkedIn. Requested anonymity.',
    next_steps: [
      'Contact Rishabh (business head) via LinkedIn. Do not mention Vedant\'s name.'
    ],
    evidence_quotes: [
      '"You can find our business head, Mr Rishabh, on a professional networking site." — C09 transcript',
      '"No, please don\'t use my name." — C09 transcript'
    ],
    review_state: 'reviewed',
    analysis_freshness: 'current',
  },
  'call::b747f592-810e-583c-9b81-8db5ab035806': { // C10
    routes: ['Deal Follow-up'],
    route_reasons: [
      'Cold call to Aniket who no longer works at Meadowbrick. Now in manufacturing. Said he\'d review if sent info but declined a follow-up call. Low probability; send brief, then wait.'
    ],
    summary: 'Cold call to Aniket; no longer at Meadowbrick. Now in manufacturing. Would review a messaging-app brief but declined a scheduled follow-up call. Low opportunity probability.',
    next_steps: [
      'Send brief via messaging app (focus on AP and supplier management).',
      'Do not schedule a call; wait for prospect to respond.'
    ],
    evidence_quotes: [
      '"I said I will contact you if there is anything to discuss." — C10 transcript',
      '"I don\'t work there anymore." — C10 transcript'
    ],
    review_state: 'reviewed',
    analysis_freshness: 'current',
  },

  // ── MEETINGS WITH TRANSCRIPTS ────────────────────────────────────────────
  'meeting::cb5cecac-e68d-52b7-b10b-b0c748efc467': { // M01
    routes: ['Deal Follow-up'],
    route_reasons: [
      'Partnership discussion with Harborpath Advisory (Partner A). Agreed partner commission structure, referral link mechanism, onboarding requirements. Awaiting signed MoU and follow-up documents from SpendNest team.'
    ],
    summary: 'Partnership deal discussion with Harborpath Advisory. Partner agreed to refer clients to SpendNest for virtual accounts. Commission: USD 260 per approved referral + interchange + volume bonus. Referral mechanism: unique link. SpendNest to send MoU + materials. Podcast/marketing collaboration proposed.',
    next_steps: [
      'Send MoU for signature (Team member A).',
      'Send partnership deck, pricing, unique referral link.',
      'Connect Partner A with marketing for podcast/partner-page feature.',
      'Share referral tracking sheet.'
    ],
    evidence_quotes: [
      'M01 Turn 12: "No, let us get the partner onboarding started."',
      'M01 Turn 24: "The main thing is to have all of that written down, with the link and contact route."',
      'M01 Turn 27: "I can connect you with marketing about that."'
    ],
    review_state: 'reviewed',
    analysis_freshness: 'current',
  },
  'meeting::1a21c409-c050-5787-90af-2667e057e1b6': { // M02
    routes: ['Internal/Vendor', 'Deal Follow-up'],
    route_reasons: [
      'SpendNest evaluating LedgerBridge for compliant invoicing integration. Commercial discussion (electronic invoicing across SG/AU/IN). Volume template to be sent; SpendNest must fill it before next commercial call.',
      'Next step involves SpendNest management: needs internal briefing on pricing models.'
    ],
    summary: 'SpendNest strategy/product team evaluating LedgerBridge for compliant e-invoicing. Targeting Q4 for Singapore, Australia, then India. Two pricing models: country licences or per-customer licences. Setup: EUR 2,600–6,500+. LedgerBridge to send volume template; SpendNest to fill before next commercial call.',
    next_steps: [
      'LedgerBridge sends volume template.',
      'SpendNest (Team B) fills AP volume; estimates AR volumes clearly marked as uncertain.',
      'SpendNest briefs management on pricing models before commercial call.',
      'Decide which stakeholders join next meeting.'
    ],
    evidence_quotes: [
      'M02 Turn 18: "We should not present those two columns as equally certain."',
      'M02 Turn 13: "We are aiming for the fourth quarter. We would start with Singapore and Australia, then India."',
      'M02 Turn 31: "The basic setup begins at EUR 2,600; a more supported implementation starts at EUR 6,500."'
    ],
    review_state: 'reviewed',
    analysis_freshness: 'current',
  },
  'meeting::398672e7-62dd-5afd-846d-0237d49792fb': { // M03
    routes: ['Deal Follow-up', 'Sales Coaching'],
    route_reasons: [
      'Existing customer (Asterloom Systems, ~65 employees) evaluating domestic prepaid cards. Price discrepancy identified: INR 26k vs INR 39k. CFO approval still needed. Customer wants proposal before scheduling next call.',
      'Coaching: Rep must not let pricing discrepancies surprise the customer mid-meeting.'
    ],
    summary: 'Demo and pricing discussion with Asterloom Systems. Customer wants domestic prepaid cards for 4–5 employees initially. Pricing: INR 26,000 p.a. subscription + INR 13,000 one-time integration. Customer noted prior quote of INR 26,000 all-in. CFO approval needed. Vendor payments (~INR 26–39L/month) may be relevant later.',
    next_steps: [
      'Send full proposal (cards + modules breakdown) to customer.',
      'Wait for internal CFO discussion before scheduling next call.',
      'Flag pricing communication gap for rep coaching.'
    ],
    evidence_quotes: [
      'M03 Turn 23: "But you previously told me INR 26,000. Why has that become INR 39,000?"',
      'M03 Turn 28: "Our CFO approves the larger payments. We need to explain the proposal to them."',
      'M03 Turn 34: "The external team processes vendor payments manually and it is expensive."'
    ],
    review_state: 'reviewed',
    analysis_freshness: 'current',
  },
  'meeting::b0f79b3d-37ba-52f9-b2bc-58b159dd6d91': { // M04
    routes: ['Customer Follow-up', 'Human Review'],
    route_reasons: [
      'Existing customer (Cedarwave Distribution) in card migration. Credit vs prepaid unresolved. Bank credit card eligibility check outstanding. Department setup correction pending.',
      'Multiple unresolved technical and commercial questions; human review required to triage and assign actions.'
    ],
    summary: 'Cedarwave Distribution migration planning. Current card programme closing in weeks; new programme still prepaid. Customer wants credit. SpendNest has bank partnership for credit cards (subject to bank assessment). Bank credit-card transaction feed feasibility to be confirmed. Accounting sync for bank-card transactions uncertain. Department user-move correction also outstanding.',
    next_steps: [
      'Confirm whether Cedarwave\'s existing bank credit cards are eligible for transaction-feed programme.',
      'Confirm accounting-sync feasibility for bank-card transactions.',
      'Schedule guided session to fix department/user setup.',
      'Cedarwave to discuss internally before deciding migration approach.'
    ],
    evidence_quotes: [
      'M04 Turn 11: "moving from prepaid to credit is the main issue for us"',
      'M04 Turn 23: "I cannot confirm the existing-card eligibility on this call."',
      'M04 Turn 21: "source-balance reconciliation is a question in this setup"'
    ],
    review_state: 'needs_review',
    analysis_freshness: 'current',
  },
  'meeting::657b9e9d-9472-5b01-a127-a648ad7e8cf7': { // M06
    routes: ['Deal Follow-up'],
    route_reasons: [
      'Discovery call with Mapletrail Services finance contact. Covers ~8 clients on receivables side. Discussed invoice-to-cash workflow and pain points. SpendNest AR module in development is relevant.'
    ],
    summary: 'Discovery call with Mapletrail Services (software dev/testing, 65 people in central finance). Finance contact handles ~8 clients\' receivables locally. Pain: manual invoice prep, collection follow-up, cross-currency challenges. SpendNest AR module relevant but not yet live.',
    next_steps: [
      'Share AR module roadmap/timeline with Mapletrail.',
      'Revisit once AR module is closer to launch.'
    ],
    evidence_quotes: [
      'M06 Turn 9: "I cover around eight clients. I speak to delivery managers about what was delivered, check the contract and resource rates, prepare the invoice."'
    ],
    review_state: 'reviewed',
    analysis_freshness: 'current',
  },
  'meeting::4f304fff-fd40-5cfc-a366-0a134c445c2a': { // M07 (Late-arriving transcript)
    routes: ['Customer Follow-up', 'Human Review'],
    route_reasons: [
      'Willowfield Trust support & triage session. Customer reported UI description edit failing to persist and batch approvals timing out. Engineering bug investigations required.',
      'Arrived late via update batch (Revision 2). Flagged as stale_pending_review until manager verifies.'
    ],
    summary: 'Willowfield Trust technical session. Customer reported that changing payment description does not update on saved views, and larger batch approvals suffer intermittent timeouts. Rep walked through reproduction steps and logged ticket.',
    next_steps: [
      'Engineering ticket: payment description state refresh issue.',
      'Engineering ticket: batch approval timeout on 15+ items.',
      'Customer support follow-up with Willowfield Trust by Monday.'
    ],
    evidence_quotes: [
      'M07 Turn 2: "The first one is editing the description. I am changing this event-payment description... Now look at the displayed description again."',
      'M07 Turn 3: "The field still shows the earlier wording. So the change is not appearing after you save"'
    ],
    review_state: 'stale_pending_review',
    analysis_freshness: 'stale',
  },
  'meeting::4b5b9192-f3fc-505a-8e77-4d2ffaa54594': { // M09
    routes: ['Customer Follow-up', 'Human Review'],
    route_reasons: [
      'Existing customer onboarding issue: Brookmint Holdings invitation expired/token bug. SpendNest team to investigate token expiry with engineering.',
      'Access control design question raised: shared-mailbox admin risk. Needs support resolution and product clarification on role scoping.'
    ],
    summary: 'Onboarding session for customer managing two companies (Northkite Equipment + Brookmint Holdings). Brookmint login token expired immediately after reset. Customer raised access-control concern: shared mailbox giving unwanted admin rights. Northkite accounting issue self-resolved.',
    next_steps: [
      'Engineering: investigate why reset token expires immediately for Brookmint Holdings.',
      'Support: advise on role-scoping options for shared-mailbox admin risk.',
      'Customer: speak to IT team about separate email identities.',
      'Support: provide refresher session or send training material.'
    ],
    evidence_quotes: [
      'M09 Turn 21: "It says the token has expired. This is the fresh message we just received."',
      'M09 Turn 17: "I do not want this to depend on trusting someone not to use access that is available."'
    ],
    review_state: 'needs_review',
    analysis_freshness: 'current',
  },
  'meeting::337f297d-9385-5b82-9e54-5019c1ed912c': { // M10
    routes: ['Internal/Vendor'],
    route_reasons: [
      'Internal training session (billing workflow walkthrough). No customer present. Team member B learning billing system; back-office super-admin access not yet provisioned.'
    ],
    summary: 'Internal billing training. Covers subscription billing cycle, invoice generation, payment deduction retries, zero-value invoices and account freeze/recovery flow. Team member B lacks super-admin access; to be requested separately.',
    next_steps: [
      'Request back-office super-admin access for Team member B.',
      'Team member B to review billing examples and send questions.'
    ],
    evidence_quotes: [
      'M10 Turn 4: "I do not have the back-office super-admin access you mentioned."',
      'M10 Turn 17: "Simply topping up a frozen account does not complete the whole recovery flow."'
    ],
    review_state: 'reviewed',
    analysis_freshness: 'current',
  },
};

export const DEFAULT_NO_TRANSCRIPT_ANALYSIS: RecordAnalysis = {
  routes: ['Human Review'],
  route_reasons: ['No usable supplied transcript. Cannot determine conversation content from source data.'],
  summary: 'No usable transcript supplied for this record. Intake inspection required.',
  next_steps: ['Review when transcript becomes available, or mark as background/silent interaction.'],
  evidence_quotes: [],
  review_state: 'needs_review',
  analysis_freshness: 'current',
};

export const DEFAULT_BACKGROUND_CALL_ANALYSIS: RecordAnalysis = {
  routes: ['Human Review'],
  route_reasons: ['Short background call — no usable transcript. Duration and metadata suggest no substantive conversation.'],
  summary: 'Background call with no supplied transcript. Source metadata indicates voicemail, missed call or unresponsive outcome.',
  next_steps: ['No action required unless rep adds a manual CRM note.'],
  evidence_quotes: [],
  review_state: 'reviewed',
  analysis_freshness: 'current',
};
