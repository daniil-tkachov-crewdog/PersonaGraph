// ConnectionModal — edit one relationship (the pair of arrows) between two
// people. A connection is two directed edges; this modal lets the user set the
// type of EACH direction independently (e.g. forward "positive", back
// "neutral"), matching the two-arrow model. Opened by tapping either arrow on
// the canvas; it resolves the tapped edge to its full pair so both are shown.

import { useGraphStore } from '../../state/graphStore.js';
import { CONNECTION_TYPES } from '../../data/fieldTemplates.js';
import { twoWayBetween } from '../../graph/edgeModel.js';

export default function ConnectionModal({ edgeId, onClose }) {
  const edges = useGraphStore((s) => s.edges);
  const nodes = useGraphStore((s) => s.nodes);
  const setEdgeType = useGraphStore((s) => s.setEdgeType);

  const tapped = edges.find((e) => e.id === edgeId);
  if (!tapped) return null; // edge removed underneath the modal

  // Resolve the tapped arrow to the full forward/back pair.
  const { forward, backward } = twoWayBetween(edges, tapped.source, tapped.target);
  const nameOf = (id) => nodes.find((n) => n.id === id)?.name || '?';

  // One labelled selector for a single directed arrow.
  function directionRow(edge) {
    if (!edge) return null;
    return (
      <label className="field" key={edge.id}>
        <span>
          {nameOf(edge.source)} → {nameOf(edge.target)}
        </span>
        <select value={edge.type} onChange={(e) => setEdgeType(edge.id, e.target.value)}>
          {CONNECTION_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h2>Connection</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="modal-body">
          {directionRow(forward)}
          {directionRow(backward)}
        </div>
        <footer className="modal-foot">
          <button className="btn primary" onClick={onClose}>
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}
