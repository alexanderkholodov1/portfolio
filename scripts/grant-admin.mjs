// Grants (or removes) the admin role on the site's client accounts: `node scripts/grant-admin.mjs <email> [--remove]`.
// The person must have signed up first. Uses the admin key by path (GOOGLE_APPLICATION_CREDENTIALS) and prints
// nothing secret. My account refreshes the session's token on load, so the role shows without signing out.
import { GoogleAuth } from 'google-auth-library';

const [email, flag] = process.argv.slice(2);
if (!email) { console.error('Usage: node scripts/grant-admin.mjs <email> [--remove]'); process.exit(1); }
const PROJECT = 'alexanderkholodov';
const client = await new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/identitytoolkit'] }).getClient();
const base = `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT}`;
const found = await client.request({ method: 'POST', url: `${base}/accounts:lookup`, data: { email: [email] } });
const user = found.data.users?.[0];
if (!user) { console.error('No account with that email yet. Sign up on /start/ first.'); process.exit(1); }
const claims = flag === '--remove' ? {} : { admin: true };
await client.request({ method: 'POST', url: `${base}/accounts:update`, data: { localId: user.localId, customAttributes: JSON.stringify(claims) } });
console.log(flag === '--remove' ? 'Admin role removed.' : 'Admin role granted. It shows in /account/ the next time that page loads.');
