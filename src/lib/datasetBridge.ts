import type { ColumnSchema, FileFormat, RowData } from '@/types';

/**
 * In-memory dataset bridge between the landing page and the workspace.
 *
 * Replaces the previous sessionStorage bridge, which silently failed for
 * files larger than ~5 MB (browsers cap storage per origin). A module-level
 * store has no serialization cost and no size limit, so datasets up to the
 * 50 MB upload ceiling transfer losslessly.
 */
export interface PendingDatasetPayload {
  name: string;
  format: FileFormat;
  rowCount: number;
  columnCount: number;
  columns: ColumnSchema[];
  rows: RowData[];
}

let pendingDataset: PendingDatasetPayload | null = null;

export function setPendingDataset(payload: PendingDatasetPayload): void {
  pendingDataset = payload;
}

export function consumePendingDataset(): PendingDatasetPayload | null {
  const payload = pendingDataset;
  pendingDataset = null;
  return payload;
}
