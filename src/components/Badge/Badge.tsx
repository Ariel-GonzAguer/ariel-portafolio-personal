import { focusClassName } from '../../utils/a11y/a11y';

/**
 * Sello con enlace externo que muestra la huella de carbono del sitio
 * según Website Carbon. Abre el enlace en una pestaña nueva.
 *
 * @example
 * <Badge
 *   link="https://www.websitecarbon.com/website/arielgonzaguer-gatorojolab-com/"
 *   text={['0.1g de CO2/Vista', 'WebSiteCarbon', '98% más limpia que otras páginas']}
 *   ariaLabel="Huella de carbono de este sitio según Website Carbon, se abre en una pestaña nueva"
 * />
 */
export default function Badge({
  text,
  link,
  ariaLabel,
}: {
  text: string[];
  link: string;
  ariaLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <a
        className={`flex h-11 w-75 items-center justify-between rounded-lg border-3 border-green-400 bg-white font-bold ${focusClassName()}`}
        href={link}
        aria-label={ariaLabel}
        target="_blank"
        rel="noopener noreferrer"
      >
        <div className="p-2 py-1.5 text-blue-600">{text[0]}</div>
        <div className="rounded-tr-md rounded-br-md bg-blue-600 p-2 text-white">{text[1]}</div>
      </a>
      {text[2]}
    </div>
  );
}
