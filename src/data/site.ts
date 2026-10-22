export type Language = 'en' | 'es';
export type Page = 'home' | 'projects' | 'about' | 'links' | 'galaxy';
export const pages: Page[] = ['home', 'projects', 'about', 'links', 'galaxy'];
export const paths: Record<Page, string> = {
  home: '', projects: 'projects/', about: 'about/', links: 'links/', galaxy: 'projects/galaxy/',
};
export const labels = {
  en: { home: 'Home', projects: 'Projects', about: 'About', links: 'Links', galaxy: 'Galaxy' },
  es: { home: 'Inicio', projects: 'Proyectos', about: 'Acerca de', links: 'Enlaces', galaxy: 'Galaxia' },
};
export function href(page: Page, lang: Language) { return `${lang === 'es' ? '/es/' : '/'}${paths[page]}`; }

// Content provenance: docs/plan/README.md, 01-product-spec.md and 02-architecture.md.
// Unknown role, biography, CV and social profiles are tracked in docs/foundations-status.md.
export const name = 'Alexander Kholodov';
export const repositories = [
  { label: 'Portfolio · GitHub', href: 'https://github.com/alexanderkholodov1/portfolio' },
  { label: 'Collective Galaxy · GitHub', href: 'https://github.com/alexanderkholodov1/little-galaxy' },
];
