import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('sonner', () => {
  const fn = vi.fn();
  fn.success = vi.fn();
  fn.error = vi.fn();
  fn.warning = vi.fn();
  return { toast: fn };
});

import { toast as sonner } from 'sonner';
import { useToasts } from '../../hooks/useToasts';

describe('useToasts', () => {
  it('starts with an empty toast list', () => {
    const { result } = renderHook(() => useToasts());
    expect(result.current.toasts).toEqual([]);
  });

  it('calls sonner.success for success type', () => {
    const { result } = renderHook(() => useToasts());
    result.current.add('Gespeichert', 'success');
    expect(sonner.success).toHaveBeenCalledWith('Gespeichert');
  });

  it('calls sonner.error for error type', () => {
    const { result } = renderHook(() => useToasts());
    result.current.add('Fehler', 'error');
    expect(sonner.error).toHaveBeenCalledWith('Fehler');
  });

  it('calls sonner.warning for warn type', () => {
    const { result } = renderHook(() => useToasts());
    result.current.add('Achtung', 'warn');
    expect(sonner.warning).toHaveBeenCalledWith('Achtung');
  });

  it('calls sonner directly for info type', () => {
    const { result } = renderHook(() => useToasts());
    result.current.add('Info');
    expect(sonner).toHaveBeenCalledWith('Info');
  });

  it('defaults to info type when no type given', () => {
    const { result } = renderHook(() => useToasts());
    result.current.add('Test');
    expect(sonner).toHaveBeenCalledWith('Test');
  });
});
