import { links, socials, profile, projects, isPending } from './content';

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

export const name = profile.name;
export const origin = 'https://alexanderkholodov.web.app';

// The galaxy owns /galaxy; Spanish is passed as a query because the game is one shared bundle.
export const galaxyHref = (lang: Language) => (lang === 'es' ? '/little-galaxy/?lang=es' : '/little-galaxy/');

// Public links for /profile.json: only entries that are real, public and external.
export const publicLinks = links.items.filter((link) => link.external).map((link) => ({ label: link.label.en, href: link.href }));
export const publicRole = isPending(profile.role) ? undefined : profile.role;
export const publicSocials = socials.items.map(({ label, handle, href: url }) => ({ label, handle, href: url }));

// Internal data hrefs are language-neutral; map them to this language's route.
export function resolveHref(target: string, lang: Language) {
  if (target === '/little-galaxy/') return galaxyHref(lang);
  if (target === '/') return href('home', lang);
  return target;
}

// Build-time configuration of the live banner. The key is the public web key, never an admin key.
export const live = {
  projectId: process.env.LIVE_PROJECT_ID || 'little-galaxy',
  apiKey: process.env.VITE_FIREBASE_API_KEY || '',
};

// The featured project is found by its stable id, never by its position in the list.
export const GALAXY_ID = 'galaxy';
export const galaxy = (() => {
  const found = projects.items.find((project) => project.id === GALAXY_ID);
  if (!found) throw new Error(`content.ts has no project with id "${GALAXY_ID}"`);
  return found;
})();
