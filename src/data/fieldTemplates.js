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
    fields: [
      { key: 'phone', label: 'Phone number', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'whatsapp', label: 'WhatsApp', type: 'text' },
      { key: 'telegram', label: 'Telegram', type: 'text' },
      { key: 'instagram', label: 'Instagram', type: 'text' },
      { key: 'facebook', label: 'Facebook', type: 'text' },
      { key: 'linkedin', label: 'LinkedIn', type: 'text' },
      { key: 'tiktok', label: 'TikTok', type: 'text' }
    ]
  }
];

// Flat list of every profile field key, used by the person factory to seed a
// new node with empty strings so inputs stay controlled from the start.
export const PROFILE_KEYS = INFO_BLOCKS.flatMap((b) => b.fields.map((f) => f.key));

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
