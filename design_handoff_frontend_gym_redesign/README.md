# Handoff: Frontend Gym redesign

## Overview
This redesign of `oniasfilho/frontend-gym` (Next.js + Tailwind + shadcn) is built to cut cognitive load so the user's attention stays on the exercises. It makes these structural changes:

- **Home:** the Dashboard becomes a single Home screen with one "Continue" action, a progress card and a flat list of paths.
- **No concept screen:** the separate Concept Overview step is gone. Opening a path drops the user straight into its first unsolved exercise.
- **Simpler workspace:** the workspace is reduced to:
  - goal, input, extra (only when the exercise uses it) and expected output on the left;
  - the editor, with syntax highlighting, inline peek values and clickable line numbers, on the right;
  - one output panel with **Result** and **Peek** tabs.
- **One primary action:** Run turns into Next once the answer is correct (⌘↵ / Ctrl ↵ for both).
- **One way to navigate:** the ⌘K **Jump** palette replaces the ExerciseMenu dropdown, the dashboard button and the old CommandPalette.
- **Path complete:** this screen leads straight into the next path.
- **Themes:** five dark themes, picked from a small swatch button on Home or by typing "theme" in Jump.

## About the design files
`Frontend Gym.dc.html` is a **design reference built in HTML**: a working prototype of the intended look and behavior, not production code. Recreate it inside the existing Next.js app using its own patterns (React function components, Tailwind, shadcn `Button`/`Badge`, CodeMirror in `code-editor.tsx`, the `useProgress` hook, `lib/runner.ts`, `lib/diff.ts`). Keep all existing business logic: the runner, reference functions, the declarations/types system, input overrides, the focus-violation rule for `filter`, and the breakpoint engine. This redesign changes the UI shell and the interaction model only.

To view the prototype, open `Frontend Gym.dc.html` in a browser served from this folder (e.g. `npx serve .`). The Tweaks props on the root (`palette`, `autoCheck`, `autoAdvance`, `showHints`, `sampleHistory`) let you toggle prototype-only options.

## Fidelity
**High-fidelity.** Final colors, type, spacing, copy and interactions. Match them closely.

The prototype takes shortcuts that the real app does not need:
- It includes only the `for-of` and `map` lessons. The real app has all 18 paths.
- It runs plain JavaScript with `new Function` and no timeout. Keep the real worker-based `runner.ts`.
- Its editor is a textarea with a token overlay. Keep CodeMirror and apply the token colors below as a CodeMirror theme.
- Its line watch uses regex instrumentation. Map watches to the existing breakpoint system (`lib/breakpoints.ts`), which already captures values per line.

---

## Screens

### 1. Home (replaces `dashboard.tsx`)
**Purpose:** resume in one keystroke, see progress at a glance, and open any path.

**Layout**
- The full page sits on `--color-bg`, with a radial glow: `radial-gradient(1200px 600px at 0% -10%, color-mix(in srgb, var(--color-accent-900) 70%, transparent), transparent 60%)`.
- **Header:** flex row, padding `14px 24px`.
  - Left: wordmark `frontend.gym` in JetBrains Mono 14px/500, with the `.` in `--color-accent`. Next to it, "Data Transformation" at 12px in `--color-neutral-500`.
  - Right, gap 12px:
    - **Theme swatch button:** 28×28 circle with a 10px dot in the current theme's accent.
    - **"Jump to… ⌘K" button:** `.btn .btn-secondary`, 12px, padding `5px 9px`. The shortcut is JetBrains Mono 11px in `--color-neutral-400`.
- **Main:** max-width 1040px, padding `56px 24px 64px`, flex column, gap 56px.
  - **Top row:** `grid-template-columns: repeat(auto-fit, minmax(min(100%,340px),1fr))`, gap `40px 56px`.

**Resume block** (left column), flex column, gap 18px:
- **Kicker:** 11px, uppercase, letter-spacing 0.1em, `--color-accent`. The text is "Continue where you left off", or "Start here" if nothing has been solved and there is no `lastActiveAt`.
- **Title:** the exercise title in h1, 42px/500, `text-wrap: balance`.
- **Meta row:** 13px, `--color-neutral-400`, gap 10px, `white-space: nowrap`. It shows:
  - the path name in JetBrains Mono, `--color-text`;
  - "Exercise N of M";
  - "· 3m ago" in `--color-neutral-500`.
- **Prompt:** 15px/1.6, `--color-neutral-300`, max-width 560px.
- **Segment bar:** one 4px-tall segment per exercise in the path, gap 4px, max-width 360px. Colors:
  - solved: `--color-accent`;
  - current: `--color-neutral-300`;
  - other: `--color-neutral-800`.
- **Actions:**
  - "Continue ↵": `.btn .btn-primary`, 15px, padding `10px 18px`.
  - Helper text "Press Enter from anywhere on this page": 12px, `--color-neutral-500`.
- **Resume target:** the current exercise if it is unsolved. Otherwise, the first unsolved exercise in the current path. Otherwise, the first unsolved exercise in the next path that has any.

**Progress card** (right column): `.card` with padding `18px 20px 20px`, gap 18px and `box-shadow: var(--shadow-sm)`.
- **Header:** h2 "Your progress", 16px.
- **Big number:** solved count at 42px/500 with tabular numbers, followed by "of {total} exercises solved" at 13px in `--color-neutral-400`. Below it, a 4px bar on `--color-neutral-800` filled with `--color-accent`.
- **Stats:** three columns using `<dl>`. Labels are 11px in `--color-neutral-400`; values are 20px/500, with the unit at 12px in neutral-400.
  - **Streak:** consecutive days with at least one solve, ending today (or yesterday if today has none yet).
  - **Last 7 days:** exercises solved in the last 7 days.
  - **Paths done:** fully solved paths out of the total.
- **Activity grid:**
  - 15 weeks × 7 days, 11×11px cells, gap 3px. CSS grid: `grid-template-rows: repeat(7,11px); grid-auto-flow: column`.
  - The grid starts on the Sunday 14 weeks back. Future days are transparent.
  - Cell levels by solves that day:

    | Solves | Color |
    | --- | --- |
    | 0 | `--color-neutral-800` |
    | 1 | `--color-accent-800` |
    | 2–3 | `--color-accent-700` |
    | 4–5 | `--color-accent-600` |
    | 6+ | `--color-accent-400` |

  - Each cell's `title` reads "Oct 3 · 2 solved".
  - Legend row (11px, neutral-500): "Last 15 weeks · N active days", then "Less", the five swatches, "More".

**Paths list**
- **Heading:** h2 "Paths" at 16px, followed by "In suggested order. Open any path; it starts at your first unsolved exercise." at 12px in neutral-500.
- **Grid:** `repeat(auto-fill, minmax(300px,1fr))`, gap `2px 24px`.
- **Each row** is a full-width button: grid `28px 1fr auto`, padding `12px 10px`, radius 8.
  - Hover: `color-mix(in srgb, var(--color-text) 5%, transparent)`.
  - Active: `color-mix(in srgb, var(--color-accent) 12%, transparent)`.
- **Row contents:**
  - Line 1: the number `01` (JetBrains Mono 11px, neutral-500); the name (JetBrains Mono 14px); an optional `.tag.tag-accent` "Up next"; a ✓ in accent when the path is complete; and "n / m" on the right (Mono 11px, neutral-400).
  - Line 2: the description at 12px in neutral-400, single line with ellipsis, plus a 44×3px progress bar.
- **"Up next"** marks the first path, in order, that is not fully solved.

### 2. Practice (replaces the `workspace.tsx` exercise view)
**Layout:** `height: 100vh` grid with rows `auto | minmax(0,1fr) | auto`.

**Top bar:** padding `10px 16px`, gap 14px. Its bottom rule fades out at both ends:
`linear-gradient(to right, transparent, var(--color-divider) 48px, var(--color-divider) calc(100% - 48px), transparent) no-repeat bottom / 100% 1px`.
- **Wordmark button:** goes Home (Esc).
- **Path switcher button:** path name (Mono) + "5 / 10" (neutral-500) + "▾". Clicking opens Jump.
- **Exercise segments:**
  - One button per exercise, flex 1, max 40px wide, padding `10px 1px`, with a 4px bar inside (radius 2).
  - Colors: solved = accent; current = neutral-300 with a ring `0 0 0 2px var(--color-bg), 0 0 0 3px var(--color-neutral-500)`; other = neutral-800.
  - Tooltip: "5. Add tax to prices".
  - Clicking jumps to that exercise.
  - The bar is max 420px wide.
- **"Jump ⌘K":** `.btn-secondary` on the right.

**Main:** grid `repeat(auto-fit, minmax(340px,1fr))`, gap 16px, padding 16px.

**Left column**, flex column, gap 18px:
- **Title:** h1 25px. A `.tag.tag-accent` "Solved" appears when solved.
- **Prompt:** 15px/1.6, `--color-neutral-200`.
- **"input" block:**
  - Label: JetBrains Mono 12px/500, plus a shape hint at 11px in neutral-500 ("array · 3 items", "object · 4 keys", "number").
  - Body: `<pre>` with padding `12px 14px`, radius 8, `--color-surface` background, JetBrains Mono 13px/1.6, neutral-200.
- **"extra" block:** same styling. Show it **only when extra ≠ null**, and drop the "The extra input is unused." sentence from prompts.
- **"expected" block:**
  - Label in `--color-accent-300`.
  - Body background `--color-accent-900`, with `inset 0 0 0 1px var(--color-accent-800)`, text `--color-accent-100`.
- **Value formatting** (see `fmt()` in the prototype):
  - arrays of primitives on one line: `[1, 2, 3]`;
  - objects whose values are all primitives on one line, with unquoted keys: `{ id: 1, name: "Ana" }`;
  - anything else indents by 2 spaces per level.
- The input/extra edit and override features (from `data-panel.tsx`) can stay behind a small "Edit" ghost button if you want them. They are not part of the default view.

**Right column**, flex column, gap 12px.

**Editor card:**
- Radius 10, `--color-surface` background.
- Shadow by state:
  - default: `0 0 0 1px var(--color-neutral-800)`;
  - correct: `0 0 0 1px var(--color-accent), 0 0 40px -12px color-mix(in srgb, var(--color-accent) 60%, transparent)`, with a 300ms transition.
- **Card header:** `solve (input, extra)` in Mono 12px, then "Click a line number to watch it" (11px, neutral-500), then a ghost "Reset" button (disabled when the code is unchanged).
- **Editor body:** `--color-bg` background, margin `0 4px 4px`, radius 7. Font is JetBrains Mono 13.5px with a 21px line height; padding 14px.

**Gutter:** each line number is a button showing a 7px dot plus the number.
- Unwatched: number in neutral-700.
- Watched: dot in accent, number in accent-300.
- Hover: accent-300.
- A watched line also gets a row tint: `color-mix(in srgb, var(--color-accent) 9%, transparent)`.

**Editor behavior**
- Tab inserts 2 spaces.
- Enter keeps the current line's indent, plus 2 more after `{ [ (`.
- On entering an exercise, focus the editor and place the caret inside the function body.
- The Types, Beautify and Constraints toolbar buttons are removed from the default view. If you keep Beautify, make it keyboard-only (Shift+Alt+F).

**Syntax highlighting** (CodeMirror theme):

| Token | Color |
| --- | --- |
| keyword | `--color-accent-400` |
| function / method call | `oklch(0.86 0.07 205)` |
| parameter | `oklch(0.84 0.08 60)`, italic |
| variable | `--color-neutral-100` |
| property after `.` | `--color-neutral-300` |
| string | `oklch(0.83 0.08 150)` |
| number, `true`/`false`/`null`/`undefined` | `oklch(0.80 0.09 25)` |
| operator | `--color-accent-300` |
| punctuation | `--color-neutral-500` |
| comment | `--color-neutral-600`, italic |
| caret | `--color-accent-300` |

Per-theme overrides avoid clashes with the accent: Ember sets params to `oklch(0.84 0.07 230)`, Tide sets functions to `oklch(0.86 0.07 290)`, and Graphite sets strings to `oklch(0.83 0.08 340)`.

**Inline peek values (ghost text)**
- Peek values render after the end of the line, 3ch gap, 12px, in `--color-accent-300`.
- Format: `label = <value, up to 56 chars>  ×N` (N = number of hits, shown when above 1), or `→ <value>` for a watched `return`.
- A watched line with no hits shows "not reached" in neutral-600. A watched line that can't be captured shows "nothing to watch on this line".
- When the code doesn't compile, keep the last good values and dim them to neutral-600.
- Implement this with a CodeMirror `Decoration.widget` at the end of each line.

**Output panel**
- Card: radius 10, surface background, height 38% (min 170px).
- **Tab bar:** padding `6px 8px 0`, with a fading bottom rule.
  - Tabs are 12px/500. The active tab has an inset 2px bottom line in accent.
  - **"Result"** has a 6px status dot: accent when correct, neutral-300 when wrong or erroring, neutral-600 when idle.
  - **"Peek"** shows the number of captured values in a `.tag-accent` badge.
  - The right side shows the hint "⌘. watch line" (Mono 11px, neutral-500).
- **Result tab states** (13px; each begins with a 6px dot):
  - **idle:** "Start typing. Your answer is checked as you go." (or "Press ⌘↵ to check your answer." when auto-check is off).
  - **empty** (returned `undefined`): "solve() returns nothing yet. Add a `return`."
  - **error:** "Doesn't run yet" (500), then the message in Mono 12.5px, neutral-300.
  - **wrong:** "Close, not yet" (500), then "2 differences" in neutral-400. Below that, a 2-column Mono grid:
    - `yours` (neutral-500 label, text value);
    - `wanted` (accent-300 label, accent-200 value).
    - Keep `structuralDiff` for the count, and optionally list each difference.
  - **correct:**
    - A 20px circle (accent-800 background, accent-200 ✓), then "Correct" at 15px/500 in accent-200, then a hint on the right: "⌘↵ next exercise" or "⌘↵ finish path".
    - Then the lesson's `approach` text (13px, neutral-300).
    - Then `<details>` "Compare with the reference" containing the solution.
  - **stale** (auto-check off and edited since the last run): "Edited since last check · ⌘↵ to run" at 11px.
- **Peek tab:**
  - **Empty state:** "See what your code is doing while you type. Click a line number to watch that line, or wrap any value in `peek()`. Values show next to the code and here, one row per pass through a loop." Below it, the sample `peek(input)  ·  peek(value, "doubled")` on a bg-colored code chip.
  - **Groups:** sorted by line. Each header reads `line 3` (neutral-500), the label (accent-300; `return value` for returns), and "N passes" when N > 1. Below each header, a Mono grid of `#1` (neutral-600) and the formatted value (neutral-100), capped at 30 rows.
  - **Compile failure:** "Showing the last run that compiled", with the list at 50% opacity.
  - **Correct while Peek is open:** a "✓ Correct · see result" chip at the top (accent-900 background, accent-800 inset border) that switches to Result.
- **Auto tab switching:**
  - Switch to Peek when the first value appears and the answer isn't correct.
  - Switch to Result when the answer first becomes correct for that code.
  - Adding a watch switches to Peek.

**Footer:** padding `10px 16px`, with a fading top rule.
- **Left hints** (12px, neutral-500, keys in Mono neutral-400, nowrap): "⌘↵ run|next|finish", "⌘. watch line", "⌥← ⌥→ prev / skip", "esc home".
- **Right buttons:**
  - "←" previous (`.btn-secondary`, disabled on the first exercise);
  - "Skip" (`.btn-secondary`);
  - the primary button (`.btn-primary`, min-width 128px): "Run ⌘↵" → "Next ⌘↵" → "Finish path ⌘↵" on the last exercise. When correct, its background is `color-mix(in srgb, var(--color-accent) 18%, transparent)`.

### 3. Path complete (replaces `PathCompletion` and the summary view)
- **Header:** wordmark only.
- **Main:** max-width 640px, padding `12vh 24px 64px`, gap 22px.
- **Kicker:** "Path complete".
- **Title:** h1 with the path name in JetBrains Mono, 42px/500.
- **Summary:** "N of M solved." When some are unsolved, add "Skipped exercises stay open in the path."
- **Exercise list:** a row of `.tag`s, `tag-accent` with ✓ for solved and `tag-neutral` with ○ for unsolved.
- **Up next:** "Up next" label (12px, neutral-400), the next path's name (Mono 20px) and description (14px, neutral-300).
- **Buttons:** "Start {next} ↵" (primary, 15px) and "Home" (secondary).
- **Keys:** Enter starts the next path; Esc goes Home.
- If there is no next path, show only "Back home ↵".

### 4. Jump palette (replaces `CommandPalette` and `ExerciseMenu`)
- **Backdrop:** fixed inset, `color-mix(in srgb, var(--color-neutral-900) 55%, transparent)`, `backdrop-filter: blur(3px)`, padding-top 14vh.
- **Panel:** `min(560px, 100%)`, radius 14, surface background, `--shadow-lg`.
- **Input:** 15px, padding `16px 18px`, placeholder "Type a path or exercise…", fading bottom rule.
- **List:** padding 6, max-height 380.
- **Rows:** padding `9px 12px`, radius 8. Each row has a mark column (accent, 12px), a label and a Mono sub-label on the right (11px, neutral-400). The selected row's background is `color-mix(in srgb, var(--color-accent) 16%, transparent)`, and hovering a row selects it.
- **Default list:**
  - "Home" (sub "esc");
  - every path with exercises (Mono label, sub "n / m"), which opens at the first unsolved exercise;
  - the current path's exercises (✓ if solved, sub "map · 5").
- **Searching:** filters across Home, all paths, all exercises in all paths, and "Theme: X" entries. Themes are only reachable by searching.
- **Footer:** 11px, neutral-500: "↑↓ move", "↵ open", "esc close", and on the right "type “theme” to change colors".
- **Opening animation:** opacity 0→1 and `translateY(-6px) scale(.985)` → none, 180ms `cubic-bezier(.2,.7,.2,1)`.

### 5. Theme picker (hidden)
- Clicking the swatch button on the Home header opens a popover:
  - 190px wide, padding 6, radius 10, surface background, `--shadow-md`, positioned 36px below and aligned to the right edge.
  - Title "Theme" (11px, neutral-400).
  - Five rows, each with a 26×14px two-part swatch (ground | accent). The selected row's swatch gets a ring `0 0 0 2px surface, 0 0 0 3px text`, and its label is weight 500.
  - Clicking outside closes it.
- The choice persists in localStorage and overrides any default.

---

## Interactions and behavior

**Keyboard** (detect the platform: `/mac|iphone|ipad/i` on `navigator.userAgentData?.platform || navigator.platform`)

| Action | Mac | Windows/Linux | Where |
| --- | --- | --- | --- |
| Open/close Jump | ⌘K | Ctrl K | everywhere |
| Run, or Next when correct | ⌘↵ | Ctrl ↵ | Practice |
| Watch the caret's line | ⌘. | Ctrl . | editor |
| Previous / skip | ⌥← / ⌥→ | Alt ← / Alt → | Practice |
| Home | Esc | Esc | Practice, Path complete |
| Resume | Enter | Enter | Home (when no control is focused) |
| Start next path | Enter | Enter | Path complete |

Every displayed shortcut label uses the platform-specific form.

**Auto-check**
- After 350ms of no typing (the existing `liveTimer`), run the code and update both Result and Peek.
- When an exercise first passes for a given piece of code:
  - mark it solved;
  - add 1 to today's activity count;
  - flash the output panel: box-shadow `0 0 0 1px accent, 0 0 32px accent@35%` → transparent over 1100ms ease-out;
  - pulse the primary button: scale 1 → 1.06 → 1 over 380ms `cubic-bezier(.3,1.6,.5,1)`.
- The optional auto-advance moves to the next exercise 1.4s after a pass, and is cancelled by any edit.

**Screen transitions:** on any change of view or exercise, the stage animates opacity 0→1 and `translateY(8px)` → none over 260ms `cubic-bezier(.2,.7,.2,1)`. Respect `prefers-reduced-motion`.

**Watches**
- Watches belong to each exercise and live in memory only.
- Toggling a watch reruns the check immediately.
- Capture rules:
  - `return expr`: the value of expr;
  - `const|let x =`: x after the line;
  - `x.push(…)`: x;
  - `x += / = / ++`: x after the line;
  - `for (const v of …) {`: v on each pass.
- In the real app, back this with `lib/breakpoints.ts`.

## State
These fields extend `useProgress` (key `reshape:progress:v1`):
- `pathSlug`, `index`, `drafts`, `solved`, `lastActiveAt`: as today.
- `activity: Record<'YYYY-MM-DD', number>`: new; incremented on each first solve.
- `theme: 'Nocturne'|'Ember'|'Tide'|'Graphite'|'Mono' | null`: new.

UI-only state:
- `view: 'home'|'practice'|'done'`;
- `paletteOpen`, `query`, `selectedIndex`;
- `outputTab: 'result'|'peek'`;
- `watches: Record<exerciseId, number[]>`;
- `checkedCode: Record<exerciseId, string>` (the last code that was run);
- `themeOpen`.

## Design tokens
The base is the Nocturne system (`_ds/.../styles.css`, included here). Key values:
- **Ground and text:** `--color-bg #161826`, `--color-surface #232532`, `--color-text #e9e9ed`, `--color-accent #9184d9`, `--color-divider` = text at 16%.
- **Neutral ramp, 100–900:** `#f3f5fe #e4e7f5 #cfd3e5 #b2b6ca #9397ab #75798c #595d6c #3f424d #292b31`.
- **Accent ramp, 100–900:** `#f5f4ff #e7e5fe #d2cefd #b5abfc #968ae0 #796cbf #5d5294 #423a6a #2b2741`.
- **Shadows:**
  - sm `0 0 0 1px #3f424d`;
  - md `0 0 0 1px #595d6c, 0 6px 18px rgba(0,0,0,.55)`;
  - lg `0 0 0 1px #9397ab, 0 16px 40px rgba(0,0,0,.65)`.
- **Radii:** 4 / 8 / 14; cards 10.
- **Type:**
  - Inter 400/500 (headings 500, letter-spacing −0.015em; h1 42, h2 32, h3 25), body 15/1.55;
  - JetBrains Mono 400/500 for code, values, counts and the wordmark.
- **Buttons:** `.btn` 14px/500, padding `5.6px 10px`, radius 8. Primary = accent outline on transparent (hover accent@12%, active accent@22%). Secondary = divider border (hover text@7%).
- **Tags:** 11px, padding `3px 10px`, radius 6. Accent tag: accent-800 background, accent-100 text.
- **Focus:** `:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px }`.

**Alternate themes** are generated in OKLCH. Each ramp step i uses a fixed lightness, and the accent chroma is scaled per step:
- Lightness L = `[.97,.93,.87,.79,.69,.59,.48,.38,.28]`.
- Accent chroma = `ca × [.12,.28,.52,.8,1,.92,.75,.55,.38]`.
- Neutral chroma = `cn × 1.4` (×0.5 at step 100).
- bg = `oklch(0.195 cn×1.6 hn)`, surface = `oklch(0.245 cn×1.6 hn)`, text = `oklch(0.94 cn×.6 hn)`, accent = `oklch(0.72 ca ha)`.

| Theme | hn / cn | ha / ca | Notes |
| --- | --- | --- | --- |
| Ember | 60 / .009 | 62 / .13 | warm charcoal, amber accent |
| Tide | 220 / .02 | 185 / .10 | slate-blue, teal accent |
| Graphite | 250 / .004 | 128 / .15 | neutral grey, lime accent |
| Mono | 0 / 0 | 0 / 0 | accent L .94, bg L .155, surface L .205; black and white |

The exact implementation is `themeVars()` in the prototype. Apply a theme as CSS variables on `<html>` (e.g. `data-theme`) so the Tailwind theme reads them.

## Assets
- **Fonts:** Inter and JetBrains Mono from Google Fonts. Switch to `next/font`.
- **Icons:** none are required. The prototype uses text glyphs (✓ → ← ▾ ↵). If you want icons, use Phosphor per the design system, in place of lucide.
- **Images:** none.

## Files
- `Frontend Gym.dc.html`: the full prototype. The markup (template) is at the top and the logic is in the `<script data-dc-script>` block at the bottom. Useful functions:
  - `fmt`, `shape`: value formatting;
  - `evaluate`, `instrument`, `argText`: checking and peek;
  - `tokenize`, `paramsOf`: syntax colors;
  - `stats`: streak, week count and activity grid;
  - `themeVars`: themes;
  - `resumeTarget`: what Continue opens;
  - `palItems`: Jump list.
- `support.js`, `_ds/…`: runtime and design-system stylesheet, needed only to open the prototype.

**Mapping to the repo**

| Repo file | Change |
| --- | --- |
| `dashboard.tsx` | → Home |
| `workspace.tsx` | → Practice shell (drop the resizable A/B/C panels; keep the logic) |
| `top-bar.tsx` | → simplified top bar |
| `exercise-menu.tsx`, `learning-controls.tsx` | → Jump palette |
| `result-panel.tsx` | → output panel with Result/Peek tabs |
| `data-panel.tsx` | → static value blocks |
| `curriculum-views.tsx` | → Path complete only; ConceptOverview removed |
| `code-editor.tsx` | → CodeMirror theme + gutter watch toggles + inline peek widgets |
| `hooks/use-progress.ts` | → add `activity` and `theme` |
