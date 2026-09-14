import React from 'react';
import { TenantCalculationResult } from '../../types';
import { TenantPayment, PaymentStatus } from './PaymentStatusModal';
import { formatPHP, formatPercent } from '../../utils/formatters';
import {
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  TrendingUp,
  ShieldCheck,
  Filter,
} from 'lucide-react';

export type PaymentFilterType = 'all' | 'unpaid' | 'paid' | 'partial';

export interface CollectionSummaryBannerProps {
  tenantResults: TenantCalculationResult[];
  payments: Record<string, TenantPayment>;
  totalCollectible: number;
  activeFilter?: PaymentFilterType;
  onSelectFilter?: (filter: PaymentFilterType) => void;
}

export const CollectionSummaryBanner: React.FC<CollectionSummaryBannerProps> = ({
  tenantResults,
  payments,
  totalCollectible,
  activeFilter = 'all',
  onSelectFilter,
}) => {
  // Aggregate stats across all tenants
  let totalCollected = 0;
  let paidCount = 0;
  let partialCount = 0;
  let unpaidCount = 0;

  tenantResults.forEach((t) => {
    const payment = payments[t.unitId];
    if (payment) {
      if (payment.status === 'paid') {
        paidCount++;
        totalCollected += payment.amountPaid > 0 ? payment.amountPaid : t.totalAmountDue;
      } else if (payment.status === 'partial') {
        partialCount++;
        totalCollected += Math.max(0, payment.amountPaid);
      } else {
        unpaidCount++;
      }
    } else {
      unpaidCount++;
    }
  });

  const grandTotal = totalCollectible > 0 ? totalCollectible : tenantResults.reduce((sum, t) => sum + t.totalAmountDue, 0);
  const pendingReceivables = Math.max(0, grandTotal - totalCollected);
  const collectionRate = grandTotal > 0 ? Math.min(100, Math.max(0, (totalCollected / grandTotal) * 100)) : 0;
  const isFullyCollected = grandTotal > 0 && pendingReceivables <= 0.05;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-6">
      {/* Top Title & Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold text-sm">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Collection & Receivables Ledger
            </h2>
            {isFullyCollected && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-in fade-in">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                100% Fully Collected!
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time arrears tracking, GCash/bank payment status, and receivables reconciliation.
          </p>
        </div>

        {/* Status Filter Badges / Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onSelectFilter?.('all')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 border ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <span>All Units</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${activeFilter === 'all' ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-700'}`}>
              {tenantResults.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectFilter?.('paid')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 border ${
              activeFilter === 'paid'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Paid</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${activeFilter === 'paid' ? 'bg-emerald-700 text-white' : 'bg-emerald-200 text-emerald-800'}`}>
              {paidCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectFilter?.('partial')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 border ${
              activeFilter === 'partial'
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'bg-amber-50/70 hover:bg-amber-100 text-amber-900 border-amber-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Partial</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${activeFilter === 'partial' ? 'bg-amber-700 text-white' : 'bg-amber-200 text-amber-900'}`}>
              {partialCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectFilter?.('unpaid')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 border ${
              activeFilter === 'unpaid'
                ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                : 'bg-rose-50/70 hover:bg-rose-100 text-rose-800 border-rose-200'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Pending Unpaid</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${activeFilter === 'unpaid' ? 'bg-rose-700 text-white' : 'bg-rose-200 text-rose-800'}`}>
              {unpaidCount}
            </span>
          </button>
        </div>
      </div>

      {/* 3 Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100 text-xs">
        {/* Card 1: Total Collectible */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 font-medium mb-1">
              <span>Total Collectible</span>
              <DollarSign className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">
              {formatPHP(grandTotal)}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Billed across {tenantResults.length} unit statements</span>
          </div>
        </div>

        {/* Card 2: Total Collected */}
        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-emerald-800 font-medium mb-1">
              <span>Total Collected</span>
              <span className="text-[11px] font-bold bg-emerald-200/80 text-emerald-800 px-2 py-0.5 rounded-full">
                {collectionRate.toFixed(1)}%
              </span>
            </div>
            <div className="text-xl font-extrabold text-emerald-700 font-mono tracking-tight">
              {formatPHP(totalCollected)}
            </div>
          </div>

          <div className="mt-2 space-y-1.5">
            {/* Progress Bar */}
            <div className="w-full bg-emerald-200/60 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${collectionRate}%` }}
              />
            </div>
            <div className="text-[10px] text-emerald-700 flex justify-between font-medium">
              <span>{paidCount} paid, {partialCount} partial</span>
              <span>{formatPercent(collectionRate)} settled</span>
            </div>
          </div>
        </div>

        {/* Card 3: Pending Receivables */}
        <div
          className={`p-4 rounded-2xl border flex flex-col justify-between transition ${
            pendingReceivables > 0
              ? 'bg-amber-50/60 border-amber-200/90 text-amber-950'
              : 'bg-emerald-50/40 border-emerald-200 text-emerald-950'
          }`}
        >
          <div>
            <div className="flex items-center justify-between text-slate-600 font-medium mb-1">
              <span className={pendingReceivables > 0 ? 'text-amber-800 font-semibold' : 'text-emerald-800'}>
                Pending Receivables
              </span>
              <AlertCircle className={`w-4 h-4 ${pendingReceivables > 0 ? 'text-amber-500' : 'text-emerald-500'}`} />
            </div>
            <div
              className={`text-xl font-extrabold font-mono tracking-tight ${
                pendingReceivables > 0 ? 'text-amber-700' : 'text-emerald-600'
              }`}
            >
              {formatPHP(pendingReceivables)}
            </div>
          </div>

          <div className="text-[11px] mt-2 flex items-center justify-between">
            {pendingReceivables > 0 ? (
              <span className="text-amber-800 font-medium">
                {unpaidCount + partialCount} unit(s) awaiting payment
              </span>
            ) : (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Zero outstanding balance
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
