import config from '../config/app.config';

const US_MARKET_HOLIDAYS: Set<string> = new Set([
  // 2025
  '2025-01-01', // New Year's Day
  '2025-01-20', // MLK Day
  '2025-02-17', // Presidents Day
  '2025-04-18', // Good Friday
  '2025-05-26', // Memorial Day
  '2025-06-19', // Juneteenth
  '2025-07-04', // Independence Day
  '2025-09-01', // Labor Day
  '2025-11-27', // Thanksgiving
  '2025-12-25', // Christmas

  // 2026
  '2026-01-01', // New Year's Day
  '2026-01-19', // MLK Day
  '2026-02-16', // Presidents Day
  '2026-04-03', // Good Friday
  '2026-05-25', // Memorial Day
  '2026-06-19', // Juneteenth
  '2026-07-03', // Independence Day (observed, falls on Friday)
  '2026-09-07', // Labor Day
  '2026-11-26', // Thanksgiving
  '2026-12-25', // Christmas

  // 2027
  '2027-01-01', // New Year's Day
  '2027-01-18', // MLK Day
  '2027-02-15', // Presidents Day
  '2027-03-26', // Good Friday
  '2027-05-31', // Memorial Day
  '2027-06-18', // Juneteenth (observed)
  '2027-07-05', // Independence Day (observed, falls on Monday)
  '2027-09-06', // Labor Day
  '2027-11-25', // Thanksgiving
  '2027-12-24', // Christmas (observed)
]);

function isEasternDST(date: Date): boolean {
  const year = date.getUTCFullYear();

  // DST begins: 2nd Sunday in March at 2:00 AM ET
  const march = new Date(Date.UTC(year, 2, 1));
  const marchDay = march.getUTCDay();
  const dstStart = new Date(Date.UTC(year, 2, 8 + ((7 - marchDay) % 7), 7)); // 2AM ET = 7 UTC

  // DST ends: 1st Sunday in November at 2:00 AM ET
  const november = new Date(Date.UTC(year, 10, 1));
  const novDay = november.getUTCDay();
  const dstEnd = new Date(Date.UTC(year, 10, 1 + ((7 - novDay) % 7), 6)); // 2AM ET = 6 UTC

  return date >= dstStart && date < dstEnd;
}

function getMarketOpenUTC(date: Date): Date {
  const isDST = isEasternDST(date);
  const utcOffset = isDST ? 4 : 5; // EDT = UTC-4, EST = UTC-5
  const openHourUTC = config.market.openHourET + utcOffset;
  const openMinuteUTC = config.market.openMinuteET;

  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    openHourUTC,
    openMinuteUTC,
    0,
    0,
  ));
}

function toISODateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6; // Sunday=0, Saturday=6
}

function isHoliday(date: Date): boolean {
  return US_MARKET_HOLIDAYS.has(toISODateString(date));
}

function isTradingDay(date: Date): boolean {
  return !isWeekend(date) && !isHoliday(date);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function getNextTradingExecution(from: Date): Date {
  const marketOpen = getMarketOpenUTC(from);
  const candidate = new Date(from);

  // If right now is a trading day and market hasn't opened yet, schedule today
  if (isTradingDay(candidate) && from < marketOpen) {
    return marketOpen;
  }

  // Otherwise advance to the next trading day
  let next = addDays(candidate, 1);
  while (!isTradingDay(next)) {
    next = addDays(next, 1);
  }

  return getMarketOpenUTC(next);
}

export function isCurrentlyTradingDay(date: Date): boolean {
  return isTradingDay(date);
}
