// Upload Graph action.
// Asks the main process to open the native file picker, reads the chosen file,
// parses it through the shared deserializer, and swaps it into the store. Any
// failure (cancelled, bad file) is turned into a value/throw the caller can act
// on — a cancelled picker simply returns false, a corrupt file throws.

import { useGraphStore } from '../state/graphStore.js';
import { deserializeGraph } from './serialize.js';

export async function loadGraph() {
  if (!window.pg || !window.pg.openGraph) {
    throw new Error('Native open is only available in the desktop app.');
  }
  const picked = await window.pg.openGraph();
  if (!picked) return false; // user cancelled the picker

  const graph = deserializeGraph(picked.content); // throws on invalid files
  useGraphStore.getState().replaceGraph(graph);
  return true;
}
