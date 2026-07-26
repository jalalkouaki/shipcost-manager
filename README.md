# ShipCost Optimizer

ShipCost Optimizer is a production-grade web application designed for small importers to evaluate and compare logistics scenarios. It helps users determine the most cost-effective shipping mode (e.g., LCL vs. FCL) by calculating the absolute optimal order quantity, blending total freight costs and inventory holding costs.

## Features

- **Core Logistics Optimization Engine**: Accurately calculates optimal order quantities (EOQ) using log-spaced resolution evaluating constraints such as strict container capacities and fixed handling fees.
- **Dynamic Scenario Management**: Create, duplicate, and persist different analysis scenarios using Context and `localStorage`.
- **Import Duty Configuration**: Includes tariff configuration which calculates and propagates effective landed cost across all downstream calculations.
- **Inventory Impact & Cash Flow Insights**: Displays average cycle stock, days of inventory, and automatically evaluates capital efficiency.
- **Visual Analytics**: Interactive Recharts-powered graphs for evaluating total cost curves and stacked freight vs. holding cost comparisons.
- **Server Manager GUI**: A standalone Node.js-based dashboard to manage the Vite development server lifecycle and dynamically inject website titles.
- **Executive Summaries**: One-click exports for presentation-ready PDFs and detailed CSV datasets.

## Tech Stack

- **Frontend Framework**: React 19 with TypeScript, powered by Vite.
- **Styling**: Tailwind CSS v4.
- **Visualizations**: Recharts.
- **Icons**: Lucide React.
- **Server Manager Backend**: Node.js, Express.js.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation

1. Clone this repository:
   ```bash
   git clone <your-repo-url>
   cd shipcost-optimizer
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

### Running the Application

You can run the ShipCost Optimizer easily using the included Server Manager GUI.

From the root directory, run:
```bash
npm run manager
```

Then, open your browser and navigate to **http://localhost:9000**.
From the Server Manager dashboard, you can click "Start Server" to boot up the application (which will run on http://localhost:5173). You can also dynamically rename the website title directly from this dashboard.

If you prefer to run the frontend server independently without the manager, you can run:
```bash
npm run dev
```

## Building for Production

To build the static assets for production:

```bash
npm run build
```

This will generate a `dist` folder containing the optimized assets.

## License

MIT License
