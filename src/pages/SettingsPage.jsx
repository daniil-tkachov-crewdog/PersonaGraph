// SettingsPage — tabs: General, Sync, Connection, Graph Formula.
// Sync (choose the save folder) and Graph Formula (live geometry controls) are
// functional; General and Connection remain "coming soon". A back button
// returns to the graph.

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

// The tunable geometry knobs, described as data so the tab renders itself.
const FORMULA_CONTROLS = [
  { key: 'edgeLength', label: 'Edge length (polygon side)', min: 60, max: 400, step: 5, unit: 'px' },
  { key: 'nodeSpacing', label: 'Node spacing', min: 0, max: 80, step: 2, unit: 'px' },
  { key: 'clusterGap', label: 'Gap between clusters', min: 0, max: 320, step: 10, unit: 'px' },
  { key: 'groupRingRadius', label: 'Group ring radius', min: 150, max: 640, step: 10, unit: 'px' },
  { key: 'bubbleSize', label: 'Group bubble size', min: 50, max: 220, step: 4, unit: 'px' },
  { key: 'expandMs', label: 'Expand animation', min: 100, max: 1200, step: 20, unit: 'ms' }
];

// Graph Formula tab: live-editable geometry. Every change writes straight to the
// settings store, and the canvas re-renders immediately.
function FormulaTab() {
  const formula = useSettingsStore((s) => s.formula);
  const setFormula = useSettingsStore((s) => s.setFormula);
  const resetFormula = useSettingsStore((s) => s.resetFormula);

  return (
    <div className="formula-tab">
      <p className="muted formula-intro">
        Tune how the graph is drawn. Changes apply live. If a dense group looks
        messy, raise the edge length and cluster gap, or turn physics off for a
        fixed geometric layout.
      </p>

      {FORMULA_CONTROLS.map((c) => (
        <div className="formula-row" key={c.key}>
          <label htmlFor={`f-${c.key}`}>{c.label}</label>
          <input
            id={`f-${c.key}`}
            type="range"
            min={c.min}
            max={c.max}
            step={c.step}
            value={formula[c.key]}
            onChange={(e) => setFormula({ [c.key]: Number(e.target.value) })}
          />
          <span className="formula-value">
            {formula[c.key]}
            {c.unit}
          </span>
        </div>
      ))}

      {/* Physics on/off toggle for the ungrouped ("None") view. */}
      <div className="formula-row">
        <label htmlFor="f-physics">Live physics (None mode)</label>
        <label className="switch">
          <input
            id="f-physics"
            type="checkbox"
            checked={formula.physics}
            onChange={(e) => setFormula({ physics: e.target.checked })}
          />
          <span className="switch-track" />
        </label>
        <span className="formula-value">{formula.physics ? 'On' : 'Off'}</span>
      </div>

      <button className="btn" onClick={resetFormula} style={{ marginTop: 16 }}>
        Reset to defaults
      </button>
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
          ['connection', 'Connection'],
          ['formula', 'Graph Formula']
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

        {tab === 'formula' && <FormulaTab />}
      </div>
    </div>
  );
}
