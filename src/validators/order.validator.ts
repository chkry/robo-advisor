import { z } from 'zod';

const stockAllocationSchema = z.object({
  ticker: z
    .string()
    .min(1, 'Ticker must not be empty')
    .max(10, 'Ticker must be at most 10 characters')
    .regex(/^[A-Z0-9.^-]+$/, 'Ticker must contain only uppercase letters, digits, or . ^ -')
    .transform((v) => v.toUpperCase()),
  weight: z
    .number({ required_error: 'weight is required', invalid_type_error: 'weight must be a number' })
    .gt(0, 'weight must be greater than 0')
    .lte(1, 'weight must be at most 1'),
  marketPrice: z
    .number({ invalid_type_error: 'marketPrice must be a number' })
    .gt(0, 'marketPrice must be greater than 0')
    .optional(),
});

export const createOrderSchema = z
  .object({
    portfolio: z
      .array(stockAllocationSchema)
      .min(1, 'Portfolio must contain at least one stock')
      .max(50, 'Portfolio must not exceed 50 stocks'),
    totalAmount: z
      .number({ required_error: 'totalAmount is required', invalid_type_error: 'totalAmount must be a number' })
      .gt(0, 'totalAmount must be greater than 0'),
    type: z.enum(['BUY', 'SELL'], {
      required_error: 'type is required',
      invalid_type_error: 'type must be BUY or SELL',
    }),
  })
  .superRefine((data, ctx) => {
    const totalWeight = data.portfolio.reduce((sum, s) => sum + s.weight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.001) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['portfolio'],
        message: `Portfolio weights must sum to 1.0 (got ${totalWeight.toFixed(6)})`,
      });
    }

    const tickers = data.portfolio.map((s) => s.ticker.toUpperCase());
    const unique = new Set(tickers);
    if (unique.size !== tickers.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['portfolio'],
        message: 'Portfolio contains duplicate tickers',
      });
    }
  });

export const orderHistoryQuerySchema = z.object({
  type: z.enum(['BUY', 'SELL']).optional(),
  status: z.enum(['PENDING', 'SCHEDULED', 'EXECUTED']).optional(),
  limit: z
    .string()
    .optional()
    .transform((v) => (v !== undefined ? parseInt(v, 10) : undefined))
    .refine((v) => v === undefined || (Number.isInteger(v) && v > 0), {
      message: 'limit must be a positive integer',
    }),
  offset: z
    .string()
    .optional()
    .transform((v) => (v !== undefined ? parseInt(v, 10) : undefined))
    .refine((v) => v === undefined || (Number.isInteger(v) && v >= 0), {
      message: 'offset must be a non-negative integer',
    }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderHistoryQuery = z.infer<typeof orderHistoryQuerySchema>;
