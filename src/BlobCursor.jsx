import { useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import './BlobCursor.css';

export default function BlobCursor({
  blobType = 'circle',
  fillColor = '#5227FF',
  trailCount = 3,
  sizes = [60, 125, 75],
  innerSizes = [20, 35, 25],
  innerColor = 'rgba(255,255,255,0.8)',
  opacities = [0.6, 0.6, 0.6],
  shadowColor = 'rgba(0,0,0,0.75)',
  shadowBlur = 5,
  shadowOffsetX = 10,
  shadowOffsetY = 10,
  filterId = 'blob',
  filterStdDeviation = 30,
  filterColorMatrixValues = '1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 35 -10',
  useFilter = true,
  fastDuration = 0.1,
  slowDuration = 0.5,
  fastEase = 'power3.out',
  slowEase = 'power1.out',
  zIndex = 100
}) {
  const containerRef = useRef(null);
  const blobsRef = useRef([]);

  const updateOffset = useCallback(() => {
    if (!containerRef.current) return { left: 0, top: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return { left: rect.left, top: rect.top };
  }, []);

  const handleMove = useCallback(
    (e) => {
      const { left, top } = updateOffset();
      const x = 'clientX' in e ? e.clientX : e.touches[0].clientX;
      const y = 'clientY' in e ? e.clientY : e.touches[0].clientY;
      const interactiveButtons = containerRef.current
        ? containerRef.current
            .closest('.hero-ps1')
            ?.querySelectorAll('.hero-ps1-button')
        : null;
      let isOverInteractiveButton = false;

      interactiveButtons?.forEach((button) => {
        const rect = button.getBoundingClientRect();
        const withinX = x >= rect.left && x <= rect.right;
        const withinY = y >= rect.top && y <= rect.bottom;

        if (withinX && withinY) {
          isOverInteractiveButton = true;
        }

        const localX = x - rect.left;
        const localY = y - rect.top;
        const clampedX = Math.max(0, Math.min(rect.width, localX));
        const clampedY = Math.max(0, Math.min(rect.height, localY));
        const dx = localX - clampedX;
        const dy = localY - clampedY;
        const distance = Math.hypot(dx, dy);
        const proximity = Math.max(0, 1 - distance / 96);

        button.style.setProperty('--blob-local-x', `${localX}px`);
        button.style.setProperty('--blob-local-y', `${localY}px`);
        button.style.setProperty('--blob-proximity', proximity.toFixed(3));
      });

      blobsRef.current.forEach((el, i) => {
        if (!el) return;
        const isLead = i === 0;
        gsap.to(el, {
          x: x - left,
          y: y - top,
          opacity: isOverInteractiveButton ? 0 : opacities[i],
          duration: isLead ? fastDuration : slowDuration,
          ease: isLead ? fastEase : slowEase
        });
      });
    },
    [updateOffset, fastDuration, slowDuration, fastEase, slowEase, opacities]
  );

  useEffect(() => {
    const onResize = () => updateOffset();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [updateOffset]);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const target = containerRef.current.closest('.hero-ps1') || containerRef.current.parentElement;
    if (!target) {
      return undefined;
    }

    const handleLeave = () => {
      blobsRef.current.forEach((el) => {
        if (!el) return;
        gsap.to(el, {
          opacity: 0,
          duration: 0.18,
          ease: fastEase
        });
      });

      target.querySelectorAll('.hero-ps1-button').forEach((button) => {
        button.style.setProperty('--blob-local-x', '-999px');
        button.style.setProperty('--blob-local-y', '-999px');
        button.style.setProperty('--blob-proximity', '0');
      });
    };

    const handleEnter = () => {
      blobsRef.current.forEach((el, i) => {
        if (!el) return;
        gsap.to(el, {
          opacity: opacities[i],
          duration: 0.18,
          ease: fastEase
        });
      });
    };

    target.addEventListener('mousemove', handleMove);
    target.addEventListener('touchmove', handleMove, { passive: true });
    target.addEventListener('mouseenter', handleEnter);
    target.addEventListener('mouseleave', handleLeave);

    handleLeave();

    return () => {
      target.removeEventListener('mousemove', handleMove);
      target.removeEventListener('touchmove', handleMove);
      target.removeEventListener('mouseenter', handleEnter);
      target.removeEventListener('mouseleave', handleLeave);
    };
  }, [handleMove, opacities, fastEase]);

  return (
    <div
      ref={containerRef}
      className="blob-container"
      style={{ zIndex }}
    >
      {useFilter && (
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <filter id={filterId}>
            <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation={filterStdDeviation} />
            <feColorMatrix in="blur" values={filterColorMatrixValues} />
          </filter>
        </svg>
      )}

      <div className="blob-main" style={{ filter: useFilter ? `url(#${filterId})` : undefined }}>
        {Array.from({ length: trailCount }).map((_, i) => (
          <div
            key={i}
            ref={(el) => (blobsRef.current[i] = el)}
            className="blob"
            style={{
              width: sizes[i],
              height: sizes[i],
              borderRadius: blobType === 'circle' ? '50%' : '0%',
              backgroundColor: fillColor,
              opacity: opacities[i],
              boxShadow: `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px 0 ${shadowColor}`
            }}
          >
            <div
              className="inner-dot"
              style={{
                width: innerSizes[i],
                height: innerSizes[i],
                top: (sizes[i] - innerSizes[i]) / 2,
                left: (sizes[i] - innerSizes[i]) / 2,
                backgroundColor: innerColor,
                borderRadius: blobType === 'circle' ? '50%' : '0%'
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
