import Hero from '../components/Hero/Hero';
import Proyectos from '../components/Proyectos/Proyectos';
import IA from '../components/IA/IA';
import OpenSource from '../components/OpenSource/OpenSource';
import SobreMi from '../components/SobreMi/SobreMi';
import Certificados from '../components/Certificados/Certificados';
import Contacto from '../components/Contacto/Contacto';

export default function HomePage() {
  return (
    <>
      <>
        <title>Ariel GonzAgüer | Frontend/Product Engineer</title>
        <meta
          name="description"
          content="Portafolio personal de Ariel GonzAgüer: Frontend/Product Engineer enfocado en React, TypeScript, accesibilidad, performance y productos web sostenibles."
        />
      </>
      <main id="main">
        <Hero />
        <Proyectos />
        <IA />
        <OpenSource />
        <SobreMi />
        <Certificados />
        <Contacto />
      </main>
    </>
  );
}

export const getConfig = async () => {
  return {
    render: 'static',
  } as const;
};
