import { splitOrder } from '../src/services/orderSplitter.service';
import { CreateOrderInput } from '../src/validators/order.validator';

const baseInput: CreateOrderInput = {
  portfolio: [
    { ticker: 'AAPL', weight: 0.6 },
    { ticker: 'MSFT', weight: 0.4 },
  ],
  totalAmount: 10000,
  type: 'BUY',
};

describe('splitOrder', () => {
  it('returns an order with correct structure', () => {
    const order = splitOrder(baseInput);
    expect(order.id).toBeDefined();
    expect(order.type).toBe('BUY');
    expect(order.status).toBe('SCHEDULED');
    expect(order.totalAmount).toBe(10000);
    expect(order.splits).toHaveLength(2);
    expect(order.scheduledExecutionAt).toBeInstanceOf(Date);
    expect(order.createdAt).toBeInstanceOf(Date);
  });

  it('computes dollar amounts correctly (weight * totalAmount)', () => {
    const order = splitOrder(baseInput);
    const aapl = order.splits.find((s) => s.ticker === 'AAPL')!;
    const msft = order.splits.find((s) => s.ticker === 'MSFT')!;
    expect(aapl.dollarAmount).toBe(6000);
    expect(msft.dollarAmount).toBe(4000);
  });

  it('uses fixed price (100) when no marketPrice provided', () => {
    const order = splitOrder(baseInput);
    const aapl = order.splits.find((s) => s.ticker === 'AAPL')!;
    expect(aapl.priceUsed).toBe(100);
    expect(aapl.shares).toBe(60); // 6000 / 100
  });

  it('uses provided marketPrice when given', () => {
    const input: CreateOrderInput = {
      ...baseInput,
      portfolio: [
        { ticker: 'AAPL', weight: 0.6, marketPrice: 200 },
        { ticker: 'MSFT', weight: 0.4, marketPrice: 50 },
      ],
    };
    const order = splitOrder(input);
    const aapl = order.splits.find((s) => s.ticker === 'AAPL')!;
    const msft = order.splits.find((s) => s.ticker === 'MSFT')!;
    expect(aapl.priceUsed).toBe(200);
    expect(aapl.shares).toBe(30); // 6000 / 200
    expect(msft.priceUsed).toBe(50);
    expect(msft.shares).toBe(80); // 4000 / 50
  });

  it('handles SELL type correctly', () => {
    const order = splitOrder({ ...baseInput, type: 'SELL' });
    expect(order.type).toBe('SELL');
  });

  it('generates unique ids for each call', () => {
    const a = splitOrder(baseInput);
    const b = splitOrder(baseInput);
    expect(a.id).not.toBe(b.id);
  });
});
