import React, { useState } from 'react';
import { FileSpreadsheet, Zap, Calendar, DollarSign, AlertCircle, Info, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { MainMeralcoBill } from '../../types';
import { formatPHP, formatNumber } from '../../utils/formatters';

interface MainBillFormProps {
  mainBill: MainMeralcoBill;
  cycleName: string;
  commonAreaAllocMethod: 'equal' | 'proportional';
  onChangeCycleName: (name: string) => void;
  onChangeMainBill: (updatedBill: Partial<MainMeralcoBill>) => void;
  onChangeAllocMethod: (method: 'equal' | 'proportional') => void;
}

export const MainBillForm: React.FC<MainBillFormProps> = ({
  mainBill,
  cycleName,
  commonAreaAllocMethod,
  onChangeCycleName,
  onChangeMainBill,
  onChangeAllocMethod,
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-6 transition-all hover:shadow-md w-full max-w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 py-4 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Zap className="w-4 h-4 fill-orange-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Primary Meralco Bill Details
            </h2>
            <p className="text-xs text-slate-400">
              Input the summary values from your official Meralco Statement of Account (SOA)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTips(!showTips)}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 transition active:scale-95"
          >
            <Info className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span>{showTips ? 'Hide Tips' : 'Where to find these numbers?'}</span>
          </button>
        </div>
      </div>

      {showTips && (
        <div className="bg-orange-50 border-b border-orange-200 px-5 py-3 text-xs text-orange-950 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-orange-900">Meralco Bill Guide:</p>
            <p>
              • <strong>Total Amount Due:</strong> Look at the large boxed amount on the front page (e.g. ₱6,450.75).
            </p>
            <p>
              • <strong>Total kWh Used:</strong> Found on the front or page 2 under "Billing Info / Total Consumption (kWh)" (e.g. 542.8 kWh).
            </p>
            <p>
              • By allocating the total bill by total kWh, generation, transmission, VAT, system loss, and fixed charges are automatically blended into an accurate, fair effective rate!
            </p>
          </div>
        </div>
      )}

      {/* Main Inputs Grid */}
      <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Cycle Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Billing Cycle Label
          </label>
          <input
            type="text"
            value={cycleName}
            onChange={(e) => onChangeCycleName(e.target.value)}
            placeholder="e.g. August 2026 Billing"
            className="w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
          />
        </div>

        {/* Total Amount Due (PHP) */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
            <span>Total Meralco Bill (PHP) <span className="text-red-500">*</span></span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-sm">₱</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={mainBill.totalAmountDue || ''}
              onChange={(e) => onChangeMainBill({ totalAmountDue: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              className="w-full min-h-[44px] pl-8 pr-3.5 py-2.5 text-sm font-semibold bg-white text-slate-900 border border-orange-300/80 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
            />
          </div>
        </div>

        {/* Total Main Meter kWh */}
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
            <span>Total Main kWh <span className="text-red-500">*</span></span>
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="0"
              value={mainBill.totalMainKwh || ''}
              onChange={(e) => onChangeMainBill({ totalMainKwh: parseFloat(e.target.value) || 0 })}
              placeholder="0.0"
              className="w-full min-h-[44px] pl-3.5 pr-14 py-2.5 text-sm font-semibold bg-white text-slate-900 border border-orange-300/80 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">kWh</span>
          </div>
        </div>

        {/* Calculated Effective Rate Callout */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-3.5 text-white flex flex-col justify-between shadow-inner">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              Blended Effective Rate
            </span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1">
            <div className="text-xl font-extrabold text-amber-400 tracking-tight">
              {effectiveRate > 0 ? `${formatPHP(effectiveRate)}` : '₱0.0000'}
              <span className="text-xs text-slate-300 font-normal ml-1">/ kWh</span>
            </div>
            <p className="text-[10px] text-slate-400">Includes generation, VAT & all charges</p>
          </div>
        </div>

        {/* Billing Period From */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Billing Period From
          </label>
          <input
            type="date"
            value={mainBill.periodFrom || ''}
            onChange={(e) => onChangeMainBill({ periodFrom: e.target.value })}
            className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500 transition"
          />
        </div>

        {/* Billing Period To */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Billing Period To
          </label>
          <input
            type="date"
            value={mainBill.periodTo || ''}
            onChange={(e) => onChangeMainBill({ periodTo: e.target.value })}
            className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500 transition"
          />
        </div>

        {/* Payment Due Date */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Tenant Payment Due Date
          </label>
          <input
            type="date"
            value={mainBill.dueDate || ''}
            onChange={(e) => onChangeMainBill({ dueDate: e.target.value })}
            className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500 transition"
          />
        </div>

        {/* Common Area Allocation Rule */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Common Area Share Method
          </label>
          <select
            value={commonAreaAllocMethod}
            onChange={(e) => onChangeAllocMethod(e.target.value as 'equal' | 'proportional')}
            className="w-full min-h-[44px] px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500 transition cursor-pointer"
          >
            <option value="equal">Split Equally among active tenants</option>
            <option value="proportional">Proportional to tenant usage</option>
          </select>
        </div>
      </div>

      {/* Bill Attachment / Optional Photo */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-slate-500" />
          <span>Meralco SOA Attachment:</span>
          {mainBill.billPhotoUrl ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" /> Attached
            </span>
          ) : (
            <span className="text-slate-400 italic">No image attached</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="cursor-pointer min-h-[44px] inline-flex items-center px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-700 font-medium transition shadow-sm">
            <span>{mainBill.billPhotoUrl ? 'Replace Bill Photo' : 'Upload Bill Photo'}</span>
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
              className="min-h-[44px] inline-flex items-center text-red-600 hover:text-red-700 underline text-xs px-2"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
