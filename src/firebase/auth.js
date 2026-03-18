import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  linkWithCredential,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { app } from './config';

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ─── Anonymous Auth ──────────────────────────────────
export async function signInAnon() {
  return signInAnonymously(auth);
}

// ─── Google Sign-In ──────────────────────────────────
export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

// ─── Email/Password Sign-Up ──────────────────────────
export async function signUpWithEmail(email, password) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  // Send verification email
  await sendEmailVerification(credential.user);
  return credential;
}

// ─── Email/Password Sign-In ──────────────────────────
export async function signInWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

// ─── Resend Verification Email ───────────────────────
export async function resendVerification() {
  const user = auth.currentUser;
  if (!user) throw new Error('No user signed in');
  await sendEmailVerification(user);
}

// ─── Password Reset ─────────────────────────────────
export async function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

// ─── Sign Out ────────────────────────────────────────
export async function logOut() {
  return signOut(auth);
}

// ─── Auth State Listener ─────────────────────────────
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// ─── Link Anonymous → Permanent ──────────────────────
export async function linkAnonymousAccount(credential) {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user to link');
  return linkWithCredential(user, credential);
}

export function getCurrentUser() {
  return auth.currentUser;
}

export { auth };
