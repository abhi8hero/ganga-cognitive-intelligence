import {
  Sun, Moon, Download, RotateCcw, RotateCw, FileText, Layers,
  AlertTriangle, CheckCircle2, Home, BarChart3,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportDataset, getExportFilename } from '@/lib/exportEngine';
import { toast } from 'sonner';
import TornadoLogo from '@/components/TornadoLogo';

export default function TopNav() {
  const navigate = useNavigate();
  const { state, dispatch } = useWorkspace();
  const { toggleTheme, isDark } = useTheme();
  const { dataset, rows, columns, errors, isDirty, isLoading } = state;

  const unfixedErrors = errors.filter((e) => !e.is_fixed).length;
  const canUndo = state.undoStack.length > 0;
  const canRedo = state.redoStack.length > 0;

  const handleExport = (format: 'csv' | 'xlsx' | 'json') => {
    if (!dataset || rows.length === 0) {
      toast.error('No data to export');
      return;
    }
    try {
      const filename = getExportFilename(dataset.original_filename);
      exportDataset(rows, columns, filename, format);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <header className="flex items-center h-12 px-3 border-b border-border bg-card shrink-0 gap-2">
      {/* Brand + back */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => window.history.length > 1 ? window.history.back() : window.location.assign('/')}
          title="Back"
        >
          <Home className="w-3.5 h-3.5" />
        </Button>
        <TornadoLogo size={26} animated />
        <div className="hidden sm:block leading-tight">
          <p className="text-xs font-bold text-foreground">ADCP</p>
          <p className="text-[10px] text-muted-foreground">by GCI</p>
        </div>
      </div>

      {/* Dataset info */}
      {dataset && (
        <div className="flex items-center gap-2 min-w-0 shrink border-l border-border pl-2 ml-1">
          <span className="text-xs text-foreground font-medium truncate max-w-40 md:max-w-56" title={dataset.name}>
            {dataset.name}
          </span>
          <Badge variant="outline" className="text-[10px] h-4 px-1.5 shrink-0 border-primary/40 text-primary">
            {dataset.file_format.toUpperCase()}
          </Badge>
          {isDirty && (
            <Badge variant="outline" className="text-[10px] h-4 px-1.5 shrink-0 border-warning/40 text-warning">
              Unsaved
            </Badge>
          )}
        </div>
      )}

      {/* Center status */}
      <div className="flex-1 min-w-0 flex items-center justify-center gap-3">
        {isLoading && (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-muted-foreground">Processing…</span>
          </div>
        )}
        {!isLoading && unfixedErrors > 0 && (
          <button
            onClick={() => dispatch({ type: 'TOGGLE_ERROR_PANEL' })}
            className="flex items-center gap-1.5 text-xs text-warning hover:text-warning/80 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{unfixedErrors} issue{unfixedErrors > 1 ? 's' : ''}</span>
          </button>
        )}
        {!isLoading && unfixedErrors === 0 && dataset && !isLoading && (
          <div className="flex items-center gap-1.5 text-xs text-success">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">No issues detected</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Visualize — Power BI-style analytics dashboard */}
        <Button
          size="sm"
          className="h-7 text-xs px-2.5 gap-1.5 shadow-glow"
          onClick={() => navigate('/dashboard')}
          title="Open Visualize dashboard"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Visualize</span>
        </Button>

        {dataset && (
          <>
            {/* Undo / Redo */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={!canUndo}
              onClick={() => dispatch({ type: 'UNDO' })}
              title="Undo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={!canRedo}
              onClick={() => dispatch({ type: 'REDO' })}
              title="Redo"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </Button>

            {/* Export */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="h-7 text-xs px-2.5 gap-1.5 shadow-glow">
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Export as</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport('csv')} className="gap-2 text-xs">
                  <FileText className="w-3.5 h-3.5" />
                  CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('xlsx')} className="gap-2 text-xs">
                  <Layers className="w-3.5 h-3.5" />
                  XLSX
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('json')} className="gap-2 text-xs">
                  <FileText className="w-3.5 h-3.5" />
                  JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}



        {/* Theme */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={toggleTheme}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </Button>
      </div>
    </header>
  );
}
