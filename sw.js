// Service Worker — დემენციის მოვლა (dementia-care-georgia)
// ოფლაინ კეშირება და აპლიკაციის სწრაფი ჩატვირთვა

const CACHE_NAME = 'dementia-care-v1.0.0';

// App Shell-ის კრიტიკული რესურსები
const STATIC_ASSETS = [
  './',
  './index.html',
  './audit.html',
  './css/styles.css',
  './js/app.js',
  './js/scenarios.js',
  './js/audio-breathing.js',
  './js/pwa.js',
  './manifest.webmanifest',
  './favicon.svg',
  './favicon.png',
  './apple-touch-icon.png',
  './og-image.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png'
];

// ინსტალაცია: App Shell-ის რესურსების წინასწარი კეშირება
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // safe addAll — ერთი ფაილის შეცდომამაც რომ არ გააფუჭოს მთლიანი ინსტალაცია
      return Promise.allSettled(
        STATIC_ASSETS.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch((err) => {
            console.warn(`[SW] Pre-cache failed for ${url}:`, err);
          })
        )
      );
    })
  );
});

// აქტივაცია: ძველი კეშების წაშლა და კლიენტების მყისიერი კონტროლი
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('dementia-care-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch მოვლენების დამუშავება
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // მხოლოდ GET მოთხოვნების დამუშავება
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Chrome extensions და სხვა პროტოკოლების გამოტოვება
  if (!url.protocol.startsWith('http')) return;

  // 1. Google Fonts-ის კეშირება (fonts.googleapis.com და fonts.gstatic.com)
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com')) {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkResponse;
        }).catch(() => cachedResponse);
      })
    );
    return;
  }

  // 2. გვერდების ნავიგაცია (HTML) — Network First (სწრაფი ტაიმაუტით) + Offline Fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      new Promise((resolve) => {
        let didTimeOut = false;
        const timeoutId = setTimeout(() => {
          didTimeOut = true;
          caches.match(req).then((cached) => {
            if (cached) resolve(cached);
          });
        }, 1500);

        fetch(req)
          .then((networkResponse) => {
            clearTimeout(timeoutId);
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
            }
            if (!didTimeOut) resolve(networkResponse);
          })
          .catch(async () => {
            clearTimeout(timeoutId);
            const cached = await caches.match(req);
            if (cached) return resolve(cached);

            // თუ კონკრეტული URL არ მოიძებნა, fallback მთავარ გვერდზე
            const fallback = await caches.match('./index.html') || await caches.match('/');
            if (fallback) return resolve(fallback);

            resolve(new Response('ოფლაინ რეჟიმი: რესურსი მიუწვდომელია', {
              status: 503,
              statusText: 'Service Unavailable (Offline)',
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            }));
          });
      })
    );
    return;
  }

  // 3. სტატიკური ლოკალური რესურსები (CSS, JS, სურათები) — Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const fetchPromise = fetch(req).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return networkResponse;
      }).catch((err) => {
        // ოფლაინში შეცდომა მოსალოდნელია, თუ კეშში გვაქვს - არაუშავს
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});

// კლიენტიდან მიღებული შეტყობინებები (Skip Waiting)
self.addEventListener('message', (event) => {
  if (event.data && (event.data.type === 'SKIP_WAITING' || event.data.action === 'skipWaiting')) {
    self.skipWaiting();
  }
});
