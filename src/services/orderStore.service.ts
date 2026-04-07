import { Order, OrderType, OrderStatus } from '../models/order.model';

export interface OrderFilters {
  type?: OrderType;
  status?: OrderStatus;
  limit?: number;
  offset?: number;
}

const store = new Map<string, Order>();

export const orderStore = {
  save(order: Order): void {
    store.set(order.id, order);
  },

  findById(id: string): Order | undefined {
    return store.get(id);
  },

  findAll(filters: OrderFilters = {}): { orders: Order[]; total: number } {
    let results = Array.from(store.values());

    if (filters.type !== undefined) {
      results = results.filter((o) => o.type === filters.type);
    }

    if (filters.status !== undefined) {
      results = results.filter((o) => o.status === filters.status);
    }

    // Sort by createdAt descending (newest first)
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = results.length;

    const offset = filters.offset ?? 0;
    const limit = filters.limit;

    const paginated = limit !== undefined
      ? results.slice(offset, offset + limit)
      : results.slice(offset);

    return { orders: paginated, total };
  },

  count(): number {
    return store.size;
  },

  clear(): void {
    store.clear();
  },
};
