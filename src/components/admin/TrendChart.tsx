import { pointsToAreaPath, pointsToLinePath, scaleToPoints } from "@/lib/seo/intelligence/chart-path";

interface TrendChartProps {
  dates: string[];
  clicks: number[];
  impressions: number[];
  width?: number;
  height?: number;
}

function formatAxisDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/**
 * A plain SVG line/area chart — clicks and impressions, each scaled to
 * its own max (see chart-path.ts for why: impressions routinely run
 * 10-100x clicks, so a shared axis would flatten clicks to invisibility,
 * the same reason Search Console's own graph uses independent scales).
 * Server-rendered, no client JS/hover state — this project has no
 * charting library and didn't need one for a single time-series chart.
 */
export function TrendChart({ dates, clicks, impressions, width = 720, height = 220 }: TrendChartProps) {
  if (dates.length === 0) return null;

  const clickPoints = scaleToPoints(clicks, width, height);
  const impressionPoints = scaleToPoints(impressions, width, height);
  const maxClicks = Math.max(...clicks, 0);
  const maxImpressions = Math.max(...impressions, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 text-xs text-white/50">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-300" /> Clicks (peak {maxClicks.toLocaleString()}/day)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full border border-white/50" /> Impressions (peak {maxImpressions.toLocaleString()}/day)
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 h-auto w-full" preserveAspectRatio="none" role="img" aria-label="Clicks and impressions over time">
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={0} x2={width} y1={height * f} y2={height * f} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
        ))}
        <path d={pointsToAreaPath(clickPoints, height)} fill="rgba(252,211,77,0.12)" stroke="none" />
        <path d={pointsToLinePath(impressionPoints)} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} strokeDasharray="4 3" />
        <path d={pointsToLinePath(clickPoints)} fill="none" stroke="#fcd34d" strokeWidth={2} />
      </svg>

      <div className="mt-1 flex justify-between text-xs text-white/30">
        <span>{formatAxisDate(dates[0])}</span>
        {dates.length > 2 && <span>{formatAxisDate(dates[Math.floor(dates.length / 2)])}</span>}
        <span>{formatAxisDate(dates[dates.length - 1])}</span>
      </div>
    </div>
  );
}
