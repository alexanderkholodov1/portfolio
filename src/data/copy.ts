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
      entry: 'Entry', open: 'Open', source: 'Source', title: ['What I have ', 'built'], all: 'All', other: 'Teaching and community',
    },
    about: {
      eyebrow: 'About', description: 'About Alexander Kholodov.', find: 'Find me',
    },
    links: { eyebrow: 'Links', description: 'Where to find Alexander Kholodov and Collective Galaxy.' },
    intro: { iam: 'I bring complex things down to something you can touch.', also: 'Games, science, AI and the web.', cue: 'See my work', work: 'Selected work' },
    stage: { label: 'Selected projects', play: 'Play it', open: 'Open it', more: 'Read about it', hint: 'Move, drag or tap the light', all: 'See all my projects' },
    build: { kicker: 'More work', title: ['Each thing, in ', 'its field'], games: 'Games', science: 'Science', work: 'AI and work', more: 'See them all' },
    results: { kicker: 'Results' },
    view: {
      kicker: 'How I see things',
      items: [['Ideas are born ', 'between fields'], ['It works ', 'and it feels right'], ['Made ', 'for someone to use']],
    },
    events: {
      kicker: 'Events', title: ['If there is an event, ', 'I am there'],
      lead: 'Hackathons, programming contests, game jams and innovation fairs. Each one ends in something that works.',
      roles: ['Vice president, IEEE Computer Society USFQ', 'Mentor, Competitive Programming Club', 'Private tutor in programming, maths, science and languages'],
      podium: 'Podiums',
    },
    solve: {
      kicker: 'Problems', title: ['I start from ', 'the problem'], problem: 'The problem', solution: 'What I built',
      cases: [
        ['munhub-lab', 'A cosmic ray detector at USFQ wrote its readings to a cable, and nobody could see them as they happened.'],
        ['dragon-ocean-analyzer', 'Hours of underwater sound from San Cristóbal Bay in Galápagos, too many to listen to one by one.'],
        ['zkvote', 'A vote has to stay secret and still be verifiable by anyone.'],
      ],
    },
    open: {
      kicker: 'Open work', title: ['What I build ', 'stays open'],
      lead: 'The code of my projects is public. Read it, learn from it, build on it.', profile: 'All my code on GitHub',
    },
    invite: {
      kicker: 'Open to', title: ['Interesting projects, ', 'of any kind'],
      lead: 'If something here caught your eye, write to me. I answer every message.',
      items: ['Research and science', 'Games and interactive worlds', 'AI and agents', 'Hackathon teams', 'Talks at your university or event', 'Workshops and classes', 'Sponsorships', 'Advice on a project'],
      write: 'Write to me',
    },
    serviceTeaser: { kicker: 'Services', title: ['Hire me ', 'for your project'], lead: 'I build it for you, from a single post to a whole application.', see: 'See more', cta: 'See services' },
    contact: { title: ['Let’s ', 'talk'], lead: 'A project, a talk at your event, a sponsorship or a question. Write to me where you prefer.', project: 'See services', other: 'Everything else' },
    services: {
      eyebrow: 'Services', description: 'Websites, apps, bots, AI agents, games, design, video, 3D and classes by Alexander Kholodov.',
      title: ['You have an idea. ', 'I make it real.'], lead: 'Websites, apps, games, design, video, 3D and classes. Ask for what you want.',
      start: 'Let’s start', gridTitle: ['What I can ', 'make for you'],
      demos: { web: 'Websites', app: 'Apps', bots: 'Automations and bots', ai: 'AI agents', game: 'Video games', design: 'Design', video: 'Video', model: '3D models', learn: 'Classes and talks' },
      tryIt: 'Try it', chat: ['Where is my order?', 'On its way, it arrives tomorrow.'],
      ideasTitle: ['If you can imagine it, ', 'it can be made'],
      ideas: ['a page for your business', 'an online shop', 'a logo', 'a reel', 'an app', 'a video game', 'a certificate', 'a bot that answers for you', 'a workshop for your team', 'a piece to 3D print', 'a poster', 'a presentation', 'a dashboard for your data'],
      endTitle: ['Got an idea? ', 'Let’s make it.'], endLead: 'One step to start. We shape the rest together.',
    },
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
      entry: 'Entrada', open: 'Abrir', source: 'Código', title: ['Lo que he ', 'construido'], all: 'Todos', other: 'Docencia y comunidad',
    },
    about: {
      eyebrow: 'Acerca de', description: 'Acerca de Alexander Kholodov.', find: 'Encuéntrame',
    },
    links: { eyebrow: 'Enlaces', description: 'Dónde encontrar a Alexander Kholodov y Galaxia Colectiva.' },
    intro: { iam: 'Llevo lo complejo a algo que se puede tocar.', also: 'Videojuegos, ciencia, IA y web.', cue: 'Mira mi trabajo', work: 'Trabajo destacado' },
    stage: { label: 'Proyectos destacados', play: 'Jugar', open: 'Abrir', more: 'Leer más', hint: 'Mueve, arrastra o toca la luz', all: 'Ver todos mis proyectos' },
    build: { kicker: 'Más trabajo', title: ['Cada cosa, en ', 'su campo'], games: 'Juegos', science: 'Ciencia', work: 'IA y trabajo', more: 'Verlos todos' },
    results: { kicker: 'Resultados' },
    view: {
      kicker: 'Cómo veo las cosas',
      items: [['Las ideas nacen ', 'entre campos'], ['Que funcione ', 'y se sienta bien'], ['Hecho para ', 'que alguien lo use']],
    },
    events: {
      kicker: 'Eventos', title: ['Si hay un evento, ', 'ahí estoy'],
      lead: 'Hackatones, competencias de programación, game jams y ferias de innovación. Cada uno termina en algo que funciona.',
      roles: ['Vicepresidente de la IEEE Computer Society USFQ', 'Mentor del Club de Programación Competitiva', 'Tutor de programación, matemáticas, ciencias e idiomas'],
      podium: 'Podios',
    },
    solve: {
      kicker: 'Problemas', title: ['Empiezo por ', 'el problema'], problem: 'El problema', solution: 'Lo que construí',
      cases: [
        ['munhub-lab', 'Un detector de rayos cósmicos en la USFQ enviaba sus lecturas por un cable, y nadie podía verlas en el momento.'],
        ['dragon-ocean-analyzer', 'Horas de sonido submarino de la bahía de San Cristóbal, en Galápagos, imposibles de escuchar una por una.'],
        ['zkvote', 'Un voto tiene que seguir siendo secreto y, aun así, cualquiera debe poder verificarlo.'],
      ],
    },
    open: {
      kicker: 'Código abierto', title: ['Lo que construyo ', 'queda abierto'],
      lead: 'El código de mis proyectos es público. Léelo, aprende de él y construye encima.', profile: 'Todo mi código en GitHub',
    },
    invite: {
      kicker: 'Abierto a', title: ['Proyectos interesantes, ', 'de cualquier tipo'],
      lead: 'Si algo de aquí te llamó la atención, escríbeme. Respondo cada mensaje.',
      items: ['Investigación y ciencia', 'Juegos y mundos interactivos', 'IA y agentes', 'Equipos para hackatones', 'Charlas en tu universidad o evento', 'Talleres y clases', 'Patrocinios', 'Consejo sobre un proyecto'],
      write: 'Escríbeme',
    },
    serviceTeaser: { kicker: 'Servicios', title: ['Contrátame ', 'para tu proyecto'], lead: 'Lo construyo por ti, desde un post hasta una aplicación completa.', see: 'Ver más', cta: 'Ver servicios' },
    contact: { title: ['', 'Hablemos'], lead: 'Un proyecto, una charla en tu evento, un patrocinio o una consulta. Escríbeme por donde prefieras.', project: 'Ver servicios', other: 'Todo lo demás' },
    services: {
      eyebrow: 'Servicios', description: 'Páginas, aplicaciones, bots, agentes de IA, videojuegos, diseño, video, 3D y clases, por Alexander Kholodov.',
      title: ['Tienes una idea. ', 'Yo la hago realidad.'], lead: 'Páginas, aplicaciones, juegos, diseño, video, 3D y clases. Pide lo que quieras.',
      start: 'Empecemos', gridTitle: ['Lo que puedo ', 'hacer por ti'],
      demos: { web: 'Páginas web', app: 'Aplicaciones', bots: 'Automatizaciones y bots', ai: 'Agentes de IA', game: 'Videojuegos', design: 'Diseño', video: 'Video', model: 'Modelos 3D', learn: 'Clases y charlas' },
      tryIt: 'Pruébalo', chat: ['¿Dónde está mi pedido?', 'En camino, llega mañana.'],
      ideasTitle: ['Si lo puedes imaginar, ', 'se puede hacer'],
      ideas: ['una página para tu negocio', 'una tienda en línea', 'un logo', 'un reel', 'una aplicación', 'un videojuego', 'un certificado', 'un bot que responde por ti', 'un taller para tu equipo', 'una pieza para imprimir en 3D', 'un póster', 'una presentación', 'un panel para tus datos'],
      endTitle: ['¿Tienes una idea? ', 'Hagámosla.'], endLead: 'Un paso para empezar. Lo demás lo vamos armando juntos.',
    },
    galaxy: {
      eyebrow: 'Be a Dragon 2026 · USFQ', description: 'Galaxia Colectiva: un sistema solar que empieza vacío y crece con cada visitante.',
      open: 'Abrir la galaxia', facts: 'Registro',
    },
    banner: { event: 'Be a Dragon 2026', live: 'En vivo: ', one: '{n} creador', many: '{n} creadores', stale: 'última actualización {t}' },
    notFound: 'Página no encontrada.',
    footerLinks: 'Enlaces',
  },
} satisfies Record<Language, unknown>;
