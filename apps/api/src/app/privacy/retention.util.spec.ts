import { calendarMonthsAgo } from './retention.util';

describe('calendarMonthsAgo', () => {
  it('subtracts calendar months in UTC without overflowing month ends', () => {
    expect(calendarMonthsAgo(6, new Date('2026-08-31T14:15:16.123Z')).toISOString()).toBe('2026-02-28T14:15:16.123Z');
  });

  it('keeps leap days when the target February permits them', () => {
    expect(calendarMonthsAgo(6, new Date('2024-08-31T00:00:00Z')).toISOString()).toBe('2024-02-29T00:00:00.000Z');
    expect(calendarMonthsAgo(12, new Date('2024-02-29T00:00:00Z')).toISOString()).toBe('2023-02-28T00:00:00.000Z');
  });

  it('does not mutate the supplied date', () => {
    const now = new Date('2026-10-09T12:00:00Z');
    expect(calendarMonthsAgo(6, now).toISOString()).toBe('2026-04-09T12:00:00.000Z');
    expect(now.toISOString()).toBe('2026-10-09T12:00:00.000Z');
  });
});
