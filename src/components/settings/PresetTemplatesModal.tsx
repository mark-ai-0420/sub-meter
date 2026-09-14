import React, { useState } from 'react';
import { X, Sparkles, Building, Check, ArrowRight, LayoutTemplate, Trash2 } from 'lucide-react';
import { BUILDING_PRESETS } from '../../utils/presets';
import { AppData } from '../../types';

interface PresetTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPreset: (newAppData: AppData) => void;
}

export const PresetTemplatesModal: React.FC<PresetTemplatesModalProps> = ({
  isOpen,
  onClose,
  onApplyPreset,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(BUILDING_PRESETS[0].id);

  const selectedPreset = BUILDING_PRESETS.find((p) => p.id === selectedPresetId) || BUILDING_PRESETS[0];

  const handleApply = () => {
    if (
      confirm(
        `Are you sure you want to load the "${selectedPreset.name}" template? This will replace your current building layout with this template.`
      )
    ) {
      const generated = selectedPreset.generateData();
      onApplyPreset(generated);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="preset-templates-modal-title"
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="preset-templates-modal-title" className="text-base font-extrabold text-slate-100">
                  Building Presets & Templates
                </h3>
                <span className="text-[10px] bg-orange-500/30 text-orange-300 font-bold px-2 py-0.5 rounded-full border border-orange-400/30">
                  Customizable
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Choose a pre-configured apartment layout or start with a clean slate.
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
          <p className="text-slate-600 leading-relaxed text-xs">
            Select a template below that matches your rental building setup. All unit names, tenant names, meter serial numbers, and Meralco bills remain <strong>100% editable</strong> once loaded.
          </p>

          <div className="grid grid-cols-1 gap-3">
            {BUILDING_PRESETS.map((preset) => {
              const isSelected = preset.id === selectedPresetId;
              const isBlank = preset.id === 'preset-blank';

              return (
                <div
                  key={preset.id}
                  onClick={() => setSelectedPresetId(preset.id)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-start justify-between gap-4 ${
                    isSelected
                      ? 'bg-orange-50/70 border-orange-500 shadow-md shadow-orange-500/10 ring-2 ring-orange-500/20'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                          : isBlank
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isBlank ? <Trash2 className="w-5 h-5" /> : <Building className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">{preset.name}</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-orange-200 text-orange-900'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {preset.badge}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-1 leading-relaxed">
                        {preset.description}
                      </p>
                      <div className="text-[10px] font-semibold text-slate-400 mt-2 flex items-center gap-1.5">
                        <span>Layout:</span>
                        <span className="text-slate-700">{preset.unitCountText}</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 pt-1">
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                        isSelected
                          ? 'border-orange-500 bg-orange-500 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/20 transition active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>Load "{selectedPreset.name}"</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
