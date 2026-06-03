import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SUPABASE_SETUP_SQL } from '../lib/supabase';

interface SupabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSyncModal: React.FC<SupabaseSyncModalProps> = ({ isOpen, onClose }) => {
  const { dbSyncState } = useApp();
  const [copiedSql, setCopiedSql] = useState(false);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-sans">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <div className="bg-[#09090b] border border-zinc-800 w-full max-w-lg mx-4 z-10 overflow-hidden shadow-2xl relative text-white flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-[11px] font-black tracking-[0.25em] uppercase text-zinc-100">
            PANDUAN KONEKSI MULTI-DEVICE CLOUD
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors font-bold text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-zinc-400">
          <div className="bg-zinc-900 border border-zinc-800/40 p-4 border-l-4 border-l-emerald-500">
            <h4 className="font-black text-[9px] tracking-widest text-emerald-400 uppercase mb-1">
              -- METODE SINKRONISASI SUPABASE REALTIME --
            </h4>
            <p className="uppercase text-[10px] text-zinc-550 leading-relaxed">
              Ketika Anda memindai resi dari workstation A, log data status akan terkirim, terekam, dan dimutakhirkan ke workstation B secara instan lewat websocket Supabase secara real-time!
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-[9px] text-zinc-500 tracking-wider uppercase font-bold">
              1. STATUS KONEKSI AKTIF DATABASE
            </span>
            <div className="bg-black border border-zinc-800 p-3.5 flex items-center justify-between font-mono">
              <span className="text-zinc-500 uppercase">DATABASE HUB STATUS:</span>
              <span className={`px-2.5 py-0.5 text-[9px] font-sans font-black uppercase tracking-wider ${
                dbSyncState === 'connected'
                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40'
                  : dbSyncState === 'connecting'
                  ? 'bg-amber-955/40 text-amber-400 border border-amber-900/40'
                  : 'bg-rose-955 text-rose-455 bg-rose-950/40 text-rose-400 border border-rose-900/40'
              }`}>
                {dbSyncState === 'connected'
                  ? 'ONLINE (CONNECTED)'
                  : dbSyncState === 'connecting'
                  ? 'CONNECTING...'
                  : 'OFFLINE / LOCAL STORAGE'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[9px] text-zinc-500 tracking-wider uppercase font-bold">
              2. PENGATURAN VARIABLE ENVIRONMENT SECRETS
            </span>
            <p className="uppercase text-[10px] text-zinc-550 leading-normal">
              Pastikan Anda telah mengisi kredensial database berikut di modul sekuritas / menu setting workspace AI Studio Anda:
            </p>
            <div className="bg-black border border-zinc-800 p-3.5 font-mono text-[10px] space-y-1.5 uppercase leading-relaxed text-zinc-300">
              <div>
                <span className="text-zinc-450">VITE_SUPABASE_URL</span> = "HTTPS://YOUR-SUPABASE-ID.SUPABASE.CO"
              </div>
              <div>
                <span className="text-zinc-450">VITE_SUPABASE_ANON_KEY</span> = "EYJHBGCIOI..."
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
              <span className="text-[9px] text-zinc-500 tracking-wider uppercase font-bold">
                3. INISIALISASI DATABASE STRUCTURE
              </span>
              <button
                type="button"
                onClick={handleCopySql}
                className="text-[10px] font-black text-zinc-300 hover:text-white uppercase tracking-wider cursor-pointer"
              >
                {copiedSql ? '[ COPIED SUCCESS! ]' : '[ SALIN SQL SCRIPT ]'}
              </button>
            </div>
            <p className="uppercase text-[10px] text-zinc-550 leading-relaxed">
              Silakan salin instruksi schema SQL di bawah ini, buka panel <strong className="text-white">SQL EDITOR</strong> di dashboard Supabase milik Anda, lalu klik <strong className="text-white">RUN</strong> untuk menyinkronkan tabel:
            </p>
            <pre className="bg-black/60 p-4 border border-zinc-800 text-[10px] font-mono text-zinc-300 overflow-x-auto max-h-40 leading-relaxed uppercase">
              {SUPABASE_SETUP_SQL}
            </pre>
          </div>
        </div>

        <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-zinc-300 text-black font-black text-[10px] uppercase tracking-wider transition-all hover:bg-white cursor-pointer rounded-none"
          >
            TUTUP PANDUAN
          </button>
        </div>
      </div>
    </div>
  );
};
