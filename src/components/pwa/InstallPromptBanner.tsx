import React, { useState } from 'react';
import { Zap, Download, X, Share, PlusSquare, Smartphone, CheckCircle, ShieldCheck } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';

interface InstallPromptBannerProps {
  className?: string;
  forceShow?: boolean;
}

export const InstallPromptBanner: React.FC<InstallPromptBannerProps> = ({
  className = '',
  forceShow = false,
}) => {
  const { isInstallable, isInstalled, isIOS, installApp } = usePWA();
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('submeter_pwa_banner_dismissed') === 'true';
  });
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);

  // If already installed or already dismissed (and not force-shown), do not render
  if (isInstalled && !forceShow) return null;
  if (isDismissed && !forceShow) return null;
  if (!isInstallable && !forceShow) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('submeter_pwa_banner_dismissed', 'true');
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    setIsInstalling(true);
    try {
      const installed = await installApp();
      if (installed) {
        setIsDismissed(true);
      }
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <>
      <div
        className={`relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-850 to-orange-950/50 border border-orange-500/30 rounded-2xl p-4 sm:p-5 shadow-lg shadow-orange-500/10 text-white transition-all duration-300 ${className}`}
      >
        {/* Background decorative glow */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Left section: Icon + Content */}
          <div className="flex items-start sm:items-center space-x-3.5 flex-1 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center shrink-0 shadow-md shadow-orange-500/30 ring-2 ring-orange-400/20">
              <Zap className="w-6 h-6 text-white stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  <ShieldCheck className="w-3 h-3" /> PWA Offline Pro
                </span>
                <span className="text-xs font-semibold text-slate-300">
                  Zero Network Lag
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Install Sub-Meter Pro on your device for instant offline access
              </h3>

              <p className="text-xs text-slate-400 line-clamp-2 sm:line-clamp-none">
                Calculate Meralco bills, view past cycles, and export tenant PDF statements anywhere—even without Wi-Fi or mobile data.
              </p>
            </div>
          </div>

          {/* Right section: Action Buttons */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end shrink-0 pt-1 md:pt-0">
            <button
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="flex-1 md:flex-initial min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-orange-500/25 transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isIOS ? 'How to Install on iOS' : isInstalling ? 'Installing...' : 'Install App'}</span>
            </button>

            <button
              onClick={handleDismiss}
              aria-label="Dismiss banner"
              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center p-2.5 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Step-by-Step Installation Modal */}
      {showIOSModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowIOSModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-100">Install on iPhone / iPad</h4>
                  <p className="text-xs text-slate-400">Add to your Home Screen in 3 easy steps</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step-by-step instructions */}
            <div className="space-y-3.5 text-xs sm:text-sm text-slate-300">
              <div className="flex items-start space-x-3 p-3 bg-slate-800/60 rounded-xl border border-slate-750">
                <span className="w-6 h-6 rounded-full bg-orange-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div className="space-y-1">
                  <p className="font-semibold text-slate-200">Open in Safari and Tap Share</p>
                  <p className="text-slate-400 text-xs flex items-center gap-1.5">
                    Tap the <Share className="w-4 h-4 text-sky-400 inline" /> <strong>Share</strong> button at the bottom of Safari's toolbar.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-slate-800/60 rounded-xl border border-slate-750">
                <span className="w-6 h-6 rounded-full bg-orange-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div className="space-y-1">
                  <p className="font-semibold text-slate-200">Select "Add to Home Screen"</p>
                  <p className="text-slate-400 text-xs flex items-center gap-1.5">
                    Scroll down the actions menu and choose <PlusSquare className="w-4 h-4 text-amber-400 inline" /> <strong>Add to Home Screen</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-slate-800/60 rounded-xl border border-slate-750">
                <span className="w-6 h-6 rounded-full bg-orange-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div className="space-y-1">
                  <p className="font-semibold text-slate-200">Tap "Add" in Top-Right</p>
                  <p className="text-slate-400 text-xs">
                    Confirm by tapping <strong className="text-orange-400">Add</strong>. Sub-Meter Pro is now installed like a native app!
                  </p>
                </div>
              </div>
            </div>

            {/* Offline benefit reminder */}
            <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center space-x-2 text-xs text-orange-300">
              <CheckCircle className="w-4 h-4 text-orange-400 shrink-0" />
              <span>Full offline capabilities & persistent local storage included.</span>
            </div>

            {/* Close action */}
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-white text-xs font-semibold rounded-xl transition border border-slate-700"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
