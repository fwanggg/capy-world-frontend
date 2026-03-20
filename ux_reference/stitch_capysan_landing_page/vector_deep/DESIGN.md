# Design System Documentation: B2B AI SaaS

## 1. Overview & Creative North Star: "The Digital Luminary"

This design system is built to transform complex AI data into an authoritative editorial experience. We are moving away from the "generic SaaS dashboard" and toward a philosophy we call **The Digital Luminary**. 

The goal is to feel like a high-end financial journal or a sophisticated research tool. We achieve this through "Organic Precision"—a blend of ultra-sharp typography and soft, layered tonal depth. By utilizing high-contrast font scales (Manrope for displays and Inter for utility) and an aggressive "No-Line" rule, we create a UI that feels carved out of light rather than assembled from blocks.

**Key Principles:**
- **Intentional Asymmetry:** Break the grid slightly with overlapping elements to suggest a custom-coded feel.
- **Tonal Depth:** Hierarchy is established through shifts in darkness, not through borders.
- **Editorial Authority:** Use large type scales to lead the user's eye to the most important data point immediately.

---

## 2. Colors

The color palette is anchored in a deep, midnight-ink (`#10131a`) and punctuated by high-vibrancy "Electric Teal" (`#00f5d4`) and "Soft Secondary" (`#94d3c3`).

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section off major UI areas. 
- Separation of concerns must be achieved through background shifts. 
- Use `surface_container_low` for the main body and `surface_container_high` for sidebar or utility panels. 
- If elements need to be separated, use white space (Spacing `8` or `10`) rather than a divider.

### Surface Hierarchy & Nesting
Treat the screen as a series of physical layers. Use the following hierarchy for "stacking":
1.  **Base:** `surface` (#10131a)
2.  **Sectioning:** `surface_container_low` (#191c22)
3.  **Individual Components/Cards:** `surface_container` (#1d2026)
4.  **Popovers/Modals:** `surface_bright` (#363940)

### The "Glass & Gradient" Rule
For primary CTAs and floating navigation, use a gradient transition from `primary` (#d7fff3) to `primary_container` (#00f5d4). For floating AI-insight cards, apply a `surface_variant` background with a 24px backdrop-blur to create a "frosted glass" effect that keeps the UI feeling airy and modern.

---

## 3. Typography

The typography strategy leverages the interplay between the geometric humanism of **Manrope** and the technical clarity of **Inter**.

- **Display & Headlines (Manrope):** These are your "Editorial" voices. Use `display-lg` (3.5rem) for hero AI metrics and `headline-md` (1.75rem) for section titles. The increased weight and size convey a sense of trustworthiness and "big picture" thinking.
- **Body & Labels (Inter):** These are your "Utility" voices. `body-md` (0.875rem) is the workhorse for all data interpretation. 
- **The Contrast Rule:** Always pair a `display-lg` Manrope header with a `label-md` Inter subhead to create a sophisticated, high-end editorial rhythm.

---

## 4. Elevation & Depth

We reject the standard "material" shadow. Depth in this system is atmospheric.

- **Tonal Layering:** Achieve "lift" by placing a `surface_container_lowest` (#0b0e14) card inside a `surface_container` (#1d2026) section. The darker-on-lighter effect creates a "carved out" look that is signature to high-end B2B tools.
- **Ambient Shadows:** For floating elements, use a diffused shadow: `box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);`. The shadow color should never be pure black; it should be a tinted version of `surface_container_lowest`.
- **The "Ghost Border" Fallback:** If accessibility requires a container boundary, use `outline_variant` (#3a4a46) at **15% opacity**. It should be felt, not seen.
- **Glassmorphism:** Use `surface_container_highest` with 60% opacity and `backdrop-filter: blur(12px)` for headers that stick to the top of the viewport during scroll.

---

## 5. Components

### Buttons
- **Primary:** Gradient from `primary_fixed` to `primary_fixed_dim`. No border. Text color: `on_primary_fixed` (#00201a).
- **Secondary:** Surface-only. Background: `surface_container_highest`. Border: None.
- **Tertiary:** Text-only in `primary` color. Use for low-emphasis actions like "Cancel" or "Learn More."

### Input Fields
- **Container:** Use `surface_container_low` with a `sm` (0.125rem) roundedness.
- **State:** When active, use a `primary` "Ghost Border" (20% opacity) and a subtle inner glow. 
- **Typography:** Placeholder text must use `label-md` in `on_surface_variant`.

### Cards & Lists
- **Rule:** Forbid the use of horizontal divider lines. 
- **Structure:** Separate list items using a `surface_container_low` background on hover. Use vertical padding `4` (1rem) from the Spacing Scale to define the hit area.
- **Rounding:** Standard cards use `xl` (0.75rem); interactive chips use `full` (9999px).

### AI Insight Chips
- **Style:** A semi-transparent `secondary_container` background with `on_secondary_container` text. This highlights AI-generated suggestions without distracting from primary data.

---

## 6. Do's and Don'ts

### Do
- **Do** use `surface_container` tiers to create hierarchy.
- **Do** use `display-lg` for single, impactful numbers or "North Star" metrics.
- **Do** use `0.75rem` (xl) rounding for containers to soften the B2B "coldness."
- **Do** maximize white space; let the deep background "breathe."

### Don't
- **Don't** use 1px solid lines for layout—use color blocks instead.
- **Don't** use high-opacity shadows. Keep them subtle and ambient.
- **Don't** mix Manrope and Inter in the same paragraph. Manrope is for titles; Inter is for reading.
- **Don't** use pure white for text. Use `on_surface` (#e1e2eb) to reduce eye strain in the dark theme.