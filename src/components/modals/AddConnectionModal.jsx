// AddConnectionModal — link the current node to an existing, unconnected one.
// Opened from the Network tab. Lists every node that has NO edge to `nodeId`
// (in either direction), excluding the node itself. Picking one creates the
// default two-way (neutral) connection and closes. Creating brand-new people is
// a different flow (AddPersonModal) — this only wires up nodes that exist.

import { useGraphStore } from '../../state/graphStore.js';
import { neighborsOf } from '../../graph/edgeModel.js';

export default function AddConnectionModal({ nodeId, onClose }) {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const connect = useGraphStore((s) => s.connect);

  // Candidates = all nodes minus self minus already-connected neighbors.
  const connected = new Set([nodeId, ...neighborsOf(edges, nodeId)]);
  const candidates = nodes.filter((n) => !connected.has(n.id));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h2>Add Connection</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="modal-body">
          {candidates.length === 0 ? (
            <p className="muted">Everyone is already connected to this person.</p>
          ) : (
            <ul className="pick-list">
              {candidates.map((n) => (
                <li key={n.id}>
                  <button
                    className="pick-item"
                    onClick={() => {
                      connect(nodeId, n.id); // default neutral, both arrows
                      onClose();
                    }}
                  >
                    {n.name || 'Unnamed'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
