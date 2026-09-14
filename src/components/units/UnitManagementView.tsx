import React, { useState } from 'react';
import { TenantUnit, SubMeter, AppData } from '../../types';
import { UnitModal } from './UnitModal';
import { CommonMeterModal } from './CommonMeterModal';
import { PresetTemplatesModal } from '../settings/PresetTemplatesModal';
import {
  Building,
  Plus,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  Gauge,
  Lightbulb,
  Phone,
  Mail,
  Zap,
  Sparkles,
  LayoutTemplate,
  CheckCircle2,
} from 'lucide-react';
import { formatNumber } from '../../utils/formatters';

interface UnitManagementViewProps {
  units: TenantUnit[];
  meters: SubMeter[];
  onSaveUnit: (unitData: TenantUnit, meterData: SubMeter) => void;
  onDeleteUnit: (unitId: string) => void;
  onToggleOccupied: (unitId: string) => void;
  onSaveCommonMeter: (meterData: SubMeter) => void;
  onDeleteCommonMeter: (meterId: string) => void;
  onImportData?: (data: AppData) => void;
}

export const UnitManagementView: React.FC<UnitManagementViewProps> = ({
  units,
  meters,
  onSaveUnit,
  onDeleteUnit,
  onToggleOccupied,
  onSaveCommonMeter,
  onDeleteCommonMeter,
  onImportData,
}) => {
  const [selectedUnit, setSelectedUnit] = useState<TenantUnit | null>(null);
  const [selectedMeter, setSelectedMeter] = useState<SubMeter | null>(null);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);

  const [selectedCommonMeter, setSelectedCommonMeter] = useState<SubMeter | null>(null);
  const [isCommonMeterModalOpen, setIsCommonMeterModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);

  const commonMeters = meters.filter((m) => m.type === 'common');

  const handleOpenAddUnit = () => {
    setSelectedUnit(null);
    setSelectedMeter(null);
    setIsUnitModalOpen(true);
  };

  const handleOpenEditUnit = (unit: TenantUnit) => {
    const meter = meters.find((m) => m.unitId === unit.id) || null;
    setSelectedUnit(unit);
    setSelectedMeter(meter);
    setIsUnitModalOpen(true);
  };

  const handleOpenAddCommonMeter = () => {
    setSelectedCommonMeter(null);
    setIsCommonMeterModalOpen(true);
  };

  const handleOpenEditCommonMeter = (meter: SubMeter) => {
    setSelectedCommonMeter(meter);
    setIsCommonMeterModalOpen(true);
  };

  const handleApplyPreset = (newAppData: AppData) => {
    if (onImportData) {
      onImportData(newAppData);
    }
    setIsTemplatesModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Apartment Units Section */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-orange-500" />
              Tenant Units & Sub-Meters Setup ({units.length})
            </h3>
            <p className="text-xs text-slate-500">
              Configure units, tenant details, and sub-meter dials for your rental property.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTemplatesModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-xl border border-slate-200 shadow-sm transition active:scale-95"
            >
              <LayoutTemplate className="w-4 h-4 text-orange-500" />
              <span>Presets & Templates</span>
            </button>

            <button
              onClick={handleOpenAddUnit}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold rounded-xl shadow-sm shadow-orange-500/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Apartment Unit</span>
            </button>
          </div>
        </div>

        {/* Empty State */}
        {units.length === 0 ? (
          <div className="p-8 sm:p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-orange-500/10 text-orange-600 flex items-center justify-center mx-auto border border-orange-500/20">
              <Building className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h4 className="text-base font-extrabold text-slate-900">No Units Configured Yet</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Add your first apartment unit manually, or choose a pre-configured building layout template (e.g. 4-unit, 3-unit, or townhouse) to get started instantly!
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={handleOpenAddUnit}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-sm shadow-orange-500/20 transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Unit</span>
              </button>
              <button
                onClick={() => setIsTemplatesModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span>Choose a Building Template</span>
              </button>
            </div>
          </div>
        ) : (
          /* Units Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {units.map((unit) => {
              const meter = meters.find((m) => m.unitId === unit.id);

              return (
                <div
                  key={unit.id}
                  className={`bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between ${
                    !unit.isOccupied ? 'opacity-70 bg-slate-50/50' : ''
                  }`}
                >
                  {/* Header */}
                  <div className="bg-slate-900 text-white px-5 py-3.5 flex items-start justify-between">
                    <div>
                      <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                        <span>{unit.unitNumber}</span>
                        {unit.isOccupied ? (
                          <span className="text-[10px] bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-700">
                            Occupied
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                            Vacant
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-orange-400 font-medium mt-0.5">
                        {unit.tenantName}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onToggleOccupied(unit.id)}
                        title={unit.isOccupied ? 'Mark as Vacant' : 'Mark as Occupied'}
                        className={`p-1.5 rounded-lg transition ${
                          unit.isOccupied
                            ? 'text-emerald-400 hover:bg-slate-800'
                            : 'text-slate-500 hover:bg-slate-800'
                        }`}
                      >
                        {unit.isOccupied ? (
                          <UserCheck className="w-4 h-4" />
                        ) : (
                          <UserX className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleOpenEditUnit(unit)}
                        title="Edit Unit & Meter"
                        className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${unit.unitNumber}?`)) {
                            onDeleteUnit(unit.id);
                          }
                        }}
                        title="Delete Unit"
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-3 text-xs text-slate-600">
                    {/* Contact Info */}
                    <div className="space-y-1">
                      {unit.contactNumber && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{unit.contactNumber}</span>
                        </div>
                      )}
                      {unit.email && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{unit.email}</span>
                        </div>
                      )}
                      {unit.notes && (
                        <div className="text-[11px] text-slate-400 italic bg-slate-50 p-2 rounded-lg border border-slate-100 mt-2">
                          {unit.notes}
                        </div>
                      )}
                    </div>

                    {/* Meter Details */}
                    <div className="pt-3 border-t border-slate-100">
                      {unit.isMainLine || meter?.type === 'main_line' ? (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
                          <div className="font-bold flex items-center gap-1.5 text-amber-950">
                            <Zap className="w-3.5 h-3.5 text-amber-600" />
                            Main Line Connection
                          </div>
                          <p className="text-[10px] text-amber-800">
                            Calculated automatically as the remaining kWh on the primary Meralco meter.
                          </p>
                        </div>
                      ) : meter ? (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                          <div className="flex items-center justify-between font-semibold text-slate-800 text-[11px]">
                            <span className="flex items-center gap-1.5">
                              <Gauge className="w-3.5 h-3.5 text-orange-500" />
                              {meter.name}
                            </span>
                            {meter.meterNumber && (
                              <span className="font-mono text-[10px] text-slate-400">
                                #{meter.meterNumber}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 pt-1">
                            <div>
                              <span>Initial Reading:</span>{' '}
                              <strong className="font-mono text-slate-700">
                                {formatNumber(meter.initialReading, 1)}
                              </strong>
                            </div>
                            <div>
                              <span>Multiplier:</span>{' '}
                              <strong className="font-mono text-slate-700">
                                {meter.multiplier}x
                              </strong>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100 flex items-center justify-between">
                          <span>No meter assigned</span>
                          <button
                            onClick={() => handleOpenEditUnit(unit)}
                            className="font-bold underline text-amber-700 hover:text-amber-800"
                          >
                            Assign Meter
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom Quick Actions */}
                  <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] flex items-center justify-between text-slate-500">
                    <span>Occupancy:</span>
                    <span className="font-bold text-slate-700">
                      {unit.isOccupied ? 'Billed in current cycle' : 'Excluded from common splits'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Common Area Meters Section */}
      <div className="pt-6 border-t border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              Common Area Sub-Meters ({commonMeters.length})
            </h3>
            <p className="text-xs text-slate-500">
              Shared meters (e.g. Water Pump, Hallway Lights, Gate Light) split equally or proportionally among active tenants.
            </p>
          </div>

          <button
            onClick={handleOpenAddCommonMeter}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-orange-500" />
            Add Common Meter
          </button>
        </div>

        {commonMeters.length === 0 ? (
          <div className="p-6 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-300 text-slate-400 text-xs">
            No common area meters configured. (Optional: Add if you have shared hallway lights or water pumps).
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {commonMeters.map((meter) => (
              <div
                key={meter.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>{meter.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Serial: {meter.meterNumber || 'N/A'} • Initial: {meter.initialReading} kWh
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenEditCommonMeter(meter)}
                    title="Edit Common Meter"
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete common meter "${meter.name}"?`)) {
                        onDeleteCommonMeter(meter.id);
                      }
                    }}
                    title="Delete Common Meter"
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-lg transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unit Modal */}
      <UnitModal
        isOpen={isUnitModalOpen}
        onClose={() => setIsUnitModalOpen(false)}
        unit={selectedUnit}
        meter={selectedMeter}
        onSaveUnit={onSaveUnit}
      />

      {/* Common Meter Modal */}
      <CommonMeterModal
        isOpen={isCommonMeterModalOpen}
        onClose={() => setIsCommonMeterModalOpen(false)}
        meter={selectedCommonMeter}
        onSaveMeter={onSaveCommonMeter}
      />

      {/* Preset Templates Modal */}
      <PresetTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onApplyPreset={handleApplyPreset}
      />
    </div>
  );
};
