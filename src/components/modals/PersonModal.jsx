// PersonModal — view and edit one person (node).
// Renders a form from the PERSON_FIELDS template so fields are data-driven.
// Also the launch point for the two node-scoped actions: "Add person from
// here" (branching a new connection off this node — the ONLY way to add a
// person) and, for non-Admin nodes, "Delete". The Admin node's structural
// bits are protected: it can be renamed but never deleted, and its group is
// not editable.

import { useGraphStore, ADMIN_ID } from '../../state/graphStore.js';
import { PERSON_FIELDS } from '../../data/fieldTemplates.js';
import { GROUPS } from '../../data/groups.js';

export default function PersonModal({ personId, onClose, onAddFrom }) {
  const person = useGraphStore((s) => s.nodes.find((n) => n.id === personId));
  const updatePerson = useGraphStore((s) => s.updatePerson);
  const deletePerson = useGraphStore((s) => s.deletePerson);

  // The node may have been deleted out from under the modal — fail safe.
  if (!person) return null;
  const isAdmin = person.id === ADMIN_ID;

  // Render one field row according to its declared type.
  function renderField(field) {
    // The Admin has no editable "group" (it represents you, not a connection).
    if (field.key === 'group' && isAdmin) return null;
    const value = person[field.key] ?? '';

    if (field.type === 'group') {
      return (
        <label key={field.key} className="field">
          <span>{field.label}</span>
          <select
            value={value}
            onChange={(e) => updatePerson(person.id, { group: e.target.value })}
          >
            {GROUPS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </label>
      );
    }

    if (field.type === 'textarea') {
      return (
        <label key={field.key} className="field">
          <span>{field.label}</span>
          <textarea
            rows={3}
            value={value}
            onChange={(e) => updatePerson(person.id, { [field.key]: e.target.value })}
          />
        </label>
      );
    }

    return (
      <label key={field.key} className="field">
        <span>
          {field.label}
          {field.required ? ' *' : ''}
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => updatePerson(person.id, { [field.key]: e.target.value })}
        />
      </label>
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h2>{isAdmin ? 'You (Admin)' : 'Person'}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="modal-body">{PERSON_FIELDS.map(renderField)}</div>

        <footer className="modal-foot">
          {/* The sanctioned way to grow the graph: branch from THIS node. */}
          <button className="btn primary" onClick={() => onAddFrom(person.id)}>
            + Add person from here
          </button>
          {/* Admin can never be deleted. */}
          {!isAdmin && (
            <button
              className="btn danger"
              onClick={() => {
                deletePerson(person.id);
                onClose();
              }}
            >
              Delete
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
