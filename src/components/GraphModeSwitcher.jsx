// GraphModeSwitcher — the centered pill switcher at the top of the canvas.
// Picks how the graph is grouped: None (raw clique layout) or by a person
// attribute (Country / City / Relation / Importance). The chosen mode lives in
// the settings store so GraphCanvas can react to it. An animated "thumb" slides
// between buttons, driven by CSS custom properties (--count / --active).

import { useSettingsStore } from '../state/settingsStore.js';

// [button label, mode id]. "None" sits leftmost and means "don't group".
const MODES = [
  ['None', 'none'],
  ['Country', 'country'],
  ['City', 'city'],
  ['Relation', 'relation'],
  ['Importance', 'importance']
];

export default function GraphModeSwitcher() {
  const graphMode = useSettingsStore((s) => s.graphMode);
  const setGraphMode = useSettingsStore((s) => s.setGraphMode);
  const active = Math.max(0, MODES.findIndex(([, id]) => id === graphMode));

  return (
    <div className="mode-switcher" style={{ '--count': MODES.length, '--active': active }}>
      {/* Sliding highlight; width is 1/count, translated to the active button. */}
      <div className="mode-thumb" />
      {MODES.map(([label, id]) => (
        <button
          key={id}
          className={`mode-btn ${id === graphMode ? 'active' : ''}`}
          onClick={() => setGraphMode(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
