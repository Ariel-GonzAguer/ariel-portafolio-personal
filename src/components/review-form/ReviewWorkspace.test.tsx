import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ReviewWorkspace from './ReviewWorkspace';

describe('ReviewWorkspace', () => {
  it('muestra el form y el placeholder inicial', () => {
    render(<ReviewWorkspace />);
    expect(screen.getByLabelText(/pega tu unified diff/i)).toBeInTheDocument();
    expect(
      screen.getByText(/el resultado del review aparecerá aquí/i),
    ).toBeInTheDocument();
  });
});
