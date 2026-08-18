// Sidebar — the foldable left menu.
// Assembles the fixed chrome of the Graph page: the logo, the Save/Upload
// actions, the grouped "All Connections" list, and navigation to Account
// (coming soon) and Settings. It owns the small amount of transient UI state
// for save/load feedback; the heavy lifting lives in io/ and the stores.

import { useState } from 'react';
import { useSettingsStore } from '../state/settingsStore.js';
import { saveGraph } from '../io/saveGraph.js';
import { loadGraph } from '../io/loadGraph.js';
import AllConnections from './AllConnections.jsx';

export default function Sidebar({ onOpenPerson }) {
  const folded = useSettingsStore((s) => s.sidebarFolded);
  const toggle = useSettingsStore((s) => s.toggleSidebar);
  const setView = useSettingsStore((s) => s.setView);

  // Transient one-line status shown under the action buttons after save/load.
  const [status, setStatus] = useState(null);
  const flash = (msg) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), 4000);
  };

  // Save: delegate to io/saveGraph and translate the result/error into a flash.
  async function handleSave() {
    try {
      const path = await saveGraph();
      flash(`Saved: ${path}`);
    } catch (err) {
      flash(err.message);
    }
  }

  // Upload: delegate to io/loadGraph; ignore a plain cancel, report errors.
  async function handleUpload() {
    try {
      const ok = await loadGraph();
      if (ok) flash('Graph loaded.');
    } catch (err) {
      flash(err.message);
    }
  }

  return (
    <aside className={`sidebar ${folded ? 'folded' : ''}`}>
      {/* Fold/unfold toggle sits at the very top-left edge. */}
      <button className="fold-btn" onClick={toggle} aria-label="Toggle sidebar">
        {folded ? '»' : '«'}
      </button>

      {!folded && (
        <div className="sidebar-inner">
          {/* Logo: plain white wordmark, per spec. */}
          <div className="logo">PersonaGraph</div>

          {/* Primary graph file actions. */}
          <div className="sidebar-actions">
            <button className="btn block" onClick={handleSave}>
              Save Graph
            </button>
            <button className="btn block" onClick={handleUpload}>
              Upload Graph
            </button>
          </div>
          {status && <div className="status-line">{status}</div>}

          {/* Grouped list of every connection. */}
          <div className="sidebar-section">
            <h3 className="sidebar-heading">All Connections</h3>
            <AllConnections onOpenPerson={onOpenPerson} />
          </div>

          {/* Footer nav. Account is not built yet. */}
          <div className="sidebar-footer">
            <button className="btn ghost block" disabled title="Coming soon">
              Account <span className="soon">soon</span>
            </button>
            <button className="btn ghost block" onClick={() => setView('settings')}>
              Settings
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
