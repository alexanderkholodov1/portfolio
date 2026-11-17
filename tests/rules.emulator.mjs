// Firestore rules for client requests, checked against the local emulators (no real project is touched).
// Run with the emulators up: `firebase emulators:exec --only auth,firestore --project demo-portfolio "node tests/rules.emulator.mjs"`.
import assert from 'node:assert/strict';
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { addDoc, collection, connectFirestoreEmulator, doc, getDoc, getDocs, getFirestore, setDoc, updateDoc } from 'firebase/firestore';

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
// The admin role: reads every request, moves its status, writes a message, keeps private notes; never edits answers.
const admin = (await createUserWithEmailAndPassword(auth, `admin${tag}@example.com`, 'secret123')).user;
await denied(getDoc(doc(db, 'requests', a.uid)));
await fetch(`http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/demo-portfolio/accounts:update`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' }, body: JSON.stringify({ localId: admin.uid, customAttributes: JSON.stringify({ admin: true }) }) });
await signOut(auth); await signInWithEmailAndPassword(auth, `admin${tag}@example.com`, 'secret123'); await auth.currentUser.getIdToken(true);
assert.equal((await getDoc(doc(db, 'requests', a.uid))).data().status, 'submitted');
await updateDoc(doc(db, 'requests', a.uid), { status: 'proposal', message: 'Here is my proposal.', priority: 'high' });
await denied(updateDoc(doc(db, 'requests', a.uid), { idea: 'rewritten by admin' }));
await denied(updateDoc(doc(db, 'requests', a.uid), { status: 'invented' }));
await addDoc(collection(db, 'requests', a.uid, 'notes'), { text: 'Call on Monday', at: new Date() });
assert.equal((await getDocs(collection(db, 'requests', a.uid, 'notes'))).size, 1);
await signOut(auth); await signInWithEmailAndPassword(auth, `a${tag}@example.com`, 'secret123');
assert.equal((await getDoc(doc(db, 'requests', a.uid))).data().message, 'Here is my proposal.');
await denied(getDocs(collection(db, 'requests', a.uid, 'notes')));
console.log('rules: all checks passed');
process.exit(0);
