import prisma from '../db/prisma.client';
import redis from '../cache/redis.client';
import { Order, OrderType, OrderStatus } from '../models/order.model';

const ORDER_TTL = 60;        // seconds — individual order cache
const HISTORY_TTL = 15;      // seconds — history list cache

function historyKey(filters: OrderFilters): string {
  return `orders:history:${JSON.stringify(filters)}`;
}

function orderKey(id: string): string {
  return `orders:${id}`;
}

export interface OrderFilters {
  type?: OrderType;
  status?: OrderStatus;
  limit?: number;
  offset?: number;
}

function toOrder(raw: {
  id: string;
  type: string;
  status: string;
  totalAmount: number;
  scheduledExecutionAt: Date;
  createdAt: Date;
  splits: Array<{
    ticker: string;
    weight: number;
    dollarAmount: number;
    shares: number;
    priceUsed: number;
  }>;
}): Order {
  return {
    id: raw.id,
    type: raw.type as OrderType,
    status: raw.status as OrderStatus,
    portfolio: raw.splits.map((s) => ({ ticker: s.ticker, weight: s.weight })),
    totalAmount: raw.totalAmount,
    splits: raw.splits.map((s) => ({
      ticker: s.ticker,
      weight: s.weight,
      dollarAmount: s.dollarAmount,
      shares: s.shares,
      priceUsed: s.priceUsed,
    })),
    scheduledExecutionAt: raw.scheduledExecutionAt,
    createdAt: raw.createdAt,
  };
}

const splitInclude = { splits: { orderBy: { ticker: 'asc' as const } } };

export const orderStore = {
  async save(order: Order): Promise<void> {
    await prisma.order.create({
      data: {
        id: order.id,
        type: order.type,
        status: order.status,
        totalAmount: order.totalAmount,
        scheduledExecutionAt: order.scheduledExecutionAt,
        createdAt: order.createdAt,
        splits: {
          create: order.splits.map((s) => ({
            ticker: s.ticker,
            weight: s.weight,
            dollarAmount: s.dollarAmount,
            shares: s.shares,
            priceUsed: s.priceUsed,
          })),
        },
      },
    });

    await redis.setex(orderKey(order.id), ORDER_TTL, JSON.stringify(order));
    await redis.del('orders:history:*');
  },

  async findById(id: string): Promise<Order | undefined> {
    const cached = await redis.get(orderKey(id));
    if (cached) return JSON.parse(cached) as Order;

    const raw = await prisma.order.findUnique({ where: { id }, include: splitInclude });
    if (!raw) return undefined;

    const order = toOrder(raw);
    await redis.setex(orderKey(id), ORDER_TTL, JSON.stringify(order));
    return order;
  },

  async findAll(filters: OrderFilters = {}): Promise<{ orders: Order[]; total: number }> {
    const cacheKey = historyKey(filters);
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached) as { orders: Order[]; total: number };

    const where = {
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: splitInclude,
        orderBy: { createdAt: 'desc' },
        skip: filters.offset ?? 0,
        take: filters.limit,
      }),
    ]);

    const result = { orders: rows.map(toOrder), total };
    await redis.setex(cacheKey, HISTORY_TTL, JSON.stringify(result));
    return result;
  },

  async count(): Promise<number> {
    return prisma.order.count();
  },

  async clear(): Promise<void> {
    await prisma.orderSplit.deleteMany();
    await prisma.order.deleteMany();
    const keys = await redis.keys('orders:*');
    if (keys.length > 0) await redis.del(...keys);
  },
};
