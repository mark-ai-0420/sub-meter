import React, { useState, useEffect, useMemo } from 'react';
import { AppData, TenantUnit, SubMeter, AdditionalChargeItem, MainMeralcoBill } from './types';
import {
  loadAppData,
  saveAppData,
  createNewBillingCycle,
  resetToSampleData,
  onStorageSync,
  requestPersistentStorage,
} from './services/storage';
import { calculateBillingCycle } from './services/calculator';
import { Navbar } from './components/layout/Navbar';
import { TabNavigation, ActiveTab } from './components/layout/TabNavigation';
import { CalculatorWorkflow } from './components/calculator/CalculatorWorkflow';
import { AdditionalChargesModal } from './components/calculator/AdditionalChargesModal';
import { NewCycleModal } from './components/calculator/NewCycleModal';
import { UnitManagementView } from './components/units/UnitManagementView';
import { HistoryView } from './components/history/HistoryView';
import { MeralcoGuideView } from './components/guide/MeralcoGuideView';
import { LandlordSettingsModal } from './components/settings/LandlordSettingsModal';
import { InstallPromptBanner } from './components/pwa/InstallPromptBanner';
import { ReloadPrompt } from './components/pwa/ReloadPrompt';
import { Zap } from 'lucide-react';

export const App: React.FC = () => {
  const [appData, setAppData] = useState<AppData>(() => loadAppData());
  const [activeTab, setActiveTab] = useState<ActiveTab>('calculator');

  // Modals state
  const [isNewCycleModalOpen, setIsNewCycleModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeChargesUnitId, setActiveChargesUnitId] = useState<string | null>(null);

  // Request persistent non-evictable storage on initial mount (PWA / standalone / browser)
  useEffect(() => {
    requestPersistentStorage().catch((err) => {
      console.warn('[Storage] Failed to request persistent storage on launch:', err);
    });
  }, []);

  // Subscribe to background IndexedDB data sync and restorations
  useEffect(() => {
    const unsubscribe = onStorageSync((syncedData) => {
      setAppData(syncedData);
    });
    return unsubscribe;
  }, []);

  // Active Cycle
  const activeCycle = useMemo(() => {
    if (!appData.activeCycleId) return appData.billingCycles[0] || null;
    return (
      appData.billingCycles.find((c) => c.id === appData.activeCycleId) ||
      appData.billingCycles[0] ||
      null
    );
  }, [appData]);

  // Recalculate whenever active cycle or units/meters change
  const currentSummary = useMemo(() => {
    if (!activeCycle) return null;
    return calculateBillingCycle({
      units: appData.units,
      meters: appData.meters,
      mainBill: activeCycle.mainBill,
      readings: activeCycle.readings,
      additionalCharges: activeCycle.additionalCharges,
      commonAreaAllocMethod: activeCycle.commonAreaAllocMethod,
    });
  }, [activeCycle, appData.units, appData.meters]);

  // Sync calculation summary into active cycle state if changed
  useEffect(() => {
    if (!activeCycle || !currentSummary) return;

    const needsUpdate =
      JSON.stringify(activeCycle.calculationSummary) !== JSON.stringify(currentSummary);

    if (needsUpdate) {
      const updatedCycles = appData.billingCycles.map((c) =>
        c.id === activeCycle.id ? { ...c, calculationSummary: currentSummary } : c
      );
      const updatedData = { ...appData, billingCycles: updatedCycles };
      setAppData(updatedData);
      saveAppData(updatedData);
    }
  }, [currentSummary, activeCycle?.id]);

  // --- Handlers ---

  const handleSelectCycle = (cycleId: string) => {
    const updatedData = { ...appData, activeCycleId: cycleId };
    setAppData(updatedData);
    saveAppData(updatedData);
  };

  const handleCreateNewCycle = (
    cycleName: string,
    billingMonth: string,
    periodFrom: string,
    periodTo: string,
    dueDate: string,
    totalAmountDue: number,
    totalMainKwh: number
  ) => {
    const { updatedData, newCycleId } = createNewBillingCycle(
      appData,
      cycleName,
      billingMonth,
      periodFrom,
      periodTo,
      dueDate,
      totalAmountDue,
      totalMainKwh
    );
    setAppData(updatedData);
    setActiveTab('calculator');
  };

  const handleDeleteCycle = (cycleId: string) => {
    const remaining = appData.billingCycles.filter((c) => c.id !== cycleId);
    const newActiveId =
      appData.activeCycleId === cycleId ? remaining[0]?.id || null : appData.activeCycleId;

    const updatedData: AppData = {
      ...appData,
      billingCycles: remaining,
      activeCycleId: newActiveId,
    };
    setAppData(updatedData);
    saveAppData(updatedData);
  };

  const handleUpdateCycleName = (name: string) => {
    if (!activeCycle) return;
    const updatedCycles = appData.billingCycles.map((c) =>
      c.id === activeCycle.id ? { ...c, name } : c
    );
    const updatedData = { ...appData, billingCycles: updatedCycles };
    setAppData(updatedData);
    saveAppData(updatedData);
  };

  const handleUpdateMainBill = (patch: Partial<MainMeralcoBill>) => {
    if (!activeCycle) return;
    const updatedMainBill = { ...activeCycle.mainBill, ...patch };
    const summary = calculateBillingCycle({
      units: appData.units,
      meters: appData.meters,
      mainBill: updatedMainBill,
      readings: activeCycle.readings,
      additionalCharges: activeCycle.additionalCharges,
      commonAreaAllocMethod: activeCycle.commonAreaAllocMethod,
    });

    const updatedCycles = appData.billingCycles.map((c) =>
      c.id === activeCycle.id
        ? { ...c, mainBill: updatedMainBill, calculationSummary: summary }
        : c
    );
    const updatedData = { ...appData, billingCycles: updatedCycles };
    setAppData(updatedData);
    saveAppData(updatedData);
  };

  const handleUpdateAllocMethod = (method: 'equal' | 'proportional') => {
    if (!activeCycle) return;
    const summary = calculateBillingCycle({
      units: appData.units,
      meters: appData.meters,
      mainBill: activeCycle.mainBill,
      readings: activeCycle.readings,
      additionalCharges: activeCycle.additionalCharges,
      commonAreaAllocMethod: method,
    });

    const updatedCycles = appData.billingCycles.map((c) =>
      c.id === activeCycle.id
        ? { ...c, commonAreaAllocMethod: method, calculationSummary: summary }
        : c
    );
    const updatedData = { ...appData, billingCycles: updatedCycles };
    setAppData(updatedData);
    saveAppData(updatedData);
  };

  const handleUpdateReading = (
    meterId: string,
    field: 'previous' | 'present',
    value: number
  ) => {
    if (!activeCycle) return;
    const currentReading = activeCycle.readings[meterId] || { previous: 0, present: 0 };
    const updatedReadings = {
      ...activeCycle.readings,
      [meterId]: {
        ...currentReading,
        [field]: value,
      },
    };

    const summary = calculateBillingCycle({
      units: appData.units,
      meters: appData.meters,
      mainBill: activeCycle.mainBill,
      readings: updatedReadings,
      additionalCharges: activeCycle.additionalCharges,
      commonAreaAllocMethod: activeCycle.commonAreaAllocMethod,
    });

    const updatedCycles = appData.billingCycles.map((c) =>
      c.id === activeCycle.id
        ? { ...c, readings: updatedReadings, calculationSummary: summary }
        : c
    );
    const updatedData = { ...appData, billingCycles: updatedCycles };
    setAppData(updatedData);
    saveAppData(updatedData);
  };

  const handleSaveAdditionalCharges = (unitId: string, charges: AdditionalChargeItem[]) => {
    if (!activeCycle) return;
    const updatedAdditional = {
      ...activeCycle.additionalCharges,
      [unitId]: charges,
    };

    const summary = calculateBillingCycle({
      units: appData.units,
      meters: appData.meters,
      mainBill: activeCycle.mainBill,
      readings: activeCycle.readings,
      additionalCharges: updatedAdditional,
      commonAreaAllocMethod: activeCycle.commonAreaAllocMethod,
    });

    const updatedCycles = appData.billingCycles.map((c) =>
      c.id === activeCycle.id
        ? { ...c, additionalCharges: updatedAdditional, calculationSummary: summary }
        : c
    );
    const updatedData = { ...appData, billingCycles: updatedCycles };
    setAppData(updatedData);
    saveAppData(updatedData);
  };

  const handleToggleOccupied = (unitId: string) => {
    const updatedUnits = appData.units.map((u) =>
      u.id === unitId ? { ...u, isOccupied: !u.isOccupied } : u
    );
    const updatedData = { ...appData, units: updatedUnits };
    setAppData(updatedData);
    saveAppData(updatedData);
  };

  const handleSaveUnit = (unitData: TenantUnit, meterData: SubMeter) => {
    const existingUnitIdx = appData.units.findIndex((u) => u.id === unitData.id);
    let updatedUnits: TenantUnit[];
    if (existingUnitIdx >= 0) {
      updatedUnits = [...appData.units];
      updatedUnits[existingUnitIdx] = unitData;
    } else {
      updatedUnits = [...appData.units, unitData];
    }

    const existingMeterIdx = appData.meters.findIndex((m) => m.id === meterData.id);
    let updatedMeters: SubMeter[];
    if (existingMeterIdx >= 0) {
      updatedMeters = [...appData.meters];
      updatedMeters[existingMeterIdx] = meterData;
    } else {
      updatedMeters = [...appData.meters, meterData];
    }

    const updatedData = { ...appData, units: updatedUnits, meters: updatedMeters };
    setAppData(updatedData);
    saveAppData(updatedData);
  };

  const handleDeleteUnit = (unitId: string) => {
    const updatedUnits = appData.units.filter((u) => u.id !== unitId);
    const updatedMeters = appData.meters.filter((m) => m.unitId !== unitId);
    const updatedData = { ...appData, units: updatedUnits, meters: updatedMeters };
    setAppData(updatedData);
    saveAppData(updatedData);
  };

  const handleSaveCommonMeter = (meterData: SubMeter) => {
    const existingMeterIdx = appData.meters.findIndex((m) => m.id === meterData.id);
    let updatedMeters: SubMeter[];
    if (existingMeterIdx >= 0) {
      updatedMeters = [...appData.meters];
      updatedMeters[existingMeterIdx] = meterData;
    } else {
      updatedMeters = [...appData.meters, meterData];
    }

    const updatedData = { ...appData, meters: updatedMeters };
    setAppData(updatedData);
    saveAppData(updatedData);
  };

  const handleDeleteCommonMeter = (meterId: string) => {
    const updatedMeters = appData.meters.filter((m) => m.id !== meterId);
    const updatedData = { ...appData, meters: updatedMeters };
    setAppData(updatedData);
    saveAppData(updatedData);
  };

  const handleUpdateLandlordInfo = (info: AppData['landlordInfo']) => {
    const updatedData = { ...appData, landlordInfo: info };
    setAppData(updatedData);
    saveAppData(updatedData);
  };

  const handleImportData = (data: AppData) => {
    setAppData(data);
    saveAppData(data);
  };

  const handleResetData = () => {
    const data = resetToSampleData();
    setAppData(data);
  };

  const activeUnitForCharges = appData.units.find((u) => u.id === activeChargesUnitId) || null;
  const activeChargesList =
    activeCycle && activeChargesUnitId ? activeCycle.additionalCharges[activeChargesUnitId] || [] : [];

  const handleAddMainLineUnit = () => {
    const unitId = `unit-main-${Date.now()}`;
    const meterId = `meter-main-${Date.now()}`;
    const newUnit: TenantUnit = {
      id: unitId,
      unitNumber: 'Unit 1 (Main Line)',
      tenantName: 'Landlord / Main Unit',
      isOccupied: true,
      isMainLine: true,
      notes: 'Direct connection to Main Meter',
    };
    const newMeter: SubMeter = {
      id: meterId,
      name: 'Main Line Connection',
      unitId: unitId,
      type: 'main_line',
      meterNumber: 'MAIN',
      multiplier: 1.0,
      initialReading: 0,
    };
    handleSaveUnit(newUnit, newMeter);
  };

  const handleUpdatePaymentRecord = (unitId: string, payment: any) => {
    if (!activeCycle) return;
    const updatedPayments = {
      ...(activeCycle.payments || {}),
      [unitId]: payment,
    };
    const updatedCycles = appData.billingCycles.map((c) =>
      c.id === activeCycle.id ? { ...c, payments: updatedPayments } : c
    );
    const updatedData = { ...appData, billingCycles: updatedCycles };
    setAppData(updatedData);
    saveAppData(updatedData);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        appData={appData}
        onSelectCycle={handleSelectCycle}
        onOpenNewCycleModal={() => setIsNewCycleModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onResetData={handleResetData}
      />

      {/* Tabs */}
      <TabNavigation
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        unitsCount={appData.units.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* PWA Install Banner */}
        <InstallPromptBanner className="mb-6" />

        {/* Tab 1: 3-Step Guided Monthly Calculator */}
        {activeTab === 'calculator' && activeCycle && (
          <CalculatorWorkflow
            cycle={activeCycle}
            appData={appData}
            onChangeCycleName={handleUpdateCycleName}
            onChangeMainBill={handleUpdateMainBill}
            onChangeAllocMethod={handleUpdateAllocMethod}
            onUpdateReading={handleUpdateReading}
            onOpenAdditionalCharges={(unitId) => setActiveChargesUnitId(unitId)}
            onToggleOccupied={handleToggleOccupied}
            onAddMainLineUnit={handleAddMainLineUnit}
            onUpdatePaymentRecord={handleUpdatePaymentRecord}
          />
        )}

        {/* Tab 2: Units & Sub-Meters */}
        {activeTab === 'units' && (
          <UnitManagementView
            units={appData.units}
            meters={appData.meters}
            onSaveUnit={handleSaveUnit}
            onDeleteUnit={handleDeleteUnit}
            onToggleOccupied={handleToggleOccupied}
            onSaveCommonMeter={handleSaveCommonMeter}
            onDeleteCommonMeter={handleDeleteCommonMeter}
            onImportData={handleImportData}
          />
        )}

        {/* Tab 3: History & Archives */}
        {activeTab === 'history' && (
          <HistoryView
            appData={appData}
            onSelectCycle={handleSelectCycle}
            onDeleteCycle={handleDeleteCycle}
            onNavigateToCalculator={() => setActiveTab('calculator')}
          />
        )}

        {/* Tab 4: Meralco Guide */}
        {activeTab === 'guide' && <MeralcoGuideView />}
      </main>

      {/* Additional Charges Modal */}
      <AdditionalChargesModal
        isOpen={Boolean(activeChargesUnitId)}
        onClose={() => setActiveChargesUnitId(null)}
        unit={activeUnitForCharges}
        charges={activeChargesList}
        onSaveCharges={handleSaveAdditionalCharges}
      />

      {/* New Cycle Modal */}
      <NewCycleModal
        isOpen={isNewCycleModalOpen}
        onClose={() => setIsNewCycleModalOpen(false)}
        appData={appData}
        onCreateCycle={handleCreateNewCycle}
      />

      {/* Settings Modal */}
      <LandlordSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        appData={appData}
        onUpdateLandlordInfo={handleUpdateLandlordInfo}
        onImportData={handleImportData}
        onResetData={handleResetData}
      />

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-8 text-xs text-center">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-orange-500" />
            <span className="font-bold text-slate-200">
              Meralco Apartment Sub-Meter Pro
            </span>
            <span>• Fair & Balanced Allocation System</span>
          </div>
          <p className="text-slate-500">
            Proportional blended rate calculation with automated centavo reconciliation.
          </p>
        </div>
      </footer>
      {/* PWA Service Worker Reload Prompt Toast */}
      <ReloadPrompt />
    </div>
  );
};

export default App;
