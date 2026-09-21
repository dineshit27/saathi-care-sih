import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Activity,
  AlertTriangle,
  Share2,
  Calendar,
  Wifi,
  WifiOff,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Mic,
  Thermometer,
  Heart,
  FileText,
  CloudUpload,
  Database,
  Check,
  Layers,
  Plus
} from 'lucide-react';
import { useApp } from '../../services/store';
import { Patient, Vitals, RiskLevel } from '../../types';
import { runAiTriage, TriageAiResult } from '../../services/aiService';
import { SafetyBanner } from '../../components/common/SafetyBanner';
import { CareContinuityBar } from '../../components/common/CareContinuityBar';
import { TabId } from '../../components/layout/NavigationTabs';
import { offlineDB } from '../../offline/db';

interface Props {
  setActiveTab: (tab: TabId) => void;
  initialMode?: 'dashboard' | 'register' | 'triage';
}

export const FrontlineDashboard: React.FC<Props> = ({ setActiveTab, initialMode = 'dashboard' }) => {
  const {
    currentUser,
    patients,
    queue,
    referrals,
    followUps,
    offlineQueue,
    isOffline,
    setIsOffline,
    toggleOffline,
    syncOfflineQueue,
    isSyncing,
    lastSyncedAt,
    registerPatient,
    updatePatientVitalsAndTriage,
    addQueueEntry,
    t
  } = useApp();

  const [mode, setMode] = useState<'dashboard' | 'register' | 'triage'>(initialMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || 'pat-001');

  // Pending Sync state read directly from IndexedDB
  const [unsyncedSummary, setUnsyncedSummary] = useState<{
    total: number;
    pendingActions: number;
    unsyncedTriage: number;
    unsyncedReferrals: number;
  }>({
    total: 0,
    pendingActions: 0,
    unsyncedTriage: 0,
    unsyncedReferrals: 0
  });
  const [syncSuccessToast, setSyncSuccessToast] = useState(false);

  // Directly reads the number of unsynced records from IndexedDB
  const refreshIndexedDBCounter = async () => {
    try {
      const summary = await offlineDB.getUnsyncedSummary();
      const memQueueLen = offlineQueue.length;
      const effectiveTotal = Math.max(summary.total, memQueueLen);
      setUnsyncedSummary({
        total: effectiveTotal,
        pendingActions: Math.max(summary.pendingActions, memQueueLen),
        unsyncedTriage: summary.unsyncedTriage,
        unsyncedReferrals: summary.unsyncedReferrals
      });
    } catch (err) {
      console.warn('[FrontlineDashboard] Failed to read IndexedDB counter:', err);
      setUnsyncedSummary({
        total: offlineQueue.length,
        pendingActions: offlineQueue.length,
        unsyncedTriage: 0,
        unsyncedReferrals: 0
      });
    }
  };

  useEffect(() => {
    refreshIndexedDBCounter();

    // Poll periodically to catch background writes or actions
    const interval = setInterval(refreshIndexedDBCounter, 2500);

    const handleNetworkChange = () => {
      refreshIndexedDBCounter();
    };

    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);
    window.addEventListener('saathi:online-sync', handleNetworkChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
      window.removeEventListener('saathi:online-sync', handleNetworkChange);
    };
  }, [offlineQueue.length, isOffline, isSyncing, patients.length]);

  const handleSyncNow = async () => {
    if (isSyncing) return;
    try {
      await syncOfflineQueue();
      await refreshIndexedDBCounter();
      setSyncSuccessToast(true);
      setTimeout(() => setSyncSuccessToast(false), 4500);
    } catch (err) {
      console.error('[FrontlineDashboard] Sync error:', err);
    }
  };

  // New Patient Registration State
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: 32,
    gender: 'Female' as 'Female' | 'Male' | 'Other',
    phone: '+91 ',
    village: 'Shirur Rural',
    taluka: 'Shirur',
    preferredLanguage: 'mr' as 'en' | 'mr' | 'hi',
    emergencyContact: {
      name: '',
      relationship: 'Spouse',
      phone: '+91 '
    },
    existingConditions: [] as string[],
    currentSymptoms: [] as string[],
    consent: true
  });

  // Digital Triage State
  const [triageVitals, setTriageVitals] = useState<Vitals>({
    temperature: 98.6,
    pulse: 78,
    systolicBp: 130,
    diastolicBp: 84,
    spo2: 98,
    respiratoryRate: 18,
    weight: 58
  });
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['Headache', 'Mild fever']);
  const [customSymptom, setCustomSymptom] = useState('');
  const [triageLoading, setTriageLoading] = useState(false);
  const [aiResult, setAiResult] = useState<TriageAiResult | null>(null);
  const [triageCompleted, setTriageCompleted] = useState(false);

  // Common rural symptom tags
  const commonSymptoms = [
    'Fever (ताप)',
    'Cough (खोकला)',
    'Severe Headache (डोकेदुखी)',
    'Chest Tightness (छातीत दुखणे)',
    'Shortness of breath (दम लागणे)',
    'Abdominal Pain (पोटदुखी)',
    'Dizziness (चक्कर येणे)',
    'Vomiting / Diarrhea (उलटी/जुलाब)',
    'High Blood Pressure (उच्च रक्तदाब)',
    'Pregnancy Swelling (पायावर सूज)'
  ];

  const commonConditions = [
    'Hypertension',
    'Diabetes Mellitus',
    'Asthma / COPD',
    'Pregnancy (ANC)',
    'Anemia',
    'Heart Disease',
    'Tuberculosis history'
  ];

  // Workload calculations
  const pendingTriageCount = patients.filter(p => !p.vitals).length;
  const highRiskCount = patients.filter(p => p.riskLevel === 'urgent' || p.riskLevel === 'emergency').length;
  const pendingReferralsCount = referrals.filter(r => r.status === 'sent' || r.status === 'created').length;
  const dueFollowUpsCount = followUps.filter(f => f.status === 'due').length;

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone.includes(searchQuery) ||
    p.abhaId.includes(searchQuery) ||
    p.village.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activePatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  // Helper to add a sample offline triage/registration for demonstration
  const handleAddSampleOfflineRecord = async () => {
    try {
      await offlineDB.saveVitalsEntry({
        patientId: activePatient?.id || 'pat-001',
        patientName: activePatient?.name || 'Ramesh Patil',
        vitals: {
          temperature: 99.4,
          pulse: 88,
          systolicBp: 142,
          diastolicBp: 92,
          spo2: 96,
          respiratoryRate: 20
        },
        riskLevel: 'urgent',
        symptoms: ['Fever', 'Fatigue (अशक्तपणा)'],
        recordedAt: new Date().toISOString(),
        recordedByRole: currentUser.roleTitle,
        recordedByName: currentUser.name,
        synced: false
      });
      await offlineDB.enqueueOfflineAction('record_vitals', {
        patientId: activePatient?.id || 'pat-001',
        riskLevel: 'urgent',
        note: 'Offline field triage recorded in hamlet'
      });
      await refreshIndexedDBCounter();
    } catch (err) {
      console.warn('[FrontlineDashboard] Sample record error:', err);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.name.trim()) return;

    const registered = registerPatient({
      abhaId: `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      name: newPatient.name,
      age: Number(newPatient.age),
      gender: newPatient.gender,
      phone: newPatient.phone,
      village: newPatient.village,
      taluka: newPatient.taluka,
      preferredLanguage: newPatient.preferredLanguage,
      emergencyContact: newPatient.emergencyContact,
      existingConditions: newPatient.existingConditions,
      currentSymptoms: newPatient.currentSymptoms,
      riskLevel: 'routine',
      consent: {
        status: newPatient.consent,
        timestamp: new Date().toISOString(),
        version: 'MH-PHC-CONSENT-2026.1'
      },
      registeredByRole: 'asha',
      assignedAsha: currentUser.name
    });

    setSelectedPatientId(registered.id);
    setMode('triage');
  };

  const handleRunAiTriage = async () => {
    setTriageLoading(true);
    try {
      const allSymptoms = [...selectedSymptoms];
      if (customSymptom.trim()) allSymptoms.push(customSymptom.trim());

      const res = await runAiTriage(allSymptoms, triageVitals, activePatient);
      setAiResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setTriageLoading(false);
    }
  };

  const handleConfirmTriage = () => {
    if (!aiResult) return;
    const allSymptoms = [...selectedSymptoms];
    if (customSymptom.trim()) allSymptoms.push(customSymptom.trim());

    updatePatientVitalsAndTriage(activePatient.id, triageVitals, aiResult.riskLevel, allSymptoms);
    // Queue patient
    addQueueEntry(activePatient.id);

    setTriageCompleted(true);
    setTimeout(() => {
      setTriageCompleted(false);
      setMode('dashboard');
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner & Header */}
      <div className="bg-white border-2 border-stone-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full">
              Frontline Health Command
            </span>
            <span className="text-xs text-stone-500">
              ASHA Circle: Shirur Rural (14 Hamlets)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 mt-2">
            Namaste, {currentUser.name}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
            Prioritizing community members requiring digital triage and continuity follow-up today
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="frontline-register-nav-btn"
            onClick={() => setMode('register')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'register'
                ? 'bg-amber-400 text-stone-950'
                : 'bg-[#164E43] hover:bg-[#123e35] text-white'
            }`}
          >
            <UserPlus className="w-4 h-4 text-amber-300" />
            <span>+ Register Patient</span>
          </button>

          <button
            id="frontline-triage-nav-btn"
            onClick={() => setMode('triage')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black border transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'triage'
                ? 'bg-amber-400 text-stone-950 border-amber-500'
                : 'bg-white hover:bg-stone-100 text-stone-800 border-stone-300'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-700" />
            <span>Digital Triage</span>
          </button>

          {/* Visual 'Pending Sync' Counter Button in Header */}
          <button
            id="frontline-header-sync-btn"
            onClick={handleSyncNow}
            disabled={isSyncing || (unsyncedSummary.total === 0 && !isOffline)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-black border transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
              unsyncedSummary.total > 0
                ? !isOffline
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 ring-2 ring-emerald-400/40'
                  : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-400'
                : 'bg-stone-100 text-stone-600 border-stone-300'
            }`}
            title={
              unsyncedSummary.total > 0
                ? `Push ${unsyncedSummary.total} record(s) from IndexedDB to PHC Cloud`
                : 'All local IndexedDB records are in sync'
            }
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-300' : ''}`} />
            <span className="flex items-center gap-1.5">
              <span>Pending Sync:</span>
              <span
                id="frontline-header-sync-count"
                className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  unsyncedSummary.total > 0
                    ? !isOffline
                      ? 'bg-amber-400 text-stone-950'
                      : 'bg-amber-400 text-stone-950'
                    : 'bg-stone-200 text-stone-700'
                }`}
              >
                {unsyncedSummary.total}
              </span>
            </span>
            {unsyncedSummary.total > 0 && !isOffline && (
              <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-mono tracking-tight uppercase">
                {isSyncing ? 'Pushing...' : 'Sync Now'}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Dedicated Visual 'Pending Sync' & Connectivity Banner */}
      <div
        id="frontline-pending-sync-banner"
        className={`p-5 rounded-3xl border-2 transition-all shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          syncSuccessToast
            ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
            : unsyncedSummary.total > 0 && !isOffline
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 ring-2 ring-emerald-500/20'
            : unsyncedSummary.total > 0
            ? 'bg-amber-50 border-amber-300 text-amber-950'
            : 'bg-stone-50 border-stone-200 text-stone-800'
        }`}
      >
        <div className="flex items-start sm:items-center gap-4">
          {/* Visual Pending Sync Counter Box */}
          <div
            id="frontline-sync-counter-box"
            className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 border shadow-xs transition-transform ${
              syncSuccessToast
                ? 'bg-emerald-600 text-white border-emerald-700'
                : unsyncedSummary.total > 0 && !isOffline
                ? 'bg-[#164E43] text-white border-emerald-800 scale-105'
                : unsyncedSummary.total > 0
                ? 'bg-amber-400 text-stone-950 border-amber-500'
                : 'bg-white text-stone-700 border-stone-300'
            }`}
          >
            {syncSuccessToast ? (
              <CheckCircle2 className="w-8 h-8 text-white" />
            ) : (
              <>
                <span id="frontline-unsynced-total-display" className="text-2xl font-black leading-none">
                  {unsyncedSummary.total}
                </span>
                <span className="text-[9px] font-black uppercase tracking-tight mt-1 opacity-90">
                  {unsyncedSummary.total === 1 ? 'Record' : 'Pending'}
                </span>
              </>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1.5 bg-white border border-stone-200 shadow-2xs">
                {!isOffline ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-emerald-800">Connection Restored (Online)</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span className="text-amber-800">Offline Field Mode (IndexedDB)</span>
                  </>
                )}
              </span>

              {lastSyncedAt && (
                <span className="text-[11px] text-stone-600 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-stone-400" />
                  <span>Last Cloud Push: <strong>{lastSyncedAt}</strong></span>
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-black text-stone-900 mt-1.5">
              {syncSuccessToast
                ? 'All IndexedDB Records Successfully Synced with PHC Cloud'
                : !isOffline && unsyncedSummary.total > 0
                ? `${unsyncedSummary.total} Pending Record(s) in IndexedDB Ready to Push`
                : unsyncedSummary.total > 0
                ? `${unsyncedSummary.total} Record(s) Safely Preserved in Device IndexedDB`
                : 'IndexedDB Fully Synchronized with Shirur PHC Cloud'}
            </h3>

            <p className="text-xs text-stone-600 mt-0.5 max-w-2xl">
              {syncSuccessToast
                ? 'Patient registrations, vitals triage, and referral drafts have been committed to the district cloud repository and physician queues.'
                : !isOffline && unsyncedSummary.total > 0
                ? 'Active network connectivity re-established. Push all local records now so the medical officer can review prioritized clinical triage.'
                : unsyncedSummary.total > 0
                ? 'Field registrations and vitals remain safely stored in browser IndexedDB even if the device restarts or loses cellular signal.'
                : 'Zero unsynced mutations pending on this frontline tablet. Local cache matches the central health repository.'}
            </p>

            {/* Breakdown chips from IndexedDB */}
            {unsyncedSummary.total > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <span className="text-[11px] bg-white/90 border border-stone-200 text-stone-800 px-2.5 py-0.5 rounded-lg font-semibold flex items-center gap-1">
                  <Database className="w-3 h-3 text-stone-500" />
                  <span>Queue Actions:</span>
                  <strong className="text-emerald-800">{unsyncedSummary.pendingActions}</strong>
                </span>
                <span className="text-[11px] bg-white/90 border border-stone-200 text-stone-800 px-2.5 py-0.5 rounded-lg font-semibold flex items-center gap-1">
                  <Activity className="w-3 h-3 text-stone-500" />
                  <span>Vitals/Triage:</span>
                  <strong className="text-amber-800">{unsyncedSummary.unsyncedTriage}</strong>
                </span>
                <span className="text-[11px] bg-white/90 border border-stone-200 text-stone-800 px-2.5 py-0.5 rounded-lg font-semibold flex items-center gap-1">
                  <FileText className="w-3 h-3 text-stone-500" />
                  <span>Referral Drafts:</span>
                  <strong className="text-teal-800">{unsyncedSummary.unsyncedReferrals}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Sync Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
          {/* Quick toggle to simulate reconnection */}
          {isOffline && (
            <button
              id="frontline-toggle-online-btn"
              onClick={toggleOffline}
              className="px-3 py-2.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Toggle network connectivity to simulate connection restored"
            >
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              <span>Simulate Reconnection</span>
            </button>
          )}

          {/* Test button to quickly queue an offline record to verify counter */}
          <button
            id="frontline-add-sample-offline-btn"
            onClick={handleAddSampleOfflineRecord}
            className="px-3 py-2.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
            title="Create a test triage record in IndexedDB"
          >
            <Plus className="w-3.5 h-3.5 text-stone-500" />
            <span>+ Queue Test Vitals</span>
          </button>

          {/* Primary 'Sync Now' Button */}
          <button
            id="frontline-sync-now-btn"
            onClick={handleSyncNow}
            disabled={isSyncing || unsyncedSummary.total === 0}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
              unsyncedSummary.total > 0
                ? 'bg-[#164E43] hover:bg-[#123e35] text-white'
                : 'bg-stone-200 text-stone-500 cursor-not-allowed'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Pushing Data to Cloud...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>

      {/* Mode Switch View: 1. Dashboard Workload */}
      {mode === 'dashboard' && (
        <>
          {/* Workload Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-[11px] font-bold text-stone-500 block">Registered Patients</span>
              <p className="text-2xl font-black text-[#164E43] mt-1">{patients.length}</p>
              <p className="text-[10px] text-stone-500 mt-0.5">In village circle</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-[11px] font-bold text-amber-800 block">Awaiting Triage</span>
              <p className="text-2xl font-black text-amber-600 mt-1">{pendingTriageCount}</p>
              <p className="text-[10px] text-stone-500 mt-0.5">Vitals pending</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-[11px] font-bold text-red-800 block">High-Risk Cases</span>
              <p className="text-2xl font-black text-red-600 mt-1">{highRiskCount}</p>
              <p className="text-[10px] text-stone-500 mt-0.5">Urgent &amp; Maternal</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-[11px] font-bold text-teal-800 block">Pending Referrals</span>
              <p className="text-2xl font-black text-teal-700 mt-1">{pendingReferralsCount}</p>
              <p className="text-[10px] text-stone-500 mt-0.5">Tracking slots</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-[11px] font-bold text-emerald-800 block">Follow-ups Due</span>
              <p className="text-2xl font-black text-emerald-700 mt-1">{dueFollowUpsCount}</p>
              <p className="text-[10px] text-stone-500 mt-0.5">Home visits today</p>
            </div>

            {/* Visual 'Pending Sync' Counter Metric Card */}
            <div
              id="frontline-metric-pending-sync-card"
              onClick={() => {
                if (unsyncedSummary.total > 0) {
                  handleSyncNow();
                }
              }}
              className={`p-4 rounded-2xl border transition-all shadow-2xs ${
                unsyncedSummary.total > 0
                  ? !isOffline
                    ? 'bg-emerald-50/70 border-emerald-300 hover:border-emerald-500 cursor-pointer'
                    : 'bg-amber-50/70 border-amber-300 hover:border-amber-500 cursor-pointer'
                  : 'bg-white border-stone-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold block ${
                  unsyncedSummary.total > 0
                    ? !isOffline ? 'text-emerald-900' : 'text-amber-900'
                    : 'text-stone-500'
                }`}>
                  Pending Sync
                </span>
                {unsyncedSummary.total > 0 && (
                  <span className={`w-2 h-2 rounded-full ${!isOffline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                )}
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <p
                  id="frontline-metric-sync-count"
                  className={`text-2xl font-black ${
                    unsyncedSummary.total > 0
                      ? !isOffline ? 'text-emerald-700' : 'text-amber-700'
                      : 'text-stone-700'
                  }`}
                >
                  {unsyncedSummary.total}
                </p>
                {unsyncedSummary.total > 0 && !isOffline && (
                  <span className="text-[10px] font-bold bg-emerald-600 text-white px-1.5 py-0.2 rounded uppercase">
                    Sync
                  </span>
                )}
              </div>
              <p className="text-[10px] text-stone-500 mt-0.5">
                {unsyncedSummary.total > 0
                  ? !isOffline
                    ? 'Ready to push to PHC'
                    : 'Saved in IndexedDB'
                  : 'All records synced'}
              </p>
            </div>
          </div>

          {/* Patient Directory & Search */}
          <div className="bg-white border-2 border-stone-200 rounded-3xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-bold text-stone-900">
                  Village Patient Directory ({filteredPatients.length})
                </h2>
                <p className="text-xs text-stone-500">
                  Search by ABHA ID, name, mobile number, or hamlet
                </p>
              </div>

              <div className="relative max-w-sm w-full">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search Ramesh, 98234, Pabal, ABHA..."
                  className="w-full text-xs pl-9 pr-4 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-bold uppercase text-[10px]">
                    <th className="p-3">Patient Name / ABHA</th>
                    <th className="p-3">Age / Gender</th>
                    <th className="p-3">Village / Phone</th>
                    <th className="p-3">Risk Level</th>
                    <th className="p-3">Continuity Score</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredPatients.map(p => (
                    <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                      <td className="p-3">
                        <span className="font-bold text-stone-900 block text-sm">{p.name}</span>
                        <span className="text-[11px] font-mono text-stone-500">{p.abhaId}</span>
                      </td>
                      <td className="p-3 text-stone-700">
                        {p.age} yrs • {p.gender}
                      </td>
                      <td className="p-3 text-stone-700">
                        <span className="font-semibold block">{p.village}</span>
                        <span className="text-[11px] text-stone-500">{p.phone}</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.riskLevel === 'emergency'
                            ? 'bg-red-100 text-red-900 border border-red-300'
                            : p.riskLevel === 'urgent'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}>
                          {p.riskLevel}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-stone-900">
                            {p.careContinuityScore.completedSteps}/5
                          </span>
                          <div className="w-16 bg-stone-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-[#164E43] h-full rounded-full"
                              style={{ width: `${(p.careContinuityScore.completedSteps / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-right space-x-1.5">
                        <button
                          onClick={() => {
                            setSelectedPatientId(p.id);
                            setMode('triage');
                          }}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Triage &amp; Vitals
                        </button>
                        <button
                          onClick={() => {
                            addQueueEntry(p.id);
                            alert(`Token generated for ${p.name}!`);
                          }}
                          className="px-2.5 py-1.5 bg-[#164E43] hover:bg-[#123e35] text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Queue Token
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Mode Switch View: 2. Register Patient */}
      {mode === 'register' && (
        <div className="bg-white border-2 border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs max-w-3xl mx-auto">
          <div className="flex items-center justify-between border-b pb-4 mb-6">
            <div>
              <span className="text-xs font-bold uppercase bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                Frontline Enrollment
              </span>
              <h2 className="text-xl font-black text-stone-900 mt-1">
                New Citizen Registration &amp; Consent
              </h2>
              <p className="text-xs text-stone-500">
                Captures demographic, linguistic, emergency, and digital consent records for continuity of care
              </p>
            </div>
            <button
              onClick={() => setMode('dashboard')}
              className="text-xs text-stone-500 hover:text-stone-800 font-bold underline"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase mb-1">
                  Full Name (रुग्णाचे नाव) *
                </label>
                <input
                  type="text"
                  required
                  value={newPatient.name}
                  onChange={e => setNewPatient({ ...newPatient, name: e.target.value })}
                  placeholder="e.g. Ramesh Baburao Patil"
                  className="w-full text-xs p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-800 uppercase mb-1">
                    Age (वय) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={120}
                    value={newPatient.age}
                    onChange={e => setNewPatient({ ...newPatient, age: Number(e.target.value) })}
                    className="w-full text-xs p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 uppercase mb-1">
                    Gender (लिंग) *
                  </label>
                  <select
                    value={newPatient.gender}
                    onChange={e => setNewPatient({ ...newPatient, gender: e.target.value as any })}
                    className="w-full text-xs p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
                  >
                    <option value="Female">Female (स्त्री)</option>
                    <option value="Male">Male (पुरुष)</option>
                    <option value="Other">Other (इतर)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase mb-1">
                  Mobile Number (मोबाईल क्र.) *
                </label>
                <input
                  type="tel"
                  required
                  value={newPatient.phone}
                  onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })}
                  placeholder="+91 98234 56789"
                  className="w-full text-xs p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase mb-1">
                  Village / Wasti (गाव/पाडा) *
                </label>
                <input
                  type="text"
                  required
                  value={newPatient.village}
                  onChange={e => setNewPatient({ ...newPatient, village: e.target.value })}
                  placeholder="e.g. Shirur Rural, Pabal, Nimgaon"
                  className="w-full text-xs p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase mb-1">
                  Preferred Language (भाषा)
                </label>
                <select
                  value={newPatient.preferredLanguage}
                  onChange={e => setNewPatient({ ...newPatient, preferredLanguage: e.target.value as any })}
                  className="w-full text-xs p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
                >
                  <option value="mr">मराठी (Marathi)</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase mb-1">
                  Emergency Contact Name &amp; Relation
                </label>
                <input
                  type="text"
                  value={newPatient.emergencyContact.name}
                  onChange={e => setNewPatient({
                    ...newPatient,
                    emergencyContact: { ...newPatient.emergencyContact, name: e.target.value }
                  })}
                  placeholder="e.g. Sharda Patil (Spouse)"
                  className="w-full text-xs p-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Known Conditions checkboxes */}
            <div>
              <label className="block text-xs font-bold text-stone-800 uppercase mb-1.5">
                Existing Conditions (पूर्व आजार)
              </label>
              <div className="flex flex-wrap gap-2">
                {commonConditions.map(cond => {
                  const selected = newPatient.existingConditions.includes(cond);
                  return (
                    <button
                      type="button"
                      key={cond}
                      onClick={() => {
                        if (selected) {
                          setNewPatient({
                            ...newPatient,
                            existingConditions: newPatient.existingConditions.filter(c => c !== cond)
                          });
                        } else {
                          setNewPatient({
                            ...newPatient,
                            existingConditions: [...newPatient.existingConditions, cond]
                          });
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        selected
                          ? 'bg-[#164E43] text-white border-emerald-900'
                          : 'bg-stone-50 border-stone-300 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {cond}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Informed Consent Requirement (Section 29) */}
            <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={newPatient.consent}
                  onChange={e => setNewPatient({ ...newPatient, consent: e.target.checked })}
                  className="mt-1 w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600"
                />
                <div className="text-xs text-stone-700">
                  <span className="font-bold text-emerald-950 block">
                    Patient Informed Consent (रुग्ण संमती)
                  </span>
                  I confirm that the patient has been informed in simple spoken language that their demographic and clinical vitals are being recorded in the public health system to support care continuity between ASHA, PHC Medical Officer, and referral facilities.
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setMode('dashboard')}
                className="px-4 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-[#164E43] hover:bg-[#123e35] text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
              >
                <span>Save Patient &amp; Proceed to Digital Triage</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Mode Switch View: 3. Assisted Digital Triage */}
      {mode === 'triage' && (
        <div className="bg-white border-2 border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs max-w-4xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                  Assisted Digital Triage
                </span>
                <span className="text-xs text-stone-500">
                  Patient: <strong className="text-stone-900">{activePatient.name}</strong> ({activePatient.age}y/{activePatient.gender}, {activePatient.village})
                </span>
              </div>
              <h2 className="text-xl font-black text-stone-900 mt-1">
                Triage Protocol &amp; Risk Stratification
              </h2>
            </div>

            <button
              onClick={() => setMode('dashboard')}
              className="text-xs text-stone-500 hover:text-stone-800 font-bold underline"
            >
              Back to Dashboard
            </button>
          </div>

          <CareContinuityBar
            completedSteps={2}
            totalSteps={5}
            lastMilestone="Digital Triage in Progress"
            patientName={activePatient.name}
          />

          {/* Step 1: Symptoms Selection */}
          <div className="bg-[#FAF9F6] border border-stone-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#164E43] text-white text-[11px] flex items-center justify-center">1</span>
                <span>Reported Symptoms (लक्षणे)</span>
              </h3>
              <button
                type="button"
                onClick={() => alert('Voice input module ready: Frontline worker audio transcription active.')}
                className="text-xs flex items-center gap-1 text-emerald-800 font-bold bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-lg hover:bg-emerald-100"
              >
                <Mic className="w-3.5 h-3.5 text-emerald-700" />
                <span>Voice Input (मराठी/हिंदी)</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {commonSymptoms.map(sym => {
                const isSelected = selectedSymptoms.includes(sym);
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedSymptoms(selectedSymptoms.filter(s => s !== sym));
                      } else {
                        setSelectedSymptoms([...selectedSymptoms, sym]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      isSelected
                        ? 'bg-[#164E43] text-white border-emerald-950 shadow-2xs'
                        : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {sym}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              value={customSymptom}
              onChange={e => setCustomSymptom(e.target.value)}
              placeholder="Add other specific complaints or observations..."
              className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          {/* Step 2: Vitals Recording */}
          <div className="bg-[#FAF9F6] border border-stone-200 rounded-2xl p-5">
            <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2 mb-4">
              <span className="w-5 h-5 rounded-full bg-[#164E43] text-white text-[11px] flex items-center justify-center">2</span>
              <span>Physiological Vitals (शारीरिक मापे)</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  BP Systolic (mmHg)
                </label>
                <input
                  type="number"
                  value={triageVitals.systolicBp || ''}
                  onChange={e => setTriageVitals({ ...triageVitals, systolicBp: Number(e.target.value) })}
                  className="w-full text-sm font-mono font-bold p-2.5 bg-white border border-stone-300 rounded-xl"
                  placeholder="120"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  BP Diastolic (mmHg)
                </label>
                <input
                  type="number"
                  value={triageVitals.diastolicBp || ''}
                  onChange={e => setTriageVitals({ ...triageVitals, diastolicBp: Number(e.target.value) })}
                  className="w-full text-sm font-mono font-bold p-2.5 bg-white border border-stone-300 rounded-xl"
                  placeholder="80"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  SpO2 (%)
                </label>
                <input
                  type="number"
                  value={triageVitals.spo2 || ''}
                  onChange={e => setTriageVitals({ ...triageVitals, spo2: Number(e.target.value) })}
                  className="w-full text-sm font-mono font-bold p-2.5 bg-white border border-stone-300 rounded-xl"
                  placeholder="98"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  Pulse (bpm)
                </label>
                <input
                  type="number"
                  value={triageVitals.pulse || ''}
                  onChange={e => setTriageVitals({ ...triageVitals, pulse: Number(e.target.value) })}
                  className="w-full text-sm font-mono font-bold p-2.5 bg-white border border-stone-300 rounded-xl"
                  placeholder="76"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  Temp (°F)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={triageVitals.temperature || ''}
                  onChange={e => setTriageVitals({ ...triageVitals, temperature: Number(e.target.value) })}
                  className="w-full text-sm font-mono font-bold p-2.5 bg-white border border-stone-300 rounded-xl"
                  placeholder="98.6"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={triageVitals.weight || ''}
                  onChange={e => setTriageVitals({ ...triageVitals, weight: Number(e.target.value) })}
                  className="w-full text-sm font-mono font-bold p-2.5 bg-white border border-stone-300 rounded-xl"
                  placeholder="60"
                />
              </div>
            </div>
          </div>

          {/* Step 3: Trigger Saathi AI Decision Support */}
          <div className="bg-amber-50/70 border-2 border-amber-300 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[11px] flex items-center justify-center">3</span>
                  <span>Saathi AI Triage &amp; Risk Flagging</span>
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  Server-side Gemini analysis with deterministic public health fallback
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunAiTriage}
                disabled={triageLoading}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#164E43]" />
                <span>{triageLoading ? 'Evaluating Vitals...' : 'Run Saathi AI Triage'}</span>
              </button>
            </div>

            {aiResult ? (
              <div className="space-y-4 animate-in fade-in">
                <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  aiResult.riskLevel === 'emergency'
                    ? 'bg-red-100 border-red-300 text-red-950'
                    : aiResult.riskLevel === 'urgent'
                    ? 'bg-amber-100 border-amber-300 text-amber-950'
                    : 'bg-emerald-100 border-emerald-300 text-emerald-950'
                }`}>
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                      Risk Stratification Output
                    </span>
                    <h4 className="text-lg font-black uppercase">
                      Category: {aiResult.riskLevel}
                    </h4>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 bg-white/70 rounded-lg">
                    {aiResult.riskLevel === 'emergency' ? '🚨 Immediate 108 Dispatch Required' : 'Priority PHC Queue'}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-stone-200 text-xs space-y-2">
                  <p><strong>Clinical Summary:</strong> {aiResult.summary}</p>
                  <p><strong>Risk Factors:</strong> {aiResult.riskFactors.join(' • ')}</p>
                  <p><strong>Recommended Protocol:</strong> {aiResult.suggestedNextStep}</p>
                  <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-600">
                    <strong>Suggested Doctor Questions:</strong>
                    <ul className="list-disc pl-4 mt-1 space-y-0.5">
                      {aiResult.questionsForClinician.map((q, idx) => (
                        <li key={idx}>{q}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <SafetyBanner compact />

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleConfirmTriage}
                    className="px-6 py-2.5 bg-[#164E43] hover:bg-[#123e35] text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>{triageCompleted ? 'Triage Saved!' : 'Confirm Triage & Issue Queue Token'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-500 italic">
                Click &ldquo;Run Saathi AI Triage&rdquo; to analyze captured vitals and symptoms.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
