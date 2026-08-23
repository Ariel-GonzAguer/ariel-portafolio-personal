/**
 * Devuelve la clase Tailwind para el anillo de foco visible según el color indicado.
 * Cumple con WCAG 2.4.7 (foco visible).
 *
 * @example
 * focusClassName('red'); // 'focus-visible:outline-red-400 ...'
 */
export function focusClassName(color: 'red' | 'white' = 'red'): string {
  const ringColor = color === 'red' ? 'outline-red-400' : 'outline-white';
  return `focus-visible:outline-2 focus-visible:outline-offset-2 ${ringColor}`;
}
