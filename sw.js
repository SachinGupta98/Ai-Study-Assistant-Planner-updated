const CACHE_NAME = 'ai-study-assistant-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',

  // Core scripts
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/constants.ts',

  // Services
  '/services/authService.ts',
  '/services/geminiService.ts',

  // Components
  '/components/Auth.tsx',
  '/components/ChatMessage.tsx',
  '/components/GeneralChat.tsx',
  '/components/Header.tsx',
  '/components/History.tsx',
  '/components/Spinner.tsx',
  '/components/StudyPlanner.tsx',
  '/components/TopicSelector.tsx',
  '/components/TutorChat.tsx',

  // Icons
  '/components/icons/BookOpenIcon.tsx',
  '/components/icons/BookmarkIcon.tsx',
  '/components/icons/ChatBubbleIcon.tsx',
  '/components/icons/CheckCircleIcon.tsx',
  '/components/icons/CheckIcon.tsx',
  '/components/icons/ClipboardIcon.tsx',
  '/components/icons/CodeBracketIcon.tsx',
  '/components/icons/DownloadIcon.tsx',
  '/components/icons/GeneralChatIcon.tsx',
  '/components/icons/HistoryIcon.tsx',
  '/components/icons/LogoutIcon.tsx',
  '/components/icons/PaperclipIcon.tsx',
  '/components/icons/SendIcon.tsx',
  '/components/icons/SparklesIcon.tsx',
  '/components/icons/XCircleIcon.tsx',

  // External CDNs
  'https://cdn.tailwindcss.com',
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/@google/genai@^1.28.0',
  'https://aistudiocdn.com/react-dom@^19.2.0/client',
  'https://esm.sh/react-markdown@9?deps=react@19',
  'https://esm.sh/remark-gfm@4'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // We only want to handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Cache hit - return response
        if (cachedResponse) {
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(event.request.clone()).then(
          networkResponse => {
            // Check if we received a valid response (status 200)
            // We don't cache redirects or errors.
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
          }
        ).catch(error => {
            console.log('Fetch failed; returning offline fallback if available.', error);
            // In a real-world app, you might want to return a custom offline fallback page.
            // For now, the browser will handle the offline error.
        });
      })
    );
});


self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
