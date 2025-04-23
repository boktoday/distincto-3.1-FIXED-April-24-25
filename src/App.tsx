import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import JournalForm from './components/JournalForm';
import JournalList from './components/JournalList';
import Reports from './components/Reports';
import FoodJourney from './components/FoodJourney';
import AISettings from './components/AISettings';
import BackupRestore from './components/BackupRestore';
import SyncStatus from './components/SyncStatus';
import ChildListPage from './components/ChildListPage'; // Import Child List Page
import ChildForm from './components/ChildForm'; // Import Child Form
import dbService from './services/db';
import syncService from './services/sync';
import { loadMockData } from './mockData';

const App: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncPending, setSyncPending] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleOnlineStatusChange = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    // Initialize database and load mock data
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        // Ensure DB is initialized with the latest version (now 3)
        await dbService.initialize();
        // Load mock data only if DB is empty (checks children now too)
        await dbService.loadMockDataIfNeeded();
        const pendingEntries = await dbService.getPendingSyncEntries();
        setSyncPending(pendingEntries.length > 0);
      } catch (error) {
        console.error('Error initializing app:', error);
        // Handle initialization error (e.g., show error message)
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, []);

  const handleSync = async () => {
    if (isOnline) {
      try {
        await syncService.syncData();
        const pendingEntries = await dbService.getPendingSyncEntries();
        setSyncPending(pendingEntries.length > 0);
      } catch (error) {
        console.error('Error during sync:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-raspberry"></div>
        <p className="mt-4 text-gray-600">Loading your journal data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        onOpenAISettings={() => setShowAISettings(true)}
        onOpenSettings={() => setShowSettings(true)}
      />
      {/* Add top padding to main content area to account for fixed navbar */}
      <main className="flex-grow container mx-auto px-4 py-6 pt-20"> {/* Adjusted pt-20 */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/journal/new" element={<JournalForm />} />
          <Route path="/journal/edit/:id" element={<JournalForm />} />
          <Route path="/journal/list" element={<JournalList />} />
          <Route path="/journal" element={<JournalList />} /> {/* Added alias */}
          <Route path="/reports" element={<Reports />} />
          <Route path="/food" element={<FoodJourney />} />
          {/* Child Bio Routes */}
          <Route path="/children" element={<ChildListPage />} />
          <Route path="/children/new" element={<ChildForm />} />
          <Route path="/children/edit/:id" element={<ChildForm />} />
        </Routes>
      </main>
      <footer className="bg-gray-900 text-white py-4">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm">© 2023 Child Development Journal</p>
            </div>
            <div className="flex items-center space-x-4">
              <SyncStatus isOnline={isOnline} syncPending={syncPending} onSync={handleSync} />
            </div>
          </div>
        </div>
      </footer>

      {showAISettings && <AISettings onClose={() => setShowAISettings(false)} />}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 space-y-6">
              {/* AI Settings Section */}
              <div className="border-b border-gray-200 pb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">AI Assistant Settings</h4>
                <button
                  onClick={() => {
                    setShowSettings(false);
                    setShowAISettings(true);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Configure AI Settings
                </button>
              </div>

              {/* Backup & Restore Section */}
              <div>
                <BackupRestore />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
