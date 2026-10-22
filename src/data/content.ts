// Operator content: the one place where it lives (EN and ES together).
// Rule: nothing here may be invented. What is not supplied yet is `todo(...)`, which
// `pnpm run content:todo` prints. Pages omit it: visitors never see editorial status.
// Keep this file free of imports so the build-time script can load it directly.

export type Localized = { en: string; es: string };
export type Pending = { todo: string };
export type Maybe<T> = T | Pending;
export type List<T> = { items: T[]; todo: string | null };

export const todo = (needed: string): Pending => ({ todo: needed });
export const isPending = <T>(value: Maybe<T>): value is Pending =>
  typeof value === 'object' && value !== null && 'todo' in value && typeof value.todo === 'string';

export type Link = { id: string; label: Localized; detail?: Localized; href: string; external?: boolean };
export type Social = { id: string; label: string; handle: string; href: string };
export type Project = {
  id: string;
  title: Localized;
  context: Localized;
  pitch: Localized;
  href: string;
  source?: Link;
  role: Maybe<Localized>;
  stack: Maybe<string[]>;
  dates: Maybe<Localized>;
  image: Maybe<{ src: string; alt: Localized }>;
};

export type Profile = { name: string; role: Maybe<Localized>; bio: Maybe<Localized>; cv: Maybe<Link> };

export const profile: Profile = {
  name: 'Alexander Kholodov',
  role: todo('P3: one-line role (EN and ES), e.g. what he does and for whom. Shown under the name on Home and About, and in /profile.json.'),
  bio: todo('P3: About text in EN and ES, from his own posts: who he is, what he builds, why. Shown on About.'),
  cv: todo('P3: link to a public CV file or page (label in EN and ES), or confirm there is none.'),
};

export const projects: List<Project> = {
  items: [{
    id: 'galaxy',
    title: { en: 'Collective Galaxy', es: 'Galaxia Colectiva' },
    context: { en: 'Be a Dragon 2026 · USFQ', es: 'Be a Dragon 2026 · USFQ' },
    // docs/plan/01-product-spec.md (Concept) and 00-context.md (application text). It claims only what
    // the pinned galaxy release delivers (G v0.3.0: design, launch, orbit). The keepsake/replay claim
    // belongs here again once G v0.6.0 (Memory) is the pinned release.
    pitch: {
      en: 'A solar system that starts empty. Every visitor designs a planet, star or moon on their phone and launches it into orbit; together they grow it into a galaxy. Each object was made by one person.',
      es: 'Un sistema solar que empieza vacío. Cada visitante diseña un planeta, estrella o luna en su celular y lo lanza a órbita; entre todos lo convierten en una galaxia. Cada objeto lo hizo una sola persona.',
    },
    href: '/galaxy/',
    source: {
      id: 'galaxy-source',
      label: { en: 'Collective Galaxy source on GitHub', es: 'Código de Galaxia Colectiva en GitHub' },
      href: 'https://github.com/alexanderkholodov1/little-galaxy',
      external: true,
    },
    role: todo('P3: his role on Collective Galaxy (EN and ES), e.g. design, build, operation at the booth.'),
    stack: todo('P3: technologies used, confirmed by him (the plan names a stack but he has not approved it as public text).'),
    dates: todo('P3: when it was built / the confirmed fair date of Be a Dragon 2026 (D1 in 08-decisions.md is unconfirmed).'),
    image: todo('P3: a screenshot or photo of the galaxy or the booth, with alt text in EN and ES.'),
  }],
  todo: 'P3: every other portfolio project: title, one-line pitch, role, stack, links, dates, image (EN and ES).',
};

export const links: List<Link> = {
  items: [
    { id: 'galaxy', label: { en: 'Collective Galaxy', es: 'Galaxia Colectiva' }, detail: { en: 'The live event', es: 'El evento en vivo' }, href: '/galaxy/' },
    { id: 'galaxy-source', label: { en: 'Collective Galaxy on GitHub', es: 'Galaxia Colectiva en GitHub' }, detail: { en: 'Source code', es: 'Código fuente' }, href: 'https://github.com/alexanderkholodov1/little-galaxy', external: true },
    { id: 'portfolio', label: { en: 'Portfolio', es: 'Portafolio' }, detail: { en: 'alexanderkholodov.web.app', es: 'alexanderkholodov.web.app' }, href: '/' },
  ],
  todo: 'P3: the links he wants on /links (the Linktree replacement): label, URL and order; EN and ES labels where they differ.',
};

export const socials: List<Social> = {
  items: [],
  todo: 'P3: public social profiles (platform, handle, URL) he approves. They also fill `socials` in /profile.json.',
};
