import React, { useState } from 'react';
import {
  Zap,
  Plus,
  Settings,
  Calendar,
  Building2,
  Download,
  Smartphone,
  Share,
  PlusSquare,
  X,
  CheckCircle,
} from 'lucide-react';
import { AppData } from '../../types';
import { formatDate } from '../../utils/formatters';
import { OfflineStatusBadge } from '../pwa/OfflineStatusBadge';
import { usePWA } from '../../hooks/usePWA';

interface NavbarProps {
  appData: AppData;
  onSelectCycle: (cycleId: string) => void;
  onOpenNewCycleModal: () => void;
  onOpenSettingsModal: () => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  appData,
  onSelectCycle,
  onOpenNewCycleModal,
  onOpenSettingsModal,
  onResetData,
}) => {
  const activeCycle = appData.billingCycles.find((c) => c.id === appData.activeCycleId);
  const { isInstallable, isInstalled, isIOS, installApp } = usePWA();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }
    setIsInstalling(true);
    try {
      await installApp();
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md w-full max-w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full max-w-full overflow-hidden">
          <div className="flex items-center justify-between h-16 gap-2 sm:gap-3 w-full min-w-0">
            {/* Logo & Title */}
            <div className="flex items-center space-x-2 sm:space-x-3 shrink-0 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20 ring-2 ring-orange-400/30 shrink-0">
                <Zap className="w-6 h-6 text-white stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-white font-bold text-base sm:text-lg tracking-tight truncate">
                    Meralco Sub-Meter
                  </span>
                  <span className="hidden sm:inline-block text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 shrink-0">
                    Apartment Pro
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onOpenSettingsModal}
                  title="Click to customize property name and settings"
                  aria-label={`Property Settings: ${appData.landlordInfo.propertyName || 'My Apartment Property'}`}
                  className="text-xs text-slate-400 hover:text-orange-300 min-h-[44px] inline-flex items-center gap-1.5 truncate max-w-[120px] sm:max-w-xs transition text-left group py-1"
                >
                  <Building2 className="w-3 h-3 text-slate-500 group-hover:text-orange-400 shrink-0" aria-hidden="true" />
                  <span className="truncate underline decoration-dotted decoration-slate-600 group-hover:decoration-orange-400">
                    {appData.landlordInfo.propertyName || 'My Apartment Property'}
                  </span>
                </button>
              </div>
            </div>

            {/* Middle Section: Offline Status Badge */}
            <div className="hidden md:flex items-center justify-center">
              <OfflineStatusBadge />
            </div>

            {/* Center / Right controls */}
            <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
              {/* Active Cycle Selector */}
              {appData.billingCycles.length > 0 && (
                <div className="relative hidden lg:flex items-center">
                  <Calendar className="w-4 h-4 text-orange-400 absolute left-3 pointer-events-none" />
                  <select
                    value={appData.activeCycleId || ''}
                    onChange={(e) => onSelectCycle(e.target.value)}
                    className="pl-9 pr-8 py-1.5 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:outline-none appearance-none cursor-pointer hover:bg-slate-750 transition"
                  >
                    {appData.billingCycles.map((cycle) => (
                      <option key={cycle.id} value={cycle.id}>
                        {cycle.name} ({formatDate(cycle.mainBill.periodTo)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Install App Button (When installable & not standalone) */}
              {isInstallable && !isInstalled && (
                <button
                  onClick={handleInstallClick}
                  disabled={isInstalling}
                  title="Install Sub-Meter Pro on this device"
                  className="hidden md:inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 min-h-[44px] bg-slate-800 hover:bg-slate-750 text-orange-400 hover:text-orange-300 border border-orange-500/30 rounded-lg text-xs font-semibold shadow-sm transition active:scale-95 disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-orange-400" />
                  <span>Install App</span>
                </button>
              )}

              {/* New Billing Cycle Button */}
              <button
                onClick={onOpenNewCycleModal}
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-sm shadow-orange-500/20 transition active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline ml-1.5">New Billing Month</span>
                <span className="sm:hidden ml-1">New Month</span>
              </button>

              {/* Settings & Info */}
              <button
                onClick={onOpenSettingsModal}
                title="Settings & Backup"
                aria-label="Settings and Property Configuration"
                className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition shrink-0"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* iOS Installation Instructions Modal */}
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
                  <h4 className="text-base font-bold text-slate-100">Install on iOS Device</h4>
                  <p className="text-xs text-slate-400">Add to Home Screen in 3 steps</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                aria-label="Close iOS installation instructions"
                className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step-by-step instructions */}
            <div className="space-y-3 text-xs sm:text-sm text-slate-300">
              <div className="flex items-start space-x-3 p-3 bg-slate-800/60 rounded-xl border border-slate-750">
                <span className="w-6 h-6 rounded-full bg-orange-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div className="space-y-1">
                  <p className="font-semibold text-slate-200">Open in Safari and Tap Share</p>
                  <p className="text-slate-400 text-xs flex items-center gap-1.5">
                    Tap the <Share className="w-4 h-4 text-sky-400 inline" /> <strong>Share</strong> button in Safari toolbar.
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
                    Scroll down and select <PlusSquare className="w-4 h-4 text-amber-400 inline" /> <strong>Add to Home Screen</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-slate-800/60 rounded-xl border border-slate-750">
                <span className="w-6 h-6 rounded-full bg-orange-500 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div className="space-y-1">
                  <p className="font-semibold text-slate-200">Confirm by Tapping "Add"</p>
                  <p className="text-slate-400 text-xs">
                    Tap <strong className="text-orange-400">Add</strong> in top-right to launch Sub-Meter Pro natively!
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center space-x-2 text-xs text-orange-300">
              <CheckCircle className="w-4 h-4 text-orange-400 shrink-0" />
              <span>Full offline capabilities & local database storage enabled.</span>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-white text-xs font-semibold rounded-xl transition border border-slate-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
