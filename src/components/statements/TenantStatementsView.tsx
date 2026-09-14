import React, { useState } from 'react';
import {
  BillingCycle,
  AppData,
  TenantCalculationResult,
} from '../../types';
import { MasterSummaryTable } from './MasterSummaryTable';
import { TenantSlipCard } from './TenantSlipCard';
import { QuickShareModal } from './QuickShareModal';
import { Search, Filter, Layers, Users, Zap, FileText } from 'lucide-react';

interface TenantStatementsViewProps {
  cycle: BillingCycle;
  appData: AppData;
  onOpenAdditionalCharges: (unitId: string) => void;
}

export const TenantStatementsView: React.FC<TenantStatementsViewProps> = ({
  cycle,
  appData,
  onOpenAdditionalCharges,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOccupancy, setFilterOccupancy] = useState<'all' | 'occupied' | 'vacant'>('all');
  const [activeShareTenant, setActiveShareTenant] = useState<TenantCalculationResult | null>(null);
  const [isGroupShareOpen, setIsGroupShareOpen] = useState(false);

  const summary = cycle.calculationSummary;
  if (!summary) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
        Please complete the billing details in the Calculator tab to generate tenant statements.
      </div>
    );
  }

  const filteredTenants = summary.tenantResults.filter((t) => {
    const matchesSearch =
      t.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.tenantName.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterOccupancy === 'occupied') return matchesSearch && t.isOccupied;
    if (filterOccupancy === 'vacant') return matchesSearch && !t.isOccupied;
    return matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Master Audit Sheet Section */}
      <MasterSummaryTable
        cycle={cycle}
        landlordInfo={appData.landlordInfo}
        onOpenGroupShare={() => setIsGroupShareOpen(true)}
      />

      {/* Individual Tenant Slips Section */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" />
              Individual Tenant Billing Slips & Receipts
            </h3>
            <p className="text-xs text-slate-500">
              Download clean A5 PDF statements or copy formatted breakdown messages for messaging apps.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search unit or tenant..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none w-48 sm:w-64"
              />
            </div>

            <select
              value={filterOccupancy}
              onChange={(e) => setFilterOccupancy(e.target.value as any)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none cursor-pointer"
            >
              <option value="all">All Units ({summary.tenantResults.length})</option>
              <option value="occupied">Occupied Only</option>
              <option value="vacant">Vacant Only</option>
            </select>
          </div>
        </div>

        {/* Slips Grid */}
        {filteredTenants.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-sm">
            No units match your search filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTenants.map((tenant) => (
              <TenantSlipCard
                key={tenant.unitId}
                tenant={tenant}
                cycle={cycle}
                landlordInfo={appData.landlordInfo}
                onOpenQuickShare={(t) => setActiveShareTenant(t)}
                onOpenAdditionalCharges={onOpenAdditionalCharges}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick Share Modal for Single Tenant */}
      <QuickShareModal
        isOpen={Boolean(activeShareTenant)}
        onClose={() => setActiveShareTenant(null)}
        tenant={activeShareTenant}
        cycle={cycle}
        landlordInfo={appData.landlordInfo}
      />

      {/* Quick Share Modal for Group Summary */}
      <QuickShareModal
        isOpen={isGroupShareOpen}
        onClose={() => setIsGroupShareOpen(false)}
        tenant={null}
        isGroupSummary={true}
        cycle={cycle}
        landlordInfo={appData.landlordInfo}
      />
    </div>
  );
};
