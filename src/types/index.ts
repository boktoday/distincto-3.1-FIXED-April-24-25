import { Database } from 'sql.js';

export interface Child {
  id?: number; // Auto-incremented primary key
  name: string;
  dob?: string; // Date of Birth (YYYY-MM-DD)
  identifiesAs?: string; // Optional field
  biography?: string; // Optional field
  // Add other relevant child details here if needed in the future
}

export interface JournalEntry {
  id?: number;
  childId: number; // Foreign key linking to Child
  childName?: string; // Denormalized for easier display
  timestamp: number; // Unix timestamp (ms) for easy sorting/filtering
  date: string; // YYYY-MM-DD format for grouping
  medicationNotes?: string;
  educationNotes?: string;
  socialEngagementNotes?: string;
  sensoryProfileNotes?: string;
  foodNutritionNotes?: string;
  behavioralNotes?: string;
  sleepNotes?: string; // Added sleep notes
  generalNotes?: string; // For any other notes
  voiceRecordingPath?: string; // Path to the saved audio file
  transcription?: string; // Text from voice recording
  magicMoments?: string; // Positive observations
  synced?: boolean; // Sync status
}

export interface FoodItem {
  id?: number;
  childId: number; // Foreign key linking to Child
  childName?: string; // Denormalized
  timestamp: number;
  date: string; // YYYY-MM-DD
  name: string;
  category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | 'Drink';
  portionSize?: string; // e.g., "1 cup", "small bowl"
  notes?: string; // e.g., "Ate all of it", "Refused", "Liked it"
  imagePath?: string; // Path to the saved image file
  synced?: boolean; // Sync status
}

export interface Report {
  id?: number;
  childId: number; // Foreign key linking to Child
  childName?: string; // Denormalized
  reportType: ReportType;
  generatedAt: number; // Timestamp
  content: string | SmartSummaryData; // Store structured data for summary
  startDate?: string; // Optional: YYYY-MM-DD
  endDate?: string; // Optional: YYYY-MM-DD
}

export type ReportType = 'summary' | 'pattern' | 'trend' | 'recommendations';

// Specific structure for the Smart Summary report content
export interface SmartSummaryData {
  overview: string;
  keyObservations: { category: string; points: string[] }[];
  potentialTriggers: { behavior: string; potentialFactors: string[] }[];
  positiveHighlights: string[];
  recommendationHighlights: string[]; // Short highlights from recommendations
}


// Settings Interfaces
export interface SyncSettings {
  enabled: boolean;
  endpointUrl?: string;
  apiKey?: string;
  lastSyncTimestamp?: number;
}

export interface BackupSettings {
  autoBackupEnabled: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  lastBackupTimestamp?: number;
}

// Combined App Settings
export interface AppSettings {
  sync: SyncSettings;
  backup: BackupSettings;
  // Add other app-level settings here
}

// AI Model Settings
export interface AISettingsData {
  openRouterApiKey: string | null;
  openRouterModel: string | null;
  ollamaEndpoint: string | null;
  ollamaModel: string | null;
  useOllama: boolean;
  assemblyAiApiKey: string | null; // Added AssemblyAI Key
}

// Database Service Interface (Illustrative)
export interface DatabaseService {
  initialize(): Promise<Database | null>;
  // Add other methods for CRUD operations, etc.
}

// File System Service Interface (Illustrative)
export interface FileSystemService {
  initialize(): Promise<void>;
  saveFile(folder: string, fileName: string, data: Blob | File): Promise<string>;
  readFile(filePath: string): Promise<Blob | null>;
  deleteFile(filePath: string): Promise<void>;
  listFiles(folder?: string): Promise<string[]>;
  getDirectoryHandle(requestPermission?: boolean): Promise<FileSystemDirectoryHandle | null>;
  isInitialized(): boolean;
}

// Analytics Event Structure
export interface AnalyticsEvent {
  eventName: string;
  eventData: Record<string, any>;
  timestamp: number;
}

// Backup Data Structure
export interface BackupData {
  version: number; // To handle schema changes in the future
  timestamp: number;
  settings: AppSettings;
  children: Child[];
  journalEntries: JournalEntry[];
  foodItems: FoodItem[];
  reports: Report[];
  // Note: Files (images, recordings) are typically backed up separately
}

// For Ollama API response
export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
}
