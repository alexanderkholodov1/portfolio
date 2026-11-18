// What he did that is not a project, by category: work, his leadership in IEEE CS USFQ, teaching, competitions,
// volunteering and outreach, recognitions and events. Every line comes from his own posts (Projects/Publicaciones,
// read 2026-11-17) or his CV text in content.ts; photos come from the same posts, and the three covers without a
// photo are generated. `post` is set only where the exact LinkedIn post link is known.
export type L = { en: string; es: string };
export type Kind = 'work' | 'ieee' | 'teaching' | 'competition' | 'volunteer' | 'award' | 'event';
export type Activity = { id: string; kind: Kind; sort: string; date: L; title: L; org?: L; role?: L; result?: L; text?: L; image: string; post?: string; page?: string; solo?: boolean };

const same = (s: string): L => ({ en: s, es: s });
const a = (n: string) => `/activities/${n}.webp`;
const pj = (n: string) => `/projects/${n}.webp`;

export const linkedinActivity = 'https://www.linkedin.com/in/alexanderkholodov1/recent-activity/all/';
export const kinds: Kind[] = ['work', 'ieee', 'teaching', 'competition', 'volunteer', 'award', 'event'];

export const activities: Activity[] = [
  // Work
  { id: 'tcs', kind: 'work', sort: '2026-05', date: { en: 'May – Aug 2026', es: 'May – Ago 2026' }, title: { en: 'Artificial Intelligence Intern', es: 'Pasante de inteligencia artificial' }, org: same('Tata Consultancy Services'),
    text: { en: 'A banking-sector project: graph ontologies, synthetic data, mapping of real model data and single sources of truth.', es: 'Un proyecto del sector bancario: ontologías de grafos, datos sintéticos, mapeo de datos reales y fuentes únicas de la verdad.' }, image: pj('tcs-ai') },
  { id: 'usfq-support', kind: 'work', sort: '2025-07', date: { en: 'Jul 2025 – Jan 2026', es: 'Jul 2025 – Ene 2026' }, title: { en: 'Technical Support Intern', es: 'Pasante de soporte técnico' }, org: same('Universidad San Francisco de Quito'),
    text: { en: 'The AI and Data Science infrastructure of the USFQ master programmes: Linux, Docker, SSH and VPN.', es: 'La infraestructura de IA y Ciencia de Datos de las maestrías de la USFQ: Linux, Docker, SSH y VPN.' }, image: pj('usfq-ai-support') },

  // Leadership in IEEE Computer Society USFQ
  { id: 'ieee-vp', kind: 'ieee', sort: '2026-12', date: { en: 'Since Jan 2026', es: 'Desde ene 2026' }, title: { en: 'Vice President', es: 'Vicepresidente' }, org: same('IEEE Computer Society USFQ'),
    text: { en: 'On the chapter board, organising courses, contests and community for USFQ students.', es: 'En la directiva del capítulo, organizando cursos, competencias y comunidad para estudiantes de la USFQ.' }, image: a('ieee-vp') },
  { id: 'mini-ieeextreme-2', kind: 'ieee', sort: '2026-10', date: { en: '18 Oct 2026', es: '18 oct 2026' }, title: same('Mini IEEEXtreme 2.0'), solo: true,
    text: { en: 'A programming contest with participants from other universities and provinces.', es: 'Una competencia de programación con participantes de otras universidades y provincias.' }, image: a('mini-ieeextreme-2') },
  { id: 'ieeextreme-20', kind: 'ieee', sort: '2026-09', date: { en: 'Aug – Oct 2026', es: 'Ago – Oct 2026' }, title: { en: 'IEEEXtreme 20.0 Student Branch Ambassador', es: 'Student Branch Ambassador de IEEEXtreme 20.0' }, org: same('IEEE'),
    text: { en: 'Representing USFQ in Ecuador, and applying with the board for USFQ to host the 24-hour contest.', es: 'Representando a la USFQ en Ecuador, y postulando con la directiva para que la USFQ fuera sede de la competencia de 24 horas.' }, image: pj('ieeextreme-ambassador'), post: 'https://www.linkedin.com/feed/update/urn:li:activity:7500638662183919616/', page: 'ieeextreme-ambassador' },
  { id: 'prompt-course', kind: 'ieee', sort: '2026-04', date: { en: '10 Apr 2026', es: '10 abr 2026' }, title: { en: 'Prompt Engineering and Vibecoding course', es: 'Curso de Prompt Engineering y Vibecoding' }, org: same('IEEE CS USFQ · IEEE CIS USFQ'),
    text: { en: 'Organised by the chapters, with Alex Padilla and Edison Luje as guest speakers.', es: 'Organizado por los capítulos, con Alex Padilla y Edison Luje como ponentes invitados.' }, image: pj('prompt-engineering-course'), page: 'prompt-engineering-course' },

  // Teaching
  { id: 'prog-club', kind: 'teaching', sort: '2026-05', date: { en: 'Feb – May 2026', es: 'Feb – May 2026' }, title: { en: 'Competitive Programming Club', es: 'Club de Programación Competitiva' }, role: { en: 'Instructor and co-organiser', es: 'Instructor y coorganizador' },
    text: { en: 'A full semester of Fridays for 20+ students: Python, C++ and mock contests from IEEEXtreme, CodeVita and ICPC.', es: 'Un semestre completo de viernes para más de 20 estudiantes: Python, C++ y simulacros de IEEEXtreme, CodeVita e ICPC.' }, image: pj('competitive-programming-club'), page: 'competitive-programming-club' },
  { id: 'github-course', kind: 'teaching', sort: '2026-03', date: { en: '27 Mar 2026', es: '27 mar 2026' }, title: { en: 'GitHub From Scratch', es: 'GitHub Desde Cero' }, role: { en: 'Instructor, with Daniela Castellanos', es: 'Instructor, con Daniela Castellanos' },
    text: { en: 'Git, GitHub, GitHub Desktop and Copilot, with a final group project.', es: 'Git, GitHub, GitHub Desktop y Copilot, con un proyecto final en grupo.' }, image: pj('github-desde-cero'), page: 'github-desde-cero' },
  { id: 'tutor', kind: 'teaching', sort: '2023-01', date: { en: 'Since 2023', es: 'Desde 2023' }, title: { en: 'Private tutor', es: 'Tutor particular' },
    text: { en: 'Programming, mathematics, science and languages: Spanish, English and Russian.', es: 'Programación, matemáticas, ciencias e idiomas: español, inglés y ruso.' }, image: a('tutor') },

  // Competitions
  { id: 'space-apps', kind: 'competition', sort: '2026-11', date: { en: 'Nov 2026', es: 'Nov 2026' }, title: same('NASA Space Apps Challenge 2026'), role: { en: 'Team SK-Horizons', es: 'Equipo SK-Horizons' },
    text: { en: 'Farpoint HORIZON, a 3D space game made in 39 hours.', es: 'Farpoint HORIZON, un juego espacial en 3D hecho en 39 horas.' }, image: pj('farpoint-horizon'), page: 'farpoint-horizon' },
  { id: 'devfest-ctf', kind: 'competition', sort: '2026-09', date: { en: 'Sep 2026', es: 'Sep 2026' }, title: { en: 'Capture The Flag, Google DevFest 2026', es: 'Capture The Flag, Google DevFest 2026' }, result: { en: '5th place', es: '5.º lugar' },
    text: { en: 'With Estefanía Solórzano and Steven Merino, in the CyberMinds EPN CTF.', es: 'Con Estefanía Solórzano y Steven Merino, en el CTF de CyberMinds EPN.' }, image: pj('devfest-ctf'), page: 'devfest-ctf' },
  { id: 'interact2hack', kind: 'competition', sort: '2026-04', date: { en: 'Apr 2026', es: 'Abr 2026' }, title: same('Interact2Hack 2026'), result: { en: '3rd place, video game challenge', es: '3.er lugar, reto de videojuegos' },
    text: { en: 'Sublime Airlift, built in 32 hours with team Bolaiko Interactive.', es: 'Sublime Airlift, hecho en 32 horas con el equipo Bolaiko Interactive.' }, image: pj('sublime-airlift'), page: 'sublime-airlift' },
  { id: 'sala-hack', kind: 'competition', sort: '2026-03', date: { en: 'Mar 2026', es: 'Mar 2026' }, title: { en: 'SALA 2026 AI Hackathon', es: 'Hackatón SALA 2026' }, role: { en: 'Frontend and dashboard', es: 'Frontend y panel' },
    text: { en: 'Dragon Ocean Analyzer, for the marine acoustic monitoring challenge.', es: 'Dragon Ocean Analyzer, para el reto de monitoreo acústico marino.' }, image: pj('dragon-ocean-analyzer'), page: 'dragon-ocean-analyzer' },
  { id: 'blue-challenge', kind: 'competition', sort: '2025-12', date: { en: 'Dec 2025', es: 'Dic 2025' }, title: same('Diners Club Blue Challenge'), result: same('Outstanding Innovator'),
    text: { en: 'A personal finance challenge; the diploma went to five participants.', es: 'Un reto de finanzas personales; el diploma fue para cinco participantes.' }, image: pj('blue-challenge'), page: 'blue-challenge' },
  { id: 'codevita', kind: 'competition', sort: '2025-11', date: { en: 'Oct – Nov 2025', es: 'Oct – Nov 2025' }, title: same('TCS CodeVita Season 13'), result: { en: 'Round 2', es: 'Ronda 2' },
    text: { en: 'One of five USFQ students in Round 2, with a special recognition from TCS.', es: 'Uno de cinco estudiantes de la USFQ en la Ronda 2, con un reconocimiento especial de TCS.' }, image: a('codevita-visit'), page: 'codevita' },
  { id: 'ieeextreme-19', kind: 'competition', sort: '2025-10', date: { en: 'Oct 2025', es: 'Oct 2025' }, title: same('IEEEXtreme 19.0'),
    text: { en: 'The 24-hour programming contest, at the USFQ venue.', es: 'La competencia de programación de 24 horas, en la sede de la USFQ.' }, image: a('ieeextreme-19') },
  { id: 'mini-ieeextreme-ec', kind: 'competition', sort: '2025-08', date: { en: 'Aug 2025', es: 'Ago 2025' }, title: same('Mini IEEEXtreme EC'),
    text: { en: '8 hours and 21 problems, in Python and C++.', es: '8 horas y 21 problemas, en Python y C++.' }, image: a('mini-ieeextreme-ec') },

  // Volunteering and outreach
  { id: 'vecinos', kind: 'volunteer', sort: '2026-11', date: { en: '5 Nov 2026', es: '5 nov 2026' }, title: same('Vecinos USFQ'), role: { en: 'Outreach', es: 'Vinculación' }, image: a('vecinos') },
  { id: 'ingenieros', kind: 'volunteer', sort: '2026-11', date: { en: '6 Nov 2026', es: '6 nov 2026' }, title: same('Pequeños Ingenieros'), role: { en: 'Outreach', es: 'Vinculación' }, image: a('ingenieros') },
  { id: 'staff-devfest', kind: 'volunteer', sort: '2026-09', date: { en: 'Sep 2026', es: 'Sep 2026' }, title: same('Google DevFest 2026'), role: same('Staff'),
    text: { en: 'Attendee registration for an event of 2,000+ people.', es: 'Registro de asistentes para un evento de más de 2.000 personas.' }, image: a('staff-devfest') },
  { id: 'staff-cursor', kind: 'volunteer', sort: '2026-09', date: { en: 'Sep 2026', es: 'Sep 2026' }, title: { en: 'Cursor x Supabase workshop', es: 'Taller Cursor x Supabase' }, role: same('Staff'), image: a('staff-cursor'), page: 'agent-workshops' },
  { id: 'slb', kind: 'volunteer', sort: '2026-03', date: { en: 'Mar 2026', es: 'Mar 2026' }, title: { en: 'Computers for Amazon schools', es: 'Computadoras para escuelas amazónicas' }, org: { en: 'SLB · USFQ Sustainability Office', es: 'SLB · Oficina de Sostenibilidad USFQ' },
    text: { en: 'Refurbishing donated computers to extend their life in Amazon-region schools.', es: 'Reacondicionando computadoras donadas para extender su vida en escuelas de la Amazonía.' }, image: pj('slb-computer-repowering'), page: 'slb-computer-repowering' },
  { id: 'staff-sala', kind: 'volunteer', sort: '2026-03', date: { en: 'Mar 2026', es: 'Mar 2026' }, title: same('SALA 2026 · Summit of AI in Latin America'), role: same('Staff'), image: a('staff-sala') },

  // Recognitions
  { id: 'excellence', kind: 'award', sort: '2026-08', date: { en: '22 Aug 2026', es: '22 ago 2026' }, title: { en: 'Academic excellence', es: 'Excelencia académica' }, org: same('Universidad San Francisco de Quito'), image: a('excellence') },

  // Events attended
  ...([
    ['2026-10', 'Oct 2026', 'Oct 2026', 'AWS Student Builder Kickoff', 'aws-builder'], ['2026-10', 'Oct 2026', 'Oct 2026', 'ACS on Campus', 'acs'], ['2026-10', 'Oct 2026', 'Oct 2026', "CIO's Day", 'cios'],
    ['2026-10', 'Oct 2026', 'Oct 2026', 'Avispate BP', 'avispate'], ['2026-09', 'Sep 2026', 'Sep 2026', 'IGNITE Summit 2026', 'ignite'], ['2026-06', 'Jun 2026', 'Jun 2026', 'Build With AI · GDG Quito', 'buildai-epn'],
    ['2026-06', 'Jun 2026', 'Jun 2026', 'Cursor Workshop Quito', 'cursor-quito'], ['2026-05', 'May 2026', 'May 2026', 'AWS Gen AI Day', 'aws-genai'], ['2026-04', 'Apr 2026', 'Abr 2026', 'Build With AI · USFQ', 'buildai-usfq'],
    ['2026-04', 'Apr 2026', 'Abr 2026', 'Telconet Data Center', 'telconet'], ['2026-03', 'Mar 2026', 'Mar 2026', 'ASME EFx Emprendedores', 'asme'], ['2026-02', 'Feb 2026', 'Feb 2026', 'Verndale Quito', 'verndale'],
    ['2025-11', 'Nov 2025', 'Nov 2025', 'DevFest Quito 2025', 'devfest-2025'],
  ] as const).map(([sort, en, es, title, img], k): Activity => ({ id: `event-${k}`, kind: 'event', sort, date: { en, es }, title: same(title), image: a(img) })),
];
