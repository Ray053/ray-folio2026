# Y2K × Acid × Bauhaus — Phase A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lay the Y2K×Acid×Bauhaus design-system foundation — a single bright-white theme with electric-blue (#0033FF) + layered blues + one acid-lime (#CCFF00) accent, hard-edged "block" components (thick black borders, hard offset shadows, sharp corners) replacing all frosted glass — and restyle the floating chrome (Navbar, LangToggle, Hero info block) plus recolor the noise ball. (Home-section motifs = Phase B; other pages = Phase C.)

**Architecture:** New design tokens + a reusable `.hard-block` utility live in `app/globals.css` (dark mode removed). Each chrome component swaps its `.glass`/`.glass-pill` usage for `.hard-block`. The noise-ball fragment shader is recolored to electric blue with a lime Fresnel edge. Dark-mode init script and `ThemeToggle` are removed.

**Tech Stack:** Next.js 15, Tailwind v4 (`@theme`), plain CSS custom properties, React Three Fiber / GLSL. No new dependencies.

## Global Constraints

- Design source of truth: `docs/superpowers/specs/2026-08-06-y2k-acid-bauhaus-redesign-design.md`. This supersedes the visionOS glass direction.
- **Single bright theme:** white base. NO dark mode, NO `.dark` block, NO `ThemeToggle`.
- **Palette (verbatim hex):** background `#FFFFFF`, surface `#F2F4F8`, ink `#0A0A0A`, text-secondary `#3D3D3D`. Blues: deep `#001A80`, primary/accent `#0033FF`, mid `#3D6BFF`, light `#8AA5FF`, pale `#DCE4FF`, cyan `#00C2FF`. Acid lime `#CCFF00` (the ONLY acid accent).
- **a11y:** lime/cyan are bright — use them only as fills with **black (`ink`) text on them**, never as text on white. Blue `#0033FF` may be text on white (≈9:1) and takes white text on it. All text meets WCAG AA.
- **Shape lock:** sharp corners (radius 0). Hard offset shadows (`Npx Npx 0 <color>`), never blurred. No `backdrop-filter`, no glass.
- **One acid accent locked:** lime `#CCFF00` only. One blue accent: `#0033FF`; other blues are layering fills, not second accents.
- Motion: transform/opacity/shader-uniform only; respect `prefers-reduced-motion`.
- Do NOT touch i18n, routing, Payload, or home-section layouts (Phase B) beyond the chrome components named here.

---

### Task 1: Design tokens + hard-block utility (`app/globals.css`)

Replace the two-theme blue-gray/electric token system with the single bright Y2K×Acid×Bauhaus palette, delete the `.dark` block, add the `.hard-block` utilities and a hard-shadow variable, and recolor the hardcoded ambient-glow blobs to electric blue. Keep `.glass`/`.glass-pill` for now (later tasks migrate the components off them; a final task removes them).

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Produces: `--color-background/#FFFFFF`, `--color-surface`, `--color-ink`, `--color-accent/#0033FF`, `--color-accent-2/#00C2FF`, `--color-acid/#CCFF00`, `--color-text-primary/secondary/muted`, `--color-border/#0A0A0A`, `--color-shadow-accent` (blue), `--shadow-hard`; `@theme` blue scale `--color-blue-deep/primary/mid/light/pale`, `--color-cyan-pop`, `--color-acid`; utility classes `.hard-block`, `.hard-block--blue`, `.hard-block--acid`.

- [ ] **Step 1: Replace the `@theme` accent scale**

In `app/globals.css`, replace the current pure-blue `@theme` accent block (the `--color-blue-50/300/400/500/700` group) with:
```css
  /* ─── Y2K × Acid × Bauhaus palette ───────────────── */
  --color-blue-deep:    #001A80;
  --color-blue-primary: #0033FF;
  --color-blue-mid:     #3D6BFF;
  --color-blue-light:   #8AA5FF;
  --color-blue-pale:    #DCE4FF;
  --color-cyan-pop:     #00C2FF;
  --color-acid:         #CCFF00;
```
And replace the `--shadow-accent` line with:
```css
  --shadow-accent: 6px 6px 0 #0033FF;
```

- [ ] **Step 2: Replace the light-mode semantic tokens (`:root`)**

Replace the entire `:root { … }` semantic-token block with:
```css
:root {
  --color-background: #FFFFFF;
  --color-surface:    #F2F4F8;
  --color-surface-2:  #E9ECF4;
  --color-border:     #0A0A0A;

  --color-ink:            #0A0A0A;
  --color-text-primary:   #0A0A0A;
  --color-text-secondary: #3D3D3D;
  --color-text-muted:     #6B6B6B;

  --color-accent:       #0033FF;
  --color-accent-hover: #001A80;
  --color-accent-2:     #00C2FF;
  --color-acid:         #CCFF00;
  --color-link:         #0033FF;
  --color-link-hover:   #001A80;

  --color-shadow-accent: rgba(0,51,255,0.28);
  --shadow-hard:         6px 6px 0 var(--color-accent);
}
```

- [ ] **Step 3: Delete the `.dark` block**

Remove the entire `.dark { … }` semantic-token block. (Dark mode is dropped; Task 2 removes the init script so `.dark` is never applied.)

- [ ] **Step 4: Recolor the hardcoded ambient-glow blobs**

The `.ambient-glow-a/b/c` backgrounds use electric-blue-adjacent rgba already from the glass work; retune them to the new electric blue and drop the dark-mode opacity override. Replace their `background` gradients with:
```css
.ambient-glow-a { background: radial-gradient(circle, rgba(0,51,255,0.30), transparent 70%); }
.ambient-glow-b { background: radial-gradient(circle, rgba(0,26,128,0.28), transparent 70%); }
.ambient-glow-c { background: radial-gradient(circle, rgba(0,194,255,0.22), transparent 70%); }
```
Delete the `.dark .ambient-glow { opacity: 0.42; }` line (no dark mode).

- [ ] **Step 5: Add the `.hard-block` utilities**

Append to `app/globals.css`:
```css
/* ─── Bauhaus hard-edge blocks (replaces liquid glass) ─── */
.hard-block {
  background: var(--color-background);
  border: 2px solid var(--color-ink);
  border-radius: 0;
  box-shadow: var(--shadow-hard);
}
.hard-block--blue {
  background: var(--color-accent);
  color: #fff;
  border: 2px solid var(--color-ink);
  border-radius: 0;
  box-shadow: 6px 6px 0 var(--color-ink);
}
.hard-block--acid {
  background: var(--color-acid);
  color: var(--color-ink);
  border: 2px solid var(--color-ink);
  border-radius: 0;
  box-shadow: 6px 6px 0 var(--color-ink);
}

/* ─── Y2K mono label (eyebrows / numbers / tags) ─── */
.mono-label {
  font-family: var(--font-geist-mono), ui-monospace, monospace;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 12px;
  color: var(--color-accent);
}
```
(Per-heading Bauhaus weight/uppercase for Syne headings is applied where the headings live — the Hero heading in Task 4, section headings in Phase B — not as a global override.)

- [ ] **Step 6: Visual verification (manual — controller/user)**

Run `npm run dev` (server may be on :3100). Confirm: accents (links, nav underline) are electric blue #0033FF on a white page; nothing renders in dark mode even if the OS prefers dark; the page still loads (glass components still styled via the retained `.glass` until later tasks). Full hard-block look appears after Tasks 3–4.

- [ ] **Step 7: Commit**

```bash
git add app/globals.css
git commit -m "Add Y2K/acid/bauhaus tokens + hard-block utility; drop dark theme"
```

---

### Task 2: Remove dark-mode init (`app/(frontend)/[locale]/layout.tsx`)

Delete the inline theme-init script that adds the `.dark` class, so the single bright theme is always used.

**Files:**
- Modify: `app/(frontend)/[locale]/layout.tsx`

**Interfaces:** none (removal).

- [ ] **Step 1: Remove the theme script**

In `app/(frontend)/[locale]/layout.tsx`:
1. Delete the `const themeScript = …` line.
2. Delete the `<head><Script id="theme-init" …>{themeScript}</Script></head>` block (and the now-unused `import Script from 'next/script'` if `Script` is used nowhere else in the file).

- [ ] **Step 2: Typecheck & lint**

Run: `npx tsc --noEmit ; npm run lint`
Expected: clean (no new errors; remove any now-unused import flagged).

- [ ] **Step 3: Commit**

```bash
git add "app/(frontend)/[locale]/layout.tsx"
git commit -m "Remove dark-mode init script (single bright theme)"
```

---

### Task 3: Navbar → hard-block + drop ThemeToggle (`components/layout/Navbar.tsx`)

Restyle the floating nav from a glass pill to a Bauhaus hard block (thick ink border, hard offset shadow, sharp corners), remove the `ThemeToggle`, and make the Download-CV a hard-block button.

**Files:**
- Modify: `components/layout/Navbar.tsx`

**Interfaces:**
- Consumes: `.hard-block` (Task 1).

- [ ] **Step 1: Swap the glass pill for a hard block**

On the inner `<nav>` (currently `className="glass-pill"`), change the class to `"hard-block"` and its inline style: remove `borderRadius: 9999px` reliance (hard-block is sharp), keep the floating margin/padding/flex. Result: a sharp-cornered white bar with a 2px ink border and a `6px 6px 0 #0033FF` shadow, detached from the top.

- [ ] **Step 2: Remove ThemeToggle**

Delete the `import { ThemeToggle } from './ThemeToggle'` line and both `<ThemeToggle />` usages (desktop cluster + mobile controls). Leave `LangToggle` in place (restyled in Task 4).

- [ ] **Step 3: Download-CV → hard-block button**

Change the desktop Download-CV `<a>` to a hard block: `borderRadius: 0`, `border: '2px solid var(--color-ink)'`, `background: 'var(--color-accent)'`, `color: '#fff'`, `boxShadow: '4px 4px 0 var(--color-ink)'`, keep the label. (White on #0033FF passes AA.) Optionally add a mono uppercase feel via `fontFamily: 'var(--font-geist-mono)'`, `textTransform: 'uppercase'`, `letterSpacing: '0.08em'`.

- [ ] **Step 4: Typecheck, lint & visual verification**

Run: `npx tsc --noEmit ; npm run lint` (expect clean). Then reload and confirm the nav is a sharp white hard block with an electric-blue hard shadow, no theme toggle, and a blue hard-block CV button; nav is single-line on desktop; mobile menu still opens.

- [ ] **Step 5: Commit**

```bash
git add components/layout/Navbar.tsx
git commit -m "Navbar: hard-block styling; drop ThemeToggle"
```

---

### Task 4: LangToggle + Hero info block → hard-block (`components/layout/LangToggle.tsx`, `components/sections/HeroSection.tsx`)

Migrate the last two `.glass` consumers to hard blocks so the glass utility can be removed in Task 6.

**Files:**
- Modify: `components/layout/LangToggle.tsx`
- Modify: `components/sections/HeroSection.tsx`

**Interfaces:**
- Consumes: `.hard-block` (Task 1).

- [ ] **Step 1: LangToggle → hard block**

In `LangToggle.tsx`, change the wrapping `<div className="glass-pill" …>` to `className="hard-block"` with `borderRadius: 0` and a smaller hard shadow (`boxShadow: '3px 3px 0 var(--color-ink)'` via the class or inline), keep padding. Make the active locale use the accent (`var(--color-accent)`) or an acid highlight; keep the per-locale buttons and logic unchanged.

- [ ] **Step 2: Hero info island → hard block**

In `HeroSection.tsx`, change the `<div className="glass" …>` (the eyebrow + tagline + CTA island) to `className="hard-block"` with `borderRadius: 0`. Keep its padding/flex. Update the eyebrow color if needed to remain AA on the now-white block (`var(--color-accent)` on white passes). The Download-CV CTA inside: keep it a blue hard-block button (`background: var(--color-accent)`, `color:#fff`, sharp, `border: 2px solid var(--color-ink)`, hard shadow) — drop the old rounded pill / arrow-circle rounding to sharp.

- [ ] **Step 3: Typecheck, lint & visual verification**

Run: `npx tsc --noEmit ; npm run lint` (expect clean). Reload and confirm LangToggle and the Hero info block are sharp bordered hard blocks with hard shadows; text is legible (AA).

- [ ] **Step 4: Commit**

```bash
git add components/layout/LangToggle.tsx components/sections/HeroSection.tsx
git commit -m "LangToggle + Hero info block: hard-block styling"
```

---

### Task 5: Recolor the noise ball to electric blue + lime (`components/three/NoiseBlob.tsx`)

Retune the fragment shader's blue ramp from `#0A84FF` to electric `#0033FF` with a lime Fresnel edge, so the travelling ball matches the new palette.

**Files:**
- Modify: `components/three/NoiseBlob.tsx` (fragment shader)

**Interfaces:** visual only; no API change.

- [ ] **Step 1: Swap the blue constants + lime rim**

In the fragment shader's pure-blue ramp block, replace the four blue constants with the electric palette:
```glsl
    vec3 blueDeep = vec3(0.000, 0.102, 0.502);   // #001A80
    vec3 blueMid  = vec3(0.000, 0.200, 1.000);   // #0033FF
    vec3 blueLite = vec3(0.541, 0.647, 1.000);   // #8AA5FF
    vec3 hiBlue   = vec3(0.000, 0.761, 1.000);   // #00C2FF (cyan highlight)
```
Then change the Fresnel rim so the very edge flashes acid lime. Replace the fresnel line with:
```glsl
    // Fresnel edge — cyan→lime acid flash at grazing angles
    float F = schlick(NdotV, 0.42);
    vec3 lime = vec3(0.800, 1.000, 0.000);       // #CCFF00
    vec3 fresnel = mix(mix(blueLite, hiBlue, F), lime, F * F) * F * 1.0;
```
Leave the geometry, lights, specular, `uOpacity`, and `vLocalY` logic unchanged.

- [ ] **Step 2: Typecheck & lint**

Run: `npx tsc --noEmit ; npm run lint`
Expected: clean.

- [ ] **Step 3: Visual verification (manual)**

Reload; confirm the journey ball is now electric blue (`#0033FF` core, cyan highlights) with a lime-flashing edge; no old soft `#0A84FF`.

- [ ] **Step 4: Commit**

```bash
git add components/three/NoiseBlob.tsx
git commit -m "Recolor noise ball to electric blue + lime rim"
```

---

### Task 6: Remove the glass utility + dormant toggle wiring (cleanup)

With all consumers migrated, delete the `.glass`/`.glass-pill` utilities and confirm nothing references them or `.dark`.

**Files:**
- Modify: `app/globals.css`
- Verify: no component references `glass`, `glass-pill`, or `.dark`.

**Interfaces:** none (removal).

- [ ] **Step 1: Remove the glass utilities**

In `app/globals.css`, delete the `.glass, .glass-pill { … }` block, the `.dark .glass, .dark .glass-pill { … }` block, and the `@media (prefers-reduced-transparency: reduce)` glass fallback block.

- [ ] **Step 2: Grep for leftovers**

Run: `git grep -n "glass-pill\|className=\"glass\|\.dark " -- components app` (PowerShell: `git grep -n "glass" -- components app`).
Expected: no `className="glass"` / `"glass-pill"` usages remain (only the design-doc/spec mentions, which are fine). If any component still references them, migrate it to `.hard-block` before proceeding.

- [ ] **Step 3: Typecheck, lint & visual verification**

Run: `npx tsc --noEmit ; npm run lint` (expect clean). Reload; confirm nothing lost its styling (no unstyled ghost elements) and the site is fully hard-block, single bright theme.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "Remove glass utilities (all chrome migrated to hard-block)"
```

---

## Notes

- The dormant `ThemeToggle.tsx` and `WebcamToggle.tsx` component files are no longer imported after this phase; leave them in the tree (a later cleanup can delete them once confirmed unused everywhere).
- `hero-stage` and `ambient-glow` are soft-glow backdrops that read slightly un-Bauhaus; they inherit the electric-blue recolor here but a Phase B decision may replace them with hard geometric motifs. Out of scope for Phase A.
- Phase B (home-section Bauhaus/acid motifs + card numbering) and Phase C (other pages) are separate plans.
