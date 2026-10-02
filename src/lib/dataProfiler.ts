import type { ColumnSchema, RowData } from '@/types';
import { isMissingValue, isNumeric, isValidDate } from '@/lib/errorDetector';

/** Human-facing inferred type shown as a badge on column headers and profiling cards */
export type DisplayType = 'Text' | 'Integer' | 'Float' | 'Date' | 'Boolean';

export interface ValueCount {
  value: string;
  count: number;
}

export interface ColumnProfile {
  name: string;
  displayType: DisplayType;
  totalCount: number;
  validCount: number;
  emptyCount: number;
  invalidCount: number;
  validPct: number;
  emptyPct: number;
  invalidPct: number;
  distinctCount: number;
  topValues: ValueCount[];
}

export interface DatasetProfile {
  columns: ColumnProfile[];
  totalRows: number;
  sampledRows: number;
  sampled: boolean;
  validPct: number;
  emptyPct: number;
  invalidPct: number;
  qualityScore: number;
}

const PROFILE_SAMPLE_LIMIT = 50_000;
const TOP_VALUES_LIMIT = 3;

const BOOLEAN_TOKENS = new Set(['true', 'false', 'yes', 'no', '1', '0']);

function isBooleanValue(value: string): boolean {
  return BOOLEAN_TOKENS.has(value.trim().toLowerCase());
}

/** A value is invalid when it fails to conform to the column's inferred schema type */
function isInvalidForType(value: string, type: ColumnSchema['type']): boolean {  switch (type) {
    case 'number':
      return !isNumeric(value);
    case 'date':
      return !isValidDate(value);
    case 'boolean':
      return !isBooleanValue(value);
    case 'string':
      // Any non-missing, non-control-character string is a valid text value
      return /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(value);
    case 'mixed':
    case 'empty':
    default:
      return false;
  }
}

/** Infer the display type (Text / Integer / Float / Date / Boolean) from raw values */
function inferDisplayType(values: (string | null)[], schemaType: ColumnSchema['type']): DisplayType {
  const nonMissing = values.filter((v): v is string => v !== null && !isMissingValue(v));
  if (nonMissing.length === 0) return 'Text';

  if (schemaType === 'boolean') return 'Boolean';
  if (schemaType === 'date') return 'Date';

  let numeric = 0;
  let integer = 0;
  let dates = 0;
  let bools = 0;
  for (const v of nonMissing) {
    if (isNumeric(v)) {
      numeric++;
      if (Number.isInteger(Number(v.replace(/,/g, '')))) integer++;
    } else if (isValidDate(v)) dates++;
    if (isBooleanValue(v)) bools++;
  }
  const total = nonMissing.length;
  if (bools / total >= 0.9) return 'Boolean';
  if (numeric / total >= 0.5) return integer === numeric ? 'Integer' : 'Float';
  if (dates / total >= 0.7) return 'Date';
  return 'Text';
}

/** Profile a single column: quality split, cardinality and top values */
export function profileColumn(sampleRows: RowData[], column: ColumnSchema): ColumnProfile {
  const values = sampleRows.map((r) => {
    const v = r[column.name];
    return v === null || v === undefined ? null : String(v);
  });

  let validCount = 0;
  let emptyCount = 0;
  let invalidCount = 0;
  const distinct = new Set<string>();
  const counts = new Map<string, number>();

  for (const v of values) {
    if (v === null || isMissingValue(v)) {
      emptyCount++;
      continue;
    }
    if (isInvalidForType(v, column.type)) {
      invalidCount++;
      continue;
    }
    validCount++;
    distinct.add(v);
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }

  const totalCount = values.length || 1;
  const pct = (n: number) => Math.round((n / totalCount) * 1000) / 10;

  const topValues: ValueCount[] = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_VALUES_LIMIT)
    .map(([value, count]) => ({ value, count }));

  return {
    name: column.name,
    displayType: inferDisplayType(values, column.type),
    totalCount: values.length,
    validCount,
    emptyCount,
    invalidCount,
    validPct: pct(validCount),
    emptyPct: pct(emptyCount),
    invalidPct: pct(invalidCount),
    distinctCount: distinct.size,
    topValues,
  };
}

/** Profile the full dataset (sampled for very large files) with an overall quality score */
export function profileDataset(
  rows: RowData[],
  columns: ColumnSchema[],
  sampleLimit = PROFILE_SAMPLE_LIMIT
): DatasetProfile {
  const sample = rows.length > sampleLimit ? rows.slice(0, sampleLimit) : rows;
  const profiles = columns.map((c) => profileColumn(sample, c));

  let valid = 0;
  let empty = 0;
  let invalid = 0;
  let cells = 0;
  for (const p of profiles) {
    valid += p.validCount;
    empty += p.emptyCount;
    invalid += p.invalidCount;
    cells += p.totalCount;
  }
  const denom = cells || 1;

  return {
    columns: profiles,
    totalRows: rows.length,
    sampledRows: sample.length,
    sampled: rows.length > sampleLimit,
    validPct: Math.round((valid / denom) * 1000) / 10,
    emptyPct: Math.round((empty / denom) * 1000) / 10,
    invalidPct: Math.round((invalid / denom) * 1000) / 10,
    qualityScore: Math.round((valid / denom) * 100),
  };
}
