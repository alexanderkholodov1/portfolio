// The door of the admin console. Without a session, or with a session that lacks the admin role, the visitor goes to
// the one sign-in page (My account) and sees nothing of the console; its code and words load only after the role is
// confirmed.
import { isAdmin, watchUser } from '../lib/accounts';

export function startConsole(root: HTMLElement) {
  const account = root.dataset.account!;
  let mounted = false;
  watchUser(async (user) => {
    if (!user || !(await isAdmin(user).catch(() => false))) { location.replace(account); return; }
    if (mounted) return;
    mounted = true;
    const { mountConsole } = await import('./console');
    mountConsole(root, user, { lang: root.dataset.lang!, home: root.dataset.home!, build: root.dataset.build!, shared: JSON.parse(root.dataset.shared!) });
  });
}
