// Client accounts for project requests: Firebase Authentication and one Firestore document per person
// (`requests/{uid}`, guarded by firestore.rules). The web config is public by design and comes from the build
// environment. Without it, the page talks to the local emulators under a demo project, which never reaches any
// real Firebase resource; that is how the flow is developed and tested.
import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  connectAuthEmulator, createUserWithEmailAndPassword, getAuth, GoogleAuthProvider, onAuthStateChanged,
  signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile, type Auth, type User,
} from 'firebase/auth';
import { connectFirestoreEmulator, doc, getDoc, getFirestore, serverTimestamp, setDoc, type Firestore } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID as string | undefined,
};
export const usesEmulators = !config.projectId;

let app: FirebaseApp, auth: Auth, db: Firestore;
export function accounts() {
  if (!app) {
    app = initializeApp(usesEmulators ? { apiKey: 'demo-key', authDomain: 'demo-portfolio.firebaseapp.com', projectId: 'demo-portfolio' } : config);
    auth = getAuth(app); db = getFirestore(app);
    if (usesEmulators) { connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true }); connectFirestoreEmulator(db, '127.0.0.1', 8080); }
  }
  return { auth, db };
}

export type Request = {
  name?: string; email?: string; kinds?: string[]; idea?: string; forWhom?: string; where?: string; when?: string;
  budget?: string; contact?: string; contactValue?: string; lang?: string; status: 'draft' | 'submitted'; step?: number;
};

export const watchUser = (fn: (user: User | null) => void) => onAuthStateChanged(accounts().auth, fn);
export const signUp = async (name: string, email: string, password: string) => {
  const { user } = await createUserWithEmailAndPassword(accounts().auth, email, password);
  if (name) await updateProfile(user, { displayName: name });
  return user;
};
export const signIn = (email: string, password: string) => signInWithEmailAndPassword(accounts().auth, email, password).then((c) => c.user);
export const signInGoogle = () => signInWithPopup(accounts().auth, new GoogleAuthProvider()).then((c) => c.user);
export const leave = () => signOut(accounts().auth);

export async function loadRequest(uid: string): Promise<Request | null> {
  const snap = await getDoc(doc(accounts().db, 'requests', uid));
  return snap.exists() ? (snap.data() as Request) : null;
}
export async function saveRequest(uid: string, data: Request, first: boolean) {
  const stamp = serverTimestamp();
  await setDoc(doc(accounts().db, 'requests', uid), {
    ...data, updatedAt: stamp, ...(first ? { createdAt: stamp } : {}), ...(data.status === 'submitted' ? { submittedAt: stamp } : {}),
  }, { merge: true });
}
