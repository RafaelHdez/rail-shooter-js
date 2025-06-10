const CACHE_NAME = "space-shooter-cache-v1";
const urlsToCache = [
    "./",
    "./index.html",
    "./js/main.js",
    "./js/player.js",
    "./js/laser.js",
    "./js/enemy.js",
    "./js/explosion.js",
    "./css/style.css",
    "./Audios/laser.WAV",
    "./Audios/explosion.wav",
    "./Audios/damage.wav",
    "./Audios/music.mp3",
    "./icons/icon.jpeg",
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener("activate", event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames =>
            Promise.all(
                cacheNames.map(name => {
                    if (!cacheWhitelist.includes(name)) {
                        return caches.delete(name);
                    }
                })
            )
        )
    );
});
