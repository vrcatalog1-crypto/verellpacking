import { supabase } from './supabase';
import { getQueue, removeFromQueue, getQueueCount, QueueItem } from './offlineQueue';
import { ScanRecord } from '../types';

let isSyncing = false;

/**
 * Triggers flushing of the offline IndexedDB queue to Supabase.
 * Respects first-write-wins (PG unique violation 23505 triggers skipping of data).
 */
export async function syncOfflineQueue(): Promise<{ success: boolean; syncedCount: number }> {
  if (isSyncing || !supabase) {
    return { success: false, syncedCount: 0 };
  }

  isSyncing = true;
  let syncedCount = 0;

  try {
    const queue = await getQueue();
    if (queue.length === 0) {
      isSyncing = false;
      return { success: true, syncedCount: 0 };
    }

    console.log(`[SyncManager] Found ${queue.length} scan items in queue. Syncing...`);

    for (const item of queue) {
      if (!navigator.onLine) {
        console.log('[SyncManager] Browser is offline. Suspending sync.');
        break; // Stop and retry later if network goes down
      }

      let success = false;
      let discard = false;

      try {
        if (item.type === 'record') {
          const rec = item.data as ScanRecord;
          // Use .insert() instead of .upsert() so that the UNIQUE constraint on (resi, status)
          // is evaluated, preserving the first scanner (first-write-wins) and throwing 23505 for duplicate statuses.
          const { error } = await supabase.from('verell_records').insert({
            id: rec.id,
            resi: rec.resi,
            tanggal: rec.tanggal,
            time: rec.time,
            timestamp: rec.timestamp,
            status: rec.status,
            expedition: rec.expedition || null,
            courierCode: rec.courierCode || null,
            noPesanan: rec.noPesanan || null,
            products: rec.products || null
          });

          if (error) {
            if (error.code === '23505') {
              console.warn(`[SyncManager] First-write-wins conflict! Resi already recorded in Supabase: ${rec.resi} (${rec.status}). Discarding duplicate from queue.`);
              discard = true;
            } else {
              console.error('[SyncManager] Supabase insert error:', error);
              // If it's a network/concurrency/auth issue, keep in queue, else discard
              if (error.message?.includes('fetch') || error.code?.startsWith('08')) {
                // Keep item
              } else {
                discard = true;
              }
            }
          } else {
            success = true;
          }

        } else if (item.type === 'return') {
          const ret = item.data as any;
          const { error } = await supabase.from('verell_returns').insert({
            id: ret.id,
            resi: ret.resi,
            tanggal: ret.tanggal,
            time: ret.time,
            timestamp: ret.timestamp,
            courierName: ret.courierName,
            condition: ret.condition,
            reason: ret.reason
          });

          if (error) {
            if (error.code === '23505') {
              console.warn(`[SyncManager] First-write-wins return conflict! Resi ${ret.resi} return already recorded. Discarding duplicate return.`);
              discard = true;
            } else {
              console.error('[SyncManager] Supabase return insert error:', error);
              if (error.message?.includes('fetch') || error.code?.startsWith('08')) {
                // Keep item
              } else {
                discard = true;
              }
            }
          } else {
            success = true;
          }
        }
      } catch (err: any) {
        console.warn('[SyncManager] Connection error during HTTP request:', err);
        break; // Network exception: wait for next online event or fallback poll
      }

      if (success || discard) {
        if (item.id !== undefined) {
          await removeFromQueue(item.id);
          if (success) syncedCount++;
        }
      } else {
        break; // Stop queue processing if we have a temporary network failure
      }
    }

    isSyncing = false;
    return { success: true, syncedCount };
  } catch (err) {
    console.error('[SyncManager] Unexpected error during sync process:', err);
    isSyncing = false;
    return { success: false, syncedCount };
  }
}

/**
 * Initializes listeners for IndexedDB, online events, and the 30s polling fallback.
 */
export function initSyncManager(onQueueCountChange?: (count: number) => void) {
  const handleQueueChange = async () => {
    if (onQueueCountChange) {
      const count = await getQueueCount();
      onQueueCountChange(count);
    }
  };

  // Listen for IndexedDB changes triggered from addToQueue/removeFromQueue
  window.addEventListener('offline-queue-changed', handleQueueChange);

  // Listen for browser coming back online
  const handleOnline = () => {
    console.log('[SyncManager] Browser online event! Triggering immediate sync flush...');
    syncOfflineQueue().catch(console.error);
  };
  window.addEventListener('online', handleOnline);

  // Interval polling fallback (runs every 30 seconds)
  const intervalId = setInterval(() => {
    if (navigator.onLine) {
      syncOfflineQueue().catch(console.error);
    }
  }, 30000);

  // Initialize initial count and check offline sync state immediately
  handleQueueChange();
  if (navigator.onLine) {
    syncOfflineQueue().catch(console.error);
  }

  // Return a cleanup callback for react unmounting
  return () => {
    window.removeEventListener('offline-queue-changed', handleQueueChange);
    window.removeEventListener('online', handleOnline);
    clearInterval(intervalId);
  };
}
