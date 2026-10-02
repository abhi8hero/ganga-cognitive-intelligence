import { useWorkspace } from '@/contexts/WorkspaceContext';
import { AlertTriangle, CheckCircle2, Clock, Database, Activity, List, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface BottomStatusBarProps {
  onOpenLogs: () => void;
}

export default function BottomStatusBar({ onOpenLogs }: BottomStatusBarProps) {
  const { state, dispatch } = useWorkspace();
  const { dataset, rows, columns, errors, selectedCell, isLoading, errorPanelOpen, logs } = state;

  const unfixedErrors = errors.filter((e) => !e.is_fixed).length;

  if (!dataset) return null;

  return (
    <div className="flex items-center h-7 px-3 border-t border-border bg-card shrink-0 gap-3 text-xs text-muted-foreground select-none overflow-x-auto whitespace-nowrap">
      {/* Status indicator */}
      <div className="flex items-center gap-1.5 shrink-0">
        {isLoading ? (
          <>
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>Processing…</span>
          </>
        ) : dataset.status === 'cleaned' ? (
          <>
            <CheckCircle2 className="w-3 h-3 text-success" />
            <span className="text-success">Cleaned</span>
          </>
        ) : (
          <>
            <Activity className="w-3 h-3" />
            <span className="capitalize">{dataset.status}</span>
          </>
        )}
      </div>

      <span className="text-border">|</span>

      {/* Dimensions */}
      <div className="flex items-center gap-1 shrink-0">
        <Database className="w-3 h-3" />
        <span className="font-data">{rows.length.toLocaleString()} × {columns.length}</span>
      </div>

      {/* Selected cell */}
      {selectedCell && (
        <>
          <span className="text-border">|</span>
          <span className="font-data shrink-0">
            R{selectedCell.rowIndex + 1} · {selectedCell.columnName}
          </span>
        </>
      )}

      <div className="flex-1" />

      {/* Error panel toggle */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'h-5 px-2 text-xs gap-1',
          unfixedErrors > 0 ? 'text-warning' : 'text-success',
          errorPanelOpen && 'bg-accent'
        )}
        onClick={() => dispatch({ type: 'TOGGLE_ERROR_PANEL' })}
      >
        <AlertTriangle className="w-3 h-3" />
        <span>{unfixedErrors} issue{unfixedErrors !== 1 ? 's' : ''}</span>
      </Button>

      {/* Logs toggle — opens dock Logs tab */}
      <Button
        variant="ghost"
        size="sm"
        className={cn('h-5 px-2 text-xs gap-1')}
        onClick={onOpenLogs}
      >
        <List className="w-3 h-3" />
        <span>{logs.length} op{logs.length !== 1 ? 's' : ''}</span>
      </Button>

      {/* Engine badge */}
      <div className="flex items-center gap-1 shrink-0 hidden md:flex">
        <Terminal className="w-3 h-3 text-primary" />
        <span className="text-primary">ADCP Engine</span>
      </div>

      {/* Timestamp */}
      <div className="flex items-center gap-1 shrink-0 hidden md:flex">
        <Clock className="w-3 h-3" />
        <span>{new Date(dataset.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
}
