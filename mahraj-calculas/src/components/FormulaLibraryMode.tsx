import { useState, useMemo } from 'react';
import { Search, BookOpen } from 'lucide-react';
import { SHAMode } from './SHAMode';

type FormulaEntry = {
  id: string;
  category: string;
  name: string;
  formula: string;
  level: string; // e.g. "Class 8-10", "Class 11-12 / JEE"
  subject: 'Maths' | 'Physics' | 'Chemistry';
};

const formulaData: FormulaEntry[] = [
  // Class 8 - Foundations
  { id: '8_1', subject: 'Maths', category: 'Algebraic Identities', name: 'Square of Sum', formula: '(a + b)² = a² + 2ab + b²', level: 'Class 8' },
  { id: '8_2', subject: 'Maths', category: 'Algebraic Identities', name: 'Square of Difference', formula: '(a - b)² = a² - 2ab + b²', level: 'Class 8' },
  { id: '8_3', subject: 'Maths', category: 'Algebraic Identities', name: 'Difference of Squares', formula: 'a² - b² = (a - b)(a + b)', level: 'Class 8' },
  { id: '8_4', subject: 'Maths', category: 'Algebraic Identities', name: 'Product of Binomials', formula: '(x + a)(x + b) = x² + (a + b)x + ab', level: 'Class 8' },
  { id: '8_5', subject: 'Maths', category: 'Mensuration', name: 'Area of Trapezium', formula: 'A = ½ × (a + b) × h', level: 'Class 8' },
  { id: '8_6', subject: 'Maths', category: 'Mensuration', name: 'Volume of Cube', formula: 'V = a³', level: 'Class 8' },
  { id: '8_7', subject: 'Maths', category: 'Mensuration', name: 'Volume of Cuboid', formula: 'V = l × b × h', level: 'Class 8' },
  { id: '8_8', subject: 'Maths', category: 'Mensuration', name: 'Volume of Cylinder', formula: 'V = πr²h', level: 'Class 8' },
  { id: '8_9', subject: 'Maths', category: 'Mensuration', name: 'Total Surface Area (Cylinder)', formula: 'TSA = 2πr(r + h)', level: 'Class 8' },
  { id: '8_10', subject: 'Maths', category: 'Exponents', name: 'Product Rule', formula: 'a^m × a^n = a^(m+n)', level: 'Class 8' },
  { id: '8_11', subject: 'Maths', category: 'Exponents', name: 'Quotient Rule', formula: 'a^m / a^n = a^(m-n)', level: 'Class 8' },
  { id: '8_12', subject: 'Maths', category: 'Exponents', name: 'Power Rule', formula: '(a^m)^n = a^(mn)', level: 'Class 8' },

  // Class 9 & 10 - Intermediate Math
  { id: '9_1', subject: 'Maths', category: 'Polynomials', name: 'Sum of Roots', formula: 'α + β = -b/a', level: 'Class 9-10' },
  { id: '9_2', subject: 'Maths', category: 'Polynomials', name: 'Product of Roots', formula: 'αβ = c/a', level: 'Class 9-10' },
  { id: '9_3', subject: 'Maths', category: 'Coordinate Geometry', name: 'Distance Formula', formula: 'd = √[(x₂ - x₁)² + (y₂ - y₁)²]', level: 'Class 9-10' },
  { id: '9_4', subject: 'Maths', category: 'Coordinate Geometry', name: 'Section Formula', formula: 'x = (mx₂ + nx₁)/(m+n), y = (my₂ + ny₁)/(m+n)', level: 'Class 9-10' },
  { id: '9_5', subject: 'Maths', category: 'Trigonometry', name: 'Pythagorean Identity 1', formula: 'sin²θ + cos²θ = 1', level: 'Class 10' },
  { id: '9_6', subject: 'Maths', category: 'Trigonometry', name: 'Pythagorean Identity 2', formula: '1 + tan²θ = sec²θ', level: 'Class 10' },
  { id: '9_7', subject: 'Maths', category: 'Trigonometry', name: 'Pythagorean Identity 3', formula: '1 + cot²θ = cosec²θ', level: 'Class 10' },
  { id: '9_8', subject: 'Maths', category: 'Mensuration', name: 'Surface Area of Sphere', formula: 'SA = 4πr²', level: 'Class 9-10' },
  { id: '9_9', subject: 'Maths', category: 'Mensuration', name: 'Volume of Cone', formula: 'V = (1/3)πr²h', level: 'Class 9-10' },

  // Class 11 & 12 - Higher Mathematics
  { id: '11_1', subject: 'Maths', category: 'Algebra', name: 'Quadratic Roots', formula: 'x = (-b ± √(b² - 4ac)) / 2a', level: 'Class 11-12' },
  { id: '11_2', subject: 'Maths', category: 'Complex Numbers', name: 'Standard Form', formula: 'z = a + ib', level: 'Class 11-12' },
  { id: '11_3', subject: 'Maths', category: 'Complex Numbers', name: 'Conjugate', formula: 'z̄ = a - ib', level: 'Class 11-12' },
  { id: '11_4', subject: 'Maths', category: 'Complex Numbers', name: 'Modulus', formula: '|z| = √(a² + b²)', level: 'Class 11-12' },
  { id: '11_5', subject: 'Maths', category: 'Logarithm', name: 'Product Rule', formula: 'log_a(xy) = log_a(x) + log_a(y)', level: 'Class 11-12' },
  { id: '11_6', subject: 'Maths', category: 'Trigonometry', name: 'Sine Addition', formula: 'sin(A ± B) = sin A cos B ± cos A sin B', level: 'Class 11-12' },
  { id: '11_7', subject: 'Maths', category: 'Trigonometry', name: 'Cosine Addition', formula: 'cos(A ± B) = cos A cos B ∓ sin A sin B', level: 'Class 11-12' },
  { id: '11_8', subject: 'Maths', category: 'Trigonometry', name: 'Tangent Double Angle', formula: 'tan(2A) = (2tan A) / (1 - tan² A)', level: 'Class 11-12' },
  { id: '11_9', subject: 'Maths', category: 'Coordinate Geometry', name: 'Straight Line', formula: 'y = mx + c', level: 'Class 11-12' },
  { id: '11_10', subject: 'Maths', category: 'Coordinate Geometry', name: 'Circle', formula: '(x - h)² + (y - k)² = r²', level: 'Class 11-12' },
  { id: '11_11', subject: 'Maths', category: 'Coordinate Geometry', name: 'Parabola', formula: 'y² = 4ax', level: 'Class 11-12' },
  { id: '11_12', subject: 'Maths', category: 'Vectors', name: 'Dot Product', formula: 'a · b = |a||b|cosθ', level: 'Class 11-12' },
  { id: '11_13', subject: 'Maths', category: 'Vectors', name: 'Cross Product', formula: 'a × b = (|a||b|sinθ)n̂', level: 'Class 11-12' },
  { id: '11_14', subject: 'Maths', category: 'Calculus', name: 'Standard Derivative', formula: 'd/dx (x^n) = n·x^(n-1)', level: 'Class 11-12' },
  { id: '11_15', subject: 'Maths', category: 'Calculus', name: 'Product Rule', formula: 'd/dx (uv) = u(dv/dx) + v(du/dx)', level: 'Class 11-12' },
  { id: '11_16', subject: 'Maths', category: 'Calculus', name: 'Chain Rule', formula: 'dy/dx = (dy/du) × (du/dx)', level: 'Class 11-12' },
  { id: '11_17', subject: 'Maths', category: 'Calculus', name: 'Standard Integration', formula: '∫ x^n dx = (x^(n+1))/(n+1) + C', level: 'Class 11-12' },
  { id: '11_18', subject: 'Maths', category: 'Calculus', name: 'Integration by Parts', formula: '∫ u v dx = u ∫ v dx - ∫ (u\' ∫ v dx) dx', level: 'Class 11-12' },

  // JEE Advanced - Advanced Concepts
  { id: 'jee_1', subject: 'Maths', category: 'Calculus', name: 'Leibniz Rule (Integration)', formula: 'd/dx[∫_{g(x)}^{h(x)} f(t)dt] = f(h(x))h\'(x) - f(g(x))g\'(x)', level: 'JEE Adv' },
  { id: 'jee_2', subject: 'Maths', category: 'Calculus', name: 'Area Under Curve', formula: 'A = ∫_a^b |f(x)| dx', level: 'JEE Adv' },
  { id: 'jee_3', subject: 'Maths', category: 'Complex Numbers', name: 'De Moivre\'s Theorem', formula: '(cosθ + isinθ)^n = cos(nθ) + isin(nθ)', level: 'JEE Adv' },
  { id: 'jee_4', subject: 'Maths', category: 'Combinatorics', name: 'Combination Formula', formula: 'nCr = n! / (r!(n-r)!)', level: 'JEE Adv' },
  { id: 'jee_5', subject: 'Maths', category: 'Probability', name: 'Bayes\' Theorem', formula: 'P(A|B) = [P(B|A)P(A)] / P(B)', level: 'JEE Adv' },

  // Physics Formulas
  { id: 'phy_1', subject: 'Physics', category: 'Kinematics', name: 'Velocity', formula: 'v = u + at', level: 'Class 9-11' },
  { id: 'phy_2', subject: 'Physics', category: 'Kinematics', name: 'Displacement', formula: 's = ut + ½at²', level: 'Class 9-11' },
  { id: 'phy_3', subject: 'Physics', category: 'Kinematics', name: 'Velocity-Displacement', formula: 'v² = u² + 2as', level: 'Class 9-11' },
  { id: 'phy_4', subject: 'Physics', category: 'Dynamics', name: 'Newton\'s Second Law', formula: 'F = ma', level: 'Class 9-11' },
  { id: 'phy_5', subject: 'Physics', category: 'Work & Energy', name: 'Kinetic Energy', formula: 'KE = ½mv²', level: 'Class 9-11' },
  { id: 'phy_6', subject: 'Physics', category: 'Work & Energy', name: 'Potential Energy', formula: 'PE = mgh', level: 'Class 9-11' },
  { id: 'phy_7', subject: 'Physics', category: 'Electricity', name: 'Ohm\'s Law', formula: 'V = IR', level: 'Class 10-12' },
  { id: 'phy_8', subject: 'Physics', category: 'Electricity', name: 'Electrical Power', formula: 'P = VI', level: 'Class 10-12' },
  { id: 'phy_9', subject: 'Physics', category: 'Magnetism', name: 'Magnetic Force', formula: 'F = qvB sinθ', level: 'Class 12' },
  { id: 'phy_10', subject: 'Physics', category: 'Optics', name: 'Lens Formula', formula: '1/f = 1/v - 1/u', level: 'Class 10-12' },

  // Chemistry - Class 9 & 10
  { id: 'chem_9_1', subject: 'Chemistry', category: 'Foundational Compounds', name: 'Water', formula: 'H₂O', level: 'Class 9-10' },
  { id: 'chem_9_2', subject: 'Chemistry', category: 'Foundational Compounds', name: 'Carbon Dioxide', formula: 'CO₂', level: 'Class 9-10' },
  { id: 'chem_9_3', subject: 'Chemistry', category: 'Foundational Compounds', name: 'Sodium Chloride', formula: 'NaCl', level: 'Class 9-10' },
  { id: 'chem_9_4', subject: 'Chemistry', category: 'Foundational Compounds', name: 'Ammonia', formula: 'NH₃', level: 'Class 9-10' },
  { id: 'chem_9_5', subject: 'Chemistry', category: 'Foundational Compounds', name: 'Methane', formula: 'CH₄', level: 'Class 9-10' },
  { id: 'chem_9_6', subject: 'Chemistry', category: 'Foundational Compounds', name: 'Sulfuric Acid', formula: 'H₂SO₄', level: 'Class 9-10' },
  { id: 'chem_9_7', subject: 'Chemistry', category: 'Foundational Compounds', name: 'Calcium Carbonate', formula: 'CaCO₃', level: 'Class 9-10' },
  { id: 'chem_9_8', subject: 'Chemistry', category: 'Foundational Compounds', name: 'Sodium Hydroxide', formula: 'NaOH', level: 'Class 9-10' },
  { id: 'chem_9_9', subject: 'Chemistry', category: 'Foundational Compounds', name: 'Calcium Oxide', formula: 'CaO', level: 'Class 9-10' },
  { id: 'chem_9_10', subject: 'Chemistry', category: 'Foundational Compounds', name: 'Calcium Hydroxide', formula: 'Ca(OH)₂', level: 'Class 9-10' },
  { id: 'chem_9_11', subject: 'Chemistry', category: 'Mole Concept', name: 'Mole Formula', formula: 'n = m / M', level: 'Class 9-10' },
  { id: 'chem_9_12', subject: 'Chemistry', category: 'Mole Concept', name: "Avogadro's Number", formula: '1 mole = 6.022 × 10²³ particles', level: 'Class 9-10' },

  // Chemistry - Class 11
  { id: 'chem_11_1', subject: 'Chemistry', category: 'Physical Chemistry', name: 'Ideal Gas Equation', formula: 'PV = nRT', level: 'Class 11' },
  { id: 'chem_11_2', subject: 'Chemistry', category: 'Physical Chemistry', name: 'Molarity (M)', formula: 'M = Moles of Solute / Volume in L', level: 'Class 11' },
  { id: 'chem_11_3', subject: 'Chemistry', category: 'Physical Chemistry', name: 'Molality (m)', formula: 'm = Moles of Solute / Mass of Solvent in kg', level: 'Class 11' },
  { id: 'chem_11_4', subject: 'Chemistry', category: 'Physical Chemistry', name: 'Mole Fraction (χ)', formula: 'χ_A = n_A / (n_A + n_B)', level: 'Class 11' },
  { id: 'chem_11_5', subject: 'Chemistry', category: 'Atomic Structure', name: 'Energy of Photon', formula: 'E = hν = hc / λ', level: 'Class 11' },
  { id: 'chem_11_6', subject: 'Chemistry', category: 'Atomic Structure', name: 'de Broglie Wavelength', formula: 'λ = h / mv', level: 'Class 11' },
  { id: 'chem_11_7', subject: 'Chemistry', category: 'Equilibrium', name: 'pH Calculation', formula: 'pH = -log[H⁺]', level: 'Class 11' },

  // Chemistry - Class 12
  { id: 'chem_12_1', subject: 'Chemistry', category: 'Solid State', name: 'Density of Unit Cell', formula: 'ρ = (Z × M) / (N_A × a³)', level: 'Class 12' },
  { id: 'chem_12_2', subject: 'Chemistry', category: 'Solutions', name: "Raoult's Law", formula: 'P_total = P_A°χ_A + P_B°χ_B', level: 'Class 12' },
  { id: 'chem_12_3', subject: 'Chemistry', category: 'Electrochemistry', name: 'Nernst Equation', formula: 'E_cell = E°_cell - (RT/nF)lnQ', level: 'Class 12' },
  { id: 'chem_12_4', subject: 'Chemistry', category: 'Chemical Kinetics', name: 'First Order Rate Law', formula: 'k = (2.303/t) log([A]₀/[A]_t)', level: 'Class 12' },
  { id: 'chem_12_5', subject: 'Chemistry', category: 'Chemical Kinetics', name: 'Half-Life (First Order)', formula: 't_1/2 = 0.693 / k', level: 'Class 12' },
  { id: 'chem_12_6', subject: 'Chemistry', category: 'Chemical Kinetics', name: 'Arrhenius Equation', formula: 'k = A e^(-E_a/RT)', level: 'Class 12' },

  // Organic & Inorganic Chemistry
  { id: 'chem_org_1', subject: 'Chemistry', category: 'Inorganic', name: 'Rust Formula', formula: 'Fe₂O₃ · xH₂O', level: 'Class 11-12' },
  { id: 'chem_org_2', subject: 'Chemistry', category: 'Organic', name: 'Glucose', formula: 'C₆H₁₂O₆', level: 'Class 11-12' },
  { id: 'chem_org_3', subject: 'Chemistry', category: 'Organic', name: 'Ethanol', formula: 'C₂H₅OH', level: 'Class 11-12' },
  { id: 'chem_org_4', subject: 'Chemistry', category: 'Organic', name: 'Acetic Acid (Vinegar)', formula: 'CH₃COOH', level: 'Class 11-12' },
  { id: 'chem_org_5', subject: 'Chemistry', category: 'Organic', name: 'Benzene', formula: 'C₆H₆', level: 'Class 11-12' },
  { id: 'chem_org_6', subject: 'Chemistry', category: 'Organic', name: 'Acetone', formula: 'CH₃COCH₃', level: 'Class 11-12' },
  { id: 'chem_org_7', subject: 'Chemistry', category: 'Organic', name: 'Alkane General Formula', formula: 'C_nH_{2n+2}', level: 'Class 11-12' },
  { id: 'chem_org_8', subject: 'Chemistry', category: 'Organic', name: 'Alkene General Formula', formula: 'C_nH_{2n}', level: 'Class 11-12' },
  { id: 'chem_org_9', subject: 'Chemistry', category: 'Organic', name: 'Alkyne General Formula', formula: 'C_nH_{2n-2}', level: 'Class 11-12' },
];

export function FormulaLibraryMode() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubject, setActiveSubject] = useState<'All' | 'Maths' | 'Physics' | 'Chemistry' | 'SHA Keys'>('All');

  const filteredFormulas = useMemo(() => {
    let result = formulaData;
    if (activeSubject !== 'All' && activeSubject !== 'SHA Keys') {
      result = result.filter(f => f.subject === activeSubject as any);
    }
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(f => 
        f.name.toLowerCase().includes(lower) || 
        f.category.toLowerCase().includes(lower) ||
        f.formula.toLowerCase().includes(lower) ||
        f.level.toLowerCase().includes(lower)
      );
    }
    return result;
  }, [searchTerm, activeSubject]);

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 relative z-10 w-full h-full font-sans text-white overflow-hidden">
      
      {/* Search Bar (Only display if not in cryptographic SHA tool tab) */}
      {activeSubject !== 'SHA Keys' && (
        <div className="relative shrink-0 pt-2">
          <div className="absolute inset-y-0 left-3 flex items-center pt-2 pointer-events-none">
            <Search size={18} className="text-zinc-500" />
          </div>
          <input 
            type="text" 
            placeholder="Search formulas, concepts, or class..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors shadow-inner drop-shadow-sm"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 overflow-x-auto custom-scrollbar shrink-0 pb-1">
        {(['All', 'Maths', 'Physics', 'Chemistry', 'SHA Keys'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveSubject(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all whitespace-nowrap ${
              activeSubject === tab 
                ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]' 
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Viewport */}
      {activeSubject === 'SHA Keys' ? (
        <SHAMode />
      ) : (
        <div className="flex-1 overflow-y-auto pr-1 pb-4 space-y-3 custom-scrollbar">
          {filteredFormulas.length === 0 ? (
            <div className="text-center text-zinc-500 mt-10">
              <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
              <p>No formulas found for "{searchTerm}"</p>
            </div>
          ) : (
            filteredFormulas.map(f => (
              <div key={f.id} className="bg-zinc-900/60 border border-indigo-500/20 rounded-xl p-4 hover:bg-zinc-800/80 hover:border-indigo-500/40 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-xs text-indigo-400/80 font-semibold mb-0.5">{f.category}</div>
                    <h3 className="text-zinc-200 font-medium text-sm">{f.name}</h3>
                  </div>
                  <div className="bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">
                    {f.level}
                  </div>
                </div>
                
                <div className="bg-black/50 border border-indigo-500/10 rounded-lg p-3 overflow-x-auto">
                  <code className="text-indigo-300 font-mono text-sm whitespace-nowrap drop-shadow-[0_0_8px_rgba(99,102,241,0.2)]">
                    {f.formula}
                  </code>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(63, 63, 70, 0.5);
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
}
