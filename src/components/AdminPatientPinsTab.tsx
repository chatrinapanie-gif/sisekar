import React, { useState } from 'react';
import { 
  KeyRound, 
  Plus, 
  Copy, 
  Check, 
  ExternalLink, 
  Trash2, 
  Ban, 
  Search, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Zap,
  Share2, 
  Printer, 
  Filter,
  UserCheck,
  Building2,
  RefreshCw,
  FileSpreadsheet,
  Globe2,
  Smartphone,
  AlertTriangle,
  Code2,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PatientPinToken } from '../types';
import { 
  generatePatientPins, 
  revokePatientPin, 
  deletePatientPin,
  syncPinsWithGoogleSheet
} from '../services/sheetsService';
import { GOOGLE_APPS_SCRIPT_CODE } from '../services/appsScriptCode';

interface AdminPatientPinsTabProps {
  pins: PatientPinToken[];
  onRefresh: () => void;
  adminToken?: string | null;
  onToast: (type: 'success' | 'error', msg: string) => void;
}

export const AdminPatientPinsTab: React.FC<AdminPatientPinsTabProps> = ({
  pins,
  onRefresh,
  adminToken,
  onToast,
}) => {
  const [generateCount, setGenerateCount] = useState<number>(1);
  const [patientNameInput, setPatientNameInput] = useState<string>('');
  const [serviceInput, setServiceInput] = useState<string>('Rawat Inap');
  const [roomInput, setRoomInput] = useState<string>('');
  const [labelInput, setLabelInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');
  const [customPinInput, setCustomPinInput] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSyncingSheet, setIsSyncingSheet] = useState<boolean>(false);
  const [copiedPin, setCopiedPin] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [copiedWa, setCopiedWa] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'used' | 'revoked'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [selectedPinForPrint, setSelectedPinForPrint] = useState<PatientPinToken | null>(null);
  const [copiedScriptCode, setCopiedScriptCode] = useState<boolean>(false);
  const [showDeploymentGuide, setShowDeploymentGuide] = useState<boolean>(false);

  const handleCopyScriptCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedScriptCode(true);
    setTimeout(() => setCopiedScriptCode(null as any), 3000);
    onToast('success', 'Kode Code.gs terbaru berhasil disalin ke clipboard!');
  };

  // Perhitungan statistik
  const totalCount = pins.length;
  const activeCount = pins.filter(p => p.status === 'active').length;
  const usedCount = pins.filter(p => p.status === 'used').length;
  const revokedCount = pins.filter(p => p.status === 'revoked').length;

  // Filter PIN
  const filteredPins = pins.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchPin = p.pin.includes(q);
      const matchLabel = p.label?.toLowerCase().includes(q);
      const matchRegName = p.registeredPatientName?.toLowerCase().includes(q);
      const matchRegService = p.registeredService?.toLowerCase().includes(q);
      const matchRegRoom = p.registeredRoom?.toLowerCase().includes(q);
      const matchUsedName = p.usedBy?.namaPasien?.toLowerCase().includes(q);
      const matchUsedService = p.usedBy?.jenisLayanan?.toLowerCase().includes(q);
      return matchPin || matchLabel || matchRegName || matchRegService || matchRegRoom || matchUsedName || matchUsedService;
    }
    return true;
  });

  const handleSyncSheet = async () => {
    setIsSyncingSheet(true);
    try {
      const res = await syncPinsWithGoogleSheet();
      if (res.success) {
        onToast('success', `✓ ${res.message}`);
        onRefresh();
      } else {
        onToast('error', res.message || 'Gagal sinkronisasi dengan Google Sheet.');
      }
    } catch (err: any) {
      onToast('error', err?.message || 'Terjadi kesalahan saat sinkronisasi.');
    } finally {
      setIsSyncingSheet(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await generatePatientPins({
        count: generateCount,
        registeredPatientName: patientNameInput.trim() || undefined,
        registeredService: serviceInput.trim() || undefined,
        registeredRoom: roomInput.trim() || undefined,
        label: labelInput.trim() || (patientNameInput.trim() ? `Pasien: ${patientNameInput.trim()}` : undefined),
        notes: notesInput.trim() || undefined,
        customPin: customPinInput.trim() || undefined,
        adminToken: adminToken || undefined,
      });

      if (res && res.length > 0) {
        onToast('success', `✓ Berhasil menerbitkan ${res.length} PIN akses pasien untuk Google Sheet!`);
        setPatientNameInput('');
        setRoomInput('');
        setLabelInput('');
        setCustomPinInput('');
        setNotesInput('');
        onRefresh();
      } else {
        onToast('error', 'Gagal menerbitkan PIN.');
      }
    } catch (err: any) {
      onToast('error', err?.message || 'Terjadi kesalahan.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickBatch = async (count: number) => {
    setIsGenerating(true);
    try {
      const res = await generatePatientPins({
        count,
        registeredService: 'Pelayanan RSUD Aeramo',
        notes: `Batch Cepat ${count} PIN diterbitkan dari Dashboard Admin Web`,
        adminToken: adminToken || undefined,
      });

      if (res && res.length > 0) {
        onToast('success', `✓ Berhasil menerbitkan ${res.length} PIN baru langsung dari Dashboard Web!`);
        onRefresh();
      } else {
        onToast('error', 'Gagal membuat batch PIN.');
      }
    } catch (err: any) {
      onToast('error', err?.message || 'Terjadi kesalahan saat membuat PIN.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getDirectPatientLink = (pin: string) => {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    return `${origin}${pathname}?pin=${pin}`;
  };

  const getWhatsAppMessageText = (pinObj: PatientPinToken) => {
    const name = pinObj.registeredPatientName || pinObj.usedBy?.namaPasien || 'Bapak/Ibu Pasien';
    const svc = pinObj.registeredService || pinObj.usedBy?.jenisLayanan || 'Pelayanan';
    const link = getDirectPatientLink(pinObj.pin);

    return `Halo Bapak/Ibu *${name}*,%0A%0AAnda telah menyelesaikan layanan *${svc}* di *RSUD Aeramo Kabupaten Nagekeo*.%0A%0ASilakan klik tautan di bawah ini untuk menjawab kuesioner singkat evaluasi kepuasan layanan:%0A👉 ${encodeURIComponent(link)}%0A%0APIN Akses: *${pinObj.pin}*%0A%0AKami sangat menghargai partisipasi Anda demi peningkatan mutu layanan kami.%0A_RSUD Aeramo - Melayani dengan Kasih_`;
  };

  const handleShareWhatsApp = (pinObj: PatientPinToken) => {
    const msg = getWhatsAppMessageText(pinObj);
    const waUrl = `https://api.whatsapp.com/send?text=${msg}`;
    window.open(waUrl, '_blank');
  };

  const handleCopyWhatsAppText = (pinObj: PatientPinToken) => {
    const name = pinObj.registeredPatientName || pinObj.usedBy?.namaPasien || 'Bapak/Ibu Pasien';
    const svc = pinObj.registeredService || pinObj.usedBy?.jenisLayanan || 'Pelayanan';
    const link = getDirectPatientLink(pinObj.pin);
    const text = `Halo Bapak/Ibu *${name}*,\n\nAnda telah menyelesaikan layanan *${svc}* di *RSUD Aeramo Kabupaten Nagekeo*.\n\nSilakan klik tautan di bawah ini untuk menjawab kuesioner singkat evaluasi kepuasan layanan:\n👉 ${link}\n\nPIN Akses: *${pinObj.pin}*\n\nKami sangat menghargai partisipasi Anda demi peningkatan mutu layanan kami.\n_RSUD Aeramo - Melayani dengan Kasih_`;
    
    navigator.clipboard.writeText(text);
    setCopiedWa(pinObj.pin);
    setTimeout(() => setCopiedWa(null), 2500);
    onToast('success', `Teks pesan WhatsApp untuk ${name} berhasil disalin!`);
  };

  const handleCopyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(pin);
    setTimeout(() => setCopiedPin(null), 2500);
    onToast('success', `PIN ${pin} disalin ke clipboard!`);
  };

  const handleCopyLink = (pin: string) => {
    const link = getDirectPatientLink(pin);
    navigator.clipboard.writeText(link);
    setCopiedLink(pin);
    setTimeout(() => setCopiedLink(null), 2500);
    onToast('success', `Tautan langsung survei pasien (PIN ${pin}) disalin!`);
  };

  const handleRevoke = async (id: string, pin: string) => {
    if (window.confirm(`Batalkan / nonaktifkan PIN ${pin}? Pasien tidak akan dapat menggunakannya lagi.`)) {
      await revokePatientPin(id, adminToken || undefined);
      onToast('success', `PIN ${pin} berhasil dinonaktifkan.`);
      onRefresh();
    }
  };

  const handleDelete = async (id: string, pin: string) => {
    if (window.confirm(`Hapus permanen data PIN ${pin}?`)) {
      await deletePatientPin({ id }, adminToken || undefined);
      onToast('success', `PIN ${pin} berhasil dihapus.`);
      onRefresh();
    }
  };

  const handleClearAllUsed = async () => {
    if (window.confirm('Bersihkan seluruh riwayat PIN yang sudah digunakan? PIN yang masih aktif akan tetap tersimpan aman.')) {
      await deletePatientPin({ allUsed: true }, adminToken || undefined);
      onToast('success', 'Riwayat PIN terpakai berhasil dibersihkan.');
      onRefresh();
    }
  };

  const handlePrintCard = (pinObj: PatientPinToken) => {
    setSelectedPinForPrint(pinObj);
    setShowPrintModal(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Ringkasan Status & Statistik PIN */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total PIN Diterbitkan</span>
          <div className="text-2xl font-black text-slate-900 mt-1 flex items-center justify-between">
            <span>{totalCount}</span>
            <KeyRound className="w-5 h-5 text-slate-400" />
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">PIN Aktif (Siap Pakai)</span>
          <div className="text-2xl font-black text-emerald-900 mt-1 flex items-center justify-between">
            <span>{activeCount}</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-4">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Sudah Digunakan</span>
          <div className="text-2xl font-black text-blue-900 mt-1 flex items-center justify-between">
            <span>{usedCount}</span>
            <UserCheck className="w-5 h-5 text-blue-600" />
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">Dibatalkan / Nonaktif</span>
          <div className="text-2xl font-black text-rose-900 mt-1 flex items-center justify-between">
            <span>{revokedCount}</span>
            <Ban className="w-5 h-5 text-rose-600" />
          </div>
        </div>
      </div>

      {/* Info Cloud Sync Google Sheet Multi-Device */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/60 to-emerald-50/60 border border-blue-200/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Globe2 className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-black text-blue-950">
                Sistem PIN Terhubung ke Google Sheet (Multi-Device)
              </h4>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Tab PIN_PASIEN
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Seluruh PIN tersimpan di Tab <strong>PIN_PASIEN</strong> Google Sheet. Pasien dapat langsung membuka kuesioner dari smartphone mereka masing-masing tanpa petugas perlu membuka portal admin di perangkat pasien.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSyncSheet}
          disabled={isSyncingSheet}
          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition shrink-0 disabled:opacity-50"
          title="Tarik data PIN terbaru dari Google Sheet"
        >
          <FileSpreadsheet className={`w-4 h-4 ${isSyncingSheet ? 'animate-spin' : ''}`} />
          <span>{isSyncingSheet ? 'Sinkronisasi Sheet...' : 'Sinkronkan Google Sheet'}</span>
        </button>
      </div>

      {/* Banner Penting: Cara Memastikan PIN Terbuka di Email Pasien & Seluruh HP */}
      <div className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs sm:text-sm font-bold text-amber-950 flex items-center gap-2">
                <span>Panduan Penting: Agar PIN Dapat Dibuka di Email Pasien &amp; Perangkat Lain</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200/80 text-amber-900 border border-amber-300">
                  Wajib Disimak
                </span>
              </h5>
              <p className="text-[11px] text-amber-900/90 leading-relaxed mt-0.5">
                PIN <strong>268907</strong> (Pasien: CHATRINA HERLOFINA PANIE) serta seluruh PIN terdaftar kini telah aktif di sistem. Agar PIN baru yang dibuat otomatis tercatat di Google Sheet dan bisa diakses pasien tanpa Anda harus membuka admin di HP mereka, pastikan Google Apps Script Anda disetel ke <strong>Versi Baru</strong> dan hak akses <strong>Siapa Saja (Anyone)</strong>.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDeploymentGuide(!showDeploymentGuide)}
            className="px-3 py-1.5 rounded-xl bg-amber-200/80 hover:bg-amber-300/80 text-amber-950 font-bold text-xs flex items-center gap-1.5 transition shrink-0"
          >
            <span>{showDeploymentGuide ? 'Sembunyikan' : 'Buka Cara Update'}</span>
            {showDeploymentGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showDeploymentGuide && (
          <div className="pt-3 border-t border-amber-200/80 space-y-3 text-xs text-amber-950 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-white/80 border border-amber-200 space-y-1">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-blue-700 text-white flex items-center justify-center text-[10px]">1</span>
                  <span>Salin Kode Code.gs Terbaru</span>
                </span>
                <p className="text-[11px] text-slate-600">
                  Kode Code.gs terbaru sudah mencakup fitur tab <strong>PIN_PASIEN</strong> dan validasi multi-perangkat.
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleCopyScriptCode}
                    className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-[11px] flex items-center gap-1.5 transition shadow-xs"
                  >
                    {copiedScriptCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScriptCode ? 'Kode Code.gs Tersalin!' : 'Salin Kode Code.gs'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/80 border border-amber-200 space-y-1">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">2</span>
                  <span>Terapkan sebagai Versi Baru (Deploy)</span>
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Buka Google Sheet &gt; Ekstensi &gt; Apps Script &gt; Klik <strong>Deploy (Terapkan)</strong> &gt; <strong>Kelola penerapan</strong> &gt; Klik ikon <strong>Pensil (Edit)</strong> &gt; Pada Versi pilih <strong>Versi baru (New version)</strong> &gt; Pastikan Siapa yang memiliki akses: <strong>Siapa saja (Anyone)</strong> &gt; Klik <strong>Terapkan</strong>.
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-100/70 text-[11px] text-amber-900 flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-amber-700" />
              <span>
                <strong>Kenapa wajib "Siapa Saja"?</strong> Jika disetel "Hanya saya", Google akan memblokir email pasien lain dan server web sehingga muncul pesan PIN tidak terdaftar. Dengan memilih "Siapa saja", seluruh pasien bisa langsung mengisi survei dengan aman.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Form Pembuatan PIN Akses Pasien Baru */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">Terbitkan PIN Akses Pasien Baru</h4>
              <p className="text-[11px] text-slate-500">Cukup buat PIN dari web ini — otomatis aktif di HP pasien &amp; tersimpan di Google Sheet tanpa perlu buka sheet</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSyncSheet}
              disabled={isSyncingSheet}
              className="px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition flex items-center gap-1.5"
              title="Tarik perubahan dari Google Sheet"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheet ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Tarik dari Sheet</span>
            </button>
            <button
              type="button"
              onClick={onRefresh}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
              title="Refresh Tampilan"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Kotak Informasi: Buat PIN Langsung dari Web */}
        <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-blue-950">
                Pembuatan PIN 100% Cukup dari Web Ini (Tidak Perlu Buka Google Sheet / onOpen)
              </p>
              <p className="text-[11px] text-blue-900/80 leading-relaxed">
                Anda tidak perlu membuka Google Sheet lagi. Masukkan nama pasien di form bawah, atau gunakan tombol kilat di sebelah kanan.
              </p>
            </div>
          </div>

          {/* Tombol Kilat Buat PIN Langsung */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleQuickBatch(5)}
              disabled={isGenerating}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-100 text-blue-900 font-bold text-xs border border-blue-200 hover:border-blue-300 shadow-2xs transition flex items-center gap-1.5 disabled:opacity-50"
              title="Terbitkan 5 PIN sekaligus secara instan"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>+5 PIN Kilat</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickBatch(10)}
              disabled={isGenerating}
              className="px-3 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
              title="Terbitkan 10 PIN bangsal sekaligus secara instan"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>+10 PIN Sekaligus</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Nama Pasien Terdaftar */}
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nama Pasien (Terdaftar)
              </label>
              <input
                type="text"
                placeholder="Contoh: CHATRINA HERLOFINA PANIE"
                value={patientNameInput}
                onChange={e => setPatientNameInput(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 uppercase"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Nama otomatis terisi saat pasien memasukkan PIN di gawainya</span>
            </div>

            {/* Layanan Pasien */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Layanan Rumah Sakit
              </label>
              <select
                value={serviceInput}
                onChange={e => setServiceInput(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
              >
                <option value="Rawat Inap">Rawat Inap</option>
                <option value="Rawat Jalan / Poliklinik">Rawat Jalan / Poliklinik</option>
                <option value="Instalasi Gawat Darurat (IGD 24 Jam)">Instalasi Gawat Darurat (IGD)</option>
                <option value="Kebidanan & Kandungan (VK)">Kebidanan &amp; Kandungan (VK)</option>
                <option value="Instalasi Farmasi">Instalasi Farmasi</option>
                <option value="Laboratorium & Radiologi">Laboratorium &amp; Radiologi</option>
                <option value="Pelayanan RSUD Aeramo Umum">Pelayanan Umum</option>
              </select>
            </div>

            {/* Kamar / Bangsal / Ruangan */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Kamar / Ruang (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Kamar Mawar 102 / Poli Gigi"
                value={roomInput}
                onChange={e => setRoomInput(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-100">
            
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Jumlah PIN
              </label>
              <select
                value={generateCount}
                onChange={e => setGenerateCount(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
              >
                <option value={1}>1 PIN (Pasien Tunggal)</option>
                <option value={5}>5 PIN Sekaligus</option>
                <option value={10}>10 PIN (Satu Bangsal / Ruangan)</option>
                <option value={25}>25 PIN (Satu Shift)</option>
                <option value={50}>50 PIN (Satu Hari Penuh)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Label Tambahan (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Shift Pagi / Loket A"
                value={labelInput}
                onChange={e => setLabelInput(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Custom PIN Khusus (Opsional)
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="Kosongkan untuk PIN acak 6-digit"
                value={customPinInput}
                onChange={e => setCustomPinInput(e.target.value.replace(/\D/g, ''))}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={isGenerating}
              className="px-5 py-2.5 rounded-xl bg-blue-800 hover:bg-blue-900 active:scale-98 text-white font-bold text-xs shadow-md shadow-blue-900/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Menerbitkan PIN...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Terbitkan {generateCount} PIN Akses (Simpan ke Sheet)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Daftar & Manajemen Seluruh PIN Pasien */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        
        {/* Header Filter & Pencarian */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari PIN, label ruangan, atau nama pasien..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
              />
            </div>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="p-1.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
            >
              <option value="all">Semua Status ({totalCount})</option>
              <option value="active">🟢 Aktif ({activeCount})</option>
              <option value="used">🔵 Sudah Digunakan ({usedCount})</option>
              <option value="revoked">🔴 Dinonaktifkan ({revokedCount})</option>
            </select>
          </div>

          {usedCount > 0 && (
            <button
              type="button"
              onClick={handleClearAllUsed}
              className="text-[11px] text-slate-500 hover:text-red-700 flex items-center gap-1 font-semibold transition"
              title="Bersihkan PIN yang sudah digunakan agar tabel tetap rapi"
            >
              <Trash2 className="w-3 h-3" />
              <span>Bersihkan PIN Terpakai</span>
            </button>
          )}

        </div>

        {/* Tabel Data PIN */}
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          {filteredPins.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs space-y-2">
              <KeyRound className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">Belum ada PIN akses yang sesuai filter</p>
              <p className="text-[11px]">Klik tombol "Terbitkan PIN Akses" di atas untuk membuat PIN baru bagi pasien.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Nomor PIN</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Label / Keterangan</th>
                  <th className="py-2.5 px-3">Waktu Terbit &amp; Penggunaan</th>
                  <th className="py-2.5 px-3 text-right">Aksi &amp; Bagikan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPins.map(pinObj => {
                  const isCopied = copiedPin === pinObj.pin;
                  const isLinkCopied = copiedLink === pinObj.pin;
                  const directLink = getDirectPatientLink(pinObj.pin);

                  return (
                    <tr key={pinObj.id} className="hover:bg-slate-50/80 transition">
                      
                      {/* Nomor PIN */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm tracking-wider text-blue-950 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                            {pinObj.pin}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyPin(pinObj.pin)}
                            className="p-1 text-slate-400 hover:text-blue-700 transition"
                            title="Salin PIN"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        {pinObj.status === 'active' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            <span>Aktif (Siap)</span>
                          </span>
                        )}
                        {pinObj.status === 'used' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Sudah Digunakan</span>
                          </span>
                        )}
                        {pinObj.status === 'revoked' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                            <Ban className="w-3 h-3" />
                            <span>Nonaktif</span>
                          </span>
                        )}
                      </td>

                      {/* Label & Pasien Terdaftar */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          {pinObj.registeredPatientName ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                                  Pasien Terdaftar
                                </span>
                                <span className="font-bold text-slate-900 text-xs">
                                  {pinObj.registeredPatientName}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-600 flex items-center gap-2">
                                <span>Layanan: <strong>{pinObj.registeredService || 'Rawat Inap'}</strong></span>
                                {pinObj.registeredRoom && (
                                  <span className="text-slate-400">• {pinObj.registeredRoom}</span>
                                )}
                              </div>
                            </div>
                          ) : pinObj.label ? (
                            <span className="font-semibold text-slate-800 block text-xs">{pinObj.label}</span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Umum (Tanpa Registrasi Nama)</span>
                          )}

                          {pinObj.usedBy && (
                            <div className="text-[11px] text-blue-900 bg-blue-50/80 p-1.5 rounded-lg border border-blue-100 mt-1">
                              <strong>Telah Diisi:</strong> {pinObj.usedBy.namaPasien || 'Pasien Anonim'} ({pinObj.usedBy.jenisLayanan})
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Waktu */}
                      <td className="py-3 px-3 text-[11px] text-slate-500">
                        <div>
                          <span>Terbit: {new Date(pinObj.createdAt).toLocaleDateString('id-ID')}</span>
                        </div>
                        {pinObj.usedAt && (
                          <div className="text-emerald-700 font-medium mt-0.5">
                            Pakai: {new Date(pinObj.usedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </td>

                      {/* Aksi & Bagikan */}
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          
                          {/* Tombol Bagikan ke WhatsApp */}
                          <button
                            type="button"
                            onClick={() => handleShareWhatsApp(pinObj)}
                            className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-bold transition flex items-center gap-1 shadow-2xs"
                            title="Kirim link PIN kuesioner via WhatsApp ke pasien"
                          >
                            <Smartphone className="w-3 h-3 text-emerald-600" />
                            <span>Kirim WA</span>
                          </button>

                          {/* Salin Teks Undangan WA */}
                          <button
                            type="button"
                            onClick={() => handleCopyWhatsAppText(pinObj)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                            title="Salin pesan ajakan WhatsApp lengkap"
                          >
                            {copiedWa === pinObj.pin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          {/* Salin Tautan Langsung */}
                          <button
                            type="button"
                            onClick={() => handleCopyLink(pinObj.pin)}
                            className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-blue-50 hover:text-blue-700 text-[11px] font-semibold text-slate-600 transition flex items-center gap-1"
                            title="Salin tautan langsung survei dengan PIN ini"
                          >
                            {isLinkCopied ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700">Tersalin</span>
                              </>
                            ) : (
                              <>
                                <Share2 className="w-3 h-3 text-blue-700" />
                                <span>Salin Link</span>
                              </>
                            )}
                          </button>

                          {/* Cetak Kartu Token */}
                          <button
                            type="button"
                            onClick={() => handlePrintCard(pinObj)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                            title="Cetak Kartu Token Pasien"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Buka di tab baru */}
                          <a
                            href={directLink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
                            title="Buka Formulir Pasien di Tab Baru"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {/* Nonaktifkan PIN jika masih aktif */}
                          {pinObj.status === 'active' && (
                            <button
                              type="button"
                              onClick={() => handleRevoke(pinObj.id, pinObj.pin)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-700 transition"
                              title="Nonaktifkan PIN"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Hapus */}
                          <button
                            type="button"
                            onClick={() => handleDelete(pinObj.id, pinObj.pin)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-red-50 text-slate-400 hover:text-red-700 transition"
                            title="Hapus PIN"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* Modal Cetak Kartu Token PIN Pasien */}
      {showPrintModal && selectedPinForPrint && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-200">
            
            <div className="border-b pb-3 space-y-1">
              <span className="text-[10px] font-bold text-blue-700 tracking-wider uppercase">RSUD AERAMO - KABUPATEN NAGEKEO</span>
              <h3 className="text-sm font-extrabold text-slate-900">KARTU TOKEN AKSES SURVEI</h3>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 border-2 border-dashed border-blue-300 space-y-2">
              <span className="text-xs text-slate-600 block">Nomor PIN Akses Sekali Pakai Pasien:</span>
              <div className="text-3xl font-mono font-black text-blue-950 tracking-widest bg-white py-2 rounded-xl shadow-xs border border-blue-200">
                {selectedPinForPrint.pin}
              </div>
              {selectedPinForPrint.label && (
                <p className="text-xs font-semibold text-blue-800">{selectedPinForPrint.label}</p>
              )}
            </div>

            <div className="text-left text-[11px] text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p>• Buka tautan survei RSUD Aeramo di ponsel/gadget Anda.</p>
              <p>• Masukkan 6 digit PIN di atas untuk memulai pengisian.</p>
              <p>• PIN berlaku 1x pengisian demi menjaga keaslian data evaluasi.</p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Kartu</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
