import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SeverityBadge from './SeverityBadge';

describe('SeverityBadge', () => {
  it('muestra el label de la severidad', () => {
    render(<SeverityBadge severity="critical" />);
    expect(screen.getByText('critical')).toBeInTheDocument();
  });

  it('incluye el aria-label con la severidad', () => {
    render(<SeverityBadge severity="high" />);
    expect(screen.getByLabelText(/severidad high/i)).toBeInTheDocument();
  });

  it('renderiza las 5 severidades sin tirar error', () => {
    const severities = ['critical', 'high', 'medium', 'low', 'info'] as const;
    for (const severity of severities) {
      const { unmount } = render(<SeverityBadge severity={severity} />);
      expect(screen.getByText(severity)).toBeInTheDocument();
      unmount();
    }
  });
});
