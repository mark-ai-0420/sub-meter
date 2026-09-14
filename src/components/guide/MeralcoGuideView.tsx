import React from 'react';
import {
  HelpCircle,
  Zap,
  ShieldCheck,
  Percent,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  FileCheck,
} from 'lucide-react';

export const MeralcoGuideView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-md border border-slate-800">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Zap className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-white">
              The Apartment Sub-Meter Calculation Guide
            </h2>
            <p className="text-xs text-slate-300">
              Why the blended rate method protects landlords from paying out-of-pocket surcharges
            </p>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-2">
          When managing an apartment building with one primary Meralco meter and multiple tenant sub-meters, traditional "per kWh flat rate" estimation almost always leaves landlords losing thousands of pesos each month to taxes, generation fees, line loss, and common area power.
        </p>
      </div>

      {/* Why Flat Rate Fails vs Blended Rate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Flat Rate Trap */}
        <div className="bg-white p-6 rounded-2xl border border-red-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            The Common "Fixed Rate" Pitfall
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Many landlords arbitrarily charge a flat ₱10.00/kWh or ₱12.00/kWh. However:
          </p>
          <ul className="text-xs text-slate-600 space-y-2">
            <li className="flex items-start gap-1.5">
              <span className="text-red-500 font-bold">•</span>
              <span><strong>Meralco rates fluctuate:</strong> Fuel prices, generation charges, and WESM rates change every month.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-red-500 font-bold">•</span>
              <span><strong>Hidden Surcharges:</strong> VAT (12%), System Loss (8-10%), FIT-All, and fixed customer charges are neglected.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-red-500 font-bold">•</span>
              <span><strong>Line Loss & Wire Resistance:</strong> Physical sub-meter totals rarely sum up to 100% of the main meter. The landlord ends up paying the difference.</span>
            </li>
          </ul>
        </div>

        {/* The Solution */}
        <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            How Our Calculator Solves It
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Our system uses exact mathematical proportional allocation:
          </p>
          <ul className="text-xs text-slate-600 space-y-2">
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Effective Blended Rate:</strong> Total Meralco Bill (₱) ÷ Total Main kWh (e.g. ₱6,450.75 ÷ 542.8 kWh = <strong>₱11.8842/kWh</strong>). All taxes & generation surcharges are proportionally embedded.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Common Area Split:</strong> Dedicated common meters (e.g. water pump) are split equally or proportionally among active units.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Exact 100% Reconciliation:</strong> Every single centavo is reconciled so the landlord collects exactly 100.00% of the Meralco bill.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Step by Step Walkthrough */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Layers className="w-4 h-4 text-orange-500" />
          Monthly Billing Workflow in 4 Easy Steps
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-6 h-6 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center mb-2">
              1
            </div>
            <h4 className="font-bold text-slate-800 mb-1">Meralco Bill</h4>
            <p className="text-slate-500">
              When your monthly bill arrives, enter the <strong>Total Amount Due (₱)</strong> and <strong>Total kWh</strong>.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-6 h-6 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center mb-2">
              2
            </div>
            <h4 className="font-bold text-slate-800 mb-1">Read Sub-Meters</h4>
            <p className="text-slate-500">
              Input the current dial reading on each tenant's sub-meter. Previous dials are already auto-filled from last month!
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-6 h-6 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center mb-2">
              3
            </div>
            <h4 className="font-bold text-slate-800 mb-1">Add Extra Fees</h4>
            <p className="text-slate-500">
              Attach any optional items like Water Sub-meter, Garbage share, or previous month unpaid balances.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-6 h-6 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center mb-2">
              4
            </div>
            <h4 className="font-bold text-slate-800 mb-1">Send Statements</h4>
            <p className="text-slate-500">
              Click <strong>Copy Viber / SMS</strong> to send instant WhatsApp/Viber messages, or print professional A5 PDF receipts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
