import React from 'react';
import { AnimatePresence, motion } from 'motion/react';

interface WarningModalsProps {
  doubleScanWarning: any;
  setDoubleScanWarning: (val: any) => void;
  isEditingDoubleResi: boolean;
  setIsEditingDoubleResi: (val: boolean) => void;
  editedDoubleResiValue: string;
  setEditedDoubleResiValue: (val: string) => void;
  handleEditDoubleResi: (mode: 'existing' | 'current') => void;
  cancelWarning: any;
  setCancelWarning: (val: any) => void;
  twentyFourDigitWarning: any;
  setTwentyFourDigitWarning: (val: any) => void;
}

export const WarningModals: React.FC<WarningModalsProps> = ({
  doubleScanWarning,
  setDoubleScanWarning,
  isEditingDoubleResi,
  setIsEditingDoubleResi,
  editedDoubleResiValue,
  setEditedDoubleResiValue,
  handleEditDoubleResi,
  cancelWarning,
  setCancelWarning,
  twentyFourDigitWarning,
  setTwentyFourDigitWarning,
}) => {
  return (
    <>
      {/* ----------------- DOUBLE SCAN WARNING POPUP MODAL ----------------- */}
      <AnimatePresence>
        {doubleScanWarning && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => {
                setDoubleScanWarning(null);
                setIsEditingDoubleResi(false);
              }}
            />
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-[#09090b] border-2 border-rose-600 w-full max-w-md z-10 overflow-hidden shadow-2xl relative text-white"
            >
              <div className="bg-rose-955/40 border-b border-rose-900 py-4 px-6">
                <h3 className="text-xs font-black text-rose-500 uppercase tracking-[0.2em] leading-none">
                  [!] WARNING: DOUBLE SCAN BARCODE
                </h3>
                <p className="text-[9px] text-rose-400 font-sans tracking-widest uppercase mt-1">
                  Duplikasi Input Paket Terdeteksi harian
                </p>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-[10px] text-zinc-500 uppercase leading-relaxed text-center font-bold">
                  SISTEM MENDETEKSI RESI BERIKUT SUDAH PERNAH DIPROSES SEBELUMNYA DALAM DATABASE TRANSAKSI.
                </p>

                <div className="bg-black/50 border border-rose-900 px-4 py-3 shadow-inner text-center">
                  <div className="text-[9px] font-sans tracking-widest text-zinc-400 uppercase font-bold">
                    NOMOR RESI / NO. PAKET
                  </div>
                  <div className="text-lg font-mono text-rose-400 font-black select-all tracking-wider break-all leading-tight uppercase">
                    {doubleScanWarning.resi}
                  </div>
                </div>

                {!isEditingDoubleResi ? (
                  <>
                    <div className="bg-zinc-900 border border-zinc-800 p-4 space-y-2.5 font-bold">
                      <h4 className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-1.5 flex items-center justify-between font-sans">
                        <span>DETAIL PEMINDAIAN AWAL</span>
                        <span className="text-[8px] bg-rose-950/20 text-rose-400 border border-rose-900 px-1.5 py-0.5 uppercase tracking-wider font-mono font-black">
                          DUPLIKAT
                        </span>
                      </h4>

                      <div className="grid grid-cols-2 gap-y-2 gap-x-2 text-[10px] leading-relaxed uppercase">
                        <div>
                          <span className="text-zinc-500 block font-bold">STATUS TERAKHIR:</span>
                          <span className="font-extrabold text-white tracking-wide bg-black/45 px-2 py-0.5 border border-zinc-800/30 inline-block mt-0.5">
                            {doubleScanWarning.record?.status === 'PRINTED' && 'Cetak Resi'}
                            {doubleScanWarning.record?.status === 'SCANNING' && 'SEDANG PACKING'}
                            {doubleScanWarning.record?.status === 'PACKING_SELESAI' && 'PACKING SELESAI'}
                            {doubleScanWarning.record?.status === 'PICKED_UP' && 'HANDOVER KURIR'}
                          </span>
                        </div>

                        <div>
                          <span className="text-zinc-500 block font-bold">JAM SCAN:</span>
                          <span className="font-bold text-white mt-0.5 block font-mono">
                            {doubleScanWarning.record?.time}
                          </span>
                        </div>

                        <div>
                          <span className="text-zinc-500 block font-bold">TANGGAL SCAN:</span>
                          <span className="font-bold text-white mt-0.5 block font-mono">
                            {doubleScanWarning.record?.tanggal}
                          </span>
                        </div>

                        {doubleScanWarning.record?.expedition && (
                          <div>
                            <span className="text-zinc-500 block font-bold">EKSPEDISI:</span>
                            <span className="font-bold text-white block truncate mt-0.5">
                              {doubleScanWarning.record.expedition}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-1 font-sans">
                      <button
                        type="button"
                        onClick={() => {
                          setEditedDoubleResiValue(doubleScanWarning.resi);
                          setIsEditingDoubleResi(true);
                        }}
                        className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 font-black uppercase text-xs tracking-widest transition-colors cursor-pointer border border-zinc-800"
                      >
                        [ EDIT / KOREKSI NOMOR RESI ]
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDoubleScanWarning(null);
                          setIsEditingDoubleResi(false);
                        }}
                        className="w-full py-3 bg-rose-955 text-rose-455 hover:bg-rose-900/40 text-rose-300 font-bold uppercase text-xs tracking-widest transition-colors cursor-pointer border border-rose-900"
                      >
                        [ TUTUP & TERUSKAN BEKERJA ]
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="bg-zinc-900 border border-zinc-800 p-4 space-y-4">
                    <h4 className="text-[10px] font-black text-zinc-200 uppercase tracking-widest border-b border-zinc-800 pb-1.5 font-sans">
                      -- FORM KOREKSI NOMOR RESI --
                    </h4>

                    <div className="space-y-1.5 font-bold">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">
                        MASUKKAN NOMOR RESI PENGGANTI:
                      </label>
                      <input
                        type="text"
                        value={editedDoubleResiValue}
                        onChange={(e) => setEditedDoubleResiValue(e.target.value)}
                        placeholder="MASUKKAN KODE RESI BARU..."
                        className="w-full bg-black/40 border border-zinc-800 px-3.5 py-2.5 text-xs font-mono font-bold tracking-widest text-zinc-300 focus:outline-none uppercase"
                      />
                    </div>

                    <div className="bg-black/50 p-3 border border-zinc-800 space-y-1 uppercase leading-relaxed text-[9px] text-zinc-300 font-sans">
                      <span className="font-bold">PANDUAN KOREKSI:</span>
                      <p className="text-zinc-500">
                        PILIH "UBAH RESI AWAL" UNTUK REWRITE DATA AWAL DI DATABASE, ATAU PILIH "PROSES ULANG SEBAGAI RESI BARU" UNTUK LANJUTKAN SCAN DENGAN KODE BARU TERPILIH.
                      </p>
                    </div>

                    <div className="space-y-2 pt-1 font-bold">
                      <button
                        type="button"
                        onClick={() => handleEditDoubleResi('existing')}
                        className="w-full py-2.5 bg-zinc-300 hover:bg-white text-black font-black uppercase text-[10px] tracking-wider transition-colors cursor-pointer"
                      >
                        [ UBAH DATA RESI PERTAMA ]
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditDoubleResi('current')}
                        className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-black uppercase text-[10px] tracking-wider transition-colors border border-zinc-800 cursor-pointer"
                      >
                        [ PROSES SEBAGAI RESI BARU ]
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingDoubleResi(false)}
                        className="w-full py-2 text-zinc-550 hover:text-white uppercase text-[9px] tracking-wider font-bold cursor-pointer"
                      >
                        BATAL / KEMBALI
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- CANCELLED RESI WARNING POPUP MODAL ----------------- */}
      <AnimatePresence>
        {cancelWarning && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => setCancelWarning(null)}
            />
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-[#09090b] border-2 border-rose-600 w-full max-w-md z-10 overflow-hidden shadow-2xl relative text-white"
            >
              <div className="bg-rose-955/20 border-b border-rose-900 py-4 px-6 text-center">
                <h3 className="text-xs font-black text-rose-500 uppercase tracking-[0.2em] leading-none">
                  🚫 WARNING: RESI ORDER CANCEL
                </h3>
                <p className="text-[9px] text-rose-400 font-sans tracking-widest uppercase mt-1">
                  ORDERAN DIBATALKAN DI MARKETPLACE / COL H
                </p>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-[10px] text-zinc-500 uppercase leading-relaxed text-center font-bold font-sans">
                  SISTEM MENDETEKSI RESI INI TELAH TERGOLONG SEBAGAI BAGIAN DARI DATABASE PEMESANAN BATAL (CANCEL) HARIAN. JANGAN DIPACKING ATAU DISERAHKAN!
                </p>

                <div className="bg-black/50 border border-rose-900 p-4 text-center">
                  <div className="text-[9px] font-sans tracking-widest text-zinc-400 uppercase mb-1 font-bold">
                    NOMOR RESI / NO. PESANAN
                  </div>
                  <div className="text-xl font-mono text-rose-400 font-black select-all tracking-wider break-all leading-tight uppercase">
                    {cancelWarning.resi}
                  </div>
                </div>

                <div className="bg-rose-950/20 border border-rose-900 p-3 text-[10px] text-rose-300 leading-normal uppercase">
                  🎯 <strong>Catatan:</strong> {cancelWarning.message || 'Keterangan pembatalan terdaftar.'}
                </div>

                <div className="flex flex-col pt-1 font-sans font-bold">
                  <button
                    type="button"
                    onClick={() => setCancelWarning(null)}
                    className="w-full py-3 bg-[#e11d48] hover:bg-rose-500 text-white font-black uppercase text-xs tracking-widest transition-colors cursor-pointer"
                  >
                    [ ✕ TUTUP & KEMBALI ]
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ----------------- 24 DIGIT REJECTION WARNING POPUP MODAL ----------------- */}
      <AnimatePresence>
        {twentyFourDigitWarning && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => setTwentyFourDigitWarning(null)}
            />
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-[#09090b] border-2 border-amber-600 w-full max-w-md z-10 overflow-hidden shadow-2xl relative text-white"
            >
              <div className="bg-amber-950/40 border-b border-amber-900 py-4 px-6 text-center">
                <h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] leading-none">
                  ⚠️ WARNING: SCAN REJECTED
                </h3>
                <p className="text-[9px] text-amber-500 font-sans tracking-widest uppercase mt-1 font-bold">
                  BARCODE ELEMEN &gt;= 24 DIGIT DITOLAK
                </p>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-[10px] text-zinc-500 uppercase leading-relaxed text-center font-bold">
                  SISTEM OTOMATIS MENOLAK BARCODE DENGAN PANJANG 24 KARAKTER ATAU LEBIH UNTUK MENCEGAH KESALAHAN BACA LINK URL ATAU SERIAL NUMBER PRODUK. SILAKAN SCAN BARCODE RESI UTAMA!
                </p>

                <div className="bg-black/50 border border-amber-900 p-4 text-center shadow-inner">
                  <div className="text-[9px] font-sans tracking-widest text-zinc-400 uppercase mb-1 font-bold">
                    KONTEN BARCODE SCAN YANG DITOLAK
                  </div>
                  <div className="text-xs font-mono text-amber-400 font-bold select-all tracking-wider break-all leading-tight uppercase">
                    {twentyFourDigitWarning.resi}
                  </div>
                </div>

                <div className="bg-amber-950/20 border border-amber-900 p-3 text-[10px] text-amber-300 leading-normal text-center uppercase font-bold">
                  PANJANG SCAN KODE BARCODE: {twentyFourDigitWarning.resi.length} DIGIT
                </div>

                <div className="flex flex-col pt-1 font-sans font-bold">
                  <button
                    type="button"
                    onClick={() => setTwentyFourDigitWarning(null)}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-black font-black uppercase text-xs tracking-widest transition-colors cursor-pointer text-center"
                  >
                    [ ✕ PAHAM & LANJUT ]
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
