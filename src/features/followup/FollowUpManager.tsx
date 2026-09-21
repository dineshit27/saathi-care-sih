import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  PhoneCall,
  UserCheck,
  Calendar,
  Home,
  FileCheck2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../../services/store';
import { FollowUpTask } from '../../types';
import { CareContinuityBar } from '../../components/common/CareContinuityBar';

export const FollowUpManager: React.FC = () => {
  const { followUps, completeFollowUp, triggerEmergencyEscalation, t } = useApp();

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [visitNotes, setVisitNotes] = useState('Home visit conducted. Checked BP and medication compliance. Patient confirmed daily adherence to prescribed anti-hypertensive regimen.');
  const [homeBp, setHomeBp] = useState('130/84');
  const [adherenceOk, setAdherenceOk] = useState(true);

  const filteredFollowUps = followUps.filter(f => {
    if (filterCategory !== 'all' && f.category !== filterCategory) return false;
    if (filterStatus !== 'all' && f.status !== filterStatus) return false;
    return true;
  });

  const handleComplete = (task: FollowUpTask) => {
    completeFollowUp(task.id, `${visitNotes}. Home BP: ${homeBp}. Adherence: ${adherenceOk ? 'Verified' : 'Irregular'}`);
    setActiveTaskId(null);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="bg-white border-2 border-stone-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full">
              Community Continuity Engine
            </span>
            <span className="text-xs text-stone-500 font-mono">
              Post-Referral &amp; High-Risk Registry
            </span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 mt-1">
            Community Follow-Up &amp; High-Risk Home Visits
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Closing the loop: Frontline ASHA home visits guarantee that referred and vulnerable patients never slip through cracks
          </p>
        </div>

        <div className="bg-[#E6F4EA] border border-emerald-300 text-emerald-900 px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>Stage 5: Continuum Closure</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border-2 border-stone-200 rounded-3xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-stone-500 uppercase">Category:</label>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="text-xs font-bold p-2 bg-stone-50 border border-stone-300 rounded-xl"
          >
            <option value="all">All Categories</option>
            <option value="high_risk">High-Risk Chronic</option>
            <option value="maternal">Antenatal / Maternal Care (ANC)</option>
            <option value="post_referral">Post-Referral Returnees</option>
            <option value="missed_appointment">Missed Appointment Recovery</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-stone-500 uppercase">Status:</label>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="text-xs font-bold p-2 bg-stone-50 border border-stone-300 rounded-xl"
          >
            <option value="all">All Statuses</option>
            <option value="due">Due for Visit</option>
            <option value="completed">Visit Completed</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Follow-up Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredFollowUps.map(task => (
          <div
            key={task.id}
            className={`border-2 rounded-3xl p-5 shadow-xs flex flex-col justify-between transition-all ${
              task.status === 'completed'
                ? 'bg-emerald-50/40 border-emerald-300'
                : task.status === 'overdue'
                ? 'bg-red-50/30 border-red-300'
                : 'bg-white border-stone-200 hover:border-emerald-500'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-full">
                  {task.category.replace('_', ' ')}
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                  task.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-amber-100 text-amber-900'
                }`}>
                  {task.status}
                </span>
              </div>

              <h3 className="font-extrabold text-base text-stone-900">
                {task.patientName}
              </h3>
              <p className="text-xs text-stone-600 mt-0.5">
                Village: <strong>{task.patientVillage}</strong> • Mobile: <strong>{task.phone}</strong>
              </p>

              <div className="mt-3 p-3 bg-[#FAF9F6] border border-stone-200 rounded-2xl text-xs space-y-1">
                <span className="text-[10px] font-bold text-stone-500 uppercase block">Clinical Mandate:</span>
                <p className="text-stone-800 leading-relaxed font-medium">{task.reason}</p>
                <p className="text-[11px] text-emerald-800 font-semibold pt-1 border-t border-stone-200">
                  Assigned ASHA: {task.assignedAshaName} • Due: {task.dueDate}
                </p>
              </div>

              {task.status === 'completed' && (
                <div className="mt-3 p-3 bg-emerald-100/70 rounded-2xl text-xs text-emerald-950">
                  <span className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Completed Visit Verified</span>
                  </span>
                  <p className="text-[11px] text-stone-700 mt-0.5">{task.lastVisitNotes}</p>
                </div>
              )}
            </div>

            {/* Complete Visit Modal / Action */}
            <div className="mt-4 pt-3 border-t border-stone-200">
              {activeTaskId === task.id ? (
                <div className="space-y-3 bg-stone-50 p-3 rounded-2xl border border-stone-300">
                  <span className="text-xs font-bold text-stone-900 block">
                    Record Home Visit Outcome:
                  </span>

                  <input
                    type="text"
                    value={homeBp}
                    onChange={e => setHomeBp(e.target.value)}
                    placeholder="Home BP (e.g. 128/82)"
                    className="w-full text-xs p-2 bg-white border border-stone-300 rounded-xl"
                  />

                  <textarea
                    rows={2}
                    value={visitNotes}
                    onChange={e => setVisitNotes(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-stone-300 rounded-xl"
                  />

                  <label className="flex items-center gap-2 text-xs text-stone-700">
                    <input
                      type="checkbox"
                      checked={adherenceOk}
                      onChange={e => setAdherenceOk(e.target.checked)}
                      className="w-4 h-4 text-emerald-700 rounded"
                    />
                    <span>Medication adherence confirmed</span>
                  </label>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleComplete(task)}
                      className="px-3 py-1.5 bg-[#164E43] text-white text-xs font-bold rounded-xl"
                    >
                      Save &amp; Complete (Continuity 5/5)
                    </button>
                    <button
                      onClick={() => setActiveTaskId(null)}
                      className="text-xs text-stone-500 hover:text-stone-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : task.status !== 'completed' ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTaskId(task.id)}
                    className="flex-1 py-2 bg-[#164E43] hover:bg-[#123e35] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Complete Home Visit</span>
                  </button>

                  <button
                    onClick={() => triggerEmergencyEscalation(task.patientId, `Condition deteriorating at home: ${task.reason}`)}
                    className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-xs font-bold"
                    title="Escalate Worsening Condition to Medical Officer"
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center text-[11px] text-emerald-800 font-bold">
                  ✓ Continuum Closed • Longitudinal Record Updated
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
