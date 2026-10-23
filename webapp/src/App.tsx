import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { PowerBIView } from './components/PowerBIView';
import { InboxView } from './components/InboxView';
import { PipelineView } from './components/PipelineView';
import { ManagerBriefView } from './components/ManagerBriefView';
import { ExportView } from './components/ExportView';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <main>
      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'powerbi' && <PowerBIView />}
      {activeTab === 'inbox' && <InboxView />}
      {activeTab === 'pipeline' && <PipelineView />}
      {activeTab === 'brief' && <ManagerBriefView />}
      {activeTab === 'export' && <ExportView />}
    </main>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <div style={{ flex: 1 }}>
          <MainContent />
        </div>
        <footer style={{
          textAlign: 'center',
          padding: '18px 24px',
          color: 'var(--text-muted)',
          fontSize: 12,
          borderTop: '1px solid var(--border-glass)',
          marginTop: 'auto'
        }}>
          SpendNest Revenue Intelligence Workspace · Evaluated for 21 August 2026 (IST) · Powered by React & Vite
        </footer>
      </div>
    </AppProvider>
  );
};

export default App;
