import { orderStore } from '../src/services/orderStore.service';
import { Order } from '../src/models/order.model';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'test-id-1',
    type: 'BUY',
    status: 'SCHEDULED',
    portfolio: [{ ticker: 'AAPL', weight: 1 }],
    totalAmount: 1000,
    splits: [],
    scheduledExecutionAt: new Date('2026-04-08T13:30:00Z'),
    createdAt: new Date('2026-04-07T10:00:00Z'),
    ...overrides,
  };
}

beforeEach(() => {
  orderStore.clear();
});

describe('orderStore', () => {
  it('saves and retrieves an order by id', () => {
    const order = makeOrder();
    orderStore.save(order);
    expect(orderStore.findById('test-id-1')).toEqual(order);
  });

  it('returns undefined for unknown id', () => {
    expect(orderStore.findById('nope')).toBeUndefined();
  });

  it('counts orders correctly', () => {
    orderStore.save(makeOrder({ id: 'a' }));
    orderStore.save(makeOrder({ id: 'b' }));
    expect(orderStore.count()).toBe(2);
  });

  it('returns all orders sorted newest first', () => {
    const older = makeOrder({ id: 'old', createdAt: new Date('2026-04-06T10:00:00Z') });
    const newer = makeOrder({ id: 'new', createdAt: new Date('2026-04-07T10:00:00Z') });
    orderStore.save(older);
    orderStore.save(newer);
    const { orders } = orderStore.findAll();
    expect(orders[0].id).toBe('new');
    expect(orders[1].id).toBe('old');
  });

  it('filters by type', () => {
    orderStore.save(makeOrder({ id: 'buy1', type: 'BUY' }));
    orderStore.save(makeOrder({ id: 'sell1', type: 'SELL' }));
    const { orders, total } = orderStore.findAll({ type: 'SELL' });
    expect(total).toBe(1);
    expect(orders[0].id).toBe('sell1');
  });

  it('filters by status', () => {
    orderStore.save(makeOrder({ id: 'a', status: 'SCHEDULED' }));
    orderStore.save(makeOrder({ id: 'b', status: 'EXECUTED' }));
    const { orders } = orderStore.findAll({ status: 'EXECUTED' });
    expect(orders[0].id).toBe('b');
  });

  it('paginates with limit and offset', () => {
    for (let i = 1; i <= 5; i++) {
      orderStore.save(makeOrder({ id: `order-${i}`, createdAt: new Date(i * 1000) }));
    }
    const { orders, total } = orderStore.findAll({ limit: 2, offset: 1 });
    expect(total).toBe(5);
    expect(orders).toHaveLength(2);
  });

  it('clears all orders', () => {
    orderStore.save(makeOrder());
    orderStore.clear();
    expect(orderStore.count()).toBe(0);
  });
});
