# ICP Development Dashboard

A React-based dashboard for analyzing and reconciling Ideal Customer Profile (ICP) data from multiple outreach sources.

## Demo

[![ICP Development Walkthrough](https://img.youtube.com/vi/nhOl1SKTH2I/maxresdefault.jpg)](https://youtu.be/nhOl1SKTH2I)

*Click the image above to watch the walkthrough*

## Features

- **Drag & Drop File Upload** - Upload CSV files for CRM accounts, cold calls, email outreach, and website visits
- **CSV Preview** - Preview uploaded data before running analysis
- **Reconciled Accounts Table** - Combined view of all data with sorting and filtering
- **Sankey Diagram** - Visual pipeline flow showing cold call outcomes by industry
- **Export Options** - Download reconciled data as CSV

## Data Sources

| Source | Description |
|--------|-------------|
| CRM Accounts | Master list of target companies |
| Cold Calls | Dials, connects & conversations |
| Email Outreach | Sends, opens & click data |
| Website Visits | Intent signals & page views |

## Getting Started

```bash
npm install
npm run dev
```

## Built With

- React + Vite
- Plotly.js (Sankey diagrams)
- PapaParser (CSV parsing)
