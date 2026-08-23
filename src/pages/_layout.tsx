import type { ReactNode } from 'react';

/**
 * Layout único del sitio: skip link accesible y footer mínimo.
 *
 * @example
 * <Layout><main>...</main></Layout>
 */
export default async function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-red-400 focus:px-4 focus:py-3 focus:font-bold focus:text-black"
      >
        Saltar al contenido principal
      </a>
      <nav
        aria-label="Navegación principal"
        className="sticky top-0 z-40 border-b border-white/10 bg-fondo/90 px-6 py-3 backdrop-blur"
      >
        <ul className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 text-sm">
          <li>
            <a href="/" className="font-lexend-mega font-bold hover:text-red-400 cursor-pointer!">
              Ariel GonzAgüer
            </a>
          </li>
          <li className="flex flex-wrap gap-4">
            <a href="/#proyectos" className="hover:text-red-400 cursor-pointer!">
              Proyectos
            </a>
            <a href="/#ia" className="hover:text-red-400 cursor-pointer!">
              IA
            </a>
            <a href="/#sobre-mi" className="hover:text-red-400 cursor-pointer!">
              Sobre mí
            </a>
            <a href="/#contacto" className="hover:text-red-400 cursor-pointer!">
              Contacto
            </a>
          </li>
        </ul>
      </nav>
      {children}
      <footer className="border-t border-white/10 px-6 py-10 text-center text-sm text-gris-claro">
        <p>
          © {new Date().getFullYear()} Ariel GonzAgüer ·{' '}
          <a
            href="https://gatorojolab.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-red-400"
          >
            Gato Rojo Lab (mi estudio)
          </a>
        </p>
      </footer>
    </>
  );
}

export const getConfig = async () => {
  return {
    render: 'static',
  } as const;
};
