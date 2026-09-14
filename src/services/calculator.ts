import {
  TenantUnit,
  SubMeter,
  MainMeralcoBill,
  CycleCalculationSummary,
  TenantCalculationResult,
  CommonAreaBreakdown,
  AdditionalChargeItem,
} from '../types';

export interface CalculationInput {
  units: TenantUnit[];
  meters: SubMeter[];
  mainBill: MainMeralcoBill;
  readings: Record<string, { previous: number; present: number }>;
  additionalCharges: Record<string, AdditionalChargeItem[]>;
  commonAreaAllocMethod?: 'equal' | 'proportional';
}

export const calculateBillingCycle = (input: CalculationInput): CycleCalculationSummary => {
  const {
    units,
    meters,
    mainBill,
    readings,
    additionalCharges,
    commonAreaAllocMethod = 'equal',
  } = input;

  const totalMainKwh = Number(mainBill.totalMainKwh) || 0;
  const meralcoTotalAmount = Number(mainBill.totalAmountDue) || 0;

  const effectiveBaseRate = totalMainKwh > 0 ? meralcoTotalAmount / totalMainKwh : 0;

  // Active units
  const activeUnits = units.filter((u) => u.isOccupied);
  const activeUnitCount = activeUnits.length || units.length || 1;

  // Common meters vs Tenant meters
  const commonMeters = meters.filter((m) => m.type === 'common');
  const tenantMeters = meters.filter((m) => m.type === 'tenant');

  // Compute Common Area consumption
  let totalCommonAreaKwh = 0;
  const commonAreaBreakdown: CommonAreaBreakdown[] = commonMeters.map((meter) => {
    const reading = readings[meter.id] || {
      previous: meter.initialReading || 0,
      present: meter.initialReading || 0,
    };
    const prev = Number(reading.previous) || 0;
    const pres = Number(reading.present) || 0;
    const mult = Number(meter.multiplier) || 1.0;
    const kwh = Math.max(0, (pres - prev) * mult);
    const cost = kwh * effectiveBaseRate;

    totalCommonAreaKwh += kwh;

    return {
      meterId: meter.id,
      name: meter.name,
      previousReading: prev,
      presentReading: pres,
      multiplier: mult,
      kwh,
      cost,
      sharePerTenantKwh: activeUnitCount > 0 ? kwh / activeUnitCount : 0,
      sharePerTenantCost: activeUnitCount > 0 ? cost / activeUnitCount : 0,
    };
  });

  // Separate units into sub-metered units vs main line units
  interface TenantDirectInfo {
    unit: TenantUnit;
    meter?: SubMeter;
    isMainLine: boolean;
    previousReading: number;
    presentReading: number;
    multiplier: number;
    directKwh: number;
  }

  // 1. Calculate direct kWh for units with dedicated submeters
  const subMeteredDirectList: TenantDirectInfo[] = [];
  const mainLineUnits: TenantUnit[] = [];

  units.forEach((unit) => {
    const meter = tenantMeters.find((m) => m.unitId === unit.id);
    const isMainLine = unit.isMainLine || !meter || meter.type === 'main_line';

    if (isMainLine) {
      mainLineUnits.push(unit);
    } else {
      const reading = readings[meter.id] || {
        previous: meter.initialReading || 0,
        present: meter.initialReading || 0,
      };
      const prev = Number(reading.previous) || 0;
      const pres = Number(reading.present) || 0;
      const mult = Number(meter.multiplier) || 1.0;
      const directKwh = Math.max(0, (pres - prev) * mult);

      subMeteredDirectList.push({
        unit,
        meter,
        isMainLine: false,
        previousReading: prev,
        presentReading: pres,
        multiplier: mult,
        directKwh,
      });
    }
  });

  const subMeteredTotalKwh = subMeteredDirectList.reduce((acc, t) => acc + t.directKwh, 0);
  const accountedSubMeterKwh = subMeteredTotalKwh + totalCommonAreaKwh;

  // 2. Main Line Remainder (if any units are on main line)
  const hasMainLineUnits = mainLineUnits.length > 0;
  const mainLineRemainderKwh = hasMainLineUnits
    ? Math.max(0, totalMainKwh - accountedSubMeterKwh)
    : 0;

  const mainLineDirectList: TenantDirectInfo[] = mainLineUnits.map((unit) => {
    const directKwh = mainLineUnits.length > 0 ? mainLineRemainderKwh / mainLineUnits.length : 0;
    return {
      unit,
      isMainLine: true,
      previousReading: 0,
      presentReading: 0,
      multiplier: 1.0,
      directKwh,
    };
  });

  // Combined tenant direct list (preserving original units ordering)
  const tenantDirectList: TenantDirectInfo[] = units.map((unit) => {
    const foundSub = subMeteredDirectList.find((t) => t.unit.id === unit.id);
    if (foundSub) return foundSub;
    const foundMain = mainLineDirectList.find((t) => t.unit.id === unit.id);
    if (foundMain) return foundMain;
    return {
      unit,
      isMainLine: true,
      previousReading: 0,
      presentReading: 0,
      multiplier: 1.0,
      directKwh: 0,
    };
  });

  const totalTenantDirectKwh = tenantDirectList.reduce((acc, t) => acc + t.directKwh, 0);
  const totalSubMeterKwh = totalTenantDirectKwh + totalCommonAreaKwh;

  // Residual line loss (only if there are NO main line units absorbing remainder)
  const residualLossKwh = hasMainLineUnits
    ? 0
    : Math.max(0, totalMainKwh - totalSubMeterKwh);
  const residualLossPercent = totalMainKwh > 0 ? (residualLossKwh / totalMainKwh) * 100 : 0;
  const residualLossCost = residualLossKwh * effectiveBaseRate;

  // Preliminary Tenant Results
  let preliminaryResults: TenantCalculationResult[] = tenantDirectList.map((item) => {
    const { unit, meter, isMainLine, previousReading, presentReading, multiplier, directKwh } = item;

    // Direct share percentage among all tenant direct kWh
    const directSharePercent =
      totalTenantDirectKwh > 0 ? (directKwh / totalTenantDirectKwh) * 100 : 0;

    // Common Area Share
    let commonAreaShareKwh = 0;
    if (unit.isOccupied) {
      if (commonAreaAllocMethod === 'equal') {
        commonAreaShareKwh = activeUnitCount > 0 ? totalCommonAreaKwh / activeUnitCount : 0;
      } else {
        commonAreaShareKwh =
          totalTenantDirectKwh > 0
            ? totalCommonAreaKwh * (directKwh / totalTenantDirectKwh)
            : totalCommonAreaKwh / activeUnitCount;
      }
    }

    // Residual Line Loss Share (0 if absorbed by main line unit)
    let lossShareKwh = 0;
    if (unit.isOccupied && !hasMainLineUnits) {
      if (totalTenantDirectKwh > 0) {
        lossShareKwh = residualLossKwh * (directKwh / totalTenantDirectKwh);
      } else if (activeUnitCount > 0) {
        lossShareKwh = residualLossKwh / activeUnitCount;
      }
    }

    const effectiveKwh = directKwh + commonAreaShareKwh + lossShareKwh;
    const rawElectricityAmount = effectiveKwh * effectiveBaseRate;
    const electricityAmount = Math.round(rawElectricityAmount * 100) / 100;

    // Additional charges for this unit
    const unitAdditionalCharges = additionalCharges[unit.id] || [];
    const additionalTotal = unitAdditionalCharges.reduce(
      (sum, charge) => sum + (Number(charge.amount) || 0),
      0
    );

    return {
      unitId: unit.id,
      unitNumber: unit.unitNumber,
      tenantName: unit.tenantName,
      contactNumber: unit.contactNumber,
      email: unit.email,
      isOccupied: unit.isOccupied,
      isMainLine,
      meterName: isMainLine ? 'Main Line (Direct)' : meter?.name || `${unit.unitNumber} Meter`,
      meterNumber: isMainLine ? 'MAIN' : meter?.meterNumber,
      previousReading,
      presentReading,
      multiplier,
      directKwh,
      directSharePercent,
      commonAreaShareKwh,
      lossShareKwh,
      effectiveKwh,
      effectiveRate: effectiveBaseRate,
      electricityAmount,
      reconciliationDiff: 0,
      additionalCharges: unitAdditionalCharges,
      additionalTotal,
      totalAmountDue: electricityAmount + additionalTotal,
    };
  });

  // Centavo reconciliation adjustment
  if (totalMainKwh > 0 && meralcoTotalAmount > 0 && preliminaryResults.length > 0) {
    const sumElectricity = preliminaryResults.reduce((acc, r) => acc + r.electricityAmount, 0);
    const roundingDiff = Math.round((meralcoTotalAmount - sumElectricity) * 100) / 100;

    if (roundingDiff !== 0) {
      // Find the occupied unit with highest consumption (or first unit) to adjust centavo diff
      const targetUnitIndex = preliminaryResults.reduce(
        (maxIdx, curr, idx, arr) => (curr.directKwh > arr[maxIdx].directKwh ? idx : maxIdx),
        0
      );

      if (targetUnitIndex >= 0 && preliminaryResults[targetUnitIndex]) {
        const target = preliminaryResults[targetUnitIndex];
        const newElectricity = Math.round((target.electricityAmount + roundingDiff) * 100) / 100;
        preliminaryResults[targetUnitIndex] = {
          ...target,
          electricityAmount: newElectricity,
          reconciliationDiff: roundingDiff,
          totalAmountDue: Math.round((newElectricity + target.additionalTotal) * 100) / 100,
        };
      }
    }
  }

  const totalElectricityBilled = preliminaryResults.reduce((acc, r) => acc + r.electricityAmount, 0);
  const totalAdditionalCharges = preliminaryResults.reduce((acc, r) => acc + r.additionalTotal, 0);
  const grandTotalBilled = totalElectricityBilled + totalAdditionalCharges;
  const isReconciled = Math.abs(totalElectricityBilled - meralcoTotalAmount) < 0.01;

  return {
    effectiveBaseRate,
    totalTenantDirectKwh,
    totalCommonAreaKwh,
    totalSubMeterKwh,
    totalMainKwh,
    residualLossKwh,
    residualLossPercent,
    residualLossCost,
    totalElectricityBilled,
    meralcoTotalAmount,
    totalAdditionalCharges,
    grandTotalBilled,
    isReconciled,
    tenantResults: preliminaryResults,
    commonAreaBreakdown,
  };
};
