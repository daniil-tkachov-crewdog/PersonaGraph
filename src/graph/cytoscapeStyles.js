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
  // Collapsed group bubble: same design as a normal node (it inherits the base
  // node style) with a lighter ring to hint it stands for a whole bucket. The
  // label ("UK · 3") sits beneath it like any node's name.
  {
    selector: 'node.group',
    style: {
      'border-color': '#8cc0f7',
      'border-width': 3
    }
  },
  // Expanded group: a compound container that auto-sizes around its member
  // nodes. Cytoscape compound parents are always rectangular and ignore an
  // rgba alpha in background-color (they use background-opacity instead), so we
  // use a solid tint + low opacity to get a soft, rounded, translucent panel.
  {
    selector: 'node.group.expanded',
    style: {
      shape: 'round-rectangle',
      'background-color': '#2b8aef',
      'background-opacity': 0.06,
      padding: 30,
      'border-width': 1.5,
      'border-style': 'dashed',
      'border-color': '#4a9bf0',
      'border-opacity': 0.45,
      label: 'data(label)',
      color: '#9fb2c9',
      'font-size': 12,
      'font-weight': 600,
      'text-valign': 'top',
      'text-halign': 'center',
      'text-margin-y': -4,
      'text-outline-width': 0
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
  // Aggregate edge: a bubble is involved on at least one end, so the specific
  // closeness is not meaningful — draw it neutral and a touch heavier.
  {
    selector: 'edge.agg',
    style: {
      width: 2,
      'line-color': 'rgba(200,207,217,0.32)',
      'target-arrow-color': 'rgba(200,207,217,0.32)'
    }
  },
  {
    selector: 'edge:selected',
    style: { width: 3.5 }
  }
];
