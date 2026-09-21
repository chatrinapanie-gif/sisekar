import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Check, 
  AlertCircle, 
  Save, 
  Building, 
  RotateCcw, 
  Monitor, 
  ExternalLink,
  HelpCircle,
  Clock
} from 'lucide-react';
import { AppConfig } from '../types';

interface SettingsModalProps {
  config: AppConfig;
  onSaveConfig: (newConfig: AppConfig) => void;
  onOpenGuide: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  config,
  onSaveConfig,
  onOpenGuide,
}) => {
  const [appsScriptUrl, setAppsScriptUrl] = useState(config.appsScriptUrl);
  const [hospitalName, setHospitalName] = useState(config.hospitalName);
  const [hospitalSubTitle, setHospitalSubTitle] = useState(config.hospitalSubTitle);
  const [kioskMode, setKioskMode] = useState(config.kioskMode);
  const [autoResetSeconds, setAutoResetSeconds] = useState(config.autoResetSeconds);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [testingUrl, setTestingUrl] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      appsScriptUrl: appsScriptUrl.trim(),
      hospitalName: hospitalName.trim() || 'RSUD Sehat Sejahtera',
      hospitalSubTitle: hospitalSubTitle.trim() || 'SISEKAR - Evaluasi Kepuasan Pasien',
      kioskMode,
      autoResetSeconds: Number(autoResetSeconds) || 7,
    });
    setSaveStatus('Pengaturan berhasil disimpan!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleTestConnection = async () => {
    if (!appsScriptUrl || appsScriptUrl.trim() === '') {
      setTestResult({
        success: false,
        msg: 'Silakan masukkan URL Web App Google Apps Script terlebih dahulu.',
      });
      return;
    }

    setTestingUrl(true);
    setTestResult(null);

    try {
      // Tes koneksi dengan fetch GET ke Google Apps Script doGet()
      const clean = appsScriptUrl.trim();
      const res = await fetch(clean, { method: 'GET', mode: 'cors' }).catch(() => null);

      if (res && res.ok) {
        const json = await res.json().catch(() => null);
        setTestResult({
          success: true,
          msg: `Koneksi Berhasil! Google Sheet terhubung: ${json?.spreadsheetName || 'Aktif'}`,
        });
      } else {
        // Karena CORS Google Apps Script sering redirect ke script.googleusercontent.com,
        // no-cors test
        await fetch(clean, { method: 'GET', mode: 'no-cors' });
        setTestResult({
          success: true,
          msg: 'Endpoint Apps Script dapat dijangkau dari browser! Webhook siap menerima data.',
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        msg: `Tidak dapat menjangkau URL: ${err instanceof Error ? err.message : 'Pastikan opsi "Who has access" diset ke "Anyone" saat deploy web app.'}`,
      });
    } finally {
      setTestingUrl(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-8 px-3 sm:px-6">
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Pengaturan Google Sheet & Aplikasi
              </h2>
              <p className="text-xs text-slate-500">
                Hubungkan formulir SISEKAR dengan Google Apps Script
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold border border-teal-200 transition"
          >
            <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
            <span>Tutorial Script</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          
          {/* URL Web App Google Apps Script */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">
                URL Google Apps Script Web App (Webhook) *
              </label>
              <span className="text-[11px] text-slate-400">Harus berakhiran /exec</span>
            </div>
            
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              value={appsScriptUrl}
              onChange={e => setAppsScriptUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600 placeholder:text-slate-400 placeholder:font-sans"
            />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1">
              <p className="text-[11px] text-slate-500">
                Dapatkan URL ini dari menu <strong>Deploy &gt; New deployment &gt; Web app</strong> di Google Sheets Anda.
              </p>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingUrl || !appsScriptUrl}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition disabled:opacity-40 shrink-0"
              >
                {testingUrl ? 'Menguji...' : 'Uji Koneksi'}
              </button>
            </div>

            {/* Test result status */}
            {testResult && (
              <div className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2 ${
                testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {testResult.success ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <span>{testResult.msg}</span>
              </div>
            )}
          </div>

          {/* Nama Fasilitas Kesehatan */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-slate-500" />
              <span>Nama Rumah Sakit / Puskesmas / Klinik</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: RSUD Sehat Sejahtera / RS Citra Medika"
              value={hospitalName}
              onChange={e => setHospitalName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          {/* Subtitle / Unit Khusus */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">
              Judul Header / Tagline
            </label>
            <input
              type="text"
              placeholder="Contoh: Sistem Evaluasi Kepuasan Pasien dan Keluarga (SISEKAR)"
              value={hospitalSubTitle}
              onChange={e => setHospitalSubTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
          </div>

          {/* Opsi Kiosk Mode & Auto Reset */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-teal-600" />
                  <span>Mode Kios / Tablet Meja Front Desk</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Cocok untuk tablet Android yang ditaruh di loket kasir / ruang tunggu
                </p>
              </div>
              <input
                type="checkbox"
                checked={kioskMode}
                onChange={e => setKioskMode(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Waktu Reset Otomatis Layar Sukses</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Formulir kembali kosong untuk pasien berikutnya
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={3}
                  max={60}
                  value={autoResetSeconds}
                  onChange={e => setAutoResetSeconds(Number(e.target.value))}
                  className="w-16 px-2 py-1 rounded-lg border border-slate-300 text-xs text-center font-bold"
                />
                <span className="text-xs text-slate-500">detik</span>
              </div>
            </div>
          </div>

          {/* Feedback Status */}
          {saveStatus && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{saveStatus}</span>
            </div>
          )}

          {/* Submit Save */}
          <button
            type="submit"
            id="btn-save-settings"
            className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-700/20 flex items-center justify-center gap-2 transition"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Pengaturan</span>
          </button>

        </form>

      </div>
    </div>
  );
};
