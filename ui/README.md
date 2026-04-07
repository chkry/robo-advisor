# Robo-Advisor UI

React frontend for the Robo-Advisor Order Splitter API. Provides a professional dark-themed dashboard for managing stocks, placing portfolio orders, and reviewing order history.

Built with **React 19**, **TypeScript 6**, **MUI v9**, **Redux Toolkit**, **React Router v7**, and **Vite 8**.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup](#setup)
- [Running the UI](#running-the-ui)
- [Pages](#pages)
- [State Management](#state-management)
- [API Integration](#api-integration)
- [Theme](#theme)

---

## Overview

The UI connects to the backend REST API running at `localhost:3000` via a Vite dev proxy (no CORS configuration needed in development). All API calls go through `/api/v1/*` and are forwarded transparently.

It covers all 7 backend endpoints across 4 pages:

| Page | Route | APIs Used |
|---|---|---|
| Dashboard | `/` | `GET /health`, `GET /stocks`, `GET /orders/history` |
| Stocks | `/stocks` | `GET /stocks`, `POST /stocks` |
| Place Order | `/orders/new` | `GET /stocks`, `POST /orders` |
| Order History | `/orders` | `GET /orders/history`, `GET /orders/:id` |

---

## Tech Stack

| Concern | Library | Version |
|---|---|---|
| UI framework | MUI (Material UI) | v9 |
| State management | Redux Toolkit + React-Redux | v2 / v9 |
| Routing | React Router DOM | v7 |
| HTTP client | Axios | v1 |
| Build tool | Vite | v8 |
| Language | TypeScript | v6 |
| Runtime | React | v19 |

---

## Project Structure

```
ui/
├── public/
├── src/
│   ├── main.tsx                          # App entry point
│   ├── App.tsx                           # Router setup, Provider wrappers, theme injection
│   │
│   ├── api/                              # Axios API clients (one file per resource)
│   │   ├── client.ts                     # Axios instance — baseURL, timeout, headers
│   │   ├── stocks.ts                     # list(), get(), upsert()
│   │   ├── orders.ts                     # create(), get(), history()
│   │   └── health.ts                     # get()
│   │
│   ├── store/                            # Redux store
│   │   ├── index.ts                      # configureStore — combines all reducers
│   │   ├── hooks.ts                      # Typed useAppDispatch / useAppSelector
│   │   └── slices/
│   │       ├── stocksSlice.ts            # stocks state, fetchStocks, upsertStock thunks
│   │       ├── ordersSlice.ts            # orders state, fetchOrders, createOrder, fetchOrderById thunks
│   │       └── healthSlice.ts            # health state, fetchHealth thunk
│   │
│   ├── types/
│   │   └── index.ts                      # Shared TypeScript interfaces (Stock, Order, OrderLineItem, …)
│   │
│   ├── theme/
│   │   └── index.ts                      # MUI dark theme — palette, typography, component overrides
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx             # Page shell — sidebar + main content outlet
│   │   │   └── Sidebar.tsx               # Persistent nav drawer with API status chip
│   │   └── shared/
│   │       ├── StatCard.tsx              # KPI card with icon, value, subtitle
│   │       ├── PageHeader.tsx            # Page title + subtitle + optional action slot
│   │       └── StatusChip.tsx            # StatusChip (PENDING/SCHEDULED/EXECUTED) + TypeChip (BUY/SELL)
│   │
│   └── pages/
│       ├── Dashboard.tsx                 # Overview — stat cards, recent orders, stock list, API health
│       ├── Stocks.tsx                    # Searchable stock table + add/update dialog
│       ├── PlaceOrder.tsx                # Portfolio builder with live preview + success dialog
│       └── OrderHistory.tsx             # Filterable, paginated order table + detail dialog
│
├── vite.config.ts                        # Vite config — React plugin + /api proxy to :3000
├── tsconfig.json
└── package.json
```

---

## Setup

**Prerequisites:** Node.js 18+, npm 9+

The backend API must be running at `localhost:3000` before starting the UI. See the root [README](../README.md) for backend setup.

### Install dependencies

```bash
cd ui
npm install
```

### Environment (optional)

By default the UI proxies `/api` to `http://localhost:3000` via Vite. No `.env` file is needed for local development.

To point at a different API host, set `VITE_API_URL` in a `.env.local` file:

```env
VITE_API_URL=https://your-api-host.com/api/v1
```

---

## Running the UI

### Run UI only

```bash
cd ui
npm run dev
```

UI available at: `http://localhost:5173`

### Run UI + API together (recommended)

From the **root** `robo-advisor/` directory:

```bash
npm run dev:all
```

This uses `concurrently` to start both servers with labeled, color-coded output:

```
[API]   ✓ Server running on port 3000
[API]   ✓ Redis connected
[UI]    VITE v8.0.7  ready in 290ms
[UI]    ➜  Local: http://localhost:5173/
```

### Build for production

```bash
npm run build       # outputs to ui/dist/
npm run preview     # serve the production build locally
```

---

## Pages

### Dashboard `/`

Landing page with a real-time overview of the system.

- **4 stat cards** — total stocks, total orders, scheduled orders count, API online/offline status
- **Recent Orders** — last 5 orders with type/status chips and total amount
- **Registered Stocks** — first 8 stocks from DB with live prices
- **API Health panel** — version, environment, uptime, last-checked timestamp with a green progress bar

Data is fetched on mount from `GET /health`, `GET /stocks`, and `GET /orders/history`.

---

### Stocks `/stocks`

Manage the stock registry.

- **Searchable table** — filter by ticker or company name in real time (client-side)
- **Add / Update Stock dialog** — POST to `/stocks` with ticker, name, price; returns 201 on create, 200 on update
- **Snackbar confirmation** — shows the saved ticker and price on success
- Refresh button reloads from the API

Stocks registered here are automatically used as price sources when placing orders.

---

### Place Order `/orders/new`

Portfolio order builder.

- **Order type selector** — BUY or SELL
- **Total Amount** — investment amount in USD
- **Portfolio rows** — ticker (dropdown from DB stocks), weight (0–1), optional market price override
  - Add up to 50 rows, remove any row
  - Weight sum indicator — turns green when weights sum to exactly 1.0 (±0.001 tolerance)
  - Validation blocks submission if weights don't sum to 1, tickers are duplicate, or fields are missing
- **Live Preview panel** — updates as you type, shows per-stock dollar amount and calculated share count using the resolved price
- **Price Resolution info card** — explains the 3-tier price fallback (manual → DB → fixed $100)
- **Success dialog** — after a successful POST, shows full order details and split breakdown. Options to view history or place another order.

---

### Order History `/orders`

Full paginated order log.

- **Filter bar** — filter by type (BUY/SELL) and status (PENDING/SCHEDULED/EXECUTED); filters apply server-side
- **Table** — order ID (truncated with tooltip), type chip, status chip, total amount, stock tickers, scheduled time, created time
- **Pagination** — server-side via `limit`/`offset`; rows-per-page selector (5, 10, 25, 50)
- **Detail dialog** — click any row's expand icon to fetch `GET /orders/:id` and show full split table with weight %, dollar amount, share count, and price used

---

## State Management

Redux Toolkit with three slices:

### `stocksSlice`

| State field | Type | Description |
|---|---|---|
| `items` | `Stock[]` | All registered stocks |
| `total` | `number` | Total count |
| `loading` | `boolean` | Request in flight |
| `error` | `string \| null` | Last error message |
| `lastUpserted` | `Stock \| null` | Last saved stock (drives Snackbar) |

Thunks: `fetchStocks`, `upsertStock`

---

### `ordersSlice`

| State field | Type | Description |
|---|---|---|
| `items` | `Order[]` | Current page of orders |
| `total` | `number` | Total matching orders |
| `filters` | `OrderFilters` | Active type/status/limit/offset |
| `loading` | `boolean` | List/detail fetch in flight |
| `submitting` | `boolean` | Order creation in flight |
| `lastCreated` | `Order \| null` | Last created order (drives success dialog) |
| `selected` | `Order \| null` | Order loaded for detail dialog |

Thunks: `fetchOrders`, `fetchOrderById`, `createOrder`

Actions: `setFilters`, `setPage`, `clearLastCreated`, `clearSelected`, `clearError`

---

### `healthSlice`

| State field | Type | Description |
|---|---|---|
| `data` | `HealthStatus \| null` | Last health response |
| `loading` | `boolean` | |
| `error` | `string \| null` | Set if API is unreachable |

Thunk: `fetchHealth`

---

## API Integration

All HTTP calls go through `src/api/client.ts` — a pre-configured Axios instance:

```ts
baseURL: '/api/v1'   // proxied to http://localhost:3000 in dev
timeout: 10_000
```

The Vite proxy (`vite.config.ts`) forwards all `/api/*` requests to the backend:

```ts
proxy: {
  '/api': { target: 'http://localhost:3000', changeOrigin: true }
}
```

This means no CORS headers are needed on the backend in development. In production, serve the built `dist/` folder from the same origin as the API, or configure CORS on the Express server.

---

## Theme

Dark professional theme defined in `src/theme/index.ts`.

| Token | Value |
|---|---|
| Background default | `#0A0E1A` |
| Background paper | `#111827` |
| Sidebar background | `#0D1320` |
| Primary | `#6C8EF5` (blue-violet) |
| Secondary | `#4ECDC4` (teal) |
| Success | `#4CAF50` |
| Error | `#EF5350` |
| Warning | `#FFA726` |
| Font | Inter, Roboto (fallback) |
| Border radius | 12px (cards), 8px (buttons) |

Buttons use a gradient (`#6C8EF5 → #4C6EF5`) with a glow box-shadow. The active sidebar item uses a gradient left-border highlight. All card borders use `rgba(255,255,255,0.06)`.
