// Save Graph action.
// Glues the store, the serializer, and the Electron bridge together: read the
// current graph, turn it into JSON + a spec-compliant filename, and hand both
// to the main process to write into the user's chosen Sync folder. Returns the
// written path; throws (for the caller to surface) if no folder is set or the
// write fails.

import { useGraphStore } from '../state/graphStore.js';
import { useSettingsStore } from '../state/settingsStore.js';
import { serializeGraph, buildFilename } from './serialize.js';

export async function saveGraph() {
  const { adminName, nodes, edges } = useGraphStore.getState();
  const { syncFolder } = useSettingsStore.getState();

  // Guard: without a folder chosen in Settings we cannot save silently.
  if (!syncFolder) {
    throw new Error('Choose a sync folder in Settings → Sync first.');
  }
  // Guard: the desktop bridge must be present (should always be, in Electron).
  if (!window.pg || !window.pg.saveGraph) {
    throw new Error('Native save is only available in the desktop app.');
  }

  const json = serializeGraph({ adminName, nodes, edges });
  const filename = buildFilename(adminName);
  return window.pg.saveGraph(syncFolder, filename, json);
}
