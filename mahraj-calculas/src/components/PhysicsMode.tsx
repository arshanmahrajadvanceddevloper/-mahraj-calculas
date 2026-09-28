import { useState, useMemo } from 'react';

type Formula = {
  id: string;
  name: string;
  variables: { key: string; label: string; unit: string }[];
  calculate: (vars: Record<string, number>) => { result: number; unit: string };
};

const formulas: Formula[] = [
  {
    id: 'velocity',
    name: 'Velocity (v = d / t)',
    variables: [{ key: 'd', label: 'Distance', unit: 'm' }, { key: 't', label: 'Time', unit: 's' }],
    calculate: (vars) => ({ result: vars.d / vars.t, unit: 'm/s' })
  },
  {
    id: 'force',
    name: 'Force (F = m * a)',
    variables: [{ key: 'm', label: 'Mass', unit: 'kg' }, { key: 'a', label: 'Acceleration', unit: 'm/s²' }],
    calculate: (vars) => ({ result: vars.m * vars.a, unit: 'N' })
  },
  {
    id: 'energy',
    name: 'Kinetic Energy (E = ½ * m * v²)',
    variables: [{ key: 'm', label: 'Mass', unit: 'kg' }, { key: 'v', label: 'Velocity', unit: 'm/s' }],
    calculate: (vars) => ({ result: 0.5 * vars.m * Math.pow(vars.v, 2), unit: 'J' })
  },
  {
    id: 'density',
    name: 'Density (ρ = m / V)',
    variables: [{ key: 'm', label: 'Mass', unit: 'kg' }, { key: 'v', label: 'Volume', unit: 'm³' }],
    calculate: (vars) => ({ result: vars.m / vars.v, unit: 'kg/m³' })
  },
  {
    id: 'ohms_law',
    name: "Ohm's Law (V = I * R)",
    variables: [{ key: 'i', label: 'Current', unit: 'A' }, { key: 'r', label: 'Resistance', unit: 'Ω' }],
    calculate: (vars) => ({ result: vars.i * vars.r, unit: 'V' })
  },
  {
    id: 'power',
    name: 'Electric Power (P = I * V)',
    variables: [{ key: 'i', label: 'Current', unit: 'A' }, { key: 'v', label: 'Voltage', unit: 'V' }],
    calculate: (vars) => ({ result: vars.i * vars.v, unit: 'W' })
  },
  {
    id: 'coulombs_law',
    name: "Coulomb's Law (F = k * q₁ * q₂ / r²)",
    variables: [
      { key: 'q1', label: 'Charge 1', unit: 'C' }, 
      { key: 'q2', label: 'Charge 2', unit: 'C' }, 
      { key: 'r', label: 'Distance', unit: 'm' }
    ],
    calculate: (vars) => ({ result: (8.9875517923e9 * vars.q1 * vars.q2) / Math.pow(vars.r, 2), unit: 'N' })
  },
  {
    id: 'magnetic_force',
    name: 'Magnetic Force (F = q * v * B * sin(θ))',
    variables: [
      { key: 'q', label: 'Charge', unit: 'C' }, 
      { key: 'v', label: 'Velocity', unit: 'm/s' }, 
      { key: 'b', label: 'Magnetic Field', unit: 'T' },
      { key: 'theta', label: 'Angle', unit: 'degrees' }
    ],
    calculate: (vars) => ({ result: vars.q * vars.v * vars.b * Math.sin(vars.theta * Math.PI / 180), unit: 'N' })
  }
];

type UnitCategory = {
  id: string;
  name: string;
  units: { id: string; name: string; multiplier: number; offset?: number }[];
};

const unitCategories: UnitCategory[] = [
  {
    id: 'angle',
    name: 'Angle (Radians/Degrees)',
    units: [
      { id: 'deg', name: 'Degrees (°)', multiplier: 1 },
      { id: 'rad', name: 'Radians (rad)', multiplier: 180 / Math.PI },
      { id: 'grad', name: 'Gradians', multiplier: 0.9 },
    ]
  },
  {
    id: 'length',
    name: 'Length & Distance',
    units: [
      { id: 'm', name: 'Meter (m)', multiplier: 1 },
      { id: 'cm', name: 'Centimeter (cm)', multiplier: 0.01 },
      { id: 'mm', name: 'Millimeter (mm)', multiplier: 0.001 },
      { id: 'km', name: 'Kilometer (km)', multiplier: 1000 },
      { id: 'in', name: 'Inch (in)', multiplier: 0.0254 },
      { id: 'ft', name: 'Foot (ft)', multiplier: 0.3048 },
      { id: 'yd', name: 'Yard (yd)', multiplier: 0.9144 },
      { id: 'mi', name: 'Mile (mi)', multiplier: 1609.344 },
    ]
  },
  {
    id: 'mass',
    name: 'Mass & Weight',
    units: [
      { id: 'kg', name: 'Kilogram (kg)', multiplier: 1 },
      { id: 'g', name: 'Gram (g)', multiplier: 0.001 },
      { id: 'mg', name: 'Milligram (mg)', multiplier: 0.000001 },
      { id: 'lb', name: 'Pound (lb)', multiplier: 0.45359237 },
      { id: 'oz', name: 'Ounce (oz)', multiplier: 0.02834952 },
    ]
  },
  {
    id: 'temp',
    name: 'Temperature',
    units: [
      { id: 'c', name: 'Celsius (°C)', multiplier: 1, offset: 0 },
      { id: 'f', name: 'Fahrenheit (°F)', multiplier: 5/9, offset: -32 * (5/9) },
      { id: 'k', name: 'Kelvin (K)', multiplier: 1, offset: -273.15 },
    ]
  },
  {
    id: 'area',
    name: 'Area',
    units: [
      { id: 'sqm', name: 'Sq Meter (m²)', multiplier: 1 },
      { id: 'sqcm', name: 'Sq Centimeter (cm²)', multiplier: 0.0001 },
      { id: 'sqkm', name: 'Sq Kilometer (km²)', multiplier: 1000000 },
      { id: 'sqin', name: 'Sq Inch (in²)', multiplier: 0.00064516 },
      { id: 'sqft', name: 'Sq Foot (ft²)', multiplier: 0.09290304 },
      { id: 'acre', name: 'Acre', multiplier: 4046.85642 },
      { id: 'hectare', name: 'Hectare', multiplier: 10000 },
    ]
  },
  {
    id: 'volume',
    name: 'Volume',
    units: [
      { id: 'l', name: 'Liter (L)', multiplier: 1 },
      { id: 'ml', name: 'Milliliter (mL)', multiplier: 0.001 },
      { id: 'cum', name: 'Cubic Meter (m³)', multiplier: 1000 },
      { id: 'gal', name: 'US Gallon (gal)', multiplier: 3.78541178 },
      { id: 'oz', name: 'US Fluid Ounce (fl oz)', multiplier: 0.02957353 },
    ]
  }
];

export function PhysicsMode() {
  const [activeTab, setActiveTab] = useState<'formulas' | 'converter'>('formulas');

  // Formulas state
  const [selectedFormula, setSelectedFormula] = useState(formulas[0]);
  const [inputs, setInputs] = useState<Record<string, string>>({});

  // Converter state
  const [categoryId, setCategoryId] = useState(unitCategories[0].id);
  const [fromUnit, setFromUnit] = useState(unitCategories[0].units[0].id);
  const [toUnit, setToUnit] = useState(unitCategories[0].units[1].id);
  const [convertAmount, setConvertAmount] = useState('1');

  // Handlers
  const handleInputChange = (key: string, value: string) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const calculateResult = () => {
    const vars: Record<string, number> = {};
    for (const v of selectedFormula.variables) {
      const valStr = inputs[v.key];
      if (!valStr || valStr.trim() === '') {
        if (selectedFormula.id === 'ohms_law' || selectedFormula.id === 'power') return { error: 'Invalid input' };
        return null;
      }
      vars[v.key] = parseFloat(valStr);
      if (isNaN(vars[v.key])) {
        if (selectedFormula.id === 'ohms_law' || selectedFormula.id === 'power') return { error: 'Invalid input' };
        return null;
      }
    }
    const res = selectedFormula.calculate(vars);
    if (isNaN(res.result) || !isFinite(res.result)) {
      if (selectedFormula.id === 'ohms_law' || selectedFormula.id === 'power') return { error: 'Invalid input' };
      return null;
    }
    return res;
  };

  const currentResult = calculateResult();

  const handleCategoryChange = (catId: string) => {
    setCategoryId(catId);
    const cat = unitCategories.find(c => c.id === catId);
    if (cat) {
      setFromUnit(cat.units[0].id);
      setToUnit(cat.units[1]?.id || cat.units[0].id);
    }
  };

  const converterResult = useMemo(() => {
    const parsedAmount = parseFloat(convertAmount);
    if (isNaN(parsedAmount)) return null;

    const cat = unitCategories.find(c => c.id === categoryId);
    if (!cat) return null;

    const fromU = cat.units.find(u => u.id === fromUnit);
    const toU = cat.units.find(u => u.id === toUnit);

    if (!fromU || !toU) return null;

    let baseValue = parsedAmount;
    if (fromU.offset !== undefined) {
      baseValue = parsedAmount * fromU.multiplier + fromU.offset;
    } else {
      baseValue = parsedAmount * fromU.multiplier;
    }

    let converted = 0;
    if (toU.offset !== undefined) {
      converted = (baseValue - toU.offset) / toU.multiplier;
    } else {
      converted = baseValue / toU.multiplier;
    }

    return converted;
  }, [convertAmount, categoryId, fromUnit, toUnit]);

  const activeCategory = unitCategories.find(c => c.id === categoryId);

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 space-y-4 relative z-10 w-full font-sans text-white overflow-hidden">
      
      <div className="flex bg-zinc-800/50 rounded-lg p-1 border border-zinc-700/50 shrink-0">
        <button 
          className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'formulas' ? 'bg-lime-500/20 text-lime-400 border border-lime-500/30' : 'text-zinc-400 hover:text-white'}`}
          onClick={() => setActiveTab('formulas')}
        >
          Formulas
        </button>
        <button 
          className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'converter' ? 'bg-lime-500/20 text-lime-400 border border-lime-500/30' : 'text-zinc-400 hover:text-white'}`}
          onClick={() => setActiveTab('converter')}
        >
          Unit Converter
        </button>
      </div>

      {activeTab === 'formulas' && (
        <div className="flex-1 flex flex-col space-y-6 overflow-y-auto custom-scrollbar font-mono">
          <div>
            <label className="block text-sm text-lime-500/70 mb-2">Select Formula</label>
            <select 
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500 transition-colors"
              value={selectedFormula.id}
              onChange={(e) => {
                setSelectedFormula(formulas.find(f => f.id === e.target.value) || formulas[0]);
                setInputs({});
              }}
            >
              {formulas.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-4 flex-1">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Variable Inputs</span>
              <button 
                onClick={() => setInputs({})}
                className="text-[10px] bg-zinc-800 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 px-2 py-1 rounded transition-colors border border-zinc-700/50"
              >
                Clear All
              </button>
            </div>
            {selectedFormula.variables.map(v => (
              <div key={v.key}>
                <label className="block text-sm text-zinc-400 mb-1">{v.label} ({v.unit})</label>
                <input 
                  type="number" 
                  inputMode="decimal"
                  step="any"
                  placeholder={`Enter ${v.label.toLowerCase()}`}
                  className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3 text-xl focus:border-cyan-500 focus:outline-none transition-colors placeholder:text-zinc-600 font-mono tabular-nums"
                  value={inputs[v.key] || ''}
                  onChange={(e) => handleInputChange(v.key, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="bg-lime-500/10 border border-lime-500/30 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[100px] shadow-[inset_0_0_20px_rgba(163,230,53,0.1)]">
            <span className="text-sm text-lime-500/70 mb-1">Result</span>
            {currentResult && 'error' in currentResult ? (
              <div className="text-xl text-red-500">{currentResult.error}</div>
            ) : currentResult && 'result' in currentResult ? (
              <div className="text-3xl font-bold text-lime-400 drop-shadow-[0_0_8px_rgba(163,230,53,0.5)]">
                {currentResult.result.toLocaleString('en-US', { maximumFractionDigits: 6 })} <span className="text-xl ml-1">{currentResult.unit}</span>
              </div>
            ) : (
              <div className="text-xl text-zinc-500">Awaiting input...</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'converter' && (
        <div className="flex-1 flex flex-col space-y-6 overflow-y-auto custom-scrollbar">
          <div className="bg-zinc-900/80 border border-lime-500/30 rounded-3xl p-4 sm:p-6 shadow-[inset_0_0_20px_rgba(163,230,53,0.05)]">
            <div className="mb-6">
              <label className="text-sm text-lime-400 mb-2 block font-medium">Measurement Type</label>
              <select 
                value={categoryId} 
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full bg-zinc-800 text-white font-medium rounded-xl p-3 border border-zinc-700 outline-none focus:border-lime-500 transition-colors"
              >
                {unitCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-zinc-400">From</label>
                </div>
                <select 
                  value={fromUnit} 
                  onChange={(e) => setFromUnit(e.target.value)}
                  className="w-full bg-zinc-800 text-lime-200 text-sm font-medium rounded-t-xl px-4 py-3 border-t border-l border-r border-zinc-700 outline-none focus:border-lime-500 focus:bg-zinc-800 transition-colors"
                >
                  {activeCategory?.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <input 
                  type="number" 
                  inputMode="decimal"
                  step="any"
                  value={convertAmount}
                  onChange={(e) => setConvertAmount(e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-b-xl p-4 text-3xl font-bold text-white focus:border-lime-500 focus:outline-none transition-colors font-mono tabular-nums"
                  placeholder="0.00"
                />
              </div>

              <div className="flex justify-center -my-4 relative z-10">
                <button 
                  className="bg-lime-500 text-black rounded-full p-2.5 hover:bg-lime-400 transition-colors shadow-lg shadow-lime-500/20"
                  onClick={() => {
                    setFromUnit(toUnit);
                    setToUnit(fromUnit);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/></svg>
                </button>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2 mt-2">
                  <label className="text-sm text-zinc-400">To</label>
                </div>
                <select 
                  value={toUnit} 
                  onChange={(e) => setToUnit(e.target.value)}
                  className="w-full bg-zinc-800 text-lime-200 text-sm font-medium rounded-t-xl px-4 py-3 border-t border-l border-r border-zinc-700 outline-none focus:border-lime-500 transition-colors"
                >
                  {activeCategory?.units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <div className="w-full bg-black/40 border border-lime-500/30 rounded-b-xl p-4 text-3xl font-bold text-lime-400 drop-shadow-[0_0_8px_rgba(163,230,53,0.4)] flex justify-between items-center overflow-x-auto font-mono">
                  <span className="truncate">
                    {converterResult !== null 
                      ? (Math.abs(converterResult) < 0.0001 && converterResult !== 0 || Math.abs(converterResult) >= 10000000) 
                        ? converterResult.toExponential(4) 
                        : parseFloat(converterResult.toPrecision(10)).toString() 
                      : '...'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

