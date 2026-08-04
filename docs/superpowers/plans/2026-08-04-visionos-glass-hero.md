# visionOS Glass + Pure-Blue Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retheme the portfolio to an Apple visionOS "liquid glass" language — a pure-blue (#0A84FF) glowing noise ball, a single blue accent locked site-wide, and frosted-glass floating chrome (nav + toggles + a hero info island) — while keeping both light and dark themes.

**Architecture:** Design tokens and a reusable `.glass` utility live in `app/globals.css`; each floating-chrome component consumes them. The noise ball's fragment shader is retuned from rainbow iridescence to a pure-blue ramp with a bright Fresnel edge. Content sections are untouched and inherit the new accent through CSS variables.

**Tech Stack:** Next.js 15, Tailwind v4 (CSS-first `@theme`), React Three Fiber / GLSL, plain CSS custom properties. No new dependencies.

## Global Constraints

- **One blue, locked site-wide:** accent is `#0A84FF`. Light `--color-accent-hover: #0060DF`; dark `--color-accent-hover: #409CFF`. No other accent color may appear anywhere.
- **Pure-blue scale (verbatim hex):** deep `#001B3D`, primary `#0A84FF`, light `#5AB0FF`, highlight `#EAF4FF`.
- **Glass only on floating chrome:** Navbar, LangToggle, ThemeToggle, WebcamToggle, the Hero info island. `backdrop-filter` must NOT appear on any scrolling content area.
- **Both themes:** every glass/color value has a light AND a dark variant. Themes do not invert mid-page.
- **Shape lock:** glass panels use squircle radius `1.5rem` (24px); interactive glass buttons use pill `9999px`.
- **No postprocessing:** blob glow is CSS halo + shader Fresnel only. Do NOT add `@react-three/postprocessing` or any dep.
- **a11y:** `@media (prefers-reduced-transparency: reduce)` → glass becomes solid (`--color-surface`), blur removed. Preserve existing `prefers-reduced-motion` handling and all `aria-*` / keyboard behavior. Text/icons on glass meet WCAG AA (4.5:1 body, 3:1 large).
- **Motion:** animate only `transform` / `opacity`.
- Do NOT touch content sections (Projects, Dance, About, Footer, WorkPage, ProjectDetail), i18n, routing, Payload, or the noise-blob perf work. They inherit the new accent via tokens only.

---

### Task 1: Color tokens + `.glass` utility + blue glows (`app/globals.css`)

The foundation every other task consumes. Swap the blue-gray accent tokens for pure blue, retint the hardcoded ambient-glow blobs and `--shadow-accent`, add the pure-blue scale, and define the reusable `.glass` utility with a `prefers-reduced-transparency` solid fallback. `hero-stage` already uses `color-mix(--color-accent …)` so it re-tints automatically.

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: nothing.
- Produces (later tasks rely on these):
  - CSS custom properties `--color-accent`, `--color-accent-hover`, `--color-link`, `--color-link-hover`, `--color-shadow-accent` re-valued to blue in both `:root` and `.dark`.
  - Pure-blue scale vars on `@theme`: `--color-blue-50/300/400/500/700`.
  - Utility classes: `.glass` (squircle panel) and `.glass-pill` (pill button), each themed for light/dark with reduced-transparency fallback.

- [ ] **Step 1: Retint the `@theme` blue scale + accent shadow**

In `app/globals.css`, replace the `Blue-Gray Accent` block (lines 21-28) with the pure-blue scale:
```css
  /* ─── Pure Blue Accent (#0A84FF) ──────────────── */
  --color-blue-50:  #EAF4FF;
  --color-blue-300: #5AB0FF;
  --color-blue-400: #0A84FF;
  --color-blue-500: #0060DF;
  --color-blue-700: #001B3D;
```
And replace the `--shadow-accent` line (line 47) with:
```css
  --shadow-accent: 0 0 24px rgba(10,132,255,0.35);
```

- [ ] **Step 2: Repoint the light + dark semantic accent tokens**

Replace the light-mode accent lines (`:root`, lines 61-66) with:
```css
  --color-accent:       #0A84FF;
  --color-accent-hover: #0060DF;
  --color-link:         #0A84FF;
  --color-link-hover:   #0060DF;

  --color-shadow-accent: rgba(10,132,255,0.28);
```
Replace the dark-mode accent lines (`.dark`, lines 80-85) with:
```css
  --color-accent:       #0A84FF;
  --color-accent-hover: #409CFF;
  --color-link:         #0A84FF;
  --color-link-hover:   #409CFF;

  --color-shadow-accent: rgba(10,132,255,0.40);
```

- [ ] **Step 3: Retint the hardcoded ambient-glow blobs to pure blue**

The `.ambient-glow-*` blobs (lines 175-192) hardcode blue-gray rgba. Replace their three `background` values with pure-blue equivalents:
```css
.ambient-glow-a { /* keep size/pos/animation */ background: radial-gradient(circle, rgba(10,132,255,0.42), transparent 70%); }
.ambient-glow-b { background: radial-gradient(circle, rgba(0,96,223,0.36), transparent 70%); }
.ambient-glow-c { background: radial-gradient(circle, rgba(90,176,255,0.28), transparent 70%); }
```
(Only change the `background` gradient color inside each rule; leave width/height/position/animation intact.)

- [ ] **Step 4: Add the `.glass` and `.glass-pill` utilities**

Append to `app/globals.css` (after the hero-stage block is fine — anywhere at top level):
```css
/* ─── visionOS liquid-glass (approximation; no official Apple web API) ─── */
.glass, .glass-pill {
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  background: rgba(255, 255, 255, 0.60);
  border: 1px solid rgba(255, 255, 255, 0.70);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.55),
    0 8px 32px var(--color-shadow-accent);
}
.glass      { border-radius: 1.5rem; }
.glass-pill { border-radius: 9999px; }

.dark .glass, .dark .glass-pill {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.15),
    0 8px 32px var(--color-shadow-accent);
}

/* a11y: solid fallback when the OS asks to reduce transparency */
@media (prefers-reduced-transparency: reduce) {
  .glass, .glass-pill,
  .dark .glass, .dark .glass-pill {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    background: var(--color-surface);
    border-color: var(--color-border);
  }
}
```

- [ ] **Step 5: Visual verification (manual)**

Run: `npm run dev` (a server may already be running on port 3100). Open the home page. Confirm:
1. Every accent (nav active underline, links, focus states) is now pure blue, not blue-gray, in BOTH light and dark (toggle theme).
2. The hero backlight glow and ambient blobs read blue.
3. No blue-gray (`#5C82A0` / `#8AAABF`) remains anywhere — search the rendered page.

Fix any leftover blue-gray before committing.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css
git commit -m "Retheme tokens to pure blue + add liquid-glass utility"
```

---

### Task 2: Noise ball → pure blue + Fresnel glow (`components/three/NoiseBlob.tsx`)

The current fragment shader produces a rainbow iridescent (blue→violet→magenta→cyan) oil-slick via an Inigo-Quilez cosine palette. Replace that palette and the derived sheen/fresnel with a **pure-blue ramp** (deep→primary→light) and a **bright blue-white Fresnel edge**, so the blob reads as one glowing blue orb. Keep the geometry, lighting positions, specular structure, and all uniforms unchanged.

**Files:**
- Modify: `components/three/NoiseBlob.tsx` (fragment shader, ~lines 162-222)

**Interfaces:**
- Consumes: existing shader varyings (`vNoise`, `vWorldPos`, `vNormal`, `vViewDir`) and uniforms (`uTime`, `uMouse`) — unchanged.
- Produces: no API change; visual only.

- [ ] **Step 1: Replace the iridescent palette + assembly with a pure-blue ramp**

In `components/three/NoiseBlob.tsx`, replace the block from the `// ── Iridescent flowing palette` comment through the `color = pow(color, vec3(0.92));` line (approximately lines 162-222) with:
```glsl
    // ── Pure-blue ramp (no hue cycling) ──────────────────────────
    float t = clamp((vNoise + 1.0) * 0.5, 0.0, 1.0);

    // bounded shading coordinate + gentle time shimmer (stays in blue)
    float b = t * 0.70
            + (vWorldPos.y * 0.15 + 0.5) * 0.25
            + (1.0 - NdotV) * 0.20
            + sin(uTime * 0.3 + vWorldPos.x * 2.0) * 0.05;
    b = clamp(b, 0.0, 1.0);

    vec3 blueDeep = vec3(0.000, 0.106, 0.239);   // #001B3D
    vec3 blueMid  = vec3(0.039, 0.518, 1.000);   // #0A84FF
    vec3 blueLite = vec3(0.353, 0.690, 1.000);   // #5AB0FF
    vec3 hiBlue   = vec3(0.918, 0.957, 1.000);   // #EAF4FF

    vec3 albedo = mix(blueDeep, blueMid, smoothstep(0.0, 0.6, b));
    albedo      = mix(albedo,  blueLite, smoothstep(0.55, 1.0, b));

    // ── Diffuse ──────────────────────────────────────────────────
    vec3 diffuse = albedo * (NdotL1*0.22 + NdotL2*0.12 + NdotL3*0.08);

    // ── Specular — blue-white sheen ──────────────────────────────
    float s1 = spec(N, L1pos, V, 300.0) * NdotL1;
    float s2 = spec(N, L1pos, V,  56.0) * NdotL1 * 0.30;
    float s3 = spec(N, L2pos, V, 160.0) * NdotL2 * 0.55;
    float s4 = spec(N, L3pos, V,  90.0) * NdotL3 * 0.32;
    vec3 sheen    = mix(blueLite, hiBlue, 0.5);
    vec3 specular = hiBlue*(s1+s2) + sheen*(s3+s4);

    // ── Fresnel rim — bright blue-white glowing edge ─────────────
    float F = schlick(NdotV, 0.42);
    vec3 fresnel = mix(blueLite, hiBlue, F) * F * 0.95;

    // ── Fake environment reflection ──────────────────────────────
    vec3 R    = reflect(-V, N);
    float env = pow(max(R.y*0.5+0.5, 0.0), 2.5) * 0.18;
    env      += pow(max(-R.y*0.5+0.5, 0.0), 3.0) * 0.06;

    // ── Ambient occlusion ────────────────────────────────────────
    float ao = clamp(t*0.6 + 0.4, 0.0, 1.0);

    // ── Assemble ─────────────────────────────────────────────────
    vec3 color = albedo * (0.55 + 0.45 * ao)
               + diffuse
               + specular
               + fresnel
               + albedo * env;

    color = pow(color, vec3(0.92));
```
(Leave everything above the palette comment — lights `L1pos/L2pos/L3pos`, `NdotL*`, `N`, `V`, `NdotV` — and the final `gl_FragColor = vec4(color, 1.0);` unchanged. This removes the `pa/pb/pc/pd` cosine palette, the `flow` variable, `albedoDeep`, `rimHue`, `specWhite`, and the saturation-lift entirely.)

- [ ] **Step 2: Typecheck & lint**

Run (PowerShell, `;` chaining): `npx tsc --noEmit ; npm run lint`
Expected: clean (no new errors in `NoiseBlob.tsx`).

- [ ] **Step 3: Visual verification (manual)**

Reload the home page. Confirm:
1. The blob is now a single glowing **blue** orb (deep blue core → bright #0A84FF → light edge) with NO violet/magenta/cyan hue anywhere.
2. The rim/edge glows blue-white (Fresnel).
3. Mouse movement still deforms it; light/dark both look right.

- [ ] **Step 4: Commit**

```bash
git add components/three/NoiseBlob.tsx
git commit -m "Retune noise ball shader to pure blue with Fresnel glow"
```

---

### Task 3: Navbar → floating glass island (`components/layout/Navbar.tsx`)

Convert the full-width sticky bar into a detached, centered glass pill (fluid island), using the `.glass-pill` utility. Preserve all existing logic: scroll-condense, logo-name fade, desktop links, hamburger, and the full-screen mobile menu.

**Files:**
- Modify: `components/layout/Navbar.tsx` (the `<header>` and inner `<nav>` style props, ~lines 58-78)

**Interfaces:**
- Consumes: `.glass-pill` from Task 1.
- Produces: no API change.

- [ ] **Step 1: Make the header a transparent positioning layer**

Replace the `<header>`'s inline `style` (lines 60-72) with a minimal sticky wrapper that carries NO background/blur/border of its own (the island does that):
```tsx
        style={{
          position: 'sticky', top: 0, zIndex: 50,
          padding: '0 16px',
          pointerEvents: 'none',   // let the page under the gaps stay interactive
        }}
```
(Keep `className={scrolled ? 'nav-condensed' : ''}` on the header.)

- [ ] **Step 2: Turn the inner `<nav>` into the glass island**

Add `className="glass-pill"` to the `<nav>` and replace its inline `style` (lines 74-78) with:
```tsx
        <nav className="glass-pill" style={{
          pointerEvents: 'auto',
          width: 'max-content', maxWidth: '100%',
          margin: '14px auto 0',
          padding: '8px 10px 8px 18px',
          height: '56px',
          display: 'flex', alignItems: 'center', gap: '8px',
          transition: 'padding 0.35s ease, margin 0.35s ease',
        }}>
```
Because the island is now `width: max-content`, the logo and the desktop-links cluster sit next to each other (no more `justify-content: space-between` across 1200px). Insert a `gap` (already added) so they breathe. Leave the Logo `<Link>`, the `nav-links-desktop` div, and the hamburger button markup unchanged.

- [ ] **Step 3: Restyle the desktop Download-CV pill to match**

In the desktop links cluster, the Download-CV `<a>` (lines 95-101) currently uses a squared `borderRadius: '6px'`. Change its `borderRadius` to `'9999px'` and its `border` to `'1px solid var(--color-accent)'` with `color: 'var(--color-accent)'` so it reads as the primary pill CTA. Leave the NavLink items as text.

- [ ] **Step 4: Typecheck, lint & visual verification**

Run: `npx tsc --noEmit ; npm run lint` (expect clean). Then reload and confirm:
1. The nav is a floating glass pill detached from the top edge, centered, hugging its content — in both light and dark.
2. Scrolling past the hero still condenses it (logo name collapses); the pill stays single-line on desktop.
3. Mobile (< 768px): hamburger shows inside the pill; the full-screen menu still opens/closes and animates.
4. Under `prefers-reduced-transparency`, the pill is solid (no blur).

- [ ] **Step 5: Commit**

```bash
git add components/layout/Navbar.tsx
git commit -m "Convert navbar to floating glass island"
```

---

### Task 4: Toggles → glass buttons (`ThemeToggle`, `LangToggle`, `WebcamToggle`)

Restyle the three control buttons to the glass language and purge the last hardcoded blue-gray. `LangToggle` and `ThemeToggle` already read `--color-accent` (auto-blue); they just need the glass shell. `WebcamToggle` hardcodes `#5C82A0` — replace with pure blue.

**Files:**
- Modify: `components/layout/ThemeToggle.tsx` (button style, lines 26-38 + hover handlers)
- Modify: `components/ui/WebcamToggle.tsx` (button style + status-dot color, lines 41-69)
- Modify: `components/layout/LangToggle.tsx` (wrap in a small glass shell, lines 16)

**Interfaces:**
- Consumes: `.glass-pill` from Task 1.
- Produces: no API change.

- [ ] **Step 1: ThemeToggle → glass round button**

In `ThemeToggle.tsx`, add `className="glass-pill"` to the `<button>` and change its inline `style` so it no longer sets its own `border`/`background` (the class provides them). Replace the style object (lines 26-38) with:
```tsx
      className="glass-pill"
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '40px', height: '40px',
        background: 'transparent',   // overridden by .glass-pill; kept for the a11y solid fallback contrast
        color: 'var(--color-text-secondary)',
        cursor: 'pointer',
        transition: 'color 0.15s',
      }}
```
Remove the `border`-color mutation from the hover handlers (lines 39-48) — keep only the `color` change to `var(--color-text-primary)` on enter and back to `var(--color-text-secondary)` on leave. (Do not set `borderColor` since the glass border is now owned by the class.)

- [ ] **Step 2: WebcamToggle → glass + pure-blue dot**

In `WebcamToggle.tsx`, add `className="glass-pill"` to the `<button>` and drop the self-set `border`/`background`/`backdropFilter` from its style (the class owns them). Replace the style object (lines 41-56) with:
```tsx
      className="glass-pill"
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 16px',
        color: 'var(--color-text-primary)',
        fontSize: '13px', fontWeight: 500,
        cursor: loading ? 'wait' : 'pointer',
        transition: 'transform 0.15s',
      }}
```
Change the hover handlers (lines 57-58) to a tactile press instead of border-color: on enter `e.currentTarget.style.transform = 'translateY(-1px)'`, on leave `e.currentTarget.style.transform = 'translateY(0)'`. Then replace the status-dot's blue-gray (lines 65-66) with pure blue:
```tsx
        backgroundColor: active ? '#0A84FF' : 'var(--color-text-muted)',
        boxShadow: active ? '0 0 8px 2px rgba(10,132,255,0.7)' : 'none',
```

- [ ] **Step 3: LangToggle → glass shell**

In `LangToggle.tsx`, add `className="glass-pill"` to the wrapping `<div>` (line 16) and give it padding so the pill has body:
```tsx
    <div className="glass-pill" style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '13px', fontWeight: 500, padding: '8px 12px' }}>
```
Leave the per-locale `<button>`s unchanged (the active one already uses `var(--color-accent)`, now blue).

- [ ] **Step 4: Typecheck, lint & visual verification**

Run: `npx tsc --noEmit ; npm run lint` (expect clean). Reload and confirm, in light AND dark:
1. All three controls read as frosted-glass pills.
2. The webcam status dot is pure blue when active (no blue-gray); the button lifts slightly on hover.
3. Text/icon contrast on the glass is legible (AA) in both themes.
4. Keyboard focus and `aria-label`/`aria-pressed` still work.

- [ ] **Step 5: Commit**

```bash
git add components/layout/ThemeToggle.tsx components/ui/WebcamToggle.tsx components/layout/LangToggle.tsx
git commit -m "Restyle toggles to glass; purge last blue-gray"
```

---

### Task 5: Hero → blue glow layer + glass info island (`components/sections/HeroSection.tsx`)

Add a pure-blue radial halo behind the canvas so the orb reads as a light source, and move the eyebrow + tagline + a Download-CV CTA into a floating glass info island offset to one side. The large "Ray" headline stays free-floating (not boxed).

**Files:**
- Modify: `components/sections/HeroSection.tsx` (`HeroText` component + the hero layout, lines 12-51 and 122-165)
- Modify: `messages/zh.json`, `messages/en.json` (add `hero.downloadCV`)

**Interfaces:**
- Consumes: `.glass` from Task 1; existing `NoiseBlobScene`, `ParticleCursor`, `WebcamToggle`, GSAP parallax — unchanged.
- Produces: no API change.

Note: the `hero` namespace currently has only `role` and `tagline` (verified in `messages/en.json` / `zh.json`) — no `downloadCV`. Add it (Step 0) before using `t('downloadCV')`.

- [ ] **Step 0: Add the `hero.downloadCV` i18n key**

In `messages/en.json`, inside the `"hero"` object, add `"downloadCV": "Download CV"`. In `messages/zh.json`, inside its `"hero"` object, add `"downloadCV": "下載 CV"`. (Match the existing formatting/trailing commas in each file.)

- [ ] **Step 1: Add a blue halo layer behind the canvas**

In `HeroSection.tsx`, inside the `<section>`, immediately BEFORE the existing `<div className="hero-stage" />` (line 123), add a halo element that centers behind the orb:
```tsx
      {/* Blue halo — makes the orb read as a light source */}
      <div aria-hidden style={{
        position: 'absolute', zIndex: 0, pointerEvents: 'none',
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 'min(90vw, 900px)', height: 'min(90vw, 900px)',
        background: 'radial-gradient(circle, var(--color-shadow-accent) 0%, transparent 60%)',
        filter: 'blur(40px)',
      }} />
```
(The `hero-stage` already re-tinted to blue in Task 1; this halo adds the concentrated central glow. It is a fixed, non-scrolling element so the blur is perf-safe.)

- [ ] **Step 2: Restructure `HeroText` into a free headline + glass info island**

Replace the `HeroText` component (lines 12-51) with a version that keeps "Ray" free and wraps the eyebrow, tagline, and a Download-CV CTA in a `.glass` island:
```tsx
function HeroText() {
  const t = useTranslations('hero')
  return (
    <>
      <h1 style={{
        fontFamily: 'var(--font-syne), ui-sans-serif',
        fontSize: 'clamp(48px, 7vw, 96px)',
        fontWeight: 700, lineHeight: 1.0, letterSpacing: '-0.03em',
        color: 'var(--color-text-primary)', margin: 0,
        textShadow: '0 2px 24px rgba(0,0,0,0.35)',
      }}>
        Ray
      </h1>

      <div className="glass" style={{
        marginTop: '24px', maxWidth: '380px',
        padding: '20px 22px',
        display: 'flex', flexDirection: 'column', gap: '12px',
      }}>
        <p style={{
          fontFamily: 'var(--font-syne), ui-sans-serif',
          fontSize: 'clamp(12px, 1.1vw, 14px)', fontWeight: 500,
          letterSpacing: '0.15em', textTransform: 'uppercase',
          color: 'var(--color-accent)', margin: 0,
        }}>
          {t('role')}
        </p>
        <p style={{
          fontSize: 'clamp(14px, 1.2vw, 16px)', lineHeight: 1.6,
          color: 'var(--color-text-secondary)', margin: 0,
        }}>
          {t('tagline')}
        </p>
        <a href="/cv.pdf" download style={{
          alignSelf: 'flex-start', marginTop: '4px',
          display: 'inline-flex', alignItems: 'center', gap: '10px',
          padding: '10px 10px 10px 18px', borderRadius: '9999px',
          background: 'var(--color-accent)', color: '#fff',
          fontSize: '14px', fontWeight: 600, textDecoration: 'none',
        }}>
          {t('downloadCV')}
          <span style={{
            width: '28px', height: '28px', borderRadius: '9999px',
            background: 'rgba(255,255,255,0.22)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>↗</span>
        </a>
      </div>
    </>
  )
}
```
`t('downloadCV')` resolves because Step 0 added the key to the `hero` namespace in both locale files.

- [ ] **Step 3: Offset the text block to one side (asymmetric, anti-center)**

The text wrapper `<div ref={textRef}>` (lines 152-163) currently centers content in a `max-width: 1200px` container. Keep that container, but make the inner content left-aligned and constrained so the glass island sits on the left third, not spanning full width — the container already left-aligns by default; confirm the `HeroText` block does not stretch full width (the island's `max-width: 380px` handles this). No structural change needed beyond Step 2 if the content is already left-aligned; if it is centered, add `alignItems: 'flex-start'` to the wrapper's style.

- [ ] **Step 4: Typecheck, lint & visual verification**

Run: `npx tsc --noEmit ; npm run lint` (expect clean). Reload and confirm, light AND dark:
1. A blue halo glows behind the orb; the orb reads as a light source (esp. in dark).
2. "Ray" floats large and unboxed; the eyebrow + tagline + Download-CV sit in a frosted-glass island to one side.
3. The Download-CV CTA is a blue pill with a nested arrow circle (button-in-button); text is one line; contrast passes AA.
4. Scroll parallax (blob down, text up/fade) still works; `prefers-reduced-transparency` makes the island solid.
5. Mobile: the island and headline stack cleanly, no horizontal overflow.

- [ ] **Step 5: Commit**

```bash
git add components/sections/HeroSection.tsx messages/zh.json messages/en.json
git commit -m "Add hero blue halo and glass info island"
```

---

## Notes

- The old blue-gray `blue-100/200/600` tokens are removed from `@theme` in Task 1. If `npx tsc`/lint or the build later flags a component still referencing `--color-blue-100/200/600`, grep for `--color-blue-` and repoint those usages to the nearest new blue token — but per the design read, only the accent semantic tokens are expected to be consumed, so this should not occur.
- No unit tests are added: every change is CSS, GLSL, or presentational JSX with no extractable pure logic. Verification is `tsc`/lint plus manual visual review in both themes, as the steps specify.
- If a real image is ever wanted behind the hero glass (taste skill §4.8), that is a separate follow-up; this plan keeps the orb as the hero visual.
