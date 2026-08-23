/**
 * Devuelve la clase Tailwind para el anillo de foco visible según el color indicado.
 * Cumple con WCAG 2.4.7 (foco visible).
 *
 * @example
 * focusClassName('emerald'); // 'focus-visible:outline-emerald-300 ...'
 */
export function focusClassName(color: 'emerald' | 'white' = 'emerald'): string {
  const ringColor = color === 'emerald' ? 'outline-emerald-300' : 'outline-white';
  return `focus-visible:outline-2 focus-visible:outline-offset-2 ${ringColor}`;
}
