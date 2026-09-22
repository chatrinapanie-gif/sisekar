import React from 'react';
import { 
  Heart, 
  Clock, 
  UserCheck, 
  ShieldCheck, 
  Star, 
  FileText, 
  ArrowRight,
  Sparkles,
  Building2,
  CheckCircle2,
  Stethoscope,
  Bed,
  Check
} from 'lucide-react';
import { SKALA_OPTIONS } from '../surveyConfig';
import { NagekeoLogo } from './NagekeoLogo';

interface PatientGuideViewProps {
  onStartSurvey: () => void;
}

export const PatientGuideView: React.FC<PatientGuideViewProps> = ({ onStartSurvey }) => {
  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 px-3 sm:px-6 space-y-6 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold border border-blue-400/30">
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>Panduan Pasien & Keluarga • RSUD Aeramo</span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-snug">
            Petunjuk Pengisian Survei Evaluasi Pelayanan Pasien
          </h1>

          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
            Terima kasih telah mempercayakan perawatan kesehatan Anda dan keluarga di RSUD Aeramo Kabupaten Nagekeo. Pendapat dan penilaian jujur Anda sangat berharga untuk terus memajukan kualitas fasilitas, ketanggapan tenaga kesehatan, dan kenyamanan rumah sakit.
          </p>

          <div className="pt-2">
            <button
              onClick={onStartSurvey}
              id="btn-guide-start-survey"
              className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2"
            >
              <span>Mulai Isi Formulir Survei</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="absolute right-4 -bottom-8 opacity-10 pointer-events-none hidden sm:block">
          <NagekeoLogo className="w-64 h-64" />
        </div>
      </div>

      {/* Rangkuman 7 Aspek Pelayanan */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-xs border border-slate-200 space-y-4">
        <div className="flex items-center gap-2 text-blue-900 font-bold text-base">
          <Building2 className="w-5 h-5 text-blue-700" />
          <span>7 Aspek Evaluasi Pelayanan Pasien (Rawat Inap & Unit Terkait)</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Kuesioner disusun secara komprehensif untuk mengevaluasi seluruh tahapan pengalaman perawatan Anda selama di RSUD Aeramo:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-2.5">
            <span className="w-6 h-6 rounded-lg bg-blue-700 text-white flex items-center justify-center text-xs font-bold shrink-0">1</span>
            <div>
              <p className="text-xs font-bold text-slate-900">Kenyamanan Kamar & Tempat Tidur</p>
              <p className="text-[11px] text-slate-500">Kenyamanan matras, sprei bersih, sirkulasi udara & suhu ruangan.</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-2.5">
            <span className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shrink-0">2</span>
            <div>
              <p className="text-xs font-bold text-slate-900">Kebersihan Kamar & Kamar Mandi</p>
              <p className="text-[11px] text-slate-500">Kebersihan lantai, ketersediaan air mengalir, kehigienisan sanitasi.</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100 flex items-start gap-2.5">
            <span className="w-6 h-6 rounded-lg bg-amber-700 text-white flex items-center justify-center text-xs font-bold shrink-0">3</span>
            <div>
              <p className="text-xs font-bold text-slate-900">Ketersediaan & Kualitas Fasilitas</p>
              <p className="text-[11px] text-slate-500">Lampu penerangan, tiang infus, bel panggilan, fasilitas pendukung.</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100 flex items-start gap-2.5">
            <span className="w-6 h-6 rounded-lg bg-purple-700 text-white flex items-center justify-center text-xs font-bold shrink-0">4</span>
            <div>
              <p className="text-xs font-bold text-slate-900">Ketenangan & Keamanan Lingkungan</p>
              <p className="text-[11px] text-slate-500">Suasana tenang waktu istirahat malam, ketertiban jam kunjung.</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-100 flex items-start gap-2.5">
            <span className="w-6 h-6 rounded-lg bg-sky-700 text-white flex items-center justify-center text-xs font-bold shrink-0">5</span>
            <div>
              <p className="text-xs font-bold text-slate-900">Frekuensi Kunjungan Dokter (Visite)</p>
              <p className="text-[11px] text-slate-500">Keteraturan dokter memeriksa perkembangan kesehatan pasien.</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2.5">
            <span className="w-6 h-6 rounded-lg bg-indigo-700 text-white flex items-center justify-center text-xs font-bold shrink-0">6</span>
            <div>
              <p className="text-xs font-bold text-slate-900">Kejelasan Informasi Penjelasan Dokter</p>
              <p className="text-[11px] text-slate-500">Bahasa mudah dipahami mengenai diagnosa, obat, & tindakan.</p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-teal-50/70 border border-teal-100 sm:col-span-2 lg:col-span-3 flex items-start gap-2.5">
            <span className="w-6 h-6 rounded-lg bg-teal-700 text-white flex items-center justify-center text-xs font-bold shrink-0">7</span>
            <div>
              <p className="text-xs font-bold text-slate-900">Ketersediaan & Responsivitas Perawat</p>
              <p className="text-[11px] text-slate-500">Kecepatan perawat datang dan membantu dengan ramah saat dipanggil atau membutuhkan bantuan.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Panduan Praktis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        
        {/* Card 1: Siapa yang Mengisi */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">1. Siapa yang Mengisi Formulir?</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Formulir survei ini dapat diisi langsung oleh:
          </p>
          <ul className="text-xs text-slate-700 space-y-1.5 pl-4 list-disc">
            <li><strong>Pasien yang sedang atau telah dirawat</strong> di unit Rawat Inap maupun poliklinik/penunjang RSUD Aeramo.</li>
            <li><strong>Keluarga / Wali pendamping pasien</strong> apabila pasien membutuhkan bantuan untuk mengisi di layar gawai/telepon pintar.</li>
          </ul>
        </div>

        {/* Card 2: Kerahasiaan Data */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">2. Jaminan Kerahasiaan Jawaban</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Semua penilaian Anda bersifat <strong>rahasia</strong> dan terlindungi:
          </p>
          <ul className="text-xs text-slate-700 space-y-1.5 pl-4 list-disc">
            <li>Kolom nama bersifat <strong>opsional (boleh dikosongkan/anonim)</strong>.</li>
            <li>Penilaian Anda tidak akan pernah mempengaruhi mutu perawatan medis yang Anda terima.</li>
          </ul>
        </div>

        {/* Card 3: Waktu Pengisian */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">3. Waktu & Jam Pelaksanaan Survei</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Survei kepuasan dibagi menjadi dua sesi waktu di RSUD Aeramo:
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] font-bold text-blue-900 block">Sesi Pagi - Siang</span>
              <span className="text-xs font-semibold text-slate-700">08.00 – 14.00 WITA</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[11px] font-bold text-blue-900 block">Sesi Siang - Malam</span>
              <span className="text-xs font-semibold text-slate-700">14.00 – 20.00 WITA</span>
            </div>
          </div>
        </div>

        {/* Card 4: Langkah Pengisian Singkat */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200/80 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-800 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900">4. Tahapan Pengisian Formulir</h3>
          <ol className="text-xs text-slate-700 space-y-2 pl-4 list-decimal">
            <li><strong>Lengkapi Profil:</strong> Pilih tanggal, jam survei, jenis kelamin, usia, pendidikan, pekerjaan, dan unit layanan.</li>
            <li><strong>Berikan Penilaian:</strong> Pilih salah satu dari 4 opsi nilai pada setiap butir aspek yang dinilai.</li>
            <li><strong>Tulis Saran:</strong> Masukkan masukan membangun atau apresiasi Anda.</li>
            <li><strong>Tekan Tombol Kirim:</strong> Jawaban Anda langsung tersimpan ke spreadsheet dan dashboard rumah sakit.</li>
          </ol>
        </div>

      </div>

      {/* Skala Penilaian Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xs border border-slate-200 space-y-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
            <span>Panduan Makna 4 Pilihan Skala Penilaian</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Gunakan panduan berikut sebagai acuan saat memilih salah satu opsi pada formulir evaluasi:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {SKALA_OPTIONS.map(opt => (
            <div 
              key={opt.value}
              className={`p-4 rounded-2xl border transition-all ${
                opt.value === 4 
                  ? 'bg-emerald-50/70 border-emerald-200' 
                  : opt.value === 3
                  ? 'bg-blue-50/70 border-blue-200'
                  : opt.value === 2
                  ? 'bg-amber-50/70 border-amber-200'
                  : 'bg-rose-50/70 border-rose-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{opt.emoji}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  opt.value === 4 ? 'bg-emerald-100 text-emerald-800' :
                  opt.value === 3 ? 'bg-blue-100 text-blue-800' :
                  opt.value === 2 ? 'bg-amber-100 text-amber-800' :
                  'bg-rose-100 text-rose-800'
                }`}>
                  Nilai {opt.value}
                </span>
              </div>
              
              <h4 className="font-bold text-slate-900 text-sm mt-2">
                {opt.label}
              </h4>

              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {opt.value === 1 && 'Sangat mengecewakan, tidak ramah, kotor, lambat, persyaratan tidak sesuai, atau sangat mengganggu ketenangan.'}
                {opt.value === 2 && 'Pelayanan atau fasilitas belum memenuhi harapan, kurang bersih, atau penanganan lambat sehingga perlu perbaikan.'}
                {opt.value === 3 && 'Pelayanan ramah, tertib, bersih, tenaga medis berkomunikasi dengan baik, serta memenuhi standar rumah sakit.'}
                {opt.value === 4 && 'Pelayanan prima, fasilitas sangat bersih & higienis, dokter/perawat sangat tanggap dan profesional, melebihi ekspektasi Anda.'}
              </p>
            </div>
          ))}
        </div>

        {/* Informasi ragam pilihan skala spesifik */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
          <strong>Catatan Opsi Jawaban:</strong> Setiap butir pertanyaan menyajikan label pilihan yang disesuaikan secara spesifik (misalnya: <em>Sangat Sesuai / Sesuai / Kurang Sesuai / Tidak Sesuai</em> untuk kesesuaian prosedur; <em>Cepat & Siap</em> untuk respons perawat; atau <em>Sangat Nyaman</em> untuk tempat tidur), semuanya berbobot nilai 1 s/d 4 yang setara secara matematis.
        </div>
      </div>

      {/* Penutup & Tombol Aksi */}
      <div className="p-6 rounded-3xl bg-slate-100/90 border border-slate-200 text-center space-y-3">
        <p className="text-xs sm:text-sm font-semibold text-slate-800">
          Sudah memahami panduan pengisian? Mari bersama wujudkan pelayanan kesehatan terbaik di Nagekeo.
        </p>
        <button
          onClick={onStartSurvey}
          id="btn-guide-start-survey-bottom"
          className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md transition inline-flex items-center gap-2"
        >
          <span>Buka Formulir Evaluasi Sekarang</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
