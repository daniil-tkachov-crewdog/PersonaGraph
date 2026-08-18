// Person data fields.
// The set of editable attributes each node (person) can hold, driving the
// PersonModal form. Declaring them as data — not hard-coded JSX — means a new
// field is added in one place and the form, serializer, and loader all follow.
// Caveat: `name` is treated as required elsewhere; the rest are optional.

export const PERSON_FIELDS = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'group', label: 'Group', type: 'group' }, // rendered as a <select> of GROUPS
  { key: 'phone', label: 'Phone', type: 'text' },
  { key: 'email', label: 'Email', type: 'text' },
  { key: 'location', label: 'Location', type: 'text' },
  { key: 'notes', label: 'Notes', type: 'textarea' }
];

// Connection (edge) semantics offered in the ConnectionModal. "neutral" is the
// default applied when a new person is added, per the spec.
export const CONNECTION_TYPES = [
  { id: 'neutral', label: 'Neutral' },
  { id: 'positive', label: 'Positive' },
  { id: 'negative', label: 'Negative' }
];

export const DEFAULT_CONNECTION_TYPE = 'neutral';
