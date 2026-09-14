import React, { useState, useEffect } from 'react';
import { TenantCalculationResult } from '../../types';
import { formatPHP } from '../../utils/formatters';
import {
  X,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  FileText,
  Hash,
  Sparkles,
  Banknote,
  QrCode,
  Building2,
  Wallet,
  AlertCircle,
} from 'lucide-react';

export type PaymentStatus = 'unpaid' | 'paid' | 'partial';
export type PaymentMethod = 'gcash' | 'maya' | 'bank_transfer' | 'cash' | 'other';

export interface TenantPayment {
  status: PaymentStatus;
  amountPaid: number;
  totalDue: number;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  paidAt?: string;
  notes?: string;
}

export interface PaymentStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: TenantCalculationResult | null;
  initialPayment?: TenantPayment;
  onSavePayment: (unitId: string, payment: TenantPayment) => void;
}

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'gcash', label: 'GCash', icon: <QrCode className="w-4 h-4 text-blue-500" />, color: 'border-blue-300 bg-blue-50/50 text-blue-700' },
  { id: 'maya', label: 'Maya', icon: <Wallet className="w-4 h-4 text-emerald-500" />, color: 'border-emerald-300 bg-emerald-50/50 text-emerald-700' },
  { id: 'bank_transfer', label: 'Bank Transfer (BDO/BPI/UB)', icon: <Building2 className="w-4 h-4 text-indigo-500" />, color: 'border-indigo-300 bg-indigo-50/50 text-indigo-700' },
  { id: 'cash', label: 'Cash', icon: <Banknote className="w-4 h-4 text-emerald-600" />, color: 'border-emerald-300 bg-emerald-50/50 text-emerald-800' },
  { id: 'other', label: 'Other', icon: <CreditCard className="w-4 h-4 text-slate-500" />, color: 'border-slate-300 bg-slate-50 text-slate-700' },
];

export const PaymentStatusModal: React.FC<PaymentStatusModalProps> = ({
  isOpen,
  onClose,
  tenant,
  initialPayment,
  onSavePayment,
}) => {
  const [status, setStatus] = useState<PaymentStatus>('unpaid');
  const [amountPaid, setAmountPaid] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [paidAt, setPaidAt] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Format current local datetime for ISO string default
  const getCurrentLocalDatetime = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (!isOpen || !tenant) return;

    if (initialPayment) {
      setStatus(initialPayment.status);
      setAmountPaid(initialPayment.amountPaid.toString());
      setPaymentMethod(initialPayment.paymentMethod || 'gcash');
      setReferenceNumber(initialPayment.referenceNumber || '');
      setPaidAt(initialPayment.paidAt || getCurrentLocalDatetime());
      setNotes(initialPayment.notes || '');
    } else {
      setStatus('unpaid');
      setAmountPaid('0');
      setPaymentMethod('gcash');
      setReferenceNumber('');
      setPaidAt(getCurrentLocalDatetime());
      setNotes('');
    }
  }, [isOpen, tenant, initialPayment]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !tenant) return null;

  const totalDue = tenant.totalAmountDue;
  const numericAmountPaid = Math.max(0, parseFloat(amountPaid) || 0);
  const remainingBalance = Math.max(0, totalDue - numericAmountPaid);

  const handleSelectStatus = (newStatus: PaymentStatus) => {
    setStatus(newStatus);
    if (newStatus === 'paid') {
      setAmountPaid(totalDue.toFixed(2));
      if (!paidAt) setPaidAt(getCurrentLocalDatetime());
    } else if (newStatus === 'unpaid') {
      setAmountPaid('0');
      setReferenceNumber('');
    } else if (newStatus === 'partial') {
      if (numericAmountPaid === 0 || numericAmountPaid >= totalDue) {
        setAmountPaid((totalDue / 2).toFixed(2));
      }
      if (!paidAt) setPaidAt(getCurrentLocalDatetime());
    }
  };

  const handlePayFull = () => {
    setStatus('paid');
    setAmountPaid(totalDue.toFixed(2));
    if (!paidAt) setPaidAt(getCurrentLocalDatetime());
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setAmountPaid(raw);
    const parsed = parseFloat(raw) || 0;

    if (parsed <= 0) {
      setStatus('unpaid');
    } else if (parsed >= totalDue - 0.01) {
      setStatus('paid');
    } else {
      setStatus('partial');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = status === 'unpaid' ? 0 : numericAmountPaid;

    const paymentRecord: TenantPayment = {
      status,
      amountPaid: finalAmount,
      totalDue,
      paymentMethod: status === 'unpaid' ? undefined : paymentMethod,
      referenceNumber: status === 'unpaid' ? undefined : referenceNumber.trim(),
      paidAt: status === 'unpaid' ? undefined : paidAt,
      notes: notes.trim() || undefined,
    };

    onSavePayment(tenant.unitId, paymentRecord);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-status-modal-title"
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-5 text-white flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-400/30 flex items-center justify-center text-orange-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="payment-status-modal-title" className="font-bold text-base text-white">{tenant.unitNumber}</h3>
                <span className="text-[11px] font-medium text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                  {tenant.tenantName}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Record payment status & reference details for this cycle
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-slate-400 hover:text-white p-2.5 rounded-xl hover:bg-slate-800/80 transition active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Bill Summary Banner */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-slate-500 font-medium block text-[11px]">Total Amount Due</span>
              <span className="text-xl font-extrabold text-slate-900 font-mono tracking-tight">
                {formatPHP(totalDue)}
              </span>
            </div>

            <div className="text-right">
              <span className="text-slate-500 font-medium block text-[11px]">
                {status === 'paid'
                  ? 'Settlement Status'
                  : status === 'partial'
                  ? 'Remaining Due'
                  : 'Balance Due'}
              </span>
              {status === 'paid' ? (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Fully Settled
                </span>
              ) : status === 'partial' ? (
                <span className="text-base font-extrabold text-amber-600 font-mono">
                  {formatPHP(remainingBalance)}
                </span>
              ) : (
                <span className="text-base font-extrabold text-rose-600 font-mono">
                  {formatPHP(totalDue)}
                </span>
              )}
            </div>
          </div>

          {/* 1. Payment Status Selector (Pill / Radio) */}
          <div className="space-y-2">
            <label className="font-bold text-slate-800 block text-xs">
              Payment Status <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleSelectStatus('unpaid')}
                className={`py-3 px-3 rounded-2xl border font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition active:scale-95 ${
                  status === 'unpaid'
                    ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-sm ring-2 ring-rose-300'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <XCircle className={`w-4 h-4 ${status === 'unpaid' ? 'text-rose-600' : 'text-slate-400'}`} />
                <span>Unpaid</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectStatus('partial')}
                className={`py-3 px-3 rounded-2xl border font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition active:scale-95 ${
                  status === 'partial'
                    ? 'bg-amber-50 border-amber-400 text-amber-800 shadow-sm ring-2 ring-amber-300'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Clock className={`w-4 h-4 ${status === 'partial' ? 'text-amber-600' : 'text-slate-400'}`} />
                <span>Partial</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectStatus('paid')}
                className={`py-3 px-3 rounded-2xl border font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition active:scale-95 ${
                  status === 'paid'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm ring-2 ring-emerald-300'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 ${status === 'paid' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>Paid (Full)</span>
              </button>
            </div>
          </div>

          {/* 2. Amount Paid (₱) with 1-click Pay Full button */}
          {status !== 'unpaid' && (
            <div className="space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 block text-xs">
                  Amount Paid (₱) <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handlePayFull}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg transition active:scale-95 border border-orange-200"
                >
                  <Sparkles className="w-3 h-3" />
                  Pay Full ({formatPHP(totalDue)})
                </button>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  ₱
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={totalDue * 2}
                  value={amountPaid}
                  onChange={handleAmountChange}
                  className="w-full pl-8 pr-4 py-2.5 text-sm font-bold font-mono bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  placeholder="0.00"
                  required
                />
              </div>

              {status === 'partial' && (
                <div className="flex items-center justify-between text-[11px] text-amber-700 bg-amber-50/70 px-3 py-1.5 rounded-xl border border-amber-200">
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    Remaining Arrears / Balance:
                  </span>
                  <strong className="font-mono">{formatPHP(remainingBalance)}</strong>
                </div>
              )}
            </div>
          )}

          {/* 3. Payment Method Selector */}
          {status !== 'unpaid' && (
            <div className="space-y-2 animate-in fade-in duration-150">
              <label className="font-bold text-slate-800 block text-xs">
                Payment Channel / Method <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PAYMENT_METHODS.map((method) => {
                  const isSelected = paymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition active:scale-95 ${
                        isSelected
                          ? `${method.color} ring-2 ring-orange-400 font-bold shadow-xs`
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {method.icon}
                      <span className="truncate text-xs">{method.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. Reference Number & Date Paid */}
          {status !== 'unpaid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-150">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block text-[11px]">
                  GCash / Bank Reference #
                </label>
                <div className="relative">
                  <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="e.g. 1002 9482 1293"
                    className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 block text-[11px]">
                  Date & Time Paid
                </label>
                <div className="relative">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="datetime-local"
                    value={paidAt}
                    onChange={(e) => setPaidAt(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. Payment Notes / Proof */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 block text-[11px]">
              Payment Notes / Proof / Receipt Memo
            </label>
            <div className="relative">
              <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Sent via Viber with screenshot, promised balance next Friday..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Payment Status</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
