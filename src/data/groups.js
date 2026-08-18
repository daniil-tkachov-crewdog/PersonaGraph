// Group definitions.
// A "group" is how a person is bucketed in the sidebar's "All Connections"
// list. Each person carries a `group` field whose value is one of these ids.
// Keeping the catalogue here (not inline in components) means the sidebar,
// the person modal, and grouping logic all read from one source of truth.

export const GROUPS = [
  { id: 'family', label: 'Family' },
  { id: 'friends', label: 'Friends' },
  { id: 'work', label: 'Work' },
  { id: 'acquaintances', label: 'Acquaintances' },
  { id: 'other', label: 'Other' }
];

// Default group assigned to a freshly added person until the user picks one.
export const DEFAULT_GROUP = 'other';

// Human-readable label lookup, with a safe fallback for unknown/legacy ids.
export function groupLabel(id) {
  const found = GROUPS.find((g) => g.id === id);
  return found ? found.label : 'Other';
}
