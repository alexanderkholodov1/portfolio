// Interface wording (not operator content). Operator content is in content.ts.
import type { Language } from './site';

export const copy = {
  en: {
    skip: 'Skip to content', nav: 'Main navigation', theme: 'Dark theme', brand: 'Portfolio', language: 'Read this page in Spanish',
    home: {
      title: 'Portfolio', description: 'Alexander Kholodov’s portfolio. Collective Galaxy is a live galaxy built by the visitors of Be a Dragon 2026 at USFQ.',
      eyebrow: 'Portfolio', featured: 'Featured', index: 'Index',
    },
    projects: {
      eyebrow: 'Projects', description: 'Projects by Alexander Kholodov, starting with Collective Galaxy.',
      entry: 'Entry', open: 'Open', source: 'Source', emptySlot: 'Next entry', emptyNote: 'Not yet entered in the log.',
    },
    about: {
      eyebrow: 'About', description: 'About Alexander Kholodov.',
      pendingTitle: 'The full profile is not written yet.',
      pendingNote: 'Until it is, the work speaks first: Collective Galaxy is the project to see.',
    },
    links: { eyebrow: 'Links', description: 'Where to find Alexander Kholodov and Collective Galaxy.' },
    galaxy: {
      eyebrow: 'Be a Dragon 2026 · USFQ', description: 'Collective Galaxy: a solar system that starts empty and grows with every visitor.',
      open: 'Open the galaxy', facts: 'Record',
    },
    banner: { event: 'Be a Dragon 2026', live: 'Live: ', one: '{n} creator', many: '{n} creators', stale: 'last updated {t}' },
    notFound: 'Page not found.',
    footerLinks: 'Links',
  },
  es: {
    skip: 'Saltar al contenido', nav: 'Navegación principal', theme: 'Tema oscuro', brand: 'Portafolio', language: 'Leer esta página en inglés',
    home: {
      title: 'Portafolio', description: 'Portafolio de Alexander Kholodov. Galaxia Colectiva es una galaxia en vivo construida por los visitantes de Be a Dragon 2026 en la USFQ.',
      eyebrow: 'Portafolio', featured: 'Destacado', index: 'Índice',
    },
    projects: {
      eyebrow: 'Proyectos', description: 'Proyectos de Alexander Kholodov, empezando por Galaxia Colectiva.',
      entry: 'Entrada', open: 'Abrir', source: 'Código', emptySlot: 'Próxima entrada', emptyNote: 'Aún no registrada en el cuaderno.',
    },
    about: {
      eyebrow: 'Acerca de', description: 'Acerca de Alexander Kholodov.',
      pendingTitle: 'El perfil completo aún no está escrito.',
      pendingNote: 'Mientras tanto, habla el trabajo: Galaxia Colectiva es el proyecto para ver.',
    },
    links: { eyebrow: 'Enlaces', description: 'Dónde encontrar a Alexander Kholodov y Galaxia Colectiva.' },
    galaxy: {
      eyebrow: 'Be a Dragon 2026 · USFQ', description: 'Galaxia Colectiva: un sistema solar que empieza vacío y crece con cada visitante.',
      open: 'Abrir la galaxia', facts: 'Registro',
    },
    banner: { event: 'Be a Dragon 2026', live: 'En vivo: ', one: '{n} creador', many: '{n} creadores', stale: 'última actualización {t}' },
    notFound: 'Página no encontrada.',
    footerLinks: 'Enlaces',
  },
} satisfies Record<Language, unknown>;
