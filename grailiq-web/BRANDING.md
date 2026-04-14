# GrailIQ Brand Guide

## Brand Identity

- **Name:** GrailIQ
- **Tagline:** "Know what your grails are worth."
- **Product:** Pokemon TCG sealed product price intelligence platform
- **Domain:** grailiq.com

## Logo

The logo is text-based (wordmark). "Grail" appears in white (or dark on light backgrounds) and "IQ" appears in the brand purple accent color. No icon/symbol logo has been created yet — only the wordmark.

### Usage
```
Grail<span class="text-grailiq-purple">IQ</span>
```
- On dark backgrounds: "Grail" in `#FFFFFF`, "IQ" in `#7F77DD`
- On light backgrounds: "Grail" in `#1A1A2E`, "IQ" in `#7F77DD`

## Color Palette

### Primary Colors

| Name               | Hex       | Tailwind Token          | Usage                              |
|--------------------|-----------|-------------------------|------------------------------------|
| Dark Background    | `#1A1A2E` | `grailiq-dark`          | Main background, dark surfaces     |
| Dark Lighter       | `#242444` | `grailiq-dark-lighter`  | Elevated surfaces, cards on dark   |
| Purple (Primary)   | `#7F77DD` | `grailiq-purple`        | Accent, buttons, links, CTA        |
| Purple Light       | `#9B94E8` | `grailiq-purple-light`  | Hover states, active nav items     |
| Purple Dark        | `#6B63C4` | `grailiq-purple-dark`   | Pressed states, darker accents     |

### Secondary Colors

| Name               | Hex       | Tailwind Token          | Usage                              |
|--------------------|-----------|-------------------------|------------------------------------|
| Light Purple BG    | `#EEEDFE` | `grailiq-light`         | Light mode backgrounds, badges     |
| Surface            | `#F8F8FF` | `grailiq-surface`       | Light mode card backgrounds        |
| Green (Buy/Up)     | `#22C55E` | `grailiq-green`         | Buy signals, positive changes      |
| Red (Sell/Down)    | `#EF4444` | `grailiq-red`           | Sell signals, negative changes     |
| Amber (Hold/Warn)  | `#F59E0B` | `grailiq-amber`         | Hold signals, warnings             |

### Neutral Colors (used via Tailwind defaults)

- White: `#FFFFFF` — text on dark backgrounds
- Gray-400: `#9CA3AF` — secondary text on dark
- Gray-500: `#6B7280` — muted text
- Gray-600: `#4B5563` — footer text

## Typography

- **Font Family:** Inter (Google Fonts) + system fallbacks
- **Weights:** 400 (body), 500 (medium), 600 (semibold), 700 (bold), 800 (extrabold for hero headings)
- **Sizes:** Tailwind defaults (text-xs through text-7xl)

### Hierarchy
- Hero H1: `text-4xl md:text-6xl lg:text-7xl font-extrabold`
- Section H2: `text-3xl md:text-4xl font-bold`
- Card H3: `text-lg font-semibold`
- Body: `text-sm` or `text-base`, `leading-relaxed`
- Labels: `text-xs font-bold uppercase tracking-widest`

## Design Tokens (Tailwind)

All custom colors are defined in `tailwind.config.js` under `theme.extend.colors`:

```js
grailiq: {
  dark: '#1A1A2E',
  'dark-lighter': '#242444',
  purple: '#7F77DD',
  'purple-light': '#9B94E8',
  'purple-dark': '#6B63C4',
  light: '#EEEDFE',
  surface: '#F8F8FF',
  green: '#22C55E',
  red: '#EF4444',
  amber: '#F59E0B',
}
```

## UI Patterns

- **Buttons:** Rounded-xl, purple bg with purple shadow glow on primary actions
- **Cards:** `border border-white/10 bg-white/[0.03]` on dark backgrounds
- **Hover effects:** `hover:border-grailiq-purple/40 hover:bg-white/[0.06]`
- **Focus rings:** `focus:ring-grailiq-purple`
- **Glassmorphism nav:** `bg-grailiq-dark/80 backdrop-blur-xl`
- **Gradient glow effects:** Large blurred purple circles as ambient background elements
- **Icon library:** Lucide React (consistent line icons)

## Landing Page Sections

1. **Nav** — Fixed, blur backdrop, logo + Sign In + Get Started CTA
2. **Hero** — Purple gradient glow, badge, headline, subheadline, dual CTAs, stat counters
3. **Features** — 6 feature cards in 3-column grid
4. **How It Works** — 3-step process (Track, Analyze, Invest)
5. **Pricing** — Free vs Pro tiers
6. **Final CTA** — Conversion-focused with purple glow
7. **Footer** — Logo, links, copyright

## Files Reference

- Landing page: `src/pages/Landing.tsx`
- Sign-in page: `src/pages/SignIn.tsx`
- App layout: `src/components/layout/AppLayout.tsx`
- Tailwind config: `tailwind.config.js`
- This file: `BRANDING.md`

## Future Branding Needs

- [ ] Icon/symbol logo (for favicons, app icon, social)
- [ ] Open Graph image for social sharing
- [ ] Email templates with brand styling
- [ ] Custom illustrations for feature sections
- [ ] Dark mode for the sign-in card (currently light card on dark bg)
