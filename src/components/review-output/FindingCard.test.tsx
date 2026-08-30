import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Finding } from '../../hooks/useReviewStream/types';
import FindingCard from './FindingCard';

const sampleFinding: Finding = {
  id: 'SEC-1',
  severity: 'high',
  category: 'security',
  line: 'L42',
  title: 'SQL injection en query de búsqueda',
  explanation: 'Concatenación directa de input del usuario en SQL.',
  fix: 'const q = db.query("SELECT * FROM users WHERE name = $1", [name]);',
};

describe('FindingCard', () => {
  it('muestra el título, explicación y fix', () => {
    render(<FindingCard finding={sampleFinding} />);
    expect(screen.getByRole('heading', { name: /sql injection/i })).toBeInTheDocument();
    expect(screen.getByText(/concatenación directa/i)).toBeInTheDocument();
    expect(screen.getByText(/\$1/)).toBeInTheDocument();
  });

  it('muestra la severidad y la línea', () => {
    render(<FindingCard finding={sampleFinding} />);
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('L42')).toBeInTheDocument();
  });

  it('muestra la categoría legible (con guiones bajos a espacios)', () => {
    render(<FindingCard finding={sampleFinding} />);
    expect(screen.getByText('security')).toBeInTheDocument();
  });
});
