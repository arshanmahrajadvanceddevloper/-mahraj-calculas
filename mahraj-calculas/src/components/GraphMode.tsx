import { useState, useMemo, useRef, useEffect, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Sparkles, Sigma, Sliders, Calculator, Dot, Map } from 'lucide-react';
import { useAuth } from '../FirebaseProvider';
import { saveCalculation } from '../firebase';

export function GraphMode() {
  const [activeTab, setActiveTab] = useState<'grapher' | 'stats'>('grapher');
  
  // ==========================================
  // FUNCTION GRAPHER STATE
  // ==========================================
  const [funcType, setFuncType] = useState<'linear' | 'quadratic' | 'sine' | 'cosine'>('quadratic');
  const [coefA, setCoefA] = useState<number>(1);
  const [coefB, setCoefB] = useState<number>(0);
  const [coefC, setCoefC] = useState<number>(0);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number; px: number; py: number } | null>(null);
  const graphContainerRef = useRef<SVGSVGElement | null>(null);

  // Coordinate plane dimensions
  const viewWidth = 340;
  const viewHeight = 260;
  const rangeX = 10; // -10 to +10
  const rangeY = 10; // -10 to +10

  // Maps math coordinates to SVG pixels
  const mathToPixel = (x: number, y: number) => {
    const px = (x - (-rangeX)) * (viewWidth / (rangeX * 2));
    const py = (rangeY - y) * (viewHeight / (rangeY * 2));
    return { x: px, y: py };
  };

  // Maps SVG pixels to math coordinates
  const pixelToMath = (px: number, py: number) => {
    const x = -rangeX + px * ((rangeX * 2) / viewWidth);
    const y = rangeY - py * ((rangeY * 2) / viewHeight);
    return { x, y };
  };

  // Get function value y = f(x)
  const evaluateFunction = (x: number) => {
    switch (funcType) {
      case 'linear':
        return coefA * x + coefB;
      case 'quadratic':
        return coefA * x * x + coefB * x + coefC;
      case 'sine':
        return coefA * Math.sin(coefB * x + coefC);
      case 'cosine':
        return coefA * Math.cos(coefB * x + coefC);
      default:
        return 0;
    }
  };

  // Generate path coordinates for the SVG plot
  const pathData = useMemo(() => {
    const points: string[] = [];
    const steps = 140;
    for (let i = 0; i <= steps; i++) {
      const x = -rangeX + (i / steps) * (rangeX * 2);
      const y = evaluateFunction(x);
      
      // Filter out invalid/infinite points
      if (isNaN(y) || !isFinite(y)) continue;
      
      const { x: px, y: py } = mathToPixel(x, y);
      
      // Limit drawing boundaries to prevent SVG overflow visual glitches
      if (py >= -100 && py <= viewHeight + 100) {
        if (points.length === 0) {
          points.push(`M ${px.toFixed(1)} ${py.toFixed(1)}`);
        } else {
          points.push(`L ${px.toFixed(1)} ${py.toFixed(1)}`);
        }
      }
    }
    return points.join(' ');
  }, [funcType, coefA, coefB, coefC]);

  const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    if (!graphContainerRef.current) return;
    const rect = graphContainerRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    
    // Scale user mouse input positions from visual layout to exact SVG pixels
    const svgPx = (px / rect.width) * viewWidth;
    const svgPy = (py / rect.height) * viewHeight;

    const mathCoord = pixelToMath(svgPx, svgPy);
    const exactY = evaluateFunction(mathCoord.x);
    const exactPixel = mathToPixel(mathCoord.x, exactY);

    setHoverCoord({
      x: mathCoord.x,
      y: exactY,
      px: exactPixel.x,
      py: exactPixel.y
    });
  };

  const handleMouseLeave = () => {
    setHoverCoord(null);
  };

  // ==========================================
  // DATA STATS CALCULATOR STATE
  // ==========================================
  const [dataInput, setDataInput] = useState<string>('5, 12, 18, 12, 25, 30, 22, 12, 19, 28');
  const [hoveredDataIdx, setHoveredDataIdx] = useState<number | null>(null);
  const [isDataSaved, setIsDataSaved] = useState(false);
  const { user } = useAuth();

  // Parse list of values safely (bounded to 1000 items to prevent UI lock on large pastes)
  const numericData = useMemo(() => {
    return dataInput
      .split(/[,\s]+/)
      .slice(0, 1000)
      .map(v => parseFloat(v.trim()))
      .filter(v => !isNaN(v) && isFinite(v));
  }, [dataInput]);

  // Compute detailed statistics
  const stats = useMemo(() => {
    const data = [...numericData].sort((a, b) => a - b);
    const n = data.length;
    if (n === 0) return null;

    const sum = data.reduce((acc, val) => acc + val, 0);
    const mean = sum / n;

    // Median
    const median = n % 2 !== 0 
      ? data[Math.floor(n / 2)] 
      : (data[n / 2 - 1] + data[n / 2]) / 2;

    // Mode
    const freq: Record<number, number> = {};
    let maxFreq = 0;
    data.forEach(x => {
      freq[x] = (freq[x] || 0) + 1;
      if (freq[x] > maxFreq) maxFreq = freq[x];
    });
    const modes: number[] = [];
    if (maxFreq > 1) {
      Object.keys(freq).forEach(k => {
        if (freq[Number(k)] === maxFreq) modes.push(Number(k));
      });
    }

    // Min, Max, Range
    const min = data[0];
    const max = data[n - 1];
    const range = max - min;

    // Standard Deviation & Variance
    const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    return {
      count: n,
      sum,
      mean: Math.round(mean * 1e4) / 1e4,
      median: Math.round(median * 1e4) / 1e4,
      mode: modes.length > 0 ? modes.join(', ') : 'None',
      min,
      max,
      range,
      variance: Math.round(variance * 1e4) / 1e4,
      stdDev: Math.round(stdDev * 1e4) / 1e4,
    };
  }, [numericData]);

  // Automate saving stats calculation to Firebase
  const handleSaveStats = () => {
    if (user && stats && numericData.length > 0) {
      setIsDataSaved(true);
      saveCalculation(
        user.uid, 
        'Data:Statistics', 
        `Data Count: ${stats.count} (Raw: ${numericData.slice(0, 5).join(', ')}...)`,
        `Mean: ${stats.mean}, StdDev: ${stats.stdDev}`
      );
      setTimeout(() => setIsDataSaved(false), 2000);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 w-full h-full relative overflow-y-auto custom-scrollbar bg-black/40">
      
      {/* Selector Tabs */}
      <div className="flex bg-zinc-900/60 p-1.5 rounded-2xl border border-zinc-800/80 mb-4 gap-1.5 shrink-0 select-none">
        <button
          onClick={() => setActiveTab('grapher')}
          className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'grapher'
              ? 'bg-lime-500/15 text-lime-400 border border-lime-500/30'
              : 'text-zinc-400 hover:text-white border border-transparent'
          }`}
        >
          <Map size={14} />
          <span>Interactive Grapher</span>
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'stats'
              ? 'bg-lime-500/15 text-lime-400 border border-lime-500/30'
              : 'text-zinc-400 hover:text-white border border-transparent'
          }`}
        >
          <Sigma size={14} />
          <span>Data Calculations</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'grapher' ? (
          <motion.div
            key="grapher"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="flex-1 flex flex-col gap-4"
          >
            {/* Function Select Strip */}
            <div className="grid grid-cols-4 gap-1 bg-zinc-950/40 p-1 rounded-xl border border-zinc-850">
              {(['linear', 'quadratic', 'sine', 'cosine'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => {
                    setFuncType(type);
                    if (type === 'linear') { setCoefA(1); setCoefB(1); }
                    else if (type === 'quadratic') { setCoefA(1); setCoefB(0); setCoefC(-2); }
                    else if (type === 'sine' || type === 'cosine') { setCoefA(2); setCoefB(1.5); setCoefC(0); }
                  }}
                  className={`py-1.5 rounded-lg text-[10px] sm:text-xs font-bold capitalize transition-colors ${
                    funcType === type
                      ? 'bg-zinc-800 text-lime-400 border border-zinc-700/60'
                      : 'text-zinc-500 hover:text-zinc-350 border border-transparent'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Plotted Interactive Math Grid */}
            <div className="relative bg-zinc-950/80 rounded-2xl border border-zinc-800/80 aspect-[17/13] sm:aspect-auto sm:h-64 flex items-center justify-center overflow-hidden shadow-[inset_0_4px_30px_rgba(0,0,0,0.8)]">
              
              {/* Inner Coordinate Canvas */}
              <svg
                ref={graphContainerRef}
                viewBox={`0 0 ${viewWidth} ${viewHeight}`}
                className="w-full h-full cursor-crosshair select-none"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                {/* Visual Grid Lines (1-unit spacings) */}
                {Array.from({ length: rangeX * 2 + 1 }).map((_, i) => {
                  const val = -rangeX + i;
                  const pt = mathToPixel(val, 0);
                  return (
                    <line
                      key={`grid-x-${i}`}
                      x1={pt.x}
                      y1={0}
                      x2={pt.x}
                      y2={viewHeight}
                      stroke="#222"
                      strokeWidth={val === 0 ? 1.5 : 0.5}
                      strokeDasharray={val === 0 ? "" : "2,2"}
                    />
                  );
                })}
                {Array.from({ length: rangeY * 2 + 1 }).map((_, i) => {
                  const val = -rangeY + i;
                  const pt = mathToPixel(0, val);
                  return (
                    <line
                      key={`grid-y-${i}`}
                      x1={0}
                      y1={pt.y}
                      x2={viewWidth}
                      y2={pt.y}
                      stroke="#222"
                      strokeWidth={val === 0 ? 1.5 : 0.5}
                      strokeDasharray={val === 0 ? "" : "2,2"}
                    />
                  );
                })}

                {/* Primary Axes */}
                <line x1={0} y1={viewHeight / 2} x2={viewWidth} y2={viewHeight / 2} stroke="#3f3f46" strokeWidth={1.5} />
                <line x1={viewWidth / 2} y1={0} x2={viewWidth / 2} y2={viewHeight} stroke="#3f3f46" strokeWidth={1.5} />

                {/* Axis Coordinate Numbers */}
                <text x={viewWidth - 14} y={viewHeight / 2 + 12} fill="#71717a" fontSize="8" className="font-mono">x</text>
                <text x={viewWidth / 2 + 6} y={10} fill="#71717a" fontSize="8" className="font-mono">y</text>

                {/* Drawn Mathematical Curve */}
                <path
                  d={pathData}
                  fill="none"
                  stroke="#a3e635"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="drop-shadow-[0_0_8px_rgba(163,230,53,0.7)]"
                />

                {/* Crosshair Coordinate Tracer Dot */}
                {hoverCoord && (
                  <>
                    {/* Horizontal Tracer */}
                    <line
                      x1={0}
                      y1={hoverCoord.py}
                      x2={viewWidth}
                      y2={hoverCoord.py}
                      stroke="rgba(163,230,53,0.2)"
                      strokeWidth="1"
                      strokeDasharray="3,3"
                    />
                    {/* Vertical Tracer */}
                    <line
                      x1={hoverCoord.px}
                      y1={0}
                      x2={hoverCoord.px}
                      y2={viewHeight}
                      stroke="rgba(163,230,53,0.2)"
                      strokeWidth="1"
                      strokeDasharray="3,3"
                    />
                    {/* Coordinate Glow Indicator */}
                    <circle
                      cx={hoverCoord.px}
                      cy={hoverCoord.py}
                      r="6"
                      fill="#a3e635"
                      className="animate-pulse drop-shadow-[0_0_8px_rgba(163,230,53,0.9)]"
                    />
                  </>
                )}
              </svg>

              {/* Dynamic Equation Label & Hover Badge */}
              <div className="absolute top-3 left-3 bg-zinc-950/90 border border-zinc-800/80 px-2.5 py-1 rounded-lg text-[10px] font-mono text-zinc-300 pointer-events-none">
                {funcType === 'linear' && `y = (${coefA.toFixed(1)})x + (${coefB.toFixed(1)})`}
                {funcType === 'quadratic' && `y = (${coefA.toFixed(1)})x² + (${coefB.toFixed(1)})x + (${coefC.toFixed(1)})`}
                {funcType === 'sine' && `y = (${coefA.toFixed(1)})·sin((${coefB.toFixed(1)})x + (${coefC.toFixed(1)}))`}
                {funcType === 'cosine' && `y = (${coefA.toFixed(1)})·cos((${coefB.toFixed(1)})x + (${coefC.toFixed(1)}))`}
              </div>

              {hoverCoord && (
                <div className="absolute bottom-3 right-3 bg-zinc-900 border border-lime-500/40 px-2.5 py-1.5 rounded-lg text-xs font-mono text-lime-400 pointer-events-none flex flex-col shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                  <span>x: {hoverCoord.x.toFixed(2)}</span>
                  <span>y: {hoverCoord.y.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Coefficient Sliders */}
            <div className="flex flex-col gap-3 bg-zinc-900/40 border border-zinc-850 p-4 rounded-2xl">
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Sliders size={12} className="text-lime-400" />
                <span>Adjust Parameters</span>
              </div>

              {/* Coefficient A */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-500">Coefficient A:</span>
                  <span className="text-lime-400 font-bold">{coefA.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="0.1"
                  value={coefA}
                  onChange={e => setCoefA(parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-lime-400 focus:outline-none"
                />
              </div>

              {/* Coefficient B */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-500">Coefficient B:</span>
                  <span className="text-lime-400 font-bold">{coefB.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="0.1"
                  value={coefB}
                  onChange={e => setCoefB(parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-lime-400 focus:outline-none"
                />
              </div>

              {/* Coefficient C */}
              {funcType !== 'linear' && (
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-500">Constant C:</span>
                    <span className="text-lime-400 font-bold">{coefC.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="-5"
                    max="5"
                    step="0.1"
                    value={coefC}
                    onChange={e => setCoefC(parseFloat(e.target.value))}
                    className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-lime-400 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="flex-1 flex flex-col gap-3"
          >
            {/* Input Form Box */}
            <div className="bg-zinc-900/40 border border-zinc-850 p-3 rounded-2xl flex flex-col gap-2 shrink-0">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Enter Data Points</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={dataInput}
                  onChange={e => setDataInput(e.target.value)}
                  placeholder="e.g. 10, 20, 15, 30"
                  className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-lime-500/50 text-white rounded-xl px-3 py-2 text-sm font-mono focus:outline-none placeholder-zinc-700"
                />
                
                {user && (
                  <button
                    onClick={handleSaveStats}
                    disabled={isDataSaved || numericData.length === 0}
                    className="px-3 bg-lime-500/10 text-lime-400 border border-lime-500/20 hover:bg-lime-500/20 active:scale-95 transition-all text-xs font-bold rounded-xl flex items-center justify-center gap-1 border-transparent outline-none disabled:opacity-50 select-none"
                  >
                    <span>{isDataSaved ? 'Saved' : 'Save'}</span>
                  </button>
                )}
              </div>
              <span className="text-[9px] text-zinc-550 select-none">Provide comma or space separated numbers.</span>
            </div>

            {/* If empty state */}
            {numericData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-zinc-950/40 border border-zinc-850 rounded-2xl">
                <Calculator size={36} className="text-zinc-600 mb-2 animate-pulse" />
                <p className="text-zinc-400 text-sm font-medium">No valid data entered</p>
                <p className="text-zinc-650 text-xs mt-1">Please type standard digits in the box above to analyze.</p>
              </div>
            ) : (
              <>
                {/* Visual Glow Bar/Line Chart */}
                <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-3 h-32 flex flex-col justify-end shrink-0 relative overflow-hidden">
                  <div className="absolute top-2 left-3 flex justify-between w-[92%] select-none">
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Interactive Spark Plot</span>
                    <span className="text-[10px] font-mono text-lime-400/80">Hover elements to inspect</span>
                  </div>

                  {/* SVG Bars */}
                  <div className="flex items-end justify-between h-20 w-full gap-1 pt-4 px-1">
                    {numericData.map((val, idx) => {
                      const maxVal = Math.max(...numericData, 1);
                      const minVal = Math.min(...numericData, 0);
                      const heightPercent = maxVal === minVal ? 50 : ((val - minVal) / (maxVal - minVal)) * 80 + 10;
                      
                      const isHovered = hoveredDataIdx === idx;

                      return (
                        <div
                          key={`data-point-${idx}`}
                          className="flex-1 flex flex-col items-center justify-end h-full cursor-pointer group"
                          onMouseEnter={() => setHoveredDataIdx(idx)}
                          onMouseLeave={() => setHoveredDataIdx(null)}
                        >
                          <motion.div
                            animate={{ 
                              height: `${heightPercent}%`,
                              backgroundColor: isHovered ? 'rgba(163,230,53,1)' : 'rgba(163,230,53,0.3)',
                              boxShadow: isHovered ? '0 0 10px rgba(163,230,53,0.7)' : '0 0 2px rgba(163,230,53,0.1)'
                            }}
                            className="w-full rounded-t"
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                          />
                          <span className={`text-[8px] font-mono mt-1 ${isHovered ? 'text-lime-400 font-bold' : 'text-zinc-650'}`}>
                            {idx + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Inline hovered data popup */}
                  <AnimatePresence>
                    {hoveredDataIdx !== null && numericData[hoveredDataIdx] !== undefined && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 5 }}
                        className="absolute bottom-10 left-3 bg-zinc-900/95 border border-lime-500/45 px-2 py-1 rounded-lg text-[11px] font-mono text-lime-400 shadow-xl flex gap-1.5 pointer-events-none"
                      >
                        <span className="text-zinc-550"># {hoveredDataIdx + 1}:</span>
                        <span className="font-bold">{numericData[hoveredDataIdx]}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Analytical Numbers Grid */}
                {stats && (
                  <div className="grid grid-cols-2 gap-2 flex-1 pb-1">
                    
                    {/* Card 1: Count & Sum */}
                    <div className="bg-zinc-900/40 border border-zinc-850 p-2.5 rounded-xl flex flex-col justify-between">
                      <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-wider">Distribution</span>
                      <div>
                        <div className="text-lg font-mono text-white font-bold leading-none">{stats.count}</div>
                        <span className="text-[10px] text-zinc-500">Data values</span>
                      </div>
                      <div className="text-[11px] font-mono text-zinc-400 mt-1 border-t border-zinc-800/50 pt-1 flex justify-between">
                        <span>Sum value</span>
                        <span className="text-lime-400 font-semibold">{stats.sum}</span>
                      </div>
                    </div>

                    {/* Card 2: Mean & Median */}
                    <div className="bg-zinc-900/40 border border-zinc-850 p-2.5 rounded-xl flex flex-col justify-between">
                      <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-wider">Averages</span>
                      <div>
                        <div className="text-lg font-mono text-lime-400 font-bold leading-none">{stats.mean}</div>
                        <span className="text-[10px] text-zinc-500">Mean / Arithmetic</span>
                      </div>
                      <div className="text-[11px] font-mono text-zinc-400 mt-1 border-t border-zinc-800/50 pt-1 flex justify-between">
                        <span>Median</span>
                        <span className="text-zinc-300">{stats.median}</span>
                      </div>
                    </div>

                    {/* Card 3: Extremes */}
                    <div className="bg-zinc-900/40 border border-zinc-850 p-2.5 rounded-xl flex flex-col justify-between">
                      <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-wider">Extremes</span>
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-sm font-mono text-white font-bold">{stats.min}</div>
                          <span className="text-[9px] text-zinc-500">Minimum</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-mono text-white font-bold">{stats.max}</div>
                          <span className="text-[9px] text-zinc-500">Maximum</span>
                        </div>
                      </div>
                      <div className="text-[11px] font-mono text-zinc-400 mt-1 border-t border-zinc-800/50 pt-1 flex justify-between">
                        <span>Total Range</span>
                        <span className="text-lime-400">{stats.range}</span>
                      </div>
                    </div>

                    {/* Card 4: Spread */}
                    <div className="bg-zinc-900/40 border border-zinc-850 p-2.5 rounded-xl flex flex-col justify-between">
                      <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-wider">Spread & Deviation</span>
                      <div>
                        <div className="text-lg font-mono text-white font-bold leading-none">σ: {stats.stdDev}</div>
                        <span className="text-[10px] text-zinc-500">Standard deviation</span>
                      </div>
                      <div className="text-[11px] font-mono text-zinc-400 mt-1 border-t border-zinc-800/50 pt-1 flex justify-between">
                        <span>Variance / s²</span>
                        <span className="text-zinc-300">{stats.variance}</span>
                      </div>
                    </div>

                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
