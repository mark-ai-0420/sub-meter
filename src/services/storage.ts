import { AppData, BillingCycle, AdditionalChargeItem, WaterReadingRecord } from '../types';
import { initialAppData } from '../utils/sampleData';
import { calculateBillingCycle } from './calculator';
import {
  saveAppDataToIndexedDB,
  loadAppDataFromIndexedDB,
  clearAllIndexedDB,
  saveBillPhoto,
} from './db';

const STORAGE_KEY = 'meralco_submeter_app_data_v1';
const DATA_RESTORED_EVENT = 'submeter:data_restored';

type SyncListener = (data: AppData) => void;
const syncListeners: Set<SyncListener> = new Set();

/**
 * Register a callback to be notified when background sync restores or updates AppData.
 */
export const onStorageSync = (listener: SyncListener): (() => void) => {
  syncListeners.add(listener);
  return () => {
    syncListeners.delete(listener);
  };
};

const notifySyncListeners = (data: AppData) => {
  syncListeners.forEach((listener) => {
    try {
      listener(data);
    } catch (e) {
      console.error('[Storage] Error in sync listener:', e);
    }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(DATA_RESTORED_EVENT, { detail: data })
    );
  }
};

/**
 * Helper to safely write data to LocalStorage with quota protection.
 * If base64 photos exceed quota, strips photo URLs for LocalStorage only while IndexedDB retains full fidelity.
 */
const writeToLocalStorageSafely = (data: AppData): boolean => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.warn('[Storage] LocalStorage write failed (possible quota exceeded), attempting lightweight write:', err);
    try {
      const sanitized: AppData = {
        ...data,
        billingCycles: data.billingCycles.map((cycle) => ({
          ...cycle,
          mainBill: {
            ...cycle.mainBill,
            billPhotoUrl: undefined,
          },
        })),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
      console.info('[Storage] Lightweight AppData saved to LocalStorage (full data preserved in IndexedDB).');
      return true;
    } catch (innerErr) {
      console.error('[Storage] Critical: LocalStorage write completely failed:', innerErr);
      return false;
    }
  }
};

/**
 * Synchronously loads AppData from LocalStorage for immediate UI rendering.
 * Automatically initiates a background check/sync to/from IndexedDB.
 */
export const loadAppData = (): AppData => {
  let localData: AppData | null = null;

  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (serialized) {
      localData = JSON.parse(serialized) as AppData;
    }
  } catch (err) {
    console.error('[Storage] Error parsing LocalStorage app data:', err);
  }

  if (localData && localData.units && localData.meters && localData.billingCycles) {
    // Background sync LocalStorage data to IndexedDB
    saveAppDataToIndexedDB(localData).catch((err) => {
      console.warn('[Storage] Background sync to IndexedDB failed:', err);
    });
    return localData;
  }

  // LocalStorage is empty or corrupted: trigger background restore from IndexedDB
  triggerBackgroundRestore();

  return initialAppData;
};

/**
 * Background task to check IndexedDB and restore state if LocalStorage was empty or corrupted.
 */
const triggerBackgroundRestore = async (): Promise<void> => {
  try {
    const idbData = await loadAppDataFromIndexedDB();
    if (idbData && idbData.units && idbData.meters && idbData.billingCycles) {
      console.info('[Storage] Restored valid AppData from IndexedDB into LocalStorage.');
      writeToLocalStorageSafely(idbData);
      notifySyncListeners(idbData);
    } else {
      // IndexedDB also empty, persist initial sample data to both
      console.info('[Storage] Initializing new sample AppData in LocalStorage and IndexedDB.');
      writeToLocalStorageSafely(initialAppData);
      await saveAppDataToIndexedDB(initialAppData);
    }
  } catch (err) {
    console.error('[Storage] Background restore from IndexedDB failed:', err);
  }
};

/**
 * Asynchronously loads AppData with robust fallback:
 * 1. Checks LocalStorage
 * 2. If missing or corrupt, checks IndexedDB
 * 3. If missing in both, initializes initial sample data
 */
export const loadAppDataAsync = async (): Promise<AppData> => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (serialized) {
      const parsed = JSON.parse(serialized) as AppData;
      if (parsed.units && parsed.meters && parsed.billingCycles) {
        // Sync to IndexedDB in background
        saveAppDataToIndexedDB(parsed).catch(console.warn);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Storage] LocalStorage read failed in loadAppDataAsync:', err);
  }

  // Fallback to IndexedDB
  try {
    const idbData = await loadAppDataFromIndexedDB();
    if (idbData && idbData.units && idbData.meters && idbData.billingCycles) {
      writeToLocalStorageSafely(idbData);
      return idbData;
    }
  } catch (err) {
    console.warn('[Storage] IndexedDB read failed in loadAppDataAsync:', err);
  }

  // Fallback to initialAppData
  writeToLocalStorageSafely(initialAppData);
  await saveAppDataToIndexedDB(initialAppData).catch(console.warn);
  return initialAppData;
};

/**
 * Saves AppData synchronously to LocalStorage and asynchronously to IndexedDB.
 */
export const saveAppData = (data: AppData): void => {
  writeToLocalStorageSafely(data);

  // Asynchronous background persistence to IndexedDB
  saveAppDataToIndexedDB(data).catch((err) => {
    console.error('[Storage] Failed to save AppData to IndexedDB during saveAppData:', err);
  });

  // Extract and store any bill photos into the dedicated bill_photos store
  if (data.billingCycles) {
    data.billingCycles.forEach((cycle) => {
      if (cycle.mainBill?.billPhotoUrl && cycle.mainBill.billPhotoUrl.startsWith('data:')) {
        saveBillPhoto(`photo-${cycle.id}`, cycle.mainBill.billPhotoUrl, {
          cycleId: cycle.id,
        }).catch((err) => {
          console.warn(`[Storage] Failed to cache bill photo for cycle ${cycle.id}:`, err);
        });
      }
    });
  }
};

/**
 * Asynchronously saves AppData and awaits both LocalStorage and IndexedDB completion.
 */
export const saveAppDataAsync = async (data: AppData): Promise<void> => {
  writeToLocalStorageSafely(data);
  await saveAppDataToIndexedDB(data);
};

/**
 * Explicit sync / backup method between LocalStorage and IndexedDB.
 * Ensures both storage layers are consistent and up-to-date.
 */
export const syncAppDataWithIndexedDB = async (
  currentData?: AppData
): Promise<{ data: AppData; status: 'synced' | 'restored_from_idb' | 'saved_to_idb' | 'initialized' }> => {
  const activeData = currentData || (await loadAppDataAsync());

  try {
    const idbData = await loadAppDataFromIndexedDB();

    if (!idbData) {
      // IndexedDB had nothing, save current state to IndexedDB
      await saveAppDataToIndexedDB(activeData);
      writeToLocalStorageSafely(activeData);
      return { data: activeData, status: 'saved_to_idb' };
    }

    // Reconcile: If currentData was provided and has more cycles or latest info, save it
    const activeCycleCount = activeData.billingCycles?.length || 0;
    const idbCycleCount = idbData.billingCycles?.length || 0;

    if (activeCycleCount >= idbCycleCount) {
      await saveAppDataToIndexedDB(activeData);
      writeToLocalStorageSafely(activeData);
      return { data: activeData, status: 'synced' };
    } else {
      // IndexedDB has more data (e.g. from previous session where LocalStorage was wiped)
      writeToLocalStorageSafely(idbData);
      return { data: idbData, status: 'restored_from_idb' };
    }
  } catch (err) {
    console.error('[Storage] Sync with IndexedDB failed:', err);
    writeToLocalStorageSafely(activeData);
    return { data: activeData, status: 'synced' };
  }
};

/**
 * Explicit backup trigger to IndexedDB.
 */
export const backupToIndexedDB = async (data: AppData): Promise<void> => {
  await saveAppDataToIndexedDB(data);
};

/**
 * Explicitly restore AppData from IndexedDB into LocalStorage.
 */
export const restoreFromIndexedDB = async (): Promise<AppData | null> => {
  const idbData = await loadAppDataFromIndexedDB();
  if (idbData) {
    writeToLocalStorageSafely(idbData);
    notifySyncListeners(idbData);
    return idbData;
  }
  return null;
};

export const createNewBillingCycle = (
  appData: AppData,
  cycleName: string,
  billingMonth: string,
  periodFrom: string,
  periodTo: string,
  dueDate: string,
  totalAmountDue: number = 0,
  totalMainKwh: number = 0
): { updatedData: AppData; newCycleId: string } => {
  const newCycleId = `cycle-${Date.now()}`;

  // Find latest cycle to rollover readings
  const sortedCycles = [...appData.billingCycles].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const latestCycle = sortedCycles[0];

  const initialReadings: Record<string, { previous: number; present: number }> = {};

  appData.meters.forEach((meter) => {
    let prevReading = meter.initialReading || 0;
    if (latestCycle && latestCycle.readings[meter.id]) {
      // The new previous reading is the last cycle's present reading!
      prevReading = latestCycle.readings[meter.id].present ?? prevReading;
    }
    initialReadings[meter.id] = {
      previous: prevReading,
      present: prevReading, // initialize present reading equal to previous reading until entered
    };
  });

  // Preserve recurring default charges (like garbage fee) if desired, or start fresh
  const defaultAdditionalCharges: Record<string, AdditionalChargeItem[]> = {};
  appData.units.forEach((unit) => {
    if (latestCycle && latestCycle.additionalCharges[unit.id]) {
      // Clone recurring charges without water meter reading which will be new
      const recurring = latestCycle.additionalCharges[unit.id].map((c) => ({
        ...c,
        id: `charge-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      }));
      defaultAdditionalCharges[unit.id] = recurring;
    } else {
      defaultAdditionalCharges[unit.id] = [];
    }
  });

  // Rollover water readings if present in previous cycle
  const initialWaterReadings: Record<string, WaterReadingRecord> = {};
  appData.units.forEach((unit) => {
    if (latestCycle && latestCycle.waterReadings && latestCycle.waterReadings[unit.id]) {
      const prevWater = latestCycle.waterReadings[unit.id];
      initialWaterReadings[unit.id] = {
        previous: prevWater.present || 0,
        present: prevWater.present || 0,
        ratePerCuM: prevWater.ratePerCuM || 0,
        amount: 0,
      };
    }
  });

  const newCycle: BillingCycle = {
    id: newCycleId,
    name: cycleName,
    createdAt: new Date().toISOString(),
    status: 'draft',
    mainBill: {
      billingMonth,
      periodFrom,
      periodTo,
      dueDate,
      totalAmountDue,
      totalMainKwh,
    },
    readings: initialReadings,
    additionalCharges: defaultAdditionalCharges,
    commonAreaAllocMethod: latestCycle ? latestCycle.commonAreaAllocMethod : 'equal',
    payments: {},
    waterReadings: initialWaterReadings,
  };

  // Run calculation
  newCycle.calculationSummary = calculateBillingCycle({
    units: appData.units,
    meters: appData.meters,
    mainBill: newCycle.mainBill,
    readings: newCycle.readings,
    additionalCharges: newCycle.additionalCharges,
    commonAreaAllocMethod: newCycle.commonAreaAllocMethod,
  });

  const updatedData: AppData = {
    ...appData,
    billingCycles: [newCycle, ...appData.billingCycles],
    activeCycleId: newCycleId,
  };

  saveAppData(updatedData);
  return { updatedData, newCycleId };
};

export const exportDataAsJSON = (appData: AppData): string => {
  return JSON.stringify(appData, null, 2);
};

export const importDataFromJSON = (jsonString: string): AppData => {
  const parsed = JSON.parse(jsonString) as AppData;
  if (!parsed.units || !parsed.meters || !parsed.billingCycles) {
    throw new Error('Invalid backup file format: missing essential data structures.');
  }

  // Ensure each cycle safely has payments and waterReadings records
  const sanitizedCycles: BillingCycle[] = parsed.billingCycles.map((cycle) => ({
    ...cycle,
    payments: cycle.payments || {},
    waterReadings: cycle.waterReadings || {},
  }));

  const sanitizedData: AppData = {
    ...parsed,
    billingCycles: sanitizedCycles,
  };

  saveAppData(sanitizedData);
  return sanitizedData;
};

export const resetToSampleData = (): AppData => {
  saveAppData(initialAppData);
  clearAllIndexedDB().catch((err) => {
    console.warn('[Storage] Could not clear IndexedDB on reset:', err);
  });
  return initialAppData;
};

export interface StorageHealthInfo {
  isSupported: boolean;
  isPersisted: boolean;
  usageBytes: number;
  quotaBytes: number;
  usageFormatted: string;
  quotaFormatted: string;
  percentageUsed: number;
}

/**
 * Formats bytes into a human-readable string (KB, MB, GB).
 */
export const formatStorageBytes = (bytes: number): string => {
  if (!bytes || bytes <= 0 || !Number.isFinite(bytes)) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  if (i === 0) return `${bytes} B`;
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(1)} ${units[i]}`;
};

/**
 * Requests persistent, non-evictable storage from the browser.
 * Checks if persistence is already active or requests it via navigator.storage.persist().
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.persist) {
    console.info('[Storage] Persistent storage granted: false');
    return false;
  }

  try {
    let isPersisted = false;
    if (navigator.storage.persisted) {
      isPersisted = await navigator.storage.persisted();
    }
    if (isPersisted) {
      console.info('[Storage] Persistent storage granted: true');
      return true;
    }

    const granted = await navigator.storage.persist();
    console.info(`[Storage] Persistent storage granted: ${granted}`);
    return granted;
  } catch (err) {
    console.warn('[Storage] Error requesting persistent storage:', err);
    console.info('[Storage] Persistent storage granted: false');
    return false;
  }
}

/**
 * Retrieves storage persistence status, usage, and quota estimates.
 * Safely handles browser variations where storage estimation or persistence APIs are absent.
 */
export async function getStorageHealth(): Promise<StorageHealthInfo> {
  const isSupported = typeof navigator !== 'undefined' && Boolean(navigator.storage);

  if (!isSupported) {
    return {
      isSupported: false,
      isPersisted: false,
      usageBytes: 0,
      quotaBytes: 0,
      usageFormatted: '0 B',
      quotaFormatted: 'Unknown',
      percentageUsed: 0,
    };
  }

  try {
    const isPersisted = navigator.storage.persisted
      ? await navigator.storage.persisted()
      : false;

    let usageBytes = 0;
    let quotaBytes = 0;

    if (navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      usageBytes = estimate.usage || 0;
      quotaBytes = estimate.quota || 0;
    }

    const percentageUsed =
      quotaBytes > 0
        ? Math.min(100, Number(((usageBytes / quotaBytes) * 100).toFixed(2)))
        : 0;

    return {
      isSupported: true,
      isPersisted,
      usageBytes,
      quotaBytes,
      usageFormatted: formatStorageBytes(usageBytes),
      quotaFormatted: quotaBytes > 0 ? formatStorageBytes(quotaBytes) : 'Unknown',
      percentageUsed,
    };
  } catch (err) {
    console.warn('[Storage] Error querying storage health estimate:', err);
    return {
      isSupported: true,
      isPersisted: false,
      usageBytes: 0,
      quotaBytes: 0,
      usageFormatted: '0 B',
      quotaFormatted: 'Unknown',
      percentageUsed: 0,
    };
  }
}

