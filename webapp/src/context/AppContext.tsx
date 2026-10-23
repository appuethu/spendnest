import React, { createContext, useContext, useState, useEffect } from 'react';
import { SourceRecord, ManualOverride, RecordAnalysis, BatchImportResult, ReviewState } from '../types';
import { PREGENERATED_ANALYSES, DEFAULT_NO_TRANSCRIPT_ANALYSIS, DEFAULT_BACKGROUND_CALL_ANALYSIS } from '../data/analysisData';

import initialBatch from '../data/01_initial.json';
import updateBatch from '../data/02_update.json';

export function recordKey(sourceType: string, sourceId: string): string {
  return `${sourceType}::${sourceId}`;
}

export function isUsableTranscript(record: SourceRecord): boolean {
  if (record.source_type === 'call') {
    const transcript = (record.payload as any)?.transcript;
    return Boolean(transcript && transcript.trim());
  } else {
    const tp = record.transcript_payload;
    if (!tp) return false;
    const turns = tp.turns || [];
    return Boolean(turns.length > 0 && turns.some(t => t.text && t.text.trim()));
  }
}

interface AppContextType {
  records: Record<string, SourceRecord>;
  revisions: Record<string, number>;
  overrides: Record<string, ManualOverride>;
  analysisState: Record<string, ReviewState>;
  importedBatches: string[];
  selectedRecordKey: string | null;
  setSelectedRecordKey: (key: string | null) => void;
  activeTab: 'dashboard' | 'inbox' | 'pipeline' | 'brief' | 'export' | 'powerbi';
  setActiveTab: (tab: 'dashboard' | 'inbox' | 'pipeline' | 'brief' | 'export' | 'powerbi') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filters: {
    sourceType: 'all' | 'call' | 'meeting';
    teamMember: string;
    route: string;
    reviewState: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    sourceType: 'all' | 'call' | 'meeting';
    teamMember: string;
    route: string;
    reviewState: string;
  }>>;
  importInitialBatch: () => BatchImportResult;
  importUpdateBatch: () => BatchImportResult;
  runDemoSetup: () => void;
  resetState: () => void;
  saveOverride: (key: string, routes: string[], note: string, reasons: string[]) => void;
  clearOverride: (key: string) => void;
  getRecordAnalysis: (record: SourceRecord) => RecordAnalysis & { isOverridden: boolean; overrideNote?: string };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'spendnest_revenue_intelligence_state_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<Record<string, SourceRecord>>({});
  const [revisions, setRevisions] = useState<Record<string, number>>({});
  const [overrides, setOverrides] = useState<Record<string, ManualOverride>>({});
  const [analysisState, setAnalysisState] = useState<Record<string, ReviewState>>({});
  const [importedBatches, setImportedBatches] = useState<string[]>([]);
  const [selectedRecordKey, setSelectedRecordKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inbox' | 'pipeline' | 'brief' | 'export' | 'powerbi'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<{
    sourceType: 'all' | 'call' | 'meeting';
    teamMember: string;
    route: string;
    reviewState: string;
  }>({
    sourceType: 'all',
    teamMember: 'all',
    route: 'all',
    reviewState: 'all',
  });

  // Load from LocalStorage or initialize with Initial Batch
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setRecords(parsed.records || {});
        setRevisions(parsed.revisions || {});
        setOverrides(parsed.overrides || {});
        setAnalysisState(parsed.analysisState || {});
        setImportedBatches(parsed.importedBatches || []);
        if (parsed.records && Object.keys(parsed.records).length > 0) {
          setSelectedRecordKey(Object.keys(parsed.records)[0]);
        }
        return;
      }
    } catch (e) {
      console.error('Failed to load state', e);
    }
    // Default initial import on cold load
    processBatch(initialBatch);
  }, []);

  // Save to LocalStorage
  const persist = (
    newRecs: Record<string, SourceRecord>,
    newRevs: Record<string, number>,
    newOvr: Record<string, ManualOverride>,
    newAnState: Record<string, ReviewState>,
    newBatches: string[]
  ) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          records: newRecs,
          revisions: newRevs,
          overrides: newOvr,
          analysisState: newAnState,
          importedBatches: newBatches,
        })
      );
    } catch (e) {
      console.error('Error persisting state', e);
    }
  };

  const processBatch = (batchData: any): BatchImportResult => {
    const batchRevision = batchData.revision || 1;
    const batchId = batchData.batch_id || 'unknown';
    let newCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    const updatedRecords = { ...records };
    const updatedRevisions = { ...revisions };
    const updatedAnalysisState = { ...analysisState };

    for (const rec of batchData.records || []) {
      const st = rec.source_type;
      const sid = rec.source_id;
      if (!st || !sid) {
        errors.push(`Record missing source_type or source_id: ${rec.record_ref || '?'}`);
        continue;
      }

      const key = recordKey(st, sid);
      const existingRev = updatedRevisions[key] || 0;

      if (batchRevision <= existingRev) {
        skippedCount++;
        continue;
      }

      const isNew = !(key in updatedRecords);

      updatedRecords[key] = {
        record_ref: rec.record_ref || '',
        source_type: st,
        source_id: sid,
        payload: rec.payload || {},
        transcript_payload: rec.transcript_payload,
      };
      updatedRevisions[key] = batchRevision;

      if (!isNew) {
        updatedAnalysisState[key] = 'stale_pending_review';
        updatedCount++;
      } else {
        const base = PREGENERATED_ANALYSES[key];
        updatedAnalysisState[key] = base ? base.review_state : 'needs_review';
        newCount++;
      }
    }

    const updatedBatches = importedBatches.includes(batchId)
      ? importedBatches
      : [...importedBatches, batchId];

    setRecords(updatedRecords);
    setRevisions(updatedRevisions);
    setAnalysisState(updatedAnalysisState);
    setImportedBatches(updatedBatches);
    if (!selectedRecordKey && Object.keys(updatedRecords).length > 0) {
      setSelectedRecordKey(Object.keys(updatedRecords)[0]);
    }

    persist(updatedRecords, updatedRevisions, overrides, updatedAnalysisState, updatedBatches);

    return {
      new_count: newCount,
      updated_count: updatedCount,
      skipped_count: skippedCount,
      batch_id: batchId,
      batch_revision: batchRevision,
      errors,
    };
  };

  const importInitialBatch = () => processBatch(initialBatch);
  const importUpdateBatch = () => processBatch(updateBatch);

  const runDemoSetup = () => {
    localStorage.removeItem(STORAGE_KEY);
    const recs: Record<string, SourceRecord> = {};
    const revs: Record<string, number> = {};
    const anState: Record<string, ReviewState> = {};
    const batches: string[] = [];

    // Import initial
    for (const rec of (initialBatch as any).records || []) {
      const key = recordKey(rec.source_type, rec.source_id);
      recs[key] = {
        record_ref: rec.record_ref,
        source_type: rec.source_type,
        source_id: rec.source_id,
        payload: rec.payload,
        transcript_payload: rec.transcript_payload,
      };
      revs[key] = 1;
      const base = PREGENERATED_ANALYSES[key];
      anState[key] = base ? base.review_state : 'needs_review';
    }
    batches.push('initial-001');

    // Import update
    for (const rec of (updateBatch as any).records || []) {
      const key = recordKey(rec.source_type, rec.source_id);
      recs[key] = {
        record_ref: rec.record_ref,
        source_type: rec.source_type,
        source_id: rec.source_id,
        payload: rec.payload,
        transcript_payload: rec.transcript_payload,
      };
      revs[key] = 2;
      anState[key] = 'stale_pending_review';
    }
    batches.push('update-002');

    setRecords(recs);
    setRevisions(revs);
    setOverrides({});
    setAnalysisState(anState);
    setImportedBatches(batches);
    setSelectedRecordKey(Object.keys(recs)[0]);
    persist(recs, revs, {}, anState, batches);
  };

  const resetState = () => {
    localStorage.removeItem(STORAGE_KEY);
    setRecords({});
    setRevisions({});
    setOverrides({});
    setAnalysisState({});
    setImportedBatches([]);
    setSelectedRecordKey(null);
  };

  const saveOverride = (key: string, routes: string[], note: string, reasons: string[]) => {
    const updated = {
      ...overrides,
      [key]: {
        routes,
        override_note: note,
        overridden_at: new Date().toLocaleString(),
        route_reasons: reasons,
      },
    };
    const updatedAnState = { ...analysisState, [key]: 'reviewed' as ReviewState };
    setOverrides(updated);
    setAnalysisState(updatedAnState);
    persist(records, revisions, updated, updatedAnState, importedBatches);
  };

  const clearOverride = (key: string) => {
    const updated = { ...overrides };
    delete updated[key];
    setOverrides(updated);
    persist(records, revisions, updated, analysisState, importedBatches);
  };

  const getRecordAnalysis = (record: SourceRecord) => {
    const key = recordKey(record.source_type, record.source_id);
    const hasOverride = key in overrides;
    const baseAnalysis =
      PREGENERATED_ANALYSES[key] ||
      (record.source_type === 'call' && (record.payload as any)?.duration_seconds < 60
        ? DEFAULT_BACKGROUND_CALL_ANALYSIS
        : DEFAULT_NO_TRANSCRIPT_ANALYSIS);

    const freshness = analysisState[key] === 'stale_pending_review' ? 'stale' : 'current';
    const reviewStatus = analysisState[key] || baseAnalysis.review_state;

    if (hasOverride) {
      const ovr = overrides[key];
      return {
        ...baseAnalysis,
        routes: ovr.routes,
        route_reasons: ovr.route_reasons.length > 0 ? ovr.route_reasons : baseAnalysis.route_reasons,
        review_state: 'reviewed' as ReviewState,
        analysis_freshness: freshness as 'current' | 'stale',
        isOverridden: true,
        overrideNote: ovr.override_note,
      };
    }

    return {
      ...baseAnalysis,
      review_state: reviewStatus,
      analysis_freshness: freshness as 'current' | 'stale',
      isOverridden: false,
    };
  };

  return (
    <AppContext.Provider
      value={{
        records,
        revisions,
        overrides,
        analysisState,
        importedBatches,
        selectedRecordKey,
        setSelectedRecordKey,
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        filters,
        setFilters,
        importInitialBatch,
        importUpdateBatch,
        runDemoSetup,
        resetState,
        saveOverride,
        clearOverride,
        getRecordAnalysis,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
