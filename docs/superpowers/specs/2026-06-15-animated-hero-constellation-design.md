# Animated Hero Constellation Design

## Goal

Fill the open desktop space beside the hero headline with an animated community network that communicates EGDA's role in connecting Estonia's game development ecosystem.

## Direction

Use a compact "Constellation Core" composition. A stable central `EGDA` node anchors four labeled community roles:

- Studios
- Talent
- Education
- Partners

Smaller unlabeled satellite nodes make the network feel broader without turning the hero into a dense diagram.

## Layout

- Keep the existing headline and supporting paragraph in their current visual hierarchy.
- Position the constellation in the open right side of the hero at desktop widths.
- Keep the network visually separate from the `Mission` badge.
- Allow the hero copy and constellation to overlap only through transparent lines or ambient glow, never through labels or primary nodes.
- On smaller screens, place a reduced constellation in the document flow between the headline and supporting copy.

## Visual Treatment

- Use the existing `--blue`, `--fg`, and dark background colors only.
- Render the central `EGDA` node as the strongest point: blue fill, cream border, cream text, and restrained blue glow.
- Render labeled role nodes as compact dark labels with blue borders and cream uppercase text.
- Connect nodes with fine cream and blue SVG lines.
- Keep satellite nodes small and mostly cream so they support the composition rather than competing with labels.
- Preserve the site's square, technical, brutalist typography and border language.

## Motion

- Keep the central `EGDA` node spatially stable.
- Drift labeled role nodes by only a few pixels over seven-to-nine-second cycles.
- Update connecting lines continuously so they remain attached to moving nodes.
- Animate one bright signal traveling along a connection at a time.
- Give the central node a restrained glow variation rather than a large scale pulse.
- Avoid blinking, rapid movement, random jitter, or simultaneous pulses across every node.
- Stop all constellation motion under `prefers-reduced-motion`, leaving a clean static network.

## Integration

- Add the constellation as its own hero child layer using semantic HTML plus SVG.
- Do not replace or modify the fixed WebGL background animation.
- Do not remove or rewrite the existing headline reveal, scan, particle, or idle animation rules.
- Keep constellation selectors and keyframes namespaced so they cannot collide with existing animation styles.
- Keep the constellation non-interactive and `pointer-events: none`; it is a visual communication element, not navigation.
- Avoid adding dependencies or another canvas renderer.

## Responsive Behavior

- Desktop: show the complete labeled network in the right side of the hero.
- Tablet: reduce the constellation scale and label spacing while preserving all four labeled roles when they fit cleanly.
- Mobile: reduce visual density and motion distance. Hide selected satellite nodes before hiding meaningful role labels.
- At every breakpoint, the headline and supporting paragraph must remain fully readable with no horizontal overflow.

## Verification

- Confirm the current WebGL background still renders and animates.
- Confirm the existing hero headline reveal and recurring scan/particle animations still run.
- Confirm constellation lines stay attached to drifting nodes.
- Confirm no constellation label overlaps the headline, paragraph, or `Mission` badge.
- Confirm the composition works at desktop, tablet, and mobile widths.
- Confirm the constellation becomes static when reduced motion is enabled.
- Run the production build and inspect the hero at `http://127.0.0.1:5173`.
