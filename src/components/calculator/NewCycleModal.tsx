import React, { useState } from 'react';
import { X, Plus, Calendar, Zap, Sparkles, ArrowRight } from 'lucide-react';
import { AppData } from '../../types';

interface NewCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appData: AppData;
  onCreateCycle: (
    cycleName: string,
    billingMonth: string,
    periodFrom: string,
    periodTo: string,
    dueDate: string,
    totalAmountDue: number,
    totalMainKwh: number
  ) => void;
}

export const NewCycleModal: React.FC<NewCycleModalProps> = ({
  isOpen,
  onClose,
  appData,
  onCreateCycle,
}) => {
  if (!isOpen) return null;

  const now = new Date();
  const defaultYear = now.getFullYear();
  const defaultMonth = String(now.getMonth() + 1).padStart(2, '0');
  const monthStr = `${defaultYear}-${defaultMonth}`;

  // Compute default dates
  const nextMonthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const defaultName = `${nextMonthName} Billing`;

  const [cycleName, setCycleName] = useState(defaultName);
  const [billingMonth, setBillingMonth] = useState(monthStr);
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [totalAmountDue, setTotalAmountDue] = useState<number | ''>('');
  const [totalMainKwh, setTotalMainKwh] = useState<number | ''>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cycleName.trim()) return;

    onCreateCycle(
      cycleName.trim(),
      billingMonth,
      periodFrom,
      periodTo,
      dueDate,
      Number(totalAmountDue) || 0,
      Number(totalMainKwh) || 0
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-cycle-modal-title"
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 id="new-cycle-modal-title" className="text-base font-bold text-slate-100">Create New Billing Month</h3>
              <p className="text-xs text-slate-400">
                Auto-rolls over previous meter readings from your latest billing cycle.
              </p>
            </div>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
            {/* Auto-Rollover Notice */}
            <div className="bg-orange-50 border border-orange-200 p-3 rounded-xl flex items-start gap-2.5 text-orange-900">
              <Zap className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Smart Reading Rollover:</span> All sub-meter "Previous Readings" will automatically be populated from last month's "Present Readings"!
              </div>
            </div>

            {/* Cycle Name */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Billing Cycle Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={cycleName}
                onChange={(e) => setCycleName(e.target.value)}
                placeholder="e.g. September 2026 Billing"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Billing Month */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Billing Month (YYYY-MM)
              </label>
              <input
                type="month"
                value={billingMonth}
                onChange={(e) => setBillingMonth(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Period From</label>
                <input
                  type="date"
                  value={periodFrom}
                  onChange={(e) => setPeriodFrom(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Period To</label>
                <input
                  type="date"
                  value={periodTo}
                  onChange={(e) => setPeriodTo(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Tenant Due Date */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Tenant Payment Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Initial Bill Totals (Optional at creation) */}
            <div className="pt-2 border-t border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Primary Meralco Bill (Optional now - can fill in calculator)
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1">Total Amount Due (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={totalAmountDue}
                    onChange={(e) =>
                      setTotalAmountDue(e.target.value === '' ? '' : parseFloat(e.target.value))
                    }
                    placeholder="0.00"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-right font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1">Total Main kWh</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={totalMainKwh}
                    onChange={(e) =>
                      setTotalMainKwh(e.target.value === '' ? '' : parseFloat(e.target.value))
                    }
                    placeholder="0.0"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-right font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold rounded-lg shadow-sm shadow-orange-500/20 transition"
            >
              <span>Create Cycle & Start Calculator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
