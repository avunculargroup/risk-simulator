# Design Brief — BTC Treasury Risk Simulator

**Company:** Bitcoin Treasury Solutions (BTS)  
**Product:** BTC Treasury Risk Simulator  
**Version:** 1.0

-----

## Brand Essence

The BTC Treasury Risk Simulator is a professional-grade simulation platform for corporate risk analysts managing bitcoin treasury exposure. The design must communicate that this is a **serious analytical tool** built for financial professionals — not a crypto trading app, not a blockchain explorer, and not a startup dashboard.

The platform sits at the intersection of **quantitative finance** and **modern software**. Think: the precision of a Bloomberg terminal, stripped of its visual debt, and rebuilt with the polish of Stripe or Linear. The user is a risk analyst who stares at this tool for hours — it must be dense with information but never overwhelming.

-----

## Personality

**Primary traits:** Precise, Trustworthy  
**Secondary traits:** Calm under pressure, Technically authoritative, Quietly confident

The tone is like a senior quant who presents risk findings to the board — technically rigorous, visually clear, and never alarmist even when the numbers are alarming. The interface itself should feel stable and measured, a counterbalance to the volatility of what it models.

**What it should feel like:**

- Opening a well-designed risk report from a tier-1 investment bank
- A tool where every number has earned its place on the screen
- Warm enough to feel human, precise enough to feel engineered

**What it should never feel like:**

- Crypto-native or DeFi aesthetic (no neon, no glow effects, no token badges)
- Generic SaaS dashboard (no purple gradients, no card-soup layouts)
- Overly playful or casual (no emojis, no animated mascots, no gamification)
- Cold, clinical, or intimidating (no pure white backgrounds, no stark contrasts)

-----

## Logo Usage

The BTS logo is a Bitcoin symbol rendered as a gold-gradient mark within a circular ring. It uses a diagonal linear gradient from `#C8A659` (top-right) to `#916024` (bottom-left), with a `#EDD5A5` fine stroke for definition.

### Placement Rules

- **Navigation bar:** Logo mark at 28–32px height, placed at the far left of the top bar. On desktop, accompanied by the wordmark “BTC Treasury Risk” in Playfair Display (weight 600) with “Simulator” in DM Sans (weight 400) at a slightly smaller size. On mobile, logo mark only — no wordmark.
- **Favicon:** Use the logo mark at 32×32px. The gold gradient should be simplified to flat `#C9A84C` at this size for clarity.
- **Loading state:** The logo mark may be used as a centered loading indicator with a subtle pulse animation (opacity 0.4 to 1.0, 1.5s ease-in-out loop). No spinning.
- **Report exports (PDF/PPTX):** Logo mark at 48px height in the top-left of the cover page, with the full product name beside it.

### What Not to Do

- Never place the logo on a busy or patterned background
- Never use a white or single-color version — always preserve the gold gradient
- Never animate the logo with rotation, bounce, or particle effects
- Never scale the logo below 20px height — use the favicon version instead
- Never add a background shape (circle, rounded square) behind the logo — the circular ring is the container

### Logo Colour Extraction

The logo’s gradient values inform the gold accent system:

- `#C8A659` → maps to `--color-gold` (`#C9A84C`)
- `#916024` → maps to `--color-gold-dark` (`#9A7A2E`)
- `#EDD5A5` → maps to `--color-gold-light` (`#F0E4C0`)

This ensures the logo feels native to the UI, never pasted on.

-----

## Visual Identity

### Colour Palette — Light Mode (Default)

The default mode is light. This is a platform used in corporate offices, often on large external monitors. Light mode is more readable under fluorescent and natural lighting.

|Role          |Value    |Usage                                                     |
|--------------|---------|----------------------------------------------------------|
|Background    |`#FAFAF8`|Primary page background — warm off-white                  |
|Surface       |`#FFFFFF`|Cards, panels, modals                                     |
|Surface subtle|`#F4F4F1`|Sidebar, input backgrounds, alternating table rows        |
|Border        |`#E8E6E0`|Dividers, card borders, table rules — warm grey           |
|Text primary  |`#1A1915`|Headings, body copy, data values — near-black with warmth |
|Text secondary|`#6B6860`|Labels, captions, axis labels, supporting text            |
|Text tertiary |`#9E9C96`|Placeholders, disabled states, watermarks                 |
|Gold accent   |`#C9A84C`|Primary accent — CTAs, active states, selected engine tabs|
|Gold light    |`#F0E4C0`|Accent backgrounds, metric card top bars, badge fills     |
|Gold dark     |`#9A7A2E`|Hover states, pressed states, active navigation           |

### Semantic Colours (shared across modes)

These colours carry fixed meaning throughout the application. They must never be used decoratively.

|Role             |Value    |Dim variant            |Usage                                                          |
|-----------------|---------|-----------------------|---------------------------------------------------------------|
|Gain / Positive  |`#3D7A5E`|`rgba(61,122,94,0.10)` |Unrealized profit, positive P&L, successful completions        |
|Loss / Adverse   |`#B04040`|`rgba(176,64,64,0.10)` |VaR thresholds, drawdown indicators, negative P&L, errors      |
|Warning / Caution|`#B8860B`|`rgba(184,134,11,0.10)`|Regime shift alerts, elevated volatility, near-threshold states|
|Informational    |`#4A7FB5`|`rgba(74,127,181,0.10)`|Neutral data, simulation in-progress, informational alerts     |

**Critical rule:** Red/loss and green/gain must always retain their meaning. A loss number is always `#B04040`. A gain number is always `#3D7A5E`. Never use these colours for decorative purposes.

### Colour Palette — Dark Mode (Analyst preference)

Some risk analysts prefer dark mode for extended monitoring sessions. Dark mode is an opt-in toggle, not the default. The dark palette preserves the warm tint — avoid cold blue-blacks.

|Role          |Light value|Dark value             |Notes                                      |
|--------------|-----------|-----------------------|-------------------------------------------|
|Background    |`#FAFAF8`  |`#0C0B09`              |Very dark warm brown-black, not blue-black |
|Surface       |`#FFFFFF`  |`#171613`              |Dark card surface                          |
|Surface subtle|`#F4F4F1`  |`#1E1D19`              |Sidebar, inputs                            |
|Border        |`#E8E6E0`  |`#2E2C26`              |Subtle warm separators                     |
|Text primary  |`#1A1915`  |`#E8E6E0`              |Inverted, stays warm                       |
|Text secondary|`#6B6860`  |`#9E9C96`              |Muted text                                 |
|Text tertiary |`#9E9C96`  |`#5C5A54`              |Very subtle                                |
|Gold accent   |`#C9A84C`  |`#D4B35C`              |Slightly brighter gold for dark backgrounds|
|Gold light    |`#F0E4C0`  |`rgba(201,168,76,0.15)`|Translucent glow instead of solid          |
|Gold dark     |`#9A7A2E`  |`#8A6A20`              |Pressed states                             |

The semantic colours (gain, loss, warning, informational) stay the same in both modes — they are already calibrated for contrast on both light and dark backgrounds.

### Typography

**Display / Headings:** `Playfair Display` — serif, editorial, authoritative. Used for page titles (“Treasury Position”, “Risk Dashboard”), section headings, and the product wordmark.

**Body / UI:** `DM Sans` — clean, geometric sans-serif. Used for body copy, navigation, buttons, form labels, alert messages, and all interactive text.

**Monospace (data):** `JetBrains Mono` — for all numerical data. This includes BTC amounts, dollar values, percentages, VaR figures, dates in the lot table, and any simulation parameter values. The monospace ensures columns of numbers align visually.

**Scale (base 16px):**

|Token        |Size   |Font            |Weight|Usage                                               |
|-------------|-------|----------------|------|----------------------------------------------------|
|Display      |48–64px|Playfair Display|700   |Hero headlines only (rare in this app)              |
|Page title   |28px   |Playfair Display|600   |Page headings: “Risk Dashboard”, “Treasury Position”|
|Section title|20px   |Playfair Display|600   |Section headers within a page                       |
|Subsection   |16px   |DM Sans         |600   |Card titles, panel headers                          |
|Body         |15px   |DM Sans         |400   |Paragraphs, descriptions, smart summary text        |
|Body small   |13px   |DM Sans         |400   |Table cells, secondary information                  |
|Caption      |11px   |DM Sans         |600   |Uppercase labels, metric card titles, axis labels   |
|Data value   |24–28px|JetBrains Mono  |700   |Headline metric values (VaR, portfolio value)       |
|Data inline  |13px   |JetBrains Mono  |600   |Inline numbers, table data, percentages             |
|Data small   |11px   |JetBrains Mono  |500   |Chart tooltips, secondary data                      |

**Principle:** Serif for authority (headings). Sans for clarity (UI). Mono for precision (numbers). Never mix contexts.

-----

## Spacing & Layout

- Base unit: `4px`
- Standard section padding: `24px` within cards, `20–24px` page gutters
- Dashboard grid gap: `14–16px` between cards
- Max content width: `1400px` for the dashboard (data-dense), `1200px` for text-heavy pages
- The sidebar (simulation parameters) is fixed at `260px` width on desktop
- Generous whitespace between sections — but within cards, density is acceptable. Risk analysts want information-dense cards, not spacious ones.

### Responsive Breakpoints

|Breakpoint|Width       |Layout changes                                              |
|----------|------------|------------------------------------------------------------|
|Mobile    |`<640px`    |Single column, bottom sheet for params, 2×2 metric grid     |
|Tablet    |`640–1024px`|2-column main area, params panel beside chart, 4-col metrics|
|Desktop   |`≥1024px`   |Full sidebar + main area, 5-col metrics, all panels visible |

### Border Radius

|Element                     |Radius|Token                  |
|----------------------------|------|-----------------------|
|Cards, panels, modals       |`12px`|`--radius-xl`          |
|Buttons                     |`8px` |`--radius-lg`          |
|Inputs, selects             |`6px` |`--radius-md`          |
|Badges, pills, severity tags|`4px` |`--radius-sm`          |
|Metric card accent bar (top)|`0`   |Full-bleed colour strip|

### Shadows

Warm, soft shadows — not cool grey. Used sparingly.

```css
--shadow-sm: 0 1px 3px rgba(26, 25, 21, 0.06), 0 1px 2px rgba(26, 25, 21, 0.04);
--shadow-md: 0 4px 12px rgba(26, 25, 21, 0.08), 0 2px 4px rgba(26, 25, 21, 0.04);
--shadow-lg: 0 12px 32px rgba(26, 25, 21, 0.10), 0 4px 8px rgba(26, 25, 21, 0.06);
```

In dark mode, shadows are nearly invisible — rely on border distinction instead.

-----

## Component Specifications

### Metric Cards

The top row of the dashboard uses metric cards to surface the most critical numbers.

- **Structure:** Accent colour bar (2px) at the top edge. Caption-style label. Large monospace value. Small supporting text below.
- **Accent bar colours:** Gold for portfolio value, Loss Red for VaR/CVaR, Warning Amber for drawdown, Informational Blue for terminal price/neutral metrics.
- **Background:** Surface colour with 1px border.
- **Hover:** No hover effect — these are display-only, not interactive.
- **Mobile:** Compact variant with smaller text, 2×2 grid.

### Engine Selector

The simulation engine selector (Monte Carlo / Historical Replay / Macro-Correlated / Stress Test) sits in the top bar.

- **Idle state:** Text in secondary colour, no background.
- **Active state:** Surface-subtle background, gold text, 1px border.
- **Icon:** Lucide icon at 13px beside each label. Icon inherits text colour.
- **Mobile:** Abbreviated labels (“MC”, “Replay”, “Macro”, “Stress”), horizontally scrollable.

### Simulation Parameters Panel

The left sidebar (desktop) or bottom sheet (mobile) where the analyst configures simulations.

- **Inputs:** Standard form inputs with caption-style labels. Monospace font for numeric inputs.
- **Run button:** Full-width, gold gradient background, near-black text, bold. Prominent box shadow. This is the primary CTA on the page.
- **Running state:** Button changes to muted surface colour with a spinning RefreshCw icon and “Running…” text. Not pulsing, not bouncing — just a steady spin.
- **Position summary:** Below the params, a quiet section showing current holdings, cost basis, and P&L. Uses secondary text colours. Not attention-grabbing.

### Charts

Charts are the analytical core. They must be readable, not decorative.

**Fan Chart (Monte Carlo price paths):**

- Confidence bands use the gold accent at decreasing opacity: 99th band at 5% opacity, 95th at 10%, 75th at 20%.
- Median line: gold accent at full opacity, 2.5px stroke weight.
- Reference line (current price): dashed, text-tertiary colour.
- Grid lines: `#E8E6E0` (light mode) or `#2E2C26` (dark mode), 3-3 dash pattern.
- Axis labels: caption style, text-secondary colour.
- Tooltip: surface background with border and shadow-md. Numbers in JetBrains Mono.

**Loss Distribution Histogram:**

- Bars left of VaR threshold: Loss Red at varying opacity.
- Bars right of zero: Gain Green at 40% opacity.
- VaR threshold line: Loss Red, 2px, dashed, with a label above it.
- No excessive bar colours — this is a single-variable distribution.

**Macro Sensitivity Heatmap:**

- Cell backgrounds interpolate between Gain Green (negative correlation = protective) and Loss Red (positive correlation = risk-additive).
- Cell text: JetBrains Mono, bold.
- Regime labels: DM Sans, bold.
- Current regime indicator: a pill badge below the table.

**Chart principle:** Lead with gold for the primary data series. Use gain/loss colours only when the data has directional meaning. Avoid colour for decoration in charts.

### Smart Summary

The narrative risk summary generated after each simulation run.

- **Typography:** Body text (DM Sans 15px) with key figures highlighted in JetBrains Mono bold.
- **Regime references** (e.g., “Risk-Off”) should be rendered in the Warning colour with bold weight.
- **Structure:** Separated into 3–4 paragraphs by line breaks, not bullet points. This reads like a brief from an analyst, not a feature list.
- **Threshold warnings:** Appear in a bordered box with Warning or Loss semantic colouring and an AlertTriangle icon.

### Alert Panel

- **Severity indicator:** A coloured dot (8px circle), not a text badge. Critical = Loss Red, Warning = Warning Amber, Info = Informational Blue.
- **Alert text:** Body-small size, primary text colour when active, secondary when acknowledged.
- **Acknowledge button:** Ghost style, text-secondary, “ACK” label.
- **Active count badge:** Loss Red background, white text, 4px radius.

### Position Management

**Lot Table:**

- Alternating row backgrounds: every other row uses surface-subtle.
- P&L column: gain/loss colour with a directional arrow icon (ArrowUpRight or ArrowDownRight).
- Position percentage: a mini horizontal bar (48px wide, 4px tall) filled proportionally. Gold fill, border-colour track.
- Action buttons (edit, delete): icon-only, ghost style, visible on row hover (desktop) or always visible (mobile).

**Add Lot Form:**

- Slides into view above the table (not a modal — modals break flow for data entry).
- Gold accent top bar to visually distinguish from the table.
- Live calculation preview: appears below the inputs when both amount and price are filled. Uses accent-glow background.
- Cancel/Submit buttons right-aligned. Submit is gold primary.

**CSV Import:**

- Drag zone: dashed border using border-light, surface-subtle background. Upload icon centred.
- Column mapping: select dropdowns with pill badges highlighting the mapped columns in the preview table.
- Preview table: the matched columns get a gold-light background wash.

**What-If Panel:**

- Purple accent top bar to visually distinguish from current-position UI.
- Buy/Sell toggle: two buttons with gain-dim/loss-dim backgrounds when active.
- Comparison table: a 4-column grid (label / current / → arrow / proposed), bordered, with the proposed column using accent colour for changed values.

### Buttons

|Variant       |Background   |Text     |Border   |Hover                           |
|--------------|-------------|---------|---------|--------------------------------|
|Primary       |`#C9A84C`    |`#1A1915`|none     |`#9A7A2E` bg                    |
|Secondary     |`#FFFFFF`    |`#1A1915`|`#E8E6E0`|`#F4F4F1` bg                    |
|Ghost         |transparent  |`#6B6860`|none     |`#F4F4F1` bg                    |
|Destructive   |`#B04040`    |`#FFFFFF`|none     |darken 10%                      |
|Run Simulation|gold gradient|`#FFFFFF`|none     |deepen gradient, increase shadow|

All buttons: DM Sans, weight 600, 13px, padding `8px 16px`, border-radius `8px`.

### Forms & Inputs

- Border: `#E8E6E0`, radius `6px`, background surface
- Focus: gold border (`#C9A84C`), gold glow `rgba(201, 168, 76, 0.15)`
- Labels: DM Sans, 11px, weight 600, uppercase, letter-spacing `0.04em`, text-secondary
- Error state: Loss Red border, Loss Red label text, error message below in Loss Red
- Numeric inputs: JetBrains Mono for the value, DM Sans for prefix/suffix

-----

## Motion & Interaction

Motion in a risk tool should feel precise, never playful. Every animation communicates state change, nothing more.

|Interaction                |Duration|Easing                          |Effect                                          |
|---------------------------|--------|--------------------------------|------------------------------------------------|
|Button press               |100ms   |ease                            |`scale(0.98)`                                   |
|Card hover (if interactive)|200ms   |ease                            |`translateY(-1px)`, shadow increase             |
|Panel open/close           |200ms   |ease-out                        |Height transition or slide                      |
|Bottom sheet (mobile)      |300ms   |`cubic-bezier(0.32, 0.72, 0, 1)`|Slide up from bottom                            |
|Tab switch (charts)        |150ms   |ease                            |Fade content                                    |
|Simulation running         |—       |linear                          |Steady icon rotation (no pulse, no bounce)      |
|Loading state              |—       |—                               |Skeleton screens in surface-subtle, not spinners|
|Page transitions           |150ms   |ease                            |Simple fade                                     |

**Forbidden animations:** Bounce, elastic, spring physics, parallax, particle effects, confetti, shaking/wiggling.

-----

## Dark Mode Implementation

Dark mode is toggled via a user preference stored in the database (`users.dashboardLayout.theme`). It is NOT system-preference-driven by default — the analyst chooses explicitly.

Implementation approach:

1. All colours reference CSS custom properties (design tokens).
1. Dark mode applies a `.dark` class to the `<html>` element.
1. Tailwind’s `dark:` prefix maps to this class.
1. Semantic colours (gain, loss, warning, info) do not change between modes.
1. The gold accent brightens slightly in dark mode for contrast.
1. Shadows become nearly invisible in dark mode — rely on border-light for separation.
1. Charts use the same data colours in both modes, but grid/axis colours swap to the dark border value.

-----

## Icons

- **Library:** Lucide React
- **Stroke width:** `1.5` (not the default 2 — thinner strokes feel more refined)
- **Default size:** `14px` in UI elements, `16px` in section headers, `13px` in compact/mobile contexts
- **Colour:** Inherits from parent text colour. Never independently coloured unless it’s a semantic indicator (alert severity dot).
- **No filled icons** — outline only throughout

-----

## Voice & Microcopy

- Plain, confident language. The user is a finance professional — respect their intelligence.
- No exclamation marks in UI copy. Ever.
- Action labels should be specific: “Run Simulation” not “Go”, “Add Acquisition Lot” not “Add”, “Acknowledge” not “OK”.
- Error messages should explain what went wrong and suggest a fix: “Cost basis must be greater than zero. Enter the price paid per BTC.” not “Invalid input.”
- Empty states should be helpful: “No simulations run yet. Configure parameters in the sidebar and run your first simulation.” not “Nothing here.”
- Numbers are never rounded aggressively in the UI — show `$14,200,000` not `~$14M` (the short format is reserved for chart axes and compact mobile views).

-----

## Design Tokens (CSS Variables)

Implement as a single source of truth in your theme file. All components reference these tokens — never hard-code colour values.

```css
:root {
  /* ── Surfaces ── */
  --color-bg: #FAFAF8;
  --color-surface: #FFFFFF;
  --color-surface-subtle: #F4F4F1;
  --color-border: #E8E6E0;
  --color-border-light: #D4D2CC;

  /* ── Text ── */
  --color-text-primary: #1A1915;
  --color-text-secondary: #6B6860;
  --color-text-tertiary: #9E9C96;

  /* ── Gold accent (derived from logo gradient) ── */
  --color-gold: #C9A84C;
  --color-gold-light: #F0E4C0;
  --color-gold-dark: #9A7A2E;
  --color-gold-glow: rgba(201, 168, 76, 0.15);

  /* ── Semantic (fixed across modes) ── */
  --color-gain: #3D7A5E;
  --color-gain-dim: rgba(61, 122, 94, 0.10);
  --color-loss: #B04040;
  --color-loss-dim: rgba(176, 64, 64, 0.10);
  --color-warning: #B8860B;
  --color-warning-dim: rgba(184, 134, 11, 0.10);
  --color-info: #4A7FB5;
  --color-info-dim: rgba(74, 127, 181, 0.10);

  /* ── Typography ── */
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body: 'DM Sans', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* ── Radius ── */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;

  /* ── Shadows ── */
  --shadow-sm: 0 1px 3px rgba(26, 25, 21, 0.06), 0 1px 2px rgba(26, 25, 21, 0.04);
  --shadow-md: 0 4px 12px rgba(26, 25, 21, 0.08), 0 2px 4px rgba(26, 25, 21, 0.04);
  --shadow-lg: 0 12px 32px rgba(26, 25, 21, 0.10), 0 4px 8px rgba(26, 25, 21, 0.06);
}

.dark {
  --color-bg: #0C0B09;
  --color-surface: #171613;
  --color-surface-subtle: #1E1D19;
  --color-border: #2E2C26;
  --color-border-light: #3A382F;

  --color-text-primary: #E8E6E0;
  --color-text-secondary: #9E9C96;
  --color-text-tertiary: #5C5A54;

  --color-gold: #D4B35C;
  --color-gold-light: rgba(201, 168, 76, 0.15);
  --color-gold-dark: #8A6A20;
  --color-gold-glow: rgba(212, 179, 92, 0.12);

  --shadow-sm: none;
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.4);
}
```

-----

## How to Use This Brief with Claude Code

1. **Place this file at `DESIGN_BRIEF.md` in the project root** alongside `CLAUDE.md`. Claude Code will read both.
1. **Implement the design tokens first** — update `tailwind.config.ts` and `globals.css` to use these CSS variables before touching any components.
1. **The existing JSX prototypes use a hard-coded dark theme** — they need to be migrated to this token system. The dark mode values in those prototypes roughly map to the `.dark` tokens above.
1. **Migrate one component at a time.** Start with the metric cards (simplest), then the engine selector, then the charts, then forms.
1. **Test each component against both light and dark tokens** by toggling the `.dark` class on `<html>`.
1. **Check every screen against the personality traits:** Does this feel precise and trustworthy? Would a CFO take this seriously? Would a risk analyst want to use this for 8 hours?

### Resolving Conflicts with CLAUDE.md

If `CLAUDE.md` specifies a technical convention and this brief specifies a visual convention, both apply — they govern different domains. If there is a genuine conflict (e.g., `CLAUDE.md` says “use Tailwind risk-* tokens” but this brief defines different token names), this brief takes precedence for all visual and design decisions. `CLAUDE.md` takes precedence for architecture, file structure, and code conventions.