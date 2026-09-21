import React, { useState } from 'react';
import {
  Stethoscope,
  Users,
  Activity,
  Share2,
  FileSearch,
  Pill,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldAlert,
  Building2,
  FileText,
  Calendar
} from 'lucide-react';
import { useApp } from '../../services/store';
import { CareContinuityBar } from '../../components/common/CareContinuityBar';
import { SafetyBanner } from '../../components/common/SafetyBanner';
import { generateReferralSummary } from '../../services/aiService';
import { TabId } from '../../components/layout/NavigationTabs';

interface Props {
  setActiveTab: (tab: TabId) => void;
}

export const DoctorConsultationDesk: React.FC<Props> = ({ setActiveTab }) => {
  const {
    currentUser,
    patients,
    queue,
    facilities,
    timelineEvents,
    medicines,
    createReferral,
    createDiagnosticOrder,
    updateQueueStatus,
    updateMedicineQuantity,
    t
  } = useApp();

  // Pick first waiting patient or currently active in queue
  const currentQueueItem = queue.find(q => q.status === 'in_consultation') || queue.find(q => q.status === 'waiting') || queue[0];
  const [selectedPatientId, setSelectedPatientId] = useState<string>(currentQueueItem?.patientId || patients[0]?.id || 'pat-001');

  const activePatient = patients.find(p => p.id === selectedPatientId) || patients[0];
  const patientEvents = timelineEvents.filter(e => e.patientId === activePatient.id);

  // Consultation Notes State
  const [clinicalNotes, setClinicalNotes] = useState('Patient presents with 3-day history of throbbing occipital headache, blurred visual episodes, and elevated blood pressure. Vitals confirmed Stage 2 hypertension. Fundus examination recommended.');
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState('Essential Hypertension (Stage 2) with Hypertensive Retinopathy Suspicion');
  const [prescribedMedicineId, setPrescribedMedicineId] = useState('med-001');
  const [prescriptionDosage, setPrescriptionDosage] = useState('5mg OD Morning x 30 Days');
  const [orderedDiagnostic, setOrderedDiagnostic] = useState('Point-of-Care 12-Lead ECG & Renal Profile');

  // Referral State
  const [referralTargetFacilityId, setReferralTargetFacilityId] = useState('fac-dh-pune');
  const [referralPriority, setReferralPriority] = useState<'emergency' | 'urgent' | 'routine'>('urgent');
  const [specialistRequired, setSpecialistRequired] = useState('Cardiology / Internal Medicine');
  const [referralReason, setReferralReason] = useState('Evaluation of hypertensive organ strain and ophthalmology retinal fundoscopy.');
  const [transportAssisted, setTransportAssisted] = useState(true);

  // AI Referral Summary State
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState<string>('');
  const [referralCreatedSuccess, setReferralCreatedSuccess] = useState<string | null>(null);

  const targetFacility = facilities.find(f => f.id === referralTargetFacilityId) || facilities[1];
  const selectedMed = medicines.find(m => m.id === prescribedMedicineId) || medicines[0];

  const handleGenerateAiSummary = async () => {
    setAiSummaryLoading(true);
    try {
      const summaryObj = await generateReferralSummary({
        patient: activePatient,
        clinicalNotes: `${clinicalNotes}. Provisional: ${provisionalDiagnosis}`,
        fromFacility: { name: currentUser.facilityName || 'Shirur Primary Health Centre' },
        toFacility: { name: targetFacility.name },
        reason: referralReason,
        provisionalDiagnosis: provisionalDiagnosis || 'Specialist Evaluation'
      });
      setGeneratedSummary(
        `${summaryObj.handoffSummary}\n\nKey Investigations Needed: ${summaryObj.keyInvestigationsNeeded.join(', ')}\n\nContinuity Alert: ${summaryObj.continuityAlert}`
      );
    } catch (err) {
      console.error(err);
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const handleCreateReferral = () => {
    const newRef = createReferral({
      patientId: activePatient.id,
      patientName: activePatient.name,
      patientAge: activePatient.age,
      patientGender: activePatient.gender,
      patientVillage: activePatient.village,
      fromFacilityId: currentUser.facilityId || 'fac-phc-shirur',
      fromFacilityName: currentUser.facilityName || 'Shirur Primary Health Centre',
      toFacilityId: targetFacility.id,
      toFacilityName: targetFacility.name,
      referringDoctorName: currentUser.name,
      reason: referralReason,
      priority: referralPriority,
      provisionalDiagnosis,
      clinicalNotes: generatedSummary || clinicalNotes,
      status: 'sent',
      transportAssisted,
      specialistRequired
    });

    setReferralCreatedSuccess(newRef.id);
  };

  const handleOrderDiagnostic = () => {
    createDiagnosticOrder({
      patientId: activePatient.id,
      patientName: activePatient.name,
      testType: orderedDiagnostic,
      facilityId: currentUser.facilityId || 'fac-phc-shirur',
      facilityName: currentUser.facilityName || 'Shirur PHC',
      requestingDoctor: currentUser.name,
      status: 'sample_collected'
    });
    alert(`Diagnostic Test "${orderedDiagnostic}" ordered. Sample collection token dispatched to laboratory.`);
  };

  const handleCompleteConsultation = () => {
    if (currentQueueItem) {
      updateQueueStatus(currentQueueItem.id, 'completed');
    }
    // Dispense medicine from stock
    if (selectedMed.availableQuantity > 0) {
      updateMedicineQuantity(selectedMed.id, Math.max(0, selectedMed.availableQuantity - 30));
    }
    alert(`Consultation for ${activePatient.name} marked complete. Next patient ready!`);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Patient Header & Active Queue Bar */}
      <div className="bg-white border-2 border-stone-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full">
              OPD Consultation Room • {currentUser.facilityName || 'Shirur PHC'}
            </span>
            <span className="text-xs font-mono text-stone-500">
              ABHA: {activePatient.abhaId}
            </span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 mt-1.5 flex items-center gap-3">
            <span>{activePatient.name}</span>
            <span className="text-xs font-semibold px-2.5 py-1 bg-stone-100 rounded-lg text-stone-700">
              {activePatient.age}y / {activePatient.gender}
            </span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg uppercase ${
              activePatient.riskLevel === 'urgent' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
            }`}>
              {activePatient.riskLevel} Risk
            </span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Village: <strong>{activePatient.village}</strong> • Mobile: <strong>{activePatient.phone}</strong> • Frontline ASHA: <strong>{activePatient.assignedAsha}</strong>
          </p>
        </div>

        {/* Patient Switcher for Clinical Demo */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-stone-500 uppercase">Switch Patient:</label>
          <select
            value={selectedPatientId}
            onChange={e => setSelectedPatientId(e.target.value)}
            className="text-xs font-bold p-2 bg-[#FAF9F6] border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            {patients.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.village})
              </option>
            ))}
          </select>
        </div>
      </div>

      <CareContinuityBar
        completedSteps={activePatient.careContinuityScore.completedSteps}
        totalSteps={activePatient.careContinuityScore.totalSteps}
        lastMilestone={activePatient.careContinuityScore.lastMilestone}
        patientName={activePatient.name}
      />

      {/* 3-Column Clinical Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Longitudinal Timeline & Vitals (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Vitals Summary Card */}
          <div className="bg-white border-2 border-stone-200 rounded-3xl p-5 shadow-xs">
            <h2 className="font-extrabold text-xs uppercase tracking-wider text-stone-500 mb-3 flex items-center justify-between">
              <span>Frontline Triage Vitals</span>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                ASHA Recorded
              </span>
            </h2>

            {activePatient.vitals ? (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-500 font-bold block">Blood Pressure</span>
                  <span className="text-base font-mono font-black text-stone-900">
                    {activePatient.vitals.systolicBp}/{activePatient.vitals.diastolicBp}
                  </span>
                  <span className="text-[10px] text-amber-700 block">mmHg</span>
                </div>

                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-500 font-bold block">SpO2 Level</span>
                  <span className="text-base font-mono font-black text-stone-900">
                    {activePatient.vitals.spo2}%
                  </span>
                  <span className="text-[10px] text-emerald-700 block">Normal Room Air</span>
                </div>

                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-500 font-bold block">Pulse Rate</span>
                  <span className="text-base font-mono font-black text-stone-900">
                    {activePatient.vitals.pulse} bpm
                  </span>
                  <span className="text-[10px] text-stone-500 block">Regular rhythm</span>
                </div>

                <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-[10px] text-stone-500 font-bold block">Temperature</span>
                  <span className="text-base font-mono font-black text-stone-900">
                    {activePatient.vitals.temperature}°F
                  </span>
                  <span className="text-[10px] text-stone-500 block">Afebrile</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-500">Vitals not recorded today.</p>
            )}

            <div className="mt-3 pt-3 border-t border-stone-100 text-xs">
              <span className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
                Reported Symptoms:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activePatient.currentSymptoms?.map((sym, idx) => (
                  <span key={idx} className="bg-stone-100 text-stone-800 text-[11px] font-medium px-2 py-0.5 rounded-md">
                    {sym}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Longitudinal History Mini Feed */}
          <div className="bg-white border-2 border-stone-200 rounded-3xl p-5 shadow-xs max-h-[460px] overflow-y-auto">
            <h2 className="font-extrabold text-xs uppercase tracking-wider text-stone-500 mb-3">
              Longitudinal Health History ({patientEvents.length})
            </h2>

            <div className="space-y-3">
              {patientEvents.map(evt => (
                <div key={evt.id} className="p-3 bg-[#FAF9F6] border border-stone-200 rounded-xl text-xs">
                  <div className="flex items-center justify-between font-bold text-stone-900 mb-1">
                    <span>{evt.title}</span>
                    <span className="text-[10px] text-stone-400 font-mono">{evt.timestamp}</span>
                  </div>
                  <p className="text-stone-600 text-[11px]">{evt.notes}</p>
                  <p className="text-[10px] text-stone-400 mt-1">{evt.facilityName}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Column: Clinical Notes, Prescription, Diagnostics (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border-2 border-stone-200 rounded-3xl p-5 shadow-xs space-y-4">
            <h2 className="font-extrabold text-xs uppercase tracking-wider text-stone-500">
              Doctor Consultation Notes
            </h2>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                Provisional Diagnosis (निदान) *
              </label>
              <input
                type="text"
                value={provisionalDiagnosis}
                onChange={e => setProvisionalDiagnosis(e.target.value)}
                className="w-full text-xs font-bold p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                Clinical Examination &amp; Impression
              </label>
              <textarea
                rows={4}
                value={clinicalNotes}
                onChange={e => setClinicalNotes(e.target.value)}
                className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* In-Clinic Medicine Prescription with Stock Check */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-stone-700 flex items-center gap-1">
                  <Pill className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Prescribe PHC Medicine</span>
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  selectedMed.status === 'available' ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                }`}>
                  Stock: {selectedMed.availableQuantity} units ({selectedMed.status})
                </span>
              </div>

              <select
                value={prescribedMedicineId}
                onChange={e => setPrescribedMedicineId(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-stone-300 rounded-xl"
              >
                {medicines.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.medicineName} ({m.dosageForm || m.dosage}{m.strength ? `, ${m.strength}` : ''}) — {m.availableQuantity} avail
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={prescriptionDosage}
                onChange={e => setPrescriptionDosage(e.target.value)}
                placeholder="Dosage instructions..."
                className="w-full text-xs p-2 bg-white border border-stone-300 rounded-xl"
              />
            </div>

            {/* Diagnostic Order */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-stone-700 flex items-center gap-1">
                  <FileSearch className="w-3.5 h-3.5 text-teal-700" />
                  <span>Order Diagnostic Investigation</span>
                </span>
              </div>

              <select
                value={orderedDiagnostic}
                onChange={e => setOrderedDiagnostic(e.target.value)}
                className="w-full text-xs p-2 bg-white border border-stone-300 rounded-xl"
              >
                <option value="Point-of-Care 12-Lead ECG & Renal Profile">Point-of-Care 12-Lead ECG &amp; Renal Profile</option>
                <option value="Complete Blood Count (CBC) & Serum Ferritin">Complete Blood Count (CBC) &amp; Serum Ferritin</option>
                <option value="Fasting & Post-Prandial Blood Sugar">Fasting &amp; Post-Prandial Blood Sugar</option>
                <option value="Chest X-Ray (PA View)">Chest X-Ray (PA View)</option>
              </select>

              <button
                type="button"
                onClick={handleOrderDiagnostic}
                className="w-full py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-900 text-xs font-bold rounded-xl transition-colors"
              >
                Dispatch Test Order to Lab Desk
              </button>
            </div>

            <button
              type="button"
              onClick={handleCompleteConsultation}
              className="w-full py-2.5 bg-[#164E43] hover:bg-[#123e35] text-white text-xs font-bold rounded-xl shadow-md transition-colors"
            >
              Complete Consultation &amp; Next Patient
            </button>
          </div>
        </div>

        {/* Right Column: Inter-Facility Referral Creation (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border-2 border-stone-200 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-xs font-bold uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                  Continuity Link
                </span>
                <h2 className="font-extrabold text-sm text-stone-900 mt-1">
                  Inter-Facility Referral Module
                </h2>
              </div>
              <Share2 className="w-4 h-4 text-emerald-700" />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                Target Referral Hospital *
              </label>
              <select
                value={referralTargetFacilityId}
                onChange={e => setReferralTargetFacilityId(e.target.value)}
                className="w-full text-xs font-bold p-2.5 bg-white border border-stone-300 rounded-xl"
              >
                {facilities.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.type} • {f.taluka})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Priority
                </label>
                <select
                  value={referralPriority}
                  onChange={e => setReferralPriority(e.target.value as any)}
                  className="w-full text-xs font-bold p-2 bg-white border border-stone-300 rounded-xl"
                >
                  <option value="urgent">Urgent (48 hrs)</option>
                  <option value="emergency">Emergency (Immediate)</option>
                  <option value="routine">Routine (7 days)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                  Specialist Required
                </label>
                <input
                  type="text"
                  value={specialistRequired}
                  onChange={e => setSpecialistRequired(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-stone-300 rounded-xl"
                  placeholder="e.g. Cardiologist"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 uppercase mb-1">
                Clinical Justification / Reason
              </label>
              <textarea
                rows={2}
                value={referralReason}
                onChange={e => setReferralReason(e.target.value)}
                className="w-full text-xs p-2 border border-stone-300 rounded-xl"
                placeholder="Reason for referral..."
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={transportAssisted}
                onChange={e => setTransportAssisted(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600"
              />
              <span className="font-semibold">Request 102/108 Ambulance / Public Transport Pass</span>
            </label>

            {/* Saathi AI Referral Summary Generator */}
            <div className="pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-stone-600">
                  Saathi AI Referral Summary
                </span>
                <button
                  type="button"
                  onClick={handleGenerateAiSummary}
                  disabled={aiSummaryLoading}
                  className="text-[11px] font-bold text-[#164E43] bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Sparkles className="w-3 h-3 text-amber-700" />
                  <span>{aiSummaryLoading ? 'Generating...' : 'Auto-Generate Brief'}</span>
                </button>
              </div>

              {generatedSummary && (
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700 mb-3 max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {generatedSummary}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleCreateReferral}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-[#164E43]" />
              <span>Create Inter-Facility Referral</span>
            </button>

            {referralCreatedSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-950">
                <p className="font-bold">Referral Dispatched: {referralCreatedSuccess}</p>
                <p className="text-[11px] text-stone-600 mt-0.5">
                  Routed to {targetFacility.name}. Facility desk alerted for scheduling.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <SafetyBanner />
    </div>
  );
};
