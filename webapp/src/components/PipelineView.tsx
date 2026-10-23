import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  FileCheck, 
  Layers, 
  ShieldCheck, 
  ArrowRight,
  Database
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const PipelineView: React.FC = () => {
  const { 
    records, 
    revisions, 
    overrides, 
    analysisState, 
    importedBatches,
    importInitialBatch,
    importUpdateBatch,
    runDemoSetup,
    resetState,
    saveOverride
  } = useApp();

  const [lastResult, setLastResult] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const totalRecords = Object.keys(records).length;
  const m07Key = 'meeting::4f304fff-fd40-5cfc-a366-0a134c445c2a';
  const m07 = records[m07Key];
  const m07Rev = revisions[m07Key] || 0;
  const m07Turns = m07?.transcript_payload?.turns?.length || 0;
  const m07HasOverride = m07Key in overrides;

  const handleStep1 = () => {
    resetState();
    const res = importInitialBatch();
    setLastResult(res);
    setCurrentStep(2);
    confetti({ particleCount: 40, spread: 60 });
  };

  const handleStep2 = () => {
    const res = importInitialBatch();
    setLastResult(res);
    setCurrentStep(3);
  };

  const handleStep3 = () => {
    saveOverride(m07Key, ['Sales Coaching', 'Deal Follow-up'], 'Replay test manual override', ['Manual coaching priority assigned']);
    setLastResult({ action: 'Manual route override saved on M07 (Willowfield Trust)' });
    setCurrentStep(4);
    confetti({ particleCount: 40, spread: 60 });
  };

  const handleStep4 = () => {
    const res = importUpdateBatch();
    setLastResult(res);
    setCurrentStep(5);
    confetti({ particleCount: 70, spread: 80 });
  };

  const handleStep5 = () => {
    const res = importInitialBatch();
    setLastResult(res);
    confetti({ particleCount: 100, spread: 100 });
  };

  return (
    <div style={{ padding: '0 24px 32px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      {/* Overview Banner */}
      <div className="glass-panel" style={{ padding: '22px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
            Data Pipeline, Replay Engine & Deduplication Test
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Verifies idempotent batch intake, revision-ordering, late transcript ingestion, and manual override persistence.
          </p>
        </div>

        <button 
          onClick={runDemoSetup}
          className="btn-primary"
          style={{ fontSize: 13, padding: '10px 18px' }}
        >
          🎬 Run Full 1-Click Demo Setup
        </button>
      </div>

      {/* Interactive Step-by-Step Sequence */}
      <div className="glass-panel" style={{ padding: '24px 28px' }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 18 }}>
          Required Replay Verification Steps
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          
          {/* Step 1: Initial Import */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', borderRadius: 10, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-indigo)', textTransform: 'uppercase' }}>Step 1</span>
              {totalRecords === 44 && <CheckCircle2 size={16} color="#10b981" />}
            </div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: '8px 0 6px 0' }}>
              Initial Batch Intake
            </h4>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
              Imports `01_initial.json`. Produces 44 records with 17 usable transcripts. M07 arrives without turns.
            </p>
            <button onClick={handleStep1} className="btn-secondary" style={{ width: '100%', fontSize: 12, justifyContent: 'center' }}>
              1. Import Initial Batch
            </button>
          </div>

          {/* Step 2: Repeat Import */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', borderRadius: 10, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-indigo)', textTransform: 'uppercase' }}>Step 2</span>
              {lastResult?.skipped_count === 44 && <CheckCircle2 size={16} color="#10b981" />}
            </div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: '8px 0 6px 0' }}>
              Idempotence & Duplicate Check
            </h4>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
              Re-imports the initial batch. Total records must remain exactly 44 (0 duplicate additions).
            </p>
            <button onClick={handleStep2} className="btn-secondary" style={{ width: '100%', fontSize: 12, justifyContent: 'center' }}>
              2. Re-import Initial Batch
            </button>
          </div>

          {/* Step 3: Manual Override */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', borderRadius: 10, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-indigo)', textTransform: 'uppercase' }}>Step 3</span>
              {m07HasOverride && <CheckCircle2 size={16} color="#10b981" />}
            </div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: '8px 0 6px 0' }}>
              Manual Route Override (M07)
            </h4>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
              Manually sets custom route `['Sales Coaching']` on M07 before the update batch arrives.
            </p>
            <button onClick={handleStep3} className="btn-secondary" style={{ width: '100%', fontSize: 12, justifyContent: 'center' }}>
              3. Set Manual Override on M07
            </button>
          </div>

          {/* Step 4: Update Batch */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', borderRadius: 10, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-indigo)', textTransform: 'uppercase' }}>Step 4</span>
              {m07Rev === 2 && <CheckCircle2 size={16} color="#10b981" />}
            </div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: '8px 0 6px 0' }}>
              Late Transcript Ingestion
            </h4>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
              Imports `02_update.json` (Revision 2). M07 gets 27 turns; manual route is preserved.
            </p>
            <button onClick={handleStep4} className="btn-secondary" style={{ width: '100%', fontSize: 12, justifyContent: 'center' }}>
              4. Import Update Batch
            </button>
          </div>

          {/* Step 5: Revision Protection */}
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', borderRadius: 10, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-indigo)', textTransform: 'uppercase' }}>Step 5</span>
              {m07Rev === 2 && m07HasOverride && <CheckCircle2 size={16} color="#10b981" />}
            </div>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: '8px 0 6px 0' }}>
              Revision Ordering Check
            </h4>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
              Re-imports Revision 1. Older revision cannot overwrite Revision 2. M07 remains intact.
            </p>
            <button onClick={handleStep5} className="btn-secondary" style={{ width: '100%', fontSize: 12, justifyContent: 'center' }}>
              5. Re-import Initial Again
            </button>
          </div>

        </div>
      </div>

      {/* Live State & Inspection Inspector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        
        {/* M07 Status Card */}
        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
            M07 (Willowfield Trust) Live Verification
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Current Revision:</span>
              <strong style={{ color: m07Rev === 2 ? '#10b981' : '#f59e0b' }}>Revision {m07Rev}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Supplied Transcript Turns:</span>
              <strong style={{ color: m07Turns > 0 ? '#10b981' : 'var(--text-muted)' }}>{m07Turns} turns</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Manual Route Override:</span>
              <strong style={{ color: m07HasOverride ? '#c084fc' : 'var(--text-muted)' }}>
                {m07HasOverride ? `Active (${overrides[m07Key]?.routes.join(', ')}) ✏️` : 'None'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Review State:</span>
              <span className={`badge ${analysisState[m07Key] === 'stale_pending_review' ? 'badge-stale' : 'badge-deal'}`}>
                {analysisState[m07Key] || 'Unprocessed'}
              </span>
            </div>
          </div>
        </div>

        {/* Last Batch Result Output */}
        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
            Execution Output Log
          </h4>
          <pre style={{
            background: '#060913',
            padding: 14,
            borderRadius: 8,
            color: '#34d399',
            fontSize: 12,
            fontFamily: 'monospace',
            maxHeight: 180,
            overflowY: 'auto'
          }}>
            {lastResult ? JSON.stringify(lastResult, null, 2) : 'Click any step above to run ingestion test.'}
          </pre>
        </div>

      </div>

    </div>
  );
};
