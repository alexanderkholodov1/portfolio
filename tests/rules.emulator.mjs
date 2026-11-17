// Firestore rules for client requests, checked against the local emulators (no real project is touched).
// Run with the emulators up: `firebase emulators:exec --only auth,firestore --project demo-portfolio "node tests/rules.emulator.mjs"`.
import assert from 'node:assert/strict';
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth';
import { connectFirestoreEmulator, doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';

const app = initializeApp({ apiKey: 'demo-key', projectId: 'demo-portfolio', authDomain: 'demo-portfolio.firebaseapp.com' });
const auth = getAuth(app); connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
const db = getFirestore(app); connectFirestoreEmulator(db, '127.0.0.1', 8080);
const denied = (p) => p.then(() => assert.fail('expected permission-denied'), (e) => assert.equal(e.code, 'permission-denied'));

const tag = Date.now();
const a = (await createUserWithEmailAndPassword(auth, `a${tag}@example.com`, 'secret123')).user;
await setDoc(doc(db, 'requests', a.uid), { status: 'draft', idea: 'A website' });
assert.equal((await getDoc(doc(db, 'requests', a.uid))).data().idea, 'A website');
await denied(setDoc(doc(db, 'requests', 'someone-else'), { status: 'draft' }));
await denied(setDoc(doc(db, 'requests', a.uid), { status: 'draft', price: 1 }, { merge: true }));
await denied(setDoc(doc(db, 'requests', a.uid), { status: 'approved' }, { merge: true }));
await denied(setDoc(doc(db, 'other', 'x'), { any: 1 }));
await setDoc(doc(db, 'requests', a.uid), { status: 'submitted' }, { merge: true });
await denied(setDoc(doc(db, 'requests', a.uid), { idea: 'changed after sending' }, { merge: true }));
await createUserWithEmailAndPassword(auth, `b${tag}@example.com`, 'secret123');
await denied(getDoc(doc(db, 'requests', a.uid)));
await signOut(auth);
await denied(getDoc(doc(db, 'requests', a.uid)));
console.log('rules: all checks passed');
process.exit(0);
