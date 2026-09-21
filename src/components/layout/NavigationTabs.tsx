import React from 'react';
import {
  LayoutDashboard,
  UserPlus,
  Activity,
  Stethoscope,
  Users,
  Share2,
  FileSearch,
  Pill,
  ShieldAlert,
  BarChart3,
  FileText,
  Sliders,
  Home
} from 'lucide-react';
import { useApp } from '../../services/store';

export type TabId =
  | 'landing'
  | 'dashboard'
  | 'register'
  | 'triage'
  | 'consultation'
  | 'queue'
  | 'referrals'
  | 'diagnostics'
  | 'medicines'
  | 'followups'
  | 'analytics'
  | 'audit'
  | 'demopanel';

interface Props {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

export const NavigationTabs: React.FC<Props> = ({ activeTab, setActiveTab }) => {
  const { currentUser, t } = useApp();

  // Role-specific allowed and highlighted tabs
  const getTabsForRole = () => {
    switch (currentUser.role) {
      case 'patient':
        return [
          { id: 'dashboard', label: 'My Care & Timeline', icon: LayoutDashboard },
          { id: 'queue', label: 'Queue Status', icon: Users },
          { id: 'referrals', label: 'Referral Tracking', icon: Share2 },
          { id: 'diagnostics', label: 'Diagnostics', icon: FileSearch },
          { id: 'medicines', label: 'Medicine Finder', icon: Pill },
        ];
      case 'asha':
        return [
          { id: 'dashboard', label: 'ASHA Workload', icon: LayoutDashboard },
          { id: 'register', label: '+ Register Patient', icon: UserPlus },
          { id: 'triage', label: 'Digital Triage', icon: Activity },
          { id: 'queue', label: 'PHC Queue', icon: Users },
          { id: 'referrals', label: 'Pending Referrals', icon: Share2 },
          { id: 'followups', label: 'High-Risk Follow-up', icon: ShieldAlert },
        ];
      case 'doctor':
        return [
          { id: 'consultation', label: 'Consultation Desk', icon: Stethoscope },
          { id: 'queue', label: 'Patient Queue', icon: Users },
          { id: 'referrals', label: 'Referral Management', icon: Share2 },
          { id: 'diagnostics', label: 'Diagnostics Review', icon: FileSearch },
          { id: 'followups', label: 'Follow-ups Assigned', icon: ShieldAlert },
        ];
      case 'facility':
        return [
          { id: 'dashboard', label: 'Facility Workload', icon: LayoutDashboard },
          { id: 'queue', label: 'Queue Dispatcher', icon: Users },
          { id: 'referrals', label: 'Incoming Referrals', icon: Share2 },
          { id: 'diagnostics', label: 'Diagnostic Orders', icon: FileSearch },
          { id: 'medicines', label: 'Medicine Stock', icon: Pill },
        ];
      case 'admin':
        return [
          { id: 'analytics', label: 'District Command', icon: BarChart3 },
          { id: 'referrals', label: 'Referral Funnel', icon: Share2 },
          { id: 'medicines', label: 'Dispensary Stock', icon: Pill },
          { id: 'followups', label: 'Community Follow-ups', icon: ShieldAlert },
          { id: 'audit', label: 'Public Audit Log', icon: FileText },
        ];
      default:
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'queue', label: 'Queue', icon: Users },
        ];
    }
  };

  const roleTabs = getTabsForRole();

  return (
    <nav className="bg-[#FAF9F6] border-b border-stone-200 px-4 py-2 sticky top-[57px] z-30 overflow-x-auto scrollbar-none shadow-2xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setActiveTab('landing')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'landing'
                ? 'bg-[#164E43] text-white shadow-xs'
                : 'text-stone-700 hover:bg-stone-200/70'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Public Portal</span>
          </button>

          <span className="w-px h-5 bg-stone-300 mx-1"></span>

          {roleTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#164E43] text-white shadow-xs'
                    : 'text-stone-700 hover:bg-stone-200/70'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-stone-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Global Utilities */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto pl-2 border-l border-stone-300">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
              activeTab === 'audit'
                ? 'bg-[#164E43] text-white'
                : 'text-stone-600 hover:bg-stone-200/70'
            }`}
            title="Public Health Transparency Audit Logs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Audit Log</span>
          </button>

          <button
            onClick={() => setActiveTab('demopanel')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border border-amber-500/50 transition-all ${
              activeTab === 'demopanel'
                ? 'bg-amber-500 text-stone-950 font-black'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
            }`}
            title="SIH 2026 Judge Demo Control Panel"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-700" />
            <span>SIH Demo Panel</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
