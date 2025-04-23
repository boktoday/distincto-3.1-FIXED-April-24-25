import dbService from './db';
import fileSystemService from './fileSystem';
import { JournalEntry, FoodItem, Report } from '../types';

interface BackupData {
  version: string;
  timestamp: number;
  journalEntries: JournalEntry[];
  foodItems: FoodItem[];
  reports: Report[];
  images: {
    path: string;
    data: string;
    type: string;
  }[];
}

class BackupService {
  private readonly BACKUP_VERSION = '1.0.0';
  private lastSelectedDirectory: FileSystemDirectoryHandle | null = null;

  private getDefaultFileName(): string {
    const date = new Date();
    const formattedDate = date.toISOString().split('T')[0];
    const formattedTime = date.toTimeString().split(' ')[0].replace(/:/g, '-');
    return `distincto-backup-${formattedDate}-${formattedTime}.json`;
  }

  private async selectDirectory(): Promise<FileSystemDirectoryHandle | null> {
    try {
      // @ts-ignore - TypeScript might not recognize the File System Access API
      const dirHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
      });
      this.lastSelectedDirectory = dirHandle;
      return dirHandle;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return null;
      }
      throw error;
    }
  }

  private async saveToDirectory(dirHandle: FileSystemDirectoryHandle, fileName: string, blob: Blob): Promise<void> {
    try {
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
    } catch (error) {
      console.error('Error saving to directory:', error);
      throw new Error('Failed to save file to selected directory');
    }
  }

  private fallbackSave(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private async base64ToBlob(base64: string, type: string): Promise<Blob> {
    const response = await fetch(base64);
    return response.blob();
  }

  async exportData(): Promise<{ usedModernAPI: boolean }> {
    try {
      // Collect all data
      const [journalEntries, foodItems, reports] = await Promise.all([
        dbService.getJournalEntries(),
        dbService.getFoodItems(),
        dbService.getReports()
      ]);

      // Collect all images
      const images: BackupData['images'] = [];
      for (const item of foodItems) {
        if (item.imageFile) {
          try {
            const imageBlob = await fileSystemService.getImage(item.imageFile);
            if (imageBlob) {
              const base64Data = await this.blobToBase64(imageBlob);
              images.push({
                path: item.imageFile,
                data: base64Data,
                type: imageBlob.type
              });
            }
          } catch (error) {
            console.warn(`Failed to process image for item ${item.id}:`, error);
          }
        }
      }

      const backupData: BackupData = {
        version: this.BACKUP_VERSION,
        timestamp: Date.now(),
        journalEntries,
        foodItems,
        reports,
        images
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const filename = this.getDefaultFileName();

      // Try modern directory picker API first
      try {
        const dirHandle = await this.selectDirectory();
        if (dirHandle) {
          await this.saveToDirectory(dirHandle, filename, blob);
          return { usedModernAPI: true };
        }
        // If user cancels directory selection, fall back to traditional method
        this.fallbackSave(blob, filename);
        return { usedModernAPI: false };
      } catch (error) {
        console.error('Error using directory picker:', error);
        this.fallbackSave(blob, filename);
        return { usedModernAPI: false };
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      throw new Error('Failed to export data');
    }
  }

  async importData(file: File): Promise<void> {
    try {
      const fileContent = await file.text();
      const backupData = JSON.parse(fileContent) as BackupData;

      if (!this.isValidBackup(backupData)) {
        throw new Error('Invalid backup file format');
      }

      // Restore images first
      for (const image of backupData.images) {
        try {
          const imageBlob = await this.base64ToBlob(image.data, image.type);
          await fileSystemService.saveImage(
            image.path.split('/').pop() || 'unknown',
            new File([imageBlob], image.path, { type: image.type })
          );
        } catch (error) {
          console.warn(`Failed to restore image ${image.path}:`, error);
        }
      }

      // Restore all data
      await Promise.all([
        ...backupData.journalEntries.map(entry => dbService.saveJournalEntry(entry)),
        ...backupData.foodItems.map(item => dbService.saveFoodItem(item)),
        ...backupData.reports.map(report => dbService.saveReport(report))
      ]);
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('Failed to import data');
    }
  }

  private isValidBackup(data: any): data is BackupData {
    return (
      data &&
      typeof data.version === 'string' &&
      typeof data.timestamp === 'number' &&
      Array.isArray(data.journalEntries) &&
      Array.isArray(data.foodItems) &&
      Array.isArray(data.reports) &&
      Array.isArray(data.images)
    );
  }
}

const backupService = new BackupService();
export default backupService;
