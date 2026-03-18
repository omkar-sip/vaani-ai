import {
  getAuth,
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
import { app, hasFirebaseConfig } from './config';

const auth = app ? getAuth(app) : null;
const googleProvider = new GoogleAuthProvider();

function assertAuthConfigured() {
  if (!auth || !hasFirebaseConfig) {
    throw new Error('Firebase is not configured. Add Vite Firebase env vars to enable authentication.');
  }
}

export async function signInWithGoogle() {
  assertAuthConfigured();
  return signInWithPopup(auth, googleProvider);
}

export async function signUpWithEmail(email, password) {
  assertAuthConfigured();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(credential.user);
  return credential;
}

export async function signInWithEmail(email, password) {
  assertAuthConfigured();
  return signInWithEmailAndPassword(auth, email, password);
}

export async function resendVerification() {
  assertAuthConfigured();
  const user = auth.currentUser;
  if (!user) throw new Error('No user signed in');
  await sendEmailVerification(user);
}

export async function resetPassword(email) {
  assertAuthConfigured();
  return sendPasswordResetEmail(auth, email);
}

export async function logOut() {
  if (!auth) return;
  return signOut(auth);
}

export function onAuthChange(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function linkAnonymousAccount(credential) {
  assertAuthConfigured();
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user to link');
  return linkWithCredential(user, credential);
}

export function getCurrentUser() {
  return auth?.currentUser ?? null;
}

export { auth };
