import React, { useState } from 'react';
import { Download, CheckCircle2, Smartphone, X, Info } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Jika sudah terpasang di Android / desktop standalone
  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>Terpasang di Perangkat</span>
      </div>
    );
  }

  return (
    <>
      {isInstallable ? (
        <button
          onClick={install}
          id="btn-install-pwa"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs sm:text-sm font-medium shadow-sm transition-all"
          title="Pasang aplikasi SISEKAR di layar utama Android"
        >
          <Smartphone className="w-4 h-4" />
          <span>Pasang di HP Android</span>
        </button>
      ) : (
        <button
          onClick={() => setShowGuideModal(true)}
          id="btn-guide-install"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-medium border border-teal-200 transition-colors"
          title="Petunjuk pasang di Android"
        >
          <Download className="w-3.5 h-3.5 text-teal-600" />
          <span className="hidden xs:inline">Pasang di Android</span>
          <span className="xs:hidden">Pasang App</span>
        </button>
      )}

      {/* Modal Petunjuk Pasang di Android & iOS */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Pasang SISEKAR di Android</h3>
                <p className="text-xs text-slate-500">Jalankan layaknya aplikasi native tanpa Play Store</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm text-slate-600">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex gap-3 items-start">
                <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs shrink-0 font-bold">1</div>
                <div>
                  <p className="font-semibold text-slate-800">Buka di Google Chrome (Android)</p>
                  <p className="text-slate-500 text-xs mt-0.5">Buka link web aplikasi ini menggunakan browser Chrome di smartphone atau tablet Android Anda.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex gap-3 items-start">
                <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs shrink-0 font-bold">2</div>
                <div>
                  <p className="font-semibold text-slate-800">Tekan Menu Titik Tiga (⋮)</p>
                  <p className="text-slate-500 text-xs mt-0.5">Di pojok kanan atas browser Google Chrome, ketuk ikon titik tiga.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex gap-3 items-start">
                <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs shrink-0 font-bold">3</div>
                <div>
                  <p className="font-semibold text-slate-800">Pilih "Tambahkan ke Layar Utama" / "Install App"</p>
                  <p className="text-slate-500 text-xs mt-0.5">Ikon SISEKAR akan muncul di menu aplikasi HP Anda, dapat dibuka offline tanpa browser address bar.</p>
                </div>
              </div>

              {isIOS && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-amber-700" />
                    Untuk Pengguna iPhone / iPad (Safari):
                  </p>
                  <p className="mt-1">Ketuk tombol <strong>Share</strong> (ikon kotak dengan panah ke atas) lalu pilih <strong>Add to Home Screen</strong>.</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm transition-colors"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
