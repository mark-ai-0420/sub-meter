import React, { useState } from 'react';
import { RefreshCw, X, CheckCircle2 } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';

interface ReloadPromptProps {
  className?: string;
}

export const ReloadPrompt: React.FC<ReloadPromptProps> = ({ className = '' }) => {
  const { needRefresh, offlineReady, updateServiceWorker, closeReloadPrompt } = usePWA();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateServiceWorker(true);
    } catch (err) {
      console.error('[PWA] Error updating service worker:', err);
      setIsUpdating(false);
    }
  };

  if (!needRefresh && !offlineReady) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-md w-[calc(100vw-2rem)] sm:w-auto animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out motion-reduce:animate-none transition-all ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="bg-slate-900/95 backdrop-blur-md border border-orange-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-orange-500/10 text-white flex flex-col gap-3.5 ring-1 ring-orange-400/20">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/30">
              {needRefresh ? (
                <RefreshCw className={`w-5 h-5 ${isUpdating ? 'animate-spin text-orange-400' : 'text-orange-400'}`} />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-bold text-slate-100">
                  {needRefresh ? 'New Version Available' : 'App Ready for Offline Use'}
                </h4>
                {needRefresh && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                {needRefresh
                  ? 'An updated version of Sub-Meter Pro is ready with new features and improvements.'
                  : 'All assets and database cached. You can use the app without an internet connection.'}
              </p>
            </div>
          </div>

          <button
            onClick={closeReloadPrompt}
            aria-label="Dismiss reload notification"
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {needRefresh && (
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/80">
            <button
              onClick={closeReloadPrompt}
              className="min-h-[44px] px-3 py-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition inline-flex items-center justify-center"
            >
              Later
            </button>

            <button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-semibold rounded-lg shadow-sm shadow-orange-500/20 active:scale-95 transition disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
              <span>{isUpdating ? 'Updating...' : 'Update & Reload'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
