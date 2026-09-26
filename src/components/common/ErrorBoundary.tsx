import { Component, ReactNode, ErrorInfo } from 'react';
import {
  AlertTriangle,
  Zap,
  Download,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { resetToSampleData } from '../../services/storage';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo?: ErrorInfo | null;
  backupDownloaded: boolean;
  resetSuccess: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      backupDownloaded: false,
      resetSuccess: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[Meralco Sub-Meter ErrorBoundary] Uncaught runtime exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleDownloadBackup = (): void => {
    try {
      const rawData = localStorage.getItem('meralco_submeter_app_data_v1');
      let outputContent: string;

      if (rawData) {
        try {
          const parsed = JSON.parse(rawData);
          outputContent = JSON.stringify(parsed, null, 2);
        } catch {
          outputContent = rawData;
        }
      } else {
        // Collect all localStorage keys as safe fallback snapshot
        const dump: Record<string, unknown> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            try {
              dump[key] = JSON.parse(localStorage.getItem(key) || '""');
            } catch {
              dump[key] = localStorage.getItem(key);
            }
          }
        }
        outputContent = JSON.stringify(dump, null, 2);
      }

      const blob = new Blob([outputContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.href = url;
      link.download = `meralco-submeter-emergency-backup-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      this.setState({ backupDownloaded: true });
    } catch (err) {
      console.error('[ErrorBoundary] Failed to extract emergency data backup:', err);
      alert('Could not download backup automatically. Please check your browser storage permissions.');
    }
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleReset = (): void => {
    const confirmed = window.confirm(
      '⚠️ Are you sure you want to reset to default sample data?\n\n' +
      'This will clear locally stored data that might be causing this crash. ' +
      'Make sure you click "Download Emergency Data Backup" first so no records are lost!'
    );

    if (confirmed) {
      try {
        resetToSampleData();
      } catch (err) {
        console.warn('[ErrorBoundary] Failed calling resetToSampleData, manually wiping storage key:', err);
        localStorage.removeItem('meralco_submeter_app_data_v1');
      }
      this.setState({ resetSuccess: true });
      setTimeout(() => {
        window.location.reload();
      }, 350);
    }
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 sm:p-6 antialiased selection:bg-orange-500/30 selection:text-orange-200">
        {/* Ambient background glow */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl opacity-60" />
          <div className="absolute -bottom-10 right-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-xl bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/50 space-y-6">
          {/* Header block */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="relative flex-shrink-0 w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center shadow-inner">
              <AlertTriangle className="w-7 h-7 stroke-[2.2]" aria-hidden="true" />
              <Zap className="w-3.5 h-3.5 text-orange-400 fill-orange-400 absolute -bottom-1 -right-1" aria-hidden="true" />
            </div>

            <div className="space-y-1 flex-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Safe Mode &bull; Storage Intact</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Something unexpected occurred
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Don't worry — your meter readings and billing data are safely stored on this device.
              </p>
            </div>
          </div>

          {/* Backup Download Success Alert */}
          {this.state.backupDownloaded && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>
                <strong>Backup exported successfully!</strong> Your billing cycles and meter readings JSON file was saved to your device.
              </span>
            </div>
          )}

          {/* Action buttons (all >= 44px touch target, active:scale-95 micro-feedback) */}
          <div className="space-y-3">
            {/* 1. Emergency Data Backup */}
            <button
              type="button"
              onClick={this.handleDownloadBackup}
              className="w-full min-h-[44px] h-12 px-4 rounded-xl font-semibold text-sm transition-all duration-150 inline-flex items-center justify-center gap-2.5 active:scale-95 bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-950/40 border border-orange-400/30 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              <Download className="w-4 h-4" />
              <span>
                {this.state.backupDownloaded
                  ? '💾 Re-download Emergency Data Backup (.json)'
                  : '💾 Download Emergency Data Backup'}
              </span>
            </button>

            {/* 2. Reload Application */}
            <button
              type="button"
              onClick={this.handleReload}
              className="w-full min-h-[44px] h-12 px-4 rounded-xl font-semibold text-sm transition-all duration-150 inline-flex items-center justify-center gap-2.5 active:scale-95 bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-400/50 shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>🔄 Reload Application</span>
            </button>

            {/* 3. Reset to Default Sample Data */}
            <button
              type="button"
              onClick={this.handleReset}
              disabled={this.state.resetSuccess}
              className="w-full min-h-[44px] h-11 px-4 rounded-xl font-medium text-xs sm:text-sm transition-all duration-150 inline-flex items-center justify-center gap-2.5 active:scale-95 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 focus:outline-none focus:ring-2 focus:ring-rose-500/40 disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>
                {this.state.resetSuccess
                  ? 'Clearing data & reloading...'
                  : '⚠️ Reset to Default Sample Data'}
              </span>
            </button>
          </div>

          {/* Collapsible technical error details for debugging */}
          <details className="group border border-slate-700/60 bg-slate-900/60 rounded-xl overflow-hidden transition-all text-left">
            <summary className="min-h-[44px] px-4 py-3 cursor-pointer text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center justify-between select-none transition-colors">
              <span className="flex items-center gap-2">
                <span>View technical error details</span>
                {this.state.error?.name && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    {this.state.error.name}
                  </span>
                )}
              </span>
              <ChevronDown className="w-4 h-4 transition-transform duration-200 group-open:rotate-180 text-slate-400" />
            </summary>

            <div className="px-4 pb-4 pt-1 space-y-2 border-t border-slate-800/80">
              <p className="text-xs font-mono text-rose-300 break-words font-semibold mt-2">
                {this.state.error?.message || 'Unknown error occurred'}
              </p>
              {this.state.error?.stack && (
                <pre className="text-[11px] font-mono text-slate-400 bg-slate-950/80 p-3 rounded-lg border border-slate-800 overflow-x-auto max-h-48 whitespace-pre leading-relaxed select-text">
                  {this.state.error.stack}
                </pre>
              )}
              {this.state.errorInfo?.componentStack && (
                <pre className="text-[10px] font-mono text-slate-500 bg-slate-950/40 p-2.5 rounded-lg border border-slate-850 overflow-x-auto max-h-36 whitespace-pre leading-relaxed select-text">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>
          </details>

          {/* Footer note */}
          <div className="pt-1 text-center">
            <p className="text-[11px] text-slate-400 tracking-wide">
              Meralco Sub-Meter Pro &bull; Offline-First Resiliency Shield
            </p>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
