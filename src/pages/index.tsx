import Hero from '../components/Hero/Hero';
import Proyectos from '../components/Proyectos/Proyectos';
import IA from '../components/IA/IA';
import OpenSource from '../components/OpenSource/OpenSource';
import SobreMi from '../components/SobreMi/SobreMi';
import Certificados from '../components/Certificados/Certificados';
import Contacto from '../components/Contacto/Contacto';
import Badge from '../components/Badge/Badge';

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
        <Badge
          link="https://www.websitecarbon.com/website/arielgonzaguer-gatorojolab-com/"
          text={['0.1g de CO2/Vista', 'WebSiteCarbon', '98% más limpia que otras páginas']}
          ariaLabel="Huella de carbono de este sitio según Website Carbon, se abre en una pestaña nueva"
        />
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
