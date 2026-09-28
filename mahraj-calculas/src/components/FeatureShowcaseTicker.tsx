import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles,
  Calculator, 
  Atom, 
  FlaskConical, 
  CircleDollarSign, 
  LibraryBig, 
  BookOpen, 
  Zap,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Volume2
} from 'lucide-react';

export interface AppFeature {
  id: string;
  name: string;
  badge: string;
  category: string;
  tagline: string;
  description: string;
  accentColor: string;
  glowColor: string;
  bgGradient: string;
  keyCapability: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

// 1st item is AI Voice as requested, followed sequentially by all other tools!
export const APP_FEATURES: AppFeature[] = [
  {
    id: 'ai',
    name: 'Mahraj AI Voice Copilot',
    badge: 'ASTRA 6 • LIVE',
    category: 'AI Multilingual Assistant & OCR',
    tagline: 'Real-time Voice Conversation & Camera Homework Solver',
    description: 'Bolein aur samjhein — Hindi/Urdu/English me interactive voice guidance deta hai, aur camera se handwritten homework scan karke step-by-step solution nikalta hai.',
    keyCapability: '🎙️ Live Voice Q&A • 📸 Camera OCR • 🌌 Astra Live Wallpaper',
    accentColor: '#818cf8', // Indigo / Electric Purple
    glowColor: 'rgba(129, 140, 248, 0.45)',
    bgGradient: 'from-indigo-950/70 via-purple-950/40 to-black',
    icon: Sparkles,
  },
  {
    id: 'math',
    name: 'Scientific Math & Graphing',
    badge: 'MATH ENGINE',
    category: 'Advanced Algebra & Calculus',
    tagline: 'High-Precision Scientific Calculation & Function Plotter',
    description: 'Trigonometry (sin, cos, tan, rad/deg), logarithmic & exponential functions, powers, roots, scientific notation aur memory registers ke saath instant precision calculations.',
    keyCapability: '📐 20-digit Precision • 📈 2D Curve Graphing • ⚡ Instant Memory',
    accentColor: '#a3e635', // Lime
    glowColor: 'rgba(163, 230, 53, 0.45)',
    bgGradient: 'from-lime-950/60 via-zinc-950/40 to-black',
    icon: Calculator,
  },
  {
    id: 'physics',
    name: 'Physics Lab & Mechanics',
    badge: 'PHYSICS LAB',
    category: 'Kinematics & Electromagnetic Laws',
    tagline: 'Instant Formula Solvers & Multi-Unit Converters',
    description: "Velocity, Force, Kinetic Energy, Ohm's law, Coulomb's force, density calculate karein aur SI unit conversions (Force, Pressure, Energy, Speed) foran convert karein.",
    keyCapability: '⚡ Kinematic Equations • 🧲 Electromagnetism • 🔄 Unit Converter',
    accentColor: '#22d3ee', // Cyan
    glowColor: 'rgba(34, 211, 238, 0.45)',
    bgGradient: 'from-cyan-950/60 via-zinc-950/40 to-black',
    icon: Atom,
  },
  {
    id: 'chemistry',
    name: 'Chemistry & Molecular Lab',
    badge: 'CHEM STUDIO',
    category: 'Stoichiometry & Periodic Elements',
    tagline: 'Molar Mass Calculator, Gas Laws & Elemental Constants',
    description: 'Molecules ka molecular weight nikaalein, ideal gas PV=nRT law calculate karein, solution molarity check karein aur complete periodic table constants dekhein.',
    keyCapability: '🧪 Molar Mass • 💨 PV=nRT Gas Laws • 📊 Periodic Table',
    accentColor: '#fbbf24', // Amber / Gold
    glowColor: 'rgba(251, 191, 36, 0.45)',
    bgGradient: 'from-amber-950/60 via-zinc-950/40 to-black',
    icon: FlaskConical,
  },
  {
    id: 'currency',
    name: 'Global Currency & Forex',
    badge: 'FOREX HUB',
    category: 'Real-time Foreign Exchange',
    tagline: 'Live Multi-Currency Conversion with Global Rates',
    description: '40+ international currencies (USD, INR, EUR, GBP, PKR, SAR, AED, JPY) ka live market rate conversion aur financial tools ek hi jagah par.',
    keyCapability: '💱 40+ Currencies • 📈 Live Rate Sync • 💰 Forex Calculation',
    accentColor: '#10b981', // Emerald
    glowColor: 'rgba(16, 185, 129, 0.45)',
    bgGradient: 'from-emerald-950/60 via-zinc-950/40 to-black',
    icon: CircleDollarSign,
  },
  {
    id: 'formulas',
    name: 'Scientific Formula Library',
    badge: 'FORMULA LIB',
    category: 'Verified Scientific Encyclopedia',
    tagline: 'Directory of 200+ Mathematical, Physics & Chemistry Laws',
    description: 'Calculus identities, geometry formulas, electromagnetic laws aur chemistry reaction formulas ko instantly search aur copy karein.',
    keyCapability: '📚 200+ Formulas • 🔍 Instant Search • 📋 1-Tap Copy',
    accentColor: '#c084fc', // Purple
    glowColor: 'rgba(192, 132, 252, 0.45)',
    bgGradient: 'from-purple-950/60 via-zinc-950/40 to-black',
    icon: LibraryBig,
  },
  {
    id: 'books',
    name: 'Academic Books & Reader',
    badge: 'NCERT READER',
    category: 'Curriculum & Reference Hub',
    tagline: 'Textbook Reader, Chapter Questions & Practice Problem Sets',
    description: 'Academic syllabus books, chapter reference materials aur conceptual exam practice problems ko read aur review karein.',
    keyCapability: '📖 Textbook Reader • 📝 Chapter Questions • 🎯 Exam Prep',
    accentColor: '#f43f5e', // Rose
    glowColor: 'rgba(244, 63, 94, 0.45)',
    bgGradient: 'from-rose-950/60 via-zinc-950/40 to-black',
    icon: BookOpen,
  }
];

interface FeatureShowcaseProps {
  onSelectFeature?: (id: string) => void;
  autoPlay?: boolean;
}

export function FeatureShowcaseTicker({ onSelectFeature, autoPlay = true }: FeatureShowcaseProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const DURATION_MS = 3800;
  const UPDATE_INTERVAL = 40;

  useEffect(() => {
    if (!autoPlay || isPaused) return;

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentIndex((curr) => (curr + 1) % APP_FEATURES.length);
          return 0;
        }
        return prev + (UPDATE_INTERVAL / DURATION_MS) * 100;
      });
    }, UPDATE_INTERVAL);

    return () => clearInterval(progressTimer);
  }, [autoPlay, isPaused, currentIndex]);

  const handleNext = () => {
    setProgress(0);
    setCurrentIndex((prev) => (prev + 1) % APP_FEATURES.length);
  };

  const handlePrev = () => {
    setProgress(0);
    setCurrentIndex((prev) => (prev - 1 + APP_FEATURES.length) % APP_FEATURES.length);
  };

  const current = APP_FEATURES[currentIndex];
  const IconComponent = current.icon;

  return (
    <div 
      className="w-full my-2 flex flex-col items-center select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* 1. Prominent "NEW FEATURES" Header Banner with Glowing Animation */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-zinc-950 border border-zinc-800/90 shadow-md mb-2.5 backdrop-blur-md"
      >
        <span className="relative flex h-2 w-2">
          <span 
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: current.accentColor }}
          />
          <span 
            className="relative inline-flex rounded-full h-2 w-2"
            style={{ backgroundColor: current.accentColor }}
          />
        </span>

        <span className="text-[11px] font-black tracking-widest uppercase bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent flex items-center gap-1.5 font-mono">
          <Sparkles size={11} className="text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          NEW FEATURES
        </span>

        <span className="text-[9.5px] font-mono text-zinc-500 font-bold border-l border-zinc-800 pl-2">
          {currentIndex + 1} / {APP_FEATURES.length}
        </span>
      </motion.div>

      {/* 2. Main Animated Sequential Feature Card (Appear -> Details -> Disappear) */}
      <div 
        onClick={() => onSelectFeature && onSelectFeature(current.id)}
        className="w-full relative min-h-[175px] rounded-3xl bg-zinc-950/95 border border-zinc-850 hover:border-zinc-700 transition-all duration-300 overflow-hidden shadow-2xl p-4 flex flex-col justify-between cursor-pointer group"
      >
        
        {/* Dynamic Background Glow according to the active feature */}
        <div 
          className={`absolute inset-0 bg-gradient-to-br ${current.bgGradient} opacity-60 pointer-events-none transition-all duration-700`}
        />
        <div 
          className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full blur-3xl opacity-30 pointer-events-none transition-all duration-700"
          style={{ backgroundColor: current.accentColor }}
        />

        {/* Feature Animated In / Out Stage */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 16, scale: 0.96, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -16, scale: 0.96, filter: 'blur(6px)' }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col justify-between h-full relative z-10 space-y-2.5"
          >
            {/* Top Row: Icon, Title, Badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <motion.div 
                  initial={{ rotate: -15, scale: 0.8 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ type: 'spring', damping: 14, stiffness: 200 }}
                  className="w-9 h-9 rounded-2xl flex items-center justify-center border shadow-lg"
                  style={{
                    backgroundColor: `${current.accentColor}20`,
                    borderColor: `${current.accentColor}50`,
                    color: current.accentColor,
                    boxShadow: `0 0 16px ${current.glowColor}`
                  }}
                >
                  <IconComponent size={18} />
                </motion.div>

                <div className="text-left">
                  <h4 className="text-[13px] font-black text-white tracking-wide uppercase leading-tight">
                    {current.name}
                  </h4>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">
                    {current.category}
                  </span>
                </div>
              </div>

              {/* Status / Feature Badge */}
              <span 
                className="px-2.5 py-1 rounded-full text-[9px] font-mono font-bold tracking-wider uppercase border shadow-sm"
                style={{
                  backgroundColor: `${current.accentColor}18`,
                  borderColor: `${current.accentColor}40`,
                  color: current.accentColor
                }}
              >
                {current.badge}
              </span>
            </div>

            {/* Middle Section: Tagline, Details & Capabilities */}
            <div className="text-left space-y-1">
              <p className="text-xs font-bold text-zinc-100 leading-snug">
                {current.tagline}
              </p>
              <p className="text-[11px] text-zinc-300 leading-relaxed font-sans">
                {current.description}
              </p>
            </div>

            {/* Key Capability Highlight Strip */}
            <div 
              className="p-2.5 rounded-xl bg-black/60 border border-zinc-800 text-[11px] font-mono text-zinc-300 flex items-center justify-between"
            >
              <span className="truncate pr-2">{current.keyCapability}</span>
            </div>

            {/* Big Prominent Glow Launch Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectFeature) onSelectFeature(current.id);
              }}
              className="w-full py-2.5 px-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 text-black cursor-pointer"
              style={{
                backgroundColor: current.accentColor,
                boxShadow: `0 0 20px ${current.glowColor}`
              }}
            >
              <span>🚀 Launch {current.name.split(' ')[0]} Now</span>
              <ArrowRight size={14} strokeWidth={3} />
            </button>
          </motion.div>
        </AnimatePresence>

        {/* 3. Bottom Progress Bar & Navigation Controls */}
        <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500 font-mono relative z-20 mt-1">
          {/* Previous / Next Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              className="w-5 h-5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
              title="Previous feature"
            >
              <ChevronLeft size={12} />
            </button>
            <button
              onClick={handleNext}
              className="w-5 h-5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
              title="Next feature"
            >
              <ChevronRight size={12} />
            </button>
          </div>

          {/* Linear Progress Bar of Current Feature */}
          <div className="flex-1 mx-3 h-1 bg-zinc-900 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-75 ease-linear"
              style={{
                width: `${progress}%`,
                backgroundColor: current.accentColor,
                boxShadow: `0 0 8px ${current.accentColor}`
              }}
            />
          </div>

          {/* Feature Step Indicator Dots */}
          <div className="flex items-center gap-1">
            {APP_FEATURES.map((feat, idx) => (
              <button
                key={feat.id}
                onClick={() => {
                  setProgress(0);
                  setCurrentIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex 
                    ? 'w-4' 
                    : 'w-1.5 bg-zinc-800 hover:bg-zinc-700'
                }`}
                style={{
                  backgroundColor: idx === currentIndex ? feat.accentColor : undefined
                }}
                title={feat.name}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
