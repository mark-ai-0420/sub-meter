import React, { useState, useMemo, useEffect } from 'react';
import { X, Calendar, Zap, Sparkles, ArrowRight, Info, Check, Gauge } from 'lucide-react';
import { AppData, SubMeter, BillingCycle } from '../../types';
import { formatNumber } from '../../utils/formatters';

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
    totalMainKwh: number,
    sourceCycleId?: string
  ) => void;
}

/**
 * Calculates the day after a given YYYY-MM-DD date.
 */
const getDayAfter = (dateStr?: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      const d = new Date(year, month, day);
      d.setDate(d.getDate() + 1);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  }
  return '';
};

/**
 * Returns formatted label for a meter (e.g. "Unit 2 (Rico)")
 */
const getMeterLabel = (meter: SubMeter, appData: AppData): string => {
  if (meter.type === 'common') {
    return meter.name || 'Common Area';
  }
  const unit = appData.units.find((u) => u.id === meter.unitId);
  if (unit) {
    if (unit.tenantName && unit.tenantName.trim()) {
      return `${unit.unitNumber} (${unit.tenantName.trim()})`;
    }
    return unit.unitNumber;
  }
  return meter.name;
};

/**
 * Gets the reading that will be carried over to the new cycle.
 * Prefers the source cycle's present reading, then previous, then meter initial reading.
 */
const getMeterRolloverValue = (meter: SubMeter, cycle: BillingCycle | null): number => {
  if (!cycle || !cycle.readings || !cycle.readings[meter.id]) {
    return meter.initialReading || 0;
  }
  const sReading = cycle.readings[meter.id];
  if (typeof sReading.present === 'number' && sReading.present > 0) {
    return sReading.present;
  }
  if (typeof sReading.previous === 'number') {
    return sReading.previous;
  }
  return meter.initialReading || 0;
};

export const NewCycleModal: React.FC<NewCycleModalProps> = ({
  isOpen,
  onClose,
  appData,
  onCreateCycle,
}) => {
  const now = new Date();
  const defaultYear = now.getFullYear();
  const defaultMonth = String(now.getMonth() + 1).padStart(2, '0');
  const monthStr = `${defaultYear}-${defaultMonth}`;

  const nextMonthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const defaultName = `${nextMonthName} Billing`;

  // 1. Chronological cycle sorting (newest billing month first)
  const sortedCycles = useMemo(() => {
    return [...appData.billingCycles].sort((a, b) => {
      const monthA = a.mainBill?.billingMonth || '';
      const monthB = b.mainBill?.billingMonth || '';
      if (monthA && monthB) {
        const cmp = monthB.localeCompare(monthA);
        if (cmp !== 0) return cmp;
      } else if (monthA && !monthB) {
        return -1;
      } else if (!monthA && monthB) {
        return 1;
      }
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }, [appData.billingCycles]);

  // 2. Preceding Cycle determination:
  // If appData.activeCycleId matches a cycle, default to that or the latest chronological cycle.
  const defaultSourceCycleId = useMemo(() => {
    const active = appData.billingCycles.find((c) => c.id === appData.activeCycleId);
    if (active) return active.id;
    if (sortedCycles.length > 0) return sortedCycles[0].id;
    return 'none';
  }, [appData.billingCycles, appData.activeCycleId, sortedCycles]);

  const [cycleName, setCycleName] = useState(defaultName);
  const [billingMonth, setBillingMonth] = useState(monthStr);
  const [selectedSourceCycleId, setSelectedSourceCycleId] = useState<string>(defaultSourceCycleId);
  const [periodFrom, setPeriodFrom] = useState('');
  const [periodTo, setPeriodTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [totalAmountDue, setTotalAmountDue] = useState<number | ''>('');
  const [totalMainKwh, setTotalMainKwh] = useState<number | ''>('');

  // Synchronize initial state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCycleName(defaultName);
      setBillingMonth(monthStr);
      setSelectedSourceCycleId(defaultSourceCycleId);

      // Smart period date pre-filling on open
      const src = appData.billingCycles.find((c) => c.id === defaultSourceCycleId);
      if (src?.mainBill?.periodTo) {
        const nextDay = getDayAfter(src.mainBill.periodTo);
        setPeriodFrom(nextDay || `${monthStr}-01`);
      } else {
        setPeriodFrom(`${monthStr}-01`);
      }

      setPeriodTo('');
      setDueDate('');
      setTotalAmountDue('');
      setTotalMainKwh('');
    }
  }, [isOpen, defaultSourceCycleId, defaultName, monthStr, appData.billingCycles]);

  // Find currently selected source cycle object
  const selectedSourceCycle = useMemo(() => {
    if (selectedSourceCycleId === 'none') return null;
    return appData.billingCycles.find((c) => c.id === selectedSourceCycleId) || null;
  }, [appData.billingCycles, selectedSourceCycleId]);

  // Handle source cycle dropdown change with smart date pre-filling if periodFrom is empty
  const handleSourceCycleChange = (sourceId: string) => {
    setSelectedSourceCycleId(sourceId);

    if (!periodFrom) {
      if (sourceId !== 'none') {
        const src = appData.billingCycles.find((c) => c.id === sourceId);
        if (src?.mainBill?.periodTo) {
          const nextDay = getDayAfter(src.mainBill.periodTo);
          if (nextDay) {
            setPeriodFrom(nextDay);
            return;
          }
        }
      }
      if (billingMonth) {
        setPeriodFrom(`${billingMonth}-01`);
      }
    }
  };

  if (!isOpen) return null;

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
      Number(totalMainKwh) || 0,
      selectedSourceCycleId
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-cycle-modal-title"
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 id="new-cycle-modal-title" className="text-base font-bold text-slate-100">
                Create New Billing Month
              </h3>
              <p className="text-xs text-slate-400">
                Auto-rolls over previous meter readings from your selected billing cycle.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center p-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-4 overflow-y-auto text-xs flex-1">
            {/* Cycle Name */}
            <div>
              <label htmlFor="cycle-name-input" className="block font-semibold text-slate-700 mb-1">
                Billing Cycle Name <span className="text-red-500">*</span>
              </label>
              <input
                id="cycle-name-input"
                type="text"
                required
                value={cycleName}
                onChange={(e) => setCycleName(e.target.value)}
                placeholder="e.g. September 2026 Billing"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              />
            </div>

            {/* Billing Month */}
            <div>
              <label htmlFor="billing-month-input" className="block font-semibold text-slate-700 mb-1">
                Billing Month (YYYY-MM)
              </label>
              <input
                id="billing-month-input"
                type="month"
                value={billingMonth}
                onChange={(e) => {
                  setBillingMonth(e.target.value);
                  if (!periodFrom && e.target.value) {
                    setPeriodFrom(`${e.target.value}-01`);
                  }
                }}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
              />
            </div>

            {/* Carry Over Dials Selector */}
            <div>
              <label
                htmlFor="source-cycle-select"
                className="block font-semibold text-slate-700 mb-1"
              >
                Source for Previous Dial Readings
              </label>
              <select
                id="source-cycle-select"
                aria-label="Source for Previous Dial Readings"
                value={selectedSourceCycleId}
                onChange={(e) => handleSourceCycleChange(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition text-slate-800 font-medium"
              >
                {sortedCycles.map((cycle) => (
                  <option key={cycle.id} value={cycle.id}>
                    {cycle.name} ({cycle.mainBill?.billingMonth || 'No Month'})
                  </option>
                ))}
                <option value="none">
                  None (Start fresh with baseline / initial dials)
                </option>
              </select>
            </div>

            {/* Live Rollover Dials Preview Card */}
            {selectedSourceCycle ? (
              <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-amber-50/90 border border-amber-200/90 rounded-xl p-3.5 space-y-2.5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-600 flex-shrink-0" />
                    <span className="font-bold text-slate-800 text-xs">
                      Preview Previous Readings (carried from {selectedSourceCycle.name}):
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
                    ✓ Dials verified from preceding cycle
                  </span>
                </div>

                {appData.meters.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-1">
                    No meters configured yet. Baseline readings will be used.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-48 overflow-y-auto pr-1">
                    {appData.meters.map((meter) => {
                      const label = getMeterLabel(meter, appData);
                      const rolloverVal = getMeterRolloverValue(meter, selectedSourceCycle);
                      return (
                        <div
                          key={meter.id}
                          className="flex items-center justify-between px-3 py-1.5 bg-white/90 backdrop-blur-xs rounded-lg border border-amber-200/70 shadow-xs"
                        >
                          <span
                            className="font-medium text-slate-700 truncate pr-2 text-xs"
                            title={label}
                          >
                            {label}:
                          </span>
                          <span className="font-bold text-slate-900 font-mono text-xs shrink-0">
                            {formatNumber(rolloverVal, 1)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center gap-2.5 text-slate-600">
                <Info className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span className="text-xs font-medium">Will start with baseline initial readings.</span>
              </div>
            )}

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="period-from-input" className="block font-medium text-slate-700 mb-1">
                  Period From
                </label>
                <input
                  id="period-from-input"
                  type="date"
                  value={periodFrom}
                  onChange={(e) => setPeriodFrom(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:bg-white text-xs"
                />
              </div>
              <div>
                <label htmlFor="period-to-input" className="block font-medium text-slate-700 mb-1">
                  Period To
                </label>
                <input
                  id="period-to-input"
                  type="date"
                  value={periodTo}
                  onChange={(e) => setPeriodTo(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:bg-white text-xs"
                />
              </div>
            </div>

            {/* Tenant Due Date */}
            <div>
              <label htmlFor="due-date-input" className="block font-medium text-slate-700 mb-1">
                Tenant Payment Due Date
              </label>
              <input
                id="due-date-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:bg-white text-xs"
              />
            </div>

            {/* Initial Bill Totals (Optional at creation) */}
            <div className="pt-2 border-t border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Primary Meralco Bill (Optional now - can fill in calculator)
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="total-amount-input" className="block text-slate-600 mb-1">
                    Total Amount Due (₱)
                  </label>
                  <input
                    id="total-amount-input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={totalAmountDue}
                    onChange={(e) =>
                      setTotalAmountDue(e.target.value === '' ? '' : parseFloat(e.target.value))
                    }
                    placeholder="0.00"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:bg-white text-right font-semibold text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="total-kwh-input" className="block text-slate-600 mb-1">
                    Total Main kWh
                  </label>
                  <input
                    id="total-kwh-input"
                    type="number"
                    step="0.1"
                    min="0"
                    value={totalMainKwh}
                    onChange={(e) =>
                      setTotalMainKwh(e.target.value === '' ? '' : parseFloat(e.target.value))
                    }
                    placeholder="0.0"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:bg-white text-right font-semibold text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold rounded-xl shadow-sm shadow-orange-500/20 active:scale-[0.98] transition focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 cursor-pointer"
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
