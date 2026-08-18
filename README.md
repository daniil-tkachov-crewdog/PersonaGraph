# PersonaGraph

**PersonaGraph v1.0** is a Windows desktop app for keeping track of your social
connections in one place as a knowledge graph. **Nodes are people; edges are the
connections between them.** A single fixed **Admin** node ("you") sits at the
centre, and the whole web builds outward from it — much like the Obsidian graph
view: drag any person and their connected people follow.

The app is fully local. Your graph never leaves your machine — it is saved as a
plain JSON file into a folder you choose.

---

## Structure

The codebase is split into small, single-responsibility files so that if one
part breaks it does not take the rest down with it.

```
electron/                 Desktop shell (main process + preload bridge)
  main.cjs                Window creation + native filesystem/dialog IPC
  preload.cjs             Exposes a narrow window.pg API to the renderer
src/
  main.jsx                React entry point
  App.jsx                 Top-level view switch (Graph / Settings / Account)
  state/
    graphStore.js         Source of truth: Admin node, people, directed edges
    settingsStore.js      View, sidebar fold, sync folder (persisted)
    grouping.js           Buckets people for the "All Connections" list
  graph/
    GraphCanvas.jsx       Cytoscape mount + store<->canvas reconciliation
    physics.js            cola force simulation; pins the Admin node
    cytoscapeStyles.js    Node/edge visual styling
    edgeModel.js          Two-directed-arrows-per-connection helpers
  components/
    Sidebar.jsx           Foldable left menu
    AllConnections.jsx    Grouped node list
    modals/               Person, AddPerson, and Connection dialogs
  pages/
    GraphPage.jsx         Graph + sidebar + modal orchestration
    SettingsPage.jsx      General / Sync / Connection tabs
    AccountPage.jsx       Coming soon
  io/
    serialize.js          JSON schema, metadata, filename builder
    saveGraph.js          Save flow (store -> JSON -> disk)
    loadGraph.js          Upload flow (disk -> JSON -> store)
  data/                   Field templates, groups, connection types
  styles/                 Theme tokens + global layout
```

---

## v1.0 scope & functionality

- **Graph page** — an Obsidian-style canvas. The Admin node is fixed at centre
  and cannot be moved or deleted; every other node can be dragged, and connected
  nodes follow. Every connection is **two directed arrows** (forward + back).
- **Add Person** — only from an existing node, so no person is ever orphaned.
  New people arrive with a default two-way *neutral* connection.
- **Add Connection** — each arrow's type (Good / Neutral / Bad → green / grey /
  red) is editable independently.
- **Node editor** — a tabbed pop-up per person: *Info* (General + Contacts
  profile blocks and a repeatable Speciality & Skills list), *Network* (this
  person's connections with a per-arrow type dropdown and remove, plus Add
  Connection and Add new person), *Notes* (freeform text), and *Actions* (delete
  the node; notifications *coming soon*).
- **Save Graph** — writes the full graph (all nodes, edges, and their data) plus
  metadata (saved-at time) as JSON into the folder chosen in Settings → Sync.
  Filename: `PG_[admin_name]_[dd-mm-yy]_[HH-MM].json`.
- **Upload Graph** — pick a saved file to rebuild the whole graph.
- **Settings** — *Sync* (choose the save folder) works today; *General* (dark/
  light, font size) and *Connection* (Telegram) are marked **coming soon**.
- **Account** — **coming soon**.

---

## Development rules

> **Every functionally separate part of the code — a function, a hook, a
> non-trivial block — must carry a short comment explaining what it does and any
> caveats or edge cases a future reader should know.** Keep comments brief and
> about the *why*. Every Claude session working on this repo must follow this.

Additional house rules live in `CLAUDE.md`.

---

## Run locally

```bash
npm install
npm run dev      # starts Vite + the Electron window
```

## Build a Windows installer

```bash
npm run dist     # vite build + electron-builder (Windows .exe / nsis)
```

Built with **Electron + React + Vite + Cytoscape.js (cola) + Zustand**. The
`.exe` is produced on Windows (or CI); `npm run dev` works on any platform.
