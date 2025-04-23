import React, { useState, useEffect } from 'react';
import { Download, Upload, AlertCircle, Loader2 } from 'lucide-react';
import backupService from '../services/backupService';

const BackupRestore: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasModernFilePicker, setHasModernFilePicker] = useState(false);

  useEffect(() => {
    // @ts-ignore - TypeScript might not recognize the File System Access API
    setHasModernFilePicker('showSaveFilePicker' in window);
  }, []);

  const handleExport = async () => {
    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    
    try {
      const { usedModernAPI } = await backupService.exportData();
      setSuccess(
        usedModernAPI
          ? 'Your backup file has been saved to the selected location.'
          : 'Your backup file is being downloaded. Please check your downloads folder.'
      );
    } catch (err) {
      if ((err as Error).message === 'Save cancelled') {
        setError('Backup cancelled. No file was saved.');
      } else {
        setError('Failed to export data. Please try again.');
        console.error(err);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      await backupService.importData(file);
      setSuccess('Data imported successfully! Your journal has been restored.');
    } catch (err) {
      setError('Failed to import data. Please check if this is a valid backup file.');
      console.error(err);
    } finally {
      setIsProcessing(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Backup & Restore</h2>
      
      <div className="space-y-4">
        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={isProcessing}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-raspberry hover:bg-raspberry-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-raspberry disabled:opacity-50"
        >
          {isProcessing ? (
            <Loader2 size={18} className="mr-2 animate-spin" />
          ) : (
            <Download size={18} className="mr-2" />
          )}
          {isProcessing ? 'Preparing Backup...' : hasModernFilePicker ? 'Choose Where to Save Backup' : 'Export Data'}
        </button>

        {/* Import Section */}
        <div className="relative">
          <label
            htmlFor="file-upload"
            className={`w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-raspberry ${
              isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            {isProcessing ? (
              <Loader2 size={18} className="mr-2 animate-spin" />
            ) : (
              <Upload size={18} className="mr-2" />
            )}
            {isProcessing ? 'Importing...' : 'Import Data'}
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".json"
            onChange={handleImport}
            disabled={isProcessing}
            className="sr-only"
          />
        </div>

        {/* Status Messages */}
        {error && (
          <div className="flex items-center text-red-600 text-sm mt-2 bg-red-50 p-3 rounded-md">
            <AlertCircle size={16} className="mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center text-green-600 text-sm mt-2 bg-green-50 p-3 rounded-md">
            <AlertCircle size={16} className="mr-2 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Help Text */}
        <div className="text-sm text-gray-500 mt-4 space-y-2">
          <p>
            <strong>Export:</strong> Creates a backup file containing all your journal entries, food items, reports, and images.
            {hasModernFilePicker 
              ? ' You\'ll be asked where to save the backup file.'
              : ' The file will be saved to your default downloads folder.'}
          </p>
          <p>
            <strong>Import:</strong> Restores your data from a previously created backup file.
            Select a backup file (ending in .json) to restore your journal.
          </p>
          <p className="text-amber-600">
            Note: Importing a backup will replace all current data. Make sure to export your current data first if you want to keep it.
          </p>
        </div>
      </div>
    </div>
  );
}

export default BackupRestore;
