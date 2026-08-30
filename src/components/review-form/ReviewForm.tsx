import { useState, useSyncExternalStore } from 'react';
import { focusClassName } from '../../utils/a11y/a11y';
import { EXAMPLE_DIFFS, type ExampleDiff } from './ExampleDiffs';

interface ReviewFormProps {
  diff: string;
  onDiffChange: (diff: string) => void;
  onSubmit: (diff: string, botTrap: boolean) => void;
  onExampleSelect: (example: ExampleDiff) => void;
  isLoading: boolean;
  /**
   * Timestamp (ms epoch) hasta el cual el botón de submit queda
   * deshabilitado por cooldown de seguridad tras un intento de prompt
   * injection. Si es null, no hay cooldown activo.
   */
  cooldownUntil: number | null;
}

/**
 * Suscripción singleton al reloj del navegador para el countdown del
 * cooldown. `useSyncExternalStore` exige que `subscribe` Y `getSnapshot`
 * sean referencialmente estables entre renders, por eso viven a nivel
 * módulo. El truco clave: `getSnapshot` NO llama a `Date.now()` — lee
 * de una variable que solo se actualiza dentro del callback del
 * interval. Así React no detecta "cambio" en cada render y no entra
 * en loop infinito.
 *
 * Mantiene un único setInterval compartido por todos los consumidores
 * (un Set de callbacks) para no spamear timers. Emite un tick cada
 * 250 ms mientras hay al menos un listener activo.
 */
const clockListeners = new Set<() => void>();
let clockInterval: ReturnType<typeof setInterval> | null = null;
let currentTimeSnapshot = 0;

function subscribeToClock(callback: () => void): () => void {
  clockListeners.add(callback);
  if (clockInterval === null) {
    // Capturar el tiempo actual al arrancar para que el primer render
    // del consumidor tenga un valor útil.
    currentTimeSnapshot = Date.now();
    clockInterval = setInterval(() => {
      currentTimeSnapshot = Date.now();
      clockListeners.forEach((cb) => cb());
    }, 250);
  }
  return () => {
    clockListeners.delete(callback);
    if (clockListeners.size === 0 && clockInterval !== null) {
      clearInterval(clockInterval);
      clockInterval = null;
    }
  };
}

function getCurrentTimeSnapshot(): number {
  return currentTimeSnapshot;
}

function getServerTimeSnapshot(): number {
  return 0;
}

/**
 * Hook que devuelve la hora actual re-renderizando cada 250 ms.
 * En el server devuelve 0 para que el primer render sea determinístico.
 */
function useTickingNow(): number {
  return useSyncExternalStore(
    subscribeToClock,
    getCurrentTimeSnapshot,
    getServerTimeSnapshot,
  );
}

/**
 * Formulario para pegar un unified diff y disparar el review.
 *
 * FASE 3: el diff vive en estado controlado (lo trae el padre).
 * El selector de ejemplos precargados llena el textarea.
 *
 * Honeypot: doble checkbox.
 * - Visible: "Los gatos son geniales" (requerido para enviar).
 * - Oculto: checkbox con name="website" que los bots marcan pero los
 *   humanos no ven. Si el backend recibe `website: true`, devuelve
 *   200 silencioso sin gastar tokens de OpenAI.
 *
 * FASE 5 (seguridad): el botón se deshabilita durante el cooldown que
 * activa el padre cuando el server detecta prompt injection. El
 * countdown se actualiza vía `useSyncExternalStore` sobre el reloj
 * del navegador (cumple las reglas de React 19 sobre sincronización
 * con fuentes externas, sin setState en useEffect).
 */
export default function ReviewForm({
  diff,
  onDiffChange,
  onSubmit,
  onExampleSelect,
  isLoading,
  cooldownUntil,
}: ReviewFormProps) {
  const [catsApproved, setCatsApproved] = useState(false);
  const [botTrap, setBotTrap] = useState(false);
  const now = useTickingNow();

  const cooldownRemainingMs = cooldownUntil !== null ? Math.max(0, cooldownUntil - now) : 0;
  const isCoolingDown = cooldownRemainingMs > 0;
  const remainingMinutes = Math.floor(cooldownRemainingMs / 60_000);
  const remainingSeconds = Math.floor((cooldownRemainingMs % 60_000) / 1000);
  const countdownLabel = `${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}`;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (diff.trim().length > 0 && catsApproved && !isCoolingDown) {
          onSubmit(diff, botTrap);
        }
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex items-center justify-between gap-2">
        <label htmlFor="diff" className="text-sm font-semibold text-white/90">
          Pega tu unified diff
        </label>
        <ExampleSelector onSelect={onExampleSelect} disabled={isLoading || isCoolingDown} />
      </div>
      <textarea
        id="diff"
        name="diff"
        rows={12}
        value={diff}
        onChange={(event) => onDiffChange(event.target.value)}
        placeholder={'--- a/src/utils.ts\n+++ b/src/utils.ts\n@@ -1,3 +1,4 @@\n...'}
        className={`border border-white/15 bg-white/3 p-4 font-mono text-sm text-white/90 ${focusClassName(
          'white',
        )}`}
        aria-describedby="diff-help"
        disabled={isCoolingDown}
      />
      <p id="diff-help" className="text-xs text-gris-claro">
        Diff en formato unified (lo que produce <code>git diff</code>). Máximo 100 KB.
      </p>

      {/* Checkbox visible: verificación anti-bot amigable. */}
      <label className="flex items-center gap-2 text-sm text-white/90">
        <input
          type="checkbox"
          name="cats"
          checked={catsApproved}
          onChange={(e) => setCatsApproved(e.target.checked)}
          className="accent-red-400"
          disabled={isCoolingDown}
        />
        Los gatos son geniales
      </label>

      {/* Honeypot: checkbox oculto que los bots marcan. */}
      <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          type="checkbox"
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          checked={botTrap}
          onChange={(e) => setBotTrap(e.target.checked)}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || diff.trim().length === 0 || !catsApproved || isCoolingDown}
        className={`self-start bg-red-400 px-5 py-3 text-sm font-bold text-black transition hover:bg-white disabled:opacity-50 ${focusClassName('red')} cursor-pointer!`}
      >
        {isLoading
          ? 'Analizando…'
          : isCoolingDown
            ? `Bloqueado por seguridad (${countdownLabel})`
            : 'Revisar diff'}
      </button>
    </form>
  );
}

interface ExampleSelectorProps {
  onSelect: (example: ExampleDiff) => void;
  disabled: boolean;
}

/**
 * Dropdown nativo (sin dependencias) para elegir un diff de ejemplo.
 * Nativo > librería: es accesible por teclado por defecto, sin bundle extra.
 */
function ExampleSelector({ onSelect, disabled }: ExampleSelectorProps) {
  return (
    <select
      aria-label="Cargar un ejemplo"
      disabled={disabled}
      defaultValue=""
      onChange={(event) => {
        const id = event.target.value;
        if (!id) return;
        const example = EXAMPLE_DIFFS.find((e) => e.id === id);
        if (example) {
          onSelect(example);
          event.target.value = '';
        }
      }}
      className={`border border-white/15 px-2 py-1 text-xs text-white/90 ${focusClassName('white')} cursor-pointer!`}
      style={{ backgroundColor: '#1a1a1a', colorScheme: 'dark' }}
    >
      <option value="" disabled>
        Cargar ejemplo ▾
      </option>
      {EXAMPLE_DIFFS.map((example) => (
        <option key={example.id} value={example.id} title={example.description}>
          {example.label}
        </option>
      ))}
    </select>
  );
}
