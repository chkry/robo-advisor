import { Router, Request, Response } from 'express';
import { HealthResponse } from '../models/order.model';
import config from '../config/app.config';

const router = Router();

router.get('/', (_req: Request, res: Response): void => {
  const body: HealthResponse = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.nodeEnv,
  };
  res.status(200).json(body);
});

export default router;
