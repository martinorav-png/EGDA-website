import { useEffect, useRef, useState } from 'react';
import DecryptedText from './DecryptedText.jsx';

export default function HeroTitle() {
  const containerRef = useRef(null);
  const hasTriggeredRef = useRef(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showSecondLine, setShowSecondLine] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return undefined;

    let timeoutId;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            setHasStarted(true);
            timeoutId = window.setTimeout(() => {
              setShowSecondLine(true);
            }, 2000);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.35 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <h1 ref={containerRef} className="hero-ps1-title">
      <span className="hero-ps1-title-line">
        {hasStarted ? (
          <DecryptedText
            text="Estonia's game scene,"
            animateOn="load"
            sequential
            revealDirection="start"
            speed={95}
            useOriginalCharsOnly
            parentClassName="hero-ps1-title-decrypt"
            className="hero-ps1-title-revealed"
            encryptedClassName="hero-ps1-title-encrypted"
          />
        ) : (
          <span className="hero-ps1-title-placeholder">Estonia's game scene,</span>
        )}
      </span>
      <span className="hero-ps1-title-line">
        {showSecondLine ? (
          <DecryptedText
            text="on one page."
            animateOn="load"
            sequential
            revealDirection="start"
            speed={165}
            useOriginalCharsOnly
            parentClassName="hero-ps1-title-decrypt"
            className="hero-ps1-title-revealed"
            encryptedClassName="hero-ps1-title-encrypted"
          />
        ) : (
          <span className="hero-ps1-title-placeholder">on one page.</span>
        )}
      </span>
    </h1>
  );
}
