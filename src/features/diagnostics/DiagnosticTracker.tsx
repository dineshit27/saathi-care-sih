import React, { useState } from 'react';
import {
  FileSearch,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  FileText,
  Upload,
  Plus
} from 'lucide-react';
import { useApp } from '../../services/store';
import { DiagnosticOrder } from '../../types';

export const DiagnosticTracker: React.FC = () => {
  const {
    diagnostics,
    updateDiagnosticStatus,
    createDiagnosticOrder,
    patients,
    currentUser,
    t
  } = useApp();

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedDiagId, setSelectedDiagId] = useState<string>(diagnostics[0]?.id || '');
  const [resultInput, setResultInput] = useState('');
  const [findingsInput, setFindingsInput] = useState('');
  const [isAbnormalFlag, setIsAbnormalFlag] = useState(false);

  // New Test Order Form State
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [newOrderPatientId, setNewOrderPatientId] = useState(patients[0]?.id || 'pat-001');
  const [newTestType, setNewTestType] = useState('Point-of-Care 12-Lead ECG & Renal Profile');

  const selectedDiag = diagnostics.find(d => d.id === selectedDiagId) || diagnostics[0];

  const filteredDiagnostics = diagnostics.filter(d => {
    if (filterStatus !== 'all' && d.status !== filterStatus) return false;
    return true;
  });

  const handleUpdateStatus = (status: DiagnosticOrder['status']) => {
    if (!selectedDiag) return;
    updateDiagnosticStatus(
      selectedDiag.id,
      status,
      resultInput || selectedDiag.resultSummary,
      findingsInput || selectedDiag.findings,
      isAbnormalFlag
    );
    alert(`Diagnostic order updated to: ${status}`);
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find(p => p.id === newOrderPatientId);
    createDiagnosticOrder({
      patientId: newOrderPatientId,
      patientName: pat?.name || 'Patient',
      testType: newTestType,
      facilityId: currentUser.facilityId || 'fac-phc-shirur',
      facilityName: currentUser.facilityName || 'Shirur PHC',
      requestingDoctor: currentUser.name,
      status: 'sample_collected'
    });
    setShowOrderModal(false);
    alert('Diagnostic test order created!');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner */}
      <div className="bg-white border-2 border-stone-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase bg-teal-100 text-teal-900 px-2.5 py-0.5 rounded-full">
              Public Health Diagnostics
            </span>
            <span className="text-xs text-stone-500 font-mono">
              Sample Collection &amp; Report Registry
            </span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 mt-1">
            Diagnostic Tests &amp; Laboratory Registry
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Real-time tracking from phlebotomy &amp; imaging collection to automated doctor alert and timeline linkage
          </p>
        </div>

        <button
          onClick={() => setShowOrderModal(true)}
          className="px-4 py-2.5 bg-[#164E43] hover:bg-[#123e35] text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>+ Order Diagnostic Test</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border-2 border-stone-200 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-stone-900">
                Diagnostic Orders ({filteredDiagnostics.length})
              </h2>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="text-xs p-1.5 border border-stone-300 rounded-xl bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="requested">Requested</option>
                <option value="sample_collected">Sample Collected</option>
                <option value="result_available">Result Available</option>
              </select>
            </div>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto">
              {filteredDiagnostics.map(diag => {
                const isSelected = selectedDiag?.id === diag.id;
                return (
                  <div
                    key={diag.id}
                    onClick={() => setSelectedDiagId(diag.id)}
                    className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-teal-50/80 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                        : 'bg-[#FAF9F6] border-stone-200 hover:border-stone-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-teal-900">{diag.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        diag.status === 'result_available'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {diag.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="font-black text-sm text-stone-900">{diag.testType}</p>
                    <p className="text-stone-600 mt-0.5">Patient: <span className="font-semibold">{diag.patientName}</span></p>

                    <div className="mt-2 pt-2 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500">
                      <span>Ordered by: {diag.requestingDoctor}</span>
                      {diag.isAbnormal && (
                        <span className="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          Abnormal Finding
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Details (7 Cols) */}
        <div className="lg:col-span-7">
          {selectedDiag ? (
            <div className="bg-white border-2 border-stone-200 rounded-3xl p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b pb-4">
                <div>
                  <span className="text-xs bg-teal-100 text-teal-900 font-bold px-2 py-0.5 rounded-md uppercase font-mono">
                    Order ID: {selectedDiag.id}
                  </span>
                  <h2 className="text-xl font-black text-stone-900 mt-2">
                    {selectedDiag.testType}
                  </h2>
                  <p className="text-xs text-stone-500">
                    Patient: <strong>{selectedDiag.patientName}</strong> • Facility: <strong>{selectedDiag.facilityName}</strong>
                  </p>
                </div>

                <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase ${
                  selectedDiag.status === 'result_available'
                    ? 'bg-emerald-100 text-emerald-900'
                    : 'bg-amber-100 text-amber-900'
                }`}>
                  Status: {selectedDiag.status.replace('_', ' ')}
                </span>
              </div>

              {/* Lab Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-[#FAF9F6] rounded-xl border border-stone-200">
                  <span className="text-stone-500 block text-[10px] uppercase font-bold">Request Time</span>
                  <span className="font-bold text-stone-900">{selectedDiag.requestedAt}</span>
                </div>
                <div className="p-3 bg-[#FAF9F6] rounded-xl border border-stone-200">
                  <span className="text-stone-500 block text-[10px] uppercase font-bold">Requesting Doctor</span>
                  <span className="font-bold text-stone-900">{selectedDiag.requestingDoctor}</span>
                </div>
                <div className="p-3 bg-[#FAF9F6] rounded-xl border border-stone-200">
                  <span className="text-stone-500 block text-[10px] uppercase font-bold">Completed At</span>
                  <span className="font-bold text-stone-900">{selectedDiag.completedAt || 'In Processing'}</span>
                </div>
              </div>

              {/* Existing Result View */}
              {selectedDiag.resultSummary && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-2xl space-y-2 text-xs">
                  <span className="font-bold text-emerald-950 uppercase text-[10px]">
                    Validated Diagnostic Findings:
                  </span>
                  <p className="text-sm font-semibold text-stone-900">{selectedDiag.resultSummary}</p>
                  {selectedDiag.findings && (
                    <p className="text-stone-700 mt-1">Clinical Note: {selectedDiag.findings}</p>
                  )}
                </div>
              )}

              {/* Lab Technician / Doctor Result Entry Controls */}
              <div className="p-5 bg-stone-50 border border-stone-200 rounded-2xl space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Lab Technician / Radiologist Update Form:
                </h3>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Result Quantitative / Qualitative Summary
                  </label>
                  <input
                    type="text"
                    value={resultInput}
                    onChange={e => setResultInput(e.target.value)}
                    placeholder="e.g. Hemoglobin 8.8 g/dL (Moderate Microcytic Anemia) or Sinus rhythm confirmed"
                    className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Detailed Observations / Radiologist Impression
                  </label>
                  <textarea
                    rows={2}
                    value={findingsInput}
                    onChange={e => setFindingsInput(e.target.value)}
                    placeholder="Impression, reference ranges, critical value notes..."
                    className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded-xl"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs text-stone-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAbnormalFlag}
                    onChange={e => setIsAbnormalFlag(e.target.checked)}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                  />
                  <span className="font-bold text-red-700">Flag as Abnormal Finding (Alerts Medical Officer Immediately)</span>
                </label>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-200">
                  <button
                    onClick={() => handleUpdateStatus('sample_collected')}
                    className="px-3 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-bold rounded-xl transition-colors"
                  >
                    Mark Sample Collected
                  </button>

                  <button
                    onClick={() => handleUpdateStatus('result_available')}
                    className="px-4 py-2 bg-[#164E43] hover:bg-[#123e35] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>Upload Result &amp; Notify Care Team</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-stone-500 bg-white rounded-3xl border-2 border-stone-200">
              Select an investigation to view reports.
            </div>
          )}
        </div>
      </div>

      {/* New Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border-2 border-stone-200 shadow-2xl">
            <h3 className="font-extrabold text-base text-stone-900 mb-4">
              Order New Diagnostic Investigation
            </h3>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Select Patient
                </label>
                <select
                  value={newOrderPatientId}
                  onChange={e => setNewOrderPatientId(e.target.value)}
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-xl bg-white"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.village})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase mb-1">
                  Investigation Type
                </label>
                <select
                  value={newTestType}
                  onChange={e => setNewTestType(e.target.value)}
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-xl bg-white"
                >
                  <option value="Point-of-Care 12-Lead ECG & Renal Profile">Point-of-Care 12-Lead ECG &amp; Renal Profile</option>
                  <option value="Complete Blood Count (CBC) & Peripheral Smear">Complete Blood Count (CBC) &amp; Peripheral Smear</option>
                  <option value="Fasting & Post-Prandial Blood Sugar">Fasting &amp; Post-Prandial Blood Sugar</option>
                  <option value="Serum Creatinine & Blood Urea Nitrogen">Serum Creatinine &amp; Blood Urea Nitrogen</option>
                  <option value="Rapid Malaria Antigen (Pv/Pf)">Rapid Malaria Antigen (Pv/Pf)</option>
                  <option value="Chest X-Ray (PA View)">Chest X-Ray (PA View)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="px-3 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#164E43] text-white text-xs font-bold rounded-xl"
                >
                  Confirm Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
