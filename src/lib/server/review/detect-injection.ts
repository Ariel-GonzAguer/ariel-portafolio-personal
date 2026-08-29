/**
 * Detector de intentos de prompt injection.
 *
 * A diferencia de validate-diff (que rechaza), este módulo SOLO loguea.
 * El sanitizer ya neutralizó la mayoría de los vectores (backticks,
 * control chars, líneas largas). Este detector captura los intentos
 * obvios para auditoría y métricas.
 *
 * FASE 5 (seguridad): el handler llama a detectInjection() y loguea
 * con console.warn. En producción, Netlify captura los logs.
 */

/**
 * Helper para construir un patrón tolerante a separadores variables.
 * Acepta espacio, tab, newline, guion bajo y guion entre palabras, para
 * capturar variantes como `ignore_previous_instructions`,
 * `ignore-previous-instructions` o `ignore\nprevious\ninstructions`.
 *
 * Cada part puede ser una palabra literal o un grupo (opcional con "?"
 * al final). flex() se encarga de meter `[\s_-]+` entre cada part
 * (opcional cuando el grupo entero es opcional, obligatorio en otro caso).
 */
function flex(...parts: string[]): string {
  const out: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;
    const isLast = i === parts.length - 1;
    const isOptional = part.endsWith('?');
    if (isOptional) {
      const inner = part.slice(0, -1);
      out.push(`(?:${inner}[\\s_-]+)?`);
    } else if (isLast) {
      out.push(part);
    } else {
      out.push(`${part}[\\s_-]+`);
    }
  }
  return out.join('');
}

const INJECTION_PATTERNS: { re: RegExp; label: string }[] = [
  {
    re: new RegExp(flex('ignore', '(all)?', '(previous|prior|above)', 'instructions'), 'i'),
    label: 'ignore-previous',
  },
  { re: /<\s*system\s*>/i, label: 'system-tag' },
  { re: new RegExp(flex('you', 'are', 'now'), 'i'), label: 'role-override' },
  { re: /\bDAN\b/i, label: 'dan-jailbreak' },
  {
    re: new RegExp(`\\b(${flex('developer', 'mode')}|${flex('system', 'mode')})\\b`, 'i'),
    label: 'developer-mode',
  },
  {
    re: new RegExp(flex('reveal', '(the)?', '(system|initial)', 'prompt'), 'i'),
    label: 'reveal-prompt',
  },
  {
    re: new RegExp(flex('disregard', '(all)?', '(previous|prior)', '(rules|instructions)'), 'i'),
    label: 'disregard-rules',
  },
];

export interface InjectionMatch {
  label: string;
  index: number;
  match: string;
}

export function detectInjection(input: string): InjectionMatch[] {
  const matches: InjectionMatch[] = [];
  for (const { re, label } of INJECTION_PATTERNS) {
    // Forzar flag 'g' para que exec() avance lastIndex tras cada match.
    // Sin 'g', exec() siempre arranca desde 0 y devuelve el mismo match
    // infinitamente, causando un loop sin progreso (bug preexistente que
    // se camuflaba porque los tests verificaban result[0] o length >= N).
    const flags = re.flags.includes('g') ? re.flags : `${re.flags}g`;
    const globalRe = new RegExp(re.source, flags);
    let m: RegExpExecArray | null;
    while ((m = globalRe.exec(input)) !== null) {
      matches.push({ label, index: m.index, match: m[0] });
      // Protección adicional contra matches de longitud 0.
      if (m.index === globalRe.lastIndex) globalRe.lastIndex++;
    }
  }
  return matches;
}

/**
 * Helper para loguear de forma consistente.
 * Trunca a 200 chars para no spamear los logs con payloads enormes.
 */
export function logInjectionAttempt(
  matches: InjectionMatch[],
  context: { ip?: string; diffLength: number },
): void {
  if (matches.length === 0) return;
  const labels = [...new Set(matches.map((m) => m.label))].join(',');
  const preview = matches[0]?.match.slice(0, 200) ?? '';
  console.warn(
    `[security] prompt injection attempt: labels=${labels} ip=${context.ip ?? 'unknown'} diffLength=${context.diffLength} preview=${JSON.stringify(preview)}`,
  );
}
