import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BtnP, BtnG, IconBtn } from '../../components/ui/buttons';
import { Shield } from 'lucide-react';

describe('BtnP (Primary Button)', () => {
  it('renders its label', () => {
    render(<BtnP onClick={() => {}}>Speichern</BtnP>);
    expect(screen.getByText('Speichern')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const fn = vi.fn();
    render(<BtnP onClick={fn}>Klick</BtnP>);
    fireEvent.click(screen.getByText('Klick'));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<BtnP onClick={() => {}} disabled>Gesperrt</BtnP>);
    expect(screen.getByText('Gesperrt').closest('button')).toBeDisabled();
  });

  it('does not fire onClick when disabled', () => {
    const fn = vi.fn();
    render(<BtnP onClick={fn} disabled>Gesperrt</BtnP>);
    fireEvent.click(screen.getByText('Gesperrt'));
    expect(fn).not.toHaveBeenCalled();
  });

  it('renders an icon when provided', () => {
    render(<BtnP onClick={() => {}} icon={Shield}>Mit Icon</BtnP>);
    expect(screen.getByText('Mit Icon')).toBeInTheDocument();
  });
});

describe('BtnG (Ghost Button)', () => {
  it('renders its label', () => {
    render(<BtnG onClick={() => {}}>Abbrechen</BtnG>);
    expect(screen.getByText('Abbrechen')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const fn = vi.fn();
    render(<BtnG onClick={fn}>Klick</BtnG>);
    fireEvent.click(screen.getByText('Klick'));
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('IconBtn', () => {
  it('renders with a title attribute', () => {
    render(<IconBtn onClick={() => {}} icon={<Shield size={12} />} title="Bearbeiten" color="white" />);
    expect(screen.getByTitle('Bearbeiten')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const fn = vi.fn();
    render(<IconBtn onClick={fn} icon={<Shield size={12} />} color="white" />);
    fireEvent.click(screen.getByRole('button'));
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
