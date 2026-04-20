/**
 * Shared SVG path utilities for sparklines.
 * Used by AlignmentSparkline, ThemeSignalRow, and admin dashboard.
 */

export interface SparklinePoint {
  x: number;
  y: number;
  value: number | null;
}

/**
 * Build SVG path string + computed points from a data series.
 * Null values are treated as gaps (path is broken at those points).
 *
 * @param values  Array of numeric values (null = no data for that slot)
 * @param width   Total SVG width (including padding)
 * @param height  Total SVG height (including padding)
 * @param padX    Horizontal padding (default 4)
 * @param padY    Vertical padding (default 4)
 */
export function buildSparklinePath(
  values: (number | null)[],
  width: number,
  height: number,
  padX = 4,
  padY = 4
): { points: SparklinePoint[]; pathD: string; fillD: string; minVal: number; maxVal: number } {
  const nonNull = values.filter((v): v is number => v !== null);

  if (nonNull.length === 0) {
    return { points: [], pathD: '', fillD: '', minVal: 0, maxVal: 1 };
  }

  const minVal = Math.max(0, Math.min(...nonNull) - 0.1);
  const maxVal = Math.min(3, Math.max(...nonNull) + 0.1);
  const range = maxVal - minVal || 0.5;

  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const n = values.length;

  const points: SparklinePoint[] = values.map((v, i) => ({
    x: padX + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW),
    y: v === null ? -1 : padY + (1 - (v - minVal) / range) * innerH,
    value: v,
  }));

  // Build path with gaps for null segments
  let pathD = '';
  let inSegment = false;

  for (const pt of points) {
    if (pt.value === null) {
      inSegment = false;
      continue;
    }
    if (!inSegment) {
      pathD += `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)} `;
      inSegment = true;
    } else {
      pathD += `L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)} `;
    }
  }

  // Fill area: use only the valid contiguous segments
  const validPts = points.filter((p) => p.value !== null);
  let fillD = '';
  if (validPts.length >= 2) {
    const first = validPts[0];
    const last = validPts[validPts.length - 1];
    const bottom = padY + innerH;
    fillD = `${pathD} L ${last.x.toFixed(1)} ${bottom.toFixed(1)} L ${first.x.toFixed(1)} ${bottom.toFixed(1)} Z`;
  }

  return { points, pathD: pathD.trim(), fillD, minVal, maxVal };
}

/**
 * Get status color for a theme score (0–3 range).
 */
export function getThemeScoreColor(avg: number | null): string {
  if (avg === null) return '#C4C4CC';
  if (avg < 1.5) return '#C47058'; // Under Load
  if (avg < 2.0) return '#6B8FB5'; // Stabilizing
  if (avg < 2.5) return '#D4A843'; // Forming
  return '#5B8C5A';                // Aligned
}

/**
 * Get alignment score color (0–100 range).
 */
export function getAlignmentScoreColor(score: number | null): string {
  if (score === null) return '#C8C4BF';
  if (score < 38) return '#C47058';
  if (score < 50) return '#6B8FB5';
  if (score < 75) return '#D4A843';
  return '#5B8C5A';
}
