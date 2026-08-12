# Y2K × Acid × Bauhaus — Phase B Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the home-page sections (Hero finish, About/ProfileSection, home Projects accordion, Marquee, DanceTeaser, Footer) into the Y2K×Acid×Bauhaus language established in Phase A — hard-edge blocks, thick ink rules, mono labels, uppercase Syne headings, layered electric blues + lime accents, and purge the last blue-gray cover colours.

**Architecture:** Each section swaps soft/rounded/blue-gray styling for the Phase-A design system (`--color-ink`, `--color-accent` #0033FF, layered blue tokens, `--color-acid`, `.mono-label`, hard offset shadows, sharp corners). Shared project cover colours move to the new blue palette in `lib/payload.ts` + the placeholder arrays.

**Tech Stack:** Next.js 15, plain CSS/inline styles, GSAP (existing). No new dependencies.

## Global Constraints

- Design source of truth: `docs/superpowers/specs/2026-08-06-y2k-acid-bauhaus-redesign-design.md`. Builds on Phase A (tokens, `.hard-block`, `.mono-label` already exist).
- **Palette:** electric blue `#0033FF` accent; layered blues deep `#001A80` / mid `#3D6BFF` / light `#8AA5FF` / pale `#DCE4FF` / cyan `#00C2FF`; acid lime `#CCFF00` (only acid). Ink `#0A0A0A`, white `#FFFFFF`.
- **a11y:** lime/cyan/pale blocks → black (`ink`) text; primary/deep/mid blue blocks → white text; all text WCAG AA. Blue `#0033FF` text on white is fine (≈9:1).
- **Shape lock:** sharp corners (radius 0); hard offset shadows (`Npx Npx 0`), never blurred; no `backdrop-filter`.
- **Motion:** transform/opacity only; respect `prefers-reduced-motion` (existing GSAP + reduce checks stay).
- Single bright theme (no dark mode). Do NOT touch i18n keys, routing, Payload schema.
- No blue-gray hex (`#1B3550`, `#122333`, `#254A64`, `#0D1B2A`, `#5C82A0`, `#8AAABF`, `rgba(92,130,160,…)`, `#060d15`) may remain after this phase.

---

### Task 1: Move project cover colours to the blue palette (`lib/payload.ts`, `ProjectsSection.tsx`, `WorkPage.tsx`)

Replace the blue-gray cover colours in the Payload mapper and the two placeholder arrays with electric/layered blues, so previews and any coverColor-driven UI are on-palette.

**Files:**
- Modify: `lib/payload.ts` (the `COLORS` array used for seeded `coverColor`)
- Modify: `components/sections/ProjectsSection.tsx` (`PLACEHOLDER_PROJECTS` coverColors + the preview card)
- Modify: `components/sections/WorkPage.tsx` (`PLACEHOLDER_PROJECTS` coverColors)

**Interfaces:** none (data + one style).

- [ ] **Step 1: Repoint `lib/payload.ts` COLORS**

Open `lib/payload.ts`, find the `COLORS` array (blue-gray seed colours) and replace its values with the blue palette, e.g.:
```ts
const COLORS = ['#0033FF', '#001A80', '#3D6BFF', '#8AA5FF', '#00C2FF', '#DCE4FF']
```
(Keep the array's usage/length logic unchanged.)

- [ ] **Step 2: Repoint placeholder coverColors**

In `ProjectsSection.tsx` and `WorkPage.tsx`, change each `PLACEHOLDER_PROJECTS` item's `coverColor` from the blue-gray hex to a blue-palette value (cycle `#0033FF / #001A80 / #3D6BFF / #8AA5FF / #00C2FF / #DCE4FF`).

- [ ] **Step 3: Fix the ProjectsSection preview card fill**

In `ProjectsSection.tsx`, the portaled preview card uses `radial-gradient(ellipse …, ${proj.coverColor}, #060d15)` (dark). Change it to a solid on-palette block: `background: proj.coverColor` (a flat blue block). Also make the preview card a hard block: `borderRadius: 0`, `border: '2px solid var(--color-ink)'`, `boxShadow: '6px 6px 0 var(--color-ink)'` (remove the soft `0 12px 40px` shadow and the `color-mix` border). The bottom title gradient `rgba(0,0,0,0.55)` → keep a legible label (white on the blue block; if the block is a light blue like `#DCE4FF`, use ink — simplest: keep the title on a solid `var(--color-ink)` strip with white text).

- [ ] **Step 4: Typecheck, lint & visual verification**

Run: `npx tsc --noEmit ; npm run lint` (expect clean). Grep no blue-gray remains: `git grep -n "1B3550\|122333\|254A64\|0D1B2A\|060d15" -- lib components` → none. Reload home + /work; previews/cards read as flat blue blocks.

- [ ] **Step 5: Commit**

```bash
git add lib/payload.ts components/sections/ProjectsSection.tsx components/sections/WorkPage.tsx
git commit -m "Move project cover colours to electric/blue palette"
```

---

### Task 2: Hero Bauhaus finish (`components/sections/HeroSection.tsx`)

Finish the Hero: uppercase heavy "Ray", a mono eyebrow inside the info block, and one Bauhaus geometric motif (a flat shape) for structure.

**Files:**
- Modify: `components/sections/HeroSection.tsx`

- [ ] **Step 1: Uppercase the "Ray" headline + eyebrow to mono**

The `<h1>Ray</h1>` — add `textTransform: 'uppercase'` (already heavy Syne). The info-block eyebrow `<p>{t('role')}</p>` — give it `className="mono-label"` (drop the inline color/letterSpacing that duplicate it; keep it electric blue via the class). Keep the tagline and CTA.

- [ ] **Step 2: Add one Bauhaus geometric motif**

Inside the `<section>`, add ONE flat geometric decoration behind/beside the text (sharp, on-palette), e.g. a lime square or an electric-blue circle with a thick ink border, absolutely positioned, `zIndex: 1`, `pointerEvents: 'none'`. Example:
```tsx
      <div aria-hidden style={{
        position: 'absolute', zIndex: 1, pointerEvents: 'none',
        right: 'clamp(24px, 8vw, 120px)', top: '22%',
        width: 'clamp(60px, 8vw, 120px)', height: 'clamp(60px, 8vw, 120px)',
        background: 'var(--color-acid)', border: '2px solid var(--color-ink)',
        transform: 'rotate(-8deg)',
      }} />
```
(Adjust position so it doesn't collide with the text/ball; this is a tunable decorative accent.)

- [ ] **Step 2b: Typecheck, lint & visual verification**

Run: `npx tsc --noEmit ; npm run lint`. Reload; "RAY" is uppercase, eyebrow is mono electric-blue, a sharp lime/blue geometric shape adds Bauhaus structure without covering the text.

- [ ] **Step 3: Commit**

```bash
git add components/sections/HeroSection.tsx
git commit -m "Hero: uppercase headline, mono eyebrow, bauhaus motif"
```

---

### Task 3: ProfileSection (About) → hard-edge Bauhaus (`components/sections/ProfileSection.tsx`)

Make the photo a hard block, the "About Me" eyebrow a mono label, and add a geometric accent.

**Files:**
- Modify: `components/sections/ProfileSection.tsx`

- [ ] **Step 1: Photo frame → hard block**

The photo wrapper (the `aspectRatio: 4/5` div, `borderRadius: '16px'`, `border: 1px solid var(--color-border)`) → `borderRadius: 0`, `border: '2px solid var(--color-ink)'`, add `boxShadow: '8px 8px 0 var(--color-accent)'`. Keep the `position: sticky` outer wrapper and the parallax image.

- [ ] **Step 2: Eyebrow → mono; accent stays electric**

The `<p>About Me</p>` eyebrow → `className="mono-label"` (drop duplicate inline color/spacing; the class gives electric-blue mono). The fill-text `.fill-word` spans keep their scroll-fill; their lit colour is `var(--color-text-primary)` (ink) which is correct on white.

- [ ] **Step 3: (optional) geometric accent**

Optionally add a small flat circle/triangle (`var(--color-accent)` or lime, thick ink border, sharp) near the photo for Bauhaus structure — same pattern as Hero Task 2, tunable.

- [ ] **Step 4: Typecheck, lint & visual verification**

Run: `npx tsc --noEmit ; npm run lint`. Reload; photo is a sharp block with a hard blue shadow, "ABOUT ME" is mono.

- [ ] **Step 5: Commit**

```bash
git add components/sections/ProfileSection.tsx
git commit -m "ProfileSection: hard-block photo, mono eyebrow"
```

---

### Task 4: Home Projects accordion → Bauhaus (`components/sections/ProjectsSection.tsx`)

Restyle the accordion: thick ink rules, mono numbers, uppercase Syne titles, electric-blue active state, and a chunky arrow. (Preview card already handled in Task 1.)

**Files:**
- Modify: `components/sections/ProjectsSection.tsx`

- [ ] **Step 1: Heading block**

Eyebrow `<p>{t('eyebrow')}</p>` → `className="mono-label"` with a `{'// '}` prefix (use `{'// '}{t('eyebrow')}` to avoid the JSX comment-node lint error). Heading `<h2>` → add `textTransform: 'uppercase'`.

- [ ] **Step 2: Accordion rules + rows**

- `.acc-list` `borderTop: '1px solid var(--color-border)'` → `'2px solid var(--color-ink)'`.
- Each row `borderBottom` → `'2px solid var(--color-ink)'`.
- The row number `0{i+1}` span → `className="mono-label"` (mono, electric blue), or wrap as `[0{i+1}]`.
- Active row title colour stays `var(--color-accent)` (now electric); add `textTransform: 'uppercase'` to the title `<h3>`. Active `translateX(12px)` stays.
- The arrow `<svg>` strokeWidth `1.8` → `2.4` (chunkier); active stroke `var(--color-accent)`.
- Optional acid touch: on the active row, show a small lime square marker before the number.

- [ ] **Step 3: Typecheck, lint & visual verification**

Run: `npx tsc --noEmit ; npm run lint` (watch for the `//` JSX-comment lint rule — use the `{'// '}` form). Reload; accordion has thick ink rules, mono `[0N]` numbers, uppercase titles, electric-blue hover.

- [ ] **Step 4: Commit**

```bash
git add components/sections/ProjectsSection.tsx
git commit -m "Home projects accordion: bauhaus rules, mono numbers, uppercase"
```

---

### Task 5: Marquee + DanceTeaser + Footer → Bauhaus (`Marquee.tsx`, `DanceTeaser.tsx`, `Footer.tsx`)

Final home chrome: sharpen the marquee, make dance thumbnails hard blocks, and turn the footer into a bold Bauhaus block.

**Files:**
- Modify: `components/ui/Marquee.tsx`
- Modify: `components/sections/DanceTeaser.tsx`
- Modify: `components/layout/Footer.tsx`

- [ ] **Step 1: Marquee**

In `Marquee.tsx`: the per-item colour alternation — change the `i % 3 === 1 ? 'var(--color-accent)' : 'var(--color-text-muted)'` so every 3rd word is electric blue and the rest are ink (`var(--color-ink)`) at full opacity (drop the `0.32` fade → `1`) for a bold Bauhaus band; change the round dot separator (`borderRadius: '9999px'`) to a sharp square (`borderRadius: 0`) filled `var(--color-acid)`. Keep the velocity skew (it's already Y2K). Add `textTransform: 'uppercase'` if not already.

- [ ] **Step 2: DanceTeaser**

In `DanceTeaser.tsx`: section `borderTop: '1px solid var(--color-border)'` → `'2px solid var(--color-ink)'`; keep `backgroundColor: var(--color-surface)`. Eyebrow → `className="mono-label"`. Heading `<h2>` → `textTransform: 'uppercase'`. Each `.dance-thumb` → `borderRadius: 0`, `border: '2px solid var(--color-ink)'`, add `boxShadow: '4px 4px 0 var(--color-accent)'`, drop the `opacity`/`scale` stagger fade to full (or keep a subtle offset). CTA `<Link>` → make it a hard-block button (sharp, `border: 2px solid var(--color-ink)`, `background: var(--color-accent)`, white mono uppercase text, hard shadow) OR a mono uppercase underline in electric blue; keep hover.

- [ ] **Step 3: Footer**

In `Footer.tsx`: `borderTop: '1px solid var(--color-border)'` → `'2px solid var(--color-ink)'`; `backgroundColor: var(--color-surface)` → keep or switch to a bold electric-blue block (`var(--color-accent)` with white text) for a strong Bauhaus close — pick one and keep AA (if blue block, all footer text/links become white/lime). Make the email large + mono uppercase; `FooterLink` labels → mono uppercase, hover to `var(--color-acid)` (if on blue block) or `var(--color-accent)` (if on surface). The `©` line → mono, muted.

- [ ] **Step 4: Typecheck, lint & visual verification**

Run: `npx tsc --noEmit ; npm run lint` (expect clean). Reload; marquee is a bold ink/blue band with lime square separators, dance thumbnails are sharp blocks with hard shadows, footer is a strong Bauhaus close. All text AA.

- [ ] **Step 5: Commit**

```bash
git add components/ui/Marquee.tsx components/sections/DanceTeaser.tsx components/layout/Footer.tsx
git commit -m "Marquee + DanceTeaser + Footer: bauhaus hard-edge styling"
```

---

## Notes

- `hero-stage` and `ambient-glow` remain soft-glow backdrops (recolored electric in Phase A). If they read too un-Bauhaus once sections land, a follow-up can swap them for flat geometric shapes — out of scope here.
- Phase C (about / dance / project-detail pages) is a separate plan.
- After Phase B, do a full-branch grep for any remaining blue-gray or `border-radius` on chrome to confirm the shape/colour locks hold.
