import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  HelpCircle, 
  GitBranch, 
  Cloud, 
  Smartphone, 
  Layers, 
  FileSpreadsheet, 
  Zap, 
  Sparkles,
  Sliders
} from 'lucide-react';
import { GOOGLE_APPS_SCRIPT_CODE, GOOGLE_APPS_SCRIPT_INDEX_HTML } from '../services/appsScriptCode';

export const AppsScriptGuideModal: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [codeView, setCodeView] = useState<'code_gs' | 'index_html'>('code_gs');
  const [activeSubTab, setActiveSubTab] = useState<'appscript' | 'sheet_dashboard' | 'custom_develop' | 'flutter'>('appscript');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_INDEX_HTML);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 px-3 sm:px-6 space-y-6">
      
      {/* Hero Card */}
      <div className="bg-gradient-to-br from-blue-900 via-slate-900 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/30">
            <Zap className="w-3.5 h-3.5" />
            <span>Dokumentasi RSUD Aeramo • Nagekeo</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
            Integrasi Google Sheet & Panduan Pengembangan Formulir
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/80 mt-2 leading-relaxed">
            Format resmi RSUD Aeramo sudah terpasang lengkap dengan Kop Surat, Profil Responden, dan 4 Butir Kenyamanan. Anda dapat menghubungkan ke Google Sheet atau menambah butir pertanyaan sendiri dengan sangat mudah.
          </p>
        </div>

        {/* Floating tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-blue-800/50">
          <button
            onClick={() => setActiveSubTab('appscript')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === 'appscript'
                ? 'bg-blue-400 text-slate-950 shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Kode Google Apps Script (Code.gs)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('sheet_dashboard')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === 'sheet_dashboard'
                ? 'bg-blue-400 text-slate-950 shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Cara Setup Google Sheet</span>
          </button>

          <button
            onClick={() => setActiveSubTab('custom_develop')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === 'custom_develop'
                ? 'bg-blue-400 text-slate-950 shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Cara Kembangkan Form Sendiri</span>
          </button>

          <button
            onClick={() => setActiveSubTab('flutter')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === 'flutter'
                ? 'bg-blue-400 text-slate-950 shadow-md'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Flutter ke Cloudflare</span>
          </button>
        </div>
      </div>

      {/* Sub Tab 1: Kode Google Apps Script */}
      {activeSubTab === 'appscript' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 space-y-4">
            {/* Selector File Code.gs vs index.html */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCodeView('code_gs')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    codeView === 'code_gs'
                      ? 'bg-blue-700 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>1. File: Code.gs (Backend & doGet)</span>
                </button>

                <button
                  onClick={() => setCodeView('index_html')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    codeView === 'index_html'
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>2. File: index.html (Dashboard Eksekutif)</span>
                </button>
              </div>

              {codeView === 'code_gs' ? (
                <button
                  onClick={handleCopyCode}
                  id="btn-copy-apps-script"
                  className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 active:scale-95 text-white font-bold text-xs shadow-md shadow-blue-800/20 flex items-center gap-2 transition"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'Tersalin ke Clipboard!' : 'Salin Code.gs'}</span>
                </button>
              ) : (
                <button
                  onClick={handleCopyHtml}
                  id="btn-copy-index-html"
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-800/20 flex items-center gap-2 transition"
                >
                  {copiedHtml ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedHtml ? 'Tersalin ke Clipboard!' : 'Salin index.html'}</span>
                </button>
              )}
            </div>

            {codeView === 'code_gs' ? (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950 flex items-center justify-between">
                  <span><strong>File: Code.gs</strong> — Menangani penerimaan data survei (<code>doPost</code>), fungsi <code>doGet</code> untuk menampilkan dashboard, dan kalkulasi ringkasan statistik (<code>getDashboardData</code>).</span>
                </div>
                <div className="relative">
                  <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto max-h-[480px] leading-relaxed border border-slate-800 selection:bg-blue-700">
                    {GOOGLE_APPS_SCRIPT_CODE}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between">
                  <span><strong>File: index.html</strong> — Tampilan dashboard profesional responsif dengan KPI IKM, Grafik Aspek Layanan, Donut Chart Mutu, Filter & Pencarian, serta Ekspor CSV dan Cetak Laporan.</span>
                </div>
                <div className="relative">
                  <pre className="p-4 rounded-2xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto max-h-[480px] leading-relaxed border border-slate-800 selection:bg-emerald-700">
                    {GOOGLE_APPS_SCRIPT_INDEX_HTML}
                  </pre>
                </div>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-950 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-blue-900">
                <Check className="w-4 h-4 text-blue-700" />
                Daftar Kolom yang Otomatis Dibuat di Google Sheet:
              </p>
              <p className="text-slate-700 text-[11px] leading-relaxed">
                1. Timestamp • 2. ID Survei • 3. Tanggal Survei • 4. Jam Survei (08.00-14.00 / 14.00-20.00 WITA) • 5. Nama Pasien • 6. Jenis Kelamin (L/P) • 7. Pendidikan (SD/SMP/SMA/S1/S2) • 8. Usia (Tahun) • 9. Pekerjaan • 10. Jenis Layanan • 11. Q1 Kenyamanan Kamar • 12. Q2 Kebersihan Kamar & Mandi • 13. Q3 Fasilitas Kamar • 14. Q4 Ketenangan & Keamanan • 15. Rata-rata Skor • 16. IKM 100 • 17. Mutu Layanan • 18. Saran • 19. Perangkat
              </p>
            </div>
          </div>

        </div>
      )}

      {/* Sub Tab 2: Setup Google Sheet */}
      {activeSubTab === 'sheet_dashboard' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 space-y-5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-700" />
              <span>Langkah Menghubungkan Google Sheet ke Form RSUD Aeramo</span>
            </h3>

            <div className="space-y-4 text-xs sm:text-sm text-slate-700">
              
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <div>
                  <p className="font-bold text-slate-900">Buka Spreadsheet Baru di Google Drive</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Kunjungi <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-blue-700 font-semibold underline">sheets.new</a> dan namai: <strong>"Survei Kepuasan RSUD Aeramo"</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <div>
                  <p className="font-bold text-slate-900">Buka Ekstensi &gt; Apps Script</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Di bar menu Google Sheets, pilih menu <strong>Extensions (Ekstensi)</strong> &gt; <strong>Apps Script</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <div>
                  <p className="font-bold text-slate-900">Tempelkan Kode Code.gs</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Hapus isi file <code className="bg-white px-1.5 py-0.5 rounded border">Code.gs</code>, paste kode dari tab <em>"1. File: Code.gs"</em> di atas.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0">4</span>
                <div>
                  <p className="font-bold text-emerald-950">Buat File Baru: index.html (Dashboard Eksekutif)</p>
                  <p className="text-emerald-900 text-xs mt-0.5">
                    Di samping tulisan <strong>Files</strong> di Google Apps Script, klik tombol <strong>+ (Tambah)</strong> &gt; pilih <strong>HTML</strong> &gt; beri nama: <strong className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300">index</strong> (otomatis jadi index.html). Hapus isinya, lalu paste kode dari tab <em>"2. File: index.html"</em>. Klik tombol Save (ikon disket).
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 flex gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-bold shrink-0">5</span>
                <div>
                  <p className="font-bold text-blue-950">Deploy Web App (PENTING!)</p>
                  <p className="text-blue-900 text-xs mt-0.5">
                    Klik tombol biru <strong>Deploy (Terapkan)</strong> di kanan atas &gt; pilih <strong>New deployment (Penerapan baru)</strong> &gt; pilih <strong>Web app</strong>.
                  </p>
                  <div className="mt-2 p-2.5 rounded-xl bg-white border border-blue-200 text-xs space-y-1">
                    <p>• Description: <strong>Dashboard & Survei RSUD Aeramo</strong></p>
                    <p>• Execute as: <strong>Me (email Google Anda)</strong></p>
                    <p className="text-amber-800 font-bold">• Who has access: <strong>Anyone (Siapa saja)</strong> &larr; Wajib dipilih!</p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-bold shrink-0">6</span>
                <div>
                  <p className="font-bold text-slate-900">Salin Web App URL (Bisa untuk Dashboard & Webhook!)</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Salin URL yang berakhiran <code className="text-blue-700 font-semibold">/exec</code>.
                  </p>
                  <div className="mt-2 p-2.5 rounded-xl bg-slate-100 text-xs text-slate-700 space-y-1">
                    <p>✨ <strong>Buka di Browser:</strong> URL tersebut langsung menjadi <strong>Halaman Dashboard Interaktif</strong> untuk direktur/admin RSUD Aeramo!</p>
                    <p>📲 <strong>Tempel ke Form:</strong> Masukkan URL yang sama ke tab <strong>Google Sheet URL</strong> di aplikasi survei ini agar jawaban pasien otomatis masuk.</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* Sub Tab 3: Cara Kembangkan Form Sendiri */}
      {activeSubTab === 'custom_develop' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-700" />
              <span>Panduan Mengembangkan Formulir Sendiri</span>
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Struktur formulir telah dibuat <strong>100% modular</strong> di dalam berkas <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-800 font-bold">src/surveyConfig.ts</code>. Anda tidak perlu memodifikasi logika rumit untuk menambah pertanyaan atau bagian baru.
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="font-bold text-xs sm:text-sm text-slate-800">
                  Contoh Menambahkan "Bagian 2: Pelayanan Dokter dan Perawat":
                </p>
                <p className="text-xs text-slate-600">
                  Cukup buka file <code className="bg-white px-1.5 py-0.5 rounded border text-[11px]">src/surveyConfig.ts</code> dan tambahkan blok berikut ke dalam array <code className="text-blue-700">SURVEY_SECTIONS</code>:
                </p>
                <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto">
{`{
  id: 'bagian_2',
  title: 'Bagian 2 : Pelayanan Dokter dan Perawat',
  questions: [
    {
      id: 'q5_keramahan_nakes',
      aspek: 'Keramahan dan Kesopanan Tenaga Medis',
      uraian: 'Bagaimana sikap dan keramahan dokter serta perawat saat melayani Anda?'
    },
    {
      id: 'q6_kecepatan_penanganan',
      aspek: 'Kecepatan Tanggap Perawat',
      uraian: 'Seberapa cepat perawat datang saat Anda menekan bel atau meminta bantuan?'
    }
  ]
}`}
                </pre>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  <strong>Otomatis:</strong> Setiap butir pertanyaan baru yang Anda tambahkan akan otomatis digambar ke dalam tabel resmi dan nilainya otomatis dikirim ke Google Sheet!
                </span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Sub Tab 4: Flutter & Cloudflare */}
      {activeSubTab === 'flutter' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Cloud className="w-5 h-5 text-blue-700" />
              <span>Deploy Flutter ke GitHub &amp; Cloudflare Pages</span>
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Jika Anda ingin tetap menggunakan Flutter, Anda dapat meng-compile ke web (<code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-800">flutter build web --release</code>) dan meng-upload output folder <code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-800">build/web</code> ke Cloudflare Pages.
            </p>

            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-2">
              <p className="font-bold">Keunggulan React PWA yang Sedang Kita Gunakan:</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-700">
                <li>Ukuran file hanya <strong>~150 KB</strong> (sangat cepat terbuka di Android pasien tanpa download CanvasKit berat).</li>
                <li>Mendukung cetak fisik kop surat resmi (print friendly).</li>
                <li>Langsung memiliki tombol <em>"Pasang di HP Android"</em> (PWA Add to Home Screen).</li>
              </ul>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
