// Pure SVG path math for the analytics trend chart — no charting library
// added (this project's own stack principle: "No SDK dependencies where
// avoidable") for what's fundamentally one line chart. Kept separate from
// the React component so the actual math is unit-tested; the component
// itself is plain rendering, verified in a real browser instead (this
// project's established split for Server Components with no test file).

export interface ChartPoint {
  x: number;
  y: number;
}

/**
 * Maps a series of values onto an SVG viewport of the given width/height,
 * scaled independently to its OWN max (not a shared scale with any other
 * series) — the same choice Search Console's own dashboard makes for
 * clicks vs. impressions, since impressions are routinely 10-100x clicks
 * and a shared scale would flatten the clicks line to invisibility.
 * Values of all zero degrade to a flat line at the bottom rather than
 * dividing by zero.
 */
export function scaleToPoints(values: number[], width: number, height: number): ChartPoint[] {
  if (values.length === 0) return [];
  const max = Math.max(...values, 0);
  const stepX = values.length > 1 ? width / (values.length - 1) : 0;
  return values.map((v, i) => ({
    x: i * stepX,
    y: max > 0 ? height - (v / max) * height : height,
  }));
}

export function pointsToLinePath(points: ChartPoint[]): string {
  if (points.length === 0) return "";
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
}

/** Same line, closed down to the baseline — for a filled area under the curve. */
export function pointsToAreaPath(points: ChartPoint[], height: number): string {
  if (points.length === 0) return "";
  const line = pointsToLinePath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${line} L${last.x.toFixed(2)},${height.toFixed(2)} L${first.x.toFixed(2)},${height.toFixed(2)} Z`;
}
