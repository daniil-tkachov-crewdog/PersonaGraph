// Grouping helpers for the canvas "group by attribute" modes.
// When a switcher mode other than "none" is active, people are bucketed by one
// profile attribute and each bucket is drawn as a single collapsible bubble.
// This module only computes the buckets + display labels; GraphCanvas does the
// actual placement, bubbles, and expand/collapse animation.

import { ADMIN_ID } from '../state/graphStore.js';
import { groupLabel } from '../data/groups.js';
import { IMPORTANCE_LEVELS } from '../data/fieldTemplates.js';

// Grouping mode → the person field it buckets on.
export const GROUP_ATTR = {
  country: 'location',
  city: 'city',
  relation: 'group',
  importance: 'importance'
};

// Human label for a raw attribute value under a given mode (ids → nice names).
function valueLabel(mode, raw) {
  if (!raw) return 'Unspecified';
  if (mode === 'relation') return groupLabel(raw);
  if (mode === 'importance') {
    return IMPORTANCE_LEVELS.find((l) => l.id === raw)?.label || raw;
  }
  return raw; // country / city are free text
}

// Bucket everyone (except the Admin) by the given mode's attribute.
// Returns [{ key, label, ids: [...] }] in a stable order: named buckets first
// (alphabetical by label), then "Unspecified" last so blanks don't lead.
export function groupPeople(nodes, mode) {
  const attr = GROUP_ATTR[mode];
  if (!attr) return [];
  const buckets = new Map();
  for (const n of nodes) {
    if (n.id === ADMIN_ID) continue;
    const raw = (n[attr] || '').toString().trim();
    const key = raw || '__unspecified__';
    if (!buckets.has(key)) buckets.set(key, { key, label: valueLabel(mode, raw), ids: [] });
    buckets.get(key).ids.push(n.id);
  }
  const list = [...buckets.values()];
  list.sort((a, b) => {
    if (a.key === '__unspecified__') return 1;
    if (b.key === '__unspecified__') return -1;
    return a.label.localeCompare(b.label);
  });
  return list;
}
