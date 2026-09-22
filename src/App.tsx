import './preamble';
import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { SurveyForm } from './components/SurveyForm';
import { PatientGuideView } from './components/PatientGuideView';
import { AdminPortalModal } from './components/AdminPortalModal';
import { QRScannerModal } from './components/QRScannerModal';
import { 
  loadAppConfig, 
  saveAppConfig, 
  loadSubmissions, 
  loadPendingQueue, 
  syncAllPendingQueue,
  fetchServerConfig
} from './services/sheetsService';
import { 
  getActiveQRSession, 
  parseAndActivateQRSession, 
  formatRemainingTime, 
  clearQRSession 
} from './services/qrSessionService';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { AppConfig, SurveySubmission, QRSession } from './types';
import { CheckCircle2, AlertCircle, Lock, ShieldCheck, QrCode } from 'lucide-react';
import { initializeClientSecurityProtections } from './utils/security';

export default function App() {
  const isOnline = useOnlineStatus();
  const [config, setConfig] = useState<AppConfig>(loadAppConfig());
  const [submissions, setSubmissions] = useState<SurveySubmission[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'survey' | 'guide'>('survey');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Sesi QR Pasien (Masa berlaku 2 jam)
  const [activeQRSession, setActiveQRSession] = useState<QRSession | null>(() => getActiveQRSession());
  const [qrRemainingText, setQrRemainingText] = useState<string>('02:00:00');
  const [isQRExpired, setIsQRExpired] = useState<boolean>(false);

  // Live timer untuk mengecek dan mengupdate sisa waktu 2 jam
  useEffect(() => {
    if (!activeQRSession) {
      setQrRemainingText('00:00:00');
      setIsQRExpired(false);
      return;
    }

    const checkTimer = () => {
      const { formatted, isExpired } = formatRemainingTime(activeQRSession.expiresAt);
      setQrRemainingText(formatted);
      setIsQRExpired(isExpired);

      if (isExpired) {
        clearQRSession();
        setActiveQRSession(null);
        showToast('error', 'Waktu sesi survei (2 jam) telah habis. Silakan scan ulang QR Code petugas.');
      }
    };

    checkTimer();
    const interval = setInterval(checkTimer, 1000);
    return () => clearInterval(interval);
  }, [activeQRSession]);

  // Sinkronisasi otomatis konfigurasi dari server dan deteksi scan QR dari link HP bawaan (?qr=...)
  useEffect(() => {
    let isMounted = true;
    const syncServerConfig = async () => {
      // 1. Deteksi Scan QR dari Kamera HP bawaan (?qr=... atau ?scriptUrl=...)
      try {
        const fullHref = window.location.href;
        if (fullHref.includes('?qr=') || fullHref.includes('?scriptUrl=') || fullHref.includes('?url=')) {
          const res = parseAndActivateQRSession(fullHref);
          if (res.success && res.session) {
            if (isMounted) {
              setActiveQRSession(res.session);
              const updatedConfig: AppConfig = { ...loadAppConfig(), appsScriptUrl: res.session.appsScriptUrl };
              setConfig(updatedConfig);
              saveAppConfig(updatedConfig);
              setToast({ type: 'success', msg: '✓ Sesi QR Survei Aktif (Batas Waktu: 2 Jam)' });
            }
            // Bersihkan query URL agar rapi
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
          }
        }
      } catch (err) {
        console.warn('Gagal membaca parameter QR Code:', err);
      }

      // 2. Ambil konfigurasi global yang tersimpan di server jika ada
      const serverConfig = await fetchServerConfig();
      if (isMounted && serverConfig && serverConfig.appsScriptUrl) {
        setConfig(serverConfig);
      }
    };
    syncServerConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  const refreshData = useCallback(() => {
    const list = loadSubmissions();
    const pending = loadPendingQueue();
    setSubmissions(list);
    setPendingCount(pending.length);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Aktifkan Proteksi Cyber Security Anti-Inspeksi Kiosk (Blokir F12, DevTools, Klik Kanan)
  useEffect(() => {
    const cleanup = initializeClientSecurityProtections();
    return cleanup;
  }, []);

  // Otomatis sinkronisasi antrean saat koneksi online pulih
  useEffect(() => {
    const effectiveUrl = activeQRSession?.appsScriptUrl || config.appsScriptUrl;
    if (isOnline && pendingCount > 0 && effectiveUrl) {
      handleSyncQueue();
    }
  }, [isOnline, pendingCount, config.appsScriptUrl, activeQRSession]);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSyncQueue = async () => {
    const effectiveUrl = activeQRSession?.appsScriptUrl || config.appsScriptUrl;
    if (!effectiveUrl || effectiveUrl.trim() === '') {
      return;
    }

    setIsSyncing(true);
    const res = await syncAllPendingQueue(effectiveUrl);
    setIsSyncing(false);
    refreshData();

    if (res.syncedCount > 0) {
      showToast('success', `${res.syncedCount} survei berhasil disinkronkan ke Google Sheet!`);
    } else if (res.failedCount > 0) {
      showToast('error', 'Gagal menyinkronkan beberapa survei.');
    }
  };

  const handleSaveConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    saveAppConfig(newConfig);
    showToast('success', 'Pengaturan berhasil diperbarui!');
  };

  const handleSessionActivated = (session: QRSession) => {
    setActiveQRSession(session);
    const updated: AppConfig = { ...config, appsScriptUrl: session.appsScriptUrl };
    setConfig(updated);
    saveAppConfig(updated);
    showToast('success', '✓ QR Code Petugas Terverifikasi! Sesi aktif selama 2 jam.');
  };

  const handleClearHistory = () => {
    if (window.confirm('Hapus seluruh riwayat survei lokal di perangkat ini? (Data di Google Sheet tetap aman)')) {
      localStorage.removeItem('sisekar_aeramo_submissions');
      localStorage.removeItem('sisekar_aeramo_pending_queue');
      refreshData();
      showToast('success', 'Riwayat lokal berhasil dibersihkan.');
    }
  };

  // Gunakan URL aktif dari QR session jika ada, atau fallback ke config
  const effectiveAppConfig: AppConfig = {
    ...config,
    appsScriptUrl: activeQRSession?.appsScriptUrl || config.appsScriptUrl
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      
      {/* Header — HANYA Menampilkan Tab Formulir Survei dan Panduan Pengisian */}
      <Header
        config={effectiveAppConfig}
        isOnline={isOnline}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-4 duration-200">
          <div className={`px-4 py-3 rounded-2xl shadow-xl border text-xs sm:text-sm font-semibold flex items-center gap-2.5 max-w-sm ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-red-600 text-white border-red-500'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-200" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-red-200" />
            )}
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Konten Utama Pasien */}
      <main className="flex-1">
        {activeTab === 'survey' ? (
          <SurveyForm
            config={effectiveAppConfig}
            isOnline={isOnline}
            onSubmissionSuccess={refreshData}
            onOpenGuide={() => setActiveTab('guide')}
            activeQRSession={activeQRSession}
            onOpenQRScanner={() => setIsScannerOpen(true)}
            qrRemainingText={qrRemainingText}
            isQRExpired={isQRExpired}
          />
        ) : (
          <PatientGuideView
            onStartSurvey={() => setActiveTab('survey')}
          />
        )}
      </main>

      {/* Footer Bersih dengan Akses Petugas Tersembunyi */}
      <footer className="bg-white border-t border-slate-200/80 py-5 px-4 text-xs text-slate-500 mt-auto print:hidden">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <span className="font-bold text-slate-800">RSUD Aeramo</span>
            <span className="text-slate-400 mx-1.5">•</span>
            <span>Kabupaten Nagekeo</span>
            <span className="text-slate-400 mx-1.5">•</span>
            <span className="text-slate-500 font-medium">SISEKAR Pelayanan</span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Tombol Cepat Scan QR Pasien */}
            <button
              onClick={() => setIsScannerOpen(true)}
              className="inline-flex items-center gap-1.5 text-[11px] text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition font-bold"
              title="Scan QR Code Petugas RSUD Aeramo"
            >
              <QrCode className="w-3.5 h-3.5 text-blue-700" />
              <span>Scan QR Petugas</span>
            </button>

            <span 
              className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80 font-medium select-none"
              title="Sistem Keamanan Siber Aktif: Anti-Inspeksi Kiosk &amp; Webhook Terenkripsi"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sistem Terlindungi</span>
            </span>

            {/* Tombol Akses Petugas / Admin (Hanya untuk staf rumah sakit) */}
            <button
              onClick={() => setIsAdminModalOpen(true)}
              id="btn-admin-access"
              className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-blue-700 hover:bg-blue-50 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-blue-200 transition"
              title="Akses khusus petugas RSUD Aeramo"
            >
              <Lock className="w-3 h-3" />
              <span>Akses Petugas</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Modal Scanner QR Kamera Pasien */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSessionActivated={handleSessionActivated}
      />

      {/* Modal Admin & Riwayat (Dilindungi PIN, tidak terlihat pasien) */}
      <AdminPortalModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
        submissions={submissions}
        pendingCount={pendingCount}
        isSyncing={isSyncing}
        onSyncAll={handleSyncQueue}
        onClearHistory={handleClearHistory}
        isOnline={isOnline}
      />

    </div>
  );
}

