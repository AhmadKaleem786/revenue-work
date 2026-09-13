import { collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { auth, db } from './config';

const COMPUTED_KEYS = new Set(['r', 'd', 'n', 'revenue', 'deductions', 'net', 'key']);

const serialize = (value) => (value?.toDate ? value.toDate().toISOString() : value);

export const cleanRecord = (item = {}) =>
  Object.fromEntries(
    Object.entries(item).filter(
      ([key, value]) => !COMPUTED_KEYS.has(key) && value !== undefined,
    ),
  );

const ownerId = (fallback) => auth?.currentUser?.uid || fallback;

export const listenToUserCollection = (collectionName, userId, onData, onError) => {
  const uid = ownerId(userId);
  if (!db || !uid) {
    onData([]);
    return () => {};
  }
  const source = query(collection(db, collectionName), where('createdBy', '==', uid));
  return onSnapshot(
    source,
    (snapshot) => {
      const data = snapshot.docs
        .map((item) => {
          const raw = item.data();
          return {
            id: item.id,
            ...raw,
            createdAt: serialize(raw.createdAt) || raw.createdAt,
            updatedAt: serialize(raw.updatedAt) || raw.updatedAt,
          };
        })
        .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
      onData(data);
    },
    onError,
  );
};

export const saveDocument = async (collectionName, item, userId) => {
  if (!db) throw new Error('Firestore is not initialized.');
  const uid = ownerId(userId);
  if (!uid || uid === 'local-user') {
    throw new Error('Please sign in again before saving.');
  }
  const { id, ...data } = cleanRecord(item);
  if (!id) throw new Error('Missing record id.');
  await setDoc(
    doc(db, collectionName, id),
    {
      ...data,
      createdBy: uid,
      updatedAt: serverTimestamp(),
      createdAt: data.createdAt || serverTimestamp(),
    },
    { merge: true },
  );
  return id;
};

export const removeDocument = (collectionName, id) => deleteDoc(doc(db, collectionName, id));
