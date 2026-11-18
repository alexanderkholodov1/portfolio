// Client accounts: Firebase Authentication, one profile per person (`users/{uid}`), any number of project requests
// (`requests/{id}`, each with its owner's uid) and a conversation per request. firestore.rules guards every path.
// The web config is public by design and comes from the build file src/data/firebase-web.json.
import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  connectAuthEmulator, createUserWithEmailAndPassword, getAuth, GoogleAuthProvider, onAuthStateChanged, sendPasswordResetEmail,
  signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile, type Auth, type User,
} from 'firebase/auth';
import {
  addDoc, collection, connectFirestoreEmulator, deleteDoc, doc, getDoc, getDocs, getFirestore, onSnapshot, orderBy, query,
  serverTimestamp, setDoc, updateDoc, where, type Firestore, type Timestamp,
} from 'firebase/firestore';

import web from '../data/firebase-web.json';

// Production uses the site's own Firebase web app (public config). For local work and tests, set
// PUBLIC_ACCOUNTS_EMULATORS=1 to talk to the Auth and Firestore emulators under a demo project instead.
export const usesEmulators = import.meta.env.PUBLIC_ACCOUNTS_EMULATORS === '1';
const config = { apiKey: web.apiKey, authDomain: web.authDomain, projectId: web.projectId, appId: web.appId };

let app: FirebaseApp, auth: Auth, db: Firestore;
export function accounts() {
  if (!app) {
    app = initializeApp(usesEmulators ? { apiKey: 'demo-key', authDomain: 'demo-portfolio.firebaseapp.com', projectId: 'demo-portfolio' } : config);
    auth = getAuth(app); db = getFirestore(app);
    if (usesEmulators) { connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true }); connectFirestoreEmulator(db, '127.0.0.1', 8080); }
  }
  return { auth, db };
}

export type Answers = {
  name?: string; email?: string; kinds?: string[]; idea?: string; forWhom?: string; where?: string; when?: string;
  budget?: string; contact?: string; contactValue?: string; lang?: string;
};
export type Request = Answers & {
  id: string; uid: string; status: string; step?: number; priority?: string; message?: string;
  createdAt?: Timestamp; updatedAt?: Timestamp; submittedAt?: Timestamp; statusAt?: Record<string, Timestamp>;
  clientReadAt?: Timestamp; adminReadAt?: Timestamp; lastAt?: Timestamp; lastFrom?: 'client' | 'admin';
};
export type Profile = { name?: string; email?: string; contact?: string; contactValue?: string; lang?: string };
export type Message = { id: string; from: 'client' | 'admin'; uid: string; text: string; at?: Timestamp | null };

// Sign-in.
export const watchUser = (fn: (user: User | null) => void) => onAuthStateChanged(accounts().auth, fn);
export const signUp = async (name: string, email: string, password: string) => {
  const { user } = await createUserWithEmailAndPassword(accounts().auth, email, password);
  if (name) await updateProfile(user, { displayName: name });
  return user;
};
export const signIn = (email: string, password: string) => signInWithEmailAndPassword(accounts().auth, email, password).then((c) => c.user);
export const signInGoogle = () => signInWithPopup(accounts().auth, new GoogleAuthProvider()).then((c) => c.user);
export const resetPassword = (email: string) => sendPasswordResetEmail(accounts().auth, email);
export const leave = () => signOut(accounts().auth);
// The admin role is a custom claim; the token is refreshed once so a newly granted role shows without signing out.
export const isAdmin = async (user: User) => (await user.getIdTokenResult(true)).claims.admin === true;
export const usesPassword = (user: User) => user.providerData.some((p) => p.providerId === 'password');

// The profile.
export async function loadProfile(user: User): Promise<Profile> {
  const snap = await getDoc(doc(accounts().db, 'users', user.uid)).catch(() => null);
  return { name: user.displayName || '', email: user.email || '', ...(snap?.exists() ? (snap.data() as Profile) : {}) };
}
export async function saveProfile(user: User, data: Profile, first = false) {
  const stamp = serverTimestamp();
  await setDoc(doc(accounts().db, 'users', user.uid), { ...data, email: user.email || '', updatedAt: stamp, ...(first ? { createdAt: stamp } : {}) }, { merge: true });
  if (data.name && data.name !== user.displayName) await updateProfile(user, { displayName: data.name });
}
// Every account gets a profile document the first time it is seen, so the admin can list clients.
export async function ensureProfile(user: User) {
  const ref = doc(accounts().db, 'users', user.uid);
  const snap = await getDoc(ref).catch(() => null);
  if (snap && !snap.exists()) await saveProfile(user, { name: user.displayName || '' }, true).catch(() => undefined);
}

// The console's public settings: whether new projects are taken, the notice, the usual response time.
export type Site = { accepting: boolean; responseDays: number; noticeEs: string; noticeEn: string };
export async function loadSite(): Promise<Site | null> {
  const snap = await getDoc(doc(accounts().db, 'config', 'site')).catch(() => null);
  return snap?.exists() ? (snap.data() as Site) : null;
}

// Requests.
const asRequest = (id: string, data: unknown) => ({ id, ...(data as Omit<Request, 'id'>) }) as Request;
const millis = (t?: Timestamp | null) => (t && typeof t.toMillis === 'function' ? t.toMillis() : 0);
export const newest = (a: Request, b: Request) => millis(b.updatedAt || b.createdAt) - millis(a.updatedAt || a.createdAt);
export async function myRequests(uid: string) {
  const snap = await getDocs(query(collection(accounts().db, 'requests'), where('uid', '==', uid)));
  return snap.docs.map((d) => asRequest(d.id, d.data())).sort(newest);
}
export async function getRequest(id: string) {
  const snap = await getDoc(doc(accounts().db, 'requests', id));
  return snap.exists() ? asRequest(snap.id, snap.data()) : null;
}
// Saves the questionnaire as it goes; the first save creates the request and returns its id.
export async function saveRequest(id: string | null, uid: string, data: Answers & { status: string; step?: number }) {
  const stamp = serverTimestamp();
  const ref = id ? doc(accounts().db, 'requests', id) : doc(collection(accounts().db, 'requests'));
  await setDoc(ref, { ...data, uid, updatedAt: stamp, ...(id ? {} : { createdAt: stamp }), ...(data.status === 'submitted' ? { submittedAt: stamp } : {}) }, { merge: true });
  return ref.id;
}
export const withdraw = (id: string) => updateDoc(doc(accounts().db, 'requests', id), { status: 'withdrawn', updatedAt: serverTimestamp() });
export const discard = (id: string) => deleteDoc(doc(accounts().db, 'requests', id));
export const unreadFor = (r: Request, side: 'client' | 'admin') =>
  Boolean(r.lastFrom && r.lastFrom !== side && millis(r.lastAt) > millis(side === 'client' ? r.clientReadAt : r.adminReadAt));
export const markRead = (id: string, side: 'client' | 'admin') =>
  updateDoc(doc(accounts().db, 'requests', id), side === 'client' ? { clientReadAt: serverTimestamp() } : { adminReadAt: serverTimestamp() });

// The conversation of one request, live.
export function watchMessages(id: string, fn: (messages: Message[]) => void) {
  return onSnapshot(query(collection(accounts().db, 'requests', id, 'messages'), orderBy('at')), (snap) => {
    fn(snap.docs.map((d) => ({ id: d.id, ...(d.data({ serverTimestamps: 'estimate' }) as Omit<Message, 'id'>) })));
  });
}
export async function sendMessage(id: string, uid: string, text: string, from: 'client' | 'admin') {
  const stamp = serverTimestamp();
  await addDoc(collection(accounts().db, 'requests', id, 'messages'), { from, uid, text, at: stamp });
  await updateDoc(doc(accounts().db, 'requests', id), {
    lastAt: stamp, lastFrom: from, updatedAt: stamp, ...(from === 'client' ? { clientReadAt: stamp } : { adminReadAt: stamp }),
  });
}

export const when = (t: Timestamp | null | undefined, lang: string, time = false) =>
  t && typeof t.toDate === 'function' ? t.toDate().toLocaleString(lang === 'es' ? 'es-EC' : 'en-US', time ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }) : '';
