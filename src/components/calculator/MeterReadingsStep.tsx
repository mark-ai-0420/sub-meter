import React, { useState } from 'react';
import {
  TenantCalculationResult,
  CommonAreaBreakdown,
  SubMeter,
  BillingCycle,
} from '../../types';
import { formatPHP, formatKwh, formatNumber } from '../../utils/formatters';
import {
  Gauge,
  PlusCircle,
  AlertTriangle,
  Lightbulb,
  UserCheck,
  UserX,
  ArrowLeft,
  ArrowRight,
  Zap,
  Tag,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface MeterReadingsStepProps {
  tenantResults: TenantCalculationResult[];
  commonAreaBreakdown: CommonAreaBreakdown[];
  meters: SubMeter[];
  readings: Record<string, { previous: number; present: number }>;
  residualGapKwh?: number;
  hasMainLineUnit?: boolean;
  precedingCycle?: BillingCycle;
  onSyncPreviousReadings?: (sourceCycleId: string) => void;
  onAddMainLineUnit?: () => void;
  onUpdateReading: (meterId: string, field: 'previous' | 'present', value: number) => void;
  onOpenAdditionalCharges: (unitId: string) => void;
  onToggleOccupied: (unitId: string) => void;
  onPrevStep: () => void;
  onNextStep: () => void;
}

export const MeterReadingsStep: React.FC<MeterReadingsStepProps> = ({
  tenantResults,
  commonAreaBreakdown,
  meters,
  readings,
  residualGapKwh = 0,
  hasMainLineUnit = false,
  precedingCycle,
  onSyncPreviousReadings,
  onAddMainLineUnit,
  onUpdateReading,
  onOpenAdditionalCharges,
  onToggleOccupied,
  onPrevStep,
  onNextStep,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(false);

  const handleSyncClick = () => {
    if (!precedingCycle || !onSyncPreviousReadings) return;
    setIsSyncing(true);
    try {
      onSyncPreviousReadings(precedingCycle.id);
      setSyncFeedback(true);
      setTimeout(() => {
        setSyncFeedback(false);
      }, 4500);
    } finally {
      setTimeout(() => {
        setIsSyncing(false);
      }, 300);
    }
  };
  const commonMeters = meters.filter((m) => m.type === 'common');

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Step Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2.5 tracking-tight">
            <span className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold text-sm">
              2
            </span>
            Enter Sub-Meter Dial Readings
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Input current meter dials. Previous dials were auto-filled from last month.
          </p>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-3 text-xs bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <UserCheck className="w-3.5 h-3.5" />
            <span>{tenantResults.filter((t) => t.isOccupied).length} Occupied</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
            <UserX className="w-3.5 h-3.5" />
            <span>{tenantResults.filter((t) => !t.isOccupied).length} Vacant</span>
          </div>
        </div>
      </div>

      {/* Dial Continuity Sync Banner */}
      {precedingCycle && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-emerald-500/5 to-teal-500/10 border border-amber-300/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-800 flex items-center justify-center flex-shrink-0 font-bold border border-amber-300/80">
              <RefreshCw className={`w-5 h-5 text-amber-700 ${isSyncing ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <span>🔄 Dial Continuity Sync</span>
                </h4>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-amber-100/80 text-amber-900 rounded-full border border-amber-200">
                  Source: {precedingCycle.name}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Your previous dials were initialized from <strong className="font-semibold text-slate-800">{precedingCycle.name}</strong>. If you recently updated dials in that month, click to sync:
              </p>
              {syncFeedback && (
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-300 animate-in fade-in zoom-in-95 duration-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>✓ Previous dials synced! Present entries preserved.</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-shrink-0">
            <button
              type="button"
              onClick={handleSyncClick}
              disabled={isSyncing}
              aria-label={`Sync Previous Dials from ${precedingCycle.name}`}
              className="min-h-[44px] w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-extrabold text-xs rounded-2xl shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>🔄 Sync Previous Dials from {precedingCycle.name}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Line Remainder Callout (If user has 4 units but only 3 are configured) */}
      {!hasMainLineUnit && residualGapKwh > 0.1 && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50 border-2 border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-800 flex items-center justify-center flex-shrink-0 font-bold border border-amber-300">
              <Zap className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-extrabold text-amber-950">
                  {formatKwh(residualGapKwh)} Remainder on Main Line
                </h4>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full">
                  Unallocated to Unit
                </span>
              </div>
              <p className="text-xs text-amber-900/80 mt-1 max-w-2xl leading-relaxed">
                You have {tenantResults.length} sub-metered units. The remaining <strong>{formatKwh(residualGapKwh)}</strong> is currently treated as line loss and inflated onto Unit 3 & Unit 4. Click below to add <strong>Unit 1 (Main Line)</strong> so each unit gets its own clean, accurate bill!
              </p>
            </div>
          </div>
          {onAddMainLineUnit && (
            <button
              type="button"
              onClick={onAddMainLineUnit}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-extrabold text-xs rounded-2xl shadow-md shadow-amber-500/20 transition whitespace-nowrap active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Add Unit 1 (Main Line)</span>
            </button>
          )}
        </div>
      )}

      {/* Tenant Reading Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {tenantResults.map((tenant) => {
          const tenantMeter = meters.find(
            (m) => m.unitId === tenant.unitId && m.type === 'tenant'
          );
          const meterId = tenantMeter?.id;
          const reading = meterId ? readings[meterId] : undefined;
          const prev = reading?.previous ?? tenant.previousReading;
          const pres = reading?.present ?? tenant.presentReading;
          const isDecreasing = pres < prev;

          return (
            <div
              key={tenant.unitId}
              className={`bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all p-6 space-y-5 flex flex-col justify-between ${
                !tenant.isOccupied ? 'opacity-65 bg-slate-50/60' : ''
              }`}
            >
              {/* Unit Card Header */}
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-slate-900">
                        {tenant.unitNumber}
                      </h3>
                      {tenant.isOccupied ? (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full border border-slate-200">
                          Vacant
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">
                      {tenant.tenantName}
                    </div>
                  </div>

                  {/* Occupancy Toggle */}
                  <button
                    type="button"
                    onClick={() => onToggleOccupied(tenant.unitId)}
                    title={tenant.isOccupied ? 'Click to set Vacant' : 'Click to set Occupied'}
                    className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                      tenant.isOccupied
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {tenant.isOccupied ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Occupied</span>
                      </>
                    ) : (
                      <>
                        <UserX className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Vacant</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Sub-Meter Info Banner */}
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                  <span className="font-medium text-slate-600 truncate max-w-[200px]">
                    {tenant.isMainLine ? '⚡ Connected to Main Line' : tenant.meterName}
                  </span>
                  {tenant.meterNumber && (
                    <span className="font-mono text-slate-400">
                      {tenant.isMainLine ? 'MAIN' : `#${tenant.meterNumber}`}
                    </span>
                  )}
                </div>

                {tenant.isMainLine ? (
                  /* Main Line Auto-Calculated Box */
                  <div className="mt-4 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                    <div className="flex items-center justify-between text-xs text-amber-950 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-600" />
                        Main Line Direct Consumption
                      </span>
                      <span className="text-[10px] uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                        Auto-Calculated
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-900/80">
                      Calculated as: <strong>Main Meter kWh ({tenant.effectiveRate > 0 ? formatKwh(tenant.directKwh) : '0 kWh'})</strong> minus all sub-meter readings.
                    </p>
                  </div>
                ) : (
                  /* Large Dial Inputs Grid for Sub-meters */
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {/* Previous Dial */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Previous Dial
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={prev ?? ''}
                          onChange={(e) =>
                            meterId &&
                            onUpdateReading(meterId, 'previous', parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-3.5 py-2.5 text-base font-mono font-bold text-right bg-slate-100/80 border border-slate-200 rounded-2xl text-slate-700 focus:bg-white focus:ring-2 focus:ring-orange-500 transition"
                        />
                      </div>
                    </div>

                    {/* Present Dial (Main Input) */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-orange-950 flex items-center justify-between">
                        <span>Present Dial</span>
                        <span className="text-orange-600 font-bold">*Input</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={pres ?? ''}
                          onChange={(e) =>
                            meterId &&
                            onUpdateReading(meterId, 'present', parseFloat(e.target.value) || 0)
                          }
                          className={`w-full px-3.5 py-2.5 text-base font-mono font-extrabold text-right border rounded-2xl transition ${
                            isDecreasing
                              ? 'bg-red-50 border-red-300 text-red-700 focus:ring-red-500'
                              : 'bg-white border-orange-300 text-slate-900 focus:ring-2 focus:ring-orange-500'
                          }`}
                        />
                        {isDecreasing && (
                          <span
                            title="Present reading is lower than previous reading!"
                            className="absolute -top-1 -right-1 text-red-500 bg-white rounded-full shadow"
                          >
                            <AlertTriangle className="w-4 h-4 fill-red-500 text-white" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Real-Time Direct Usage & Charges Summary */}
                <div className="mt-5 p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Direct Unit Usage:</span>
                    <span className="font-extrabold text-slate-900 font-mono text-sm">
                      {formatKwh(tenant.directKwh)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span>Common & Line Loss Share:</span>
                    <span>+{formatKwh(tenant.commonAreaShareKwh + tenant.lossShareKwh)}</span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 font-bold">
                    <span className="text-slate-700">Electricity Subtotal:</span>
                    <span className="text-orange-600 font-extrabold text-sm">
                      {formatPHP(tenant.electricityAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer / Additional Charges */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => onOpenAdditionalCharges(tenant.unitId)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                    tenant.additionalTotal !== 0
                      ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>
                    {tenant.additionalTotal !== 0
                      ? `Other Fees: ${formatPHP(tenant.additionalTotal)}`
                      : '+ Add Extra Fees (Water/Garbage)'}
                  </span>
                </button>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Due</span>
                  <span className="text-base font-extrabold text-slate-900">
                    {formatPHP(tenant.totalAmountDue)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dedicated Common Area Sub-Meters Section */}
      {commonMeters.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7 space-y-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Dedicated Common Area Sub-Meters
              </h3>
              <p className="text-xs text-slate-500">
                Enter dials for shared facilities (e.g. Shared Water Pump, Hallway Lights).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {commonAreaBreakdown.map((cm) => {
              const reading = readings[cm.meterId];
              const prev = reading?.previous ?? cm.previousReading;
              const pres = reading?.present ?? cm.presentReading;

              return (
                <div
                  key={cm.meterId}
                  className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{cm.name}</span>
                    <span className="text-xs font-bold text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-full">
                      Total: {formatKwh(cm.kwh)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Prev Dial
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={prev ?? ''}
                        onChange={(e) =>
                          onUpdateReading(cm.meterId, 'previous', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 text-sm font-mono bg-white border border-slate-300 rounded-xl text-right"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-amber-950 mb-1">
                        Pres Dial (Input)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={pres ?? ''}
                        onChange={(e) =>
                          onUpdateReading(cm.meterId, 'present', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 text-sm font-mono font-bold bg-amber-50 border border-amber-300 rounded-xl text-right focus:bg-white focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="text-xs text-amber-900/80 flex items-center justify-between pt-1 border-t border-amber-200/60">
                    <span>Each Tenant's Share:</span>
                    <span className="font-bold">
                      +{formatKwh(cm.sharePerTenantKwh)} ({formatPHP(cm.sharePerTenantCost)})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={onPrevStep}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-2xl shadow-sm transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Meralco Bill</span>
        </button>

        <button
          type="button"
          onClick={onNextStep}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-bold rounded-2xl shadow-md shadow-orange-500/20 transition active:scale-95"
        >
          <span>Next: Review & Generate Slips</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
