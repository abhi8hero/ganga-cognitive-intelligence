import {
  Bot,
  Sparkles,
  Zap,
  Brain,
  MessageSquare,
  History,
  RotateCcw,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Wrench,
  X,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import ManualCleaningPanel from './panels/ManualCleaningPanel';
import RuleTransformPanel from './panels/RuleTransformPanel';

const PLANNED_FEATURES = [
  { icon: <MessageSquare className="w-3.5 h-3.5" />, label: 'Natural Language Queries', desc: 'Ask questions about your data in plain English' },
  { icon: <Sparkles className="w-3.5 h-3.5" />, label: 'AI Cleaning Suggestions', desc: 'Intelligent recommendations for data issues' },
  { icon: <Brain className="w-3.5 h-3.5" />, label: 'Anomaly Detection', desc: 'Auto-detect outliers and inconsistencies' },
  { icon: <Zap className="w-3.5 h-3.5" />, label: 'n8n Workflow Automation', desc: 'Trigger automated multi-step data pipelines' },
];

export default function RightSidebar() {
  const { state, dispatch } = useWorkspace();
  const { logs, undoStack, redoStack, rightSidebarOpen, activeToolPanel } = state;

  /* Collapsed state — thin vertical rail with expand chevron and action icons */
  if (!rightSidebarOpen) {
    return (
      <div className="flex flex-col items-center py-2.5 gap-2 w-12 shrink-0 border-l border-border bg-sidebar h-full select-none z-20">
        {/* Expand rail button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={() => dispatch({ type: 'TOGGLE_RIGHT_SIDEBAR' })}
          title="Expand right panel"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="w-6 border-t border-sidebar-border/70 my-0.5" />

        {/* 1. AI ADCP AI option */}
        <button
          className={`flex flex-col items-center justify-center gap-0.5 w-10 py-1.5 px-1 rounded-md transition-all cursor-pointer ${
            !activeToolPanel
              ? 'bg-sidebar-accent/80 text-sidebar-foreground ring-1 ring-border/50'
              : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60'
          }`}
          onClick={() => {
            dispatch({ type: 'SET_ACTIVE_TOOL_PANEL', panel: null });
            dispatch({ type: 'TOGGLE_RIGHT_SIDEBAR' });
          }}
          title="ADCP AI (AI) — Coming Soon (Click to open)"
        >
          <Bot className="w-4 h-4 text-sidebar-primary" />
          <span className="text-[8px] font-bold text-warning leading-none tracking-tight">SOON</span>
        </button>

        {/* 2. Screwdriver / Wrench (Manual Cleaning) button — positioned directly below AI option as in Image 1 */}
        <button
          className={`flex flex-col items-center justify-center gap-0.5 w-10 py-1.5 px-1 rounded-md transition-all cursor-pointer ${
            activeToolPanel === 'manual'
              ? 'bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/40'
              : 'text-sidebar-foreground/75 hover:text-primary hover:bg-primary/10'
          }`}
          onClick={() => {
            dispatch({ type: 'SET_ACTIVE_TOOL_PANEL', panel: 'manual' });
          }}
          title="Manual Cleaning (Click to open panel)"
        >
          <Wrench className="w-4 h-4" />
          <span className="text-[7px] font-bold leading-none tracking-tight mt-0.5">MANUAL</span>
        </button>

        {/* 3. Switches / Sliders (Rule Transforms) button — positioned directly below Manual Cleaning as in Image 1 */}
        <button
          className={`flex flex-col items-center justify-center gap-0.5 w-10 py-1.5 px-1 rounded-md transition-all cursor-pointer ${
            activeToolPanel === 'rules'
              ? 'bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/40'
              : 'text-sidebar-foreground/75 hover:text-primary hover:bg-primary/10'
          }`}
          onClick={() => {
            dispatch({ type: 'SET_ACTIVE_TOOL_PANEL', panel: 'rules' });
          }}
          title="Rule Transforms (Click to open panel)"
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="text-[7px] font-bold leading-none tracking-tight mt-0.5">RULES</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex h-full shrink-0">
      {/* Collapse tab — VS Code-style edge chevron (">") on the inner edge */}
      <button
        onClick={() => dispatch({ type: 'TOGGLE_RIGHT_SIDEBAR' })}
        className="absolute -left-2.5 top-1/2 -translate-y-1/2 z-30 h-10 w-5 rounded-l-md border border-r-0 border-border bg-card text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors flex items-center justify-center shadow-md"
        title="Hide right panel"
      >
        <ChevronRight className="w-3 h-3" />
      </button>

      <div className="flex flex-col w-72 shrink-0 border-l border-border bg-sidebar h-full overflow-hidden">
        {/* OVERLAY TOOL PANEL — Takes place over the AI panel when user clicks Manual Cleaning or Rule Transforms */}
        {activeToolPanel ? (
          <div className="flex flex-col h-full overflow-hidden bg-sidebar">
            {/* Tool Panel Header with close button */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-sidebar-border bg-sidebar shrink-0">
              <div className="flex items-center gap-1.5 min-w-0">
                {activeToolPanel === 'manual' ? (
                  <Wrench className="w-3.5 h-3.5 text-primary shrink-0" />
                ) : (
                  <SlidersHorizontal className="w-3.5 h-3.5 text-primary shrink-0" />
                )}
                <span className="text-xs font-semibold text-sidebar-foreground truncate">
                  {activeToolPanel === 'manual' ? 'Manual Cleaning' : 'Rule Transforms'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {/* Switch between tools directly */}
                <div className="flex bg-muted/60 p-0.5 rounded border border-border/50 mr-1">
                  <button
                    className={`h-5 px-1.5 rounded text-[10px] font-medium transition-colors ${
                      activeToolPanel === 'manual'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => dispatch({ type: 'SET_ACTIVE_TOOL_PANEL', panel: 'manual' })}
                    title="Manual Cleaning"
                  >
                    Manual
                  </button>
                  <button
                    className={`h-5 px-1.5 rounded text-[10px] font-medium transition-colors ${
                      activeToolPanel === 'rules'
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => dispatch({ type: 'SET_ACTIVE_TOOL_PANEL', panel: 'rules' })}
                    title="Rule Transforms"
                  >
                    Rules
                  </button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                  onClick={() => dispatch({ type: 'SET_ACTIVE_TOOL_PANEL', panel: null })}
                  title="Close panel and return to ADCP AI"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Scrollable Tool Body */}
            <div className="flex-1 min-h-0 overflow-y-auto p-2">
              {activeToolPanel === 'manual' ? <ManualCleaningPanel /> : <RuleTransformPanel />}
            </div>

            {/* Bottom history bar for quick undo during cleaning */}
            <div className="border-t border-sidebar-border px-3 py-2 bg-sidebar shrink-0">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-muted-foreground flex items-center gap-1">
                  <History className="w-3 h-3" /> History
                </span>
                <span className="text-[10px] text-muted-foreground font-data">{undoStack.length} undo / {redoStack.length} redo</span>
              </div>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 flex-1 text-[10px] gap-1 border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  onClick={() => dispatch({ type: 'UNDO' })}
                  disabled={undoStack.length === 0}
                >
                  <RotateCcw className="w-2.5 h-2.5" /> Undo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 flex-1 text-[10px] gap-1 border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  onClick={() => dispatch({ type: 'REDO' })}
                  disabled={redoStack.length === 0}
                >
                  <RotateCw className="w-2.5 h-2.5" /> Redo
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* DEFAULT AI PANEL — ADCP AI & Intelligence Suite */
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-sidebar-border shrink-0">
              <Bot className="w-3.5 h-3.5 text-sidebar-primary" />
              <span className="text-xs font-semibold text-sidebar-foreground">ADCP AI</span>
              <Badge variant="outline" className="text-[9px] h-4 px-1.5 ml-auto border-warning/40 text-warning font-semibold">
                Coming Soon
              </Badge>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              {/* Quick toolbar callout */}
              <div className="p-3 border-b border-sidebar-border bg-primary/5">
                <div className="flex items-start gap-2">
                  <Layers className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <div className="text-[11px] text-sidebar-foreground/80 leading-relaxed">
                    Access deterministic data cleaning tools directly from the grid toolbar:
                  </div>
                </div>
                <div className="flex gap-1.5 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 flex-1 text-[10px] gap-1 border-border/80 bg-card hover:bg-primary/10 hover:text-primary hover:border-primary/40"
                    onClick={() => dispatch({ type: 'SET_ACTIVE_TOOL_PANEL', panel: 'manual' })}
                  >
                    <Wrench className="w-2.5 h-2.5" /> Manual Cleaning
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 flex-1 text-[10px] gap-1 border-border/80 bg-card hover:bg-primary/10 hover:text-primary hover:border-primary/40"
                    onClick={() => dispatch({ type: 'SET_ACTIVE_TOOL_PANEL', panel: 'rules' })}
                  >
                    <SlidersHorizontal className="w-2.5 h-2.5" /> Rule Transforms
                  </Button>
                </div>
              </div>

              {/* Transformation History */}
              <div className="px-3 py-3 space-y-2 border-b border-sidebar-border">
                <div className="flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-sidebar-primary" />
                  <span className="text-xs font-medium text-sidebar-foreground">Transformation History</span>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 flex-1 text-[11px] gap-1 border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    onClick={() => dispatch({ type: 'UNDO' })}
                    disabled={undoStack.length === 0}
                  >
                    <RotateCcw className="w-3 h-3" />
                    Undo ({undoStack.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 flex-1 text-[11px] gap-1 border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    onClick={() => dispatch({ type: 'REDO' })}
                    disabled={redoStack.length === 0}
                  >
                    <RotateCw className="w-3 h-3" />
                    Redo ({redoStack.length})
                  </Button>
                </div>

                {logs.length === 0 ? (
                  <p className="text-[10px] text-sidebar-foreground/50 leading-relaxed pt-1">
                    No transformations yet. Use Manual Cleaning or Rule Transforms to modify your dataset.
                  </p>
                ) : (
                  <div className="space-y-1 max-h-36 overflow-y-auto pt-1">
                    {logs.slice(0, 8).map((log) => (
                      <div key={log.id} className="px-2 py-1.5 rounded bg-sidebar-accent/60">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-sidebar-primary shrink-0" />
                          <span className="text-[11px] font-medium text-sidebar-accent-foreground truncate">
                            {log.operation_type}
                          </span>
                        </div>
                        <p className="text-[10px] text-sidebar-foreground/60 truncate pl-2.5">{log.description}</p>
                      </div>
                    ))}
                    {logs.length > 8 && (
                      <p className="text-[10px] text-sidebar-foreground/50 text-center">+{logs.length - 8} more in the Logs dock</p>
                    )}
                  </div>
                )}
              </div>

              {/* Planned intelligence features — each with a visible Coming Soon tag */}
              <div className="px-3 py-3 space-y-2">
                <p className="text-xs font-medium text-sidebar-foreground">Intelligence Suite</p>
                <div className="space-y-1.5">
                  {PLANNED_FEATURES.map((f) => (
                    <div
                      key={f.label}
                      className="flex items-start gap-2 px-2 py-2 rounded border border-sidebar-border/60"
                    >
                      <span className="text-sidebar-primary shrink-0 mt-0.5">{f.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-[11px] font-medium text-sidebar-foreground leading-tight truncate">{f.label}</p>
                          <Badge className="shrink-0 bg-warning/15 text-warning border border-warning/40 text-[9px] h-4 px-1 font-semibold">
                            Coming Soon
                          </Badge>
                        </div>
                        <p className="text-[10px] text-sidebar-foreground/60 leading-tight mt-0.5">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
