// Clique-based seed layout.
// A dense friend group — where everyone is connected to everyone — settles into
// an unreadable hairball under a plain force layout. This module gives the
// physics a good STARTING configuration instead: it finds groups of mutually
// connected people (cliques) and lays each one out evenly on a circle, i.e. a
// regular n-gon. A complete graph's force equilibrium is already roughly a
// circle, so seeding it that way lets the simulation keep the clean shape
// rather than tangling into one. The Admin node is excluded (it connects to
// everyone and would swallow every group); it stays pinned at the centre.

// Max people drawn on a single circle. A larger clique overflows into extra
// concentric-ish circles so no ring gets overcrowded.
export const MAX_PER_CIRCLE = 10;

// Enumerate all maximal cliques (size ≥ 2) with Bron–Kerbosch + pivoting.
// `adj` is a Map<id, Set<id>> of the undirected people-only graph. The graph is
// personal-scale, so the worst-case cost is irrelevant in practice.
function maximalCliques(ids, adj) {
  const result = [];
  const neigh = (v) => adj.get(v) || new Set();

  const expand = (R, P, X) => {
    if (P.size === 0 && X.size === 0) {
      if (R.length > 1) result.push([...R]);
      return;
    }
    // Pivot = the vertex in P∪X with the most neighbours in P (fewest branches).
    const union = [...P, ...X];
    let pivot = union[0];
    let best = -1;
    for (const u of union) {
      let c = 0;
      for (const v of P) if (neigh(u).has(v)) c += 1;
      if (c > best) {
        best = c;
        pivot = u;
      }
    }
    // Branch only on P-members NOT adjacent to the pivot.
    const candidates = [...P].filter((v) => !neigh(pivot).has(v));
    for (const v of candidates) {
      const nv = neigh(v);
      expand([...R, v], new Set([...P].filter((x) => nv.has(x))), new Set([...X].filter((x) => nv.has(x))));
      P.delete(v);
      X.add(v);
    }
  };

  expand([], new Set(ids), new Set());
  return result;
}

// Split an array into fixed-size chunks (for the 10-per-circle cap).
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Partition people into display clusters (one circle each). Largest cliques win
// first; each person lands in exactly one cluster. People with no person↔person
// link (only connected to the Admin, say) become singleton clusters. Clusters
// larger than MAX_PER_CIRCLE are chunked.
function buildClusters(peopleIds, adj) {
  const cliques = maximalCliques(peopleIds, adj).sort((a, b) => b.length - a.length);
  const assigned = new Set();
  const clusters = [];

  for (const clique of cliques) {
    const fresh = clique.filter((id) => !assigned.has(id));
    if (fresh.length < 2) continue; // nothing new (or would be a lone node)
    fresh.forEach((id) => assigned.add(id));
    for (const part of chunk(fresh, MAX_PER_CIRCLE)) clusters.push(part);
  }
  // Leftovers (never part of a ≥2 clique) each get their own tiny cluster.
  for (const id of peopleIds) if (!assigned.has(id)) clusters.push([id]);
  return clusters;
}

// Radius of a ring holding `n` nodes, scaled so members never crowd together.
function ringRadius(n) {
  if (n <= 1) return 0;
  const spacing = 66; // desired arc length between adjacent nodes
  return Math.max(95, (spacing * n) / (2 * Math.PI));
}

// Place `ids` evenly on a circle of radius `r` centred at `c`; a lone id sits at
// the centre. Writes into the `out` map (id → {x, y}).
function placeRing(out, ids, c, r) {
  if (ids.length === 1) {
    out.set(ids[0], { x: c.x, y: c.y });
    return;
  }
  const step = (2 * Math.PI) / ids.length;
  ids.forEach((id, i) => {
    const a = i * step - Math.PI / 2; // start at 12 o'clock
    out.set(id, { x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a) });
  });
}

// Compute seed positions for every non-Admin node.
// - one cluster  → its members ring around the centre (You in the middle);
// - many clusters → each cluster sits at its own angle on a big ring around the
//   centre, members arranged on a small circle there.
// Returns Map<id, {x, y}>.
export function computeSeedPositions({ nodes, edges, adminId, center }) {
  const peopleIds = nodes.map((n) => n.id).filter((id) => id !== adminId);
  const out = new Map();
  if (peopleIds.length === 0) return out;

  // Undirected people-only adjacency (ignore any edge touching the Admin).
  const people = new Set(peopleIds);
  const adj = new Map(peopleIds.map((id) => [id, new Set()]));
  for (const e of edges) {
    if (!people.has(e.source) || !people.has(e.target)) continue;
    adj.get(e.source).add(e.target);
    adj.get(e.target).add(e.source);
  }

  const clusters = buildClusters(peopleIds, adj);

  if (clusters.length === 1) {
    placeRing(out, clusters[0], center, ringRadius(clusters[0].length));
    return out;
  }

  // Spread cluster centres on a big ring; size it so neighbouring cluster
  // circles don't overlap.
  const maxR = Math.max(...clusters.map((c) => ringRadius(c.length)));
  const bigR = Math.max(260, maxR * 2 + 80);
  const step = (2 * Math.PI) / clusters.length;
  clusters.forEach((cluster, k) => {
    const a = k * step - Math.PI / 2;
    const cc = { x: center.x + bigR * Math.cos(a), y: center.y + bigR * Math.sin(a) };
    placeRing(out, cluster, cc, ringRadius(cluster.length));
  });
  return out;
}
