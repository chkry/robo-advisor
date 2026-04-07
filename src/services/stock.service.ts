import prisma from '../db/prisma.client';
import redis from '../cache/redis.client';
import { CreateStockInput } from '../validators/stock.validator';

const STOCK_TTL = 300; // 5 minutes

function stockKey(ticker: string): string {
  return `stocks:${ticker}`;
}

export interface StockRecord {
  id: string;
  ticker: string;
  name: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

export const stockService = {
  async upsert(input: CreateStockInput): Promise<{ stock: StockRecord; created: boolean }> {
    const existing = await prisma.stock.findUnique({ where: { ticker: input.ticker } });

    const stock = await prisma.stock.upsert({
      where: { ticker: input.ticker },
      create: { ticker: input.ticker, name: input.name, price: input.price },
      update: { name: input.name, price: input.price },
    });

    await redis.setex(stockKey(stock.ticker), STOCK_TTL, JSON.stringify(stock));

    return { stock, created: !existing };
  },

  async findByTicker(ticker: string): Promise<StockRecord | null> {
    const cached = await redis.get(stockKey(ticker));
    if (cached) return JSON.parse(cached) as StockRecord;

    const stock = await prisma.stock.findUnique({ where: { ticker } });
    if (stock) {
      await redis.setex(stockKey(ticker), STOCK_TTL, JSON.stringify(stock));
    }
    return stock;
  },

  async findAll(): Promise<StockRecord[]> {
    return prisma.stock.findMany({ orderBy: { ticker: 'asc' } });
  },
};
