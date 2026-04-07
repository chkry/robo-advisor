import dotenv from 'dotenv';

dotenv.config();

function requirePositiveInt(value: string | undefined, name: string, defaultVal: number): number {
  if (value === undefined || value === '') return defaultVal;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed <= 0) {
    throw new Error(`Config error: ${name} must be a positive integer, got "${value}"`);
  }
  return parsed;
}

function requirePositiveFloat(value: string | undefined, name: string, defaultVal: number): number {
  if (value === undefined || value === '') return defaultVal;
  const parsed = parseFloat(value);
  if (isNaN(parsed) || parsed <= 0) {
    throw new Error(`Config error: ${name} must be a positive number, got "${value}"`);
  }
  return parsed;
}

const config = {
  port: requirePositiveInt(process.env['PORT'], 'PORT', 3000),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',

  fixedPrice: requirePositiveFloat(process.env['FIXED_PRICE'], 'FIXED_PRICE', 100),

  decimalPrecision: requirePositiveInt(
    process.env['DECIMAL_PRECISION'],
    'DECIMAL_PRECISION',
    3,
  ),

  market: {
    openHourET: requirePositiveInt(
      process.env['MARKET_OPEN_HOUR_ET'],
      'MARKET_OPEN_HOUR_ET',
      9,
    ),
    openMinuteET: (() => {
      const v = process.env['MARKET_OPEN_MINUTE_ET'];
      if (v === undefined || v === '') return 30;
      const parsed = parseInt(v, 10);
      if (isNaN(parsed) || parsed < 0 || parsed > 59) {
        throw new Error(`Config error: MARKET_OPEN_MINUTE_ET must be 0–59, got "${v}"`);
      }
      return parsed;
    })(),
  },

  databaseUrl: process.env['DATABASE_URL'] ?? '',
  redisUrl: process.env['REDIS_URL'] ?? 'redis://localhost:6379',
} as const;

export type AppConfig = typeof config;
export default config;
