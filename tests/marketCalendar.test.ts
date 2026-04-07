import { getNextTradingExecution, isCurrentlyTradingDay } from '../src/services/marketCalendar.service';

// Market open is 9:30 ET. During EDT (summer) = 13:30 UTC, during EST (winter) = 14:30 UTC

describe('isCurrentlyTradingDay', () => {
  it('returns true for a weekday non-holiday', () => {
    // Tuesday 2026-04-07
    expect(isCurrentlyTradingDay(new Date('2026-04-07T10:00:00Z'))).toBe(true);
  });

  it('returns false for Saturday', () => {
    expect(isCurrentlyTradingDay(new Date('2026-04-11T10:00:00Z'))).toBe(false);
  });

  it('returns false for Sunday', () => {
    expect(isCurrentlyTradingDay(new Date('2026-04-12T10:00:00Z'))).toBe(false);
  });

  it('returns false for a US holiday (Christmas 2026)', () => {
    expect(isCurrentlyTradingDay(new Date('2026-12-25T10:00:00Z'))).toBe(false);
  });

  it('returns false for Good Friday 2026', () => {
    expect(isCurrentlyTradingDay(new Date('2026-04-03T10:00:00Z'))).toBe(false);
  });
});

describe('getNextTradingExecution', () => {
  it('schedules today if market has not opened yet (EDT: 13:30 UTC)', () => {
    // 2026-04-07 is Tuesday in EDT — market opens 13:30 UTC
    const before = new Date('2026-04-07T12:00:00Z');
    const result = getNextTradingExecution(before);
    expect(result.toISOString()).toBe('2026-04-07T13:30:00.000Z');
  });

  it('schedules next day if market already opened today', () => {
    // After 13:30 UTC on Tuesday → should go to Wednesday
    const after = new Date('2026-04-07T14:00:00Z');
    const result = getNextTradingExecution(after);
    expect(result.toISOString()).toBe('2026-04-08T13:30:00.000Z');
  });

  it('skips weekend — Friday after market → schedules Monday', () => {
    // 2026-04-10 is Friday, after market open → next is Monday 2026-04-13
    const friday = new Date('2026-04-10T20:00:00Z');
    const result = getNextTradingExecution(friday);
    expect(result.toISOString()).toBe('2026-04-13T13:30:00.000Z');
  });

  it('skips holiday — day before Good Friday → next trading day is Monday', () => {
    // 2026-04-02 Thursday after market close → Good Friday 04-03 is holiday → Monday 04-06
    const thursday = new Date('2026-04-02T20:00:00Z');
    const result = getNextTradingExecution(thursday);
    expect(result.toISOString()).toBe('2026-04-06T13:30:00.000Z');
  });

  it('uses correct UTC offset during winter (EST: 14:30 UTC)', () => {
    // 2026-01-06 Tuesday, before market open (13:00 UTC — in EST so opens at 14:30 UTC)
    const before = new Date('2026-01-06T13:00:00Z');
    const result = getNextTradingExecution(before);
    expect(result.toISOString()).toBe('2026-01-06T14:30:00.000Z');
  });
});
