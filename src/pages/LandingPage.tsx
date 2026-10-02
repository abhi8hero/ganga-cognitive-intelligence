import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Zap,
  BarChart3,
  GitBranch,
  ArrowRight,
  ArrowDown,
  ArrowLeft,
  Database,
  Upload,
  Sun,
  Moon,
  Sparkles,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  X,
  AlertTriangle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import HUDBackground from '@/components/HUDBackground';
import TornadoLogo from '@/components/TornadoLogo';
import { useTheme } from '@/contexts/ThemeContext';
import { parseFile } from '@/lib/fileParser';
import { profileDataset } from '@/lib/dataProfiler';
import { setPendingDataset } from '@/lib/datasetBridge';
import type { UploadedFileInfo } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/* ─── Static section data ────────────────────────────────────── */
const importanceCards = [
  {
    icon: Shield,
    title: 'Data Integrity',
    description: 'Ensure datasets are free from corrupted, inconsistent, or missing values before analysis.',
  },
  {
    icon: Zap,
    title: 'Faster Insights',
    description: 'Automated cleaning removes manual prep work, letting analysts focus on what matters most.',
  },
  {
    icon: BarChart3,
    title: 'Better Accuracy',
    description: 'Clean data directly improves model accuracy, reducing noise-driven false conclusions.',
  },
  {
    icon: GitBranch,
    title: 'Audit Trail',
    description: 'Every cleaning operation is logged, giving teams full transparency and reproducibility.',
  },
];

const processStepsRow1 = [
  { step: 1, icon: Upload, label: 'Upload & Ingest', sub: 'CSV, XLSX, JSON & TXT' },
  { step: 2, icon: Database, label: 'Schema Profiling', sub: 'Types & Quality Scores' },
  { step: 3, icon: Sparkles, label: 'Anomaly Detection', sub: 'Nulls, duplicates & types' },
];

const processStepsRow2 = [
  { step: 6, icon: Shield, label: 'Production Export', sub: 'Clean CSV, XLSX & JSON' },
  { step: 5, icon: GitBranch, label: 'Manual Clean', sub: 'Cell & column overrides' },
  { step: 4, icon: Zap, label: 'Rule Transforms', sub: 'Deterministic logic rules' },
];

const teamMembers = [
  { name: 'Abhishek Ugare', role: 'Team Leader & Designer', image: '/Team/au.jpg' },
  { name: 'Ganesh Karadkar', role: 'Technical Head & Backend Developer', image: '/Team/gk.jpg' },
  { name: 'Sujit Magdum', role: 'Non Technical Head & Writer', image: '/Team/sm.jpg' },
  { name: 'Varad Kokate', role: 'Technical Unit SecondIn Command', image: '/Team/vk.jpg' },
  { name: 'Vishwatej Madane', role: 'Non Technical Unit SecondIn Command', image: '/Team/vm.jpg' },
];

/* ─── Slanted Parallelogram / Rhombus process step card matching image_1790307003317.png ─── */
function RhombusStep({
  step,
  icon: Icon,
  label,
  sub,
}: {
  step: number;
  icon: LucideIcon;
  label: string;
  sub: string;
}) {
  return (
    <div className="relative group shrink-0">
      {/* Outer Slanted Parallelogram container */}
      <div
        className="w-44 md:w-52 h-28 md:h-32 rounded-lg border border-primary/30 bg-card/75 backdrop-blur-md shadow-sm group-hover:border-primary group-hover:shadow-glow group-hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex items-center justify-center p-3"
        style={{
          transform: 'skewX(-18deg)',
        }}
      >
        {/* Subtle corner highlight */}
        <div className="absolute top-0 right-0 w-12 h-12 bg-primary/10 rounded-bl-full pointer-events-none" />

        {/* Counter-skewed content container so text and icons remain upright and crystal clear */}
        <div
          className="flex flex-col items-center justify-center text-center gap-1.5 w-full select-none"
          style={{
            transform: 'skewX(18deg)',
          }}
        >
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-primary/20 border border-primary/40 text-primary font-bold text-[10px] flex items-center justify-center">
              {step}
            </span>
            <div className="w-7 h-7 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Icon size={14} className="text-primary" />
            </div>
          </div>
          <p className="text-xs md:text-sm font-bold text-foreground leading-tight text-balance">
            {label}
          </p>
          <p className="text-[10px] md:text-[11px] text-muted-foreground leading-tight text-pretty max-w-36">
            {sub}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Component ──────────────────────────────────────────────── */
const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { toggleTheme, isDark } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dataset, setDataset] = useState<UploadedFileInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedTab, setUploadedTab] = useState<'schema' | 'preview'>('schema');

  const scrollToUpload = () =>
    document.getElementById('upload-zone')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const scrollToFeatures = () =>
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls', 'json', 'txt'].includes(ext ?? '')) {
      setError(`Unsupported format ".${ext}". Supported: CSV, XLSX, JSON, TXT`);
      setDataset(null);
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('File exceeds 50 MB limit.');
      setDataset(null);
      return;
    }
    setError(null);
    setLoading(true);
    setDataset(null);
    try {
      const info = await parseFile(file);
      setDataset(info);
      toast.success(`Dataset parsed — ${info.rowCount.toLocaleString()} rows, ${info.columnCount} columns`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
      toast.error(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const formatSize = (b: number) =>
    b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

  const resetUpload = () => {
    setDataset(null);
    setError(null);
  };

  /* Profile the uploaded dataset for quality indicators, types and cardinality */
  const profile = useMemo(
    () => (dataset ? profileDataset(dataset.rawData, dataset.columns) : null),
    [dataset]
  );

  /* Hand the full parsed dataset to the workspace via the in-memory bridge
     (no serialization, so 50 MB datasets transfer losslessly) */
  const openInWorkspace = () => {
    if (!dataset) return;
    setPendingDataset({
      name: dataset.file.name,
      format: dataset.format,
      rowCount: dataset.rowCount,
      columnCount: dataset.columnCount,
      columns: dataset.columns,
      rows: dataset.rawData,
    });
    navigate('/workspace');
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <HUDBackground />

      {/* Theme toggle */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={toggleTheme}
          className="glass rounded-full p-2 text-foreground hover:text-primary transition-all duration-200 hover:shadow-glow"
          title="Toggle theme"
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      <div className="relative z-10">
        {/* ─── NAV ─── */}
        <nav className="flex items-center justify-between px-6 md:px-12 py-4 glass border-b border-border/40">
          <div className="flex items-center gap-3" onClick={() => window.open("/Why.html", "_blank")}>
            <TornadoLogo size={38} animated />
            <div>
              <p className="text-xs text-muted-foreground leading-none">Ganga Cognitive Intelligence</p>
              <p className="font-bold text-sm text-foreground leading-tight">ADCP</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="hidden md:flex text-xs gap-1.5" onClick={() => window.open("/Why.html", "_blank")}>
              Why GCI
            </Button>
            <Button variant="ghost" size="sm" className="hidden md:flex text-xs gap-1.5" onClick={scrollToFeatures}>
              Features
            </Button>
            <Button variant="ghost" size="sm" className="hidden md:flex text-xs gap-1.5" onClick={() => navigate('/dashboard')}>
              Dashboard
            </Button>
            <Button size="sm" className="text-xs gap-1.5 shadow-glow" onClick={scrollToUpload}>
              Launch App <ArrowRight size={13} />
            </Button>
          </div>
        </nav>

        {/* ─── HERO + EMBEDDED UPLOAD ─── */}
        <section className="flex flex-col items-center justify-center text-center px-6 pt-16 pb-14 md:pt-24 md:pb-16">
          <Badge className="mb-6 bg-primary/15 text-primary border-primary/30 text-xs px-3 py-1">
            <Sparkles size={10} className="mr-1 inline" />
            Automation for Data Cleaning Process
          </Badge>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-4 leading-tight max-w-4xl mx-auto text-balance">
            Transform{' '}
            <span className="gradient-text">Raw Data</span>
            {' '}Into{' '}
            <span className="gradient-text">Clean Intelligence</span>
          </h1>

          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 text-pretty">
            ADCP automates repetitive data cleaning workflows — detecting errors, fixing inconsistencies,
            and exporting production-ready datasets inside a professional IDE-grade workspace.
          </p>

          <Button size="lg" className="gap-2 shadow-glow text-sm" onClick={scrollToUpload}>
            Upload Dataset <ArrowRight size={15} />
          </Button>

          {/* ─── Embedded upload box (directly below the Upload Dataset button) ─── */}
          <div id="upload-zone" className="mt-8 w-full max-w-2xl">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'relative rounded-2xl border-2 border-dashed p-6 md:p-8 text-center cursor-pointer transition-all duration-300',
                isDragOver
                  ? 'border-primary bg-primary/10 shadow-glow'
                  : 'border-border/60 bg-card/40 hover:border-primary/50 hover:bg-primary/5'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.json,.txt"
                className="hidden"
                onChange={handleInputChange}
              />

              {loading ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <Loader2 size={28} className="text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Parsing dataset…</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center gap-3 py-2">
                  <AlertTriangle size={24} className="text-warning" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Could not load the file</p>
                    <p className="text-xs text-muted-foreground mt-1">{error}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5 bg-transparent"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetUpload();
                      fileInputRef.current?.click();
                    }}
                  >
                    Try another file
                  </Button>
                </div>
              ) : dataset && profile ? (
                <div className="flex flex-col items-center gap-3 w-full">
                  <div className="flex items-center justify-between w-full flex-wrap gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 size={20} className="text-success shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate max-w-xs md:max-w-md" title={dataset.file.name}>
                          {dataset.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatSize(dataset.file.size)} · {dataset.rowCount.toLocaleString()} rows ·{' '}
                          {dataset.columnCount} columns
                          {profile.sampled && <span className="text-warning"> · profiled on first {profile.sampledRows.toLocaleString()}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="gap-1.5 text-xs shadow-glow h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          openInWorkspace();
                        }}
                      >
                        Open in Workspace <ArrowRight size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs gap-1 h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          resetUpload();
                        }}
                      >
                        <X size={13} /> Replace
                      </Button>
                    </div>
                  </div>

                  {/* Quality summary bar */}
                  <div className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/60 bg-card/60">
                    <span className="text-[11px] text-muted-foreground font-medium shrink-0">Data Quality:</span>
                    <span className="font-data font-bold text-xs text-foreground shrink-0">{profile.qualityScore}%</span>
                    <div className="adcp-quality-bar h-1.5 flex-1 min-w-0">
                      <div className="adcp-quality-bar-seg bg-success" style={{ width: `${profile.validPct}%` }} />
                      <div className="adcp-quality-bar-seg bg-warning" style={{ width: `${profile.emptyPct}%` }} />
                      <div className="adcp-quality-bar-seg bg-destructive" style={{ width: `${profile.invalidPct}%` }} />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground shrink-0 hidden sm:flex">
                      <span className="text-success font-medium">Valid {profile.validPct}%</span>
                      <span className="text-warning font-medium">Empty {profile.emptyPct}%</span>
                      <span className="text-destructive font-medium">Invalid {profile.invalidPct}%</span>
                    </div>
                  </div>

                  {/* TWO-SECTION TABBED CONTAINER — matching Image 2 */}
                  <div className="w-full rounded-lg border border-border/70 bg-card/70 overflow-hidden shadow-sm">
                    {/* Tabs header: [Column Schema] and [Data Preview] */}
                    <div className="flex items-center border-b border-border/70 bg-muted/40 px-3 pt-1.5 gap-2">
                      <button
                        type="button"
                        className={cn(
                          'px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer',
                          uploadedTab === 'schema'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedTab('schema');
                        }}
                      >
                        Column Schema
                      </button>
                      <button
                        type="button"
                        className={cn(
                          'px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer',
                          uploadedTab === 'preview'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedTab('preview');
                        }}
                      >
                        Data Preview
                      </button>
                    </div>

                    {/* Tab 1: Column Schema table — exact layout from Image 2 */}
                    {uploadedTab === 'schema' ? (
                      <div className="overflow-x-auto max-h-64 overflow-y-auto w-full">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="sticky top-0 bg-muted/80 backdrop-blur z-10 border-b border-border/60">
                            <tr>
                              <th className="px-3 py-2 text-[11px] font-semibold text-muted-foreground w-10 text-center">#</th>
                              <th className="px-3 py-2 text-[11px] font-semibold text-muted-foreground min-w-36">Column Name</th>
                              <th className="px-3 py-2 text-[11px] font-semibold text-muted-foreground w-24">Type</th>
                              <th className="px-3 py-2 text-[11px] font-semibold text-muted-foreground w-24 text-right">Null Count</th>
                              <th className="px-3 py-2 text-[11px] font-semibold text-muted-foreground w-20 text-right">Unique</th>
                              <th className="px-3 py-2 text-[11px] font-semibold text-muted-foreground min-w-48">Sample Values</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/30">
                            {profile.columns.map((col, idx) => {
                              const isEmpty = col.emptyCount === col.totalCount;
                              const typeBadge = isEmpty
                                ? { label: 'empty', cls: 'bg-destructive/15 text-destructive border-destructive/30' }
                                : col.displayType === 'Integer' || col.displayType === 'Float'
                                ? { label: col.displayType.toLowerCase(), cls: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' }
                                : col.displayType === 'Date'
                                ? { label: 'date', cls: 'bg-purple-500/15 text-purple-400 border-purple-500/30' }
                                : col.displayType === 'Boolean'
                                ? { label: 'boolean', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' }
                                : { label: 'string', cls: 'bg-primary/15 text-primary border-primary/30' };

                              return (
                                <tr key={col.name} className="hover:bg-muted/30 transition-colors">
                                  <td className="px-3 py-2 text-[11px] text-muted-foreground text-center font-data">
                                    {idx + 1}
                                  </td>
                                  <td className="px-3 py-2 text-xs font-semibold text-foreground font-mono">
                                    {col.name}
                                  </td>
                                  <td className="px-3 py-2">
                                    <span
                                      className={cn(
                                        'px-2 py-0.5 rounded text-[10px] font-medium border font-mono inline-block',
                                        typeBadge.cls
                                      )}
                                    >
                                      {typeBadge.label}
                                    </span>
                                  </td>
                                  <td
                                    className={cn(
                                      'px-3 py-2 text-xs font-data text-right font-medium',
                                      col.emptyCount > 0 ? 'text-warning font-semibold' : 'text-muted-foreground/60'
                                    )}
                                  >
                                    {col.emptyCount.toLocaleString()}
                                  </td>
                                  <td className="px-3 py-2 text-xs text-foreground font-data text-right">
                                    {col.distinctCount.toLocaleString()}
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      {col.topValues.length === 0 ? (
                                        <span className="text-[10px] text-muted-foreground/50 italic">(none)</span>
                                      ) : (
                                        col.topValues.map((tv, i) => (
                                          <span
                                            key={i}
                                            className="px-1.5 py-0.5 rounded bg-muted/80 text-[10px] text-foreground font-data border border-border/40 max-w-32 truncate inline-block"
                                            title={tv.value}
                                          >
                                            {tv.value}
                                          </span>
                                        ))
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      /* Tab 2: Data Preview table — parsed rows */
                      <div className="overflow-x-auto max-h-64 overflow-y-auto w-full">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead className="sticky top-0 bg-muted/80 backdrop-blur z-10 border-b border-border/60">
                            <tr>
                              <th className="px-3 py-2 text-[11px] font-semibold text-muted-foreground w-10 text-center">#</th>
                              {dataset.columns.map((c) => (
                                <th key={c.name} className="px-3 py-2 text-[11px] font-semibold text-muted-foreground whitespace-nowrap">
                                  {c.name}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/30">
                            {dataset.previewRows.slice(0, 15).map((row, i) => (
                              <tr key={i} className="hover:bg-muted/30 transition-colors">
                                <td className="px-3 py-1.5 text-[11px] text-muted-foreground text-center font-data">
                                  {i + 1}
                                </td>
                                {dataset.columns.map((c) => {
                                  const v = row[c.name];
                                  const s = v === null || v === undefined ? '' : String(v);
                                  return (
                                    <td
                                      key={c.name}
                                      className={cn(
                                        'px-3 py-1.5 text-xs whitespace-nowrap max-w-44 truncate font-data',
                                        s === '' ? 'text-muted-foreground/40 italic' : 'text-foreground'
                                      )}
                                    >
                                      {s === '' ? '(null)' : s}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/12 border border-primary/25 flex items-center justify-center">
                    <FileSpreadsheet size={22} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Drop your dataset here</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      or click to browse — CSV, XLSX, JSON, TXT
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* stat strip */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 md:gap-14">
            {[
              ['4', 'File Formats'],
              ['10+', 'Error Types'],
              ['50', 'Undo Levels'],
              ['100%', 'Client-Side'],
            ].map(([value, label]) => (
              <div key={label} className="flex flex-col items-center">
                <span className="text-2xl md:text-3xl font-extrabold gradient-text">{value}</span>
                <span className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── IMPORTANCE ─── */}
        <section id="features" className="px-6 md:px-12 py-16 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 text-balance">
              Why Data Cleaning Matters
            </h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto text-pretty">
              Poor data quality costs organizations time, money, and trust. ADCP solves it systematically.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {importanceCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="glass rounded-xl p-6 border border-border/40 hover:border-primary/40 transition-all duration-300 hover:shadow-hover hover:-translate-y-1"
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 bg-primary/10 border border-primary/20">
                    <Icon size={20} className="text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2 text-sm">{card.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{card.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ─── PROCESS (rhombus step cards) ─── */}
        <section className="px-6 md:px-12 py-16 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 text-balance">
              How ADCP Cleans Your Data
            </h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto text-pretty">
              An end-to-end automated pipeline with manual override at every step.
            </p>
          </div>
          <div className="glass rounded-2xl border border-border/40 p-6 md:p-10">
            {/* Desktop / Tablet Looped Flow matching Image 2 (image_1790307003317.png) */}
            <div className="hidden md:flex flex-col items-center gap-6">
              {/* Row 1: Left-to-Right (Step 1 -> Step 2 -> Step 3) */}
              <div className="flex items-center justify-center gap-4 lg:gap-6 pl-4">
                {processStepsRow1.map((step, idx) => {
                  const Icon = step.icon;
                  const isLast = idx === processStepsRow1.length - 1;
                  return (
                    <React.Fragment key={step.step}>
                      <RhombusStep step={step.step} icon={Icon} label={step.label} sub={step.sub} />
                      {!isLast && (
                        <div className="flex items-center text-primary/70 shrink-0">
                          <div className="w-6 lg:w-10 h-0.5 bg-primary/40" />
                          <ArrowRight size={18} className="text-primary -ml-1" />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Transition arrow DOWN from Step 3 (right end) to Step 4 */}
              <div className="w-full flex justify-end pr-20 lg:pr-24 my-1">
                <div className="flex flex-col items-center text-primary/80">
                  <div className="h-6 w-0.5 bg-primary/40" />
                  <ArrowDown size={20} className="text-primary -mt-1 animate-bounce" />
                </div>
              </div>

              {/* Row 2: Right-to-Left (Step 6 <- Step 5 <- Step 4) */}
              <div className="flex items-center justify-center gap-4 lg:gap-6 pl-4">
                {processStepsRow2.map((step, idx) => {
                  const Icon = step.icon;
                  const isFirstInArray = idx === 0; // step 6
                  return (
                    <React.Fragment key={step.step}>
                      <RhombusStep step={step.step} icon={Icon} label={step.label} sub={step.sub} />
                      {idx < processStepsRow2.length - 1 && (
                        <div className="flex items-center text-primary/70 shrink-0">
                          <ArrowLeft size={18} className="text-primary -mr-1" />
                          <div className="w-6 lg:w-10 h-0.5 bg-primary/40" />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Mobile Vertical Flow with Connecting Down Arrows */}
            <div className="flex md:hidden flex-col items-center gap-4">
              {[...processStepsRow1, processStepsRow2[2], processStepsRow2[1], processStepsRow2[0]].map((step, idx, arr) => {
                const Icon = step.icon;
                const isLast = idx === arr.length - 1;
                return (
                  <React.Fragment key={step.step}>
                    <RhombusStep step={step.step} icon={Icon} label={step.label} sub={step.sub} />
                    {!isLast && (
                      <div className="flex flex-col items-center text-primary/60">
                        <ArrowDown size={16} />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── TEAM ─── */}
        <section className="px-6 md:px-12 py-16 max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 text-balance">Meet the Team</h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto text-pretty">
              A team of five building the future of automation in various domains.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {teamMembers.map((member) => (
              <div
                key={member.name}
                className="glass rounded-2xl border border-border/40 p-6 flex flex-col items-center gap-4 w-44 hover:shadow-hover hover:border-primary/40 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/30 shadow-glow group">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div> 
                <div className="text-center">
                  <p className="font-semibold text-foreground text-sm text-balance">{member.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 text-pretty">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="glass border-t border-border/40 px-6 md:px-12 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2" onClick={() => window.open("/Why.html", "_blank")}>
            <TornadoLogo size={24} animated />
            <span className="text-xs text-muted-foreground">© Ganga Cognitive Intelligence</span>
          </div>
          <a
            href="https://abhi8hero.github.io/portfolio-abhishek_ugare/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <p className="text-xs text-muted-foreground">Abhi The Great</p>
          </a>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
