import { Router } from 'express';
import ordersRouter from './orders.routes';
import healthRouter from './health.routes';
import stocksRouter from './stocks.routes';

const router = Router();

router.use('/stocks', stocksRouter);
router.use('/orders', ordersRouter);
router.use('/health', healthRouter);

export default router;
