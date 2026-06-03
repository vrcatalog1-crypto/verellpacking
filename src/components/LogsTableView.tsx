import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../lib/supabase';

export const LogsTableView: React.FC = () => {
  const {
    records,
    setRecords,
    activeRecordings,
    setActiveRecordings,
    triggerAlert,
    displayLogs,
    logDisplayMode,
    setLogDisplayMode,
    handleCSVDownload,
    handleCopyClipboard,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');

  const handleDeleteResi = (resi: string) => {
    const cleanResi = resi.trim().toUpperCase();
    if (!cleanResi) return;

    if (window.confirm(`Hapus seluruh log pemindaian harian untuk resi: ${cleanResi}?`)) {
      setRecords((prev) => prev.filter((r) => r.resi.trim().toUpperCase() !== cleanResi));
      db.deleteRecordByResi(cleanResi);

      // Clear active recording state if any
      setActiveRecordings((prev) => {
        if (prev[cleanResi]) {
          const copy = { ...prev };
          delete copy[cleanResi];
          return copy;
        }
        return prev;
      });

      triggerAlert(`[INFO] Log resi ${cleanResi} berhasil dihapus.`, 'info');
    }
  };

  // Filter displayLogs with local search query
  const filteredLogs = displayLogs.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.resi.toLowerCase().includes(q) ||
      item.status.toLowerCase().includes(q) ||
      (item.tanggal && item.tanggal.includes(q))
    );
  });

  const onCopyLogsToClipboard = () => {
    let text = '';
    if (logDisplayMode === 'flat') {
      text = 'DAFTAR LOG SCAN HARIAN (FLAT)\n';
      filteredLogs.forEach((l) => {
        text += `${l.tanggal} ${l.time} - ${l.resi} [${l.status}]\n`;
      });
    } else {
      text = 'DAFTAR LOG PIVOT RESI HARIAN\n';
      text += 'RESI | CETAK | PACKING | PICKUP | STATUS LATEST\n';
      filteredLogs.forEach((l) => {
        text += `${l.resi} | ${l.printTime} | ${l.packTime} | ${l.pickupTime} | ${l.status}\n`;
      });
    }

    handleCopyClipboard(text, '[OK] Seluruh log disalin ke clipboard!');
  };

  const getStatusBadge = (statusLabel: string, isRecording: boolean) => {
    if (isRecording) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-950/40 text-amber-400 border border-amber-500/20 text-[9px] font-bold uppercase rounded-full tracking-wider animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          RECORDING
        </span>
      );
    }

    switch (statusLabel) {
      case 'SCANNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-sky-950/40 text-sky-400 border border-sky-500/20 text-[9px] font-bold uppercase rounded-full tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            SCANNING
          </span>
        );
      case 'PRINTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1d2650]/50 text-[#7185eb] border border-[#5d5fef]/20 text-[9px] font-bold uppercase rounded-full tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5d5fef]"></span>
            PRINTED
          </span>
        );
      case 'PACKING_SELESAI':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#102d1d]/50 text-[#1fd383] border border-emerald-500/20 text-[9px] font-bold uppercase rounded-full tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            COMPLETED
          </span>
        );
      case 'PICKED_UP':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-950/50 text-purple-400 border border-purple-500/20 text-[9px] font-bold uppercase rounded-full tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            PICKED UP
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-900 text-zinc-400 border border-zinc-800 text-[9px] font-bold uppercase rounded-full tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
            {statusLabel}
          </span>
        );
    }
  };

  return (
    <div className="bg-[#121526]/80 border border-white/5 p-5 rounded-[24px] flex flex-col h-full overflow-hidden shadow-2xl relative">
      
      {/* 1. Header Area with Clock Icon & Actions */}
      <div className="flex items-center gap-2.5 mb-4">
        <svg className="h-5 w-5 text-[#5d5fef]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
        <h2 className="text-xs font-black tracking-[0.2em] font-mono text-zinc-350 uppercase">
          LOG DATA SISTEM
        </h2>
      </div>

      {/* Action Buttons Row - CSV & Copy Compact */}
      <div className="flex items-center justify-end mb-4 shrink-0">
        {/* CSV & Copy Action Triggers - Compact */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleCSVDownload(logDisplayMode)}
            className="bg-[#16182c] border border-white/10 px-2 py-1.5 font-sans text-[9px] font-bold uppercase text-zinc-300 hover:text-white rounded-lg flex items-center justify-center gap-0.5 cursor-pointer hover:bg-zinc-800/45 transition-colors"
            title="Download CSV"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            CSV
          </button>
          <button
            type="button"
            onClick={onCopyLogsToClipboard}
            className="bg-[#16182c] border border-white/10 px-2 py-1.5 font-sans text-[9px] font-bold uppercase text-zinc-300 hover:text-white rounded-lg flex items-center justify-center gap-0.5 cursor-pointer hover:bg-zinc-800/45 transition-colors"
            title="Copy to clipboard"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 00-2 2h2a2 2 0 002-2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            COPY
          </button>
        </div>
      </div>

      {/* 3. Search Bar with magnifying glass indicator */}
      <div className="relative mb-4 shrink-0">
        <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari kode resi, status..."
          className="w-full bg-[#0b0c16] border border-white/10 pl-9 pr-4 py-2.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-[#5d5fef]/40 rounded-xl"
        />
      </div>

      {/* 4. Column Labels Header Grid */}
      <div className="grid grid-cols-12 border-b border-white/5 pb-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-sans bg-transparent px-4 shrink-0">
        <div className="col-span-3">TANGGAL</div>
        <div className="col-span-3">WAKTU</div>
        <div className="col-span-6 text-right">RESI & STATUS</div>
      </div>

      {/* 5. Scrollable Database Data Rows Column */}
      <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-white/[0.03] space-y-0.5 rounded-b-2xl">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-zinc-600 font-sans uppercase text-[10px] tracking-wider font-bold">
            -- BELUM ADA AKTIVITAS TRANSAKSI PEMINDAIAN --
          </div>
        ) : (
          filteredLogs.map((item, idx) => {
            const isRecording = activeRecordings[item.resi];
            const statusLabel = isRecording ? 'SCANNING' : item.status;

            return (
              <div
                key={idx}
                className="grid grid-cols-12 items-center py-4 px-4 hover:bg-[#242745]/10 text-xs transition-colors rounded-xl border border-transparent hover:border-white/5"
              >
                {/* Stack Date & Time beautifully on left side */}
                <span className="col-span-3 text-zinc-500 font-mono text-[11px] leading-relaxed">
                  {item.tanggal}
                </span>
                <span className="col-span-3 text-zinc-450 font-medium font-mono text-[11.5px] leading-relaxed">
                  {item.time || item.printTime || item.packTime || item.pickupTime || '-'}
                </span>

                {/* Resi ID & status pill on right side */}
                <div className="col-span-6 flex flex-col items-end gap-1.5 pl-2">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="font-mono font-bold text-white tracking-widest select-all text-[11.5px] uppercase">
                      {item.resi}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteResi(item.resi)}
                      className="text-zinc-600 hover:text-rose-400 hover:bg-rose-950/20 p-1 rounded-md transition-colors cursor-pointer"
                      title="Hapus log"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </button>
                  </div>

                  <div>
                    {getStatusBadge(statusLabel, !!isRecording)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
