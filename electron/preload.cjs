// Preload bridge (CommonJS).
// Runs in an isolated context with access to Electron internals, and exposes
// ONLY these functions to the renderer as `window.pg`. This is the whole
// surface area the web app has to the OS — nothing else leaks in. Each call is
// a thin wrapper over an ipcMain.handle in electron/main.cjs.
// Must be CommonJS (require): preload runs before the page and needs `require`,
// which would be unavailable if this were treated as an ESM module.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pg', {
  // Ask the user to pick a sync folder. Resolves to an absolute path or null.
  chooseFolder: () => ipcRenderer.invoke('pg:choose-folder'),

  // Persist the graph. `folder`/`filename` decide where; `json` is the payload.
  // Resolves to the written file's full path, or rejects with the fs error.
  saveGraph: (folder, filename, json) =>
    ipcRenderer.invoke('pg:save-graph', { folder, filename, json }),

  // Open a graph file via the native picker. Resolves to {path, content} or null.
  openGraph: () => ipcRenderer.invoke('pg:open-graph'),

  // True when running inside the Electron shell — lets the renderer degrade
  // gracefully (e.g. disable native save) if ever loaded in a plain browser.
  isDesktop: true
});
