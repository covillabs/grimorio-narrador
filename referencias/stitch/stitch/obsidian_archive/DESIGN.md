# Design System Document: The Nocturnal Archive

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Reliquary"**

This design system is not a mere interface; it is a bridge between the arcane past and a cold, investigative future. It rejects the "friendly" ubiquity of modern SaaS in favor of **Organic Brutalism**. We achieve this by blending the ritualistic weight of an ancient tome with the clinical precision of a forensic terminal. 

The experience must feel "heavy" and "hallowed." To break the template look, we use aggressive, sharp-edged geometry (`0px` border-radius) contrasted against expansive, cinematic negative space. Layouts should favor intentional asymmetry—large, offset display type and content blocks that overlap like evidence scattered across a detective’s desk.

---

## 2. Colors & Surface Philosophy
The palette is rooted in the depth of shadows. We utilize a monochromatic base of lead and coal, punctuated by the visceral "Blood Red" of action.

*   **Primary (Action):** `primary` (#ffb4a8) / `primary_container` (#8b0000). Use the deep blood-red for critical path actions and high-intensity feedback.
*   **Neutral Foundation:** `surface` (#131313) and `surface_container_lowest` (#0e0e0e).

### The "No-Line" Rule
**Explicit Instruction:** Traditional 1px solid borders are strictly prohibited for sectioning. Boundaries must be defined through:
1.  **Tonal Shifts:** A `surface_container_high` card sitting on a `surface` background.
2.  **Negative Space:** Using the spacing scale to create distinct visual islands.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of charred parchment. 
*   **Base Level:** `surface` (#131313) for the main application canvas.
*   **Sub-sections:** Use `surface_container_low` for secondary navigation or sidebars.
*   **Emphasis Layers:** Use `surface_container_highest` (#353535) for active workspace areas to draw the eye inward.

### Signature Textures & Gradients
To avoid a flat "digital" look, apply a subtle noise texture (2-3% opacity) over the `surface` layer to mimic grain or old paper. Use a linear gradient from `primary_container` (#8b0000) to `on_primary_fixed_variant` (#920703) for main CTAs to give them a "pulsing" organic depth.

---

## 3. Typography: The Dual Narrative
We employ a high-contrast typographic pairing to represent the duality of the "Grimório": the story (Serif) and the system (Sans/Mono).

*   **The Ancient Voice (Display & Headline):** `notoSerif`. These should be used for narrative headings and section titles. Use `display-lg` (3.5rem) with tight letter-spacing to create an editorial, book-cover feel.
*   **The Investigative Lens (Body & Title):** `inter`. This provides a clean, neutral contrast to the serif. It represents the "modern" tool used to analyze the narrative.
*   **The Forensic Metadata (Labels):** `spaceGrotesk`. Used for data points, coordinates, or system status. Its technical nature reinforces the "investigative terminal" aesthetic.

---

## 4. Elevation & Depth
In this system, elevation is not achieved through height, but through **clarity and immersion**.

*   **Tonal Layering:** Depth is a "stack." Place `surface_container_lowest` elements within `surface_container_high` containers to create "cut-outs" or "wells" of data.
*   **Ambient Shadows:** For floating modals, use a custom shadow: `0px 20px 40px rgba(0, 0, 0, 0.6)`. The shadow must be ultra-diffused to look like smoke rather than a hard drop shadow.
*   **The "Ghost Border" Fallback:** If a divider is required for extreme information density, use the `outline_variant` (#5a403c) at **15% opacity**. It should be felt, not seen.
*   **Glassmorphism:** For overlays (tooltips, dropdowns), use `surface_variant` at 80% opacity with a `20px` backdrop-blur. This creates a "frosted obsidian" effect that maintains the dark atmosphere while separating the layer from the content below.

---

## 5. Components

### Buttons
*   **Primary:** Sharp `0px` corners. Background: `primary_container` (#8b0000). Text: `on_surface`. On hover, add a subtle `primary` inner-glow.
*   **Tertiary:** No background. Text: `on_surface_variant`. Use `spaceGrotesk` in all-caps for a "terminal command" feel.

### Input Fields
*   **Styling:** No background. Only a bottom-stroke using `outline`.
*   **States:** On focus, the bottom-stroke transitions to `primary` (#ffb4a8) with a faint red outer-glow. Labels use `label-sm` in `spaceGrotesk`.

### Cards & Lists
*   **Prohibition:** No dividers. Separate list items using 16px of vertical space or a subtle hover shift to `surface_container_low`.
*   **Interaction:** Cards should not "lift" on hover; instead, they should "illuminate"—the text color shifting from `on_surface_variant` to `on_surface`.

### Additional Component: The "Evidence Tag"
A specialized chip for metadata. Uses `surface_container_highest` background, `0px` radius, and `spaceGrotesk` type. It looks like a scanned label from a crime scene file.

---

## 6. Do's and Don'ts

### Do:
*   **Embrace Asymmetry:** Align titles to the far left and body text to a narrower center column.
*   **Use High Contrast:** Let the `#E0E0E0` text pop against the `#000000` depths.
*   **Respect the Serif:** Use `notoSerif` only for moments of "story" or "ritual."

### Don't:
*   **No Rounded Corners:** Never use `border-radius`. Everything must be sharp, surgical, and uncompromising.
*   **No "Material" Blue:** Never use default system blues or purples. If it isn't grey, black, or blood-red, it doesn't belong.
*   **No Over-shadowing:** Avoid stacking too many shadows. Rely on background color shifts first.
*   **No Center-Alignment:** Avoid centering large blocks of text; it breaks the "investigative report" aesthetic. Keep it flush-left (ragged right).