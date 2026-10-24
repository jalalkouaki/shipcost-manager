# ShipCost Optimizer

ShipCost Optimizer is a production-grade web application designed for small importers to evaluate and compare logistics scenarios. It helps users determine the most cost-effective shipping mode (e.g., LCL vs. FCL) by calculating the absolute optimal order quantity, blending total freight costs and inventory holding costs.

## Features

- **Core Logistics Optimization Engine**: Accurately calculates optimal order quantities (EOQ) using log-spaced resolution evaluating constraints such as strict container capacities and fixed handling fees.
- **Dynamic Scenario Management**: Create, duplicate, and persist different analysis scenarios using Context and `localStorage`.
- **Import Duty Configuration**: Includes tariff configuration which calculates and propagates effective landed cost across all downstream calculations.
- **Inventory Impact & Cash Flow Insights**: Displays average cycle stock, days of inventory, and automatically evaluates capital efficiency.
- **Visual Analytics**: Interactive Recharts-powered graphs for evaluating total cost curves and stacked freight vs. holding cost comparisons.
- **Python Desktop GUI Launcher**: A dedicated desktop GUI controller (`gui_launcher.py`) that monitors server status, streams real-time process logs, and opens localhost in your browser with a single click.
- **Server Manager Dashboard**: A standalone Node.js-based dashboard to manage the Vite development server lifecycle and dynamically inject website titles.
- **Executive Summaries**: One-click exports for presentation-ready PDFs and detailed CSV datasets.

## Tech Stack

- **Frontend Framework**: React 19 with TypeScript, powered by Vite.
- **Styling**: Tailwind CSS v4.
- **Visualizations**: Recharts.
- **Icons**: Lucide React.
- **Desktop Launcher**: Python 3 (Tkinter).
- **Server Manager Backend**: Node.js, Express.js.

## Getting Started

### Prerequisites
- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **Python**: v3.8+ (for the Desktop GUI Launcher, using built-in Tkinter)

### Installation

1. Clone or download the repository:
   ```bash
   git clone https://github.com/jalalkouaki/shipcost-manager.git
   cd shipcost-manager-main
   ```

2. Install the frontend dependencies:
   ```bash
   npm install
   ```

3. Install the Server Manager dependencies:
   ```bash
   cd server-manager
   npm install
   cd ..
   ```

---

## Running the Application

You have three convenient ways to launch and access ShipCost Optimizer:

### Option 1: Python Desktop GUI Launcher (Recommended)
Launch the interactive desktop controller to start the server and open localhost in one click:
```bash
python gui_launcher.py
```
*(or run `python launcher.py`)*

From the GUI window, you can:
- Start and stop either the **Vite App** or the **Node Server Manager**.
- View live console logs and status indicators.
- Click **"Open App (5173)"** to open **http://localhost:5173** directly in your default browser.
- Click **"Open Manager (9000)"** to open **http://localhost:9000**.

---

### Option 2: Node.js Server Manager
Run the web-based Server Manager dashboard:
```bash
npm run manager
```
Then navigate to **http://localhost:9000** in your browser. From there, you can click "Start Server" to launch the application on **http://localhost:5173** and customize the website title.

---

### Option 3: Direct Vite Development Server
Run the Vite development server directly from your terminal:
```bash
npm run dev
```
Then open your browser to **http://localhost:5173**.

---

## Building for Production

To build the static assets for production:

```bash
npm run build
```

This compiles TypeScript and bundles optimized static assets into the `dist` folder.

To preview the production build locally:
```bash
npm run preview
```

---

## License

This project is open-source and licensed under the [MIT License](LICENSE).

Copyright (c) 2026 Jalal Kouaki <jalalkouaki@outlook.com>.
