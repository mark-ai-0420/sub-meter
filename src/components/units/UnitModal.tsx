import React, { useState, useEffect } from 'react';
import { X, Building, Gauge, Check, Zap } from 'lucide-react';
import { TenantUnit, SubMeter } from '../../types';

interface UnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: TenantUnit | null;
  meter: SubMeter | null;
  onSaveUnit: (unitData: TenantUnit, meterData: SubMeter) => void;
}

export const UnitModal: React.FC<UnitModalProps> = ({
  isOpen,
  onClose,
  unit,
  meter,
  onSaveUnit,
}) => {
  const [unitNumber, setUnitNumber] = useState(unit?.unitNumber || '');
  const [tenantName, setTenantName] = useState(unit?.tenantName || '');
  const [contactNumber, setContactNumber] = useState(unit?.contactNumber || '');
  const [email, setEmail] = useState(unit?.email || '');
  const [isOccupied, setIsOccupied] = useState(unit ? unit.isOccupied : true);
  const [isMainLine, setIsMainLine] = useState(unit ? Boolean(unit.isMainLine) : false);
  const [notes, setNotes] = useState(unit?.notes || '');

  // Sub-meter fields
  const [meterName, setMeterName] = useState(meter?.name || '');
  const [meterNumber, setMeterNumber] = useState(meter?.meterNumber || '');
  const [initialReading, setInitialReading] = useState<number | ''>(meter?.initialReading ?? 0);
  const [multiplier, setMultiplier] = useState<number>(meter?.multiplier || 1.0);

  useEffect(() => {
    if (unit) {
      setUnitNumber(unit.unitNumber);
      setTenantName(unit.tenantName);
      setContactNumber(unit.contactNumber || '');
      setEmail(unit.email || '');
      setIsOccupied(unit.isOccupied);
      setIsMainLine(Boolean(unit.isMainLine || meter?.type === 'main_line'));
      setNotes(unit.notes || '');
    } else {
      setUnitNumber('');
      setTenantName('');
      setContactNumber('');
      setEmail('');
      setIsOccupied(true);
      setIsMainLine(false);
      setNotes('');
    }

    if (meter) {
      setMeterName(meter.name);
      setMeterNumber(meter.meterNumber || '');
      setInitialReading(meter.initialReading);
      setMultiplier(meter.multiplier || 1.0);
    } else {
      setMeterName('');
      setMeterNumber('');
      setInitialReading(0);
      setMultiplier(1.0);
    }
  }, [unit, meter, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitNumber.trim()) return;

    const unitId = unit?.id || `unit-${Date.now()}`;
    const meterId = meter?.id || `meter-${Date.now()}`;

    const savedUnit: TenantUnit = {
      id: unitId,
      unitNumber: unitNumber.trim(),
      tenantName: tenantName.trim() || 'Vacant / Unassigned',
      contactNumber: contactNumber.trim(),
      email: email.trim(),
      isOccupied,
      isMainLine,
      notes: notes.trim(),
    };

    const savedMeter: SubMeter = {
      id: meterId,
      name: isMainLine ? 'Main Line' : meterName.trim() || `${unitNumber.trim()} Meter`,
      unitId: unitId,
      type: isMainLine ? 'main_line' : 'tenant',
      meterNumber: isMainLine ? 'MAIN' : meterNumber.trim(),
      multiplier: isMainLine ? 1.0 : Number(multiplier) || 1.0,
      initialReading: isMainLine ? 0 : Number(initialReading) || 0,
    };

    onSaveUnit(savedUnit, savedMeter);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="unit-modal-title"
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h3 id="unit-modal-title" className="text-base font-bold text-slate-100">
                {unit ? 'Edit Apartment Unit & Meter' : 'Add New Apartment Unit'}
              </h3>
              <p className="text-xs text-slate-400">
                Configure tenant profile and assigned electricity sub-meter
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
            {/* Unit Details */}
            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-orange-500" />
                1. Unit & Tenant Information
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Unit Identifier <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    placeholder="e.g. Unit 101 / Studio A"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tenant Name</label>
                  <input
                    type="text"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    placeholder="e.g. Juan Dela Cruz"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="0917-xxx-xxxx"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tenant@example.com"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Occupancy toggle */}
              <div className="mt-3 flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="font-semibold text-slate-800">Occupancy Status</div>
                  <div className="text-[11px] text-slate-500">
                    Vacant units are excluded from common area splits
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOccupied}
                    onChange={(e) => setIsOccupied(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>

            {/* Sub-Meter Settings */}
            <div className="pt-3 border-t border-slate-200">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-orange-500" />
                2. Electricity Meter Connection
              </h4>

              {/* Meter Type Radio Selection */}
              <div className="grid grid-cols-2 gap-2.5 mb-3.5">
                <label
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center gap-2 ${
                    !isMainLine
                      ? 'bg-orange-50/70 border-orange-400 ring-1 ring-orange-400/40 text-orange-950 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="meterType"
                    checked={!isMainLine}
                    onChange={() => setIsMainLine(false)}
                    className="sr-only"
                  />
                  <Gauge className="w-4 h-4 text-orange-500" />
                  <div>
                    <div className="text-xs">Dedicated Sub-Meter</div>
                    <div className="text-[10px] text-slate-500 font-normal">Has physical meter dials</div>
                  </div>
                </label>

                <label
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center gap-2 ${
                    isMainLine
                      ? 'bg-amber-50/70 border-amber-400 ring-1 ring-amber-400/40 text-amber-950 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="meterType"
                    checked={isMainLine}
                    onChange={() => setIsMainLine(true)}
                    className="sr-only"
                  />
                  <Zap className="w-4 h-4 text-amber-500" />
                  <div>
                    <div className="text-xs">Main Line Unit</div>
                    <div className="text-[10px] text-slate-500 font-normal">Absorbs main meter remainder</div>
                  </div>
                </label>
              </div>

              {!isMainLine ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Meter Label</label>
                    <input
                      type="text"
                      value={meterName}
                      onChange={(e) => setMeterName(e.target.value)}
                      placeholder="e.g. Unit 2 Sub-Meter"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Meter Serial # / Dial ID
                    </label>
                    <input
                      type="text"
                      value={meterNumber}
                      onChange={(e) => setMeterNumber(e.target.value)}
                      placeholder="e.g. ATA-2"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Initial Dial Reading</label>
                    <input
                      type="number"
                      step="0.1"
                      value={initialReading}
                      onChange={(e) =>
                        setInitialReading(e.target.value === '' ? '' : parseFloat(e.target.value))
                      }
                      placeholder="0.0"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500 text-right font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Dial Multiplier (Default 1.0)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={multiplier}
                      onChange={(e) => setMultiplier(parseFloat(e.target.value) || 1.0)}
                      placeholder="1.0"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-orange-500 text-right font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    Direct Main Line Connection:
                  </div>
                  This unit does not have a separate sub-meter. Its consumption is automatically calculated as: <strong>Total Main Meralco kWh minus all other sub-metered units</strong>.
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg shadow-sm shadow-orange-500/20 transition"
            >
              <Check className="w-4 h-4" />
              <span>Save Unit & Meter</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
