# ADCP — Automation for Data Cleaning Process v0.1.2.8

An IDE-grade data cleaning and intelligence web application. ADCP merges a cinematic electric-tech-blue UI with a fully client-side data engine: upload tabular files, auto-detect schema and anomalies, fix issues with one-click batch cleaning or Excel-style inline edits, and export production-ready datasets.

## Features

- **Landing page with embedded ingestion** — drag & drop CSV / XLSX / JSON / TXT (up to 50 MB), instant schema preview, and one click into the workspace.
- **Post-upload data profiling** — overall quality score, per-column % Valid / % Empty / % Invalid quality bars, inferred type badges (Text, Integer, Float, Date, Boolean), distinct-value cardinality, and an interactive 8-row data preview before entering the workspace.
- **In-grid column profiling** — every grid column header shows its inferred type badge, distinct-value count, and a tri-color quality indicator bar (green = valid, amber = empty, red = invalid).
- **Manual cleaning suite** (right sidebar → Manual Cleaning tab):
  - *Type & Structure* — type casting (number / boolean / date / text), UPPERCASE / lowercase / Title Case, whitespace trimming, header normalization (snake_case / camelCase / Title Case / symbol cleanup), column reordering and dropping.
  - *Missing Data* — null identification (`NaN`, `null`, `None`, `""`, `N/A`, `9999` sentinels), imputation with zero / static value / mean / median / mode / forward fill / backward fill, and threshold-based row or column elimination (e.g. drop columns >50% null).
  - *Text & Pattern* — delimiter column splitting (`John Doe` → First / Last), multi-column concatenation, literal and regex find & replace (strip phone symbols, remove currency `$`, commas).
  - *Duplicates & Anomalies* — exact duplicate removal, subset deduplication by key columns (keep first or latest entry), and range validation with flag / remove / null / clip actions.
- **Rule-based transformation module** (right sidebar → Rule Transforms tab):
  - *Text operations* — trim, clean non-printable characters, change case, pad left/right, extract substring.
  - *Numeric operations* — round, floor, ceiling, absolute value, min-max normalization, outlier replacement.
  - *Date/time parsers* — extract year / month / day / day of week, timezone conversion, date difference (days / weeks / months / years).
  - *Conditional logic builder* — visual IF-THEN-ELSE editor with multi-condition AND/OR logic (e.g. `IF Status = "Pending" AND Age > 30 THEN Flag = "Review"`).
- **Automated error detection** — missing values (incl. `null`, `N/A`, `-`, `?` tokens), invalid types (odd datatypes in numeric/mixed columns), wrong date formats, duplicate rows, mixed types, empty columns, extra whitespace, and encoding issues.
- **One-click cleaning modes** — Basic (column-name normalization removing underscores like `first_name` → `First Name`, whitespace trim, empty-row removal) and Smart (duplicates, date standardization, type casting, boolean normalization).
- **VS Code-style IDE** — independent collapsible left/right sidebars with edge chevrons, resizable bottom Errors/Logs dock (up to 75% of workspace height), snapshot-based undo/redo (rows **and** columns), and a live status bar.
- **Multi-format export** — CSV, XLSX, JSON.
- **Light & dark themes** — cinematic navy HUD aesthetic in dark, clean electric-blue in light.

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui (Radix primitives)
- React Router, Lucide icons, Sonner toasts
- PapaParse (CSV/TXT), SheetJS (XLSX)
- Biome + tsgo for linting and type checking

## Prerequisites

- **Node.js** ≥ 18
- **pnpm** (recommended) — install with `npm install -g pnpm` if you don't have it. npm also works.

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

> If you see peer-dependency warnings, use `pnpm install --no-frozen-lockfile`. Do **not** run `pnpm update` — package versions are pinned and cached for this template.

### 2. Start the dev server

```bash
pnpm dev
```

Then open the printed URL (default <http://localhost:5173/>) in your browser. Vite will hot-reload as you edit files.

### 3. Build for production

```bash
pnpm build
```

This bundles the app with Vite. Static output lands in `dist/`, which you can serve with any static host. To preview the production build locally, run `pnpm preview`.

### 4. Lint / type check

```bash
pnpm lint
```

This runs Biome linting over `src/`.

## Environment Variables (optional)

Create a `.env` file in the project root only if you need Sentry error tracking:

```bash
VITE_SENTRY_DSN=your-sentry-dsn-here   # optional — error tracking
```

No other backend, API key, or database is required. **All data processing is 100% client-side** — files never leave the browser.

## Project Structure

```
├── index.html                  # Vite entry HTML
├── vite.config.ts              # Vite config (@ → ./src alias, SVGR)
├── tailwind.config.js          # Theme tokens (electric blue HSL palette)
├── src/
│   ├── App.tsx                 # Router + providers (Theme, Workspace)
│   ├── routes.tsx              # Route definitions (/, /workspace)
│   ├── index.css               # Design tokens, glass/glow utilities, grid styles
│   ├── pages/
│   │   ├── LandingPage.tsx     # Hero + embedded upload + rhombus process flow + team
│   │   └── NotFound.tsx        # 404 fallback
│   ├── components/
│   │   ├── TornadoLogo.tsx     # Spiral funnel brand mark
│   │   ├── HUDBackground.tsx   # Animated cyberpunk HUD canvas
│   │   ├── common/             # IntersectObserver, RouteGuard
│   │   ├── ui/                 # shadcn/ui primitives
│   │   └── workspace/          # IDE components
│   │       ├── WorkspacePage.tsx    # Viewport-locked IDE layout
│   │       ├── TopNav.tsx           # Brand, undo/redo, export
│   │       ├── LeftSidebar.tsx      # Dataset tools + cleaning modes
│   │       ├── RightSidebar.tsx     # Transformation history + AI suite (Coming Soon)
│   │       ├── SpreadsheetGrid.tsx  # Virtualized editable grid
│   │       ├── BottomDock.tsx       # Resizable Errors/Logs drawer (75% max)
│   │       ├── ErrorPanel.tsx       # Grouped error inspector
│   │       ├── LogPanel.tsx         # Execution log table
│   │       └── BottomStatusBar.tsx  # Live dataset status
│   ├── contexts/
│   │   ├── WorkspaceContext.tsx     # Dataset state, undo/redo, selections
│   │   └── ThemeContext.tsx         # Light/dark theme
│   ├── lib/
│   │   ├── fileParser.ts       # CSV/XLSX/JSON/TXT parsing + type inference
│   │   ├── errorDetector.ts    # 10-type anomaly detection
│   │   ├── cleaningEngine.ts   # Basic/Smart cleaning + column normalization
│   │   └── exportEngine.ts     # CSV/XLSX/JSON export
│   ├── types/index.ts          # Shared TypeScript models
│   └── services/               # API service layer
├── docs/
│   ├── PRD.md                  # Product requirements document
│   └── DESIGN.md               # Visual design system
└── public/                     # Static assets (favicon, images)
```

## Usage

1. **Upload** — On the landing page, drop a file into the upload zone (or click to browse). A preview card shows file size, row/column counts, and detected column types.
2. **Open in Workspace** — Click the button on the preview card to enter the IDE.
3. **Inspect issues** — The bottom Errors dock groups detected anomalies by type; click an entry's arrow to jump to the offending cell.
4. **Clean** — Pick a mode in the left sidebar (Basic or Smart) and click *Run Cleaning*, or edit cells directly in the grid.
5. **Resize the dock** — Drag the dock's top handle to expand it up to 75% of the workspace height, or use the S/M/XL presets.
6. **Export** — Use *Export* in the top bar to download the cleaned dataset as CSV, XLSX, or JSON.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Enter` / double-click | Edit selected cell |
| `Esc` | Cancel cell edit |
| `Tab` | Commit and move right |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |

## License

Internal project — Ganga Cognitive Intelligence · ADCP Platform.
