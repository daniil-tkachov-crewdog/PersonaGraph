// GraphCanvas — the interactive Obsidian-style graph surface.
// Responsibilities, and nothing more:
//   1. mount a Cytoscape instance into a div;
//   2. keep that instance in sync with the Zustand graph store (add/remove/
//      relabel nodes and edges as the store changes) WITHOUT resetting the
//      running physics or node positions;
//   3. translate canvas interactions into intent callbacks (open a person,
//      open an edge) that the parent turns into modals.
// All look lives in cytoscapeStyles.js and all physics in physics.js.

import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import { useGraphStore, ADMIN_ID } from '../state/graphStore.js';
import { cytoscapeStyles } from './cytoscapeStyles.js';
import { registerPhysics, colaOptions, pinAdmin } from './physics.js';

// Map a store node to a Cytoscape element. The Admin gets a class so the
// stylesheet can single it out; `label` is what the canvas prints.
function toNodeEl(n) {
  return {
    group: 'nodes',
    data: { id: n.id, label: n.name || 'Unnamed' },
    classes: n.id === ADMIN_ID ? 'admin' : ''
  };
}

// Map a store edge (already directed) to a Cytoscape element.
function toEdgeEl(e) {
  return {
    group: 'edges',
    data: { id: e.id, source: e.source, target: e.target, type: e.type }
  };
}

export default function GraphCanvas({ onOpenPerson, onOpenEdge }) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);

  // --- Mount / unmount the Cytoscape instance (once) ----------------------
  useEffect(() => {
    registerPhysics();
    const cy = cytoscape({
      container: containerRef.current,
      style: cytoscapeStyles,
      // Seed with whatever the store holds at mount time.
      elements: [
        ...useGraphStore.getState().nodes.map(toNodeEl),
        ...useGraphStore.getState().edges.map(toEdgeEl)
      ],
      minZoom: 0.2,
      maxZoom: 4,
      // Higher = the mouse wheel zooms in bigger steps (was a very gentle 0.2).
      wheelSensitivity: 0.9
    });
    cyRef.current = cy;

    // Start the continuous physics and pin the Admin to centre.
    const layout = cy.layout(colaOptions);
    layout.run();
    pinAdmin(cy, ADMIN_ID);
    // Re-centre the Admin if the window (and thus the canvas) is resized.
    const onResize = () => pinAdmin(cy, ADMIN_ID);
    cy.on('resize', onResize);

    // Interaction wiring: tapping a node/edge opens the relevant modal.
    cy.on('tap', 'node', (evt) => onOpenPerson(evt.target.id()));
    cy.on('tap', 'edge', (evt) => onOpenEdge(evt.target.id()));

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Reconcile store -> canvas on every graph change --------------------
  // We diff by id rather than rebuilding, so cola keeps running and existing
  // nodes keep their positions. Only genuinely new/removed/changed elements
  // are touched.
  useEffect(() => {
    const unsub = useGraphStore.subscribe((state) => {
      const cy = cyRef.current;
      if (!cy) return;

      const wantNodes = new Map(state.nodes.map((n) => [n.id, n]));
      const wantEdges = new Map(state.edges.map((e) => [e.id, e]));

      cy.batch(() => {
        // Remove canvas elements no longer in the store.
        cy.nodes().forEach((el) => {
          if (!wantNodes.has(el.id())) el.remove();
        });
        cy.edges().forEach((el) => {
          if (!wantEdges.has(el.id())) el.remove();
        });

        // Add or update nodes.
        for (const [id, n] of wantNodes) {
          const el = cy.getElementById(id);
          if (el.empty()) {
            cy.add(toNodeEl(n));
          } else if (el.data('label') !== (n.name || 'Unnamed')) {
            el.data('label', n.name || 'Unnamed');
          }
        }

        // Add or update edges (type can change via the ConnectionModal).
        for (const [id, e] of wantEdges) {
          const el = cy.getElementById(id);
          if (el.empty()) {
            cy.add(toEdgeEl(e));
          } else if (el.data('type') !== e.type) {
            el.data('type', e.type);
          }
        }
      });

      // Keep the Admin pinned and re-energise physics so new nodes settle.
      pinAdmin(cy, ADMIN_ID);
      cy.layout(colaOptions).run();
    });

    return unsub;
  }, []);

  // Step the zoom by a multiplicative factor, anchored at the canvas centre so
  // the view stays put. Used by the +/- buttons.
  const zoomBy = (factor) => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.zoom({
      level: cy.zoom() * factor,
      renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 }
    });
  };

  // The canvas fills its parent; the page controls the surrounding layout.
  // Zoom controls sit in the bottom-right corner of the canvas.
  return (
    <>
      <div ref={containerRef} className="graph-canvas" />
      <div className="zoom-controls">
        <button className="zoom-btn" aria-label="Zoom in" onClick={() => zoomBy(1.25)}>
          +
        </button>
        <button className="zoom-btn" aria-label="Zoom out" onClick={() => zoomBy(1 / 1.25)}>
          −
        </button>
      </div>
    </>
  );
}
