import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { AppData, BillingCycle } from '../types';

export const DB_NAME = 'meralco_submeter_db';
export const DB_VERSION = 1;

export const STORES = {
  APP_DATA: 'app_data',
  BILL_PHOTOS: 'bill_photos',
  HISTORY_ARCHIVE: 'history_archive',
} as const;

export const APP_DATA_KEY = 'current_app_data';

export interface BillPhotoItem {
  id: string;
  data: string; // Base64 data URL or binary representation
  cycleId?: string;
  mimeType?: string;
  fileName?: string;
  sizeBytes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MeralcoDB extends DBSchema {
  app_data: {
    key: string;
    value: AppData;
  };
  bill_photos: {
    key: string;
    value: BillPhotoItem;
    indexes: { 'by-cycle': string };
  };
  history_archive: {
    key: string;
    value: BillingCycle;
    indexes: { 'by-created': string; 'by-month': string };
  };
}

let dbPromise: Promise<IDBPDatabase<MeralcoDB>> | null = null;

/**
 * Returns a singleton Promise of the IndexedDB connection.
 */
export const getDB = async (): Promise<IDBPDatabase<MeralcoDB>> => {
  if (typeof indexedDB === 'undefined') {
    throw new Error('IndexedDB is not supported in this environment');
  }

  if (!dbPromise) {
    dbPromise = openDB<MeralcoDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // 1. app_data: stores full AppData backup and active state
        if (!db.objectStoreNames.contains(STORES.APP_DATA)) {
          db.createObjectStore(STORES.APP_DATA);
        }

        // 2. bill_photos: stores large binary/base64 bill photos and attachments
        if (!db.objectStoreNames.contains(STORES.BILL_PHOTOS)) {
          const photoStore = db.createObjectStore(STORES.BILL_PHOTOS, { keyPath: 'id' });
          photoStore.createIndex('by-cycle', 'cycleId');
        }

        // 3. history_archive: stores archived billing cycles
        if (!db.objectStoreNames.contains(STORES.HISTORY_ARCHIVE)) {
          const historyStore = db.createObjectStore(STORES.HISTORY_ARCHIVE, { keyPath: 'id' });
          historyStore.createIndex('by-created', 'createdAt');
          historyStore.createIndex('by-month', 'mainBill.billingMonth');
        }
      },
      blocked() {
        console.warn('[IndexedDB] Database upgrade is blocked by an open tab.');
      },
      blocking() {
        console.warn('[IndexedDB] Database is blocking a newer version.');
      },
      terminated() {
        dbPromise = null;
      },
    });
  }

  return dbPromise;
};

// ==========================================
// AppData Getters & Setters
// ==========================================

/**
 * Asynchronously save full AppData snapshot to IndexedDB.
 * Also synchronizes all billing cycles to the history_archive store.
 */
export const saveAppDataToIndexedDB = async (data: AppData): Promise<void> => {
  try {
    const db = await getDB();
    const tx = db.transaction([STORES.APP_DATA, STORES.HISTORY_ARCHIVE], 'readwrite');
    
    // Save complete AppData state
    await tx.objectStore(STORES.APP_DATA).put(data, APP_DATA_KEY);

    // Save/update each cycle individually in history_archive for granular queries
    if (data.billingCycles && Array.isArray(data.billingCycles)) {
      const historyStore = tx.objectStore(STORES.HISTORY_ARCHIVE);
      for (const cycle of data.billingCycles) {
        await historyStore.put(cycle);
      }
    }

    await tx.done;
  } catch (err) {
    console.error('[IndexedDB] Failed to save AppData to IndexedDB:', err);
    throw err;
  }
};

/**
 * Asynchronously load full AppData snapshot from IndexedDB.
 */
export const loadAppDataFromIndexedDB = async (): Promise<AppData | null> => {
  try {
    const db = await getDB();
    const data = await db.get(STORES.APP_DATA, APP_DATA_KEY);
    if (data) {
      return data;
    }
    return null;
  } catch (err) {
    console.error('[IndexedDB] Failed to load AppData from IndexedDB:', err);
    return null;
  }
};

// ==========================================
// Bill Photos Getters & Setters
// ==========================================

/**
 * Save a bill photo or attachment to the bill_photos store.
 */
export const saveBillPhoto = async (
  id: string,
  photoData: string,
  metadata?: { cycleId?: string; mimeType?: string; fileName?: string }
): Promise<void> => {
  try {
    const db = await getDB();
    const now = new Date().toISOString();
    const record: BillPhotoItem = {
      id,
      data: photoData,
      cycleId: metadata?.cycleId,
      mimeType: metadata?.mimeType || 'image/jpeg',
      fileName: metadata?.fileName,
      sizeBytes: photoData.length,
      createdAt: now,
      updatedAt: now,
    };
    await db.put(STORES.BILL_PHOTOS, record);
  } catch (err) {
    console.error(`[IndexedDB] Failed to save bill photo (id: ${id}):`, err);
    throw err;
  }
};

/**
 * Retrieve a bill photo by its id (returns data URL / base64 string or null).
 */
export const getBillPhoto = async (id: string): Promise<string | null> => {
  try {
    const db = await getDB();
    const record = await db.get(STORES.BILL_PHOTOS, id);
    return record ? record.data : null;
  } catch (err) {
    console.error(`[IndexedDB] Failed to get bill photo (id: ${id}):`, err);
    return null;
  }
};

/**
 * Retrieve the full BillPhotoItem record including metadata.
 */
export const getBillPhotoRecord = async (id: string): Promise<BillPhotoItem | null> => {
  try {
    const db = await getDB();
    const record = await db.get(STORES.BILL_PHOTOS, id);
    return record || null;
  } catch (err) {
    console.error(`[IndexedDB] Failed to get bill photo record (id: ${id}):`, err);
    return null;
  }
};

/**
 * Retrieve all bill photos associated with a specific billing cycle.
 */
export const getBillPhotosByCycle = async (cycleId: string): Promise<BillPhotoItem[]> => {
  try {
    const db = await getDB();
    return await db.getAllFromIndex(STORES.BILL_PHOTOS, 'by-cycle', cycleId);
  } catch (err) {
    console.error(`[IndexedDB] Failed to get bill photos for cycle ${cycleId}:`, err);
    return [];
  }
};

/**
 * Delete a bill photo from the bill_photos store.
 */
export const deleteBillPhoto = async (id: string): Promise<void> => {
  try {
    const db = await getDB();
    await db.delete(STORES.BILL_PHOTOS, id);
  } catch (err) {
    console.error(`[IndexedDB] Failed to delete bill photo (id: ${id}):`, err);
    throw err;
  }
};

// ==========================================
// History Archive Helpers
// ==========================================

/**
 * Save an individual billing cycle to history_archive.
 */
export const saveArchivedCycle = async (cycle: BillingCycle): Promise<void> => {
  try {
    const db = await getDB();
    await db.put(STORES.HISTORY_ARCHIVE, cycle);
  } catch (err) {
    console.error(`[IndexedDB] Failed to save archived cycle (id: ${cycle.id}):`, err);
    throw err;
  }
};

/**
 * Retrieve all archived billing cycles ordered by creation date (descending).
 */
export const getArchivedCycles = async (): Promise<BillingCycle[]> => {
  try {
    const db = await getDB();
    const cycles = await db.getAll(STORES.HISTORY_ARCHIVE);
    return cycles.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (err) {
    console.error('[IndexedDB] Failed to get archived cycles:', err);
    return [];
  }
};

/**
 * Retrieve a single archived cycle by id.
 */
export const getArchivedCycle = async (cycleId: string): Promise<BillingCycle | undefined> => {
  try {
    const db = await getDB();
    return await db.get(STORES.HISTORY_ARCHIVE, cycleId);
  } catch (err) {
    console.error(`[IndexedDB] Failed to get archived cycle (id: ${cycleId}):`, err);
    return undefined;
  }
};

/**
 * Delete an archived cycle from history_archive.
 */
export const deleteArchivedCycle = async (cycleId: string): Promise<void> => {
  try {
    const db = await getDB();
    await db.delete(STORES.HISTORY_ARCHIVE, cycleId);
  } catch (err) {
    console.error(`[IndexedDB] Failed to delete archived cycle (id: ${cycleId}):`, err);
    throw err;
  }
};

// ==========================================
// Maintenance & Diagnostics
// ==========================================

/**
 * Clear all stores in IndexedDB (for hard reset).
 */
export const clearAllIndexedDB = async (): Promise<void> => {
  try {
    const db = await getDB();
    const tx = db.transaction(
      [STORES.APP_DATA, STORES.BILL_PHOTOS, STORES.HISTORY_ARCHIVE],
      'readwrite'
    );
    await tx.objectStore(STORES.APP_DATA).clear();
    await tx.objectStore(STORES.BILL_PHOTOS).clear();
    await tx.objectStore(STORES.HISTORY_ARCHIVE).clear();
    await tx.done;
  } catch (err) {
    console.error('[IndexedDB] Failed to clear IndexedDB stores:', err);
    throw err;
  }
};

/**
 * Returns diagnostic counts and status of IndexedDB stores.
 */
export const getIndexedDBStats = async (): Promise<{
  appDataExists: boolean;
  photoCount: number;
  cycleCount: number;
}> => {
  try {
    const db = await getDB();
    const appData = await db.get(STORES.APP_DATA, APP_DATA_KEY);
    const photoCount = await db.count(STORES.BILL_PHOTOS);
    const cycleCount = await db.count(STORES.HISTORY_ARCHIVE);
    return {
      appDataExists: Boolean(appData),
      photoCount,
      cycleCount,
    };
  } catch (err) {
    console.error('[IndexedDB] Failed to get IndexedDB stats:', err);
    return {
      appDataExists: false,
      photoCount: 0,
      cycleCount: 0,
    };
  }
};
