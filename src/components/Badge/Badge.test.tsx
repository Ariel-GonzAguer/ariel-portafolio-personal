import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Badge from './Badge';

const props = {
  link: 'https://www.websitecarbon.com/website/arielgonzaguer-gatorojolab-com/',
  text: ['0.1g de CO2/Vista', 'WebSiteCarbon', '98% más limpia que otras páginas'],
  ariaLabel: 'Huella de carbono de este sitio según Website Carbon, se abre en una pestaña nueva',
};

describe('Badge', () => {
  it('renderiza los tres textos del badge', () => {
    render(<Badge {...props} />);
    expect(screen.getByText('0.1g de CO2/Vista')).toBeInTheDocument();
    expect(screen.getByText('WebSiteCarbon')).toBeInTheDocument();
    expect(screen.getByText('98% más limpia que otras páginas')).toBeInTheDocument();
  });

  it('enlaza a Website Carbon en una pestaña nueva', () => {
    render(<Badge {...props} />);
    const link = screen.getByRole('link', { name: /huella de carbono/i });
    expect(link).toHaveAttribute('href', props.link);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
