import { useMemo, useState } from 'react';
import {
  Braces,
  Eraser,
  SplitSquareHorizontal,
  Copy,
  ArrowLeft,
  ArrowRight,
  Droplets,
  Scissors,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useTransform } from '@/hooks/useTransform';
import { isMissingValue } from '@/lib/errorDetector';
import {
  castColumnType, changeCase, trimCells, normalizeHeaders, moveColumn, dropColumns,
  imputeColumn, dropRowsByNullThreshold, dropColumnsByNullThreshold,
  splitColumn, concatColumns, replacePattern,
  removeExactDuplicates, dedupeByKeys, validateRange,
  type CastTarget, type CaseStyle, type HeaderStyle, type ImputeStrategy, type RangeAction,
} from '@/lib/transformations';
import {
  PanelSection, Field, SidebarSelect, SidebarInput, ApplyButton, ToggleRow, ColumnCheckboxList, MetricChip,
} from './PanelPrimitives';

export default function ManualCleaningPanel() {
  const { state } = useWorkspace();
  const { applyTransform } = useTransform();
  const { rows, columns } = state;

  const colOptions = useMemo(() => columns.map((c) => ({ value: c.name, label: c.name })), [columns]);

  /* ── Type & Structure state ── */
  const [castCol, setCastCol] = useState('');
  const [castTarget, setCastTarget] = useState('');
  const [caseCol, setCaseCol] = useState('');
  const [caseStyle, setCaseStyle] = useState('');
  const [trimCol, setTrimCol] = useState('');
  const [headerStyle, setHeaderStyle] = useState('');
  const [moveCol, setMoveCol] = useState('');
  const [dropSel, setDropSel] = useState<string[]>([]);

  /* ── Missing data state ── */
  const [imputeCol, setImputeCol] = useState('');
  const [imputeStrategy, setImputeStrategy] = useState('');
  const [staticValue, setStaticValue] = useState('');
  const [threshold, setThreshold] = useState('50');

  /* ── Text & pattern state ── */
  const [splitCol, setSplitCol] = useState('');
  const [splitDelim, setSplitDelim] = useState(' ');
  const [splitParts, setSplitParts] = useState('2');
  const [concatSel, setConcatSel] = useState<string[]>([]);
  const [concatSep, setConcatSep] = useState(' ');
  const [concatName, setConcatName] = useState('');
  const [frCol, setFrCol] = useState('');
  const [frSearch, setFrSearch] = useState('');
  const [frReplace, setFrReplace] = useState('');
  const [frRegex, setFrRegex] = useState(false);

  /* ── Duplicates state ── */
  const [keySel, setKeySel] = useState<string[]>([]);
  const [keepMode, setKeepMode] = useState<'first' | 'latest'>('first');
  const [rangeCol, setRangeCol] = useState('');
  const [rangeMin, setRangeMin] = useState('0');
  const [rangeMax, setRangeMax] = useState('100');
  const [rangeAction, setRangeAction] = useState('');

  /* Per-column missing counts for the null identification readout */
  const missingByCol = useMemo(() => {
    const map = new Map<string, number>();
    for (const col of columns) {
      let n = 0;
      for (const row of rows) {
        const v = row[col.name];
        const s = v === null || v === undefined ? null : String(v);
        if (isMissingValue(s)) n++;
      }
      map.set(col.name, n);
    }
    return map;
  }, [rows, columns]);

  const toggle = (list: string[], setList: (v: string[]) => void, name: string, max?: number) => {
    if (list.includes(name)) setList(list.filter((n) => n !== name));
    else if (max === undefined || list.length < max) setList([...list, name]);
  };

  const numericColOptions = useMemo(
    () => columns.filter((c) => c.type === 'number' || c.type === 'mixed').map((c) => ({ value: c.name, label: c.name })),
    [columns]
  );

  return (
    <div className="space-y-2">
      {/* ═══ 1. Data Type & Structure Fixes ═══ */}
      <PanelSection title="Type & Structure" icon={<Braces className="w-3.5 h-3.5" />}>
        <Field label="Type Casting — convert column to native type">
          <div className="flex gap-1.5">
            <SidebarSelect value={castCol} onValueChange={setCastCol} options={colOptions} placeholder="Column" />
            <SidebarSelect
              value={castTarget}
              onValueChange={setCastTarget}
              options={[
                { value: 'number', label: 'Number' },
                { value: 'boolean', label: 'Boolean' },
                { value: 'date', label: 'Date' },
                { value: 'string', label: 'Text' },
              ]}
              placeholder="Type"
            />
          </div>
        </Field>
        <ApplyButton
          label="Cast Column"
          disabled={!castCol || !castTarget}
          onClick={() => applyTransform(castColumnType(rows, columns, castCol, castTarget as CastTarget), 'Type Cast', [castCol])}
        />

        <Field label="Change Case">
          <div className="flex gap-1.5">
            <SidebarSelect value={caseCol} onValueChange={setCaseCol} options={colOptions} placeholder="Column" />
            <SidebarSelect
              value={caseStyle}
              onValueChange={setCaseStyle}
              options={[
                { value: 'upper', label: 'UPPERCASE' },
                { value: 'lower', label: 'lowercase' },
                { value: 'title', label: 'Title Case' },
              ]}
              placeholder="Style"
            />
          </div>
        </Field>
        <ApplyButton
          label="Apply Case"
          disabled={!caseCol || !caseStyle}
          onClick={() => applyTransform(changeCase(rows, caseCol, caseStyle as CaseStyle), 'Change Case', [caseCol])}
        />

        <Field label="Trim Whitespace (collapse extra spaces)">
          <SidebarSelect value={trimCol} onValueChange={setTrimCol} options={colOptions} placeholder="Column" />
        </Field>
        <ApplyButton
          label="Trim Column"
          disabled={!trimCol}
          onClick={() => applyTransform(trimCells(rows, trimCol), 'Trim Whitespace', [trimCol])}
        />

        <Field label="Header Normalization — rename all columns to a convention">
          <SidebarSelect
            value={headerStyle}
            onValueChange={setHeaderStyle}
            options={[
              { value: 'snake', label: 'snake_case' },
              { value: 'camel', label: 'camelCase' },
              { value: 'title', label: 'Title Case' },
              { value: 'clean', label: 'Clean (strip symbols)' },
            ]}
            placeholder="Convention"
          />
        </Field>
        <ApplyButton
          label="Normalize Headers"
          disabled={!headerStyle}
          onClick={() => applyTransform(normalizeHeaders(rows, columns, headerStyle as HeaderStyle), 'Header Normalization', columns.map((c) => c.name))}
        />

        <Field label="Reorder Column">
          <SidebarSelect value={moveCol} onValueChange={setMoveCol} options={colOptions} placeholder="Column" />
        </Field>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" className="h-7 flex-1 text-[11px] gap-1 border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent" disabled={!moveCol} onClick={() => applyTransform(moveColumn(columns, rows, moveCol, -1), 'Move Column', [moveCol])}>
            <ArrowLeft className="w-3 h-3" /> Left
          </Button>
          <Button size="sm" variant="outline" className="h-7 flex-1 text-[11px] gap-1 border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent" disabled={!moveCol} onClick={() => applyTransform(moveColumn(columns, rows, moveCol, 1), 'Move Column', [moveCol])}>
            Right <ArrowRight className="w-3 h-3" />
          </Button>
        </div>

        <Field label="Drop Columns">
          <ColumnCheckboxList columns={columns} selected={dropSel} onToggle={(n) => toggle(dropSel, setDropSel, n)} />
        </Field>
        <ApplyButton
          label={`Drop ${dropSel.length || ''} Column${dropSel.length === 1 ? '' : 's'}`.trim()}
          disabled={dropSel.length === 0 || dropSel.length === columns.length}
          onClick={() => applyTransform(dropColumns(rows, columns, dropSel), 'Drop Columns', dropSel)}
        />
      </PanelSection>

      {/* ═══ 2. Handling Missing Data ═══ */}
      <PanelSection title="Missing Data" icon={<Droplets className="w-3.5 h-3.5" />}>
        <div className="flex flex-wrap gap-1">
          {missingByCol.size > 0 && [...missingByCol.entries()].some(([, n]) => n > 0) ? (
            [...missingByCol.entries()].filter(([, n]) => n > 0).slice(0, 4).map(([name, n]) => (
              <MetricChip key={name} label={name.length > 10 ? name.slice(0, 10) + '…' : name} value={String(n)} tone="warning" />
            ))
          ) : (
            <span className="text-[10px] text-success">No missing values detected ✓</span>
          )}
        </div>

        <Field label="Impute Missing Values">
          <div className="flex gap-1.5">
            <SidebarSelect value={imputeCol} onValueChange={setImputeCol} options={colOptions} placeholder="Column" />
            <SidebarSelect
              value={imputeStrategy}
              onValueChange={setImputeStrategy}
              options={[
                { value: 'zero', label: 'Zero' },
                { value: 'static', label: 'Static value' },
                { value: 'mean', label: 'Mean' },
                { value: 'median', label: 'Median' },
                { value: 'mode', label: 'Mode' },
                { value: 'ffill', label: 'Forward fill' },
                { value: 'bfill', label: 'Backward fill' },
              ]}
              placeholder="Strategy"
            />
          </div>
        </Field>
        {imputeStrategy === 'static' && (
          <SidebarInput value={staticValue} onChange={setStaticValue} placeholder="Fallback value" />
        )}
        <ApplyButton
          label="Impute"
          disabled={!imputeCol || !imputeStrategy || (imputeStrategy === 'static' && staticValue === '')}
          onClick={() => applyTransform(imputeColumn(rows, imputeCol, imputeStrategy as ImputeStrategy, staticValue), 'Impute Missing', [imputeCol])}
        />

        <Field label={`Drop rows/columns with > X% missing (X = ${threshold})`}>
          <input
            type="range"
            min={10}
            max={90}
            step={5}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="w-full h-1.5 accent-[hsl(var(--primary))]"
          />
        </Field>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" className="h-7 flex-1 text-[11px] border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent" onClick={() => applyTransform(dropRowsByNullThreshold(rows, columns, Number(threshold)), 'Drop Sparse Rows')}>
            Drop Rows
          </Button>
          <Button size="sm" variant="outline" className="h-7 flex-1 text-[11px] border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent" onClick={() => applyTransform(dropColumnsByNullThreshold(rows, columns, Number(threshold)), 'Drop Sparse Columns')}>
            Drop Cols
          </Button>
        </div>
      </PanelSection>

      {/* ═══ 3. Text & Pattern Standardization ═══ */}
      <PanelSection title="Text & Pattern" icon={<SplitSquareHorizontal className="w-3.5 h-3.5" />}>
        <Field label="Split Column by delimiter (e.g. 'John Doe' → First / Last)">
          <SidebarSelect value={splitCol} onValueChange={setSplitCol} options={colOptions} placeholder="Column" />
        </Field>
        <div className="flex gap-1.5">
          <SidebarInput value={splitDelim} onChange={setSplitDelim} placeholder="Delimiter" />
          <SidebarSelect
            value={splitParts}
            onValueChange={setSplitParts}
            options={[
              { value: '2', label: '2 parts' },
              { value: '3', label: '3 parts' },
              { value: '4', label: '4 parts' },
              { value: '5', label: '5 parts' },
            ]}
          />
        </div>
        <ApplyButton
          label="Split Column"
          disabled={!splitCol || !splitDelim}
          onClick={() => applyTransform(splitColumn(rows, columns, splitCol, splitDelim, Number(splitParts)), 'Split Column', [splitCol])}
        />

        <Field label="Concatenate Columns (merge into one)">
          <ColumnCheckboxList columns={columns} selected={concatSel} onToggle={(n) => toggle(concatSel, setConcatSel, n)} />
        </Field>
        <div className="flex gap-1.5">
          <SidebarInput value={concatSep} onChange={setConcatSep} placeholder="Separator" />
          <SidebarInput value={concatName} onChange={setConcatName} placeholder="New column name" />
        </div>
        <ApplyButton
          label="Concatenate"
          disabled={concatSel.length < 2}
          onClick={() => applyTransform(concatColumns(rows, columns, concatSel, concatSep, concatName), 'Concat Columns', concatSel)}
        />

        <Field label="Find & Replace (regex or literal)">
          <SidebarSelect value={frCol} onValueChange={setFrCol} options={colOptions} placeholder="Column" />
        </Field>
        <div className="flex gap-1.5">
          <SidebarInput value={frSearch} onChange={setFrSearch} placeholder="Search" />
          <SidebarInput value={frReplace} onChange={setFrReplace} placeholder="Replace" />
        </div>
        <ToggleRow label="Regular expression" checked={frRegex} onCheckedChange={setFrRegex} />
        <ApplyButton
          label="Replace"
          disabled={!frCol || !frSearch}
          onClick={() => applyTransform(replacePattern(rows, frCol, frSearch, frReplace, frRegex), 'Find & Replace', [frCol])}
        />
        <p className="text-[9px] text-sidebar-foreground/50 leading-snug flex items-start gap-1">
          <Search className="w-2.5 h-2.5 mt-px shrink-0" />
          Try: strip phone symbols → search <span className="font-data">[^0-9]</span> (regex), remove currency → <span className="font-data">[$,]</span>
        </p>
      </PanelSection>

      {/* ═══ 4. Duplicates & Anomalies ═══ */}
      <PanelSection title="Duplicates & Anomalies" icon={<Copy className="w-3.5 h-3.5" />}>
        <ApplyButton
          label="Remove Exact Duplicates"
          onClick={() => applyTransform(removeExactDuplicates(rows, columns), 'Remove Duplicates')}
        />

        <Field label="Subset Deduplication — pick key columns">
          <ColumnCheckboxList columns={columns} selected={keySel} onToggle={(n) => toggle(keySel, setKeySel, n)} />
        </Field>
        <SidebarSelect
          value={keepMode}
          onValueChange={(v) => setKeepMode(v as 'first' | 'latest')}
          options={[
            { value: 'first', label: 'Keep first occurrence' },
            { value: 'latest', label: 'Keep latest entry' },
          ]}
        />
        <ApplyButton
          label="Dedupe by Keys"
          disabled={keySel.length === 0}
          onClick={() => applyTransform(dedupeByKeys(rows, keySel, keepMode), 'Subset Dedup', keySel)}
        />

        <Field label="Range Validation (numeric columns)">
          <SidebarSelect value={rangeCol} onValueChange={setRangeCol} options={numericColOptions} placeholder="Column" />
        </Field>
        <div className="flex gap-1.5">
          <SidebarInput value={rangeMin} onChange={setRangeMin} placeholder="Min" type="number" />
          <SidebarInput value={rangeMax} onChange={setRangeMax} placeholder="Max" type="number" />
        </div>
        <SidebarSelect
          value={rangeAction}
          onValueChange={setRangeAction}
          options={[
            { value: 'flag', label: 'Flag only (report)' },
            { value: 'remove', label: 'Remove rows' },
            { value: 'null', label: 'Set to null' },
            { value: 'clip', label: 'Clip to bounds' },
          ]}
          placeholder="Action"
        />
        <ApplyButton
          label="Validate Range"
          disabled={!rangeCol || !rangeAction}
          onClick={() => applyTransform(validateRange(rows, rangeCol, Number(rangeMin), Number(rangeMax), rangeAction as RangeAction), 'Range Validation', [rangeCol])}
        />
        <p className="text-[9px] text-sidebar-foreground/50 leading-snug flex items-start gap-1">
          <Scissors className="w-2.5 h-2.5 mt-px shrink-0" />
          e.g. Age between 0–120 — values outside get flagged, removed, nulled, or clipped.
        </p>
      </PanelSection>

      <div className="flex items-center gap-1.5 px-1 pt-1 pb-2 text-sidebar-foreground/40">
        <Eraser className="w-3 h-3" />
        <p className="text-[9px] leading-snug">Every operation registers on the undo/redo stack and in Execution Logs.</p>
      </div>
    </div>
  );
}
