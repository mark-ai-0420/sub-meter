import React, { useState, useEffect } from 'react';
import { Zap, CheckCircle2 } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';

interface OfflineStatusBadgeProps {
  className?: string;
  showWhenOnline?: boolean;
}

export const OfflineStatusBadge: React.FC<OfflineStatusBadgeProps> = ({
  className = '',
  showWhenOnline = false,
}) => {
  const { isOnline } = usePWA();
  const [showReconnectedToast, setShowReconnectedToast] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const handleOnlineEvent = () => {
      setShowReconnectedToast(true);
      timer = setTimeout(() => {
        setShowReconnectedToast(false);
      }, 4000);
    };

    window.addEventListener('online', handleOnlineEvent);
    return () => {
      window.removeEventListener('online', handleOnlineEvent);
      if (timer) clearTimeout(timer);
    };
  }, []);

  // If online and not showing reconnected notification (and not explicitly forced), render nothing
  if (isOnline && !showReconnectedToast && !showWhenOnline) {
    return null;
  }

  if (showReconnectedToast) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm animate-fadeIn transition-all duration-300 ${className}`}
        title="Internet connection restored. Your offline data is safe."
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span className="font-semibold">Back Online</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm animate-pulse-subtle transition-all duration-300 ${className}`}
        title="Operating offline. All bill calculations, readings, and PDF generation work locally."
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <Zap className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden md:inline font-semibold">
          ⚡ Offline Mode - All calculations and data saved locally
        </span>
        <span className="md:hidden font-semibold">
          ⚡ Offline Mode (Saved Locally)
        </span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700 ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      <span>Online</span>
    </div>
  );
};
