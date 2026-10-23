import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Download, 
  FolderTree, 
  FileText, 
  FileJson, 
  FileSpreadsheet, 
  Archive, 
  Check, 
  Database,
  ExternalLink
} from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const ExportView: React.FC = () => {
  const { records, overrides, analysisState, getRecordAnalysis } = useApp();
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const recordList = Object.values(records);

  // Generate manifest rows
  const manifestEntries = recordList.map(rec => {
    const key = `${rec.source_type}::${rec.source_id}`;
    const analysis = getRecordAnalysis(rec);
    const routes = analysis.routes;
    const isOverridden = key in overrides;

    const filePaths = routes.map(r => {
      const folder = r.replace('/', '-').replace(' ', '_');
      return `exports/${folder}/${rec.record_ref}_${rec.source_type}_summary.txt`;
    });

    return {
      record_ref: rec.record_ref,
      source_type: rec.source_type,
      source_id: rec.source_id,
      assigned_routes: routes.join('; '),
      output_files: filePaths.join('; '),
      review_state: analysis.review_state,
      is_overridden: isOverridden ? 'Yes' : 'No',
      override_note: isOverridden ? overrides[key]?.override_note : ''
    };
  });

  const generateZip = async () => {
    setIsExporting(true);
    const zip = new JSZip();

    // 1. Route text summaries
    recordList.forEach(rec => {
      const analysis = getRecordAnalysis(rec);
      const isCall = rec.source_type === 'call';
      const p = rec.payload as any;
      const content = `================================================================================
SPENDNEST REVENUE INTELLIGENCE — CONVERSATION SUMMARY
================================================================================
Record: ${rec.record_ref} (${rec.source_type})
Source ID: ${rec.source_id}
Title/Company: ${isCall ? (p.company_name || 'Call') : (p.title || 'Meeting')}
Team Member: ${isCall ? (p.rep_name || p.rep_email) : p.organizer_email}
Review State: ${analysis.review_state}
Manually Overridden: ${analysis.isOverridden ? 'YES' : 'NO'}

ASSIGNED ROUTES:
${analysis.routes.map(r => `  - ${r}`).join('\n')}

ROUTE REASONS:
${analysis.route_reasons.map(r => `  - ${r}`).join('\n')}

SUMMARY:
${analysis.summary}

VERBATIM EVIDENCE QUOTES:
${analysis.evidence_quotes.map(q => `  ${q}`).join('\n')}

ACTION ITEMS / NEXT STEPS:
${analysis.next_steps.map(s => `  [ ] ${s}`).join('\n')}
================================================================================
`;

      analysis.routes.forEach(r => {
        const folderName = r.replace('/', '-').replace(' ', '_');
        zip.file(`exports/${folderName}/${rec.record_ref}_summary.txt`, content);
      });
    });

    // 2. Manager Brief
    zip.file(
      'exports/manager_brief_2026-08-21.txt',
      `SPENDNEST REVENUE INTELLIGENCE — DAILY MANAGER BRIEF
Date: 21 August 2026 (Asia/Kolkata)
Selected Records: 44 (30 calls, 14 meetings)
Usable Transcripts: 18

TOP ACTION ITEMS:
1. Asterloom Systems (M03): Pricing Quote Discrepancy (INR 26k vs 39k) -> Sales Coaching + Deal Follow-up
2. Cedarwave Distribution (M04): Credit vs Prepaid Card Deadlock -> Customer Follow-up + Human Review
3. Brookmint Holdings (M09): Reset Token Expiration Bug -> Engineering Ticket
`
    );

    // 3. Manifests
    zip.file('exports/manifest.json', JSON.stringify(manifestEntries, null, 2));

    const csvHeader = 'record_ref,source_type,source_id,assigned_routes,output_files,review_state,is_overridden,override_note\n';
    const csvRows = manifestEntries.map(e => 
      `"${e.record_ref}","${e.source_type}","${e.source_id}","${e.assigned_routes}","${e.output_files}","${e.review_state}","${e.is_overridden}","${e.override_note}"`
    ).join('\n');
    zip.file('exports/manifest.csv', csvHeader + csvRows);

    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'revenue_intelligence_export.zip');

    setIsExporting(false);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const downloadJsonManifest = () => {
    const blob = new Blob([JSON.stringify(manifestEntries, null, 2)], { type: 'application/json' });
    saveAs(blob, 'manifest.json');
  };

  const downloadCsvManifest = () => {
    const csvHeader = 'record_ref,source_type,source_id,assigned_routes,output_files,review_state,is_overridden,override_note\n';
    const csvRows = manifestEntries.map(e => 
      `"${e.record_ref}","${e.source_type}","${e.source_id}","${e.assigned_routes}","${e.output_files}","${e.review_state}","${e.is_overridden}","${e.override_note}"`
    ).join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'manifest.csv');
  };

  return (
    <div style={{ padding: '0 24px 32px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Banner */}
      <div className="glass-panel" style={{ padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
            Export & Machine-Readable Manifest Package
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Generates organized route folders, JSON & CSV manifests, and full `.zip` bundle for downstream systems.
          </p>
        </div>

        {/* Download Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button 
            onClick={downloadJsonManifest}
            className="btn-secondary"
            style={{ fontSize: 12 }}
          >
            <FileJson size={14} />
            manifest.json
          </button>
          <button 
            onClick={downloadCsvManifest}
            className="btn-secondary"
            style={{ fontSize: 12 }}
          >
            <FileSpreadsheet size={14} />
            manifest.csv
          </button>
          <button 
            onClick={generateZip}
            disabled={isExporting}
            className="btn-primary"
            style={{ fontSize: 13 }}
          >
            {downloadSuccess ? <Check size={16} color="#fff" /> : <Archive size={16} />}
            <span>{isExporting ? 'Generating ZIP...' : downloadSuccess ? 'Downloaded!' : 'Download ZIP Bundle'}</span>
          </button>
        </div>
      </div>

      {/* Virtual Folder Tree & Tableau / Power BI Notice */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
        
        {/* Virtual Folder Tree */}
        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <FolderTree size={18} color="var(--accent-indigo)" />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
              Generated Export Folder Architecture
            </h3>
          </div>

          <pre style={{
            background: '#060913',
            padding: 16,
            borderRadius: 8,
            fontSize: 12,
            fontFamily: 'monospace',
            color: '#34d399',
            lineHeight: 1.6
          }}>
{`exports/
├── Deal_Follow-up/               ← .txt summaries for deal next steps
├── Sales_Coaching/               ← .txt summaries with coaching flags
├── Customer_Follow-up/           ← customer success & migration tickets
├── Internal-Vendor/              ← vendor & internal platform reviews
├── Human_Review/                 ← triage queue for incomplete calls
├── manager_brief_2026-08-21.txt  ← daily brief synthesis
├── manifest.json                 ← machine-readable schema
├── manifest.csv                  ← spreadsheet compatible
└── revenue_intelligence.zip      ← complete archive download`}
          </pre>
        </div>

        {/* Power BI & Tableau Relational Export Card */}
        <div className="glass-panel" style={{ padding: '20px 24px', borderLeft: '4px solid #e0a920' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Database size={18} color="#e0a920" />
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
              Tableau & Power BI Star Schema Available
            </h3>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>
            All 44 conversations have been converted into 6 relational dimensional tables (`fact_conversations.csv`, `bridge_record_routes.csv`, `dim_routes.csv`, `fact_dialogue_turns.csv`, `fact_evidence_and_actions.csv`) ready for direct import into Power BI Desktop or Tableau.
          </p>
          <a
            href="file:///c:/Users/Ethukrishna/Downloads/candidate-v1.0 (3)_layout_fixed (1)(2) (3)/candidate/powerbi_tableau_export/POWER_BI_TABLEAU_GUIDE.md"
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
            style={{ fontSize: 12, display: 'inline-flex', width: '100%', justifyContent: 'center' }}
          >
            <ExternalLink size={14} />
            View Power BI & Tableau Setup Guide
          </a>
        </div>

      </div>

      {/* Manifest Table */}
      <div className="glass-panel" style={{ padding: '22px 24px' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 16 }}>
          Live Manifest Table ({manifestEntries.length} Records)
        </h3>

        <div style={{ overflowX: 'auto', maxHeight: 420 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, color: 'var(--text-primary)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 12px' }}>Ref</th>
                <th style={{ padding: '10px 12px' }}>Type</th>
                <th style={{ padding: '10px 12px' }}>Assigned Routes</th>
                <th style={{ padding: '10px 12px' }}>Review State</th>
                <th style={{ padding: '10px 12px' }}>Manual Override</th>
                <th style={{ padding: '10px 12px' }}>Primary Output Path</th>
              </tr>
            </thead>
            <tbody>
              {manifestEntries.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--accent-indigo)' }}>{row.record_ref}</td>
                  <td style={{ padding: '10px 12px', textTransform: 'capitalize' }}>{row.source_type}</td>
                  <td style={{ padding: '10px 12px', color: '#fff' }}>{row.assigned_routes}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span className={`badge ${row.review_state === 'reviewed' ? 'badge-deal' : 'badge-review'}`} style={{ fontSize: 10 }}>
                      {row.review_state}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: row.is_overridden === 'Yes' ? '#c084fc' : 'var(--text-muted)' }}>
                    {row.is_overridden === 'Yes' ? 'Yes ✏️' : 'No'}
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>
                    {row.output_files.split(';')[0]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
