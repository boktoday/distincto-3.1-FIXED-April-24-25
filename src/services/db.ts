import { Report, JournalEntry, FoodItem, Child } from '../types'; // Added Child
import { loadMockData } from '../mockData'; // Import loadMockData

class DatabaseService {
  public db: IDBDatabase | null = null;
  private dbName = 'distincto_journal';
  private version = 3; // << INCREMENTED VERSION TO 3 for children store

  constructor() {
    // No immediate initDB call here, let initialize handle it
  }

  private async initDB(): Promise<void> {
    if (this.db) return Promise.resolve(); // Already initialized

    return new Promise((resolve, reject) => {
      console.log(`Opening IndexedDB: ${this.dbName} version ${this.version}`);
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = (event) => {
        console.error('IndexedDB error:', request.error);
        reject(new Error(`IndexedDB error: ${request.error?.message}`));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        console.log('IndexedDB opened successfully.');

        // Add listeners for unexpected close
        this.db.onclose = () => {
          console.warn('IndexedDB connection closed unexpectedly.');
          this.db = null; // Reset db instance
        };
        this.db.onerror = (event) => {
           console.error('IndexedDB database error:', (event.target as any)?.error);
        };

        resolve();
      };

      request.onupgradeneeded = (event) => {
        console.log('IndexedDB upgrade needed.');
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = (event.target as IDBOpenDBRequest).transaction; // Get transaction for logging

        console.log('Starting schema upgrade...');

        // --- Children Store ---
        let childrenStore: IDBObjectStore;
        if (!db.objectStoreNames.contains('children')) {
          console.log('Creating object store: children');
          childrenStore = db.createObjectStore('children', { keyPath: 'id', autoIncrement: true });
          // Add index for name if needed for lookups
          if (!childrenStore.indexNames.contains('name')) {
            console.log('Creating index "name" on children store.');
            childrenStore.createIndex('name', 'name', { unique: false }); // Name might not be unique
          }
        } else {
          childrenStore = transaction!.objectStore('children');
          // Ensure index exists even if store exists
          if (!childrenStore.indexNames.contains('name')) {
            console.log('Creating index "name" on existing children store.');
            childrenStore.createIndex('name', 'name', { unique: false });
          }
        }

        // --- Journal Entries Store ---
        let journalStore: IDBObjectStore;
        if (!db.objectStoreNames.contains('journalEntries')) {
          console.log('Creating object store: journalEntries');
          journalStore = db.createObjectStore('journalEntries', { keyPath: 'id', autoIncrement: true });
        } else {
          journalStore = transaction!.objectStore('journalEntries');
        }
        // Indexes for journalEntries
        if (!journalStore.indexNames.contains('childId')) { // Index for foreign key
          console.log('Creating index "childId" on journalEntries store.');
          journalStore.createIndex('childId', 'childId', { unique: false });
        }
        if (!journalStore.indexNames.contains('childName')) {
          console.log('Creating index "childName" on journalEntries store.');
          journalStore.createIndex('childName', 'childName', { unique: false });
        }
        if (!journalStore.indexNames.contains('timestamp')) {
          console.log('Creating index "timestamp" on journalEntries store.');
          journalStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        if (!journalStore.indexNames.contains('synced')) {
           console.log('Creating index "synced" on journalEntries store.');
           journalStore.createIndex('synced', 'synced', { unique: false });
        }

        // --- Food Items Store ---
        let foodStore: IDBObjectStore;
        if (!db.objectStoreNames.contains('foodItems')) {
          console.log('Creating object store: foodItems');
          foodStore = db.createObjectStore('foodItems', { keyPath: 'id', autoIncrement: true });
        } else {
           foodStore = transaction!.objectStore('foodItems');
        }
        // Indexes for foodItems
        if (!foodStore.indexNames.contains('childId')) { // Index for foreign key
          console.log('Creating index "childId" on foodItems store.');
          foodStore.createIndex('childId', 'childId', { unique: false });
        }
        if (!foodStore.indexNames.contains('childName')) {
           console.log('Creating index "childName" on foodItems store.');
           foodStore.createIndex('childName', 'childName', { unique: false });
        }
        if (!foodStore.indexNames.contains('timestamp')) {
          console.log('Creating index "timestamp" on foodItems store.');
          foodStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        if (!foodStore.indexNames.contains('synced')) {
           console.log('Creating index "synced" on foodItems store.');
           foodStore.createIndex('synced', 'synced', { unique: false });
        }

        // --- Reports Store ---
        let reportStore: IDBObjectStore;
        if (!db.objectStoreNames.contains('reports')) {
          console.log('Creating object store: reports');
          reportStore = db.createObjectStore('reports', { keyPath: 'id', autoIncrement: true });
        } else {
           reportStore = transaction!.objectStore('reports');
        }
        // Indexes for reports
        if (!reportStore.indexNames.contains('childId')) { // Index for foreign key
          console.log('Creating index "childId" on reports store.');
          reportStore.createIndex('childId', 'childId', { unique: false });
        }
        // Add other necessary indexes for reports here if needed

        transaction?.addEventListener('complete', () => {
           console.log('Schema upgrade transaction completed.');
        });
        transaction?.addEventListener('error', (ev) => {
           console.error('Schema upgrade transaction error:', transaction.error);
        });
        transaction?.addEventListener('abort', (ev) => {
           console.error('Schema upgrade transaction aborted:', transaction.error);
        });

        console.log('Schema upgrade finished.');
      };

      request.onblocked = () => {
        console.warn('IndexedDB connection blocked. Please close other tabs using this database.');
        reject(new Error('IndexedDB connection blocked.'));
      };
    });
  }

  public async initialize(forceReopen = false): Promise<void> {
    if (this.db && !forceReopen) {
       console.log('DatabaseService already initialized.');
       return;
    }
    if (this.db && forceReopen) {
        console.log('Forcing database connection reopen...');
        this.db.close(); // Close existing connection
        this.db = null;
    }

    console.log('Initializing DatabaseService...');
    try {
      // Version is now 3
      await this.initDB();
      console.log('DatabaseService initialized successfully.');
    } catch (error) {
      console.error('Failed to initialize DatabaseService:', error);
      // If initialization fails due to version change/block, try reopening with current version
      if (error instanceof Error && error.message.includes('blocked')) {
          console.warn('Initialization blocked, attempting to reopen without version change...');
          // Try reopening with the *previous* version if the current one failed
          this.version = 2; // Revert to previous known good version
          try {
            await this.initDB(); // Try again without forcing upgrade
            console.log('DatabaseService re-initialized with existing version 2.');
          } catch (reopenError) {
             console.error('Failed to re-initialize with version 2:', reopenError);
             throw error; // Re-throw the original error if fallback fails
          }
      } else {
         throw error; // Re-throw other errors
      }
    }
  }

  // Method to load mock data if the database is empty
  public async loadMockDataIfNeeded(): Promise<void> {
    await this.initialize(); // Ensure DB is initialized first
    try {
      // Check if both children and entries are empty before loading mock data
      const [children, entries] = await Promise.all([
        this.getAllChildren(),
        this.getAllJournalEntries()
      ]);

      if (children.length === 0 && entries.length === 0) {
        console.log('Database is empty, loading mock data...');
        await loadMockData(); // Call the imported function
      } else {
        console.log('Database already contains data. Skipping mock data load.');
      }
    } catch (error) {
      console.error('Error during loadMockDataIfNeeded:', error);
    }
  }


  private async getStore(name: string, mode: IDBTransactionMode = 'readonly'): Promise<{ store: IDBObjectStore, transaction: IDBTransaction }> {
    await this.initialize(); // Ensure DB is initialized before getting a store
    if (!this.db) {
      throw new Error('Database not initialized or connection lost.');
    }
    try {
      const transaction = this.db.transaction(name, mode);
      const store = transaction.objectStore(name);
      transaction.onerror = (event) => {
        console.error(`Transaction error on store ${name}:`, transaction.error);
      };
       transaction.onabort = (event) => {
        console.warn(`Transaction aborted on store ${name}:`, transaction.error);
      };
      return { store, transaction };
    } catch (error) {
       console.error(`Error getting store ${name}:`, error);
       if (error instanceof DOMException && error.name === 'InvalidStateError') {
          console.warn('Database connection might be closed. Attempting to re-initialize...');
          await this.initialize(true); // Force reopen
          if (!this.db) throw new Error('Failed to re-initialize database connection.');
          const transaction = this.db.transaction(name, mode);
          const store = transaction.objectStore(name);
          return { store, transaction };
       }
       throw error; // Re-throw other errors
    }
  }

  // --- Child CRUD ---
  async saveChild(child: Child): Promise<number> {
    const { store, transaction } = await this.getStore('children', 'readwrite');
    return new Promise((resolve, reject) => {
      const isUpdate = child.id !== undefined && child.id !== null;
      if (!isUpdate) {
        delete child.id; // Let autoIncrement handle ID for new children
      }
      const request = store.put(child);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => {
        console.error('Failed to save child:', request.error);
        reject(new Error(`Failed to save child: ${request.error?.message}`));
      };
      transaction.oncomplete = () => console.log(`Save child transaction completed for id: ${request.result}`);
      transaction.onerror = () => console.error(`Save child transaction failed: ${transaction.error}`);
    });
  }

  async getChild(id: number): Promise<Child | null> {
    const { store } = await this.getStore('children');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => {
        console.error('Failed to get child:', request.error);
        reject(new Error(`Failed to get child: ${request.error?.message}`));
      };
    });
  }

  async getAllChildren(): Promise<Child[]> {
    const { store } = await this.getStore('children');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => {
        console.error('Failed to get all children:', request.error);
        reject(new Error(`Failed to get all children: ${request.error?.message}`));
      };
    });
  }

  async deleteChild(id: number): Promise<void> {
    // TODO: Consider implications - should deleting a child also delete their entries/food items?
    // For now, just deletes the child record. Add cascading delete logic if needed.
    const { store, transaction } = await this.getStore('children', 'readwrite');
    return new Promise((resolve, reject) => {
      console.log(`Attempting to delete child with id: ${id}`);
      const request = store.delete(id);
      request.onsuccess = () => console.log(`Delete request successful for child id: ${id}`);
      request.onerror = () => console.error(`Delete request failed for child id: ${id}:`, request.error);

      transaction.oncomplete = () => {
        console.log(`Successfully completed delete transaction for child id: ${id}`);
        resolve();
      };
      transaction.onerror = () => {
        console.error(`Delete transaction failed for child id: ${id}:`, transaction.error);
        reject(new Error(`Failed to delete child (transaction error): ${transaction.error?.message}`));
      };
      transaction.onabort = () => {
        console.warn(`Delete transaction aborted for child id: ${id}:`, transaction.error);
        reject(new Error(`Failed to delete child (transaction aborted): ${transaction.error?.message}`));
      };
    });
  }

  // --- Journal Entry CRUD ---
  async saveJournalEntry(entry: JournalEntry): Promise<number> {
    const { store, transaction } = await this.getStore('journalEntries', 'readwrite');
    return new Promise((resolve, reject) => {
      if (!entry.date) {
        entry.date = new Date(entry.timestamp).toISOString().split('T')[0];
      }
      const isUpdate = entry.id !== undefined && entry.id !== null;
      if (!isUpdate) {
          delete entry.id;
      }
      // Ensure synced is explicitly set (e.g., false for new/updated local entries)
      if (entry.synced === undefined) {
          entry.synced = false;
      }

      const request = store.put(entry);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => {
        console.error('Failed to save journal entry:', request.error);
        reject(new Error(`Failed to save journal entry: ${request.error?.message}`));
      };
      transaction.oncomplete = () => console.log(`Save journal entry transaction completed for id: ${request.result}`);
      transaction.onerror = () => console.error(`Save journal entry transaction failed: ${transaction.error}`);
    });
  }

  async getJournalEntry(id: number): Promise<JournalEntry | null> {
    const { store } = await this.getStore('journalEntries');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => {
        console.error('Failed to get journal entry:', request.error);
        reject(new Error(`Failed to get journal entry: ${request.error?.message}`));
      };
    });
  }

  async getAllJournalEntries(): Promise<JournalEntry[]> {
    const { store } = await this.getStore('journalEntries');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => {
        console.error('Failed to get all journal entries:', request.error);
        reject(new Error(`Failed to get all journal entries: ${request.error?.message}`));
      };
    });
  }

  async deleteJournalEntry(id: number): Promise<void> {
    const { store, transaction } = await this.getStore('journalEntries', 'readwrite');
    return new Promise((resolve, reject) => {
      console.log(`Attempting to delete journal entry with id: ${id}`);
      const request = store.delete(id);
      request.onsuccess = () => console.log(`Delete request successful for journal entry id: ${id}`);
      request.onerror = () => console.error(`Delete request failed for journal entry id: ${id}:`, request.error);

      transaction.oncomplete = () => {
        console.log(`Successfully completed delete transaction for journal entry id: ${id}`);
        resolve();
      };
      transaction.onerror = () => {
        console.error(`Delete transaction failed for journal entry id: ${id}:`, transaction.error);
        reject(new Error(`Failed to delete journal entry (transaction error): ${transaction.error?.message}`));
      };
       transaction.onabort = () => {
        console.warn(`Delete transaction aborted for journal entry id: ${id}:`, transaction.error);
        reject(new Error(`Failed to delete journal entry (transaction aborted): ${transaction.error?.message}`));
      };
    });
  }

  // --- Food Item CRUD ---
  async saveFoodItem(item: FoodItem): Promise<number> {
    const { store, transaction } = await this.getStore('foodItems', 'readwrite');
    return new Promise((resolve, reject) => {
       if (!item.date) {
         item.date = new Date(item.timestamp).toISOString().split('T')[0];
       }
       const isUpdate = item.id !== undefined && item.id !== null;
       if (!isUpdate) {
           delete item.id;
       }
       // Ensure synced is explicitly set
       if (item.synced === undefined) {
           item.synced = false;
       }

      const request = store.put(item);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => {
        console.error('Failed to save food item:', request.error);
        reject(new Error(`Failed to save food item: ${request.error?.message}`));
      };
      transaction.oncomplete = () => console.log(`Save food item transaction completed for id: ${request.result}`);
      transaction.onerror = () => console.error(`Save food item transaction failed: ${transaction.error}`);
    });
  }

  async getFoodItem(id: number): Promise<FoodItem | null> {
    const { store } = await this.getStore('foodItems');
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => {
        console.error('Failed to get food item:', request.error);
        reject(new Error(`Failed to get food item: ${request.error?.message}`));
      };
    });
  }

  async getAllFoodItems(): Promise<FoodItem[]> {
    const { store } = await this.getStore('foodItems');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => {
        console.error('Failed to get all food items:', request.error);
        reject(new Error(`Failed to get all food items: ${request.error?.message}`));
      };
    });
  }

  async deleteFoodItem(id: number): Promise<void> {
    const { store, transaction } = await this.getStore('foodItems', 'readwrite');
    return new Promise((resolve, reject) => {
      console.log(`Attempting to delete food item with id: ${id}`);
      const request = store.delete(id);
      request.onsuccess = () => console.log(`Delete request successful for food item id: ${id}`);
      request.onerror = () => console.error(`Delete request failed for food item id: ${id}:`, request.error);

      transaction.oncomplete = () => {
        console.log(`Successfully completed delete transaction for food item id: ${id}`);
        resolve();
      };
      transaction.onerror = () => {
        console.error(`Delete transaction failed for food item id: ${id}:`, transaction.error);
        reject(new Error(`Failed to delete food item (transaction error): ${transaction.error?.message}`));
      };
       transaction.onabort = () => {
        console.warn(`Delete transaction aborted for food item id: ${id}:`, transaction.error);
        reject(new Error(`Failed to delete food item (transaction aborted): ${transaction.error?.message}`));
      };
    });
  }

  // --- Report CRUD ---
  async getReports(): Promise<Report[]> {
    const { store } = await this.getStore('reports');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => {
        console.error('Failed to get reports:', request.error);
        reject(new Error(`Failed to get reports: ${request.error?.message}`));
      };
    });
  }

  async saveReport(report: Report): Promise<number> {
    const { store, transaction } = await this.getStore('reports', 'readwrite');
    return new Promise((resolve, reject) => {
       const isUpdate = report.id !== undefined && report.id !== null;
       if (!isUpdate) {
           delete report.id;
       }
      const request = store.put(report);
      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => {
        console.error('Failed to save report:', request.error);
        reject(new Error(`Failed to save report: ${request.error?.message}`));
      };
      transaction.oncomplete = () => console.log(`Save report transaction completed for id: ${request.result}`);
      transaction.onerror = () => console.error(`Save report transaction failed: ${transaction.error}`);
    });
  }

  // --- Filtered Getters ---
  async getJournalEntries(childId?: number): Promise<JournalEntry[]> { // Changed param to childId
    const { store } = await this.getStore('journalEntries');
    return new Promise((resolve, reject) => {
        let request: IDBRequest<any[]>;
        if (childId !== undefined) {
            try {
                const index = store.index('childId'); // Use childId index
                request = index.getAll(childId);
            } catch (e) {
                 console.error("Error accessing 'childId' index on 'journalEntries'. Falling back to getAll.", e);
                 request = store.getAll(); // Fallback
                 request.onsuccess = () => {
                     const allEntries = request.result || [];
                     resolve(allEntries.filter(entry => entry.childId === childId));
                 };
                 request.onerror = () => {
                     console.error('Failed to get journal entries (fallback):', request.error);
                     reject(new Error(`Failed to get journal entries (fallback): ${request.error?.message}`));
                 };
                 return;
            }
        } else {
            request = store.getAll();
        }

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => {
            console.error(`Failed to get journal entries${childId ? ` for child ${childId}` : ''}:`, request.error);
            reject(new Error(`Failed to get journal entries: ${request.error?.message}`));
        };
    });
  }

  async getFoodItems(childId?: number): Promise<FoodItem[]> { // Changed param to childId
    const { store } = await this.getStore('foodItems');
    return new Promise((resolve, reject) => {
        let request: IDBRequest<any[]>;
        if (childId !== undefined) {
             try {
                const index = store.index('childId'); // Use childId index
                request = index.getAll(childId);
             } catch (e) {
                 console.error("Error accessing 'childId' index on 'foodItems'. Falling back to getAll.", e);
                 request = store.getAll(); // Fallback
                 request.onsuccess = () => {
                     const allItems = request.result || [];
                     resolve(allItems.filter(item => item.childId === childId));
                 };
                 request.onerror = () => {
                     console.error('Failed to get food items (fallback):', request.error);
                     reject(new Error(`Failed to get food items (fallback): ${request.error?.message}`));
                 };
                 return;
             }
        } else {
            request = store.getAll();
        }

        // *** FIX: Removed the extraneous `request```typescript` here ***
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => {
            console.error(`Failed to get food items${childId ? ` for child ${childId}` : ''}:`, request.error);
            reject(new Error(`Failed to get food items: ${request.error?.message}`));
        };
    });
  }

  // --- Sync Related Methods ---
  async getUnsyncedJournalEntries(): Promise<JournalEntry[]> {
    await this.initialize(); // Ensure DB is ready and schema is updated
    const { store } = await this.getStore('journalEntries');
    try {
        const index = store.index('synced');
        return new Promise((resolve, reject) => {
            // Query for entries where synced is false or doesn't exist
            const request = index.getAll(IDBKeyRange.only(0)); // More efficient query for 'false'
            // Alternative if null/undefined also mean unsynced: index.getAll() and filter below

            request.onsuccess = () => {
                const entries = request.result || [];
                // If you need to include entries where 'synced' is undefined/null:
                // resolve(entries.filter(entry => !entry.synced));
                resolve(entries); // Assuming only 'false' means unsynced after save logic update
            };
            request.onerror = () => {
                console.error('Failed to get unsynced journal entries using index:', request.error);
                // Fallback to getAll + filter if index query fails unexpectedly
                this.getAllJournalEntries()
                    .then(allEntries => resolve(allEntries.filter(entry => !entry.synced)))
                    .catch(fallbackError => reject(new Error(`Failed to get unsynced journal entries (index and fallback failed): ${fallbackError}`)));
            };
        });
    } catch (e) {
        console.error("Error accessing 'synced' index on 'journalEntries'. Falling back to getAll + filter.", e);
        // Fallback if index doesn't exist
        return this.getAllJournalEntries().then(allEntries => allEntries.filter(entry => !entry.synced));
    }
  }

  async getUnsyncedFoodItems(): Promise<FoodItem[]> {
    await this.initialize(); // Ensure DB is ready
    const { store } = await this.getStore('foodItems');
    try {
        const index = store.index('synced');
        return new Promise((resolve, reject) => {
            const request = index.getAll(IDBKeyRange.only(0)); // Query for 'false'

            request.onsuccess = () => {
                resolve(request.result || []);
            };
            request.onerror = () => {
                console.error('Failed to get unsynced food items using index:', request.error);
                 // Fallback
                this.getAllFoodItems()
                    .then(allItems => resolve(allItems.filter(item => !item.synced)))
                    .catch(fallbackError => reject(new Error(`Failed to get unsynced food items (index and fallback failed): ${fallbackError}`)));
            };
        });
    } catch (e) {
        console.error("Error accessing 'synced' index on 'foodItems'. Falling back to getAll + filter.", e);
         // Fallback
        return this.getAllFoodItems().then(allItems => allItems.filter(item => !item.synced));
    }
  }

  async getPendingSyncEntries(): Promise<(JournalEntry | FoodItem)[]> {
    // Note: This doesn't include Child data for sync yet. Add if needed.
    const [journalEntries, foodItems] = await Promise.all([
      this.getUnsyncedJournalEntries(),
      this.getUnsyncedFoodItems()
    ]);
    const combined = [...journalEntries, ...foodItems];
    return combined.filter(entry => entry.id !== undefined && entry.id !== null)
                   .map(entry => ({ ...entry, id: entry.id as number }));
  }
}

const dbService = new DatabaseService();
export default dbService;
