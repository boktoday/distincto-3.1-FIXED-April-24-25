// Service Worker for background sync and offline support
console.log('Service Worker (sw.js): Script loading...'); // Add this log

const CACHE_NAME = 'child-development-journal-v2'; // Increment cache version
const OFFLINE_URL = '/offline.html';
const STATIC_ASSETS = [
  '/', // Cache the root
  '/index.html', // Cache the main HTML
  OFFLINE_URL // Cache the offline fallback page
  // Add other essential static assets served from 'public' or built assets if known
  // e.g., '/manifest.json', '/icons/icon-192x192.png'
  // Avoid caching dynamic routes or API endpoints here
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log(`Service Worker: Install event - Cache Name: ${CACHE_NAME}`);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets:', STATIC_ASSETS);
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached successfully.');
        // Force the waiting service worker to become the active service worker.
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('Service Worker: Failed to cache static assets during install:', err);
      })
  );
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => {
          // Delete caches that are not the current one
          return name !== CACHE_NAME;
        }).map((name) => {
          console.log('Service Worker: Deleting old cache:', name);
          return caches.delete(name);
        })
      );
    }).then(() => {
      console.log('Service Worker: Claiming clients');
      // Take control of all open pages without requiring a reload.
      return self.clients.claim();
    }).catch(err => {
        console.error('Service Worker: Failed during activation (cache cleanup or claiming clients):', err);
    })
  );
});

// Fetch event - Cache-first strategy for static assets, Network-first or Stale-while-revalidate for others
self.addEventListener('fetch', (event) => {
  const { request } = event;
  // console.log('Service Worker: Fetch event for:', request.url); // Can be noisy

  // Skip non-GET requests and Chrome extension URLs
  if (request.method !== 'GET' || request.url.startsWith('chrome-extension://')) {
    // console.log('Service Worker: Skipping fetch for non-GET or extension request:', request.url);
    // Let the browser handle it directly
    return;
  }

  // --- Cache-First for known static assets ---
  // Check if the request URL matches any of our predefined static assets
  const isStaticAsset = STATIC_ASSETS.some(assetUrl => request.url.endsWith(assetUrl));

  if (isStaticAsset) {
    // console.log('Service Worker: Handling static asset (Cache First):', request.url);
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // console.log('Service Worker: Serving static asset from cache:', request.url);
            return cachedResponse;
          }
          // console.log('Service Worker: Static asset not in cache, fetching from network:', request.url);
          // If not in cache (should have been during install), fetch from network
          // and cache it for next time.
          return fetch(request).then(networkResponse => {
            if (networkResponse && networkResponse.ok) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          });
        })
        .catch(error => {
          console.error(`Service Worker: Error fetching static asset ${request.url}:`, error);
          // If fetching fails (e.g., offline), try returning the offline page for HTML requests
          if (request.destination === 'document') {
            return caches.match(OFFLINE_URL);
          }
          // For other static assets, just let the error happen
        })
    );
    return; // Handled as static asset
  }

  // --- Network-First for other requests (e.g., API calls, dynamic content) ---
  // console.log('Service Worker: Handling dynamic request (Network First):', request.url);
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // console.log('Service Worker: Fetched from network successfully:', request.url);
        // Optionally cache successful responses if needed (be careful with dynamic data)
        // Example: Cache API responses for offline viewing (Stale-While-Revalidate could also work)
        // if (networkResponse && networkResponse.ok && request.url.includes('/api/')) {
        //   const responseToCache = networkResponse.clone();
        //   caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
        // }
        return networkResponse;
      })
      .catch((error) => {
        console.warn(`Service Worker: Network request failed for ${request.url}. Trying cache...`, error);
        // Network failed, try to serve from cache
        return caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              // console.log('Service Worker: Serving from cache after network failure:', request.url);
              return cachedResponse;
            }
            // If not in cache and network failed, return offline page for navigation requests
            if (request.destination === 'document') {
              console.log('Service Worker: Serving offline page after network/cache failure for navigation.');
              return caches.match(OFFLINE_URL);
            }
            // For non-navigation requests, just let the failure happen
            console.error(`Service Worker: Network and cache failed for ${request.url}. No fallback available.`);
            // Return a minimal error response?
            // return new Response('Network error', { status: 408, headers: { 'Content-Type': 'text/plain' } });
            return Promise.reject(error); // Or re-throw the error
          });
      })
  );
});


// Background sync event
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Sync event received, tag:', event.tag);
  if (event.tag === 'sync-data') {
    console.log('Service Worker: Handling "sync-data" tag.');
    event.waitUntil(syncData());
  } else {
    console.log('Service Worker: Ignoring unknown sync tag:', event.tag);
  }
});

// Function to sync data by notifying the client
async function syncData() {
  console.log('Service Worker: syncData function executing.');

  // Post a message to the client(s) to trigger the actual sync logic in the app
  try {
    // Match all window clients (open tabs/windows of the app)
    const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
    console.log(`Service Worker: Found ${clients.length} client(s).`);
    if (clients && clients.length) {
      // Send message to the first available client.
      // If multiple tabs are open, you might need more sophisticated logic
      // to ensure only one performs the sync, or that they coordinate.
      console.log('Service Worker: Posting SYNC_TRIGGERED message to client:', clients[0].id);
      clients[0].postMessage({ type: 'SYNC_TRIGGERED' });
      console.log('Service Worker: SYNC_TRIGGERED message posted.');
    } else {
      console.warn('Service Worker: No clients found to post SYNC_TRIGGERED message. Sync will likely occur when app is next opened.');
      // If no clients are open, the sync event might still complete,
      // but the actual data sync (which relies on the client-side dbService)
      // won't happen until the app is opened again and handles the pending state.
    }
  } catch (error) {
    console.error('Service Worker: Error posting message to clients:', error);
    // If posting fails, the sync might need to be retried later.
    // The browser might automatically retry the sync event later.
  }
}

// Listen for messages from the client (optional, but can be useful)
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received from client:', event.data);
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: Received SKIP_WAITING message, calling self.skipWaiting().');
    self.skipWaiting();
  }
  // Example: Handle a message to trigger sync immediately
  // if (event.data && event.data.type === 'TRIGGER_SYNC_NOW') {
  //   console.log('Service Worker: Received TRIGGER_SYNC_NOW message.');
  //   syncData(); // Be cautious with this, sync event is generally preferred
  // }
});

console.log('Service Worker (sw.js): Script loaded and listeners attached.');
