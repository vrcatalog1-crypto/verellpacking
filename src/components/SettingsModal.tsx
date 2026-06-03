import React from 'react';
import { useApp } from '../context/AppContext';
import { INITIAL_COURIERS, INITIAL_EXPEDITIONS } from '../data';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    playBeep,
    customDoubleScanSound,
    handleResetAudio,
    handleAudioUpload,
    useSpeechAssistant,
    setUseSpeechAssistant,
    appBackgroundOpacity,
    setAppBackgroundOpacity,
    formattedResetCountdown,
    setRecords,
    setExpeditions,
    setCouriers,
    triggerAlert,
  } = useApp();

  if (!isOpen) return null;

  const handleResetMemory = () => {
    if (window.confirm('APAKAH ANDA YAKIN INGIN MENGHAPUS SELURUH LOG, COURIER, DAN EKSPEDISI DARI LOCAL STORAGE?')) {
      localStorage.clear();
      setRecords([]);
      setExpeditions(INITIAL_EXPEDITIONS);
      setCouriers(INITIAL_COURIERS);
      triggerAlert('[INFO] Database lokal berhasil dikosongkan secara total.', 'info');
      onClose();
    }
  };

  const handleToggleSpeech = () => {
    const newVal = !useSpeechAssistant;
    setUseSpeechAssistant(newVal);
    localStorage.setItem('verell_use_speech_assistant', String(newVal));
    if (newVal) {
      try {
        const u = new SpeechSynthesisUtterance('Asisten suara premium aktif.');
        u.lang = 'id-ID';
        window.speechSynthesis.speak(u);
      } catch (e) {
        console.warn('Speech assistant initialization error:', e);
      }
    }
  };

  const handleLocalAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleAudioUpload(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center font-sans">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

      <div className="bg-[#09090b] border border-zinc-800 w-full max-w-sm mx-4 z-10 overflow-hidden shadow-2xl relative text-white">
        <div className="px-6 py-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-[11px] font-black tracking-[0.25em] uppercase text-zinc-100">
            KONFIGURASI PREFERENSI SISTEM
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors font-bold text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* AUDIO SYNTH TEST */}
          <div className="space-y-2">
            <span className="text-[9px] text-zinc-500 tracking-wider uppercase block">
              SISTEM AUDIO (TEST BEEPMEDIA)
            </span>
            <button
              type="button"
              onClick={() => playBeep('success')}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-zinc-900 hover:bg-zinc-855 border border-zinc-800 text-[10px] font-bold text-zinc-400 uppercase tracking-widest cursor-pointer transition-colors"
            >
              🔊 TEST NATIVE BEEPER
            </button>
          </div>

          {/* CUSTOM DOUBLE SCAN ALARM */}
          <div className="space-y-2 pt-3 border-t border-zinc-800">
            <span className="text-[9px] text-zinc-500 tracking-wider uppercase block">
              AUDIO ALARM DOUBLE SCAN (RE-UPLOAD)
            </span>
            <div className="bg-black border border-zinc-800 p-3 space-y-3">
              <div className="flex items-center justify-between text-[10px] uppercase font-mono">
                <span className="text-zinc-400">MODE SUARA:</span>
                <span className="font-bold text-amber-500">
                  {customDoubleScanSound ? '🎵 FILE KUSTOM AKTIF' : '🔊 BAWAAN SYNTH'}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => playBeep('double-scan')}
                  className="flex-1 py-1.5 bg-zinc-900 text-zinc-405 hover:bg-zinc-800 text-[9px] font-bold uppercase tracking-wider border border-zinc-800 cursor-pointer"
                >
                  🔊 TEST ALARM
                </button>
                {customDoubleScanSound && (
                  <button
                    type="button"
                    onClick={handleResetAudio}
                    className="px-3 py-1.5 bg-rose-950/20 text-rose-455 border border-rose-900 hover:bg-rose-900 text-[9px] font-bold uppercase cursor-pointer"
                  >
                    ✕ RESET
                  </button>
                )}
              </div>

              <div className="relative">
                <label
                  htmlFor="audio-preset-upload"
                  className="w-full text-center flex items-center justify-center gap-1 py-1.5 bg-amber-950/20 border border-amber-900 text-amber-400 text-[9px] font-bold uppercase cursor-pointer hover:bg-amber-900/20"
                >
                  [ + UNGGAH FILE AUDIO ]
                </label>
                <input
                  id="audio-preset-upload"
                  type="file"
                  accept="audio/*"
                  onChange={handleLocalAudioUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* TTS VOX ASSISTANT */}
          <div className="space-y-2 pt-3 border-t border-zinc-800">
            <span className="text-[9px] text-zinc-500 tracking-wider uppercase block">
              ASISTEN SUARA PANDU (TTS BARCODE)
            </span>
            <div className="flex items-center justify-between bg-black border border-zinc-800 p-3">
              <span className="text-[10px] text-zinc-400 uppercase font-bold">SPEECH ASSISTANT HARIAN:</span>
              <button
                type="button"
                onClick={handleToggleSpeech}
                className={`px-3 py-1 text-[9px] font-bold uppercase transition-all border cursor-pointer ${
                  useSpeechAssistant
                    ? 'bg-zinc-300 text-black border-zinc-400'
                    : 'bg-transparent text-zinc-500 border-zinc-800 hover:text-white'
                }`}
              >
                {useSpeechAssistant ? 'ON (AKTIF)' : 'OFF'}
              </button>
            </div>
          </div>

          {/* CHROMATIC OPACITY */}
          <div className="space-y-2 pt-3 border-t border-zinc-800">
            <div className="flex items-center justify-between text-[9px] text-zinc-500 tracking-wider uppercase">
              <span>OPASITAS BG APLIKASI WEB:</span>
              <span className="font-mono text-zinc-400">{Math.round(appBackgroundOpacity * 100)}%</span>
            </div>
            <div className="bg-black border border-zinc-800 p-3 space-y-2">
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={appBackgroundOpacity}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setAppBackgroundOpacity(val);
                  localStorage.setItem('verell_bg_opacity', String(val));
                }}
                className="w-full accent-zinc-400 cursor-pointer h-1 bg-zinc-900 rounded-none"
              />
              <p className="text-[8.5px] uppercase text-zinc-500 leading-relaxed">
                GESER SLIDER KE KIRI UNTUK MEMBUAT PANEL LATAR TRANSPARAN AGAR MEMUDAHKAN SCREEN LAYOUTING!
              </p>
            </div>
          </div>

          {/* RESET ALL DATA METRIC */}
          <div className="space-y-2 pt-3 border-t border-zinc-800">
            <div className="flex items-center justify-between text-[9px] text-zinc-500 tracking-wider uppercase font-bold">
              <span>RE-KONSTRUKSI MEMORI HARIAN:</span>
              <span className="text-[8px] text-rose-500 bg-rose-955 px-1 py-0.5 border border-rose-900 uppercase">
                AUTO COUNTER: {formattedResetCountdown}
              </span>
            </div>
            <button
              type="button"
              onClick={handleResetMemory}
              className="w-full py-2.5 bg-rose-950/20 text-rose-455 border border-rose-900 hover:bg-rose-900 hover:text-white transition-colors text-[10px] font-semibold uppercase tracking-widest cursor-pointer"
            >
              ⚠️ HAPUS SELURUH DATABASE LOKAL
            </button>
          </div>
        </div>

        <div className="px-6 py-4 bg-zinc-900/75 border-t border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-300 text-black text-[9px] font-black tracking-widest uppercase transition-all hover:bg-white cursor-pointer"
          >
            SELESAI
          </button>
        </div>
      </div>
    </div>
  );
};
