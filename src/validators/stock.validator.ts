import { z } from 'zod';

export const createStockSchema = z.object({
  ticker: z
    .string()
    .min(1, 'ticker must not be empty')
    .max(10, 'ticker must be at most 10 characters')
    .regex(/^[A-Z0-9.^-]+$/, 'ticker must contain only uppercase letters, digits, or . ^ -')
    .transform((v) => v.toUpperCase()),
  name: z
    .string()
    .min(1, 'name must not be empty')
    .max(100, 'name must be at most 100 characters'),
  price: z
    .number({ required_error: 'price is required', invalid_type_error: 'price must be a number' })
    .gt(0, 'price must be greater than 0'),
});

export type CreateStockInput = z.infer<typeof createStockSchema>;
