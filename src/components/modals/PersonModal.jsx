// PersonModal — the tabbed node editor.
// Four horizontal tabs: Info (profile blocks + skills), Network (this node's
// connections, plus add-connection / add-person), Notes (freeform text), and
// Actions (notifications placeholder + delete). All data flows through the
// graph store so edits are immediately reflected on the canvas and persisted on
// Save. The Admin node is protected: no Group, no Delete.

import { useState } from 'react';
import { useGraphStore, ADMIN_ID } from '../../state/graphStore.js';
import {
  INFO_BLOCKS,
  IMPORTANCE_LEVELS,
  CONNECTION_TYPES,
  normalizeType,
  blankSkill,
  asList,
  computeAge
} from '../../data/fieldTemplates.js';
import { GROUPS, groupLabel } from '../../data/groups.js';
import { neighborsOf, outgoingEdge } from '../../graph/edgeModel.js';

const TABS = ['Info', 'Network', 'Notes', 'Actions'];

// Up to two leading letters for the header avatar chip.
function initials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

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

  // Header subtitle: "Group · Occupation" for people, "You" for the Admin.
  const subtitle = isAdmin
    ? 'You'
    : [person.group ? groupLabel(person.group) : null, person.occupation]
        .filter(Boolean)
        .join(' · ');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <div className="person-head">
            <div className="person-avatar">{initials(person.name)}</div>
            <div>
              <div className="person-name">{person.name || 'Person'}</div>
              {subtitle && <div className="person-sub">{subtitle}</div>}
            </div>
          </div>
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
              isAdmin={isAdmin}
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

  // Age auto-derived from Date of Birth when one is set.
  const derivedAge = computeAge(person.dob);

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

    // Contact fields hold several values — render a small add/remove list.
    if (field.multi) return <MultiContactField key={field.key} person={person} field={field} />;

    // Age: read-only (auto-calculated) when a DOB exists; editable otherwise.
    if (field.key === 'age') {
      const hasDob = derivedAge !== '';
      return (
        <label key={field.key} className="field">
          <span>{field.label}{hasDob ? ' (from DOB)' : ''}</span>
          <input
            type="text"
            value={hasDob ? derivedAge : value}
            disabled={hasDob}
            onChange={(e) => updatePerson(person.id, { age: e.target.value })}
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
          type={field.type === 'date' ? 'date' : 'text'}
          value={value}
          onChange={(e) => updatePerson(person.id, { [field.key]: e.target.value })}
        />
      </label>
    );
  }

  return (
    <>
      {/* Importance to me — a standalone dropdown above the General block. */}
      <label className="field importance-field">
        <span>Importance to me</span>
        <select
          value={person.importance ?? ''}
          onChange={(e) => updatePerson(person.id, { importance: e.target.value })}
        >
          <option value="">—</option>
          {IMPORTANCE_LEVELS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
      </label>

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

// --- Multi-value contact field -------------------------------------------
// A labelled field holding several values (e.g. two phone numbers). Legacy
// string values are coerced to a list via asList so old graphs still edit.
// Always shows at least one input; the last one can't be removed.
function MultiContactField({ person, field }) {
  const updatePerson = useGraphStore((s) => s.updatePerson);
  const list = asList(person[field.key]);
  const rows = list.length ? list : ['']; // keep one visible input when empty
  const setList = (next) => updatePerson(person.id, { [field.key]: next });

  return (
    <div className="field multi-field">
      <span>{field.label}</span>
      {rows.map((v, i) => (
        <div key={i} className="multi-row">
          <input
            type="text"
            value={v}
            onChange={(e) => setList(rows.map((r, idx) => (idx === i ? e.target.value : r)))}
          />
          {rows.length > 1 && (
            <button
              className="icon-btn"
              aria-label={`Remove ${field.label}`}
              onClick={() => setList(rows.filter((_, idx) => idx !== i))}
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button className="btn add-mini" onClick={() => setList([...rows, ''])}>
        + Add {field.label}
      </button>
    </div>
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
// Lists this node's connections. Columns per row:
//   Name | Closeness (this node's outgoing arrow) | Relation to <this person>
//   (the other person's category toward this one — hidden for the Admin) | ✕
// Plus Add Connection (existing nodes) and Add new person (a fresh node).
function NetworkTab({ person, isAdmin, onOpenPerson, onAddConnection, onAddPerson }) {
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const setEdgeType = useGraphStore((s) => s.setEdgeType);
  const updateEdge = useGraphStore((s) => s.updateEdge);
  const disconnect = useGraphStore((s) => s.disconnect);

  const neighborIds = neighborsOf(edges, person.id);
  const nameOf = (id) => nodes.find((n) => n.id === id)?.name || 'Unknown';
  // The extra "Relation to <name>" column is only shown for real people.
  const showRelation = !isAdmin;
  const rowClass = `network-row ${showRelation ? 'network-row--rel' : ''}`;

  return (
    <>
      <div className="network-list">
        {neighborIds.length === 0 && <p className="muted">No connections yet.</p>}

        {neighborIds.length > 0 && (
          <div className={`${rowClass} network-head`}>
            <span>Connection</span>
            <span>Closeness</span>
            {showRelation && <span>Relation to {person.name || 'this person'}</span>}
            <span />
          </div>
        )}

        {neighborIds.map((otherId) => {
          // Closeness edits THIS node's outgoing arrow (person → other).
          const out = outgoingEdge(edges, person.id, otherId);
          // "Relation to <person>" edits how the OTHER relates back (other →
          // person): the category stored on that incoming arrow.
          const inc = outgoingEdge(edges, otherId, person.id);
          return (
            <div key={otherId} className={rowClass}>
              <button className="link-name" onClick={() => onOpenPerson(otherId)}>
                {nameOf(otherId)}
              </button>
              <select
                value={normalizeType(out?.type)}
                disabled={!out}
                onChange={(e) => out && setEdgeType(out.id, e.target.value)}
              >
                {CONNECTION_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              {showRelation && (
                <select
                  value={inc?.relation ?? ''}
                  disabled={!inc}
                  onChange={(e) => inc && updateEdge(inc.id, { relation: e.target.value })}
                >
                  <option value="">—</option>
                  {GROUPS.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label}
                    </option>
                  ))}
                </select>
              )}
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
