'use client';

import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { createHighlighter, type Highlighter } from 'shiki';

interface CodeBlockProps {
  code: string;
  lang?: string;
}

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark'],
      langs: ['typescript', 'javascript', 'python', 'css', 'html', 'json', 'bash'],
    });
  }
  return highlighterPromise;
}

/**
 * Tags/attrs que shiki genera para tokens de syntax highlighting.
 * Si el HTML sale de esta allowlist, se elimina el contenido peligroso.
 */
const PURIFY_CONFIG = {
  ALLOWED_TAGS: ['pre', 'code', 'span', 'div', 'br', 'span', 'i', 'em', 'b', 'strong'],
  ALLOWED_ATTR: ['class', 'style'],
};

/**
 * Bloque de código con syntax highlighting (shiki) + sanitización (DOMPurify).
 *
 * Defensa-en-profundidad: shiki debería escapar el contenido del code,
 * pero confiamos solo en una librería (y un LLM controla parte del input).
 * DOMPurify elimina cualquier tag/atributo peligroso antes de que se
 * inyecte en el DOM vía dangerouslySetInnerHTML.
 *
 * Carga el highlighter una sola vez (singleton) y cachea el resultado.
 * Mientras carga, muestra el código sin highlighting.
 */
export default function CodeBlock({ code, lang = 'typescript' }: CodeBlockProps) {
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getHighlighter()
      .then((h) => {
        if (cancelled) return;
        const result = h.codeToHtml(code, {
          lang,
          theme: 'github-dark',
        });
        setHtml(sanitize(result));
      })
      .catch(() => {
        // Si falla la carga del lenguaje, fallback a typescript.
        getHighlighter()
          .then((h) => {
            if (cancelled) return;
            const result = h.codeToHtml(code, {
              lang: 'typescript',
              theme: 'github-dark',
            });
            setHtml(sanitize(result));
          })
          .catch(() => {});
      });
    return () => {
      cancelled = true;
    };
  }, [code, lang]);

  if (html) {
    return (
      <div
        className="mt-3 overflow-x-auto border border-white/10 text-xs [&_pre]:bg-[#0d1117] [&_pre]:p-3 [&_pre]:m-0"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  // Fallback: código sin highlighting mientras carga.
  return (
    <pre className="mt-3 overflow-x-auto border border-white/10 bg-black/30 p-3 text-xs text-white/90">
      <code>{code}</code>
    </pre>
  );
}

/**
 * Sanitiza HTML de shiki con DOMPurify antes de inyectarlo al DOM.
 *
 * Si falla la sanitización (caso extremo), devuelve string vacío para
 * no renderizar nada en lugar de un HTML potencialmente peligroso.
 */
function sanitize(html: string): string {
  try {
    return DOMPurify.sanitize(html, PURIFY_CONFIG);
  } catch {
    return '';
  }
}
