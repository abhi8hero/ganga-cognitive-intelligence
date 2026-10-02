import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { ColumnSchema } from '@/types';

/** Collapsible section with sidebar design tokens */
export function PanelSection({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded border border-sidebar-border/60">
      <button
        className="w-full flex items-center gap-1.5 px-2 py-1.5 text-left hover:bg-sidebar-accent/50 transition-colors rounded-t"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <ChevronDown className="w-3 h-3 text-sidebar-foreground/60 shrink-0" /> : <ChevronRight className="w-3 h-3 text-sidebar-foreground/60 shrink-0" />}
        <span className="text-sidebar-primary shrink-0">{icon}</span>
        <span className="text-[11px] font-medium text-sidebar-foreground flex-1">{title}</span>
      </button>
      {open && <div className="px-2 pb-2 pt-0.5 space-y-1.5">{children}</div>}
    </div>
  );
}

/** Compact label + control row */
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] text-sidebar-foreground/60 leading-none">{label}</span>
      {children}
    </label>
  );
}

/** Compact select styled for the sidebar */
export function SidebarSelect({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
}: {
  value: string;
  onValueChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="h-7 w-full text-[11px] bg-sidebar border-sidebar-border">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-56">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-xs">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Compact text input styled for the sidebar */
export function SidebarInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <Input
      className="h-7 w-full text-[11px] bg-sidebar border-sidebar-border px-2"
      value={value}
      type={type}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/** Primary apply button for a panel action */
export function ApplyButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      size="sm"
      className="h-7 w-full text-[11px] gap-1"
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </Button>
  );
}

/** Tiny toggle row */
export function ToggleRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] text-sidebar-foreground/70">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} className="scale-90" />
    </div>
  );
}

/** Checkbox list for picking one or more columns */
export function ColumnCheckboxList({
  columns,
  selected,
  onToggle,
  max,
}: {
  columns: ColumnSchema[];
  selected: string[];
  onToggle: (name: string) => void;
  max?: number;
}) {
  return (
    <div className="max-h-32 overflow-y-auto rounded border border-sidebar-border/60 p-1 space-y-0.5 bg-sidebar/50">
      {columns.map((c) => {
        const isSel = selected.includes(c.name);
        const atLimit = max !== undefined && selected.length >= max && !isSel;
        return (
          <button
            key={c.name}
            className={(
              'w-full flex items-center gap-1.5 px-1 py-0.5 rounded text-left transition-colors ' +
              (isSel ? 'bg-primary/15' : atLimit ? 'opacity-40 cursor-not-allowed' : 'hover:bg-sidebar-accent/60')
            )}
            onClick={() => !atLimit && onToggle(c.name)}
          >
            <span className={
              'w-3 h-3 shrink-0 rounded-sm border flex items-center justify-center ' +
              (isSel ? 'bg-primary border-primary' : 'border-sidebar-border')
            }>
              {isSel && <span className="text-[8px] leading-none text-primary-foreground font-bold">✓</span>}
            </span>
            <span className="text-[10px] text-sidebar-foreground truncate">{c.name}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Small metric chip */
export function MetricChip({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'success' | 'warning' | 'destructive' }) {
  const toneCls =
    tone === 'success' ? 'border-success/40 text-success'
    : tone === 'warning' ? 'border-warning/40 text-warning'
    : tone === 'destructive' ? 'border-destructive/40 text-destructive'
    : 'border-sidebar-border text-sidebar-foreground/70';
  return (
    <Badge variant="outline" className={`text-[9px] h-4 px-1.5 font-normal ${toneCls}`}>
      {label}: <span className="font-data font-semibold ml-0.5">{value}</span>
    </Badge>
  );
}
