import { initializeApp, getApps, cert, applicationDefault, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

let adminApp: App | null = null;
let firestoreDb: Firestore | null = null;
let initializationAttempted = false;
let isConnected = false;

// Load config from firebase-applet-config.json if available
let configProjectId = '';
let configDatabaseId = '';
try {
  const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(raw);
    configProjectId = parsed.projectId || '';
    configDatabaseId = parsed.firestoreDatabaseId || '';
  }
} catch (e) {
  console.warn('[FirebaseAdmin] Could not read firebase-applet-config.json:', e);
}

export function getFirebaseAdmin(): App | null {
  if (initializationAttempted) {
    return adminApp;
  }
  initializationAttempted = true;

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || configProjectId;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    const existingApps = getApps();
    if (existingApps.length > 0) {
      adminApp = existingApps[0];
      isConnected = true;
      return adminApp;
    }

    if (clientEmail && privateKey && projectId) {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
      isConnected = true;
      console.log('[FirebaseAdmin] Initialized with Service Account Credentials.');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.K_SERVICE) {
      adminApp = initializeApp({
        credential: applicationDefault(),
        projectId: projectId || undefined,
      });
      isConnected = true;
      console.log('[FirebaseAdmin] Initialized with Application Default Credentials.');
    } else if (projectId) {
      // Lazy project initialization without crash
      adminApp = initializeApp({
        projectId,
      });
      isConnected = true;
      console.log(`[FirebaseAdmin] Initialized with Project ID: ${projectId}`);
    } else {
      console.info('[FirebaseAdmin] No service credentials supplied. Endpoints will use fallback persistence.');
    }
  } catch (err: any) {
    console.warn('[FirebaseAdmin] Initialization warning (running graceful fallback):', err?.message || err);
    adminApp = null;
  }

  return adminApp;
}

export function getAdminFirestore(): Firestore | null {
  if (firestoreDb) return firestoreDb;
  const app = getFirebaseAdmin();
  if (!app) return null;

  try {
    firestoreDb = configDatabaseId ? getFirestore(app, configDatabaseId) : getFirestore(app);
    return firestoreDb;
  } catch (err: any) {
    console.warn('[FirebaseAdmin] Error retrieving Firestore Admin instance:', err?.message || err);
    return null;
  }
}

export function isFirebaseConnected(): boolean {
  return isConnected || Boolean(configProjectId);
}
