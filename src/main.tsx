import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router } from 'react-router-dom'; // Removed Routes, Route as App handles routing
import App from './App.tsx'
import './index.css'
import dbService from './services/db';
import aiService from './services/aiService'; // aiService instance is created here
import syncService from './services/sync';
import fileSystemService from './services/fileSystem'; // Import fileSystemService

// Initialize services early
// aiService initialization happens in its constructor upon import.
Promise.all([
  dbService.initialize(),
  fileSystemService.initialize(), // Initialize file system service
  // aiService.initialize() // Removed: Initialization logic is in the constructor
]).then(() => {
  console.log('DB and FileSystem Services initialized.');
  // Load mock data if needed AFTER DB is initialized
  // dbService handles the check internally now
  return dbService.loadMockDataIfNeeded();
}).then(() => {
   console.log('Mock data check/load complete.');
   // Any further steps after mock data load can go here
}).catch(error => {
  console.error("Initialization or mock data load failed:", error);
  // Handle critical initialization failure (e.g., show error message)
});

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Ensure the path is correct relative to the origin
    navigator.serviceWorker.register('/sw.js') // Path should be correct if sw.js is in public/
      .then(registration => {
        console.log('Service Worker registered successfully with scope:', registration.scope);

        // Optional: Listen for messages from the SW
        navigator.serviceWorker.addEventListener('message', event => {
          if (event.data && event.data.type === 'SYNC_TRIGGERED') {
            console.log('Client received SYNC_TRIGGERED message from SW. Triggering sync...');
            syncService.syncData().catch(err => {
              console.error("Error performing sync triggered by SW message:", err);
            });
          }
        });

      }).catch(error => {
        // Log the specific error for SW registration failure
        console.error('Service Worker registration failed:', error);
      });
  });

  // Optional: Handle controller change
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('Service Worker controller changed. New worker has taken control.');
    // Optionally reload the page or notify the user
  });
} else {
  console.warn('Service Worker not supported in this browser.');
}


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>,
)
