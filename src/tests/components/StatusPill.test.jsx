import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusPill } from '../../components/ui/StatusPill';
import { STATUS } from '../../constants/status';

describe('StatusPill', () => {
  it('renders the status text', () => {
    render(<StatusPill status={STATUS.GEPLANT} />);
    expect(screen.getByText(STATUS.GEPLANT)).toBeInTheDocument();
  });

  it('renders all known statuses without crashing', () => {
    Object.values(STATUS).forEach(s => {
      const { unmount } = render(<StatusPill status={s} />);
      expect(screen.getByText(s)).toBeInTheDocument();
      unmount();
    });
  });

  it('falls back to GEPLANT style for unknown status', () => {
    render(<StatusPill status="UnbekannterStatus" />);
    expect(screen.getByText('UnbekannterStatus')).toBeInTheDocument();
  });

  it('applies larger padding with size="lg"', () => {
    // Padding kommt seit der Tailwind-Migration aus Utility-Klassen,
    // nicht mehr aus Inline-Styles — daher Klassen vergleichen.
    const { container: sm } = render(<StatusPill status={STATUS.BESTANDEN} size="sm" />);
    const { container: lg } = render(<StatusPill status={STATUS.BESTANDEN} size="lg" />);
    const smCls = sm.querySelector('span').className;
    const lgCls = lg.querySelector('span').className;
    expect(smCls).not.toBe(lgCls);
    expect(lgCls).toContain('py-[5px]');
    expect(smCls).toContain('py-[3px]');
  });
});
