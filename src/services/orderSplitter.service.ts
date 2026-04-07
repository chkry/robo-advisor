import { randomUUID } from 'crypto';
import { CreateOrderInput } from '../validators/order.validator';
import { Order, OrderLineItem } from '../models/order.model';
import { roundToPrecision } from '../utils/rounding';
import { getNextTradingExecution } from './marketCalendar.service';
import config from '../config/app.config';

export function splitOrder(input: CreateOrderInput): Order {
  const now = new Date();
  const precision = config.decimalPrecision;

  const splits: OrderLineItem[] = input.portfolio.map((allocation) => {
    const priceUsed = allocation.marketPrice ?? config.fixedPrice;
    const dollarAmount = roundToPrecision(input.totalAmount * allocation.weight, precision);
    const shares = roundToPrecision(dollarAmount / priceUsed, precision);

    return {
      ticker: allocation.ticker,
      weight: allocation.weight,
      dollarAmount,
      shares,
      priceUsed,
    };
  });

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
