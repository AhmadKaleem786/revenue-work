import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, updatePassword, updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { getLocalLogo, saveLocalLogo } from '../../utils/localLogo';

const toProfile = (user, extra = {}) => ({
  uid: user.uid,
  name: extra.name || user.displayName || user.email?.split('@')[0] || 'Workspace',
  email: user.email,
  logo: getLocalLogo(user.uid),
  createdAt: extra.createdAt?.toDate?.()?.toISOString?.() || extra.createdAt || new Date().toISOString(),
});

export const observeAuth = (callback) =>
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null);
      return;
    }
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      callback(toProfile(user, snap.exists() ? snap.data() : {}));
    } catch {
      callback(toProfile(user));
    }
  });

export const signIn = async (email, password) => {
  const user = (await signInWithEmailAndPassword(auth, email, password)).user;
  const snap = await getDoc(doc(db, 'users', user.uid));
  return toProfile(user, snap.exists() ? snap.data() : {});
};

export const signUp = async ({ name, email, password, logoFile }) => {
  const user = (await createUserWithEmailAndPassword(auth, email, password)).user;
  await saveLocalLogo(user.uid, logoFile);
  await updateFirebaseProfile(user, { displayName: name });
  const profile = toProfile(user, { name });
  await setDoc(doc(db, 'users', user.uid), {
    uid: profile.uid,
    name: profile.name,
    email: profile.email,
    createdBy: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return profile;
};

export const signOutUser = () => signOut(auth);

export const updateUserProfile = async (user, { name, password, logoFile }) => {
  const logo = await saveLocalLogo(user.uid, logoFile);
  await updateFirebaseProfile(auth.currentUser, { displayName: name });
  if (password) await updatePassword(auth.currentUser, password);
  await setDoc(doc(db, 'users', user.uid), { name, updatedAt: serverTimestamp() }, { merge: true });
  return { ...user, name, logo };
};
