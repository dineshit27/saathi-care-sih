import React, { useState } from 'react';
import {
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  Tv,
  Building2,
  Stethoscope
} from 'lucide-react';
import { useApp } from '../../services/store';
import { QueueEntry } from '../../types';
import { BrandLogo } from '../../components/common/BrandLogo';

export const QueueManager: React.FC = () => {
  const { queue, updateQueueStatus, currentUser, t } = useApp();
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isTvDisplayMode, setIsTvDisplayMode] = useState<boolean>(false);

  const waitingQueue = queue.filter(q => q.status === 'waiting');
  const inConsultation = queue.find(q => q.status === 'in_consultation');
  const completedQueue = queue.filter(q => q.status === 'completed');

  const filteredQueue = queue.filter(q => {
    if (filterPriority !== 'all' && q.priority !== filterPriority) return false;
    return true;
  });

  const handleCallNext = () => {
    if (inConsultation) {
      updateQueueStatus(inConsultation.id, 'completed');
    }
    const nextInLine = waitingQueue[0];
    if (nextInLine) {
      updateQueueStatus(nextInLine.id, 'in_consultation');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner / TV Display Mode Toggle */}
      <div className="bg-white border-2 border-stone-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BrandLogo size="xs" />
            <span className="text-xs font-bold uppercase bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full">
              Saathi PHC Queue Engine
            </span>
            <span className="text-xs text-stone-500 font-mono">
              Live Token Dispatcher
            </span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 mt-1">
            Consultation Queue &amp; Waiting Hall Board
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Facility: <strong>{currentUser.facilityName || 'Shirur Primary Health Centre'}</strong> • Room 1 &amp; Room 2
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsTvDisplayMode(!isTvDisplayMode)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              isTvDisplayMode
                ? 'bg-amber-400 text-stone-950 border-amber-500 font-black'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-300'
            }`}
          >
            <Tv className="w-4 h-4 text-emerald-700" />
            <span>{isTvDisplayMode ? 'Exit Hall TV Board' : 'Hall Display Mode (TV)'}</span>
          </button>

          {(currentUser.role === 'doctor' || currentUser.role === 'facility' || currentUser.role === 'admin') && (
            <button
              onClick={handleCallNext}
              className="px-4 py-2 bg-[#164E43] hover:bg-[#123e35] text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
            >
              <ArrowRight className="w-4 h-4 text-amber-400" />
              <span>Call Next Token</span>
            </button>
          )}
        </div>
      </div>

      {/* Hall TV Display Mode (High Contrast for Waiting Rooms) */}
      {isTvDisplayMode ? (
        <div className="bg-[#0F362E] text-white rounded-3xl p-8 shadow-2xl border-4 border-amber-400 space-y-8 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-emerald-800 pb-4">
            <div className="flex items-center gap-4">
              <BrandLogo size="lg" variant="light" />
              <div>
                <span className="text-amber-400 font-bold uppercase tracking-widest text-xs sm:text-sm">
                  Saathi Care Connected Network • Public Health Department
                </span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-0.5">
                  Shirur Primary Health Centre — OPD Live Queue
                </h2>
              </div>
            </div>
            <div className="text-right">
              <span className="text-emerald-300 text-sm font-mono block">Current Time</span>
              <span className="text-2xl font-bold font-mono text-white">
                {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Now In Consultation */}
            <div className="bg-emerald-900/60 border-2 border-emerald-500 rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <span className="bg-amber-400 text-stone-950 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider">
                  NOW CALLING / चालू रुग्ण
                </span>
                {inConsultation ? (
                  <div className="mt-6">
                    <p className="text-6xl font-mono font-black text-white">
                      {inConsultation.tokenNumber}
                    </p>
                    <p className="text-2xl font-bold text-emerald-100 mt-2">
                      {inConsultation.patientName}
                    </p>
                    <p className="text-sm text-emerald-300 mt-1">
                      Village: {inConsultation.patientVillage}
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 text-stone-400 text-lg font-medium">
                    Next token being prepared...
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-emerald-700/60 text-emerald-200 text-xs">
                Room 2: Medical Officer Consultation
              </div>
            </div>

            {/* Waiting List on TV */}
            <div className="lg:col-span-2 bg-emerald-950/80 border border-emerald-800 rounded-3xl p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-300 mb-4">
                Next In Line / पुढील टोकन क्र.
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {waitingQueue.slice(0, 6).map((item, idx) => (
                  <div key={item.id} className="p-3.5 bg-emerald-900/40 border border-emerald-700/40 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-mono font-black text-amber-300">{item.tokenNumber}</span>
                      <span className="text-xs text-emerald-400 font-mono">#{idx + 1}</span>
                    </div>
                    <p className="font-bold text-sm text-white truncate mt-1">{item.patientName}</p>
                    <p className="text-[11px] text-emerald-300">{item.patientVillage} • ~{item.estimatedWaitMinutes}m</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Regular Management Dashboard View */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left summary cards */}
          <div className="space-y-4">
            <div className="bg-white border-2 border-stone-200 rounded-3xl p-5 shadow-xs">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
                Active In Consultation
              </span>
              {inConsultation ? (
                <div className="mt-3 p-4 bg-emerald-50 border border-emerald-300 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-mono font-black text-[#164E43]">
                      {inConsultation.tokenNumber}
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase">
                      In Room
                    </span>
                  </div>
                  <p className="font-bold text-sm text-stone-900 mt-1">{inConsultation.patientName}</p>
                  <p className="text-xs text-stone-600">Village: {inConsultation.patientVillage}</p>
                  <p className="text-xs text-emerald-800 mt-1 font-semibold">Doctor: {inConsultation.doctorName}</p>

                  <button
                    onClick={() => updateQueueStatus(inConsultation.id, 'completed')}
                    className="w-full mt-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors"
                  >
                    Mark Consultation Done
                  </button>
                </div>
              ) : (
                <p className="text-xs text-stone-500 mt-2 italic">Consultation room currently clear.</p>
              )}
            </div>

            <div className="bg-white border-2 border-stone-200 rounded-3xl p-5 shadow-xs space-y-2">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-2">
                Queue Telemetry
              </span>
              <div className="flex justify-between text-xs py-1 border-b">
                <span className="text-stone-600">Total Waiting:</span>
                <strong className="text-stone-900">{waitingQueue.length} patients</strong>
              </div>
              <div className="flex justify-between text-xs py-1 border-b">
                <span className="text-stone-600">Avg Waiting Time:</span>
                <strong className="text-stone-900">~18 mins</strong>
              </div>
              <div className="flex justify-between text-xs py-1">
                <span className="text-stone-600">Completed Today:</span>
                <strong className="text-emerald-700">{completedQueue.length} consultations</strong>
              </div>
            </div>
          </div>

          {/* Right Queue List Table */}
          <div className="lg:col-span-3 bg-white border-2 border-stone-200 rounded-3xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-base font-bold text-stone-900">
                Patient Token List ({filteredQueue.length})
              </h2>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-stone-500 uppercase">Priority:</label>
                <select
                  value={filterPriority}
                  onChange={e => setFilterPriority(e.target.value)}
                  className="text-xs font-bold p-1.5 bg-stone-50 border border-stone-300 rounded-xl"
                >
                  <option value="all">All Priorities</option>
                  <option value="emergency">Emergency Only</option>
                  <option value="urgent">Urgent</option>
                  <option value="routine">Routine</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-bold uppercase text-[10px]">
                    <th className="p-3">Token</th>
                    <th className="p-3">Patient Name</th>
                    <th className="p-3">Village</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Joined At</th>
                    <th className="p-3">Est. Wait</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredQueue.map(item => (
                    <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                      <td className="p-3 font-mono font-black text-sm text-[#164E43]">
                        {item.tokenNumber}
                      </td>
                      <td className="p-3 font-bold text-stone-900">
                        {item.patientName}
                      </td>
                      <td className="p-3 text-stone-600">
                        {item.patientVillage}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          item.priority === 'emergency'
                            ? 'bg-red-100 text-red-900 border border-red-300'
                            : item.priority === 'urgent'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}>
                          {item.priority}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-stone-500">
                        {item.joinedAt}
                      </td>
                      <td className="p-3 text-stone-700 font-medium">
                        {item.status === 'completed' ? '--' : `~${item.estimatedWaitMinutes}m`}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          item.status === 'in_consultation'
                            ? 'bg-emerald-100 text-emerald-900 font-extrabold'
                            : item.status === 'completed'
                            ? 'bg-stone-100 text-stone-600'
                            : 'bg-amber-50 text-amber-900'
                        }`}>
                          {item.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1">
                        {item.status === 'waiting' && (
                          <button
                            onClick={() => updateQueueStatus(item.id, 'in_consultation')}
                            className="px-2 py-1 bg-[#164E43] hover:bg-[#123e35] text-white text-[11px] font-bold rounded-lg transition-colors"
                          >
                            Call In
                          </button>
                        )}
                        {item.status === 'in_consultation' && (
                          <button
                            onClick={() => updateQueueStatus(item.id, 'completed')}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors"
                          >
                            Done
                          </button>
                        )}
                        {item.status !== 'completed' && (
                          <button
                            onClick={() => updateQueueStatus(item.id, 'no_show')}
                            className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-600 text-[11px] font-bold rounded-lg transition-colors"
                          >
                            No-show
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
