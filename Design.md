# 🎨 TravelSathi — Master UI/UX Design System Specification
### *Theme 1: "Heritage Earth" — Visual Brand Guidelines, Tokens & Component Specifications*

**Version:** 2.0.0 (Master Design System)  
**Target Event:** Smart India Hackathon (SIH) — National Grand Finale  
**Status:** Active & Enforced  

---

## 1. CSS Custom Properties Token Ramp (`frontend/src/styles/theme.css`)

```css
:root {
  /* 🏺 PRIMARY FAMILY: Terracotta & Ochre (Brand Core, Headers & CTAs) */
  --ts-primary-900: #4A1B0C;   /* Deepest Terracotta - Headings & High-contrast text */
  --ts-primary-800: #712B13;   /* Primary Brand - Header bars, primary action buttons */
  --ts-primary-600: #993C1D;   /* Mid Terracotta - Secondary buttons, interactive accents */
  --ts-primary-400: #D85A30;   /* Light Terracotta - Active highlights, borders */
  --ts-primary-100: #F5C4B3;   /* Pale Terracotta - Subtle card fills, hover states */
  --ts-primary-50:  #FAECE7;   /* Palest Terracotta - Tag backgrounds, button text on dark */

  /* 🌿 SECONDARY FAMILY: Forest Canopy & Temple Green (Verified & Eco Badges) */
  --ts-secondary-900: #173404; /* Dark Forest - Success text, verified badges */
  --ts-secondary-800: #27500A; /* Verified Checkmarks, Hidden-Gem tags, Eco-permits */
  --ts-secondary-600: #3B6D11; /* Forest Mid - Secondary success indicators */
  --ts-secondary-400: #639922; /* Leaf Green - Progress indicators, ratings */
  --ts-secondary-50:  #EAF3DE; /* Pale Green - Success badges, hidden-gem card fills */

  /* 🛕 ACCENT FAMILY: Saffron & Sacred Gold (Pricing Tips & Cultural Highlights) */
  --ts-accent-900: #412402;    /* Dark Amber - Pricing recommendation text */
  --ts-accent-800: #633806;    /* Warm Amber - Dynamic pricing co-pilot alerts */
  --ts-accent-600: #854F0B;    /* Saffron Gold - Star ratings, cultural highlight icons */
  --ts-accent-400: #E5A93C;    /* Temple Gold - Explorer badges, featured borders */
  --ts-accent-50:  #FAEEDA;    /* Pale Amber - Pricing tip & festival alert backgrounds */

  /* 🚨 ALERT FAMILY: Varanasi Vermillion (Emergency SOS & Validation Errors) */
  --ts-alert-red-800: #B71C1C; /* Dark Red - Error text, emergency SOS triggers */
  --ts-alert-red-600: #D32F2F; /* Vermillion Red - Input validation error borders */
  --ts-alert-red-50:  #FFEBEE; /* Pale Red - Error banner backgrounds */

  /* 🏛️ NEUTRAL FAMILY: Sandalwood & Charcoal Slate (Backgrounds & Structural) */
  --ts-neutral-900: #2C2C2A;   /* Charcoal Slate - Primary body text (100% contrast) */
  --ts-neutral-600: #5F5E5A;   /* Sandalwood Gray - Secondary metadata, subtitles */
  --ts-neutral-400: #888780;   /* Muted Gray - Placeholders, disabled states */
  --ts-neutral-200: #E0E0E0;   /* Border Ash - Hairline dividers, card outlines */
  --ts-neutral-100: #F5F7FA;   /* Pristine Canvas - Main screen background */
  --ts-neutral-50:  #FDFBF7;   /* Warm Ivory - Card surfaces, modal backgrounds */

  /* 🪟 GLASSMORPHIC TOKENS */
  --ts-glass-surface: rgba(253, 251, 247, 0.88);
  --ts-glass-border: rgba(113, 43, 19, 0.12);
  --ts-glass-blur: blur(12px);
}
```

---

## 2. Semantic Color Rules
*   **Family Pairing Rule:** Text on colored background must use darkest shade (`900`/`800`) from that family. Never pure black.
*   **Badge & Pill Pairing:** Always pair `-50` background with `-800`/`-900` text (e.g., Verified: `--ts-secondary-50` + `--ts-secondary-800`).
*   **Primary Action Buttons:** `--ts-primary-800` background, `--ts-primary-50` text.

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
