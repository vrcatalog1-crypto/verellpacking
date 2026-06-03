import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useCamera } from '../hooks/useCamera';

export const ScanWorkstation: React.FC = () => {
  const {
    barcodeValue,
    setBarcodeValue,
    processBarcodeScan,
    latestScanResult,
    activeTab,
    selectedCourierId,
    setSelectedCourierId,
    couriers,
    isCameraActive,
    cameraSize,
    setCameraSize,
    cameraAspect,
    setCameraAspect,
    hideCameraSettings,
    setHideCameraSettings,
    availableCameras,
    selectedCameraId,
    startCameraStream,
    stopCameraStream,
    cycleCameraSources,
    forceCameraFacing,
    videoRef,
    canvasRef,
    activeRecordings,
    finishPackingSession,
    handleCopyClipboard,
  } = useApp();

  const { startCameraStream: initCamera, stopCameraStream: killCamera, cycleCameraSources: switchCamera, forceCameraFacing: forceFacing } = useCamera();
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto focus input scanner
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    const forceFocus = () => {
      if (inputRef.current && (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'SELECT' && document.activeElement?.tagName !== 'TEXTAREA')) {
        inputRef.current.focus();
      }
    };
    window.addEventListener('click', forceFocus);
    return () => window.removeEventListener('click', forceFocus);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBarcodeValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      processBarcodeScan(barcodeValue);
      setBarcodeValue('');
    }
  };

  const manualSubmit = () => {
    processBarcodeScan(barcodeValue);
    setBarcodeValue('');
  };

  // Convert size options to tailwind classes
  const getCameraSizeClass = () => {
    if (cameraSize === 'medium') return 'max-w-xl';
    if (cameraSize === 'cinema') return 'max-w-full';
    return 'max-w-3xl';
  };

  const getAspectClass = () => {
    if (cameraAspect === '16-10') return 'aspect-[16/10]';
    if (cameraAspect === '4-3') return 'aspect-[4/3]';
    if (cameraAspect === '21-9') return 'aspect-[21/9]';
    return 'aspect-[16/9]';
  };

  const getTabLabel = () => {
    if (activeTab === 'PRINT') return 'PRINT';
    if (activeTab === 'PACKING') return 'PACKING';
    return 'PICK UP';
  };

  return (
    <div className="flex flex-col gap-5 mb-6">
      
      {/* SCAN BARCODE CARD WORKSPACE */}
      <div className="bg-[#121526]/80 border border-white/5 p-6 rounded-[24px] shadow-2xl relative">
        
        {/* Header workspace row with live pulse status */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xs font-black tracking-[0.25em] text-zinc-300 font-mono uppercase">
            SCAN BARCODE
          </h2>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#132c21] border border-emerald-500/10 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1fd383] animate-pulse"></span>
            <span className="text-[9px] font-black tracking-widest text-[#1fd383] font-sans uppercase">
              LIVE STATUS
            </span>
          </div>
        </div>

        {/* GLOWING INPUT INNER CONTAINER */}
        <div className="relative mb-5 group">
          <div className="absolute -inset-0.5 bg-[#5d5fef]/20 rounded-2xl blur opacity-75 group-focus-within:opacity-100 transition duration-300"></div>
          <div className="relative bg-[#0b0c16] border border-white/10 rounded-2xl flex items-center p-1.5 focus-within:border-[#5254d8]/60 transition-colors">
            <input
              ref={inputRef}
              type="text"
              autoComplete="off"
              value={barcodeValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={`PINDAI BARCODE RESI DISINI (${getTabLabel()})...`}
              className="w-full bg-transparent px-4 py-3.5 font-mono text-white text-sm uppercase tracking-widest placeholder:text-zinc-600 focus:outline-none"
            />
            
            <div className="flex items-center gap-2 pr-3 shrink-0">
              {barcodeValue && (
                <button
                  type="button"
                  onClick={() => setBarcodeValue('')}
                  className="text-zinc-500 hover:text-white font-mono text-[9px] uppercase tracking-wider px-2"
                >
                  CLEAR
                </button>
              )}
              <button
                type="button"
                onClick={manualSubmit}
                className="bg-[#1d203e] hover:bg-[#282d5c] text-[10px] text-zinc-300 font-bold px-3 py-2 border border-white/5 rounded-xl uppercase tracking-widest transition-all cursor-pointer"
              >
                . ENTER
              </button>
            </div>
          </div>
        </div>

        {/* Courier selection explicitly on PICKUP tab inside the workstation */}
        {activeTab === 'PICKUP' && (
          <div className="mb-5 bg-[#090a14] border border-white/5 p-4 rounded-xl flex flex-col md:flex-row items-center gap-4 justify-between">
            <div className="w-full md:w-1/2">
              <label className="text-[10px] text-zinc-400 font-sans tracking-[0.15em] uppercase block mb-1.5 font-bold">
                PILIH KURIR / DRIVER HARIAN TERINTEGRASI
              </label>
              <select
                value={selectedCourierId}
                onChange={(e) => setSelectedCourierId(e.target.value)}
                className="w-full bg-[#121526] border border-white/10 px-4 py-2.5 font-sans text-xs text-zinc-300 uppercase tracking-widest focus:outline-none focus:border-[#5d5fef] rounded-xl cursor-pointer"
              >
                <option value="">-- BELUM ADA KURIR TERPILIH --</option>
                {couriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.code} ({c.vehicle})
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-1/2 text-left md:text-right">
              <p className="text-[9px] text-[#5d5fef] font-sans tracking-wider uppercase font-bold leading-relaxed">
                * STATUS SCAN RESI OTOMATIS DISADUR & DIHUBUNGKAN DENGAN PROFIL COURIER YANG AKTIF DIPILIH.
              </p>
            </div>
          </div>
        )}

        {/* DETECTED RESULTS CONTAINER SITUATED INSIDE SCAN BARCODE SPACE (matching the mockup) */}
        {latestScanResult ? (
          <div className="bg-[#090b14] border border-white/5 rounded-[20px] p-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#5d5fef] animate-pulse"></span>
                <span className="text-[10.5px] font-black tracking-widest text-[#7385eb] font-mono uppercase">
                  HASIL DETEKSI SCAN TERBARU
                </span>
              </div>
              <span className="text-[10.5px] font-mono text-zinc-500 font-medium">
                {latestScanResult.tanggal} | {latestScanResult.time}
              </span>
            </div>

            <div className="bg-[#121421] rounded-xl p-4.5 border border-white/[0.03]">
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-2">
                INFORMASI RESI & EKSPEDISI
              </span>

              <div className="space-y-4">
                <div>
                  <p className="text-[9.5px] text-zinc-400 uppercase tracking-wider mb-1">Nomor Resi:</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-white text-base lg:text-lg font-black tracking-widest select-all uppercase">
                      {latestScanResult.resi}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyClipboard(latestScanResult.resi, 'Resi disalin!')}
                      className="p-1 px-2 bg-[#1b1c30] hover:bg-[#2e2f4f] text-zinc-400 hover:text-white rounded-md text-[10px] font-sans font-bold flex items-center gap-1 border border-white/5 cursor-pointer transition-transform active:scale-95"
                      title="Salin Resi"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                      COPY
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <p className="text-[9.5px] text-zinc-400 uppercase tracking-wider mb-1.5">Ekspedisi:</p>
                    <span className="inline-block px-3 py-1 bg-[#1d2650] border border-[#5d5fef]/30 text-[#7185eb] text-[10px] font-bold uppercase rounded-lg tracking-widest">
                      {latestScanResult.expeditionName}
                    </span>
                  </div>
                  <div>
                    <p className="text-[9.5px] text-zinc-400 uppercase tracking-wider mb-1.5">Metode:</p>
                    <span className="inline-block px-3 py-1 bg-[#132c21] border border-emerald-500/20 text-[#1fd383] text-[10px] font-bold uppercase rounded-lg tracking-widest">
                      {latestScanResult.serviceType}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 border border-dashed border-white/5 rounded-2xl text-center bg-[#090b14]/40">
            <span className="text-[10px] font-bold tracking-[0.15em] text-zinc-600 uppercase">
              BELUM ADA DATA PEMINDAIAN RESI DIAKTIFKAN
            </span>
          </div>
        )}

      </div>

      {/* WEBCAM VIEWPORT FOR PACKING TAB */}
      {activeTab === 'PACKING' && (
        <div className={`w-full ${getCameraSizeClass()} mx-auto transition-all duration-300`}>
          <div className="relative bg-[#0b0c16] border border-white/5 rounded-[24px] overflow-hidden shadow-2xl">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="hidden" // drawn to canvas synchronously
            />
            <canvas
              ref={canvasRef}
              className={`w-full h-full ${getAspectClass()} block object-cover bg-[#090911]`}
            />

            {/* Video overlay indicators if inactive */}
            {!isCameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#0b0c16]/95 backdrop-blur-sm">
                <p className="font-sans text-xs tracking-[0.22em] text-rose-500 uppercase font-bold mb-2">
                  KAMERA PACKING NON-AKTIF
                </p>
                <p className="text-zinc-500 text-[10px] font-sans tracking-wide max-w-md mb-6 leading-relaxed">
                  Pastikan izin kamera diaktifkan. Pilih mode kamera atau sync dengan browser untuk melanjutkan pendokumentasian.
                </p>
                <button
                  type="button"
                  onClick={() => initCamera()}
                  className="bg-[#5d5fef] hover:bg-[#484ad0] border border-white/10 text-white font-sans text-[10px] font-bold uppercase tracking-widest px-6 py-3.5 transition-all rounded-xl cursor-pointer shadow-lg"
                >
                  AKTIFKAN KAMERA UTAMA
                </button>
              </div>
            )}

            {/* Camera settings drawer bottom overlay */}
            {isCameraActive && !hideCameraSettings && (
              <div className="absolute bottom-4 left-4 right-4 bg-[#0b0c16]/90 backdrop-blur-md border border-white/10 p-3 flex flex-wrap items-center justify-between gap-3 text-white rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-zinc-500 font-bold tracking-wider">KAMERA:</span>
                  <select
                    value={selectedCameraId}
                    onChange={(e) => initCamera(e.target.value)}
                    className="bg-[#121526] border border-white/10 px-2 py-1 text-[11px] font-mono tracking-wide rounded-md focus:outline-none text-zinc-300 cursor-pointer"
                  >
                    {availableCameras.map((cam, index) => (
                      <option key={index} value={cam.deviceId}>
                        {cam.label || `Kamera ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono font-medium">
                  <button
                    type="button"
                    onClick={() => switchCamera()}
                    className="hover:text-[#5d5fef] text-[10px] tracking-wider uppercase underline decoration-dashed hover:decoration-solid text-zinc-400"
                  >
                    ROGUE CAMERA SOURCE
                  </button>
                  <div className="h-4 w-[1px] bg-white/10" />
                  <button
                    type="button"
                    onClick={() => forceFacing('environment')}
                    className="hover:text-white text-[10px] tracking-wider uppercase text-zinc-500"
                  >
                    BACK
                  </button>
                  <button
                    type="button"
                    onClick={() => forceFacing('user')}
                    className="hover:text-white text-[10px] tracking-wider uppercase text-zinc-500"
                  >
                    FRONT
                  </button>
                </div>

                <button
                  type="button"
                  onClick={killCamera}
                  className="hover:text-rose-400 text-[10px] tracking-widest font-sans uppercase font-bold text-rose-500"
                >
                  CLOSE
                </button>
              </div>
            )}

            {/* Camera header resolution controller */}
            {isCameraActive && (
              <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-[#0b0c16]/85 backdrop-blur-sm border border-white/10 px-3.5 py-2 rounded-xl text-[10px] font-mono shadow-xl">
                <button
                  type="button"
                  onClick={() => setHideCameraSettings(!hideCameraSettings)}
                  className="text-zinc-400 hover:text-white uppercase mr-2.5"
                >
                  {hideCameraSettings ? '[ OPEN TOOLS ]' : '[ HIDE TOOLS ]'}
                </button>
                <span className="text-white/10">|</span>
                <span className="text-zinc-500 ml-2 font-bold">SIZE:</span>
                <button
                  type="button"
                  onClick={() => setCameraSize('medium')}
                  className={`px-1.5 hover:text-white uppercase ${cameraSize === 'medium' ? 'text-zinc-100 font-bold' : 'text-zinc-500'}`}
                >
                  MD
                </button>
                <button
                  type="button"
                  onClick={() => setCameraSize('large')}
                  className={`px-1.5 hover:text-white uppercase ${cameraSize === 'large' ? 'text-zinc-100 font-bold' : 'text-zinc-500'}`}
                >
                  LG
                </button>
                <button
                  type="button"
                  onClick={() => setCameraSize('cinema')}
                  className={`px-1.5 hover:text-white uppercase ${cameraSize === 'cinema' ? 'text-zinc-100 font-bold' : 'text-zinc-500'}`}
                >
                  CN
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ACTIVE RECORINGS DRAWER IN PACKING SESSION */}
      {activeTab === 'PACKING' && Object.keys(activeRecordings).length > 0 && (
        <div className="bg-[#121526]/80 border border-white/5 p-5 rounded-[24px] shadow-xl">
          <span className="text-[10px] text-zinc-400 font-bold font-mono tracking-[0.2em] uppercase block mb-3.5">
            SESI REKAMAN PACKING AKTIF
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(activeRecordings).map(([resi, rec]) => (
              <div key={resi} className="bg-rose-950/20 border border-rose-500/20 p-4.5 rounded-[16px] flex items-center justify-between">
                <div>
                  <p className="font-mono text-xs font-black text-rose-400 tracking-wider">
                    {resi}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5 uppercase">
                    DURASI: {(rec as any).timer} DETIK
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => finishPackingSession(resi)}
                  className="bg-rose-900/30 hover:bg-rose-900/50 border border-rose-800/40 px-3.5 py-1.5 rounded-xl font-sans text-[10px] font-extrabold text-rose-200 uppercase tracking-widest transition-all cursor-pointer"
                >
                  FINISH REC
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
