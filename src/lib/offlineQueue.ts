import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { ScanRecord, ReturnRecord } from '../types';

export interface QueueItem {
  id?: number; // Auto-incremented ID for the offline queue entry
  timestamp: number;
  type: 'record' | 'return';
  data: ScanRecord | ReturnRecord;
  action: 'upsert';
}

interface ScanQueueDB extends DBSchema {
  queue: {
    key: number;
    value: QueueItem;
    indexes: { 'by-timestamp': number };
  };
}

const DB_NAME = 'verell_offline_queue_db';
const STORE_NAME = 'queue';

let dbPromise: Promise<IDBPDatabase<ScanQueueDB>> | null = null;

function getDB(): Promise<IDBPDatabase<ScanQueueDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ScanQueueDB>(DB_NAME, 1, {
      upgrade(db) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('by-timestamp', 'timestamp');
      },
    });
  }
  return dbPromise;
}

/**
 * Adds a record or return scan to the offline queue
 */
export async function addToQueue(type: 'record' | 'return', data: ScanRecord | ReturnRecord): Promise<void> {
  const db = await getDB();
  await db.add(STORE_NAME, {
    timestamp: Date.now(),
    type,
    data,
    action: 'upsert',
  });
  // Dispatces a custom event so the UI knows there is a change in the queue size
  window.dispatchEvent(new CustomEvent('offline-queue-changed'));
}

/**
 * Retrieves all items in the offline queue
 */
export async function getQueue(): Promise<QueueItem[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

/**
 * Retrieves the count of items pending sync in the offline queue
 */
export async function getQueueCount(): Promise<number> {
  const db = await getDB();
  return db.count(STORE_NAME);
}

/**
 * Removes an item from the offline queue
 */
export async function removeFromQueue(id: number): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
  window.dispatchEvent(new CustomEvent('offline-queue-changed'));
}

/**
 * Clears everything in the offline queue
 */
export async function clearQueue(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.store.clear();
  await tx.done;
  window.dispatchEvent(new CustomEvent('offline-queue-changed'));
}
