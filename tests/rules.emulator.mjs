// Firestore rules for client accounts and requests, checked against the local emulators (no real project is touched).
// Run with the emulators up: `firebase emulators:exec --only auth,firestore --project demo-portfolio "node tests/rules.emulator.mjs"`.
import assert from 'node:assert/strict';
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  addDoc, collection, connectFirestoreEmulator, deleteDoc, doc, getDoc, getDocs, getFirestore, query, serverTimestamp, setDoc, updateDoc, where,
} from 'firebase/firestore';

const app = initializeApp({ apiKey: 'demo-key', projectId: 'demo-portfolio', authDomain: 'demo-portfolio.firebaseapp.com' });
const auth = getAuth(app); connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
const db = getFirestore(app); connectFirestoreEmulator(db, '127.0.0.1', 8080);
const denied = (p) => p.then(() => assert.fail('expected permission-denied'), (e) => assert.equal(e.code, 'permission-denied'));
const as = async (email) => { await signOut(auth); return (await signInWithEmailAndPassword(auth, email, 'secret123')).user; };

const tag = Date.now();
const A = `a${tag}@example.com`, B = `b${tag}@example.com`, ADMIN = `admin${tag}@example.com`;
const a = (await createUserWithEmailAndPassword(auth, A, 'secret123')).user;

// Profiles: the owner writes a few fields of their own profile only.
await setDoc(doc(db, 'users', a.uid), { name: 'Ana', email: A, contact: 'WhatsApp', contactValue: '+593 99', lang: 'es', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
assert.equal((await getDoc(doc(db, 'users', a.uid))).data().name, 'Ana');
await denied(setDoc(doc(db, 'users', a.uid), { role: 'admin' }, { merge: true }));
await denied(setDoc(doc(db, 'users', a.uid), { lang: 'fr' }, { merge: true }));
await denied(setDoc(doc(db, 'users', 'someone-else'), { name: 'x' }));

// Requests: any number per person, each with its owner's uid; created as drafts with the questionnaire's fields only.
const r1 = doc(collection(db, 'requests'));
await setDoc(r1, { uid: a.uid, status: 'draft', idea: 'A website', step: 1, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
const r2 = doc(collection(db, 'requests'));
await setDoc(r2, { uid: a.uid, status: 'draft', idea: 'A game' });
await denied(setDoc(doc(collection(db, 'requests')), { uid: 'someone-else', status: 'draft' }));
await denied(setDoc(doc(collection(db, 'requests')), { uid: a.uid, status: 'submitted' }));
await denied(setDoc(r1, { price: 1 }, { merge: true }));
await denied(setDoc(r1, { status: 'approved' }, { merge: true }));
assert.equal((await getDocs(query(collection(db, 'requests'), where('uid', '==', a.uid)))).size, 2);
await denied(getDocs(collection(db, 'requests')));
await denied(addDoc(collection(r1, 'messages'), { from: 'client', uid: a.uid, text: 'hi', at: serverTimestamp() }));
await setDoc(r1, { status: 'submitted', submittedAt: serverTimestamp() }, { merge: true });
await denied(setDoc(r1, { idea: 'changed after sending' }, { merge: true }));
await denied(deleteDoc(r1));
await deleteDoc(r2);

// The conversation: the client writes as the client, at the server's time, and marks it read.
await addDoc(collection(r1, 'messages'), { from: 'client', uid: a.uid, text: 'Hello', at: serverTimestamp() });
await denied(addDoc(collection(r1, 'messages'), { from: 'admin', uid: a.uid, text: 'Pretending', at: serverTimestamp() }));
await denied(addDoc(collection(r1, 'messages'), { from: 'client', uid: a.uid, text: 'Backdated', at: new Date(2020, 0, 1) }));
await updateDoc(r1, { lastAt: serverTimestamp(), lastFrom: 'client', clientReadAt: serverTimestamp(), updatedAt: serverTimestamp() });
await denied(updateDoc(r1, { lastFrom: 'admin' }));
await denied(updateDoc(r1, { status: 'proposal' }));

// Another person sees nothing of it.
const b = (await createUserWithEmailAndPassword(auth, B, 'secret123')).user;
await denied(getDoc(r1));
await denied(getDocs(collection(r1, 'messages')));
await denied(addDoc(collection(r1, 'messages'), { from: 'client', uid: b.uid, text: 'Intruding', at: serverTimestamp() }));
await denied(getDoc(doc(db, 'users', a.uid)));
await denied(updateDoc(r1, { status: 'withdrawn' }));
await signOut(auth);
await denied(getDoc(r1));

// The admin: every request and profile, the workflow fields, the conversation as the admin, private notes.
const admin = (await createUserWithEmailAndPassword(auth, ADMIN, 'secret123')).user;
await denied(getDoc(r1));
await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/demo-portfolio/accounts:update', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' }, body: JSON.stringify({ localId: admin.uid, customAttributes: JSON.stringify({ admin: true }) }) });
await as(ADMIN); await auth.currentUser.getIdToken(true);
assert.equal((await getDoc(r1)).data().status, 'submitted');
assert.ok((await getDocs(collection(db, 'requests'))).size >= 1);
assert.equal((await getDoc(doc(db, 'users', a.uid))).data().name, 'Ana');
await updateDoc(r1, { status: 'proposal', 'statusAt.proposal': serverTimestamp(), priority: 'high', adminReadAt: serverTimestamp(), updatedAt: serverTimestamp() });
await addDoc(collection(r1, 'messages'), { from: 'admin', uid: admin.uid, text: 'Here is my proposal.', at: serverTimestamp() });
await updateDoc(r1, { lastAt: serverTimestamp(), lastFrom: 'admin', adminReadAt: serverTimestamp() });
await denied(updateDoc(r1, { idea: 'rewritten by admin' }));
await denied(updateDoc(r1, { status: 'invented' }));
await denied(updateDoc(r1, { priority: 'urgent' }));
await denied(setDoc(doc(db, 'users', a.uid), { name: 'Changed by admin' }, { merge: true }));
await addDoc(collection(r1, 'notes'), { text: 'Call on Monday', at: serverTimestamp() });
assert.equal((await getDocs(collection(r1, 'notes'))).size, 1);

// Back as the client: the answer arrives, the notes stay private, and the request can be withdrawn only while it waits.
await as(A);
const thread = await getDocs(collection(r1, 'messages'));
assert.deepEqual(thread.docs.map((m) => m.data().from).sort(), ['admin', 'client']);
await denied(getDocs(collection(r1, 'notes')));
await denied(updateDoc(r1, { status: 'withdrawn' }));
const r3 = doc(collection(db, 'requests'));
await setDoc(r3, { uid: a.uid, status: 'draft', idea: 'An app' });
await setDoc(r3, { status: 'submitted' }, { merge: true });
await updateDoc(r3, { status: 'withdrawn', updatedAt: serverTimestamp() });
assert.equal((await getDoc(r3)).data().status, 'withdrawn');
await denied(setDoc(doc(db, 'other', 'x'), { any: 1 }));
console.log('rules: all checks passed');
process.exit(0);
