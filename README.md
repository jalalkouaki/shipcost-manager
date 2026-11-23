# ShipCost Optimizer

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19.2-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

**ShipCost Optimizer** is a logistics cost management and Economic Order Quantity (EOQ) calculation tool designed for importers, freight planners, and procurement teams. It determines the most cost-effective shipping mode (such as LCL vs. FCL) by calculating the optimal replenishment order quantity, taking into account freight curves, import tariffs, container utilization constraints, supplier quantity price breaks, and inventory carrying costs.

---

## Features

### 1. Logistics Optimization Engine
- **EOQ Calculation**: Solves for cost-minimizing order quantities across discrete freight modes.
- **Container Volume & Weight Step Constraints**: Models FCL container capacity limits and fixed handling fees.
- **Tariff & Landed Cost Integration**: Incorporates customs duties and tariffs into effective unit costs.
- **Working Capital & Cash Flow Analysis**: Computes average cycle stock, days of inventory on hand (DOI), and capital tied up in inventory.

### 2. Multi-SKU Container Consolidation
- **Consolidated Container Packing**: Add secondary SKUs alongside your primary product, defining custom annual demand, unit volume (m³ CBM), and unit weight (kg).
- **Live Utilization Gauges**: Progress meters for 20ft (33.2 m³ / 28t), 40ft (67.7 m³ / 28.8t), and 40ft High Cube (76.2 m³ / 28.6t) containers.
- **Proportional Freight Allocation**: Allocates fixed FCL container costs across each SKU based on its volumetric CBM footprint share.

### 3. Supplier Tiered Volume Discounts (Price Breaks)
- **Discount Step Curves**: Configure quantity break brackets (e.g. 1,000+ units -> 45.00, 5,000+ units -> 38.00).
- **EOQ Evaluation**: Evaluates whether volume discounts lower total annual landed expenditure despite higher inventory holding costs.

### 4. Transit Lead Time & Stockout Simulator
- **Risk Calculation**: Factors ocean transit lead times and variance (port congestion, canal delays, customs holds).
- **Reorder Point (ROP) & Safety Stock**: Calculates recommended safety stock buffers based on lead-time and demand variance.
- **Monte Carlo Simulation**: Runs 1,000 replenishment cycles to simulate empirical fill rates and annual stockout probabilities.

### 5. Scope 3 Carbon Footprint & ESG Reporting
- **Emissions Engine**: Computes greenhouse gas emissions (kg CO₂e per shipment and annual Metric Tons CO₂e) across trade lane distances (km) and cargo tonnage.
- **Sustainability Benchmarks**: Provides emission ratings and equivalent tree offset benchmarks.

### 6. Incoterms Decision Matrix (FOB vs. CIF vs. DDP)
- **Buyer vs. Supplier Control**: Direct financial comparison between self-managed freight forwarding (FOB) and supplier all-inclusive quotes (CIF / DDP).
- **Cost Comparison**: Isolates supplier freight markups and projects net annual savings from taking direct logistics control.

### 7. CSV Scenario & SKU Import
- **Direct File Import**: Upload and parse CSV files directly through the **Import** button in the top navigation bar.
- **Multi-Section & Tabular Support**: Seamlessly parses multi-section exported scenarios, raw SKU catalogs, and freight profiles.
- **Backward Compatibility**: Fully compatible with legacy results-only summary CSV files, reconstructing baseline costs and profiles automatically.
- **Validation & Error Guarding**: Strictly validates file contents. If a file is empty, corrupted, binary, or missing required headers, it informs the user with a descriptive error notification and alert dialog.
- **Instant Auto-Calculation**: Automatically executes the optimization solver upon import, populating cards, charts, and tables without requiring manual recalculation.

### 8. Multi-Format Export Center
Export logistics models and analytical results in multiple standardized formats:
- **Excel Workbook (`.xlsx`)**: Multi-sheet financial model (Executive Summary, SKU Assumptions, Multi-SKU Breakdown, and EOQ Curve Tables) generated via SheetJS.
- **Full-Spectrum CSV (`.csv`)**: Round-trip importable spreadsheet containing complete scenario configurations, freight profile equations, consolidated SKUs, and results tables.
- **Braille Accessibility Report (`.brf` & `.txt`)**: Tactile output featuring standard Unified English Braille (UEB Grade 1) Unicode patterns alongside embossable ASCII Braille (`.brf`) for screen readers and hardware embossers.
- **Markdown Briefing (`.md`)**: Structured briefing with comparative Markdown tables for Notion, Obsidian, and GitHub documentation.
- **JSON Dataset (`.json`)**: Machine-readable schema for ERP ingestion and pipeline automation.
- **Executive PDF**: Print-ready document formatted for offline review.

### 9. Styling & Theme
- **Color Palette**: High-contrast enterprise palette featuring Cobalt (`#2563eb`), Emerald (`#059669`), and Amber (`#d97706`).
- **Seamless Light & Dark Mode**: Powered by Tailwind CSS v4 `@custom-variant dark`, with client-side anti-flash initialization, system color-scheme sync, and localStorage persistence.
- **Typography**: Uses **Plus Jakarta Sans** for headings, **Inter** for UI text, and **JetBrains Mono** for numbers (`tabular-nums`).
- **Interactive Visualizations**: Recharts-powered stacked cost comparison charts and convexity total cost curves with optimal-point indicators.

### 10. Multi-Currency Configuration
- **Moroccan Dirham (`MAD`) by Default**: Seamlessly configured for MAD-denominated accounting.
- **Currency Dropdown**: Supports switching between:
  - Moroccan Dirham (`MAD`)
  - US Dollar (`$`)
  - Euro (`€`)
  - Saudi Arabian Riyal (`SAR`)
  - United Arab Emirates Dirham (`AED`)
  - Japanese Yen (`¥`)
  - British Pound Sterling (`£`)
  - Swiss Franc (`CHF`)
  - Custom Currency option for any user-defined code (e.g. CAD, AUD, SGD, DZD).
- **Format Engine**: Automatically formats currency symbols with clean spacing for alphanumeric codes (e.g. `MAD 12,345.67`) and compact axis formatting (e.g. `MAD 50k`).

### 11. Desktop GUI Controller (`gui_launcher.py`)
- **One-Click Localhost Deployment**: Auto-starts the Vite frontend (`localhost:5173`) and the Node Server Manager (`localhost:9000`) upon launch.
- **Real-Time Synchronized Status**: Continuously checks actual socket connections on ports 5173 and 9000. Accurately reflects **Online**, **Offline**, or **Partially Online** in real-time according to the selected launch target ("Both", "Vite App Only", or "Server Manager Only").
- **Clean Process & Port Lifecycle**: Uses process group termination (`os.killpg`) and forceful port cleanup (`kill_port_processes`) to prevent orphaned background processes and eliminate false "Online" indicators when servers are stopped.
- **Real-Time Log Streaming**: Streams color-tagged terminal logs for both servers directly into the GUI console.

---

## Tech Stack

| Category | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19 (TypeScript), Vite 8 with Rolldown |
| **Styling** | Tailwind CSS v4, Plus Jakarta Sans, Inter, JetBrains Mono |
| **Data Visualizations** | Recharts (Responsive SVG Charts) |
| **Icons** | Lucide React |
| **Spreadsheet Engine** | SheetJS (`xlsx`) |
| **Data Import Engine** | RFC 4180 CSV parser & validator (`src/utils/csvImporter.ts`) |
| **Currency & Format Engine** | Multi-currency formatter (`src/utils/format.ts`) |
| **Accessibility Engine** | Unified English Braille (UEB Grade 1) & ASCII Braille (`.brf`) |
| **Simulation Engine** | Monte Carlo lead time simulator (Box-Muller Gaussian jitter) |
| **Desktop Launcher** | Python 3 (Tkinter, subprocess, sockets, signal) |
| **Backend / API Manager** | Node.js, Express.js |

---

## Getting Started

### Prerequisites
- **Node.js**: `v20.19.0` or `v22.x` (LTS recommended)
- **npm**: `v10.x` or higher
- **Python**: `v3.8+` (for the Desktop GUI Launcher, using built-in Tkinter)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jalalkouaki/shipcost-manager.git
   cd shipcost-manager
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Install Server Manager dependencies:
   ```bash
   cd server-manager
   npm install
   cd ..
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

---

## Running the Application

You have three convenient ways to launch and use ShipCost Optimizer:

### Option 1: Python Desktop GUI Launcher (Recommended)
Launch the desktop controller to start both local servers and open them in your default browser:
```bash
python gui_launcher.py
```
*(or run `python launcher.py`)*

From the launcher window:
- Both localhosts (`:5173` and `:9000`) start automatically.
- Click **"🌐 Open App (5173)"** to open **http://localhost:5173**.
- Click **"⚙ Open Manager (9000)"** to open **http://localhost:9000**.
- Use the **"Auto-start on launch"** checkbox to toggle automated boot behavior.

---

### Option 2: Direct Vite Development Server
Run Vite directly from your terminal:
```bash
npm run dev
```
Navigate to **http://localhost:5173** in your browser.

---

### Option 3: Node.js Server Manager
Run the web-based Server Manager dashboard:
```bash
npm run manager
```
Navigate to **http://localhost:9000** to manage server lifecycle and customize site headers.

---

## Production Build

To compile TypeScript and bundle optimized static assets:
```bash
npm run build
```

To preview the production bundle locally:
```bash
npm run preview
```

---

## Project Structure

```
shipcost-manager/
├── gui_launcher.py                  # Modern Python Tkinter desktop controller
├── launcher.py                      # Desktop launcher entrypoint
├── server-manager/                  # Express server management dashboard (port 9000)
│   ├── server.js
│   └── config.json
├── src/
│   ├── App.tsx                      # Main dashboard layout & scenario toolbar
│   ├── components/
│   │   ├── CarbonFootprintESG.tsx   # Scope 3 GHG emissions & green score
│   │   ├── EvaluationTable.tsx      # Granular cost breakdown table
│   │   ├── ExportButtons.tsx        # Multi-format export center (Excel, Braille, MD, etc.)
│   │   ├── IncotermsComparison.tsx  # FOB vs. CIF vs. DDP strategic decision matrix
│   │   ├── InventoryImpact.tsx      # Cycle stock & working capital metrics
│   │   ├── LeadTimeStockoutSimulator.tsx # Monte Carlo lead time simulator & ROP
│   │   ├── MultiSkuConsolidation.tsx # Container stuffing & CBM allocation
│   │   ├── ProductForm.tsx          # SKU pricing, tariffs, and tiered price breaks
│   │   ├── ResultsPanel.tsx         # Optimization cards & recommended badges
│   │   ├── RunAnalysisButton.tsx    # Optimization trigger with validation
│   │   ├── SensitivitySlider.tsx    # Demand sensitivity shock simulator
│   │   ├── SettingsPanel.tsx        # Currency & default holding cost config
│   │   ├── ShippingProfilesForm.tsx # LCL and FCL freight profile cards
│   │   └── charts/
│   │       ├── CostComparisonChart.tsx # Stacked bar chart (Freight vs. Holding)
│   │       └── CostCurveChart.tsx     # Convex total cost curve chart
│   ├── context/
│   │   └── ScenarioContext.tsx      # React Context state engine with URL hash sync
│   ├── types/
│   │   └── index.ts                 # Full TypeScript definitions for all features
│   ├── utils/
│   │   ├── braille.ts               # UEB Grade-1 & ASCII Braille (.brf) generator
│   │   ├── calculations.ts          # Non-linear EOQ, price breaks, carbon, and ROP solver
│   │   ├── csvImporter.ts           # RFC 4180 CSV parser, validator, and scenario importer
│   │   ├── exportReport.ts          # Multi-format export engine (XLSX, MD, JSON, CSV)
│   │   ├── format.ts                # Multi-currency and compact number formatter
│   │   └── permalink.ts             # Base64 URL hash serializer & deserializer
│   └── index.css                    # Tailwind CSS v4 theme, fonts, and dark mode
└── package.json
```

---

## License

This project is open-source and licensed under the [MIT License](LICENSE).

Copyright (c) 2026 Jalal Kouaki <jalalkouaki@outlook.com>.
