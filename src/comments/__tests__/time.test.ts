import { formatAge } from '../time';

const NOW = new Date('2026-03-20T12:00:00Z').getTime();
const ago = (ms: number) => NOW - ms;

describe('formatAge', () => {
  it('reads as an age for anything in the last week', () => {
    expect(formatAge(ago(5_000), NOW)).toBe('just now');
    expect(formatAge(ago(5 * 60_000), NOW)).toBe('5m');
    expect(formatAge(ago(3 * 3_600_000), NOW)).toBe('3h');
    expect(formatAge(ago(2 * 86_400_000), NOW)).toBe('2d');
  });

  it('falls back to a date once a week has passed', () => {
    expect(formatAge(ago(8 * 86_400_000), NOW)).toMatch(/Mar/);
  });

  it('never shows a negative age for a clock that is slightly behind', () => {
    expect(formatAge(NOW + 2_000, NOW)).toBe('just now');
  });
});
