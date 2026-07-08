import { useEffect, useRef, useState } from 'react';
import DecryptedText from './DecryptedText.jsx';

const DEFAULT_LINES = ["Estonia's game scene,", 'on one page.'];

export default function HeroTitle() {
  const containerRef = useRef(null);
  const hasTriggeredRef = useRef(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showSecondLine, setShowSecondLine] = useState(false);
  const [lines, setLines] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/content/hero.json')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (cancelled) return;
        setLines([
          data.title_line_1 || DEFAULT_LINES[0],
          data.title_line_2 || DEFAULT_LINES[1],
        ]);
      })
      .catch(() => {
        if (!cancelled) setLines(DEFAULT_LINES);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
            }, 900);
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

  const [lineOne, lineTwo] = lines || DEFAULT_LINES;

  return (
    <h1 ref={containerRef} className="hero-ps1-title">
      <span className="hero-ps1-title-line">
        {hasStarted && lines ? (
          <DecryptedText
            text={lineOne}
            animateOn="load"
            sequential
            revealDirection="start"
            speed={50}
            useOriginalCharsOnly
            parentClassName="hero-ps1-title-decrypt"
            className="hero-ps1-title-revealed"
            encryptedClassName="hero-ps1-title-encrypted"
          />
        ) : (
          <span className="hero-ps1-title-placeholder">{lineOne}</span>
        )}
      </span>
      <span className="hero-ps1-title-line">
        {showSecondLine && lines ? (
          <DecryptedText
            text={lineTwo}
            animateOn="load"
            sequential
            revealDirection="start"
            speed={80}
            useOriginalCharsOnly
            parentClassName="hero-ps1-title-decrypt"
            className="hero-ps1-title-revealed"
            encryptedClassName="hero-ps1-title-encrypted"
          />
        ) : (
          <span className="hero-ps1-title-placeholder">{lineTwo}</span>
        )}
      </span>
    </h1>
  );
}
