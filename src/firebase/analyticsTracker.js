import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firestore';

const EVENTS_COL = 'analyticsEvents';

function todayDateStr() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Write a usage analytics event to Firestore.
 * Silently fails if Firestore is not configured (demo mode).
 */
export async function trackEvent(type, data = {}) {
  if (!db) return;
  try {
    await addDoc(collection(db, EVENTS_COL), {
      type,
      userId: data.userId || '',
      userName: data.userName || '',
      userEmail: data.userEmail || '',
      sessionId: data.sessionId || '',
      mode: data.mode || '',
      section: data.section || '',
      feature: data.feature || '',
      durationMs: data.durationMs || null,
      turnsCount: data.turnsCount || null,
      fromMode: data.fromMode || '',
      toMode: data.toMode || '',
      date: todayDateStr(),
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[Analytics] Failed to track event:', err.message);
  }
}

/**
 * Fetch all analytics events (admin only — Firestore rules enforce this).
 */
export async function getAllEvents() {
  if (!db) return [];
  const q = query(collection(db, EVENTS_COL), orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Fetch analytics events within a date range.
 */
export async function getEventsByDateRange(startDate, endDate) {
  if (!db) return [];
  const q = query(
    collection(db, EVENTS_COL),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
