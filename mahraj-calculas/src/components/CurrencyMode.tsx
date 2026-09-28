import { useState, useMemo, useEffect } from 'react';

// Fallback rates in case API fails
const fallbackRates: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 151.40,
  AUD: 1.53,
  CAD: 1.36,
  CHF: 0.90,
  CNY: 7.23,
  INR: 83.25,
  BRL: 5.01,
};

export function CurrencyMode() {
  const [amount, setAmount] = useState('1');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  
  const [rates, setRates] = useState<Record<string, number>>(fallbackRates);
  const [currencies, setCurrencies] = useState<string[]>(Object.keys(fallbackRates));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const fetchRates = async (isBackground = false) => {
      try {
        if (!isBackground) setIsLoading(true);
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (!res.ok) throw new Error('Failed to fetch rates');
        const data = await res.json();
        setRates(data.rates);
        setCurrencies(Object.keys(data.rates));
        setError(null);
        setLastUpdated(new Date());
      } catch (err) {
        console.error(err);
        if (!isBackground) setError('Using offline exchange rates');
      } finally {
        if (!isBackground) setIsLoading(false);
      }
    };
    
    fetchRates();

    // Poll every 60 seconds for exchange rates (conserves battery & prevents API rate limiting for thousands of users)
    const intervalId = setInterval(() => {
      fetchRates(true);
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const result = useMemo(() => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || !rates[fromCurrency] || !rates[toCurrency]) return null;
    
    // Convert to USD first (base), then to target currency
    const inUSD = parsedAmount / rates[fromCurrency];
    const converted = inUSD * rates[toCurrency];
    
    return converted;
  }, [amount, fromCurrency, toCurrency, rates]);

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 relative z-10 w-full font-sans text-white">
      
      <div className="bg-zinc-900/80 border border-amber-500/30 rounded-3xl p-6 shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]">
        
        <div className="space-y-6 flex-1">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm text-zinc-400">Amount</label>
              <select 
                value={fromCurrency} 
                onChange={(e) => setFromCurrency(e.target.value)}
                className="bg-zinc-800 text-amber-400 text-sm font-bold rounded-lg px-2 py-1 border border-zinc-700 outline-none max-w-[120px]"
              >
                {currencies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <input 
              type="number" 
              inputMode="decimal"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 text-3xl font-bold text-white focus:border-amber-500 focus:outline-none transition-colors font-mono tabular-nums"
              placeholder="0.00"
            />
          </div>

          <div className="flex justify-center -my-2 relative z-10">
            <button 
              className="bg-amber-500 text-black rounded-full p-2 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
              onClick={() => {
                setFromCurrency(toCurrency);
                setToCurrency(fromCurrency);
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/></svg>
            </button>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm text-zinc-400">Converted To</label>
              <select 
                value={toCurrency} 
                onChange={(e) => setToCurrency(e.target.value)}
                className="bg-zinc-800 text-amber-400 text-sm font-bold rounded-lg px-2 py-1 border border-zinc-700 outline-none max-w-[120px]"
              >
                {currencies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="w-full bg-black/40 border border-amber-500/30 rounded-xl p-4 text-3xl font-bold text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)] flex justify-between items-center overflow-x-auto font-mono">
              <span>{result !== null ? result.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '...'}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center flex flex-col items-center">
          {isLoading ? (
            <span className="text-xs text-amber-500/70 animate-pulse">Fetching live rates...</span>
          ) : error ? (
            <span className="text-xs text-red-400">{error}</span>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-lime-500/90 font-bold flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-500"></span>
                </span>
                LIVE UPDATES ACTIVE
              </span>
              {lastUpdated && (
                <span className="text-[10px] text-zinc-500">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
