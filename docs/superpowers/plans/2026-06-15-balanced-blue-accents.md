# Balanced Blue Accents Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Distribute the existing electric blue through the landing page without changing its structure or overwhelming the dark-and-cream visual system.

**Architecture:** Extend the inline design system in `index.html` with reusable accent classes, then apply those classes to existing content sections. Validate with the production build and browser screenshots at desktop and mobile widths.

**Tech Stack:** HTML, inline CSS, Tailwind utility classes, Vite

---

### Task 1: Add reusable accent styles

**Files:**
- Modify: `index.html`

- [x] Add blue badge, stage-title, punctuation, panel-rule, hover, membership, news, board, and footer treatments to the existing inline stylesheet.
- [x] Keep the existing hero canvas and portrait color treatment unchanged.

### Task 2: Apply accents to page hierarchy

**Files:**
- Modify: `index.html`

- [x] Add panel accent classes to the goals, community, membership, news, board, and footer sections.
- [x] Wrap a small number of important headline phrases in the reusable accent text class.
- [x] Add semantic classes to benefit rows, news placeholders, and footer links.

### Task 3: Verify

**Files:**
- Test: `index.html`

- [x] Run `npm run build` and require exit code 0.
- [x] Run `git diff --check` and require no whitespace errors.
- [x] Inspect desktop and mobile screenshots in the running Vite site.
- [x] Check browser console logs for new errors.
