import React from 'react';
import {
  CycleCalculationSummary,
  BillingCycle,
  AppData,
} from '../../types';
import { formatPHP, formatKwh, formatPercent } from '../../utils/formatters';
import {
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  FileSpreadsheet,
  FileText,
  Share2,
  Zap,
  DollarSign,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { generateMasterSummaryPdf, exportMasterSummaryCsv } from '../../services/pdfGenerator';

interface CalculationSummaryProps {
  summary: CycleCalculationSummary;
  cycle: BillingCycle;
  landlordInfo: AppData['landlordInfo'];
  onNavigateToStatements: () => void;
}

export const CalculationSummary: React.FC<CalculationSummaryProps> = ({
  summary,
  cycle,
  landlordInfo,
  onNavigateToStatements,
}) => {
  const isDiffZero = Math.abs(summary.totalElectricityBilled - summary.meralcoTotalAmount) < 0.02;

  return (
    <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
      {/* Top Banner with Reconciliation Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">
              Billing Allocation Summary & Reconciliation
            </h3>
            {isDiffZero ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                100% Balanced (₱0.00 Diff)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Unallocated Difference
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Every centavo of your Meralco bill is accounted for and distributed fairly across all units.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => generateMasterSummaryPdf(cycle, landlordInfo)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-orange-400" />
            Master PDF
          </button>
          <button
            onClick={() => exportMasterSummaryCsv(cycle, landlordInfo)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition border border-slate-200"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export CSV
          </button>
          <button
            onClick={onNavigateToStatements}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-orange-500/20"
          >
            <Share2 className="w-3.5 h-3.5" />
            Generate Tenant Slips
          </button>
        </div>
      </div>

      {/* 4 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        {/* 1. Meralco Primary Bill */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Primary Meralco Bill</span>
            <Zap className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            {formatPHP(summary.meralcoTotalAmount)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Total Main Meter:</span>
            <span className="font-semibold text-slate-700">{formatKwh(summary.totalMainKwh)}</span>
          </div>
        </div>

        {/* 2. Effective Rate */}
        <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-200">
          <div className="flex items-center justify-between text-orange-700 text-xs font-medium mb-1">
            <span>Blended Base Rate</span>
            <Activity className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-xl font-extrabold text-orange-600">
            {formatPHP(summary.effectiveBaseRate)}
            <span className="text-xs font-normal text-orange-800 ml-1">/ kWh</span>
          </div>
          <div className="text-xs text-orange-800/80 mt-1 flex items-center justify-between">
            <span>Tenant Direct kWh:</span>
            <span className="font-semibold">{formatKwh(summary.totalTenantDirectKwh)}</span>
          </div>
        </div>

        {/* 3. Line Loss & Common Area */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Line Loss / Discrepancy</span>
            <TrendingDown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            {formatKwh(summary.residualLossKwh)}
            <span className="text-xs font-normal text-slate-500 ml-1.5">
              ({formatPercent(summary.residualLossPercent)})
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>Loss Cost (Absorbed):</span>
            <span className="font-semibold text-slate-700">{formatPHP(summary.residualLossCost)}</span>
          </div>
        </div>

        {/* 4. Total Collectible */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Grand Total Collectible</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-extrabold text-emerald-400">
            {formatPHP(summary.grandTotalBilled)}
          </div>
          <div className="text-xs text-slate-300 mt-1 flex items-center justify-between">
            <span>Incl. Other Fees:</span>
            <span className="font-semibold text-white">{formatPHP(summary.totalAdditionalCharges)}</span>
          </div>
        </div>
      </div>

      {/* Energy Flow Balance Breakdown */}
      <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 text-xs space-y-2">
        <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-orange-500" />
          Power Consumption Allocation Breakdown
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-slate-600">
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <div className="font-semibold text-slate-700">1. Tenant Sub-Meters</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {formatKwh(summary.totalTenantDirectKwh)}
            </div>
            <div className="text-[11px] text-slate-500">Direct unit sub-meter readings</div>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <div className="font-semibold text-slate-700">2. Common Area Meters</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              +{formatKwh(summary.totalCommonAreaKwh)}
            </div>
            <div className="text-[11px] text-slate-500">Hallway lighting, shared water pump</div>
          </div>

          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <div className="font-semibold text-slate-700">3. Line Loss / Unmetered Gap</div>
            <div className="text-sm font-bold text-amber-700 mt-0.5">
              +{formatKwh(summary.residualLossKwh)}
            </div>
            <div className="text-[11px] text-slate-500">Distributed proportionally to usage</div>
          </div>
        </div>
      </div>
    </div>
  );
};
