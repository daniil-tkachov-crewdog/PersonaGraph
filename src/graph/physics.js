// Physics / layout configuration (cytoscape-cola).
// This is what gives the Obsidian-like feel: a continuous force simulation so
// that dragging one node tugs its neighbours (and their edges) along, while the
// Admin node stays pinned dead-centre. Isolated here so the simulation can be
// tuned without touching rendering or interaction code.

import cytoscape from 'cytoscape';
import cola from 'cytoscape-cola';

// Register the cola layout extension exactly once. Re-registering throws in
// some builds, so we guard with a module-level flag.
let registered = false;
export function registerPhysics() {
  if (registered) return;
  cytoscape.use(cola);
  registered = true;
}

// Cola options tuned for interactive editing:
// - infinite: keep the simulation alive so drags propagate continuously;
// - fit:false so the viewport doesn't jump every tick;
// - edgeLength gives a comfortable spacing between connected people.
export const colaOptions = {
  name: 'cola',
  animate: true,
  infinite: true,
  fit: false,
  edgeLength: 120,
  nodeSpacing: 12,
  // Respect per-node locks (see pinAdmin) so the Admin never drifts.
  handleDisconnected: true
};

// Pin the Admin node to the centre of the current viewport and lock it so
// neither the user nor the simulation can move it. Called after the graph and
// layout are mounted. Caveat: if called before the node exists it is a no-op.
export function pinAdmin(cy, adminId) {
  const admin = cy.getElementById(adminId);
  if (admin.empty()) return;
  const center = { x: cy.width() / 2, y: cy.height() / 2 };
  admin.position(center);
  admin.lock(); // cola and dragging both honour a locked node
  admin.ungrabify(); // belt-and-braces: no grab handle at all
}
