"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export default function ErrorState({
  title = "Connection Error",
  message = "Could not load movie information from the backend service.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="bg-charcoal-900/60 border border-crimson-600/30 rounded-2xl p-8 text-center max-w-lg mx-auto my-12 flex flex-col items-center">
      <div className="w-12 h-12 rounded-xl bg-crimson-600/10 border border-crimson-600/30 flex items-center justify-center text-crimson-500 mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 mb-6 max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-slate-200 border border-charcoal-600 text-sm font-semibold transition-all hover:border-cyan-500"
        >
          <RefreshCw className="w-4 h-4 text-cyan-400" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
}
