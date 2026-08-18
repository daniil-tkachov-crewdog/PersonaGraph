// Grouping logic for the sidebar's "All Connections" list.
// Pure function (no React, no store) so it is trivial to reason about and test:
// takes the raw node list, returns them bucketed by `group` in the fixed order
// declared in data/groups.js. The Admin node is excluded — it is "you", not a
// connection. Empty groups are dropped so the sidebar stays tidy.

import { GROUPS } from '../data/groups.js';
import { ADMIN_ID } from './graphStore.js';

export function groupConnections(nodes) {
  const people = nodes.filter((n) => n.id !== ADMIN_ID);

  // Seed buckets in catalogue order so the UI ordering is stable and intentional.
  const buckets = GROUPS.map((g) => ({
    id: g.id,
    label: g.label,
    members: []
  }));
  const byId = Object.fromEntries(buckets.map((b) => [b.id, b]));

  for (const person of people) {
    // Unknown/legacy group ids fall into "other" so nobody disappears.
    const bucket = byId[person.group] || byId.other;
    bucket.members.push(person);
  }

  // Alphabetise within each group, then hide groups nobody belongs to.
  for (const b of buckets) {
    b.members.sort((a, z) => (a.name || '').localeCompare(z.name || ''));
  }
  return buckets.filter((b) => b.members.length > 0);
}
