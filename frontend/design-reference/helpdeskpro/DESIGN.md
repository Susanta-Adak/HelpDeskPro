---
name: HelpDeskPro
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#464555'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#7e3000'
  on-tertiary: '#ffffff'
  tertiary-container: '#a44100'
  on-tertiary-container: '#ffd2be'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb695'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7b2f00'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 20px
  margin-mobile: 16px
  container-max: 1440px
---

## Brand & Style
The design system is engineered for high-efficiency enterprise environments, focusing on clarity, trust, and reduced cognitive load. The brand personality is professional yet approachable, utilizing a **Corporate / Modern** aesthetic that prioritizes content over ornamentation.

The visual language leverages ample white space, a structured information hierarchy, and soft tonal shifts to create a workspace that feels calm even during high-volume ticket management. The objective is to provide a "tool-like" precision while maintaining the polished feel of a premium modern SaaS product.

## Colors
The palette is anchored by **Indigo** as the primary action color, providing a sense of authority and reliability. **Teal** serves as a secondary accent for success states, specialized tags, or alternative categorical markers.

The background uses a soft **Light-Gray** (#f9fafb) to reduce screen glare during long work sessions, while interactive surfaces and cards utilize a pure **Off-White** (#ffffff) to create a clear "layering" effect. Semantic colors should follow standard patterns: Red for high-priority/overdue tickets, Amber for warnings/pending, and Green for resolved states.

## Typography
The system utilizes **Inter** for its exceptional legibility and systematic feel. The type scale is optimized for data-dense interfaces; `body-md` (14px) is the standard for ticket lists and sidebars to maximize information density without sacrificing readability.

Headlines use tighter letter spacing and heavier weights to provide clear section anchors. For mobile views, `display-lg` should scale down to `headline-lg` (24px) to ensure titles do not wrap aggressively.

## Layout & Spacing
The design system employs a **Fixed Grid** model for desktop dashboards to ensure a consistent workspace, transitioning to a **Fluid Grid** for mobile devices.

- **Desktop:** 12-column grid with 20px gutters. Main navigation is typically a fixed 240px sidebar.
- **Tablet:** 8-column grid with 16px margins.
- **Mobile:** 4-column fluid grid with 16px margins.

Spacing follows a strict 4px/8px baseline rhythm. Use `md` (16px) for standard padding within cards and `lg` (24px) for spacing between major layout sections.

## Elevation & Depth
This design system uses **Tonal Layers** combined with **Ambient Shadows** to communicate hierarchy.

- **Level 0 (Background):** Light-gray (#f9fafb) - the canvas.
- **Level 1 (Cards/Sidebar):** White (#ffffff) - used for the primary content containers. These should have a very soft, diffused shadow (Blur: 12px, Y: 4px, Opacity: 4% Black) and a 1px border (#e5e7eb).
- **Level 2 (Popovers/Dropdowns):** White (#ffffff) - used for overlays. These feature a more pronounced shadow (Blur: 20px, Y: 10px, Opacity: 8% Black) to indicate they are floating above the workspace.

## Shapes
The shape language is defined by a "Soft-Geometric" approach. Standard UI elements (buttons, inputs, cards) utilize a **0.5rem (8px)** corner radius. Larger containers or feature cards may use **1rem (16px)** to feel more modern and inviting.

Avatars and status "pills" should always be fully rounded (9999px) to provide a visual contrast against the structured rectangular grid of the dashboard.

## Components

### Buttons
Primary buttons use the Indigo accent with white text. Secondary buttons use a white background with a 1px border (#e5e7eb) and Indigo text. Use a height of 36px for standard actions and 44px for primary "Create Ticket" actions.

### Inputs & Selects
Input fields feature an 8px radius and a 1px border. On focus, the border shifts to Indigo with a subtle 2px outer glow (Indigo at 10% opacity).

### Cards
Cards are the primary container for ticket information. They must include 16px - 24px of internal padding. Use a subtle bottom border or soft shadow to separate list items within a card.

### Chips & Badges
Used for ticket priority (High, Medium, Low) and status (Open, Pending, Closed). These should have a subtle background tint (10% opacity of the semantic color) with high-contrast text for accessibility.

### Data Tables
Tables should avoid vertical borders. Use horizontal dividers (#f3f4f6) and a hover state background (#f9fafb) to help users track rows. Row height should be a minimum of 48px for comfortable interaction.
