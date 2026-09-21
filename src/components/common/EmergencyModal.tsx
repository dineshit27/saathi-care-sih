import React, { useState } from 'react';
import { AlertOctagon, PhoneCall, Ambulance, X, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../services/store';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string;
  patientName?: string;
}

export const EmergencyModal: React.FC<Props> = ({ isOpen, onClose, patientId = 'pat-001', patientName = 'Ramesh Patil' }) => {
  const { triggerEmergencyEscalation } = useApp();
  const [reason, setReason] = useState('Severe chest discomfort and respiratory difficulty');
  const [dispatched, setDispatched] = useState(false);

  if (!isOpen) return null;

  const handleEscalate = () => {
    triggerEmergencyEscalation(patientId, reason);
    setDispatched(true);
    setTimeout(() => {
      setDispatched(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 border-2 border-red-600 shadow-2xl relative animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100"
        >
          <X className="w-5 h-5" />
        </button>

        {dispatched ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-stone-900">Emergency Protocol Dispatched</h3>
            <p className="text-sm text-stone-600 mt-2 max-w-sm mx-auto">
              108 Emergency Ambulance notified for {patientName}. PHC Medical Officer alerted for immediate stabilization.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <AlertOctagon className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-black text-stone-900 uppercase tracking-wide">
                  Emergency Medical Escalation
                </h3>
                <p className="text-xs text-red-700 font-semibold">
                  Public Health Priority Response • Dial 108 / 104
                </p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-4 text-xs text-red-900">
              <p className="font-bold">Protocol Notice:</p>
              <p className="mt-0.5 text-stone-700">
                This triggers a priority alert to the nearest Primary Health Centre Medical Officer and dispatches emergency coordination for {patientName}.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-stone-800 uppercase mb-1.5">
                Clinical Emergency Indication:
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full text-sm border border-stone-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500 font-sans"
                placeholder="Describe physiological urgency (e.g. SpO2 <90%, severe chest pain, loss of consciousness)..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center gap-2.5">
                <Ambulance className="w-5 h-5 text-red-600 shrink-0" />
                <div>
                  <p className="text-[11px] text-stone-500 font-medium">Ambulance Service</p>
                  <p className="text-sm font-bold text-stone-900">108 (Toll-Free)</p>
                </div>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center gap-2.5">
                <PhoneCall className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-[11px] text-stone-500 font-medium">Govt Health Helpline</p>
                  <p className="text-sm font-bold text-stone-900">104 (24x7)</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEscalate}
                className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition-colors flex items-center gap-2"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>Confirm Emergency Dispatch</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
