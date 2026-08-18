// AllConnections — the grouped node list inside the sidebar.
// Reads people from the store, buckets them via the pure groupConnections()
// helper, and renders group sections. Each row shows an avatar (initials), the
// name, and a status dot whose colour reflects how YOU (the Admin) relate to
// that person — the Admin→person arrow's type. Clicking a person opens their
// editor, so the list and the graph are two views onto the same selection.

import { useGraphStore, ADMIN_ID } from '../state/graphStore.js';
import { groupConnections } from '../state/grouping.js';
import { outgoingEdge } from '../graph/edgeModel.js';

// Up to two leading letters, uppercased, for the avatar chip.
function initials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

// Connection type → dot colour (matches the edge palette). Grey when there is
// no direct Admin→person arrow to read a sentiment from.
const DOT_COLORS = { positive: '#3fb27f', negative: '#e06579', neutral: '#6b7280' };

export default function AllConnections({ onOpenPerson }) {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const groups = groupConnections(nodes);

  // Empty state: only the Admin exists so far.
  if (groups.length === 0) {
    return <p className="muted sidebar-empty">No connections yet. Open a node to add one.</p>;
  }

  // Resolve the status-dot colour for one person from the Admin's outgoing arrow.
  const dotColor = (id) => DOT_COLORS[outgoingEdge(edges, ADMIN_ID, id)?.type] || DOT_COLORS.neutral;

  return (
    <div className="connections">
      {groups.map((g) => (
        <section key={g.id} className="conn-group">
          <h4 className="conn-group-title">
            {g.label} <span className="count">{g.members.length}</span>
          </h4>
          <ul>
            {g.members.map((p) => (
              <li key={p.id}>
                <button className="conn-item" onClick={() => onOpenPerson(p.id)}>
                  <span className="conn-avatar">{initials(p.name)}</span>
                  <span className="conn-name">{p.name || 'Unnamed'}</span>
                  <span className="conn-dot" style={{ background: dotColor(p.id) }} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
