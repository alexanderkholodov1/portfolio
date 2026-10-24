// Test-only content: a second complete project, listed before the galaxy so that selecting the
// galaxy by position instead of by id would pick the wrong one. Never imported by the site.
import { projects as real } from '../../src/data/content.ts';
import type { Project } from '../../src/data/content.ts';

export * from '../../src/data/content.ts';

const lantern: Project = {
  id: 'lantern',
  title: { en: 'Lantern Works', es: 'Taller Linterna' },
  context: { en: 'Fixture context EN', es: 'Contexto de prueba ES' },
  pitch: { en: 'Fixture pitch in English for the second project.', es: 'Texto de prueba en español para el segundo proyecto.' },
  href: 'https://example.org/lantern/',
  role: { en: 'Fixture role', es: 'Rol de prueba' },
  stack: ['Fixture stack'],
  dates: { en: 'Fixture dates', es: 'Fechas de prueba' },
  image: { src: '/fixture.png', alt: { en: 'Fixture image', es: 'Imagen de prueba' } },
};

export const projects = { items: [lantern, real.items.find((p) => p.id === 'galaxy')!], todo: null };
