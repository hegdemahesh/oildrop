# PWA Enablement for OilDrop Web

This document explains the Progressive Web App setup added to the `web/` project (Vite + React + TypeScript).

## What Was Added
1. `vite-plugin-pwa` dependency and configuration in `vite.config.ts` with:
   - `registerType: autoUpdate` (service worker updates fetched automatically)
   - Base manifest (name, short_name, theme/background colors, icons placeholders)
   - Basic Workbox runtime caching strategies (images cache-first, scripts/styles stale-while-revalidate)
   - `devOptions.enabled = true` so you can test SW in `vite dev` (only for local; you can disable later)
2. `index.html` updated with manifest & Apple meta tags for installability on iOS.
3. `src/pwa-env.d.ts` for TypeScript type support of the virtual PWA modules.
4. `src/main.tsx` now registers the service worker and shows toast notifications when a new version is available.
5. Placeholder note file `public-notes.txt` describing required icon assets.

## Required Icon Assets
Add PNG icon files (square, no transparency issues, optimized):
```
web/
  pwa-192x192.png
  pwa-512x512.png
  pwa-512x512-maskable.png  (same 512 size but with safe padding for maskable)
```
You can generate these from a large source SVG/PNG using a tool like https://realfavicongenerator.net/ or PWABuilder.

## Development
Run the dev server (service worker enabled due to `devOptions.enabled=true`):
```
cd web
npm install   # if not already done after adding dependency
npm run dev
```
Open http://localhost:5173 and check Application > Manifest + Service Workers in DevTools.

## Building & Deploying
```
cd web
npm run build
firebase deploy --only hosting
```
Firebase Hosting will serve the `dist` folder. The plugin auto-injects the service worker and manifest into the build.

## Update Flow
- A new deploy produces a new service worker.
- The client fetches it; when detected, `onNeedRefresh` triggers a toast: "New version available – refresh to update".
- Currently we only inform the user. (Optional Enhancement below to auto-refresh.)

## Optional Enhancements
1. Prompt with an inline button to reload immediately (call the function returned from `registerSW()` with `true`).
2. Add offline fallback HTML route: in `VitePWA({ workbox: { navigateFallback: '/index.html' } })` (already implicitly handled by SPA hosting rewrite).
3. Cache Firestore REST calls: (Not recommended—Firestore SDK handles persistence; rely on its offline cache instead.)
4. Add pre-caching of key routes/components by listing them in `VitePWA({ includeAssets: [...] })` or using `globPatterns`.
5. Add custom analytics for install prompt events (listen for `beforeinstallprompt`).

## Testing Installability
Chrome DevTools Lighthouse > PWA audit should pass (icon files must exist). Criteria:
- Valid manifest with name, short_name, icons, start_url, display
- Served over HTTPS (Firebase Hosting OK)
- Service worker controlling the page
- 200 responses for start URL

## iOS Notes
- iOS ignores `maskable` icons currently; ensure `apple-touch-icon` tag (already added) references at least a 180x180 PNG (you can reuse 192x192 but recommended to provide a specific one if you want). Add multiple sizes if desired.

## Removing SW in Dev (Optional)
If SW debugging causes confusion, disable by setting in `vite.config.ts`:
```
VitePWA({
  devOptions: { enabled: false }
})
```

## Auto-Reload Example (If desired)
You could modify `onNeedRefresh` to:
```
const updateSW = registerSW({
  onNeedRefresh() {
    push({ type: 'info', message: 'Updating...', timeout: 2000 });
    updateSW(true); // immediately activate & reload
  }
});
```
Note: Keep reference to the function returned by `registerSW`.

## Source References
- Plugin docs: https://vite-pwa-org.netlify.app/
- Workbox strategies: https://developer.chrome.com/docs/workbox/modules/workbox-strategies

## Future Hardening
- Add `version` meta (e.g., from package.json) so users can report which build they run.
- Add background sync for queued sales if offline (use Workbox background sync + custom endpoint) – requires converting actions to REST/Callable + queue logic.
- Provide an explicit offline page for first-load offline scenario (edge case if never cached).

---
PWA setup complete; add icons to finalize installability.
