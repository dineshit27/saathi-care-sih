import React, { useState } from 'react';
import {
  Pill,
  Search,
  Building2,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Filter,
  Edit3
} from 'lucide-react';
import { useApp } from '../../services/store';
import { MedicineStock } from '../../types';

export const MedicineFinder: React.FC = () => {
  const { medicines, updateMedicineQuantity, currentUser, t } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingMedicineId, setEditingMedicineId] = useState<string | null>(null);
  const [newStockInput, setNewStockInput] = useState<number>(100);

  const categories = [
    'all',
    'Antihypertensive',
    'Antidiabetic',
    'Antibiotic',
    'Analgesic / Antipyretic',
    'Antianemic',
    'Nutritional'
  ];

  const filteredMedicines = medicines.filter(m => {
    const matchQuery =
      m.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.facilityName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'all' || m.category === selectedCategory;
    return matchQuery && matchCat;
  });

  const handleSaveStock = (medId: string) => {
    updateMedicineQuantity(medId, Number(newStockInput));
    setEditingMedicineId(null);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white border-2 border-stone-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full">
              Dispensary &amp; Pharmacy
            </span>
            <span className="text-xs text-stone-500 font-mono">
              Public Health Essential Drug List
            </span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 mt-1">
            Medicine Availability &amp; Facility Stock Finder
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Check real-time public dispensary stock across PHCs, CHCs, and District Hospitals in Maharashtra
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-300 text-amber-900 px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>Zero Out-of-Pocket Govt Formulary</span>
        </div>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-white border-2 border-stone-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by drug name (Amlodipine, Metformin, Paracetamol), generic or facility..."
              className="w-full text-xs pl-10 pr-4 py-3 border border-stone-300 rounded-2xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full text-xs p-3 border border-stone-300 rounded-2xl focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white font-semibold"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Drug Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Medicines Stock Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {filteredMedicines.map(med => (
            <div
              key={med.id}
              className="bg-[#FAF9F6] border border-stone-200 rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-500 transition-all shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase bg-stone-200 text-stone-800 px-2 py-0.5 rounded">
                    {med.category}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    med.status === 'available'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : med.status === 'low_stock'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-red-100 text-red-900 border border-red-300'
                  }`}>
                    {med.status.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="font-extrabold text-base text-stone-900">
                  {med.medicineName}
                </h3>
                <p className="text-xs text-stone-600 font-mono">
                  {med.genericName} • {med.dosageForm || med.dosage} {med.strength ? `(${med.strength})` : ''}
                </p>

                <div className="mt-3 pt-3 border-t border-stone-200/80 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Dispensary Stock:</span>
                    <strong className="text-sm font-mono text-stone-900">{med.availableQuantity} units</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500">Facility Location:</span>
                    <strong className="text-stone-800">{med.facilityName}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-stone-400">
                    <span>Tele-Inventory:</span>
                    <span>Updated {med.lastUpdated}</span>
                  </div>
                </div>

                {/* Alternative Generic Suggestion if low or out of stock */}
                {med.alternativeSuggestions && med.alternativeSuggestions.length > 0 && (
                  <div className="mt-3 p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-950">
                    <span className="font-bold block">Formulary Alternative:</span>
                    <span>{med.alternativeSuggestions.join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Facility Staff Inventory Edit */}
              <div className="mt-4 pt-3 border-t border-stone-200">
                {editingMedicineId === med.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={newStockInput}
                      onChange={e => setNewStockInput(Number(e.target.value))}
                      className="w-20 text-xs p-1.5 border border-stone-300 rounded-lg"
                    />
                    <button
                      onClick={() => handleSaveStock(med.id)}
                      className="px-2.5 py-1.5 bg-[#164E43] text-white text-xs font-bold rounded-lg"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingMedicineId(null)}
                      className="text-xs text-stone-500 hover:text-stone-800"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-stone-500 font-mono">
                      Batch: {med.batchNumber || 'MH-2026-B1'}
                    </span>
                    {(currentUser.role === 'facility' || currentUser.role === 'admin' || currentUser.role === 'doctor') && (
                      <button
                        onClick={() => {
                          setEditingMedicineId(med.id);
                          setNewStockInput(med.availableQuantity);
                        }}
                        className="text-xs text-emerald-800 hover:text-emerald-950 font-bold flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Adjust Stock</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
