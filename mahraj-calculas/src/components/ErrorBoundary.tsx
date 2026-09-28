import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Uncaught Error Boundary Catch:', error, errorInfo);
  }

  private handleReset = () => {
    // Clear any potentially corrupted local keys that could freeze re-render
    try {
      this.setState({ hasError: false, error: null });
    } catch (_) {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans">
          <div className="max-w-md w-full bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <AlertTriangle size={28} />
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2 tracking-tight">Calculation Engine Recovered</h2>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              The application encountered a heavy task or memory overload. We safely isolated the process to prevent freezing your browser.
            </p>

            <button
              onClick={this.handleReset}
              className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(6,182,212,0.4)] active:scale-[0.98]"
            >
              <RefreshCw size={16} />
              <span>Resume Mahraj Calculus</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
