# Robo-Advisor Order Splitter API

A production-grade REST API for splitting robo-advisor portfolio investments into per-stock order line items, with automatic NYSE market scheduling, PostgreSQL persistence, and Redis caching.

---

## What This Project Does

A robo-advisor manages investments on behalf of users by maintaining a target portfolio — a list of stocks with assigned weights (e.g. 60% AAPL, 40% MSFT). When a user deposits money or rebalances, the advisor needs to place buy/sell orders across those stocks proportionally.

This API handles that calculation and scheduling:

1. **Register stocks** — Add stocks to the database with their current market price. Stocks persist and can be updated.
2. **Split an order** — Submit a portfolio + total investment amount. The API calculates the dollar allocation and share quantity for each stock, resolving prices from the DB automatically.
3. **Schedule execution** — Orders are automatically scheduled for the next NYSE market open (Mon–Fri, 9:30 AM ET), skipping weekends and US public holidays, with DST-aware UTC conversion.
4. **Retrieve history** — Query past orders with filtering by type/status and cursor-style pagination.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+, TypeScript 5 |
| Framework | Express 4 |
| Validation | Zod 3 |
| Database | PostgreSQL 17 (via Prisma ORM + `@prisma/adapter-pg`) |
| Cache | Redis 8 (via ioredis) |
| Testing | Jest 30 + Supertest |

---

## Project Structure

```
robo-advisor/
├── prisma/
│   ├── schema.prisma                      # DB schema — Stock, Order, OrderSplit
│   └── migrations/                        # Auto-generated SQL migrations
├── prisma.config.ts                       # Prisma v7 config (datasource URL)
├── src/
│   ├── index.ts                           # Server entry — starts app, Redis connect, signal handlers
│   ├── app.ts                             # Express factory — middleware, routes
│   ├── generated/prisma/                  # Auto-generated Prisma client (do not edit)
│   ├── config/
│   │   └── app.config.ts                  # Env var loading + startup validation
│   ├── db/
│   │   └── prisma.client.ts               # Singleton Prisma client (pg pool + adapter)
│   ├── cache/
│   │   └── redis.client.ts                # Singleton ioredis client
│   ├── models/
│   │   └── order.model.ts                 # Shared TypeScript interfaces and types
│   ├── validators/
│   │   ├── order.validator.ts             # Zod schemas for order requests
│   │   └── stock.validator.ts             # Zod schemas for stock requests
│   ├── services/
│   │   ├── stock.service.ts               # Stock DB operations + Redis cache
│   │   ├── orderSplitter.service.ts       # Core split calculation (DB price resolution)
│   │   ├── orderStore.service.ts          # Order DB operations + Redis cache
│   │   └── marketCalendar.service.ts      # NYSE calendar + DST-aware scheduling
│   ├── routes/
│   │   ├── index.ts                       # Aggregator — mounts all routers at /api/v1
│   │   ├── stocks.routes.ts               # POST /stocks, GET /stocks, GET /stocks/:ticker
│   │   ├── orders.routes.ts               # POST /orders, GET /orders/history, GET /orders/:id
│   │   └── health.routes.ts               # GET /health
│   ├── middleware/
│   │   ├── errorHandler.ts                # Zod error handler + 404 + 500 fallback
│   │   └── requestTimer.ts                # Per-request hrtime latency logging
│   └── utils/
│       └── rounding.ts                    # Decimal precision rounding helpers
└── tests/
    ├── api.test.ts                        # Supertest integration tests (all routes)
    ├── orderSplitter.test.ts              # Unit — split calculation
    ├── orderStore.test.ts                 # Unit — in-memory store operations
    ├── marketCalendar.test.ts             # Unit — market calendar + DST
    └── rounding.test.ts                   # Unit — rounding utilities
```

---

## Database Schema

```
stocks
  id          UUID  PK
  ticker      TEXT  UNIQUE
  name        TEXT
  price       FLOAT
  created_at  TIMESTAMP
  updated_at  TIMESTAMP

orders
  id                      UUID  PK
  type                    ENUM  (BUY | SELL)
  status                  ENUM  (PENDING | SCHEDULED | EXECUTED)
  total_amount            FLOAT
  scheduled_execution_at  TIMESTAMP
  created_at              TIMESTAMP

order_splits
  id            UUID  PK
  order_id      UUID  FK → orders.id (CASCADE DELETE)
  ticker        TEXT
  weight        FLOAT
  dollar_amount FLOAT
  shares        FLOAT
  price_used    FLOAT
```

---

## Caching Strategy

| Endpoint | Cache Key | TTL | Invalidation |
|---|---|---|---|
| `GET /stocks/:ticker` | `stocks:<TICKER>` | 5 min | On upsert |
| `GET /orders/:id` | `orders:<uuid>` | 60 sec | Never (immutable after creation) |
| `GET /orders/history` | `orders:history:<filters>` | 15 sec | On every new order saved |

---

## Setup

**Requirements:** Node.js 18+, PostgreSQL 17+, Redis

### 1. Install dependencies

```bash
git clone git@github.com:chkry/robo-advisor.git
cd robo-advisor
npm install
cp .env.example .env
```

### 2. Start PostgreSQL and Redis

```bash
brew services start postgresql@17
brew services start redis
```

### 3. Create the database

```bash
createdb robo_advisor
```

### 4. Configure environment

Edit `.env` with your database user:

```env
DATABASE_URL="postgresql://<YOUR_USER>@localhost:5432/robo_advisor"
REDIS_URL="redis://localhost:6379"
```

### 5. Run migrations and generate Prisma client

```bash
npx prisma migrate dev
npx prisma generate
```

### 6. Start the server

```bash
npm run dev
```

---

## Configuration

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `NODE_ENV` | `development` | Environment label |
| `FIXED_PRICE` | `100` | Fallback stock price (USD) when stock is not in DB and no `marketPrice` provided |
| `DECIMAL_PRECISION` | `3` | Decimal places for rounding share quantities and dollar amounts |
| `MARKET_OPEN_HOUR_ET` | `9` | Market open hour in Eastern Time (24-hour) |
| `MARKET_OPEN_MINUTE_ET` | `30` | Market open minute in Eastern Time |
| `DATABASE_URL` | — | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |

---

## Running the Server

```bash
npm run dev       # development with hot reload
npm run build     # compile TypeScript
npm start         # run compiled output
npm test          # run all tests
```

---

## Testing

```bash
npm test
```

```
PASS  tests/rounding.test.ts
PASS  tests/marketCalendar.test.ts
PASS  tests/orderStore.test.ts
PASS  tests/orderSplitter.test.ts
PASS  tests/api.test.ts

Tests: 53 passed, 53 total
```

---

## API Contracts

**Base URL:** `http://localhost:3000/api/v1`

All request/response bodies are `application/json`. All timestamps are ISO 8601 UTC.

---

### POST /api/v1/stocks

Register a stock or update its price/name if the ticker already exists.

**Request**

```json
{
  "ticker": "AAPL",
  "name": "Apple Inc.",
  "price": 192.50
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `ticker` | `string` | Yes | 1–10 chars, `[A-Z0-9.^-]+`, uppercased automatically |
| `name` | `string` | Yes | 1–100 chars |
| `price` | `number` | Yes | `> 0` |

**Response — 201 Created** (new stock) or **200 OK** (updated existing)

```json
{
  "id": "64d2e3ed-40ec-4ff1-86dd-767b52aad26b",
  "ticker": "AAPL",
  "name": "Apple Inc.",
  "price": 192.5,
  "createdAt": "2026-04-07T21:05:30.761Z",
  "updatedAt": "2026-04-07T21:05:30.761Z"
}
```

---

### GET /api/v1/stocks

List all registered stocks, sorted alphabetically by ticker.

**Response — 200 OK**

```json
{
  "total": 2,
  "stocks": [
    { "id": "...", "ticker": "AAPL", "name": "Apple Inc.", "price": 192.5, "createdAt": "...", "updatedAt": "..." },
    { "id": "...", "ticker": "MSFT", "name": "Microsoft Corporation", "price": 415.0, "createdAt": "...", "updatedAt": "..." }
  ]
}
```

---

### GET /api/v1/stocks/:ticker

Retrieve a single stock by ticker symbol.

**Response — 200 OK** — same shape as individual stock object above.

**Response — 404** if ticker not found.

---

### POST /api/v1/orders

Split a portfolio investment into per-stock line items and schedule execution.

**Price resolution order:**
1. `marketPrice` on the portfolio item (if provided)
2. Stock price from the database (if ticker is registered)
3. `FIXED_PRICE` env var fallback (default: $100)

**Request**

```json
{
  "portfolio": [
    { "ticker": "AAPL", "weight": 0.60 },
    { "ticker": "MSFT", "weight": 0.40 }
  ],
  "totalAmount": 10000,
  "type": "BUY"
}
```

| Field | Type | Required | Rules |
|---|---|---|---|
| `portfolio` | `StockAllocation[]` | Yes | 1–50 items; weights must sum to 1.0 (±0.001); no duplicate tickers |
| `portfolio[].ticker` | `string` | Yes | 1–10 chars, `[A-Z0-9.^-]+`, uppercased |
| `portfolio[].weight` | `number` | Yes | `> 0`, `<= 1` |
| `portfolio[].marketPrice` | `number` | No | `> 0`; overrides DB price when provided |
| `totalAmount` | `number` | Yes | `> 0` |
| `type` | `"BUY" \| "SELL"` | Yes | |

**Response — 201 Created**

```json
{
  "orderId": "65704e33-5ff6-46de-aeb8-cb024fe3dfd7",
  "type": "BUY",
  "status": "SCHEDULED",
  "totalAmount": 10000,
  "scheduledExecutionAt": "2026-04-08T13:30:00.000Z",
  "createdAt": "2026-04-07T21:05:30.831Z",
  "splits": [
    { "ticker": "AAPL", "weight": 0.6, "dollarAmount": 6000, "shares": 31.169, "priceUsed": 192.5 },
    { "ticker": "MSFT", "weight": 0.4, "dollarAmount": 4000, "shares": 9.639,  "priceUsed": 415 }
  ]
}
```

| Field | Description |
|---|---|
| `orderId` | UUID v4 |
| `status` | Always `SCHEDULED` on creation |
| `scheduledExecutionAt` | Next NYSE market open (UTC) |
| `splits[].dollarAmount` | `totalAmount × weight`, rounded to `DECIMAL_PRECISION` |
| `splits[].shares` | `dollarAmount / priceUsed`, rounded to `DECIMAL_PRECISION` |
| `splits[].priceUsed` | Resolved price used in calculation |

---

### GET /api/v1/orders/history

Return all orders, newest first, with optional filtering and pagination.

**Query Parameters**

| Parameter | Type | Description |
|---|---|---|
| `type` | `"BUY" \| "SELL"` | Filter by order type |
| `status` | `"PENDING" \| "SCHEDULED" \| "EXECUTED"` | Filter by order status |
| `limit` | `integer > 0` | Max results to return |
| `offset` | `integer >= 0` | Results to skip |

**Response — 200 OK**

```json
{
  "total": 42,
  "page": { "offset": 0, "limit": 10, "count": 10 },
  "orders": [...]
}
```

---

### GET /api/v1/orders/:id

Retrieve a single order by UUID.

**Response — 200 OK** — same shape as POST /orders response.

**Response — 404** if not found.

---

### GET /api/v1/health

```json
{
  "status": "ok",
  "uptime": 3600.21,
  "timestamp": "2026-04-07T10:00:00.000Z",
  "version": "1.0.0",
  "environment": "development"
}
```

---

### Error Responses

All errors share this structure:

```json
{
  "error": "Validation failed",
  "details": [
    { "field": "portfolio", "message": "Portfolio weights must sum to 1.0 (got 0.900000)" }
  ],
  "timestamp": "2026-04-07T10:00:00.000Z",
  "path": "/api/v1/orders"
}
```

| Status | Cause |
|---|---|
| `400` | Validation failure — bad body or query params |
| `404` | Resource not found or route does not exist |
| `500` | Unexpected server error |

---

## Quick Curls

Requires the server running on `localhost:3000`.

**Register stocks**
```bash
curl -s -X POST http://localhost:3000/api/v1/stocks \
  -H "Content-Type: application/json" \
  -d '{"ticker":"AAPL","name":"Apple Inc.","price":192.50}' | jq

curl -s -X POST http://localhost:3000/api/v1/stocks \
  -H "Content-Type: application/json" \
  -d '{"ticker":"MSFT","name":"Microsoft Corporation","price":415.00}' | jq

curl -s -X POST http://localhost:3000/api/v1/stocks \
  -H "Content-Type: application/json" \
  -d '{"ticker":"TSLA","name":"Tesla Inc.","price":245.00}' | jq
```

**List all stocks**
```bash
curl -s http://localhost:3000/api/v1/stocks | jq

curl -s http://localhost:3000/api/v1/stocks/AAPL | jq
```

**Update a stock price (upsert)**
```bash
curl -s -X POST http://localhost:3000/api/v1/stocks \
  -H "Content-Type: application/json" \
  -d '{"ticker":"AAPL","name":"Apple Inc.","price":201.00}' | jq
```

**Create a BUY order — prices auto-resolved from DB**
```bash
curl -s -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "portfolio": [
      { "ticker": "AAPL", "weight": 0.6 },
      { "ticker": "MSFT", "weight": 0.4 }
    ],
    "totalAmount": 10000,
    "type": "BUY"
  }' | jq
```

**Create a BUY order — override price per stock**
```bash
curl -s -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "portfolio": [
      { "ticker": "AAPL", "weight": 0.5, "marketPrice": 192.50 },
      { "ticker": "TSLA", "weight": 0.3, "marketPrice": 245.00 },
      { "ticker": "MSFT", "weight": 0.2, "marketPrice": 415.00 }
    ],
    "totalAmount": 50000,
    "type": "BUY"
  }' | jq
```

**Create a SELL order**
```bash
curl -s -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "portfolio": [
      { "ticker": "AAPL", "weight": 0.7 },
      { "ticker": "GOOGL", "weight": 0.3 }
    ],
    "totalAmount": 5000,
    "type": "SELL"
  }' | jq
```

**Get order by ID**
```bash
curl -s http://localhost:3000/api/v1/orders/<orderId> | jq
```

**Get all orders**
```bash
curl -s http://localhost:3000/api/v1/orders/history | jq
```

**Filter and paginate**
```bash
curl -s "http://localhost:3000/api/v1/orders/history?type=BUY&status=SCHEDULED&limit=5&offset=0" | jq
```

**Health check**
```bash
curl -s http://localhost:3000/api/v1/health | jq
```

**Trigger a validation error**
```bash
curl -s -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "portfolio": [
      { "ticker": "AAPL", "weight": 0.5 },
      { "ticker": "MSFT", "weight": 0.3 }
    ],
    "totalAmount": 10000,
    "type": "BUY"
  }' | jq
```

---

## Design

**Price resolution**

When an order is submitted, each stock's price is resolved in priority order: (1) `marketPrice` on the request, (2) the stock's registered price in PostgreSQL (looked up via Redis cache first), (3) the `FIXED_PRICE` env var fallback. This means registering stocks is optional — unregistered tickers still work using the fixed fallback.

**Order splitting**

`dollarAmount = totalAmount × weight`, rounded to `DECIMAL_PRECISION` places.
`shares = dollarAmount / priceUsed`, rounded to `DECIMAL_PRECISION` places.

**Weight tolerance**

Weights are validated with ±0.001 tolerance because IEEE 754 floating-point means `0.1 + 0.2 + 0.7 !== 1.0` exactly.

**Market scheduling**

If the order arrives before today's market open and today is a trading day, it is scheduled for today. Otherwise it advances to the next valid NYSE trading day, skipping weekends and US public holidays (hardcoded through 2027). DST offset is computed per-date: EDT (UTC-4) between the 2nd Sunday in March and 1st Sunday in November, EST (UTC-5) otherwise.

**Route ordering**

`/orders/history` is registered before `/orders/:id` so the string `"history"` is never matched as an `:id` parameter.

**Stock upsert**

`POST /stocks` is idempotent — submitting an existing ticker updates the name and price. Returns `201` on create, `200` on update. Cache is invalidated on every upsert.

**Graceful shutdown**

`SIGTERM`/`SIGINT` close the HTTP server, quit the Redis connection, and disconnect Prisma cleanly. A 10-second hard-kill timeout fires if connections don't drain.
