import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp, collection, writeBatch, query, getDocs } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export interface CalculationRecord {
  id: string;
  mode: string;
  expression: string;
  result: string;
  createdAt: any;
}

export const saveCalculation = async (userId: string | null | undefined, mode: string, expression: string, result: string) => {
  const localItem: CalculationRecord = {
    id: 'local_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    mode,
    expression,
    result,
    createdAt: new Date().toISOString()
  };

  try {
    const existing = JSON.parse(localStorage.getItem('mahraj_calc_history') || '[]');
    const updated = [localItem, ...existing.filter((item: any) => item.expression !== expression || item.result !== result)].slice(0, 100);
    localStorage.setItem('mahraj_calc_history', JSON.stringify(updated));
  } catch (_) {}

  if (!userId) return;
  try {
    const calcRef = doc(collection(db, `users/${userId}/calculations`));
    await setDoc(calcRef, {
      mode,
      expression,
      result,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.warn('[Firestore] Background save calculation non-fatal warning:', error);
  }
};

export const fetchCalculations = async (userId?: string | null): Promise<CalculationRecord[]> => {
  let localList: CalculationRecord[] = [];
  try {
    localList = JSON.parse(localStorage.getItem('mahraj_calc_history') || '[]');
  } catch (_) {}

  if (!userId) {
    return localList;
  }

  try {
    const calcRef = collection(db, `users/${userId}/calculations`);
    const q = query(calcRef);
    const querySnapshot = await getDocs(q);
    const remoteList: CalculationRecord[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      remoteList.push({
        id: docSnap.id,
        mode: data.mode || 'math',
        expression: data.expression || '',
        result: data.result || '',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString()
      });
    });

    if (remoteList.length > 0) {
      // Sort newest first
      remoteList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return remoteList;
    }
    return localList;
  } catch (error) {
    console.warn('[Firestore] fetchCalculations fallback to local:', error);
    return localList;
  }
};

export const deleteSingleCalculation = async (userId: string | null | undefined, calcId: string) => {
  try {
    const existing: CalculationRecord[] = JSON.parse(localStorage.getItem('mahraj_calc_history') || '[]');
    const filtered = existing.filter(item => item.id !== calcId);
    localStorage.setItem('mahraj_calc_history', JSON.stringify(filtered));
  } catch (_) {}

  if (userId && !calcId.startsWith('local_')) {
    try {
      const docRef = doc(db, `users/${userId}/calculations/${calcId}`);
      const batch = writeBatch(db);
      batch.delete(docRef);
      await batch.commit();
    } catch (e) {
      console.warn('[Firestore] Error deleting single calc:', e);
    }
  }
};

export const clearAllCalculations = async (userId: string) => {
  try {
    localStorage.removeItem('mahraj_calc_history');
  } catch (_) {}

  if (!userId) return;
  try {
    const calcRef = collection(db, `users/${userId}/calculations`);
    const q = query(calcRef);
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    querySnapshot.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  } catch (error) {
    console.warn('[Firestore] Non-fatal clear calculations warning:', error);
  }
};

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const signOut = async () => {
  return firebaseSignOut(auth);
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
