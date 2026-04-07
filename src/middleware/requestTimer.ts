import { Request, Response, NextFunction } from 'express';

export function requestTimer(req: Request, res: Response, next: NextFunction): void {
  const startNs = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startNs) / 1_000_000;
    const status = res.statusCode;
    const method = req.method;
    const path = req.originalUrl;
    const timestamp = new Date().toISOString();

    const statusColor = status >= 500 ? '\x1b[31m'  // red
      : status >= 400 ? '\x1b[33m'                   // yellow
      : status >= 300 ? '\x1b[36m'                   // cyan
      : '\x1b[32m';                                   // green

    const reset = '\x1b[0m';
    const dim = '\x1b[2m';

    console.log(
      `${dim}${timestamp}${reset} ${statusColor}${status}${reset} ${method} ${path} ${dim}${durationMs.toFixed(2)}ms${reset}`,
    );
  });

  next();
}
