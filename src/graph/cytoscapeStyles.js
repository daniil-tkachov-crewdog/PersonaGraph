// Cytoscape visual stylesheet.
// Purely presentational: maps node/edge DATA to how they look. Kept apart from
// GraphCanvas so the look can change without touching interaction logic.
// Edge colour encodes connection type; the Admin node is visually distinct and
// larger so "you" is always obvious at the centre.

const TYPE_COLORS = {
  neutral: '#8a94a6',
  positive: '#3fb27f',
  negative: '#d1495b'
};

export const cytoscapeStyles = [
  // --- Person nodes -------------------------------------------------------
  {
    selector: 'node',
    style: {
      'background-color': '#2b8aef', // accent blue
      'border-color': '#1b1e24',
      'border-width': 2,
      label: 'data(label)',
      color: '#e8ecf2',
      'font-size': 12,
      'text-valign': 'bottom',
      'text-margin-y': 6,
      'text-halign': 'center',
      width: 34,
      height: 34,
      'text-outline-color': '#0f1115',
      'text-outline-width': 2
    }
  },
  // --- Admin node ---------------------------------------------------------
  // Bigger, white, ungrabbable feel — the fixed anchor of the whole graph.
  {
    selector: 'node.admin',
    style: {
      'background-color': '#f5f7fa',
      'border-color': '#8a94a6',
      color: '#ffffff',
      'font-size': 14,
      'font-weight': 'bold',
      width: 54,
      height: 54
    }
  },
  // Selected node highlight.
  {
    selector: 'node:selected',
    style: { 'border-color': '#f5f7fa', 'border-width': 3 }
  },
  // --- Edges (directed arrows) -------------------------------------------
  {
    selector: 'edge',
    style: {
      width: 2,
      'line-color': (e) => TYPE_COLORS[e.data('type')] || TYPE_COLORS.neutral,
      'target-arrow-color': (e) => TYPE_COLORS[e.data('type')] || TYPE_COLORS.neutral,
      'target-arrow-shape': 'triangle',
      'arrow-scale': 1,
      'curve-style': 'bezier',
      // Two directed edges between the same pair are separated so both arrows
      // are visible instead of overlapping into a single line.
      'control-point-step-size': 22
    }
  },
  {
    selector: 'edge:selected',
    style: { width: 4 }
  }
];
