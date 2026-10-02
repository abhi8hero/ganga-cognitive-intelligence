import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, Trash2, X, Sun, Moon, LayoutGrid, Database, Upload, SlidersHorizontal,
  Sigma, Hash, Divide, ArrowDownToLine, ArrowUpToLine, MoveVertical, Activity, Shapes, ArrowUpDown,
  BarChart3, BarChartHorizontal, LayoutDashboard, Filter, Gauge, Combine,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Treemap, FunnelChart, Funnel, LabelList, RadialBarChart, RadialBar, ComposedChart,
} from 'recharts';
import { LineChart as LineChartIcon, PieChart as PieChartIcon, AreaChart as AreaChartIcon, ScatterChart as ScatterChartIcon, Radar as RadarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useTheme } from '@/contexts/ThemeContext';
import TornadoLogo from '@/components/TornadoLogo';
import HUDBackground from '@/components/HUDBackground';
import { toast } from 'sonner';
import type { ColumnSchema, RowData } from '@/types';

// ─── Types ──────────────────────────────────────────────────────────
type ChartType = 'bar' | 'hbar' | 'line' | 'area' | 'pie' | 'scatter' | 'radar' | 'treemap' | 'funnel' | 'radial' | 'composed';
type Aggregation = 'sum' | 'count' | 'average' | 'min' | 'max' | 'median' | 'stddev' | 'distinct' | 'range';

interface ChartInstance {
  id: string;
  chartType: ChartType;
  xColumn: string;
  yColumn: string | null;
  aggregation: Aggregation;
  schemeId: string;
  customColor?: string;
}

interface AggregatedPoint {
  name: string;
  value: number;
  count: number;
}

interface RawPoint {
  x: number;
  y: number;
}

interface ChartDataResult {
  kind: 'aggregated' | 'raw';
  aggregatedPoints: AggregatedPoint[];
  rawPoints: RawPoint[];
  skipped: number;
  scanned: number;
  groupCount: number;
  truncatedNote: string | null;
}

/** Structural theme colors (axes, grids, tooltip chrome) per light/dark mode.
 *  Series colors come from the user-selected ColorScheme instead. */
interface ChartTheme {
  grid: string;
  tick: string;
  card: string;
  border: string;
  text: string;
  muted: string;
}

const DARK_THEME: ChartTheme = {
  grid: 'hsl(219 40% 18%)',
  tick: 'hsl(217 20% 64%)',
  card: 'hsl(222 46% 8%)',
  border: 'hsl(219 40% 20%)',
  text: 'hsl(213 34% 93%)',
  muted: 'hsl(217 20% 64%)',
};

const LIGHT_THEME: ChartTheme = {
  grid: 'hsl(216 30% 87%)',
  tick: 'hsl(218 18% 44%)',
  card: 'hsl(0 0% 100%)',
  border: 'hsl(216 30% 87%)',
  text: 'hsl(222 47% 12%)',
  muted: 'hsl(218 18% 44%)',
};

// ─── Color schemes (series colors) ──────────────────────────────────
interface ColorScheme {
  id: string;
  label: string;
  primary: string;
  secondary: string;
  colors: string[];
}

const COLOR_SCHEMES: ColorScheme[] = [
  {
    id: 'electric',
    label: 'Electric Blue',
    primary: 'hsl(212 94% 58%)',
    secondary: 'hsl(199 92% 62%)',
    colors: [
      'hsl(212 94% 58%)', 'hsl(199 92% 62%)', 'hsl(212 94% 70%)', 'hsl(203 92% 75%)',
      'hsl(224 76% 66%)', 'hsl(199 89% 48%)', 'hsl(217 91% 68%)', 'hsl(220 84% 46%)',
      'hsl(190 85% 55%)',
    ],
  },
  {
    id: 'ocean',
    label: 'Ocean Cyan',
    primary: 'hsl(191 88% 48%)',
    secondary: 'hsl(174 72% 45%)',
    colors: [
      'hsl(191 88% 48%)', 'hsl(174 72% 45%)', 'hsl(199 92% 60%)', 'hsl(184 70% 52%)',
      'hsl(205 82% 62%)', 'hsl(168 68% 42%)', 'hsl(196 90% 68%)', 'hsl(178 62% 38%)',
      'hsl(210 76% 70%)',
    ],
  },
  {
    id: 'emerald',
    label: 'Emerald',
    primary: 'hsl(160 84% 39%)',
    secondary: 'hsl(142 72% 45%)',
    colors: [
      'hsl(160 84% 39%)', 'hsl(142 72% 45%)', 'hsl(172 66% 42%)', 'hsl(132 60% 48%)',
      'hsl(180 60% 40%)', 'hsl(150 78% 52%)', 'hsl(165 70% 56%)', 'hsl(126 52% 42%)',
      'hsl(175 62% 62%)',
    ],
  },
  {
    id: 'sunset',
    label: 'Sunset',
    primary: 'hsl(22 92% 55%)',
    secondary: 'hsl(4 84% 58%)',
    colors: [
      'hsl(22 92% 55%)', 'hsl(4 84% 58%)', 'hsl(38 95% 58%)', 'hsl(12 88% 62%)',
      'hsl(32 90% 50%)', 'hsl(348 82% 56%)', 'hsl(46 94% 62%)', 'hsl(16 80% 48%)',
      'hsl(28 96% 70%)',
    ],
  },
  {
    id: 'violet',
    label: 'Violet Storm',
    primary: 'hsl(258 88% 62%)',
    secondary: 'hsl(212 94% 62%)',
    colors: [
      'hsl(258 88% 62%)', 'hsl(212 94% 62%)', 'hsl(276 74% 62%)', 'hsl(236 84% 66%)',
      'hsl(292 68% 58%)', 'hsl(222 88% 70%)', 'hsl(266 82% 72%)', 'hsl(244 76% 56%)',
      'hsl(284 74% 68%)',
    ],
  },
  {
    id: 'rose',
    label: 'Rose',
    primary: 'hsl(344 82% 56%)',
    secondary: 'hsl(318 70% 52%)',
    colors: [
      'hsl(344 82% 56%)', 'hsl(318 70% 52%)', 'hsl(356 86% 64%)', 'hsl(332 74% 60%)',
      'hsl(6 82% 60%)', 'hsl(310 62% 48%)', 'hsl(350 90% 72%)', 'hsl(326 66% 44%)',
      'hsl(16 84% 64%)',
    ],
  },
  {
    id: 'amber',
    label: 'Amber Gold',
    primary: 'hsl(38 96% 50%)',
    secondary: 'hsl(48 96% 55%)',
    colors: [
      'hsl(38 96% 50%)', 'hsl(48 96% 55%)', 'hsl(28 92% 52%)', 'hsl(52 92% 58%)',
      'hsl(20 88% 54%)', 'hsl(42 88% 62%)', 'hsl(34 94% 66%)', 'hsl(56 86% 52%)',
      'hsl(26 82% 46%)',
    ],
  },
  {
    id: 'slate',
    label: 'Slate Mono',
    primary: 'hsl(217 24% 52%)',
    secondary: 'hsl(212 32% 64%)',
    colors: [
      'hsl(217 24% 52%)', 'hsl(212 32% 64%)', 'hsl(220 20% 44%)', 'hsl(210 36% 72%)',
      'hsl(224 18% 38%)', 'hsl(206 28% 58%)', 'hsl(218 26% 68%)', 'hsl(216 16% 34%)',
      'hsl(212 30% 78%)',
    ],
  },
];

const DEFAULT_CUSTOM_COLOR = '#2f7ff0';

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 220, s: 20, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let hh: number;
  if (max === r) hh = ((g - b) / d + (g < b ? 6 : 0));
  else if (max === g) hh = (b - r) / d + 2;
  else hh = (r - g) / d + 4;
  return { h: Math.round(hh * 60), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/** Derives a 9-shade scheme from any hex accent so Custom colors work across all chart types. */
function deriveSchemeFromHex(hex: string, isDark: boolean): ColorScheme {
  const { h, s, l } = hexToHsl(hex);
  const sat = Math.min(92, Math.max(38, s));
  const baseL = isDark ? Math.min(66, Math.max(50, l)) : Math.min(52, Math.max(36, l));
  const colors = Array.from({ length: 9 }, (_, i) => {
    const light = Math.min(82, Math.max(28, baseL + 14 - i * 4));
    const hue = (h + i * 10 - 20 + 360) % 360;
    return `hsl(${hue} ${sat}% ${Math.round(light)}%)`;
  });
  return {
    id: 'custom',
    label: 'Custom',
    primary: `hsl(${h} ${sat}% ${baseL}%)`,
    secondary: `hsl(${(h + 18) % 360} ${sat}% ${Math.min(80, baseL + 10)}%)`,
    colors,
  };
}

function resolveScheme(schemeId: string, customColor: string, isDark: boolean): ColorScheme {
  if (schemeId === 'custom') return deriveSchemeFromHex(customColor || DEFAULT_CUSTOM_COLOR, isDark);
  return COLOR_SCHEMES.find((s) => s.id === schemeId) ?? COLOR_SCHEMES[0];
}

// ─── Chart & aggregation catalogs ───────────────────────────────────
const CHART_TYPES: Array<{ value: ChartType; label: string; icon: LucideIcon }> = [
  { value: 'bar', label: 'Bar', icon: BarChart3 },
  { value: 'hbar', label: 'H-Bar', icon: BarChartHorizontal },
  { value: 'line', label: 'Line', icon: LineChartIcon },
  { value: 'area', label: 'Area', icon: AreaChartIcon },
  { value: 'pie', label: 'Pie', icon: PieChartIcon },
  { value: 'scatter', label: 'Scatter', icon: ScatterChartIcon },
  { value: 'radar', label: 'Radar', icon: RadarIcon },
  { value: 'treemap', label: 'Treemap', icon: LayoutDashboard },
  { value: 'funnel', label: 'Funnel', icon: Filter },
  { value: 'radial', label: 'Radial', icon: Gauge },
  { value: 'composed', label: 'Combo', icon: Combine },
];

const AGGREGATIONS: Array<{ value: Aggregation; label: string; icon: LucideIcon }> = [
  { value: 'sum', label: 'Sum', icon: Sigma },
  { value: 'count', label: 'Count', icon: Hash },
  { value: 'average', label: 'Average', icon: Divide },
  { value: 'min', label: 'Min', icon: ArrowDownToLine },
  { value: 'max', label: 'Max', icon: ArrowUpToLine },
  { value: 'median', label: 'Median', icon: MoveVertical },
  { value: 'stddev', label: 'Std Dev', icon: Activity },
  { value: 'distinct', label: 'Distinct', icon: Shapes },
  { value: 'range', label: 'Range', icon: ArrowUpDown },
];

const AGG_LABEL: Record<Aggregation, string> = {
  sum: 'Sum', count: 'Count', average: 'Average', min: 'Min', max: 'Max',
  median: 'Median', stddev: 'Std Dev', distinct: 'Distinct', range: 'Range',
};

const Y_OPTIONAL: ReadonlySet<Aggregation> = new Set<Aggregation>(['count']);

const MAX_CHARTS = 12;

// ─── Data helpers ───────────────────────────────────────────────────
/** Lenient numeric parser: handles "1,234", "$1,234.50", "45%", "(500)", currency symbols. */
function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'boolean') return null;
  let s = String(v).trim();
  if (!s) return null;
  s = s.replace(/[$€£₹¥]/g, '').replace(/\s/g, '');
  const isPercent = s.endsWith('%');
  if (isPercent) s = s.slice(0, -1);
  let neg = false;
  if (/^\(.*\)$/.test(s)) { neg = true; s = s.slice(1, -1); }
  if (s.includes(',') && s.includes('.')) s = s.replace(/,/g, '');
  else if (/^-?\d{1,3}(,\d{3})+$/.test(s)) s = s.replace(/,/g, '');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(s) && !/\.\d{1,2}$/.test(s)) s = s.replace(/\./g, '');
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return neg ? -n : n;
}

function formatValue(v: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(v);
}

function compactValue(v: number | string): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function minOf(arr: number[]): number {
  let m = arr[0];
  for (let i = 1; i < arr.length; i++) if (arr[i] < m) m = arr[i];
  return m;
}

function maxOf(arr: number[]): number {
  let m = arr[0];
  for (let i = 1; i < arr.length; i++) if (arr[i] > m) m = arr[i];
  return m;
}

function medianOf(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function stdDevOf(arr: number[]): number {
  if (arr.length < 2) return 0;
  let sum = 0;
  for (const v of arr) sum += v;
  const mean = sum / arr.length;
  let sq = 0;
  for (const v of arr) sq += (v - mean) * (v - mean);
  return Math.sqrt(sq / (arr.length - 1));
}

interface GroupAcc {
  sum: number;
  numericCount: number;
  rowCount: number;
  values: number[];
  distinct: Set<string>;
}

function computeAggregate(agg: Aggregation, g: GroupAcc): number {
  switch (agg) {
    case 'count': return g.rowCount;
    case 'sum': return g.sum;
    case 'average': return g.numericCount > 0 ? g.sum / g.numericCount : 0;
    case 'min': return g.values.length > 0 ? minOf(g.values) : 0;
    case 'max': return g.values.length > 0 ? maxOf(g.values) : 0;
    case 'median': return medianOf(g.values);
    case 'stddev': return stdDevOf(g.values);
    case 'distinct': return g.distinct.size;
    case 'range': return g.values.length > 0 ? maxOf(g.values) - minOf(g.values) : 0;
    default: return 0;
  }
}

const DESC_SORT_TYPES: ReadonlySet<ChartType> = new Set<ChartType>([
  'bar', 'hbar', 'pie', 'treemap', 'funnel', 'radial', 'scatter',
]);

const GROUP_CAPS: Partial<Record<ChartType, number>> = {
  bar: 25, hbar: 20, line: 100, area: 100, composed: 100,
  pie: 9, treemap: 40, funnel: 10, radial: 12, radar: 12, scatter: 25,
};

/** Groups rows by X column and computes the selected aggregation of the Y column per group. */
function buildChartData(rows: RowData[], columns: ColumnSchema[], chart: ChartInstance): ChartDataResult {
  const { xColumn, yColumn, aggregation, chartType } = chart;

  const xType = columns.find((c) => c.name === xColumn)?.type;
  const yType = yColumn ? columns.find((c) => c.name === yColumn)?.type : undefined;
  const rawScatter = chartType === 'scatter' && aggregation !== 'count' && xType === 'number' && yType === 'number';

  if (rawScatter && yColumn) {
    const pts: RawPoint[] = [];
    let skipped = 0;
    for (const row of rows) {
      const x = toNumber(row[xColumn]);
      const y = toNumber(row[yColumn]);
      if (x === null || y === null) { skipped++; continue; }
      pts.push({ x, y });
    }
    const sampled = pts.length > 3000 ? pts.filter((_, i) => i % Math.ceil(pts.length / 3000) === 0) : pts;
    return {
      kind: 'raw',
      aggregatedPoints: [],
      rawPoints: sampled,
      skipped,
      scanned: rows.length,
      groupCount: new Set(sampled.map((p) => p.x)).size,
      truncatedNote: pts.length > 3000 ? 'Sampled to 3,000 points' : null,
    };
  }

  const groups = new Map<string, GroupAcc>();
  const needsY = !Y_OPTIONAL.has(aggregation);
  let skipped = 0;
  let scanned = 0;

  for (const row of rows) {
    scanned++;
    const rawX = row[xColumn];
    if (rawX === null || rawX === undefined || String(rawX).trim() === '') { skipped++; continue; }
    const key = String(rawX);
    let g = groups.get(key);
    if (!g) {
      g = { sum: 0, numericCount: 0, rowCount: 0, values: [], distinct: new Set() };
      groups.set(key, g);
    }
    g.rowCount++;
    if (needsY && yColumn) {
      const raw = row[yColumn];
      const num = toNumber(raw);
      if (num !== null) {
        g.sum += num;
        g.numericCount++;
        g.values.push(num);
        g.distinct.add(String(raw));
      } else {
        skipped++;
      }
    }
  }

  let points: AggregatedPoint[] = Array.from(groups.entries()).map(([name, g]) => ({
    name,
    value: computeAggregate(aggregation, g),
    count: g.rowCount,
  }));

  if (DESC_SORT_TYPES.has(chartType)) {
    points.sort((a, b) => b.value - a.value);
  }

  let truncatedNote: string | null = null;
  const cap = GROUP_CAPS[chartType];
  if (cap !== undefined && points.length > cap) {
    if (chartType === 'pie') {
      const rest = points.slice(cap).reduce((s, p) => s + p.value, 0);
      const restCount = points.slice(cap).reduce((s, p) => s + p.count, 0);
      points = [...points.slice(0, cap), { name: 'Others', value: rest, count: restCount }];
      truncatedNote = `Top ${cap} categories shown`;
    } else {
      truncatedNote = `Top ${cap} of ${points.length} groups shown`;
      points = points.slice(0, cap);
    }
  }

  return {
    kind: 'aggregated',
    aggregatedPoints: points,
    rawPoints: [],
    skipped,
    scanned,
    groupCount: groups.size,
    truncatedNote,
  };
}

// ─── Treemap custom cell ────────────────────────────────────────────
const TreeCell: React.FC<{
  scheme: ColorScheme;
  theme: ChartTheme;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  name?: string | number;
  value?: string | number;
  size?: string | number;
}> = ({ scheme, theme, x = 0, y = 0, width = 0, height = 0, index = 0, name = '', value, size }) => {
  if (width < 10 || height < 10) return null;
  const raw = Number(value ?? size ?? 0);
  const fill = scheme.colors[index % scheme.colors.length];
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={4} fill={fill} fillOpacity={0.88} stroke={theme.card} strokeWidth={2} />
      {width > 46 && height > 20 && (
        <>
          <text x={x + 6} y={y + 15} fill="#f8fafc" fontSize={10} fontWeight={600}>
            {truncate(String(name), Math.max(3, Math.floor(width / 6)))}
          </text>
          {height > 34 && (
            <text x={x + 6} y={y + 28} fill="rgba(248, 250, 252, 0.78)" fontSize={9}>
              {compactValue(raw)}
            </text>
          )}
        </>
      )}
    </g>
  );
};

// ─── Chart element factory ──────────────────────────────────────────
/**
 * Returns the RAW recharts chart element. This element must be the DIRECT
 * child of <ResponsiveContainer>, which cloneElement-injects measured
 * width/height into it — recharts renders null when a chart has no
 * width/height, so never wrap it in an intermediary component.
 */
function buildChartElement(
  chart: ChartInstance,
  data: ChartDataResult,
  scheme: ColorScheme,
  theme: ChartTheme
): React.ReactElement {
  const gradId = `grad-${chart.id}`;
  const { primary, secondary, colors } = scheme;
  const { grid, tick } = theme;
  const tooltipStyle: React.CSSProperties = {
    backgroundColor: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: '10px',
    color: theme.text,
    fontSize: '12px',
    boxShadow: '0 8px 24px rgba(2, 8, 23, 0.45)',
  };
  const tickProps = { fontSize: 11, fill: tick };
  const commonAxisProps = { tick: tickProps, tickLine: false, axisLine: { stroke: grid } };
  const aggName = AGG_LABEL[chart.aggregation];
  const legendFormatter = (value: React.ReactNode) => (
    <span style={{ color: theme.muted, fontSize: 11 }}>{truncate(String(value), 18)}</span>
  );
  const numberTooltip = (value: unknown, name: unknown) => [formatValue(Number(value)), String(name)];

  switch (chart.chartType) {
    case 'pie': {
      const pts = data.aggregatedPoints.map((p) => ({ ...p, value: Math.max(p.value, 0) }));
      return (
        <PieChart>
          <Pie
            data={pts}
            dataKey="value"
            nameKey="name"
            innerRadius="52%"
            outerRadius="78%"
            paddingAngle={2}
            stroke={theme.card}
            strokeWidth={2}
            isAnimationActive={false}
          >
            {pts.map((entry, i) => (
              <Cell key={entry.name} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={numberTooltip} />
          <Legend layout="horizontal" iconSize={8} formatter={legendFormatter} />
        </PieChart>
      );
    }

    case 'scatter': {
      const isRaw = data.kind === 'raw';
      return (
        <ScatterChart margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <CartesianGrid stroke={grid} strokeDasharray="3 3" />
          <XAxis
            type={isRaw ? 'number' : 'category'}
            dataKey="x"
            {...commonAxisProps}
            tickFormatter={(v) => (isRaw ? compactValue(v) : truncate(String(v), 8))}
          />
          <YAxis type="number" dataKey="y" width={48} {...commonAxisProps} tickFormatter={(v) => compactValue(v)} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: '3 3', stroke: grid }} formatter={numberTooltip} />
          <Scatter
            data={isRaw ? data.rawPoints : data.aggregatedPoints.map((p) => ({ x: p.name, y: p.value }))}
            fill={primary}
            fillOpacity={0.75}
            isAnimationActive={false}
          />
        </ScatterChart>
      );
    }

    case 'radar': {
      const pts = data.aggregatedPoints.map((p) => ({ subject: truncate(p.name, 14), value: p.value }));
      return (
        <RadarChart data={pts} outerRadius="72%">
          <PolarGrid stroke={grid} />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: tick }} />
          <PolarRadiusAxis tick={{ fontSize: 9, fill: tick }} tickFormatter={(v) => compactValue(v)} />
          <Radar dataKey="value" name={aggName} stroke={primary} fill={primary} fillOpacity={0.35} strokeWidth={2} isAnimationActive={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={numberTooltip} />
        </RadarChart>
      );
    }

    case 'treemap': {
      const pts = data.aggregatedPoints.map((p) => ({ name: p.name, size: Math.max(p.value, 0.0001) }));
      return (
        <Treemap data={pts} dataKey="size" content={<TreeCell scheme={scheme} theme={theme} />} isAnimationActive={false} />
      );
    }

    case 'funnel': {
      const pts = data.aggregatedPoints.map((p) => ({ name: p.name, value: Math.max(p.value, 0) }));
      return (
        <FunnelChart>
          <Tooltip contentStyle={tooltipStyle} formatter={numberTooltip} />
          <Funnel dataKey="value" data={pts} isAnimationActive={false}>
            <LabelList position="right" dataKey="name" fill={theme.text} fontSize={10} stroke="none" />
            {pts.map((p, i) => (
              <Cell key={p.name} fill={colors[i % colors.length]} />
            ))}
          </Funnel>
        </FunnelChart>
      );
    }

    case 'radial': {
      const pts = data.aggregatedPoints.map((p, i) => ({
        name: truncate(p.name, 16),
        value: Math.max(p.value, 0),
        fill: colors[i % colors.length],
      }));
      return (
        <RadialBarChart data={pts} innerRadius="12%" outerRadius="95%" startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, 'dataMax']} tick={false} />
          <RadialBar dataKey="value" background={{ fill: grid }} cornerRadius={6} isAnimationActive={false} />
          <Tooltip contentStyle={tooltipStyle} formatter={numberTooltip} />
          <Legend layout="vertical" align="right" verticalAlign="middle" iconSize={8} formatter={legendFormatter} />
        </RadialBarChart>
      );
    }

    case 'composed': {
      return (
        <ComposedChart data={data.aggregatedPoints} margin={{ top: 8, right: 4, bottom: 4, left: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={secondary} />
              <stop offset="100%" stopColor={primary} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" {...commonAxisProps} tickFormatter={(v) => truncate(String(v), 9)} />
          <YAxis yAxisId="left" width={48} {...commonAxisProps} tickFormatter={(v) => compactValue(v)} />
          <YAxis yAxisId="right" orientation="right" width={40} {...commonAxisProps} tickFormatter={(v) => compactValue(v)} />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: grid, fillOpacity: 0.3 }}
            formatter={(value, name) => [formatValue(Number(value)), String(name)]}
          />
          <Legend iconSize={8} formatter={legendFormatter} />
          <Bar yAxisId="left" dataKey="value" name={aggName} fill={`url(#${gradId})`} radius={[5, 5, 0, 0]} maxBarSize={40} isAnimationActive={false} />
          <Line yAxisId="right" dataKey="count" name="Row Count" type="monotone" stroke={secondary} strokeWidth={2.5} dot={false} isAnimationActive={false} />
        </ComposedChart>
      );
    }

    case 'hbar': {
      return (
        <BarChart layout="vertical" data={data.aggregatedPoints} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={primary} />
              <stop offset="100%" stopColor={secondary} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={grid} strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" {...commonAxisProps} tickFormatter={(v) => compactValue(v)} />
          <YAxis type="category" dataKey="name" width={92} {...commonAxisProps} tickFormatter={(v) => truncate(String(v), 12)} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: grid, fillOpacity: 0.3 }} formatter={(value) => [formatValue(Number(value)), aggName]} />
          <Bar dataKey="value" fill={`url(#${gradId})`} radius={[0, 5, 5, 0]} maxBarSize={22} isAnimationActive={false} />
        </BarChart>
      );
    }

    case 'line': {
      return (
        <LineChart data={data.aggregatedPoints} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={secondary} />
              <stop offset="100%" stopColor={primary} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" {...commonAxisProps} tickFormatter={(v) => truncate(String(v), 10)} />
          <YAxis width={48} {...commonAxisProps} tickFormatter={(v) => compactValue(v)} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: grid, strokeDasharray: '3 3' }} formatter={(value) => [formatValue(Number(value)), aggName]} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={`url(#${gradId})`}
            strokeWidth={2.5}
            dot={{ r: 3, fill: primary, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: secondary, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </LineChart>
      );
    }

    case 'area': {
      return (
        <AreaChart data={data.aggregatedPoints} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primary} stopOpacity={0.55} />
              <stop offset="100%" stopColor={primary} stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" {...commonAxisProps} tickFormatter={(v) => truncate(String(v), 10)} />
          <YAxis width={48} {...commonAxisProps} tickFormatter={(v) => compactValue(v)} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value) => [formatValue(Number(value)), aggName]} />
          <Area type="monotone" dataKey="value" stroke={primary} strokeWidth={2.5} fill={`url(#${gradId})`} isAnimationActive={false} />
        </AreaChart>
      );
    }

    // Default: vertical bar
    default: {
      return (
        <BarChart data={data.aggregatedPoints} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={secondary} />
              <stop offset="100%" stopColor={primary} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" {...commonAxisProps} tickFormatter={(v) => truncate(String(v), 10)} />
          <YAxis width={48} {...commonAxisProps} tickFormatter={(v) => compactValue(v)} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: grid, fillOpacity: 0.35 }} formatter={(value) => [formatValue(Number(value)), aggName]} />
          <Bar dataKey="value" fill={`url(#${gradId})`} radius={[5, 5, 0, 0]} maxBarSize={44} isAnimationActive={false} />
        </BarChart>
      );
    }
  }
}

// ─── Chart card ─────────────────────────────────────────────────────
function ChartCard({
  chart,
  rows,
  columns,
  isDark,
  onRemove,
}: {
  chart: ChartInstance;
  rows: RowData[];
  columns: ColumnSchema[];
  isDark: boolean;
  onRemove: (id: string) => void;
}) {
  const data = useMemo(() => buildChartData(rows, columns, chart), [rows, columns, chart]);
  const scheme = useMemo(
    () => resolveScheme(chart.schemeId, chart.customColor ?? DEFAULT_CUSTOM_COLOR, isDark),
    [chart.schemeId, chart.customColor, isDark]
  );
  const theme = isDark ? DARK_THEME : LIGHT_THEME;

  const typeMeta = CHART_TYPES.find((t) => t.value === chart.chartType) ?? CHART_TYPES[0];
  const TypeIcon = typeMeta.icon;
  const isRaw = data.kind === 'raw';
  const hasData = isRaw ? data.rawPoints.length > 0 : data.aggregatedPoints.length > 0;
  const title = isRaw
    ? `${chart.yColumn} vs ${chart.xColumn}`
    : `${AGG_LABEL[chart.aggregation]} of ${chart.yColumn ?? 'Records'} by ${chart.xColumn}`;
  const subtitle = isRaw
    ? `${data.rawPoints.length.toLocaleString()} points • ${data.scanned.toLocaleString()} rows scanned`
    : `${data.groupCount.toLocaleString()} groups • ${data.scanned.toLocaleString()} rows scanned`;

  return (
    <div className="glass rounded-xl border border-border/60 overflow-hidden flex flex-col min-w-0">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/50">
        <div
          className="w-7 h-7 rounded-md border border-border/60 flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${scheme.primary}22`, color: scheme.primary }}
        >
          <TypeIcon size={13} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground truncate" title={title}>
            {title}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">{subtitle}</p>
        </div>
        <Badge variant="outline" className="text-[10px] h-5 px-1.5 shrink-0 border-primary/40 text-primary">
          {typeMeta.label}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(chart.id)}
          title="Remove chart"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="h-60 md:h-72 w-full min-w-0 overflow-hidden p-2">
        {hasData ? (
          /* Chart element must be ResponsiveContainer's DIRECT child so the
             measured width/height props are injected into the chart itself. */
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            {buildChartElement(chart, data, scheme, theme)}
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-center px-4">
            <Activity className="w-6 h-6 text-muted-foreground/60" />
            <p className="text-xs text-muted-foreground text-pretty">
              No plottable values — check that the selected columns contain data.
            </p>
          </div>
        )}
      </div>

      {(data.skipped > 0 || data.truncatedNote) && (
        <div className="px-3 py-1.5 border-t border-border/50 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          {data.skipped > 0 && (
            <span className="text-[10px] text-warning">
              {data.skipped.toLocaleString()} null / non-numeric value{data.skipped > 1 ? 's' : ''} skipped
            </span>
          )}
          {data.truncatedNote && (
            <span className="text-[10px] text-muted-foreground">{data.truncatedNote}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────
const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useWorkspace();
  const { toggleTheme, isDark } = useTheme();
  const { dataset, rows, columns } = state;

  const [chartType, setChartType] = useState<ChartType>('bar');
  const [xColumn, setXColumn] = useState('');
  const [yColumn, setYColumn] = useState('');
  const [aggregation, setAggregation] = useState<Aggregation>('sum');
  const [schemeId, setSchemeId] = useState('electric');
  const [customColor, setCustomColor] = useState(DEFAULT_CUSTOM_COLOR);
  const [charts, setCharts] = useState<ChartInstance[]>([]);
  const [panelOpen, setPanelOpen] = useState(true);

  /** All columns available as measure — numeric-typed first, then anything parseable. */
  const orderedYColumns = useMemo(() => {
    const nums = columns.filter((c) => c.type === 'number');
    const rest = columns.filter((c) => c.type !== 'number');
    return [...nums, ...rest];
  }, [columns]);

  const numericColumnCount = useMemo(
    () =>
      columns.filter(
        (c) => c.type === 'number' || (c.sampleValues ?? []).some((v) => toNumber(v) !== null)
      ).length,
    [columns]
  );

  // Auto-pick sensible defaults when a dataset is loaded; fall back to Count when no measure exists
  useEffect(() => {
    if (columns.length === 0) return;
    if (!xColumn || !columns.some((c) => c.name === xColumn)) {
      const firstDim =
        columns.find((c) => c.type === 'string' || c.type === 'date' || c.type === 'boolean') ?? columns[0];
      setXColumn(firstDim.name);
    }
    if (!yColumn || !columns.some((c) => c.name === yColumn)) {
      const firstNum =
        columns.find((c) => c.type === 'number') ??
        columns.find((c) => (c.sampleValues ?? []).some((v) => toNumber(v) !== null));
      setYColumn(firstNum ? firstNum.name : '');
      if (!firstNum) setAggregation('count');
    }
  }, [columns, xColumn, yColumn]);

  const yRequired = !Y_OPTIONAL.has(aggregation);
  const configValid = Boolean(dataset && xColumn && (!yRequired || yColumn));

  const addChart = () => {
    if (!dataset || !xColumn) {
      toast.error('Load a dataset and select an X-axis column first');
      return;
    }
    if (yRequired && !yColumn) {
      toast.error('Select a Y-axis column (or switch aggregation to Count)');
      return;
    }
    if (charts.length >= MAX_CHARTS) {
      toast.warning(`Dashboard canvas limit reached (${MAX_CHARTS} charts)`);
      return;
    }
    const instance: ChartInstance = {
      id: `chart-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      chartType,
      xColumn,
      yColumn: yRequired ? yColumn : null,
      aggregation,
      schemeId,
      customColor: schemeId === 'custom' ? customColor : undefined,
    };
    setCharts((prev) => [...prev, instance]);
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
      setPanelOpen(false);
    }
    toast.success(`${CHART_TYPES.find((t) => t.value === chartType)?.label} chart added to canvas`);
  };

  const removeChart = (id: string) => setCharts((prev) => prev.filter((c) => c.id !== id));

  const clearAll = () => {
    setCharts([]);
    toast.info('Canvas cleared');
  };

  const schemeOptions = useMemo(
    () => [...COLOR_SCHEMES, deriveSchemeFromHex(customColor, isDark)],
    [customColor, isDark]
  );

  return (
    <div className="relative flex flex-col min-h-screen w-full bg-background text-foreground">
      <HUDBackground />

      {/* ─── Top bar ─── */}
      <header className="relative z-10 flex items-center h-12 px-3 border-b border-border bg-card/80 backdrop-blur shrink-0 gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => navigate(dataset ? '/workspace' : '/')}
          title={dataset ? 'Back to Workspace' : 'Back to Home'}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </Button>
        <TornadoLogo size={24} animated />
        <div className="hidden sm:block leading-tight">
          <p className="text-xs font-bold text-foreground">ADCP Visualizer</p>
          <p className="text-[10px] text-muted-foreground">Analytical Testing</p>
        </div>

        {dataset && (
          <div className="flex items-center gap-2 min-w-0 border-l border-border pl-2 ml-1">
            <span className="text-xs text-foreground font-medium truncate max-w-40 md:max-w-56" title={dataset.name}>
              {dataset.name}
            </span>
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 shrink-0 border-primary/40 text-primary">
              {dataset.file_format.toUpperCase()}
            </Badge>
          </div>
        )}

        <div className="flex-1 min-w-0" />

        {dataset && (
          <div className="hidden md:flex items-center gap-3 text-[11px] text-muted-foreground shrink-0">
            <span>
              <span className="text-foreground font-semibold">{rows.length.toLocaleString()}</span> rows
            </span>
            <span>
              <span className="text-foreground font-semibold">{columns.length}</span> columns
            </span>
            <span>
              <span className="text-foreground font-semibold">{numericColumnCount}</span> numeric
            </span>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={toggleTheme}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </Button>
      </header>

      {/* ─── Body: config panel + canvas ─── */}
      <div className="relative z-10 flex flex-1 min-h-0 flex-col md:flex-row">
        {/* Left configuration panel */}
        <aside
          className={`${panelOpen ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-72 shrink-0 border-b md:border-b-0 md:border-r border-border bg-card/60 backdrop-blur-md max-h-[60vh] md:max-h-none overflow-y-auto`}
        >
          <div className="p-4 space-y-5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                <SlidersHorizontal size={13} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground">Data Visualizer</p>
                <p className="text-[10px] text-muted-foreground">Configure &amp; add visuals</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 md:hidden"
                onClick={() => setPanelOpen(false)}
                title="Close builder"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Chart type */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Chart Type
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {CHART_TYPES.map((opt) => {
                  const Icon = opt.icon;
                  const active = chartType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setChartType(opt.value)}
                      title={opt.label}
                      className={`h-9 rounded-md flex items-center justify-center border transition-all duration-200 active:scale-95 ${
                        active
                          ? 'bg-primary text-primary-foreground border-primary shadow-glow'
                          : 'bg-secondary/50 text-muted-foreground border-border hover:text-foreground hover:bg-secondary'
                      }`}
                    >
                      <Icon size={15} />
                      <span className="sr-only">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Selected:{' '}
                <span className="text-primary font-medium">
                  {CHART_TYPES.find((t) => t.value === chartType)?.label}
                </span>
              </p>
            </div>

            {/* X axis */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                X-Axis (Dimension)
              </label>
              <Select value={xColumn} onValueChange={setXColumn} disabled={columns.length === 0}>
                <SelectTrigger className="h-9 text-xs w-full">
                  <SelectValue placeholder="Select a column" />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col) => (
                    <SelectItem key={col.name} value={col.name} className="text-xs">
                      {col.name}
                      <span className="text-[10px] text-muted-foreground ml-1.5">({col.type})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Y axis */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Y-Axis (Measure)
              </label>
              {aggregation === 'count' ? (
                <div className="h-9 rounded-md border border-dashed border-border bg-secondary/30 flex items-center px-3 text-xs text-muted-foreground">
                  Not required for Count
                </div>
              ) : (
                <Select value={yColumn || undefined} onValueChange={setYColumn} disabled={columns.length === 0}>
                  <SelectTrigger className="h-9 text-xs w-full">
                    <SelectValue placeholder="Select a column (numeric first)" />
                  </SelectTrigger>
                  <SelectContent>
                    {orderedYColumns.map((col) => (
                      <SelectItem key={col.name} value={col.name} className="text-xs">
                        {col.name}
                        <span className="text-[10px] text-muted-foreground ml-1.5">
                          ({col.type === 'number' ? 'numeric' : col.type})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-[10px] text-muted-foreground">
                Any column works — commas, currency and % values are parsed as numbers.
              </p>
            </div>

            {/* Aggregation */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Aggregation
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {AGGREGATIONS.map((opt) => {
                  const Icon = opt.icon;
                  const active = aggregation === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAggregation(opt.value)}
                      title={`${opt.label} of Y per X group${opt.value === 'count' ? ' (no Y needed)' : ''}`}
                      className={`h-9 rounded-md flex items-center justify-center gap-1 border text-[10px] font-medium transition-all duration-200 active:scale-95 ${
                        active
                          ? 'bg-primary text-primary-foreground border-primary shadow-glow'
                          : 'bg-secondary/50 text-muted-foreground border-border hover:text-foreground hover:bg-secondary'
                      }`}
                    >
                      <Icon size={12} />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color scheme */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Color Scheme
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {schemeOptions.map((s) => {
                  const active = schemeId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSchemeId(s.id)}
                      title={s.id === 'custom' ? 'Custom color' : s.label}
                      className={`rounded-md border p-2 flex flex-col items-start gap-1.5 transition-all duration-200 active:scale-95 ${
                        active
                          ? 'border-primary bg-primary/10 shadow-glow'
                          : 'border-border bg-secondary/40 hover:bg-secondary'
                      }`}
                    >
                      <div className="flex gap-1">
                        {s.colors.slice(0, 5).map((c, i) => (
                          <span
                            key={i}
                            className="w-3.5 h-3.5 rounded-full border border-black/10"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-medium text-foreground truncate">{s.label}</span>
                    </button>
                  );
                })}
              </div>
              {schemeId === 'custom' && (
                <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/30 p-2">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="h-8 w-12 rounded cursor-pointer bg-transparent border border-border"
                    title="Pick chart accent color"
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-foreground">Custom accent</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {customColor.toUpperCase()} — shades auto-derived
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Add chart */}
            <div className="space-y-1.5">
              <Button className="w-full h-9 text-xs gap-1.5 shadow-glow" disabled={!configValid} onClick={addChart}>
                <Plus className="w-3.5 h-3.5" />
                Add Chart to Canvas
              </Button>
              {!configValid && dataset && (
                <p className="text-[10px] text-muted-foreground">
                  Select X-axis{yRequired ? ' and Y-axis' : ''} to enable.
                </p>
              )}
            </div>

            {/* Dataset summary */}
            {dataset && (
              <div className="glass-subtle rounded-lg border border-border/50 p-3 space-y-1.5">
                <p className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                  <Database size={12} className="text-primary" />
                  Active Dataset
                </p>
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Rows</span>
                  <span className="text-foreground font-medium">{rows.length.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Columns</span>
                  <span className="text-foreground font-medium">{columns.length}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Numeric columns</span>
                  <span className="text-foreground font-medium">{numericColumnCount}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Charts on canvas</span>
                  <span className="text-foreground font-medium">
                    {charts.length} / {MAX_CHARTS}
                  </span>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main canvas */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-4 h-12 border-b border-border bg-card/40 backdrop-blur shrink-0">
            <LayoutGrid className="w-4 h-4 text-primary shrink-0" />
            <p className="text-xs font-bold text-foreground">Dashboard Canvas</p>
            <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-primary/40 text-primary shrink-0">
              {charts.length} chart{charts.length === 1 ? '' : 's'}
            </Badge>
            <div className="flex-1 min-w-0" />
            {dataset && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1.5 md:hidden shrink-0"
                onClick={() => setPanelOpen((o) => !o)}
              >
                <Plus className="w-3.5 h-3.5" />
                {panelOpen ? 'Hide Builder' : 'Add Chart'}
              </Button>
            )}
            {charts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-destructive shrink-0"
                onClick={clearAll}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Clear All</span>
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {!dataset ? (
              <div className="flex flex-col items-center justify-center h-full min-h-80 text-center gap-4 py-16">
                <div className="w-16 h-16 rounded-2xl glass border border-primary/30 flex items-center justify-center">
                  <Database className="w-7 h-7 text-primary" />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h3 className="text-base md:text-lg font-bold text-foreground text-balance">
                    No dataset loaded
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground text-pretty">
                    Upload a dataset on the landing page or open the workspace, then come back to
                    build interactive visual charts from your data.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button size="sm" className="gap-1.5 shadow-glow" onClick={() => navigate('/')}>
                    <Upload className="w-3.5 h-3.5" />
                    Upload Dataset
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/workspace')}>
                    Open Workspace
                  </Button>
                </div>
              </div>
            ) : charts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-80 text-center gap-4 py-16">
                <div className="w-16 h-16 rounded-2xl glass border border-primary/30 flex items-center justify-center">
                  <BarChart3 className="w-7 h-7 text-primary" />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h3 className="text-base md:text-lg font-bold text-foreground text-balance">
                    Your canvas is empty
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground text-pretty">
                    Pick a chart type, X-axis, aggregation and color scheme in the Chart Builder
                    panel, then click &ldquo;Add Chart to Canvas&rdquo; to render your first interactive visual.
                  </p>
                </div>
                <Button size="sm" className="gap-1.5 shadow-glow md:hidden" onClick={() => setPanelOpen(true)}>
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Open Chart Builder
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {charts.map((chart) => (
                  <ChartCard
                    key={chart.id}
                    chart={chart}
                    rows={rows}
                    columns={columns}
                    isDark={isDark}
                    onRemove={removeChart}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
