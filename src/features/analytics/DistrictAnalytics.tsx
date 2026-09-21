import React from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Building2,
  Users,
  Clock,
  Share2,
  Pill,
  ShieldCheck,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../services/store';

export const DistrictAnalytics: React.FC = () => {
  const { facilities, referrals, patients, medicines, followUps, queue, t } = useApp();

  const totalReferrals = referrals.length;
  const completedReferrals = referrals.filter(r => r.status === 'completed').length;
  const scheduledReferrals = referrals.filter(r => r.status === 'scheduled').length;
  const referralCompletionRate = Math.round((completedReferrals / (totalReferrals || 1)) * 100);

  const completedFollowUps = followUps.filter(f => f.status === 'completed').length;
  const followUpAdherenceRate = Math.round((completedFollowUps / (followUps.length || 1)) * 100);

  const lowStockCount = medicines.filter(m => m.status === 'low_stock' || m.status === 'out_of_stock').length;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="bg-white border-2 border-stone-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full">
              District Health Intelligence
            </span>
            <span className="text-xs text-stone-500 font-mono">
              Govt of Maharashtra • Pune District
            </span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 mt-1">
            District Public Health Command &amp; Analytics
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Real-time telemetry across Shirur, Ambegaon, and Baramati blocks for proactive resource allocation
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold text-stone-500 block">District Health Officer (DHO):</span>
          <span className="text-sm font-bold text-[#164E43]">Dr. Vandana Rao, Pune</span>
        </div>
      </div>

      {/* Top KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border-2 border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase">Referral Completion</span>
            <Share2 className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-3xl font-black text-[#164E43]">{referralCompletionRate}%</p>
          <p className="text-xs text-emerald-700 font-semibold mt-1">↑ Zero lost paper slips</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border-2 border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase">Follow-up Adherence</span>
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-3xl font-black text-[#164E43]">{followUpAdherenceRate}%</p>
          <p className="text-xs text-emerald-700 font-semibold mt-1">ASHA village verification</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border-2 border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase">Average OPD Wait</span>
            <Clock className="w-4 h-4 text-amber-700" />
          </div>
          <p className="text-3xl font-black text-[#164E43]">18 mins</p>
          <p className="text-xs text-emerald-700 font-semibold mt-1">Down from 150 mins</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border-2 border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase">Drug Stock Alerts</span>
            <Pill className="w-4 h-4 text-rose-700" />
          </div>
          <p className="text-3xl font-black text-rose-600">{lowStockCount}</p>
          <p className="text-xs text-stone-600 mt-1">Items below safety stock</p>
        </div>
      </div>

      {/* Facility Comparative Workload Table */}
      <div className="bg-white border-2 border-stone-200 rounded-3xl p-6 shadow-xs">
        <h2 className="text-lg font-black text-stone-900 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-700" />
          <span>Facility Workload &amp; Capacity Distribution</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-bold uppercase text-[10px]">
                <th className="p-3">Facility Name</th>
                <th className="p-3">Type / Taluka</th>
                <th className="p-3">Doctors on Duty</th>
                <th className="p-3">Active OPD Queue</th>
                <th className="p-3">Average Wait Time</th>
                <th className="p-3">Referral Volume</th>
                <th className="p-3 text-right">Workload Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {facilities.map(f => (
                <tr key={f.id} className="hover:bg-stone-50 transition-colors">
                  <td className="p-3 font-bold text-stone-900 text-sm">
                    {f.name}
                  </td>
                  <td className="p-3 text-stone-600">
                    {f.type} • {f.taluka}
                  </td>
                  <td className="p-3 font-mono font-bold text-stone-800">
                    {f.doctorsOnDuty ?? f.activeDoctors} Officers
                  </td>
                  <td className="p-3 font-mono font-bold text-stone-800">
                    {f.currentQueueCount ?? f.totalQueueToday} waiting
                  </td>
                  <td className="p-3 text-stone-700">
                    ~{(f.currentQueueCount ?? f.totalQueueToday) * 5} mins
                  </td>
                  <td className="p-3 font-mono text-stone-700">
                    {f.totalReferralsReceived || 12} in / {f.totalReferralsSent || 8} out
                  </td>
                  <td className="p-3 text-right">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      (f.currentQueueCount ?? f.totalQueueToday) > 40
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-emerald-100 text-emerald-900'
                    }`}>
                      {(f.currentQueueCount ?? f.totalQueueToday) > 40 ? 'High Load' : 'Balanced'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disease Trends & Epidemiology Signals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border-2 border-stone-200 rounded-3xl p-6 shadow-xs">
          <h3 className="font-extrabold text-base text-stone-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-700" />
            <span>Disease Surveillance &amp; Triage Distribution</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Hypertension &amp; Cardiovascular Symptoms</span>
                <span className="font-mono text-[#164E43]">38% of visits</span>
              </div>
              <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#164E43] h-full rounded-full" style={{ width: '38%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Seasonal Respiratory &amp; Viral Fevers</span>
                <span className="font-mono text-amber-700">27% of visits</span>
              </div>
              <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '27%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Antenatal High Risk &amp; Maternal Anemia</span>
                <span className="font-mono text-teal-700">19% of visits</span>
              </div>
              <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-teal-600 h-full rounded-full" style={{ width: '19%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Type 2 Diabetes Screening &amp; Renal Follow-ups</span>
                <span className="font-mono text-stone-700">16% of visits</span>
              </div>
              <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-stone-500 h-full rounded-full" style={{ width: '16%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Highest-Need Village Priority Table */}
        <div className="bg-white border-2 border-stone-200 rounded-3xl p-6 shadow-xs">
          <h3 className="font-extrabold text-base text-stone-900 mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-600" />
            <span>Highest-Need Rural Hamlets</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            {[
              { village: 'Shirur Rural Wasti', population: 2800, distance: '12 km', priority: 'High', need: 'Hypertensive screening & transport' },
              { village: 'Pabal Hamlet', population: 3400, distance: '18 km', priority: 'Urgent', need: 'ANC anemia visits' },
              { village: 'Nimgaon Circle', population: 1900, distance: '8 km', priority: 'Moderate', need: 'Dispensary restock' },
              { village: 'Mandavgan Farmland', population: 2200, distance: '24 km', priority: 'Urgent', need: 'Cardiology referral transport' },
            ].map(v => (
              <div key={v.village} className="p-3 bg-[#FAF9F6] border border-stone-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-stone-900">{v.village}</p>
                  <p className="text-stone-500 text-[11px]">{v.need} • {v.distance} from PHC</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  v.priority === 'Urgent' ? 'bg-amber-100 text-amber-900' : 'bg-stone-100 text-stone-800'
                }`}>
                  {v.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
