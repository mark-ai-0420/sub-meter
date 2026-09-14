import React, { useState } from 'react';
import { X, Copy, Check, MessageSquare, Send, MessageCircle, Share2, ExternalLink } from 'lucide-react';
import { TenantCalculationResult, BillingCycle, AppData } from '../../types';
import {
  formatTenantTextMessage,
  formatGroupSummaryTextMessage,
  generateViberDeepLink,
  generateWhatsAppDeepLink,
  shareViaWebShare,
} from '../../services/messageFormatter';

interface QuickShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: TenantCalculationResult | null;
  isGroupSummary?: boolean;
  cycle: BillingCycle;
  landlordInfo: AppData['landlordInfo'];
}

export const QuickShareModal: React.FC<QuickShareModalProps> = ({
  isOpen,
  onClose,
  tenant,
  isGroupSummary = false,
  cycle,
  landlordInfo,
}) => {
  if (!isOpen || (!tenant && !isGroupSummary)) return null;

  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const messageText = isGroupSummary
    ? formatGroupSummaryTextMessage(cycle, landlordInfo)
    : tenant
    ? formatTenantTextMessage(tenant, cycle, landlordInfo)
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const title = isGroupSummary
    ? `Group Master Summary - ${cycle.name}`
    : `Billing Statement - ${tenant?.unitNumber} (${tenant?.tenantName})`;

  const viberLink = generateViberDeepLink(tenant?.contactNumber, messageText);
  const whatsAppLink = generateWhatsAppDeepLink(tenant?.contactNumber, messageText);

  const handleNativeShare = async () => {
    const success = await shareViaWebShare(title, messageText);
    if (success) {
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-share-modal-title"
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 id="quick-share-modal-title" className="text-sm font-bold text-slate-100">{title}</h3>
              <p className="text-xs text-slate-400">
                1-Click direct dispatch to Viber, WhatsApp, Messenger, or SMS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center p-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Direct Chat Actions Bar */}
        <div className="bg-slate-50/80 px-6 py-3 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <span>Direct Channels:</span>
            {tenant?.contactNumber && (
              <span className="font-mono text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                {tenant.contactNumber}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Viber Direct */}
            <a
              href={viberLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Open in Viber</span>
            </a>

            {/* WhatsApp Direct */}
            <a
              href={whatsAppLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>

            {/* Web Share (Mobile) */}
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{shared ? 'Shared!' : 'Share...'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Message Content Box */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Formatted Message Preview:</span>
            <span className="text-[11px] text-slate-400 font-normal">
              Formatted with emojis and payment instructions
            </span>
          </div>

          <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 font-mono text-xs whitespace-pre-wrap leading-relaxed shadow-inner border border-slate-800 select-all max-h-[300px] overflow-y-auto">
            {messageText}
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Clicking copy copies the full breakdown with payment details.
          </span>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl shadow-sm transition active:scale-95 ${
                copied
                  ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                  : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Text Message</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
