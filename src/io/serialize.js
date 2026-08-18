// Serialization: graph state <-> on-disk JSON.
// One place that knows the file schema, so Save and Load can never disagree.
// The payload captures EVERYTHING needed to fully rebuild the graph (every
// node with all its data, every directed edge) plus metadata (a saved-at
// timestamp and a schema version for future migrations).

const SCHEMA_VERSION = 1;

// Build the JSON string written to disk. `pretty` keeps it human-readable,
// which matters for a local, user-owned file they may inspect.
export function serializeGraph({ adminName, nodes, edges }) {
  const payload = {
    app: 'PersonaGraph',
    schemaVersion: SCHEMA_VERSION,
    metadata: {
      adminName,
      savedAt: new Date().toISOString(),
      nodeCount: nodes.length,
      edgeCount: edges.length
    },
    graph: { adminName, nodes, edges }
  };
  return JSON.stringify(payload, null, 2);
}

// Parse a file's text back into the shape replaceGraph() expects. Throws a
// clear error on anything that isn't a PersonaGraph file so the caller can
// show a useful message instead of a cryptic crash.
export function deserializeGraph(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }
  const graph = parsed && parsed.graph;
  if (!graph || !Array.isArray(graph.nodes)) {
    throw new Error('That file is not a PersonaGraph graph.');
  }
  return {
    adminName: graph.adminName || 'Me',
    nodes: graph.nodes,
    edges: Array.isArray(graph.edges) ? graph.edges : []
  };
}

// Build the save filename per the spec: PG_[admin_name]_[dd-mm-yy]_[HH-MM].
// Slashes/colons are illegal in Windows filenames, so the spec's dd/mm/yy and
// clock time are rendered with dashes. The admin name is sanitised to stay a
// valid filename component.
export function buildFilename(adminName, when = new Date()) {
  const safeName = (adminName || 'Me').replace(/[^a-z0-9_-]+/gi, '-').slice(0, 40);
  const dd = String(when.getDate()).padStart(2, '0');
  const mm = String(when.getMonth() + 1).padStart(2, '0');
  const yy = String(when.getFullYear()).slice(-2);
  const hh = String(when.getHours()).padStart(2, '0');
  const min = String(when.getMinutes()).padStart(2, '0');
  return `PG_${safeName}_${dd}-${mm}-${yy}_${hh}-${min}.json`;
}
