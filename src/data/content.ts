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
  href?: string;
  source?: Link;
  role: Maybe<Localized>;
  stack: Maybe<string[]>;
  dates: Maybe<Localized>;
  image: Maybe<{ src: string; alt: Localized }>;
};

export type Profile = { name: string; role: Maybe<Localized>; bio: Maybe<Localized>; cv: Maybe<Link> };

export const profile: Profile = {
  name: 'Alexander Kholodov',
  role: {
    en: 'Computer Science Engineering student at Universidad San Francisco de Quito (2023–2028).',
    es: 'Estudiante de Ingeniería en Ciencias de la Computación en la Universidad San Francisco de Quito (2023–2028).',
  },
  bio: {
    en: [
      'Computer Science Engineering student at Universidad San Francisco de Quito (2023–2028), with interests in software development, web and application development, and applied technology projects.',
      'My work and learning span several areas of technology, and I actively pursue continuous learning through certifications, technical events, and independent projects. I approach problems with both an engineering mindset and a creative perspective that values interdisciplinary thinking. I am particularly motivated by building systems that transform ideas into practical solutions and improve real-world processes.',
      'I actively participate in international programming competitions and hackathons such as TCS CodeVita, IEEEXtreme, and ZKForge, as well as innovation and entrepreneurship events like the Diners Club Blue Challenge. I am vice president of the IEEE Computer Society USFQ Chapter, mentor in the Competitive Programming Club, and private tutor in programming, mathematics, sciences, and languages (Spanish, English, and Russian).',
      'I have completed internships in technical support at USFQ, supporting artificial intelligence and data science infrastructure, and in artificial intelligence at Tata Consultancy Services (TCS).',
      'I also have experience in audiovisual production, with over three years of freelance work as a video editor for international clients, proficient in Adobe Premiere Pro, Adobe Photoshop, and Adobe Illustrator.',
      'Driven by curiosity and a philosophy of lifelong learning, I enjoy exploring different fields while building practical systems that bridge ideas, technology, and real-world impact.',
    ].join('\n\n'),
    es: [
      'Estudiante de Ingeniería en Ciencias de la Computación en la Universidad San Francisco de Quito (2023–2028), con intereses en el desarrollo de software, el desarrollo web y de aplicaciones, y los proyectos tecnológicos aplicados.',
      'Mi formación y experiencia abarcan diversas áreas de la tecnología, y busco activamente el aprendizaje continuo mediante certificaciones, eventos tecnológicos y proyectos independientes. Abordo los problemas combinando una mentalidad de ingeniería con una perspectiva creativa que valora el pensamiento interdisciplinario. Me motiva especialmente desarrollar sistemas que transformen ideas en soluciones prácticas y contribuyan a mejorar procesos del mundo real.',
      'Participo activamente en competencias internacionales de programación y hackatones como TCS CodeVita, IEEEXtreme y ZKForge, y en eventos de innovación y emprendimiento como el Diners Club Blue Challenge. Soy vicepresidente del capítulo de la IEEE Computer Society en la USFQ, mentor en el Club de Programación Competitiva y tutor privado de programación, matemáticas, ciencias e idiomas (español, inglés y ruso).',
      'He realizado pasantías en el equipo de Soporte Técnico de la USFQ, apoyando la infraestructura de inteligencia artificial y ciencia de datos, y en inteligencia artificial en Tata Consultancy Services (TCS).',
      'Cuento además con experiencia en producción audiovisual, con más de tres años de trabajo independiente como editor de video para clientes internacionales, con dominio de Adobe Premiere Pro, Adobe Photoshop y Adobe Illustrator.',
      'Motivado por la curiosidad intelectual y una filosofía de aprendizaje continuo, disfruto explorar distintos campos mientras desarrollo sistemas prácticos que conectan ideas, tecnología e impacto en el mundo real.',
    ].join('\n\n'),
  },
  cv: todo('P3: operator choosing which CV to publish (label in EN and ES), or confirm there is none.'),
};

export const projects: List<Project> = {
  items: [
    {
      id: 'galaxy',
      title: { en: 'Collective Galaxy', es: 'Galaxia Colectiva' },
      context: { en: 'Be a Dragon 2026 · USFQ', es: 'Be a Dragon 2026 · USFQ' },
      pitch: {
        en: 'A solar system that starts empty. Each visitor designs a planet, star, or moon on their phone, hears its sound fingerprint, and launches it into orbit on the shared screen; celestial bodies orbit in real time and respond to touch.',
        es: 'Un sistema solar que empieza vacío. Cada visitante diseña un planeta, estrella o luna en su celular, escucha su firma sonora y lo lanza a órbita en la pantalla compartida; los cuerpos celestes orbitan en tiempo real y responden a caricias e interacción táctil.',
      },
      href: '/little-galaxy/',
      source: {
        id: 'galaxy-source',
        label: { en: 'Collective Galaxy source on GitHub', es: 'Código de Galaxia Colectiva en GitHub' },
        href: 'https://github.com/alexanderkholodov1/little-galaxy',
        external: true,
      },
      role: { en: 'Design and development', es: 'Diseño y desarrollo' },
      stack: ['React', 'Three.js', 'React Three Fiber', 'Tone.js', 'Firebase', 'TypeScript', 'Vite'],
      dates: { en: 'Oct 2026 – Be a Dragon 2026', es: 'Oct 2026 – Be a Dragon 2026' },
      image: todo('P3: a screenshot or photo of the galaxy or the booth, with alt text in EN and ES.'),
    },
    {
      id: 'agent-workshops',
      title: { en: 'Agentic Development Workshops', es: 'Prácticas de talleres con agentes' },
      context: { en: 'Cursor Community Quito · NEST.Lab · USFQ', es: 'Cursor Community Quito · NEST.Lab · USFQ' },
      pitch: {
        en: 'Practical AI agent development sessions at Cursor Workshop Quito and Workshop Cursor x Supabase. Covered parallel multi-agent workflows guided by AGENTS.md, Supabase integration, Vercel deployments, and e-commerce prototyping with Medusa.js and Figma.',
        es: 'Prácticas de desarrollo con agentes de inteligencia artificial en Cursor Workshop Quito y Workshop Cursor x Supabase. Incluyeron flujos multiagente en paralelo guiados por AGENTS.md, integración de Supabase y despliegue en Vercel, además de prototipado de comercio electrónico con Medusa.js y Figma.',
      },
      role: { en: 'Participant and event staff at Cursor x Supabase', es: 'Participante y personal de apoyo en Cursor x Supabase' },
      stack: ['Cursor', 'GitHub', 'Supabase', 'Vercel', 'Medusa.js', 'Figma'],
      dates: { en: 'Jun – Sep 2026', es: 'Jun – Sep 2026' },
      image: todo('P3: screenshot or photo of the workshop sessions with alt text in EN and ES.'),
    },
    {
      id: 'tcs-ai',
      title: { en: 'AI Internship at Tata Consultancy Services', es: 'Aportes de inteligencia artificial en TCS' },
      context: { en: 'Tata Consultancy Services', es: 'Tata Consultancy Services' },
      pitch: {
        en: 'Artificial intelligence internship in the banking sector. Defined graph ontologies, generated synthetic data, mapped data from production models, consolidated single sources of truth, and wrote technical documentation.',
        es: 'Pasantía de inteligencia artificial en el sector bancario. Definición de ontologías de grafos, generación de datos sintéticos, mapeo de datos de modelos reales, consolidación de fuentes únicas de la verdad y documentación técnica.',
      },
      role: { en: 'AI Intern', es: 'Pasante de inteligencia artificial' },
      stack: ['Graph Ontologies', 'Synthetic Data', 'Data Mapping'],
      dates: { en: 'May – Aug 2026', es: 'May – Ago 2026' },
      image: todo('P3: photo or graphic of the internship with alt text in EN and ES.'),
    },
    {
      id: 'competitive-programming-club',
      title: { en: 'Competitive Programming Club', es: 'Club de Programación Competitiva' },
      context: { en: 'IEEE Computer Society USFQ', es: 'IEEE Computer Society USFQ' },
      pitch: {
        en: 'Weekly programming fundamentals and problem-solving classes for over 20 students from multiple majors across a full academic semester. Practical mock contests based on problem sets from IEEEXtreme 19.0, TCS CodeVita 13, and ICPC.',
        es: 'Clases semanales de fundamentos de programación y resolución de problemas para más de 20 estudiantes de diversas carreras durante un semestre completo. Simulacros prácticos basados en problemas de IEEEXtreme 19.0, TCS CodeVita 13 e ICPC.',
      },
      role: { en: 'Instructor and co-organizer', es: 'Instructor y coorganizador' },
      stack: ['Python', 'C++'],
      dates: { en: 'Feb – May 2026', es: 'Feb – May 2026' },
      image: todo('P3: photo of the competitive programming club sessions with alt text in EN and ES.'),
    },
    {
      id: 'sublime-airlift',
      title: { en: 'Sublime Airlift', es: 'Sublime Airlift' },
      context: { en: 'Interact2Hack 2026 · 3rd Place', es: 'Interact2Hack 2026 · 3.er lugar' },
      pitch: {
        en: "2D narrative horror game inspired by Dante's Divine Comedy and set in a post-technological Purgatory, controlled entirely with the mouse. Built in 32 hours during the Interact2Hack hackathon, earning 3rd place in the video game challenge.",
        es: 'Videojuego de terror narrativo en 2D inspirado en La Divina Comedia y ambientado en un Purgatorio postecnológico, controlado exclusivamente con el ratón. Desarrollado en 32 horas durante la hackatón Interact2Hack, donde obtuvo el tercer lugar en el reto de videojuegos.',
      },
      href: 'https://alexanderkholodov1.itch.io/sublime-airlift',
      role: { en: 'Level design, mechanics implementation, narrative, and team coordination', es: 'Construcción de niveles, implementación de mecánicas y narrativa, y organización del equipo' },
      stack: ['Godot Engine'],
      dates: { en: 'Apr 2026', es: 'Abr 2026' },
      image: todo('P3: screenshot of Sublime Airlift gameplay with alt text in EN and ES.'),
    },
    {
      id: 'prompt-engineering-course',
      title: { en: 'Prompt Engineering and Vibecoding Course', es: 'Curso de Prompt Engineering y Vibecoding' },
      context: { en: 'IEEE CS & CIS USFQ', es: 'IEEE CS y CIS USFQ' },
      pitch: {
        en: 'Training session on prompt engineering, AI agent-driven prototyping, and modern development workflows, co-organized by IEEE Computer Society and IEEE Computational Intelligence Society at USFQ with guest speakers from industry.',
        es: 'Sesión formativa sobre ingeniería de instrucciones, prototipado asistido por agentes de inteligencia artificial y flujos de trabajo de desarrollo moderno, organizada entre IEEE Computer Society e IEEE Computational Intelligence Society en la USFQ con ponentes invitados de la industria.',
      },
      role: todo('P3: specific role and contributions in the Prompt Engineering course.'),
      stack: ['Prompt Engineering', 'AI Agents', 'Vibecoding'],
      dates: { en: 'Apr 2026', es: 'Abr 2026' },
      image: todo('P3: photo or banner of the Prompt Engineering course with alt text in EN and ES.'),
    },
    {
      id: 'github-desde-cero',
      title: { en: 'GitHub Desde Cero Course', es: 'Curso GitHub Desde Cero' },
      context: { en: 'IEEE Computer Society USFQ', es: 'IEEE Computer Society USFQ' },
      pitch: {
        en: 'Practical course on version control and collaborative workflows for USFQ students and external attendees. Training in Git, GitHub, GitHub Desktop, and GitHub Copilot, providing hands-on lab guidance and a final group project.',
        es: 'Curso práctico de control de versiones y trabajo colaborativo para estudiantes de la USFQ y asistentes externos. Capacitación en Git, GitHub, GitHub Desktop y GitHub Copilot, con acompañamiento en prácticas y un proyecto final grupal.',
      },
      role: { en: 'Instructor', es: 'Instructor' },
      stack: ['Git', 'GitHub', 'GitHub Desktop', 'GitHub Copilot'],
      dates: { en: 'Mar 2026', es: 'Mar 2026' },
      image: todo('P3: photo or banner of the GitHub Desde Cero course with alt text in EN and ES.'),
    },
    {
      id: 'slb-computer-repowering',
      title: { en: 'Computer Refurbishment Initiative', es: 'Repotenciación de computadoras' },
      context: { en: 'SLB & USFQ Sustainability Office', es: 'SLB y Oficina de Sostenibilidad USFQ' },
      pitch: {
        en: 'Joint volunteer initiative between SLB, the USFQ Sustainability Office, and IEEE Computer Society USFQ to refurbish donated computer equipment, extending its operational life for schools in Ecuadorian Amazon communities.',
        es: 'Iniciativa de voluntariado interinstitucional entre SLB, la Oficina de Sostenibilidad de la USFQ e IEEE Computer Society USFQ para reacondicionar equipos informáticos donados, extendiendo su vida útil para escuelas en comunidades de la región amazónica ecuatoriana.',
      },
      role: todo('P3: specific volunteer technical tasks refurbishment computers.'),
      stack: ['Hardware Refurbishment', 'Linux'],
      dates: { en: 'Mar 2026', es: 'Mar 2026' },
      image: todo('P3: photo of the computer refurbishment initiative with alt text in EN and ES.'),
    },
    {
      id: 'dragon-ocean-analyzer',
      title: { en: 'Dragon Ocean Analyzer', es: 'Dragon Ocean Analyzer' },
      context: { en: 'SALA 2026 AI Hackathon', es: 'Hackatón SALA 2026' },
      pitch: {
        en: 'Bioacoustic analysis tool for the underwater soundscape of San Cristóbal Bay in Galápagos. Audio processing pipeline combining 6 pre-trained machine learning models with an interactive dashboard displaying spectrograms, clustering, and species detection probabilities.',
        es: 'Herramienta para el análisis bioacústico del paisaje sonoro submarino de la bahía de San Cristóbal en Galápagos. Procesamiento de grabaciones mediante una secuencia de 6 modelos preentrenados y panel interactivo para explorar espectrogramas, agrupamientos y probabilidades de especies.',
      },
      href: 'https://github.com/DhamarAM/hackathon_sala2026',
      source: {
        id: 'dragon-ocean-analyzer-source',
        label: { en: 'Dragon Ocean Analyzer on GitHub', es: 'Código de Dragon Ocean Analyzer en GitHub' },
        href: 'https://github.com/DhamarAM/hackathon_sala2026',
        external: true,
      },
      role: { en: 'Frontend and interactive dashboard development', es: 'Desarrollo de la interfaz y del panel interactivo' },
      stack: ['React', 'Chart.js', 'Machine Learning', 'Python'],
      dates: { en: 'Mar 2026', es: 'Mar 2026' },
      image: todo('P3: screenshot of the Dragon Ocean Analyzer dashboard with alt text in EN and ES.'),
    },
    {
      id: 'munhub-lab',
      title: { en: 'MunHub Lab', es: 'MunHub Lab' },
      context: { en: 'Space Front USFQ · Space Expo', es: 'Space Front USFQ · Space Expo' },
      pitch: {
        en: 'Web platform for real-time acquisition, storage, and visualization of cosmic ray particles recorded by a CosmicWatch detector at USFQ Leopard Lab. Features serial data ingestion via Web Serial API and a Python WebSocket bridge, real-time database storage, and an administration panel.',
        es: 'Plataforma web para adquisición, almacenamiento y visualización en tiempo real de partículas cósmicas registradas por el detector CosmicWatch en el laboratorio Leopard Lab de la USFQ. Incluye conexión serie vía Web Serial API y WebSocket en Python, base de datos en tiempo real y panel de administración.',
      },
      href: 'https://munra-1.web.app/',
      role: { en: 'Full-stack web platform design and development', es: 'Desarrollo full stack de la plataforma web' },
      stack: ['Firebase Hosting', 'Firebase Realtime Database', 'Firebase Auth', 'Web Serial API', 'Python', 'WebSocket'],
      dates: { en: 'Mar 2026', es: 'Mar 2026' },
      image: todo('P3: screenshot of the MunHub Lab platform with alt text in EN and ES.'),
    },
    {
      id: 'usfq-ai-support',
      title: { en: 'AI and Data Science Infrastructure Support', es: 'Soporte de infraestructura de IA y ciencia de datos' },
      context: { en: 'Universidad San Francisco de Quito', es: 'Universidad San Francisco de Quito' },
      pitch: {
        en: "Technical internship maintaining computing infrastructure for USFQ graduate programs in Artificial Intelligence and Data Science. Managed Linux servers, Docker container deployments, secure SSH and VPN access, and technical support for researchers and faculty.",
        es: 'Pasantía técnica en la infraestructura de computación para los programas de maestría en Inteligencia Artificial y Ciencia de Datos de la USFQ. Administración de servidores Linux, despliegue de contenedores Docker, conexiones seguras vía SSH y VPN, y soporte técnico a investigadores y docentes.',
      },
      role: { en: 'Technical Support Intern', es: 'Pasante de soporte técnico' },
      stack: ['Linux', 'Bash', 'Docker', 'SSH', 'VPN'],
      dates: { en: 'Jul 2025 – Jan 2026', es: 'Jul 2025 – Ene 2026' },
      image: todo('P3: photo or graphic of the AI computing infrastructure with alt text in EN and ES.'),
    },
    {
      id: 'blue-challenge',
      title: { en: 'Blue Challenge Personal Finance Innovation', es: 'Reto de finanzas personales en Blue Challenge' },
      context: { en: 'Diners Club del Ecuador & NEST.Lab · Outstanding Innovator', es: 'Diners Club del Ecuador y NEST.Lab · Outstanding Innovator' },
      pitch: {
        en: 'Personal finance and over-indebtedness prevention solution developed in the Blue Challenge innovation competition, reaching the penultimate stage among more than 200 teams. Received the individual Outstanding Innovator diploma awarded to five participants.',
        es: 'Solución de finanzas personales y prevención del sobreendeudamiento desarrollada en el concurso de innovación Blue Challenge, alcanzando la penúltima etapa entre más de 200 equipos. Reconocimiento individual con el diploma Outstanding Innovator, otorgado a cinco participantes.',
      },
      role: todo('P3: specific role and technical contributions in the Blue Challenge solution.'),
      stack: ['Product Design', 'Financial Tech'],
      dates: { en: 'Sep – Dec 2025', es: 'Sep – Dic 2025' },
      image: todo('P3: photo of the Outstanding Innovator diploma or project with alt text in EN and ES.'),
    },
    {
      id: 'dragons-never-die',
      title: { en: 'Dragons Never Die', es: 'Dragons Never Die' },
      context: { en: 'USFQ IEEE CS Game Jam 2025', es: 'USFQ IEEE CS Game Jam 2025' },
      pitch: {
        en: '2D video game built for the dragon-themed USFQ CS Game Jam. Our team developed a playable release and earned 4th place at the jam.',
        es: 'Videojuego 2D desarrollado para la USFQ CS Game Jam con temática de dragones. Nuestro equipo construyó una versión jugable y obtuvo el cuarto lugar en la competencia.',
      },
      role: { en: 'Pixel art in Aseprite and game development in Unity', es: 'Arte en píxeles con Aseprite y desarrollo en Unity' },
      stack: ['Unity', 'Aseprite'],
      dates: { en: 'Oct 2025', es: 'Oct 2025' },
      image: todo('P3: screenshot of Dragons Never Die gameplay with alt text in EN and ES.'),
    },
    {
      id: 'zkvote',
      title: { en: 'ZKVote', es: 'ZKVote' },
      context: { en: 'ZKForge Hackathon 2025 · 5th Place', es: 'ZKForge Hackathon 2025 · 5.º lugar' },
      pitch: {
        en: 'Anonymous voting system built with zero-knowledge proofs during the intensive 6-week ZKET Core Program in partnership with the Ethereum Foundation. The project earned 5th place at the ZKForge Hackathon 2025.',
        es: 'Sistema de votación anónima basado en pruebas de conocimiento cero, desarrollado durante el programa intensivo ZKET Core Program junto a Ethereum Foundation. El proyecto obtuvo el quinto lugar en la hackatón ZKForge 2025.',
      },
      href: 'https://github.com/AlexanderKholodov1/zkvote',
      source: {
        id: 'zkvote-source',
        label: { en: 'ZKVote on GitHub', es: 'Código de ZKVote en GitHub' },
        href: 'https://github.com/AlexanderKholodov1/zkvote',
        external: true,
      },
      role: { en: 'Design and implementation of zero-knowledge voting protocol', es: 'Diseño e implementación del protocolo de votación con conocimiento cero' },
      stack: ['Zero-Knowledge Proofs', 'Ethereum'],
      dates: { en: 'Sep 2025', es: 'Sep 2025' },
      image: todo('P3: graphic or architecture diagram of ZKVote with alt text in EN and ES.'),
    },
  ],
  todo: 'P3: exact start and completion dates where only month or year is known; image and alt text for each project; role details for unconfirmed initiatives.',
};

export const links: List<Link> = {
  items: [
    {
      id: 'galaxy',
      label: { en: 'Collective Galaxy', es: 'Galaxia Colectiva' },
      detail: { en: 'The live event', es: 'El evento en vivo' },
      href: '/little-galaxy/',
    },
    {
      id: 'galaxy-source',
      label: { en: 'Collective Galaxy on GitHub', es: 'Galaxia Colectiva en GitHub' },
      detail: { en: 'Source code', es: 'Código fuente' },
      href: 'https://github.com/alexanderkholodov1/little-galaxy',
      external: true,
    },
    {
      id: 'munhub-lab',
      label: { en: 'MunHub Lab', es: 'MunHub Lab' },
      detail: { en: 'Cosmic ray detector platform', es: 'Plataforma del detector de partículas cósmicas' },
      href: 'https://munra-1.web.app/',
      external: true,
    },
    {
      id: 'zkvote-source',
      label: { en: 'ZKVote on GitHub', es: 'ZKVote en GitHub' },
      detail: { en: 'Zero-knowledge voting protocol', es: 'Protocolo de votación con conocimiento cero' },
      href: 'https://github.com/AlexanderKholodov1/zkvote',
      external: true,
    },
    {
      id: 'dragon-ocean-analyzer-source',
      label: { en: 'Dragon Ocean Analyzer on GitHub', es: 'Dragon Ocean Analyzer en GitHub' },
      detail: { en: 'Marine bioacoustics dashboard', es: 'Panel de bioacústica marina' },
      href: 'https://github.com/DhamarAM/hackathon_sala2026',
      external: true,
    },
    {
      id: 'sublime-airlift',
      label: { en: 'Sublime Airlift on Itch.io', es: 'Sublime Airlift en Itch.io' },
      detail: { en: 'Play the 2D narrative horror game', es: 'Jugar videojuego de terror narrativo 2D' },
      href: 'https://alexanderkholodov1.itch.io/sublime-airlift',
      external: true,
    },
    {
      id: 'portfolio',
      label: { en: 'Portfolio', es: 'Portafolio' },
      detail: { en: 'alexanderkholodov.web.app', es: 'alexanderkholodov.web.app' },
      href: '/',
    },
  ],
  todo: null,
};

export const socials: List<Social> = {
  items: [
    { id: 'linkedin', label: 'LinkedIn', handle: 'alexanderkholodov1', href: 'https://www.linkedin.com/in/alexanderkholodov1/' },
    { id: 'instagram', label: 'Instagram', handle: 'alexanderkholodov1', href: 'https://www.instagram.com/alexanderkholodov1/' },
    { id: 'github', label: 'GitHub', handle: 'alexanderkholodov1', href: 'https://github.com/alexanderkholodov1' },
    { id: 'facebook', label: 'Facebook', handle: 'alexanderkholodov0', href: 'https://www.facebook.com/alexanderkholodov0/' },
  ],
  todo: null,
};
