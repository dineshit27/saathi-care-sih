import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  HealthTimelineEvent,
  AppNotification,
  AuditLogEntry,
  OfflineAction,
  Vitals,
  RiskLevel
} from '../types';
import {
  initialFacilities,
  initialPatients,
  initialQueue,
  initialReferrals,
  initialDiagnostics,
  initialMedicines,
  initialFollowUps,
  initialTimelineEvents,
  initialNotifications,
  initialAuditLogs
} from '../data/mockData';
import { translations } from '../data/translations';
import { offlineDB } from '../offline/db';

// Pre-configured Demo Users
export const demoUsers: Record<UserRole, User> = {
  patient: {
    id: 'user-pat-001',
    email: 'patient@demo.saathicare.in',
    name: 'Ramesh Patil',
    role: 'patient',
    roleTitle: 'Citizen (Rural Patient)',
    village: 'Shirur Rural',
    preferredLanguage: 'mr',
    phone: '+91 98234 11209'
  },
  asha: {
    id: 'user-asha-001',
    email: 'asha@demo.saathicare.in',
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
    email: 'doctor@demo.saathicare.in',
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
    email: 'facility@demo.saathicare.in',
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
    email: 'admin@demo.saathicare.in',
    name: 'Dr. Vandana Rao',
    role: 'admin',
    roleTitle: 'District Health Officer (DHO)',
    facilityName: 'District Health Office, Pune',
    preferredLanguage: 'en',
    phone: '+91 20 2612 0001'
  }
};

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  switchRole: (role: UserRole) => void;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;

  // Offline / Connectivity
  isOffline: boolean;
  setIsOffline: (val: boolean) => void;
  toggleOffline: () => void;
  offlineQueue: OfflineAction[];
  isSyncing: boolean;
  lastSyncedAt: string;
  syncOfflineQueue: () => Promise<void>;

  // Data Collections
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

  // Mutations
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

  // SIH 2026 Interactive Demo Mode
  demoScenarioStep: number;
  setDemoScenarioStep: (step: number) => void;
  runDemoStep: (step: number) => void;
  isDemoAutoPlaying: boolean;
  setIsDemoAutoPlaying: (val: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = 'saathi_care_state_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or initialize defaults
  const loadSaved = <T,>(key: string, defaultVal: T): T => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${key}`);
      return saved ? JSON.parse(saved) : defaultVal;
    } catch {
      return defaultVal;
    }
  };

  const [language, setLanguageState] = useState<LanguageCode>(() => loadSaved('lang', 'mr'));
  const [currentUser, setCurrentUserState] = useState<User>(() => loadSaved('user', demoUsers.asha));
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<OfflineAction[]>(() => loadSaved('offline_q', []));
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('Just now');

  const [facilities, setFacilities] = useState<Facility[]>(() => loadSaved('facilities', initialFacilities));
  const [patients, setPatients] = useState<Patient[]>(() => loadSaved('patients', initialPatients));
  const [queue, setQueue] = useState<QueueEntry[]>(() => loadSaved('queue', initialQueue));
  const [referrals, setReferrals] = useState<Referral[]>(() => loadSaved('referrals', initialReferrals));
  const [diagnostics, setDiagnostics] = useState<DiagnosticOrder[]>(() => loadSaved('diagnostics', initialDiagnostics));
  const [medicines, setMedicines] = useState<MedicineStock[]>(() => loadSaved('medicines', initialMedicines));
  const [followUps, setFollowUps] = useState<FollowUpTask[]>(() => loadSaved('followups', initialFollowUps));
  const [timelineEvents, setTimelineEvents] = useState<HealthTimelineEvent[]>(() => loadSaved('timeline', initialTimelineEvents));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => loadSaved('notifs', initialNotifications));
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => loadSaved('audit', initialAuditLogs));

  // SIH Demo Scenario step
  const [demoScenarioStep, setDemoScenarioStep] = useState<number>(0);
  const [isDemoAutoPlaying, setIsDemoAutoPlaying] = useState<boolean>(false);

  // Persistence helpers
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_lang`, JSON.stringify(language));
  }, [language]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_user`, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_patients`, JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_queue`, JSON.stringify(queue));
  }, [queue]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_referrals`, JSON.stringify(referrals));
  }, [referrals]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_diagnostics`, JSON.stringify(diagnostics));
  }, [diagnostics]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_medicines`, JSON.stringify(medicines));
  }, [medicines]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_followups`, JSON.stringify(followUps));
  }, [followUps]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_timeline`, JSON.stringify(timelineEvents));
  }, [timelineEvents]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_notifs`, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_audit`, JSON.stringify(auditLogs));
  }, [auditLogs]);

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
    setCurrentUserState(user);
    if (user.preferredLanguage) {
      setLanguageState(user.preferredLanguage);
    }
  };

  const switchRole = (role: UserRole) => {
    const selected = demoUsers[role];
    setCurrentUserState(selected);
    if (selected.preferredLanguage) {
      setLanguageState(selected.preferredLanguage);
    }
  };

  // Helper to append audit log
  const recordAudit = (action: string, entityType: string, entityId: string, details: string) => {
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
  };

  // Helper to send in-app notification
  const sendNotification = (
    recipientRole: UserRole | 'all',
    title: string,
    message: string,
    type: AppNotification['type'],
    recipientId?: string
  ) => {
    const notif: AppNotification = {
      id: `notif-${Date.now()}`,
      recipientRole,
      recipientId,
      title,
      message,
      type,
      read: false,
      timestamp: 'Just now'
    };
    setNotifications(prev => [notif, ...prev]);
  };

  // Offline Sync
  const toggleOffline = () => {
    setIsOffline(prev => !prev);
  };

  const syncOfflineQueue = async () => {
    setIsSyncing(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    let syncedCount = 0;
    try {
      syncedCount = await offlineDB.markAllSynced();
    } catch (e) {
      console.warn('[OfflineDB] Clear queue error:', e);
    }
    setOfflineQueue([]);
    setIsOffline(false); // Connection restored when pushing data to cloud
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

  // Register Patient
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
    }

    setPatients(prev => [patient, ...prev]);

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

    recordAudit('Patient Registered', 'Patient', newId, `Registered ${patient.name} (${patient.age}y, ${patient.gender}) from ${patient.village}.`);
    sendNotification('all', 'New Patient Enrolled', `${patient.name} registered by ${currentUser.name} at ${currentUser.facilityName || 'Shirur PHC'}.`, 'system');

    return patient;
  };

  // Update vitals and triage
  const updatePatientVitalsAndTriage = (patientId: string, vitals: Vitals, riskLevel: RiskLevel, symptoms: string[]) => {
    const targetPatient = patients.find(p => p.id === patientId);

    // Persist vitals entry to IndexedDB
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
    }

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

    recordAudit('Triage Completed', 'Vitals', patientId, `Risk assessed as ${riskLevel.toUpperCase()}.`);
  };

  // Add Queue Entry
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

    setQueue(prev => [...prev, newEntry]);

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

    sendNotification('patient', 'Queue Token Allocated', `Your token is ${tokenNum}. Estimated wait: ${newEntry.estimatedWaitMinutes} mins.`, 'appointment', patientId);
    sendNotification('doctor', 'New Queue Arrival', `${patient?.name || 'Patient'} (#${tokenNum}) queued for consultation.`, 'appointment');
    recordAudit('Queue Token Issued', 'Queue', newEntry.id, `Token ${tokenNum} for ${patient?.name}.`);

    return newEntry;
  };

  // Update Queue Status
  const updateQueueStatus = (queueId: string, status: QueueEntry['status']) => {
    setQueue(prev =>
      prev.map(q => {
        if (q.id !== queueId) return q;
        return { ...q, status };
      })
    );

    const entry = queue.find(q => q.id === queueId);
    if (entry) {
      recordAudit('Queue Status Changed', 'Queue', queueId, `Changed status of token ${entry.tokenNumber} to ${status}.`);
      if (status === 'in_consultation') {
        sendNotification('patient', 'Now Calling Your Token', `Token ${entry.tokenNumber}: Please proceed into the Medical Officer's room.`, 'appointment', entry.patientId);
      } else if (status === 'completed') {
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

  // Create Referral
  const createReferral = (referralData: Omit<Referral, 'id' | 'createdAt' | 'updatedAt'>): Referral => {
    const refId = `REF-2026-MH-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRef: Referral = {
      ...referralData,
      id: refId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Persist referral draft in IndexedDB
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
    }

    setReferrals(prev => [newRef, ...prev]);

    // Update patient Care Continuity Score
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

    sendNotification('facility', 'New Incoming Referral', `Referral received for ${newRef.patientName} from ${newRef.fromFacilityName}.`, 'referral');
    sendNotification('patient', 'Referral Created', `Referral to ${newRef.toFacilityName} initiated. Awaiting facility scheduling.`, 'referral', newRef.patientId);
    recordAudit('Referral Created', 'Referral', refId, `Referred ${newRef.patientName} to ${newRef.toFacilityName}.`);

    return newRef;
  };

  // Update Referral Status
  const updateReferralStatus = (
    referralId: string,
    status: Referral['status'],
    details?: { appointmentDate?: string; appointmentTime?: string }
  ) => {
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
      }

      sendNotification('patient', 'Referral Update', `Your referral to ${ref.toFacilityName} is now ${status}.`, 'referral', ref.patientId);
      recordAudit('Referral Status Updated', 'Referral', referralId, `Status moved to ${status}.`);
    }
  };

  // Create Diagnostic Order
  const createDiagnosticOrder = (orderData: Omit<DiagnosticOrder, 'id' | 'requestedAt'>): DiagnosticOrder => {
    const diagId = `diag-${Date.now()}`;
    const newOrder: DiagnosticOrder = {
      ...orderData,
      id: diagId,
      requestedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };

    setDiagnostics(prev => [newOrder, ...prev]);

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

    sendNotification('patient', 'Diagnostic Test Ordered', `${newOrder.testType} has been ordered. Please visit the sample collection window.`, 'diagnostic', newOrder.patientId);
    recordAudit('Diagnostic Ordered', 'Diagnostic', diagId, `${newOrder.testType} ordered for ${newOrder.patientName}.`);

    return newOrder;
  };

  // Update Diagnostic Status
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

      sendNotification('doctor', 'Diagnostic Result Ready', `Results for ${order.testType} on patient ${order.patientName} are available.`, 'diagnostic');
      sendNotification('patient', 'Diagnostic Result Available', `Results for ${order.testType} have been attached to your health timeline.`, 'diagnostic', order.patientId);
      recordAudit('Diagnostic Status Updated', 'Diagnostic', diagId, `Result updated to ${status}.`);
    }
  };

  // Medicine Quantity update
  const updateMedicineQuantity = (medicineId: string, newQuantity: number) => {
    setMedicines(prev =>
      prev.map(m => {
        if (m.id !== medicineId) return m;
        const status: MedicineStock['status'] = newQuantity === 0 ? 'out_of_stock' : newQuantity < 30 ? 'low_stock' : 'available';
        return {
          ...m,
          availableQuantity: newQuantity,
          status,
          lastUpdated: 'Just now'
        };
      })
    );
    const med = medicines.find(m => m.id === medicineId);
    recordAudit('Pharmacy Inventory Adjusted', 'Medicine', medicineId, `Updated stock for ${med?.medicineName} to ${newQuantity}.`);
  };

  // Complete Follow-up
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
        title: `Community Follow-up Completed by ASHA`,
        notes: `ASHA Note: ${notes}. Patient checked at home in Village ${fup.patientVillage}.`,
        badgeType: 'success'
      };
      setTimelineEvents(prev => [timelineEvt, ...prev]);

      // Update patient care continuity score to 5/5!
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

  // Emergency Escalation
  const triggerEmergencyEscalation = (patientId: string, reason: string) => {
    const patient = patients.find(p => p.id === patientId);
    const timelineEvt: HealthTimelineEvent = {
      id: `evt-${Date.now()}`,
      patientId,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      facilityId: currentUser.facilityId || 'fac-phc-shirur',
      facilityName: currentUser.facilityName || 'Shirur PHC',
      providerName: currentUser.name,
      providerRole: currentUser.roleTitle,
      eventType: 'emergency_escalation',
      title: '🚨 CRITICAL EMERGENCY ESCALATION ACTIVATED',
      notes: `Immediate 108 ambulance dispatch and Senior Medical Officer alert triggered: "${reason}".`,
      badgeType: 'emergency'
    };
    setTimelineEvents(prev => [timelineEvt, ...prev]);

    sendNotification('all', '🚨 EMERGENCY ALERT', `Critical escalation for ${patient?.name || 'Patient'} (${patient?.village || 'PHC'}). Reason: ${reason}.`, 'emergency', patientId);
    recordAudit('EMERGENCY ESCALATION', 'Emergency', patientId, `Triggered emergency response for ${patient?.name}. Reason: ${reason}`);
  };

  const markNotificationRead = (notifId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notifId ? { ...n, read: true } : n))
    );
  };

  const resetAllData = () => {
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
  };

  // SIH Interactive Demo Scenario (17 sequential connected steps)
  const runDemoStep = (step: number) => {
    setDemoScenarioStep(step);
    switch (step) {
      case 1:
        // ASHA logs in and opens patient
        switchRole('asha');
        break;
      case 2:
        // Triage vitals recorded
        updatePatientVitalsAndTriage('pat-001', {
          temperature: 98.6,
          pulse: 92,
          systolicBp: 156,
          diastolicBp: 98,
          spo2: 96,
          respiratoryRate: 18,
          weight: 68
        }, 'urgent', ['Severe morning headache', 'Occasional blurry vision']);
        break;
      case 3:
        // Joined Queue
        addQueueEntry('pat-001');
        break;
      case 4:
        // Doctor opens patient
        switchRole('doctor');
        updateQueueStatus('q-003', 'in_consultation');
        break;
      case 5:
        // Doctor requests diagnostic
        createDiagnosticOrder({
          patientId: 'pat-001',
          patientName: 'Ramesh Patil',
          testType: 'Point-of-Care 12-Lead ECG & Renal Profile',
          facilityId: 'fac-phc-shirur',
          facilityName: 'Shirur PHC',
          requestingDoctor: 'Dr. Anand Kulkarni',
          status: 'sample_collected'
        });
        break;
      case 6:
        // Doctor creates referral
        createReferral({
          patientId: 'pat-001',
          patientName: 'Ramesh Patil',
          patientAge: 48,
          patientGender: 'Male',
          patientVillage: 'Shirur Rural',
          fromFacilityId: 'fac-phc-shirur',
          fromFacilityName: 'Shirur PHC',
          toFacilityId: 'fac-dh-pune',
          toFacilityName: 'Aundh District Hospital',
          referringDoctorName: 'Dr. Anand Kulkarni',
          reason: 'Stage 2 Hypertension with visual changes; ophthalmology and physician evaluation needed',
          priority: 'urgent',
          provisionalDiagnosis: 'Hypertensive Retinopathy Investigation',
          clinicalNotes: 'BP persistently above 150/95. ECG shows strain. Referred for tertiary fundoscopy and medication titration.',
          status: 'sent',
          transportAssisted: true,
          specialistRequired: 'Physician / Retinal Specialist'
        });
        break;
      case 7:
        // District Hospital accepts referral
        switchRole('facility');
        const ref = referrals[0];
        if (ref) {
          updateReferralStatus(ref.id, 'accepted');
        }
        break;
      case 8:
        // District Hospital schedules appointment slot
        const refSched = referrals[0];
        if (refSched) {
          updateReferralStatus(refSched.id, 'scheduled', {
            appointmentDate: '2026-09-24',
            appointmentTime: '11:30 AM'
          });
        }
        break;
      case 9:
        // Diagnostic result uploaded
        const diag = diagnostics[0];
        if (diag) {
          updateDiagnosticStatus(diag.id, 'result_available', 'Sinus tachycardia, LV strain verified. Fasting Glucose 142 mg/dL.', 'LV Strain pattern confirmed', true);
        }
        break;
      case 10:
        // Medicine stock verified
        updateMedicineQuantity('med-001', 410);
        break;
      case 11:
        // Patient views completed journey
        switchRole('patient');
        break;
      case 12:
        // ASHA completes village follow-up
        switchRole('asha');
        const fup = followUps[0];
        if (fup) {
          completeFollowUp(fup.id, 'Visited patient at home. Confirmed adherence to Amlodipine; accompanied him for District Hospital transport registration.');
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
        switchRole,
        language,
        setLanguage,
        t,
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

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
