import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToasts } from '../../hooks/useToasts';

describe('useToasts', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('starts with an empty toast list', () => {
    const { result } = renderHook(() => useToasts());
    expect(result.current.toasts).toEqual([]);
  });

  it('adds a toast when add() is called', () => {
    const { result } = renderHook(() => useToasts());
    act(() => { result.current.add('Gespeichert', 'success'); });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].msg).toBe('Gespeichert');
    expect(result.current.toasts[0].type).toBe('success');
  });

  it('auto-removes toast after duration', () => {
    const { result } = renderHook(() => useToasts());
    act(() => { result.current.add('Hallo', 'info', 1000); });
    expect(result.current.toasts).toHaveLength(1);
    act(() => { vi.advanceTimersByTime(1100); });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('removes a toast manually via rm()', () => {
    const { result } = renderHook(() => useToasts());
    act(() => { result.current.add('Fehler', 'error'); });
    const id = result.current.toasts[0].id;
    act(() => { result.current.rm(id); });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('can stack multiple toasts', () => {
    const { result } = renderHook(() => useToasts());
    act(() => {
      result.current.add('Eins', 'info');
      result.current.add('Zwei', 'success');
      result.current.add('Drei', 'error');
    });
    expect(result.current.toasts).toHaveLength(3);
  });

  it('defaults to type "info" when no type given', () => {
    const { result } = renderHook(() => useToasts());
    act(() => { result.current.add('Test'); });
    expect(result.current.toasts[0].type).toBe('info');
  });
});
