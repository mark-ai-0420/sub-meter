import React, { useState } from 'react';
import {
  X,
  Droplets,
  Calculator,
  Check,
  AlertTriangle,
  Waves,
} from 'lucide-react';
import { AdditionalChargeItem, TenantUnit } from '../../types';
import { formatPHP, formatNumber } from '../../utils/formatters';

export interface WaterReadingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit?: TenantUnit | null;
  units?: TenantUnit[];
  currentCharges?: Record<string, AdditionalChargeItem[]> | AdditionalChargeItem[];
  onSaveWaterCharge?: (unitId: string, chargeItem: AdditionalChargeItem) => void;
  onSaveCharges?: (unitId: string, charges: AdditionalChargeItem[]) => void;
  initialWaterRate?: number;
}

const COMMON_WATER_RATES = [
  { label: '₱30.00 / m³', rate: 30.0 },
  { label: '₱35.00 / m³', rate: 35.0 },
  { label: '₱40.00 / m³', rate: 40.0 },
  { label: '₱45.00 / m³', rate: 45.0 },
  { label: '₱50.00 / m³', rate: 50.0 },
];

export const WaterReadingsModal: React.FC<WaterReadingsModalProps> = ({
  isOpen,
  onClose,
  unit = null,
  units = [],
  currentCharges = {},
  onSaveWaterCharge,
  onSaveCharges,
  initialWaterRate = 35.0,
}) => {
  const unitList = units.length > 0 ? units : unit ? [unit] : [];
  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    unit?.id || (unitList.length > 0 ? unitList[0].id : '')
  );

  const activeUnit = unitList.find((u) => u.id === selectedUnitId) || unit || unitList[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="water-readings-modal-title"
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h3 id="water-readings-modal-title" className="text-base font-bold text-slate-100 flex items-center gap-2">
                Water Sub-Meter Calculator
              </h3>
              <p className="text-xs text-slate-400">
                Compute cubic meter (m³) usage & attach directly to bill
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center p-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inner Content with keying by activeUnit.id */}
        {activeUnit ? (
          <WaterReadingsForm
            key={activeUnit.id}
            activeUnit={activeUnit}
            unitList={unitList}
            selectedUnitId={selectedUnitId}
            onSelectUnit={setSelectedUnitId}
            currentCharges={currentCharges}
            initialWaterRate={initialWaterRate}
            onClose={onClose}
            onSaveWaterCharge={onSaveWaterCharge}
            onSaveCharges={onSaveCharges}
          />
        ) : (
          <div className="p-8 text-center text-xs text-slate-500">
            No apartment unit selected.
          </div>
        )}
      </div>
    </div>
  );
};

interface WaterReadingsFormProps {
  activeUnit: TenantUnit;
  unitList: TenantUnit[];
  selectedUnitId: string;
  onSelectUnit: (id: string) => void;
  currentCharges: Record<string, AdditionalChargeItem[]> | AdditionalChargeItem[];
  initialWaterRate: number;
  onClose: () => void;
  onSaveWaterCharge?: (unitId: string, chargeItem: AdditionalChargeItem) => void;
  onSaveCharges?: (unitId: string, charges: AdditionalChargeItem[]) => void;
}

const WaterReadingsForm: React.FC<WaterReadingsFormProps> = ({
  activeUnit,
  unitList,
  selectedUnitId,
  onSelectUnit,
  currentCharges,
  initialWaterRate,
  onClose,
  onSaveWaterCharge,
  onSaveCharges,
}) => {
  // Helper to extract existing charges for the active unit
  const getUnitCharges = (): AdditionalChargeItem[] => {
    if (Array.isArray(currentCharges)) {
      return currentCharges;
    }
    return currentCharges[activeUnit.id] || [];
  };

  const existingCharges = getUnitCharges();
  const existingWaterCharge = existingCharges.find(
    (c) => c.type === 'water' || c.name.toLowerCase().includes('water')
  );

  // Initialize initial rate & reading from existing water charge if available
  let initialParsedRate = initialWaterRate;
  let initialPresReading = '0';

  if (existingWaterCharge) {
    const parsedRateMatch = existingWaterCharge.name.match(/₱?([\d.]+)\s*\/\s*(?:cu\.m|m³|m3)/i);
    const parsedCuMatch = existingWaterCharge.name.match(/([\d.]+)\s*(?:cu\.m|m³|m3)/i);

    if (parsedRateMatch && parsedRateMatch[1]) {
      initialParsedRate = parseFloat(parsedRateMatch[1]);
    }
    if (parsedCuMatch && parsedCuMatch[1]) {
      initialPresReading = parsedCuMatch[1];
    }
  }

  const [previousReading, setPreviousReading] = useState<string>('0');
  const [presentReading, setPresentReading] = useState<string>(initialPresReading);
  const [multiplier, setMultiplier] = useState<string>('1.0');
  const [waterRate, setWaterRate] = useState<number>(initialParsedRate);
  const [customNote] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Computations
  const prev = parseFloat(previousReading) || 0;
  const pres = parseFloat(presentReading) || 0;
  const mult = parseFloat(multiplier) || 1;
  const rate = Number(waterRate) || 0;

  const rawUsage = pres - prev;
  const consumptionCuM = Math.max(0, rawUsage * mult);
  const totalWaterAmount = Math.round(consumptionCuM * rate * 100) / 100;
  const isRolloverOrInvalid = pres < prev;

  const generatedItemName = `Water Sub-Meter (${formatNumber(consumptionCuM, 1)} cu.m @ ${formatPHP(rate)}/cu.m)${
    customNote ? ` - ${customNote}` : ''
  }`;

  const handleSave = () => {
    const chargeItem: AdditionalChargeItem = {
      id: existingWaterCharge?.id || `water-${activeUnit.id}-${Date.now()}`,
      name: generatedItemName,
      amount: totalWaterAmount,
      type: 'water',
    };

    if (onSaveWaterCharge) {
      onSaveWaterCharge(activeUnit.id, chargeItem);
    }

    if (onSaveCharges) {
      const currentUnitCharges = getUnitCharges();
      const filtered = currentUnitCharges.filter(
        (c) => c.id !== chargeItem.id && c.type !== 'water' && !c.name.toLowerCase().includes('water')
      );
      onSaveCharges(activeUnit.id, [...filtered, chargeItem]);
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 400);
  };

  return (
    <>
      {/* Content Body */}
      <div className="p-6 overflow-y-auto space-y-5 flex-1">
        {/* Unit Selector (if multiple units) or Unit Banner */}
        {unitList.length > 1 ? (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Target Apartment Unit:
            </label>
            <select
              value={selectedUnitId}
              onChange={(e) => onSelectUnit(e.target.value)}
              className="w-full px-3.5 py-2 text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-slate-800"
            >
              {unitList.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.unitNumber} — {u.tenantName} {u.isOccupied ? '' : '(Vacant)'}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 bg-cyan-50/60 border border-cyan-200/80 rounded-xl">
            <div>
              <span className="text-[10px] uppercase font-bold text-cyan-800 tracking-wider">
                Target Tenant Unit
              </span>
              <div className="text-xs font-bold text-slate-900 mt-0.5">
                {activeUnit.unitNumber} • {activeUnit.tenantName}
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 bg-cyan-100 text-cyan-800 font-semibold rounded-lg">
              Water Sub-Meter
            </span>
          </div>
        )}

        {/* Meter Readings Grid */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5 text-slate-800">
              <Waves className="w-4 h-4 text-cyan-600" />
              Water Meter Dials (Cubic Meters / m³)
            </span>
            <span className="text-[11px] text-slate-500 font-normal">1 cu.m = 1,000 Liters</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Previous Reading */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Previous Reading (m³)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={previousReading}
                  onChange={(e) => setPreviousReading(e.target.value)}
                  placeholder="0.0"
                  className="w-full pl-3 pr-8 py-2 text-xs font-mono font-semibold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 text-slate-800"
                />
                <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-medium">
                  m³
                </span>
              </div>
            </div>

            {/* Present Reading */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Present Reading (m³)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={presentReading}
                  onChange={(e) => setPresentReading(e.target.value)}
                  placeholder="0.0"
                  className={`w-full pl-3 pr-8 py-2 text-xs font-mono font-bold bg-white border rounded-lg focus:ring-2 focus:ring-cyan-500 ${
                    isRolloverOrInvalid
                      ? 'border-red-400 text-red-700 bg-red-50/50'
                      : 'border-slate-300 text-slate-900'
                  }`}
                />
                <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-medium">
                  m³
                </span>
              </div>
            </div>

            {/* Multiplier */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Multiplier
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={multiplier}
                onChange={(e) => setMultiplier(e.target.value)}
                placeholder="1.0"
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Validation warning if present < previous */}
          {isRolloverOrInvalid && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>
                Present reading ({pres} m³) is less than previous ({prev} m³). Please verify the meter dials.
              </span>
            </div>
          )}
        </div>

        {/* Water Tariff Rate per cu.m */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Water Rate per Cubic Meter (₱/m³):
            </label>
            <span className="text-xs font-bold text-cyan-700">{formatPHP(rate)} / cu.m</span>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {COMMON_WATER_RATES.map((preset) => (
              <button
                key={preset.rate}
                type="button"
                onClick={() => setWaterRate(preset.rate)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition ${
                  waterRate === preset.rate
                    ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom Rate Input */}
          <div className="relative">
            <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₱</span>
            <input
              type="number"
              step="0.50"
              min="0"
              value={waterRate}
              onChange={(e) => setWaterRate(parseFloat(e.target.value) || 0)}
              placeholder="35.00"
              className="w-full pl-7 pr-16 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500 text-slate-900"
            />
            <span className="absolute right-3 top-2 text-xs text-slate-400 font-semibold">
              PHP / m³
            </span>
          </div>
        </div>

        {/* Computed Consumption & Cost Summary Box */}
        <div className="bg-gradient-to-br from-cyan-900 to-slate-900 text-white p-4 rounded-xl shadow-md space-y-3">
          <div className="flex items-center justify-between border-b border-cyan-800/80 pb-2">
            <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <Calculator className="w-4 h-4" />
              Computed Water Consumption
            </span>
            <span className="text-xs font-mono text-cyan-200">
              {formatNumber(consumptionCuM, 2)} m³ ({formatNumber(consumptionCuM * 1000, 0)} Liters)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] uppercase font-semibold text-cyan-300/80 block">
                Net Consumption
              </span>
              <span className="text-lg font-bold font-mono text-white">
                {formatNumber(consumptionCuM, 2)}{' '}
                <span className="text-xs font-normal text-cyan-300">m³</span>
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-cyan-300/80 block">
                Total Water Charge
              </span>
              <span className="text-xl font-extrabold text-cyan-300 font-mono">
                {formatPHP(totalWaterAmount)}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-cyan-800/80 text-[11px] text-cyan-100/90 font-mono bg-cyan-950/40 p-2 rounded-lg truncate">
            📌 {generatedItemName}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={!activeUnit || consumptionCuM < 0}
          className={`inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl shadow-md transition active:scale-95 ${
            savedSuccess
              ? 'bg-emerald-600 text-white shadow-emerald-500/20'
              : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-cyan-600/20'
          }`}
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4" />
              <span>Attached to Bill!</span>
            </>
          ) : (
            <>
              <Droplets className="w-4 h-4" />
              <span>Attach to Tenant Bill ({formatPHP(totalWaterAmount)})</span>
            </>
          )}
        </button>
      </div>
    </>
  );
};
