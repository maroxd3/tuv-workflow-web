import { describe, it, expect } from 'vitest';
import { MANGEL_KATALOG_EINTRAEGE, MANGEL_KATALOG_GRUPPEN, MANGEL_KATEGORIEN } from '../../constants/mangel';
import { hatBlockierendenMangel, hatHauptmangel } from '../../utils/mangel';

describe('hatBlockierendenMangel', () => {
  it('returns false for empty list', () => {
    expect(hatBlockierendenMangel([])).toBe(false);
  });

  it('returns false for null or undefined', () => {
    expect(hatBlockierendenMangel(null)).toBeFalsy();
    expect(hatBlockierendenMangel(undefined)).toBeFalsy();
  });

  it('returns false when only non-blocking defects (OM, GM)', () => {
    expect(hatBlockierendenMangel([{ kategorieCode: 'OM' }, { kategorieCode: 'GM' }])).toBe(false);
  });

  it('returns true for EM (Erheblicher Mangel)', () => {
    expect(hatBlockierendenMangel([{ kategorieCode: 'GM' }, { kategorieCode: 'EM' }])).toBe(true);
  });

  it('returns true for GfM (Gefährlicher Mangel)', () => {
    expect(hatBlockierendenMangel([{ kategorieCode: 'EM' }, { kategorieCode: 'GfM' }])).toBe(true);
  });

  it('returns true even if EM is the only defect', () => {
    expect(hatBlockierendenMangel([{ kategorieCode: 'EM' }])).toBe(true);
  });

  it('returns true even if GfM is the only defect', () => {
    expect(hatBlockierendenMangel([{ kategorieCode: 'GfM' }])).toBe(true);
  });

  it('ignores behoben=true Maengel', () => {
    expect(hatBlockierendenMangel([{ kategorieCode: 'EM', behoben: true }])).toBe(false);
    expect(hatBlockierendenMangel([{ kategorieCode: 'GfM', behoben: true }])).toBe(false);
  });

  it('counts unbehoben blocking defect even alongside behoben blocking one', () => {
    expect(hatBlockierendenMangel([
      { kategorieCode: 'EM', behoben: true },
      { kategorieCode: 'EM', behoben: false },
    ])).toBe(true);
  });

  it('hatHauptmangel is an alias for hatBlockierendenMangel', () => {
    expect(hatHauptmangel).toBe(hatBlockierendenMangel);
  });
});

describe('MANGEL_KATALOG', () => {
  it('contains grouped catalog entries', () => {
    expect(MANGEL_KATALOG_GRUPPEN.length).toBeGreaterThan(0);
    expect(MANGEL_KATALOG_EINTRAEGE.length).toBeGreaterThan(50);
  });

  it('uses unique codes and known categories', () => {
    const codes = MANGEL_KATALOG_EINTRAEGE.map(e => e.code);
    expect(new Set(codes).size).toBe(codes.length);

    MANGEL_KATALOG_EINTRAEGE.forEach(e => {
      expect(Object.keys(MANGEL_KATEGORIEN)).toContain(e.kat);
    });
  });

  it('uses only HU-Richtlinie categories', () => {
    const allowed = new Set(['OM', 'GM', 'EM', 'GfM']);
    MANGEL_KATALOG_EINTRAEGE.forEach(e => {
      expect(allowed.has(e.kat)).toBe(true);
    });
  });
});
