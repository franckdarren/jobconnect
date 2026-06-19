import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkFirst, CacheFirst, StaleWhileRevalidate } from "serwist";

declare global {
  interface ServiceWorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // API routes — toujours réseau d'abord, fallback cache 10 s
    {
      matcher: ({ request }) =>
        request.destination === "" && request.url.includes("/api/"),
      handler: new NetworkFirst({ cacheName: "api-cache", networkTimeoutSeconds: 10 }),
    },
    // Images Supabase Storage — cache d'abord (logos / avatars / bannières)
    {
      matcher: ({ request }) =>
        request.destination === "image" &&
        request.url.includes("supabase.co"),
      handler: new CacheFirst({
        cacheName: "supabase-images",
        plugins: [],
      }),
    },
    // Polices et assets statiques — cache d'abord
    {
      matcher: ({ request }) =>
        request.destination === "font" ||
        request.destination === "script" ||
        request.destination === "style",
      handler: new CacheFirst({ cacheName: "static-assets" }),
    },
    // Pages HTML — StaleWhileRevalidate (affiche ce qui est en cache,
    // rafraîchit en arrière-plan pour la prochaine visite)
    {
      matcher: ({ request }) => request.destination === "document",
      handler: new StaleWhileRevalidate({ cacheName: "pages" }),
    },
  ],
});

serwist.addEventListeners();
