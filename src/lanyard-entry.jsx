import { createRoot } from 'react-dom/client';
import Lanyard from './Lanyard.jsx';
import './Lanyard.css';

const rootElement = document.getElementById('egda-lanyard-root');

if (rootElement) {
  createRoot(rootElement).render(
    <Lanyard position={[0, 0, 18]} gravity={[0, -36, 0]} fov={18} />
  );
}
