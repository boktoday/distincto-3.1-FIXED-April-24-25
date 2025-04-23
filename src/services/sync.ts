import dbService from './db';
import { JournalEntry, FoodItem, SyncStatus } from '../types';

export class SyncService {
  private syncStatus: SyncStatus = {
    lastSync: 0,
    pendingSync: 0,
    isOnline: navigator.onLine
  };

  constructor() {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    this.loadSyncStatus();
  }

  private async loadSyncStatus(): Promise<void> {
    const storedStatus = localStorage.getItem('syncStatus');
    if (storedStatus) {
      this.syncStatus = JSON.parse(storedStatus);
    }
    // Ensure isOnline reflects current status on load
    this.syncStatus.isOnline = navigator.onLine;
    await this.updatePendingCount(); // Update count on load
  }

  private async saveSyncStatus(): Promise<void> {
    localStorage.setItem('syncStatus', JSON.stringify(this.syncStatus));
  }

  private handleOnline(): void {
    console.log("SyncService: App came online.");
    if (!this.syncStatus.isOnline) {
      this.syncStatus.isOnline = true;
      this.saveSyncStatus();
      console.log("SyncService: Attempting sync after coming online.");
      this.syncData(); // Trigger sync
    }
  }

  private handleOffline(): void {
    console.log("SyncService: App went offline.");
    if (this.syncStatus.isOnline) {
      this.syncStatus.isOnline = false;
      this.saveSyncStatus();
    }
  }

  private async updatePendingCount(): Promise<void> {
     try {
        await dbService.initialize(); // Ensure DB is ready
        const entries = await dbService.getUnsyncedJournalEntries();
        const items = await dbService.getUnsyncedFoodItems();
        const pendingCount = entries.length + items.length;
        if (this.syncStatus.pendingSync !== pendingCount) {
            console.log(`SyncService: Updating pending count from ${this.syncStatus.pendingSync} to ${pendingCount}`);
            this.syncStatus.pendingSync = pendingCount;
            await this.saveSyncStatus();
            window.dispatchEvent(new CustomEvent('syncStatusUpdated')); // Notify UI
        }
     } catch (error) {
        console.error("SyncService: Error updating pending count:", error);
     }
  }

  async syncData(): Promise<boolean> {
    if (!this.syncStatus.isOnline) {
      console.log('SyncService: Cannot sync: offline');
      await this.updatePendingCount(); // Update count even if offline
      return false;
    }

    console.log('SyncService: Starting data sync...');
    await this.updatePendingCount(); // Ensure count is up-to-date before sync

    try {
      await dbService.initialize();
      const journalEntries = await dbService.getUnsyncedJournalEntries();
      const foodItems = await dbService.getUnsyncedFoodItems();

      if (journalEntries.length === 0 && foodItems.length === 0) {
        console.log('SyncService: No data to sync.');
        if (this.syncStatus.pendingSync !== 0) { // Correct count if needed
            this.syncStatus.pendingSync = 0;
            await this.saveSyncStatus();
            window.dispatchEvent(new CustomEvent('syncStatusUpdated'));
        }
        return true;
      }

      console.log(`SyncService: Syncing ${journalEntries.length} journal entries and ${foodItems.length} food items... (Simulated)`);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network

      // Simulate successful sync
      for (const entry of journalEntries) {
        entry.synced = true;
        await dbService.saveJournalEntry(entry);
      }
      for (const item of foodItems) {
        item.synced = true;
        await dbService.saveFoodItem(item);
      }

      this.syncStatus.lastSync = Date.now();
      this.syncStatus.pendingSync = 0; // Reset after successful sync
      await this.saveSyncStatus();
      console.log('SyncService: Sync completed successfully.');
      window.dispatchEvent(new CustomEvent('syncStatusUpdated'));
      return true;
    } catch (error) {
      console.error('SyncService: Error syncing data:', error);
      // Update pending count after error
      await this.updatePendingCount();
      window.dispatchEvent(new CustomEvent('syncStatusUpdated'));
      return false;
    }
  }

  async registerForSync(): Promise<boolean> {
    console.log('SyncService: Attempting to register for background sync tag "sync-data"...');
    if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
       console.warn('SyncService: Background Sync not supported by this browser.');
       await this.updatePendingCount(); // Still update count
       return false;
    }

    try {
      console.log('SyncService: Waiting for service worker registration to be ready...');
      const registration = await navigator.serviceWorker.ready; // Waits for SW to be active
      console.log('SyncService: Service worker registration ready:', registration);
      console.log(`SyncService: Service worker state: ${registration.active?.state}`);

      if (!registration.active) {
         console.error('SyncService: Service worker is ready, but no active worker found. Cannot register sync.');
         await this.updatePendingCount();
         return false;
      }

      console.log('SyncService: Attempting registration.sync.register("sync-data")...');
      await registration.sync.register('sync-data');
      console.log('SyncService: Sync tag "sync-data" registered successfully.');
      // Trigger an immediate sync check after registration if online
      if (this.syncStatus.isOnline) {
         console.log("SyncService: Triggering sync check immediately after registration.");
         this.syncData(); // Don't await this, let it run in background
      } else {
         await this.updatePendingCount(); // Update count if offline
      }
      return true;
    } catch (error) {
      console.error('SyncService: Error registering for background sync:', error);
      if (error instanceof Error) {
          console.error(`SyncService: Registration error name: ${error.name}, message: ${error.message}`);
          if (error.name === 'InvalidAccessError') {
             console.error("SyncService: InvalidAccessError likely means the document is not fully active or the SW registration is invalid.");
          } else if (error.message.includes('404') || error.message.includes('failed to fetch')) {
                 console.error('SyncService: This might indicate the sw.js file was not found or accessible.');
            }
      }
      // Update pending count even if registration fails
      await this.updatePendingCount();
      return false; // Indicate failure
    }
  }

  getSyncStatus(): SyncStatus {
    // No need to recalculate here, updatePendingCount is called elsewhere (on load, before/after sync, on error)
    return { ...this.syncStatus };
  }
}

// Create and export a singleton instance
const syncService = new SyncService();
export default syncService;
