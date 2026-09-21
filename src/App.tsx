import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './services/store';
import { Navbar } from './components/layout/Navbar';
import { NavigationTabs, TabId } from './components/layout/NavigationTabs';
import { DemoScenarioBanner } from './components/common/DemoScenarioBanner';
import { LandingPage } from './features/landing/LandingPage';
import { PatientDashboard } from './features/patient/PatientDashboard';
import { FrontlineDashboard } from './features/frontline/FrontlineDashboard';
import { DoctorConsultationDesk } from './features/doctor/DoctorConsultationDesk';
import { QueueManager } from './features/queue/QueueManager';
import { ReferralTracker } from './features/referral/ReferralTracker';
import { DiagnosticTracker } from './features/diagnostics/DiagnosticTracker';
import { MedicineFinder } from './features/medicines/MedicineFinder';
import { FollowUpManager } from './features/followup/FollowUpManager';
import { DistrictAnalytics } from './features/analytics/DistrictAnalytics';
import { AuditLogViewer } from './features/audit/AuditLogViewer';
import { DemoControlPanel } from './features/demo/DemoControlPanel';
import { Activity, ShieldCheck, PhoneCall, Building2 } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { currentUser, demoScenarioStep } = useApp();
  const [activeTab, setActiveTab] = useState<TabId>('landing');

  // When switching role, adapt default landing tab
  useEffect(() => {
    if (activeTab === 'landing') return; // preserve landing if user chose it
    if (currentUser.role === 'patient') {
      setActiveTab('dashboard');
    } else if (currentUser.role === 'asha') {
      setActiveTab('dashboard');
    } else if (currentUser.role === 'doctor') {
      setActiveTab('consultation');
    } else if (currentUser.role === 'facility') {
      setActiveTab('queue');
    } else if (currentUser.role === 'admin') {
      setActiveTab('analytics');
    }
  }, [currentUser.role]);

  // Render view
  const renderView = () => {
    switch (activeTab) {
      case 'landing':
        return <LandingPage setActiveTab={setActiveTab} />;
      case 'dashboard':
        if (currentUser.role === 'patient') {
          return <PatientDashboard setActiveTab={setActiveTab} />;
        } else if (currentUser.role === 'doctor') {
          return <DoctorConsultationDesk setActiveTab={setActiveTab} />;
        } else if (currentUser.role === 'admin') {
          return <DistrictAnalytics />;
        } else {
          return <FrontlineDashboard setActiveTab={setActiveTab} initialMode="dashboard" />;
        }
      case 'register':
        return <FrontlineDashboard setActiveTab={setActiveTab} initialMode="register" />;
      case 'triage':
        return <FrontlineDashboard setActiveTab={setActiveTab} initialMode="triage" />;
      case 'consultation':
        return <DoctorConsultationDesk setActiveTab={setActiveTab} />;
      case 'queue':
        return <QueueManager />;
      case 'referrals':
        return <ReferralTracker />;
      case 'diagnostics':
        return <DiagnosticTracker />;
      case 'medicines':
        return <MedicineFinder />;
      case 'followups':
        return <FollowUpManager />;
      case 'analytics':
        return <DistrictAnalytics />;
      case 'audit':
        return <AuditLogViewer />;
      case 'demopanel':
        return <DemoControlPanel setActiveTab={setActiveTab} />;
      default:
        return <LandingPage setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-950">
      {/* SIH Judge Demo Sequence Banner */}
      <DemoScenarioBanner />

      {/* Main Navigation Header */}
      <Navbar />

      {/* Role-Adaptive Navigation Tabs */}
      <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 pt-6">
        {renderView()}
      </main>

      {/* Government & Public Health Footer */}
      <footer className="bg-[#123E35] text-emerald-100 text-xs border-t-2 border-emerald-900 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-emerald-800/80">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-amber-400">
                  <Activity className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-base text-white tracking-tight">
                  साथी केअर (Saathi Care)
                </span>
              </div>
              <p className="text-xs text-emerald-200/90 leading-relaxed">
                Connected care. Closer to home. Integrated public health access and care continuity platform for rural Maharashtra.
              </p>
            </div>

            <div>
              <p className="font-bold text-white uppercase text-[11px] tracking-wider mb-2">
                SIH 2026 Submission
              </p>
              <p className="text-emerald-200 text-xs">Problem Statement ID: <strong>26133</strong></p>
              <p className="text-emerald-200 text-xs">Theme: MedTech / BioTech / HealthTech</p>
              <p className="text-emerald-200 text-xs">Department: Maharashtra State Innovation Society</p>
            </div>

            <div>
              <p className="font-bold text-white uppercase text-[11px] tracking-wider mb-2">
                Core Differentiators
              </p>
              <ul className="space-y-1 text-xs text-emerald-200">
                <li>• Offline-First PWA Sync Engine</li>
                <li>• Real-Time Inter-Facility Referral Pass</li>
                <li>• Care Continuity Score (5 Stages)</li>
                <li>• Server-Side Gemini Clinical Copilot</li>
              </ul>
            </div>

            <div>
              <p className="font-bold text-white uppercase text-[11px] tracking-wider mb-2">
                Public Emergency Helplines
              </p>
              <p className="text-emerald-200 text-xs">Ambulance Dispatch: <strong className="text-white">108 (Toll-Free)</strong></p>
              <p className="text-emerald-200 text-xs">Health Information: <strong className="text-white">104 (24x7)</strong></p>
              <p className="text-emerald-200 text-xs">Pune District Health Office: <strong className="text-white">020-26120001</strong></p>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-emerald-300">
            <p>© 2026 Saathi Care. Developed for Smart India Hackathon (SIH 2026) • Government of Maharashtra.</p>
            <p className="font-mono text-amber-300">AI-assisted — final decision remains with the healthcare professional.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
