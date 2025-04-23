import { openDB, IDBPDatabase } from 'idb';

const FILE_SYSTEM_DB_NAME = 'FileSystemDB';
const FILE_SYSTEM_DB_VERSION = 2; // Keep version 2
const FILE_STORE_NAME = 'files'; // Renamed store name

class FileSystemService {
  private dbPromise: Promise<IDBPDatabase<any>> | null = null;

  private getDb(): Promise<IDBPDatabase<any>> {
    if (!this.dbPromise) {
      console.log(`Initializing IndexedDB connection for ${FILE_SYSTEM_DB_NAME} version ${FILE_SYSTEM_DB_VERSION}...`);
      this.dbPromise = openDB(FILE_SYSTEM_DB_NAME, FILE_SYSTEM_DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
          console.log(`Upgrading FileSystemDB from version ${oldVersion} to ${newVersion}`);
          if (!db.objectStoreNames.contains(FILE_STORE_NAME)) {
            console.log(`Creating object store: ${FILE_STORE_NAME}`);
            db.createObjectStore(FILE_STORE_NAME, { keyPath: 'path' });
            console.log(`Object store ${FILE_STORE_NAME} created successfully.`);
          } else {
            console.log(`Object store ${FILE_STORE_NAME} already exists.`);
          }
          // Add future upgrade logic here if needed
        },
        blocked() {
          console.error('FileSystemDB connection blocked. Close other tabs using the database.');
        },
        blocking() {
          console.warn('FileSystemDB connection is blocking other connections. This tab might be outdated.');
        },
        terminated() {
          console.warn('FileSystemDB connection terminated unexpectedly. Re-initializing.');
          fileSystemService.dbPromise = null; // Reset promise
        },
      }).then(db => {
        console.log('FileSystemDB connection established successfully.');
        console.log('Available object stores:', Array.from(db.objectStoreNames));
        // Add listeners for unexpected close
        db.onclose = () => {
          console.warn('FileSystemDB connection closed unexpectedly.');
          this.dbPromise = null; // Reset db promise
        };
        db.onerror = (event) => {
           console.error('FileSystemDB database error:', (event.target as any)?.error);
        };
        return db;
      }).catch(error => {
        console.error('Failed to open FileSystemDB:', error);
        this.dbPromise = null; // Reset promise on failure
        throw new Error('Could not initialize local file storage.');
      });
    }
    return this.dbPromise;
  }

  // Public initialize method
  public async initialize(): Promise<void> {
    console.log('Initializing FileSystemService...');
    try {
      await this.getDb(); // This ensures the DB connection is attempted
      console.log('FileSystemService initialized successfully.');
    } catch (error) {
      console.error('Failed to initialize FileSystemService:', error);
      throw error; // Re-throw to indicate initialization failure
    }
  }

  async saveFile(childName: string, fileName: string, fileData: Blob | File): Promise<string> {
    const db = await this.getDb();
    const path = `${childName}/${fileName}`;
    let arrayBuffer: ArrayBuffer;
    let fileType: string;

    try {
      if (fileData instanceof File) {
        arrayBuffer = await fileData.arrayBuffer();
        fileType = fileData.type;
      } else if (fileData instanceof Blob) {
        arrayBuffer = await fileData.arrayBuffer();
        fileType = fileData.type || 'application/octet-stream';
      } else {
        throw new Error('Invalid data type provided. Expected Blob or File.');
      }

      const transaction = db.transaction(FILE_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(FILE_STORE_NAME);

      await store.put({
        path,
        data: arrayBuffer,
        type: fileType,
        timestamp: Date.now()
      });

      await transaction.done;
      console.log(`File saved successfully to IndexedDB: ${path}`);
      return path;

    } catch (error) {
      console.error(`Error saving file "${path}" to IndexedDB:`, error);
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
         throw new Error('Local storage quota exceeded. Cannot save file.');
      }
      if (db && db.objectStoreNames) {
         console.error('Available object stores at time of error:', Array.from(db.objectStoreNames));
      }
      throw new Error(`Failed to save file locally: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async saveImage(childName: string, fileName: string, file: File): Promise<string> {
     // console.warn("`saveImage` is deprecated, use `saveFile` instead."); // Keep if you want warnings
     return this.saveFile(childName, fileName, file);
  }


  async getFile(path: string): Promise<Blob | null> {
    try {
      const db = await this.getDb();
      const transaction = db.transaction(FILE_STORE_NAME, 'readonly');
      const store = transaction.objectStore(FILE_STORE_NAME);
      const record = await store.get(path);

      if (record) {
        const { data, type } = record;
        if (data instanceof ArrayBuffer) {
           const blob = new Blob([data], { type });
           return blob;
        } else {
           console.error(`Invalid data format retrieved for path "${path}": Expected ArrayBuffer, got ${typeof data}`);
           return null;
        }
      } else {
        // console.log(`File not found in IndexedDB: ${path}`); // Less verbose logging
        return null;
      }
    } catch (error) {
       console.error(`Error getting file "${path}" from IndexedDB:`, error);
       try {
         const db = await this.getDb();
         if (db && db.objectStoreNames) {
           console.error('Available object stores at time of error:', Array.from(db.objectStoreNames));
         }
       } catch (dbError) {
         console.error('Could not get DB to log stores during getFile error:', dbError);
       }
       throw new Error(`Failed to retrieve file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getImage(path: string): Promise<Blob | null> {
     // console.warn("`getImage` is deprecated, use `getFile` instead."); // Keep if you want warnings
     return this.getFile(path);
  }

  async deleteFile(path: string): Promise<void> {
     try {
        const db = await this.getDb();
        const transaction = db.transaction(FILE_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(FILE_STORE_NAME);
        await store.delete(path);
        await transaction.done;
        console.log(`File deleted successfully from IndexedDB: ${path}`);
     } catch (error) {
        console.error(`Error deleting file "${path}" from IndexedDB:`, error);
        try {
          const db = await this.getDb();
          if (db && db.objectStoreNames) {
            console.error('Available object stores at time of error:', Array.from(db.objectStoreNames));
          }
        } catch (dbError) {
          console.error('Could not get DB to log stores during deleteFile error:', dbError);
        }
        throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : String(error)}`);
     }
  }

   async deleteImage(path: string): Promise<void> {
      // console.warn("`deleteImage` is deprecated, use `deleteFile` instead."); // Keep if you want warnings
      return this.deleteFile(path);
   }

   async listFiles(folderPath?: string): Promise<{ path: string; timestamp: number; type: string }[]> {
     try {
        const db = await this.getDb();
        const transaction = db.transaction(FILE_STORE_NAME, 'readonly');
        const store = transaction.objectStore(FILE_STORE_NAME);
        const allRecords = await store.getAll();

        const files = allRecords.map(record => ({
           path: record.path,
           timestamp: record.timestamp,
           type: record.type
        }));

        if (folderPath) {
           const prefix = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
           return files.filter(file => file.path.startsWith(prefix));
        }

        return files;
     } catch (error) {
        console.error('Error listing files from IndexedDB:', error);
        try {
          const db = await this.getDb();
          if (db && db.objectStoreNames) {
            console.error('Available object stores at time of error:', Array.from(db.objectStoreNames));
          }
        } catch (dbError) {
          console.error('Could not get DB to log stores during listFiles error:', dbError);
        }
        throw new Error(`Failed to list files: ${error instanceof Error ? error.message : String(error)}`);
     }
   }
}

const fileSystemService = new FileSystemService();
export default fileSystemService;
