import { describe, it, expect } from 'vitest';
import { MANGEL_KATALOG_EINTRAEGE, MANGEL_KATALOG_GRUPPEN, MANGEL_KATEGORIEN } from '../../constants/mangel';
import { hatHauptmangel } from '../../utils/mangel';

describe('hatHauptmangel', () => {
  it('returns false for empty list', () => {
    expect(hatHauptmangel([])).toBe(false);
  });

  it('returns false for null or undefined', () => {
    expect(hatHauptmangel(null)).toBeFalsy();
    expect(hatHauptmangel(undefined)).toBeFalsy();
  });

  it('returns false when only minor defects (OM, LM, EM)', () => {
    expect(hatHauptmangel([{ kat: 'OM' }, { kat: 'LM' }, { kat: 'EM' }])).toBe(false);
  });

  it('returns true for HM (Hauptmangel)', () => {
    expect(hatHauptmangel([{ kat: 'LM' }, { kat: 'HM' }])).toBe(true);
  });

  it('returns true for GM (Gefährlicher Mangel)', () => {
    expect(hatHauptmangel([{ kat: 'EM' }, { kat: 'GM' }])).toBe(true);
  });

  it('returns true even if HM is the only defect', () => {
    expect(hatHauptmangel([{ kat: 'HM' }])).toBe(true);
  });

  it('returns true even if GM is the only defect', () => {
    expect(hatHauptmangel([{ kat: 'GM' }])).toBe(true);
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
});
