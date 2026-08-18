// SettingsPage — three tabs: General, Sync, Connection.
// Only the Sync tab is functional in v1.0 (choosing the folder graphs save
// into); General and Connection are placeholders marked "coming soon" so the
// intended shape of the product is visible without promising behaviour that
// isn't wired up. A back button returns to the graph.

import { useState } from 'react';
import { useSettingsStore } from '../state/settingsStore.js';

// Small labelled placeholder row for not-yet-built controls.
function ComingSoonRow({ label }) {
  return (
    <div className="setting-row">
      <span>{label}</span>
      <span className="soon">coming soon</span>
    </div>
  );
}

export default function SettingsPage() {
  const setView = useSettingsStore((s) => s.setView);
  const syncFolder = useSettingsStore((s) => s.syncFolder);
  const setSyncFolder = useSettingsStore((s) => s.setSyncFolder);
  const [tab, setTab] = useState('general');

  // Open the native folder picker (main process) and remember the choice.
  async function pickFolder() {
    if (!window.pg?.chooseFolder) return;
    const folder = await window.pg.chooseFolder();
    if (folder) setSyncFolder(folder);
  }

  return (
    <div className="settings-page">
      <header className="page-head">
        <button className="btn ghost" onClick={() => setView('graph')}>
          ‹ Back
        </button>
        <h1>Settings</h1>
      </header>

      {/* Tab strip. */}
      <nav className="tabs">
        {[
          ['general', 'General'],
          ['sync', 'Sync'],
          ['connection', 'Connection']
        ].map(([id, label]) => (
          <button
            key={id}
            className={`tab ${tab === id ? 'active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="tab-panel">
        {tab === 'general' && (
          <>
            <ComingSoonRow label="Mode (dark / light)" />
            <ComingSoonRow label="Font size" />
          </>
        )}

        {tab === 'sync' && (
          <div className="setting-row column">
            <span>Folder where graphs are saved</span>
            <div className="folder-picker">
              <code className="folder-path">{syncFolder || 'No folder chosen'}</code>
              <button className="btn primary" onClick={pickFolder}>
                Choose folder…
              </button>
            </div>
          </div>
        )}

        {tab === 'connection' && (
          <div className="setting-row column">
            <span>
              Telegram <span className="soon">coming soon</span>
            </span>
            <p className="muted">Connect your Telegram to import contacts and chats.</p>
          </div>
        )}
      </div>
    </div>
  );
}
