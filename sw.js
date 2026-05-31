const CACHE_NAME = 'peemap-v1';
const ASSETS = [
  '/peemap/',
  '/peemap/index.html'
];

// Install - cache assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Push notifications
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || 'PeeMap';
  const options = {
    body: data.body || 'Hai un nuovo messaggio da PeeMap',
    icon: '/peemap/icons/icon-192.png',
    badge: '/peemap/icons/icon-192.png',
    vibrate: [200, 100, 200],
    data: data.url || '/peemap/',
    actions: [
      { action: 'open', title: 'Apri PeeMap' },
      { action: 'close', title: 'Chiudi' }
    ]
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// Notification click
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'close') return;
  e.waitUntil(
    clients.openWindow(e.notification.data || '/peemap/')
  );
});

// Background sync per reminder recensioni
self.addEventListener('sync', e => {
  if (e.tag === 'recensione-reminder') {
    e.waitUntil(inviaReminderRecensione());
  }
});

async function inviaReminderRecensione() {
  const msgs = [
    'Hai visitato un bagno di recente 🚻 Com\'era? La tua recensione aiuta tutti!',
    'Ricordi quel bagno? Lascia una recensione, ci vuole solo un minuto 😄',
    'La community PeeMap ha bisogno di te! Recensisci il bagno che hai visitato 🙏'
  ];
  const msg = msgs[Math.floor(Math.random() * msgs.length)];
  return self.registration.showNotification('PeeMap', {
    body: msg,
    icon: '/peemap/icons/icon-192.png',
    badge: '/peemap/icons/icon-192.png',
  });
}
