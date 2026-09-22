import React, { useState } from 'react';
import {
  Activity,
  Globe,
  Wifi,
  WifiOff,
  RefreshCw,
  Bell,
  AlertTriangle,
  UserCheck,
  ChevronDown,
  Phone,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { useApp, demoUsers } from '../../services/store';
import { UserRole, LanguageCode } from '../../types';
import { EmergencyModal } from '../common/EmergencyModal';
import { BrandLogo } from '../common/BrandLogo';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    switchRole,
    language,
    setLanguage,
    t,
    firebaseUser,
    signInWithGoogle,
    signOutUser,
    authLoading,
    isOffline,
    toggleOffline,
    isSyncing,
    offlineQueue,
    syncOfflineQueue,
    isLiveConnected,
    dataSource,
    isDemoPersona,
    notifications,
    markNotificationRead
  } = useApp();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const roles: { role: UserRole; title: string; subtitle: string }[] = [
    { role: 'asha', title: 'ASHA Frontline Worker', subtitle: 'Sunita Tai • Village Circle' },
    { role: 'doctor', title: 'Medical Officer (Doctor)', subtitle: 'Dr. Anand Kulkarni • Shirur PHC' },
    { role: 'patient', title: 'Citizen / Patient', subtitle: 'Ramesh Patil • Shirur Rural' },
    { role: 'facility', title: 'Facility Staff Desk', subtitle: 'District Hospital / PHC Desk' },
    { role: 'admin', title: 'District Health Officer', subtitle: 'Dr. Vandana Rao • Pune District' },
  ];

  return (
    <>
      {/* Top System Status Ribbon */}
      <div className="bg-[#0F362E] text-emerald-100 text-[11px] py-1 px-4 border-b border-emerald-900/50">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Public Healthcare • Connected Care Platform</span>
            
            {/* Live Data Source Indicator */}
            {dataSource === 'live' ? (
              <span className="inline-flex items-center gap-1 bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 px-2 py-0.2 rounded text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live Firestore Sync</span>
              </span>
            ) : dataSource === 'offline' ? (
              <span className="inline-flex items-center gap-1 bg-rose-950/80 text-rose-300 border border-rose-800/60 px-2 py-0.2 rounded text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                <span>Offline Storage • {offlineQueue.length} Queued</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-amber-950/80 text-amber-300 border border-amber-800/60 px-2 py-0.2 rounded text-[10px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span>Cached Local Snapshot</span>
              </span>
            )}

            {/* Demo Persona Indicator */}
            {isDemoPersona && (
              <span className="hidden sm:inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider">
                Demo Persona Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline-block text-emerald-300">
              Helpline: <strong>104</strong> | Ambulance: <strong>108</strong>
            </span>
            <span className="bg-emerald-900/60 text-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold border border-emerald-700/50">
              Continuous Care Network
            </span>
          </div>
        </div>
      </div>

      {/* Main App Navigation Bar */}
      <header className="bg-[#FAF9F6] border-b-2 border-stone-300 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Logo & Identity */}
          <BrandLogo
            size="md"
            showWordmark={true}
            showTagline={true}
            taglineText={t('tagline') || 'Connected care. Closer to home.'}
            badge="Public Health"
          />

          {/* Right Action Bar Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Connectivity / Offline Toggle Pill */}
            <div className="flex items-center">
              <button
                onClick={toggleOffline}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  isOffline
                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                }`}
                title="Click to toggle between Online and Rural Offline Mode"
              >
                {isOffline ? (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-rose-600" />
                    <span>{t('offline')}</span>
                    {offlineQueue.length > 0 && (
                      <span className="bg-rose-200 text-rose-900 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                        {offlineQueue.length}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">{t('online')}</span>
                  </>
                )}
              </button>

              {isOffline && offlineQueue.length > 0 && (
                <button
                  onClick={syncOfflineQueue}
                  disabled={isSyncing}
                  className="ml-1 p-1.5 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 rounded-lg text-xs flex items-center gap-1"
                  title="Sync local records"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span className="text-[11px] font-bold hidden md:inline">
                    {isSyncing ? t('syncing') : 'Sync Now'}
                  </span>
                </button>
              )}
            </div>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-stone-300 hover:border-stone-400 rounded-lg text-xs font-semibold text-stone-800 transition-colors shadow-2xs"
              >
                <Globe className="w-3.5 h-3.5 text-stone-500" />
                <span className="uppercase font-bold">{language}</span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-36 bg-white border border-stone-300 rounded-xl shadow-lg p-1.5 z-50 text-xs">
                  <button
                    onClick={() => { setLanguage('en'); setLangMenuOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center justify-between ${language === 'en' ? 'bg-[#164E43] text-white font-bold' : 'hover:bg-stone-100 text-stone-800'}`}
                  >
                    <span>English</span>
                    <span className="text-[10px] opacity-70">EN</span>
                  </button>
                  <button
                    onClick={() => { setLanguage('mr'); setLangMenuOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center justify-between ${language === 'mr' ? 'bg-[#164E43] text-white font-bold' : 'hover:bg-stone-100 text-stone-800'}`}
                  >
                    <span>मराठी</span>
                    <span className="text-[10px] opacity-70">MR</span>
                  </button>
                  <button
                    onClick={() => { setLanguage('hi'); setLangMenuOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center justify-between ${language === 'hi' ? 'bg-[#164E43] text-white font-bold' : 'hover:bg-stone-100 text-stone-800'}`}
                  >
                    <span>हिंदी</span>
                    <span className="text-[10px] opacity-70">HI</span>
                  </button>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifMenuOpen(!notifMenuOpen)}
                className="p-2 bg-white border border-stone-300 hover:border-stone-400 rounded-lg text-stone-700 relative shadow-2xs"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-80 sm:w-96 bg-white border border-stone-300 rounded-xl shadow-xl p-3 z-50">
                  <div className="flex items-center justify-between border-b pb-2 mb-2">
                    <span className="font-bold text-xs text-stone-900 uppercase">Public Health Alerts</span>
                    <span className="text-[11px] text-stone-500">{notifications.length} updates</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {notifications.slice(0, 5).map(n => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                          n.read ? 'bg-stone-50 border-stone-200 text-stone-600' : 'bg-amber-50/70 border-amber-200 text-amber-950 font-medium'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-bold">{n.title}</p>
                          <span className="text-[10px] text-stone-400">{n.timestamp}</span>
                        </div>
                        <p className="text-[11px] mt-1 text-stone-700">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Emergency Escalation Button */}
            <button
              onClick={() => setEmergencyModalOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              title="Trigger Priority Emergency Escalation"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">108 SOS</span>
            </button>

            {/* Role Switcher Dropdown (Crucial for testing all 5 personas) */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#164E43] text-white hover:bg-[#123e35] rounded-xl text-xs font-bold transition-all shadow-xs border border-emerald-950"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-300" />
                <div className="text-left hidden sm:block">
                  <p className="leading-tight text-[11px] text-emerald-200 font-normal">Role: {currentUser.roleTitle.split(' ')[0]}</p>
                  <p className="leading-tight font-bold">{currentUser.name.split(' ')[0]}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-emerald-300 ml-0.5" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-80 bg-white border border-stone-300 rounded-xl shadow-2xl p-2 z-50 text-xs">
                  {/* Firebase Auth Account Status Header */}
                  <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg mb-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <BrandLogo size="xs" />
                        <div className="overflow-hidden">
                          <p className="text-[11px] font-bold text-stone-800 truncate">
                            {firebaseUser ? (firebaseUser.displayName || 'Authenticated User') : 'Saathi Care Account'}
                          </p>
                          <p className="text-[10px] text-stone-500 font-mono truncate">
                            {firebaseUser?.email || 'Sign in with Google to bind role'}
                          </p>
                        </div>
                      </div>
                      <div>
                        {firebaseUser ? (
                          <button
                            onClick={async () => {
                              await signOutUser();
                            }}
                            disabled={authLoading}
                            className="text-[10px] text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 font-bold px-2 py-1 rounded transition-colors"
                          >
                            Sign Out
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              await signInWithGoogle();
                            }}
                            disabled={authLoading}
                            className="text-[10px] bg-[#164E43] hover:bg-[#123e35] text-white font-bold px-2.5 py-1 rounded transition-colors shadow-2xs"
                          >
                            {authLoading ? 'Signing in...' : 'Sign In'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="px-2 py-1 border-b border-stone-200 mb-1.5 text-[11px] text-stone-500 font-bold uppercase flex items-center justify-between">
                    <span>Switch Active Persona / Role:</span>
                    {firebaseUser && (
                      <span className="text-[10px] text-emerald-700 font-mono font-medium lowercase">
                        synced to cloud
                      </span>
                    )}
                  </div>
                  {roles.map(r => (
                    <button
                      key={r.role}
                      onClick={() => {
                        switchRole(r.role);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg flex flex-col transition-colors mb-1 ${
                        currentUser.role === r.role
                          ? 'bg-emerald-50 border border-emerald-300 text-emerald-950 font-bold'
                          : 'hover:bg-stone-100 text-stone-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{r.title}</span>
                        {currentUser.role === r.role && (
                          <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">
                            Active
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-500 font-normal">{r.subtitle}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Emergency Modal */}
      <EmergencyModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
        patientId={currentUser.id}
        patientName={currentUser.name}
      />
    </>
  );
};
