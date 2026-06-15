# Animated Hero Constellation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an animated EGDA community constellation to the hero without changing the existing WebGL background or headline animations.

**Architecture:** Implement the visual as a namespaced HTML/SVG layer inside the existing hero section. CSS handles node drift, signal motion, glow, responsive layout, and reduced motion; a small browser script recalculates SVG line endpoints from the animated DOM node positions on each animation frame.

**Tech Stack:** HTML, CSS, SVG, vanilla JavaScript, Vite

---

### Task 1: Add the constellation component

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add namespaced constellation styles**

Add `.hero-constellation*` selectors beside the existing hero animation styles. Include desktop positioning, central and role node treatments, satellite nodes, SVG lines, signal animation, four slow drift keyframes, and a central glow keyframe.

- [ ] **Step 2: Add responsive and reduced-motion rules**

At tablet and mobile widths, move the constellation into normal document flow, reduce its dimensions and node density, and hide selected satellites before role labels. Extend the existing `prefers-reduced-motion` rule so all `.hero-constellation*` animations stop.

- [ ] **Step 3: Add semantic HTML and SVG**

Inside the hero section, wrap the current headline and paragraph in a copy container and add:

```html
<div class="hero-constellation" aria-hidden="true">
  <svg class="hero-constellation-links">...</svg>
  <div class="hero-constellation-core" data-constellation-node="core">EGDA</div>
  <div class="hero-constellation-role ..." data-constellation-node="studios">Studios</div>
  <div class="hero-constellation-role ..." data-constellation-node="talent">Talent</div>
  <div class="hero-constellation-role ..." data-constellation-node="education">Education</div>
  <div class="hero-constellation-role ..." data-constellation-node="partners">Partners</div>
  <span class="hero-constellation-satellite ..."></span>
</div>
```

Keep the existing headline classes and text unchanged.

- [ ] **Step 4: Verify static structure**

Run:

```powershell
npm run build
```

Expected: Vite build succeeds and the existing large-chunk warning may remain.

### Task 2: Keep SVG connections attached to animated nodes

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add line metadata**

Give each SVG line `data-from` and `data-to` attributes matching node IDs. Give the animated signal path its own `data-from` and `data-to`.

- [ ] **Step 2: Add the positioning loop**

Before the existing WebGL script, add a self-contained initializer that:

```js
const constellation = document.querySelector('.hero-constellation');
const links = constellation.querySelectorAll('[data-from][data-to]');

function updateConstellationLinks() {
    const bounds = constellation.getBoundingClientRect();

    links.forEach((link) => {
        const from = constellation.querySelector(`[data-constellation-node="${link.dataset.from}"]`);
        const to = constellation.querySelector(`[data-constellation-node="${link.dataset.to}"]`);
        const fromBounds = from.getBoundingClientRect();
        const toBounds = to.getBoundingClientRect();

        link.setAttribute('x1', fromBounds.left + fromBounds.width / 2 - bounds.left);
        link.setAttribute('y1', fromBounds.top + fromBounds.height / 2 - bounds.top);
        link.setAttribute('x2', toBounds.left + toBounds.width / 2 - bounds.left);
        link.setAttribute('y2', toBounds.top + toBounds.height / 2 - bounds.top);
    });

    requestAnimationFrame(updateConstellationLinks);
}
```

Guard against missing markup and start the loop once. Do not touch the WebGL animation loop.

- [ ] **Step 3: Verify the production build**

Run:

```powershell
npm run build
```

Expected: build succeeds.

### Task 3: Visual and motion verification

**Files:**
- Verify: `index.html`

- [ ] **Step 1: Open the development server**

Run:

```powershell
npm run dev
```

Expected: Vite serves `http://127.0.0.1:5173`.

- [ ] **Step 2: Check desktop**

At 1280x720, confirm the constellation occupies the right side, all four role labels are readable, the `Mission` badge remains clear, and the headline and paragraph do not overlap primary nodes.

- [ ] **Step 3: Check preserved animations**

Confirm the WebGL background still moves and `.hero-title-reveal`, `.hero-title-reveal::before`, and `.hero-title-reveal::after` retain their existing animation names.

- [ ] **Step 4: Check responsive layouts**

At 768px and 390px widths, confirm the constellation becomes an in-flow block, no horizontal overflow appears, role labels remain visible, and only secondary satellites are removed.

- [ ] **Step 5: Check reduced motion**

Emulate `prefers-reduced-motion: reduce` and confirm the constellation is static while remaining visible and legible.

- [ ] **Step 6: Run final checks**

Run:

```powershell
git diff --check
npm run build
```

Expected: no whitespace errors and a successful build.
