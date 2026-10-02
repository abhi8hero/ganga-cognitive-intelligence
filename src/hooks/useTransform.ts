import { useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { detectErrors } from '@/lib/errorDetector';
import { createManualLog } from '@/lib/cleaningEngine';
import type { TransformResult } from '@/lib/transformations';
import type { ColumnSchema, RowData } from '@/types';

/**
 * Applies a transformation result to the workspace: commits rows/columns
 * (pushing an undo snapshot), appends an execution log, re-scans errors
 * (debounced so large datasets stay responsive) and toasts the outcome.
 */
export function useTransform() {
  const { state, dispatch } = useWorkspace();
  const rescanTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRescan = useCallback((rows: RowData[], columns: ColumnSchema[]) => {
    if (rescanTimer.current) clearTimeout(rescanTimer.current);
    rescanTimer.current = setTimeout(() => {
      try {
        dispatch({ type: 'SET_LOADING', loading: true });
        const { errors } = detectErrors(rows, columns, state.dataset?.id ?? 'local');
        dispatch({ type: 'SET_ERRORS', errors });
      } catch (e) {
        console.error('[ADCP] Error re-scan failed:', e);
      } finally {
        dispatch({ type: 'SET_LOADING', loading: false });
      }
    }, 250);
  }, [dispatch, state.dataset?.id]);

  const applyTransform = useCallback(
    (result: TransformResult, operationType: string, affectedColumns: string[] = [], silent = false) => {
      const { dataset } = state;
      const rowsChanged = result.rows !== state.rows;
      const columnsChanged = result.columns.length > 0 && result.columns !== state.columns;

      if (rowsChanged) {
        dispatch({ type: 'SET_ROWS', rows: result.rows, pushUndo: true });
      }
      if (columnsChanged) {
        dispatch({ type: 'SET_COLUMNS', columns: result.columns });
      }
      if (dataset) {
        dispatch({
          type: 'ADD_LOG',
          log: createManualLog(dataset.id, operationType, result.description, result.changedCount, affectedColumns),
        });
      }

      scheduleRescan(result.rows, columnsChanged ? result.columns : state.columns);

      if (!silent) {
        if (result.changedCount > 0 || rowsChanged || columnsChanged) {
          toast.success(result.description);
        } else {
          toast.info(result.description);
        }
      }
    },
    [state, dispatch, scheduleRescan]
  );

  return { applyTransform, scheduleRescan };
}
