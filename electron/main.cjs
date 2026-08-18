// Electron main process (CommonJS).
// Owns the OS-level concerns the renderer is not allowed to touch directly:
// creating the window, and all native filesystem access (folder picker,
// writing the graph file, opening a graph file). The renderer reaches these
// only through the narrow `window.pg` bridge defined in preload.cjs.
//
// Why .cjs (not .js): the project's package.json sets "type":"module", which
// would make a .js file ESM. Electron's ESM main-process loader is brittle and
// was crashing on startup, so the two Electron process files are pinned to
// CommonJS. The renderer under src/ stays ESM — Vite bundles it separately.

const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const { readFile, writeFile } = require('node:fs/promises');
const path = require('node:path');

// PG_DEV is set by the dev script; in dev we load the live Vite server so
// hot-reload works, otherwise we load the static build from dist/.
const isDev = process.env.PG_DEV === '1';

// Keep a module-level reference so the window is not garbage-collected.
let mainWindow = null;

// Create the single application window with a locked-down renderer:
// no node integration, context isolation on, preload bridge only.
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0f1115',
    title: 'PersonaGraph',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// --- IPC: choose a sync folder -------------------------------------------
// Opens the native directory picker and returns the chosen absolute path,
// or null if the user cancelled. Used by Settings → Sync tab.
ipcMain.handle('pg:choose-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Choose the folder where PersonaGraph saves your graph',
    properties: ['openDirectory', 'createDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

// --- IPC: save the graph --------------------------------------------------
// Writes `json` into `folder` under the given `filename`. The renderer builds
// both the JSON payload and the PG_[name]_[date]_[time] filename; the main
// process only performs the actual disk write so the renderer stays sandboxed.
// Returns the full path on success. Caveat: if `folder` is missing/unwritable
// the fs error is propagated back to the renderer to surface to the user.
ipcMain.handle('pg:save-graph', async (_event, { folder, filename, json }) => {
  if (!folder) throw new Error('No sync folder selected.');
  const fullPath = path.join(folder, filename);
  await writeFile(fullPath, json, 'utf-8');
  return fullPath;
});

// --- IPC: open a graph ----------------------------------------------------
// Shows the file picker (JSON only) and returns the file's text content plus
// its path, or null if cancelled. Parsing/validation happens in the renderer.
ipcMain.handle('pg:open-graph', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Open a PersonaGraph file',
    filters: [{ name: 'PersonaGraph', extensions: ['json'] }],
    properties: ['openFile']
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  const filePath = result.filePaths[0];
  const content = await readFile(filePath, 'utf-8');
  return { path: filePath, content };
});

// Standard Electron lifecycle: create on ready, respect macOS re-activate,
// quit when all windows close (except macOS convention).
app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
