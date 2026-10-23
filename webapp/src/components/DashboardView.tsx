import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  PhoneCall, 
  Video, 
  FileCheck2, 
  AlertTriangle, 
  ArrowUpRight, 
  Activity, 
  Layers
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { 
    records, 
    overrides, 
    analysisState, 
    setActiveTab, 
    setSelectedRecordKey, 
    getRecordAnalysis
  } = useApp();

  const recordList = Object.values(records);
  const totalRecords = recordList.length;

  const calls = recordList.filter(r => r.source_type === 'call');
  const meetings = recordList.filter(r => r.source_type === 'meeting');

  const usableCalls = calls.filter(c => Boolean((c.payload as any)?.transcript?.trim())).length;
  const usableMeetings = meetings.filter(m => Boolean(m.transcript_payload?.turns?.some(t => t.text?.trim()))).length;
  const totalUsable = usableCalls + usableMeetings;
  const coverageRate = totalRecords > 0 ? ((totalUsable / totalRecords) * 100).toFixed(1) : '0';

  // Connection rate: is_connected = true / calls with non-null is_connected
  const callsWithConnectedInfo = calls.filter(c => (c.payload as any)?.is_connected !== undefined && (c.payload as any)?.is_connected !== null);
  const connectedCalls = callsWithConnectedInfo.filter(c => (c.payload as any)?.is_connected === true).length;
  const connectionRate = callsWithConnectedInfo.length > 0
    ? ((connectedCalls / callsWithConnectedInfo.length) * 100).toFixed(1)
    : '0';

  const needsReviewCount = Object.values(analysisState).filter(s => s === 'needs_review' || s === 'stale_pending_review').length;
  const overridesCount = Object.keys(overrides).length;

  // Rep activity map
  const repActivity: Record<string, { calls: number; meetings: number }> = {};
  recordList.forEach(r => {
    let person = 'Unassigned';
    if (r.source_type === 'call') {
      const p = r.payload as any;
      person = p.rep_name || p.rep_email || 'Unknown Rep';
      if (!repActivity[person]) repActivity[person] = { calls: 0, meetings: 0 };
      repActivity[person].calls++;
    } else {
      const p = r.payload as any;
      person = p.organizer_email ? p.organizer_email.split('@')[0] : 'Unknown Organiser';
      if (!repActivity[person]) repActivity[person] = { calls: 0, meetings: 0 };
      repActivity[person].meetings++;
    }
  });

  // Route breakdown
  const routeCounts: Record<string, number> = {
    'Deal Follow-up': 0,
    'Sales Coaching': 0,
    'Customer Follow-up': 0,
    'Internal/Vendor': 0,
    'Human Review': 0,
  };

  recordList.forEach(r => {
    const analysis = getRecordAnalysis(r);
    (analysis.routes || []).forEach(rt => {
      if (routeCounts[rt] !== undefined) {
        routeCounts[rt]++;
      } else {
        routeCounts[rt] = 1;
      }
    });
  });

  const handleInspect = (sourceType: 'call' | 'meeting', sourceId: string) => {
    setSelectedRecordKey(`${sourceType}::${sourceId}`);
    setActiveTab('inbox');
  };

  return (
    <div style={{ padding: '0 24px 32px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        
        {/* Total Records */}
        <div className="glass-panel" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Selected Records</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={18} color="#818cf8" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 12 }}>
            <span style={{ fontSize: 32, fontWeight: 700, color: '#fff' }}>{totalRecords}</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              ({calls.length} calls · {meetings.length} mtgs)
            </span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
            Curated team sample for 21 Aug 2026
          </p>
        </div>

        {/* Transcript Coverage */}
        <div className="glass-panel" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Transcript Coverage</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileCheck2 size={18} color="#34d399" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 12 }}>
            <span style={{ fontSize: 32, fontWeight: 700, color: '#10b981' }}>{coverageRate}%</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              ({totalUsable}/{totalRecords} usable)
            </span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
            {usableCalls} call texts · {usableMeetings} meeting turns
          </p>
        </div>

        {/* Call Connection Rate */}
        <div className="glass-panel" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Call Connection Rate</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PhoneCall size={18} color="#22d3ee" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 12 }}>
            <span style={{ fontSize: 32, fontWeight: 700, color: '#06b6d4' }}>{connectionRate}%</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              ({connectedCalls}/{callsWithConnectedInfo.length} connected)
            </span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
            Denominator: calls with non-null is_connected
          </p>
        </div>

        {/* Review Queue */}
        <div className="glass-panel" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Review Needed Queue</span>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={18} color="#fbbf24" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 12 }}>
            <span style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b' }}>{needsReviewCount}</span>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {overridesCount > 0 ? `· ${overridesCount} manually resolved` : 'pending review'}
            </span>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
            Unresolved requirements & silent calls
          </p>
        </div>
      </div>

      {/* Critical Executive Action Alerts */}
      <div className="glass-panel" style={{ padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Activity size={20} color="var(--accent-indigo)" />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
              Top Operational Action Alerts (21 August 2026)
            </h2>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Requires Manager & Engineering Action
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
          {/* Asterloom Alert */}
          <div 
            onClick={() => handleInspect('meeting', '398672e7-62dd-5afd-846d-0237d49792fb')}
            className="glass-card-interactive" 
            style={{ padding: '16px 18px', borderLeft: '4px solid #f59e0b' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-coaching">Sales Coaching</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>M03 · Asterloom</span>
            </div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginTop: 10 }}>
              Pricing Quote Discrepancy Mid-Demo
            </h4>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
              Customer spotted quoted price jump from INR 26,000 to INR 39,000. Rep omitted setup fee upfront.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, color: '#818cf8', fontSize: 12, fontWeight: 600 }}>
              <span>Inspect turn evidence</span>
              <ArrowUpRight size={14} />
            </div>
          </div>

          {/* Cedarwave Alert */}
          <div 
            onClick={() => handleInspect('meeting', 'b0f79b3d-37ba-52f9-b2bc-58b159dd6d91')}
            className="glass-card-interactive" 
            style={{ padding: '16px 18px', borderLeft: '4px solid #f43f5e' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-review">Human Review</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>M04 · Cedarwave</span>
            </div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginTop: 10 }}>
              Credit vs Prepaid Card Deadlock
            </h4>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
              Existing customer programme expiring. Client requires corporate credit; SpendNest is prepaid.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, color: '#818cf8', fontSize: 12, fontWeight: 600 }}>
              <span>Inspect turn evidence</span>
              <ArrowUpRight size={14} />
            </div>
          </div>

          {/* Brookmint Alert */}
          <div 
            onClick={() => handleInspect('meeting', '4b5b9192-f3fc-505a-8e77-4d2ffaa54594')}
            className="glass-card-interactive" 
            style={{ padding: '16px 18px', borderLeft: '4px solid #8b5cf6' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-customer">Customer Bug</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>M09 · Brookmint</span>
            </div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginTop: 10 }}>
              Reset Token Immediate Expiration Bug
            </h4>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
              Fresh password reset link expires instantly upon receipt during live onboarding triage.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, color: '#818cf8', fontSize: 12, fontWeight: 600 }}>
              <span>Inspect turn evidence</span>
              <ArrowUpRight size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
        
        {/* Route Distribution */}
        <div className="glass-panel" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Route Distribution</h3>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Multi-route tagged records counted per route</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {Object.entries(routeCounts).map(([route, count]) => {
              const maxCount = Math.max(...Object.values(routeCounts), 1);
              const pct = ((count / maxCount) * 100).toFixed(0);
              const colorMap: Record<string, string> = {
                'Deal Follow-up': 'var(--accent-indigo)',
                'Sales Coaching': 'var(--accent-amber)',
                'Customer Follow-up': 'var(--accent-cyan)',
                'Internal/Vendor': 'var(--accent-violet)',
                'Human Review': 'var(--accent-rose)',
              };
              const color = colorMap[route] || 'var(--accent-indigo)';

              return (
                <div key={route}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: '#fff', fontWeight: 500 }}>{route}</span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{count} assignments</span>
                  </div>
                  <div style={{ height: 8, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: color,
                      borderRadius: 4,
                      transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rep & Organiser Activity */}
        <div className="glass-panel" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Activity by Team Member</h3>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Call Rep vs Meeting Organiser</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(repActivity).map(([person, act]) => (
              <div 
                key={person} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 8
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: 'rgba(99, 102, 241, 0.2)',
                    color: '#818cf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 12
                  }}>
                    {person.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{person}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12 }}>
                  {act.calls > 0 && (
                    <span style={{ color: '#818cf8', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <PhoneCall size={12} /> {act.calls} calls
                    </span>
                  )}
                  {act.meetings > 0 && (
                    <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Video size={12} /> {act.meetings} mtgs
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
