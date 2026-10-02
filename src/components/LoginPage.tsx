import React, { useState } from 'react';
import { RandomVideoBackground } from './RandomVideoBackground';
import { LoginForm, AuthPayload } from './LoginForm';
import { getRandomBackgroundVideo, getNextBackgroundVideo } from '../config/videos';
import { BackgroundVideoItem } from '../types/video';
import { CheckCircle2, Film } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoginPageProps {
  onLoginSuccess?: (auth: AuthPayload) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  // Random atmospheric video on initial load
  const [currentVideo, setCurrentVideo] = useState<BackgroundVideoItem>(() => {
    return getRandomBackgroundVideo();
  });

  const [authSuccessNotice, setAuthSuccessNotice] = useState<boolean>(false);
  const [authRoleNotice, setAuthRoleNotice] = useState<string>('Portal');

  const handleVerified = (roleName: string) => {
    setAuthRoleNotice(roleName);
    setAuthSuccessNotice(true);
  };

  const handleAuthSuccess = (auth: AuthPayload) => {
    onLoginSuccess?.(auth);
  };

  const cycleNextAtmosphere = () => {
    setCurrentVideo((prev) => getNextBackgroundVideo(prev.id));
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden px-4 py-8">
      {/* Dynamic Background Video Layer */}
      <RandomVideoBackground currentVideo={currentVideo} overlayOpacity={0.48} />

      {/* Main Center Content: Perfectly Centered Login Card + Aligned Verified Popup */}
      <main className="relative z-10 w-full flex flex-col items-center justify-center">
        {/* Ambient glow matching active video accent */}
        <div
          aria-hidden="true"
          className="absolute w-80 h-80 sm:w-[520px] sm:h-[520px] rounded-full blur-3xl opacity-25 pointer-events-none transition-colors duration-1000"
          style={{ backgroundColor: currentVideo.accentColor || '#6366f1' }}
        />

        {/* Clean Login Form Card */}
        <LoginForm onVerified={handleVerified} onSuccess={handleAuthSuccess} />

        {/* Verified Popup - Totally aligned with the Login Box */}
        <div className="w-full max-w-[430px] sm:max-w-[440px] h-0 relative flex justify-center">
          <AnimatePresence>
            {authSuccessNotice && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 12, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="w-full flex items-center justify-center gap-2.5 px-4.5 py-3 rounded-2xl bg-[#041d14]/95 border border-emerald-500/40 text-emerald-300 text-xs sm:text-[13px] font-medium shadow-2xl backdrop-blur-xl pointer-events-none"
              >
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                <span>Verified! Redirecting to {authRoleNotice}...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Unobtrusive Atmosphere Switcher Pill (Cycles through 10 high-quality copyright-free videos) */}
      <motion.button
        type="button"
        onClick={cycleNextAtmosphere}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={`Current Atmosphere: ${currentVideo.title}. Click to cycle.`}
        className="fixed bottom-5 right-5 z-20 flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white text-xs font-medium backdrop-blur-md transition-all cursor-pointer shadow-lg select-none"
      >
        <Film className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
        <span className="hidden sm:inline text-[11px] text-slate-400">Atmosphere:</span>
        <span className="text-[11px] font-semibold text-slate-200">{currentVideo.title}</span>
      </motion.button>
    </div>
  );
};

