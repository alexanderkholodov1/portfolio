// What he did that is not a project: work, his IEEE Computer Society USFQ board, competitions, teaching,
// volunteering and outreach, events and recognitions. Every line comes from his own posts
// (Projects/Publicaciones, read 2026-11-17) or his CV text in content.ts; nothing is invented.
// `post` is set only where the exact LinkedIn post link is known; `page` links to a detail page on this site.
export type L = { en: string; es: string };
export type Kind = 'work' | 'ieee' | 'competition' | 'teaching' | 'volunteer' | 'event' | 'award';
export type Activity = { id: string; kind: Kind; sort: string; date: L; title: L; org?: L; role?: L; result?: L; text?: L; image?: string; post?: string; page?: string; solo?: boolean; tags?: Kind[] };

const same = (s: string): L => ({ en: s, es: s });

export const linkedinActivity = 'https://www.linkedin.com/in/alexanderkholodov1/recent-activity/all/';

export const activities: Activity[] = [
  // Work
  { id: 'tcs', kind: 'work', sort: '2026-05', date: { en: 'May – Aug 2026', es: 'May – Ago 2026' }, title: { en: 'Artificial Intelligence Intern', es: 'Pasante de inteligencia artificial' }, org: same('Tata Consultancy Services'),
    text: { en: 'A banking-sector project: graph ontologies, synthetic data, mapping of real model data, single sources of truth and documentation.', es: 'Un proyecto del sector bancario: ontologías de grafos, datos sintéticos, mapeo de datos de modelos reales, fuentes únicas de la verdad y documentación.' }, image: '/projects/tcs-ai.webp' },
  { id: 'usfq-support', kind: 'work', sort: '2025-07', date: { en: 'Jul 2025 – Jan 2026', es: 'Jul 2025 – Ene 2026' }, title: { en: 'Technical Support Intern', es: 'Pasante de soporte técnico' }, org: same('Universidad San Francisco de Quito'),
    text: { en: 'Support for the AI and Data Science infrastructure of the USFQ master programmes: Linux, Docker, SSH and VPN.', es: 'Soporte a la infraestructura de IA y Ciencia de Datos de las maestrías de la USFQ: Linux, Docker, SSH y VPN.' }, image: '/projects/usfq-ai-support.webp' },

  // IEEE Computer Society USFQ board
  { id: 'ieee-vp', kind: 'ieee', sort: '2026-01', date: { en: 'Since Jan 2026', es: 'Desde ene 2026' }, title: { en: 'Vice President', es: 'Vicepresidente' }, org: same('IEEE Computer Society USFQ'),
    text: { en: 'Part of the chapter board since 30 January 2026.', es: 'Parte de la directiva del capítulo desde el 30 de enero de 2026.' } },
  { id: 'mini-ieeextreme-2', kind: 'ieee', sort: '2026-10', date: { en: '18 Oct 2026', es: '18 oct 2026' }, title: same('Mini IEEEXtreme 2.0'), role: { en: 'Direct organiser', es: 'Organizador directo' }, solo: true,
    text: { en: 'A programming contest with participants from other universities and provinces.', es: 'Una competencia de programación con participantes de otras universidades y provincias.' } },
  { id: 'ieeextreme-20', kind: 'ieee', sort: '2026-08', date: { en: 'Aug – Oct 2026', es: 'Ago – Oct 2026' }, title: { en: 'IEEEXtreme 20.0 Student Branch Ambassador', es: 'Student Branch Ambassador de IEEEXtreme 20.0' }, org: same('IEEE'),
    text: { en: 'Representing USFQ in Ecuador, and applying with the board for USFQ to host the 24-hour contest.', es: 'Representando a la USFQ en Ecuador, y postulando con la directiva para que la USFQ fuera sede de la competencia de 24 horas.' }, image: '/projects/ieeextreme-ambassador.webp', post: 'https://www.linkedin.com/feed/update/urn:li:activity:7500638662183919616/', page: 'ieeextreme-ambassador' },
  { id: 'prog-club', kind: 'ieee', tags: ['teaching'], sort: '2026-02', date: { en: 'Feb – May 2026', es: 'Feb – May 2026' }, title: { en: 'Competitive Programming Club', es: 'Club de Programación Competitiva' }, role: { en: 'Instructor and co-organiser', es: 'Instructor y coorganizador' },
    text: { en: 'Every Friday of the semester: Python, C++ and mock contests from IEEEXtreme, CodeVita and ICPC, for 20+ students.', es: 'Cada viernes del semestre: Python, C++ y simulacros con problemas de IEEEXtreme, CodeVita e ICPC, para más de 20 estudiantes.' }, image: '/projects/competitive-programming-club.webp', page: 'competitive-programming-club' },
  { id: 'github-course', kind: 'ieee', tags: ['teaching'], sort: '2026-03', date: { en: '27 Mar 2026', es: '27 mar 2026' }, title: { en: 'GitHub From Scratch course', es: 'Curso GitHub Desde Cero' }, role: { en: 'Instructor, with Daniela Castellanos', es: 'Instructor, con Daniela Castellanos' },
    text: { en: 'Git, GitHub, GitHub Desktop and Copilot, with a final group project.', es: 'Git, GitHub, GitHub Desktop y Copilot, con un proyecto final en grupo.' }, image: '/projects/github-desde-cero.webp', page: 'github-desde-cero' },
  { id: 'prompt-course', kind: 'ieee', sort: '2026-04', date: { en: '10 Apr 2026', es: '10 abr 2026' }, title: { en: 'Prompt Engineering and Vibecoding course', es: 'Curso de Prompt Engineering y Vibecoding' }, org: same('IEEE CS USFQ · IEEE CIS USFQ'),
    text: { en: 'Organised by the chapter, with Alex Padilla and Edison Luje as guest speakers.', es: 'Organizado por el capítulo, con Alex Padilla y Edison Luje como ponentes invitados.' }, image: '/projects/prompt-engineering-course.webp', page: 'prompt-engineering-course' },

  // Competitions
  { id: 'interact2hack', kind: 'competition', sort: '2026-04', date: { en: 'Apr 2026', es: 'Abr 2026' }, title: same('Interact2Hack 2026'), result: { en: '3rd place, video game challenge', es: '3.er lugar, reto de videojuegos' },
    text: { en: 'Sublime Airlift, built in 32 hours with team Bolaiko Interactive. 243 participants, 53 teams.', es: 'Sublime Airlift, hecho en 32 horas con el equipo Bolaiko Interactive. 243 participantes, 53 equipos.' }, image: '/projects/sublime-airlift.webp', page: 'sublime-airlift' },
  { id: 'devfest-ctf', kind: 'competition', sort: '2026-09', date: { en: 'Sep 2026', es: 'Sep 2026' }, title: { en: 'Capture The Flag, Google DevFest 2026', es: 'Capture The Flag, Google DevFest 2026' }, result: { en: '5th place', es: '5.º lugar' },
    text: { en: 'With Estefanía Solórzano and Steven Merino, in the CyberMinds EPN CTF.', es: 'Con Estefanía Solórzano y Steven Merino, en el CTF de CyberMinds EPN.' }, image: '/projects/devfest-ctf.webp', page: 'devfest-ctf' },
  { id: 'codevita', kind: 'competition', sort: '2025-11', date: { en: 'Oct – Nov 2025', es: 'Oct – Nov 2025' }, title: same('TCS CodeVita Season 13'), result: { en: 'Round 2 qualifier', es: 'Clasificado a la Ronda 2' },
    text: { en: 'One of five USFQ students to reach Round 2 among 600,000 participants; special recognition from TCS.', es: 'Uno de cinco estudiantes de la USFQ en la Ronda 2 entre 600.000 participantes; reconocimiento especial de TCS.' }, image: '/projects/codevita.webp', page: 'codevita' },
  { id: 'blue-challenge', kind: 'competition', sort: '2025-12', date: { en: 'Dec 2025', es: 'Dic 2025' }, title: same('Diners Club Blue Challenge'), result: same('Outstanding Innovator'),
    text: { en: 'Personal finance challenge; the diploma went to five participants out of 200+.', es: 'Reto de finanzas personales; el diploma fue para cinco participantes entre más de 200.' }, image: '/projects/blue-challenge.webp', page: 'blue-challenge' },
  { id: 'space-apps', kind: 'competition', sort: '2026-11', date: { en: 'Nov 2026', es: 'Nov 2026' }, title: same('NASA Space Apps Challenge 2026'), role: { en: 'Team SK-Horizons', es: 'Equipo SK-Horizons' },
    text: { en: 'Farpoint HORIZON, a 3D space game made in 39 hours.', es: 'Farpoint HORIZON, un juego espacial en 3D hecho en 39 horas.' }, page: 'farpoint-horizon' },
  { id: 'sala-hack', kind: 'competition', sort: '2026-03', date: { en: 'Mar 2026', es: 'Mar 2026' }, title: { en: 'SALA 2026 AI Hackathon', es: 'Hackatón SALA 2026' }, role: { en: 'Frontend and dashboard', es: 'Frontend y panel' },
    text: { en: 'Dragon Ocean Analyzer, for the marine acoustic monitoring challenge.', es: 'Dragon Ocean Analyzer, para el reto de monitoreo acústico marino.' }, image: '/projects/dragon-ocean-analyzer.webp', page: 'dragon-ocean-analyzer' },
  { id: 'ieeextreme-19', kind: 'competition', sort: '2025-10', date: { en: 'Oct 2025', es: 'Oct 2025' }, title: same('IEEEXtreme 19.0'), text: { en: 'The 24-hour programming contest, at the USFQ venue.', es: 'La competencia de programación de 24 horas, en la sede de la USFQ.' } },
  { id: 'mini-ieeextreme-ec', kind: 'competition', sort: '2025-08', date: { en: 'Aug 2025', es: 'Ago 2025' }, title: same('Mini IEEEXtreme EC'), text: { en: '8 hours, 21 problems, in Python and C++.', es: '8 horas, 21 problemas, en Python y C++.' } },

  // Teaching
  { id: 'tutor', kind: 'teaching', sort: '2023-01', date: { en: 'Since 2023', es: 'Desde 2023' }, title: { en: 'Private tutor', es: 'Tutor particular' }, text: { en: 'Programming, mathematics, science and languages (Spanish, English and Russian).', es: 'Programación, matemáticas, ciencias e idiomas (español, inglés y ruso).' } },

  // Volunteering and outreach
  { id: 'slb', kind: 'volunteer', sort: '2026-03', date: { en: 'Mar 2026', es: 'Mar 2026' }, title: { en: 'Computer refurbishment for Amazon schools', es: 'Reacondicionamiento de computadoras para escuelas amazónicas' }, org: { en: 'SLB · USFQ Sustainability Office', es: 'SLB · Oficina de Sostenibilidad USFQ' }, image: '/projects/slb-computer-repowering.webp', page: 'slb-computer-repowering' },
  { id: 'vecinos', kind: 'volunteer', sort: '2026-11', date: { en: '5 Nov 2026', es: '5 nov 2026' }, title: { en: 'Outreach: Vecinos USFQ', es: 'Vinculación: Vecinos USFQ' } },
  { id: 'ingenieros', kind: 'volunteer', sort: '2026-11', date: { en: '6 Nov 2026', es: '6 nov 2026' }, title: { en: 'Outreach: Pequeños Ingenieros', es: 'Vinculación: Pequeños Ingenieros' } },
  { id: 'staff-devfest', kind: 'volunteer', tags: ['event'], sort: '2026-09', date: { en: 'Sep 2026', es: 'Sep 2026' }, title: { en: 'Staff, Google DevFest 2026', es: 'Staff, Google DevFest 2026' }, text: { en: 'Attendee registration for 2,000+ people.', es: 'Registro de asistentes para más de 2.000 personas.' } },
  { id: 'staff-cursor', kind: 'volunteer', sort: '2026-09', date: { en: 'Sep 2026', es: 'Sep 2026' }, title: { en: 'Staff, Cursor x Supabase workshop', es: 'Staff, taller Cursor x Supabase' }, image: '/projects/agent-workshops.webp', page: 'agent-workshops' },
  { id: 'staff-sala', kind: 'volunteer', sort: '2026-03', date: { en: 'Mar 2026', es: 'Mar 2026' }, title: { en: 'Staff, SALA 2026 (Summit of AI in Latin America)', es: 'Staff, SALA 2026 (Summit of AI in Latin America)' } },

  // Recognitions
  { id: 'excellence', kind: 'award', sort: '2026-08', date: { en: '22 Aug 2026', es: '22 ago 2026' }, title: { en: 'Recognition for academic excellence', es: 'Reconocimiento por excelencia académica' }, org: same('Universidad San Francisco de Quito') },

  // Events attended
  ...([
    ['2026-10', 'Oct 2026', 'Oct 2026', 'AWS Student Builder Kickoff'], ['2026-10', 'Oct 2026', 'Oct 2026', 'ACS on Campus'], ['2026-10', 'Oct 2026', 'Oct 2026', "CIO's Day"],
    ['2026-10', 'Oct 2026', 'Oct 2026', 'Avispate BP'], ['2026-09', 'Sep 2026', 'Sep 2026', 'IGNITE Summit 2026'], ['2026-06', 'Jun 2026', 'Jun 2026', 'Build With AI · GDG Quito'],
    ['2026-06', 'Jun 2026', 'Jun 2026', 'Cursor Workshop Quito'], ['2026-05', 'May 2026', 'May 2026', 'AWS Gen AI Day'], ['2026-04', 'Apr 2026', 'Abr 2026', 'Build With AI · USFQ'],
    ['2026-04', 'Apr 2026', 'Abr 2026', 'Telconet Data Center · NVIDIA DGX H200'], ['2026-03', 'Mar 2026', 'Mar 2026', 'ASME EFx Emprendedores'], ['2026-02', 'Feb 2026', 'Feb 2026', 'Verndale Quito'],
    ['2025-11', 'Nov 2025', 'Nov 2025', 'DevFest Quito 2025'], ['2025-11', 'Nov 2025', 'Nov 2025', 'TCS Quito'],
  ] as const).map(([sort, en, es, title], k): Activity => ({ id: `event-${k}`, kind: 'event', sort, date: { en, es }, title: same(title) })),
];
