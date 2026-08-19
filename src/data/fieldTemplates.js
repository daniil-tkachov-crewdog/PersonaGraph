// Person data templates.
// The editable profile is described as DATA here (not hard-coded JSX) so the
// PersonModal form, the store's person factory, and the serializer all follow
// one definition. Fields are grouped into "blocks" that map to the visual
// blocks inside the Info tab. Field `type` drives which input renders.

// Info tab blocks. `group` renders a <select> of GROUPS; `date` a date input;
// everything else a plain text input. `name` is treated as required.
export const INFO_BLOCKS = [
  {
    title: 'General',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'group', label: 'Group', type: 'group' },
      { key: 'age', label: 'Age', type: 'text' },
      { key: 'dob', label: 'Date of Birth', type: 'date' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'nationality', label: 'Nationality', type: 'text' },
      { key: 'occupation', label: 'Occupation', type: 'text' },
      { key: 'familyStatus', label: 'Family status', type: 'text' },
      { key: 'citizenship', label: 'Citizenship', type: 'text' }
    ]
  },
  {
    title: 'Contacts',
    // `multi: true` — each contact can hold several values (e.g. two emails).
    // These fields are stored as arrays of strings; see asList() below.
    fields: [
      { key: 'phone', label: 'Phone number', type: 'text', multi: true },
      { key: 'email', label: 'Email', type: 'text', multi: true },
      { key: 'whatsapp', label: 'WhatsApp', type: 'text', multi: true },
      { key: 'telegram', label: 'Telegram', type: 'text', multi: true },
      { key: 'instagram', label: 'Instagram', type: 'text', multi: true },
      { key: 'facebook', label: 'Facebook', type: 'text', multi: true },
      { key: 'linkedin', label: 'LinkedIn', type: 'text', multi: true },
      { key: 'tiktok', label: 'TikTok', type: 'text', multi: true }
    ]
  }
];

// Seed values for a new person's profile fields: multi fields start as an empty
// array, single fields as an empty string, so inputs stay controlled from the
// start and the shape matches how the editor writes them back.
export const PROFILE_DEFAULTS = Object.fromEntries(
  INFO_BLOCKS.flatMap((b) => b.fields).map((f) => [f.key, f.multi ? [] : ''])
);

// Normalise a possibly-legacy contact value into an array of strings. Older
// saved graphs stored contacts as a single string — coerce those so multi-value
// editing works without a migration step.
export function asList(value) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

// Whole-number age from an ISO date string (yyyy-mm-dd), or '' if unparseable.
// Used to auto-fill the Age field when a Date of Birth is present.
export function computeAge(dob) {
  if (!dob) return '';
  const born = new Date(dob);
  if (Number.isNaN(born.getTime())) return '';
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const m = now.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < born.getDate())) age -= 1;
  return age >= 0 ? String(age) : '';
}

// Connection (edge) semantics shown in the Network tab and ConnectionModal.
// Labels are the user-facing Good/Neutral/Bad; the ids stay
// positive/neutral/negative because cytoscapeStyles.js maps those ids to the
// green/grey/red edge colours. "neutral" is the default for a new connection.
export const CONNECTION_TYPES = [
  { id: 'positive', label: 'Good' },
  { id: 'neutral', label: 'Neutral' },
  { id: 'negative', label: 'Bad' }
];

export const DEFAULT_CONNECTION_TYPE = 'neutral';

// A blank skill row for the "Speciality & Skills" block. Each person holds a
// `skills` array of { area, skill }.
export function blankSkill() {
  return { area: '', skill: '' };
}
