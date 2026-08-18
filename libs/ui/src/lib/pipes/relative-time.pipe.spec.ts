import { RelativeTimePipe } from './relative-time.pipe';

describe('RelativeTimePipe', () => {
  const pipe = new RelativeTimePipe();
  const now = new Date('2026-08-17T12:00:00Z');

  it('formats a value from a few hours ago', () => {
    expect(pipe.transform(new Date('2026-08-17T10:00:00Z'), now)).toBe('2 hours ago');
  });

  it('formats a value from yesterday', () => {
    expect(pipe.transform(new Date('2026-08-16T10:00:00Z'), now)).toBe('yesterday');
  });

  it('accepts an ISO string', () => {
    expect(pipe.transform('2026-08-12T12:00:00Z', now)).toBe('5 days ago');
  });

  it('returns an empty string for an invalid date', () => {
    expect(pipe.transform('not-a-date', now)).toBe('');
  });
});
