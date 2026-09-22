import React from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Activity,
  Users,
  Building2,
  Stethoscope,
  Share2,
  FileCheck2,
  HeartHandshake,
  Clock,
  Sparkles,
  WifiOff,
  Globe2,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../services/store';
import { TabId } from '../../components/layout/NavigationTabs';
import { BrandLogo } from '../../components/common/BrandLogo';

interface Props {
  setActiveTab: (tab: TabId) => void;
}

export const LandingPage: React.FC<Props> = ({ setActiveTab }) => {
  const { switchRole, t } = useApp();

  const handlePatientCta = () => {
    switchRole('patient');
    setActiveTab('dashboard');
  };

  const handleWorkerCta = () => {
    switchRole('asha');
    setActiveTab('dashboard');
  };

  const handleDoctorCta = () => {
    switchRole('doctor');
    setActiveTab('consultation');
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#164E43] via-[#123E35] to-[#0D2F28] text-white rounded-3xl p-6 sm:p-12 shadow-xl border-2 border-emerald-800/40 relative overflow-hidden">
        {/* Subtle geometric background pattern */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-emerald-500/10 pointer-events-none blur-3xl"></div>
        <div className="absolute left-1/3 -top-20 w-80 h-80 rounded-full bg-amber-400/10 pointer-events-none blur-3xl"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6">
              <BrandLogo size="xs" variant="light" />
              <span className="text-xs font-bold text-emerald-100 tracking-wide">
                Saathi Care • Connected care. Closer to home.
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15] mb-5">
              Healthcare shouldn&apos;t depend on how far you live.
            </h1>

            <p className="text-base sm:text-xl text-emerald-100 font-normal leading-relaxed mb-8 max-w-2xl">
              {t('heroSubhead')}
            </p>

            {/* Action CTAs */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                onClick={handlePatientCta}
                className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-sm sm:text-base cursor-pointer"
              >
                <span>{t('getCareCta')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleWorkerCta}
                className="px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold rounded-2xl transition-all flex items-center gap-2 text-sm sm:text-base cursor-pointer"
              >
                <Users className="w-4 h-4 text-emerald-300" />
                <span>{t('workerLoginCta')}</span>
              </button>

              <button
                onClick={handleDoctorCta}
                className="px-4 py-3.5 text-emerald-200 hover:text-white font-semibold text-xs sm:text-sm underline underline-offset-4 cursor-pointer"
              >
                Medical Officer Consultation Desk →
              </button>
            </div>
          </div>

          <div className="hidden lg:flex flex-col items-center justify-center p-8 rounded-3xl bg-white/5 border border-white/15 backdrop-blur-md max-w-xs shrink-0 text-center">
            <BrandLogo size="2xl" variant="light" className="mb-4" />
            <span className="font-extrabold text-xl text-white tracking-tight">Saathi Care</span>
            <p className="text-xs text-emerald-200 mt-1">Connected care. Closer to home.</p>
            <div className="mt-4 pt-4 border-t border-white/10 w-full flex items-center justify-around text-[11px] text-emerald-300">
              <span>PHC Grid</span>
              <span>•</span>
              <span>Offline PWA</span>
              <span>•</span>
              <span>AI Triage</span>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Continuum Flow: The 7-Step Last-Mile Journey */}
      <section className="bg-white border-2 border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="max-w-2xl mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-[#164E43] bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
            Care Continuity Model
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 mt-2">
            The Patient Journey Does Not End at Referral
          </h2>
          <p className="text-sm text-stone-600 mt-1">
            Bridging the historic drop-off between primary health centers, tertiary specialist hospitals, and community re-engagement.
          </p>
        </div>

        {/* Responsive Flow Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 relative">
          {[
            { step: '01', title: t('flow_step1'), subtitle: 'Rural Villager', icon: Users, color: 'bg-stone-100 text-stone-800' },
            { step: '02', title: t('flow_step2'), subtitle: 'ASHA Worker', icon: HeartHandshake, color: 'bg-emerald-100 text-emerald-900' },
            { step: '03', title: t('flow_step3'), subtitle: 'Primary Clinic', icon: Building2, color: 'bg-teal-100 text-teal-900' },
            { step: '04', title: t('flow_step4'), subtitle: 'Medical Officer', icon: Stethoscope, color: 'bg-emerald-700 text-white' },
            { step: '05', title: t('flow_step5'), subtitle: 'District Hospital', icon: Share2, color: 'bg-amber-100 text-amber-900' },
            { step: '06', title: t('flow_step6'), subtitle: 'Dispensary Stock', icon: FileCheck2, color: 'bg-cyan-100 text-cyan-900' },
            { step: '07', title: t('flow_step7'), subtitle: 'Home Visit Closed', icon: ShieldCheck, color: 'bg-emerald-600 text-white' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="bg-[#FAF9F6] border border-stone-200 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500 transition-all hover:shadow-xs"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono font-bold text-stone-400">{item.step}</span>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${item.color} shadow-2xs`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-stone-900 leading-tight">{item.title}</h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">{item.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Operational Impact Metrics */}
      <section className="bg-[#FAF9F6] border-2 border-stone-200 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-xl font-bold text-stone-900">
              Operational Performance & Access Indicators
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Integrated public health telemetry for Shirur & Ambegaon Talukas, Pune District
            </p>
          </div>
          <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full border border-emerald-300 self-start sm:self-auto">
            Connected Care Telemetry
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
            <div className="flex items-center gap-1.5 text-stone-500 text-xs font-semibold mb-1">
              <Clock className="w-3.5 h-3.5 text-emerald-700" />
              <span>{t('metric_wait')}</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#164E43]">18 mins</p>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">↓ 68% vs uncoordinated OPD</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
            <div className="flex items-center gap-1.5 text-stone-500 text-xs font-semibold mb-1">
              <Share2 className="w-3.5 h-3.5 text-teal-700" />
              <span>{t('metric_referral')}</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#164E43]">88.4%</p>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">↑ Zero lost paper slips</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
            <div className="flex items-center gap-1.5 text-stone-500 text-xs font-semibold mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>{t('metric_followup')}</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#164E43]">92.1%</p>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">ASHA home verification</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
            <div className="flex items-center gap-1.5 text-stone-500 text-xs font-semibold mb-1">
              <Activity className="w-3.5 h-3.5 text-amber-700" />
              <span>{t('metric_medicine')}</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#164E43]">89.2%</p>
            <p className="text-[11px] text-stone-600 font-medium mt-1">Real-time PHC inventory</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs col-span-2 lg:col-span-1">
            <div className="flex items-center gap-1.5 text-stone-500 text-xs font-semibold mb-1">
              <Users className="w-3.5 h-3.5 text-emerald-700" />
              <span>{t('metric_assisted')}</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#164E43]">1,248</p>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">Enrolled across 14 villages</p>
          </div>
        </div>
      </section>

      {/* Core Innovation Pillars */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border-2 border-stone-200 rounded-3xl p-6 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-4 border border-emerald-200">
            <WifiOff className="w-6 h-6 text-[#164E43]" />
          </div>
          <h3 className="font-extrabold text-lg text-stone-900 mb-2">
            Designed for the Last Mile
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Offline-first PWA architecture with local IndexedDB caching. Frontline workers can register patients and record vitals in remote hamlets without cellular data, auto-syncing when connectivity resumes.
          </p>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Zero local data loss guarantee</span>
          </div>
        </div>

        <div className="bg-white border-2 border-stone-200 rounded-3xl p-6 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center mb-4 border border-amber-200">
            <Sparkles className="w-6 h-6 text-amber-700" />
          </div>
          <h3 className="font-extrabold text-lg text-stone-900 mb-2">
            Saathi AI Public Health Copilot
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Safe, assistive decision support. Powered by Gemini, Saathi AI flags triage urgency, explains diagnoses in plain layman language, and prepares structured referral briefs while always keeping clinicians responsible.
          </p>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-2 text-xs font-semibold text-amber-900">
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
            <span>Clinician-in-the-loop safety protocol</span>
          </div>
        </div>

        <div className="bg-white border-2 border-stone-200 rounded-3xl p-6 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center mb-4 border border-teal-200">
            <Globe2 className="w-6 h-6 text-[#164E43]" />
          </div>
          <h3 className="font-extrabold text-lg text-stone-900 mb-2">
            Multilingual by Design
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Native multilingual interface in Marathi (मराठी), Hindi (हिंदी), and English. Automated cross-translation allows patients to express symptoms in their mother tongue while doctors receive concise clinical summaries.
          </p>
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center gap-2 text-xs font-semibold text-teal-800">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            <span>Tailored for rural Maharashtra</span>
          </div>
        </div>
      </section>

      {/* Public Facilities Network Directory */}
      <section className="bg-white border-2 border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl font-black text-stone-900">
              Connected Public Healthcare Facilities
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Integrated primary, secondary, and tertiary public health institutions in the care continuity network
            </p>
          </div>
          <button
            onClick={() => {
              switchRole('facility');
              setActiveTab('dashboard');
            }}
            className="text-xs font-bold text-[#164E43] bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors"
          >
            Manage Facility Desk →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'Shirur Primary Health Centre', type: 'Rural PHC', taluka: 'Shirur', doctors: 2, queue: 14, ambulance: true, level: 'Normal' },
            { name: 'Manchar Community Health Centre', type: 'CHC (Secondary)', taluka: 'Ambegaon', doctors: 4, queue: 28, ambulance: true, level: 'Normal' },
            { name: 'Baramati Sub-District Hospital', type: 'Sub-District Hospital', taluka: 'Baramati', doctors: 8, queue: 62, ambulance: true, level: 'High' },
            { name: 'Aundh District Hospital', type: 'District Hospital', taluka: 'Pune City', doctors: 18, queue: 140, ambulance: true, level: 'High' },
            { name: 'District Public Health Lab', type: 'Diagnostic Centre', taluka: 'Pune City', doctors: 3, queue: 35, ambulance: false, level: 'Normal' },
          ].map(fac => (
            <div key={fac.name} className="p-4 rounded-2xl border border-stone-200 bg-[#FAF9F6]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase bg-stone-200 text-stone-800 px-2 py-0.5 rounded">
                  {fac.type}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  fac.level === 'Normal' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'
                }`}>
                  {fac.level} Workload
                </span>
              </div>
              <h3 className="font-bold text-sm text-stone-900">{fac.name}</h3>
              <p className="text-xs text-stone-500 mt-0.5">Taluka: {fac.taluka}</p>

              <div className="mt-3 pt-2.5 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
                <span>Doctors: <strong>{fac.doctors}</strong></span>
                <span>Queue: <strong>{fac.queue}</strong></span>
                <span>Ambulance: <strong className={fac.ambulance ? 'text-emerald-700' : 'text-stone-400'}>{fac.ambulance ? 'Available' : 'No'}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
