// PersonModal — the tabbed node editor.
// Four horizontal tabs: Info (profile blocks + skills), Network (this node's
// connections, plus add-connection / add-person), Notes (freeform text), and
// Actions (notifications placeholder + delete). All data flows through the
// graph store so edits are immediately reflected on the canvas and persisted on
// Save. The Admin node is protected: no Group, no Delete.

import { useState } from 'react';
import { useGraphStore, ADMIN_ID } from '../../state/graphStore.js';
import { INFO_BLOCKS, CONNECTION_TYPES, blankSkill } from '../../data/fieldTemplates.js';
import { GROUPS } from '../../data/groups.js';
import { neighborsOf, outgoingEdge } from '../../graph/edgeModel.js';

const TABS = ['Info', 'Network', 'Notes', 'Actions'];

export default function PersonModal({
  personId,
  onClose,
  onOpenPerson,
  onAddConnection,
  onAddPerson
}) {
  const person = useGraphStore((s) => s.nodes.find((n) => n.id === personId));
  const [tab, setTab] = useState('Info');

  // The node may have been deleted out from under the modal — fail safe.
  if (!person) return null;
  const isAdmin = person.id === ADMIN_ID;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h2>{isAdmin ? `${person.name || 'Me'} (You)` : person.name || 'Person'}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        {/* Horizontal tab strip. */}
        <nav className="modal-tabs">
          {TABS.map((t) => (
            <button
              key={t}
              className={`modal-tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </nav>

        <div className="modal-body">
          {tab === 'Info' && <InfoTab person={person} isAdmin={isAdmin} />}
          {tab === 'Network' && (
            <NetworkTab
              person={person}
              onOpenPerson={onOpenPerson}
              onAddConnection={onAddConnection}
              onAddPerson={onAddPerson}
            />
          )}
          {tab === 'Notes' && <NotesTab person={person} />}
          {tab === 'Actions' && (
            <ActionsTab person={person} isAdmin={isAdmin} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}

// --- Info tab ------------------------------------------------------------
// Renders the General + Contacts blocks from INFO_BLOCKS, then the repeatable
// Skills block. Admin's Group field is suppressed (it represents "you").
function InfoTab({ person, isAdmin }) {
  const updatePerson = useGraphStore((s) => s.updatePerson);

  // One input row, chosen by field type.
  function renderField(field) {
    if (field.key === 'group' && isAdmin) return null;
    const value = person[field.key] ?? '';

    if (field.type === 'group') {
      return (
        <label key={field.key} className="field">
          <span>{field.label}</span>
          <select value={value} onChange={(e) => updatePerson(person.id, { group: e.target.value })}>
            {GROUPS.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
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
          type={field.type === 'date' ? 'date' : 'text'}
          value={value}
          onChange={(e) => updatePerson(person.id, { [field.key]: e.target.value })}
        />
      </label>
    );
  }

  return (
    <>
      {INFO_BLOCKS.map((block) => (
        <section key={block.title} className="info-block">
          <h3 className="block-title">{block.title}</h3>
          <div className="field-grid">{block.fields.map(renderField)}</div>
        </section>
      ))}
      <SkillsBlock person={person} />
    </>
  );
}

// --- Skills block --------------------------------------------------------
// A repeatable list of { area, skill } rows with add/remove. Writes the whole
// array back through updatePerson so it serialises with the node.
function SkillsBlock({ person }) {
  const updatePerson = useGraphStore((s) => s.updatePerson);
  const skills = Array.isArray(person.skills) ? person.skills : [];

  // Immutably patch one field of one row.
  const patchRow = (i, patch) =>
    updatePerson(person.id, {
      skills: skills.map((row, idx) => (idx === i ? { ...row, ...patch } : row))
    });

  return (
    <section className="info-block">
      <h3 className="block-title">Speciality &amp; Skills</h3>
      {skills.map((row, i) => (
        <div key={i} className="skill-row">
          <input
            placeholder="Skill Area"
            value={row.area}
            onChange={(e) => patchRow(i, { area: e.target.value })}
          />
          <input
            placeholder="Skill"
            value={row.skill}
            onChange={(e) => patchRow(i, { skill: e.target.value })}
          />
          <button
            className="icon-btn"
            aria-label="Remove skill"
            onClick={() =>
              updatePerson(person.id, { skills: skills.filter((_, idx) => idx !== i) })
            }
          >
            ×
          </button>
        </div>
      ))}
      <button
        className="btn"
        onClick={() => updatePerson(person.id, { skills: [...skills, blankSkill()] })}
      >
        + Add skill
      </button>
    </section>
  );
}

// --- Network tab ---------------------------------------------------------
// Lists this node's connections (Name | outgoing-type dropdown | remove) and
// offers Add Connection (existing nodes) and Add new person (a fresh node).
function NetworkTab({ person, onOpenPerson, onAddConnection, onAddPerson }) {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const setEdgeType = useGraphStore((s) => s.setEdgeType);
  const disconnect = useGraphStore((s) => s.disconnect);

  const neighborIds = neighborsOf(edges, person.id);
  const nameOf = (id) => nodes.find((n) => n.id === id)?.name || 'Unknown';

  return (
    <>
      <div className="network-list">
        {neighborIds.length === 0 && <p className="muted">No connections yet.</p>}
        {neighborIds.map((otherId) => {
          // The dropdown edits THIS node's outgoing arrow only.
          const out = outgoingEdge(edges, person.id, otherId);
          return (
            <div key={otherId} className="network-row">
              <button className="link-name" onClick={() => onOpenPerson(otherId)}>
                {nameOf(otherId)}
              </button>
              <select
                value={out?.type ?? 'neutral'}
                disabled={!out}
                onChange={(e) => out && setEdgeType(out.id, e.target.value)}
              >
                {CONNECTION_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <button
                className="icon-btn"
                aria-label="Remove connection"
                onClick={() => disconnect(person.id, otherId)}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      <div className="network-actions">
        <button className="btn" onClick={() => onAddConnection(person.id)}>
          + Add Connection
        </button>
        <button className="btn primary" onClick={() => onAddPerson(person.id)}>
          + Add new person
        </button>
      </div>
    </>
  );
}

// --- Notes tab -----------------------------------------------------------
// A single freeform textarea bound to person.notes.
function NotesTab({ person }) {
  const updatePerson = useGraphStore((s) => s.updatePerson);
  return (
    <textarea
      className="notes-area"
      placeholder="Anything you want to remember about this person…"
      value={person.notes ?? ''}
      onChange={(e) => updatePerson(person.id, { notes: e.target.value })}
    />
  );
}

// --- Actions tab ---------------------------------------------------------
// Notifications are not built yet (coming soon). Delete removes the node and
// every edge touching it; it is hidden for the un-deletable Admin node.
function ActionsTab({ person, isAdmin, onClose }) {
  const deletePerson = useGraphStore((s) => s.deletePerson);
  return (
    <div className="actions-list">
      <button className="btn block" disabled title="Coming soon">
        Add notification <span className="soon">soon</span>
      </button>
      {!isAdmin && (
        <button
          className="btn danger block"
          onClick={() => {
            deletePerson(person.id);
            onClose();
          }}
        >
          Delete the Node
        </button>
      )}
    </div>
  );
}
