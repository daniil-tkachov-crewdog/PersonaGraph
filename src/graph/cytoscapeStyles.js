// Cytoscape visual stylesheet.
// Purely presentational: maps node/edge DATA to how they look. Kept apart from
// GraphCanvas so the look can change without touching interaction logic.
// Edge colour encodes connection closeness (see closenessColor); the Admin node
// is visually distinct and larger so "you" is always obvious at the centre.

import { closenessColor } from '../data/fieldTemplates.js';

export const cytoscapeStyles = [
  // --- Person nodes -------------------------------------------------------
  // Blue-tinted disc with a blue rim and a label beneath, matching the mock.
  {
    selector: 'node',
    style: {
      'background-color': '#123256', // blue-tinted fill over the dark canvas
      'background-opacity': 0.95,
      'border-color': 'rgba(43,138,239,0.75)',
      'border-width': 2,
      label: 'data(label)',
      color: '#e9edf3',
      'font-family': 'Inter, system-ui, sans-serif',
      'font-size': 12,
      'text-valign': 'bottom',
      'text-margin-y': 7,
      'text-halign': 'center',
      width: 42,
      height: 42,
      'text-outline-color': '#0a0c10',
      'text-outline-width': 2
    }
  },
  // --- Admin node ---------------------------------------------------------
  // Bigger and white — the fixed, glowing anchor of the whole graph.
  {
    selector: 'node.admin',
    style: {
      'background-color': '#ffffff',
      'border-color': 'rgba(255,255,255,0.5)',
      'border-width': 3,
      color: '#f4f7fb',
      'font-size': 13,
      'font-weight': 'bold',
      width: 58,
      height: 58
    }
  },
  // --- Group bubble (collapsed grouping mode) ----------------------------
  // A translucent disc standing in for a whole bucket of people; the label
  // (value + count) sits inside it. Sized per node via data(diam).
  {
    selector: 'node.group',
    style: {
      'background-color': 'rgba(43,138,239,0.14)',
      'background-opacity': 1,
      'border-color': 'rgba(43,138,239,0.6)',
      'border-width': 2,
      shape: 'ellipse',
      width: 'data(diam)',
      height: 'data(diam)',
      label: 'data(label)',
      color: '#e9edf3',
      'font-size': 13,
      'font-weight': 'bold',
      'text-valign': 'center',
      'text-halign': 'center',
      'text-wrap': 'wrap',
      'text-max-width': 'data(diam)',
      'text-outline-color': '#0a0c10',
      'text-outline-width': 2
    }
  },
  // Expanded group backdrop: faint, dashed, label pinned to the top so it does
  // not sit under the revealed member nodes. Clicking it collapses the group.
  {
    selector: 'node.group.expanded',
    style: {
      'background-color': 'rgba(43,138,239,0.05)',
      'border-style': 'dashed',
      'border-color': 'rgba(43,138,239,0.4)',
      'font-weight': 'normal',
      'text-valign': 'top',
      'text-margin-y': 4,
      'text-max-width': 200
    }
  },
  // Selected node highlight.
  {
    selector: 'node:selected',
    style: { 'border-color': '#8cc0f7', 'border-width': 3 }
  },
  // --- Edges (directed arrows) -------------------------------------------
  {
    selector: 'edge',
    style: {
      width: 1.5,
      'line-color': (e) => closenessColor(e.data('type')),
      'target-arrow-color': (e) => closenessColor(e.data('type')),
      'target-arrow-shape': 'triangle',
      'arrow-scale': 0.9,
      'curve-style': 'bezier',
      // Two directed edges between the same pair are separated so both arrows
      // are visible instead of overlapping into a single line.
      'control-point-step-size': 22
    }
  },
  {
    selector: 'edge:selected',
    style: { width: 3.5 }
  }
];
