import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  BarChart, 
  Table, 
  Layers, 
  Download, 
  Filter, 
  Sparkles, 
  Code2, 
  ExternalLink,
  ChevronRight,
  Database,
  Check
} from 'lucide-react';

export const PowerBIView: React.FC = () => {
  const { records, getRecordAnalysis } = useApp();

  const [selectedRep, setSelectedRep] = useState<string>('all');
  const [selectedRoute, setSelectedRoute] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showDaxModal, setShowDaxModal] = useState(false);

  const recordList = Object.values(records);

  // Cross-filtering
  const filtered = recordList.filter(rec => {
    const isCall = rec.source_type === 'call';
    const p = rec.payload as any;
    const rep = isCall ? (p.rep_name || p.rep_email || 'Unknown') : (p.organizer_email ? p.organizer_email.split('@')[0] : 'Unknown');
    const analysis = getRecordAnalysis(rec);

    if (selectedType !== 'all' && rec.source_type !== selectedType) return false;
    if (selectedRep !== 'all' && rep !== selectedRep) return false;
    if (selectedRoute !== 'all' && !analysis.routes.includes(selectedRoute)) return false;

    return true;
  });

  const totalRecords = filtered.length;
  const calls = filtered.filter(r => r.source_type === 'call');
  const meetings = filtered.filter(r => r.source_type === 'meeting');

  const usableCount = filtered.filter(r => {
    if (r.source_type === 'call') return Boolean((r.payload as any)?.transcript?.trim());
    return Boolean(r.transcript_payload?.turns?.some(t => t.text?.trim()));
  }).length;

  const coverageRate = totalRecords > 0 ? ((usableCount / totalRecords) * 100).toFixed(1) : '0';

  const callsWithConnectedInfo = calls.filter(c => (c.payload as any)?.is_connected !== undefined && (c.payload as any)?.is_connected !== null);
  const connectedCalls = callsWithConnectedInfo.filter(c => (c.payload as any)?.is_connected === true).length;
  const connectionRate = callsWithConnectedInfo.length > 0
    ? ((connectedCalls / callsWithConnectedInfo.length) * 100).toFixed(1)
    : '0';

  // Aggregate by Rep
  const repAgg: Record<string, { calls: number; meetings: number; usable: number; duration: number }> = {};
  filtered.forEach(r => {
    const isCall = r.source_type === 'call';
    const p = r.payload as any;
    const name = isCall ? (p.rep_name || p.rep_email || 'Unknown Rep') : (p.organizer_email ? p.organizer_email.split('@')[0] : 'Unknown Organiser');
    if (!repAgg[name]) repAgg[name] = { calls: 0, meetings: 0, usable: 0, duration: 0 };
    if (isCall) repAgg[name].calls++;
    else repAgg[name].meetings++;
    if (isCall ? p.transcript?.trim() : r.transcript_payload?.turns?.length) repAgg[name].usable++;
    repAgg[name].duration += (p.duration_seconds || 0);
  });

  // Aggregate by Route
  const routeAgg: Record<string, number> = {
    'Deal Follow-up': 0,
    'Sales Coaching': 0,
    'Customer Follow-up': 0,
    'Internal/Vendor': 0,
    'Human Review': 0,
  };

  filtered.forEach(r => {
    const an = getRecordAnalysis(r);
    (an.routes || []).forEach(rt => {
      if (routeAgg[rt] !== undefined) routeAgg[rt]++;
      else routeAgg[rt] = 1;
    });
  });

  return (
    <div style={{ padding: '0 24px 32px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      {/* Power BI Canvas Ribbon */}
      <div style={{
        background: '#181b24',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 14,
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            background: '#e0a920',
            color: '#000',
            fontWeight: 800,
            fontSize: 11,
            padding: '3px 8px',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}>
            <Database size={13} />
            POWER BI / TABLEAU VIEW
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
            Star Schema Data Model Active (6 Fact & Dimension Tables)
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setShowDaxModal(true)}
            className="btn-secondary"
            style={{ fontSize: 12, padding: '6px 12px', background: 'rgba(224, 169, 32, 0.15)', borderColor: '#e0a920', color: '#f7d070' }}
          >
            <Code2 size={14} />
            DAX / Tableau Formulas
          </button>
          <a
            href="file:///c:/Users/Ethukrishna/Downloads/candidate-v1.0 (3)_layout_fixed (1)(2) (3)/candidate/powerbi_tableau_export"
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
            style={{ fontSize: 12, padding: '6px 14px', background: 'linear-gradient(135deg, #e0a920, #f59e0b)', color: '#000' }}
          >
            <Download size={14} />
            Open CSV Datasets Folder
          </a>
        </div>
      </div>

      {/* Slicers Row (Interactive Power BI Slicers) */}
      <div style={{
        background: '#111520',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 10,
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#e0a920' }}>
          <Filter size={14} />
          <span>POWER BI SLICERS:</span>
        </div>

        {/* Slicer: Source Type */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Type:</span>
          <select 
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={{ background: '#1c2230', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', fontSize: 12, padding: '5px 10px' }}
          >
            <option value="all">All Channels (Calls & Meetings)</option>
            <option value="call">Calls Only (30)</option>
            <option value="meeting">Meetings Only (14)</option>
          </select>
        </div>

        {/* Slicer: Route */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Route:</span>
          <select 
            value={selectedRoute}
            onChange={(e) => setSelectedRoute(e.target.value)}
            style={{ background: '#1c2230', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', fontSize: 12, padding: '5px 10px' }}
          >
            <option value="all">All Routes</option>
            {Object.keys(routeAgg).map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Slicer: Team Member */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Team Member:</span>
          <select 
            value={selectedRep}
            onChange={(e) => setSelectedRep(e.target.value)}
            style={{ background: '#1c2230', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: '#fff', fontSize: 12, padding: '5px 10px' }}
          >
            <option value="all">All Reps & Organisers</option>
            {Object.keys(repAgg).map(rep => (
              <option key={rep} value={rep}>{rep}</option>
            ))}
          </select>
        </div>

        {(selectedRep !== 'all' || selectedRoute !== 'all' || selectedType !== 'all') && (
          <button
            onClick={() => { setSelectedRep('all'); setSelectedRoute('all'); setSelectedType('all'); }}
            style={{ background: 'transparent', border: 'none', color: '#f43f5e', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Clear All Slicers
          </button>
        )}
      </div>

      {/* Power BI Card Visuals Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        
        {/* Card 1: Total Records */}
        <div style={{ background: '#151922', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '16px 18px', borderTop: '3px solid #e0a920' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>[Total Records]</span>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginTop: 6 }}>{totalRecords}</div>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>COUNTROWS(fact_conversations)</span>
        </div>

        {/* Card 2: Usable Transcripts */}
        <div style={{ background: '#151922', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '16px 18px', borderTop: '3px solid #10b981' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>[Transcript Coverage %]</span>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#10b981', marginTop: 6 }}>{coverageRate}%</div>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{usableCount} with text / {totalRecords} records</span>
        </div>

        {/* Card 3: Call Connection Rate */}
        <div style={{ background: '#151922', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '16px 18px', borderTop: '3px solid #06b6d4' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>[Call Connection %]</span>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#06b6d4', marginTop: 6 }}>{connectionRate}%</div>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{connectedCalls} / {callsWithConnectedInfo.length} calls</span>
        </div>

        {/* Card 4: Meeting Ratio */}
        <div style={{ background: '#151922', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '16px 18px', borderTop: '3px solid #8b5cf6' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>[Meeting vs Call Ratio]</span>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#c084fc', marginTop: 6 }}>
            {meetings.length}:{calls.length}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{meetings.length} mtgs · {calls.length} calls</span>
        </div>
      </div>

      {/* Visuals Canvas: Clustered Bar + Matrix Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
        
        {/* Visual 1: Clustered Bar Visual (Routes) */}
        <div style={{ background: '#151922', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Route Allocations (Many-to-Many Bridge)</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Clustered Bar</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(routeAgg).map(([route, count]) => {
              const max = Math.max(...Object.values(routeAgg), 1);
              const width = Math.round((count / max) * 100);
              return (
                <div key={route}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: '#fff' }}>{route}</span>
                    <span style={{ color: '#e0a920', fontWeight: 700 }}>{count}</span>
                  </div>
                  <div style={{ height: 12, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${width}%`, height: '100%', background: '#e0a920', borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Visual 2: Power BI Matrix Visual (Team Performance) */}
        <div style={{ background: '#151922', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Team Performance Matrix</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Matrix Visual</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: 'var(--text-primary)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px 10px' }}>Team Member</th>
                  <th style={{ padding: '8px 10px' }}>Calls</th>
                  <th style={{ padding: '8px 10px' }}>Mtgs</th>
                  <th style={{ padding: '8px 10px' }}>Usable</th>
                  <th style={{ padding: '8px 10px' }}>Total Min</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(repAgg).map(([name, data]) => (
                  <tr key={name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: '#fff' }}>{name}</td>
                    <td style={{ padding: '8px 10px', color: '#818cf8' }}>{data.calls}</td>
                    <td style={{ padding: '8px 10px', color: '#34d399' }}>{data.meetings}</td>
                    <td style={{ padding: '8px 10px', color: '#e0a920' }}>{data.usable}</td>
                    <td style={{ padding: '8px 10px' }}>{Math.round(data.duration / 60)}m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* DAX Formulas Modal */}
      {showDaxModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ width: 560, background: '#0f172a', border: '1px solid var(--border-glass)', borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Code2 size={20} color="#e0a920" />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Power BI DAX Measures & Tableau Formulas</h3>
              </div>
              <button onClick={() => setShowDaxModal(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12 }}>
              <div>
                <span style={{ color: '#e0a920', fontWeight: 600 }}>1. Total Selected Records (DAX):</span>
                <pre style={{ background: '#060913', padding: 8, borderRadius: 6, color: '#38bdf8', marginTop: 4 }}>Total Records = COUNTROWS(fact_conversations)</pre>
              </div>

              <div>
                <span style={{ color: '#e0a920', fontWeight: 600 }}>2. Usable Transcript Coverage % (DAX):</span>
                <pre style={{ background: '#060913', padding: 8, borderRadius: 6, color: '#38bdf8', marginTop: 4 }}>
Coverage % = 
DIVIDE(
    CALCULATE(COUNTROWS(fact_conversations), fact_conversations[has_usable_transcript] = "Yes"),
    [Total Records],
    0
)
                </pre>
              </div>

              <div>
                <span style={{ color: '#e0a920', fontWeight: 600 }}>3. Call Connection Rate (DAX):</span>
                <pre style={{ background: '#060913', padding: 8, borderRadius: 6, color: '#38bdf8', marginTop: 4 }}>
{`Connection Rate % = 
DIVIDE(
    CALCULATE(COUNTROWS(fact_conversations), fact_conversations[is_connected] = "Connected"),
    CALCULATE(COUNTROWS(fact_conversations), fact_conversations[is_connected] IN {"Connected", "Not Connected"}),
    0
)`}
                </pre>
              </div>
            </div>

            <button 
              onClick={() => setShowDaxModal(false)} 
              className="btn-primary" 
              style={{ marginTop: 20, width: '100%', justifyContent: 'center' }}
            >
              Close Guide
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
