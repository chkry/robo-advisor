import { createApp } from './app';
import config from './config/app.config';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log('');
  console.log('  \x1b[1m Robo-Advisor Order Splitter API\x1b[0m');
  console.log('  \x1b[2m─────────────────────────────────────\x1b[0m');
  console.log(`  \x1b[32m✓\x1b[0m Server running on port \x1b[1m${config.port}\x1b[0m`);
  console.log(`  \x1b[32m✓\x1b[0m Environment: \x1b[1m${config.nodeEnv}\x1b[0m`);
  console.log(`  \x1b[32m✓\x1b[0m Fixed price: \x1b[1m$${config.fixedPrice}\x1b[0m`);
  console.log(`  \x1b[32m✓\x1b[0m Decimal precision: \x1b[1m${config.decimalPrecision}\x1b[0m`);
  console.log(`  \x1b[32m✓\x1b[0m Market open: \x1b[1m${config.market.openHourET}:${String(config.market.openMinuteET).padStart(2, '0')} ET\x1b[0m`);
  console.log('');
  console.log('  \x1b[2mEndpoints:\x1b[0m');
  console.log(`  \x1b[36mPOST\x1b[0m   /api/v1/orders`);
  console.log(`  \x1b[36mGET\x1b[0m    /api/v1/orders/history`);
  console.log(`  \x1b[36mGET\x1b[0m    /api/v1/orders/:id`);
  console.log(`  \x1b[36mGET\x1b[0m    /api/v1/health`);
  console.log('');
});

function shutdown(signal: string): void {
  console.log(`\n  \x1b[33m${signal} received. Shutting down gracefully...\x1b[0m`);
  server.close(() => {
    console.log('  \x1b[32m✓\x1b[0m Server closed.');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('  \x1b[31m✗\x1b[0m Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  console.error('\x1b[31m[FATAL] Uncaught Exception:\x1b[0m', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('\x1b[31m[FATAL] Unhandled Rejection:\x1b[0m', reason);
  process.exit(1);
});
