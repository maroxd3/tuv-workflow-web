import { describe, it, expect } from 'vitest';
import { isoDate, addDays, fmtDate, fmtDateLong, dayName, dayShort, toIsoDateStr, toTimeStr } from '../../utils/date';

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

describe('toIsoDateStr — DB-Wert (String | Date) → "yyyy-mm-dd"', () => {
  it('schneidet ISO-Strings auf den Datum-Anteil', () => {
    expect(toIsoDateStr('2026-07-10')).toBe('2026-07-10');
    expect(toIsoDateStr('2026-07-10T08:00:00.000Z')).toBe('2026-07-10');
  });

  it('formatiert Date-Objekte in LOKAL-Zeit (nicht UTC)', () => {
    // new Date(y, m, d) ist lokal Mitternacht — in Zeitzonen westlich von
    // UTC würde eine UTC-Formatierung hier den Vortag liefern.
    expect(toIsoDateStr(new Date(2026, 6, 10))).toBe('2026-07-10');
  });

  it('liefert "" für null/undefined', () => {
    expect(toIsoDateStr(null)).toBe('');
    expect(toIsoDateStr(undefined)).toBe('');
  });
});

describe('toTimeStr — DB-Wert (String | Date) → "HH:MM"', () => {
  it('schneidet Sekunden ab', () => {
    expect(toTimeStr('08:30:00')).toBe('08:30');
    expect(toTimeStr('08:30')).toBe('08:30');
  });

  it('formatiert Date-Objekte mit Zero-Padding', () => {
    expect(toTimeStr(new Date(2026, 6, 10, 8, 5))).toBe('08:05');
  });

  it('liefert null für leere Werte', () => {
    expect(toTimeStr(null)).toBeNull();
    expect(toTimeStr(undefined)).toBeNull();
    expect(toTimeStr('')).toBeNull();
  });
});

describe('dayShort', () => {
  it('returns a short German weekday name', () => {
    const result = dayShort('2024-01-01'); // Monday
    expect(result.toLowerCase()).toMatch(/^mo/);
  });
});
