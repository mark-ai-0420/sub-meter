import React from 'react';
import {
  TenantCalculationResult,
  BillingCycle,
  AppData,
} from '../../types';
import { TenantPayment } from '../payments/PaymentStatusModal';
import { formatPHP, formatKwh, formatNumber, formatDate, formatPercent } from '../../utils/formatters';
import {
  Download,
  Share2,
  PlusCircle,
  Zap,
  Tag,
  User,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { generateSingleTenantPdf } from '../../services/pdfGenerator';

export interface ConsumptionHistoryItem {
  cycleName: string;
  kwh: number;
}

export interface AnomalyInfo {
  hasAnomaly: boolean;
  percentSpike: number;
  averageKwh: number;
  severity: 'low' | 'medium' | 'high' | string;
}

export interface TenantSlipCardProps {
  tenant: TenantCalculationResult;
  cycle: BillingCycle;
  landlordInfo: AppData['landlordInfo'];
  onOpenQuickShare: (tenant: TenantCalculationResult) => void;
  onOpenAdditionalCharges: (unitId: string) => void;
  payment?: TenantPayment;
  onUpdatePayment?: (unitId: string) => void;
  consumptionHistory?: ConsumptionHistoryItem[];
  anomaly?: AnomalyInfo;
}

export const TenantSlipCard: React.FC<TenantSlipCardProps> = ({
  tenant,
  cycle,
  landlordInfo,
  onOpenQuickShare,
  onOpenAdditionalCharges,
  payment,
  onUpdatePayment,
  consumptionHistory,
  anomaly,
}) => {
  const isPaid = payment?.status === 'paid';
  const isPartial = payment?.status === 'partial';
  const isUnpaid = !payment || payment.status === 'unpaid';

  // Format payment method display
  const getPaymentMethodLabel = () => {
    if (!payment?.paymentMethod) return '';
    switch (payment.paymentMethod) {
      case 'gcash':
        return 'GCash';
      case 'maya':
        return 'Maya';
      case 'bank_transfer':
        return 'Bank';
      case 'cash':
        return 'Cash';
      case 'other':
        return 'Other';
      default:
        return payment.paymentMethod;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
      {/* Top Card Banner */}
      <div>
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-5 py-4 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-100">{tenant.unitNumber}</span>
              {!tenant.isOccupied && (
                <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                  Vacant
                </span>
              )}
            </div>
            <div className="text-xs text-orange-400 font-medium flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400" />
              <span>{tenant.tenantName}</span>
            </div>

            {/* Prominent Payment Status Badge */}
            <div className="pt-1">
              {isPaid && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>
                    ✓ Paid{getPaymentMethodLabel() ? ` (${getPaymentMethodLabel()}` : ''}
                    {payment.referenceNumber ? ` #${payment.referenceNumber.slice(-6)})` : getPaymentMethodLabel() ? ')' : ''}
                  </span>
                </span>
              )}

              {isPartial && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>
                    ⏳ Partial ({formatPHP(payment.amountPaid)} / {formatPHP(tenant.totalAmountDue)})
                  </span>
                </span>
              )}

              {isUnpaid && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-400/40">
                  <XCircle className="w-3 h-3 text-rose-400" />
                  <span>Unpaid</span>
                </span>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Total Due</div>
            <div className="text-base font-extrabold text-amber-400 font-mono">
              {formatPHP(tenant.totalAmountDue)}
            </div>
            {isPartial && (
              <div className="text-[10px] font-medium text-amber-300 mt-0.5">
                Bal: {formatPHP(Math.max(0, tenant.totalAmountDue - (payment?.amountPaid || 0)))}
              </div>
            )}
          </div>
        </div>

        {/* Card Content / Breakdown */}
        <div className="p-5 space-y-4 text-xs">
          {/* Anomaly Spike Warning Badge if anomaly exists */}
          {anomaly?.hasAnomaly && (
            <div
              className={`p-3 rounded-2xl border flex items-start gap-2.5 text-xs animate-in fade-in duration-200 ${
                anomaly.severity === 'high'
                  ? 'bg-rose-50/90 border-rose-300 text-rose-900'
                  : 'bg-amber-50/90 border-amber-300 text-amber-900'
              }`}
            >
              <AlertTriangle
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  anomaly.severity === 'high' ? 'text-rose-600' : 'text-amber-600'
                }`}
              />
              <div className="space-y-0.5">
                <div className="font-bold flex items-center gap-1">
                  <span>⚠️ +{formatPercent(anomaly.percentSpike, 0)} vs 3-mo average</span>
                  <span className="text-[10px] font-normal opacity-85">
                    ({formatKwh(anomaly.averageKwh)})
                  </span>
                </div>
                <p className="text-[11px] opacity-90 leading-tight">
                  High electricity surge detected compared to previous billing cycles.
                </p>
              </div>
            </div>
          )}

          {/* Meter Readings Grid */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 border-b border-slate-200 pb-1.5">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-orange-500" />
                Electricity Consumption
              </span>
              <span className="text-slate-500 font-mono text-[10px] font-normal">
                {tenant.meterName}
              </span>
            </div>

            {tenant.isMainLine ? (
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-900 text-[11px] font-medium flex items-center justify-between">
                <span>⚡ Connection Type:</span>
                <span className="font-bold">Main Line (Direct)</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>
                  <span className="text-slate-400 block text-[10px]">Previous Dial</span>
                  <span className="font-semibold font-mono text-slate-800">
                    {formatNumber(tenant.previousReading, 1)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Present Dial</span>
                  <span className="font-bold font-mono text-slate-900">
                    {formatNumber(tenant.presentReading, 1)}
                  </span>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200/70 space-y-1 text-slate-700">
              <div className="flex justify-between">
                <span>Direct Unit Consumption:</span>
                <span className="font-bold">{formatKwh(tenant.directKwh)}</span>
              </div>
              {tenant.commonAreaShareKwh > 0 && (
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>+ Common Area Share:</span>
                  <span>+{formatKwh(tenant.commonAreaShareKwh)}</span>
                </div>
              )}
              {tenant.lossShareKwh > 0 && (
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>+ Line Loss / Discrepancy Share:</span>
                  <span>+{formatKwh(tenant.lossShareKwh)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-slate-200 font-semibold text-orange-600">
                <span>Effective Total kWh:</span>
                <span>{formatKwh(tenant.effectiveKwh)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>Effective Rate:</span>
                <span>{formatPHP(tenant.effectiveRate)}/kWh</span>
              </div>
              <div className="flex justify-between pt-1 font-bold text-slate-900">
                <span>Electricity Amount:</span>
                <span>{formatPHP(tenant.electricityAmount)}</span>
              </div>
            </div>
          </div>

          {/* Mini Consumption Trendline (past 3-4 months bars) */}
          {consumptionHistory && consumptionHistory.length > 0 && (
            <div className="bg-slate-50/70 rounded-2xl p-3 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-orange-500" />
                  Usage Trendline
                </span>
                <span className="text-[10px] text-slate-500 font-normal font-mono">
                  {consumptionHistory.length} Cycles
                </span>
              </div>

              <div className="flex items-end justify-between gap-2 h-14 pt-1 px-1">
                {consumptionHistory.map((item, idx) => {
                  const isCurrent = idx === consumptionHistory.length - 1;
                  const maxKwh = Math.max(...consumptionHistory.map((h) => h.kwh), 1);
                  const barHeight = Math.max(15, Math.min(100, (item.kwh / maxKwh) * 100));

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                      <span className="text-[9px] font-mono text-slate-600 font-semibold group-hover:text-orange-600 transition">
                        {formatNumber(item.kwh, 0)}
                      </span>
                      <div className="w-full bg-slate-200/60 rounded-t-md h-8 flex items-end overflow-hidden">
                        <div
                          className={`w-full rounded-t-md transition-all duration-300 ${
                            isCurrent
                              ? 'bg-gradient-to-t from-orange-500 to-amber-400 shadow-sm'
                              : 'bg-slate-400 group-hover:bg-slate-500'
                          }`}
                          style={{ height: `${barHeight}%` }}
                        />
                      </div>
                      <span
                        className={`text-[9px] truncate max-w-[46px] ${
                          isCurrent ? 'font-bold text-orange-600' : 'text-slate-500'
                        }`}
                        title={item.cycleName}
                      >
                        {item.cycleName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Additional Attached Line Items */}
          <div className="bg-slate-50/60 rounded-2xl p-3 border border-slate-200/80">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-500" />
                Other Charges / Fees ({tenant.additionalCharges.length})
              </span>
              <button
                type="button"
                onClick={() => onOpenAdditionalCharges(tenant.unitId)}
                className="text-blue-600 hover:text-blue-800 text-[11px] font-semibold flex items-center gap-0.5 transition active:scale-95"
              >
                <PlusCircle className="w-3 h-3" />
                Edit
              </button>
            </div>

            {tenant.additionalCharges.length === 0 ? (
              <div className="text-slate-400 text-[11px] italic py-0.5">
                No extra charges (water, garbage, dues) attached.
              </div>
            ) : (
              <div className="space-y-1 text-slate-600">
                {tenant.additionalCharges.map((item) => (
                  <div key={item.id} className="flex justify-between text-[11px]">
                    <span className="truncate max-w-[170px]">{item.name}</span>
                    <span className="font-mono font-medium text-slate-800">
                      {item.amount < 0 ? '-' : ''}
                      {formatPHP(Math.abs(item.amount))}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold text-slate-900 text-xs">
                  <span>Other Subtotal:</span>
                  <span>{formatPHP(tenant.additionalTotal)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Due Date & Note */}
          <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              Due: <strong className="text-slate-700">{formatDate(cycle.mainBill.dueDate)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Card Action Buttons Bar */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
        {/* Direct Button: [💳 Log / Update Payment] */}
        {onUpdatePayment ? (
          <button
            type="button"
            onClick={() => onUpdatePayment(tenant.unitId)}
            className={`inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition active:scale-95 shadow-sm border ${
              isPaid
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                : isPartial
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
            }`}
          >
            <CreditCard className={`w-3.5 h-3.5 ${isPaid ? 'text-emerald-600' : isPartial ? 'text-amber-600' : 'text-blue-600'}`} />
            <span>{isPaid ? 'Payment Logged' : isPartial ? 'Update Payment' : 'Log Payment'}</span>
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-1.5 flex-1 justify-end">
          <button
            type="button"
            onClick={() => onOpenQuickShare(tenant)}
            className="inline-flex items-center justify-center gap-1 px-2.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-sm transition active:scale-95"
            title="Copy message for Viber or SMS"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Viber / SMS</span>
          </button>

          <button
            type="button"
            onClick={() => generateSingleTenantPdf(tenant, cycle, landlordInfo)}
            className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-sm shadow-orange-500/20 transition active:scale-95"
            title="Download PDF statement"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
