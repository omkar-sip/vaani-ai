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

const db = getFirestore(app);

// ─── Sessions ─────────────────────────────────────────

/**
 * Save or update a session document under the user's collection.
 * @param {string} uid
 * @param {string} sessionId
 * @param {object} data - { mode, section, title, turns, extractedData }
 */
export async function saveSession(uid, sessionId, data) {
  const ref = doc(db, 'users', uid, 'sessions', sessionId);
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

/**
 * Get all sessions for a user, ordered by creation time descending.
 * @param {string} uid
 * @returns {Promise<object[]>}
 */
export async function getSessions(uid) {
  const q = query(
    collection(db, 'users', uid, 'sessions'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// ─── Companion Log ────────────────────────────────────

/**
 * Save a daily companion log entry.
 * Date format: YYYY-MM-DD used as document ID.
 * @param {string} uid
 * @param {string} date - e.g. '2026-03-18'
 * @param {object} data - { mood, stressLevel, sleepHours, habitsCompleted, weeklyScore }
 */
export async function saveCompanionLog(uid, date, data) {
  const ref = doc(db, 'users', uid, 'companionLog', date);
  await setDoc(ref, { ...data, createdAt: serverTimestamp() }, { merge: true });
}

/**
 * Get a single companion log entry by date.
 * @param {string} uid
 * @param {string} date
 * @returns {Promise<object|null>}
 */
export async function getCompanionLog(uid, date) {
  const ref = doc(db, 'users', uid, 'companionLog', date);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ─── User Profile ─────────────────────────────────────

/**
 * Save or update the user profile.
 * @param {string} uid
 * @param {object} profile - { name, language, onboardingComplete }
 */
export async function saveUserProfile(uid, profile) {
  const ref = doc(db, 'users', uid, 'profile', 'main');
  await setDoc(ref, { ...profile, updatedAt: serverTimestamp() }, { merge: true });
}

/**
 * Get the user profile.
 * @param {string} uid
 * @returns {Promise<object|null>}
 */
export async function getUserProfile(uid) {
  const ref = doc(db, 'users', uid, 'profile', 'main');
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export { db };
