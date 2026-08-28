import { focusClassName } from '../../utils/a11y/a11y';

interface ReviewFormProps {
  onSubmit: (diff: string) => void;
  isLoading: boolean;
}

/**
 * Formulario para pegar un unified diff y disparar el review.
 *
 * FASE 1: textarea, honeypot y botón de submit. Sin manejo de errores avanzado.
 * FASE 3: se conecta a useReviewStream, se agrega botón "Load example" y validación inline.
 */
export default function ReviewForm({ onSubmit, isLoading }: ReviewFormProps) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const diff = formData.get('diff');
        if (typeof diff === 'string' && diff.trim().length > 0) {
          onSubmit(diff);
        }
      }}
      className="flex flex-col gap-4"
    >
      <label htmlFor="diff" className="text-sm font-semibold text-white/90">
        Pega tu unified diff
      </label>
      <textarea
        id="diff"
        name="diff"
        rows={12}
        placeholder={'--- a/src/utils.ts\n+++ b/src/utils.ts\n@@ -1,3 +1,4 @@\n...'}
        className={`border border-white/15 bg-white/3 p-4 font-mono text-sm text-white/90 ${focusClassName(
          'white',
        )}`}
        aria-describedby="diff-help"
        required
      />
      <p id="diff-help" className="text-xs text-gris-claro">
        Diff en formato unified (lo que produce <code>git diff</code>). Máximo 100 KB.
      </p>

      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px' }}
      />

      <button
        type="submit"
        disabled={isLoading}
        className={`self-start bg-red-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-white disabled:opacity-50 ${focusClassName('red')} cursor-pointer!`}
      >
        {isLoading ? 'Analizando…' : 'Revisar diff'}
      </button>
    </form>
  );
}
