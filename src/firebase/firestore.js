import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { app } from './config';

const db = app ? getFirestore(app) : null;

export async function saveSession(uid, sessionId, data) {
  if (!db) return;
  const ref = doc(db, 'users', uid, 'sessions', sessionId);
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function getSessions(uid) {
  if (!db) return [];
  const q = query(
    collection(db, 'users', uid, 'sessions'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function saveCompanionLog(uid, date, data) {
  if (!db) return;
  const ref = doc(db, 'users', uid, 'companionLog', date);
  await setDoc(ref, { ...data, createdAt: serverTimestamp() }, { merge: true });
}

export async function getCompanionLog(uid, date) {
  if (!db) return null;
  const ref = doc(db, 'users', uid, 'companionLog', date);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function saveUserToFirestore(user) {
  if (!db) return;
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);

  const provider = user.providerData?.[0]?.providerId || 'unknown';

  if (snap.exists()) {
    await setDoc(ref, { lastLoginAt: serverTimestamp() }, { merge: true });
  } else {
    await setDoc(ref, {
      uid: user.uid,
      displayName: user.displayName || null,
      email: user.email || null,
      photoURL: user.photoURL || null,
      provider,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  }
}

export async function saveUserProfile(uid, profile) {
  if (!db) return;
  const ref = doc(db, 'users', uid, 'profile', 'main');
  await setDoc(ref, { ...profile, updatedAt: serverTimestamp() }, { merge: true });
}

export async function getUserProfile(uid) {
  if (!db) return null;
  const ref = doc(db, 'users', uid, 'profile', 'main');
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export { db };
