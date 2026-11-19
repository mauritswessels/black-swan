/**
 * Cutting big provinces into smaller ones (Stage K4), used by build-map.mjs.
 *
 * Many provinces are a single modern region (a German state, a Russian oblast), so they cannot be
 * split along modern borders. Instead a province is cut with a line across its long side, placed
 * so the two parts have the share of its area we want, and given a gentle seeded wiggle so it does
 * not look ruled. A province cut into k parts is cut in two, then each half again, and so on.
 *
 * A cut ends on the province's outline. Where that point lies on a border with a neighbour, the
 * same point is added to the neighbour's outline too, so the two still share their border exactly
 * (otherwise the map would think there is a sliver of coast there).
 *
 * All the geometry is done on a flat map around the province: x = longitude x cos(latitude), y =
 * latitude. Provinces are small enough for that to be accurate.
 */

const ringArea = (ring) => {
  let a = 0;
  for (let i = 0; i < ring.length - 1; i++) a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  return a / 2;
};

const inRing = ([x, y], ring) => {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
};
const inPolygon = (pt, poly) => inRing(pt, poly[0]) && !poly.slice(1).some((h) => inRing(pt, h));

/** Do segments ab and cd cross (touching at an end does not count)? */
const crosses = (a, b, c, d) => {
  const o = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const d1 = o(c, d, a), d2 = o(c, d, b), d3 = o(a, b, c), d4 = o(a, b, d);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
};

/**
 * Make a cutter over a list of province geometries (each an array of polygons, each an array of
 * closed rings of [lon, lat]). The list is changed in place: cut parts are appended to it.
 */
export function makeCutter(geoms, rnd) {
  const same = (p, q) => p[0] === q[0] && p[1] === q[1];

  /** Put `x` into every other outline that has the edge a-b, between a and b. */
  function shareEdgePoint(self, a, b, x) {
    geoms.forEach((g, gi) => {
      if (gi === self) return;
      for (const poly of g) for (const ring of poly) {
        for (let i = 0; i < ring.length - 1; i++) {
          if ((same(ring[i], a) && same(ring[i + 1], b)) || (same(ring[i], b) && same(ring[i + 1], a))) {
            ring.splice(i + 1, 0, [x[0], x[1]]);
            i++;
          }
        }
      }
    });
  }

  /**
   * Cut geometry `index` in two, so that about `frac` of its area is on one side. The part with
   * `frac` stays at `index`; the other is appended. Returns the new part's index.
   */
  function cutInTwo(index, frac, label) {
    const g = geoms[index];
    // The biggest polygon is the one that is cut; the others (islands) go whole to one side.
    const flatArea = (poly, kx) => Math.abs(ringArea(poly[0].map(([x, y]) => [x * kx, y]))) - poly.slice(1).reduce((s, h) => s + Math.abs(ringArea(h.map(([x, y]) => [x * kx, y]))), 0);
    const lat0 = g[0][0].reduce((s, p) => s + p[1], 0) / g[0][0].length;
    const kx = Math.cos((lat0 * Math.PI) / 180);
    const P = ([lon, lat]) => [lon * kx, lat];
    const main = g.reduce((best, poly, i) => (flatArea(poly, kx) > flatArea(g[best], kx) ? i : best), 0);
    const flat = g.map((poly) => poly.map((ring) => ring.map(P)));

    // Sample the land on a grid, to find the long axis and where to cut.
    let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
    for (const poly of flat) for (const [x, y] of poly[0]) (x0 = Math.min(x0, x), y0 = Math.min(y0, y), x1 = Math.max(x1, x), y1 = Math.max(y1, y));
    const step = Math.sqrt(((x1 - x0) * (y1 - y0)) / 3000);
    const samples = [];
    for (let x = x0 + step / 2; x < x1; x += step) for (let y = y0 + step / 2; y < y1; y += step) if (flat.some((poly) => inPolygon([x, y], poly))) samples.push([x, y]);
    if (samples.length < 50) throw new Error(`${label}: too small to cut`);
    const mx = samples.reduce((s, p) => s + p[0], 0) / samples.length;
    const my = samples.reduce((s, p) => s + p[1], 0) / samples.length;
    let cxx = 0, cyy = 0, cxy = 0;
    for (const [x, y] of samples) (cxx += (x - mx) ** 2, cyy += (y - my) ** 2, cxy += (x - mx) * (y - my));
    const axis = 0.5 * Math.atan2(2 * cxy, cxx - cyy);

    const ring = flat[main][0];
    const n = ring.length - 1;
    for (const turn of [0, 12, -12, 25, -25, 40, -40, 60, -60, 90]) {
      const a = axis + (turn * Math.PI) / 180;
      const u = [Math.cos(a), Math.sin(a)];
      const along = samples.map((p) => p[0] * u[0] + p[1] * u[1]).sort((p, q) => p - q);
      for (const dq of [0, 0.03, -0.03, 0.06, -0.06, 0.1, -0.1]) {
        const q = Math.min(0.92, Math.max(0.08, frac + dq));
        let t = along[Math.floor(q * (along.length - 1))] + 1e-9;
        let s = ring.map((p) => p[0] * u[0] + p[1] * u[1] - t);
        if (s.some((v) => v === 0)) (t += 1e-7, (s = ring.map((p) => p[0] * u[0] + p[1] * u[1] - t)));
        const cuts = [];
        for (let i = 0; i < n; i++) if (s[i] < 0 !== s[i + 1] < 0) cuts.push(i);
        if (cuts.length !== 2) continue;
        // The line must not run through a lake or an enclave inside the polygon.
        if (flat[main].slice(1).some((h) => h.some((p) => p[0] * u[0] + p[1] * u[1] < t) && h.some((p) => p[0] * u[0] + p[1] * u[1] > t))) continue;
        const [i, j] = cuts;
        const at = (k) => {
          const f = s[k] / (s[k] - s[k + 1]);
          return [ring[k][0] + f * (ring[k + 1][0] - ring[k][0]), ring[k][1] + f * (ring[k + 1][1] - ring[k][1])];
        };
        const X1 = at(i), X2 = at(j);
        // A gently wiggling line from X1 to X2, checked to stay inside the polygon.
        const len = Math.hypot(X2[0] - X1[0], X2[1] - X1[1]);
        const m = Math.max(1, Math.min(14, Math.round((len * 111) / 30)));
        const w1 = rnd() * 2 - 1, w2 = rnd() * 2 - 1, noise = Array.from({ length: m }, () => rnd() * 2 - 1);
        const nx = -(X2[1] - X1[1]) / len, ny = (X2[0] - X1[0]) / len;
        let line = null;
        for (const amp of [0.07, 0.035, 0.015, 0]) {
          const pts = [];
          for (let k = 1; k <= m; k++) {
            const f = k / (m + 1);
            const off = amp * len * (Math.sin(Math.PI * f) * w1 + 0.5 * Math.sin(2 * Math.PI * f) * w2 + 0.25 * Math.sin(Math.PI * f) * noise[k - 1]);
            pts.push([X1[0] + f * (X2[0] - X1[0]) + off * nx, X1[1] + f * (X2[1] - X1[1]) + off * ny]);
          }
          if (amp === 0) { line = pts; break; }
          const path = [X1, ...pts, X2];
          let ok = pts.every((p) => inPolygon(p, flat[main]));
          for (let k = 0; ok && k < path.length - 1; k++) {
            for (const r of flat[main]) {
              for (let e = 0; e < r.length - 1; e++) {
                if (r === ring && ((k === 0 && e === i) || (k === path.length - 2 && e === j))) continue;
                if (crosses(path[k], path[k + 1], r[e], r[e + 1])) { ok = false; break; }
              }
              if (!ok) break;
            }
          }
          if (ok) { line = pts; break; }
        }
        const back = (p) => [p[0] / kx, p[1]];
        const geo = g[main][0];
        const x1g = back(X1), x2g = back(X2), lineG = line.map(back);
        const V = geo.slice(0, n);
        const partA = [x1g, ...V.slice(i + 1, j + 1), x2g, ...[...lineG].reverse(), x1g];
        const partB = [x2g, ...V.slice(j + 1), ...V.slice(0, i + 1), x1g, ...lineG, x2g];
        // partA holds the vertices just after the first cut; is that the `frac` side?
        const aIsLow = s[i + 1] < 0;
        const low = aIsLow ? partA : partB, high = aIsLow ? partB : partA;
        const lowPoly = [low], highPoly = [high];
        for (const h of g[main].slice(1)) (inRing(P(h[0]), low.map(P)) ? lowPoly : highPoly).push(h);
        const lowG = [lowPoly], highG = [highPoly];
        g.forEach((poly, pi) => {
          if (pi === main) return;
          const c = poly[0].reduce((acc, p) => [acc[0] + p[0] / poly[0].length, acc[1] + p[1] / poly[0].length], [0, 0]);
          (P(c)[0] * u[0] + P(c)[1] * u[1] < t ? lowG : highG).push(poly);
        });
        const area = (geom) => geom.reduce((sum, poly) => sum + flatArea(poly, kx), 0);
        const got = area(lowG) / (area(lowG) + area(highG));
        if (Math.abs(got - frac) > 0.12) continue;
        shareEdgePoint(index, V[i], V[(i + 1) % n], x1g);
        shareEdgePoint(index, V[j], V[(j + 1) % n], x2g);
        geoms[index] = lowG;
        geoms.push(highG);
        return geoms.length - 1;
      }
    }
    throw new Error(`${label}: found no clean cut`);
  }

  /** Cut geometry `index` into k parts; returns their indices (the first is `index`). */
  function cutInto(index, k, label) {
    if (k <= 1) return [index];
    const a = Math.floor(k / 2);
    const other = cutInTwo(index, a / k, label);
    return [...cutInto(index, a, label), ...cutInto(other, k - a, label)];
  }

  /** Which of these geometries holds the point? */
  const holding = (indices, [lon, lat]) =>
    indices.find((gi) => {
      const kx = Math.cos((lat * Math.PI) / 180);
      return geoms[gi].some((poly) => inPolygon([lon * kx, lat], poly.map((r) => r.map(([x, y]) => [x * kx, y]))));
    });

  return { cutInto, holding };
}
