import React, { useState } from 'react';
import {
  Share2,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Ambulance,
  QrCode,
  FileText,
  UserCheck
} from 'lucide-react';
import { useApp } from '../../services/store';
import { Referral } from '../../types';
import { CareContinuityBar } from '../../components/common/CareContinuityBar';
import { BrandLogo } from '../../components/common/BrandLogo';

export const ReferralTracker: React.FC = () => {
  const {
    referrals,
    updateReferralStatus,
    currentUser,
    patients,
    t
  } = useApp();

  const [filterType, setFilterType] = useState<'all' | 'outgoing' | 'incoming'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedReferralId, setSelectedReferralId] = useState<string>(referrals[0]?.id || '');
  const [scheduleDate, setScheduleDate] = useState('2026-09-24');
  const [scheduleTime, setScheduleTime] = useState('11:30 AM');

  const selectedRef = referrals.find(r => r.id === selectedReferralId) || referrals[0];

  const filteredReferrals = referrals.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterType === 'outgoing' && r.fromFacilityName.includes('Shirur')) return true;
    if (filterType === 'incoming' && !r.fromFacilityName.includes('Shirur')) return true;
    return true;
  });

  const handleAccept = (refId: string) => {
    updateReferralStatus(refId, 'accepted');
  };

  const handleSchedule = (refId: string) => {
    updateReferralStatus(refId, 'scheduled', {
      appointmentDate: scheduleDate,
      appointmentTime: scheduleTime
    });
  };

  const handleComplete = (refId: string) => {
    updateReferralStatus(refId, 'completed');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="bg-white border-2 border-stone-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BrandLogo size="xs" />
            <span className="text-xs font-bold uppercase bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full">
              Saathi Continuity Command
            </span>
            <span className="text-xs text-stone-500 font-mono">
              Maharashtra Inter-Facility Network
            </span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 mt-1">
            Inter-Facility Referral Tracking &amp; Scheduling
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Every referral is actively monitored from clinical creation to tertiary visit and ASHA community closure
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Zero Lost Referrals Policy</span>
          </div>
        </div>
      </div>

      {/* Main Referral Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Referral List (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border-2 border-stone-200 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex gap-1 bg-stone-100 p-1 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 rounded-lg ${filterType === 'all' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'}`}
                >
                  All ({referrals.length})
                </button>
                <button
                  onClick={() => setFilterType('outgoing')}
                  className={`px-3 py-1 rounded-lg ${filterType === 'outgoing' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'}`}
                >
                  Outgoing PHC
                </button>
                <button
                  onClick={() => setFilterType('incoming')}
                  className={`px-3 py-1 rounded-lg ${filterType === 'incoming' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'}`}
                >
                  Incoming
                </button>
              </div>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="text-xs p-1.5 border border-stone-300 rounded-xl bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="sent">Sent / Pending</option>
                <option value="accepted">Accepted</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto">
              {filteredReferrals.map(ref => {
                const isSelected = selectedRef?.id === ref.id;
                return (
                  <div
                    key={ref.id}
                    onClick={() => setSelectedReferralId(ref.id)}
                    className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-[#FAF9F6] border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono font-bold text-emerald-900">{ref.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        ref.priority === 'emergency'
                          ? 'bg-red-100 text-red-900 border border-red-300'
                          : ref.priority === 'urgent'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-stone-100 text-stone-700'
                      }`}>
                        {ref.priority}
                      </span>
                    </div>

                    <p className="font-extrabold text-sm text-stone-900">{ref.patientName}</p>
                    <p className="text-stone-600 mt-0.5">
                      From: <span className="font-semibold">{ref.fromFacilityName}</span> → To: <span className="font-semibold">{ref.toFacilityName}</span>
                    </p>

                    <div className="mt-2 pt-2 border-t border-stone-200 flex items-center justify-between text-[11px]">
                      <span className={`font-bold uppercase ${
                        ref.status === 'completed'
                          ? 'text-emerald-700'
                          : ref.status === 'scheduled'
                          ? 'text-teal-700'
                          : 'text-amber-700'
                      }`}>
                        Status: {ref.status.replace('_', ' ')}
                      </span>
                      {ref.transportAssisted && (
                        <span className="flex items-center gap-1 text-emerald-800 font-medium">
                          <Ambulance className="w-3.5 h-3.5 text-emerald-600" />
                          <span>102 Transport</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Referral Detail & Action Pass (7 Cols) */}
        <div className="lg:col-span-7">
          {selectedRef ? (
            <div className="bg-white border-2 border-stone-200 rounded-3xl p-6 shadow-xs space-y-6">
              {/* Header & QR ID */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <BrandLogo size="xs" />
                    <span className="bg-[#164E43] text-white text-xs font-mono font-bold px-2.5 py-0.5 rounded-md">
                      {selectedRef.id}
                    </span>
                    <span className="text-xs bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full uppercase">
                      Official Transfer Pass
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-stone-900 mt-2">
                    {selectedRef.patientName} ({selectedRef.patientAge}y, {selectedRef.patientGender})
                  </h2>
                  <p className="text-xs text-stone-500">
                    Origin: {selectedRef.patientVillage} • Referring Clinician: <strong>{selectedRef.referringDoctorName}</strong>
                  </p>
                </div>

                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center gap-3 self-start">
                  <div className="w-12 h-12 bg-white border border-stone-300 rounded-xl flex items-center justify-center shadow-2xs">
                    <QrCode className="w-9 h-9 text-stone-800" />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-stone-500 font-bold block uppercase">Digital Pass</span>
                    <span className="text-xs font-bold text-[#164E43]">Scannable at Desk</span>
                  </div>
                </div>
              </div>

              {/* Transfer Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-[#FAF9F6] border border-stone-200 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase text-stone-500 block mb-1">
                    Referring Facility (Origin)
                  </span>
                  <p className="font-bold text-stone-900 text-sm">{selectedRef.fromFacilityName}</p>
                  <p className="text-stone-600 mt-0.5">Medical Officer: {selectedRef.referringDoctorName}</p>
                </div>

                <div className="p-4 bg-[#FAF9F6] border border-stone-200 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase text-stone-500 block mb-1">
                    Destination Referral Facility
                  </span>
                  <p className="font-bold text-stone-900 text-sm">{selectedRef.toFacilityName}</p>
                  <p className="text-stone-600 mt-0.5">Specialist Desk: {selectedRef.specialistRequired}</p>
                </div>
              </div>

              {/* Clinical Notes & Diagnosis */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-2 text-xs">
                <p><strong>Provisional Diagnosis:</strong> {selectedRef.provisionalDiagnosis}</p>
                <p><strong>Clinical Reason:</strong> {selectedRef.reason}</p>
                <p><strong>Transfer Summary:</strong> {selectedRef.clinicalNotes}</p>
              </div>

              {/* Appointment & Transport Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl">
                  <span className="font-bold text-emerald-950 block mb-1">
                    Scheduled Specialist Appointment:
                  </span>
                  <p className="text-base font-black text-emerald-900">
                    {selectedRef.appointmentDate || 'Awaiting Desk Slot'}
                  </p>
                  <p className="text-stone-600 mt-0.5">
                    Time: {selectedRef.appointmentTime || 'Pending allocation'}
                  </p>
                </div>

                <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl">
                  <span className="font-bold text-stone-900 block mb-1">
                    Transport Coordination:
                  </span>
                  <p className="text-stone-700">
                    {selectedRef.transportAssisted
                      ? '✓ 102/108 Rural Public Transport assistance confirmed'
                      : 'Self-arranged transport'}
                  </p>
                </div>
              </div>

              {/* Action Controls for Receiving Hospital / Desk */}
              <div className="pt-4 border-t border-stone-200 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Referral Lifecycle Actions:
                </h3>

                <div className="flex flex-wrap items-center gap-2">
                  {selectedRef.status === 'sent' && (
                    <button
                      onClick={() => handleAccept(selectedRef.id)}
                      className="px-4 py-2 bg-[#164E43] hover:bg-[#123e35] text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      Accept Incoming Referral at Facility Desk
                    </button>
                  )}

                  {selectedRef.status === 'accepted' && (
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={e => setScheduleDate(e.target.value)}
                        className="text-xs p-2 border border-stone-300 rounded-xl bg-white"
                      />
                      <input
                        type="text"
                        value={scheduleTime}
                        onChange={e => setScheduleTime(e.target.value)}
                        className="text-xs p-2 border border-stone-300 rounded-xl bg-white w-28"
                        placeholder="11:30 AM"
                      />
                      <button
                        onClick={() => handleSchedule(selectedRef.id)}
                        className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-xl shadow-xs transition-colors"
                      >
                        Allocate Specialist Slot
                      </button>
                    </div>
                  )}

                  {selectedRef.status === 'scheduled' && (
                    <button
                      onClick={() => handleComplete(selectedRef.id)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Specialist Visit &amp; Send Discharge Summary to PHC</span>
                    </button>
                  )}

                  {selectedRef.status === 'completed' && (
                    <div className="p-3 bg-emerald-100 text-emerald-950 rounded-xl text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>Specialist consultation completed. Automatic ASHA follow-up task triggered!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-stone-500 bg-white rounded-3xl border-2 border-stone-200">
              Select a referral from the list to view its complete transfer pass.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
