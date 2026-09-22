import React from 'react';
import { Play, RotateCcw, ChevronRight, ChevronLeft, Sparkles, CheckCircle, Activity } from 'lucide-react';
import { useApp } from '../../services/store';
import { BrandLogo } from './BrandLogo';

export const DemoScenarioBanner: React.FC = () => {
  const { demoScenarioStep, runDemoStep, resetAllData } = useApp();

  const steps = [
    { num: 1, label: 'ASHA Login & Patient Selection', role: 'Frontline ASHA Worker', desc: 'ASHA opens patient Ramesh Patil in Village Shirur' },
    { num: 2, label: 'Digital Triage & Vitals', role: 'ASHA Worker', desc: 'Captures BP 156/98, SpO2 96%, runs Saathi AI triage' },
    { num: 3, label: 'Book PHC Consultation Queue', role: 'ASHA Worker', desc: 'Issues Token #A003 with live waiting time estimate' },
    { num: 4, label: 'Doctor Consultation Desk', role: 'Medical Officer', desc: 'Reviews longitudinal health timeline & symptoms' },
    { num: 5, label: 'Point-of-Care Diagnostic', role: 'Medical Officer', desc: 'Doctor orders 12-lead ECG & Renal profile' },
    { num: 6, label: 'Inter-Facility Referral', role: 'Medical Officer', desc: 'Dispatches referral to Aundh District Hospital' },
    { num: 7, label: 'District Hospital Acceptance', role: 'Facility Staff', desc: 'Receiving hospital reviews case and accepts' },
    { num: 8, label: 'Appointment Slot Scheduled', role: 'Facility Staff', desc: 'Allocates specialist slot for 24 Sept 11:30 AM' },
    { num: 9, label: 'Diagnostic Result Linked', role: 'Facility / Lab', desc: 'ECG strain result uploaded and linked to timeline' },
    { num: 10, label: 'Medicine Stock Verified', role: 'Facility Pharmacy', desc: 'Checks Amlodipine availability in public dispensary' },
    { num: 11, label: 'Citizen Portal Confirmation', role: 'Patient / Citizen', desc: 'Patient views live timeline & appointment pass' },
    { num: 12, label: 'ASHA Community Follow-up', role: 'ASHA Worker', desc: 'Home visit completed; Care Continuity Score reaches 5/5!' },
  ];

  const current = steps.find(s => s.num === demoScenarioStep) || steps[0];

  return (
    <div className="bg-[#164E43] text-white border-b-2 border-amber-500 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Badge & Title */}
          <div className="flex items-center gap-2.5">
            <div className="bg-white/10 border border-white/20 px-2 py-1 rounded-lg shrink-0 flex items-center gap-1.5 text-xs">
              <BrandLogo size="xs" variant="light" />
              <span className="text-white font-extrabold tracking-tight">SAATHI CARE</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Connected Care Continuity
                </span>
                {demoScenarioStep > 0 && (
                  <span className="text-[11px] bg-emerald-800/80 px-2 py-0.2 rounded-full border border-emerald-600/40">
                    Stage {demoScenarioStep} of 12
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-semibold text-emerald-50">
                {demoScenarioStep > 0
                  ? `${current.label} (${current.role})`
                  : 'Connecting patients, frontline health workers and public health facilities for continuous care.'}
              </p>
            </div>
          </div>

          {/* Quick Step Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 self-start lg:self-auto">
            <button
              onClick={() => runDemoStep(Math.max(1, demoScenarioStep - 1))}
              disabled={demoScenarioStep <= 1}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Previous Step"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {steps.slice(0, 6).map(s => (
              <button
                key={s.num}
                onClick={() => runDemoStep(s.num)}
                className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${
                  demoScenarioStep === s.num
                    ? 'bg-amber-400 text-stone-900 shadow-xs'
                    : demoScenarioStep > s.num
                    ? 'bg-emerald-700/80 text-emerald-200'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {s.num}
              </button>
            ))}

            <span className="text-xs text-white/40">•••</span>

            {steps.slice(6).map(s => (
              <button
                key={s.num}
                onClick={() => runDemoStep(s.num)}
                className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${
                  demoScenarioStep === s.num
                    ? 'bg-amber-400 text-stone-900 shadow-xs'
                    : demoScenarioStep > s.num
                    ? 'bg-emerald-700/80 text-emerald-200'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {s.num}
              </button>
            ))}

            <button
              onClick={() => runDemoStep(Math.min(12, (demoScenarioStep || 0) + 1))}
              className="px-3 py-1.5 rounded-lg bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1 hover:bg-amber-300 transition-colors shadow-xs cursor-pointer"
            >
              <span>{demoScenarioStep === 0 ? 'Start Care Journey' : 'Next Stage'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={resetAllData}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-200 hover:text-white transition-colors"
              title="Reset to Initial Data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {demoScenarioStep > 0 && (
          <div className="mt-2 pt-2 border-t border-emerald-800/80 text-xs text-emerald-100 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span><strong>Action:</strong> {current.desc}</span>
            </span>
            <span className="hidden md:inline-block text-[11px] text-amber-300 font-mono">
              Live State Mutated in System Registry
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
