import React from 'react';
import { useApp } from '../context/AppContext';

export const DashboardStats: React.FC = () => {
  const { todayStats, totalCount } = useApp();

  const statItems = [
    {
      label: 'PRINTED HARI INI',
      value: todayStats.printed,
      badge: 'RESI',
      badgeClass: 'bg-[#1b2555] text-[#7185eb] border-[#5d5fef]/30',
      iconBg: 'bg-[#1b2555]/60 border-[#324083] text-[#5d5fef]',
      color: 'text-white',
      iconSvg: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      )
    },
    {
      label: 'PACKED HARI INI',
      value: todayStats.packed,
      badge: 'SELESAI',
      badgeClass: 'bg-[#102d1d] text-[#1fd383] border-[#1fd383]/20',
      iconBg: 'bg-[#102d1d]/60 border-[#1c4d32] text-[#00d084]',
      color: 'text-white',
      iconSvg: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      )
    },
    {
      label: 'PICK-UP HARI INI',
      value: todayStats.pickedUp,
      badge: 'HANDOFF',
      badgeClass: 'bg-[#2a2414] text-[#e89b25] border-[#e89b25]/20',
      iconBg: 'bg-[#2a2414]/60 border-[#4a3d21] text-[#f2a833]',
      color: 'text-white',
      iconSvg: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <path d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      )
    },
    {
      label: 'TRANSAKSI HARI INI',
      value: todayStats.totalToday,
      badge: 'HARI INI',
      badgeClass: 'bg-[#122e3e] text-[#2ebdcd] border-[#1ecdcd]/20',
      iconBg: 'bg-[#122e3e]/60 border-[#18465e] text-[#29b6f6]',
      color: 'text-white',
      iconSvg: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 7v10l8 4V11L4 7zm8 4l8-4V7l-8 4v10zm8-4l-8-4-8 4 8 4 8-4z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      ),
      subLabel: `TOTAL DB: ${totalCount} RESI`
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {statItems.map((item, idx) => (
        <div
          key={idx}
          className="bg-[#121526]/80 border border-white/5 p-4 rounded-[20px] flex items-center gap-4 shadow-xl hover:scale-[1.01] transition-transform duration-200 group"
        >
          <div className={`w-12 h-12 ${item.iconBg} rounded-[14px] flex items-center justify-center border shrink-0 transition-transform duration-200 group-hover:scale-105`}>
            {item.iconSvg}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-1 truncate">
              {item.label}
            </p>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-black ${item.color} leading-none tracking-tight`}>
                {item.value || '0'}
              </span>
              <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded border leading-none shrink-0 ${item.badgeClass}`}>
                {item.badge}
              </span>
            </div>
            {item.subLabel && (
              <p className="text-[9px] text-[#2cbdcd]/85 font-mono uppercase tracking-wide mt-1">
                {item.subLabel}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
