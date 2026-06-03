import React from 'react';
import { useApp } from '../context/AppContext';

export const TabManager: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const tabs = [
    { id: 'PRINT', label: '1. PRINT RESI' },
    { id: 'PACKING', label: '2. PACKING VIDEO' },
    { id: 'PICKUP', label: '3. PICK UP DRIVER' },
    { id: 'COURIERS', label: '4. KELOLA DRIVER' },
    { id: 'CANCEL_SEARCH', label: '5. ORDER BATAL / CANCEL' },
    { id: 'RETURNS', label: '6. KELOLA RETUR' },
  ] as const;

  return (
    <div className="flex flex-col md:flex-row gap-1 border-b border-zinc-800 mb-6 pb-1">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 text-center py-3 px-3 font-sans text-xs font-bold uppercase tracking-widest transition-all duration-200 border-b-2 rounded-none ${
              isActive
                ? 'bg-zinc-900/45 border-zinc-200 text-white font-black'
                : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/10'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
