import React from 'react';
import {
  BillingCycle,
  AppData,
} from '../../types';
import { formatPHP, formatKwh, formatNumber } from '../../utils/formatters';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Share2,
  Layers,
} from 'lucide-react';
import {
  generateMasterSummaryPdf,
  exportMasterSummaryCsv,
  downloadAllIndividualPdfs,
} from '../../services/pdfGenerator';

interface MasterSummaryTableProps {
  cycle: BillingCycle;
  landlordInfo: AppData['landlordInfo'];
  onOpenGroupShare: () => void;
}

export const MasterSummaryTable: React.FC<MasterSummaryTableProps> = ({
  cycle,
  landlordInfo,
  onOpenGroupShare,
}) => {
  const summary = cycle.calculationSummary;
  if (!summary) {
    return <div className="text-slate-400 text-sm">No calculation summary available.</div>;
  }

  const handleDownloadAllPdfs = () => {
    downloadAllIndividualPdfs(cycle, landlordInfo);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden mb-8">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold flex items-center gap-2">
            <Layers className="w-5 h-5 text-orange-400" />
            Master Landlord Billing Allocation Sheet
          </h3>
          <p className="text-xs text-slate-400">
            Comprehensive audit table for all apartment units, sub-meters, and collected charges.
          </p>
        </div>

        {/* Master Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenGroupShare}
            aria-label="Copy group breakdown text"
            className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition border border-slate-700 shadow-sm active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-400" />
            Copy Group Text
          </button>
          <button
            onClick={() => exportMasterSummaryCsv(cycle, landlordInfo)}
            aria-label="Export master CSV spreadsheet"
            className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition border border-slate-700 shadow-sm active:scale-95"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            Export CSV / Excel
          </button>
          <button
            onClick={() => generateMasterSummaryPdf(cycle, landlordInfo)}
            aria-label="Download master PDF summary"
            className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 sm:py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition border border-slate-700 shadow-sm active:scale-95"
          >
            <FileText className="w-3.5 h-3.5 text-orange-400" />
            Master PDF
          </button>
          <button
            onClick={handleDownloadAllPdfs}
            aria-label="Download all individual PDF slips"
            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 sm:py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition shadow-sm shadow-orange-500/20 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            Download All Slips (PDF)
          </button>
        </div>
      </div>

      {/* Audit Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <th className="py-3 px-4">Unit / Tenant</th>
              <th className="py-3 px-3 text-right">Prev Reading</th>
              <th className="py-3 px-3 text-right">Pres Reading</th>
              <th className="py-3 px-3 text-right">Direct Usage</th>
              <th className="py-3 px-3 text-right">Common Area</th>
              <th className="py-3 px-3 text-right">Loss Share</th>
              <th className="py-3 px-3 text-right">Effective kWh</th>
              <th className="py-3 px-3 text-right">Rate</th>
              <th className="py-3 px-3 text-right">Electricity (₱)</th>
              <th className="py-3 px-3 text-right">Other Fees (₱)</th>
              <th className="py-3 px-4 text-right">Total Due (₱)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {summary.tenantResults.map((t) => (
              <tr
                key={t.unitId}
                className={`hover:bg-slate-50 transition-colors ${
                  !t.isOccupied ? 'opacity-60 bg-slate-50/50' : ''
                }`}
              >
                <td className="py-3 px-4">
                  <div className="font-bold text-slate-900">{t.unitNumber}</div>
                  <div className="text-[11px] text-slate-500">{t.tenantName}</div>
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-600">
                  {formatNumber(t.previousReading, 1)}
                </td>
                <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800">
                  {formatNumber(t.presentReading, 1)}
                </td>
                <td className="py-3 px-3 text-right font-semibold text-slate-800">
                  {formatKwh(t.directKwh)}
                </td>
                <td className="py-3 px-3 text-right text-slate-600">
                  +{formatKwh(t.commonAreaShareKwh)}
                </td>
                <td className="py-3 px-3 text-right text-slate-600">
                  +{formatKwh(t.lossShareKwh)}
                </td>
                <td className="py-3 px-3 text-right font-bold text-orange-600">
                  {formatKwh(t.effectiveKwh)}
                </td>
                <td className="py-3 px-3 text-right text-slate-600">
                  {formatPHP(t.effectiveRate)}
                </td>
                <td className="py-3 px-3 text-right font-bold text-slate-800">
                  {formatPHP(t.electricityAmount)}
                </td>
                <td className="py-3 px-3 text-right text-slate-600">
                  {formatPHP(t.additionalTotal)}
                </td>
                <td className="py-3 px-4 text-right font-extrabold text-orange-950 bg-orange-50/30">
                  {formatPHP(t.totalAmountDue)}
                </td>
              </tr>
            ))}
          </tbody>

          {/* Table Footer Totals */}
          <tfoot>
            <tr className="bg-slate-900 text-white font-bold border-t-2 border-slate-800">
              <td className="py-3.5 px-4 font-bold text-orange-400">
                TOTAL ({summary.tenantResults.length} Units)
              </td>
              <td className="py-3.5 px-3 text-right text-slate-400">-</td>
              <td className="py-3.5 px-3 text-right text-slate-400">-</td>
              <td className="py-3.5 px-3 text-right">{formatKwh(summary.totalTenantDirectKwh)}</td>
              <td className="py-3.5 px-3 text-right">+{formatKwh(summary.totalCommonAreaKwh)}</td>
              <td className="py-3.5 px-3 text-right">+{formatKwh(summary.residualLossKwh)}</td>
              <td className="py-3.5 px-3 text-right text-orange-400 font-extrabold">
                {formatKwh(summary.totalMainKwh)}
              </td>
              <td className="py-3.5 px-3 text-right text-slate-300">
                {formatPHP(summary.effectiveBaseRate)}
              </td>
              <td className="py-3.5 px-3 text-right text-amber-300 font-extrabold">
                {formatPHP(summary.totalElectricityBilled)}
              </td>
              <td className="py-3.5 px-3 text-right text-slate-300">
                {formatPHP(summary.totalAdditionalCharges)}
              </td>
              <td className="py-3.5 px-4 text-right text-emerald-400 font-extrabold text-sm">
                {formatPHP(summary.grandTotalBilled)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
