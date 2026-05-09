importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.11.0/firebase-messaging-compat.js');

// Configuration Firebase (Valeurs réelles du projet)
const firebaseConfig = {
  apiKey: "AIzaSyCKITVldKjMdPY4PvJWORy-79TAxVeJagg",
  authDomain: "gen-lang-client-0241237641.firebaseapp.com",
  projectId: "gen-lang-client-0241237641",
  storageBucket: "gen-lang-client-0241237641.firebasestorage.app",
  messagingSenderId: "914168217742",
  appId: "1:914168217742:web:d0f775dcbbdba4b9ac09df"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'DJ Messenger';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.message || 'Vous avez reçu un nouveau message.',
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: payload.data,
    tag: `group-${payload.data?.groupId || 'default'}`, // Groupement par discussion
    renotify: true,
    vibrate: [200, 100, 200]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const urlToOpen = new URL('/', self.location.origin).href;
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    let matchingClient = null;
    for (let i = 0; i < windowClients.length; i++) {
      const windowClient = windowClients[i];
      if (windowClient.url === urlToOpen) {
        matchingClient = windowClient;
        break;
      }
    }
    
    if (matchingClient) {
      if (event.notification.data?.groupId) {
        matchingClient.postMessage({
          type: 'NAVIGATE_TO_GROUP',
          groupId: event.notification.data.groupId
        });
      }
      return matchingClient.focus();
    } else {
      return clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});
