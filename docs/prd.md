# Requirements Document

## 1. Application Overview

ADCP (Autonomous Data Cleaning Platform) is an IDE-grade data cleaning, intelligence, and interactive visualization web application built for data analysts, engineers, and business operators. The platform provides landing-page embedded dataset ingestion with tabbed schema profiling and data preview (supporting CSV, XLSX, JSON, and TXT files up to 50 MB), a visual looped pipeline architecture, dynamic column-level quality indicators, a dedicated spreadsheet cleaning and transformation workspace, and a Power BI-style interactive analytics dashboard page for multi-chart visual reporting.

## 2. Target Users and Core Scenarios

### 2.1 Target Users
- Data analysts and engineers inspecting, profiling, cleaning, standardizing, and creating visual analytical dashboards from tabular datasets.
- Business and operations users seeking rule-based, deterministic remediation of dataset anomalies and chart-driven aggregation without writing code.

### 2.2 Core Scenarios
- Ingesting raw datasets on the landing page and inspecting schema metadata and parsed rows via tabbed views.
- Entering the fixed-viewport IDE workspace to inspect column quality metrics, perform manual cleaning operations, apply rule-based transformations, and track modifications.
- Navigating to the interactive Dashboard page to configure and render multi-chart visual dashboards using aggregated tabular dataset attributes (Sum, Count, Average across Bar, Line, Pie, Area, and Scatter charts).
- Exporting cleaned datasets to CSV, XLSX, or JSON.

## 3. Page Structure and Functional Specifications

```
ADCP Platform
├── Landing Page
│   ├── Navigation Bar (Brand with CGI F1 Speed Mark Icon, Theme Switcher, Navigation Links including Dashboard/Visualize Link)
│   ├── Hero Section (Headline, Upload Dataset Trigger)
│   ├── Embedded Ingestion Section
│   │   ├── Drag-and-Drop / File Picker Zone (CSV, XLSX, JSON, TXT up to 50 MB)
│   │   ├── Tabbed Dataset Profiling & Preview Container
│   │   │   ├── Column Schema Tab (#, Column Name, Type badge, Null Count, Unique count, Sample Values badges)
│   │   │   └── Data Preview Tab (Tabular parsed data preview rows)
│   │   └── Open in Workspace Action Button
│   ├── Looped Pipeline Flow Section (Slanted Parallelogram 6-Step Cards)
│   ├── Core Importance Cards
│   └── Team Section (Exactly 5 Team Members)
├── IDE Workspace
│   ├── Top Navigation Bar (CGI F1 Speed Mark Icon, Project Title, Undo/Redo, Visualize Button, Export Action)
│   ├── Left Sidebar (Schema Info, Column Attributes, Collapsible Inner Edge Rail with Chevron Toggle)
│   ├── Spreadsheet Grid Area (Main Viewport, Internal Scrolling Only)
│   │   ├── Grid Toolbar (Search Input, Manual Cleaning Action Button, Rule Transforms Action Button)
│   │   ├── Column Headers (Inferred Type Badges, Multi-Color Quality Indicators, Cardinality / Mini-Histograms)
│   │   └── Virtualized Tabular Grid (Inline Editing, Row/Column Selection)
│   ├── Right Panel Area (Collapsible Inner Edge Rail with Chevron Toggle)
│   │   ├── Collapsed Vertical Rail (Expand Chevron, AI ADCP AI Icon, Screwdriver/Wrench Manual Clean Icon, Switches/Sliders Rule-based Clean Icon)
│   │   ├── Default AI Panel (ADCP AI with Coming Soon Badges)
│   │   └── Overlay Toolset Panel (Toggled via Grid Toolbar or Collapsed Rail Icons with Close Control)
│   │       ├── Manual Cleaning Suite (Type & Structure, Missing Data, Text & Pattern, Duplicates & Anomalies)
│   │       └── Rule-Based Transformation Module (Text, Numeric, Date/Time, Conditional Logic Builder)
│   ├── Bottom Errors and Log Panel (Resizable Docked Drawer, Error Inspector, Execution Logs)
│   └── Bottom Status Bar (Active Cell, Selection Count, Total Rows/Columns, Engine Status)
└── Dashboard Page (/dashboard)
    ├── Top Navigation Bar (Brand Logo, Back to Workspace Link, Dataset Status Indicator)
    ├── Left Chart Configuration Panel
    │   ├── Chart Type Selector (Bar Chart, Line Chart, Pie Chart, Area Chart, Scatter Chart)
    │   ├── X-Axis Column Selector (Categorical / Temporal / Numerical Columns)
    │   ├── Y-Axis Column Selector (Numerical Columns)
    │   ├── Aggregation Function Selector (Sum, Count, Average)
    │   └── Add Chart to Dashboard Action Button
    └── Main Dashboard Grid Canvas Area
        ├── Canvas Header (Active Chart Count, Clear All Canvas Action)
        ├── Empty State (Guide to add charts from left configuration panel)
        └── Multi-Chart Grid Layout (Responsive Card Grid)
            └── Interactive Chart Card (Chart Title, Chart Controls, Rendered Interactive Visual, Remove Chart Action)
```

### 3.1 Landing Page

- **Header & Navigation**:
  - Displays the brand logo featuring the CGI F1 speed mark icon.
  - Includes anchor navigation links to features, workflow process, team members, and the interactive Visualize / Dashboard page.
  - Contains a theme switcher supporting dark cinematic mode and clean light mode.

- **Hero Section**:
  - Highlights automated and manual tabular data cleaning with electric-blue ambient styling.
  - Contains the primary \"Upload Dataset\" trigger button.

- **Embedded File Ingestion & Tabbed Profiling Section**:
  - Accepts user files in CSV, XLSX, JSON, and TXT formats up to 50 MB via drag-and-drop or file selector.
  - **Tabbed Profiling & Preview Container**:
    - **Column Schema Tab**: Displays a structured schema table with: `#` (index), `Column Name`, `Type badge`, `Null Count`, `Unique count`, and `Sample Values badges`.
    - **Data Preview Tab**: Renders parsed raw rows and columns in an interactive preview table.
  - **Action Trigger**: Provides an \"Open in Workspace\" button to load the profiled dataset into the IDE Workspace.

- **Looped Pipeline Flow Section**:
  - Renders a 6-step looped workflow diagram composed of slanted rhombus / parallelogram cards connected with directional flow arrows:
    - **Top Row (Left to Right)**: Step 1 -> Step 2 -> Step 3.
    - **Connecting Transition**: Downward directional arrow linking Step 3 to Step 4.
    - **Bottom Row (Right to Left)**: Step 4 -> Step 5 -> Step 6 pointing leftwards.

- **Core Importance Cards**:
  - Outlines core benefits: automated error detection, deterministic transformation rules, in-grid quality profiling, and visual reporting.

- **Team Section**:
  - Displays a grid showcasing exactly 5 team members with names, professional roles, and profile placeholders.

### 3.2 IDE Workspace

- **Top Navigation Bar**:
  - Renders the brand mark, dataset title, clean/dirty state indicator, Undo/Redo buttons, a \"Visualize\" button linking directly to the Dashboard page, and an Export modal trigger (CSV, XLSX, JSON).

- **Spreadsheet Grid (Central Workspace)**:
  - Operates strictly within a fixed viewport without outer page scrolling, with internal horizontal and vertical scrolling.
  - **Grid Toolbar Header**:
    - Search input for in-grid cell queries.
    - Action buttons positioned directly to the right of the search option: **\"Manual Cleaning\"** and **\"Rule Transforms\"**.
    - Clicking either button toggles open an overlay panel in the right panel area corresponding to that toolset.
  - **Dynamic Column Header Layer**:
    - Inferred data type badges (Text, Integer, Float, Date, Boolean).
    - Visual quality indicator bar displaying % Valid (green), % Empty (amber), and % Invalid (red).
    - Cardinality and distribution overview (distinct count or mini-histogram).
  - Tabular grid with cell selection, inline editing, and row/column selection.

- **Left Sidebar**:
  - Displays parsed schema structure, column counts, attribute lists, and distribution summaries.
  - Features an inner-edge collapse chevron control that minimizes the panel into a thin vertical rail.

- **Right Panel Area**:
  - Features an inner-edge collapse chevron control that minimizes the panel into a thin vertical rail.
  - **Collapsed Vertical Rail Actions**:
    - Displays the expand chevron at the top.
    - Displays the AI ADCP AI option icon.
    - Displays a screwdriver / wrench action icon positioned directly below the AI ADCP AI icon, triggering the Manual Cleaning overlay panel.
    - Displays a switches / sliders action icon positioned directly below the screwdriver / wrench icon, triggering the Rule-based Clean overlay panel.
  - **Default View (ADCP AI / AI Panel)**: Displays planned AI-assisted capabilities with \"Coming Soon\" badges.
  - **Overlay Toolset Panel**: Triggered via toolbar buttons or collapsed rail icons with close controls:
    - *Manual Cleaning View*: Data type and structure fixes, missing data imputation/handling, text and pattern standardization, and duplicate/anomaly removal.
    - *Rule Transforms View*: Text operations, numeric transformations, date/time parsers, and visual IF-THEN-ELSE conditional logic builder.

- **Bottom Errors & Log Panel**:
  - Docked at the bottom with a draggable top border handle supporting vertical resize up to 75% of total workspace height.
  - Includes Error Inspector categorization and Execution Logs.

- **Bottom Status Bar**:
  - Displays active coordinate, current row and column counts, total identified error count, and engine health status.

### 3.3 Dashboard Page (/dashboard)

- **Top Navigation Bar**:
  - Displays the platform brand logo, current active dataset name, and a \"Back to Workspace\" navigation link.
  - Adheres to the dark navy and electric-blue ambient theme with glass-morphism styling.

- **Left Chart Configuration Panel**:
  - **Chart Type Selector**: Allows selecting from Bar Chart, Line Chart, Pie Chart, Area Chart, and Scatter Chart.
  - **X-Axis Field Selector**: Dropdown populated with available dataset column names (supporting text, date, and categorical fields).
  - **Y-Axis Field Selector**: Dropdown populated with available numerical and aggregatable dataset column names.
  - **Aggregation Method Selector**: Radio or dropdown selector offering Sum, Count, and Average mathematical aggregation options.
  - **Add Chart Button**: Evaluates the configuration, generates a unique chart instance, and appends it to the multi-chart canvas.

- **Main Dashboard Grid Canvas Area**:
  - **Canvas Header**: Displays total active chart count and a \"Clear Canvas\" button.
  - **Empty State Container**: Displayed when no charts have been added yet, providing instructions on configuring charts using the left panel.
  - **Multi-Chart Grid Canvas**: Renders a dynamic multi-card layout accommodating multiple independently configured charts:
    - **Chart Card Container**: Displays chart title (e.g., \"[Aggregation] of [Y-Axis] by [X-Axis]\"), selected chart type badge, and a remove/delete chart action button.
    - **Interactive Visualization Area**: Renders the chart visual based on the computed aggregation of the underlying dataset rows, equipped with hover tooltips and dynamic axis legends.

## 4. Business Rules and Logic

### 4.1 Ingestion & Profiling Rules
- **File Size Limit**: Supports file uploads up to 50 MB; larger files trigger an explicit error.
- **Tabbed Interface Default**: Defaults to the \"Column Schema\" tab upon parsing, with toggle to \"Data Preview\".
- **Schema Table Metrics**: Generates index sequence, column name, inferred type badge, null count, distinct unique value count, and sample value badges per column.
- **Pipeline Step Looping**: Landing page pipeline flow follows a 6-step loop (1 -> 2 -> 3 top row, downward transition, 4 -> 5 -> 6 bottom row moving right-to-left).

### 4.2 Workspace Layout and Operations
- **Toolbar & Rail Synchronization**: Clicking \"Manual Cleaning\" or \"Rule Transforms\" in the toolbar or clicking their respective icons on the collapsed right rail opens that toolset over the right panel.
- **Deterministic Execution**: All manual cleaning operations and rule transforms append discrete states to the undo/redo stack and update dataset rows.
- **Bottom Drawer Resizing**: Drag handle height constrained between collapsed state and 75% workspace height.

### 4.3 Analytics Dashboard & Aggregation Logic
- **Data Source Binding**: Dashboard reads the active tabular dataset state and column schema directly from the shared dataset state.
- **Aggregation Calculations**:
  - **Sum**: Calculates the arithmetic sum of numerical Y-values grouped by distinct X-axis categorical values.
  - **Count**: Calculates the frequency count of row records grouped by distinct X-axis categorical values.
  - **Average**: Calculates the arithmetic mean (Sum / Count) of numerical Y-values grouped by distinct X-axis categorical values; zero counts return 0.
- **Multi-Chart Management**: Users can create, render, and independently delete multiple charts on the canvas without altering the underlying raw dataset records.
- **Theme Consistency**: All visual chart components inherit dark navy backgrounds, electric-blue accents, and contrasting text colors.

## 5. Exceptions and Boundary Cases

| Scenario | Condition | System Behavior |
| :--- | :--- | :--- |
| File Size Exceeds Limit | Uploaded file size > 50 MB | Rejects file, displays file size limit notification, and resets upload area |
| Missing Data in Aggregation Column | Selected Y-axis column contains nulls or non-numeric values during Sum/Average calculation | Ignores null/NaN rows in arithmetic computation and logs a warning on chart card |
| No Dataset Loaded on Dashboard | User accesses /dashboard directly without loading a dataset | Displays an empty dataset placeholder prompting user to return to landing/workspace and ingest data |
| Incomplete Chart Configuration | User clicks \"Add Chart\" without selecting required X-axis or Y-axis columns | Disables the button or presents inline validation requiring field selection |
| Collapsed Rail Icon Trigger | User clicks cleaning icons while right sidebar is collapsed | Expands the right sidebar and displays the selected overlay cleaning panel immediately |
| Overlay Toolset Switching | User switches between Manual Cleaning and Rule Transforms | Updates overlay panel content directly without layout flickering |

## 6. Acceptance Criteria

1. Ingest a valid dataset (up to 50 MB) on the landing page and verify tabbed profiling displaying \"Column Schema\" and \"Data Preview\".
2. Verify the landing navigation header, workspace navigation, and dashboard header render the brand mark with CGI F1 speed mark icon and navigation links.
3. Click \"Open in Workspace\" and confirm grid workspace operates with internal scrolling and fixed viewport.
4. Verify the top workspace navigation includes a \"Visualize\" button that navigates directly to the Dashboard page (`/dashboard`).
5. In the Dashboard page left configuration panel, verify dropdowns allow selecting Chart Type (Bar, Line, Pie, Area, Scatter), X-Axis, Y-Axis, and Aggregation Method (Sum, Count, Average).
6. Click \"Add Chart\" and confirm an interactive chart card renders in the canvas grid using the computed aggregation.
7. Add multiple distinct charts to the canvas and confirm each chart renders independently in a responsive multi-chart grid layout.
8. Delete a chart card from the canvas and verify only the target chart is removed while others remain intact.
9. Verify all dashboard visual elements match the dark navy and electric-blue aesthetic.
10. Export dataset to CSV, XLSX, or JSON from the workspace successfully.

## 7. Excluded Features (Out of Scope for This Release)

- Standalone multi-step /upload page route.
- Live execution of unreleased ADCP AI AI models marked as Coming Soon.
- Collaborative real-time multi-user editing.
- Direct remote database live streaming connections.
- Custom dashboard PDF or slide deck export generator.