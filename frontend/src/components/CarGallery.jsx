import React, { useState, useCallback, useEffect } from 'react';

export default function CarGallery({ images = [], carName }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!lightboxOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, goNext, goPrev]);

  if (!images.length) {
    return (
      <div className="rounded-[14px] border border-dashed border-line bg-elevated p-10 text-center text-ink-muted">
        No images uploaded for this vehicle yet. Please check back soon or contact us for photos.
      </div>
    );
  }

  const active = images[activeIndex];

  return (
    <div>
      <button
        className="group relative h-[210px] w-full cursor-zoom-in overflow-hidden rounded-[22px] border-none bg-elevated p-0 sm:h-[300px] lg:h-[360px]"
        onClick={() => setLightboxOpen(true)}
        aria-label="Enlarge image"
      >
        <img
          src={active.image}
          alt={active.caption || `${carName} photo ${activeIndex + 1}`}
          className="h-full w-full object-cover transition-transform duration-[320ms] ease-smooth group-hover:scale-[1.03]"
        />
        <span className="absolute right-3.5 bottom-3.5 rounded-full bg-black/55 px-3 py-1.5 text-[0.75rem] text-white opacity-0 transition-opacity duration-[180ms] group-hover:opacity-100">
          Click to enlarge
        </span>
      </button>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              className={`h-[56px] w-[74px] flex-none overflow-hidden rounded-[8px] border-2 p-0 transition-all duration-[180ms] ${
                i === activeIndex ? 'border-accent opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
              onClick={() => setActiveIndex(i)}
              aria-label={`View photo ${i + 1}`}
            >
              <img src={img.image} alt={img.caption || `${carName} thumbnail ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <div className="fixed inset-0 z-[1000] flex animate-fade-in items-center justify-center bg-[rgba(10,8,7,0.92)]" role="dialog" aria-modal="true" onClick={() => setLightboxOpen(false)}>
          <button className="absolute top-5 right-6 h-10 w-10 rounded-full border-none bg-white/10 text-[1.1rem] text-white" onClick={() => setLightboxOpen(false)} aria-label="Close">✕</button>
          {images.length > 1 && (
            <button
              className="absolute top-1/2 left-5 h-[46px] w-[46px] -translate-y-1/2 rounded-full border-none bg-white/10 text-[1.6rem] leading-none text-white max-[560px]:h-[38px] max-[560px]:w-[38px] max-[560px]:text-[1.3rem]"
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              aria-label="Previous image"
            >‹</button>
          )}
          <img
            src={active.image}
            alt={active.caption || `${carName} enlarged photo`}
            className="max-h-[84vh] max-w-[88vw] cursor-default rounded-[14px]"
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 && (
            <button
              className="absolute top-1/2 right-5 h-[46px] w-[46px] -translate-y-1/2 rounded-full border-none bg-white/10 text-[1.6rem] leading-none text-white max-[560px]:h-[38px] max-[560px]:w-[38px] max-[560px]:text-[1.3rem]"
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              aria-label="Next image"
            >›</button>
          )}
          <div className="absolute bottom-[22px] left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3.5 py-[5px] text-[0.85rem] text-white">{activeIndex + 1} / {images.length}</div>
        </div>
      )}
    </div>
  );
}
