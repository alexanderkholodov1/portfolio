import { href, labels, name, pages, repositories } from '../data/site';

export function GET() {
  return new Response(JSON.stringify({
    name,
    nav: pages.map((page) => ({
      href: { en: href(page, 'en'), es: href(page, 'es') },
      label: { en: labels.en[page], es: labels.es[page] },
    })),
    links: repositories,
    socials: [],
  }), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
