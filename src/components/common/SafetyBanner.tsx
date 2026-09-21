import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useApp } from '../../services/store';

export const SafetyBanner: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const { t } = useApp();

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-900 px-3 py-1.5 rounded-lg text-xs font-medium">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-700 shrink-0" />
        <span>{t('urgentNotice')}</span>
      </div>
    );
  }

  return (
    <div className="bg-amber-50/90 border border-amber-300/80 text-amber-900 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between gap-3 shadow-xs">
      <div className="flex items-center gap-2.5">
        <div className="p-1 bg-amber-200/70 rounded-md text-amber-800 shrink-0">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div>
          <span className="font-semibold text-amber-950">Clinical Decision Support: </span>
          <span>{t('urgentNotice')}</span>
        </div>
      </div>
      <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono uppercase tracking-wider hidden sm:inline-block">
        Public Health Standard
      </span>
    </div>
  );
};
