import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  BarChart3, 
  Inbox, 
  RefreshCw, 
  FileText, 
  Download, 
  Search, 
  Sparkles, 
  Zap, 
  ShieldCheck,
  Database 
} from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    records, 
    overrides, 
    analysisState, 
    activeTab, 
    setActiveTab, 
    searchQuery, 
    setSearchQuery,
    runDemoSetup,
    resetState
  } = useApp();

  const totalRecords = Object.keys(records).length;
  const usableTranscripts = Object.values(records).filter(r => {
    if (r.source_type === 'call') {
      return Boolean((r.payload as any)?.transcript?.trim());
    }
    return Boolean(r.transcript_payload?.turns?.some(t => t.text?.trim()));
  }).length;

  const reviewNeededCount = Object.values(analysisState).filter(
    s => s === 'needs_review' || s === 'stale_pending_review'
  ).length;

  const overrideCount = Object.keys(overrides).length;

  return (
    <header className="glass-panel" style={{ margin: '16px 24px', padding: '16px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)'
          }}>
            <Sparkles size={24} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>
                SpendNest
              </h1>
              <span style={{
                background: 'rgba(99, 102, 241, 0.2)',
                color: '#818cf8',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                borderRadius: 6,
                padding: '2px 8px',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase'
              }}>
                Revenue Intelligence Pro
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              Executive Sales & Meeting Intelligence Hub · 21 August 2026 (IST)
            </p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div style={{
          position: 'relative',
          minWidth: 260,
          flex: '1 1 280px',
          maxWidth: 420
        }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
          <input
            type="text"
            placeholder="Search transcripts, companies, reps, routes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-glass)',
              borderRadius: 10,
              color: '#fff',
              fontSize: 13,
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent-indigo)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border-glass)'}
          />
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button 
            onClick={runDemoSetup}
            className="btn-primary"
            style={{ fontSize: 13, padding: '8px 14px' }}
            title="Reset and load both initial & update batches"
          >
            <Zap size={14} />
            Demo Setup (Both Batches)
          </button>
          <button 
            onClick={resetState}
            className="btn-secondary"
            style={{ fontSize: 13, padding: '8px 12px' }}
            title="Reset application state"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Navigation & Live Counters */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 18,
        paddingTop: 14,
        borderTop: '1px solid var(--border-glass)',
        flexWrap: 'wrap',
        gap: 12
      }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {[
            { id: 'dashboard', label: 'Executive Dashboard', icon: BarChart3 },
            { id: 'powerbi', label: 'Tableau / Power BI Canvas', icon: Database },
            { id: 'inbox', label: 'Intelligence Inbox', icon: Inbox, count: totalRecords },
            { id: 'pipeline', label: 'Replay & Pipeline', icon: RefreshCw },
            { id: 'brief', label: 'Manager Brief', icon: FileText },
            { id: 'export', label: 'Export & Manifest Hub', icon: Download },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: isActive ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.25))' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  boxShadow: isActive ? 'inset 0 0 0 1px rgba(99, 102, 241, 0.5)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={16} color={isActive ? 'var(--accent-indigo)' : 'var(--text-muted)'} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span style={{
                    background: isActive ? 'var(--accent-indigo)' : 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    borderRadius: 999,
                    padding: '1px 6px',
                    fontSize: 11
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Live Status Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
            <span className="pulse-dot" style={{ background: '#10b981' }}></span>
            <span>Usable Texts: <strong>{usableTranscripts}/{totalRecords}</strong></span>
          </div>
          {reviewNeededCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#fbbf24' }}>
              <span className="pulse-dot" style={{ background: '#f59e0b' }}></span>
              <span>Needs Review: <strong>{reviewNeededCount}</strong></span>
            </div>
          )}
          {overrideCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#c084fc' }}>
              <ShieldCheck size={14} color="#8b5cf6" />
              <span>Overrides: <strong>{overrideCount}</strong></span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
