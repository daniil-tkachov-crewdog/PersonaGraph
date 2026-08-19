// GraphPage — composes the whole graph experience and owns modal selection.
// It wires the two ways a person can be opened (canvas tap and sidebar click)
// to the tabbed PersonModal, and the two node-scoped flows that modal spawns:
// AddPersonModal (a brand-new connected node) and AddConnectionModal (link to
// an existing node). ConnectionModal still handles direct edge clicks on the
// canvas. Selection lives here as local state so closing a modal can never
// corrupt the graph.

import { useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import GraphCanvas from '../graph/GraphCanvas.jsx';
import PersonModal from '../components/modals/PersonModal.jsx';
import AddPersonModal from '../components/modals/AddPersonModal.jsx';
import AddConnectionModal from '../components/modals/AddConnectionModal.jsx';
import ConnectionModal from '../components/modals/ConnectionModal.jsx';
import GraphModeSwitcher from '../components/GraphModeSwitcher.jsx';
import { useGraphStore, ADMIN_ID } from '../state/graphStore.js';

export default function GraphPage() {
  const [personId, setPersonId] = useState(null); // PersonModal (the editor)
  const [addFromId, setAddFromId] = useState(null); // AddPersonModal
  const [connectForId, setConnectForId] = useState(null); // AddConnectionModal
  const [edgeId, setEdgeId] = useState(null); // ConnectionModal (edge click)

  // Live canvas stats. People exclude the Admin; each connection is two directed
  // edges, so the connection count is edges / 2.
  const peopleCount = useGraphStore((s) => s.nodes.filter((n) => n.id !== ADMIN_ID).length);
  const connectionCount = useGraphStore((s) => Math.round(s.edges.length / 2));

  return (
    <div className="graph-page">
      <Sidebar onOpenPerson={setPersonId} />

      <main className="graph-main">
        <div className="stats-overlay">
          {peopleCount} {peopleCount === 1 ? 'person' : 'people'} · {connectionCount}{' '}
          {connectionCount === 1 ? 'connection' : 'connections'}
        </div>
        {/* Grouping mode switcher (visual only for now). */}
        <GraphModeSwitcher />
        <GraphCanvas onOpenPerson={setPersonId} onOpenEdge={setEdgeId} />
      </main>

      {/* The tabbed node editor. Its Network tab drives the two flows below. */}
      {personId && (
        <PersonModal
          personId={personId}
          onClose={() => setPersonId(null)}
          onOpenPerson={setPersonId}
          onAddConnection={setConnectForId}
          onAddPerson={setAddFromId}
        />
      )}

      {/* Add a brand-new person branched off a node, then open its editor.
          Rendered on top of the editor, which stays mounted underneath. */}
      {addFromId && (
        <AddPersonModal
          originId={addFromId}
          onClose={() => setAddFromId(null)}
          onCreated={(newId) => {
            setAddFromId(null);
            setPersonId(newId);
          }}
        />
      )}

      {/* Link the node to an existing, currently-unconnected node. */}
      {connectForId && (
        <AddConnectionModal nodeId={connectForId} onClose={() => setConnectForId(null)} />
      )}

      {/* Edit both arrows of a connection (opened by clicking an edge). */}
      {edgeId && <ConnectionModal edgeId={edgeId} onClose={() => setEdgeId(null)} />}
    </div>
  );
}
