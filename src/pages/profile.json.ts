import { href, labels, name, navPages, publicLinks, publicRole, publicSocials } from '../data/site';

export function GET() {
  return new Response(JSON.stringify({
    name,
    ...(publicRole ? { role: publicRole } : {}),
    nav: navPages.map((page) => ({
      href: { en: href(page, 'en'), es: href(page, 'es') },
      label: { en: labels.en[page], es: labels.es[page] },
    })),
    links: publicLinks,
    socials: publicSocials,
  }), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
