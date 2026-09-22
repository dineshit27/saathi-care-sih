import { getAdminFirestore } from './firebaseAdmin';

// In-memory persistent cache for server-side operations
const memoryStore: Record<string, Map<string, any>> = {
  patients: new Map(),
  queueEntries: new Map(),
  consultations: new Map(),
  referrals: new Map(),
  appointments: new Map(),
  diagnostics: new Map(),
  medicines: new Map(),
  followUps: new Map(),
  notifications: new Map(),
  auditLogs: new Map(),
  healthRecords: new Map(),
  emergencyEvents: new Map(),
  facilities: new Map(),
};

export async function getCollectionDocs(collectionName: string): Promise<any[]> {
  const db = getAdminFirestore();
  if (db) {
    try {
      const snap = await db.collection(collectionName).get();
      if (!snap.empty) {
        return snap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
      }
    } catch (e) {
      console.warn(`[dbHelper] Firestore read failed for ${collectionName}, using local fallback:`, e);
    }
  }

  const map = memoryStore[collectionName] || new Map();
  return Array.from(map.values());
}

export async function getDocById(collectionName: string, id: string): Promise<any | null> {
  const db = getAdminFirestore();
  if (db) {
    try {
      const snap = await db.collection(collectionName).doc(id).get();
      if (snap.exists) {
        return { id: snap.id, ...snap.data() };
      }
    } catch (e) {
      console.warn(`[dbHelper] Firestore getDoc failed for ${collectionName}/${id}:`, e);
    }
  }

  const map = memoryStore[collectionName];
  return map ? map.get(id) || null : null;
}

export async function setDocument(collectionName: string, id: string, data: any): Promise<any> {
  const record = {
    ...data,
    id,
    updatedAt: new Date().toISOString(),
    createdAt: data.createdAt || new Date().toISOString()
  };

  if (!memoryStore[collectionName]) {
    memoryStore[collectionName] = new Map();
  }
  memoryStore[collectionName].set(id, record);

  const db = getAdminFirestore();
  if (db) {
    try {
      await db.collection(collectionName).doc(id).set(record, { merge: true });
    } catch (e) {
      console.warn(`[dbHelper] Firestore setDoc failed for ${collectionName}/${id}:`, e);
    }
  }

  return record;
}

export async function updateDocument(collectionName: string, id: string, updates: any): Promise<any> {
  const existing = await getDocById(collectionName, id) || {};
  const updated = {
    ...existing,
    ...updates,
    id,
    updatedAt: new Date().toISOString()
  };

  if (!memoryStore[collectionName]) {
    memoryStore[collectionName] = new Map();
  }
  memoryStore[collectionName].set(id, updated);

  const db = getAdminFirestore();
  if (db) {
    try {
      await db.collection(collectionName).doc(id).set(updated, { merge: true });
    } catch (e) {
      console.warn(`[dbHelper] Firestore updateDoc failed for ${collectionName}/${id}:`, e);
    }
  }

  return updated;
}
