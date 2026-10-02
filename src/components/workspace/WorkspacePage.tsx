import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TornadoLogo from '@/components/TornadoLogo';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { detectErrors } from '@/lib/errorDetector';
import { createManualLog } from '@/lib/cleaningEngine';
import { consumePendingDataset } from '@/lib/datasetBridge';
import type { Dataset } from '@/types';
import TopNav from './TopNav';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import SpreadsheetGrid from './SpreadsheetGrid';
import BottomDock from './BottomDock';
import type { DockTab } from './BottomDock';
import BottomStatusBar from './BottomStatusBar';
import { toast } from 'sonner';

export default function WorkspacePage() {
  const navigate = useNavigate();
  const { state, dispatch } = useWorkspace();
  const [dockTab, setDockTab] = useState<DockTab>('errors');
  const [bridgeConsumed, setBridgeConsumed] = useState(false);

  /* ── Load dataset passed from the landing page via in-memory bridge ── */
  useEffect(() => {
    if (state.dataset || bridgeConsumed) return;
    setBridgeConsumed(true);

    const pending = consumePendingDataset();
    if (!pending) return;

    const dataset: Dataset = {
      id: 'local-' + Date.now(),
      name: pending.name,
      original_filename: pending.name,
      file_format: pending.format,
      row_count: pending.rowCount,
      column_count: pending.columnCount,
      schema_info: pending.columns,
      status: 'ready',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Load immediately so the IDE renders without blocking
    dispatch({
      type: 'LOAD_DATASET',
      dataset,
      rows: pending.rows,
      columns: pending.columns,
      errors: [],
    });
    dispatch({
      type: 'ADD_LOG',
      log: createManualLog(dataset.id, 'Load Dataset', `Loaded ${pending.rows.length.toLocaleString()} rows from ${pending.format.toUpperCase()}`, pending.rows.length, []),
    });

    // 2. Scan for errors asynchronously so large datasets stay responsive
    setTimeout(() => {
      try {
        dispatch({ type: 'SET_LOADING', loading: true });
        const { errors } = detectErrors(pending.rows, pending.columns, dataset.id);
        dispatch({ type: 'SET_ERRORS', errors });
      } catch (e) {
        console.error('[ADCP] Error detection failed:', e);
        toast.error('Could not scan for data errors. The dataset is still loaded.');
      } finally {
        dispatch({ type: 'SET_LOADING', loading: false });
      }
    }, 80);
  }, [state.dataset, bridgeConsumed, dispatch]);

  /* ── Row operations ── */
  const handleAddRow = useCallback(() => {
    const { columns, rows, dataset } = state;
    const emptyRow = columns.reduce<Record<string, string>>((acc, col) => {
      acc[col.name] = '';
      return acc;
    }, {});

    dispatch({ type: 'SET_ROWS', rows: [...rows, emptyRow], pushUndo: true });

    if (dataset) {
      const log = createManualLog(dataset.id, 'Add Row', `Added empty row at position ${rows.length + 1}`, 1, []);
      dispatch({ type: 'ADD_LOG', log });
    }
    toast.success('Added new row');
  }, [state, dispatch]);

  const handleDeleteSelectedRow = useCallback(() => {
    const { selectedCell, rows, dataset, columns } = state;
    if (!selectedCell) return;

    const { rowIndex } = selectedCell;
    if (rowIndex < 0 || rowIndex >= rows.length) return;

    const newRows = rows.filter((_, i) => i !== rowIndex);
    dispatch({ type: 'SET_ROWS', rows: newRows, pushUndo: true });

    const { errors: newErrors } = detectErrors(newRows, columns, dataset?.id ?? 'local');
    dispatch({ type: 'SET_ERRORS', errors: newErrors });

    if (dataset) {
      const log = createManualLog(dataset.id, 'Delete Row', `Deleted row ${rowIndex + 1}`, 1, []);
      dispatch({ type: 'ADD_LOG', log });
    }
    dispatch({ type: 'CLEAR_SELECTION' });
    toast.success(`Deleted row ${rowIndex + 1}`);
  }, [state, dispatch]);

  /* ── Empty state: no dataset loaded ── */
  if (!state.dataset) {
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-background">
        <TopNav />
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-5">
          <TornadoLogo size={72} animated />
          <div className="text-center">
            <h1 className="text-lg font-semibold text-foreground mb-1">No dataset loaded</h1>
            <p className="text-sm text-muted-foreground">Upload a CSV, XLSX, JSON or TXT file to start cleaning.</p>
          </div>
          <Button className="gap-2 shadow-glow" onClick={() => navigate('/')}>
            <Upload className="w-4 h-4" />
            Upload Dataset
          </Button>
        </div>
      </div>
    );
  }

  /* ── IDE workspace: viewport-locked, grid at back, dock at front ── */
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <TopNav />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left sidebar — in-sidebar edge toggle, desktop only */}
        <div className="hidden md:flex">
          <LeftSidebar onAddRow={handleAddRow} onDeleteSelectedRow={handleDeleteSelectedRow} />
        </div>

        {/* Middle column: grid (back) + dock (front) + status bar */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          <SpreadsheetGrid />
          <BottomDock activeTab={dockTab} onTabChange={setDockTab} />
          <BottomStatusBar
            onOpenLogs={() => {
              setDockTab('logs');
              if (!state.errorPanelOpen) dispatch({ type: 'TOGGLE_ERROR_PANEL' });
            }}
          />
        </div>

        {/* Right sidebar — in-sidebar edge toggle, desktop only */}
        <div className="hidden md:flex">
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
