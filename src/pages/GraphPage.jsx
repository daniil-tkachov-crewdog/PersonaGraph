// GraphPage — composes the whole graph experience and owns modal selection.
// It wires the two ways a person can be opened (canvas tap and sidebar click)
// to a single PersonModal, plus the AddPerson and Connection modals. Keeping
// this selection state here (not in a global store) means closing a modal is
// just local state and can never corrupt the graph.

import { useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import GraphCanvas from '../graph/GraphCanvas.jsx';
import PersonModal from '../components/modals/PersonModal.jsx';
import AddPersonModal from '../components/modals/AddPersonModal.jsx';
import ConnectionModal from '../components/modals/ConnectionModal.jsx';

export default function GraphPage() {
  // Exactly one of these drives which modal (if any) is open.
  const [personId, setPersonId] = useState(null); // PersonModal
  const [addFromId, setAddFromId] = useState(null); // AddPersonModal
  const [edgeId, setEdgeId] = useState(null); // ConnectionModal

  return (
    <div className="graph-page">
      <Sidebar onOpenPerson={setPersonId} />

      <main className="graph-main">
        <GraphCanvas onOpenPerson={setPersonId} onOpenEdge={setEdgeId} />
      </main>

      {/* View/edit a person; can spawn the AddPerson flow. */}
      {personId && (
        <PersonModal
          personId={personId}
          onClose={() => setPersonId(null)}
          onAddFrom={(originId) => {
            setPersonId(null);
            setAddFromId(originId);
          }}
        />
      )}

      {/* Add a new person branched off a node, then open its editor. */}
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

      {/* Edit both arrows of a connection. */}
      {edgeId && <ConnectionModal edgeId={edgeId} onClose={() => setEdgeId(null)} />}
    </div>
  );
}
