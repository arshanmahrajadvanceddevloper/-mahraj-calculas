/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, ReactNode, useEffect, FormEvent, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  AreaChart,
  Atom, 
  FlaskConical, 
  CircleDollarSign, 
  LibraryBig, 
  BookOpen, 
  Download, 
  User as UserIcon, 
  LogOut, 
  Trash2, 
  X, 
  Check, 
  Mail, 
  Calendar, 
  Sparkles,
  Award,
  BookOpenCheck,
  Lock,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  MousePointer,
  Smartphone,
  MoreVertical,
  Share2,
  Clock,
  FileDown
} from 'lucide-react';
import { MathMode } from './components/MathMode';
import { GraphMode } from './components/GraphMode';
import { PhysicsMode } from './components/PhysicsMode';
import { ChemistryMode } from './components/ChemistryMode';
import { CurrencyMode } from './components/CurrencyMode';
import { FormulaLibraryMode } from './components/FormulaLibraryMode';
import { BooksMode } from './components/BooksMode';
import { MahrajHelps } from './components/MahrajHelps';
import { CalculationHistoryModal } from './components/CalculationHistoryModal';
import { FeatureShowcaseTicker } from './components/FeatureShowcaseTicker';
import { CustomCursor } from './components/CustomCursor';
import { InteractiveBackground } from './components/InteractiveBackground';
import { useAuth } from './FirebaseProvider';
import { clearAllCalculations, auth } from './firebase';

type Mode = 'math' | 'graph' | 'physics' | 'chemistry' | 'currency' | 'formulas' | 'books';

const themeColors = {
  lime: {
    text: 'text-lime-400',
    textMuted: 'text-lime-400/80',
    bg: 'bg-lime-500',
    bgHover: 'hover:bg-lime-400',
    bgMuted: 'bg-lime-500/10 hover:bg-lime-500/20',
    border: 'border-lime-500/30',
    borderActive: 'border-lime-500/60',
    borderMuted: 'border-lime-500/20',
    shadow: 'shadow-[0_0_20px_rgba(163,230,53,0.3)]',
    shadowButton: 'shadow-[0_0_20px_rgba(163,230,53,0.4)]',
    rgbVal: 'rgba(163,230,53,0.15)',
    hex: '#a3e635'
  },
  cyan: {
    text: 'text-cyan-400',
    textMuted: 'text-cyan-400/80',
    bg: 'bg-cyan-500',
    bgHover: 'hover:bg-cyan-400',
    bgMuted: 'bg-cyan-500/10 hover:bg-cyan-500/20',
    border: 'border-cyan-500/30',
    borderActive: 'border-cyan-500/60',
    borderMuted: 'border-cyan-500/20',
    shadow: 'shadow-[0_0_20px_rgba(6,182,212,0.3)]',
    shadowButton: 'shadow-[0_0_20px_rgba(6,182,212,0.4)]',
    rgbVal: 'rgba(6,182,212,0.15)',
    hex: '#22d3ee'
  },
  amber: {
    text: 'text-amber-400',
    textMuted: 'text-amber-400/80',
    bg: 'bg-amber-500',
    bgHover: 'hover:bg-amber-400',
    bgMuted: 'bg-amber-500/10 hover:bg-amber-500/20',
    border: 'border-amber-500/30',
    borderActive: 'border-amber-500/60',
    borderMuted: 'border-amber-500/20',
    shadow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    shadowButton: 'shadow-[0_0_20px_rgba(245,158,11,0.4)]',
    rgbVal: 'rgba(245,158,11,0.15)',
    hex: '#fbbf24'
  },
  rose: {
    text: 'text-rose-400',
    textMuted: 'text-rose-400/80',
    bg: 'bg-rose-500',
    bgHover: 'hover:bg-rose-400',
    bgMuted: 'bg-rose-500/10 hover:bg-rose-500/20',
    border: 'border-rose-500/30',
    borderActive: 'border-rose-500/60',
    borderMuted: 'border-rose-500/20',
    shadow: 'shadow-[0_0_20px_rgba(244,63,94,0.3)]',
    shadowButton: 'shadow-[0_0_20px_rgba(244,63,94,0.4)]',
    rgbVal: 'rgba(244,63,94,0.15)',
    hex: '#f43f5e'
  },
  indigo: {
    text: 'text-indigo-400',
    textMuted: 'text-indigo-400/80',
    bg: 'bg-indigo-500',
    bgHover: 'hover:bg-indigo-400',
    bgMuted: 'bg-indigo-500/10 hover:bg-indigo-500/20',
    border: 'border-indigo-500/30',
    borderActive: 'border-indigo-500/60',
    borderMuted: 'border-indigo-500/20',
    shadow: 'shadow-[0_0_20px_rgba(99,102,241,0.3)]',
    shadowButton: 'shadow-[0_0_20px_rgba(99,102,241,0.4)]',
    rgbVal: 'rgba(99,102,241,0.15)',
    hex: '#6366f1'
  },
  purple: {
    text: 'text-purple-400',
    textMuted: 'text-purple-400/80',
    bg: 'bg-purple-500',
    bgHover: 'hover:bg-purple-400',
    bgMuted: 'bg-purple-500/10 hover:bg-purple-500/20',
    border: 'border-purple-500/30',
    borderActive: 'border-purple-500/60',
    borderMuted: 'border-purple-500/20',
    shadow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]',
    shadowButton: 'shadow-[0_0_20px_rgba(168,85,247,0.4)]',
    rgbVal: 'rgba(168,85,247,0.15)',
    hex: '#a855f7'
  },
  emerald: {
    text: 'text-emerald-400',
    textMuted: 'text-emerald-400/80',
    bg: 'bg-emerald-500',
    bgHover: 'hover:bg-emerald-400',
    bgMuted: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    border: 'border-emerald-500/30',
    borderActive: 'border-emerald-500/60',
    borderMuted: 'border-emerald-500/20',
    shadow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    shadowButton: 'shadow-[0_0_20px_rgba(16,185,129,0.4)]',
    rgbVal: 'rgba(16,185,129,0.15)',
    hex: '#10b981'
  }
};

export default function App() {
  const [mode, setMode] = useState<Mode>('math');
  const [hasStarted, setHasStarted] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Profile and history modal editing state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editProfession, setEditProfession] = useState('General');
  const [editThemeTint, setEditThemeTint] = useState('lime');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Fluid Tech Custom Cursor state (matches video trailing circle & dot)
  const [isCustomCursorEnabled, setIsCustomCursorEnabled] = useState<boolean>(() => {
    return localStorage.getItem('mahraj_cursor_enabled') !== 'false';
  });

  const toggleCustomCursor = (enabled: boolean) => {
    setIsCustomCursorEnabled(enabled);
    localStorage.setItem('mahraj_cursor_enabled', String(enabled));
  };

  // Custom non-blocking inline confirmations to work inside iframes
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // New OTP and Verification State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authStep, setAuthStep] = useState<'email-input' | 'otp' | 'setup'>('email-input');
  const [emailAddress, setEmailAddress] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  // Real-time refs and mode history stack for device navigation bar back button
  const modeHistoryRef = useRef<Mode[]>([]);
  const currentModeRef = useRef<Mode>(mode);
  currentModeRef.current = mode;

  // Real-time refs to avoid stale closures in window popstate event
  const isProfileOpenRef = useRef(isProfileOpen);
  isProfileOpenRef.current = isProfileOpen;

  const isAiOpenRef = useRef(isAiOpen);
  isAiOpenRef.current = isAiOpen;

  const isHistoryOpenRef = useRef(isHistoryOpen);
  isHistoryOpenRef.current = isHistoryOpen;

  const isAuthOpenRef = useRef(isAuthOpen);
  isAuthOpenRef.current = isAuthOpen;

  const isInstallModalOpenRef = useRef(isInstallModalOpen);
  isInstallModalOpenRef.current = isInstallModalOpen;

  const confirmLogoutRef = useRef(confirmLogout);
  confirmLogoutRef.current = confirmLogout;

  const confirmClearRef = useRef(confirmClear);
  confirmClearRef.current = confirmClear;

  // Double-tap back button to exit safety
  const lastBackPressTimeRef = useRef<number>(0);
  const [showExitToast, setShowExitToast] = useState(false);

  // Modal open & close with browser history synchronization
  const openModal = useCallback((modal: 'ai' | 'history' | 'profile' | 'auth' | 'install') => {
    try {
      window.history.pushState({ type: 'modal', modal }, '');
    } catch (_) {}
    if (modal === 'ai') setIsAiOpen(true);
    else if (modal === 'history') setIsHistoryOpen(true);
    else if (modal === 'profile') setIsProfileOpen(true);
    else if (modal === 'auth') openModal("auth");
    else if (modal === 'install') setIsInstallModalOpen(true);
  }, []);

  const closeModal = useCallback((modal: 'ai' | 'history' | 'profile' | 'auth' | 'install') => {
    if (window.history.state?.type === 'modal' && window.history.state?.modal === modal) {
      window.history.back();
    } else {
      if (modal === 'ai') setIsAiOpen(false);
      else if (modal === 'history') setIsHistoryOpen(false);
      else if (modal === 'profile') setIsProfileOpen(false);
      else if (modal === 'auth') setIsAuthOpen(false);
      else if (modal === 'install') closeModal("install");
    }
  }, []);

  // When changing modes, push previous mode to stack and update history state
  const handleSelectMode = useCallback((newMode: Mode) => {
    if (newMode === currentModeRef.current) return;
    modeHistoryRef.current.push(currentModeRef.current);
    try {
      window.history.pushState({ type: 'mode', mode: newMode }, '');
    } catch (_) {}
    currentModeRef.current = newMode;
    setMode(newMode);
  }, []);

  // Device Navigation Bar Back Button Listener (Prevents app from closing and takes user to previous screen)
  useEffect(() => {
    try {
      window.history.replaceState({ type: 'root', mode: 'math' }, '');
    } catch (_) {}

    const handlePopState = () => {
      // 1. If any modal or popup confirmation is open, close it and DO NOT navigate away
      if (confirmLogoutRef.current) {
        setConfirmLogout(false);
        return;
      }
      if (confirmClearRef.current) {
        setConfirmClear(false);
        return;
      }
      if (isProfileOpenRef.current) {
        setIsProfileOpen(false);
        return;
      }
      if (isAiOpenRef.current) {
        setIsAiOpen(false);
        return;
      }
      if (isHistoryOpenRef.current) {
        setIsHistoryOpen(false);
        return;
      }
      if (isAuthOpenRef.current) {
        setIsAuthOpen(false);
        return;
      }
      if (isInstallModalOpenRef.current) {
        closeModal("install");
        return;
      }

      // 2. If the user navigated across different modes (e.g. Math -> Physics -> Forex),
      // bring them back to their previous mode!
      if (modeHistoryRef.current.length > 0) {
        const previousMode = modeHistoryRef.current.pop()!;
        currentModeRef.current = previousMode;
        setMode(previousMode);
        return;
      }

      // If user was on a sub-mode but modeHistory happened to be empty, bring them to math
      if (currentModeRef.current !== 'math') {
        currentModeRef.current = 'math';
        setMode('math');
        return;
      }

      // 3. User is on the root Math screen:
      // Prevent accidental exit! Require pressing back twice within 2 seconds to actually leave.
      const now = Date.now();
      if (now - lastBackPressTimeRef.current < 2000) {
        // Double press confirmed, allow user to exit
        return;
      }

      lastBackPressTimeRef.current = now;
      setShowExitToast(true);
      setTimeout(() => setShowExitToast(false), 2000);
      try {
        window.history.pushState({ type: 'root', mode: 'math' }, '');
      } catch (_) {}
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // One-time rotating popout feature hints under the 3 top-bar buttons (AI Voice, History, Install)
  // Plays EXACTLY ONCE each time the app is opened or reloaded.
  // Sequence: AI Voice (3s) -> History (3s) -> Install (3s) -> completely disappears!
  const [activeHintIndex, setActiveHintIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!hasStarted) return;

    // Start with 1st element (AI Voice)
    setActiveHintIndex(0);

    // After 3 seconds, switch to 2nd element (History)
    const t1 = setTimeout(() => {
      setActiveHintIndex(1);
    }, 3000);

    // After 6 seconds, switch to 3rd element (Install)
    const t2 = setTimeout(() => {
      setActiveHintIndex(2);
    }, 6000);

    // After 9 seconds, remove all hints completely
    const t3 = setTimeout(() => {
      setActiveHintIndex(null);
    }, 9000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [hasStarted]);

  const { user, profile, signIn, signInWithToken, triggerSimulatedSignIn, logOut, loading, updateProfile } = useAuth();

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Basic iOS detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/ipad|iphone|ipod/.test(userAgent) && !(window as any).MSStream) {
      setIsIOS(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Update editing state whenever profile loads or modal is toggled
  useEffect(() => {
    if (profile) {
      setEditName(profile.displayName || '');
      setEditBio(profile.bio || '');
      setEditProfession(profile.profession || 'General');
      setEditThemeTint(profile.themeTint || 'lime');
    }
    if (!isProfileOpen) {
      setConfirmLogout(false);
    }
  }, [profile, isProfileOpen]);

  const activeTint = (profile?.themeTint as keyof typeof themeColors) || 'lime';
  const currentTheme = themeColors[activeTint] || themeColors.lime;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          return;
        }
      } catch (err) {
        console.warn('Install prompt error:', err);
      }
    }
    openModal('install');
  };

  const handleClearHistory = async () => {
    if (user) {
      if (!confirmClear) {
        setConfirmClear(true);
        // Reset code after 3 seconds
        setTimeout(() => setConfirmClear(false), 3000);
        return;
      }
      setIsClearing(true);
      try {
        await clearAllCalculations(user.uid);
      } catch (err) {
        console.warn('Failed to clear calculations:', err);
      } finally {
        setIsClearing(false);
        setConfirmClear(false);
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    try {
      await updateProfile({
        displayName: editName.trim(),
        bio: editBio.trim(),
        profession: editProfession,
        themeTint: editThemeTint
      });
      closeModal('profile');
    } catch (e) {
      console.error("Save profile error", e);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError("");

    const trimmedEmail = emailAddress.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setVerificationError("Please enter a valid, standard email address.");
      return;
    }
    setIsSendingOtp(true);
    try {
      // Instant profile entry - bypass server OTP network/SMTP requirements
      triggerSimulatedSignIn(trimmedEmail);
      setConfirmationResult({ email: trimmedEmail, mode: 'email' });
      setAuthStep('setup');
    } catch (err: any) {
      console.error("Login creation failure:", err);
      setVerificationError(err.message || 'Error occurred during login.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setVerificationError("Please enter a 6-digit confirmation code.");
      return;
    }
    setVerificationError("");
    setIsVerifyingOtp(true);

    try {
      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: confirmationResult.email, otp: otpCode }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to verify verification code.');
      }

      // Authenticate the user successfully with the Custom Token
      await signInWithToken(result.firebaseToken);
      setAuthStep('setup');
    } catch (err: any) {
      console.error("Verification failed", err);
      setVerificationError(err.message || "Invalid OTP code. Please enter the correct verification code.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleCompleteSetup = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    try {
      await updateProfile({
        displayName: editName.trim() || 'Researcher',
        bio: editBio.trim() || 'Academic Explorer',
        profession: editProfession,
        themeTint: editThemeTint
      });
      setIsAuthOpen(false);
      setEmailAddress('');
      setOtpCode('');
      setConfirmationResult(null);
      setAuthStep('email-input');
    } catch (err) {
      console.error("Save profile during onboarding failed", err);
      setVerificationError("Could not activate profile. Please make sure inputs are valid.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const formatMemberSince = (createdAt: any) => {
    if (!createdAt) return 'Recent Member';
    try {
      if (typeof createdAt.toDate === 'function') {
        const date = createdAt.toDate();
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
      }
      if (createdAt.seconds) {
        const date = new Date(createdAt.seconds * 1000);
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
      }
      const date = new Date(createdAt);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
      }
    } catch (_) {}
    return 'Recent Member';
  };

  const navItem = (id: Mode, icon: ReactNode, label: string, colorClass: string) => (
    <button 
      onClick={() => handleSelectMode(id)}
      className={`flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all duration-300 touch-manipulation cursor-pointer ${
        mode === id 
          ? `bg-${colorClass}-500/20 text-${colorClass}-400 shadow-[0_0_15px_rgba(var(--${colorClass}),0.3)]` 
          : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
      }`}
    >
      {icon}
      <span className="text-[10px] mt-1 font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#07080c] flex items-center justify-center p-0 sm:p-4 selection:bg-transparent font-sans relative overflow-x-hidden">
      {/* Dynamic Cursor-Moving Colorful Aurora Ambient Background (Matches Video) */}
      <InteractiveBackground 
        themeHex={currentTheme.hex} 
        themeTint={activeTint} 
      />

      {/* High-Tech Fluid Custom Cursor (Tracking Dot & Lagging Trailing Ring) */}
      <CustomCursor 
        themeHex={currentTheme.hex} 
        themeRgb={currentTheme.rgbVal} 
        enabled={isCustomCursorEnabled} 
      />

      <AnimatePresence mode="wait">
        {!hasStarted ? (
          <motion.div 
            key="splash"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="w-full h-[100dvh] sm:h-[850px] sm:max-w-[400px] bg-black/85 backdrop-blur-2xl sm:rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] sm:border sm:border-zinc-800/80 flex flex-col justify-between relative overflow-hidden p-6 text-center"
          >
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse_at_center, ${currentTheme.rgbVal}, transparent 70%)`
              }}
            ></div>
            
            {/* Top Brand Header */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.45, type: "spring" }}
              className="relative flex items-center justify-center gap-3 pt-2"
            >
              <div className="relative w-14 h-14 flex items-center justify-center">
                <div 
                  className="absolute inset-1 rounded-2xl pointer-events-none blur-xl opacity-60"
                  style={{
                    background: `radial-gradient(circle, ${currentTheme.hex}88 0%, transparent 70%)`
                  }}
                />
                <img 
                  src="/app-logo.png" 
                  alt="Mahraj Calculas Main Logo" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(163,230,53,0.4)] relative z-10 rounded-2xl border border-zinc-800"
                />
              </div>
              <div className="text-left">
                <h2 className="text-base font-black text-white leading-tight tracking-wider uppercase flex items-center gap-1.5">
                  Mahraj Calculas
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-lime-500/20 text-lime-400 border border-lime-500/30 font-mono">v1.2</span>
                </h2>
                <p className="text-[10px] text-zinc-400 font-mono">Scientific Intelligence Suite</p>
              </div>
            </motion.div>
            
            {/* Animated Modern Feature Showcase & Live Capability Descriptions */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.45 }}
              className="w-full my-auto"
            >
              <FeatureShowcaseTicker 
                onSelectFeature={(featId) => {
                  if (featId === 'ai') {
                    setHasStarted(true);
                    openModal('ai');
                  } else {
                    handleSelectMode(featId as Mode);
                    setHasStarted(true);
                  }
                }} 
              />
            </motion.div>

            {/* Launch Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.45 }}
              className="w-full relative z-10 flex flex-col gap-2.5 pb-2"
            >
              <button
                onClick={() => setHasStarted(true)}
                className={`w-full relative group overflow-hidden rounded-2xl ${currentTheme.bg} ${currentTheme.shadowButton} text-black font-extrabold text-base py-4 transition-all hover:scale-[1.02] active:scale-95 shadow-xl`}
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                <span className="relative flex items-center justify-center gap-2">
                  START CALCULATING
                  <Calculator size={18} />
                </span>
              </button>

              {(deferredPrompt || isIOS) && (
                <button
                  onClick={handleInstallClick}
                  className="w-full relative group rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 text-zinc-300 font-bold text-xs py-3 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Download size={15} />
                  INSTALL APP
                </button>
              )}
            </motion.div>
          </motion.div>
        ) : (
          <motion.div 
            key="app"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.0, ease: "easeOut" }}
            className="w-full h-[100dvh] sm:h-[850px] sm:max-w-[400px] bg-black/80 backdrop-blur-xl sm:rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] sm:border sm:border-zinc-800/80 flex flex-col relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent z-20"></div>
            
            {/* Top Bar Label */}
            <div className="pt-4 pb-2 px-6 flex justify-between items-center z-20 relative">
               {/* 1. Element 1: AI Voice Button with Popout Khasiyat Tooltip */}
               <div className="relative">
                 <button 
                  onClick={() => isAiOpen ? closeModal('ai') : openModal('ai')}
                  className={`h-8 px-2.5 rounded-full bg-zinc-900 border ${currentTheme.borderMuted} hover:${currentTheme.border} ${currentTheme.text} flex items-center justify-center gap-1.5 transition-all hover:scale-105 active:scale-95 shadow-sm`}
                  title="Voice Conversation & AI Assistant (Click to Start / Stop)"
                 >
                   <Sparkles size={14} className="animate-pulse text-amber-300" />
                   <span className="text-[11px] font-bold font-mono tracking-wider uppercase">AI Voice</span>
                 </button>

                 <AnimatePresence>
                   {activeHintIndex === 0 && (
                     <motion.div
                       initial={{ opacity: 0, scale: 0.6, y: -6 }}
                       animate={{ opacity: 1, scale: 1, y: 0 }}
                       exit={{ opacity: 0, scale: 0.6, y: -6 }}
                       transition={{ type: "spring", stiffness: 450, damping: 22 }}
                       className="absolute left-0 top-full mt-2 z-50 pointer-events-none whitespace-nowrap"
                     >
                       {/* Arrow indicator */}
                       <div className="w-2 h-2 bg-gradient-to-br from-amber-500/90 to-amber-600 rotate-45 mx-3 -mb-1 shadow-sm"></div>
                       <div className="px-2.5 py-1.5 rounded-xl bg-zinc-950/95 border border-amber-500/40 text-[10px] text-amber-200 font-semibold shadow-[0_8px_20px_rgba(245,158,11,0.25)] backdrop-blur-md flex items-center gap-1.5">
                         <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                         <span>⚡ <b>AI Voice:</b> Instant bol kar equations aur sawal solve karata hai</span>
                       </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>

               <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs font-bold tracking-widest uppercase shadow-sm">

                 <img 
                   src="/app-logo.png" 
                   alt="Logo" 
                   referrerPolicy="no-referrer" 
                   className="w-4 h-4 rounded-md object-contain"
                 />
                 {mode === 'math' && <span className={currentTheme.text}>MATH CALC</span>}
                 {mode === 'physics' && <span className={currentTheme.text}>PHYSICS</span>}
                 {mode === 'chemistry' && <span className={currentTheme.text}>CHEMISTRY</span>}
                 {mode === 'currency' && <span className={currentTheme.text}>CURRENCY</span>}
                 {mode === 'formulas' && <span className={currentTheme.text}>FORMULA LIB</span>}
                 {mode === 'books' && <span className={currentTheme.text}>BOOKS</span>}
               </div>
               
               <div className="flex items-center gap-1.5">
                 {/* 2. Element 2: Calculation History Logs & PDF Export with Popout Khasiyat Tooltip */}
                 <div className="relative">
                   <button 
                     onClick={() => openModal("history")}
                     className={`w-8 h-8 rounded-full bg-zinc-900 border ${currentTheme.borderMuted} hover:${currentTheme.border} ${currentTheme.text} flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm`}
                     title="Calculation History Logs & PDF Export"
                   >
                     <Clock size={15} />
                   </button>

                   <AnimatePresence>
                     {activeHintIndex === 1 && (
                       <motion.div
                         initial={{ opacity: 0, scale: 0.6, y: -6 }}
                         animate={{ opacity: 1, scale: 1, y: 0 }}
                         exit={{ opacity: 0, scale: 0.6, y: -6 }}
                         transition={{ type: "spring", stiffness: 450, damping: 22 }}
                         className="absolute right-0 top-full mt-2 z-50 pointer-events-none whitespace-nowrap"
                       >
                         {/* Arrow indicator */}
                         <div className="w-2 h-2 bg-gradient-to-br from-cyan-500/90 to-cyan-600 rotate-45 ml-auto mr-3 -mb-1 shadow-sm"></div>
                         <div className="px-2.5 py-1.5 rounded-xl bg-zinc-950/95 border border-cyan-500/40 text-[10px] text-cyan-200 font-semibold shadow-[0_8px_20px_rgba(6,182,212,0.25)] backdrop-blur-md flex items-center gap-1.5">
                           <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                           <span>📜 <b>History:</b> Pichle sare calculations dekhein aur PDF export karein</span>
                         </div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>

                 {/* 3. Element 3: Install App with Popout Khasiyat Tooltip */}
                 <div className="relative">
                   <button 
                     onClick={handleInstallClick}
                     className={`w-8 h-8 rounded-full bg-zinc-900 border ${currentTheme.borderMuted} hover:${currentTheme.border} ${currentTheme.text} flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm`}
                     title="Install App on your device"
                   >
                     <Download size={15} />
                   </button>

                   <AnimatePresence>
                     {activeHintIndex === 2 && (
                       <motion.div
                         initial={{ opacity: 0, scale: 0.6, y: -6 }}
                         animate={{ opacity: 1, scale: 1, y: 0 }}
                         exit={{ opacity: 0, scale: 0.6, y: -6 }}
                         transition={{ type: "spring", stiffness: 450, damping: 22 }}
                         className="absolute right-0 top-full mt-2 z-50 pointer-events-none whitespace-nowrap"
                       >
                         {/* Arrow indicator */}
                         <div className="w-2 h-2 bg-gradient-to-br from-lime-500/90 to-lime-600 rotate-45 ml-auto mr-3 -mb-1 shadow-sm"></div>
                         <div className="px-2.5 py-1.5 rounded-xl bg-zinc-950/95 border border-lime-500/40 text-[10px] text-lime-200 font-semibold shadow-[0_8px_20px_rgba(163,230,53,0.25)] backdrop-blur-md flex items-center gap-1.5">
                           <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-ping"></span>
                           <span>📲 <b>Install:</b> Direct mobile ya laptop par offline app ki tarah chalao</span>
                         </div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>

                 {!loading && (
                   user ? (
                     <div className="flex items-center gap-1.5">
                       <button 
                        onClick={handleClearHistory}
                        disabled={isClearing}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all border ${
                          isClearing 
                            ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                            : confirmClear
                              ? 'bg-red-600 text-white border-red-500 animate-pulse scale-105'
                              : 'bg-zinc-800/80 text-zinc-400 hover:text-red-400 border-zinc-700/50 hover:border-red-500/30 hover:bg-red-500/10'
                        }`}
                        title={confirmClear ? "Click again to confirm clear" : "Clear history"}
                       >
                         {isClearing ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div> : <Trash2 size={16} />}
                       </button>
                       <button 
                        onClick={() => openModal("profile")}
                        className={`w-8 h-8 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400 hover:text-white transition-all border ${currentTheme.borderMuted} overflow-hidden hover:scale-105 active:scale-95`}
                        title="View user profile"
                       >
                         {(profile?.photoURL || user?.photoURL) ? (
                           <img 
                             src={profile?.photoURL || user?.photoURL || undefined} 
                             alt="Profile" 
                             className="w-full h-full object-cover"
                             referrerPolicy="no-referrer"
                           />
                         ) : (
                           <UserIcon size={16} />
                         )}
                       </button>
                     </div>
                   ) : (
                     <button 
                      onClick={() => { setAuthStep('email-input'); setVerificationError(''); openModal("auth"); }}
                      className={`w-8 h-8 rounded-full ${currentTheme.bgMuted} flex items-center justify-center ${currentTheme.text} transition-colors border ${currentTheme.border}`}
                      title="Sign in to save history"
                     >
                       <UserIcon size={16} />
                     </button>
                   )
                 )}
               </div>
            </div>

            {/* Dynamic Content Area */}
            <div className="flex-1 flex relative overflow-hidden bg-[#050505]">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={mode}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 flex"
                >
                  {mode === 'math' && <MathMode />}
                  {mode === 'graph' && <GraphMode />}
                  {mode === 'physics' && <PhysicsMode />}
                  {mode === 'chemistry' && <ChemistryMode />}
                  {mode === 'currency' && <CurrencyMode />}
                  {mode === 'formulas' && <FormulaLibraryMode />}
                  {mode === 'books' && <BooksMode />}
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Navigation Bar */}
            <div className="h-20 bg-zinc-950 border-t border-zinc-800/80 rounded-b-[2.5rem] flex items-center justify-between px-2 overflow-x-auto custom-scrollbar z-20 relative pb-2 sm:pb-0 gap-1 touch-manipulation">
               {navItem('math', <Calculator size={20} className={mode === 'math' ? currentTheme.text : ''} />, 'Math', activeTint)}
               {navItem('graph', <AreaChart size={20} className={mode === 'graph' ? currentTheme.text : ''} />, 'Graph', activeTint)}
               {navItem('physics', <Atom size={20} className={mode === 'physics' ? currentTheme.text : ''} />, 'Physics', activeTint)}
               {navItem('chemistry', <FlaskConical size={20} className={mode === 'chemistry' ? currentTheme.text : ''} />, 'Chem', activeTint)}
               {navItem('currency', <CircleDollarSign size={20} className={mode === 'currency' ? currentTheme.text : ''} />, 'Forex', activeTint)}
               {navItem('formulas', <LibraryBig size={20} className={mode === 'formulas' ? currentTheme.text : ''} />, 'Formulas', activeTint)}
               {navItem('books', <BookOpen size={20} className={mode === 'books' ? currentTheme.text : ''} />, 'Books', activeTint)}
            </div>
            
            {/* iOS-style bottom safety area */}
            <div className="h-1.5 sm:hidden absolute bottom-1 w-full flex justify-center z-30">
              <div className="w-1/3 h-1 bg-zinc-700/50 rounded-full"></div>
            </div>

            {/* Mahraj helps AI Companion */}
            <MahrajHelps 
              isOpen={isAiOpen} 
              onClose={() => closeModal("ai")} 
              currentTheme={currentTheme} 
            />

            {/* Calculation History & PDF Export Modal */}
            <CalculationHistoryModal
              isOpen={isHistoryOpen}
              onClose={() => closeModal("history")}
              currentTheme={currentTheme}
            />

            {/* Immersive User Profile Panel */}
            <AnimatePresence>
              {isProfileOpen && profile && (
                <motion.div
                  initial={{ transform: 'translateY(100%)' }}
                  animate={{ transform: 'translateY(0%)' }}
                  exit={{ transform: 'translateY(100%)' }}
                  transition={{ type: "spring", damping: 26, stiffness: 220 }}
                  className="absolute inset-0 z-50 bg-[#0a0a0c] flex flex-col justify-between overflow-hidden"
                >
                  {/* Modal Header */}
                  <div className="px-6 pt-5 pb-3 flex justify-between items-center bg-zinc-950 border-b border-zinc-900 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${currentTheme.bgMuted} ${currentTheme.text}`}>
                        <Sparkles size={16} />
                      </div>
                      <h3 className="font-extrabold text-white text-base">Scientific Identity</h3>
                    </div>
                    <button 
                      onClick={() => closeModal("profile")}
                      className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 hover:text-white flex items-center justify-center text-zinc-400 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Modal Scrollable Body */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-10 bg-gradient-to-b from-zinc-950 to-black">
                    
                    {/* User Profile Avatar and verified status */}
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="relative">
                        <div className={`w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-zinc-800 via-zinc-900 to-${editThemeTint}-500 shadow-xl overflow-hidden`}>
                          <div className="w-full h-full rounded-full bg-zinc-950 p-[2px] overflow-hidden">
                            {(profile?.photoURL || user?.photoURL) ? (
                              <img 
                                src={profile?.photoURL || user?.photoURL || undefined} 
                                alt="Google Account Avatar" 
                                className="w-full h-full object-cover rounded-full"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-400 rounded-full">
                                <UserIcon size={36} />
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Status Badge */}
                        <div className={`absolute -bottom-1 -right-1 p-1.5 rounded-full shadow-lg ${themeColors[editThemeTint as keyof typeof themeColors]?.bg || currentTheme.bg} text-black`}>
                          <Award size={14} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-lg font-bold text-white">
                          {editName || profile.email.split('@')[0]}
                        </h4>
                        <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[11px] text-emerald-400 font-semibold tracking-wide">
                          <Check size={12} strokeWidth={3} />
                          <span>Google Sync Active</span>
                        </div>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                      
                      {/* Email Row (Read-only) */}
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Verified Email</label>
                        <div className="relative">
                          <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                          <input 
                            type="text" 
                            value={profile.email} 
                            disabled 
                            className="w-full bg-zinc-900/40 border border-zinc-800/80 rounded-xl py-2.5 pl-10 pr-4 text-xs text-zinc-400 cursor-not-allowed select-none italic"
                          />
                        </div>
                      </div>

                      {/* Display Name Input */}
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Display Name</label>
                        <input 
                          type="text" 
                          value={editName} 
                          onChange={(e) => setEditName(e.target.value.slice(0, 50))} 
                          placeholder="Your human name"
                          maxLength={50}
                          className="w-full bg-zinc-900 text-white border border-zinc-800/80 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all placeholder:text-zinc-600"
                        />
                      </div>

                      {/* Specialization Selection */}
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Academic Role</label>
                        <div className="grid grid-cols-2 gap-2">
                          {['General', 'Student', 'Educator', 'Researcher', 'Professional', 'Hobbyist'].map((roleOpt) => (
                            <button
                              key={'settings-role-' + roleOpt}
                              type="button"
                              onClick={() => setEditProfession(roleOpt)}
                              className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all flex items-center justify-between ${
                                editProfession === roleOpt
                                  ? `bg-zinc-900 text-white border-zinc-700 shadow-sm`
                                  : 'bg-zinc-950/20 text-zinc-500 border-zinc-900 hover:border-zinc-800 hover:text-zinc-400'
                              }`}
                            >
                              <span>{roleOpt}</span>
                              {editProfession === roleOpt && (
                                <div className={`w-2 h-2 rounded-full ${themeColors[editThemeTint as keyof typeof themeColors]?.bg || currentTheme.bg}`}></div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Academic Bio */}
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Biography</label>
                        <textarea
                          placeholder="Tell us about yourself or your focus area..."
                          value={editBio}
                          onChange={(e) => setEditBio(e.target.value.slice(0, 150))}
                          maxLength={150}
                          rows={2.5}
                          className="w-full bg-zinc-900 text-white border border-zinc-800/80 rounded-xl py-3 px-4 text-xs focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all placeholder:text-zinc-600 resize-none"
                        ></textarea>
                        <div className="text-[10px] text-zinc-600 text-right mt-1 font-mono">
                          {editBio.length} / 150 chars
                        </div>
                      </div>

                      {/* Choose Theme Tint */}
                      <div>
                        <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Choose Accent Theme</label>
                        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-950 border border-zinc-900 justify-around">
                          {(Object.keys(themeColors) as Array<keyof typeof themeColors>).map((tint) => {
                            const config = themeColors[tint];
                            const isSelected = editThemeTint === tint;
                            return (
                              <button
                                key={'settings-theme-' + tint}
                                type="button"
                                onClick={() => setEditThemeTint(tint)}
                                className="relative w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                                style={{ backgroundColor: config.hex }}
                                title={`Select ${tint}`}
                              >
                                {isSelected && (
                                  <div className="absolute inset-0 rounded-full border-2 border-[#0a0a0c] flex items-center justify-center">
                                    <Check size={14} className="text-black font-bold" strokeWidth={3} />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Fluid Custom Cursor Toggle */}
                      <div className="pt-1">
                        <label className="block text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <MousePointer size={14} className={currentTheme.text} />
                            Fluid Tech Cursor
                          </span>
                          <span className="text-[10px] text-zinc-650 font-mono">Precision Dot + Ring</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => toggleCustomCursor(!isCustomCursorEnabled)}
                          className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all ${
                            isCustomCursorEnabled 
                              ? 'bg-zinc-900/90 border-zinc-700 text-white shadow-sm' 
                              : 'bg-zinc-950/60 border-zinc-900 text-zinc-500'
                          }`}
                        >
                          <div className="flex flex-col text-left">
                            <span className="text-xs font-semibold">
                              {isCustomCursorEnabled ? 'Fluid Ring & Precision Dot' : 'Standard System Cursor'}
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {isCustomCursorEnabled ? 'Smooth inertia trailing & reactive hover' : 'Default OS pointer'}
                            </span>
                          </div>
                          <div className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                            isCustomCursorEnabled ? (themeColors[editThemeTint as keyof typeof themeColors]?.bg || currentTheme.bg) : 'bg-zinc-800'
                          }`}>
                            <div className={`w-5 h-5 rounded-full bg-black shadow-md transform transition-transform duration-200 ease-in-out ${
                              isCustomCursorEnabled ? 'translate-x-4' : 'translate-x-0'
                            }`} />
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer actions */}
                  <div className="p-6 bg-zinc-950 border-t border-zinc-900 flex flex-col gap-3 shrink-0">
                    <button
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile}
                      className={`w-full py-4 rounded-xl font-bold text-sm text-black transition-all flex items-center justify-center gap-2 ${
                        isSavingProfile 
                          ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                          : `${themeColors[editThemeTint as keyof typeof themeColors]?.bg || currentTheme.bg} ${themeColors[editThemeTint as keyof typeof themeColors]?.shadowButton || currentTheme.shadowButton} hover:brightness-110 active:scale-95`
                      }`}
                    >
                      {isSavingProfile ? (
                        <>
                          <div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving Profile...</span>
                        </>
                      ) : (
                        <>
                          <Check size={16} strokeWidth={2.5} />
                          <span>Save & Sync Profile</span>
                        </>
                      )}
                    </button>

                    <div className="flex gap-2">
                      {confirmLogout ? (
                        <button
                          onClick={() => {
                            setConfirmLogout(false);
                            setIsProfileOpen(false);
                            logOut();
                          }}
                          className="flex-1 py-3 text-white bg-red-600 hover:bg-red-500 border border-red-500 rounded-xl transition-all font-bold text-xs flex items-center justify-center gap-1.5 animate-pulse"
                        >
                          <LogOut size={14} />
                          Confirm Logout?
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmLogout(true)}
                          className="flex-1 py-3 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-zinc-800 rounded-xl transition-all font-bold text-xs flex items-center justify-center gap-1.5"
                        >
                          <LogOut size={14} />
                          Logout
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          setConfirmLogout(false);
                        }}
                        className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl transition-all font-bold text-xs text-center"
                      >
                        Cancel
                      </button>
                    </div>

                    {/* Member Since Footnote */}
                    <div className="mt-1 flex items-center justify-center gap-1.5 text-[10px] text-zinc-600 font-mono">
                      <Calendar size={12} />
                      <span>Registered: {formatMemberSince(profile.createdAt)}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Authenticate & OTP Verification Modal */}
            <AnimatePresence>
              {isAuthOpen && (
                <motion.div
                  initial={{ transform: 'translateY(100%)' }}
                  animate={{ transform: 'translateY(0%)' }}
                  exit={{ transform: 'translateY(100%)' }}
                  transition={{ type: "spring", damping: 26, stiffness: 220 }}
                  className="absolute inset-0 z-50 bg-[#0a0a0c] flex flex-col justify-between overflow-hidden text-zinc-300"
                >
                  {/* Modal Header */}
                  <div className="px-6 pt-5 pb-3 flex justify-between items-center bg-zinc-950 border-b border-zinc-900 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg bg-zinc-900 text-zinc-350`}>
                        <ShieldCheck size={16} />
                      </div>
                      <h3 className="font-extrabold text-white text-base">
                        {authStep === 'email-input' && "Secure Access"}
                        {authStep === 'otp' && "Verify OTP Code"}
                        {authStep === 'setup' && "Create Scientific Profile"}
                      </h3>
                    </div>
                    <button 
                      onClick={() => {
                        closeModal("auth");
                        setEmailAddress('');
                        setOtpCode('');
                        setVerificationError('');
                        setConfirmationResult(null);
                        setAuthStep('email-input');
                      }}
                      className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 hover:text-white flex items-center justify-center text-zinc-400 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Content Container */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-10 bg-gradient-to-b from-zinc-950 to-black">
                    {verificationError && (
                      <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs leading-relaxed">
                        {verificationError}
                      </div>
                    )}

                    {authStep === 'email-input' && (
                      <div className="space-y-6 text-zinc-300">
                        <div className="text-center space-y-2">
                          <div className="w-14 h-14 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center mx-auto text-lime-400 animate-pulse">
                            <KeyRound size={28} />
                          </div>
                          <p className="text-zinc-400 text-xs leading-relaxed max-w-[280px] mx-auto">
                            Sign in or register using your email address to save your calculations, track history, and fully customize your workspace profile.
                          </p>
                        </div>

                        <form onSubmit={handleSendOtp} className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Email Address</label>
                            <div className="relative">
                              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-450" />
                              <input 
                                type="email" 
                                placeholder="researcher@academic.dev"
                                value={emailAddress}
                                onChange={(e) => setEmailAddress(e.target.value)}
                                className="w-full bg-zinc-900/60 text-white border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/50 transition-all placeholder:text-zinc-650"
                                required
                              />
                            </div>
                            <span className="text-[10px] text-zinc-550 mt-1 block">Instant sandbox profile login. No email OTP verification wait required.</span>
                          </div>

                          <button
                            type="submit"
                            disabled={isSendingOtp}
                            className={`w-full py-3.5 rounded-xl font-bold text-sm text-black bg-lime-400 hover:bg-lime-300 shadow-[0_0_20px_rgba(163,230,53,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer`}
                          >
                            {isSendingOtp ? (
                              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <Check size={16} strokeWidth={2.5} />
                                <span>Sign In Instantly</span>
                              </>
                            )}
                          </button>
                        </form>

                        <div className="relative flex py-2 items-center">
                          <div className="flex-grow border-t border-zinc-900"></div>
                          <span className="flex-shrink mx-4 text-zinc-650 text-[10px] font-bold tracking-widest uppercase">or quick access</span>
                          <div className="flex-grow border-t border-zinc-900"></div>
                        </div>

                        <button 
                          onClick={async () => {
                            try {
                              setVerificationError('');
                              await signIn();
                              setIsAuthOpen(false);
                            } catch (e: any) {
                              setVerificationError(e.message || "Failed to authenticate with Google.");
                            }
                          }}
                          className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl transition-all font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                        >
                          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92(3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                          Continue with Google Account
                        </button>
                      </div>
                    )}

                    {authStep === 'otp' && (
                      <div className="space-y-6">
                        <div className="text-center space-y-2">
                          <div className="w-14 h-14 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center mx-auto text-yellow-400">
                            <Lock size={28} />
                          </div>
                          <p className="text-zinc-400 text-xs leading-relaxed max-w-[280px] mx-auto">
                            Enter the 6-digit verification code sent securely to {confirmationResult?.email}.
                          </p>
                          
                          {/* Sandbox guidance for Email verification */}
                          <div className="space-y-2 max-w-[340px] mx-auto text-left">
                            <p className="text-amber-400/85 text-[11px] bg-amber-500/10 border border-amber-500/20 py-2.5 px-3.5 rounded-xl leading-normal text-center">
                              💡 <strong>Scientific Sandbox Mode</strong>: If SMTP is not actively configured or failed to deliver, the secure 6-digit verification code is printed in the server console/logs. For an instant sandbox bypass, you can simply enter the universal code <strong>777777</strong> to authorize!
                            </p>
                          </div>
                        </div>

                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider text-center">6-Digit Verification Code</label>
                            <input 
                              type="text" 
                              pattern="[0-9]*"
                              inputMode="numeric"
                              maxLength={6}
                              placeholder="000000"
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                              className="w-full bg-zinc-900 text-white tracking-[0.5em] text-center font-bold text-xl border border-zinc-800 rounded-xl py-3.5 focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/50 transition-all placeholder:text-zinc-750"
                              required
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={isVerifyingOtp}
                            className={`w-full py-3.5 rounded-xl font-bold text-sm text-black bg-yellow-400 hover:bg-yellow-300 shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer`}
                          >
                            {isVerifyingOtp ? (
                              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <Check size={16} strokeWidth={2.5} />
                                <span>Verify Code & Confirm</span>
                              </>
                            )}
                          </button>
                        </form>

                        <button 
                          onClick={() => {
                            setAuthStep('email-input');
                            setVerificationError('');
                          }}
                          className="w-full py-2.5 text-zinc-400 hover:text-white transition-all text-xs font-bold text-center flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ArrowLeft size={14} />
                          Change Email Address
                        </button>
                      </div>
                    )}

                    {authStep === 'setup' && (
                      <div className="space-y-5">
                        <div className="text-center space-y-1">
                          <div className="inline-flex items-center gap-1.5 bg-lime-500/10 border border-lime-500/20 px-3 py-1 rounded-full text-xs text-lime-400 font-bold tracking-wide">
                            <Check size={12} strokeWidth={3} />
                            <span>Identity Secure</span>
                          </div>
                          <h4 className="text-sm font-bold text-zinc-400 mt-1">Initialize your scientific identity</h4>
                        </div>

                        {/* User Profile Avatar simulation */}
                        <div className="flex flex-col items-center py-2">
                          <div className={`w-20 h-20 rounded-full p-[3px] bg-gradient-to-tr from-zinc-800 via-zinc-900 to-${editThemeTint}-500 shadow-xl overflow-hidden`}>
                            <div className="w-full h-full rounded-full bg-zinc-950 p-[2px] overflow-hidden flex items-center justify-center text-zinc-500">
                              <UserIcon size={32} />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {/* Display Name Input */}
                          <div>
                            <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Display Name</label>
                            <input 
                              type="text" 
                              value={editName} 
                              onChange={(e) => setEditName(e.target.value.slice(0, 50))} 
                              placeholder="e.g. Professor Smith"
                              maxLength={50}
                              className="w-full bg-zinc-900 text-white border border-zinc-800/80 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-zinc-700 transition-all placeholder:text-zinc-650"
                            />
                          </div>

                          {/* Specialization Selection */}
                          <div>
                            <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Academic Role</label>
                            <div className="grid grid-cols-2 gap-1.5">
                              {['General', 'Student', 'Educator', 'Researcher', 'Professional', 'Hobbyist'].map((roleOpt) => (
                                <button
                                  key={'onboard-role-' + roleOpt}
                                  type="button"
                                  onClick={() => setEditProfession(roleOpt)}
                                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all flex items-center justify-between ${
                                    editProfession === roleOpt
                                      ? `bg-zinc-900 text-white border-zinc-700 shadow-sm`
                                      : 'bg-zinc-950/20 text-zinc-500 border-zinc-900 hover:border-zinc-800 hover:text-zinc-450'
                                  }`}
                                >
                                  <span>{roleOpt}</span>
                                  {editProfession === roleOpt && (
                                    <div className={`w-2 h-2 rounded-full ${themeColors[editThemeTint as keyof typeof themeColors]?.bg || currentTheme.bg}`}></div>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Academic Bio */}
                          <div>
                            <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Biography</label>
                            <textarea
                              placeholder="Research domains, focus areas or calculation goals..."
                              value={editBio}
                              onChange={(e) => setEditBio(e.target.value.slice(0, 150))}
                              maxLength={150}
                              rows={2.5}
                              className="w-full bg-zinc-900 text-white border border-zinc-800/80 rounded-xl py-3 px-4 text-xs focus:outline-none focus:border-zinc-700 transition-all placeholder:text-zinc-600 resize-none animate-none"
                            ></textarea>
                          </div>

                          {/* Choose Theme Tint */}
                          <div>
                            <label className="block text-xs font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Favorite Lab Accent</label>
                            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-zinc-950 border border-zinc-900 justify-around">
                              {(Object.keys(themeColors) as Array<keyof typeof themeColors>).map((tint) => {
                                const config = themeColors[tint];
                                const isSelected = editThemeTint === tint;
                                return (
                                  <button
                                    key={'onboard-theme-' + tint}
                                    type="button"
                                    onClick={() => setEditThemeTint(tint)}
                                    className="relative w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                                    style={{ backgroundColor: config.hex }}
                                  >
                                    {isSelected && (
                                      <div className="absolute inset-0 rounded-full border-2 border-[#0a0a0c] flex items-center justify-center">
                                        <Check size={12} className="text-black font-bold" strokeWidth={3} />
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={handleCompleteSetup}
                          disabled={isSavingProfile}
                          className="w-full py-4 mt-2 bg-emerald-400 hover:bg-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.3)] text-black rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {isSavingProfile ? (
                            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <Check size={16} strokeWidth={2.5} />
                              <span>Complete Setup & Create Profile</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Install App Guidance Modal */}
            <AnimatePresence>
              {isInstallModalOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
                  onClick={() => closeModal("install")}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden"
                  >
                    <div 
                      className="absolute inset-0 pointer-events-none opacity-20"
                      style={{
                        background: `radial-gradient(ellipse_at_top, ${currentTheme.hex}40, transparent 70%)`
                      }}
                    />

                    <div className="flex justify-between items-center mb-5 relative z-10">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 p-1 flex items-center justify-center">
                          <img src="/app-logo.png" alt="Logo" className="w-full h-full object-contain rounded-lg" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">Install Mahraj Calculus</h3>
                          <p className="text-[11px] text-zinc-400">Android & Mobile Native PWA</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => closeModal("install")}
                        className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-all"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="space-y-4 relative z-10 text-xs">
                      {deferredPrompt && (
                        <button
                          onClick={async () => {
                            if (deferredPrompt) {
                              deferredPrompt.prompt();
                              const { outcome } = await deferredPrompt.userChoice;
                              if (outcome === 'accepted') {
                                setDeferredPrompt(null);
                                closeModal("install");
                              }
                            }
                          }}
                          className={`w-full py-3.5 rounded-xl font-bold text-sm text-black ${currentTheme.bg} ${currentTheme.shadowButton} hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2`}
                        >
                          <Smartphone size={18} />
                          <span>Install Directly Now</span>
                        </button>
                      )}

                      <div className="bg-zinc-900/90 border border-zinc-800/90 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center gap-2 font-bold text-zinc-300">
                          <Smartphone size={15} className={currentTheme.text} />
                          <span>Android Installation Steps:</span>
                        </div>
                        
                        <div className="space-y-2.5 text-zinc-400 text-[11px]">
                          <div className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                            <span>Open this website in <strong>Google Chrome</strong> or your mobile browser.</span>
                          </div>
                          <div className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                            <span className="flex items-center gap-1 flex-wrap">
                              Tap the 3 dots menu (<MoreVertical size={12} className="inline text-zinc-300" />) in the top-right corner.
                            </span>
                          </div>
                          <div className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                            <span>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-zinc-900/50 border border-zinc-850 rounded-2xl p-3.5 space-y-1.5 text-zinc-400 text-[11px]">
                        <div className="flex items-center gap-2 font-semibold text-zinc-300">
                          <Share2 size={13} className="text-zinc-400" />
                          <span>iPhone / iOS Users:</span>
                        </div>
                        <p className="text-[10.5px] leading-relaxed">
                          Tap the <strong>Share</strong> button at the bottom of Safari, then tap <strong>"Add to Home Screen"</strong>.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-center text-[10px] text-zinc-400 pt-1">
                        <div className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                          ⚡ <strong>Offline Ready</strong>
                        </div>
                        <div className="p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                          📱 <strong>Full Screen App</strong>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Modern Android Back Button Exit Confirmation Toast */}
      <AnimatePresence>
        {showExitToast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-zinc-900/95 border border-zinc-700/80 text-zinc-200 text-xs font-semibold shadow-[0_10px_30px_rgba(0,0,0,0.8)] backdrop-blur-md flex items-center gap-2 pointer-events-none"
          >
            <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse"></span>
            <span>Press back again to exit</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
