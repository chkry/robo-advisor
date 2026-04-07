import { Router, Request, Response, NextFunction } from 'express';
import { createOrderSchema } from '../validators/order.validator';
import { splitOrder } from '../services/orderSplitter.service';
import { orderStore } from '../services/orderStore.service';
import { CreateOrderResponse } from '../models/order.model';

const router = Router();

function formatOrder(order: ReturnType<typeof orderStore.findById>): CreateOrderResponse {
  if (!order) throw new Error('Order is undefined');
  return {
    orderId: order.id,
    type: order.type,
    status: order.status,
    totalAmount: order.totalAmount,
    scheduledExecutionAt: order.scheduledExecutionAt.toISOString(),
    createdAt: order.createdAt.toISOString(),
    splits: order.splits,
  };
}

router.post('/', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const input = createOrderSchema.parse(req.body);
    const order = splitOrder(input);
    orderStore.save(order);
    res.status(201).json(formatOrder(order));
  } catch (err) {
    next(err);
  }
});

router.get('/history', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { type, status, limit, offset } = req.query;

    const filters = {
      type: type as 'BUY' | 'SELL' | undefined,
      status: status as 'PENDING' | 'SCHEDULED' | 'EXECUTED' | undefined,
      limit: limit !== undefined ? parseInt(String(limit), 10) : undefined,
      offset: offset !== undefined ? parseInt(String(offset), 10) : undefined,
    };

    if (filters.type !== undefined && !['BUY', 'SELL'].includes(filters.type)) {
      res.status(400).json({ error: 'type must be BUY or SELL', timestamp: new Date().toISOString(), path: req.originalUrl });
      return;
    }

    if (filters.status !== undefined && !['PENDING', 'SCHEDULED', 'EXECUTED'].includes(filters.status)) {
      res.status(400).json({ error: 'status must be PENDING, SCHEDULED, or EXECUTED', timestamp: new Date().toISOString(), path: req.originalUrl });
      return;
    }

    if (filters.limit !== undefined && (isNaN(filters.limit) || filters.limit <= 0)) {
      res.status(400).json({ error: 'limit must be a positive integer', timestamp: new Date().toISOString(), path: req.originalUrl });
      return;
    }

    if (filters.offset !== undefined && (isNaN(filters.offset) || filters.offset < 0)) {
      res.status(400).json({ error: 'offset must be a non-negative integer', timestamp: new Date().toISOString(), path: req.originalUrl });
      return;
    }

    const { orders, total } = orderStore.findAll(filters);

    res.status(200).json({
      total,
      page: {
        offset: filters.offset ?? 0,
        limit: filters.limit ?? total,
        count: orders.length,
      },
      orders: orders.map(formatOrder),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id } = req.params;
    const order = orderStore.findById(id);

    if (!order) {
      res.status(404).json({
        error: 'Order not found',
        orderId: id,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
      });
      return;
    }

    res.status(200).json(formatOrder(order));
  } catch (err) {
    next(err);
  }
});

export default router;
