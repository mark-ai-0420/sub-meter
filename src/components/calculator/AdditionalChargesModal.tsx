import React, { useState } from 'react';
import { X, Plus, Trash2, Tag, DollarSign, Droplets, Trash, Wrench, Clock, Gift, Calculator } from 'lucide-react';
import { AdditionalChargeItem, TenantUnit } from '../../types';
import { formatPHP } from '../../utils/formatters';
import { WaterReadingsModal } from '../water/WaterReadingsModal';

interface AdditionalChargesModalProps {
  unit: TenantUnit | null;
  charges: AdditionalChargeItem[];
  isOpen: boolean;
  onClose: () => void;
  onSaveCharges: (unitId: string, charges: AdditionalChargeItem[]) => void;
}

export const AdditionalChargesModal: React.FC<AdditionalChargesModalProps> = ({
  unit,
  charges,
  isOpen,
  onClose,
  onSaveCharges,
}) => {
  if (!isOpen || !unit) return null;

  const [currentList, setCurrentList] = useState<AdditionalChargeItem[]>(charges || []);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState<number | ''>('');
  const [newItemType, setNewItemType] = useState<AdditionalChargeItem['type']>('water');
  const [isWaterModalOpen, setIsWaterModalOpen] = useState(false);

  const presetSuggestions = [
    { name: 'Water Sub-meter Bill', type: 'water' as const, icon: Droplets },
    { name: 'Garbage Collection Fee', type: 'garbage' as const, icon: Trash },
    { name: 'Aircon Cleaning / Maintenance', type: 'maintenance' as const, icon: Wrench },
    { name: 'Previous Month Unpaid Arrears', type: 'arrears' as const, icon: Clock },
    { name: 'Advance Payment / Discount', type: 'discount' as const, icon: Gift },
  ];

  const handleAddCharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || newItemAmount === '') return;

    const newCharge: AdditionalChargeItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: newItemName.trim(),
      amount: Number(newItemAmount),
      type: newItemType,
    };

    const updated = [...currentList, newCharge];
    setCurrentList(updated);
    setNewItemName('');
    setNewItemAmount('');
  };

  const handleRemoveCharge = (id: string) => {
    const updated = currentList.filter((c) => c.id !== id);
    setCurrentList(updated);
  };

  const handleSave = () => {
    onSaveCharges(unit.id, currentList);
    onClose();
  };

  const handleAttachWaterCharge = (_unitId: string, waterCharge: AdditionalChargeItem) => {
    // Remove existing water submeter item if any, and attach new one
    const filtered = currentList.filter((c) => c.type !== 'water' || !c.name.toLowerCase().includes('water'));
    const updated = [...filtered, waterCharge];
    setCurrentList(updated);
    setIsWaterModalOpen(false);
  };

  const totalOther = currentList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="additional-charges-modal-title"
          className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
        >
          {/* Modal Header */}
          <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
            <div>
              <h3 id="additional-charges-modal-title" className="text-base font-bold flex items-center gap-2">
                <Tag className="w-4 h-4 text-orange-400" />
                Additional Charges & Deductions
              </h3>
              <p className="text-xs text-slate-400">
                {unit.unitNumber} • {unit.tenantName}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center p-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Quick Presets & Water Calculator Trigger */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Quick Add Common Apartment Fees:
                </label>
                <button
                  type="button"
                  onClick={() => setIsWaterModalOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200 transition"
                >
                  <Droplets className="w-3 h-3 text-blue-500" />
                  <span>Compute Water Sub-Meter (m³)</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {presetSuggestions.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (preset.type === 'water') {
                        setIsWaterModalOpen(true);
                      } else {
                        setNewItemName(preset.name);
                        setNewItemType(preset.type);
                      }
                    }}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 border border-slate-200 rounded-lg text-orange-950 font-semibold transition flex items-center gap-1.5"
                  >
                    <preset.icon className="w-3 h-3 text-slate-500" />
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

          {/* Add New Line Item Form */}
          <form onSubmit={handleAddCharge} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-6">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Item Description
                </label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Water Sub-meter"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Category
                </label>
                <select
                  value={newItemType}
                  onChange={(e) => setNewItemType(e.target.value as any)}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="water">Water</option>
                  <option value="garbage">Garbage</option>
                  <option value="maintenance">Maint.</option>
                  <option value="arrears">Arrears</option>
                  <option value="discount">Discount</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Amount (PHP)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newItemAmount}
                  onChange={(e) => setNewItemAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-semibold text-right focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newItemName.trim() || newItemAmount === ''}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </button>
            </div>
          </form>

          {/* Current List of Items */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Attached Line Items ({currentList.length})
            </h4>

            {currentList.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No additional line items added for this unit.
              </div>
            ) : (
              <div className="space-y-2">
                {currentList.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="p-1.5 rounded-lg bg-orange-50 text-orange-600 text-xs">
                        <Tag className="w-3.5 h-3.5" />
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{item.name}</div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                          {item.type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-sm font-bold font-mono ${
                          item.amount < 0 ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {item.amount < 0 ? '-' : ''}
                        {formatPHP(Math.abs(item.amount))}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCharge(item.id)}
                        aria-label={`Remove charge ${item.name}`}
                        className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center p-2 text-red-600/70 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total Subtotal */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between font-bold text-sm">
            <span className="text-slate-700">Subtotal Other Charges:</span>
            <span className="text-slate-900 text-base font-extrabold">{formatPHP(totalOther)}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg shadow-sm shadow-orange-500/20 transition"
          >
            Save Charges
          </button>
        </div>
      </div>
    </div>

    {/* Water Sub-Meter Reading Calculator Modal */}
    <WaterReadingsModal
      isOpen={isWaterModalOpen}
      onClose={() => setIsWaterModalOpen(false)}
      unit={unit}
      onSaveWaterCharge={handleAttachWaterCharge}
    />
  </>
  );
};
