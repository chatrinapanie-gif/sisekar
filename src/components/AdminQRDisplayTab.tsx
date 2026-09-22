import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  QrCode, 
  RefreshCw, 
  Clock, 
  Printer, 
  Maximize2, 
  Copy, 
  Check, 
  ShieldCheck, 
  Sparkles,
  Smartphone,
  ExternalLink,
  CheckCircle2,
  X
} from 'lucide-react';
import { generateQRPayload, generateShareableQRLink, formatRemainingTime, DEFAULT_SESSION_DURATION_MS } from '../services/qrSessionService';
import { AppConfig } from '../types';

interface AdminQRDisplayTabProps {
  config: AppConfig;
  onUpdateConfigUrl: (url: string) => void;
}

export const AdminQRDisplayTab: React.FC<AdminQRDisplayTabProps> = ({
  config,
  onUpdateConfigUrl,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<number>(Date.now() + DEFAULT_SESSION_DURATION_MS);
  const [remainingText, setRemainingText] = useState<string>('02:00:00');
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [isKioskFullscreen, setIsKioskFullscreen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Generate QR Code saat pertama kali dimuat atau saat URL berubah / di-refresh
  const generateNewQR = async () => {
    setIsGenerating(true);
    const targetUrl = config.appsScriptUrl || 'https://script.google.com/macros/s/RSUD_AERAMO/exec';
    const newExpiresAt = Date.now() + DEFAULT_SESSION_DURATION_MS;
    setExpiresAt(newExpiresAt);
    setIsExpired(false);

    try {
      // Buat link lengkap yang bisa di-scan dari kamera bawaan HP (Android / iOS)
      const shareableLink = generateShareableQRLink(targetUrl);
      
      const dataUrl = await QRCode.toDataURL(shareableLink, {
        width: 450,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });

      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('Gagal membuat QR code:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    generateNewQR();
  }, [config.appsScriptUrl]);

  // Live Timer Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      const { formatted, isExpired: expired } = formatRemainingTime(expiresAt);
      setRemainingText(formatted);
      setIsExpired(expired);
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyDirectLink = () => {
    const targetUrl = config.appsScriptUrl || '';
    const shareableLink = generateShareableQRLink(targetUrl);
    navigator.clipboard.writeText(shareableLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Banner Penjelasan Sistem QR 2 Jam */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-300 shrink-0 mt-0.5">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
              <span>QR Code Akses Pasien (Masa Berlaku 2 Jam)</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 text-[10px] font-semibold">
                Auto-Expire
              </span>
            </h3>
            <p className="text-xs text-blue-100/80 leading-relaxed mt-0.5">
              Pasien cukup scan QR Code ini menggunakan <strong>Kamera HP bawaan</strong> atau <strong>Scanner di aplikasi</strong>. Sesi survei langsung aktif selama 2 jam, setelah itu otomatis kadaluarsa demi integritas data.
            </p>
          </div>
        </div>

        <button
          onClick={generateNewQR}
          disabled={isGenerating}
          className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto shrink-0 border border-white/20"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>Reset Waktu (2 Jam)</span>
        </button>
      </div>

      {/* Konten Utama: Preview QR Card & Opsi Petugas */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
        
        {/* Kolom Kiri: Standee Card QR (Cocok Ditampilkan di Meja Pendaftaran) */}
        <div className="md:col-span-6 bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
          
          {/* Header Standee */}
          <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center gap-2 text-left">
              <div className="w-7 h-7 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-xs">
                RA
              </div>
              <div>
                <p className="font-bold text-xs text-slate-900 leading-tight">RSUD AERAMO</p>
                <p className="text-[10px] text-slate-500">Survei Kepuasan Pasien</p>
              </div>
            </div>

            {/* Countdown Badge */}
            <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 border ${
              isExpired 
                ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' 
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{isExpired ? 'Kadaluarsa' : remainingText}</span>
            </div>
          </div>

          {/* QR Image */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 relative group">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code Akses Survei RSUD Aeramo"
                className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
                Membuat QR Code...
              </div>
            )}

            {isExpired && (
              <div className="absolute inset-0 bg-slate-950/75 rounded-2xl flex flex-col items-center justify-center text-white p-4 space-y-2">
                <p className="font-bold text-sm">QR Code Telah Kadaluarsa</p>
                <button
                  onClick={generateNewQR}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Buat QR Baru (2 Jam)</span>
                </button>
              </div>
            )}
          </div>

          {/* Petunjuk Bawah Standee */}
          <div className="mt-3 space-y-1">
            <p className="text-xs font-bold text-slate-800 flex items-center justify-center gap-1">
              <Smartphone className="w-3.5 h-3.5 text-blue-700" />
              <span>Scan Menggunakan Kamera HP Anda</span>
            </p>
            <p className="text-[11px] text-slate-500 max-w-xs">
              Membuka form survei secara otomatis &amp; terhubung langsung ke sistem evaluasi mutu RSUD Aeramo.
            </p>
          </div>
        </div>

        {/* Kolom Kanan: Alat Tindakan & Kontrol Petugas */}
        <div className="md:col-span-6 flex flex-col justify-between space-y-3">
          
          <div className="bg-slate-50 p-4.5 rounded-3xl border border-slate-200 space-y-3.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Aksi &amp; Tampilan Petugas</span>
            </h4>

            <div className="space-y-2">
              {/* Tombol Kiosk Mode Fullscreen */}
              <button
                type="button"
                onClick={() => setIsKioskFullscreen(true)}
                className="w-full p-3 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs transition flex items-center justify-between shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <Maximize2 className="w-4 h-4" />
                  <div className="text-left">
                    <p>Mode Layar Penuh (Kiosk Meja Pendaftaran)</p>
                    <p className="text-[10px] text-blue-200 font-normal">Tampilkan di tablet / layar meja agar pasien langsung scan</p>
                  </div>
                </div>
                <span className="text-xs">&gt;</span>
              </button>

              {/* Tombol Cetak Standee */}
              <button
                type="button"
                onClick={handlePrint}
                className="w-full p-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs transition flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-slate-600" />
                  <div className="text-left">
                    <p>Cetak Lembar QR Standee (Print)</p>
                    <p className="text-[10px] text-slate-500 font-normal">Cetak untuk ditaruh di akrilik meja poli &amp; rawat inap</p>
                  </div>
                </div>
                <span className="text-xs">&gt;</span>
              </button>

              {/* Tombol Salin Tautan Langsung */}
              <button
                type="button"
                onClick={handleCopyDirectLink}
                className="w-full p-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs transition flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                  <div className="text-left">
                    <p>{copiedLink ? 'Tautan Berhasil Disalin!' : 'Salin Link QR (Kirim via WA Pasien)'}</p>
                    <p className="text-[10px] text-slate-500 font-normal">Link dengan token aktif 2 jam otomatis</p>
                  </div>
                </div>
                <span className="text-xs">&gt;</span>
              </button>
            </div>

            {/* Info Status Google Apps Script Terkait */}
            <div className="p-3 rounded-xl bg-white border border-slate-200 text-[11px] space-y-1">
              <span className="text-slate-500 font-medium">Target URL yang Ditanamkan dalam QR:</span>
              <p className="font-mono text-slate-700 truncate text-[10px] bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                {config.appsScriptUrl || 'Default Internal Proxy RSUD Aeramo'}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              <strong>Keuntungan Sistem QR 2 Jam:</strong> Pasien tidak perlu mengisi konfigurasi apa pun. Begitu di-scan, form langsung terhubung ke Google Sheet RSUD Aeramo dan otomatis mengunci diri setelah 2 jam untuk mencegah pengisian ganda atau spam.
            </p>
          </div>

        </div>

      </div>

      {/* MODAL FULLSCREEN KIOSK MODE (Untuk Diletakkan di Meja Pendaftaran) */}
      {isKioskFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-white animate-in fade-in duration-200">
          
          {/* Tombol Tutup Fullscreen */}
          <button
            onClick={() => setIsKioskFullscreen(false)}
            className="absolute top-6 right-6 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition border border-white/20"
          >
            <X className="w-4 h-4" />
            <span>Tutup Layar Penuh</span>
          </button>

          <div className="max-w-md w-full bg-white text-slate-900 p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center space-y-4">
            
            {/* Kop Kiosk */}
            <div className="border-b border-slate-200 pb-4 w-full">
              <h2 className="text-lg font-black tracking-tight text-blue-900">RSUD AERAMO</h2>
              <p className="text-xs text-slate-600 font-medium">Pemerintah Kabupaten Nagekeo</p>
              <p className="text-[11px] text-blue-700 font-bold uppercase tracking-wider mt-1">
                Survei Evaluasi Kepuasan Pasien (SISEKAR)
              </p>
            </div>

            {/* Gambar QR Besar */}
            <div className="p-4 bg-slate-50 rounded-3xl border-2 border-slate-200 shadow-inner">
              <img
                src={qrDataUrl}
                alt="QR Code Kiosk"
                className="w-64 h-64 sm:w-72 sm:h-72 object-contain rounded-2xl"
              />
            </div>

            {/* Countdown Banner */}
            <div className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
              isExpired 
                ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse' 
                : 'bg-blue-100 text-blue-800 border-blue-300'
            }`}>
              <Clock className="w-4 h-4" />
              <span>Sisa Waktu QR: {remainingText}</span>
            </div>

            {/* Instruksi Pasien */}
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900">
                Silakan Scan QR Menggunakan Kamera HP Anda
              </p>
              <p className="text-xs text-slate-500">
                Sesi pengisian otomatis aktif selama 2 jam setelah di-scan.
              </p>
            </div>

            <button
              onClick={generateNewQR}
              className="mt-2 text-xs text-blue-700 font-semibold hover:underline flex items-center justify-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Waktu 2 Jam Sekarang</span>
            </button>

          </div>
        </div>
      )}
    </div>
  );
};
