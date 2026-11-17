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
      entry: 'Entry', open: 'Open', source: 'Source',
    },
    about: {
      eyebrow: 'About', description: 'About Alexander Kholodov.',
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
    serviceTeaser: { kicker: 'Services', title: ['Hire me ', 'for your project'], lead: 'I build it for you, from a single post to a whole application. Choose what you need, see the starting price, and I answer with scope and date.', see: 'See prices', cta: 'See all services and prices' },
    contact: { title: ['Let’s ', 'talk'], lead: 'A project, a talk at your event, a sponsorship or a question. Write to me where you prefer.', project: 'See services', other: 'Everything else' },
    services: {
      eyebrow: 'Services', title: 'Services for your project', description: 'Software, web, design, video, 3D and training by Alexander Kholodov.',
      pick: 'Choose what you need', who: 'For', audience: ['A person in Ecuador', 'A company in Ecuador', 'Outside Ecuador'],
      describe: 'Tell me about it', placeholder: 'What you need, for when, and anything I should know', from: 'from', next: 'Continue',
      sendTitle: 'Send me your request', sendLead: 'While the request form is being finished, write to me on LinkedIn with this text; I answer with scope, time and price.',
      copy: 'Copy the text', copied: 'Copied', write: 'Write on LinkedIn',
      howTitle: 'How it works', how: ['You tell me what you need', 'I propose scope, time and price', 'You pay in full or a deposit', 'You follow the progress and receive it'],
      big: 'Larger projects are reviewed one by one, with a call and a signed contract.',
      guarantee: [['Two rounds of corrections', 'included in every delivery'], ['Thirty days of warranty', 'on the software I deliver']],
      payTitle: 'Ways to pay', pay: ['Bank transfer', 'DeUna', 'PayPhone', 'PayPal', 'Wise', 'Payoneer'],
      faqTitle: 'Questions',
      faq: [
        ['Can I pay in parts?', 'Yes. Small jobs are paid at the start; larger ones in parts, with a deposit and the rest on delivery or by milestones.'],
        ['How many corrections are included?', 'Two rounds per delivery. A round is one list of comments. New pages or features are quoted apart.'],
        ['Do we sign a contract?', 'For larger projects, always, with electronic signature. For small jobs, if you prefer.'],
        ['How long does it take?', 'It depends on the job; every proposal says the delivery date before you pay.'],
      ],
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
      entry: 'Entrada', open: 'Abrir', source: 'Código',
    },
    about: {
      eyebrow: 'Acerca de', description: 'Acerca de Alexander Kholodov.',
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
    serviceTeaser: { kicker: 'Servicios', title: ['Contrátame ', 'para tu proyecto'], lead: 'Lo construyo por ti, desde un post hasta una aplicación completa. Eliges lo que necesitas, ves el precio desde el que parte y te respondo con alcance y fecha.', see: 'Ver precios', cta: 'Ver todos los servicios y precios' },
    contact: { title: ['', 'Hablemos'], lead: 'Un proyecto, una charla en tu evento, un patrocinio o una consulta. Escríbeme por donde prefieras.', project: 'Ver servicios', other: 'Todo lo demás' },
    services: {
      eyebrow: 'Servicios', title: 'Servicios para tu proyecto', description: 'Software, web, diseño, video, 3D y formación, por Alexander Kholodov.',
      pick: 'Elige lo que necesitas', who: 'Para', audience: ['Una persona en Ecuador', 'Una empresa en Ecuador', 'Fuera de Ecuador'],
      describe: 'Cuéntamelo', placeholder: 'Qué necesitas, para cuándo y lo que deba saber', from: 'desde', next: 'Continuar',
      sendTitle: 'Envíame tu solicitud', sendLead: 'Mientras termino el formulario de solicitudes, escríbeme por LinkedIn con este texto; te respondo con alcance, plazo y precio.',
      copy: 'Copiar el texto', copied: 'Copiado', write: 'Escribir por LinkedIn',
      howTitle: 'Cómo funciona', how: ['Me cuentas qué necesitas', 'Te propongo alcance, plazo y precio', 'Pagas todo o un abono', 'Sigues el avance y lo recibes'],
      big: 'Los proyectos grandes se revisan uno por uno, con una llamada y un contrato firmado.',
      guarantee: [['Dos rondas de correcciones', 'incluidas en cada entrega'], ['Treinta días de garantía', 'en el software que entrego']],
      payTitle: 'Formas de pago', pay: ['Transferencia', 'DeUna', 'PayPhone', 'PayPal', 'Wise', 'Payoneer'],
      faqTitle: 'Preguntas',
      faq: [
        ['¿Puedo pagar por partes?', 'Sí. Los trabajos pequeños se pagan al inicio; los más grandes por partes, con un abono y el resto al entregar o por hitos.'],
        ['¿Cuántas correcciones incluye?', 'Dos rondas por entrega. Una ronda es una sola lista de comentarios. Páginas o funciones nuevas se cotizan aparte.'],
        ['¿Firmamos un contrato?', 'En los proyectos grandes, siempre, con firma electrónica. En los pequeños, si lo prefieres.'],
        ['¿Cuánto tarda?', 'Depende del trabajo; cada propuesta dice la fecha de entrega antes de que pagues.'],
      ],
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
