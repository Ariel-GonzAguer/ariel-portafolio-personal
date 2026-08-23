import type { ReactNode } from 'react';
import '../styles.css';

const siteUrl = 'https://arielgonzaguer.dev';
const siteTitle = 'Ariel GonzAgüer | Frontend/Product Engineer';
const siteDescription =
  'Portafolio personal de Ariel GonzAgüer: Frontend/Product Engineer enfocado en React, TypeScript, accesibilidad, performance y productos web sostenibles.';

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Ariel GonzAgüer',
  jobTitle: 'Frontend/Product Engineer',
  url: siteUrl,
  description: siteDescription,
  knowsAbout: [
    'Frontend Engineering',
    'Product Engineering',
    'Web Accessibility',
    'Web Performance',
    'React',
    'TypeScript',
    'Waku',
    'Jamstack',
  ],
  sameAs: ['https://github.com/Ariel-GonzAguer', 'https://gatorojolab.com'],
};

export default async function RootElement({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className="min-h-screen">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={siteDescription} />
        <meta name="author" content="Ariel GonzAgüer" />
        <meta name="robots" content="index, follow" />
        <title>{siteTitle}</title>

        <meta property="og:type" content="website" />
        <meta property="og:title" content={siteTitle} />
        <meta property="og:description" content={siteDescription} />
        <meta property="og:url" content={`${siteUrl}/`} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={siteTitle} />
        <meta name="twitter:description" content={siteDescription} />
        <meta name="theme-color" content="#0a0a0c" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-screen bg-fondo text-white">{children}</body>
    </html>
  );
}

export const getConfig = async () => {
  return {
    render: 'static',
  } as const;
};
