import { useState, useEffect, useRef, useCallback } from 'react';
import { Delete } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../FirebaseProvider';
import { saveCalculation } from '../firebase';

// Ultra-lightweight subtle haptic feedback for physical calculator feel
const triggerHaptic = (ms: number = 8) => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(ms);
    } catch (_) {}
  }
};

export function MathMode() {
  const [current, setCurrent] = useState('0');
  const [previous, setPrevious] = useState<string | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);
  const [isRad, setIsRad] = useState(false);
  const [isSciNotation, setIsSciNotation] = useState(false);
  const [memory, setMemory] = useState<number>(0);
  const [lastOperator, setLastOperator] = useState<string | null>(null);
  const [lastOperand, setLastOperand] = useState<string | null>(null);
  const { user } = useAuth();

  // Ref mirror for instantaneous zero-drop keyboard handling
  const calcStateRef = useRef({
    current,
    previous,
    operator,
    waitingForNewValue,
    isRad,
    isSciNotation,
    memory,
    lastOperator,
    lastOperand
  });

  useEffect(() => {
    calcStateRef.current = {
      current,
      previous,
      operator,
      waitingForNewValue,
      isRad,
      isSciNotation,
      memory,
      lastOperator,
      lastOperand
    };
  }, [current, previous, operator, waitingForNewValue, isRad, isSciNotation, memory, lastOperator, lastOperand]);

  const formatForDisplay = (numStr: string, isActiveInput: boolean = false) => {
    if (!numStr || numStr === 'NaN' || numStr === 'Infinity' || numStr === '-Infinity' || numStr === 'Error') {
      return numStr === 'Error' || numStr === 'NaN' || numStr === 'Infinity' || numStr === '-Infinity' ? 'Error' : '0';
    }
    
    // When the user is actively entering or backspacing their input, NEVER overwrite or round their exact digits!
    if (isActiveInput) {
      return numStr;
    }

    const num = Number(numStr);
    if (!isNaN(num) && isFinite(num)) {
      if (isSciNotation) {
        return num.toExponential(6);
      }
      if (Math.abs(num) >= 1e16 || (Math.abs(num) < 1e-9 && num !== 0)) {
        return num.toExponential(6);
      }
      if (numStr.length > 14) {
        return String(parseFloat(num.toPrecision(10)));
      }
    }
    return numStr;
  };

  const handleNum = useCallback((num: string) => {
    triggerHaptic(6);
    setCurrent(prev => {
      const isWaiting = calcStateRef.current.waitingForNewValue;
      if (prev === 'Error' || isWaiting) {
        setWaitingForNewValue(false);
        return num;
      }
      // Safe buffer limit to prevent number overflow
      if (prev.replace('-', '').replace('.', '').length >= 20) {
        return prev;
      }
      return prev === '0' ? num : prev + num;
    });
  }, []);

  const handleDot = useCallback(() => {
    triggerHaptic(6);
    setCurrent(prev => {
      const isWaiting = calcStateRef.current.waitingForNewValue;
      if (prev === 'Error' || isWaiting) {
        setWaitingForNewValue(false);
        return '0.';
      }
      if (!prev.includes('.')) {
        return prev + '.';
      }
      return prev;
    });
  }, []);

  const handleClear = useCallback(() => {
    triggerHaptic(8);
    setCurrent('0');
  }, []);

  const handleAllClear = useCallback(() => {
    triggerHaptic(10);
    setCurrent('0');
    setPrevious(null);
    setOperator(null);
    setWaitingForNewValue(false);
  }, []);

  const handleBackspace = useCallback(() => {
    triggerHaptic(8);
    setCurrent(prev => {
      const isWaiting = calcStateRef.current.waitingForNewValue;
      if (isWaiting || prev === 'Error') {
        setWaitingForNewValue(false);
        return '0';
      }
      if (prev.includes('e') || prev.includes('E')) {
        return '0';
      }
      if (prev.length <= 1) {
        return '0';
      }
      const val = prev.slice(0, -1);
      return (val.length > 0 && val !== '-' && val !== '-0') ? val : '0';
    });
  }, []);

  const handleToggleSign = useCallback(() => {
    triggerHaptic(8);
    setCurrent(prev => {
      if (prev === '0' || prev === 'Error') return prev;
      return prev.startsWith('-') ? prev.slice(1) : '-' + prev;
    });
  }, []);

  const handlePercent = useCallback(() => {
    triggerHaptic(8);
    setCurrent(prev => {
      if (prev === 'Error') return prev;
      const val = parseFloat(prev);
      setWaitingForNewValue(true);
      return String(val / 100);
    });
  }, []);

  const calculate = (a: number, b: number, op: string) => {
    if (isNaN(a) || isNaN(b) || !isFinite(a) || !isFinite(b)) return NaN;
    let res = 0;
    switch (op) {
      case '+': res = a + b; break;
      case '-': res = a - b; break;
      case '×': res = a * b; break;
      case '÷': res = b === 0 ? NaN : a / b; break;
      case '^': 
        if (Math.abs(b) > 2000 && Math.abs(a) > 1) {
          return a > 0 ? Infinity : -Infinity;
        }
        res = Math.pow(a, b); 
        break;
      default: res = b;
    }
    if (isNaN(res) || !isFinite(res)) return res;
    // Mitigate 0.1 + 0.2 = 0.30000000000000004 issues
    return Math.round(res * 1e12) / 1e12;
  };

  const handleOperator = useCallback((op: string) => {
    triggerHaptic(10);
    const { current: cur, previous: prev, operator: activeOp, waitingForNewValue: isWaiting } = calcStateRef.current;
    if (cur === 'Error') return;

    if (activeOp && prev && !isWaiting) {
      const result = calculate(parseFloat(prev), parseFloat(cur), activeOp);
      const strRes = String(result);
      setCurrent(strRes);
      setPrevious(strRes);
    } else {
      setPrevious(cur);
    }
    setOperator(op);
    setWaitingForNewValue(true);
    setLastOperator(null);
    setLastOperand(null);
  }, []);

  const handleEquals = useCallback(() => {
    triggerHaptic(14);
    const { current: cur, previous: prev, operator: op, lastOperator: lastOp, lastOperand: lastOpnd } = calcStateRef.current;
    if (cur === 'Error') return;

    if (op && prev) {
      const result = calculate(parseFloat(prev), parseFloat(cur), op);
      const strRes = isNaN(result) || !isFinite(result) ? 'Error' : String(result);
      setCurrent(strRes);
      if (strRes !== 'Error') {
        saveCalculation(user?.uid, 'Math', `${prev} ${op} ${cur}`, strRes).catch(() => {});
      }
      setLastOperator(op);
      setLastOperand(cur);
      setPrevious(null);
      setOperator(null);
      setWaitingForNewValue(true);
    } else if (lastOp && lastOpnd) {
      const result = calculate(parseFloat(cur), parseFloat(lastOpnd), lastOp);
      const strRes = isNaN(result) || !isFinite(result) ? 'Error' : String(result);
      setCurrent(strRes);
      if (strRes !== 'Error') {
        saveCalculation(user?.uid, 'Math', `${cur} ${lastOp} ${lastOpnd}`, strRes).catch(() => {});
      }
      setWaitingForNewValue(true);
    }
  }, [user]);

  const handleScientific = useCallback((func: string) => {
    triggerHaptic(10);
    const { current: cur, waitingForNewValue: isWaiting, isRad: rad } = calcStateRef.current;
    if (cur === 'Error') return;
    const val = parseFloat(cur);
    if (isNaN(val)) return;
    let result = 0;

    let angle = val;
    if (!rad && ['sin', 'cos', 'tan'].includes(func)) {
      angle = val * (Math.PI / 180);
    }

    switch (func) {
      case 'sin': result = Math.sin(angle); break;
      case 'cos': result = Math.cos(angle); break;
      case 'tan': 
        if (!rad && val % 180 === 90) result = NaN;
        else result = Math.tan(angle); 
        break;
      case 'log': result = val <= 0 ? NaN : Math.log10(val); break;
      case 'ln': result = val <= 0 ? NaN : Math.log(val); break;
      case '√': result = val < 0 ? NaN : Math.sqrt(val); break;
      case 'π': 
        setCurrent(String(isWaiting || cur === '0' ? Math.PI : val * Math.PI));
        setWaitingForNewValue(true);
        return;
      case 'e':
        setCurrent(String(isWaiting || cur === '0' ? Math.E : val * Math.E));
        setWaitingForNewValue(true);
        return;
    }
    
    if (isNaN(result) || !isFinite(result)) {
      setCurrent('Error');
      setWaitingForNewValue(true);
      return;
    }

    result = Math.round(result * 1e12) / 1e12;
    const strRes = String(result);
    setCurrent(strRes);
    saveCalculation(user?.uid, 'Scientific', `${func}(${val})`, strRes).catch(() => {});
    setWaitingForNewValue(true);
  }, [user]);

  // Memory functions
  const handleMC = useCallback(() => {
    triggerHaptic(8);
    setMemory(0);
  }, []);

  const handleMR = useCallback(() => {
    triggerHaptic(8);
    setCurrent(String(calcStateRef.current.memory));
    setWaitingForNewValue(true);
  }, []);

  const handleMPlus = useCallback(() => {
    triggerHaptic(8);
    const val = parseFloat(calcStateRef.current.current);
    if (!isNaN(val)) {
      setMemory(prev => Math.round((prev + val) * 1e12) / 1e12);
      setWaitingForNewValue(true);
    }
  }, []);

  const handleMMinus = useCallback(() => {
    triggerHaptic(8);
    const val = parseFloat(calcStateRef.current.current);
    if (!isNaN(val)) {
      setMemory(prev => Math.round((prev - val) * 1e12) / 1e12);
      setWaitingForNewValue(true);
    }
  }, []);

  const handleMS = useCallback(() => {
    triggerHaptic(8);
    const val = parseFloat(calcStateRef.current.current);
    if (!isNaN(val)) {
      setMemory(val);
      setWaitingForNewValue(true);
    }
  }, []);

  // Global physical & virtual keyboard event listener with ZERO drop rate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if focus is inside an input or textarea
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      
      if (e.key >= '0' && e.key <= '9') {
        handleNum(e.key);
      } else if (e.key === '.') {
        handleDot();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        handleClear();
      } else if (e.key === '+' || e.key === '-') {
        handleOperator(e.key);
      } else if (e.key === '*' || e.key === 'x') {
        handleOperator('×');
      } else if (e.key === '/') {
        e.preventDefault();
        handleOperator('÷');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (e.key === '%') {
        handlePercent();
      } else if (e.key === '^') {
        handleOperator('^');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNum, handleDot, handleBackspace, handleClear, handleOperator, handleEquals, handlePercent]);

  const displayValue = formatForDisplay(current, !waitingForNewValue);

  // Fast, instant-reaction tactile button classes
  const btnBase = "h-11 sm:h-13 rounded-xl text-md sm:text-lg font-mono font-medium transition-all active:scale-95 duration-75 focus:outline-none flex items-center justify-center border border-transparent shadow-[inset_0px_1px_0px_0px_rgba(255,255,255,0.05)] select-none touch-manipulation cursor-pointer";
  const btnNu = `${btnBase} bg-zinc-900/90 active:bg-zinc-800 text-green-100 border-zinc-800/60 hover:border-lime-500/30 hover:bg-zinc-850`;
  const btnOp = `${btnBase} bg-lime-500/10 text-lime-400 border-lime-500/10 hover:bg-lime-500/20 hover:border-lime-500/55 active:bg-lime-500/30`;
  const btnOpActive = `${btnBase} bg-lime-400 text-black shadow-[0_0_15px_rgba(163,230,53,0.5)]`;
  const btnFn = `${btnBase} bg-zinc-850 text-zinc-300 border-zinc-800 hover:bg-zinc-700 hover:text-white active:bg-zinc-800`;
  const btnSci = `${btnBase} bg-zinc-800/30 text-cyan-400 border-zinc-800/40 hover:bg-zinc-700/50 hover:text-cyan-300 active:bg-zinc-800/60 text-xs sm:text-sm`;
  
  const btnMem = `${btnBase} text-xs sm:text-sm bg-indigo-500/5 text-indigo-300/90 border-indigo-500/10 hover:bg-indigo-500/10 hover:text-indigo-200 hover:border-indigo-500/30`;
  const btnMemActive = `${btnBase} text-xs sm:text-sm bg-indigo-500/15 text-indigo-300 border-indigo-500/35 hover:bg-indigo-500/25 hover:text-indigo-200 shadow-[0_0_12px_rgba(99,102,241,0.15)] font-bold`;

  return (
    <div className="flex-1 flex flex-col justify-end p-4 relative z-10 w-full h-full select-none">
      <div className="flex flex-col items-end justify-end mb-4 flex-1 relative min-h-[90px]">
        
        {/* On-Screen Badges */}
        <div className="absolute top-2 left-0 flex flex-wrap gap-2 items-center">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { triggerHaptic(8); setIsRad(!isRad); }}
            className="bg-zinc-800/50 text-zinc-400 hover:text-white px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold tracking-widest transition-colors border border-zinc-700/50"
          >
            {isRad ? 'RAD' : 'DEG'}
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { triggerHaptic(8); setIsSciNotation(!isSciNotation); }}
            className={`px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold tracking-widest transition-colors border ${isSciNotation ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.15)]' : 'bg-zinc-800/50 text-zinc-400 hover:text-white border-zinc-700/50'}`}
          >
            SCI
          </motion.button>

          {/* Glowing Memory Indicator with Slide & Scale Animation */}
          <AnimatePresence>
            {memory !== 0 && (
              <motion.div 
                initial={{ scale: 0.3, opacity: 0, x: -10 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                exit={{ scale: 0.3, opacity: 0, x: -10 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="bg-indigo-950/75 text-indigo-300 px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold font-mono tracking-wide border border-indigo-500/30 flex items-center gap-1.5 shadow-[0_0_12px_rgba(99,102,241,0.25)]"
                title={`Stored in memory: ${memory}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                <span>M: {formatForDisplay(String(memory))}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Previous Equation Trail */}
        <div className="text-lime-500/70 text-lg sm:text-xl font-mono h-8 mb-2 flex gap-3 select-none">
          <AnimatePresence mode="popLayout">
            {previous && (
              <motion.span 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.15 }}
              >
                {formatForDisplay(previous, false)}
              </motion.span>
            )}
            {operator && (
              <motion.span 
                initial={{ scale: 0.7 }}
                animate={{ scale: 1 }}
                className="text-lime-400"
              >
                {operator}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Dynamic Butter-Smooth Display Value with Tabular-Nums (Zero Jitter, Zero Lag) */}
        <div className="w-full h-16 sm:h-20 flex items-center justify-end overflow-hidden">
          <div 
            className={`text-white font-mono font-medium tracking-tight tabular-nums truncate w-full text-right drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] select-all select-none ${
              displayValue.length > 17
                ? 'text-xl sm:text-2xl'
                : displayValue.length > 13
                  ? 'text-2xl sm:text-3xl'
                  : displayValue.length > 9
                    ? 'text-3xl sm:text-4xl'
                    : displayValue.length > 7
                      ? 'text-4xl sm:text-5xl'
                      : 'text-5xl sm:text-6xl'
            }`}
          >
            {displayValue}
          </div>
        </div>
      </div>

      {/* Calculator Buttons Grid with Snappy Actuation (Fast 0.04s tap) */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {/* Scientific Row 1 */}
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.94, transition: { duration: 0.04 } }} className={btnSci} onClick={() => handleScientific('sin')}>sin</motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.94, transition: { duration: 0.04 } }} className={btnSci} onClick={() => handleScientific('cos')}>cos</motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.94, transition: { duration: 0.04 } }} className={btnSci} onClick={() => handleScientific('tan')}>tan</motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.94, transition: { duration: 0.04 } }} className={btnSci} onClick={() => handleScientific('√')}>√</motion.button>

        {/* Scientific Row 2 */}
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.94, transition: { duration: 0.04 } }} className={btnSci} onClick={() => handleScientific('log')}>log</motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.94, transition: { duration: 0.04 } }} className={btnSci} onClick={() => handleScientific('ln')}>ln</motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.94, transition: { duration: 0.04 } }} className={btnSci} onClick={() => handleScientific('π')}>π</motion.button>
        <motion.button 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.94, transition: { duration: 0.04 } }} 
          className={`${btnSci} bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/20 hover:border-red-500/40`} 
          onClick={handleBackspace} 
          title="Backspace (Clear last number)"
        >
          <Delete size={18} />
        </motion.button>

        {/* MEMORY FUNCTIONS ROW */}
        <div className="col-span-4 grid grid-cols-5 gap-2 sm:gap-3 my-0.5">
          <motion.button 
            whileHover={{ scale: 1.03 }} 
            whileTap={{ scale: 0.93, transition: { duration: 0.04 } }} 
            className={memory !== 0 ? btnMemActive : btnMem} 
            onClick={handleMC} 
            title="MC: Clear Memory"
          >
            MC
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.03 }} 
            whileTap={{ scale: 0.93, transition: { duration: 0.04 } }} 
            className={memory !== 0 ? btnMemActive : btnMem} 
            onClick={handleMR} 
            title="MR: Recall Memory"
          >
            MR
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.03 }} 
            whileTap={{ scale: 0.93, transition: { duration: 0.04 } }} 
            className={btnMem} 
            onClick={handleMPlus} 
            title="M+: Add state to Memory"
          >
            M+
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.03 }} 
            whileTap={{ scale: 0.93, transition: { duration: 0.04 } }} 
            className={btnMem} 
            onClick={handleMMinus} 
            title="M-: Subtract state from Memory"
          >
            M-
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.03 }} 
            whileTap={{ scale: 0.93, transition: { duration: 0.04 } }} 
            className={btnMem} 
            onClick={handleMS} 
            title="MS: Store current in Memory"
          >
            MS
          </motion.button>
        </div>

        {/* Standard Calc Control Row */}
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.94, transition: { duration: 0.04 } }} className={btnFn} onClick={handleAllClear} title="All Clear">AC</motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.94, transition: { duration: 0.04 } }} className={btnFn} onClick={handleClear} title="Clear Entry">C</motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.94, transition: { duration: 0.04 } }} className={btnFn} onClick={handlePercent}>%</motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.94, transition: { duration: 0.04 } }} className={operator === '÷' && waitingForNewValue ? btnOpActive : btnOp} onClick={() => handleOperator('÷')}>÷</motion.button>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.94, transition: { duration: 0.04 } }} className={btnNu} onClick={() => handleNum('7')}>7</motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.94, transition: { duration: 0.04 } }} className={btnNu} onClick={() => handleNum('8')}>8</motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.94, transition: { duration: 0.04 } }} className={btnNu} onClick={() => handleNum('9')}>9</motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.94, transition: { duration: 0.04 } }} className={operator === '×' && waitingForNewValue ? btnOpActive : btnOp} onClick={() => handleOperator('×')}>×</motion.button>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.94, transition: { duration: 0.04 } }} className={btnNu} onClick={() => handleNum('4')}>4</motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.94, transition: { duration: 0.04 } }} className={btnNu} onClick={() => handleNum('5')}>5</motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.94, transition: { duration: 0.04 } }} className={btnNu} onClick={() => handleNum('6')}>6</motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.94, transition: { duration: 0.04 } }} className={operator === '-' && waitingForNewValue ? btnOpActive : btnOp} onClick={() => handleOperator('-')}>-</motion.button>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.94, transition: { duration: 0.04 } }} className={btnNu} onClick={() => handleNum('1')}>1</motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.94, transition: { duration: 0.04 } }} className={btnNu} onClick={() => handleNum('2')}>2</motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.94, transition: { duration: 0.04 } }} className={btnNu} onClick={() => handleNum('3')}>3</motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.94, transition: { duration: 0.04 } }} className={operator === '+' && waitingForNewValue ? btnOpActive : btnOp} onClick={() => handleOperator('+')}>+</motion.button>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.94, transition: { duration: 0.04 } }} className={btnFn} onClick={handleToggleSign}>+/-</motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.94, transition: { duration: 0.04 } }} className={btnNu} onClick={() => handleNum('0')}>0</motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.94, transition: { duration: 0.04 } }} className={btnNu} onClick={handleDot}>.</motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.94, transition: { duration: 0.04 } }} className={btnOp} onClick={handleEquals}>=</motion.button>

      </div>
    </div>
  );
}
