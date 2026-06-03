import React from 'react';
import { useApp } from '../context/AppContext';
import { db } from '../lib/supabase';

export const CancelView: React.FC = () => {
  const {
    cancelInputVal,
    setCancelInputVal,
    cancelledResiList,
    setCancelledResiList,
    cancelSearchQuery,
    setCancelSearchQuery,
    getShopeeOrder,
    triggerAlert,
    speakText,
  } = useApp();

  const handleRegisterCancel = () => {
    if (!cancelInputVal.trim()) {
      triggerAlert('⚠️ Harap isi beberapa nomor resi cancel!', 'warning');
      return;
    }
    const newLines = cancelInputVal
      .split('\n')
      .map((l: string) => l.trim().toUpperCase())
      .filter((l: string) => l.length > 0);

    const combined = [...new Set([...cancelledResiList, ...newLines])];
    setCancelledResiList(combined);
    newLines.forEach((resi: string) => db.insertCancelledResi(resi));
    setCancelInputVal('');
    triggerAlert(`[OK] Sukses mendaftarkan ${newLines.length} resi cancel ke database!`, 'success');
    speakText(`${newLines.length} resi batal terdaftar.`);
  };

  const handleClearCancelDb = () => {
    if (window.confirm('Hapus seluruh database resi cancel harian?')) {
      setCancelledResiList([]);
      db.clearAllCancelledResi();
      triggerAlert('Database resi cancel berhasil dikosongkan.', 'info');
    }
  };

  const handleDeleteItem = (resi: string) => {
    setCancelledResiList((prev: string[]) => prev.filter((r: string) => r !== resi));
    db.deleteCancelledResi(resi);
    triggerAlert(`Resi ${resi} dihapus dari daftar cancel.`, 'info');
  };

  const queryResult = cancelSearchQuery.trim()
    ? (() => {
        const query = cancelSearchQuery.trim().toUpperCase();
        const shopeeMap = getShopeeOrder(query);
        const noPesId = shopeeMap?.noPesanan;

        const found = cancelledResiList.some(
          (r: string) =>
            r.trim().toUpperCase() === query ||
            (noPesId && noPesId !== '-' && r.trim().toUpperCase() === noPesId.trim().toUpperCase())
        );

        return { query, found };
      })()
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans">
      {/* COLUMN 1: REGISTER CANCEL */}
      <div className="lg:col-span-5 bg-[#09090b]/40 border border-zinc-800/60 p-6 rounded-none space-y-4">
        <div>
          <h2 className="text-sm font-black tracking-[0.25em] uppercase text-rose-500">
            DAFTARKAN RESI / ORDER CANCEL
          </h2>
          <p className="text-[10px] text-zinc-400 uppercase mt-1 leading-relaxed">
            Tempel nomor resi atau nomor pesanan pembatalan (satu per baris). Sistem akan memicu alarm popup jika mendeteksi scan pada resi ini.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-[9px] text-zinc-400 font-sans tracking-wider uppercase block font-bold">
            DAFTAR BARCODE / NO. PESANAN
          </label>
          <textarea
            placeholder="CONTOH:&#10;SPXID025112529252&#10;240525A9BCD123"
            value={cancelInputVal}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCancelInputVal(e.target.value)}
            rows={8}
            className="w-full bg-black border border-zinc-800 p-4 text-xs font-mono text-white placeholder:text-zinc-700 focus:outline-none focus:border-rose-500 rounded-none leading-relaxed uppercase"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleRegisterCancel}
            className="flex-1 bg-rose-950/20 text-rose-300 border border-rose-900/50 hover:bg-rose-900/30 font-sans text-xs font-bold uppercase tracking-widest py-3 rounded-none transition-colors cursor-pointer"
          >
            [ + DAFTARKAN RESI CANCEL ]
          </button>
          <button
            type="button"
            onClick={handleClearCancelDb}
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 text-zinc-400 hover:text-white px-4 font-bold text-xs uppercase tracking-wider rounded-none cursor-pointer"
          >
            EMPTY
          </button>
        </div>
      </div>

      {/* COLUMN 2: REALTIME CHECKER & DATABASE SEARCH */}
      <div className="lg:col-span-7 bg-[#09090b]/40 border border-zinc-800/60 p-6 rounded-none space-y-6">
        {/* CHECKER BOX */}
        <div className="bg-black border border-zinc-800 p-4 space-y-3">
          <span className="text-[9px] text-zinc-400 font-mono tracking-widest uppercase block border-b border-zinc-800 pb-2">
            -- VERIFIKASI INSTAN RESI --
          </span>
          <div className="relative">
            <input
              type="text"
              placeholder="KETIK / PINDAI BARCODE CONTOH RESI UNTUK CEK STATUS..."
              value={cancelSearchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCancelSearchQuery(e.target.value)}
              className="w-full bg-black border border-zinc-800 px-4 py-2.5 text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-550 rounded-none font-mono uppercase"
            />
          </div>

          {queryResult && (
            <div className={`border p-4 rounded-none text-center space-y-2 ${
              queryResult.found 
                ? 'bg-rose-950/20 border-rose-800' 
                : 'bg-emerald-950/20 border-emerald-900'
            }`}>
              <div className="text-[10px] font-bold tracking-wider uppercase">
                {queryResult.found ? '🚫 STATUS: PESANAN BATAL [CANCELLED]' : '✅ STATUS: AMAN / TIDAK BATAL'}
              </div>
              <p className="text-[11px] text-zinc-500 max-w-md mx-auto uppercase leading-relaxed font-mono">
                {queryResult.found 
                  ? `RESI ${queryResult.query} TERDAFTAR DI DATABASE CANCEL! JANGAN DIPROSES!` 
                  : `RESI ${queryResult.query} AMAN UNTUK DIPROSES.`}
              </p>
            </div>
          )}
        </div>

        {/* ACTIVE CANCEL LIST */}
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-[10px] text-zinc-400 tracking-wider uppercase font-bold">
              DATABASE RESI BATAL AKTIF
            </span>
            <span className="text-[9px] font-mono font-bold bg-zinc-900 border border-zinc-850 text-zinc-400 px-2.5 py-0.5 rounded-none">
              {cancelledResiList.length} RESI
            </span>
          </div>

          {cancelledResiList.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 border border-zinc-850 border-dashed rounded-none text-xs">
              -- BELUM ADA NOMOR RESI CANCEL YANG DIDAFTARKAN HARI INI --
            </div>
          ) : (
            <div className="border border-zinc-900 rounded-none overflow-hidden bg-black max-h-[220px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="bg-zinc-900/60 border-b border-zinc-800 text-zinc-500 text-[9px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">NO</th>
                    <th className="py-2.5 px-3">NOMOR RESI / NO. PESANAN</th>
                    <th className="py-2.5 px-3 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {cancelledResiList.map((item, idx) => (
                    <tr key={idx} className="hover:bg-zinc-900/20 text-zinc-300">
                      <td className="py-2.5 px-3 text-zinc-500 text-[10px]">{idx + 1}</td>
                      <td className="py-2.5 px-3 text-white uppercase font-bold tracking-wide break-all">{item}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item)}
                          className="bg-transparent text-rose-500 hover:text-white px-2.5 py-1 text-[9px] font-sans font-bold uppercase tracking-wider cursor-pointer transition-colors"
                        >
                          [ HAPUS ]
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
