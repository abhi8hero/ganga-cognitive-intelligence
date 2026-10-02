import { useMemo, useState } from 'react';
import { Type, Hash, CalendarClock, GitBranch, Plus, Trash2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useTransform } from '@/hooks/useTransform';
import {
  applyTextOp, applyNumericOp, applyDateOp, applyConditionalRules,
  type TextOp, type NumericOp, type DateOp, type Condition, type ConditionOperator,
} from '@/lib/transformations';
import { PanelSection, Field, SidebarSelect, SidebarInput, ApplyButton } from './PanelPrimitives';

const EMPTY_CONDITION: Condition = { column: '', operator: 'equals', value: '' };

export default function RuleTransformPanel() {
  const { state } = useWorkspace();
  const { applyTransform } = useTransform();
  const { rows, columns } = state;

  const colOptions = useMemo(() => columns.map((c) => ({ value: c.name, label: c.name })), [columns]);
  const numericColOptions = useMemo(
    () => columns.filter((c) => c.type === 'number' || c.type === 'mixed' || c.type === 'string').map((c) => ({ value: c.name, label: c.name })),
    [columns]
  );

  /* ── Text ops ── */
  const [textCol, setTextCol] = useState('');
  const [textOp, setTextOp] = useState('');
  const [padLen, setPadLen] = useState('5');
  const [padChar, setPadChar] = useState('0');
  const [subStart, setSubStart] = useState('1');

  /* ── Numeric ops ── */
  const [numCol, setNumCol] = useState('');
  const [numOp, setNumOp] = useState('');
  const [decimals, setDecimals] = useState('2');
  const [outMin, setOutMin] = useState('');
  const [outMax, setOutMax] = useState('');
  const [outRepl, setOutRepl] = useState('0');

  /* ── Date ops ── */
  const [dateCol, setDateCol] = useState('');
  const [dateOp, setDateOp] = useState('');
  const [tzFrom, setTzFrom] = useState('+0');
  const [tzTo, setTzTo] = useState('+0');
  const [diffCol, setDiffCol] = useState('');
  const [diffUnit, setDiffUnit] = useState('days');

  /* ── Conditional logic builder ── */
  const [conditions, setConditions] = useState<Condition[]>([{ ...EMPTY_CONDITION }]);
  const [logic, setLogic] = useState<'AND' | 'OR'>('AND');
  const [targetMode, setTargetMode] = useState('');
  const [newColName, setNewColName] = useState('');
  const [existingTarget, setExistingTarget] = useState('');
  const [thenValue, setThenValue] = useState('');
  const [elseValue, setElseValue] = useState('');

  const addCondition = () => setConditions((cs) => [...cs, { ...EMPTY_CONDITION }]);
  const removeCondition = (i: number) => setConditions((cs) => cs.filter((_, idx) => idx !== i));
  const updateCondition = (i: number, patch: Partial<Condition>) =>
    setConditions((cs) => cs.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  const runRule = () => {
    const target = targetMode === '__new__' ? newColName.trim() : existingTarget;
    applyTransform(
      applyConditionalRules(rows, columns, conditions.filter((c) => c.column), logic, target, thenValue, elseValue),
      'Conditional Rule',
      [target]
    );
  };

  return (
    <div className="space-y-2">
      {/* ═══ Text Operations ═══ */}
      <PanelSection title="Text Operations" icon={<Type className="w-3.5 h-3.5" />}>
        <Field label="Column">
          <SidebarSelect value={textCol} onValueChange={setTextCol} options={colOptions} placeholder="Column" />
        </Field>
        <SidebarSelect
          value={textOp}
          onValueChange={setTextOp}
          options={[
            { value: 'trim', label: 'Trim spaces' },
            { value: 'clean', label: 'Clean non-printable chars' },
            { value: 'upper', label: 'UPPERCASE' },
            { value: 'lower', label: 'lowercase' },
            { value: 'title', label: 'Title Case' },
            { value: 'pad_left', label: 'Pad left → length' },
            { value: 'pad_right', label: 'Pad right → length' },
            { value: 'extract', label: 'Extract substring' },
          ]}
          placeholder="Operation"
        />
        {(textOp === 'pad_left' || textOp === 'pad_right' || textOp === 'extract') && (
          <div className="flex gap-1.5">
            <SidebarInput value={textOp === 'extract' ? subStart : padLen} onChange={textOp === 'extract' ? setSubStart : setPadLen} placeholder={textOp === 'extract' ? 'Start pos' : 'Length'} type="number" />
            {textOp !== 'extract' && <SidebarInput value={padChar} onChange={setPadChar} placeholder="Pad char" />}
          </div>
        )}
        <ApplyButton
          label="Apply Text Op"
          disabled={!textCol || !textOp}
          onClick={() =>
            applyTransform(
              applyTextOp(rows, textCol, textOp as TextOp, { length: Number(padLen), padChar, start: Number(subStart) }),
              'Text Operation',
              [textCol]
            )
          }
        />
      </PanelSection>

      {/* ═══ Numeric Operations ═══ */}
      <PanelSection title="Numeric Operations" icon={<Hash className="w-3.5 h-3.5" />}>
        <Field label="Column">
          <SidebarSelect value={numCol} onValueChange={setNumCol} options={numericColOptions} placeholder="Column" />
        </Field>
        <SidebarSelect
          value={numOp}
          onValueChange={setNumOp}
          options={[
            { value: 'round', label: 'Round' },
            { value: 'floor', label: 'Floor' },
            { value: 'ceil', label: 'Ceiling' },
            { value: 'abs', label: 'Absolute value' },
            { value: 'minmax', label: 'Min-Max normalize (0–1)' },
            { value: 'replace_outliers', label: 'Replace outliers' },
          ]}
          placeholder="Operation"
        />
        {numOp === 'round' && (
          <SidebarSelect
            value={decimals}
            onValueChange={setDecimals}
            options={[{ value: '0', label: '0 decimals' }, { value: '1', label: '1 decimal' }, { value: '2', label: '2 decimals' }, { value: '3', label: '3 decimals' }]}
          />
        )}
        {numOp === 'replace_outliers' && (
          <div className="space-y-1.5">
            <div className="flex gap-1.5">
              <SidebarInput value={outMin} onChange={setOutMin} placeholder="Min bound" type="number" />
              <SidebarInput value={outMax} onChange={setOutMax} placeholder="Max bound" type="number" />
            </div>
            <SidebarInput value={outRepl} onChange={setOutRepl} placeholder="Replacement value" type="number" />
          </div>
        )}
        <ApplyButton
          label="Apply Numeric Op"
          disabled={!numCol || !numOp}
          onClick={() =>
            applyTransform(
              applyNumericOp(rows, numCol, numOp as NumericOp, {
                decimals: Number(decimals),
                min: outMin === '' || outMax === '' ? undefined : Number(outMin),
                max: outMax === '' ? undefined : Number(outMax),
                replacement: Number(outRepl),
              }),
              'Numeric Operation',
              [numCol]
            )
          }
        />
      </PanelSection>

      {/* ═══ Date/Time Parsers ═══ */}
      <PanelSection title="Date / Time" icon={<CalendarClock className="w-3.5 h-3.5" />}>
        <Field label="Date column">
          <SidebarSelect value={dateCol} onValueChange={setDateCol} options={colOptions} placeholder="Column" />
        </Field>
        <SidebarSelect
          value={dateOp}
          onValueChange={setDateOp}
          options={[
            { value: 'year', label: 'Extract Year' },
            { value: 'month', label: 'Extract Month' },
            { value: 'day', label: 'Extract Day' },
            { value: 'weekday', label: 'Extract Day of Week' },
            { value: 'timezone', label: 'Timezone conversion' },
            { value: 'diff', label: 'Date difference' },
          ]}
          placeholder="Operation"
        />
        {dateOp === 'timezone' && (
          <div className="flex gap-1.5">
            <SidebarSelect
              value={tzFrom}
              onValueChange={setTzFrom}
              options={['-12', '-8', '-5', '+0', '+1', '+5.5', '+8', '+9'].map((o) => ({ value: o, label: `From UTC${o}` }))}
            />
            <SidebarSelect
              value={tzTo}
              onValueChange={setTzTo}
              options={['-12', '-8', '-5', '+0', '+1', '+5.5', '+8', '+9'].map((o) => ({ value: o, label: `To UTC${o}` }))}
            />
          </div>
        )}
        {dateOp === 'diff' && (
          <div className="space-y-1.5">
            <SidebarSelect value={diffCol} onValueChange={setDiffCol} options={colOptions} placeholder="Second date column" />
            <SidebarSelect
              value={diffUnit}
              onValueChange={setDiffUnit}
              options={[
                { value: 'days', label: 'Difference in days' },
                { value: 'weeks', label: 'in weeks' },
                { value: 'months', label: 'in months' },
                { value: 'years', label: 'in years' },
              ]}
            />
          </div>
        )}
        <ApplyButton
          label="Apply Date Op"
          disabled={!dateCol || !dateOp || (dateOp === 'diff' && !diffCol)}
          onClick={() =>
            applyTransform(
              applyDateOp(rows, columns, dateCol, dateOp as DateOp, {
                fromOffset: Number(tzFrom),
                toOffset: Number(tzTo),
                secondCol: diffCol,
                unit: diffUnit as 'days' | 'weeks' | 'months' | 'years',
              }),
              'Date Operation',
              [dateCol]
            )
          }
        />
      </PanelSection>

      {/* ═══ Conditional Logic Builder ═══ */}
      <PanelSection title="Conditional Logic (IF-THEN-ELSE)" icon={<GitBranch className="w-3.5 h-3.5" />} defaultOpen>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-data font-semibold text-primary">IF</span>
          <SidebarSelect
            value={logic}
            onValueChange={(v) => setLogic(v as 'AND' | 'OR')}
            options={[{ value: 'AND', label: 'ALL match (AND)' }, { value: 'OR', label: 'ANY match (OR)' }]}
          />
        </div>

        <div className="space-y-1.5">
          {conditions.map((cond, i) => (
            <div key={i} className="rounded border border-sidebar-border/60 p-1.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-sidebar-foreground/50 font-data">Condition {i + 1}</span>
                {conditions.length > 1 && (
                  <button className="text-destructive/70 hover:text-destructive" onClick={() => removeCondition(i)} title="Remove condition">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <SidebarSelect
                value={cond.column}
                onValueChange={(v) => updateCondition(i, { column: v })}
                options={colOptions}
                placeholder="Column"
              />
              <SidebarSelect
                value={cond.operator}
                onValueChange={(v) => updateCondition(i, { operator: v as ConditionOperator })}
                options={[
                  { value: 'equals', label: '= equals' },
                  { value: 'not_equals', label: '≠ not equals' },
                  { value: 'contains', label: 'contains' },
                  { value: 'greater_than', label: '> greater than' },
                  { value: 'less_than', label: '< less than' },
                  { value: 'greater_equal', label: '≥ greater or equal' },
                  { value: 'less_equal', label: '≤ less or equal' },
                  { value: 'is_empty', label: 'is empty / null' },
                  { value: 'is_not_empty', label: 'is not empty' },
                ]}
              />
              {cond.operator !== 'is_empty' && cond.operator !== 'is_not_empty' && (
                <SidebarInput
                  value={cond.value}
                  onChange={(v) => updateCondition(i, { value: v })}
                  placeholder="Value (e.g. Pending, 30)"
                />
              )}
            </div>
          ))}
        </div>

        <Button
          size="sm"
          variant="outline"
          className="h-6 w-full text-[10px] gap-1 border-dashed border-sidebar-border bg-transparent text-sidebar-foreground/70 hover:bg-sidebar-accent"
          onClick={addCondition}
        >
          <Plus className="w-3 h-3" /> Add condition
        </Button>

        <div className="rounded border border-primary/20 bg-primary/5 p-1.5 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-data font-semibold text-primary shrink-0">THEN</span>
            <SidebarInput value={thenValue} onChange={setThenValue} placeholder="Value (e.g. Review)" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-data font-semibold text-muted-foreground shrink-0">ELSE</span>
            <SidebarInput value={elseValue} onChange={setElseValue} placeholder="Value (optional)" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-data font-semibold text-sidebar-foreground/70 shrink-0">SET</span>
            <SidebarSelect
              value={targetMode}
              onValueChange={setTargetMode}
              options={[
                { value: '__new__', label: '＋ New column…' },
                ...colOptions,
              ]}
              placeholder="Target column"
            />
          </div>
          {targetMode === '__new__' && (
            <SidebarInput value={newColName} onChange={setNewColName} placeholder="New column name (e.g. Flag)" />
          )}
        </div>

        <ApplyButton
          label="Run Rule"
          disabled={conditions.every((c) => !c.column) || targetMode === '' || (targetMode === '__new__' && newColName.trim() === '')}
          onClick={runRule}
        />
        <p className="text-[9px] text-sidebar-foreground/50 leading-snug flex items-start gap-1">
          <Play className="w-2.5 h-2.5 mt-px shrink-0" />
          Rules evaluate top-to-bottom across all rows. e.g. IF Status = 'Pending' AND Age &gt; 30 THEN Flag = 'Review'.
        </p>
      </PanelSection>
    </div>
  );
}
