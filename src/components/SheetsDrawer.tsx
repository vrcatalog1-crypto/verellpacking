import React from 'react';
import { useApp } from '../context/AppContext';
import { GOOGLE_APPS_SCRIPT_TEMPLATE } from '../data';

interface SheetsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SheetsDrawer: React.FC<SheetsDrawerProps> = ({ isOpen, onClose }) => {
  const { triggerAlert } = useApp();

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    triggerAlert('[OK] Kode Apps Script template berhasil disalin ke clipboard!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sans">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <div className="bg-[#09090b] border-l border-zinc-800 w-full max-w-xl h-full z-10 flex flex-col shadow-2xl relative p-6 overflow-y-auto text-white">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <h3 className="font-black text-zinc-100 text-xs tracking-[0.25em] uppercase">
            INTEGRASI DATABASE GOOGLE SPREADSHEET
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors font-bold p-1 text-xs cursor-pointer"
          >
            ✕ CLOSE
          </button>
        </div>

        <div className="space-y-4 text-xs leading-relaxed text-zinc-400">
          <p className="uppercase text-[10px] tracking-wide text-zinc-500/75">
            Aplikasi menghubungkan log pemindaian ke Google Spreadsheet Anda secara serverless lewat Web App API Google Apps Script.
          </p>

          <div className="bg-zinc-900 border border-zinc-800 p-4 space-y-2.5">
            <h4 className="font-black text-[9px] tracking-widest uppercase text-amber-500">
              -- PANDUAN DEPLOYMENT APPS SCRIPT --
            </h4>
            <ol className="list-decimal pl-4 space-y-1.5 font-sans text-xs uppercase text-zinc-300">
              <li>BUAT DOKUMEN SPREADSHEET GOOGLE BARU.</li>
              <li>KLIK MENU EXTENSIONS &gt; APPS SCRIPT DI SPREADSHEET.</li>
              <li>HAPUS SEMUA KODE BAWAAN, LALU PASTE-KAN TEMPLATE DI BAWAH INI.</li>
              <li>KLIK TOMBOL DEPLOY &gt; NEW DEPLOYMENT.</li>
              <li>PILIH CONFIG TYPE: WEB APP.</li>
              <li>ATUR EXECUTE AS: "ME", DAN ACCESS: "ANYONE".</li>
              <li>KLIK DEPLOY, SALIN WEB APP URL, DAN PASTE KE INPUT WEBHOOK DI BARIS LINK ATAS.</li>
            </ol>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between pb-1.5">
              <span className="text-[9px] font-bold text-zinc-550 tracking-wider uppercase">
                GOOGLE APPS SCRIPT TEMPLATE CODE
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="text-[10px] font-black text-zinc-300 hover:text-white uppercase tracking-wider cursor-pointer"
              >
                [ SALIN KODE ]
              </button>
            </div>
            <textarea
              value={GOOGLE_APPS_SCRIPT_TEMPLATE}
              readOnly
              className="w-full h-80 bg-black/60 text-zinc-300 font-mono text-[10px] p-4 border border-zinc-800 focus:outline-none leading-relaxed"
            />
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 p-4 text-xs font-mono uppercase text-zinc-400 space-y-1">
            <h4 className="font-bold text-zinc-200">FAQS: METODE TRANSISI REALTIME SINKRON</h4>
            <p className="leading-relaxed text-[11px] text-zinc-500">
              Sistem packing ini beroperasi secara offline-first. Jika server internet atau browser terblokir sandbox, log akan diantrekan secara otomatis dan disinkronisasikan kembali segera setelah koneksi pulih!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
