import { AppData, BillingCycle } from '../types';
import { calculateBillingCycle } from './calculator';

export interface UnitConsumptionHistoryItem {
  cycleId: string;
  cycleName: string;
  billingMonth: string;
  kwh: number;
  amount: number;
  isMainLine: boolean;
}

export interface ConsumptionAnomalyResult {
  hasAnomaly: boolean;
  percentSpike: number;
  averageKwh: number;
  severity: 'normal' | 'warning' | 'critical';
}

export interface CollectionKpiSummary {
  totalBilled: number;
  totalCollected: number;
  totalPending: number;
  paidCount: number;
  unpaidCount: number;
  partialCount: number;
  collectionRatePercent: number;
}

export interface PreviousCycleArrearsResult {
  hasArrears: boolean;
  unpaidAmount: number;
  previousCycleName: string;
}

/**
 * Returns consumption history for a given tenant unit across billing cycles,
 * sorted in chronological order (oldest to newest).
 */
export const getUnitConsumptionHistory = (
  appData: AppData,
  unitId: string,
  maxCycles: number = 6
): UnitConsumptionHistoryItem[] => {
  if (!appData || !appData.billingCycles || appData.billingCycles.length === 0) {
    return [];
  }

  // Sort cycles chronologically (oldest to newest)
  const sortedCycles = [...appData.billingCycles].sort((a, b) => {
    const timeA = a.createdAt
      ? new Date(a.createdAt).getTime()
      : a.mainBill?.billingMonth
      ? new Date(a.mainBill.billingMonth).getTime()
      : 0;
    const timeB = b.createdAt
      ? new Date(b.createdAt).getTime()
      : b.mainBill?.billingMonth
      ? new Date(b.mainBill.billingMonth).getTime()
      : 0;
    return timeA - timeB;
  });

  // Limit to most recent `maxCycles`
  const targetCycles = maxCycles > 0 ? sortedCycles.slice(-maxCycles) : sortedCycles;

  return targetCycles.map((cycle) => {
    let tenantResult = cycle.calculationSummary?.tenantResults?.find((r) => r.unitId === unitId);

    // If calculation summary is not cached, compute on the fly if units/meters exist
    if (!tenantResult && appData.units && appData.meters && cycle.mainBill && cycle.readings) {
      try {
        const summary = calculateBillingCycle({
          units: appData.units,
          meters: appData.meters,
          mainBill: cycle.mainBill,
          readings: cycle.readings,
          additionalCharges: cycle.additionalCharges || {},
          commonAreaAllocMethod: cycle.commonAreaAllocMethod || 'equal',
        });
        tenantResult = summary.tenantResults.find((r) => r.unitId === unitId);
      } catch (err) {
        console.warn(`[Analytics] Could not calculate tenant result for cycle ${cycle.id}:`, err);
      }
    }

    const unitInfo = appData.units?.find((u) => u.id === unitId);
    const isMainLine = tenantResult ? Boolean(tenantResult.isMainLine) : Boolean(unitInfo?.isMainLine);
    const kwh = tenantResult ? tenantResult.effectiveKwh ?? tenantResult.directKwh ?? 0 : 0;
    const amount = tenantResult ? tenantResult.totalAmountDue ?? tenantResult.electricityAmount ?? 0 : 0;

    return {
      cycleId: cycle.id,
      cycleName: cycle.name,
      billingMonth: cycle.mainBill?.billingMonth || '',
      kwh: Math.round(kwh * 100) / 100,
      amount: Math.round(amount * 100) / 100,
      isMainLine,
    };
  });
};

/**
 * Detects whether the current cycle's kWh represents an abnormal consumption spike (+30% or +50%)
 * compared to the unit's historical average (excluding 0 kWh cycles).
 */
export const detectConsumptionAnomaly = (
  history: Array<{ kwh: number }>,
  currentKwh: number
): ConsumptionAnomalyResult => {
  const validHistory = (history || []).filter(
    (item) => item && typeof item.kwh === 'number' && item.kwh > 0
  );

  if (validHistory.length === 0) {
    return {
      hasAnomaly: false,
      percentSpike: 0,
      averageKwh: 0,
      severity: 'normal',
    };
  }

  const sumKwh = validHistory.reduce((acc, curr) => acc + curr.kwh, 0);
  const avg = sumKwh / validHistory.length;
  const averageKwh = Math.round(avg * 10) / 10;

  if (currentKwh > avg * 1.3) {
    const percentSpike = Math.round(((currentKwh - avg) / avg) * 100);
    const severity: 'warning' | 'critical' = currentKwh > avg * 1.5 ? 'critical' : 'warning';
    return {
      hasAnomaly: true,
      percentSpike,
      averageKwh,
      severity,
    };
  }

  return {
    hasAnomaly: false,
    percentSpike: 0,
    averageKwh,
    severity: 'normal',
  };
};

/**
 * Computes high-level collection and payment KPI summary for a billing cycle.
 * Defaults all units without a payment record to unpaid status.
 */
export const getCollectionKpiSummary = (cycle: BillingCycle): CollectionKpiSummary => {
  const tenantResults = cycle?.calculationSummary?.tenantResults || [];

  if (tenantResults.length === 0) {
    // If calculation summary is missing but payments exist
    if (cycle?.payments && Object.keys(cycle.payments).length > 0) {
      let totalCollected = 0;
      let paidCount = 0;
      let unpaidCount = 0;
      let partialCount = 0;

      Object.values(cycle.payments).forEach((p) => {
        if (p.status === 'paid') {
          paidCount++;
          totalCollected += Number(p.amountPaid) || 0;
        } else if (p.status === 'partial') {
          partialCount++;
          totalCollected += Number(p.amountPaid) || 0;
        } else {
          unpaidCount++;
        }
      });

      const totalBilled = Number(cycle.mainBill?.totalAmountDue) || totalCollected;
      const roundedBilled = Math.round(totalBilled * 100) / 100;
      const roundedCollected = Math.round(totalCollected * 100) / 100;
      const totalPending = Math.max(0, Math.round((roundedBilled - roundedCollected) * 100) / 100);
      const collectionRatePercent =
        roundedBilled > 0 ? Math.round((roundedCollected / roundedBilled) * 1000) / 10 : 0;

      return {
        totalBilled: roundedBilled,
        totalCollected: roundedCollected,
        totalPending,
        paidCount,
        unpaidCount,
        partialCount,
        collectionRatePercent,
      };
    }

    return {
      totalBilled: 0,
      totalCollected: 0,
      totalPending: 0,
      paidCount: 0,
      unpaidCount: 0,
      partialCount: 0,
      collectionRatePercent: 0,
    };
  }

  let totalBilled = 0;
  let totalCollected = 0;
  let paidCount = 0;
  let unpaidCount = 0;
  let partialCount = 0;

  tenantResults.forEach((result) => {
    const unitBilled = Number(result.totalAmountDue) || 0;
    totalBilled += unitBilled;

    const payment = cycle.payments?.[result.unitId];

    if (!payment || payment.status === 'unpaid') {
      unpaidCount++;
    } else if (payment.status === 'paid') {
      paidCount++;
      const paid = payment.amountPaid > 0 ? payment.amountPaid : unitBilled;
      totalCollected += paid;
    } else if (payment.status === 'partial') {
      partialCount++;
      totalCollected += Number(payment.amountPaid) || 0;
    }
  });

  const roundedBilled = Math.round(totalBilled * 100) / 100;
  const roundedCollected = Math.round(totalCollected * 100) / 100;
  const totalPending = Math.max(0, Math.round((roundedBilled - roundedCollected) * 100) / 100);
  const collectionRatePercent =
    roundedBilled > 0 ? Math.round((roundedCollected / roundedBilled) * 1000) / 10 : 0;

  return {
    totalBilled: roundedBilled,
    totalCollected: roundedCollected,
    totalPending,
    paidCount,
    unpaidCount,
    partialCount,
    collectionRatePercent,
  };
};

/**
 * Looks up the immediately preceding billing cycle for a unit to detect any unpaid arrears.
 */
export const getPreviousCycleArrears = (
  appData: AppData,
  currentCycleId: string,
  unitId: string
): PreviousCycleArrearsResult => {
  const cycles = appData?.billingCycles || [];
  if (cycles.length === 0) {
    return { hasArrears: false, unpaidAmount: 0, previousCycleName: '' };
  }

  // Sort cycles chronologically (oldest to newest)
  const sorted = [...cycles].sort((a, b) => {
    const timeA = a.createdAt
      ? new Date(a.createdAt).getTime()
      : a.mainBill?.billingMonth
      ? new Date(a.mainBill.billingMonth).getTime()
      : 0;
    const timeB = b.createdAt
      ? new Date(b.createdAt).getTime()
      : b.mainBill?.billingMonth
      ? new Date(b.mainBill.billingMonth).getTime()
      : 0;
    return timeA - timeB;
  });

  const currentIndex = sorted.findIndex((c) => c.id === currentCycleId);
  let previousCycle: BillingCycle | undefined;

  if (currentIndex > 0) {
    previousCycle = sorted[currentIndex - 1];
  } else if (currentIndex === -1) {
    // If currentCycleId is new or not in the array, previous cycle is the latest existing one
    previousCycle = sorted[sorted.length - 1];
  } else {
    // currentIndex === 0: very first cycle, no preceding cycle
    return { hasArrears: false, unpaidAmount: 0, previousCycleName: '' };
  }

  if (!previousCycle) {
    return { hasArrears: false, unpaidAmount: 0, previousCycleName: '' };
  }

  // Determine total billed for this unit in previous cycle
  let tenantResult = previousCycle.calculationSummary?.tenantResults?.find((r) => r.unitId === unitId);
  if (!tenantResult && appData.units && appData.meters && previousCycle.mainBill && previousCycle.readings) {
    try {
      const summary = calculateBillingCycle({
        units: appData.units,
        meters: appData.meters,
        mainBill: previousCycle.mainBill,
        readings: previousCycle.readings,
        additionalCharges: previousCycle.additionalCharges || {},
        commonAreaAllocMethod: previousCycle.commonAreaAllocMethod || 'equal',
      });
      tenantResult = summary.tenantResults.find((r) => r.unitId === unitId);
    } catch {
      // ignore
    }
  }

  const billedAmount = Number(tenantResult?.totalAmountDue) || 0;
  if (billedAmount <= 0) {
    return { hasArrears: false, unpaidAmount: 0, previousCycleName: previousCycle.name };
  }

  const payment = previousCycle.payments?.[unitId];
  let unpaidAmount = 0;

  if (!payment || payment.status === 'unpaid') {
    unpaidAmount = billedAmount;
  } else if (payment.status === 'partial') {
    const paid = Number(payment.amountPaid) || 0;
    unpaidAmount = Math.max(0, billedAmount - paid);
  } else if (payment.status === 'paid') {
    unpaidAmount = 0;
  }

  const roundedUnpaid = Math.round(unpaidAmount * 100) / 100;
  return {
    hasArrears: roundedUnpaid > 0,
    unpaidAmount: roundedUnpaid,
    previousCycleName: previousCycle.name,
  };
};
