import React from 'react';
import { CheckCircle2, ArrowRight, Activity, MapPin, Stethoscope, FileSearch, ShieldCheck } from 'lucide-react';
import { useApp } from '../../services/store';

interface Props {
  completedSteps: number;
  totalSteps?: number;
  lastMilestone?: string;
  patientName?: string;
}

export const CareContinuityBar: React.FC<Props> = ({
  completedSteps,
  totalSteps = 5,
  lastMilestone,
  patientName
}) => {
  const { t } = useApp();

  const steps = [
    { title: '1. Registration', icon: MapPin, desc: 'Consent & Village Enrollment' },
    { title: '2. Triage', icon: Activity, desc: 'Vitals & Risk Screening' },
    { title: '3. Consultation', icon: Stethoscope, desc: 'PHC Doctor Review' },
    { title: '4. Referral / Lab', icon: FileSearch, desc: 'Specialist Slot & Diagnostic' },
    { title: '5. Follow-up', icon: ShieldCheck, desc: 'ASHA Home Care & Outcome' },
  ];

  return (
    <div className="bg-[#FAF9F6] border-2 border-[#164E43]/20 rounded-2xl p-4 sm:p-5 shadow-xs mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#164E43] text-white text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {t('continuityScoreLabel')}
            </span>
            <h3 className="font-bold text-stone-900 text-base sm:text-lg">
              {patientName ? `${patientName}'s Continuum of Care` : 'Public Health Care Journey'}
            </h3>
          </div>
          <p className="text-xs text-stone-600 mt-0.5">
            {t('continuityScoreDesc')} • Operational completion: <span className="font-bold text-[#164E43]">{completedSteps}/{totalSteps} Stages Complete</span>
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#E6F4EA] border border-emerald-300 text-emerald-900 px-3 py-1.5 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Last Milestone: {lastMilestone || 'Under active coordination'}</span>
        </div>
      </div>

      {/* Visual Continuum Flow */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum <= completedSteps;
          const isCurrent = stepNum === completedSteps + 1;
          const Icon = step.icon;

          return (
            <div
              key={step.title}
              className={`relative p-3 rounded-xl border transition-all ${
                isCompleted
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : isCurrent
                  ? 'bg-amber-50 border-amber-400 text-amber-950 ring-2 ring-amber-400/30'
                  : 'bg-white border-stone-200 text-stone-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-amber-500 text-white'
                      : 'bg-stone-200 text-stone-500'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                {idx < steps.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-stone-400 hidden sm:block absolute -right-2 top-4 z-10 bg-white rounded-full" />
                )}
              </div>
              <p className="font-bold text-xs leading-tight">{step.title}</p>
              <p className="text-[11px] leading-tight text-stone-600 mt-0.5">{step.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Prominent Core Differentiator Callout */}
      <div className="mt-3.5 pt-2.5 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-emerald-900 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
          <span>Core Guarantee: &ldquo;The patient journey does not end at referral.&rdquo;</span>
        </div>
        <span className="text-stone-500 text-[11px]">
          Seamless data link between Village ASHA • PHC Doctor • District Specialist
        </span>
      </div>
    </div>
  );
};
