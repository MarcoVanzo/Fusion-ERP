import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars


  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 bg-zinc-950 text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 blur-[100px] rounded-full pointer-events-none"></div>
          
          <div className="glass-panel p-12 border border-red-500/20 rounded-2xl shadow-[0_20px_40px_rgba(220,38,38,0.1)] relative z-10 flex flex-col items-center max-w-lg">
            <AlertCircle size={64} strokeWidth={1.5} className="text-red-500 mb-6 drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
            <h2 className="text-3xl font-heading text-white mb-4 tracking-tight">Qualcosa è andato storto</h2>
            <p className="text-zinc-400 text-lg mb-8">
              Si è verificato un errore imprevisto durante il caricamento del modulo sportivo.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-red-600 text-white font-heading text-sm tracking-widest uppercase px-6 py-3 clip-diagonal hover:bg-red-500 transition-colors shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)]"
              >
                Ricarica Pagina
              </button>
              <Link
                to="/"
                onClick={() => this.setState({ hasError: false })}
                className="bg-zinc-800 text-white font-heading text-sm tracking-widest uppercase px-6 py-3 clip-diagonal hover:bg-zinc-700 transition-colors border border-zinc-700 hover:border-zinc-600"
              >
                Torna alla Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
