import React, { useState, useEffect } from 'react';
import { useApp, isUsableTranscript } from '../context/AppContext';
import { 
  PhoneCall, 
  Video, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  User, 
  Building2, 
  Edit3, 
  Play, 
  Pause, 
  Copy, 
  Check, 
  FileText, 
  Bot, 
  MessageSquare, 
  ShieldCheck, 
  Filter
} from 'lucide-react';
import { SourceRecord } from '../types';

export const InboxView: React.FC = () => {
  const { 
    records, 
    selectedRecordKey, 
    setSelectedRecordKey, 
    searchQuery, 
    filters, 
    setFilters,
    getRecordAnalysis,
    saveOverride,
    clearOverride
  } = useApp();

  const [activeTab, setActiveTab] = useState<'analysis' | 'transcript' | 'raw'>('analysis');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit Modal State
  const [editRoutes, setEditRoutes] = useState<string[]>([]);
  const [editNote, setEditNote] = useState('');
  const [editReason, setEditReason] = useState('');

  const recordList = Object.values(records);

  // Filter records
  const filteredRecords = recordList.filter(rec => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const p = rec.payload as any;
      const refMatch = rec.record_ref.toLowerCase().includes(q);
      const companyMatch = p.company_name?.toLowerCase().includes(q);
      const contactMatch = p.contact_name?.toLowerCase().includes(q);
      const titleMatch = p.title?.toLowerCase().includes(q);
      const repMatch = p.rep_name?.toLowerCase().includes(q) || p.rep_email?.toLowerCase().includes(q) || p.organizer_email?.toLowerCase().includes(q);
      const transcriptMatch = (p.transcript || '').toLowerCase().includes(q) ||
        (rec.transcript_payload?.turns || []).some(t => t.text.toLowerCase().includes(q));

      if (!refMatch && !companyMatch && !contactMatch && !titleMatch && !repMatch && !transcriptMatch) {
        return false;
      }
    }

    // Source Type Filter
    if (filters.sourceType !== 'all' && rec.source_type !== filters.sourceType) {
      return false;
    }

    // Route Filter
    const analysis = getRecordAnalysis(rec);
    if (filters.route !== 'all' && !analysis.routes.includes(filters.route)) {
      return false;
    }

    // Review State Filter
    if (filters.reviewState !== 'all' && analysis.review_state !== filters.reviewState) {
      return false;
    }

    return true;
  });

  const selectedRecord: SourceRecord | undefined = records[selectedRecordKey || ''] || filteredRecords[0];

  useEffect(() => {
    if (selectedRecord && (!selectedRecordKey || !(selectedRecordKey in records))) {
      setSelectedRecordKey(`${selectedRecord.source_type}::${selectedRecord.source_id}`);
    }
  }, [selectedRecord, selectedRecordKey, records]);

  // Audio simulation timer
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1 * playbackSpeed;
        });
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  if (!selectedRecord) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>No conversations found matching filters. Adjust your search or import a batch in Pipeline.</p>
      </div>
    );
  }

  const selectedAnalysis = getRecordAnalysis(selectedRecord);
  const p = selectedRecord.payload as any;
  const isCall = selectedRecord.source_type === 'call';
  const title = isCall 
    ? (p.company_name ? `${p.company_name} · ${p.contact_name || 'Outreach'}` : `Call ${selectedRecord.record_ref}`)
    : (p.title || `Meeting ${selectedRecord.record_ref}`);

  const repOrOrganizer = isCall
    ? (p.rep_name || p.rep_email || 'Unknown Rep')
    : (p.organizer_email ? p.organizer_email.split('@')[0] : 'Unknown Organiser');

  const durationMin = Math.round((p.duration_seconds || 0) / 60);

  const turns = selectedRecord.transcript_payload?.turns || [];
  const callTranscript = p.transcript || '';
  const hasText = isUsableTranscript(selectedRecord);

  const openEditModal = () => {
    setEditRoutes([...selectedAnalysis.routes]);
    setEditNote(selectedAnalysis.overrideNote || '');
    setEditReason(selectedAnalysis.route_reasons?.[0] || '');
    setIsEditModalOpen(true);
  };

  const handleSaveOverride = () => {
    const key = `${selectedRecord.source_type}::${selectedRecord.source_id}`;
    saveOverride(key, editRoutes, editNote, [editReason || 'Manual manager triage']);
    setIsEditModalOpen(false);
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(selectedRecord, null, 2));
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const availableRoutes = [
    'Deal Follow-up',
    'Sales Coaching',
    'Customer Follow-up',
    'Internal/Vendor',
    'Human Review'
  ];

  return (
    <div style={{ padding: '0 24px 32px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* Filter Chips Bar */}
      <div className="glass-panel" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
          <Filter size={15} color="var(--accent-indigo)" />
          <span>Filters:</span>
        </div>

        {/* Source Type Filter */}
        <select 
          value={filters.sourceType}
          onChange={(e) => setFilters(prev => ({ ...prev, sourceType: e.target.value as any }))}
          style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-glass)', borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 12 }}
        >
          <option value="all">All Source Types</option>
          <option value="call">Calls Only</option>
          <option value="meeting">Meetings Only</option>
        </select>

        {/* Route Filter */}
        <select 
          value={filters.route}
          onChange={(e) => setFilters(prev => ({ ...prev, route: e.target.value }))}
          style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-glass)', borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 12 }}
        >
          <option value="all">All Routes</option>
          {availableRoutes.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        {/* Review State Filter */}
        <select 
          value={filters.reviewState}
          onChange={(e) => setFilters(prev => ({ ...prev, reviewState: e.target.value }))}
          style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-glass)', borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 12 }}
        >
          <option value="all">All Review States</option>
          <option value="reviewed">Reviewed</option>
          <option value="needs_review">Needs Review</option>
          <option value="stale_pending_review">Stale Pending Review</option>
        </select>

        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          Showing <strong>{filteredRecords.length}</strong> of {recordList.length} records
        </span>
      </div>

      {/* Main Split Interface */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, minHeight: 680 }}>
        
        {/* Left Pane: Conversation List */}
        <div className="glass-panel" style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 820, overflowY: 'auto' }}>
          {filteredRecords.map(rec => {
            const key = `${rec.source_type}::${rec.source_id}`;
            const isSelected = selectedRecordKey === key;
            const recP = rec.payload as any;
            const recAn = getRecordAnalysis(rec);
            const recIsCall = rec.source_type === 'call';
            const recTitle = recIsCall 
              ? (recP.company_name ? `${recP.company_name}` : `Call ${rec.record_ref}`)
              : (recP.title ? recP.title.split('/')[0].trim() : `Meeting ${rec.record_ref}`);

            const recDuration = Math.round((recP.duration_seconds || 0) / 60);

            return (
              <div
                key={key}
                onClick={() => setSelectedRecordKey(key)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255, 255, 255, 0.02)',
                  border: isSelected ? '1px solid var(--accent-indigo)' : '1px solid transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ 
                      fontWeight: 700, 
                      fontSize: 12, 
                      color: isSelected ? '#fff' : 'var(--accent-indigo)',
                      background: 'rgba(99, 102, 241, 0.15)',
                      padding: '2px 6px',
                      borderRadius: 4
                    }}>
                      {rec.record_ref}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {recIsCall ? 'Call' : 'Meeting'} · {recDuration}m
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {recAn.isOverridden && (
                      <span title="Manually Overridden" style={{ fontSize: 12 }}>✏️</span>
                    )}
                    {recAn.analysis_freshness === 'stale' ? (
                      <span className="badge badge-stale" style={{ fontSize: 9 }}>Update</span>
                    ) : recAn.review_state === 'needs_review' ? (
                      <span className="badge badge-review" style={{ fontSize: 9 }}>Review</span>
                    ) : (
                      <CheckCircle2 size={13} color="#10b981" />
                    )}
                  </div>
                </div>

                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {recTitle}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {recAn.routes.map(r => (
                    <span 
                      key={r}
                      style={{
                        fontSize: 10,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Pane: Conversation Inspector */}
        <div className="glass-panel" style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Header Card */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: isCall ? 'rgba(99, 102, 241, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isCall ? '#818cf8' : '#34d399'
              }}>
                {isCall ? <PhoneCall size={24} /> : <Video size={24} />}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-indigo)' }}>
                    [{selectedRecord.record_ref}]
                  </span>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
                    {title}
                  </h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <User size={13} /> {repOrOrganizer}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={13} /> {durationMin} minutes ({p.duration_seconds || 0}s)
                  </span>
                  {isCall && p.is_connected !== undefined && (
                    <span style={{ color: p.is_connected ? '#10b981' : '#f43f5e' }}>
                      ● {p.is_connected ? 'Connected' : 'Not Connected'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button 
                onClick={openEditModal}
                className="btn-secondary"
                style={{ fontSize: 12, padding: '7px 12px' }}
              >
                <Edit3 size={14} />
                Edit Route {selectedAnalysis.isOverridden && '✏️'}
              </button>
              {selectedAnalysis.isOverridden && (
                <button 
                  onClick={() => clearOverride(`${selectedRecord.source_type}::${selectedRecord.source_id}`)}
                  className="btn-secondary"
                  style={{ fontSize: 12, padding: '7px 10px', color: '#f43f5e' }}
                  title="Reset to default route"
                >
                  Reset Route
                </button>
              )}
            </div>
          </div>

          {/* Stale Warning Banner (for M07 after late update) */}
          {selectedAnalysis.analysis_freshness === 'stale' && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px dashed #f59e0b',
              borderRadius: 10,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              color: '#fef3c7',
              fontSize: 13
            }}>
              <AlertTriangle size={18} color="#f59e0b" />
              <div>
                <strong>Late-arriving transcript received via update batch!</strong>
                <p style={{ fontSize: 12, color: '#fde68a', marginTop: 2 }}>
                  This record arrived in Revision 2. Please review the newly supplied 27 transcript turns and confirm or correct the assigned routes.
                </p>
              </div>
            </div>
          )}

          {/* Simulated Audio Waveform Player */}
          {hasText && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid var(--border-glass)',
              borderRadius: 12,
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 16
            }}>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-violet))',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#fff',
                  boxShadow: '0 0 12px rgba(99, 102, 241, 0.5)'
                }}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 2 }} />}
              </button>

              {/* Animated Waveform */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 24, padding: '0 6px' }}>
                {[1, 2, 3, 4, 5, 2, 4, 1, 3, 5, 2, 4, 3, 1].map((_, i) => (
                  <div 
                    key={i} 
                    className={isPlaying ? "wave-bar" : ""} 
                    style={{ 
                      width: 3, 
                      height: isPlaying ? undefined : (i % 3 === 0 ? 16 : 8), 
                      background: isPlaying ? 'var(--accent-indigo)' : 'rgba(255, 255, 255, 0.2)',
                      borderRadius: 2
                    }} 
                  />
                ))}
              </div>

              {/* Progress Scrubber */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={playbackProgress}
                  onChange={(e) => setPlaybackProgress(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-indigo)', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>{Math.floor((playbackProgress / 100) * (p.duration_seconds || 120))}s</span>
                  <span>Audio Sync Emulation</span>
                  <span>{p.duration_seconds || 120}s</span>
                </div>
              </div>

              {/* Speed Controller */}
              <button
                onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  borderRadius: 6,
                  padding: '4px 8px',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {playbackSpeed}x
              </button>
            </div>
          )}

          {/* Content Sub-Tabs */}
          <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border-glass)', paddingBottom: 10 }}>
            {[
              { id: 'analysis', label: 'AI Intelligence & Routes', icon: Bot },
              { id: 'transcript', label: `Transcript (${isCall ? 'Text' : `${turns.length} turns`})`, icon: MessageSquare },
              { id: 'raw', label: 'Raw Payload JSON', icon: FileText },
            ].map(tab => {
              const Icon = tab.icon;
              const isCurrent = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: isCurrent ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                    color: isCurrent ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  <Icon size={15} color={isCurrent ? 'var(--accent-indigo)' : 'var(--text-muted)'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: AI Intelligence */}
          {activeTab === 'analysis' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              
              {/* Route Assignment Badges */}
              <div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                  Assigned Route Destinations
                </span>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {selectedAnalysis.routes.map(r => (
                    <span 
                      key={r}
                      className={
                        r === 'Deal Follow-up' ? 'badge badge-deal' :
                        r === 'Sales Coaching' ? 'badge badge-coaching' :
                        r === 'Customer Follow-up' ? 'badge badge-customer' :
                        r === 'Internal/Vendor' ? 'badge badge-internal' :
                        'badge badge-review'
                      }
                      style={{ fontSize: 12, padding: '6px 12px' }}
                    >
                      {r} {selectedAnalysis.isOverridden && '✏️'}
                    </span>
                  ))}
                </div>
              </div>

              {/* Rationale & Reasons */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px 18px', borderRadius: 10, border: '1px solid var(--border-glass)' }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-indigo)', marginBottom: 8 }}>
                  Route Assignment Rationale
                </h4>
                <ul style={{ paddingLeft: 18, color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.6 }}>
                  {selectedAnalysis.route_reasons.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
                {selectedAnalysis.isOverridden && selectedAnalysis.overrideNote && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed rgba(255, 255, 255, 0.1)', fontSize: 12, color: '#c084fc' }}>
                    <strong>Manager Note:</strong> {selectedAnalysis.overrideNote}
                  </div>
                )}
              </div>

              {/* Summary */}
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>
                  Executive Conversation Summary
                </h4>
                <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                  {selectedAnalysis.summary}
                </p>
              </div>

              {/* Verbatim Evidence Quotes */}
              {selectedAnalysis.evidence_quotes.length > 0 && (
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', marginBottom: 8 }}>
                    Verbatim Evidence Citations
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedAnalysis.evidence_quotes.map((quote, i) => (
                      <div 
                        key={i}
                        style={{
                          background: 'rgba(245, 158, 11, 0.08)',
                          borderLeft: '3px solid #f59e0b',
                          padding: '10px 14px',
                          borderRadius: '0 8px 8px 0',
                          fontSize: 13,
                          fontStyle: 'italic',
                          color: '#fef3c7'
                        }}
                      >
                        {quote}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Steps & Ownership */}
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: 8 }}>
                  Action Items & Next Steps
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedAnalysis.next_steps.map((step, i) => (
                    <div 
                      key={i} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 10, 
                        fontSize: 13, 
                        color: 'var(--text-primary)',
                        background: 'rgba(255, 255, 255, 0.02)',
                        padding: '8px 12px',
                        borderRadius: 8
                      }}
                    >
                      <CheckCircle2 size={16} color="#10b981" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Tab 2: Transcript Viewer */}
          {activeTab === 'transcript' && (
            <div style={{ maxHeight: 520, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {!hasText ? (
                <div style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
                  <AlertTriangle size={32} color="#f59e0b" style={{ margin: '0 auto 12px auto' }} />
                  <p>No usable transcript text supplied initially for this record.</p>
                  <p style={{ fontSize: 12, marginTop: 4 }}>
                    If this is M07, import the update batch in the Replay Pipeline to receive the 27 late turns.
                  </p>
                </div>
              ) : isCall ? (
                <div style={{ 
                  background: 'rgba(15, 23, 42, 0.6)', 
                  padding: 18, 
                  borderRadius: 10, 
                  lineHeight: 1.7, 
                  fontSize: 14, 
                  whiteSpace: 'pre-wrap',
                  color: 'var(--text-primary)'
                }}>
                  {callTranscript}
                </div>
              ) : (
                turns.map((turn, i) => (
                  <div 
                    key={i}
                    style={{
                      background: turn.speaker.toLowerCase().includes('team') ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: 10,
                      padding: '12px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ 
                        fontSize: 12, 
                        fontWeight: 700, 
                        color: turn.speaker.toLowerCase().includes('team') ? '#818cf8' : '#34d399' 
                      }}>
                        {turn.speaker} (Turn {i + 1})
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {turn.timecode || `${Math.round(turn.starts_at_seconds)}s`}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, marginTop: 4 }}>
                      {turn.text}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 3: Raw JSON Inspector */}
          {activeTab === 'raw' && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={copyJson}
                className="btn-secondary"
                style={{ position: 'absolute', top: 12, right: 12, fontSize: 11, padding: '5px 10px' }}
              >
                {copiedRaw ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                <span>{copiedRaw ? 'Copied' : 'Copy JSON'}</span>
              </button>
              <pre style={{
                background: '#060913',
                padding: 16,
                borderRadius: 10,
                fontSize: 12,
                color: '#38bdf8',
                maxHeight: 500,
                overflowX: 'auto',
                lineHeight: 1.5
              }}>
                {JSON.stringify(selectedRecord, null, 2)}
              </pre>
            </div>
          )}

        </div>

      </div>

      {/* Manual Route Override Modal */}
      {isEditModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-panel" style={{ width: 480, padding: 24, background: '#0f172a' }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 14 }}>
              Manual Route Override — {selectedRecord.record_ref}
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Select assigned routes and enter manager justification. Preserved through revisions and app reloads.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Destination Routes:</span>
              {availableRoutes.map(route => {
                const checked = editRoutes.includes(route);
                return (
                  <label key={route} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer', color: '#fff' }}>
                    <input 
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        if (checked) {
                          setEditRoutes(editRoutes.filter(r => r !== route));
                        } else {
                          setEditRoutes([...editRoutes, route]);
                        }
                      }}
                      style={{ accentColor: 'var(--accent-indigo)' }}
                    />
                    <span>{route}</span>
                  </label>
                );
              })}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Reason for Route Change:
              </label>
              <input 
                type="text"
                placeholder="e.g. Discussed competitor integration, coaching needed"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 8, color: '#fff', fontSize: 13 }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                Manager Note:
              </label>
              <textarea 
                rows={2}
                placeholder="Internal memo on why this override was placed..."
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: 8, color: '#fff', fontSize: 13 }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="btn-secondary"
                style={{ fontSize: 13 }}
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveOverride}
                className="btn-primary"
                style={{ fontSize: 13 }}
              >
                Save Override ✏️
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
