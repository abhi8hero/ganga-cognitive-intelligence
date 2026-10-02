import { Clock, ChevronRight } from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { cn } from '@/lib/utils';

const MODE_BADGE_STYLES: Record<string, string> = {
  manual: 'bg-muted text-muted-foreground border-border',
  basic: 'bg-info/10 text-info border-info/30',
  smart: 'bg-primary/10 text-primary border-primary/30',
  ai: 'bg-sky-500/10 text-sky-500 border-sky-500/30',
};

/** Execution log content — rendered inside the BottomDock "Logs" tab. */
export default function LogPanel() {
  const { state } = useWorkspace();
  const { logs } = state;

  return (
    <div className="flex-1 min-w-0 overflow-auto bg-card">
      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
          <Clock className="w-5 h-5 opacity-50" />
          <span className="text-xs">No operations performed yet</span>
          <span className="text-[10px] opacity-70">Edits, cleanings and exports will appear here</span>
        </div>
      ) : (
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-card z-10 border-b border-border">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Time</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Mode</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Operation</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Description</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground whitespace-nowrap">Rows</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-border hover:bg-accent/20">
                <td className="px-3 py-1.5 text-muted-foreground whitespace-nowrap font-data">
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </td>
                <td className="px-3 py-1.5">
                  <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium border', MODE_BADGE_STYLES[log.operation_mode])}>
                    {log.operation_mode}
                  </span>
                </td>
                <td className="px-3 py-1.5 font-medium text-foreground whitespace-nowrap">{log.operation_type}</td>
                <td className="px-3 py-1.5 text-muted-foreground">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {log.affected_columns.length > 0 && (
                      <>
                        <ChevronRight className="w-3 h-3 shrink-0" />
                        <span className="font-data text-muted-foreground/70 text-[10px] shrink-0">
                          {log.affected_columns.slice(0, 3).join(', ')}{log.affected_columns.length > 3 ? ` +${log.affected_columns.length - 3}` : ''}
                        </span>
                      </>
                    )}
                    <span className="truncate">{log.description}</span>
                  </div>
                </td>
                <td className="px-3 py-1.5 text-right text-muted-foreground font-data">{log.affected_rows}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
