import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { 
  Camera, 
  X, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  SwitchCamera,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { parseAndActivateQRSession } from '../services/qrSessionService';
import { QRSession } from '../types';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionActivated: (session: QRSession) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onSessionActivated,
}) => {
  const [scannerMode, setScannerMode] = useState<'camera' | 'upload'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scannerContainerId = 'qr-reader-container';

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      setScanResult(null);
      setCameraError(null);
      return;
    }

    if (scannerMode === 'camera') {
      startScanner(facingMode);
    }

    return () => {
      stopScanner();
    };
  }, [isOpen, scannerMode, facingMode]);

  const startScanner = async (facing: 'environment' | 'user') => {
    setCameraError(null);
    setScanResult(null);

    // Pastikan scanner sebelumnya berhenti
    await stopScanner();

    try {
      const html5QrCode = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCode.start(
        { facingMode: facing },
        config,
        (decodedText) => {
          handleSuccessScan(decodedText);
        },
        () => {
          // ignore frame errors while searching
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.warn('Gagal memulai scanner kamera:', err);
      setIsScanning(false);
      setCameraError(
        'Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan di browser, atau gunakan opsi "Unggah Gambar QR".'
      );
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Error saat menghentikan scanner:', e);
      }
      html5QrCodeRef.current = null;
    }
    setIsScanning(false);
  };

  const handleSuccessScan = async (decodedText: string) => {
    await stopScanner();

    // Berikan feedback getaran lembut di HP (jika didukung)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(100); } catch {}
    }

    const res = parseAndActivateQRSession(decodedText);
    if (res.success && res.session) {
      setScanResult({ success: true, message: res.message });
      setTimeout(() => {
        onSessionActivated(res.session!);
        onClose();
      }, 1200);
    } else {
      setScanResult({ success: false, message: res.message });
      // Mulai ulang scanner setelah 3 detik jika gagal
      setTimeout(() => {
        setScanResult(null);
        startScanner(facingMode);
      }, 3000);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanResult(null);
    setCameraError(null);

    try {
      const html5QrCode = new Html5Qrcode('file-qr-temp', {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });

      const decodedText = await html5QrCode.scanFile(file, true);
      handleSuccessScan(decodedText);
    } catch (err: any) {
      setScanResult({
        success: false,
        message: 'QR Code tidak terdeteksi pada gambar. Pastikan gambar QR Code jelas dan tidak buram.'
      });
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Scan QR Akses Pasien</h3>
              <p className="text-[11px] text-slate-400">RSUD Aeramo - Sesi 2 Jam</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Scanner Mode */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => setScannerMode('camera')}
            className={`flex-1 py-3 flex items-center justify-center gap-1.5 transition border-b-2 ${
              scannerMode === 'camera'
                ? 'border-blue-700 text-blue-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Kamera Langsung</span>
          </button>
          <button
            onClick={() => setScannerMode('upload')}
            className={`flex-1 py-3 flex items-center justify-center gap-1.5 transition border-b-2 ${
              scannerMode === 'upload'
                ? 'border-blue-700 text-blue-700 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Unggah Foto QR</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 flex flex-col items-center space-y-4">
          
          {scannerMode === 'camera' ? (
            <div className="w-full flex flex-col items-center space-y-3">
              <div className="relative w-full max-w-[280px] aspect-square rounded-2xl overflow-hidden bg-black border-2 border-blue-600 shadow-inner flex items-center justify-center">
                <div id={scannerContainerId} className="w-full h-full" />
                
                {/* Visual Target Frame */}
                {isScanning && !scanResult && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                    <div className="w-full h-full border-2 border-emerald-400/80 rounded-xl relative animate-pulse">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1" />
                    </div>
                  </div>
                )}
              </div>

              {cameraError ? (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2 text-left">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{cameraError}</p>
                    <button
                      onClick={() => setScannerMode('upload')}
                      className="mt-2 text-blue-700 font-bold underline text-xs"
                    >
                      Beralih ke Unggah Foto QR &gt;
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full max-w-[280px] text-[11px] text-slate-500">
                  <span>Arahkan kamera ke QR Code petugas</span>
                  <button
                    onClick={toggleCamera}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 font-semibold transition"
                    title="Ganti Kamera Depan/Belakang"
                  >
                    <SwitchCamera className="w-3.5 h-3.5" />
                    <span>Ganti</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full flex flex-col items-center space-y-4 py-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div id="file-qr-temp" className="hidden" />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-[280px] p-6 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl bg-slate-50 hover:bg-blue-50/50 flex flex-col items-center justify-center space-y-2 cursor-pointer transition text-center"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-800">Klik untuk Pilih Foto QR Code</p>
                <p className="text-[11px] text-slate-500">Pilih foto atau screenshot QR Code dari galeri HP</p>
              </div>
            </div>
          )}

          {/* Feedback Hasil Scan */}
          {scanResult && (
            <div
              className={`w-full p-3.5 rounded-2xl text-xs font-semibold flex items-start gap-2 animate-in zoom-in-95 ${
                scanResult.success
                  ? 'bg-emerald-100 border border-emerald-300 text-emerald-950'
                  : 'bg-rose-100 border border-rose-300 text-rose-950'
              }`}
            >
              {scanResult.success ? (
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-700 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4.5 h-4.5 text-rose-700 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold">{scanResult.success ? 'Scan Berhasil!' : 'Gagal Memproses QR'}</p>
                <p className="text-[11px] font-normal mt-0.5">{scanResult.message}</p>
              </div>
            </div>
          )}

          {/* Informasi Masa Berlaku 2 Jam */}
          <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 text-[11px] text-blue-950 w-full space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-blue-900">
              <Clock className="w-3.5 h-3.5 text-blue-700" />
              <span>Ketentuan Sesi Survei (2 Jam):</span>
            </div>
            <p className="text-slate-600 leading-relaxed pl-5">
              Setelah QR Code berhasil di-scan, sesi pengisian survei aktif selama <strong>2 jam</strong>. Setelah 2 jam, sesi otomatis kadaluarsa demi keamanan data.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
