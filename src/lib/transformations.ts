import type { ColumnSchema, RowData } from '@/types';
import { isMissingValue } from '@/lib/errorDetector';

/**
 * Deterministic, rule-based data transformations.
 * Every operation is a pure function returning the new rows/columns plus a
 * human-readable description for the execution log.
 */

export interface TransformResult {
  rows: RowData[];
  columns: ColumnSchema[];
  changedCount: number;
  description: string;
}

// ─── Shared helpers ──────────────────────────────────────────────────

const CURRENCY_CHARS = /[$€£¥₹,\s]/g;

function toNumber(value: string): number | null {
  const cleaned = value.replace(CURRENCY_CHARS, '');
  if (cleaned === '') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function toDate(value: string): Date | null {
  const t = value.trim();
  if (t === '') return null;
  // Date-only strings parse as LOCAL midnight (new Date() would use UTC),
  // keeping timezone shifts and component extraction intuitive
  const dateOnly = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  if (dateOnly) {
    const d = new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(t);
  return isNaN(d.getTime()) ? null : d;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateTime(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${formatDate(d)} ${h}:${min}`;
}

function boolFrom(value: string): boolean | null {
  const t = value.trim().toLowerCase();
  if (['true', 'yes', '1'].includes(t)) return true;
  if (['false', 'no', '0'].includes(t)) return false;
  return null;
}

/** Ensure a column name does not collide with existing ones */
function uniqueName(base: string, existing: Set<string>): string {
  if (!existing.has(base)) return base;
  let i = 2;
  while (existing.has(`${base} ${i}`)) i++;
  return `${base} ${i}`;
}

function rebuildColumns(rows: RowData[], columns: ColumnSchema[]): ColumnSchema[] {
  // Recompute null/unique counts cheaply after structural changes
  return columns.map((col) => {
    let nullCount = 0;
    const distinct = new Set<string>();
    for (const row of rows) {
      const v = row[col.name];
      const s = v === null || v === undefined ? null : String(v);
      if (s === null || isMissingValue(s)) nullCount++;
      else distinct.add(s);
    }
    const sampleValues = [...distinct].slice(0, 5);
    return { ...col, nullCount, uniqueCount: distinct.size, sampleValues };
  });
}

// ─── 1. Data Type & Structure Fixes ─────────────────────────────────

export type CastTarget = 'number' | 'boolean' | 'date' | 'string';

export function castColumnType(rows: RowData[], columns: ColumnSchema[], colName: string, target: CastTarget): TransformResult {
  let changed = 0;
  let failed = 0;
  const newRows = rows.map((row) => {
    const raw = row[colName];
    if (raw === null || raw === undefined) return row;
    const s = String(raw);
    if (isMissingValue(s)) return row;

    let out: string | number | boolean | null = s;
    if (target === 'number') {
      const n = toNumber(s);
      out = n === null ? null : n;
    } else if (target === 'boolean') {
      const b = boolFrom(s);
      out = b === null ? null : b;
    } else if (target === 'date') {
      const d = toDate(s);
      out = d === null ? null : formatDate(d);
    }
    if (out !== raw) changed++;
    if (out === null) failed++;
    return { ...row, [colName]: out };
  });

  const newColumns = columns.map((c) => (c.name === colName ? { ...c, type: target } : c));
  const label = { number: 'Number', boolean: 'Boolean', date: 'Date', string: 'Text' }[target];
  return {
    rows: newRows,
    columns: rebuildColumns(newRows, newColumns),
    changedCount: changed,
    description: `Cast "${colName}" to ${label} (${changed} cells converted${failed > 0 ? `, ${failed} unparseable set to null` : ''})`,
  };
}

export type CaseStyle = 'upper' | 'lower' | 'title';

export function changeCase(rows: RowData[], colName: string, style: CaseStyle): TransformResult {
  let changed = 0;
  const newRows = rows.map((row) => {
    const raw = row[colName];
    if (raw === null || raw === undefined || isMissingValue(String(raw))) return row;
    const s = String(raw);
    const out =
      style === 'upper' ? s.toUpperCase()
      : style === 'lower' ? s.toLowerCase()
      : s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    if (out !== s) changed++;
    return { ...row, [colName]: out };
  });
  return { rows: newRows, columns: [], changedCount: changed, description: `Changed case of "${colName}" to ${style === 'title' ? 'Title Case' : style} (${changed} cells)` };
}

export function trimCells(rows: RowData[], colName: string): TransformResult {
  let changed = 0;
  const newRows = rows.map((row) => {
    const raw = row[colName];
    if (raw === null || raw === undefined) return row;
    const s = String(raw);
    const out = s.split(/[ \t]+/).join(' ').trim();
    if (out !== s) changed++;
    return { ...row, [colName]: out };
  });
  return { rows: newRows, columns: [], changedCount: changed, description: `Trimmed whitespace in "${colName}" (${changed} cells)` };
}

export type HeaderStyle = 'snake' | 'camel' | 'title' | 'clean';

function toHeader(name: string, style: HeaderStyle): string {
  const parts = name
    .trim()
    .replace(/[_\-.]+/g, ' ')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return name;
  switch (style) {
    case 'snake':
      return parts.map((p) => p.toLowerCase()).join('_');
    case 'camel':
      return parts
        .map((p, i) => (i === 0 ? p.toLowerCase() : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()))
        .join('');
    case 'title':
      return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
    case 'clean':
    default:
      return parts.join(' ');
  }
}

export function normalizeHeaders(rows: RowData[], columns: ColumnSchema[], style: HeaderStyle): TransformResult {
  const existing = new Set<string>();
  const renames: Array<[string, string]> = [];
  const newColumns = columns.map((col) => {
    let next = toHeader(col.name, style);
    next = uniqueName(next, existing);
    existing.add(next);
    if (next !== col.name) renames.push([col.name, next]);
    return { ...col, name: next };
  });

  let changed = 0;
  const newRows = rows.map((row) => {
    if (renames.length === 0) return row;
    const nr = { ...row };
    for (const [oldName, next] of renames) {
      nr[next] = row[oldName];
      delete nr[oldName];
    }
    changed++;
    return nr;
  });

  const label = style === 'snake' ? 'snake_case' : style === 'camel' ? 'camelCase' : style === 'title' ? 'Title Case' : 'cleaned';
  return {
    rows: newRows,
    columns: newColumns,
    changedCount: renames.length,
    description: renames.length
      ? `Normalized ${renames.length} header(s) to ${label}: ${renames.slice(0, 3).map(([a, b]) => `${a} → ${b}`).join(', ')}${renames.length > 3 ? '…' : ''}`
      : `Headers already follow ${label} convention`,
  };
}

export function moveColumn(columns: ColumnSchema[], rows: RowData[], colName: string, direction: -1 | 1): TransformResult {
  const idx = columns.findIndex((c) => c.name === colName);
  const target = idx + direction;
  if (idx === -1 || target < 0 || target >= columns.length) {
    return { rows, columns, changedCount: 0, description: `Cannot move "${colName}" further ${direction === -1 ? 'left' : 'right'}` };
  }
  const newColumns = [...columns];
  [newColumns[idx], newColumns[target]] = [newColumns[target], newColumns[idx]];
  return { rows, columns: newColumns, changedCount: 1, description: `Moved column "${colName}" ${direction === -1 ? 'left' : 'right'}` };
}

export function dropColumns(rows: RowData[], columns: ColumnSchema[], colNames: string[]): TransformResult {
  const dropSet = new Set(colNames);
  const newColumns = columns.filter((c) => !dropSet.has(c.name));
  const newRows = rows.map((row) => {
    const nr = { ...row };
    for (const name of colNames) delete nr[name];
    return nr;
  });
  return { rows: newRows, columns: newColumns, changedCount: colNames.length, description: `Dropped column(s): ${colNames.join(', ')}` };
}

// ─── 2. Handling Missing Data ────────────────────────────────────────

export type ImputeStrategy = 'zero' | 'static' | 'mean' | 'median' | 'mode' | 'ffill' | 'bfill';

export function imputeColumn(rows: RowData[], colName: string, strategy: ImputeStrategy, fallbackValue = ''): TransformResult {
  // Compute statistical fill values from non-missing entries
  const nums: number[] = [];
  const valueCounts = new Map<string, number>();
  for (const row of rows) {
    const raw = row[colName];
    if (raw === null || raw === undefined || isMissingValue(String(raw))) continue;
    const s = String(raw);
    valueCounts.set(s, (valueCounts.get(s) ?? 0) + 1);
    const n = toNumber(s);
    if (n !== null) nums.push(n);
  }

  let fill: string | null = null;
  switch (strategy) {
    case 'zero':
      fill = '0';
      break;
    case 'static':
      fill = fallbackValue;
      break;
    case 'mean': {
      if (nums.length === 0) return { rows, columns: [], changedCount: 0, description: `No numeric values in "${colName}" to compute a mean` };
      const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      fill = String(Math.round(mean * 10000) / 10000);
      break;
    }
    case 'median': {
      if (nums.length === 0) return { rows, columns: [], changedCount: 0, description: `No numeric values in "${colName}" to compute a median` };
      const sorted = [...nums].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      fill = String(median);
      break;
    }
    case 'mode': {
      if (valueCounts.size === 0) return { rows, columns: [], changedCount: 0, description: `No values in "${colName}" to compute a mode` };
      fill = [...valueCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];
      break;
    }
    case 'ffill':
    case 'bfill': {
      // Directional fills handled per-row below
      break;
    }
  }

  let changed = 0;
  const newRows: RowData[] = [];
  let carry: string | null = null;

  if (strategy === 'ffill') {
    for (const row of rows) {
      const raw = row[colName];
      const s = raw === null || raw === undefined ? null : String(raw);
      if (isMissingValue(s)) {
        if (carry !== null) { newRows.push({ ...row, [colName]: carry }); changed++; }
        else newRows.push(row);
      } else {
        carry = s;
        newRows.push(row);
      }
    }
  } else if (strategy === 'bfill') {
    const out: RowData[] = new Array(rows.length);
    let next: string | null = null;
    for (let i = rows.length - 1; i >= 0; i--) {
      const raw = rows[i][colName];
      const s = raw === null || raw === undefined ? null : String(raw);
      if (isMissingValue(s)) {
        if (next !== null) { out[i] = { ...rows[i], [colName]: next }; changed++; }
        else out[i] = rows[i];
      } else {
        next = s;
        out[i] = rows[i];
      }
    }
    newRows.push(...out);
  } else {
    for (const row of rows) {
      const raw = row[colName];
      const s = raw === null || raw === undefined ? null : String(raw);
      if (isMissingValue(s) && fill !== null) {
        newRows.push({ ...row, [colName]: fill });
        changed++;
      } else {
        newRows.push(row);
      }
    }
  }

  const label: Record<ImputeStrategy, string> = {
    zero: 'zero', static: `static value "${fill}"`, mean: `mean (${fill})`, median: `median (${fill})`,
    mode: `mode ("${fill}")`, ffill: 'forward fill', bfill: 'backward fill',
  };
  return { rows: newRows, columns: [], changedCount: changed, description: `Filled ${changed} missing value(s) in "${colName}" with ${label[strategy]}` };
}

export function dropRowsByNullThreshold(rows: RowData[], columns: ColumnSchema[], thresholdPct: number): TransformResult {
  const limit = thresholdPct / 100;
  const newRows = rows.filter((row) => {
    let missing = 0;
    for (const col of columns) {
      const raw = row[col.name];
      const s = raw === null || raw === undefined ? null : String(raw);
      if (isMissingValue(s)) missing++;
    }
    return columns.length === 0 || missing / columns.length <= limit;
  });
  const dropped = rows.length - newRows.length;
  return { rows: newRows, columns: [], changedCount: dropped, description: `Dropped ${dropped} row(s) with more than ${thresholdPct}% missing values` };
}

export function dropColumnsByNullThreshold(rows: RowData[], columns: ColumnSchema[], thresholdPct: number): TransformResult {
  const limit = thresholdPct / 100;
  const keep = columns.filter((col) => {
    let missing = 0;
    for (const row of rows) {
      const raw = row[col.name];
      const s = raw === null || raw === undefined ? null : String(raw);
      if (isMissingValue(s)) missing++;
    }
    return rows.length === 0 || missing / rows.length <= limit;
  });
  const droppedNames = columns.filter((c) => !keep.includes(c)).map((c) => c.name);
  if (droppedNames.length === 0) {
    return { rows, columns: [], changedCount: 0, description: `No columns exceed the ${thresholdPct}% missing threshold` };
  }
  return dropColumns(rows, columns, droppedNames);
}

// ─── 3. Text & Pattern Standardization ───────────────────────────────

export function splitColumn(rows: RowData[], columns: ColumnSchema[], colName: string, delimiter: string, parts: number): TransformResult {
  if (!delimiter) return { rows, columns: [], changedCount: 0, description: 'Split requires a delimiter' };
  const partCount = Math.max(2, Math.min(5, Math.floor(parts) || 2));

  const existing = new Set(columns.map((c) => c.name));
  const newNames: string[] = [];
  for (let i = 0; i < partCount; i++) {
    const name = uniqueName(`${colName} ${i + 1}`, existing);
    existing.add(name);
    newNames.push(name);
  }

  let matched = 0;
  const newRows = rows.map((row) => {
    const raw = row[colName];
    const s = raw === null || raw === undefined ? '' : String(raw).trim();
    const pieces = s.split(delimiter);
    if (pieces.length > 1) matched++;
    const nr = { ...row };
    for (let i = 0; i < partCount; i++) {
      nr[newNames[i]] = (pieces[i] ?? '').trim();
    }
    return nr;
  });

  const idx = columns.findIndex((c) => c.name === colName);
  const newColumns = [...columns];
  const generated: ColumnSchema[] = newNames.map((name) => ({
    name, originalName: name, type: 'string' as const, nullCount: 0, uniqueCount: 0, sampleValues: [],
  }));
  newColumns.splice(idx + 1, 0, ...generated);

  return {
    rows: newRows,
    columns: rebuildColumns(newRows, newColumns),
    changedCount: matched,
    description: `Split "${colName}" by "${delimiter}" into ${partCount} column(s) (${matched} rows matched)`,
  };
}

export function concatColumns(rows: RowData[], columns: ColumnSchema[], sourceCols: string[], separator: string, newName: string): TransformResult {
  if (sourceCols.length < 2) return { rows, columns: [], changedCount: 0, description: 'Concatenation requires at least two columns' };
  const existing = new Set(columns.map((c) => c.name));
  const target = uniqueName(newName || sourceCols.join(' '), existing);

  const newRows = rows.map((row) => {
    const parts = sourceCols
      .map((c) => {
        const raw = row[c];
        return raw === null || raw === undefined || isMissingValue(String(raw)) ? '' : String(raw).trim();
      })
      .filter(Boolean);
    return { ...row, [target]: parts.join(separator) };
  });

  const newColumns: ColumnSchema[] = [...columns, { name: target, originalName: target, type: 'string', nullCount: 0, uniqueCount: 0, sampleValues: [] }];
  return {
    rows: newRows,
    columns: rebuildColumns(newRows, newColumns),
    changedCount: newRows.length,
    description: `Concatenated ${sourceCols.length} column(s) into "${target}"`,
  };
}

export function replacePattern(rows: RowData[], colName: string, search: string, replacement: string, useRegex: boolean): TransformResult {
  if (!search) return { rows, columns: [], changedCount: 0, description: 'Find & replace requires a search pattern' };

  let matcher: RegExp | null = null;
  if (useRegex) {
    try {
      matcher = new RegExp(search, 'g');
    } catch {
      return { rows, columns: [], changedCount: 0, description: `Invalid regular expression: ${search}` };
    }
  }

  let changed = 0;
  const newRows = rows.map((row) => {
    const raw = row[colName];
    if (raw === null || raw === undefined) return row;
    const s = String(raw);
    const out = useRegex && matcher ? s.replace(matcher, replacement) : s.split(search).join(replacement);
    if (out !== s) changed++;
    return { ...row, [colName]: out };
  });
  return { rows: newRows, columns: [], changedCount: changed, description: `Replaced "${search}" with "${replacement}" in "${colName}" (${changed} cells)` };
}

// ─── 4. Duplicates & Anomalies ───────────────────────────────────────

export function removeExactDuplicates(rows: RowData[], columns: ColumnSchema[]): TransformResult {
  const seen = new Set<string>();
  const newRows = rows.filter((row) => {
    const key = columns.map((c) => String(row[c.name] ?? '')).join('\u0001');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const dropped = rows.length - newRows.length;
  return { rows: newRows, columns: [], changedCount: dropped, description: `Removed ${dropped} exact duplicate row(s)` };
}

export function dedupeByKeys(rows: RowData[], keyCols: string[], keep: 'first' | 'latest'): TransformResult {
  if (keyCols.length === 0) return { rows, columns: [], changedCount: 0, description: 'Select at least one key column' };
  const seen = new Map<string, number>(); // key → kept row index
  const newRows: RowData[] = [];
  for (let i = 0; i < rows.length; i++) {
    const key = keyCols.map((c) => String(rows[i][c] ?? '')).join('\u0001');
    const prevIdx = seen.get(key);
    if (prevIdx === undefined) {
      seen.set(key, newRows.length);
      newRows.push(rows[i]);
    } else if (keep === 'latest') {
      newRows[prevIdx] = rows[i]; // overwrite earlier occurrence
    }
  }
  const dropped = rows.length - newRows.length;
  return { rows: newRows, columns: [], changedCount: dropped, description: `Deduplicated by key(s) [${keyCols.join(', ')}], kept ${keep} entry (${dropped} rows removed)` };
}

export type RangeAction = 'flag' | 'remove' | 'null' | 'clip';

export function validateRange(rows: RowData[], colName: string, min: number, max: number, action: RangeAction): TransformResult {
  const outOfRange = (n: number) => n < min || n > max;
  let flagged = 0;

  if (action === 'flag') {
    for (const row of rows) {
      const raw = row[colName];
      if (raw === null || raw === undefined || isMissingValue(String(raw))) continue;
      const n = toNumber(String(raw));
      if (n !== null && outOfRange(n)) flagged++;
    }
    return { rows, columns: [], changedCount: flagged, description: `Range validation on "${colName}" [${min}, ${max}]: ${flagged} out-of-range value(s) flagged` };
  }

  if (action === 'remove') {
    const newRows = rows.filter((row) => {
      const raw = row[colName];
      if (raw === null || raw === undefined || isMissingValue(String(raw))) return true;
      const n = toNumber(String(raw));
      if (n !== null && outOfRange(n)) { flagged++; return false; }
      return true;
    });
    return { rows: newRows, columns: [], changedCount: flagged, description: `Removed ${flagged} row(s) where "${colName}" is outside [${min}, ${max}]` };
  }

  const newRows = rows.map((row) => {
    const raw = row[colName];
    if (raw === null || raw === undefined || isMissingValue(String(raw))) return row;
    const n = toNumber(String(raw));
    if (n === null || !outOfRange(n)) return row;
    flagged++;
    const clamped = action === 'clip' ? Math.min(Math.max(n, min), max) : null;
    return { ...row, [colName]: clamped };
  });
  return {
    rows: newRows,
    columns: [],
    changedCount: flagged,
    description: action === 'clip'
      ? `Clipped ${flagged} out-of-range value(s) in "${colName}" to [${min}, ${max}]`
      : `Nulled ${flagged} out-of-range value(s) in "${colName}" outside [${min}, ${max}]`,
  };
}

// ─── Rule-based transformation module ────────────────────────────────

export type TextOp = 'trim' | 'clean' | 'upper' | 'lower' | 'title' | 'pad_left' | 'pad_right' | 'extract';

export function applyTextOp(
  rows: RowData[],
  colName: string,
  op: TextOp,
  params: { length?: number; padChar?: string; start?: number }
): TransformResult {
  const length = Math.max(1, Math.floor(params.length ?? 3));
  const padChar = (params.padChar ?? '0').slice(0, 1) || '0';
  const start = Math.max(1, Math.floor(params.start ?? 1));

  let changed = 0;
  const newRows = rows.map((row) => {
    const raw = row[colName];
    if (raw === null || raw === undefined || isMissingValue(String(raw))) return row;
    const s = String(raw);
    let out = s;
    switch (op) {
      case 'trim': out = s.trim(); break;
      case 'clean': out = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); break;
      case 'upper': out = s.toUpperCase(); break;
      case 'lower': out = s.toLowerCase(); break;
      case 'title': out = s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()); break;
      case 'pad_left': out = s.length >= length ? s : padChar.repeat(length - s.length) + s; break;
      case 'pad_right': out = s.length >= length ? s : s + padChar.repeat(length - s.length); break;
      case 'extract': out = s.slice(start - 1, start - 1 + length); break;
    }
    if (out !== s) changed++;
    return { ...row, [colName]: out };
  });

  const labels: Record<TextOp, string> = {
    trim: 'Trimmed', clean: 'Cleaned non-printable characters in', upper: 'Uppercased', lower: 'Lowercased',
    title: 'Title-cased', pad_left: `Left-padded (→${length})`, pad_right: `Right-padded (→${length})`,
    extract: `Extracted substring [${start}..${start - 1 + length}] from`,
  };
  return { rows: newRows, columns: [], changedCount: changed, description: `${labels[op]} "${colName}" (${changed} cells)` };
}

export type NumericOp = 'round' | 'floor' | 'ceil' | 'abs' | 'minmax' | 'replace_outliers';

export function applyNumericOp(
  rows: RowData[],
  colName: string,
  op: NumericOp,
  params: { decimals?: number; min?: number; max?: number; replacement?: number }
): TransformResult {
  // Pre-pass: collect numeric values for min-max scaling and validity checks
  const nums: number[] = [];
  for (const row of rows) {
    const raw = row[colName];
    if (raw === null || raw === undefined || isMissingValue(String(raw))) continue;
    const n = toNumber(String(raw));
    if (n !== null) nums.push(n);
  }
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const range = max - min;
  const dp = Math.max(0, Math.min(6, Math.floor(params.decimals ?? 2)));

  let changed = 0;
  let failed = 0;
  const newRows = rows.map((row) => {
    const raw = row[colName];
    if (raw === null || raw === undefined || isMissingValue(String(raw))) return row;
    const n = toNumber(String(raw));
    if (n === null) { failed++; return row; }
    let out: number = n;
    switch (op) {
      case 'round': out = Number(n.toFixed(dp)); break;
      case 'floor': out = Math.floor(n); break;
      case 'ceil': out = Math.ceil(n); break;
      case 'abs': out = Math.abs(n); break;
      case 'minmax':
        out = range === 0 ? 0 : Number(((n - min) / range).toFixed(4));
        break;
      case 'replace_outliers': {
        const lo = params.min ?? -Infinity;
        const hi = params.max ?? Infinity;
        if (n < lo || n > hi) out = params.replacement ?? 0;
        break;
      }
    }
    if (out !== n) changed++;
    return { ...row, [colName]: out };
  });

  const labels: Record<NumericOp, string> = {
    round: `Rounded to ${dp} decimal(s)`, floor: 'Floored', ceil: 'Ceiled', abs: 'Applied absolute value to',
    minmax: 'Min-max normalized', replace_outliers: 'Replaced outliers in',
  };
  const suffix = failed > 0 ? ` (${failed} non-numeric cells skipped)` : '';
  return { rows: newRows, columns: [], changedCount: changed, description: `${labels[op]} "${colName}" — ${changed} cells updated${suffix}` };
}

export type DateOp = 'year' | 'month' | 'day' | 'weekday' | 'timezone' | 'diff';

export function applyDateOp(
  rows: RowData[],
  columns: ColumnSchema[],
  colName: string,
  op: DateOp,
  params: { fromOffset?: number; toOffset?: number; secondCol?: string; unit?: 'days' | 'weeks' | 'months' | 'years' }
): TransformResult {
  const fromOffset = params.fromOffset ?? 0;
  const toOffset = params.toOffset ?? 0;
  const shiftHours = toOffset - fromOffset;
  const unit = params.unit ?? 'days';
  const secondCol = params.secondCol;

  const existing = new Set(columns.map((c) => c.name));
  const targetName = op === 'diff'
    ? uniqueName(`${colName} Diff ${unit}`, existing)
    : uniqueName(`${colName} ${op === 'weekday' ? 'Weekday' : op.charAt(0).toUpperCase() + op.slice(1)}`, existing);

  let changed = 0;
  let failed = 0;
  const newRows = rows.map((row) => {
    const raw = row[colName];
    if (raw === null || raw === undefined || isMissingValue(String(raw))) {
      return op === 'diff' || op !== 'timezone' ? { ...row, [targetName]: '' } : row;
    }
    const d = toDate(String(raw));
    if (d === null) {
      failed++;
      return { ...row, [targetName]: '' };
    }

    if (op === 'year') { changed++; return { ...row, [targetName]: String(d.getFullYear()) }; }
    if (op === 'month') { changed++; return { ...row, [targetName]: String(d.getMonth() + 1) }; }
    if (op === 'day') { changed++; return { ...row, [targetName]: String(d.getDate()) }; }
    if (op === 'weekday') {
      changed++;
      return { ...row, [targetName]: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()] };
    }
    if (op === 'timezone') {
      changed++;
      const shifted = new Date(d.getTime() + shiftHours * 3600_000);
      return { ...row, [colName]: formatDateTime(shifted) };
    }
    // diff
    const rawB = secondCol ? row[secondCol] : null;
    const dB = rawB === null || rawB === undefined ? null : toDate(String(rawB));
    if (dB === null) {
      failed++;
      return { ...row, [targetName]: '' };
    }
    const diffDays = Math.floor(Math.abs(d.getTime() - dB.getTime()) / 86_400_000);
    let out: number;
    switch (unit) {
      case 'weeks': out = Math.floor(diffDays / 7); break;
      case 'months': out = Math.round(diffDays / 30.44); break;
      case 'years': out = Math.round(diffDays / 365.25); break;
      case 'days':
      default: out = diffDays; break;
    }
    changed++;
    return { ...row, [targetName]: String(out) };
  });

  const addsColumn = op !== 'timezone';
  const newColumns: ColumnSchema[] = addsColumn
    ? [...columns, { name: targetName, originalName: targetName, type: 'number', nullCount: 0, uniqueCount: 0, sampleValues: [] }]
    : columns;

  const labels: Record<DateOp, string> = {
    year: 'Extracted year from', month: 'Extracted month from', day: 'Extracted day from',
    weekday: 'Extracted weekday from', timezone: `Timezone-shifted "${colName}" by ${shiftHours >= 0 ? '+' : ''}${shiftHours}h`,
    diff: `Computed ${unit} difference "${colName}" − "${secondCol}" into "${targetName}"`,
  };
  const suffix = failed > 0 ? ` (${failed} unparseable date(s) skipped)` : '';
  return {
    rows: newRows,
    columns: addsColumn ? rebuildColumns(newRows, newColumns) : newColumns,
    changedCount: changed,
    description: `${op === 'timezone' ? labels.timezone : `${labels[op]} "${colName}" into "${targetName}"`} — ${changed} rows${suffix}`,
  };
}

// ─── Conditional Logic Builder (IF-THEN-ELSE) ────────────────────────

export type ConditionOperator =
  | 'equals' | 'not_equals' | 'contains'
  | 'greater_than' | 'less_than' | 'greater_equal' | 'less_equal'
  | 'is_empty' | 'is_not_empty';

export interface Condition {
  column: string;
  operator: ConditionOperator;
  value: string;
}

const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  equals: '=', not_equals: '≠', contains: 'contains',
  greater_than: '>', less_than: '<', greater_equal: '≥', less_equal: '≤',
  is_empty: 'is empty', is_not_empty: 'is not empty',
};

export function operatorLabel(op: ConditionOperator): string {
  return OPERATOR_LABELS[op];
}

function evaluateCondition(row: RowData, cond: Condition): boolean {
  const raw = row[cond.column];
  const s = raw === null || raw === undefined ? '' : String(raw);
  const isMissing = isMissingValue(s);

  switch (cond.operator) {
    case 'is_empty': return isMissing;
    case 'is_not_empty': return !isMissing;
    case 'equals': return !isMissing && s.trim().toLowerCase() === cond.value.trim().toLowerCase();
    case 'not_equals': return isMissing || s.trim().toLowerCase() !== cond.value.trim().toLowerCase();
    case 'contains': return !isMissing && s.toLowerCase().includes(cond.value.toLowerCase());
    case 'greater_than':
    case 'less_than':
    case 'greater_equal':
    case 'less_equal': {
      if (isMissing) return false;
      const a = toNumber(s);
      const b = toNumber(cond.value);
      if (a !== null && b !== null) {
        switch (cond.operator) {
          case 'greater_than': return a > b;
          case 'less_than': return a < b;
          case 'greater_equal': return a >= b;
          case 'less_equal': return a <= b;
        }
      }
      // Fall back to string comparison
      const cmp = s.localeCompare(cond.value, undefined, { numeric: true, sensitivity: 'base' });
      switch (cond.operator) {
        case 'greater_than': return cmp > 0;
        case 'less_than': return cmp < 0;
        case 'greater_equal': return cmp >= 0;
        case 'less_equal': return cmp <= 0;
      }
      return false;
    }
    default:
      return false;
  }
}

export function applyConditionalRules(
  rows: RowData[],
  columns: ColumnSchema[],
  conditions: Condition[],
  logic: 'AND' | 'OR',
  targetColumn: string,
  thenValue: string,
  elseValue: string
): TransformResult {
  if (conditions.length === 0) return { rows, columns: [], changedCount: 0, description: 'Add at least one condition to the rule' };

  const isNew = !columns.some((c) => c.name === targetColumn);
  const existing = new Set(columns.map((c) => c.name));
  const target = isNew ? uniqueName(targetColumn || 'Flag', existing) : targetColumn;

  let matched = 0;
  let changed = 0;
  const newRows = rows.map((row) => {
    const results = conditions.map((c) => evaluateCondition(row, c));
    const match = logic === 'AND' ? results.every(Boolean) : results.some(Boolean);
    if (match) matched++;
    const out = match ? thenValue : elseValue;
    if (String(row[target] ?? '') !== out) changed++;
    return { ...row, [target]: out };
  });

  const newColumns: ColumnSchema[] = isNew
    ? [...columns, { name: target, originalName: target, type: 'string', nullCount: 0, uniqueCount: 0, sampleValues: [] }]
    : columns;

  const condStr = conditions.map((c) => `${c.column} ${OPERATOR_LABELS[c.operator]} ${c.operator.includes('empty') ? '' : `"${c.value}"`}`).join(` ${logic} `);
  return {
    rows: newRows,
    columns: isNew ? rebuildColumns(newRows, newColumns) : newColumns,
    changedCount: changed,
    description: `Applied rule: IF (${condStr}) THEN "${target}" = "${thenValue}" ELSE "${elseValue}" — ${matched} row(s) matched, ${changed} cells set`,
  };
}
