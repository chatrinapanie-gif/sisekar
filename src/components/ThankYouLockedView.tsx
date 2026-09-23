import React from 'react';
import { CheckCircle2, ShieldCheck, HeartHandshake, Lock, Clock, FileCheck, Building2 } from 'lucide-react';
import { NagekeoLogo } from './NagekeoLogo';
import { RoseWatermarkIcon } from './RoseWatermark';
import { HOSPITAL_HEADER_INFO } from '../surveyConfig';
import { OneTimeSubmissionLock } from '../types';

interface ThankYouLockedViewProps {
  lockInfo: OneTimeSubmissionLock | null;
  onAdminUnlockRequest?: () => void;
  onNewPatientPinRequest?: () => void;
}

export const ThankYouLockedView: React.FC<ThankYouLockedViewProps> = ({
  lockInfo,
  onAdminUnlockRequest,
  onNewPatientPinRequest,
}) => {
  const formattedDate = lockInfo?.submittedAt
    ? new Date(lockInfo.submittedAt).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-8 sm:py-12 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Kartu Utama Bukti & Ucapan Terima Kasih */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
        
        {/* Header Visual Atas */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-blue-900 text-white p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="relative z-10 flex flex-col items-center">
            {/* Logo Resmi RSUD Aeramo */}
            <div className="p-3 bg-white rounded-2xl shadow-lg mb-4 ring-4 ring-white/20">
              <NagekeoLogo className="w-14 h-14 sm:w-16 sm:h-16 object-contain" />
            </div>

            <span className="px-3 py-1 rounded-full bg-emerald-500/30 border border-emerald-300/40 text-emerald-100 text-xs font-bold tracking-wider uppercase mb-2">
              Kuesioner Selesai &amp; Terverifikasi
            </span>

            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
              Terima Kasih Atas Penilaian Anda!
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-xl font-medium">
              {HOSPITAL_HEADER_INFO.namaRS} • {HOSPITAL_HEADER_INFO.kabupaten}
            </p>
          </div>
        </div>

        {/* Isi Pesan & Konfirmasi Kunci Satu Kali Pengisian */}
        <div className="p-6 sm:p-8 space-y-6 relative overflow-hidden">
          
          {/* Watermark Mawar di latar belakang tanda terima */}
          <div className="absolute right-0 bottom-0 pointer-events-none select-none z-0 text-rose-800 opacity-[0.03] transform rotate-12 translate-x-12 translate-y-12">
            <RoseWatermarkIcon className="w-96 h-96" opacity="opacity-100" />
          </div>

          <div className="relative z-10 space-y-6">
          
          {/* Box Ucapan Apresiasi */}
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 text-emerald-950 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div className="text-xs sm:text-sm space-y-1">
              <p className="font-bold text-emerald-900 text-sm sm:text-base">
                Suara Anda Sangat Berharga Bagi Kami
              </p>
              <p className="text-emerald-800 leading-relaxed">
                Setiap kritik, saran, dan nilai kepuasan yang Anda berikan langsung terekam ke sistem manajemen mutu RSUD Aeramo untuk terus meningkatkan kualitas pelayanan kesehatan bagi seluruh masyarakat.
              </p>
            </div>
          </div>

          {/* Bukti Pengisian Digital / Tanda Terima */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-700" />
                <span className="font-bold text-xs sm:text-sm text-slate-900">
                  Bukti Tanda Terima Survei Digital
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Tersimpan di Google Sheets</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200/70">
                <span className="text-slate-500 text-[11px] block">Waktu Pengisian:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {formattedDate}
                </span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200/70">
                <span className="text-slate-500 text-[11px] block">Layanan Dinilai:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {lockInfo?.jenisLayanan || 'Pelayanan RSUD Aeramo'}
                </span>
              </div>

              {lockInfo?.submissionId && (
                <div className="bg-white p-3 rounded-xl border border-slate-200/70 sm:col-span-2">
                  <span className="text-slate-500 text-[11px] block">Kode Referensi Responden:</span>
                  <span className="font-mono font-bold text-blue-900 text-xs mt-0.5 block break-all">
                    {lockInfo.submissionId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Pemberitahuan Kebijakan Akses Sekali Pakai (One-Time Access Policy) */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-amber-950 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-amber-900">
                Sistem Pengamanan Akses Aktif (One-Time Submission)
              </p>
              <p className="text-amber-800 leading-relaxed text-[11px] sm:text-xs">
                Aplikasi survei pada perangkat ini telah ditutup secara otomatis untuk mencegah pengisian berulang atau manipulasi data ganda. Terima kasih telah membantu menjaga validitas evaluasi pelayanan kami.
              </p>
            </div>
          </div>

          {/* Tombol Aksi untuk Pasien Lain dengan PIN Baru */}
          {onNewPatientPinRequest && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onNewPatientPinRequest}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs shadow-md shadow-blue-900/20 transition flex items-center justify-center gap-2 mx-auto active:scale-98"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Isi Survei Pasien Baru dengan PIN Lain</span>
              </button>
            </div>
          )}

          {/* Footer Card Informasi Keamanan */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5 text-emerald-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Koneksi Terenkripsi &amp; Data Tersimpan di Google Sheet RSUD Aeramo</span>
            </div>
          </div>

          </div>

        </div>

      </div>

    </div>
  );
};
