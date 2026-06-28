import { createRoot } from 'react-dom/client';
import Lanyard from './Lanyard.jsx';
import PixelBlast from './PixelBlast.jsx';
import HeroTitle from './HeroTitle.jsx';
import './Lanyard.css';

const rootElement = document.getElementById('egda-lanyard-root');
const heroBlastRoot = document.getElementById('egda-hero-blast-root');
const heroTitleRoot = document.getElementById('egda-hero-title-root');

if (rootElement) {
  createRoot(rootElement).render(
    <Lanyard position={[0, 0, 18]} gravity={[0, -36, 0]} fov={18} />
  );
}

if (heroBlastRoot) {
  createRoot(heroBlastRoot).render(
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
  );
}

if (heroTitleRoot) {
  createRoot(heroTitleRoot).render(
    <HeroTitle />
  );
}
