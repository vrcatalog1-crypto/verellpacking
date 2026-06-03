import React from 'react';
import { useApp } from '../context/AppContext';
import { Courier } from '../types';
import { db } from '../lib/supabase';

export const CourierManagerView: React.FC = () => {
  const {
    couriers,
    setCouriers,
    newCourierName,
    setNewCourierName,
    newCourierPhone,
    setNewCourierPhone,
    newCourierVehicle,
    setNewCourierVehicle,
    newCourierCode,
    setNewCourierCode,
    triggerAlert,
    showCourierModal,
    setShowCourierModal,
  } = useApp();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourierName.trim()) {
      triggerAlert('⚠️ Nama kurir tidak boleh kosong!', 'warning');
      return;
    }
    if (!newCourierCode.trim()) {
      triggerAlert('⚠️ Kode kurir tidak boleh kosong!', 'warning');
      return;
    }

    const newCw: Courier = {
      id: `courier_${Date.now()}`,
      name: newCourierName,
      phone: newCourierPhone || '-',
      vehicle: newCourierVehicle,
      code: newCourierCode.toLowerCase().trim(),
    };

    setCouriers((prev) => [...prev, newCw]);
    db.upsertCourier(newCw);

    setNewCourierName('');
    setNewCourierPhone('');
    setNewCourierCode('');
    setShowCourierModal(false);
    triggerAlert(`Kurir ${newCw.name} berhasil didaftarkan!`, 'success');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Hapus profil kurir ini?')) {
      setCouriers((prev) => prev.filter((c) => c.id !== id));
      db.deleteCourier(id);
      triggerAlert('Profil kurir berhasil dihapus.', 'info');
    }
  };

  return (
    <div className="bg-[#09090b]/40 border border-zinc-800/60 p-6 rounded-none">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-sm font-sans tracking-[0.25em] font-black uppercase text-zinc-100">
            KELOLA DRIVER / KURIR MITRA
          </h2>
          <p className="text-[10px] text-zinc-450 font-sans uppercase mt-1">
            Daftar kurir pendukung armada harian untuk pelacakan serah terima.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCourierModal(true)}
          className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-widest transition-all duration-200 rounded-none cursor-pointer"
        >
          [ TAMBAH DRIVER ]
        </button>
      </div>

      {showCourierModal && (
        <div className="mb-6 p-4 bg-[#09090b] border border-zinc-800">
          <span className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase block mb-3">
            -- PENDAFTARAN DRIVER BARU --
          </span>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-[9px] text-zinc-400 font-sans tracking-wider uppercase block mb-1 font-bold">
                NAMA LENGKAP
              </label>
              <input
                type="text"
                placeholder="CONTOH: BUDI SANTOSO"
                value={newCourierName}
                onChange={(e) => setNewCourierName(e.target.value)}
                className="w-full bg-black border border-zinc-800 px-3 py-2 text-xs font-mono text-white uppercase focus:outline-none focus:border-zinc-550 rounded-none placeholder:text-zinc-700"
              />
            </div>
            <div>
              <label className="text-[9px] text-zinc-400 font-sans tracking-wider uppercase block mb-1 font-bold">
                KODE DRIVER (COURIER CODE)
              </label>
              <input
                type="text"
                placeholder="CONTOH: SPX-BUDI"
                value={newCourierCode}
                onChange={(e) => setNewCourierCode(e.target.value)}
                className="w-full bg-black border border-zinc-800 px-3 py-2 text-xs font-mono text-white uppercase focus:outline-none focus:border-zinc-550 rounded-none placeholder:text-zinc-700"
              />
            </div>
            <div>
              <label className="text-[9px] text-zinc-400 font-sans tracking-wider uppercase block mb-1 font-bold">
                NOMOR TELEPON (WA)
              </label>
              <input
                type="text"
                placeholder="CONTOH: 0812XXXXXXXX"
                value={newCourierPhone}
                onChange={(e) => setNewCourierPhone(e.target.value)}
                className="w-full bg-black border border-zinc-800 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-zinc-550 rounded-none placeholder:text-zinc-700"
              />
            </div>
            <div>
              <label className="text-[9px] text-zinc-400 font-sans tracking-wider uppercase block mb-1 font-bold">
                ARMADA / KENDARAAN
              </label>
              <select
                value={newCourierVehicle}
                onChange={(e) => setNewCourierVehicle(e.target.value)}
                className="w-full bg-black border border-zinc-800 px-3 py-2 text-xs font-sans text-zinc-300 uppercase focus:outline-none focus:border-zinc-550 rounded-none"
              >
                <option value="Motor">MOTOR / RODA DUA</option>
                <option value="Mobil">MOBIL / VAN RODA EMPAT</option>
                <option value="Truk">BOX TRUK BESAR</option>
              </select>
            </div>
            <div className="md:col-span-4 flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => setShowCourierModal(false)}
                className="bg-transparent text-zinc-500 hover:text-white px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-none cursor-pointer"
              >
                BATAL
              </button>
              <button
                type="submit"
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-none cursor-pointer"
              >
                SIMPAN PROFIL
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse border border-zinc-900">
          <thead>
            <tr className="bg-zinc-900/60 border-b border-zinc-800">
              <th className="p-3 text-[10px] text-zinc-500 font-sans tracking-widest uppercase">ID DRIVER</th>
              <th className="p-3 text-[10px] text-zinc-500 font-sans tracking-widest uppercase">NAMA DRIVER</th>
              <th className="p-3 text-[10px] text-zinc-500 font-sans tracking-widest uppercase">KODE UNIK</th>
              <th className="p-3 text-[10px] text-zinc-500 font-sans tracking-widest uppercase">NOMOR TELEPON</th>
              <th className="p-3 text-[10px] text-zinc-500 font-sans tracking-widest uppercase">ARMADA</th>
              <th className="p-3 text-[10px] text-zinc-500 font-sans tracking-widest uppercase text-right">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900 font-mono text-xs">
            {couriers.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-zinc-650 font-sans uppercase">
                  -- BELUM ADA DRIVER TERDAFTAR --
                </td>
              </tr>
            ) : (
              couriers.map((c) => (
                <tr key={c.id} className="hover:bg-zinc-900/20 text-zinc-300">
                  <td className="p-3 text-zinc-500">{c.id}</td>
                  <td className="p-3 font-sans font-bold text-white uppercase">{c.name}</td>
                  <td className="p-3 text-amber-400 font-semibold">{c.code}</td>
                  <td className="p-3">{c.phone}</td>
                  <td className="p-3 font-sans text-[11px] uppercase text-zinc-400">{c.vehicle}</td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      className="text-rose-500 hover:text-white hover:bg-rose-950/20 px-2 py-1 uppercase text-[10px] font-sans font-bold tracking-wider cursor-pointer"
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
  );
};
