import { Router } from 'express';
import ordersRouter from './orders.routes';
import healthRouter from './health.routes';

const router = Router();

router.use('/orders', ordersRouter);
router.use('/health', healthRouter);

export default router;
