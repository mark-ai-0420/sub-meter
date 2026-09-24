import React, { useState } from 'react';
import {
  BillingCycle,
  AppData,
  MainMeralcoBill,
} from '../../types';
import { findPrecedingBillingCycle } from '../../services/storage';
import { StepProgress, WizardStep } from './StepProgress';
import { MainBillStep } from './MainBillStep';
import { MeterReadingsStep } from './MeterReadingsStep';
import { StatementsStep } from './StatementsStep';

interface CalculatorWorkflowProps {
  cycle: BillingCycle;
  appData: AppData;
  onChangeCycleName: (name: string) => void;
  onChangeMainBill: (updatedBill: Partial<MainMeralcoBill>) => void;
  onChangeAllocMethod: (method: 'equal' | 'proportional') => void;
  onUpdateReading: (meterId: string, field: 'previous' | 'present', value: number) => void;
  onOpenAdditionalCharges: (unitId: string) => void;
  onToggleOccupied: (unitId: string) => void;
  onAddMainLineUnit?: () => void;
  onUpdatePaymentRecord?: (unitId: string, payment: any) => void;
  onSyncPreviousReadings?: (sourceCycleId: string) => void;
}

export const CalculatorWorkflow: React.FC<CalculatorWorkflowProps> = ({
  cycle,
  appData,
  onChangeCycleName,
  onChangeMainBill,
  onChangeAllocMethod,
  onUpdateReading,
  onOpenAdditionalCharges,
  onToggleOccupied,
  onAddMainLineUnit,
  onUpdatePaymentRecord,
  onSyncPreviousReadings,
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);

  const summary = cycle.calculationSummary;
  const isStep1Complete =
    Number(cycle.mainBill.totalAmountDue) > 0 && Number(cycle.mainBill.totalMainKwh) > 0;
  const isStep2Complete = Boolean(summary && summary.totalTenantDirectKwh >= 0);

  const hasMainLineUnit = appData.units.some((u) => u.isMainLine);
  const residualGapKwh = summary?.residualLossKwh || 0;

  const precedingCycle = findPrecedingBillingCycle(
    appData.billingCycles,
    cycle.mainBill.billingMonth,
    cycle.id
  );

  return (
    <div className="space-y-6">
      {/* 3-Step Wizard Navigation */}
      <StepProgress
        currentStep={currentStep}
        onSelectStep={setCurrentStep}
        isStep1Complete={isStep1Complete}
        isStep2Complete={isStep2Complete}
      />

      {/* Step 1: Meralco Bill Form */}
      {currentStep === 1 && (
        <MainBillStep
          mainBill={cycle.mainBill}
          cycleName={cycle.name}
          commonAreaAllocMethod={cycle.commonAreaAllocMethod}
          onChangeCycleName={onChangeCycleName}
          onChangeMainBill={onChangeMainBill}
          onChangeAllocMethod={onChangeAllocMethod}
          onNextStep={() => setCurrentStep(2)}
        />
      )}

      {/* Step 2: Sub-Meter Readings Form */}
      {currentStep === 2 && summary && (
        <MeterReadingsStep
          tenantResults={summary.tenantResults}
          commonAreaBreakdown={summary.commonAreaBreakdown}
          meters={appData.meters}
          readings={cycle.readings}
          hasMainLineUnit={hasMainLineUnit}
          residualGapKwh={residualGapKwh}
          precedingCycle={precedingCycle}
          onSyncPreviousReadings={onSyncPreviousReadings}
          onAddMainLineUnit={onAddMainLineUnit}
          onUpdateReading={onUpdateReading}
          onOpenAdditionalCharges={onOpenAdditionalCharges}
          onToggleOccupied={onToggleOccupied}
          onPrevStep={() => setCurrentStep(1)}
          onNextStep={() => setCurrentStep(3)}
        />
      )}

      {/* Step 3: Review & Generate Slips */}
      {currentStep === 3 && (
        <StatementsStep
          cycle={cycle}
          appData={appData}
          onOpenAdditionalCharges={onOpenAdditionalCharges}
          onPrevStep={() => setCurrentStep(2)}
          onUpdatePaymentRecord={onUpdatePaymentRecord}
        />
      )}
    </div>
  );
};
