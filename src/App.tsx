import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { AppProvider, useApp } from './context/AppContext';
import { 
  Printer, 
  Package, 
  ScanLine, 
  Truck, 
  Ban, 
  CornerUpLeft, 
  Settings, 
  RefreshCw, 
  Trash2 
} from 'lucide-react';

// Presentational presentational presentational modules
import { DashboardStats } from './components/DashboardStats';
import { ScanWorkstation } from './components/ScanWorkstation';
import { CourierManagerView } from './components/CourierManagerView';
import { CancelView } from './components/CancelView';
import { ReturnsView } from './components/ReturnsView';
import { LogsTableView } from './components/LogsTableView';
import { SettingsModal } from './components/SettingsModal';
import { SheetsDrawer } from './components/SheetsDrawer';
import { SupabaseSyncModal } from './components/SupabaseSyncModal';
import { WarningModals } from './components/WarningModals';
import { ExpeditionModal } from './components/ExpeditionModal';

function PackingSystemInner() {
  const {
    activeTab,
    setActiveTab,
    isCameraActive,
    cameraMode,
    streamRef,
    videoRef,
    canvasRef,
    activeRecordings,
    latestScanResult,
    cancelWarning,
    setCancelWarning,
    doubleScanWarning,
    setDoubleScanWarning,
    twentyFourDigitWarning,
    setTwentyFourDigitWarning,
    appBackgroundOpacity,
    isPipActive,
    setIsPipActive,
    nativePipWindow,
    setNativePipWindow,
    pipBarcodeValue,
    setPipBarcodeValue,
    isPipFocused,
    setIsPipFocused,
    offlinePendingCount,
    alert,
    processBarcodeScan,
    speakText,
    triggerAlert,
    expeditions,
    setExpeditions,
    setRecords,
    setReturnsList,
    setCancelledResiList,
    setCustomShopeeMappings,
    setBarcodeValue,
  } = useApp();

  // Midnight Auto Reset Countdown (24-hour limit tick clock)
  const [resetCountdown, setResetCountdown] = useState('23:59:59');
  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diffMs = midnight.getTime() - now.getTime();
      if (diffMs <= 0) return;
      const hours = Math.floor(diffMs / (3600 * 1000));
      const mins = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));
      const secs = Math.floor((diffMs % (60 * 1000)) / 1000);
      setResetCountdown(
        `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, []);

  // Manual Reset of Daily Memory helper
  const handleManualReset = () => {
    if (window.confirm('Bermaksud me-reset seluruh logs database transaksi dan statistik harian di session browser lokal?')) {
      const todayStr = new Date().toLocaleDateString('id-ID');
      setRecords([]);
      setReturnsList([]);
      setCancelledResiList([]);
      setCustomShopeeMappings({});
      localStorage.setItem('verell_records', JSON.stringify([]));
      localStorage.setItem('verell_returns_list', JSON.stringify([]));
      localStorage.setItem('verell_cancelled_resi', JSON.stringify([]));
      localStorage.setItem('verell_custom_shopee_mappings', JSON.stringify({}));
      localStorage.setItem('verell_last_reset_date', todayStr);
      triggerAlert('Sistem harian di-reset manual.', 'success');
      speakText('Sistem harian berhasil di-reset manual.');
    }
  };

  const activeKeys = Object.keys(activeRecordings);

  // Modal dialog togglers
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAppsScriptDrawer, setShowAppsScriptDrawer] = useState(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [showExpeditionModal, setShowExpeditionModal] = useState(false);
  const [editingExpeditionId, setEditingExpeditionId] = useState<string | null>(null);

  // States local to PiP
  const pipInputRef = useRef<HTMLInputElement | null>(null);
  const nativePipWindowRef = useRef<Window | null>(null);
  const [isEditingDoubleResi, setIsEditingDoubleResi] = useState(false);
  const [editedDoubleResiValue, setEditedDoubleResiValue] = useState('');

  // Handle Doublescan corrections
  const handleEditDoubleResi = useCallback((mode: 'existing' | 'current') => {
    if (!doubleScanWarning) return;
    const cleanNewResi = editedDoubleResiValue.trim().toUpperCase();

    if (!cleanNewResi) {
      triggerAlert('⚠️ Nomor resi pengganti tidak boleh kosong!', 'warning');
      return;
    }

    if (mode === 'existing') {
      triggerAlert(`[OK] Data resi awal diperbarui ke ${cleanNewResi}`, 'success');
    } else {
      processBarcodeScan(cleanNewResi);
    }

    setDoubleScanWarning(null);
    setIsEditingDoubleResi(false);
  }, [doubleScanWarning, editedDoubleResiValue, processBarcodeScan, triggerAlert]);

  // Synchronize webcam stream with the hidden video element
  useEffect(() => {
    if (isCameraActive && cameraMode === 'real' && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(err => {
          console.warn('Failsafe stream play postponed:', err);
        });
      }
    }
  }, [isCameraActive, cameraMode, streamRef, videoRef]);

  // Handle hotplugging changes of camera sources
  useEffect(() => {
    const handleDeviceChange = async () => {
      if (isCameraActive && navigator.mediaDevices?.enumerateDevices) {
        try {
          await navigator.mediaDevices.enumerateDevices();
        } catch (e) {
          console.warn('Gagal mendeteksi perangkat ganti:', e);
        }
      }
    };

    if (typeof window !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    }
    return () => {
      if (typeof window !== 'undefined' && navigator.mediaDevices) {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      }
    };
  }, [isCameraActive]);

  // Canvas Conveyer Drawing Loop effect
  useEffect(() => {
    if (!isCameraActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;

    const render = () => {
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth || 640;
        canvas.height = canvas.clientHeight || 360;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let drewRealCamera = false;
      if (cameraMode === 'real' && videoRef.current && videoRef.current.readyState >= 2) {
        try {
          if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            drewRealCamera = true;
          }
        } catch (e) {
          console.warn('Gagal menggambar frame kamera asli ke kanvas:', e);
        }
      }

      if (!drewRealCamera) {
        ctx.fillStyle = '#18181b'; // zinc-900 slate
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        const gridSpace = 30;
        for (let x = 0; x < canvas.width; x += gridSpace) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += gridSpace) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }

        ctx.textAlign = 'center';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText('MENYIAPKAN STREAM KAMERA UTAMA...', canvas.width / 2, canvas.height / 2 - 15);
        ctx.font = '9px monospace';
        ctx.fillStyle = '#71717a';
        ctx.fillText('PASTIKAN IZIN CAMERA BROWSER AKTIF & DIAKSES MELALUI TAB BARU', canvas.width / 2, canvas.height / 2 + 10);
        ctx.textAlign = 'left';
      }

      // Live Watermark overlays on Canvas
      const clock = new Date();
      const formatTime = clock.toLocaleDateString('id-ID', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      }) + ' ' + clock.toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      });

      const activeKeys = Object.keys(activeRecordings);
      const activeResi = activeKeys.length > 0 ? activeKeys[0] : (latestScanResult ? latestScanResult.resi : '-');

      // Drawer Telemetry Box
      const pX = 15;
      const pY = 15;
      ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
      ctx.fillRect(pX, pY, 280, 56);
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 1;
      ctx.strokeRect(pX, pY, 280, 56);

      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = activeKeys.length > 0 ? '#f43f5e' : '#10b981';
      ctx.fillText(activeKeys.length > 0 ? '● VIDEO RECORDING IN-PROGRESS' : '● WEBCAM STANDBY ACTIVE', pX + 12, pY + 16);

      ctx.font = '9px monospace';
      ctx.fillStyle = '#fafafa';
      ctx.fillText(`JAM  : ${formatTime}`, pX + 12, pY + 32);
      ctx.fillText(`RESI : ${activeResi.toUpperCase()}`, pX + 12, pY + 46);

      // Flash Rejections on Canvas for picture in picture feedbacks
      if (cancelWarning) {
        ctx.fillStyle = 'rgba(244, 63, 94, 0.55)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#09090b';
        ctx.fillRect((canvas.width - 320) / 2, (canvas.height - 120) / 2, 320, 120);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.strokeRect((canvas.width - 320) / 2, (canvas.height - 120) / 2, 320, 120);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('🚫 ORDERAN BATAL (CANCEL) 🚫', canvas.width / 2, canvas.height / 2 - 30);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.fillText(`RESI: ${cancelWarning.resi}`, canvas.width / 2, canvas.height / 2 - 10);
        ctx.fillStyle = '#a1a1aa';
        ctx.font = '9px sans-serif';
        ctx.fillText(cancelWarning.message || 'JANGAN DIPACKING!', canvas.width / 2, canvas.height / 2 + 15);
        ctx.textAlign = 'left';
      }

      // Copy to Pip
      try {
        const activeDoc = nativePipWindowRef.current ? nativePipWindowRef.current.document : document;
        const pipCanvas = activeDoc.getElementById('pip-canvas') as HTMLCanvasElement;
        if (pipCanvas) {
          const pipCtx = pipCanvas.getContext('2d');
          if (pipCtx) {
            const targetW = pipCanvas.clientWidth || 320;
            const targetH = pipCanvas.clientHeight || 180;
            if (pipCanvas.width !== targetW || pipCanvas.height !== targetH) {
              pipCanvas.width = targetW;
              pipCanvas.height = targetH;
            }
            pipCtx.drawImage(canvas, 0, 0, pipCanvas.width, pipCanvas.height);
          }
        }
      } catch (err) {
        // quiet error
      }

      frameId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [isCameraActive, cameraMode, activeRecordings, latestScanResult, cancelWarning, canvasRef, videoRef]);

  return (
    <div
      id="verell-root-view"
      className="font-sans antialiased text-white flex h-screen overflow-hidden relative transition-colors duration-300"
      style={{ backgroundColor: 'rgb(12, 14, 20)' }}
    >
      {/* Hidden camera streams */}
      <video ref={videoRef} className="hidden" style={{ display: 'none' }} playsInline muted />

      {/* Decorative Glow Elements */}
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-150px] right-[-50px] w-[600px] h-[600px] bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute top-[200px] right-[100px] w-[300px] h-[300px] bg-fuchsia-600/15 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="flex-1 flex overflow-hidden p-6 gap-6 relative z-10 w-full h-full">
        {/* ----------------- SIDEBAR HEADER / BRAND LOGO / PREFERENSI ----------------- */}
        <aside className="w-18 md:w-20 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl flex flex-col flex-shrink-0 items-center justify-between py-4 z-20 shadow-2xl transition-all duration-300">
          {/* Brand & Logo */}
          <div className="flex flex-col items-center gap-1 cursor-pointer">
            <div className="w-9 h-9 bg-white/10 rounded-lg p-1 flex items-center justify-center border border-white/10 shadow-md transition-transform hover:scale-105">
              <img
                alt="VERELL LOGO"
                className="w-full h-full object-cover rounded-md"
                referrerPolicy="no-referrer"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6H3-D_LygwjZMbG5Hz7qZrgJdbpByDr2u3Gwr52ngXXehXr0mtTOXYEkK_beDUjHucVCt9L5dLv6wismXbRxypXl9TACgdr7rNu_oNStnwqsJdOaJVOhM1zxzZZ47zYQBD88gyTz5zGLrBIjzh5KDp-h1b0DjTybvG9VELDOEO0J-u_ESAPlTQ1ryUXJSuMELT4y-hNwK5QUKEqxmQ-GV1PNH5v0s40M-41T7TIZzpFwkpcmxILkxgSBbD6lRmlBSVxDQKaiRtbs"
              />
            </div>
            <span className="text-[9px] font-extrabold text-white tracking-widest font-mono">VERELL</span>
          </div>

          {/* Navigation Links inside Sidebar */}
          <nav className="flex flex-col gap-3.5 w-full px-1.5 my-4 flex-1 justify-center">
            <button
              id="tab-btn-print"
              type="button"
              onClick={() => setActiveTab('PRINT')}
              className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all cursor-pointer text-center relative group w-full ${
                activeTab === 'PRINT'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Printer size={18} className="mb-0.5" />
              <span className="text-[9px] font-semibold tracking-wider uppercase font-sans block truncate w-full">Print</span>
              {activeTab === 'PRINT' && (
                <span className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-indigo-400 rounded-r"></span>
              )}
            </button>

            <button
              id="tab-btn-packing"
              type="button"
              onClick={() => setActiveTab('PACKING')}
              className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all cursor-pointer text-center relative group w-full ${
                activeTab === 'PACKING'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Package size={18} className="mb-0.5" />
              <span className="text-[9px] font-semibold tracking-wider uppercase font-sans block truncate w-full">Packing</span>
              {activeTab === 'PACKING' && (
                <span className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-indigo-400 rounded-r"></span>
              )}
            </button>

            <button
              id="tab-btn-pickup"
              type="button"
              onClick={() => setActiveTab('PICKUP')}
              className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all cursor-pointer text-center relative group w-full ${
                activeTab === 'PICKUP'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <ScanLine size={18} className="mb-0.5" />
              <span className="text-[9px] font-semibold tracking-wider uppercase font-sans block truncate w-full">Pick up</span>
              {activeTab === 'PICKUP' && (
                <span className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-indigo-400 rounded-r"></span>
              )}
            </button>

            <button
              id="tab-btn-couriers"
              type="button"
              onClick={() => setActiveTab('COURIERS')}
              className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all cursor-pointer text-center relative group w-full ${
                activeTab === 'COURIERS'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Truck size={18} className="mb-0.5" />
              <span className="text-[9px] font-semibold tracking-wider uppercase font-sans block truncate w-full">Ekspedisi</span>
              {activeTab === 'COURIERS' && (
                <span className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-indigo-400 rounded-r"></span>
              )}
            </button>

            <button
              id="tab-btn-cancel-search"
              type="button"
              onClick={() => setActiveTab('CANCEL_SEARCH')}
              className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all cursor-pointer text-center relative group w-full ${
                activeTab === 'CANCEL_SEARCH'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Ban size={18} className="mb-0.5" />
              <span className="text-[9px] font-semibold tracking-wider uppercase font-sans block truncate w-full">Cancel</span>
              {activeTab === 'CANCEL_SEARCH' && (
                <span className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-indigo-400 rounded-r"></span>
              )}
            </button>

            <button
              id="tab-btn-returns"
              type="button"
              onClick={() => setActiveTab('RETURNS')}
              className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all cursor-pointer text-center relative group w-full ${
                activeTab === 'RETURNS'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <CornerUpLeft size={18} className="mb-0.5" />
              <span className="text-[9px] font-semibold tracking-wider uppercase font-sans block truncate w-full">Retur</span>
              {activeTab === 'RETURNS' && (
                <span className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-indigo-400 rounded-r"></span>
              )}
            </button>
          </nav>

          {/* Action configurations triggers in bottom */}
          <div className="flex flex-col gap-3 items-center">
            <button
              id="btn-trigger-settings-popover"
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-slate-300 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all cursor-pointer shadow-sm"
              title="System Settings"
            >
              <Settings size={15} />
            </button>
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white border border-white/10 shadow-sm hover:bg-white/15 cursor-pointer">
              <span className="text-[10px] font-bold font-sans">V1</span>
            </div>
          </div>
        </aside>

        {/* ----------------- WORKSPACE CONTENT & MODULE AREA ----------------- */}
        <main className="flex-1 flex flex-col min-w-0 bg-transparent overflow-hidden">
          
          {/* MODE HEADER (Spans beautifully full width) */}
          <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 border border-white/10 backdrop-blur-xl bg-white/5 rounded-2xl shadow-lg text-white mb-6">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping"></span>
              <h1 className="text-sm font-bold text-white font-sans tracking-widest uppercase flex items-center gap-2">
                Mode: {activeTab === 'PRINT' ? 'Print Resi' : activeTab === 'PACKING' ? 'Packing' : activeTab === 'PICKUP' ? 'Pick up' : activeTab === 'COURIERS' ? 'Ekspedisi' : activeTab === 'CANCEL_SEARCH' ? 'Cancel' : 'Retur'}
              </h1>
              <span className="text-[9px] text-slate-300 px-2.5 py-0.5 border border-white/10 rounded uppercase font-mono bg-white/5 font-bold tracking-wider">Production Line A</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setShowAppsScriptDrawer(true)}
                className="px-2.5 py-1.5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 text-[10px] tracking-wider uppercase font-mono transition-all font-semibold cursor-pointer"
                title="Google Sheets"
              >
                Sheets Script
              </button>
              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                className="p-1.5 cursor-pointer hover:bg-white/10 rounded-lg text-slate-300 border border-white/10 transition-all shadow-sm-thin"
                title="Global Preferences"
              >
                <Settings size={16} />
              </button>
            </div>
          </header>

          {/* TWO COLUMN GRID COLUMNS LAYOUT */}
          <div className="flex-1 overflow-y-auto no-scrollbar pb-12">
            <div className="max-w-7xl mx-auto">
              {/* Reset/Sync Automatic Banner */}
              <div className="flex items-center justify-between flex-wrap gap-4 mb-4 bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 backdrop-blur-xl shadow-xl">
                <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <RefreshCw className="animate-spin" size={15} style={{ animationDuration: '8s' }} />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      ⚙️ Sistem Pembersihan Log Otomatis 24 Jam
                      <span className="bg-emerald-500/15 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[8px] font-mono text-emerald-400 uppercase tracking-widest leading-none">Aktif</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-relaxed">Penyimpanan internal browser lokal &amp; statistik harian di-reset otomatis setiap 24 jam untuk kecepatan respon optimal.</div>
                  </div>
                </div>
                <div className="flex items-center flex-wrap gap-3">
                  <button
                    onClick={() => setShowSupabaseModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border font-sans text-[11px] font-bold transition-all hover:bg-white/5 cursor-pointer origin-center hover:scale-[1.02] active:scale-[0.98] bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                    title="Klik untuk membuka Panduan Konfigurasi Sinkronisasi Supabase Real-time ke komputer/alat lain"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                    <span>Realtime DB: Connected</span>
                  </button>
                  <div className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-xl border border-white/5 font-mono text-[11px] text-slate-300">
                    <span className="text-slate-400 font-sans font-semibold">Reset Berikutnya:</span>
                    <span className="font-extrabold text-indigo-300 animate-pulse">{resetCountdown}</span>
                  </div>
                  <button
                    onClick={handleManualReset}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 border border-rose-500/25 hover:border-rose-500/45 rounded-xl text-[11px] font-extrabold text-rose-300 transition-all shadow-lg hover:shadow-rose-500/5 active:scale-95"
                    title="Kosongkan statistik harian &amp; data transmisi resi secara manual sekarang"
                  >
                    <Trash2 className="text-rose-400 animate-pulse" size={13} />
                    <span>Reset Manual</span>
                  </button>
                </div>
              </div>

              {/* Realtime stats boxes widget */}
              <DashboardStats />

              {/* TWO COLUMN GRID CONTENT */}
              <div className="grid grid-cols-1 gap-8 items-start lg:grid-cols-3 mt-6">
                {/* LEFT INTERACTIVE COLUMN WORKSPACE */}
                <section className="lg:col-span-2 space-y-6">

            {/* Main Tab Routing Panels */}
            {activeTab === 'PRINT' || activeTab === 'PACKING' || activeTab === 'PICKUP' ? (
              <ScanWorkstation />
            ) : null}

            {activeTab === 'COURIERS' ? (
              <div className="space-y-6">
                {/* Embedded Courier manager profiles view */}
                <CourierManagerView />

                {/* Expedition tables for printing prefix configurations */}
                <div className="bg-[#1a1c2e] border border-white/10 p-6 rounded-[24px]">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="text-xs font-black tracking-widest uppercase text-zinc-100">
                        -- DAFTAR METODE EKSPEDISI AKTIF --
                      </h4>
                      <p className="text-[10px] text-zinc-450 uppercase mt-0.5">
                        Prefix resi pemicu otomatis filter cetak & status.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingExpeditionId(null);
                        setShowExpeditionModal(true);
                      }}
                      className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 px-4 py-2 text-[10px] tracking-widest font-bold uppercase transition-colors rounded-xl"
                    >
                      [ TAMBAH EKSPEDISI ]
                    </button>
                  </div>

                  <div className="border border-zinc-800 divide-y divide-zinc-800 rounded-xl overflow-hidden">
                    {expeditions.map((exp) => (
                      <div key={exp.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-[#242745]/20">
                        <div className="space-y-0.5 uppercase">
                          <div className="font-extrabold text-zinc-300">
                            {exp.name} (PREFIX: <span className="font-mono text-zinc-400 font-bold">{exp.prefix}</span>)
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono">
                            METODE: {exp.types?.[0]?.name || 'REGULER'} | KODE: {exp.types?.[0]?.code || '-'}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingExpeditionId(exp.id);
                              setShowExpeditionModal(true);
                            }}
                            className="text-[10px] text-zinc-450 hover:text-zinc-200 font-bold cursor-pointer"
                          >
                            EDIT
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Hapus ekspedisi ini?')) {
                                setExpeditions((prev) => prev.filter((e) => e.id !== exp.id));
                              }
                            }}
                            className="text-[10px] text-rose-500 hover:text-rose-400 font-bold cursor-pointer"
                          >
                            HAPUS
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === 'CANCEL_SEARCH' ? <CancelView /> : null}

            {activeTab === 'RETURNS' ? <ReturnsView /> : null}
          </section>

          {/* RIGHT TRANSACTIONAL LEDGER DATABASE HISTORY LOGS COLUMN */}
          <section className="lg:col-span-1">
            <LogsTableView />
          </section>
        </div>
      </div>
    </div>
  </main>
</div>

      {/* ----------------- BACKEND INTEGRATION DIALOG PORTS ----------------- */}

      {/* Manual Apps Script guide drawer view */}
      <SheetsDrawer isOpen={showAppsScriptDrawer} onClose={() => setShowAppsScriptDrawer(false)} />

      {/* Supabase realtime websocket modal guide */}
      <SupabaseSyncModal isOpen={showSupabaseModal} onClose={() => setShowSupabaseModal(false)} />

      {/* Master Warning Alert modals port */}
      <WarningModals
        doubleScanWarning={doubleScanWarning}
        setDoubleScanWarning={setDoubleScanWarning}
        isEditingDoubleResi={isEditingDoubleResi}
        setIsEditingDoubleResi={setIsEditingDoubleResi}
        editedDoubleResiValue={editedDoubleResiValue}
        setEditedDoubleResiValue={setEditedDoubleResiValue}
        handleEditDoubleResi={handleEditDoubleResi}
        cancelWarning={cancelWarning}
        setCancelWarning={setCancelWarning}
        twentyFourDigitWarning={twentyFourDigitWarning}
        setTwentyFourDigitWarning={setTwentyFourDigitWarning}
      />

      {/* Expedition edit modal */}
      <ExpeditionModal
        isOpen={showExpeditionModal}
        onClose={() => {
          setShowExpeditionModal(false);
          setEditingExpeditionId(null);
        }}
        editingId={editingExpeditionId}
        onSaveSuccess={() => {}}
      />

      {/* Sound alarm setting modal */}
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />

      {/* Draggable PiP screen mode overlays */}
      {isPipActive && createPortal(
        <div
          onClick={() => {
            pipInputRef.current?.focus();
            setIsPipFocused(true);
          }}
          className="fixed bottom-4 right-4 z-50 w-80 bg-[#09090b] border border-zinc-800 p-4 shadow-2xl flex flex-col gap-3 font-sans text-white select-none"
        >
          <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
            <span className="text-[9px] font-black tracking-widest text-zinc-300">MELAYANG (ALWAYS-ON-TOP)</span>
            <button
              type="button"
              onClick={() => setIsPipActive(false)}
              className="text-zinc-500 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="relative aspect-video w-full bg-black/40 border border-zinc-850">
            <canvas id="pip-canvas" className="w-full h-full object-cover" />
            <div className="absolute top-2 left-2 bg-[#09090b]/80 border border-zinc-855 px-2 py-0.5 text-[8px] font-mono text-zinc-400">
              ● STREAM LIVE FEED
            </div>
            {activeKeys.length > 0 && (
              <div className="absolute bottom-2 left-2 bg-rose-950 border border-rose-900 px-2 py-1 text-[8px] font-bold text-rose-400 animate-pulse">
                RECORDING: {activeKeys[0].toUpperCase()}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <span className="text-[8px] font-bold text-zinc-450 uppercase tracking-widest">
              PINDAI BARCODE RESI (FAST BOX) :
            </span>
            <input
              type="text"
              ref={pipInputRef}
              value={pipBarcodeValue}
              onChange={(e) => setPipBarcodeValue(e.target.value)}
              onFocus={() => setIsPipFocused(true)}
              onBlur={() => setIsPipFocused(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = pipBarcodeValue.trim();
                  if (val) {
                    processBarcodeScan(val);
                    setPipBarcodeValue('');
                  }
                }
              }}
              placeholder="KLIK & PINDAI DI SINI..."
              className="w-full bg-black/40 border border-zinc-800 px-3 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-500"
            />
            {isPipFocused ? (
              <span className="text-[7px] text-zinc-400/80 font-mono tracking-wider uppercase block">
                ● STATUS: SIAP PINDAI BARCODE KOTAK
              </span>
            ) : (
              <span className="text-[7px] text-amber-500/80 bg-amber-955/20 font-bold uppercase tracking-wider block">
                ⚠️ KLIK PILIHAN ATAS AGAR FOKUS SCAN KEYBOARD!
              </span>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <PackingSystemInner />
    </AppProvider>
  );
}
