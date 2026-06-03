import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback, useReducer } from 'react';
import { ScanRecord, ScanStatus, Expedition, Courier, ReturnRecord, ShopeeProduct } from '../types';
import { INITIAL_EXPEDITIONS, INITIAL_COURIERS } from '../data';
import { supabase, isSupabaseConfigured, db } from '../lib/supabase';
import { initSyncManager } from '../lib/syncManager';

// ==========================================
// 1. TYPES & INTERFACES ARCHITECTURE
// ==========================================
interface LatestScanResult {
  resi: string;
  expeditionName: string;
  serviceType: string;
  status: ScanStatus;
  courier?: Courier;
  timestamp: number;
  time: string;
  tanggal: string;
}

interface AlertType {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'double-scan';
}

interface WarningModalType {
  resi: string;
  message: string;
  record?: ScanRecord;
}

// State manajemen internal terpisah dari form input transien
interface AppState {
  records: ScanRecord[];
  expeditions: Expedition[];
  couriers: Courier[];
  cancelledResiList: string[];
  returnsList: ReturnRecord[];
  customShopeeMappings: Record<string, { noPesanan: string; products: ShopeeProduct[] }>;
}

type AppAction =
  | { type: 'SET_RECORDS'; payload: ScanRecord[] }
  | { type: 'UPSERT_RECORD'; payload: ScanRecord }
  | { type: 'SET_EXPEDITIONS'; payload: Expedition[] }
  | { type: 'SET_COURIERS'; payload: Courier[] }
  | { type: 'SET_CANCEL_LIST'; payload: string[] }
  | { type: 'ADD_CANCEL_RESI'; payload: string }
  | { type: 'SET_RETURNS'; payload: ReturnRecord[] }
  | { type: 'SET_SHOPEE_MAPPINGS'; payload: Record<string, { noPesanan: string; products: ShopeeProduct[] }> };

interface AppContextType extends AppState {
  setRecords: React.Dispatch<React.SetStateAction<ScanRecord[]>>; // Backwards compatibility layout
  selectedCourierId: string;
  setSelectedCourierId: (id: string) => void;
  latestScanResult: LatestScanResult | null;
  setLatestScanResult: (result: LatestScanResult | null) => void;
  activeTab: 'PRINT' | 'PACKING' | 'PICKUP' | 'COURIERS' | 'CANCEL_SEARCH' | 'RETURNS';
  setActiveTab: (tab: 'PRINT' | 'PACKING' | 'PICKUP' | 'COURIERS' | 'CANCEL_SEARCH' | 'RETURNS') => void;
  barcodeValue: string;
  setBarcodeValue: (val: string) => void;
  webhookUrl: string;
  setWebhookUrl: (url: string) => void;
  alert: AlertType | null;
  setAlert: (alert: AlertType | null) => void;
  activeRecordings: Record<string, { startTime: number; timer: number }>;
  setActiveRecordings: React.Dispatch<React.SetStateAction<React.SetStateAction<Record<string, { startTime: number; timer: number }>>>>;

  // Modals & form states
  showExpeditionModal: boolean;
  setShowExpeditionModal: (show: boolean) => void;
  showCourierModal: boolean;
  setShowCourierModal: (show: boolean) => void;
  showSettingsModal: boolean;
  setShowSettingsModal: (show: boolean) => void;
  
  newExpName: string;
  setNewExpName: (val: string) => void;
  newExpPrefix: string;
  setNewExpPrefix: (val: string) => void;
  newExpMethodType: 'reguler' | 'instan';
  setNewExpMethodType: (val: 'reguler' | 'instan') => void;
  newExpCode: string;
  setNewExpCode: (val: string) => void;
  editingExpeditionId: string | null;
  setEditingExpeditionId: (val: string | null) => void;
  
  newCourierName: string;
  setNewCourierName: (val: string) => void;
  newCourierPhone: string;
  setNewCourierPhone: (val: string) => void;
  newCourierVehicle: string;
  setNewCourierVehicle: (val: string) => void;
  newCourierCode: string;
  setNewCourierCode: (val: string) => void;

  dbSyncState: 'offline' | 'connecting' | 'connected' | 'error';
  setDbSyncState: (val: 'offline' | 'connecting' | 'connected' | 'error') => void;
  offlinePendingCount: number;
  setOfflinePendingCount: (val: number) => void;
  showSupabaseModal: boolean;
  setShowSupabaseModal: (show: boolean) => void;

  useSpeechAssistant: boolean;
  setUseSpeechAssistant: React.Dispatch<React.SetStateAction<boolean>>;
  customDoubleScanSound: string | null;
  setCustomDoubleScanSound: (sound: string | null) => void;
  appBackgroundOpacity: number;
  setAppBackgroundOpacity: (opacity: number) => void;
  
  cancelInputVal: string;
  setCancelInputVal: (val: string) => void;
  cancelSearchQuery: string;
  setCancelSearchQuery: (val: string) => void;
  setCancelledResiList: (updater: React.SetStateAction<string[]>) => void;
  setCancelledResiList: (updater: React.SetStateAction<string[]>) => void;
  
  returnBarcode: string;
  setReturnBarcode: (val: string) => void;
  returnCourierId: string;
  setReturnCourierId: (val: string) => void;
  returnCondition: 'BAIK' | 'RUSAK' | 'TERBUKA';
  setReturnCondition: (val: 'BAIK' | 'RUSAK' | 'TERBUKA') => void;
  returnReason: string;
  setReturnReason: (val: string) => void;
  returnSearchQuery: string;
  setReturnSearchQuery: (val: string) => void;
  shopeeHoleMode: boolean;
  setShopeeHoleMode: (mode: boolean) => void;

  twentyFourDigitWarning: WarningModalType | null;
  setTwentyFourDigitWarning: (val: WarningModalType | null) => void;
  cancelWarning: WarningModalType | null;
  setCancelWarning: (val: WarningModalType | null) => void;
  doubleScanWarning: WarningModalType | null;
  setDoubleScanWarning: (val: WarningModalType | null) => void;

  triggerAlert: (message: string, type: 'success' | 'error' | 'warning' | 'info' | 'double-scan') => void;
  speakText: (text: string) => void;
  playBeep: (type: 'success' | 'warning' | 'error' | 'info' | 'double-scan') => void;
  matchExpedition: (resi: string) => { expeditionName: string; serviceType: string };
  getShopeeOrder: (resi: string) => { noPesanan: string; products: ShopeeProduct[] } | null;
  updateScanRecordStatus: (id: string, resi: string, status: ScanStatus, additionalData?: Partial<ScanRecord>) => ScanRecord;
  processBarcodeScan: (barcodeInput: string) => void;
  finishPackingSession: (resi: string) => void;
  pushToWebhook: (record: ScanRecord) => Promise<void>;
  handleCSVDownload: (mode: 'flat' | 'pivot') => void;
  handleCopyClipboard: (text: string, alertMsg?: string) => void;

  displayLogs: any[];
  totalCount: number;
  todayStats: { printed: number; packed: number; pickedUp: number; totalToday: number; pending: number };
  logDisplayMode: 'flat' | 'pivot';
  setLogDisplayMode: (mode: 'flat' | 'pivot') => void;

  isCameraActive: boolean;
  setIsCameraActive: (active: boolean) => void;
  cameraMode: 'real';
  setCameraMode: (mode: 'real') => void;
  availableCameras: MediaDeviceInfo[];
  setAvailableCameras: (devices: MediaDeviceInfo[]) => void;
  selectedCameraId: string;
  setSelectedCameraId: (id: string) => void;
  cameraSize: 'medium' | 'large' | 'cinema';
  setCameraSize: (size: 'medium' | 'large' | 'cinema') => void;
  cameraAspect: '16-9' | '16-10' | '4-3' | '21-9';
  setCameraAspect: (aspect: '16-9' | '16-10' | '4-3' | '21-9') => void;
  hideCameraSettings: boolean;
  setHideCameraSettings: (hide: boolean) => void;
  streamRef: React.MutableRefObject<MediaStream | null>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  recordersRef: React.MutableRefObject<Record<string, MediaRecorder>>;
  chunksRef: React.MutableRefObject<Record<string, Blob[]>>;
  startCanvasRecording: (resi: string) => void;
  stopCanvasRecording: (resi: string) => void;
}

// ==========================================
// 2. REDUCER ARCHITECTURE FOR CENTRAL DATA
// ==========================================
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_RECORDS':
      return { ...state, records: action.payload };
    case 'UPSERT_RECORD': {
      const idx = state.records.findIndex(r => r.id === action.payload.id);
      let updated = [...state.records];
      if (idx !== -1) {
        updated[idx] = action.payload;
      } else {
        updated = [action.payload, ...state.records];
      }
      return { ...state, records: updated.sort((a, b) => b.timestamp - a.timestamp) };
    }
    case 'SET_EXPEDITIONS':
      return { ...state, expeditions: action.payload };
    case 'SET_COURIERS':
      return { ...state, couriers: action.payload };
    case 'SET_CANCEL_LIST':
      return { ...state, cancelledResiList: action.payload };
    case 'ADD_CANCEL_RESI':
      return state.cancelledResiList.includes(action.payload)
        ? state
        : { ...state, cancelledResiList: [...state.cancelledResiList, action.payload] };
    case 'SET_RETURNS':
      return { ...state, returnsList: action.payload };
    case 'SET_SHOPEE_MAPPINGS':
      return { ...state, customShopeeMappings: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Dekopling data menggunakan useReducer untuk optimasi komputasi rendering harian
  const [state, dispatch] = useReducer(appReducer, {
    records: JSON.parse(localStorage.getItem('verell_records') || '[]'),
    expeditions: JSON.parse(localStorage.getItem('verell_expeditions') || 'null') || INITIAL_EXPEDITIONS,
    couriers: JSON.parse(localStorage.getItem('verell_couriers') || 'null') || INITIAL_COURIERS,
    cancelledResiList: JSON.parse(localStorage.getItem('verell_cancelled_resi') || '[]'),
    returnsList: JSON.parse(localStorage.getItem('verell_returns_list') || '[]'),
    customShopeeMappings: JSON.parse(localStorage.getItem('verell_custom_shopee_mappings') || '{}')
  });

  // Backward compatibility wrapper untuk setRecords layout luar
  const setRecordsWrapper = useCallback((updater: React.SetStateAction<ScanRecord[]>) => {
    if (typeof updater === 'function') {
      dispatch({ type: 'SET_RECORDS', payload: updater(state.records) });
    } else {
      dispatch({ type: 'SET_RECORDS', payload: updater });
    }
  }, [state.records]);

  // Wrapper untuk setCancelledResiList
  const setCancelledResiListWrapper = useCallback((updater: React.SetStateAction<string[]>) => {
    if (typeof updater === 'function') {
      dispatch({ type: 'SET_CANCEL_LIST', payload: updater(state.cancelledResiList) });
    } else {
      dispatch({ type: 'SET_CANCEL_LIST', payload: updater });
    }
  }, [state.cancelledResiList]);

  // Transien & Navigation States
  const [selectedCourierId, setSelectedCourierId] = useState(() => localStorage.getItem('verell_selected_courier_id') || '');
  const [latestScanResult, setLatestScanResult] = useState<LatestScanResult | null>(null);
  const [activeTab, setActiveTab] = useState<'PRINT' | 'PACKING' | 'PICKUP' | 'COURIERS' | 'CANCEL_SEARCH' | 'RETURNS'>('PRINT');
  const [barcodeValue, setBarcodeValue] = useState('');
  const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem('verell_webhook_url') || '');
  const [alert, setAlert] = useState<AlertType | null>(null);
  const [activeRecordings, setActiveRecordings] = useState<Record<string, { startTime: number; timer: number }>>({});

  // Modals UI States
  const [showExpeditionModal, setShowExpeditionModal] = useState(false);
  const [showCourierModal, setShowCourierModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);

  // Forms States
  const [newExpName, setNewExpName] = useState('');
  const [newExpPrefix, setNewExpPrefix] = useState('');
  const [newExpMethodType, setNewExpMethodType] = useState<'reguler' | 'instan'>('reguler');
  const [newExpCode, setNewExpCode] = useState('SPX-REG');
  const [editingExpeditionId, setEditingExpeditionId] = useState<string | null>(null);
  const [newCourierName, setNewCourierName] = useState('');
  const [newCourierPhone, setNewCourierPhone] = useState('');
  const [newCourierVehicle, setNewCourierVehicle] = useState('Motor');
  const [newCourierCode, setNewCourierCode] = useState('');
  const [cancelInputVal, setCancelInputVal] = useState('');
  const [cancelSearchQuery, setCancelSearchQuery] = useState('');
  const [returnBarcode, setReturnBarcode] = useState('');
  const [returnCourierId, setReturnCourierId] = useState('');
  const [returnCondition, setReturnCondition] = useState<'BAIK' | 'RUSAK' | 'TERBUKA'>('BAIK');
  const [returnReason, setReturnReason] = useState('');
  const [returnSearchQuery, setReturnSearchQuery] = useState('');

  // Sync & Hardware Preferences States
  const [dbSyncState, setDbSyncState] = useState<'offline' | 'connecting' | 'connected' | 'error'>('offline');
  const [offlinePendingCount, setOfflinePendingCount] = useState(0);
  const [useSpeechAssistant, setUseSpeechAssistant] = useState(() => localStorage.getItem('verell_use_speech_assistant') !== 'false');
  const [customDoubleScanSound, setCustomDoubleScanSoundState] = useState<string | null>(() => localStorage.getItem('verell_double_scan_sound'));
  const [appBackgroundOpacity, setAppBackgroundOpacityState] = useState<number>(() => parseFloat(localStorage.getItem('verell_bg_opacity') || '1.0'));
  const [shopeeHoleMode, setShopeeHoleModeState] = useState(() => localStorage.getItem('verell_shopee_hole_mode') !== 'false');
  const [logDisplayMode, setLogDisplayMode] = useState<'flat' | 'pivot'>(() => (localStorage.getItem('verell_log_display_mode') as 'flat' | 'pivot') || 'pivot');

  // Warnings Modals States
  const [twentyFourDigitWarning, setTwentyFourDigitWarning] = useState<WarningModalType | null>(null);
  const [cancelWarning, setCancelWarning] = useState<WarningModalType | null>(null);
  const [doubleScanWarning, setDoubleScanWarning] = useState<WarningModalType | null>(null);

  // Camera Hardware States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraMode, setCameraMode] = useState<'real'>('real');
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [cameraSize, setCameraSize] = useState<'medium' | 'large' | 'cinema'>('large');
  const [cameraAspect, setCameraAspect] = useState<'16-9' | '16-10' | '4-3' | '21-9'>('16-9');
  const [hideCameraSettings, setHideCameraSettingsState] = useState(() => localStorage.getItem('verell_hide_camera_settings') === 'true');

  // Core References Architecture (Mencegah Re-render loop)
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recordersRef = useRef<Record<string, MediaRecorder>>({});
  const chunksRef = useRef<Record<string, Blob[]>>({});
  const alertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Setters Preference Wrapper
  const setCustomDoubleScanSound = (sound: string | null) => {
    sound ? localStorage.setItem('verell_double_scan_sound', sound) : localStorage.removeItem('verell_double_scan_sound');
    setCustomDoubleScanSoundState(sound);
  };
  const setAppBackgroundOpacity = (opacity: number) => {
    localStorage.setItem('verell_bg_opacity', String(opacity));
    setAppBackgroundOpacityState(opacity);
  };
  const setShopeeHoleMode = (mode: boolean) => {
    localStorage.setItem('verell_shopee_hole_mode', String(mode));
    setShopeeHoleModeState(mode);
  };
  const setHideCameraSettings = (hide: boolean) => {
    localStorage.setItem('verell_hide_camera_settings', String(hide));
    setHideCameraSettingsState(hide);
  };

  // Sync LocalStorage Core dengan state reducer
  useEffect(() => { localStorage.setItem('verell_records', JSON.stringify(state.records)); }, [state.records]);
  useEffect(() => { localStorage.setItem('verell_expeditions', JSON.stringify(state.expeditions)); }, [state.expeditions]);
  useEffect(() => { localStorage.setItem('verell_couriers', JSON.stringify(state.couriers)); }, [state.couriers]);
  useEffect(() => { localStorage.setItem('verell_cancelled_resi', JSON.stringify(state.cancelledResiList)); }, [state.cancelledResiList]);
  useEffect(() => { localStorage.setItem('verell_returns_list', JSON.stringify(state.returnsList)); }, [state.returnsList]);
  useEffect(() => { localStorage.setItem('verell_use_speech_assistant', String(useSpeechAssistant)); }, [useSpeechAssistant]);
  useEffect(() => { localStorage.setItem('verell_log_display_mode', logDisplayMode); }, [logDisplayMode]);
  useEffect(() => { localStorage.setItem('verell_selected_courier_id', selectedCourierId); }, [selectedCourierId]);
  useEffect(() => { localStorage.setItem('verell_webhook_url', webhookUrl); }, [webhookUrl]);

  // Audio Synthesizer & Speech Assistant Core Module
  const speakText = useCallback((text: string) => {
    if (!useSpeechAssistant) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    } catch (e) { console.warn('Speech Assistant engine failed:', e); }
  }, [useSpeechAssistant]);

  const playBeep = useCallback((type: 'success' | 'warning' | 'error' | 'info' | 'double-scan') => {
    try {
      if (type === 'double-scan' && customDoubleScanSound) {
        const audio = new Audio(customDoubleScanSound);
        audio.volume = 0.5;
        audio.play().catch(() => synthesize(type));
        return;
      }
      synthesize(type);
    } catch (e) { console.warn('Audio driver bypass failed:', e); }

    function synthesize(t: typeof type) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);

        if (t === 'success') {
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          osc.start(); osc.stop(ctx.currentTime + 0.15);
        } else if (t === 'double-scan' || t === 'error') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(t === 'double-scan' ? 150 : 120, ctx.currentTime);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          osc.start(); osc.stop(ctx.currentTime + 0.4);
        } else {
          osc.frequency.setValueAtTime(440, ctx.currentTime);
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          osc.start(); osc.stop(ctx.currentTime + 0.2);
        }
      } catch (err) { console.warn(err); }
    }
  }, [customDoubleScanSound]);

  const triggerAlert = useCallback((message: string, type: typeof alert extends {type: infer T} ? T : any) => {
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    setAlert({ message, type });
    playBeep(type);
    alertTimeoutRef.current = setTimeout(() => setAlert(null), 5500);
  }, [playBeep]);

  // ==========================================
  // 3. DATABASE REALTIME OPERATIONAL LAYER
  // ==========================================
  useEffect(() => {
    const cleanup = initSyncManager((count) => setOfflinePendingCount(count));

    if (isSupabaseConfigured) {
      setDbSyncState('connecting');
      db.fetchAll()
        .then(data => {
          if (data) {
            setDbSyncState('connected');
            if (data.records.length > 0) dispatch({ type: 'SET_RECORDS', payload: data.records });
            if (data.returns.length > 0) dispatch({ type: 'SET_RETURNS', payload: data.returns });
            if (data.cancelledResi.length > 0) dispatch({ type: 'SET_CANCEL_LIST', payload: data.cancelledResi });
            if (data.expeditions.length > 0) dispatch({ type: 'SET_EXPEDITIONS', payload: data.expeditions });
            if (data.couriers.length > 0) dispatch({ type: 'SET_COURIERS', payload: data.couriers });
            if (Object.keys(data.shopeeMappings).length > 0) dispatch({ type: 'SET_SHOPEE_MAPPINGS', payload: data.shopeeMappings });
          }
        })
        .catch(() => setDbSyncState('error'));

      const channel = supabase!
        .channel('realtime_tables')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'verell_records' }, payload => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            dispatch({ type: 'UPSERT_RECORD', payload: payload.new as ScanRecord });
          }
        })
        .subscribe();

      return () => { cleanup(); channel.unsubscribe(); };
    }
    return cleanup;
  }, []);

  // Timer Session Manager harian
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setActiveRecordings(prev => {
        if (Object.keys(prev).length === 0) return prev;
        const now = Date.now();
        const updated = { ...prev };
        Object.keys(updated).forEach(resi => {
          updated[resi] = { ...updated[resi], timer: Math.floor((now - updated[resi].startTime) / 1000) };
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(timerInterval);
  }, []);

  // Midnight Auto Reset System Log Driver
  useEffect(() => {
    const checkMidnightReset = () => {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
      const savedResetDate = localStorage.getItem('verell_last_reset_date');
      if (savedResetDate && savedResetDate !== todayStr) {
        dispatch({ type: 'SET_RECORDS', payload: [] });
        setLatestScanResult(null);
        dispatch({ type: 'SET_RETURNS', payload: [] });
        dispatch({ type: 'SET_CANCEL_LIST', payload: [] });
        dispatch({ type: 'SET_SHOPEE_MAPPINGS', payload: {} });
        localStorage.setItem('verell_last_reset_date', todayStr);
        triggerAlert('Sistem otomatis di-reset harian untuk menjaga kecepatan scanner PC.', 'info');
        speakText('Sistem packing di-reset otomatis karena sudah berganti hari.');
      } else if (!savedResetDate) {
        localStorage.setItem('verell_last_reset_date', todayStr);
      }
    };
    const interval = setInterval(checkMidnightReset, 60000);
    checkMidnightReset();
    return () => clearInterval(interval);
  }, [triggerAlert, speakText]);

  // Core Actions & Helpers Logic
  const matchExpedition = useCallback((resi: string) => {
    const clean = resi.trim().toUpperCase();
    for (const exp of state.expeditions) {
      if (clean.startsWith(exp.prefix.toUpperCase())) {
        return { expeditionName: exp.name, serviceType: exp.types[0]?.name || 'Reguler' };
      }
    }
    return { expeditionName: 'LAINNYA', serviceType: 'KIRIMAN UMUM' };
  }, [state.expeditions]);

  const getShopeeOrder = useCallback((resi: string) => {
    return state.customShopeeMappings[resi.trim().toUpperCase()] || null;
  }, [state.customShopeeMappings]);

  const pushToWebhook = useCallback(async (record: ScanRecord) => {
    if (!webhookUrl) return;
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resi: record.resi, tanggal: record.tanggal, time: record.time, timestamp: record.timestamp,
          status: record.status, expedition: record.expedition, courierCode: record.courierCode || '-',
          status_batal: state.cancelledResiList.includes(record.resi) ? 'CANCELLED' : ''
        })
      });
    } catch (e) { console.warn('Async Webhook packet droppped:', e); }
  }, [webhookUrl, state.cancelledResiList]);

  const updateScanRecordStatus = useCallback((id: string, resi: string, status: ScanStatus, additionalData: Partial<ScanRecord> = {}) => {
    const now = new Date();
    const newRec: ScanRecord = {
      id, resi: resi.trim().toUpperCase(), status, timestamp: now.getTime(),
      time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
      tanggal: now.toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric' }),
      ...additionalData
    };
    dispatch({ type: 'UPSERT_RECORD', payload: newRec });
    if (isSupabaseConfigured) db.upsertRecord(newRec);
    pushToWebhook(newRec);
    return newRec;
  }, [pushToWebhook]);

  // ==========================================
  // 4. WEBCAM ASYNC VIDEO STREAMING ARCHITECTURE
  // ==========================================
  const startCanvasRecording = useCallback((resi: string) => {
    try {
      const stream = streamRef.current;
      if (!stream) return;
      let options = { mimeType: 'video/webm;codecs=vp9' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) options = { mimeType: 'video/webm' };

      const mediaRecorder = new MediaRecorder(stream, options);
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
      mediaRecorder.onstop = () => {
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.style.display = 'none'; a.href = url;
          a.download = `PACKING_${resi}.webm`; document.body.appendChild(a); a.click();
          setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
        }
      };
      mediaRecorder.start(100);
      recordersRef.current[resi] = mediaRecorder;
      chunksRef.current[resi] = chunks;
    } catch (e) { console.error('Perekaman hardware webcam gagal:', e); }
  }, []);

  const stopCanvasRecording = useCallback((resi: string) => {
    const recorder = recordersRef.current[resi];
    if (recorder && recorder.state !== 'inactive') {
      try { recorder.stop(); } catch (err) { console.error(err); }
    }
  }, []);

  const finishPackingSession = useCallback((resi: string) => {
    const rawBarcode = resi.trim().toUpperCase();
    const existingRec = state.records.find(r => r.resi === rawBarcode && r.noPesanan);
    const matchedInfo = matchExpedition(rawBarcode);

    updateScanRecordStatus(`pack_${rawBarcode}`, rawBarcode, 'PACKING_SELESAI', {
      expedition: matchedInfo.expeditionName + ' - ' + matchedInfo.serviceType,
      noPesanan: existingRec?.noPesanan || undefined,
      products: existingRec?.products || undefined
    });

    stopCanvasRecording(rawBarcode);
    setActiveRecordings(prev => { const copy = { ...prev }; delete copy[rawBarcode]; return copy; });
    triggerAlert(`Selesai packing & simpan video bukti: ${rawBarcode}`, 'success');
    speakText(`Selesai packing resi ${rawBarcode.slice(-4)}`);
  }, [state.records, matchExpedition, updateScanRecordStatus, stopCanvasRecording, triggerAlert, speakText]);

  // Workflow Core Scanner
  const processBarcodeScan = useCallback((barcodeInput: string) => {
    const rawBarcode = barcodeInput.trim().toUpperCase();
    if (!rawBarcode) return;

    if (rawBarcode.length >= 24) {
      triggerAlert(`⚠️ SCAN DITOLAK! Barcode tidak valid: ${rawBarcode}`, 'error');
      setTwentyFourDigitWarning({ resi: rawBarcode, message: 'Panjang barcode terdeteksi 24 digit atau lebih. Otomatis ditolak pencegahan input salah.' });
      return;
    }

    const shopeeOrderInfo = getShopeeOrder(rawBarcode);
    const isOrderCancelled = state.cancelledResiList.some(c => c.toLowerCase() === rawBarcode.toLowerCase() || (shopeeOrderInfo?.noPesanan && c.toLowerCase() === shopeeOrderInfo.noPesanan.toLowerCase()));

    if (isOrderCancelled) {
      triggerAlert(`⚠️ PERINGATAN ORDER BATAL/CANCEL! Resi: ${rawBarcode}`, 'error');
      speakText(`Peringatan! Pesanan Batal!`);
      setCancelWarning({ resi: rawBarcode, message: `Resi/Order ${rawBarcode} ini telah dibatalkan! JANGAN DIPROSES.` });
      return;
    }

    const matchedInfo = matchExpedition(rawBarcode);

    if (activeTab === 'PRINT') {
      const id = `print_${rawBarcode}`;
      const existingPrint = state.records.find(r => r.id === id || (r.resi === rawBarcode && r.status === 'PRINTED'));
      if (existingPrint) {
        triggerAlert(`Resi ${rawBarcode} sudah diprint sebelumnya!`, 'double-scan');
        setDoubleScanWarning({ resi: rawBarcode, message: 'Resi ini duplikat scan cetak.', record: existingPrint });
        return;
      }
      const res = updateScanRecordStatus(id, rawBarcode, 'PRINTED', { expedition: matchedInfo.expeditionName + ' - ' + matchedInfo.serviceType });
      setLatestScanResult({ resi: rawBarcode, expeditionName: matchedInfo.expeditionName, serviceType: matchedInfo.serviceType, status: 'PRINTED', timestamp: res.timestamp, time: res.time, tanggal: res.tanggal });
      triggerAlert(`Status Cetak Berhasil: ${rawBarcode}`, 'success');
    } else if (activeTab === 'PACKING') {
      if (!isCameraActive) { triggerAlert('⚠️ Nyalakan kamera webcam terlebih dahulu!', 'warning'); return; }
      if (!activeRecordings[rawBarcode]) {
        const id = `pack_${rawBarcode}`;
        const existingProcessed = state.records.find(r => (r.id === id && r.status === 'PACKING_SELESAI') || (r.resi === rawBarcode && r.status === 'PICKED_UP'));
        if (existingProcessed) {
          triggerAlert(`Resi ${rawBarcode} sudah dipacking/diserahkan ke kurir!`, 'double-scan');
          setDoubleScanWarning({ resi: rawBarcode, message: 'Barcode terdeteksi double scan.', record: existingProcessed });
          return;
        }
        setActiveRecordings(prev => ({ ...prev, [rawBarcode]: { startTime: Date.now(), timer: 0 } }));
        const existingRec = state.records.find(r => r.resi === rawBarcode && r.noPesanan);
        const res = updateScanRecordStatus(id, rawBarcode, 'SCANNING', { expedition: matchedInfo.expeditionName + ' - ' + matchedInfo.serviceType, noPesanan: existingRec?.noPesanan || undefined, products: existingRec?.products || undefined });
        setLatestScanResult({ resi: rawBarcode, expeditionName: matchedInfo.expeditionName, serviceType: matchedInfo.serviceType, status: 'SCANNING', timestamp: res.timestamp, time: res.time, tanggal: res.tanggal });
        startCanvasRecording(rawBarcode);
        triggerAlert(`Mulai merekam QC packing: ${rawBarcode}`, 'success');
        speakText(`Mulai packing`);
      } else {
        finishPackingSession(rawBarcode);
      }
    } else if (activeTab === 'PICKUP') {
      if (!selectedCourierId) { triggerAlert('⚠️ Pilih Driver Kurir terlebih dahulu!', 'warning'); return; }
      const courier = state.couriers.find(c => c.id === selectedCourierId);
      const id = `pickup_${rawBarcode}`;
      if (state.records.some(r => r.id === id || (r.resi === rawBarcode && r.status === 'PICKED_UP'))) {
        triggerAlert(`Resi ${rawBarcode} sudah dipickup harian!`, 'double-scan'); return;
      }
      const res = updateScanRecordStatus(id, rawBarcode, 'PICKED_UP', { expedition: matchedInfo.expeditionName + ' - ' + matchedInfo.serviceType, courierCode: courier?.code });
      setLatestScanResult({ resi: rawBarcode, expeditionName: matchedInfo.expeditionName, serviceType: matchedInfo.serviceType, status: 'PICKED_UP', courier, timestamp: res.timestamp, time: res.time, tanggal: res.tanggal });
      triggerAlert(`Berhasil Pick Up Kurir`, 'success');
      speakText(`Masuk kurir`);
    }
  }, [activeTab, isCameraActive, state.records, state.cancelledResiList, state.couriers, selectedCourierId, activeRecordings, updateScanRecordStatus, startCanvasRecording, finishPackingSession, triggerAlert, speakText, getShopeeOrder, matchExpedition]);

  // CSV Exporter Core Logic
  const handleCSVDownload = useCallback((mode: 'flat' | 'pivot') => {
    let content = ''; const now = new Date();
    const filename = `Log_${mode === 'flat' ? 'Detail' : 'Pivot'}_Verell_${now.getDate()}-${now.getMonth()+1}-${now.getFullYear()}.csv`;
    if (mode === 'flat') {
      content = 'ID Log,Nomor Resi,Tanggal Scan,Waktu Scan,Status Aktivitas,Model Expedisi,Kode Kurir,No Pesanan\n';
      state.records.forEach(r => { content += `"${r.id}","${r.resi}","${r.tanggal}","${r.time}","${r.status}","${r.expedition || '-'}","${r.courierCode || '-'}","${r.noPesanan || '-'}"\n`; });
    } else {
      content = 'Nomor Resi,Tanggal Update,Waktu Cetak (PRINT),Waktu Packing (PACK),Waktu Serah (PICKUP),Status Akhir\n';
      const pivot: Record<string, any> = {};
      state.records.forEach(r => {
        const k = r.resi.trim().toUpperCase();
        if (!pivot[k]) pivot[k] = { resi: k, tanggal: r.tanggal, print: '-', pack: '-', pickup: '-', status: r.status };
        if (r.status === 'PRINTED') pivot[k].print = r.time;
        if (r.status === 'SCANNING' || r.status === 'PACKING_SELESAI') pivot[k].pack = r.time;
        if (r.status === 'PICKED_UP') pivot[k].pickup = r.time;
      });
      Object.values(pivot).forEach(p => { content += `"${p.resi}","${p.tanggal}","${p.print}","${p.pack}","${p.pickup}","${p.status}"\n`; });
    }
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.setAttribute('download', filename); document.body.appendChild(link);
    link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
    triggerAlert('Berhasil mengekspor tabel log CSV.', 'success');
  }, [state.records, triggerAlert]);

  const handleCopyClipboard = useCallback((text: string, alertMsg?: string) => {
    navigator.clipboard.writeText(text); if (alertMsg) triggerAlert(alertMsg, 'info');
  }, [triggerAlert]);

  // ==========================================
  // 5. MEMOIZED HIGH-PERFORMANCE MEMORY SELECTORS
  // ==========================================
  const totalCount = useMemo(() => new Set(state.records.map(r => r.resi.trim().toUpperCase())).size, [state.records]);

  const todayStats = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'numeric', year: 'numeric' });
    const packedSet = new Set<string>(); const pickedUpSet = new Set<string>();
    const todayUniqueSet = new Set<string>(); const latestStatusMap = new Map<string, string>();

    state.records.slice().reverse().forEach(r => {
      const k = r.resi.trim().toUpperCase();
      if (r.tanggal === todayStr) {
        todayUniqueSet.add(k); latestStatusMap.set(k, r.status);
        if (r.status === 'PACKING_SELESAI') packedSet.add(k);
        if (r.status === 'PICKED_UP') pickedUpSet.add(k);
      }
    });

    let pendingCount = 0; latestStatusMap.forEach((status) => { if (status === 'PRINTED') pendingCount++; });
    const todaySize = todayUniqueSet.size;

    return { printed: todaySize, packed: packedSet.size, pickedUp: pickedUpSet.size, totalToday: todaySize, pending: pendingCount };
  }, [state.records]);

  const displayLogs = useMemo(() => {
    const pivot: Record<string, any> = {};
    state.records.slice().reverse().forEach(r => {
      const k = r.resi.trim().toUpperCase();
      if (!pivot[k]) pivot[k] = { resi: k, tanggal: r.tanggal, time: r.time, printTime: '-', packTime: '-', pickupTime: '-', status: r.status, timestamp: r.timestamp };
      if (r.timestamp > pivot[k].timestamp) { pivot[k].timestamp = r.timestamp; pivot[k].status = r.status; pivot[k].tanggal = r.tanggal; pivot[k].time = r.time; }
      if (r.status === 'PRINTED') pivot[k].printTime = r.time;
      if (r.status === 'SCANNING' || r.status === 'PACKING_SELESAI') pivot[k].packTime = r.time;
      if (r.status === 'PICKED_UP') pivot[k].pickupTime = r.time;
    });
    return Object.values(pivot).sort((a, b) => b.timestamp - a.timestamp);
  }, [state.records]);

  return (
    <AppContext.Provider value={{
      ...state, setRecords: setRecordsWrapper,
      selectedCourierId, setSelectedCourierId, latestScanResult, setLatestScanResult,
      activeTab, setActiveTab, barcodeValue, setBarcodeValue, webhookUrl, setWebhookUrl,
      alert, setAlert, activeRecordings, setActiveRecordings, showExpeditionModal, setShowExpeditionModal,
      showCourierModal, setShowCourierModal, showSettingsModal, setShowSettingsModal, newExpName, setNewExpName,
      newExpPrefix, setNewExpPrefix, newExpMethodType, setNewExpMethodType, newExpCode, setNewExpCode,
      editingExpeditionId, setEditingExpeditionId, newCourierName, setNewCourierName, newCourierPhone, setNewCourierPhone,
      newCourierVehicle, setNewCourierVehicle, newCourierCode, setNewCourierCode, dbSyncState, setDbSyncState,
      offlinePendingCount, setOfflinePendingCount, showSupabaseModal, setShowSupabaseModal, useSpeechAssistant, setUseSpeechAssistant,
      customDoubleScanSound, setCustomDoubleScanSound, appBackgroundOpacity, setAppBackgroundOpacity, cancelInputVal, setCancelInputVal,
      cancelSearchQuery, setCancelSearchQuery, setCancelledResiList: setCancelledResiListWrapper, returnBarcode, setReturnBarcode, returnCourierId, setReturnCourierId,
      returnCondition, setReturnCondition, returnReason, setReturnReason, returnSearchQuery, setReturnSearchQuery,
      shopeeHoleMode, setShopeeHoleMode, twentyFourDigitWarning, setTwentyFourDigitWarning, cancelWarning, setCancelWarning,
      doubleScanWarning, setDoubleScanWarning, triggerAlert, speakText, playBeep, matchExpedition, getShopeeOrder,
      updateScanRecordStatus, processBarcodeScan, finishPackingSession, pushToWebhook, handleCSVDownload, handleCopyClipboard,
      displayLogs, totalCount, todayStats, logDisplayMode, setLogDisplayMode, isCameraActive, setIsCameraActive,
      cameraMode, setCameraMode, availableCameras, setAvailableCameras, selectedCameraId, setSelectedCameraId,
      cameraSize, setCameraSize, cameraAspect, setCameraAspect, hideCameraSettings, setHideCameraSettings,
      streamRef, videoRef, canvasRef, recordersRef, chunksRef, startCanvasRecording, stopCanvasRecording
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used under AppProvider');
  return context;
};