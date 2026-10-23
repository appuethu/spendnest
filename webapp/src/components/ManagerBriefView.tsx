import React from 'react';
import { 
  FileText, 
  AlertCircle, 
  UserCheck, 
  ShieldAlert, 
  Bug, 
  HelpCircle, 
  CheckCircle,
  Building2,
  Calendar
} from 'lucide-react';

export const ManagerBriefView: React.FC = () => {
  return (
    <div style={{ padding: '0 24px 32px 24px', display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1100, margin: '0 auto' }}>
      
      {/* Title Header */}
      <div className="glass-panel" style={{ padding: '24px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: 'rgba(99, 102, 241, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8'
            }}>
              <FileText size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>
                Daily Manager Brief · 21 August 2026 (Asia/Kolkata)
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Synthesized operational priorities, coaching interventions, and deal blockers across 44 interactions.
              </p>
            </div>
          </div>
          <span style={{
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 12,
            fontWeight: 600
          }}>
            Status: Executive Approved
          </span>
        </div>
      </div>

      {/* Section 1: Executive Overview */}
      <div className="glass-panel" style={{ padding: '22px 26px' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
          1. Executive Summary & Activity Footprint
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
          Across 44 selected interactions (30 calls, 14 meetings) on 21 August 2026, 18 conversations contain full actionable transcripts (17 initial + 1 late-arriving update M07). 
          Pipeline velocity is strong across mid-market commercial accounts (Harborpath USD 260/account partner MoU agreed; LedgerBridge e-invoicing volume template advancing). 
          However, three critical operational issues require manager intervention today before they jeopardize key accounts.
        </p>
      </div>

      {/* Section 2: Three Critical Findings */}
      <div className="glass-panel" style={{ padding: '24px 28px' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 18 }}>
          2. Three Most Critical Operational Findings
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Finding 1 */}
          <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: 10, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={18} color="#f59e0b" />
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fef3c7' }}>
                Finding 1 — Asterloom Systems (M03): Pricing Transparency Gap Mid-Demo
              </h4>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, marginTop: 8 }}>
              During the Asterloom Systems demo, the prospect caught that the quoted price had jumped from INR 26,000 to INR 39,000 without prior explanation. The rep clarified that INR 13,000 was a one-time accounting integration setup fee, but the omission surprised the customer and stalled immediate CFO approval.
            </p>
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '8px 12px', borderRadius: 6, marginTop: 10, fontSize: 12, color: '#fde68a', fontStyle: 'italic' }}>
              Verbatim Evidence: M03 Turn 23: "But you previously told me INR 26,000. Why has that become INR 39,000?"
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
              <strong>Operational Directive:</strong> Route to both <strong>Deal Follow-up</strong> and <strong>Sales Coaching</strong>. Send itemized proposal separating recurring subscription from one-time setup.
            </p>
          </div>

          {/* Finding 2 */}
          <div style={{ background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: 10, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldAlert size={18} color="#fb7185" />
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#ffe4e6' }}>
                Finding 2 — Cedarwave Distribution (M04): Core Requirement Mismatch (Credit vs Prepaid)
              </h4>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, marginTop: 8 }}>
              Cedarwave Distribution’s existing corporate card program expires in weeks. Their non-negotiable requirement is revolving corporate credit cards, whereas SpendNest's primary offering is prepaid corporate cards. Bank partnership credit eligibility was left unconfirmed on the call.
            </p>
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '8px 12px', borderRadius: 6, marginTop: 10, fontSize: 12, color: '#fecdd3', fontStyle: 'italic' }}>
              Verbatim Evidence: M04 Turn 11: "moving from prepaid to credit is the main issue for us." Turn 23: "I cannot confirm the existing-card eligibility on this call."
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
              <strong>Operational Directive:</strong> Route to <strong>Customer Follow-up + Human Review</strong>. Urgently confirm bank partner credit card transaction-feed feasibility before migration deadline.
            </p>
          </div>

          {/* Finding 3 */}
          <div style={{ background: 'rgba(139, 92, 246, 0.05)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: 10, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bug size={18} color="#c084fc" />
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#ede9fe' }}>
                Finding 3 — Brookmint Holdings (M09): Immediate Password Reset Token Expiry Bug
              </h4>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, marginTop: 8 }}>
              During a customer onboarding session for multi-entity setup, a freshly generated invitation reset link expired immediately upon transmission. The support agent confirmed live reproduction with no immediate explanation.
            </p>
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '8px 12px', borderRadius: 6, marginTop: 10, fontSize: 12, color: '#ddd6fe', fontStyle: 'italic' }}>
              Verbatim Evidence: M09 Turn 21: "It says the token has expired. This is the fresh message we just received."
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
              <strong>Operational Directive:</strong> Route to <strong>Customer Follow-up + Human Review</strong>. High priority engineering ticket logged to investigate auth token TTL and email dispatch timestamp sync.
            </p>
          </div>

        </div>
      </div>

      {/* Section 3: Coaching Matrix */}
      <div className="glass-panel" style={{ padding: '22px 26px' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 14 }}>
          3. Rep Coaching Matrix
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 14, borderRadius: 8, border: '1px solid var(--border-glass)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#818cf8' }}>Rep: Arun (C01, C02, C04)</span>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
              Coach on upfront cold-call transparency. When challenged on C01, rep hesitated before admitting it was a cold call. Also review CRM contact names before calling (C02 rep confusion).
            </p>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 14, borderRadius: 8, border: '1px solid var(--border-glass)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#34d399' }}>Rep: Kiran (C03)</span>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 4 }}>
              Audio quality management. When prospect is travelling outdoors on roaming, transition swiftly to email proposal rather than pushing a faint phone conversation.
            </p>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 14, borderRadius: 8, border: '1px solid var(--border-glass)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>Rep: Meera (C05, C08, C09)</span>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Strong objection handling and polite referral capture (contact08@example.com, Rishabh on LinkedIn). Follow up on agreed proposals promptly.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
