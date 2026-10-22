import { readLive } from '../lib/live-snapshot';

const banner = document.querySelector<HTMLElement>('[data-live]');
const { project, key } = banner?.dataset ?? {};
if (banner && project && key) {
  const copy = JSON.parse(banner.dataset.copy ?? '{}') as Record<string, string>;
  const before = banner.querySelector<HTMLElement>('[data-live-before]')!;
  const after = banner.querySelector<HTMLElement>('[data-live-after]')!;
  const say = (state: string, prefix: string, suffix: string) => {
    banner.dataset.state = state;
    before.textContent = prefix;
    after.textContent = suffix;
  };
  const run = async () => {
    const reading = await readLive(project, key);
    if (reading.state === 'fresh') {
      say('fresh', copy.live, ` · ${(reading.count === 1 ? copy.one : copy.many).replace('{n}', String(reading.count))}`);
    } else if (reading.state === 'stale') {
      const time = new Date(reading.updatedAt).toLocaleTimeString(document.documentElement.lang, { hour: '2-digit', minute: '2-digit' });
      say('stale', '', ` · ${copy.stale.replace('{t}', time)}`);
    } else say('idle', '', '');
  };
  // After load, so the request never competes with first paint; refresh while the page stays open.
  const start = () => { void run(); setInterval(run, 60_000); };
  if (document.readyState === 'complete') start(); else addEventListener('load', start, { once: true });
}
