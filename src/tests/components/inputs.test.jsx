import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Inp, Sel, Fld } from '../../components/ui/inputs';

describe('Inp', () => {
  it('renders with the given placeholder', () => {
    render(<Inp value="" onChange={() => {}} placeholder="B-TK 1234" />);
    expect(screen.getByPlaceholderText('B-TK 1234')).toBeInTheDocument();
  });

  it('calls onChange when user types', () => {
    const fn = vi.fn();
    render(<Inp value="" onChange={fn} placeholder="test" />);
    fireEvent.change(screen.getByPlaceholderText('test'), { target: { value: 'BMW' } });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('shows the current value', () => {
    render(<Inp value="München" onChange={() => {}} placeholder="" />);
    expect(screen.getByDisplayValue('München')).toBeInTheDocument();
  });
});

describe('Sel', () => {
  it('renders all options', () => {
    render(
      <Sel value="a" onChange={() => {}}>
        <option value="a">Option A</option>
        <option value="b">Option B</option>
      </Sel>
    );
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
  });

  it('calls onChange when selection changes', () => {
    const fn = vi.fn();
    render(
      <Sel value="a" onChange={fn}>
        <option value="a">A</option>
        <option value="b">B</option>
      </Sel>
    );
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'b' } });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('Fld', () => {
  it('renders label text', () => {
    render(<Fld label="Kennzeichen"><input /></Fld>);
    expect(screen.getByText('Kennzeichen')).toBeInTheDocument();
  });

  it('shows error message when error prop is provided', () => {
    render(<Fld label="Test" error="Pflichtfeld"><input /></Fld>);
    expect(screen.getByText('Pflichtfeld')).toBeInTheDocument();
  });

  it('does not show error when error prop is absent', () => {
    render(<Fld label="Test"><input /></Fld>);
    expect(screen.queryByText('Pflichtfeld')).not.toBeInTheDocument();
  });
});
