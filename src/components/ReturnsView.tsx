import React from 'react';
import { useApp } from '../context/AppContext';
import { ReturnRecord } from '../types';
import { db } from '../lib/supabase';

export const ReturnsView: React.FC = () => {
  const {
    returnBarcode,
    setReturnBarcode,
    returnCourierId,
    setReturnCourierId,
    returnCondition,
    setReturnCondition,
    returnReason,
    setReturnReason,
    returnSearchQuery,
    setReturnSearchQuery,
    couriers,
    triggerAlert,
    speakText,
    returnsList,
    setReturnsList,
  } = useApp();

  const handleCreateReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnBarcode.trim()) {
      triggerAlert('⚠️ Barcode resi retur wajib diisi!', 'warning');
      return;
    }

    const matchedCourier = couriers.find((c) => c.id === returnCourierId);
    const newReturn: ReturnRecord = {
      id: `retur_${Date.now()}`,
      resi: returnBarcode.trim().toUpperCase(),
      courierName: matchedCourier ? matchedCourier.name : 'UMUM',
      condition: returnCondition,
      reason: returnReason.trim() || 'Pembeli Menolak COD',
      timestamp: Date.now(),
      tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric' }),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
    };

    setReturnsList((prev) => [newReturn, ...prev]);
    db.upsertReturn(newReturn);

    setReturnBarcode('');
    setReturnReason('');
    triggerAlert(`[OK] Sukses input paket retur harian: ${newReturn.resi}`, 'success');
    speakText(`Retur sukses resi ${newReturn.resi.slice(-4)}`);
  };

  const handleDeleteReturn = (id: string) => {
    if (window.confirm('Hapus log paket retur ini dari database?')) {
      setReturnsList((prev) => prev.filter((r) => r.id !== id));
      db.deleteReturn(id);
      triggerAlert('Log paket retur telah dihapus.', 'info');
    }
  };

  const filteredReturnsList = returnsList.filter((item) => {
    if (!returnSearchQuery.trim()) return true;
    const q = returnSearchQuery.toLowerCase();
    return (
      item.resi.toLowerCase().includes(q) ||
      (item.reason && item.reason.toLowerCase().includes(q)) ||
      (item.courierName && item.courierName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans">
      {/* COLUMN 1: FORM INPUT */}
      <form onSubmit={handleCreateReturn} className="lg:col-span-5 bg-[#09090b]/40 border border-zinc-800/60 p-6 rounded-none space-y-4">
        <div>
          <h2 className="text-sm font-black tracking-[0.25em] uppercase text-amber-500">
            INPUT PAKET RETURAN BARU
          </h2>
          <p className="text-[10px] text-zinc-400 uppercase mt-1 leading-relaxed">
            Mencatat data keluar-masuk barang yang dikembalikan oleh ekspedisi (Retur harian).
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[9px] text-zinc-400 font-sans tracking-wider uppercase block mb-1 font-bold">
              NOMOR RESI PAKET RETUR
            </label>
            <input
              type="text"
              placeholder="CONTOH: SPX-REG-XXX"
              className="w-full bg-black border border-zinc-800 px-3 py-2 text-xs font-mono text-white uppercase focus:outline-none focus:border-amber-500 rounded-none placeholder:text-zinc-700"
              value={returnBarcode}
              onChange={(e) => setReturnBarcode(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[9px] text-zinc-400 font-sans tracking-wider uppercase block mb-1 font-bold">
              KURIR PENGEMBALI
            </label>
            <select
              value={returnCourierId}
              onChange={(e) => setReturnCourierId(e.target.value)}
              className="w-full bg-black border border-zinc-800 px-3 py-2 text-xs font-sans text-zinc-350 uppercase focus:outline-none focus:border-amber-500 rounded-none"
            >
              <option value="">-- TANPA COURIER / LAINNYA --</option>
              {couriers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[9px] text-zinc-400 font-sans tracking-wider uppercase block mb-1.5 font-bold">
              KONDISI FISIK PAKET
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['BAIK', 'RUSAK', 'TERBUKA'] as const).map((cond) => (
                <button
                  key={cond}
                  type="button"
                  onClick={() => setReturnCondition(cond)}
                  className={`py-2 text-[10px] font-bold uppercase border rounded-none transition-colors cursor-pointer ${
                    returnCondition === cond
                      ? cond === 'BAIK'
                        ? 'bg-emerald-950/20 text-emerald-400 border-emerald-800'
                        : cond === 'RUSAK'
                        ? 'bg-rose-950/20 text-rose-400 border-rose-800'
                        : 'bg-amber-950/20 text-amber-400 border-amber-800'
                      : 'bg-transparent text-zinc-500 border-zinc-850 hover:text-zinc-300'
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[9px] text-zinc-400 font-sans tracking-wider uppercase block mb-1 font-bold">
              ALASAN RETUR
            </label>
            <input
              type="text"
              placeholder="PILIH CHIPS DI BAWAH / KETIK..."
              className="w-full bg-black border border-zinc-800 px-3 py-2 text-xs font-sans text-white focus:outline-none focus:border-amber-500 rounded-none mb-2 placeholder:text-zinc-700"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
            />

            <div className="flex flex-wrap gap-1">
              {['Pembeli Menolak COD', 'Alamat Tidak Jelas', 'Rumah Kosong / Tutup', 'Gagal Kirim Ekspedisi'].map(
                (reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setReturnReason(reason)}
                    className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white px-2 py-1 text-[9px] uppercase tracking-wider rounded-none cursor-pointer border border-zinc-850"
                  >
                    + {reason}
                  </button>
                )
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-amber-600 hover:bg-amber-500 text-black font-black text-xs uppercase tracking-widest py-3 rounded-none transition-colors cursor-pointer"
          >
            [ SIMPAN PAKET RETUR ]
          </button>
        </div>
      </form>

      {/* COLUMN 2: SEARCH INQUIRY & LIST TABLE */}
      <div className="lg:col-span-7 bg-[#09090b]/40 border border-zinc-800/60 p-6 rounded-none space-y-4">
        <div>
          <h2 className="text-sm font-black tracking-[0.25em] uppercase text-white">
            RIWAYAT PAKET RETUR HARIAN
          </h2>
          <div className="relative mt-2">
            <input
              type="text"
              placeholder="CARI DATA RETUR BERDASARKAN RESI, ALASAN, KURIR..."
              value={returnSearchQuery}
              onChange={(e) => setReturnSearchQuery(e.target.value)}
              className="w-full bg-black border border-zinc-800 px-3 py-2 text-xs font-mono text-white placeholder:text-zinc-700 focus:outline-none focus:border-zinc-550 rounded-none uppercase"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-zinc-900">
            <thead>
              <tr className="bg-zinc-900/60 border-b border-zinc-800">
                <th className="p-3 text-[10px] text-zinc-500 font-sans tracking-widest uppercase">RESI RETUR</th>
                <th className="p-3 text-[10px] text-zinc-500 font-sans tracking-widest uppercase">KURIR</th>
                <th className="p-3 text-[10px] text-zinc-500 font-sans tracking-widest uppercase">ALASAN / DETAIL</th>
                <th className="p-3 text-[10px] text-zinc-500 font-sans tracking-widest uppercase text-center">FISIK</th>
                <th className="p-3 text-[10px] text-zinc-500 font-sans tracking-widest uppercase text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 font-mono text-xs">
              {filteredReturnsList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-zinc-500 font-sans uppercase">
                    -- TIDAK ADA DATA RETUR YG COCOK --
                  </td>
                </tr>
              ) : (
                filteredReturnsList.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-900/20 text-zinc-305">
                    <td className="p-3 font-bold text-white uppercase">{r.resi}</td>
                    <td className="p-3 font-sans text-amber-500 uppercase font-medium">{r.courierName || '-'}</td>
                    <td className="p-3 font-sans text-zinc-400 uppercase text-[11px]">{r.reason}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 text-[9px] font-sans font-black uppercase tracking-wider ${
                        r.condition === 'BAIK'
                          ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/40'
                          : r.condition === 'RUSAK'
                          ? 'bg-rose-950/30 text-rose-400 border border-rose-900/40'
                          : 'bg-amber-950/30 text-amber-400 border border-amber-900/40'
                      }`}>
                        {r.condition}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteReturn(r.id)}
                        className="text-zinc-500 hover:text-white px-2 py-1 uppercase text-[10px] font-sans font-bold tracking-wider cursor-pointer transition-colors"
                      >
                        [ HAPUS ]
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
