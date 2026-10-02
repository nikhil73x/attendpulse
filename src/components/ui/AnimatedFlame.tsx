import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedFlameProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  intensity?: 'normal' | 'high' | 'ultra';
  showEmbers?: boolean;
}

export const AnimatedFlame: React.FC<AnimatedFlameProps> = ({
  size = 'md',
  className = '',
  intensity = 'normal',
  showEmbers = true,
}) => {
  // Determine pixel dimensions
  const getDimensions = () => {
    if (typeof size === 'number') {
      return { width: size, height: Math.round(size * 1.18) };
    }
    switch (size) {
      case 'sm':
        return { width: 22, height: 26 };
      case 'lg':
        return { width: 44, height: 52 };
      case 'xl':
        return { width: 64, height: 76 };
      case 'md':
      default:
        return { width: 32, height: 38 };
    }
  };

  const { width, height } = getDimensions();

  const isUltra = intensity === 'ultra';

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width, height }}
      aria-label="Animated streak flame"
    >
      {/* ── Ambient Radial Fire Glow ── */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 rounded-full blur-md pointer-events-none"
        style={{
          background: isUltra
            ? 'radial-gradient(circle, rgba(251, 146, 60, 0.6) 0%, rgba(239, 68, 68, 0.3) 50%, transparent 80%)'
            : 'radial-gradient(circle, rgba(251, 191, 36, 0.5) 0%, rgba(249, 115, 22, 0.25) 50%, transparent 80%)',
        }}
        animate={{
          scale: [0.92, 1.15, 0.96, 1.2, 0.92],
          opacity: [0.65, 0.95, 0.7, 1, 0.65],
        }}
        transition={{
          duration: isUltra ? 1.4 : 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* ── Floating Rising Ember Sparks ── */}
      {showEmbers && (
        <div className="absolute inset-0 overflow-visible pointer-events-none">
          {/* Spark 1 */}
          <motion.span
            className="absolute left-[45%] top-[20%] w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_6px_#f59e0b]"
            animate={{
              y: [0, -height * 0.55, -height * 0.9],
              x: [0, 5, -3],
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.2],
            }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 0.1,
            }}
          />

          {/* Spark 2 */}
          <motion.span
            className="absolute left-[30%] top-[30%] w-1 h-1 rounded-full bg-yellow-200 shadow-[0_0_5px_#fbbf24]"
            animate={{
              y: [0, -height * 0.45, -height * 0.8],
              x: [0, -6, 2],
              opacity: [0, 0.9, 0],
              scale: [0.4, 0.9, 0.2],
            }}
            transition={{
              duration: 1.9,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 0.7,
            }}
          />

          {/* Spark 3 */}
          <motion.span
            className="absolute left-[60%] top-[25%] w-1 h-1 rounded-full bg-orange-300 shadow-[0_0_5px_#f97316]"
            animate={{
              y: [0, -height * 0.5, -height * 0.85],
              x: [0, 4, -4],
              opacity: [0, 0.85, 0],
              scale: [0.4, 0.8, 0.2],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: 'easeOut',
              delay: 1.1,
            }}
          />
        </div>
      )}

      {/* ── Main SVG Flame ── */}
      <svg
        viewBox="0 0 100 120"
        width={width}
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 overflow-visible drop-shadow-[0_2px_8px_rgba(249,115,22,0.4)]"
      >
        <defs>
          {/* Outer Flame Gradient */}
          <linearGradient id="flameOuterGrad" x1="50" y1="120" x2="50" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#DC2626" />
            <stop offset="28%" stopColor="#EA580C" />
            <stop offset="65%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#FBBF24" />
          </linearGradient>

          {/* Inner Flame Gradient */}
          <linearGradient id="flameInnerGrad" x1="50" y1="110" x2="50" y2="25" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F97316" />
            <stop offset="40%" stopColor="#FBBF24" />
            <stop offset="85%" stopColor="#FDE047" />
            <stop offset="100%" stopColor="#FEF08A" />
          </linearGradient>

          {/* Core Spark Gradient */}
          <linearGradient id="flameCoreGrad" x1="50" y1="105" x2="50" y2="55" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="60%" stopColor="#FFFBEB" />
            <stop offset="100%" stopColor="#FFFFFF" />
          </linearGradient>

          {/* Ultra Supercharged Blue Base Glow */}
          {isUltra && (
            <radialGradient id="ultraBlueBase" cx="50" cy="110" r="30" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#6366F1" stopOpacity="0.5" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          )}
        </defs>

        {/* ── Outer Dancing Flame ── */}
        <motion.path
          d="M50 0C50 0 54 18 64 28C74 38 88 48 88 68C88 88 72 110 50 110C28 110 12 88 12 68C12 48 26 36 34 26C42 16 46 6 50 0Z"
          fill="url(#flameOuterGrad)"
          style={{ originX: '50%', originY: '100%' }}
          animate={{
            scaleY: [1, 1.07, 0.95, 1.05, 1],
            scaleX: [1, 0.96, 1.04, 0.97, 1],
            rotate: [-1.8, 1.6, -1.4, 2, -1.8],
            skewX: [-1, 1.5, -0.8, 1.2, -1],
          }}
          transition={{
            duration: isUltra ? 1.1 : 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* ── Middle Energetic Flame ── */}
        <motion.path
          d="M50 22C50 22 53 34 60 42C67 50 75 60 75 75C75 92 64 105 50 105C36 105 25 92 25 75C25 58 35 48 41 40C46 32 48 25 50 22Z"
          fill="url(#flameInnerGrad)"
          style={{ originX: '50%', originY: '100%' }}
          animate={{
            scaleY: [1, 0.93, 1.09, 0.96, 1],
            scaleX: [1, 1.05, 0.95, 1.03, 1],
            rotate: [1.5, -2, 1.2, -1.5, 1.5],
            skewX: [1, -1.2, 0.8, -1, 1],
          }}
          transition={{
            duration: isUltra ? 0.95 : 1.3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* ── Hot White Core ── */}
        <motion.path
          d="M50 52C50 52 52 60 56 66C60 72 63 78 63 85C63 95 57 101 50 101C43 101 37 95 37 85C37 76 42 70 45 65C48 60 49 54 50 52Z"
          fill="url(#flameCoreGrad)"
          style={{ originX: '50%', originY: '100%' }}
          animate={{
            scaleY: [1, 1.12, 0.92, 1.08, 1],
            scaleX: [1, 0.94, 1.06, 0.96, 1],
            opacity: [0.92, 1, 0.86, 1, 0.92],
          }}
          transition={{
            duration: isUltra ? 0.8 : 1.1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* ── Ultra Hot Flame Base (if intensity is ultra) ── */}
        {isUltra && (
          <ellipse
            cx="50"
            cy="100"
            rx="22"
            ry="8"
            fill="url(#ultraBlueBase)"
            className="mix-blend-screen"
          />
        )}
      </svg>
    </div>
  );
};

export default AnimatedFlame;
