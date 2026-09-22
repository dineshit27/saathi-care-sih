import React, { useState } from 'react';
import {
  Users,
  Clock,
  Calendar,
  Share2,
  Pill,
  FileText,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Building2,
  ChevronRight,
  Activity,
  ShieldCheck,
  MapPin,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../services/store';
import { CareContinuityBar } from '../../components/common/CareContinuityBar';
import { SafetyBanner } from '../../components/common/SafetyBanner';
import { TabId } from '../../components/layout/NavigationTabs';
import { BrandLogo } from '../../components/common/BrandLogo';

interface Props {
  setActiveTab: (tab: TabId) => void;
}

export const PatientDashboard: React.FC<Props> = ({ setActiveTab }) => {
  const {
    currentUser,
    patients,
    queue,
    referrals,
    diagnostics,
    timelineEvents,
    addQueueEntry,
    t
  } = useApp();

  const patient = patients.find(p => p.id === currentUser.id) || patients[0];
  const patientQueueEntry = queue.find(q => q.patientId === patient.id && q.status !== 'completed');
  const patientReferral = referrals.find(r => r.patientId === patient.id);
  const patientEvents = timelineEvents.filter(e => e.patientId === patient.id);
  const patientDiagnostics = diagnostics.filter(d => d.patientId === patient.id);

  // Calculate waiting position
  const activeQueueWaiting = queue.filter(q => q.status === 'waiting');
  const myQueueIndex = patientQueueEntry
    ? activeQueueWaiting.findIndex(q => q.id === patientQueueEntry.id)
    : -1;

  const [symptomInput, setSymptomInput] = useState('');
  const [symptomSubmitted, setSymptomSubmitted] = useState(false);

  const handleJoinQueue = () => {
    if (!patientQueueEntry) {
      addQueueEntry(patient.id);
    }
  };

  const handleSymptomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomInput.trim()) return;
    setSymptomSubmitted(true);
    setTimeout(() => {
      setSymptomSubmitted(false);
      setSymptomInput('');
    }, 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Greeting Header */}
      <div className="bg-white border-2 border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BrandLogo size="xs" />
            <span className="text-xs font-bold uppercase bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full">
              Saathi Citizen Health Card
            </span>
            <span className="text-xs text-stone-500 font-mono">
              ABHA: {patient.abhaId}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 mt-2">
            Good morning, {patient.name}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
            Village: <strong>{patient.village}</strong> • Frontline ASHA: <strong>{patient.assignedAsha}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!patientQueueEntry ? (
            <button
              onClick={handleJoinQueue}
              className="px-5 py-2.5 bg-[#164E43] hover:bg-[#123e35] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>Join PHC Consultation Queue</span>
            </button>
          ) : (
            <div className="bg-amber-50 border border-amber-300 px-4 py-2 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
              <span>Active Token: {patientQueueEntry.tokenNumber} (Waiting)</span>
            </div>
          )}

          <button
            onClick={() => setActiveTab('referrals')}
            className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl border border-stone-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-emerald-700" />
            <span>Track Referral</span>
          </button>
        </div>
      </div>

      {/* Care Continuity Operational Score */}
      <CareContinuityBar
        completedSteps={patient.careContinuityScore.completedSteps}
        totalSteps={patient.careContinuityScore.totalSteps}
        lastMilestone={patient.careContinuityScore.lastMilestone}
        patientName={patient.name}
      />

      {/* Today's Care / Live Queue Status Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border-2 border-stone-200 rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl">
                <Clock className="w-5 h-5 text-[#164E43]" />
              </div>
              <div>
                <h2 className="font-extrabold text-lg text-stone-900">Today&apos;s Care &amp; Queue Status</h2>
                <p className="text-xs text-stone-500">Live operational link with Shirur Primary Health Centre</p>
              </div>
            </div>

            {patientQueueEntry && (
              <span className="text-xs font-bold bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full">
                Token: {patientQueueEntry.tokenNumber}
              </span>
            )}
          </div>

          {patientQueueEntry ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-stone-200">
                <p className="text-xs text-stone-500 font-semibold">Your Position</p>
                <p className="text-2xl font-black text-[#164E43] mt-1">
                  #{myQueueIndex >= 0 ? myQueueIndex + 1 : 1} in Queue
                </p>
                <p className="text-[11px] text-stone-600 mt-1">
                  {patientQueueEntry.status === 'in_consultation' ? 'Now inside consultation room!' : 'Waiting for turn'}
                </p>
              </div>

              <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-stone-200">
                <p className="text-xs text-stone-500 font-semibold">Estimated Wait</p>
                <p className="text-2xl font-black text-amber-700 mt-1">
                  ~{patientQueueEntry.estimatedWaitMinutes} Mins
                </p>
                <p className="text-[11px] text-stone-600 mt-1">Real-time PHC OPD telemetry</p>
              </div>

              <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-stone-200">
                <p className="text-xs text-stone-500 font-semibold">Assigned Doctor</p>
                <p className="text-base font-bold text-stone-900 mt-1">
                  {patientQueueEntry.doctorName}
                </p>
                <p className="text-[11px] text-stone-600 mt-0.5">Room 2 • OPD Medical Officer</p>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-stone-50 border border-stone-200 rounded-2xl text-center mb-4">
              <p className="font-bold text-stone-800 text-sm">No Active Clinic Queue Token</p>
              <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                You are not currently waiting in the OPD queue today. You can join the queue or check your scheduled referral appointment.
              </p>
              <button
                onClick={handleJoinQueue}
                className="mt-3 px-4 py-2 bg-[#164E43] text-white text-xs font-bold rounded-xl hover:bg-[#123e35] transition-colors inline-flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>Issue Today&apos;s Queue Token</span>
              </button>
            </div>
          )}

          {/* Quick Active Referral Banner */}
          {patientReferral && (
            <div className="bg-emerald-50/80 border border-emerald-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                  Referral Pass: {patientReferral.id}
                </span>
                <p className="text-sm font-bold text-stone-900 mt-1">
                  Referral to {patientReferral.toFacilityName}
                </p>
                <p className="text-xs text-stone-600">
                  Appointment: <strong>{patientReferral.appointmentDate || 'Awaiting schedule'} ({patientReferral.appointmentTime || '--'})</strong> • Status: <strong className="text-emerald-800 uppercase">{patientReferral.status}</strong>
                </p>
              </div>

              <button
                onClick={() => setActiveTab('referrals')}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl self-start sm:self-auto transition-colors"
              >
                View Full Pass →
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions & Symptom Log */}
        <div className="space-y-4">
          <div className="bg-white border-2 border-stone-200 rounded-3xl p-5 shadow-xs">
            <h3 className="font-bold text-sm text-stone-900 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Log New Symptoms for ASHA</span>
            </h3>

            <form onSubmit={handleSymptomSubmit} className="space-y-3">
              <textarea
                rows={2}
                value={symptomInput}
                onChange={e => setSymptomInput(e.target.value)}
                placeholder="Describe how you are feeling (e.g., headache, fever, cough, chest tightness)..."
                className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full py-2 bg-[#164E43] text-white text-xs font-bold rounded-xl hover:bg-[#123e35] transition-colors"
              >
                {symptomSubmitted ? 'Symptoms Logged to Record!' : 'Submit to Health Worker'}
              </button>
            </form>
          </div>

          <div className="bg-white border-2 border-stone-200 rounded-3xl p-5 shadow-xs space-y-2">
            <h3 className="font-bold text-xs uppercase text-stone-500 tracking-wider">
              Quick Citizen Actions
            </h3>

            <button
              onClick={() => setActiveTab('medicines')}
              className="w-full p-2.5 text-left bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200 text-xs font-semibold text-stone-800 flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2">
                <Pill className="w-4 h-4 text-emerald-700" />
                <span>Find Medicine at Nearby PHC</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
            </button>

            <button
              onClick={() => setActiveTab('diagnostics')}
              className="w-full p-2.5 text-left bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200 text-xs font-semibold text-stone-800 flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-700" />
                <span>View Diagnostic Test Reports</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
            </button>

            <button
              onClick={() => {
                alert(`Connecting to Frontline Worker: ${patient.assignedAsha} (${patient.emergencyContact.phone})`);
              }}
              className="w-full p-2.5 text-left bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200 text-xs font-semibold text-stone-800 flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-emerald-700" />
                <span>Call ASHA: {patient.assignedAsha}</span>
              </span>
              <span className="text-[10px] text-emerald-800 font-bold">Call</span>
            </button>
          </div>
        </div>
      </div>

      {/* Longitudinal Health Timeline */}
      <div className="bg-white border-2 border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4 mb-6">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900">
              Your Longitudinal Health Timeline
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Permanent chronological record of every consultation, test, and referral across Maharashtra public facilities
            </p>
          </div>
          <span className="text-xs bg-stone-100 border border-stone-300 text-stone-700 px-3 py-1 rounded-full font-mono">
            {patientEvents.length} Events Logged
          </span>
        </div>

        <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-stone-200">
          {patientEvents.map((evt, idx) => (
            <div key={evt.id} className="relative flex items-start gap-4 pl-8">
              <div
                className={`absolute left-1.5 top-1.5 w-4 h-4 rounded-full border-2 bg-white ${
                  evt.badgeType === 'emergency'
                    ? 'border-red-600 bg-red-100'
                    : evt.badgeType === 'urgent'
                    ? 'border-amber-500 bg-amber-100'
                    : evt.badgeType === 'success'
                    ? 'border-emerald-600 bg-emerald-100'
                    : 'border-[#164E43] bg-emerald-50'
                }`}
              />

              <div className="flex-1 bg-[#FAF9F6] border border-stone-200 rounded-2xl p-4 shadow-2xs hover:border-emerald-500 transition-all">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-sm text-stone-900">{evt.title}</span>
                  <span className="text-[11px] font-mono text-stone-500">{evt.timestamp}</span>
                </div>

                <p className="text-xs text-stone-700 leading-relaxed">{evt.notes}</p>

                {evt.vitals && (
                  <div className="mt-2.5 pt-2 border-t border-stone-200 flex flex-wrap gap-2 text-[11px] text-stone-700 font-mono">
                    {evt.vitals.systolicBp && <span className="bg-white px-2 py-0.5 rounded border">BP: {evt.vitals.systolicBp}/{evt.vitals.diastolicBp} mmHg</span>}
                    {evt.vitals.pulse && <span className="bg-white px-2 py-0.5 rounded border">Pulse: {evt.vitals.pulse} bpm</span>}
                    {evt.vitals.spo2 && <span className="bg-white px-2 py-0.5 rounded border">SpO2: {evt.vitals.spo2}%</span>}
                    {evt.vitals.temperature && <span className="bg-white px-2 py-0.5 rounded border">Temp: {evt.vitals.temperature}°F</span>}
                  </div>
                )}

                <div className="mt-2 text-[11px] text-stone-500 flex items-center justify-between">
                  <span>Facility: <strong>{evt.facilityName}</strong></span>
                  <span>Provider: <strong>{evt.providerName} ({evt.providerRole})</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <SafetyBanner />
    </div>
  );
};
