import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-950 text-white text-center">
          <div className="max-w-md p-8 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold">Kutilmagan xatolik yuz berdi</h2>
            <p className="text-xs text-zinc-400">
              {this.state.error?.message || 'Iltimos, sahifani yangilang yoki birozdan so‘ng qayta urinib ko‘ring.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Sahifani yangilash</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
