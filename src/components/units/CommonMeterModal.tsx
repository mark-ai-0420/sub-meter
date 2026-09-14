import React, { useState, useEffect } from 'react';
import { X, Lightbulb, Gauge, Check } from 'lucide-react';
import { SubMeter } from '../../types';

interface CommonMeterModalProps {
  isOpen: boolean;
  onClose: () => void;
  meter: SubMeter | null;
  onSaveMeter: (meterData: SubMeter) => void;
}

export const CommonMeterModal: React.FC<CommonMeterModalProps> = ({
  isOpen,
  onClose,
  meter,
  onSaveMeter,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(meter?.name || '');
  const [meterNumber, setMeterNumber] = useState(meter?.meterNumber || '');
  const [initialReading, setInitialReading] = useState<number | ''>(meter?.initialReading ?? 0);
  const [multiplier, setMultiplier] = useState<number>(meter?.multiplier || 1.0);

  useEffect(() => {
    if (meter) {
      setName(meter.name);
      setMeterNumber(meter.meterNumber || '');
      setInitialReading(meter.initialReading);
      setMultiplier(meter.multiplier || 1.0);
    } else {
      setName('');
      setMeterNumber('');
      setInitialReading(0);
      setMultiplier(1.0);
    }
  }, [meter, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const meterId = meter?.id || `meter-common-${Date.now()}`;

    const savedMeter: SubMeter = {
      id: meterId,
      name: name.trim(),
      unitId: 'common',
      type: 'common',
      meterNumber: meterNumber.trim(),
      multiplier: Number(multiplier) || 1.0,
      initialReading: Number(initialReading) || 0,
    };

    onSaveMeter(savedMeter);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="common-meter-modal-title"
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h3 id="common-meter-modal-title" className="text-base font-bold text-slate-100">
                {meter ? 'Edit Common Area Meter' : 'Add Common Area Meter'}
              </h3>
              <p className="text-xs text-slate-400">
                For shared hallway lighting, water pump, motor, gate, etc.
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

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Common Meter Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Shared Water Pump / Hallway Lighting"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Meter Serial # / Dial ID</label>
              <input
                type="text"
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value)}
                placeholder="e.g. COM-PUMP-01"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Initial Reading</label>
                <input
                  type="number"
                  step="0.1"
                  value={initialReading}
                  onChange={(e) =>
                    setInitialReading(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                  placeholder="0.0"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500 text-right font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Multiplier (1.0)</label>
                <input
                  type="number"
                  step="0.1"
                  value={multiplier}
                  onChange={(e) => setMultiplier(parseFloat(e.target.value) || 1.0)}
                  placeholder="1.0"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-500 text-right font-mono"
                />
              </div>
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
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-sm shadow-orange-500/20 text-xs rounded-lg transition"
            >
              <Check className="w-4 h-4" />
              <span>Save Common Meter</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
