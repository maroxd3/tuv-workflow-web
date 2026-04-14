import { describe, it, expect } from 'vitest';
import { uid, isoDate, addDays, fmtDate, fmtDateLong, dayName, dayShort } from '../../utils/date';

describe('uid', () => {
  it('returns a non-empty string', () => {
    expect(typeof uid()).toBe('string');
    expect(uid().length).toBeGreaterThan(0);
  });

  it('generates unique values', () => {
    const ids = new Set(Array.from({ length: 100 }, uid));
    expect(ids.size).toBe(100);
  });
});

describe('isoDate', () => {
  it('formats today as YYYY-MM-DD', () => {
    expect(isoDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('formats a specific date correctly', () => {
    expect(isoDate(new Date('2024-03-05'))).toBe('2024-03-05');
  });

  it('zero-pads month and day', () => {
    expect(isoDate(new Date('2024-01-07'))).toBe('2024-01-07');
  });
});

describe('addDays', () => {
  it('adds positive days', () => {
    expect(addDays('2024-01-01', 1)).toBe('2024-01-02');
    expect(addDays('2024-01-01', 30)).toBe('2024-01-31');
  });

  it('subtracts negative days', () => {
    expect(addDays('2024-01-10', -5)).toBe('2024-01-05');
  });

  it('crosses month boundaries', () => {
    expect(addDays('2024-01-31', 1)).toBe('2024-02-01');
  });

  it('crosses year boundaries', () => {
    expect(addDays('2023-12-31', 1)).toBe('2024-01-01');
  });

  it('adding zero days returns same date', () => {
    expect(addDays('2024-06-15', 0)).toBe('2024-06-15');
  });
});

describe('fmtDate', () => {
  it('formats a date in German DD.MM.YYYY format', () => {
    expect(fmtDate('2024-03-05')).toBe('05.03.2024');
  });

  it('returns "—" for null or undefined', () => {
    expect(fmtDate(null)).toBe('—');
    expect(fmtDate(undefined)).toBe('—');
    expect(fmtDate('')).toBe('—');
  });

  it('returns "—" for invalid date string', () => {
    expect(fmtDate('not-a-date')).toBe('—');
  });
});

describe('fmtDateLong', () => {
  it('formats with full month name in German', () => {
    const result = fmtDateLong('2024-03-05');
    expect(result).toContain('2024');
    expect(result).toContain('März');
    expect(result).toContain('05');
  });

  it('returns "—" for empty input', () => {
    expect(fmtDateLong('')).toBe('—');
    expect(fmtDateLong(null)).toBe('—');
  });
});

describe('dayName', () => {
  it('returns a German weekday name', () => {
    const result = dayName('2024-01-01'); // Monday
    expect(result).toBe('Montag');
  });

  it('returns correct name for Sunday', () => {
    expect(dayName('2024-01-07')).toBe('Sonntag');
  });
});

describe('dayShort', () => {
  it('returns a short German weekday name', () => {
    const result = dayShort('2024-01-01'); // Monday
    expect(result.toLowerCase()).toMatch(/^mo/);
  });
});
