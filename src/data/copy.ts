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
      eyebrow: 'Projects', description: 'Projects by Alexander Kholodov: games, science, AI and the web.',
      entry: 'Entry', open: 'Open', source: 'Source', title: ['My ', 'projects'], all: 'All', other: 'Teaching and community',
    },
    about: {
      eyebrow: 'About', description: 'About Alexander Kholodov.', find: 'Networks and contact',
    },
    links: { eyebrow: 'Links', description: 'Where to find Alexander Kholodov and Collective Galaxy.' },
    intro: { iam: 'I bring complex things down to something you can touch.', also: 'Games, science, AI and the web.', cue: 'Explore my work', work: 'Featured projects' },
    stage: { label: 'Featured projects', play: 'Play', open: 'Visit', more: 'Learn more', hint: 'Hover, drag or tap the light', all: 'Explore all projects' },
    build: { kicker: 'More work', title: ['Each thing, in ', 'its field'], games: 'Games', science: 'Science', work: 'AI and work', more: 'See them all' },
    results: { kicker: 'Results' },
    view: {
      kicker: 'How I work',
      items: [['The best ideas grow ', 'between disciplines'], ['Technical precision, ', 'care in every detail'], ['Solutions designed ', 'to be used']],
    },
    events: {
      kicker: 'Community', title: ['Always part ', 'of the community'],
      lead: 'Hackathons, programming contests, game jams and innovation fairs, where every idea ends as a working prototype.',
      roles: ['Vice president, IEEE Computer Society USFQ', 'Mentor, Competitive Programming Club', 'Tutor in programming, mathematics, science and languages'],
      podium: 'Recognitions',
    },
    solve: {
      kicker: 'Approach', title: ['Every project starts ', 'from a real problem'], problem: 'The problem', solution: 'The solution',
      cases: [
        ['munhub-lab', 'A cosmic ray detector at USFQ sent its readings through a cable, with no way to follow them as they happened.'],
        ['dragon-ocean-analyzer', 'Hours of underwater recordings from San Cristóbal Bay in Galápagos, far too many to review by ear.'],
        ['zkvote', 'A vote must remain secret and, at the same time, be verifiable by anyone.'],
      ],
    },
    open: {
      kicker: 'Open source', title: ['Knowledge, ', 'shared'],
      lead: 'The code behind my projects is public, so anyone can review it, learn from it and build on it.', profile: 'Visit my GitHub',
    },
    invite: {
      kicker: 'Collaborations', title: ['Open to ', 'new collaborations'],
      lead: 'If any of these topics interests you, I would be glad to talk.',
      items: ['Research and science', 'Games and interactive worlds', 'Artificial intelligence', 'Hackathon teams', 'Talks and conferences', 'Workshops', 'Sponsorships', 'Project advice'],
      write: 'Let’s talk',
    },
    serviceTeaser: { kicker: 'Services', title: ['Services ', 'tailored to you'], lead: 'Design and development of websites, apps, games, visual content and 3D models, shaped around what your project needs.', see: 'Learn more', cta: 'Explore services' },
    contact: { title: ['Let’s ', 'talk'], lead: 'For projects, talks, sponsorships or any question, you can reach me on LinkedIn.', project: 'Explore services', other: 'Everything else' },
    services: {
      eyebrow: 'Services', description: 'Websites, apps, games, automation, AI agents, design, video and 3D models by Alexander Kholodov.',
      title: ['Let’s give your idea ', 'its shape'], lead: 'Websites, apps, games, design, video and 3D models, developed together with you from start to finish.',
      start: 'Start my project', startNote: 'Create your account and tell me about your idea in about 5 minutes.',
      jump: 'Tap to jump to another universe', universe: 'Universe',
      gridTitle: ['Everything ', 'your project needs'],
      demos: { web: 'Websites', app: 'Apps', bots: 'Automation and bots', ai: 'AI agents', game: 'Video games', design: 'Design', video: 'Video', model: '3D models' },
      tryIt: 'Tap to jump', score: 'Score',
      web: { url: 'aurora-cafe.com', brand: 'Aurora Café', nav: ['Menu', 'Visit', 'Contact'], heading: 'Coffee roasted in Quito', cta: 'Book a table' },
      app: { title: 'My orders', items: ['Order #1042', 'Order #1041', 'Order #1040'], status: ['On its way', 'Delivered', 'Delivered'], toast: 'Your order arrives today' },
      bots: { inbox: 'Inbox', sheet: 'Spreadsheet', done: 'Done' },
      chat: { name: 'Assistant', q: 'Can I change my booking to Friday?', a: 'Of course. Your table is now booked for Friday at 7 pm.' },
      ideasTitle: ['Some ideas ', 'we can bring to life'],
      ideas: ['a website for your business', 'an online shop', 'a logo', 'a reel', 'an app', 'a video game', 'a certificate', 'an assistant that answers your clients', 'a 3D piece to print', 'a poster', 'a presentation', 'a dashboard for your data'],
      endTitle: ['Ready ', 'to begin?'], endLead: 'Create your account, answer a few short questions and receive a proposal for your project.',
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
      eyebrow: 'Proyectos', description: 'Proyectos de Alexander Kholodov: videojuegos, ciencia, IA y web.',
      entry: 'Entrada', open: 'Abrir', source: 'Código', title: ['Mis ', 'proyectos'], all: 'Todos', other: 'Docencia y comunidad',
    },
    about: {
      eyebrow: 'Acerca de', description: 'Acerca de Alexander Kholodov.', find: 'Redes y contacto',
    },
    links: { eyebrow: 'Enlaces', description: 'Dónde encontrar a Alexander Kholodov y Galaxia Colectiva.' },
    intro: { iam: 'Llevo lo complejo a algo que se puede tocar.', also: 'Videojuegos, ciencia, IA y web.', cue: 'Conoce mi trabajo', work: 'Proyectos destacados' },
    stage: { label: 'Proyectos destacados', play: 'Jugar', open: 'Visitar', more: 'Conocer más', hint: 'Pasa el cursor, arrastra o toca la luz', all: 'Explorar todos los proyectos' },
    build: { kicker: 'Más trabajo', title: ['Cada cosa, en ', 'su campo'], games: 'Juegos', science: 'Ciencia', work: 'IA y trabajo', more: 'Verlos todos' },
    results: { kicker: 'Resultados' },
    view: {
      kicker: 'Mi forma de trabajar',
      items: [['Las mejores ideas nacen ', 'entre disciplinas'], ['Precisión técnica, ', 'cuidado en cada detalle'], ['Soluciones pensadas ', 'para usarse']],
    },
    events: {
      kicker: 'Comunidad', title: ['Siempre presente ', 'en la comunidad'],
      lead: 'Hackatones, competencias de programación, game jams y ferias de innovación, donde cada idea termina convertida en un prototipo funcional.',
      roles: ['Vicepresidente de la IEEE Computer Society USFQ', 'Mentor del Club de Programación Competitiva', 'Tutor de programación, matemáticas, ciencias e idiomas'],
      podium: 'Reconocimientos',
    },
    solve: {
      kicker: 'Enfoque', title: ['Cada proyecto parte ', 'de un problema real'], problem: 'El problema', solution: 'La solución',
      cases: [
        ['munhub-lab', 'Un detector de rayos cósmicos en la USFQ enviaba sus lecturas por un cable, sin forma de seguirlas en el momento.'],
        ['dragon-ocean-analyzer', 'Horas de grabaciones submarinas de la bahía de San Cristóbal, en Galápagos, imposibles de revisar una por una.'],
        ['zkvote', 'Un voto debe mantenerse secreto y, al mismo tiempo, poder ser verificado por cualquiera.'],
      ],
    },
    open: {
      kicker: 'Código abierto', title: ['Conocimiento ', 'compartido'],
      lead: 'El código de mis proyectos es público, para que cualquiera pueda revisarlo, aprender de él y construir sobre él.', profile: 'Visitar mi GitHub',
    },
    invite: {
      kicker: 'Colaboraciones', title: ['Abierto a ', 'nuevas colaboraciones'],
      lead: 'Si alguno de estos temas te interesa, será un gusto conversar.',
      items: ['Investigación y ciencia', 'Videojuegos y mundos interactivos', 'Inteligencia artificial', 'Equipos para hackatones', 'Charlas y conferencias', 'Talleres', 'Patrocinios', 'Asesoría de proyectos'],
      write: 'Conversemos',
    },
    serviceTeaser: { kicker: 'Servicios', title: ['Servicios ', 'a la medida'], lead: 'Diseño y desarrollo de páginas web, aplicaciones, videojuegos, contenido visual y modelos 3D, adaptados a lo que tu proyecto necesita.', see: 'Más información', cta: 'Explorar servicios' },
    contact: { title: ['', 'Hablemos'], lead: 'Para proyectos, charlas, patrocinios o cualquier consulta, puedes escribirme por LinkedIn.', project: 'Explorar servicios', other: 'Todo lo demás' },
    services: {
      eyebrow: 'Servicios', description: 'Páginas web, aplicaciones, videojuegos, automatizaciones, agentes de IA, diseño, video y modelos 3D, por Alexander Kholodov.',
      title: ['Demos forma ', 'a tu idea'], lead: 'Páginas web, aplicaciones, videojuegos, diseño, video y modelos 3D, desarrollados contigo de principio a fin.',
      start: 'Comenzar mi proyecto', startNote: 'Crea tu cuenta y cuéntame tu idea en unos 5 minutos.',
      jump: 'Toca para saltar a otro universo', universe: 'Universo',
      gridTitle: ['Todo lo que ', 'tu proyecto necesita'],
      demos: { web: 'Páginas web', app: 'Aplicaciones', bots: 'Automatizaciones y bots', ai: 'Agentes de IA', game: 'Videojuegos', design: 'Diseño', video: 'Video', model: 'Modelos 3D' },
      tryIt: 'Toca para saltar', score: 'Puntos',
      web: { url: 'cafeaurora.com', brand: 'Café Aurora', nav: ['Menú', 'Visítanos', 'Contacto'], heading: 'Café tostado en Quito', cta: 'Reservar mesa' },
      app: { title: 'Mis pedidos', items: ['Pedido #1042', 'Pedido #1041', 'Pedido #1040'], status: ['En camino', 'Entregado', 'Entregado'], toast: 'Tu pedido llega hoy' },
      bots: { inbox: 'Bandeja', sheet: 'Hoja de cálculo', done: 'Listo' },
      chat: { name: 'Asistente', q: '¿Puedo cambiar mi reserva al viernes?', a: 'Claro. Tu mesa quedó reservada para el viernes a las 19:00.' },
      ideasTitle: ['Algunas ideas ', 'que podemos hacer realidad'],
      ideas: ['una página para tu negocio', 'una tienda en línea', 'un logo', 'un reel', 'una aplicación', 'un videojuego', 'un certificado', 'un asistente que responde a tus clientes', 'una pieza 3D para imprimir', 'un póster', 'una presentación', 'un panel para tus datos'],
      endTitle: ['¿Listo para ', 'empezar?'], endLead: 'Crea tu cuenta, responde unas preguntas breves y recibe una propuesta para tu proyecto.',
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
