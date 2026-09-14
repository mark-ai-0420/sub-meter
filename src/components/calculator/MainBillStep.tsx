import React, { useState } from 'react';
import {
  Zap,
  Calendar,
  DollarSign,
  AlertCircle,
  Info,
  Image as ImageIcon,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { MainMeralcoBill } from '../../types';
import { formatPHP, formatNumber } from '../../utils/formatters';

interface MainBillStepProps {
  mainBill: MainMeralcoBill;
  cycleName: string;
  commonAreaAllocMethod: 'equal' | 'proportional';
  onChangeCycleName: (name: string) => void;
  onChangeMainBill: (updatedBill: Partial<MainMeralcoBill>) => void;
  onChangeAllocMethod: (method: 'equal' | 'proportional') => void;
  onNextStep: () => void;
}

export const MainBillStep: React.FC<MainBillStepProps> = ({
  mainBill,
  cycleName,
  commonAreaAllocMethod,
  onChangeCycleName,
  onChangeMainBill,
  onChangeAllocMethod,
  onNextStep,
}) => {
  const [showTips, setShowTips] = useState(false);

  const amount = Number(mainBill.totalAmountDue) || 0;
  const kwh = Number(mainBill.totalMainKwh) || 0;
  const effectiveRate = kwh > 0 ? amount / kwh : 0;

  const handleBillPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChangeMainBill({ billPhotoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const isFormValid = amount > 0 && kwh > 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5 tracking-tight">
            <span className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold text-sm">
              1
            </span>
            Primary Meralco Bill Information
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter the top-level numbers from your official Meralco Statement of Account (SOA).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowTips(!showTips)}
          className="text-xs text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm transition flex items-center gap-1.5 font-medium"
        >
          <HelpCircle className="w-4 h-4 text-orange-500" />
          <span>{showTips ? 'Hide Meralco SOA Guide' : 'How to read your bill?'}</span>
        </button>
      </div>

      {showTips && (
        <div className="bg-orange-50/80 border border-orange-200/90 p-5 rounded-2xl text-xs text-orange-950 flex items-start gap-3.5 shadow-sm">
          <Info className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1.5 leading-relaxed">
            <h4 className="font-bold text-orange-900 text-sm">Reading your Meralco SOA:</h4>
            <p>
              • <strong>Total Amount Due:</strong> Look at the large boxed total amount payable on the front page of your bill (e.g. ₱6,450.75).
            </p>
            <p>
              • <strong>Total Main kWh:</strong> Found under the "Billing Info / Total Consumption" section (e.g. 542.8 kWh).
            </p>
            <p className="text-orange-900 font-medium pt-1">
              ✨ <em>Why this works:</em> By taking Total Amount ÷ Total kWh, all fluctuating generation charges, transmission costs, system loss, distribution charges, and 12% VAT are proportionately embedded into each tenant's rate.
            </p>
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-8">
        {/* Row 1: Cycle Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            Billing Month / Cycle Title
          </label>
          <input
            type="text"
            value={cycleName}
            onChange={(e) => onChangeCycleName(e.target.value)}
            placeholder="e.g. August 2026 Billing"
            className="w-full px-4 py-3 text-sm font-semibold bg-slate-50/70 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
          />
        </div>

        {/* Row 2: Two Big Input Cards (Total Amount & Total kWh) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Total Amount Due */}
          <div className="p-5 rounded-2xl bg-orange-50/40 border border-orange-200/80 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-orange-950 flex items-center justify-between">
              <span>Total Meralco Bill (PHP)</span>
              <span className="text-red-500 font-normal">*Required</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-extrabold text-orange-600">
                ₱
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={mainBill.totalAmountDue || ''}
                onChange={(e) => onChangeMainBill({ totalAmountDue: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 text-xl font-extrabold text-slate-900 bg-white border border-orange-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
              />
            </div>
            <p className="text-[11px] text-orange-800/80">
              The exact total amount payable stated on your Meralco bill.
            </p>
          </div>

          {/* Total Main kWh */}
          <div className="p-5 rounded-2xl bg-orange-50/40 border border-orange-200/80 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-orange-950 flex items-center justify-between">
              <span>Total Main Meter kWh</span>
              <span className="text-red-500 font-normal">*Required</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                value={mainBill.totalMainKwh || ''}
                onChange={(e) => onChangeMainBill({ totalMainKwh: parseFloat(e.target.value) || 0 })}
                placeholder="0.0"
                className="w-full pl-4 pr-14 py-3 text-xl font-extrabold text-slate-900 bg-white border border-orange-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none transition"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                kWh
              </span>
            </div>
            <p className="text-[11px] text-orange-800/80">
              Total kilowatt-hours consumption registered on the main meter.
            </p>
          </div>
        </div>

        {/* Effective Rate Highlight Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 flex-shrink-0">
              <Zap className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                Computed Blended Effective Rate
              </span>
              <h3 className="text-2xl font-extrabold text-amber-400 tracking-tight">
                {effectiveRate > 0 ? formatPHP(effectiveRate) : '₱0.0000'}
                <span className="text-sm font-normal text-slate-300 ml-1.5">/ kWh</span>
              </h3>
            </div>
          </div>

          <div className="text-xs text-slate-300 sm:text-right max-w-xs">
            Includes all generation charges, transmission, distribution, system loss, and 12% VAT.
          </div>
        </div>

        {/* Row 3: Billing Period, Due Date, Common Area Policy */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Period From
            </label>
            <input
              type="date"
              value={mainBill.periodFrom || ''}
              onChange={(e) => onChangeMainBill({ periodFrom: e.target.value })}
              className="w-full px-3.5 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Period To
            </label>
            <input
              type="date"
              value={mainBill.periodTo || ''}
              onChange={(e) => onChangeMainBill({ periodTo: e.target.value })}
              className="w-full px-3.5 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tenant Payment Due Date
            </label>
            <input
              type="date"
              value={mainBill.dueDate || ''}
              onChange={(e) => onChangeMainBill({ dueDate: e.target.value })}
              className="w-full px-3.5 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 transition"
            />
          </div>
        </div>

        {/* Common Area Allocation Method Selection */}
        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-800 block">
              Common Area kWh Allocation Policy:
            </span>
            <span className="text-[11px] text-slate-500">
              How shared electricity (water pump, hallway lighting) is distributed
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChangeAllocMethod('equal')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                commonAreaAllocMethod === 'equal'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Split Equally (Standard)
            </button>
            <button
              type="button"
              onClick={() => onChangeAllocMethod('proportional')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                commonAreaAllocMethod === 'proportional'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              By Usage Ratio
            </button>
          </div>
        </div>

        {/* Bill SOA Image Upload */}
        <div className="p-4 rounded-2xl bg-slate-50/60 border border-dashed border-slate-300 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="w-4 h-4 text-slate-500" />
            <div>
              <span className="font-semibold text-slate-700 block">
                Attach Meralco Bill Photo / SOA (Optional)
              </span>
              <span className="text-[11px] text-slate-400">
                Keep a visual record for quick reference
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="cursor-pointer px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-slate-700 font-semibold transition shadow-sm">
              <span>{mainBill.billPhotoUrl ? 'Replace Photo' : 'Upload SOA Photo'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBillPhotoUpload}
              />
            </label>
            {mainBill.billPhotoUrl && (
              <button
                type="button"
                onClick={() => onChangeMainBill({ billPhotoUrl: undefined })}
                className="text-red-600 hover:text-red-700 text-xs font-semibold ml-1"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Step Footer Navigation */}
      <div className="flex items-center justify-between pt-4">
        <div className="text-xs text-slate-400">
          {!isFormValid && (
            <span className="text-amber-700 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Please enter Total Bill Amount and Total Main kWh to proceed.
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onNextStep}
          disabled={!isFormValid}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-2xl shadow-md shadow-orange-500/20 transition active:scale-95"
        >
          <span>Next: Enter Meter Readings</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
