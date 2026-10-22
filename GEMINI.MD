# Project memory

- 2026-10-21: hobby page created. Only hobby-related repos are shown; others are intentionally left out.
- 2026-10-21: page translated to English.
- 2026-10-21: redesign 'technical minimal' (Nothing / Teenage Engineering inspired): Doto dot-matrix display, Geist + Geist Mono, 1px hairline grid, single orange accent, light/dark switch (system default, saved in localStorage).
- 2026-10-23: dot-matrix boot splash ("HOBBIES." + one progress segment per hobby hue), generated in build.js. Shown once per session (sessionStorage 'splash-seen'), ~1.5s, skippable by any key/tap/scroll, never with prefers-reduced-motion or a #hash deep link. Edit the template in build.js, not index.html: the nightly Action overwrites index.html.
- 2026-10-23: UI/UX Pro Max audit: skip link, theme-color meta, inline SVG favicon, 44px toggle hit area, scroll-padding for the sticky bar, aria-hidden decorative icons, kind labels 12px, light hobby hues darkened to oklch L .48 for 4.5:1 contrast.
