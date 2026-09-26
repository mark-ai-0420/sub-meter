import React from 'react';
import { Calculator, Building, History, HelpCircle } from 'lucide-react';

export type ActiveTab = 'calculator' | 'units' | 'history' | 'guide';

interface TabNavigationProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  unitsCount: number;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onChangeTab,
  unitsCount,
}) => {
  const tabs = [
    {
      id: 'calculator' as ActiveTab,
      label: 'Monthly Calculator',
      shortLabel: 'Calculator',
      icon: Calculator,
    },
    {
      id: 'units' as ActiveTab,
      label: 'Units & Sub-Meters Setup',
      shortLabel: 'Units & Meters',
      icon: Building,
      count: unitsCount,
    },
    {
      id: 'history' as ActiveTab,
      label: 'Billing History & Archives',
      shortLabel: 'History',
      icon: History,
    },
    {
      id: 'guide' as ActiveTab,
      label: 'Meralco Guide & Formulas',
      shortLabel: 'Guide',
      icon: HelpCircle,
    },
  ];

  return (
    <div className="bg-white border-b border-slate-200/80 sticky top-16 z-20 shadow-sm w-full overflow-hidden">
      <div className="max-w-6xl mx-auto w-full min-w-0 px-2 sm:px-6 lg:px-8">
        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto py-2 no-scrollbar scroll-smooth w-full min-w-0" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`min-h-[44px] inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap active:scale-95 transition-all ${
                  isActive
                    ? 'bg-orange-50 text-orange-600 shadow-sm ring-1 ring-orange-500/20'
                    : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-orange-500 stroke-[2.5]' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>

                {tab.count !== undefined && (
                  <span
                    className={
                      isActive
                        ? 'text-[11px] px-2 py-0.2 rounded-full font-bold bg-orange-100 text-orange-950 border border-orange-300/40'
                        : 'text-[11px] px-2 py-0.2 rounded-full font-bold bg-slate-100 text-slate-700'
                    }
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
