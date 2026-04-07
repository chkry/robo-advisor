import request from 'supertest';
import { createApp } from '../src/app';
import { orderStore } from '../src/services/orderStore.service';

const app = createApp();

beforeEach(() => {
  orderStore.clear();
});

const validBody = {
  portfolio: [
    { ticker: 'AAPL', weight: 0.6 },
    { ticker: 'MSFT', weight: 0.4 },
  ],
  totalAmount: 10000,
  type: 'BUY',
};

// ── Health ────────────────────────────────────────────────────────────────────

describe('GET /api/v1/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.uptime).toBeGreaterThanOrEqual(0);
    expect(res.body.timestamp).toBeDefined();
    expect(res.body.version).toBe('1.0.0');
  });
});

// ── POST /api/v1/orders ───────────────────────────────────────────────────────

describe('POST /api/v1/orders', () => {
  it('creates an order and returns 201', async () => {
    const res = await request(app).post('/api/v1/orders').send(validBody);
    expect(res.status).toBe(201);
    expect(res.body.orderId).toBeDefined();
    expect(res.body.type).toBe('BUY');
    expect(res.body.status).toBe('SCHEDULED');
    expect(res.body.totalAmount).toBe(10000);
    expect(res.body.splits).toHaveLength(2);
    expect(res.body.scheduledExecutionAt).toBeDefined();
    expect(res.body.createdAt).toBeDefined();
  });

  it('returns correct split dollar amounts', async () => {
    const res = await request(app).post('/api/v1/orders').send(validBody);
    const aapl = res.body.splits.find((s: { ticker: string }) => s.ticker === 'AAPL');
    const msft = res.body.splits.find((s: { ticker: string }) => s.ticker === 'MSFT');
    expect(aapl.dollarAmount).toBe(6000);
    expect(msft.dollarAmount).toBe(4000);
  });

  it('uses provided marketPrice in split', async () => {
    const body = {
      ...validBody,
      portfolio: [
        { ticker: 'AAPL', weight: 0.6, marketPrice: 150 },
        { ticker: 'MSFT', weight: 0.4, marketPrice: 300 },
      ],
    };
    const res = await request(app).post('/api/v1/orders').send(body);
    const aapl = res.body.splits.find((s: { ticker: string }) => s.ticker === 'AAPL');
    expect(aapl.priceUsed).toBe(150);
  });

  it('rejects missing portfolio', async () => {
    const res = await request(app).post('/api/v1/orders').send({ totalAmount: 1000, type: 'BUY' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('rejects weights that do not sum to 1', async () => {
    const body = {
      ...validBody,
      portfolio: [
        { ticker: 'AAPL', weight: 0.5 },
        { ticker: 'MSFT', weight: 0.3 },
      ],
    };
    const res = await request(app).post('/api/v1/orders').send(body);
    expect(res.status).toBe(400);
    expect(res.body.details[0].message).toMatch(/weights must sum to 1/);
  });

  it('rejects duplicate tickers', async () => {
    const body = {
      ...validBody,
      portfolio: [
        { ticker: 'AAPL', weight: 0.5 },
        { ticker: 'AAPL', weight: 0.5 },
      ],
    };
    const res = await request(app).post('/api/v1/orders').send(body);
    expect(res.status).toBe(400);
    expect(res.body.details[0].message).toMatch(/duplicate tickers/);
  });

  it('rejects invalid type', async () => {
    const res = await request(app).post('/api/v1/orders').send({ ...validBody, type: 'HOLD' });
    expect(res.status).toBe(400);
  });

  it('rejects zero totalAmount', async () => {
    const res = await request(app).post('/api/v1/orders').send({ ...validBody, totalAmount: 0 });
    expect(res.status).toBe(400);
  });

  it('rejects negative totalAmount', async () => {
    const res = await request(app).post('/api/v1/orders').send({ ...validBody, totalAmount: -100 });
    expect(res.status).toBe(400);
  });

  it('rejects empty portfolio array', async () => {
    const res = await request(app).post('/api/v1/orders').send({ ...validBody, portfolio: [] });
    expect(res.status).toBe(400);
  });
});

// ── GET /api/v1/orders/history ────────────────────────────────────────────────

describe('GET /api/v1/orders/history', () => {
  it('returns empty list when no orders', async () => {
    const res = await request(app).get('/api/v1/orders/history');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
    expect(res.body.orders).toHaveLength(0);
  });

  it('returns all created orders', async () => {
    await request(app).post('/api/v1/orders').send(validBody);
    await request(app).post('/api/v1/orders').send({ ...validBody, type: 'SELL' });
    const res = await request(app).get('/api/v1/orders/history');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
  });

  it('filters by type=BUY', async () => {
    await request(app).post('/api/v1/orders').send(validBody);
    await request(app).post('/api/v1/orders').send({ ...validBody, type: 'SELL' });
    const res = await request(app).get('/api/v1/orders/history?type=BUY');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.orders[0].type).toBe('BUY');
  });

  it('filters by status=SCHEDULED', async () => {
    await request(app).post('/api/v1/orders').send(validBody);
    const res = await request(app).get('/api/v1/orders/history?status=SCHEDULED');
    expect(res.body.total).toBe(1);
  });

  it('applies limit and offset', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/v1/orders').send(validBody);
    }
    const res = await request(app).get('/api/v1/orders/history?limit=2&offset=1');
    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(2);
    expect(res.body.total).toBe(5);
    expect(res.body.page.limit).toBe(2);
    expect(res.body.page.offset).toBe(1);
  });

  it('returns 400 for invalid type filter', async () => {
    const res = await request(app).get('/api/v1/orders/history?type=HOLD');
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid limit', async () => {
    const res = await request(app).get('/api/v1/orders/history?limit=-1');
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid offset', async () => {
    const res = await request(app).get('/api/v1/orders/history?offset=-5');
    expect(res.status).toBe(400);
  });
});

// ── GET /api/v1/orders/:id ────────────────────────────────────────────────────

describe('GET /api/v1/orders/:id', () => {
  it('returns the order by id', async () => {
    const created = await request(app).post('/api/v1/orders').send(validBody);
    const { orderId } = created.body;
    const res = await request(app).get(`/api/v1/orders/${orderId}`);
    expect(res.status).toBe(200);
    expect(res.body.orderId).toBe(orderId);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/v1/orders/nonexistent-id');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Order not found');
  });
});

// ── 404 catch-all ─────────────────────────────────────────────────────────────

describe('Unknown routes', () => {
  it('returns 404 for unregistered route', async () => {
    const res = await request(app).get('/api/v1/unknown');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/Route not found/);
  });
});
