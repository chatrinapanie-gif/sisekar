import './preamble';
import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { SurveyForm } from './components/SurveyForm';
import { PatientGuideView } from './components/PatientGuideView';
import { ThankYouLockedView } from './components/ThankYouLockedView';
import { PatientPinGate } from './components/PatientPinGate';
import { AdminPortalModal } from './components/AdminPortalModal';
import { RoseWatermarkBackground } from './components/RoseWatermark';
import { 
  loadAppConfig, 
  saveAppConfig, 
  loadSubmissions, 
  loadPendingQueue, 
  syncAllPendingQueue,
  fetchServerConfig,
  getOneTimeLock,
  clearOneTimeLock,
  getActiveSessionPatientPin,
  setActiveSessionPatientPin
} from './services/sheetsService';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { AppConfig, SurveySubmission, OneTimeSubmissionLock } from './types';
import { CheckCircle2, AlertCircle, Lock, ShieldCheck } from 'lucide-react';
import { initializeClientSecurityProtections } from './utils/security';

export default function App() {
  const isOnline = useOnlineStatus();
  const [config, setConfig] = useState<AppConfig>(loadAppConfig());
  const [submissions, setSubmissions] = useState<SurveySubmission[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'survey' | 'guide'>('survey');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  
  // Status Kunci Satu Kali Pakai (One-Time Submission Access Lock)
  const [oneTimeLock, setOneTimeLock] = useState<OneTimeSubmissionLock | null>(() => getOneTimeLock());

  // Status PIN Akses Pasien yang Terverifikasi
  const [verifiedPatientPin, setVerifiedPatientPin] = useState<string | null>(() => getActiveSessionPatientPin());
  const [initialUrlPin, setInitialUrlPin] = useState<string>('');

  // Sinkronisasi otomatis konfigurasi dari server & deteksi parameter link pasien (?pin=...)
  useEffect(() => {
    let isMounted = true;
    const syncServerConfig = async () => {
      // 1. Deteksi Parameter PIN Pasien jika dibagikan via Link / WhatsApp (?pin=123456)
      try {
        const params = new URLSearchParams(window.location.search);
        const pinParam = params.get('pin') || params.get('token');
        if (pinParam && pinParam.trim()) {
          const cleanPin = pinParam.trim().replace(/\D/g, '');
          if (cleanPin.length >= 4) {
            setInitialUrlPin(cleanPin);
          }
        }
      } catch (err) {
        console.warn('Gagal membaca parameter pin:', err);
      }

      // 2. Deteksi Tautan Aktivasi Cepat Google Apps Script jika ada parameter ?scriptUrl=
      try {
        const params = new URLSearchParams(window.location.search);
        const paramUrl = params.get('scriptUrl') || params.get('url');
        if (paramUrl && paramUrl.startsWith('https://script.google.com')) {
          const cleanParamUrl = paramUrl.trim();
          const currentConfig = loadAppConfig();
          const updated: AppConfig = { ...currentConfig, appsScriptUrl: cleanParamUrl };
          if (isMounted) {
            setConfig(updated);
            saveAppConfig(updated);
            setToast({ type: 'success', msg: '✓ URL Google Apps Script otomatis aktif dari tautan!' });
          }
          // Simpan permanen ke server
          fetch('/api/admin/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ appsScriptUrl: cleanParamUrl, pin: '1987' }),
          }).catch(() => {});
          return;
        }
      } catch (err) {
        console.warn('Gagal membaca parameter tautan:', err);
      }

      // 3. Ambil konfigurasi global yang tersimpan di server jika ada
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
    setOneTimeLock(getOneTimeLock());
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
    if (isOnline && pendingCount > 0 && config.appsScriptUrl) {
      handleSyncQueue();
    }
  }, [isOnline, pendingCount, config.appsScriptUrl]);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSyncQueue = async () => {
    if (!config.appsScriptUrl || config.appsScriptUrl.trim() === '') {
      return;
    }

    setIsSyncing(true);
    const res = await syncAllPendingQueue(config.appsScriptUrl);
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

  const handleClearHistory = () => {
    if (window.confirm('Hapus seluruh riwayat survei lokal di perangkat ini? (Data di Google Sheet tetap aman)')) {
      localStorage.removeItem('sisekar_aeramo_submissions');
      localStorage.removeItem('sisekar_aeramo_pending_queue');
      refreshData();
      showToast('success', 'Riwayat lokal berhasil dibersihkan.');
    }
  };

  // Handler saat PIN pasien berhasil diverifikasi
  const handlePinVerified = (token: any, pinString: string) => {
    setVerifiedPatientPin(pinString);
    setActiveSessionPatientPin(pinString);
    setActiveTab('survey');
    showToast('success', `✓ PIN ${pinString} terverifikasi! Selamat mengisi survei.`);
  };

  // Handler saat survei berhasil disubmit oleh pasien
  const handleSubmissionSuccess = (submission: SurveySubmission) => {
    refreshData();
    setVerifiedPatientPin(null);
    setActiveSessionPatientPin(null);
    setOneTimeLock({
      isSubmitted: true,
      submissionId: submission.id,
      submittedAt: submission.timestamp,
      namaPasien: submission.namaPasien,
      jenisLayanan: submission.jenisLayanan,
      mutuLayanan: submission.mutuLayanan,
      ikmScore: submission.ikmScore,
      usedPin: submission.patientPin,
    });
    showToast('success', '✓ Survei berhasil terkirim! Akses formulir telah ditutup otomatis.');
  };

  // Handler persiapan pengisian untuk pasien baru dengan PIN berbeda
  const handleNewPatientPinSession = () => {
    clearOneTimeLock();
    setOneTimeLock(null);
    setVerifiedPatientPin(null);
    setActiveSessionPatientPin(null);
    setActiveTab('survey');
    showToast('success', 'Silakan masukkan PIN akses pasien baru.');
  };

  // Handler pembukaan kunci oleh petugas / admin rumah sakit
  const handleUnlockDevice = () => {
    clearOneTimeLock();
    setOneTimeLock(null);
    setVerifiedPatientPin(null);
    setActiveSessionPatientPin(null);
    setActiveTab('survey');
    setIsAdminModalOpen(false);
    showToast('success', '✓ Kunci akses dibuka. Formulir survei baru siap digunakan!');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col relative">
      
      {/* Latar Belakang Watermark Mawar Elegan */}
      <RoseWatermarkBackground />

      {/* Header — Menampilkan Info RSUD Aeramo & Status Jaringan */}
      <Header
        config={config}
        isOnline={isOnline}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDeviceLocked={!!oneTimeLock}
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
        {oneTimeLock ? (
          /* TAMPILAN TANDA TERIMA & KUNCI AKSES SETELAH PENGISIAN (ONE-TIME USE) */
          <ThankYouLockedView
            lockInfo={oneTimeLock}
            onAdminUnlockRequest={() => setIsAdminModalOpen(true)}
            onNewPatientPinRequest={handleNewPatientPinSession}
          />
        ) : config.requirePatientPin && !verifiedPatientPin ? (
          /* GERBANG PIN AKSES SATU KALI PAKAI PASIEN (PATIENT PIN GATE) */
          <PatientPinGate
            onPinVerified={handlePinVerified}
            onOpenStaffLogin={() => setIsAdminModalOpen(true)}
            initialPinFromUrl={initialUrlPin}
          />
        ) : activeTab === 'survey' ? (
          /* FORMULIR SURVEI RESMI DOKUMEN RSUD AERAMO */
          <SurveyForm
            config={config}
            isOnline={isOnline}
            patientPin={verifiedPatientPin || undefined}
            onSubmissionSuccess={handleSubmissionSuccess}
            onOpenGuide={() => setActiveTab('guide')}
          />
        ) : (
          /* PANDUAN PENGISIAN */
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
            <span 
              className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80 font-medium select-none"
              title="Sistem Keamanan Siber Aktif: PIN Pasien Sekali Pakai &amp; Webhook Terenkripsi"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sistem Terlindungi PIN Pasien</span>
            </span>

            {/* Tombol Akses Petugas / Admin (Hanya untuk staf rumah sakit) */}
            <button
              onClick={() => setIsAdminModalOpen(true)}
              id="btn-admin-access"
              className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-blue-700 hover:bg-blue-50 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-blue-200 transition"
              title="Akses khusus petugas RSUD Aeramo"
            >
              <Lock className="w-3 h-3" />
              <span>Portal Petugas</span>
            </button>
          </div>
        </div>
      </footer>

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
        isDeviceLocked={!!oneTimeLock}
        onUnlockDevice={handleUnlockDevice}
      />

    </div>
  );
}

