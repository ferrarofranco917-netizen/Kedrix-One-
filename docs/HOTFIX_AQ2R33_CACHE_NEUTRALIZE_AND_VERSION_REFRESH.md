# HOTFIX AQ2R33 — Cache neutralization and version refresh

This hotfix neutralizes stale Service Worker caches during the Practices audit.
It refreshes versioned asset URLs, clears old caches on install/activate, and uses network-first for HTML/JS/CSS/JSON so the browser stops serving stale AQ2R31 assets.
