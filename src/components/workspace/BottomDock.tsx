import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { cn } from '@/lib/utils';
import ErrorPanel from './ErrorPanel';
import LogPanel from './LogPanel';

export type DockTab = 'errors' | 'logs';

interface BottomDockProps {
  activeTab: DockTab;
  onTabChange: (tab: DockTab) => void;
}

const MIN_HEIGHT = 36; // header-only
const DEFAULT_HEIGHT = 208;
const MAX_RATIO = 0.75; // up to 75% of workspace area

/**
 * VS Code-style bottom dock: drag the top handle to resize.
 * The dock can expand up to 75% of the grid+dock workspace area.
 */
export default function BottomDock({ activeTab, onTabChange }: BottomDockProps) {
  const { state, dispatch } = useWorkspace();
  const { errors, logs, errorPanelOpen } = state;

  const dockRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [isDragging, setIsDragging] = useState(false);

  const unfixedErrors = errors.filter((e) => !e.is_fixed).length;
  const isScanning = state.isLoading && errors.length === 0 && !!state.dataset;

  const clampHeight = useCallback((h: number) => {
    const workspace = dockRef.current?.parentElement;
    const maxH = workspace ? workspace.clientHeight * MAX_RATIO : window.innerHeight * MAX_RATIO;
    return Math.max(MIN_HEIGHT, Math.min(h, maxH));
  }, []);

  // Keep height within bounds when the window resizes
  useEffect(() => {
    const onResize = () => setHeight((h) => clampHeight(h));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [clampHeight]);

  // Drag-to-resize (pointer events cover mouse + touch)
  const onHandlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onHandlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging || !dockRef.current) return;
      const dockRect = dockRef.current.getBoundingClientRect();
      const newHeight = dockRect.bottom - e.clientY;
      setHeight(clampHeight(newHeight));
    },
    [isDragging, clampHeight]
  );

  const onHandlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* pointer already released */
    }
  }, []);

  if (!errorPanelOpen) return null;

  const headerOnly = height <= MIN_HEIGHT + 2;

  return (
    <div
      ref={dockRef}
      className={cn(
        'shrink-0 border-t border-border bg-card flex flex-col relative',
        isDragging && 'select-none'
      )}
      style={{ height: Math.round(height) }}
    >
      {/* ── Drag handle (top edge) ── */}
      <div
        className={cn('adcp-resize-handle h-2 w-full shrink-0 z-10', isDragging && 'is-dragging')}
        onPointerDown={onHandlePointerDown}
        onPointerMove={onHandlePointerMove}
        onPointerUp={onHandlePointerUp}
        onPointerCancel={onHandlePointerUp}
        title="Drag to resize (up to 75% of workspace)"
      />

      {/* ── Dock header: tabs ── */}
      <div className="flex items-center gap-1 px-3 h-7 shrink-0">
        <button
          onClick={() => onTabChange('errors')}
          className={cn(
            'flex items-center gap-1.5 px-2.5 h-6 rounded text-xs transition-colors',
            activeTab === 'errors'
              ? 'bg-accent text-primary font-medium'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          )}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Errors
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] h-4 px-1',
              isScanning
                ? 'border-info/40 text-info'
                : unfixedErrors > 0
                ? 'border-warning/40 text-warning'
                : 'border-success/40 text-success'
            )}
          >
            {isScanning ? 'scanning…' : unfixedErrors}
          </Badge>
        </button>

        <button
          onClick={() => onTabChange('logs')}
          className={cn(
            'flex items-center gap-1.5 px-2.5 h-6 rounded text-xs transition-colors',
            activeTab === 'logs'
              ? 'bg-accent text-primary font-medium'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          )}
        >
          <Clock className="w-3.5 h-3.5" />
          Logs
          <Badge variant="outline" className="text-[10px] h-4 px-1">{logs.length}</Badge>
        </button>

        <div className="flex-1" />

        {/* Quick resize presets */}
        <div className="hidden md:flex items-center gap-1 mr-1">
          <button
            className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
            onClick={() => setHeight(clampHeight(120))}
            title="Small"
          >
            S
          </button>
          <button
            className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
            onClick={() => setHeight(clampHeight(DEFAULT_HEIGHT))}
            title="Medium"
          >
            M
          </button>
          <button
            className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
            onClick={() => setHeight(clampHeight(Number.MAX_SAFE_INTEGER))}
            title="Max (75%)"
          >
            XL
          </button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => dispatch({ type: 'TOGGLE_ERROR_PANEL' })}
          title="Close panel"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* ── Tab content ── */}
      {!headerOnly && (
        <div className="flex flex-1 min-h-0">
          {activeTab === 'errors' ? <ErrorPanel /> : <LogPanel />}
        </div>
      )}

      {/* All-clean hint when dock is header-only and clean */}
      {headerOnly && unfixedErrors === 0 && !isScanning && (
        <div className="flex items-center gap-1.5 px-3 pb-1 text-[10px] text-success">
          <CheckCircle2 className="w-3 h-3" />
          All issues resolved
        </div>
      )}
    </div>
  );
}
