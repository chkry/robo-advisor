import { Router, Request, Response, NextFunction } from 'express';
import { createStockSchema } from '../validators/stock.validator';
import { stockService } from '../services/stock.service';

const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const input = createStockSchema.parse(req.body);
    const { stock, created } = await stockService.upsert(input);
    res.status(created ? 201 : 200).json(stock);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stocks = await stockService.findAll();
    res.status(200).json({ total: stocks.length, stocks });
  } catch (err) {
    next(err);
  }
});

router.get('/:ticker', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ticker = req.params['ticker']!.toUpperCase();
    const stock = await stockService.findByTicker(ticker);
    if (!stock) {
      res.status(404).json({
        error: `Stock not found: ${ticker}`,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
      });
      return;
    }
    res.status(200).json(stock);
  } catch (err) {
    next(err);
  }
});

export default router;
