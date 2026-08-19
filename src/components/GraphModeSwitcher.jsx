// GraphModeSwitcher — the centered pill switcher at the top of the canvas.
// Four modes (Country / City / Relation / Importance) that WILL group the graph
// by that attribute. For now it is purely visual: it tracks the selected mode
// locally and animates a sliding highlight, but does not change the layout yet.
// The animated "thumb" is driven by CSS custom properties (--count / --active)
// so switching slides smoothly between buttons.

import { useState } from 'react';

const MODES = ['Country', 'City', 'Relation', 'Importance'];

export default function GraphModeSwitcher() {
  const [active, setActive] = useState(0);

  return (
    <div
      className="mode-switcher"
      style={{ '--count': MODES.length, '--active': active }}
    >
      {/* The sliding highlight; its width is 1/count and it translates by the
          active index, animated via CSS transition. */}
      <div className="mode-thumb" />
      {MODES.map((m, i) => (
        <button
          key={m}
          className={`mode-btn ${i === active ? 'active' : ''}`}
          onClick={() => setActive(i)}
        >
          {m}
        </button>
      ))}
    </div>
  );
}
