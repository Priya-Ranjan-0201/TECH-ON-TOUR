# 🎨 TravelSathi — Master UI/UX Design System Specification
### *Theme 1: "Heritage Earth" — Visual Brand Guidelines, Tokens & Component Specifications*

**Version:** 2.0.0 (Master Design System)  
**Target Event:** Smart India Hackathon (SIH) — National Grand Finale  
**Status:** Active & Enforced  

---

## 1. Master Palette Tokens (`frontend/src/styles/theme.css` & `tailwind.config.js`)

TravelSathi V2.0 utilizes a light, crisp, and uplifting palette anchored in Fresh Emerald, Pure White Canvas, and Warm Coral Terracotta (avoiding heavy, deep, or muddy dark colors):

```css
/* Core V2.0 Light Theme Tokens */
:root {
  /* 🌲 PRIMARY: Fresh Emerald / Travel Leaf */
  --color-primary: #257A57;
  --color-primary-dark: #19523B;
  --color-primary-light: #F0F9F5;

  /* 🌿 SECONDARY: Balanced Natural Green */
  --color-secondary: #318A66;
  --color-success: #43A67D;

  /* 🏺 ACCENT: Warm Coral Terracotta & Sunlight Amber */
  --color-accent: #D96238;
  --color-saffron: #F59E0B;

  /* 🏜️ NEUTRALS: Crisp Light Canvas & Pure White */
  --color-bg-canvas: #F8FAFC;
  --color-surface-white: #FFFFFF;
  --color-text-slate: #1E293B;
  --color-text-muted: #64748B;
  --color-border-light: #E2E8F0;

  /* 🚨 STATUS & ALERTS */
  --color-danger: #C53030;
  --color-warning: #D97706;
  --color-map-teal: #0D9488;
}
```


---

## 2. Accessibility & High-Contrast Standards (WCAG 2.1 AA)
*   **Zero Invisible Text Rule:** Never apply dark text on dark backgrounds or pale text on light cards. 
*   **Card Contrast Classes:** Always use `ts-card-light` (guarantees `#FFFFFF` card surface with `#111827` primary text) or dark mode equivalent.
*   **Hero Section Rule:** In the hero section, the heading must use crisp, high-contrast white text (`#FFFFFF`) with subtle text-shadow against dark overlays, while the body paragraph uses `#F3F4F6` (95%+ contrast ratio).
*   **Family Pairing Rule:** Text on colored background must use darkest shade (`900`/`800`) from that family. Never low-contrast mid-tones.
*   **Badge & Pill Pairing:** Always pair `-50` background with `-800`/`-900` text (e.g., Verified: `--ts-secondary-50` + `--ts-secondary-800`).
*   **Form Inputs:** Explicit `bg-white dark:bg-darkmode-elevated`, `text-neutral-900 dark:text-darkmode-text-primary`, and `border-neutral-300 dark:border-darkmode-border`.

---

## 3. Typography & Spacing
*   **Display Headers:** `Outfit` / `Plus Jakarta Sans` (`500` Medium).
*   **Body Text:** `Inter` / System Sans-Serif (`400` Regular).
*   **Vernacular Glyphs:** `Noto Sans` (Hindi, Bengali, Tamil, Telugu).
*   **Scale:** H1 (`24px`/`32px`), H2 (`18px`/`24px`), H3 (`16px`/`22px`), Body (`16px`/`26px`), Caption (`12px`/`16px`).
*   **8px Spacing Grid:** All paddings, margins, and gaps follow multiples of 8px (`8px`, `16px`, `24px`, `32px`, `48px`).
*   **Card Geometry:** `12px` corner radius, `0.5px` or `1px` hairline solid border (`--ts-neutral-200`).

---

## 4. Component Patterns
*   **Itinerary Timeline:** `2px` vertical connector line with semantic dots: Green (Nature POI), Terracotta (Heritage/Dining), Temple Gold (Hidden Gem).
*   **Shimmer Skeletons:** 1.5s infinite linear gradient pulse.
*   **Empty States:** Localized vector artwork with warm encouraging message and primary Terracotta CTA.
*   **Image Fallbacks:** Solid-fill placeholder div (`--ts-primary-100`) with authentic outline icon—never a broken image icon.

---
*UI/UX Design System finalized for Smart India Hackathon Grand Finale execution.*
