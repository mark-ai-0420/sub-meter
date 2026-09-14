import React from 'react';
import { Zap, Gauge, FileText, CheckCircle2, ArrowRight } from 'lucide-react';

export type WizardStep = 1 | 2 | 3;

interface StepProgressProps {
  currentStep: WizardStep;
  onSelectStep: (step: WizardStep) => void;
  isStep1Complete: boolean;
  isStep2Complete: boolean;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  currentStep,
  onSelectStep,
  isStep1Complete,
  isStep2Complete,
}) => {
  const steps = [
    {
      number: 1 as WizardStep,
      title: '1. Meralco Bill',
      subtitle: 'Total Amount & Main kWh',
      icon: Zap,
      isComplete: isStep1Complete,
    },
    {
      number: 2 as WizardStep,
      title: '2. Meter Readings',
      subtitle: 'Sub-meter dial inputs',
      icon: Gauge,
      isComplete: isStep2Complete,
    },
    {
      number: 3 as WizardStep,
      title: '3. Review & Send',
      subtitle: 'Slips, PDF & Viber messages',
      icon: FileText,
      isComplete: isStep1Complete && isStep2Complete,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = currentStep === step.number;
          const isDone = step.isComplete && currentStep > step.number;

          return (
            <button
              key={step.number}
              type="button"
              onClick={() => onSelectStep(step.number)}
              className={`flex items-center gap-3.5 p-3.5 rounded-xl border text-left transition-all relative ${
                isActive
                  ? 'bg-orange-50/80 border-orange-400 ring-2 ring-orange-500/20 shadow-sm'
                  : isDone
                  ? 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/80'
                  : 'bg-white border-slate-200 hover:border-slate-300 opacity-80'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
                    : isDone
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold truncate ${
                      isActive ? 'text-orange-950' : 'text-slate-800'
                    }`}
                  >
                    {step.title}
                  </span>
                  {isActive && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-200 text-orange-800">
                      Active Step
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {step.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
