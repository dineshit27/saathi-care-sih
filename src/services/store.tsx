import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { db, auth, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  User,
  UserRole,
  LanguageCode,
  Facility,
  Patient,
  QueueEntry,
  Referral,
  DiagnosticOrder,
  MedicineStock,
  FollowUpTask,
  AuditLogEntry,
  HealthTimelineEvent,
  AppNotification,
  Vitals,
  RiskLevel,
  OfflineAction
} from '../types';
import {
  initialFacilities,
  initialPatients,
  initialQueue,
  initialReferrals,
  initialDiagnostics,
  initialMedicines,
  initialFollowUps,
  initialAuditLogs,
  initialTimelineEvents,
  initialNotifications
} from '../data/mockData';
import { translations } from '../data/translations';
import { offlineDB } from '../offline/db';

export const demoUsers: Record<UserRole, User> = {
  patient: {
    id: 'pat-meena',
    email: 'meena.sharma@citizen.saathicare.in',
    name: 'Meena Sharma',
    role: 'patient',
    roleTitle: 'Citizen / Patient',
    village: 'Koregaon Bhima',
    preferredLanguage: 'mr',
    phone: '+91 98345 88912'
  },
  asha: {
    id: 'user-asha-001',
    email: 'sunita.asha@shirur.saathicare.in',
    name: 'Sunita Tai Gavade',
    role: 'asha',
    roleTitle: 'Frontline ASHA Worker',
    facilityId: 'fac-phc-shirur',
    facilityName: 'Shirur PHC',
    village: 'Shirur Circle',
    preferredLanguage: 'mr',
    phone: '+91 98234 55441'
  },
  doctor: {
    id: 'user-doc-001',
    email: 'anand.kulkarni@health.gov.in',
    name: 'Dr. Anand Kulkarni',
    role: 'doctor',
    roleTitle: 'Medical Officer, MBBS',
    facilityId: 'fac-phc-shirur',
    facilityName: 'Shirur Primary Health Centre',
    preferredLanguage: 'mr',
    phone: '+91 98221 00987'
  },
  facility: {
    id: 'user-fac-001',
    email: 'hospital.desk@aundhdh.gov.in',
    name: 'Pooja Deshmukh',
    role: 'facility',
    roleTitle: 'Public Health Staff Desk',
    facilityId: 'fac-dh-pune',
    facilityName: 'Aundh District Hospital / PHC Desk',
    preferredLanguage: 'mr',
    phone: '+91 20 2728 1008'
  },
  admin: {
    id: 'user-adm-001',
    email: 'dho.pune@maharashtra.gov.in',
    name: 'Dr. Vandana Rao',
    role: 'admin',
    roleTitle: 'District Health Officer (DHO)',
    facilityName: 'District Health Office, Pune',
    preferredLanguage: 'en',
    phone: '+91 20 2612 0001'
  }
};

export interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  role: UserRole;
  switchRole: (role: UserRole) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  authLoading: boolean;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  role: UserRole;
  switchRole: (role: UserRole) => void;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;

  // Real Auth
  firebaseUser: FirebaseUser | null;
  authLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;

  // Offline / Connectivity
  isOffline: boolean;
  setIsOffline: (val: boolean) => void;
  toggleOffline: () => void;
  offlineQueue: OfflineAction[];
  isSyncing: boolean;
  lastSyncedAt: string;
  syncOfflineQueue: () => Promise<void>;

  // Data Collections (Persistent & Real-Time)
  facilities: Facility[];
  patients: Patient[];
  queue: QueueEntry[];
  referrals: Referral[];
  diagnostics: DiagnosticOrder[];
  medicines: MedicineStock[];
  followUps: FollowUpTask[];
  timelineEvents: HealthTimelineEvent[];
  notifications: AppNotification[];
  auditLogs: AuditLogEntry[];

  // Real Database Mutations
  registerPatient: (newPatient: Omit<Patient, 'id' | 'registeredAt' | 'careContinuityScore'>) => Patient;
  updatePatientVitalsAndTriage: (patientId: string, vitals: Vitals, riskLevel: RiskLevel, symptoms: string[]) => void;
  addQueueEntry: (patientId: string, doctorId?: string) => QueueEntry;
  updateQueueStatus: (queueId: string, status: QueueEntry['status']) => void;
  createReferral: (referralData: Omit<Referral, 'id' | 'createdAt' | 'updatedAt'>) => Referral;
  updateReferralStatus: (referralId: string, status: Referral['status'], details?: { appointmentDate?: string; appointmentTime?: string }) => void;
  createDiagnosticOrder: (orderData: Omit<DiagnosticOrder, 'id' | 'requestedAt'>) => DiagnosticOrder;
  updateDiagnosticStatus: (diagId: string, status: DiagnosticOrder['status'], resultSummary?: string, findings?: string, isAbnormal?: boolean) => void;
  updateMedicineQuantity: (medicineId: string, newQuantity: number) => void;
  completeFollowUp: (followUpId: string, notes: string) => void;
  triggerEmergencyEscalation: (patientId: string, reason: string) => void;
  markNotificationRead: (notifId: string) => void;
  resetAllData: () => void;

  // Interactive Demo Mode
  demoScenarioStep: number;
  setDemoScenarioStep: (step: number) => void;
  runDemoStep: (step: number) => void;
  isDemoAutoPlaying: boolean;
  setIsDemoAutoPlaying: (val: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = 'saathi_care_state_v2';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const loadSaved = <T,>(key: string, defaultVal: T): T => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${key}`);
      return saved ? JSON.parse(saved) : defaultVal;
    } catch {
      return defaultVal;
    }
  };

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUserState] = useState<User>(() => loadSaved('user', demoUsers.asha));
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Synchronize user updates to localStorage
  const setCurrentUser = useCallback((user: User) => {
    setCurrentUserState(user);
    try {
      localStorage.setItem(`${STORAGE_KEY}_user`, JSON.stringify(user));
    } catch (e) {
      console.warn('Failed to cache user:', e);
    }
  }, []);

  // Switch role and update Firestore user record if authenticated
  const switchRole = useCallback(async (newRole: UserRole) => {
    const base = demoUsers[newRole];
    const updated: User = {
      ...base,
      id: firebaseUser ? firebaseUser.uid : base.id,
      email: firebaseUser?.email || base.email,
      name: firebaseUser?.displayName || base.name,
      role: newRole,
    };
    setCurrentUser(updated);

    if (firebaseUser) {
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        await setDoc(userDocRef, {
          ...updated,
          role: newRole,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn('[AuthProvider] Failed to sync role to Firestore:', err);
      }
    }
  }, [firebaseUser, setCurrentUser]);

  // Update profile details and sync to Firestore
  const updateUserProfile = useCallback(async (updates: Partial<User>) => {
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);

    if (firebaseUser) {
      try {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        await setDoc(userDocRef, {
          ...updates,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn('[AuthProvider] Failed to update user profile in Firestore:', err);
      }
    }
  }, [currentUser, firebaseUser, setCurrentUser]);

  // Track Firebase Auth state & fetch or initialize user profile in Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      setAuthLoading(false);
      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const data = userSnap.data() as User;
            setCurrentUser(data);
          } else {
            const defaultRole = currentUser.role || 'asha';
            const template = demoUsers[defaultRole] || demoUsers.asha;
            const newProfile: User = {
              ...template,
              id: fbUser.uid,
              email: fbUser.email || template.email,
              name: fbUser.displayName || 'Healthcare Worker',
              role: defaultRole,
              roleTitle: template.roleTitle,
              facilityId: template.facilityId || 'fac-phc-shirur',
              facilityName: template.facilityName || 'Shirur Primary Health Centre',
            };
            await setDoc(userDocRef, {
              ...newProfile,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            setCurrentUser(newProfile);
          }
        } catch (e) {
          console.warn('[AuthProvider] Profile fetch/create error:', e);
        }
      }
    });

    return () => unsubscribe();
  }, [currentUser.role, setCurrentUser]);

  const signInWithGoogle = useCallback(async () => {
    try {
      setAuthLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.warn('[AuthProvider] Sign-in with popup error:', err?.message || err);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    try {
      setAuthLoading(true);
      await signOut(auth);
      setFirebaseUser(null);
    } catch (err: any) {
      console.warn('[AuthProvider] Sign-out error:', err?.message || err);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        currentUser,
        setCurrentUser,
        role: currentUser.role,
        switchRole,
        signInWithGoogle,
        signOutUser,
        authLoading,
        updateUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const InnerAppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    currentUser,
    role,
    firebaseUser,
    authLoading,
    signInWithGoogle,
    signOutUser,
    switchRole: authSwitchRole,
    setCurrentUser: authSetCurrentUser,
    updateUserProfile
  } = useAuth();

  const loadSaved = <T,>(key: string, defaultVal: T): T => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${key}`);
      return saved ? JSON.parse(saved) : defaultVal;
    } catch {
      return defaultVal;
    }
  };

  const [language, setLanguageState] = useState<LanguageCode>(() => loadSaved('lang', 'mr'));

  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<OfflineAction[]>(() => loadSaved('offline_q', []));
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('Just now');

  // Core Data States (Initialized from cache/mock, synchronized with Firestore in real-time)
  const [facilities, setFacilities] = useState<Facility[]>(initialFacilities);
  const [patients, setPatients] = useState<Patient[]>(() => loadSaved('patients', initialPatients));
  const [queue, setQueue] = useState<QueueEntry[]>(() => loadSaved('queue', initialQueue));
  const [referrals, setReferrals] = useState<Referral[]>(() => loadSaved('referrals', initialReferrals));
  const [diagnostics, setDiagnostics] = useState<DiagnosticOrder[]>(() => loadSaved('diagnostics', initialDiagnostics));
  const [medicines, setMedicines] = useState<MedicineStock[]>(() => loadSaved('medicines', initialMedicines));
  const [followUps, setFollowUps] = useState<FollowUpTask[]>(() => loadSaved('followups', initialFollowUps));
  const [timelineEvents, setTimelineEvents] = useState<HealthTimelineEvent[]>(() => loadSaved('timeline', initialTimelineEvents));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => loadSaved('notifs', initialNotifications));
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => loadSaved('audit', initialAuditLogs));

  const [demoScenarioStep, setDemoScenarioStep] = useState<number>(0);
  const [isDemoAutoPlaying, setIsDemoAutoPlaying] = useState<boolean>(false);

  // Helper to seed Firestore if a collection is empty
  const seedIfEmpty = useCallback(async () => {
    try {
      const patSnap = await getDocs(collection(db, 'patients'));
      if (patSnap.empty) {
        console.info('[Firestore] Seeding real database with initial public health records...');
        // Seed patients
        for (const p of initialPatients) {
          await setDoc(doc(db, 'patients', p.id), p);
        }
        // Seed queue
        for (const q of initialQueue) {
          await setDoc(doc(db, 'queueEntries', q.id), q);
        }
        // Seed referrals
        for (const r of initialReferrals) {
          await setDoc(doc(db, 'referrals', r.id), r);
        }
        // Seed diagnostics
        for (const d of initialDiagnostics) {
          await setDoc(doc(db, 'diagnostics', d.id), d);
        }
        // Seed medicines
        for (const m of initialMedicines) {
          await setDoc(doc(db, 'medicines', m.id), m);
        }
        // Seed followups
        for (const f of initialFollowUps) {
          await setDoc(doc(db, 'followUps', f.id), f);
        }
        // Seed timeline events
        for (const t of initialTimelineEvents) {
          await setDoc(doc(db, 'healthRecords', t.id), t);
        }
        // Seed notifications
        for (const n of initialNotifications) {
          await setDoc(doc(db, 'notifications', n.id), n);
        }
        // Seed audit logs
        for (const a of initialAuditLogs) {
          await setDoc(doc(db, 'auditLogs', a.id), a);
        }
        console.info('[Firestore] Real persistent database seeded successfully.');
      }
    } catch (err) {
      console.warn('[Firestore] Initial seeding check:', err);
    }
  }, []);

  // Real-time Firestore Listeners (`onSnapshot`)
  useEffect(() => {
    seedIfEmpty();

    // 1. Patients Real-Time Listener
    const unsubPatients = onSnapshot(collection(db, 'patients'), (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Patient));
        setPatients(list);
        localStorage.setItem(`${STORAGE_KEY}_patients`, JSON.stringify(list));
      }
    }, (err) => console.warn('[Firestore onSnapshot] Patients listener error:', err.message));

    // 2. Queue Real-Time Listener
    const unsubQueue = onSnapshot(collection(db, 'queueEntries'), (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as QueueEntry));
        setQueue(list);
        localStorage.setItem(`${STORAGE_KEY}_queue`, JSON.stringify(list));
      }
    }, (err) => console.warn('[Firestore onSnapshot] Queue listener error:', err.message));

    // 3. Referrals Real-Time Listener
    const unsubReferrals = onSnapshot(collection(db, 'referrals'), (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Referral));
        setReferrals(list);
        localStorage.setItem(`${STORAGE_KEY}_referrals`, JSON.stringify(list));
      }
    }, (err) => console.warn('[Firestore onSnapshot] Referrals listener error:', err.message));

    // 4. Diagnostics Real-Time Listener
    const unsubDiagnostics = onSnapshot(collection(db, 'diagnostics'), (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as DiagnosticOrder));
        setDiagnostics(list);
        localStorage.setItem(`${STORAGE_KEY}_diagnostics`, JSON.stringify(list));
      }
    }, (err) => console.warn('[Firestore onSnapshot] Diagnostics listener error:', err.message));

    // 5. Medicines Real-Time Listener
    const unsubMedicines = onSnapshot(collection(db, 'medicines'), (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MedicineStock));
        setMedicines(list);
        localStorage.setItem(`${STORAGE_KEY}_medicines`, JSON.stringify(list));
      }
    }, (err) => console.warn('[Firestore onSnapshot] Medicines listener error:', err.message));

    // 6. FollowUps Real-Time Listener
    const unsubFollowUps = onSnapshot(collection(db, 'followUps'), (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FollowUpTask));
        setFollowUps(list);
        localStorage.setItem(`${STORAGE_KEY}_followups`, JSON.stringify(list));
      }
    }, (err) => console.warn('[Firestore onSnapshot] FollowUps listener error:', err.message));

    // 7. Timeline Events (HealthRecords) Real-Time Listener
    const unsubTimeline = onSnapshot(collection(db, 'healthRecords'), (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as HealthTimelineEvent));
        setTimelineEvents(list);
        localStorage.setItem(`${STORAGE_KEY}_timeline`, JSON.stringify(list));
      }
    }, (err) => console.warn('[Firestore onSnapshot] Timeline listener error:', err.message));

    // 8. Notifications Real-Time Listener
    const unsubNotifications = onSnapshot(collection(db, 'notifications'), (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
        setNotifications(list);
        localStorage.setItem(`${STORAGE_KEY}_notifs`, JSON.stringify(list));
      }
    }, (err) => console.warn('[Firestore onSnapshot] Notifications listener error:', err.message));

    // 9. Audit Logs Real-Time Listener
    const unsubAudit = onSnapshot(collection(db, 'auditLogs'), (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AuditLogEntry));
        setAuditLogs(list);
        localStorage.setItem(`${STORAGE_KEY}_audit`, JSON.stringify(list));
      }
    }, (err) => console.warn('[Firestore onSnapshot] Audit listener error:', err.message));

    return () => {
      unsubPatients();
      unsubQueue();
      unsubReferrals();
      unsubDiagnostics();
      unsubMedicines();
      unsubFollowUps();
      unsubTimeline();
      unsubNotifications();
      unsubAudit();
    };
  }, [seedIfEmpty]);

  // Local storage backup for current session
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_lang`, JSON.stringify(language));
  }, [language]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_user`, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_offline_q`, JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  // Translation helper
  const t = useCallback((key: string): string => {
    const langDict = translations[language] || translations.en;
    return langDict[key] || translations.en[key] || key;
  }, [language]);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
  };

  const setCurrentUser = (user: User) => {
    authSetCurrentUser(user);
    if (user.preferredLanguage) {
      setLanguageState(user.preferredLanguage);
    }
  };

  const switchRole = (role: UserRole) => {
    authSwitchRole(role);
    const selected = demoUsers[role];
    if (selected.preferredLanguage) {
      setLanguageState(selected.preferredLanguage);
    }
    // Also record audit log for evaluation tracing
    recordAudit('Role Switch', 'UserRole', selected.id, `Switched persona to ${selected.roleTitle} (${selected.name})`);
  };

  // Helper to append audit log (writes to Firestore)
  const recordAudit = async (action: string, entityType: string, entityId: string, details: string) => {
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      entityType,
      entityId,
      facilityName: currentUser.facilityName || 'District Health Network',
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);

    if (!isOffline) {
      try {
        await setDoc(doc(db, 'auditLogs', newLog.id), newLog);
      } catch (e) {
        console.warn('[Firestore] Audit log write:', e);
      }
    }
  };

  // Helper to send in-app notification (writes to Firestore)
  const sendNotification = async (
    recipientRole: UserRole | 'all',
    title: string,
    message: string,
    type: AppNotification['type'],
    recipientId?: string
  ) => {
    const notif: AppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      recipientRole,
      recipientId,
      title,
      message,
      type,
      read: false,
      timestamp: 'Just now'
    };
    setNotifications(prev => [notif, ...prev]);

    if (!isOffline) {
      try {
        await setDoc(doc(db, 'notifications', notif.id), notif);
      } catch (e) {
        console.warn('[Firestore] Notification write:', e);
      }
    }
  };

  // Offline Sync
  const toggleOffline = () => {
    setIsOffline(prev => !prev);
  };

  const syncOfflineQueue = async () => {
    setIsSyncing(true);
    let syncedCount = 0;

    try {
      const pendingActions = await offlineDB.getPendingOfflineActions();
      for (const action of pendingActions) {
        if (action.actionType === 'register_patient') {
          await setDoc(doc(db, 'patients', action.payload.id), action.payload);
        } else if (action.actionType === 'record_vitals') {
          await updateDoc(doc(db, 'patients', action.payload.patientId), {
            vitals: action.payload.vitals,
            riskLevel: action.payload.riskLevel,
            currentSymptoms: action.payload.symptoms
          });
        } else if (action.actionType === 'create_referral') {
          await setDoc(doc(db, 'referrals', action.payload.id), action.payload);
        }
      }
      syncedCount = await offlineDB.markAllSynced();
    } catch (e) {
      console.warn('[OfflineDB] Sync error:', e);
    }

    setOfflineQueue([]);
    setIsOffline(false);
    setIsSyncing(false);
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    setLastSyncedAt(timeStr);
    sendNotification(
      'asha',
      'Offline Records Synchronized',
      `Successfully synced ${syncedCount > 0 ? syncedCount : 'all'} local records with the PHC cloud database at ${timeStr}.`,
      'system'
    );
  };

  // Register Patient (Real Database + Real Time + Offline Queue)
  const registerPatient = (newPatientData: Omit<Patient, 'id' | 'registeredAt' | 'careContinuityScore'>): Patient => {
    const newId = `pat-${Date.now().toString().slice(-4)}`;
    const patient: Patient = {
      ...newPatientData,
      id: newId,
      registeredAt: new Date().toISOString(),
      careContinuityScore: {
        completedSteps: 1,
        totalSteps: 5,
        lastMilestone: 'Registration Completed with Digital Consent'
      }
    };

    // Store in IndexedDB for resilient offline-first persistence
    try {
      offlineDB.savePatient(patient).catch(err => console.warn('[OfflineDB] savePatient error:', err));
    } catch (err) {
      console.warn('[OfflineDB] savePatient sync error:', err);
    }

    if (isOffline) {
      try {
        offlineDB.enqueueOfflineAction('register_patient', patient).catch(err => console.warn('[OfflineDB] enqueue error:', err));
      } catch (err) {
        console.warn('[OfflineDB] enqueue sync error:', err);
      }
      setOfflineQueue(prev => [
        ...prev,
        {
          id: `off-${Date.now()}`,
          actionType: 'register_patient',
          payload: patient,
          timestamp: new Date().toISOString(),
          synced: false
        }
      ]);
    } else {
      // Direct Firestore Write
      setDoc(doc(db, 'patients', newId), patient).catch(e => {
        console.warn('[Firestore] Register patient write:', e);
      });
    }

    // Optimistic UI state
    setPatients(prev => [patient, ...prev.filter(p => p.id !== newId)]);

    const timelineEvt: HealthTimelineEvent = {
      id: `evt-${Date.now()}`,
      patientId: newId,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      facilityId: currentUser.facilityId || 'fac-phc-shirur',
      facilityName: currentUser.facilityName || 'Shirur PHC',
      providerName: currentUser.name,
      providerRole: currentUser.roleTitle,
      eventType: 'registration',
      title: 'Patient Registered & Digital Consent Stored',
      notes: `Registered from Village ${patient.village} under ASHA Circle. Emergency Contact: ${patient.emergencyContact.name} (${patient.emergencyContact.relationship}).`,
      badgeType: 'default'
    };
    setTimelineEvents(prev => [timelineEvt, ...prev]);
    if (!isOffline) {
      setDoc(doc(db, 'healthRecords', timelineEvt.id), timelineEvt).catch(e => console.warn('[Firestore] Timeline event:', e));
    }

    recordAudit('Patient Registered', 'Patient', newId, `Registered ${patient.name} (${patient.age}y, ${patient.gender}) from ${patient.village}.`);
    sendNotification('all', 'New Patient Enrolled', `${patient.name} registered by ${currentUser.name} at ${currentUser.facilityName || 'Shirur PHC'}.`, 'system');

    return patient;
  };

  // Update vitals and triage
  const updatePatientVitalsAndTriage = (patientId: string, vitals: Vitals, riskLevel: RiskLevel, symptoms: string[]) => {
    const targetPatient = patients.find(p => p.id === patientId);

    try {
      offlineDB.saveVitalsEntry({
        patientId,
        patientName: targetPatient?.name || 'Patient',
        vitals,
        riskLevel,
        symptoms,
        recordedAt: new Date().toISOString(),
        recordedByRole: currentUser.roleTitle,
        recordedByName: currentUser.name,
        synced: !isOffline
      }).catch(err => console.warn('[OfflineDB] saveVitalsEntry error:', err));
    } catch (err) {
      console.warn('[OfflineDB] saveVitalsEntry sync error:', err);
    }

    if (isOffline) {
      try {
        offlineDB.enqueueOfflineAction('record_vitals', { patientId, vitals, riskLevel, symptoms })
          .catch(err => console.warn('[OfflineDB] enqueue vitals error:', err));
      } catch (err) {
        console.warn('[OfflineDB] enqueue vitals sync error:', err);
      }
      setOfflineQueue(prev => [
        ...prev,
        {
          id: `off-${Date.now()}`,
          actionType: 'record_vitals',
          payload: { patientId, vitals, riskLevel, symptoms },
          timestamp: new Date().toISOString(),
          synced: false
        }
      ]);
    } else {
      // Direct Firestore Update
      updateDoc(doc(db, 'patients', patientId), {
        vitals,
        riskLevel,
        currentSymptoms: symptoms,
        'careContinuityScore.completedSteps': Math.max(targetPatient?.careContinuityScore?.completedSteps || 1, 2),
        'careContinuityScore.lastMilestone': 'Assisted Digital Triage Completed'
      }).catch(e => console.warn('[Firestore] Patient triage update:', e));
    }

    // Optimistic UI state
    setPatients(prev =>
      prev.map(p => {
        if (p.id !== patientId) return p;
        return {
          ...p,
          vitals,
          riskLevel,
          currentSymptoms: symptoms,
          careContinuityScore: {
            ...p.careContinuityScore,
            completedSteps: Math.max(p.careContinuityScore.completedSteps, 2),
            lastMilestone: 'Assisted Digital Triage Completed'
          }
        };
      })
    );

    const timelineEvt: HealthTimelineEvent = {
      id: `evt-${Date.now()}`,
      patientId,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      facilityId: currentUser.facilityId || 'fac-phc-shirur',
      facilityName: currentUser.facilityName || 'Shirur PHC',
      providerName: currentUser.name,
      providerRole: currentUser.roleTitle,
      eventType: 'triage',
      title: `Digital Triage Completed — ${riskLevel.toUpperCase()}`,
      notes: `Vitals recorded: BP ${vitals.systolicBp || '--'}/${vitals.diastolicBp || '--'}, SpO2 ${vitals.spo2 || '--'}%, Pulse ${vitals.pulse || '--'}. Symptoms: ${symptoms.join(', ')}.`,
      vitals,
      badgeType: riskLevel === 'emergency' ? 'emergency' : riskLevel === 'urgent' ? 'urgent' : 'default'
    };
    setTimelineEvents(prev => [timelineEvt, ...prev]);
    if (!isOffline) {
      setDoc(doc(db, 'healthRecords', timelineEvt.id), timelineEvt).catch(e => console.warn('[Firestore] Timeline event:', e));
    }

    recordAudit('Triage Completed', 'Vitals', patientId, `Risk assessed as ${riskLevel.toUpperCase()}.`);
  };

  // Add Queue Entry (Real Firestore Write)
  const addQueueEntry = (patientId: string, doctorId: string = 'doc-001'): QueueEntry => {
    const patient = patients.find(p => p.id === patientId);
    const tokenNum = `A00${queue.length + 1}`;
    const newEntry: QueueEntry = {
      id: `q-${Date.now()}`,
      tokenNumber: tokenNum,
      patientId,
      patientName: patient?.name || 'Patient',
      patientAge: patient?.age || 35,
      patientGender: patient?.gender || 'Other',
      patientVillage: patient?.village || 'Local Village',
      facilityId: currentUser.facilityId || 'fac-phc-shirur',
      facilityName: currentUser.facilityName || 'Shirur Primary Health Centre (PHC)',
      doctorId,
      doctorName: 'Dr. Anand Kulkarni',
      status: 'waiting',
      priority: patient?.riskLevel || 'routine',
      joinedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      estimatedWaitMinutes: (queue.filter(q => q.status === 'waiting').length + 1) * 10
    };

    // Optimistic UI state
    setQueue(prev => [...prev, newEntry]);

    // Direct Firestore Write
    if (!isOffline) {
      setDoc(doc(db, 'queueEntries', newEntry.id), newEntry).catch(e => console.warn('[Firestore] Queue write:', e));
    }

    const timelineEvt: HealthTimelineEvent = {
      id: `evt-${Date.now()}`,
      patientId,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      facilityId: newEntry.facilityId,
      facilityName: newEntry.facilityName,
      providerName: 'Desk Dispatcher',
      providerRole: 'System Queue',
      eventType: 'appointment',
      title: `Added to Consultation Queue (#${tokenNum})`,
      notes: `Joined consultation queue for Medical Officer review at ${newEntry.facilityName}.`,
      badgeType: 'default'
    };
    setTimelineEvents(prev => [timelineEvt, ...prev]);
    if (!isOffline) {
      setDoc(doc(db, 'healthRecords', timelineEvt.id), timelineEvt).catch(e => console.warn('[Firestore] Timeline event:', e));
    }

    sendNotification('patient', 'Queue Token Allocated', `Your token is ${tokenNum}. Estimated wait: ${newEntry.estimatedWaitMinutes} mins.`, 'appointment', patientId);
    sendNotification('doctor', 'New Queue Arrival', `${patient?.name || 'Patient'} (#${tokenNum}) queued for consultation.`, 'appointment');
    recordAudit('Queue Token Issued', 'Queue', newEntry.id, `Token ${tokenNum} for ${patient?.name}.`);

    return newEntry;
  };

  // Update Queue Status (Real Firestore Write)
  const updateQueueStatus = (queueId: string, status: QueueEntry['status']) => {
    // Optimistic update
    setQueue(prev =>
      prev.map(q => {
        if (q.id !== queueId) return q;
        return { ...q, status };
      })
    );

    // Direct Firestore update
    if (!isOffline) {
      updateDoc(doc(db, 'queueEntries', queueId), { status }).catch(e => console.warn('[Firestore] Queue update:', e));
    }

    const entry = queue.find(q => q.id === queueId);
    if (entry) {
      recordAudit('Queue Status Changed', 'Queue', queueId, `Changed status of token ${entry.tokenNumber} to ${status}.`);
      if (status === 'in_consultation') {
        sendNotification('patient', 'Now Calling Your Token', `Token ${entry.tokenNumber}: Please proceed into the Medical Officer room.`, 'appointment', entry.patientId);
      } else if (status === 'completed') {
        if (!isOffline) {
          updateDoc(doc(db, 'patients', entry.patientId), {
            'careContinuityScore.completedSteps': 3,
            'careContinuityScore.lastMilestone': 'Doctor Consultation Completed'
          }).catch(e => console.warn('[Firestore] Patient score:', e));
        }
        setPatients(pts =>
          pts.map(p =>
            p.id === entry.patientId
              ? {
                  ...p,
                  careContinuityScore: {
                    ...p.careContinuityScore,
                    completedSteps: Math.max(p.careContinuityScore.completedSteps, 3),
                    lastMilestone: 'Doctor Consultation Completed'
                  }
                }
              : p
          )
        );
      }
    }
  };

  // Create Referral (Real Firestore Write)
  const createReferral = (referralData: Omit<Referral, 'id' | 'createdAt' | 'updatedAt'>): Referral => {
    const refId = `REF-2026-MH-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRef: Referral = {
      ...referralData,
      id: refId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store in IndexedDB
    try {
      offlineDB.saveReferralDraft({
        ...newRef,
        isDraft: isOffline,
        synced: !isOffline
      }).catch(err => console.warn('[OfflineDB] saveReferralDraft error:', err));
    } catch (err) {
      console.warn('[OfflineDB] saveReferralDraft sync error:', err);
    }

    if (isOffline) {
      try {
        offlineDB.enqueueOfflineAction('create_referral', newRef)
          .catch(err => console.warn('[OfflineDB] enqueue referral error:', err));
      } catch (err) {
        console.warn('[OfflineDB] enqueue referral sync error:', err);
      }
      setOfflineQueue(prev => [
        ...prev,
        {
          id: `off-${Date.now()}`,
          actionType: 'create_referral',
          payload: newRef,
          timestamp: new Date().toISOString(),
          synced: false
        }
      ]);
    } else {
      // Direct Firestore Write
      setDoc(doc(db, 'referrals', refId), newRef).catch(e => console.warn('[Firestore] Referral write:', e));
    }

    // Optimistic UI state
    setReferrals(prev => [newRef, ...prev]);

    // Update patient Care Continuity Score in Firestore
    if (!isOffline) {
      updateDoc(doc(db, 'patients', newRef.patientId), {
        'careContinuityScore.completedSteps': 3,
        'careContinuityScore.lastMilestone': `Referral Initiated to ${newRef.toFacilityName}`
      }).catch(e => console.warn('[Firestore] Patient referral score:', e));
    }

    setPatients(pts =>
      pts.map(p =>
        p.id === newRef.patientId
          ? {
              ...p,
              careContinuityScore: {
                ...p.careContinuityScore,
                completedSteps: Math.max(p.careContinuityScore.completedSteps, 3),
                lastMilestone: `Referral Initiated to ${newRef.toFacilityName}`
              }
            }
          : p
      )
    );

    // Timeline event
    const timelineEvt: HealthTimelineEvent = {
      id: `evt-${Date.now()}`,
      patientId: newRef.patientId,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      facilityId: newRef.fromFacilityId,
      facilityName: newRef.fromFacilityName,
      providerName: currentUser.name,
      providerRole: currentUser.roleTitle,
      eventType: 'referral_created',
      title: `Inter-Facility Referral Created (${newRef.toFacilityName})`,
      notes: `Reason: ${newRef.reason}. Specialist Required: ${newRef.specialistRequired}. Provisional: ${newRef.provisionalDiagnosis}. Transport Assistance: ${newRef.transportAssisted ? 'Yes' : 'Self'}.`,
      badgeType: 'urgent'
    };
    setTimelineEvents(prev => [timelineEvt, ...prev]);
    if (!isOffline) {
      setDoc(doc(db, 'healthRecords', timelineEvt.id), timelineEvt).catch(e => console.warn('[Firestore] Timeline event:', e));
    }

    sendNotification('facility', 'New Incoming Referral', `Referral received for ${newRef.patientName} from ${newRef.fromFacilityName}.`, 'referral');
    sendNotification('patient', 'Referral Created', `Referral to ${newRef.toFacilityName} initiated. Awaiting facility scheduling.`, 'referral', newRef.patientId);
    recordAudit('Referral Created', 'Referral', refId, `Referred ${newRef.patientName} to ${newRef.toFacilityName}.`);

    return newRef;
  };

  // Update Referral Status (Real Firestore Write)
  const updateReferralStatus = (
    referralId: string,
    status: Referral['status'],
    details?: { appointmentDate?: string; appointmentTime?: string }
  ) => {
    // Optimistic UI state
    setReferrals(prev =>
      prev.map(r => {
        if (r.id !== referralId) return r;
        return {
          ...r,
          status,
          ...(details?.appointmentDate ? { appointmentDate: details.appointmentDate } : {}),
          ...(details?.appointmentTime ? { appointmentTime: details.appointmentTime } : {}),
          updatedAt: new Date().toISOString()
        };
      })
    );

    // Direct Firestore update
    if (!isOffline) {
      updateDoc(doc(db, 'referrals', referralId), {
        status,
        ...(details?.appointmentDate ? { appointmentDate: details.appointmentDate } : {}),
        ...(details?.appointmentTime ? { appointmentTime: details.appointmentTime } : {}),
        updatedAt: new Date().toISOString()
      }).catch(e => console.warn('[Firestore] Referral status update:', e));
    }

    const ref = referrals.find(r => r.id === referralId);
    if (ref) {
      let timelineTitle = `Referral Status: ${status.replace('_', ' ').toUpperCase()}`;
      let badge: HealthTimelineEvent['badgeType'] = 'default';

      if (status === 'accepted') {
        timelineTitle = `Referral Accepted by ${ref.toFacilityName}`;
        badge = 'success';
      } else if (status === 'scheduled') {
        timelineTitle = `Specialist Appointment Scheduled (${details?.appointmentDate || 'Soon'})`;
        badge = 'success';
      } else if (status === 'completed') {
        timelineTitle = `Specialist Consultation Completed at ${ref.toFacilityName}`;
        badge = 'success';
      }

      const timelineEvt: HealthTimelineEvent = {
        id: `evt-${Date.now()}`,
        patientId: ref.patientId,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        facilityId: ref.toFacilityId,
        facilityName: ref.toFacilityName,
        providerName: currentUser.name,
        providerRole: currentUser.roleTitle,
        eventType: status === 'accepted' ? 'referral_accepted' : 'appointment',
        title: timelineTitle,
        notes: `Referral ${ref.id} updated to ${status}. Details: ${details?.appointmentDate ? `Date: ${details.appointmentDate} ${details.appointmentTime}` : 'Updated in district registry'}.`,
        badgeType: badge
      };
      setTimelineEvents(prev => [timelineEvt, ...prev]);
      if (!isOffline) {
        setDoc(doc(db, 'healthRecords', timelineEvt.id), timelineEvt).catch(e => console.warn('[Firestore] Timeline event:', e));
      }

      // If scheduled or completed, create automated ASHA follow-up task
      if (status === 'scheduled' || status === 'completed') {
        const followUpId = `fup-${Date.now()}`;
        const newFollowUp: FollowUpTask = {
          id: followUpId,
          patientId: ref.patientId,
          patientName: ref.patientName,
          patientVillage: ref.patientVillage,
          phone: '+91 98234 11209',
          category: 'high_risk',
          assignedAshaName: 'Sunita Tai Gavade',
          dueDate: details?.appointmentDate ? details.appointmentDate : 'Tomorrow',
          status: 'due',
          reason: `Post-referral follow-up: verify patient reached ${ref.toFacilityName} and received discharge prescriptions.`
        };
        setFollowUps(fups => [newFollowUp, ...fups]);
        if (!isOffline) {
          setDoc(doc(db, 'followUps', followUpId), newFollowUp).catch(e => console.warn('[Firestore] Followup create:', e));
        }
      }

      sendNotification('patient', 'Referral Update', `Your referral to ${ref.toFacilityName} is now ${status}.`, 'referral', ref.patientId);
      sendNotification('asha', 'Referral Status Change', `Referral for ${ref.patientName} updated to ${status} by ${ref.toFacilityName}.`, 'referral');
      recordAudit('Referral Status Updated', 'Referral', referralId, `Status moved to ${status}.`);
    }
  };

  // Create Diagnostic Order (Real Firestore Write)
  const createDiagnosticOrder = (orderData: Omit<DiagnosticOrder, 'id' | 'requestedAt'>): DiagnosticOrder => {
    const diagId = `diag-${Date.now()}`;
    const newOrder: DiagnosticOrder = {
      ...orderData,
      id: diagId,
      requestedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };

    setDiagnostics(prev => [newOrder, ...prev]);
    if (!isOffline) {
      setDoc(doc(db, 'diagnostics', diagId), newOrder).catch(e => console.warn('[Firestore] Diagnostic write:', e));
    }

    const timelineEvt: HealthTimelineEvent = {
      id: `evt-${Date.now()}`,
      patientId: newOrder.patientId,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      facilityId: newOrder.facilityId,
      facilityName: newOrder.facilityName,
      providerName: currentUser.name,
      providerRole: currentUser.roleTitle,
      eventType: 'diagnostic_request',
      title: `Diagnostic Test Ordered: ${newOrder.testType}`,
      notes: `Requested by ${newOrder.requestingDoctor} at ${newOrder.facilityName}. Sample collection initiated.`,
      badgeType: 'default'
    };
    setTimelineEvents(prev => [timelineEvt, ...prev]);
    if (!isOffline) {
      setDoc(doc(db, 'healthRecords', timelineEvt.id), timelineEvt).catch(e => console.warn('[Firestore] Timeline event:', e));
    }

    sendNotification('patient', 'Diagnostic Test Ordered', `${newOrder.testType} has been ordered. Please visit the sample collection window.`, 'diagnostic', newOrder.patientId);
    recordAudit('Diagnostic Ordered', 'Diagnostic', diagId, `${newOrder.testType} ordered for ${newOrder.patientName}.`);

    return newOrder;
  };

  // Update Diagnostic Status (Real Firestore Write)
  const updateDiagnosticStatus = (
    diagId: string,
    status: DiagnosticOrder['status'],
    resultSummary?: string,
    findings?: string,
    isAbnormal?: boolean
  ) => {
    setDiagnostics(prev =>
      prev.map(d => {
        if (d.id !== diagId) return d;
        return {
          ...d,
          status,
          ...(resultSummary ? { resultSummary } : {}),
          ...(findings ? { findings } : {}),
          ...(isAbnormal !== undefined ? { isAbnormal } : {}),
          ...(status === 'result_available' ? { completedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) } : {})
        };
      })
    );

    if (!isOffline) {
      updateDoc(doc(db, 'diagnostics', diagId), {
        status,
        ...(resultSummary ? { resultSummary } : {}),
        ...(findings ? { findings } : {}),
        ...(isAbnormal !== undefined ? { isAbnormal } : {}),
        ...(status === 'result_available' ? { completedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) } : {})
      }).catch(e => console.warn('[Firestore] Diagnostic update:', e));
    }

    const order = diagnostics.find(d => d.id === diagId);
    if (order) {
      const timelineEvt: HealthTimelineEvent = {
        id: `evt-${Date.now()}`,
        patientId: order.patientId,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        facilityId: order.facilityId,
        facilityName: order.facilityName,
        providerName: currentUser.name,
        providerRole: currentUser.roleTitle,
        eventType: 'diagnostic_result',
        title: `Diagnostic Result: ${order.testType} (${status.replace('_', ' ').toUpperCase()})`,
        notes: resultSummary || `Status updated to ${status}.`,
        badgeType: isAbnormal ? 'urgent' : 'success'
      };
      setTimelineEvents(prev => [timelineEvt, ...prev]);
      if (!isOffline) {
        setDoc(doc(db, 'healthRecords', timelineEvt.id), timelineEvt).catch(e => console.warn('[Firestore] Timeline event:', e));
      }

      sendNotification('doctor', 'Diagnostic Result Ready', `Results for ${order.testType} on patient ${order.patientName} are available.`, 'diagnostic');
      sendNotification('patient', 'Diagnostic Result Available', `Results for ${order.testType} have been attached to your health timeline.`, 'diagnostic', order.patientId);
      recordAudit('Diagnostic Status Updated', 'Diagnostic', diagId, `Result updated to ${status}.`);
    }
  };

  // Medicine Quantity update (Real Firestore Write)
  const updateMedicineQuantity = (medicineId: string, newQuantity: number) => {
    const status: MedicineStock['status'] = newQuantity === 0 ? 'out_of_stock' : newQuantity < 30 ? 'low_stock' : 'available';

    setMedicines(prev =>
      prev.map(m => {
        if (m.id !== medicineId) return m;
        return {
          ...m,
          availableQuantity: newQuantity,
          status,
          lastUpdated: 'Just now'
        };
      })
    );

    if (!isOffline) {
      updateDoc(doc(db, 'medicines', medicineId), {
        availableQuantity: newQuantity,
        status,
        lastUpdated: 'Just now'
      }).catch(e => console.warn('[Firestore] Medicine stock update:', e));
    }

    const med = medicines.find(m => m.id === medicineId);
    recordAudit('Pharmacy Inventory Adjusted', 'Medicine', medicineId, `Updated stock for ${med?.medicineName} to ${newQuantity}.`);
  };

  // Complete Follow-up (Real Firestore Write)
  const completeFollowUp = (followUpId: string, notes: string) => {
    setFollowUps(prev =>
      prev.map(f => {
        if (f.id !== followUpId) return f;
        return {
          ...f,
          status: 'completed',
          lastVisitNotes: notes,
          completedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        };
      })
    );

    if (!isOffline) {
      updateDoc(doc(db, 'followUps', followUpId), {
        status: 'completed',
        lastVisitNotes: notes,
        completedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      }).catch(e => console.warn('[Firestore] Followup update:', e));
    }

    const fup = followUps.find(f => f.id === followUpId);
    if (fup) {
      const timelineEvt: HealthTimelineEvent = {
        id: `evt-${Date.now()}`,
        patientId: fup.patientId,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        facilityId: currentUser.facilityId || 'fac-phc-shirur',
        facilityName: currentUser.facilityName || 'Shirur PHC',
        providerName: currentUser.name,
        providerRole: currentUser.roleTitle,
        eventType: 'follow_up_completed',
        title: 'Community Follow-up Completed by ASHA',
        notes: `ASHA Note: ${notes}. Patient checked at home in Village ${fup.patientVillage}.`,
        badgeType: 'success'
      };
      setTimelineEvents(prev => [timelineEvt, ...prev]);
      if (!isOffline) {
        setDoc(doc(db, 'healthRecords', timelineEvt.id), timelineEvt).catch(e => console.warn('[Firestore] Timeline event:', e));
      }

      // Update patient care continuity score to 5/5!
      if (!isOffline) {
        updateDoc(doc(db, 'patients', fup.patientId), {
          'careContinuityScore.completedSteps': 5,
          'careContinuityScore.totalSteps': 5,
          'careContinuityScore.lastMilestone': 'Full Continuum of Care Achieved (Post-Referral Follow-up Closed)'
        }).catch(e => console.warn('[Firestore] Patient score 5/5:', e));
      }

      setPatients(pts =>
        pts.map(p =>
          p.id === fup.patientId
            ? {
                ...p,
                careContinuityScore: {
                  completedSteps: 5,
                  totalSteps: 5,
                  lastMilestone: 'Full Continuum of Care Achieved (Post-Referral Follow-up Closed)'
                }
              }
            : p
        )
      );

      sendNotification('doctor', 'Follow-up Confirmed', `ASHA completed follow-up visit for ${fup.patientName} (${fup.patientVillage}).`, 'follow_up');
      recordAudit('Follow-up Completed', 'FollowUp', followUpId, `Completed visit for ${fup.patientName}.`);
    }
  };

  // Emergency Escalation (Real Firestore Write)
  const triggerEmergencyEscalation = (patientId: string, reason: string) => {
    const patient = patients.find(p => p.id === patientId);
    const eventId = `emerg-${Date.now()}`;

    if (!isOffline) {
      setDoc(doc(db, 'emergencyEvents', eventId), {
        id: eventId,
        patientId,
        patientName: patient?.name || 'Patient',
        facilityId: currentUser.facilityId || 'fac-phc-shirur',
        facilityName: currentUser.facilityName || 'Shirur PHC',
        triggeredBy: currentUser.name,
        triggeredByRole: currentUser.roleTitle,
        reason,
        priority: 'CRITICAL',
        status: 'DISPATCHED',
        createdAt: new Date().toISOString()
      }).catch(e => console.warn('[Firestore] Emergency write:', e));
    }

    const timelineEvt: HealthTimelineEvent = {
      id: `evt-${Date.now()}`,
      patientId,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      facilityId: currentUser.facilityId || 'fac-phc-shirur',
      facilityName: currentUser.facilityName || 'Shirur PHC',
      providerName: currentUser.name,
      providerRole: currentUser.roleTitle,
      eventType: 'emergency_escalation',
      title: 'CRITICAL EMERGENCY ESCALATION ACTIVATED',
      notes: `Immediate 108 ambulance dispatch and Senior Medical Officer alert triggered: "${reason}".`,
      badgeType: 'emergency'
    };
    setTimelineEvents(prev => [timelineEvt, ...prev]);
    if (!isOffline) {
      setDoc(doc(db, 'healthRecords', timelineEvt.id), timelineEvt).catch(e => console.warn('[Firestore] Timeline event:', e));
    }

    sendNotification('all', 'EMERGENCY ALERT', `Critical escalation for ${patient?.name || 'Patient'} (${patient?.village || 'PHC'}). Reason: ${reason}.`, 'emergency', patientId);
    recordAudit('EMERGENCY ESCALATION', 'Emergency', patientId, `Triggered emergency response for ${patient?.name}. Reason: ${reason}`);
  };

  const markNotificationRead = (notifId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notifId ? { ...n, read: true } : n))
    );
    if (!isOffline) {
      updateDoc(doc(db, 'notifications', notifId), { read: true }).catch(e => console.warn('[Firestore] Notification read:', e));
    }
  };

  const resetAllData = async () => {
    localStorage.clear();
    setPatients(initialPatients);
    setQueue(initialQueue);
    setReferrals(initialReferrals);
    setDiagnostics(initialDiagnostics);
    setMedicines(initialMedicines);
    setFollowUps(initialFollowUps);
    setTimelineEvents(initialTimelineEvents);
    setNotifications(initialNotifications);
    setAuditLogs(initialAuditLogs);
    setOfflineQueue([]);
    setDemoScenarioStep(0);
    setIsOffline(false);

    // Also re-seed Firestore with clean synthetic dataset
    try {
      for (const p of initialPatients) {
        await setDoc(doc(db, 'patients', p.id), p);
      }
      for (const q of initialQueue) {
        await setDoc(doc(db, 'queueEntries', q.id), q);
      }
      for (const r of initialReferrals) {
        await setDoc(doc(db, 'referrals', r.id), r);
      }
      for (const d of initialDiagnostics) {
        await setDoc(doc(db, 'diagnostics', d.id), d);
      }
      for (const m of initialMedicines) {
        await setDoc(doc(db, 'medicines', m.id), m);
      }
      for (const f of initialFollowUps) {
        await setDoc(doc(db, 'followUps', f.id), f);
      }
    } catch (e) {
      console.warn('[Firestore] Reset error:', e);
    }
  };

  // Connected Cross-Browser Demo Scenario Flow (Mutates real persistent Firestore database)
  const runDemoStep = (step: number) => {
    setDemoScenarioStep(step);
    switch (step) {
      case 1:
        // Frontline Worker opens Meena Sharma
        switchRole('asha');
        break;
      case 2:
        // Triage vitals recorded for Meena
        updatePatientVitalsAndTriage('pat-meena', {
          temperature: 98.6,
          pulse: 92,
          systolicBp: 156,
          diastolicBp: 98,
          spo2: 96,
          respiratoryRate: 18,
          weight: 58
        }, 'urgent', ['Severe morning headache', 'Occasional blurry vision', 'Swelling in feet']);
        break;
      case 3:
        // Joined PHC Queue
        addQueueEntry('pat-meena');
        break;
      case 4:
        // Doctor opens Meena's queue entry
        switchRole('doctor');
        const meenaQueue = queue.find(q => q.patientId === 'pat-meena') || queue[0];
        if (meenaQueue) {
          updateQueueStatus(meenaQueue.id, 'in_consultation');
        }
        break;
      case 5:
        // Doctor requests Point-of-Care Diagnostic
        createDiagnosticOrder({
          patientId: 'pat-meena',
          patientName: 'Meena Sharma',
          testType: 'Point-of-Care 12-Lead ECG & Renal Profile',
          facilityId: 'fac-phc-shirur',
          facilityName: 'Shirur PHC',
          requestingDoctor: 'Dr. Anand Kulkarni',
          status: 'sample_collected'
        });
        break;
      case 6:
        // Doctor creates referral to District Hospital
        createReferral({
          patientId: 'pat-meena',
          patientName: 'Meena Sharma',
          patientAge: 29,
          patientGender: 'Female',
          patientVillage: 'Koregaon Bhima',
          fromFacilityId: 'fac-phc-shirur',
          fromFacilityName: 'Shirur PHC',
          toFacilityId: 'fac-dh-pune',
          toFacilityName: 'Aundh District Hospital',
          referringDoctorName: 'Dr. Anand Kulkarni',
          reason: 'Stage 2 Gestational Hypertension with visual symptoms; obstetrics & physician evaluation needed',
          priority: 'urgent',
          provisionalDiagnosis: 'Gestational Hypertension with Impending Pre-eclampsia Signs',
          clinicalNotes: 'BP persistently above 150/95. Proteinuria test pending. Referred for tertiary obstetric evaluation.',
          status: 'sent',
          transportAssisted: true,
          specialistRequired: 'Obstetrician / Specialist Physician'
        });
        break;
      case 7:
        // District Hospital Staff accepts referral
        switchRole('facility');
        const meenaRef = referrals.find(r => r.patientId === 'pat-meena') || referrals[0];
        if (meenaRef) {
          updateReferralStatus(meenaRef.id, 'accepted');
        }
        break;
      case 8:
        // District Hospital schedules appointment slot
        const meenaRefSched = referrals.find(r => r.patientId === 'pat-meena') || referrals[0];
        if (meenaRefSched) {
          updateReferralStatus(meenaRefSched.id, 'scheduled', {
            appointmentDate: '2026-09-24',
            appointmentTime: '11:30 AM'
          });
        }
        break;
      case 9:
        // Diagnostic result uploaded
        const diag = diagnostics.find(d => d.patientId === 'pat-meena') || diagnostics[0];
        if (diag) {
          updateDiagnosticStatus(diag.id, 'result_available', 'Sinus tachycardia, LV strain verified. Fasting Glucose 142 mg/dL.', 'LV Strain pattern confirmed', true);
        }
        break;
      case 10:
        // Medicine stock verified
        updateMedicineQuantity('med-001', 410);
        break;
      case 11:
        // Citizen / Patient views completed journey
        switchRole('patient');
        break;
      case 12:
        // ASHA completes village follow-up (Care Continuity 5/5)
        switchRole('asha');
        const fup = followUps.find(f => f.patientId === 'pat-meena') || followUps[0];
        if (fup) {
          completeFollowUp(fup.id, 'Visited Meena at home in Koregaon Bhima. Confirmed adherence to prescribed medication; assisted with district hospital transport card.');
        }
        break;
      default:
        break;
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        role,
        switchRole,
        language,
        setLanguage,
        t,
        firebaseUser,
        authLoading,
        signInWithGoogle,
        signOutUser,
        updateUserProfile,
        isOffline,
        setIsOffline,
        toggleOffline,
        offlineQueue,
        isSyncing,
        lastSyncedAt,
        syncOfflineQueue,
        facilities,
        patients,
        queue,
        referrals,
        diagnostics,
        medicines,
        followUps,
        timelineEvents,
        notifications,
        auditLogs,
        registerPatient,
        updatePatientVitalsAndTriage,
        addQueueEntry,
        updateQueueStatus,
        createReferral,
        updateReferralStatus,
        createDiagnosticOrder,
        updateDiagnosticStatus,
        updateMedicineQuantity,
        completeFollowUp,
        triggerEmergencyEscalation,
        markNotificationRead,
        resetAllData,
        demoScenarioStep,
        setDemoScenarioStep,
        runDemoStep,
        isDemoAutoPlaying,
        setIsDemoAutoPlaying
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const existingAuth = useContext(AuthContext);
  if (!existingAuth) {
    return (
      <AuthProvider>
        <InnerAppProvider>{children}</InnerAppProvider>
      </AuthProvider>
    );
  }
  return <InnerAppProvider>{children}</InnerAppProvider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
