import React from 'react';
import {
  TenantCalculationResult,
  CommonAreaBreakdown,
  SubMeter,
  TenantUnit,
} from '../../types';
import { formatPHP, formatKwh, formatNumber } from '../../utils/formatters';
import {
  Gauge,
  PlusCircle,
  AlertTriangle,
  Users,
  Lightbulb,
  Building,
  UserCheck,
  UserX,
} from 'lucide-react';

interface SubMeterReadingTableProps {
  tenantResults: TenantCalculationResult[];
  commonAreaBreakdown: CommonAreaBreakdown[];
  meters: SubMeter[];
  readings: Record<string, { previous: number; present: number }>;
  onUpdateReading: (meterId: string, field: 'previous' | 'present', value: number) => void;
  onOpenAdditionalCharges: (unitId: string) => void;
  onToggleOccupied: (unitId: string) => void;
}

export const SubMeterReadingTable: React.FC<SubMeterReadingTableProps> = ({
  tenantResults,
  commonAreaBreakdown,
  meters,
  readings,
  onUpdateReading,
  onOpenAdditionalCharges,
  onToggleOccupied,
}) => {
  const commonMeters = meters.filter((m) => m.type === 'common');

  return (
    <div className="space-y-6">
      {/* Tenant Sub-meters Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-5 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Tenant Sub-Meter Dial Readings
              </h3>
              <p className="text-xs text-slate-400">
                Enter current meter readings. Direct consumption, common shares, and charges compute in real-time.
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-300 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>{tenantResults.filter((t) => t.isOccupied).length} Occupied</span>
            <span className="text-slate-500">|</span>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-400"></span>
            <span>{tenantResults.filter((t) => !t.isOccupied).length} Vacant</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <th className="py-3 px-4">Unit / Tenant</th>
                <th className="py-3 px-3">Sub-Meter</th>
                <th className="py-3 px-3 w-28">Prev Dial</th>
                <th className="py-3 px-3 w-32">Pres Dial (Input)</th>
                <th className="py-3 px-3 text-right">Direct kWh</th>
                <th className="py-3 px-3 text-right hidden lg:table-cell">Common / Loss</th>
                <th className="py-3 px-3 text-right">Total kWh</th>
                <th className="py-3 px-3 text-right">Electricity</th>
                <th className="py-3 px-3 text-right">Other Fees</th>
                <th className="py-3 px-4 text-right">Total Due</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
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
                  <tr
                    key={tenant.unitId}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      !tenant.isOccupied ? 'opacity-60 bg-slate-50/50' : ''
                    }`}
                  >
                    {/* Unit & Tenant Info */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <span>{tenant.unitNumber}</span>
                        {!tenant.isOccupied && (
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-normal">
                            Vacant
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">{tenant.tenantName}</div>
                    </td>

                    {/* Sub-meter identifier */}
                    <td className="py-3 px-3 text-slate-600">
                      <div className="font-medium truncate max-w-[130px]" title={tenant.meterName}>
                        {tenant.meterName}
                      </div>
                      {tenant.meterNumber && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          #{tenant.meterNumber}
                        </div>
                      )}
                    </td>

                    {/* Previous Reading Dial */}
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={prev ?? ''}
                        onChange={(e) =>
                          meterId &&
                          onUpdateReading(meterId, 'previous', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2.5 py-1 text-xs bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-mono text-right focus:bg-white focus:ring-1 focus:ring-orange-500"
                      />
                    </td>

                    {/* Present Reading Dial */}
                    <td className="py-3 px-3">
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
                          className={`w-full px-2.5 py-1 text-xs font-mono font-bold text-right border rounded-lg transition ${
                            isDecreasing
                              ? 'bg-red-50 border-red-300 text-red-700 focus:ring-red-500'
                              : 'bg-white border-orange-300 text-slate-900 focus:ring-2 focus:ring-orange-500'
                          }`}
                        />
                        {isDecreasing && (
                          <span
                            title="Present reading is lower than previous reading!"
                            className="absolute -top-1 -right-1 text-red-500 bg-white rounded-full"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 fill-red-500 text-white" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Direct kWh */}
                    <td className="py-3 px-3 text-right font-semibold text-slate-800">
                      {formatNumber(tenant.directKwh, 1)}
                      <span className="text-[10px] text-slate-400 ml-0.5">kWh</span>
                    </td>

                    {/* Common & Loss Allocation */}
                    <td className="py-3 px-3 text-right hidden lg:table-cell text-[11px] text-slate-500">
                      <div>+{formatNumber(tenant.commonAreaShareKwh, 1)} com</div>
                      <div>+{formatNumber(tenant.lossShareKwh, 1)} loss</div>
                    </td>

                    {/* Effective Total kWh */}
                    <td className="py-3 px-3 text-right font-bold text-orange-600">
                      {formatNumber(tenant.effectiveKwh, 1)}
                      <span className="text-[10px] text-orange-400 ml-0.5">kWh</span>
                    </td>

                    {/* Electricity Charge */}
                    <td className="py-3 px-3 text-right font-semibold text-slate-800">
                      {formatPHP(tenant.electricityAmount)}
                    </td>

                    {/* Other Fees Subtotal */}
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onOpenAdditionalCharges(tenant.unitId)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium transition border ${
                          tenant.additionalTotal !== 0
                            ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                            : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{formatPHP(tenant.additionalTotal)}</span>
                        <PlusCircle className="w-3 h-3 text-slate-400" />
                      </button>
                    </td>

                    {/* Total Amount Due */}
                    <td className="py-3 px-4 text-right font-extrabold text-orange-950 bg-orange-50/40">
                      {formatPHP(tenant.totalAmountDue)}
                    </td>

                    {/* Occupancy Toggle */}
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleOccupied(tenant.unitId)}
                        title={tenant.isOccupied ? 'Set as Vacant' : 'Set as Occupied'}
                        className={`p-1.5 rounded-lg transition ${
                          tenant.isOccupied
                            ? 'text-emerald-600 hover:bg-emerald-50'
                            : 'text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {tenant.isOccupied ? (
                          <UserCheck className="w-4 h-4" />
                        ) : (
                          <UserX className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Common Area Meters Sub-Section */}
      {commonMeters.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-800 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Dedicated Common Area Sub-Meters (e.g. Water Pump, Hallways)
              </h4>
            </div>
            <span className="text-xs text-slate-400">
              Total Common: {formatKwh(commonAreaBreakdown.reduce((sum, c) => sum + c.kwh, 0))}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase">
                  <th className="py-2.5 px-4">Common Meter Name</th>
                  <th className="py-2.5 px-3 w-32">Prev Dial</th>
                  <th className="py-2.5 px-3 w-36">Pres Dial (Input)</th>
                  <th className="py-2.5 px-3 text-right">Total Usage</th>
                  <th className="py-2.5 px-3 text-right">Total Cost</th>
                  <th className="py-2.5 px-4 text-right">Share per Tenant Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {commonAreaBreakdown.map((cm) => {
                  const reading = readings[cm.meterId];
                  const prev = reading?.previous ?? cm.previousReading;
                  const pres = reading?.present ?? cm.presentReading;

                  return (
                    <tr key={cm.meterId} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        {cm.name}
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={prev ?? ''}
                          onChange={(e) =>
                            onUpdateReading(cm.meterId, 'previous', parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-2.5 py-1 text-xs bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-mono text-right focus:bg-white focus:ring-1 focus:ring-amber-500"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={pres ?? ''}
                          onChange={(e) =>
                            onUpdateReading(cm.meterId, 'present', parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-2.5 py-1 text-xs font-mono font-bold text-right bg-white border border-amber-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-amber-500"
                        />
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-800">
                        {formatKwh(cm.kwh)}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-slate-700">
                        {formatPHP(cm.cost)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-amber-700">
                        +{formatKwh(cm.sharePerTenantKwh)} ({formatPHP(cm.sharePerTenantCost)}) / unit
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
