import { useState } from 'react';

type Formula = {
  id: string;
  name: string;
  variables: { key: string; label: string; unit: string }[];
  calculate: (vars: Record<string, number>) => { result: number; unit: string };
};

const formulas: Formula[] = [
  {
    id: 'moles',
    name: 'Moles (n = m / M)',
    variables: [
      { key: 'm', label: 'Given Mass', unit: 'g' },
      { key: 'M', label: 'Molar Mass', unit: 'g/mol' }
    ],
    calculate: (vars) => ({ result: vars.m / vars.M, unit: 'mol' })
  },
  {
    id: 'molarity',
    name: 'Molarity (c = n / V)',
    variables: [{ key: 'n', label: 'Moles of Solute', unit: 'mol' }, { key: 'v', label: 'Volume of Solution', unit: 'L' }],
    calculate: (vars) => ({ result: vars.n / vars.v, unit: 'M (mol/L)' })
  },
  {
    id: 'molality',
    name: 'Molality (m = n / mass)',
    variables: [
      { key: 'n', label: 'Moles of Solute', unit: 'mol' },
      { key: 'mass', label: 'Mass of Solvent', unit: 'kg' }
    ],
    calculate: (vars) => ({ result: vars.n / vars.mass, unit: 'm (mol/kg)' })
  },
  {
    id: 'mole_fraction',
    name: 'Mole Fraction (χ = nA / nTotal)',
    variables: [
      { key: 'na', label: 'Moles of Component A', unit: 'mol' },
      { key: 'nb', label: 'Moles of Other Components', unit: 'mol' }
    ],
    calculate: (vars) => ({ result: vars.na / (vars.na + vars.nb), unit: '' })
  },
  {
    id: 'ideal_gas',
    name: 'Ideal Gas Law: Pressure (P = nRT / V)',
    variables: [
      { key: 'n', label: 'Moles', unit: 'mol' }, 
      { key: 't', label: 'Temperature', unit: 'K' },
      { key: 'v', label: 'Volume', unit: 'L' }
    ],
    calculate: (vars) => ({ result: (vars.n * 0.08206 * vars.t) / vars.v, unit: 'atm' })
  },
  {
    id: 'dilution',
    name: 'Dilution: Final Volume (V2 = C1V1 / C2)',
    variables: [
      { key: 'c1', label: 'Initial Concentration', unit: 'M' },
      { key: 'v1', label: 'Initial Volume', unit: 'L' },
      { key: 'c2', label: 'Final Concentration', unit: 'M' }
    ],
    calculate: (vars) => ({ result: (vars.c1 * vars.v1) / vars.c2, unit: 'L' })
  },
  {
    id: 'ph_calc',
    name: 'pH Calculation (pH = -log[H⁺])',
    variables: [
      { key: 'h_plus', label: 'Hydrogen Ion Concentration', unit: 'M' }
    ],
    calculate: (vars) => ({ result: -Math.log10(vars.h_plus), unit: 'pH' })
  },
  {
    id: 'energy_photon',
    name: 'Energy of Photon (E = hc / λ)',
    variables: [
      { key: 'lambda', label: 'Wavelength (λ)', unit: 'm' }
    ],
    calculate: (vars) => ({ result: (6.626e-34 * 3e8) / vars.lambda, unit: 'J' })
  },
  {
    id: 'de_broglie',
    name: 'de Broglie Wavelength (λ = h / mv)',
    variables: [
      { key: 'm', label: 'Mass', unit: 'kg' },
      { key: 'v', label: 'Velocity', unit: 'm/s' }
    ],
    calculate: (vars) => ({ result: 6.626e-34 / (vars.m * vars.v), unit: 'm' })
  }
];

export function ChemistryMode() {
  const [selectedFormula, setSelectedFormula] = useState(formulas[0]);
  const [inputs, setInputs] = useState<Record<string, string>>({});

  const handleInputChange = (key: string, value: string) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const calculateResult = () => {
    const vars: Record<string, number> = {};
    for (const v of selectedFormula.variables) {
      if (!inputs[v.key]) return null;
      vars[v.key] = parseFloat(inputs[v.key]);
      if (isNaN(vars[v.key])) return null;
    }
    const res = selectedFormula.calculate(vars);
    if (isNaN(res.result) || !isFinite(res.result)) {
      return { result: NaN, unit: 'Math Error (Division by Zero)' };
    }
    return res;
  };

  const currentResult = calculateResult();

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6 relative z-10 w-full font-mono text-white">
      <div>
        <label className="block text-sm text-cyan-500/70 mb-2">Select Formula</label>
        <select 
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-colors"
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
              className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-3 text-xl focus:border-cyan-500 focus:outline-none transition-colors placeholder:text-zinc-600 font-mono"
              value={inputs[v.key] || ''}
              onChange={(e) => handleInputChange(v.key, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[100px] shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]">
        <span className="text-sm text-cyan-500/70 mb-1">Result</span>
        {currentResult ? (
          isNaN(currentResult.result) ? (
            <div className="text-xl font-bold text-red-400">
              Division by Zero Error
            </div>
          ) : (
            <div className="text-3xl font-bold text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]">
              {currentResult.result.toLocaleString('en-US', { maximumFractionDigits: 6 })} <span className="text-xl ml-1">{currentResult.unit}</span>
            </div>
          )
        ) : (
          <div className="text-xl text-zinc-500">Awaiting input...</div>
        )}
      </div>
    </div>
  );
}
