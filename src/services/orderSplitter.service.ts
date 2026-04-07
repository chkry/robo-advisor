import { randomUUID } from 'crypto';
import { CreateOrderInput } from '../validators/order.validator';
import { Order, OrderLineItem } from '../models/order.model';
import { roundToPrecision } from '../utils/rounding';
import { getNextTradingExecution } from './marketCalendar.service';
import { stockService } from './stock.service';
import config from '../config/app.config';

export async function splitOrder(input: CreateOrderInput): Promise<Order> {
  const now = new Date();
  const precision = config.decimalPrecision;

  const splits: OrderLineItem[] = await Promise.all(
    input.portfolio.map(async (allocation) => {
      let priceUsed = allocation.marketPrice;

      if (priceUsed === undefined) {
        const stock = await stockService.findByTicker(allocation.ticker);
        priceUsed = stock?.price ?? config.fixedPrice;
      }

      const dollarAmount = roundToPrecision(input.totalAmount * allocation.weight, precision);
      const shares = roundToPrecision(dollarAmount / priceUsed, precision);

      return {
        ticker: allocation.ticker,
        weight: allocation.weight,
        dollarAmount,
        shares,
        priceUsed,
      };
    }),
  );

  const scheduledExecutionAt = getNextTradingExecution(now);

  return {
    id: randomUUID(),
    type: input.type,
    status: 'SCHEDULED',
    portfolio: input.portfolio,
    totalAmount: input.totalAmount,
    splits,
    scheduledExecutionAt,
    createdAt: now,
  };
}
