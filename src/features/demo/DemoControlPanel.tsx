import React from 'react';
import {
  Play,
  RotateCcw,
  Sparkles,
  WifiOff,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Award,
  Layers,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../services/store';
import { TabId } from '../../components/layout/NavigationTabs';

interface Props {
  setActiveTab: (tab: TabId) => void;
}

export const DemoControlPanel: React.FC<Props> = ({ setActiveTab }) => {
  const {
    demoScenarioStep,
    runDemoStep,
    resetAllData,
    toggleOffline,
    isOffline,
    triggerEmergencyEscalation,
    switchRole,
    currentUser,
    patients,
    referrals,
    diagnostics,
    followUps
  } = useApp();

  const demoSteps = [
    {
      step: 1,
      title: 'Frontline ASHA Worker Login & Village Patient Search',
      persona: 'ASHA Worker (Sunita Tai Gavade)',
      tabTarget: 'dashboard' as TabId,
      problem: 'Rural patients live far from hospitals and often avoid visiting due to long queues and uncertainty.',
      solution: 'Frontline ASHA worker opens Saathi Care on an affordable tablet/phone in the village to register and assist the patient locally.',
      actionNote: 'Switches to ASHA role; opens patient Ramesh Patil with his digital consent records.'
    },
    {
      step: 2,
      title: 'Assisted Digital Triage & Physiological Vitals Recording',
      persona: 'ASHA Worker',
      tabTarget: 'triage' as TabId,
      problem: 'Paramedical workers often lack structured tools to decide when a patient needs urgent medical escalation.',
      solution: 'Digital Triage captures BP (156/98), SpO2 (96%), and symptoms, then runs Saathi AI triage to stratify clinical risk into Urgent.',
      actionNote: 'Records vitals; runs Gemini public health triage with explicit clinical safety disclaimer.'
    },
    {
      step: 3,
      title: 'Queue Token Issued with Live Waiting Time Estimate',
      persona: 'ASHA Worker / Patient',
      tabTarget: 'queue' as TabId,
      problem: 'Rural patients travel 2 hours to the PHC only to wait 4 hours in chaotic corridors without knowing when they will be seen.',
      solution: 'Live OPD Queue issues Token #A003 and computes real-time estimated wait time (~18 mins).',
      actionNote: 'Allocates token; queues patient in Shirur Primary Health Centre database.'
    },
    {
      step: 4,
      title: 'Primary Health Centre Doctor Consultation Desk',
      persona: 'Medical Officer (Dr. Anand Kulkarni)',
      tabTarget: 'consultation' as TabId,
      problem: 'Medical officers have 3 minutes per patient and no access to village triage vitals or prior health history.',
      solution: 'Doctor Consultation Desk unifies longitudinal timeline, ASHA vitals, and medication stock in a single cohesive view.',
      actionNote: 'Switches to Doctor role; opens patient examination notes.'
    },
    {
      step: 5,
      title: 'Point-of-Care Diagnostic Test Ordered',
      persona: 'Medical Officer',
      tabTarget: 'diagnostics' as TabId,
      problem: 'Diagnostic tests are delayed and paper results are frequently lost during patient travel.',
      solution: 'Doctor orders 12-lead ECG & Renal profile directly; system routes sample collection token to the facility lab.',
      actionNote: 'Dispatches lab order and attaches order timestamp to patient timeline.'
    },
    {
      step: 6,
      title: 'Inter-Facility Referral Dispatched to District Hospital',
      persona: 'Medical Officer',
      tabTarget: 'referrals' as TabId,
      problem: 'Patients referred to tertiary hospitals carry unstructured paper slips that get rejected or lost; 65% drop out of care.',
      solution: 'Structured Inter-Facility Referral pass generated with provisional diagnosis, priority, and 102 transport request.',
      actionNote: 'Dispatches referral to Aundh District Hospital with Saathi AI clinical summary.'
    },
    {
      step: 7,
      title: 'District Hospital Receiving Desk Acceptance',
      persona: 'Facility Staff Desk',
      tabTarget: 'referrals' as TabId,
      problem: 'Patients arrive at crowded tertiary hospitals without advance notification, leading to re-triage delays.',
      solution: 'Receiving hospital desk reviews digital transfer pass in advance and accepts the case.',
      actionNote: 'Switches to Facility Desk; moves referral state from "Sent" to "Accepted".'
    },
    {
      step: 8,
      title: 'Specialist Slot Allocated with Date & Time',
      persona: 'Facility Staff Desk',
      tabTarget: 'referrals' as TabId,
      problem: 'Patients queue from 6 AM only to find the specialist is on leave or out of OPD quotas.',
      solution: 'District Hospital allocates a guaranteed specialist slot (e.g. 24 Sept 11:30 AM); patient notified immediately.',
      actionNote: 'Sets appointment date & time; triggers SMS and in-app alert.'
    },
    {
      step: 9,
      title: 'Diagnostic Test Results Uploaded & Linked to Timeline',
      persona: 'Diagnostic Lab',
      tabTarget: 'diagnostics' as TabId,
      problem: 'Tertiary doctors repeat expensive tests because primary clinic results are not digitized.',
      solution: 'ECG strain & renal profile findings uploaded directly into the patient longitudinal health timeline.',
      actionNote: 'Attaches validated findings and marks diagnostic order as "Result Available".'
    },
    {
      step: 10,
      title: 'Real-Time PHC Pharmacy & Medicine Stock Verification',
      persona: 'Dispensary Staff',
      tabTarget: 'medicines' as TabId,
      problem: 'Patients are prescribed medicines that are out of stock in public dispensaries, forcing out-of-pocket private spending.',
      solution: 'Real-time formulary inventory shows 410 units of Amlodipine available; provides generic substitutions if low.',
      actionNote: 'Verifies stock availability and updates live inventory count.'
    },
    {
      step: 11,
      title: 'Citizen Portal Confirmation & Digital Pass',
      persona: 'Citizen / Patient (Ramesh Patil)',
      tabTarget: 'dashboard' as TabId,
      problem: 'Patients feel helpless and uninformed regarding their referral appointment and test results.',
      solution: 'Citizen Dashboard displays appointment time, scannable referral pass, and complete longitudinal timeline in Marathi.',
      actionNote: 'Switches to Patient role; shows confirmed referral pass and queue history.'
    },
    {
      step: 12,
      title: 'ASHA Home Follow-up & Care Continuity Loop Closure (5/5)',
      persona: 'Frontline ASHA Worker',
      tabTarget: 'followups' as TabId,
      problem: 'After hospital discharge, no one checks if the rural patient is taking medication or experiencing complications.',
      solution: 'Automatic post-referral task assigned to village ASHA; home visit conducted; Care Continuity Score reaches 5/5!',
      actionNote: 'ASHA records home BP and compliance; marks complete; loop closed!'
    }
  ];

  const currentStepData = demoSteps.find(s => s.step === demoScenarioStep) || demoSteps[0];

  const handleStepJump = (stepNum: number) => {
    runDemoStep(stepNum);
    const stepObj = demoSteps.find(s => s.step === stepNum);
    if (stepObj) {
      setActiveTab(stepObj.tabTarget);
    }
  };

  const handleEmergencySimulate = () => {
    triggerEmergencyEscalation('pat-001', 'Simulated 108 Emergency: Patient experiencing severe chest pain and breathlessness in remote hamlet.');
    alert('Simulated Emergency Escalation Triggered! 108 Ambulance alert and Medical Officer priority notification created.');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-[#164E43] text-white rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-amber-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-400 text-stone-950 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2">
              <Award className="w-4 h-4" />
              <span>SIH 2026 Judge Presentation Command</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Interactive Care Continuity Demonstration Flow
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-2xl">
              Execute the complete 12-stage patient journey with real, live database mutations. Observe how Saathi Care ensures the patient journey never ends at referral.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetAllData}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
              <span>Reset Demo State</span>
            </button>
          </div>
        </div>

        {/* Quick Simulation Bar */}
        <div className="mt-6 pt-5 border-t border-emerald-800/80 flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold uppercase text-amber-300">Live Stress Simulators:</span>

          <button
            onClick={toggleOffline}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isOffline
                ? 'bg-rose-500 text-white'
                : 'bg-white/10 text-emerald-100 hover:bg-white/20'
            }`}
          >
            <WifiOff className="w-3.5 h-3.5" />
            <span>{isOffline ? 'Offline Mode Active' : 'Simulate Low Connectivity'}</span>
          </button>

          <button
            onClick={handleEmergencySimulate}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
            <span>Simulate 108 Emergency Escalation</span>
          </button>
        </div>
      </div>

      {/* Active Step Presentation Card */}
      <div className="bg-white border-2 border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
          <div>
            <span className="text-xs font-bold uppercase bg-amber-100 text-amber-900 px-3 py-1 rounded-full">
              Step {demoScenarioStep > 0 ? demoScenarioStep : 1} of 12 • Active Clinical Narrative
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 mt-2">
              {currentStepData.title}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Demonstrated Persona: <strong className="text-[#164E43]">{currentStepData.persona}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStepJump(Math.max(1, (demoScenarioStep || 1) - 1))}
              disabled={demoScenarioStep <= 1}
              className="p-2 bg-stone-100 hover:bg-stone-200 disabled:opacity-30 rounded-xl text-stone-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleStepJump(Math.min(12, (demoScenarioStep || 0) + 1))}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>{demoScenarioStep === 0 ? 'Start Demonstration' : 'Next Step →'}</span>
            </button>
          </div>
        </div>

        {/* Problem vs Solution Comparison for Judges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl">
            <span className="font-bold text-rose-900 uppercase text-[10px] block mb-1">
              Rural Healthcare Bottleneck (Current Reality):
            </span>
            <p className="text-stone-800 leading-relaxed font-medium">
              {currentStepData.problem}
            </p>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl">
            <span className="font-bold text-emerald-950 uppercase text-[10px] block mb-1">
              Saathi Care Innovation (The Solution):
            </span>
            <p className="text-stone-800 leading-relaxed font-medium">
              {currentStepData.solution}
            </p>
          </div>
        </div>

        {/* Presenter Speaking Cue */}
        <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-stone-700 block">Presenter Action Note:</span>
            <p className="text-stone-600 mt-0.5">{currentStepData.actionNote}</p>
          </div>

          <button
            onClick={() => setActiveTab(currentStepData.tabTarget)}
            className="px-4 py-2 bg-[#164E43] hover:bg-[#123e35] text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors shrink-0"
          >
            <span>Open Target View</span>
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>
      </div>

      {/* 12-Step Grid for Instant Jumping */}
      <div className="bg-white border-2 border-stone-200 rounded-3xl p-6 shadow-xs">
        <h3 className="text-base font-black text-stone-900 mb-4">
          All 12 Continuum Stages (Click any card to jump and simulate):
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {demoSteps.map(s => {
            const isCurrent = (demoScenarioStep || 1) === s.step;
            const isPassed = (demoScenarioStep || 1) > s.step;
            return (
              <div
                key={s.step}
                onClick={() => handleStepJump(s.step)}
                className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all ${
                  isCurrent
                    ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/40 shadow-xs'
                    : isPassed
                    ? 'bg-emerald-50/70 border-emerald-300'
                    : 'bg-[#FAF9F6] border-stone-200 hover:border-stone-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                    isCurrent ? 'bg-amber-400 text-stone-950' : isPassed ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-700'
                  }`}>
                    {s.step}
                  </span>
                  <span className="text-[10px] font-semibold text-stone-500 uppercase">
                    {s.persona.split(' ')[0]}
                  </span>
                </div>

                <h4 className="font-extrabold text-stone-900 text-sm mt-1 leading-tight">
                  {s.title}
                </h4>
                <p className="text-stone-600 text-[11px] mt-1 leading-snug line-clamp-2">
                  {s.solution}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
