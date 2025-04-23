import React, { useState, useEffect } from 'react';
import syncService from '../services/sync';
import { SyncStatus as SyncStatusType } from '../types';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

const SyncStatus: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatusType>({
    lastSync: 0,
    pendingSync: 0,
    isOnline: navigator.onLine
  });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    // Update sync status initially
    updateSyncStatus();
    
    // Set up interval to update sync status
    const interval = setInterval(updateSyncStatus, 30000);
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, []);

  const updateSyncStatus = () => {
    const status = syncService.getSyncStatus();
    setSyncStatus(status);
  };

  const handleManualSync = async () => {
    if (syncing) return;
    
    setSyncing(true);
    try {
      await syncService.syncData();
      updateSyncStatus();
    } catch (error) {
      console.error('Error syncing data:', error);
    } finally {
      setSyncing(false);
    }
  };

  const formatLastSync = () => {
    if (syncStatus.lastSync === 0) {
      return 'Never';
    }
    
    const date = new Date(syncStatus.lastSync);
    return date.toLocaleString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-3 flex items-center justify-between">
      <div className="flex items-center">
        {syncStatus.isOnline ? (
          <Wifi size={18} className="text-green-500 mr-2" />
        ) : (
          <WifiOff size={18} className="text-red-500 mr-2" />
        )}
        <div>
          <span className="text-sm font-medium text-gray-700">
            {syncStatus.isOnline ? 'Online' : 'Offline'}
          </span>
          <span className="text-xs text-gray-500 ml-2">
            Last sync: {formatLastSync()}
          </span>
        </div>
      </div>
      
      <button
        onClick={handleManualSync}
        disabled={syncing || !syncStatus.isOnline}
        className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        <RefreshCw size={14} className={`mr-1 ${syncing ? 'animate-spin' : ''}`} />
        {syncing ? 'Syncing...' : 'Sync Now'}
      </button>
    </div>
  );
};

export default SyncStatus;
