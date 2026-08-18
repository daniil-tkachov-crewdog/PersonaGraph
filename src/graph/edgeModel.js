// Edge model helpers.
// A relationship between two people is ALWAYS bidirectional per the spec:
// one arrow forward and one arrow back. We model that as two independent
// directed edges so each direction can carry its own type (e.g. A likes B,
// B is neutral to A). These helpers keep that pairing consistent everywhere.

import { v4 as uuid } from 'uuid';
import { DEFAULT_CONNECTION_TYPE } from '../data/fieldTemplates.js';

// Deterministic id for a directed edge so the same direction is never
// duplicated and Cytoscape can diff cleanly. Direction matters: a→b ≠ b→a.
export function directedId(source, target) {
  return `e:${source}->${target}`;
}

// Build the two directed edges for a fresh connection between two node ids.
// Both default to "neutral" — the spec's default when a new person arrives.
export function makeTwoWay(a, b, type = DEFAULT_CONNECTION_TYPE) {
  return [
    { id: directedId(a, b), source: a, target: b, type, rid: uuid() },
    { id: directedId(b, a), source: b, target: a, type, rid: uuid() }
  ];
}

// Given all edges, return the two directed edges that make up the connection
// between `a` and `b` (order-independent). Missing directions come back as
// undefined — callers should guard for partially-formed legacy data.
export function twoWayBetween(edges, a, b) {
  return {
    forward: edges.find((e) => e.source === a && e.target === b),
    backward: edges.find((e) => e.source === b && e.target === a)
  };
}

// Unique ids of every node connected to `id` in either direction. Drives the
// Network tab's connection list and the "unconnected nodes" filter for the
// Add Connection picker.
export function neighborsOf(edges, id) {
  const set = new Set();
  for (const e of edges) {
    if (e.source === id) set.add(e.target);
    else if (e.target === id) set.add(e.source);
  }
  return [...set];
}

// The single directed edge from `from` to `to`, i.e. the outgoing arrow the
// Network dropdown edits. Undefined if that direction doesn't exist.
export function outgoingEdge(edges, from, to) {
  return edges.find((e) => e.source === from && e.target === to);
}
