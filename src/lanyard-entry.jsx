import { createRoot } from 'react-dom/client';
import Lanyard from './Lanyard.jsx';
import BlobCursor from './BlobCursor.jsx';
import PixelBlast from './PixelBlast.jsx';
import HeroTitle from './HeroTitle.jsx';
import './Lanyard.css';

const rootElement = document.getElementById('egda-lanyard-root');
const heroCursorRoot = document.getElementById('egda-hero-cursor-root');
const heroBlastRoot = document.getElementById('egda-hero-blast-root');
const heroTitleRoot = document.getElementById('egda-hero-title-root');

if (rootElement) {
  createRoot(rootElement).render(
    <Lanyard position={[0, 0, 18]} gravity={[0, -36, 0]} fov={18} />
  );
}

if (heroCursorRoot) {
  createRoot(heroCursorRoot).render(
    <BlobCursor
      blobType="circle"
      fillColor="#1C00FF"
      trailCount={3}
      sizes={[54, 112, 68]}
      innerSizes={[18, 30, 22]}
      innerColor="rgba(243,243,225,0.8)"
      opacities={[0.6, 0.48, 0.42]}
      shadowColor="rgba(0,0,0,0.45)"
      shadowBlur={5}
      shadowOffsetX={8}
      shadowOffsetY={8}
      filterStdDeviation={24}
      useFilter={true}
      fastDuration={0.1}
      slowDuration={0.42}
      zIndex={4}
    />
  );
}

if (heroBlastRoot) {
  createRoot(heroBlastRoot).render(
    <PixelBlast
      variant="circle"
      pixelSize={6}
      color="#1C00FF"
      patternScale={2.6}
      patternDensity={1.05}
      pixelSizeJitter={0.35}
      enableRipples
      rippleSpeed={0.32}
      rippleThickness={0.12}
      rippleIntensityScale={1.25}
      liquid
      liquidStrength={0.09}
      liquidRadius={1.05}
      liquidWobbleSpeed={4.8}
      speed={0.45}
      edgeFade={0.2}
      transparent
    />
  );
}

if (heroTitleRoot) {
  createRoot(heroTitleRoot).render(
    <HeroTitle />
  );
}
