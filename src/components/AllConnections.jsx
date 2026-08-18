// AllConnections — the grouped node list inside the sidebar.
// Reads people from the store, buckets them via the pure groupConnections()
// helper, and renders collapsible group sections. Clicking a person opens
// their editor (same PersonModal the canvas uses), so the list and the graph
// are two views onto the same selection.

import { useGraphStore } from '../state/graphStore.js';
import { groupConnections } from '../state/grouping.js';

export default function AllConnections({ onOpenPerson }) {
  const nodes = useGraphStore((s) => s.nodes);
  const groups = groupConnections(nodes);

  // Empty state: only the Admin exists so far.
  if (groups.length === 0) {
    return <p className="muted sidebar-empty">No connections yet. Open a node to add one.</p>;
  }

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
                  {p.name || 'Unnamed'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
