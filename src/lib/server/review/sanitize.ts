/**
 * Sanitizador del input del usuario antes de enviarlo a OpenAI.
 *
 * El input del usuario es código que va a parar al prompt del LLM.
 * Aunque validate-diff ya rechaza binarios y headers mal formados,
 * el contenido legítimo puede tener strings que el modelo interpretaría
 * como instrucciones. El sanitizer neutraliza los vectores obvios sin
 * romper diffs legítimos.
 *
 * Reglas:
 * - Escapa triple backticks ``` para romper intentos de "code fence escape"
 *   donde el usuario cierra el bloque que rodea el diff y mete texto libre.
 * - Quita caracteres de control (NUL, BEL, etc.) que no son válidos en
 *   código fuente y pueden romper parsers.
 * - Trunca líneas individuales a MAX_LINE_LENGTH para evitar token stuffing
 *   (una sola línea de 50 KB satura la ventana de contexto del modelo).
 * - Mantiene \n, \t y \r (válidos en diffs).
 *
 * Limitación conocida: las variantes con snake_case o kebab-case
 * (ej: `ignore_previous_instructions`) NO son detectadas por las regex
 * actuales de detect-injection. Mejora pendiente.
 */

const MAX_LINE_LENGTH = 2000;
const BACKTICK_TRIPLE = '```';
// Caracteres de control que NO permitimos: 0x00-0x08, 0x0B, 0x0C, 0x0E-0x1F, 0x7F
// Mantenemos: 0x09 (\t), 0x0A (\n), 0x0D (\r)
// eslint-disable-next-line no-control-regex -- intencional: filtra NUL, BEL, etc.
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/**
 * Reemplaza triple backticks por una secuencia Unicode visualmente similar
 * pero que el modelo NO interpreta como cierre de code fence.
 * Usamos un caracter cirílico que parece un backtick (ʼ) repetido 3 veces.
 */
function escapeTripleBackticks(input: string): string {
  return input.split(BACKTICK_TRIPLE).join('\u2019\u2019\u2019');
}

function stripControlChars(input: string): string {
  return input.replace(CONTROL_CHARS, '');
}

function truncateLongLines(input: string): string {
  return input
    .split('\n')
    .map((line) => (line.length > MAX_LINE_LENGTH ? line.slice(0, MAX_LINE_LENGTH) + '…' : line))
    .join('\n');
}

export function sanitizeDiff(input: string): string {
  let result = input;
  result = escapeTripleBackticks(result);
  result = stripControlChars(result);
  result = truncateLongLines(result);
  return result;
}
