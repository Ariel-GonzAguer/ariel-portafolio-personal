'use client';

import { useEffect, useState } from 'react';
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
 * Bloque de código con syntax highlighting (shiki).
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
        setHtml(result);
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
            setHtml(result);
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
