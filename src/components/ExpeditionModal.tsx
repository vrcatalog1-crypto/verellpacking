import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Expedition } from '../types';
import { db } from '../lib/supabase';

interface ExpeditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingId: string | null;
  onSaveSuccess: () => void;
}

export const ExpeditionModal: React.FC<ExpeditionModalProps> = ({
  isOpen,
  onClose,
  editingId,
  onSaveSuccess,
}) => {
  const { expeditions, setExpeditions, triggerAlert } = useApp();

  const [name, setName] = useState('');
  const [prefix, setPrefix] = useState('');
  const [methodType, setMethodType] = useState<'reguler' | 'instan'>('reguler');
  const [code, setCode] = useState('SPX-REG');

  useEffect(() => {
    if (editingId && isOpen) {
      const exp = expeditions.find((e) => e.id === editingId);
      if (exp) {
        setName(exp.name);
        setPrefix(exp.prefix);
        const typeItem = exp.types?.[0];
        if (typeItem) {
          setMethodType(typeItem.name.toLowerCase() === 'instan' ? 'instan' : 'reguler');
          setCode(typeItem.code);
        }
      }
    } else if (isOpen) {
      setName('');
      setPrefix('');
      setMethodType('reguler');
      setCode('SPX-REG');
    }
  }, [editingId, isOpen, expeditions]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim() || !prefix.trim() || !code.trim()) {
      triggerAlert('⚠️ Nama ekspedisi, prefix, dan kode metode tidak boleh kosong!', 'warning');
      return;
    }

    if (editingId) {
      const oldExp = expeditions.find((e) => e.id === editingId);
      const updatedExp: Expedition = {
        id: editingId,
        name: name.trim(),
        prefix: prefix.toUpperCase().trim(),
        types: [
          {
            id: oldExp?.types?.[0]?.id || `type_${methodType === 'reguler' ? 'reg' : 'ins'}_${Date.now()}`,
            name: methodType === 'reguler' ? 'Reguler' : 'Instan',
            code: code.trim().toUpperCase(),
          },
          ...(oldExp?.types?.slice(1) || []),
        ],
      };
      setExpeditions((prev) => prev.map((e) => (e.id === editingId ? updatedExp : e)));
      db.upsertExpedition(updatedExp);
      triggerAlert(`Ekspedisi ${updatedExp.name} berhasil diperbarui!`, 'success');
    } else {
      const newExp: Expedition = {
        id: `exp_${Date.now()}`,
        name: name.trim(),
        prefix: prefix.toUpperCase().trim(),
        types: [
          {
            id: `type_${methodType === 'reguler' ? 'reg' : 'ins'}_${Date.now()}`,
            name: methodType === 'reguler' ? 'Reguler' : 'Instan',
            code: code.trim().toUpperCase(),
          },
        ],
      };
      setExpeditions((prev) => [...prev, newExp]);
      db.upsertExpedition(newExp);
      triggerAlert(`Ekspedisi ${newExp.name} (${methodType === 'reguler' ? 'Reguler' : 'Instan'}) berhasil ditambahkan!`, 'success');
    }

    onSaveSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-sans">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <div className="bg-[#09090b] border border-zinc-800 w-full max-w-lg mx-4 z-10 overflow-hidden shadow-2xl relative text-white flex flex-col">
        <div className="px-6 py-4 bg-zinc-900 border-b border-zinc-800/60 flex items-center justify-between">
          <h3 className="text-[11px] font-black tracking-[0.25em] uppercase text-zinc-100">
            {editingId ? 'EDIT EKSPEDISI' : 'TAMBAH EKSPEDISI BARU'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-550 hover:text-white transition-colors font-bold text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs font-bold">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">
                NAMA EKSPEDISI :
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="CONTOH: SICEPAT, SHOPEE EXPRESS"
                className="w-full bg-black/50 border border-zinc-800 px-3 py-2.5 text-white uppercase placeholder:text-zinc-805 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">
                PREFIX BARCODE RESI :
              </label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="CONTOH: SPX, REG"
                className="w-full bg-black/50 border border-zinc-800 px-3 py-2.5 text-white uppercase placeholder:text-zinc-805 focus:outline-none font-mono font-bold"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <span className="text-[9px] font-bold text-zinc-400 tracking-widest uppercase border-b border-zinc-800/80 pb-1.5 block">
              -- METODE DAN LAYANAN PENGIRIMAN --
            </span>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">
                  JENIS LAYANAN :
                </label>
                <select
                  value={methodType}
                  onChange={(e) => {
                    const val = e.target.value as 'reguler' | 'instan';
                    setMethodType(val);
                    if (code === 'SPX-REG' || code === 'SPX-INS') {
                      setCode(val === 'reguler' ? 'SPX-REG' : 'SPX-INS');
                    }
                  }}
                  className="w-full bg-black/50 border border-zinc-800 px-3 py-2.5 text-zinc-300 uppercase focus:outline-none"
                >
                  <option value="reguler">REGULER</option>
                  <option value="instan">INSTAN / SAMEDAY</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">
                  KODE LAYANAN (E.G. SPX-REG) :
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="CONTOH: SPX-REG"
                  className="w-full bg-black/50 border border-zinc-800 px-3 py-2.5 text-white uppercase placeholder:text-zinc-805 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-zinc-900/40 border-t border-zinc-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-zinc-550 hover:text-white uppercase font-bold text-[10px] tracking-wider cursor-pointer"
          >
            BATAL
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 bg-zinc-300 text-black font-black uppercase text-[10px] tracking-wider hover:bg-white cursor-pointer"
          >
            SIMPAN DATA
          </button>
        </div>
      </div>
    </div>
  );
};
