# Stitch UX Conversion Checklist

**Use this checklist whenever converting Stitch designs to React or making UX changes from Stitch source.**

Reference: `ux_reference/stitch_capysan_landing_page/` (restored from git if missing)

---

## 1. Copy Faithfully — No Changes

- Copy Stitch HTML structure and classes **exactly**. Do not "improve" or "fix."
- If Stitch uses `<link>` in `<head>`, use `<link>` in layout — do not convert to CSS `@import`.
- If Stitch uses a `<div>`, consider whether React needs `<form>` for behavior; keep classes identical.

---

## 2. Font Loading

- **Material Symbols:** Stitch uses `<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>` in `<head>`.
- Put this in `layout.tsx` `<head>`, not in `globals.css` `@import`. CSS `@import` can load late and icons render as text.
- Stitch's `.material-symbols-outlined` is minimal: only `font-variation-settings`. Google's font CSS provides `font-family`; don't override unless needed.

---

## 3. Tailwind v4 — No Global Resets That Override Utilities

- **Tailwind v4 uses CSS cascade layers.** Unlayered `* { margin: 0; padding: 0 }` overrides layered utilities like `mx-auto`, breaking centering.
- **Do not add** `* { margin: 0; padding: 0 }` or similar universal resets. Tailwind Preflight already resets what's needed.
- If you need a reset, scope it to `html, body` only, or use `@layer base` so it doesn't override utilities.

---

## 4. Stitch vs Our Stack

| Stitch | Our app |
|--------|---------|
| Tailwind CDN (v3) | Tailwind v4 + `@theme` in globals.css |
| No custom `*` reset | Avoid `*` reset — use html/body only |
| `<link>` for fonts | `<link>` in layout.tsx |
| Plain HTML | React + Next.js App Router |

---

## 5. Before Shipping

- [ ] Compare classes byte-for-byte with Stitch source
- [ ] Verify fonts load (icons render, not icon names as text)
- [ ] Verify centering (`mx-auto`, `text-center`) works
- [ ] Open Stitch HTML in browser; compare side-by-side with app

---

## Lessons Learned (Mar 2025)

1. **Material Symbols as text:** Font loaded via `@import` instead of `<link>` → icons showed as `auto_awesome`, `link`, etc.
2. **Centering broken:** `* { margin: 0; padding: 0 }` overrode `mx-auto` due to Tailwind v4 cascade layers.
3. **"Improvements" broke layout:** Adding `flex items-center`, `min-w-0`, `w-full` deviated from Stitch; reverting to exact source fixed it.
