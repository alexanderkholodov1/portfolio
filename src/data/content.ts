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
      id: 'farpoint-horizon',
      title: { en: 'Farpoint HORIZON', es: 'Farpoint HORIZON' },
      context: { en: 'NASA Space Apps Challenge 2026 · Team SK-Horizons', es: 'NASA Space Apps Challenge 2026 · Equipo SK-Horizons' },
      pitch: {
        en: 'Six real NASA missions, four guinea pigs who were there, and one mission that is all yours. A 3D space game made in Quito in 39 hours, where anyone, alone or with up to three friends, lives a mission from the first idea to the moment the data comes home.',
        es: 'Seis misiones reales de la NASA, cuatro cuyes que estuvieron ahí y una misión que es toda tuya. Un juego espacial en 3D hecho en Quito en 39 horas, donde cualquiera, solo o con hasta tres amigos, vive una misión desde la primera idea hasta que los datos vuelven a casa.',
      },
      href: 'https://farpoint-horizon.web.app/',
      source: {
        id: 'farpoint-horizon-source',
        label: { en: 'Farpoint HORIZON on GitHub', es: 'Código de Farpoint HORIZON en GitHub' },
        href: 'https://github.com/alexanderkholodov1/farpoint-horizon-forever',
        external: true,
      },
      role: todo('P3: his role in team SK-Horizons for Farpoint HORIZON, in EN and ES.'),
      stack: ['Godot', 'Blender'],
      dates: { en: 'Nov 2026', es: 'Nov 2026' },
      image: { src: '/projects/farpoint-horizon.webp', alt: { en: 'Farpoint HORIZON title screen: the Earth from orbit with a satellite on its path and the Play the story button.', es: 'Pantalla de inicio de Farpoint HORIZON: la Tierra vista desde la órbita, un satélite en su trayectoria y el botón para jugar la historia.' } },
    },
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
      image: { src: '/projects/collective-galaxy.webp', alt: { en: 'Collective Galaxy welcome screen: a spiral galaxy of light around the title and the Enter button.', es: 'Pantalla de bienvenida de Galaxia Colectiva: una galaxia espiral de luz alrededor del título y el botón para entrar.' } },
    },
    {
      id: 'studium',
      title: { en: 'Studium', es: 'Studium' },
      context: { en: 'Personal project · USFQ students', es: 'Proyecto personal · Estudiantes de la USFQ' },
      pitch: {
        en: 'A personal space to study anything and a community of students who share guides, notes and what they know of each professor. Members get their next exam with a countdown, goals, a focus timer and their own AI, and every interaction in the community is positive by design.',
        es: 'Un espacio personal para estudiar cualquier cosa y una comunidad de estudiantes que comparten guías, apuntes y lo que saben de cada profesor. Cada miembro ve su próximo examen con cuenta regresiva, metas, un temporizador de enfoque y su propia IA, y toda interacción en la comunidad es positiva por diseño.',
      },
      href: 'https://alexanderkholodov.web.app/studium/',
      source: { id: 'studium-source', label: { en: 'Studium on GitHub', es: 'Código de Studium en GitHub' }, href: 'https://github.com/alexanderkholodov1/studium', external: true },
      role: { en: 'Design and development', es: 'Diseño y desarrollo' },
      stack: ['JavaScript', 'Firebase', 'Firestore', 'Gemini'],
      dates: { en: 'Nov 2026', es: 'Nov 2026' },
      image: { src: '/projects/studium.webp', alt: { en: 'Studium home: the name large, study cards, an exam countdown and a goal checklist.', es: 'Inicio de Studium: el nombre en grande, tarjetas de estudio, la cuenta regresiva de un examen y una lista de metas.' } },
    },
    {
      id: 'unallocated',
      title: { en: 'UNALLOCATED', es: 'UNALLOCATED' },
      context: { en: 'Horror mod for Minecraft · Terror en Primera Persona jam', es: 'Mod de terror para Minecraft · Jam Terror en Primera Persona' },
      pitch: {
        en: 'A first-person horror mod for Minecraft Java 26.3 built on Fabric: a contract before the menu, a saved session core, a map generated by code with a lobby, a hill, a road, a base and a mine, and scares that wait for the player.',
        es: 'Un mod de terror en primera persona para Minecraft Java 26.3 construido sobre Fabric: un contrato antes del menú, un núcleo de sesión guardado, un mapa generado por código con lobby, colina, camino, base y mina, y sustos que esperan al jugador.',
      },
      source: { id: 'unallocated-source', label: { en: 'UNALLOCATED on GitHub', es: 'Código de UNALLOCATED en GitHub' }, href: 'https://github.com/alexanderkholodov1/unallocated_minecraft_mod', external: true },
      role: { en: 'Development', es: 'Desarrollo' },
      stack: ['Java', 'Fabric', 'Minecraft'],
      dates: { en: 'Oct – Nov 2026', es: 'Oct – Nov 2026' },
      image: { src: '/projects/unallocated.webp', alt: { en: 'A dark blocky hill at night with one lit window and a figure with red eyes, under the title UNALLOCATED.', es: 'Una colina de bloques de noche con una ventana encendida y una figura de ojos rojos, bajo el título UNALLOCATED.' } },
    },
    {
      id: 'aklabs-store',
      title: { en: 'AKLabs Store', es: 'AKLabs Store' },
      context: { en: 'Personal project · AKLabs merch', es: 'Proyecto personal · Merch de AKLabs' },
      pitch: {
        en: 'An online shop for AKLabs merch (hoodies, T-shirts, joggers, caps and bottles) with a complete purchase flow, from product to cart to a four-step checkout, in two regions: Ecuador in US dollars and Europe in euros.',
        es: 'Una tienda en línea del merch de AKLabs (hoodies, camisetas, joggers, gorras y botellas) con un flujo de compra completo, del producto al carrito y a un checkout de cuatro pasos, en dos regiones: Ecuador en dólares y Europa en euros.',
      },
      source: { id: 'aklabs-store-source', label: { en: 'AKLabs Store on GitHub', es: 'Código de AKLabs Store en GitHub' }, href: 'https://github.com/alexanderkholodov1/aklabs-store', external: true },
      role: { en: 'Design and development', es: 'Diseño y desarrollo' },
      stack: ['Medusa v2', 'Next.js', 'Supabase', 'PostgreSQL'],
      dates: { en: 'Sep – Nov 2026', es: 'Sep – Nov 2026' },
      image: { src: '/projects/aklabs-store.webp', alt: { en: 'The AKLabs Store: a hoodie, a T-shirt, a cap and a bottle in the AKLabs colours.', es: 'La tienda de AKLabs: un hoodie, una camiseta, una gorra y una botella en los colores de AKLabs.' } },
    },
    {
      id: 'pancho-bus',
      title: { en: 'Pancho Bus', es: 'Pancho Bus' },
      context: { en: 'Web Development 2 · USFQ', es: 'Desarrollo Web 2 · USFQ' },
      pitch: {
        en: 'A platform for the free university shuttle at USFQ: seat booking, QR boarding, live route tracking, operational messages and demand analytics, in one system shared by students, administration and route staff. Built from two long interviews with daily riders; a working prototype on synthetic data.',
        es: 'Una plataforma para el bus universitario gratuito de la USFQ: reserva de asientos, abordaje con QR, seguimiento de rutas en vivo, mensajes operativos y analítica de demanda, en un solo sistema compartido por estudiantes, administración y personal de rutas. Nació de dos entrevistas largas con pasajeros diarios; es un prototipo funcional con datos sintéticos.',
      },
      href: 'https://panchobus-backend--panchobus-1.us-east4.hosted.app/',
      source: { id: 'pancho-bus-source', label: { en: 'Pancho Bus on GitHub', es: 'Código de Pancho Bus en GitHub' }, href: 'https://github.com/alexanderkholodov1/panchobus', external: true },
      role: { en: 'Product design, data model, the 21 screens and deployment', es: 'Diseño de producto, modelo de datos, las 21 pantallas y el despliegue' },
      stack: ['TypeScript', 'Firebase App Hosting'],
      dates: { en: 'May – Sep 2026', es: 'May – Sep 2026' },
      image: { src: '/projects/pancho-bus.webp', alt: { en: 'Pancho Bus home: "Your freedom starts here" on red, with buttons to create an account or try the demo.', es: 'Inicio de Pancho Bus: "Your freedom starts here" sobre rojo, con botones para crear una cuenta o probar la demo.' } },
    },
    {
      id: 'nivela',
      title: { en: 'Nivela', es: 'Nivela' },
      context: { en: 'Entrepreneurship · USFQ', es: 'Emprendimiento · USFQ' },
      pitch: {
        en: 'An AI mentor that knows your job: it diagnoses your role, builds your learning route, teaches the AI tools your real tasks need and certifies competence that can be verified. Validated with ten interviews and five surveys with more than 290 responses.',
        es: 'Un mentor de IA que conoce tu trabajo: diagnostica tu rol, arma tu ruta de aprendizaje, enseña las herramientas de IA que tus tareas reales necesitan y certifica una competencia verificable. Validado con diez entrevistas y cinco encuestas con más de 290 respuestas.',
      },
      href: 'https://nivela-ec.web.app/',
      source: { id: 'nivela-source', label: { en: 'Nivela on GitHub', es: 'Código de Nivela en GitHub' }, href: 'https://github.com/alexanderkholodov1/nivela', external: true },
      role: { en: 'Designed, built and deployed the platform, in a five-person team', es: 'Diseño, construcción y despliegue de la plataforma, en un equipo de cinco personas' },
      stack: ['HTML', 'JavaScript', 'Firebase Hosting'],
      dates: { en: 'Jun – Sep 2026', es: 'Jun – Sep 2026' },
      image: { src: '/projects/nivela.webp', alt: { en: 'Nivela home: "AI judgment that doesn\u2019t expire" beside a mentor chat and a learning route.', es: 'Inicio de Nivela: "Criterio con IA que no caduca" junto a un chat con el mentor y una ruta de aprendizaje.' } },
    },
    {
      id: 'ieeextreme-ambassador',
      title: { en: 'IEEEXtreme 20.0 Ambassador and Mini IEEEXtreme 2.0', es: 'Embajador de IEEEXtreme 20.0 y Mini IEEEXtreme 2.0' },
      context: { en: 'IEEE · IEEE Computer Society USFQ', es: 'IEEE · IEEE Computer Society USFQ' },
      pitch: {
        en: 'Selected as IEEEXtreme 20.0 Student Branch Ambassador, representing USFQ in Ecuador, and applied with the chapter board for USFQ to host the 24-hour contest. Direct organiser of Mini IEEEXtreme 2.0, with participants from other universities and provinces.',
        es: 'Seleccionado como Student Branch Ambassador de IEEEXtreme 20.0, representando a la USFQ en Ecuador, y postulación junto a la directiva del capítulo para que la USFQ fuera sede de la competencia de 24 horas. Organizador directo de Mini IEEEXtreme 2.0, con participantes de otras universidades y provincias.',
      },
      role: { en: 'Student Branch Ambassador and organiser', es: 'Student Branch Ambassador y organizador' },
      stack: ['Competitive programming', 'Event organisation'],
      dates: { en: 'Aug – Oct 2026', es: 'Ago – Oct 2026' },
      image: { src: '/projects/ieeextreme-ambassador.webp', alt: { en: 'IEEEXtreme 20.0 ambassador materials with the ambassador code.', es: 'Materiales de embajador de IEEEXtreme 20.0 con el código de embajador.' } },
    },
    {
      id: 'devfest-ctf',
      title: { en: 'Capture The Flag at DevFest 2026', es: 'Capture The Flag en DevFest 2026' },
      context: { en: 'Google DevFest 2026 · CyberMinds EPN · 5th Place', es: 'Google DevFest 2026 · CyberMinds EPN · 5.º lugar' },
      pitch: {
        en: 'Fifth place with my team in the CyberMinds EPN Capture The Flag at Google DevFest 2026, an event of more than 2,000 attendees where I also served as staff in attendee registration.',
        es: 'Quinto lugar con mi equipo en el Capture The Flag de CyberMinds EPN en Google DevFest 2026, un evento de más de 2.000 asistentes donde también formé parte del staff en el registro de asistentes.',
      },
      role: { en: 'Competitor, with Estefanía Solórzano and Steven Merino; event staff', es: 'Competidor, con Estefanía Solórzano y Steven Merino; staff del evento' },
      stack: ['Cybersecurity', 'CTF'],
      dates: { en: 'Sep 2026', es: 'Sep 2026' },
      image: { src: '/projects/devfest-ctf.webp', alt: { en: 'Google DevFest 2026 in Quito: the crowd around the stage.', es: 'Google DevFest 2026 en Quito: el público alrededor del escenario.' } },
    },
    {
      id: 'agent-workshops',
      title: { en: 'Agentic Development Workshops', es: 'Prácticas de talleres con agentes' },
      context: { en: 'Cursor Community Quito · NEST.Lab · USFQ', es: 'Cursor Community Quito · NEST.Lab · USFQ' },
      pitch: {
        en: 'Hands-on AI agent development at Cursor Workshop Quito, as a participant, and at the Cursor x Supabase workshop, as staff and participant. Covered parallel multi-agent workflows guided by AGENTS.md, Supabase integration, Vercel deployments, and e-commerce prototyping with Medusa.js and Figma.',
        es: 'Desarrollo práctico con agentes de inteligencia artificial en Cursor Workshop Quito, como participante, y en el taller Cursor x Supabase, como staff y participante. Incluyeron flujos multiagente en paralelo guiados por AGENTS.md, integración de Supabase y despliegue en Vercel, además de prototipado de comercio electrónico con Medusa.js y Figma.',
      },
      role: { en: 'Participant and event staff at Cursor x Supabase', es: 'Participante y personal de apoyo en Cursor x Supabase' },
      stack: ['Cursor', 'GitHub', 'Supabase', 'Vercel', 'Medusa.js', 'Figma'],
      dates: { en: 'Jun – Sep 2026', es: 'Jun – Sep 2026' },
      image: { src: '/projects/agent-workshops.webp', alt: { en: 'The Cursor x Supabase workshop at USFQ: a talk on backend with Supabase.', es: 'El taller Cursor x Supabase en la USFQ: una charla sobre backend con Supabase.' } },
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
      image: { src: '/projects/competitive-programming-club.webp', alt: { en: 'The Competitive Programming Club at the end of the semester.', es: 'El Club de Programación Competitiva al cierre del semestre.' } },
    },
    {
      id: 'sublime-airlift',
      title: { en: 'Sublime Airlift', es: 'Sublime Airlift' },
      context: { en: 'Interact2Hack 2026 · 3rd place, video game challenge', es: 'Interact2Hack 2026 · 3.er lugar en el reto de videojuegos' },
      pitch: {
        en: "2D narrative horror game inspired by Dante's Divine Comedy and set in a post-technological Purgatory, controlled entirely with the mouse. Built in 32 hours during the Interact2Hack hackathon, earning 3rd place in the video game challenge.",
        es: 'Videojuego de terror narrativo en 2D inspirado en La Divina Comedia y ambientado en un Purgatorio postecnológico, controlado exclusivamente con el ratón. Desarrollado en 32 horas durante la hackatón Interact2Hack, donde obtuvo el tercer lugar en el reto de videojuegos.',
      },
      href: 'https://alexanderkholodov1.itch.io/sublime-airlift',
      role: { en: 'Level design, mechanics implementation, narrative, and team coordination', es: 'Construcción de niveles, implementación de mecánicas y narrativa, y organización del equipo' },
      stack: ['Godot Engine'],
      dates: { en: 'Apr 2026', es: 'Abr 2026' },
      image: { src: '/projects/sublime-airlift.webp', alt: { en: 'Sublime Airlift main menu in pixel art: Play, Credits, Settings and Exit over a dark purple world.', es: 'Menú principal de Sublime Airlift en pixel art: Jugar, Créditos, Ajustes y Salir sobre un mundo morado y oscuro.' } },
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
      image: { src: '/projects/prompt-engineering-course.webp', alt: { en: 'The Prompt Engineering and Vibecoding course in a USFQ auditorium.', es: 'El curso de Prompt Engineering y Vibecoding en un auditorio de la USFQ.' } },
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
      image: { src: '/projects/github-desde-cero.webp', alt: { en: 'A GitHub Desde Cero session in a USFQ classroom.', es: 'Una sesión de GitHub Desde Cero en un aula de la USFQ.' } },
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
      image: { src: '/projects/slb-computer-repowering.webp', alt: { en: 'The signing of the SLB and USFQ agreement, with the volunteers.', es: 'La firma del convenio entre SLB y la USFQ, con los voluntarios.' } },
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
      image: { src: '/projects/dragon-ocean-analyzer.webp', alt: { en: 'The Dragon Ocean Analyzer pitch on stage at the SALA 2026 hackathon.', es: 'La presentación de Dragon Ocean Analyzer en el escenario de la hackatón SALA 2026.' } },
    },
    {
      id: 'munhub-lab',
      title: { en: 'MunHub', es: 'MunHub' },
      context: { en: 'Space Front USFQ · Space Expo', es: 'Space Front USFQ · Space Expo' },
      pitch: {
        en: 'Web platform for real-time acquisition, storage, and visualization of cosmic ray particles recorded by a CosmicWatch detector at USFQ Leopard Lab. Features serial data ingestion via Web Serial API and a Python WebSocket bridge, real-time database storage, and an administration panel. It is now growing into MuonHub, an open network of cosmic-ray detectors across Latin America.',
        es: 'Plataforma web para adquisición, almacenamiento y visualización en tiempo real de partículas cósmicas registradas por el detector CosmicWatch en el laboratorio Leopard Lab de la USFQ. Incluye conexión serie vía Web Serial API y WebSocket en Python, base de datos en tiempo real y panel de administración. Hoy crece como MuonHub, una red abierta de detectores de rayos cósmicos en Latinoamérica.',
      },
      href: 'https://munhub-lab.web.app/',
      source: { id: 'munhub-lab-source', label: { en: 'MuonHub on GitHub', es: 'Código de MuonHub en GitHub' }, href: 'https://github.com/alexanderkholodov1/MuonHub', external: true },
      role: { en: 'Full-stack web platform design and development', es: 'Desarrollo full stack de la plataforma web' },
      stack: ['Firebase Hosting', 'Firebase Realtime Database', 'Firebase Auth', 'Web Serial API', 'Python', 'WebSocket'],
      dates: { en: 'Mar – Nov 2026', es: 'Mar – Nov 2026' },
      image: { src: '/projects/munhub-lab.webp', alt: { en: 'MunHub dashboard: event rate, SiPM signal, temperature and pressure, and dead time recorded by the detector.', es: 'Panel de MunHub: tasa de eventos, señal del SiPM, temperatura y presión, y tiempo muerto registrados por el detector.' } },
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
      image: { src: '/projects/blue-challenge.webp', alt: { en: 'Receiving the Outstanding Innovator diploma at the Blue Challenge.', es: 'Recibiendo el diploma Outstanding Innovator en el Blue Challenge.' } },
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
      image: { src: '/projects/dragons-never-die.webp', alt: { en: 'Dragons Never Die title art in pixel art, for the USFQ Game Jam.', es: 'Arte del título de Dragons Never Die en pixel art, para la USFQ Game Jam.' } },
    },
    {
      id: 'codevita',
      title: { en: 'TCS CodeVita Season 13', es: 'TCS CodeVita Temporada 13' },
      context: { en: 'Tata Consultancy Services · Round 2 qualifier', es: 'Tata Consultancy Services · Clasificado a la Ronda 2' },
      pitch: {
        en: 'Qualified for Round 2 of TCS CodeVita Season 13, a programming competition with more than 600,000 participants, as one of only five USFQ students to get that far, and received a special recognition from TCS during a visit to its Quito office.',
        es: 'Clasificado a la Ronda 2 de TCS CodeVita Temporada 13, una competencia de programación con más de 600.000 participantes, como uno de solo cinco estudiantes de la USFQ en llegar hasta ahí, y reconocimiento especial de TCS durante una visita a su oficina en Quito.',
      },
      role: { en: 'Competitor', es: 'Competidor' },
      stack: ['Competitive programming'],
      dates: { en: 'Oct – Nov 2025', es: 'Oct – Nov 2025' },
      image: { src: '/projects/codevita.webp', alt: { en: 'A group visit to TCS in Quito, where the CodeVita recognition was given.', es: 'La visita grupal a TCS en Quito, donde se entregó el reconocimiento de CodeVita.' } },
    },
  ],
  todo: 'P3: exact start and completion dates where only month or year is known; image and alt text for each project; role details for unconfirmed initiatives.',
};

// Certifications he passed (his TCS post, Projects/Publicaciones/33; confirmed by him on 2026-11-17).
export type Certification = { code: string; name: string; issuer: string; area: Localized };
export const certifications: Certification[] = [
  { code: 'AZ-900', name: 'Azure Fundamentals', issuer: 'Microsoft', area: { en: 'Cloud', es: 'Nube' } },
  { code: 'SC-900', name: 'Security, Compliance, and Identity Fundamentals', issuer: 'Microsoft', area: { en: 'Security', es: 'Seguridad' } },
  { code: 'GH-900', name: 'GitHub Foundations', issuer: 'Microsoft · GitHub', area: { en: 'Development', es: 'Desarrollo' } },
  { code: 'AB-730', name: 'AI Business Professional', issuer: 'Microsoft', area: { en: 'Artificial intelligence', es: 'Inteligencia artificial' } },
  { code: 'AB-731', name: 'AI Transformation Leader', issuer: 'Microsoft', area: { en: 'Artificial intelligence', es: 'Inteligencia artificial' } },
];

// Work experience, kept apart from projects (his note of 2026-11-17).
export const experience: Project[] = [
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
    image: { src: '/projects/tcs-ai.webp', alt: { en: 'At the Tata Consultancy Services office in Quito.', es: 'En la oficina de Tata Consultancy Services en Quito.' } },
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
    image: { src: '/projects/usfq-ai-support.webp', alt: { en: 'USFQ certificate for the AI and Data Science infrastructure support team.', es: 'Certificado de la USFQ por el equipo de soporte de la infraestructura de IA y Ciencia de Datos.' } },
  },
];

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
      label: { en: 'MunHub', es: 'MunHub' },
      detail: { en: 'Cosmic ray detector platform', es: 'Plataforma del detector de partículas cósmicas' },
      href: 'https://munhub-lab.web.app/',
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

// Services: the catalog and prices he approved on 2026-11-16 (caspian-kb research/2026-11-16-portfolio-services,
// "apruebo como esta y luego lo iremos ajustando"). Prices in USD: individuals in Ecuador, companies in Ecuador, abroad.
// The public page shows a price only after the visitor picks a path (his note, 2026-11-16 23:29Z).
export type Offer = { title: Localized; price: [string, string, string] };
export type ServicePath = { id: string; title: Localized; ask: Localized; offers: Offer[] };
export const services: ServicePath[] = [
  { id: 'software', title: { en: 'Software', es: 'Software' }, ask: { en: 'Tell me what you want to automate or solve.', es: 'Cuéntame qué quieres automatizar o resolver.' }, offers: [
    { title: { en: 'Simple script', es: 'Script sencillo' }, price: ['$10', '$35', '$50'] },
    { title: { en: 'Automation or bot', es: 'Automatización o bot' }, price: ['$50', '$120', '$200'] },
  ] },
  { id: 'web', title: { en: 'Web', es: 'Web' }, ask: { en: 'A page, a site or an application?', es: '¿Una página, un sitio o una aplicación?' }, offers: [
    { title: { en: 'Single-page site or portfolio', es: 'Página de una sección o portafolio' }, price: ['$120', '$250', '$450'] },
    { title: { en: 'Business website (4 to 6 pages)', es: 'Sitio de empresa (4 a 6 páginas)' }, price: ['$350', '$650', '$1,200'] },
    { title: { en: 'Web application (first version)', es: 'Aplicación web (primera versión)' }, price: ['$600', '$1,500', '$2,800'] },
    { title: { en: 'Mobile application (first version)', es: 'Aplicación móvil (primera versión)' }, price: ['$1,200', '$2,400', '$4,500'] },
  ] },
  { id: 'design', title: { en: 'Design', es: 'Diseño' }, ask: { en: 'Which piece do you need, and what for?', es: '¿Qué pieza necesitas y para qué?' }, offers: [
    { title: { en: 'Post, poster or sign', es: 'Post, póster o letrero' }, price: ['$12', '$25', '$45'] },
    { title: { en: 'Certificate', es: 'Certificado' }, price: ['$15', '$30', '$50'] },
    { title: { en: 'Logo and identity', es: 'Logo e identidad' }, price: ['$50', '$150', '$300'] },
    { title: { en: 'Ten AI images', es: 'Diez imágenes con IA' }, price: ['$15', '$35', '$60'] },
    { title: { en: 'Presentation, per slide', es: 'Presentación, por diapositiva' }, price: ['$6', '$12', '$20'] },
  ] },
  { id: 'video', title: { en: 'Video', es: 'Video' }, ask: { en: 'What kind of video, and how long?', es: '¿Qué tipo de video y cuánto dura?' }, offers: [
    { title: { en: 'Reel, 30 to 60 seconds', es: 'Reel de 30 a 60 segundos' }, price: ['$15', '$30', '$50'] },
    { title: { en: 'Long video, per finished minute', es: 'Video largo, por minuto terminado' }, price: ['$12', '$22', '$35'] },
  ] },
  { id: '3d', title: { en: '3D', es: '3D' }, ask: { en: 'What do you want modelled? If you need the physical piece, we see it next.', es: '¿Qué quieres modelar? Si necesitas la pieza física, lo vemos después.' }, offers: [
    { title: { en: '3D modelling, per hour', es: 'Modelado 3D, por hora' }, price: ['$12', '$20', '$35'] },
  ] },
  { id: 'learn', title: { en: 'Training', es: 'Formación' }, ask: { en: 'A class, a workshop or a talk?', es: '¿Una clase, un taller o una charla?' }, offers: [
    { title: { en: 'Private class, per hour', es: 'Clase particular, por hora' }, price: ['$15', '$25', '$40'] },
    { title: { en: 'Workshop or talk (2 hours)', es: 'Taller o charla (2 horas)' }, price: ['$60', '$200', '$350'] },
  ] },
  { id: 'other', title: { en: 'Other', es: 'Otro' }, ask: { en: 'Tell me what you need; I review it and propose scope, time and price.', es: 'Cuéntame qué necesitas; lo reviso y te propongo alcance, plazo y precio.' }, offers: [] },
];
