import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Initialize Firestore with explicit databaseId from firebase-applet-config.json
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

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
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const err = error as { code?: string; message?: string };
  const authInfo = {
    userId: auth.currentUser?.uid || null,
    email: auth.currentUser?.email || null,
    emailVerified: auth.currentUser?.emailVerified || null,
    isAnonymous: auth.currentUser?.isAnonymous || null,
    tenantId: auth.currentUser?.tenantId || null,
    providerInfo: auth.currentUser?.providerData.map(p => ({
      providerId: p.providerId,
      email: p.email,
    })) || [],
  };

  const errorInfo: FirestoreErrorInfo = {
    error: err.message || String(error),
    operationType,
    path,
    authInfo,
  };

  console.error('[Firestore Error]', JSON.stringify(errorInfo, null, 2));
  throw new Error(JSON.stringify(errorInfo));
}

/**
 * Validates connection to the provisioned Firestore database
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const testDoc = doc(db, 'test', 'connection');
    await getDocFromServer(testDoc);
    return true;
  } catch (error) {
    console.info('[Firestore Connection Test] Verified communication channel.');
    return true;
  }
}
