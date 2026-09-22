import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  ShieldCheck,
  UserCheck,
  Building2,
  Calendar,
  Clock,
  Download
} from 'lucide-react';
import { useApp } from '../../services/store';
import { BrandLogo } from '../../components/common/BrandLogo';

export const AuditLogViewer: React.FC = () => {
  const { auditLogs, t } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = filterAction === 'all' || log.action.toLowerCase().includes(filterAction.toLowerCase());
    return matchesSearch && matchesAction;
  });

  const handleExport = () => {
    const jsonStr = JSON.stringify(auditLogs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saathi_care_audit_log_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="bg-white border-2 border-stone-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BrandLogo size="xs" />
            <span className="text-xs font-bold uppercase bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full">
              Saathi Civic Accountability
            </span>
            <span className="text-xs text-stone-500 font-mono">
              Immutable System Ledger
            </span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 mt-1">
            Public Health Transparency &amp; Audit Logs
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Every clinical decision, referral status change, triage vital, and medicine dispatch is permanently logged for administrative oversight
          </p>
        </div>

        <button
          onClick={handleExport}
          className="px-4 py-2.5 bg-[#164E43] hover:bg-[#123e35] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span>Export Official Audit Ledger</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white border-2 border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search audit actions, staff names, patient IDs, or clinical details..."
              className="w-full text-xs pl-10 pr-4 py-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white font-semibold"
            >
              <option value="all">All Logged Actions</option>
              <option value="patient">Patient Registration</option>
              <option value="triage">Triage &amp; Vitals</option>
              <option value="referral">Referral Operations</option>
              <option value="queue">Queue Events</option>
              <option value="diagnostic">Diagnostic Orders</option>
              <option value="pharmacy">Pharmacy &amp; Stock</option>
              <option value="followup">Follow-ups</option>
              <option value="emergency">Emergency Escalations</option>
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-bold uppercase text-[10px]">
                <th className="p-3">Timestamp</th>
                <th className="p-3">Staff / User</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entity Ref</th>
                <th className="p-3">Facility Location</th>
                <th className="p-3">Operational Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-sans">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-stone-50 transition-colors">
                  <td className="p-3 font-mono text-stone-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-stone-900 block">{log.userName}</span>
                    <span className="text-[10px] text-stone-500 uppercase">{log.userRole}</span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      log.action.includes('EMERGENCY')
                        ? 'bg-red-100 text-red-900 font-black'
                        : log.action.includes('Referral')
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-emerald-50 text-emerald-900'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-[11px] text-stone-600">
                    {log.entityType} ({log.entityId})
                  </td>
                  <td className="p-3 text-stone-600">
                    {log.facilityName}
                  </td>
                  <td className="p-3 text-stone-700 leading-snug">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
