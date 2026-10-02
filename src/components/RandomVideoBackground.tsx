import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BackgroundVideoItem } from '../types/video';

interface RandomVideoBackgroundProps {
  currentVideo: BackgroundVideoItem;
  onVideoChange?: (video: BackgroundVideoItem) => void;
  className?: string;
  overlayOpacity?: number; // 0 to 1
}

export const RandomVideoBackground: React.FC<RandomVideoBackgroundProps> = ({
  currentVideo,
  className = '',
  overlayOpacity = 0.68,
}) => {
  // Track active and fading video instances for seamless crossfading
  const [activeVideo, setActiveVideo] = useState<BackgroundVideoItem>(currentVideo);
  const [fadingOutVideo, setFadingOutVideo] = useState<BackgroundVideoItem | null>(null);
  
  const [isActiveLoaded, setIsActiveLoaded] = useState<boolean>(false);
  const [isCrossfading, setIsCrossfading] = useState<boolean>(false);
  const [hasPlaybackError, setHasPlaybackError] = useState<boolean>(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  const activeVideoRef = useRef<HTMLVideoElement | null>(null);
  const fadeOutVideoRef = useRef<HTMLVideoElement | null>(null);

  // Check prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Handle video changes with smooth crossfade
  useEffect(() => {
    if (currentVideo.id !== activeVideo.id) {
      // Start crossfade: promote current active to fadingOut, set new currentVideo as active
      setFadingOutVideo(activeVideo);
      setActiveVideo(currentVideo);
      setIsActiveLoaded(false);
      setIsCrossfading(true);
      setHasPlaybackError(false);

      // Clean up fading out video after 1.4s
      const timer = setTimeout(() => {
        setFadingOutVideo(null);
        setIsCrossfading(false);
      }, 1400);

      return () => clearTimeout(timer);
    }
  }, [currentVideo, activeVideo]);

  // Attempt autoplay safely
  const attemptPlay = useCallback((videoEl: HTMLVideoElement | null) => {
    if (!videoEl || prefersReducedMotion) return;

    videoEl.muted = true;
    videoEl.defaultMuted = true;
    const playPromise = videoEl.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsActiveLoaded(true);
        })
        .catch((error) => {
          console.warn('Autoplay prevented or video playback error:', error);
          setHasPlaybackError(true);
        });
    }
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (activeVideoRef.current) {
      attemptPlay(activeVideoRef.current);
    }
  }, [activeVideo, attemptPlay]);

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 w-full h-full overflow-hidden select-none pointer-events-none z-0 bg-neutral-950 ${className}`}
    >
      {/* 1. Underlying Solid Dark Foundation & Poster Fallback */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000 ease-in-out"
        style={{
          backgroundImage: `url("${activeVideo.poster}")`,
          backgroundColor: '#04060a',
        }}
      />

      {/* 2. Outgoing Video Layer (Crossfading Out) */}
      {fadingOutVideo && !prefersReducedMotion && (
        <video
          ref={fadeOutVideoRef}
          key={`fadeout-${fadingOutVideo.id}`}
          src={fadingOutVideo.src}
          autoPlay
          muted
          loop
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
            isCrossfading ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ willChange: 'opacity' }}
        />
      )}

      {/* 3. Incoming / Active Video Layer */}
      {!prefersReducedMotion && !hasPlaybackError && (
        <video
          ref={activeVideoRef}
          key={`active-${activeVideo.id}`}
          src={activeVideo.src}
          autoPlay
          muted
          loop
          playsInline
          onLoadedData={() => {
            setIsActiveLoaded(true);
            attemptPlay(activeVideoRef.current);
          }}
          onCanPlay={() => {
            setIsActiveLoaded(true);
            attemptPlay(activeVideoRef.current);
          }}
          onError={() => {
            console.warn('Video failed to load source:', activeVideo.src);
            setHasPlaybackError(true);
          }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-out ${
            isActiveLoaded ? 'opacity-100' : 'opacity-70'
          }`}
          style={{ willChange: 'opacity' }}
        />
      )}

      {/* 4. Deep Atmospheric Tint (Subtle dynamic hue matching video accent) */}
      <div
        className="absolute inset-0 w-full h-full transition-colors duration-1000 ease-in-out mix-blend-color"
        style={{
          backgroundColor: activeVideo.accentColor || '#1e1b4b',
          opacity: 0.12,
        }}
      />

      {/* 5. Balanced Scrim Overlay (allows live video action to shine through while keeping card readable) */}
      <div
        className="absolute inset-0 w-full h-full transition-opacity duration-500 bg-gradient-to-b from-black/60 via-black/45 to-black/75"
        style={{ opacity: overlayOpacity }}
      />

      {/* 6. Subtle Vignette Effect */}
      <div className="absolute inset-0 w-full h-full vignette-overlay pointer-events-none opacity-70" />

      {/* 7. Subtle Edge Blur/Defocus */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          backdropFilter: 'blur(1.5px)',
          WebkitBackdropFilter: 'blur(1.5px)',
        }}
      />

      {/* 8. Fine Grain Texture / Atmospheric Grid for High-End Cinematic SaaS Feel */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />
    </div>
  );
};

