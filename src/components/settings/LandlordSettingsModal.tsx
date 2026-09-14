import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Building,
  CreditCard,
  Download,
  Upload,
  RefreshCw,
  Check,
  Database,
  MapPin,
  Sparkles,
  LayoutTemplate,
} from 'lucide-react';
import { AppData } from '../../types';
import {
  exportDataAsJSON,
  importDataFromJSON,
  syncAppDataWithIndexedDB,
} from '../../services/storage';
import { PresetTemplatesModal } from './PresetTemplatesModal';

interface LandlordSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appData: AppData;
  onUpdateLandlordInfo: (info: AppData['landlordInfo']) => void;
  onImportData: (data: AppData) => void;
  onResetData: () => void;
}

export const LandlordSettingsModal: React.FC<LandlordSettingsModalProps> = ({
  isOpen,
  onClose,
  appData,
  onUpdateLandlordInfo,
  onImportData,
  onResetData,
}) => {
  const [propertyName, setPropertyName] = useState(appData.landlordInfo.propertyName || '');
  const [landlordName, setLandlordName] = useState(appData.landlordInfo.landlordName || '');
  const [contactNumber, setContactNumber] = useState(appData.landlordInfo.contactNumber || '');
  const [email, setEmail] = useState(appData.landlordInfo.email || '');
  const [propertyAddress, setPropertyAddress] = useState(appData.landlordInfo.propertyAddress || '');
  const [paymentDetails, setPaymentDetails] = useState(appData.landlordInfo.paymentDetails || '');
  const [notes, setNotes] = useState(appData.landlordInfo.notes || '');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);

  useEffect(() => {
    setPropertyName(appData.landlordInfo.propertyName || '');
    setLandlordName(appData.landlordInfo.landlordName || '');
    setContactNumber(appData.landlordInfo.contactNumber || '');
    setEmail(appData.landlordInfo.email || '');
    setPropertyAddress(appData.landlordInfo.propertyAddress || '');
    setPaymentDetails(appData.landlordInfo.paymentDetails || '');
    setNotes(appData.landlordInfo.notes || '');
  }, [appData.landlordInfo, isOpen]);

  const handleSyncDB = async () => {
    try {
      setSyncStatus('syncing');
      const result = await syncAppDataWithIndexedDB(appData);
      if (result.data) {
        onImportData(result.data);
      }
      setSyncStatus('synced');
      setTimeout(() => setSyncStatus('idle'), 2500);
    } catch (err) {
      console.error(err);
      setSyncStatus('idle');
    }
  };

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateLandlordInfo({
      propertyName: propertyName.trim(),
      landlordName: landlordName.trim(),
      contactNumber: contactNumber.trim(),
      email: email.trim(),
      propertyAddress: propertyAddress.trim(),
      paymentDetails: paymentDetails.trim(),
      notes: notes.trim(),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleExportJSON = () => {
    const jsonStr = exportDataAsJSON(appData);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Meralco_Submeter_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = importDataFromJSON(content);
        onImportData(parsed);
        alert('Data successfully restored from backup file!');
        onClose();
      } catch (err: any) {
        alert('Failed to import backup file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleApplyPreset = (newAppData: AppData) => {
    onImportData(newAppData);
    setIsTemplatesModalOpen(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="landlord-settings-modal-title"
          className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 id="landlord-settings-modal-title" className="text-base font-extrabold text-slate-100">Property Settings & Customization</h3>
                <p className="text-xs text-slate-400">
                  Customize your property name, landlord info, payment instructions, and presets
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 overflow-y-auto text-xs flex-1">
            {/* Quick Template Switcher Card */}
            <div className="p-4 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200 rounded-2xl flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-600 flex items-center justify-center shrink-0 border border-orange-300">
                  <LayoutTemplate className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">Building Layout & Templates</h4>
                  <p className="text-[11px] text-slate-600">
                    Switch between 4-unit, 3-unit, duplex, or blank layout presets.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTemplatesModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-orange-50 text-orange-600 hover:text-orange-700 font-bold rounded-xl border border-orange-300 shadow-sm transition whitespace-nowrap text-xs active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Change Layout</span>
              </button>
            </div>

            {/* Landlord & Property Form */}
            <form onSubmit={handleSaveInfo} className="space-y-4">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-orange-500" />
                1. Property Profile & Contact Info
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Apartment / Property Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={propertyName}
                    onChange={(e) => setPropertyName(e.target.value)}
                    placeholder="e.g. Sunrise Residences, Villa Amor, 4-Door Apartment"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Landlord / Property Manager</label>
                  <input
                    type="text"
                    value={landlordName}
                    onChange={(e) => setLandlordName(e.target.value)}
                    placeholder="e.g. Juan Dela Cruz (Landlord)"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Contact Phone / Viber</label>
                  <input
                    type="text"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="e.g. 0917-123-4567"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    Property Address / Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={propertyAddress}
                    onChange={(e) => setPropertyAddress(e.target.value)}
                    placeholder="e.g. 123 Sampaguita St., Quezon City"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-orange-500" />
                  Payment Channels / Bank & GCash Instructions
                </label>
                <textarea
                  rows={3}
                  value={paymentDetails}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                  placeholder="e.g. GCash: 0917-123-4567 (Juan D.) | BDO Savings: 1234-5678-90 (Juan Dela Cruz) | Maya: 0917-123-4567"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-orange-500 text-xs"
                />
                <span className="text-[11px] text-slate-400">
                  This text automatically appears on every tenant receipt slip, PDF statement, and Viber/SMS text message.
                </span>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition text-xs shadow-sm"
                >
                  {savedSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Changes Saved!</span>
                    </>
                  ) : (
                    <span>Save Property Details</span>
                  )}
                </button>
              </div>
            </form>

            {/* Backup & Offline Storage Section */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-orange-500" />
                2. Data Backup & Offline Synchronization
              </h4>

              <p className="text-slate-500 text-[11px]">
                Your data is stored in your browser's offline storage engine. You can export a JSON backup to transfer your setup to other devices or family members.
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSyncDB}
                  disabled={syncStatus === 'syncing'}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition border border-slate-300 disabled:opacity-60 text-xs"
                >
                  {syncStatus === 'syncing' ? (
                    <RefreshCw className="w-3.5 h-3.5 text-orange-500 animate-spin" />
                  ) : syncStatus === 'synced' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Database className="w-3.5 h-3.5 text-orange-500" />
                  )}
                  <span>
                    {syncStatus === 'syncing'
                      ? 'Syncing...'
                      : syncStatus === 'synced'
                      ? 'Synced to Offline DB!'
                      : 'Sync Offline Storage'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition border border-slate-300 text-xs"
                >
                  <Download className="w-3.5 h-3.5 text-orange-500" />
                  <span>Export JSON Backup</span>
                </button>

                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition border border-slate-300 text-xs">
                  <Upload className="w-3.5 h-3.5 text-blue-500" />
                  <span>Restore Backup File</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={handleImportJSON}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Preset Templates Modal */}
      <PresetTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onApplyPreset={handleApplyPreset}
      />
    </>
  );
};
