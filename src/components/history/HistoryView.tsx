import React from 'react';
import { AppData } from '../../types';
import { formatPHP, formatKwh, formatDate } from '../../utils/formatters';
import {
  History,
  CheckCircle2,
  Trash2,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { generateMasterSummaryPdf } from '../../services/pdfGenerator';

interface HistoryViewProps {
  appData: AppData;
  onSelectCycle: (cycleId: string) => void;
  onDeleteCycle: (cycleId: string) => void;
  onNavigateToCalculator: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  appData,
  onSelectCycle,
  onDeleteCycle,
  onNavigateToCalculator,
}) => {
  const cycles = appData.billingCycles;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-orange-500" />
            Billing Cycle Archives & History ({cycles.length})
          </h3>
          <p className="text-xs text-slate-500">
            Review past monthly calculations, consumption trends, and historical statements.
          </p>
        </div>
      </div>

      {cycles.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-sm">
          No billing history recorded yet. Create your first billing cycle to begin!
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Billing Month / Cycle</th>
                  <th className="py-3.5 px-3">Period Dates</th>
                  <th className="py-3.5 px-3 text-right">Main Bill (₱)</th>
                  <th className="py-3.5 px-3 text-right">Main Usage (kWh)</th>
                  <th className="py-3.5 px-3 text-right">Effective Rate</th>
                  <th className="py-3.5 px-3 text-right">Total Collectible</th>
                  <th className="py-3.5 px-3 text-center">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cycles.map((cycle) => {
                  const summary = cycle.calculationSummary;
                  const isActive = cycle.id === appData.activeCycleId;

                  return (
                    <tr
                      key={cycle.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        isActive ? 'bg-orange-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{cycle.name}</span>
                          {isActive && (
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-300">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Created {formatDate(cycle.createdAt)}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-slate-600">
                        <div>{formatDate(cycle.mainBill.periodFrom)} - {formatDate(cycle.mainBill.periodTo)}</div>
                        <div className="text-[10px] text-slate-400">Due: {formatDate(cycle.mainBill.dueDate)}</div>
                      </td>

                      <td className="py-3.5 px-3 text-right font-semibold text-slate-800">
                        {formatPHP(cycle.mainBill.totalAmountDue)}
                      </td>

                      <td className="py-3.5 px-3 text-right font-medium text-slate-700">
                        {formatKwh(cycle.mainBill.totalMainKwh)}
                      </td>

                      <td className="py-3.5 px-3 text-right font-semibold text-orange-600">
                        {summary ? `${formatPHP(summary.effectiveBaseRate)}/kWh` : '-'}
                      </td>

                      <td className="py-3.5 px-3 text-right font-extrabold text-slate-900">
                        {summary ? formatPHP(summary.grandTotalBilled) : '-'}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Ready
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {summary && (
                            <button
                              onClick={() => generateMasterSummaryPdf(cycle, appData.landlordInfo)}
                              title="Download Master PDF"
                              aria-label={`Export master PDF for ${cycle.name}`}
                              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                            >
                              <FileText className="w-4 h-4 text-orange-500" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              onSelectCycle(cycle.id);
                              onNavigateToCalculator();
                            }}
                            aria-label={`Switch to cycle ${cycle.name}`}
                            className={`min-w-[44px] min-h-[44px] inline-flex items-center justify-center p-2.5 rounded-xl gap-1 text-xs font-semibold transition ${
                              isActive
                                ? 'bg-orange-500 text-white shadow-sm'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            <span>{isActive ? 'Open' : 'Select'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          {cycles.length > 1 && (
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete cycle "${cycle.name}"?`)) {
                                  onDeleteCycle(cycle.id);
                                }
                              }}
                              title="Delete Archive"
                              aria-label={`Delete billing cycle ${cycle.name}`}
                              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center p-2.5 rounded-xl text-red-600/70 hover:text-red-700 hover:bg-red-50 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
