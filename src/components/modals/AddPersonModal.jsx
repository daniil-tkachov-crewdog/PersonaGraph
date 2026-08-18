// AddPersonModal — create a new person branched off an existing node.
// Enforces the core rule that a person can only be added THROUGH another node:
// this modal is always opened with an `originId`, and on confirm it creates the
// node plus its default two-way (neutral) connection back to that origin. The
// new person is then handed to the caller so its full editor can open.

import { useState } from 'react';
import { useGraphStore } from '../../state/graphStore.js';
import { GROUPS, DEFAULT_GROUP } from '../../data/groups.js';

export default function AddPersonModal({ originId, onClose, onCreated }) {
  const addPerson = useGraphStore((s) => s.addPerson);
  const updatePerson = useGraphStore((s) => s.updatePerson);
  const originName = useGraphStore(
    (s) => s.nodes.find((n) => n.id === originId)?.name || 'this node'
  );

  // Local draft state; nothing hits the graph until "Add" is pressed.
  const [name, setName] = useState('');
  const [group, setGroup] = useState(DEFAULT_GROUP);

  function handleAdd() {
    // addPerson creates the node + the two-way edge to the origin in one step.
    const id = addPerson(originId);
    if (!id) return; // origin vanished — abort quietly
    updatePerson(id, { name: name.trim() || 'New person', group });
    onCreated(id); // let the parent open the new person's editor
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h2>Add person</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="modal-body">
          <p className="muted">Connected to {originName}.</p>
          <label className="field">
            <span>Name *</span>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </label>
          <label className="field">
            <span>Group</span>
            <select value={group} onChange={(e) => setGroup(e.target.value)}>
              {GROUPS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <footer className="modal-foot">
          <button className="btn primary" onClick={handleAdd}>
            Add
          </button>
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
        </footer>
      </div>
    </div>
  );
}
