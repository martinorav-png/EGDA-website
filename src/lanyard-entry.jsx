import { createRoot } from 'react-dom/client';
import { lazy, Suspense } from 'react';
import HeroTitle from './HeroTitle.jsx';
import './Lanyard.css';

const Lanyard = lazy(() => import('./Lanyard.jsx'));
const PixelBlast = lazy(() => import('./PixelBlast.jsx'));

const rootElement = document.getElementById('egda-lanyard-root');
const heroBlastRoot = document.getElementById('egda-hero-blast-root');
const heroTitleRoot = document.getElementById('egda-hero-title-root');

if (rootElement) {
  createRoot(rootElement).render(
    <Suspense fallback={null}>
      <Lanyard position={[0, 0, 18]} gravity={[0, -36, 0]} fov={24} />
    </Suspense>
  );
}

if (heroBlastRoot) {
  createRoot(heroBlastRoot).render(
    <Suspense fallback={null}>
      <PixelBlast
        variant="circle"
        pixelSize={6}
        color="#ffffff"
        patternScale={2.6}
        patternDensity={1.05}
        pixelSizeJitter={0.35}
        enableRipples
        rippleSpeed={0.32}
        rippleThickness={0.12}
        rippleIntensityScale={1.25}
        speed={0.45}
        edgeFade={0.2}
        transparent
      />
    </Suspense>
  );
}

if (heroTitleRoot) {
  createRoot(heroTitleRoot).render(
    <HeroTitle />
  );
}
