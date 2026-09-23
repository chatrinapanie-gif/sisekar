import React, { useState, useEffect, useRef } from 'react';
import { 
  KeyRound, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  Lock, 
  Info,
  CheckCircle2,
  Sparkles,
  Building2,
  HelpCircle,
  UserCheck,
  BedDouble,
  HeartHandshake
} from 'lucide-react';
import { NagekeoLogo } from './NagekeoLogo';
import { RoseWatermarkIcon } from './RoseWatermark';
import { HOSPITAL_HEADER_INFO } from '../surveyConfig';
import { validatePatientPin, setActiveSessionPatientPin } from '../services/sheetsService';
import { PatientPinToken } from '../types';

interface PatientPinGateProps {
  onPinVerified: (token: PatientPinToken, pin: string) => void;
  onOpenStaffLogin?: () => void;
  initialPinFromUrl?: string;
}

export const PatientPinGate: React.FC<PatientPinGateProps> = ({
  onPinVerified,
  onOpenStaffLogin,
  initialPinFromUrl,
}) => {
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isValidating, setIsValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [usedDetails, setUsedDetails] = useState<{ usedAt?: string; usedBy?: any } | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [verifiedModalData, setVerifiedModalData] = useState<{ token: PatientPinToken; pin: string } | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Otomatis verifikasi jika ada parameter PIN dari link / URL (misal: ?pin=123456)
  useEffect(() => {
    if (initialPinFromUrl && initialPinFromUrl.length >= 4) {
      const clean = initialPinFromUrl.trim().replace(/\D/g, '').slice(0, 6);
      const digits = clean.split('');
      while (digits.length < 6) digits.push('');
      setPinDigits(digits);
      handleVerifyPinString(clean);
    }
  }, [initialPinFromUrl]);

  const handleVerifyPinString = async (fullPin: string) => {
    if (fullPin.length < 4) {
      setErrorMsg('Masukkan minimal 6 digit PIN akses.');
      return;
    }

    setIsValidating(true);
    setErrorMsg(null);
    setUsedDetails(null);

    const res = await validatePatientPin(fullPin);
    setIsValidating(false);

    if (res.valid && res.token) {
      setActiveSessionPatientPin(fullPin);
      // Tampilkan Modal Konfirmasi Data Pasien Terdaftar
      setVerifiedModalData({
        token: res.token,
        pin: fullPin
      });
    } else {
      setErrorMsg(res.message);
      if (res.status === 'used') {
        setUsedDetails({
          usedAt: res.token?.usedAt,
          usedBy: res.token?.usedBy,
        });
      }
    }
  };

  const handleConfirmStartSurvey = () => {
    if (verifiedModalData) {
      onPinVerified(verifiedModalData.token, verifiedModalData.pin);
      setVerifiedModalData(null);
    }
  };

  const handleDigitChange = (index: number, value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    
    // Jika user menempelkan (paste) full 6 digit
    if (cleanValue.length > 1) {
      const pastedDigits = cleanValue.slice(0, 6).split('');
      const newDigits = [...pinDigits];
      pastedDigits.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setPinDigits(newDigits);
      
      const full = newDigits.join('');
      if (full.length === 6) {
        handleVerifyPinString(full);
      } else {
        const nextIdx = Math.min(pastedDigits.length, 5);
        inputRefs.current[nextIdx]?.focus();
      }
      return;
    }

    const newDigits = [...pinDigits];
    newDigits[index] = cleanValue;
    setPinDigits(newDigits);
    setErrorMsg(null);

    // Auto-focus next input
    if (cleanValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Jika seluruh 6 digit terisi, otomatis verifikasi
    const fullPin = newDigits.join('');
    if (fullPin.length === 6 && !newDigits.includes('')) {
      handleVerifyPinString(fullPin);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter') {
      const fullPin = pinDigits.join('');
      if (fullPin.length >= 4) {
        handleVerifyPinString(fullPin);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullPin = pinDigits.join('');
    handleVerifyPinString(fullPin);
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center px-4 py-8 relative">
      
      {/* Kartu Autentikasi PIN Akses Pasien */}
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Background Watermark Mawar Merah Mewah */}
        <div className="absolute -top-16 -right-16 opacity-[0.09] pointer-events-none transform -rotate-12">
          <RoseWatermarkIcon className="w-72 h-72" />
        </div>
        <div className="absolute -bottom-16 -left-16 opacity-[0.09] pointer-events-none transform rotate-45">
          <RoseWatermarkIcon className="w-72 h-72" />
        </div>

        {/* Header Visual Atas */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="p-3 bg-white rounded-2xl shadow-lg mb-3.5 ring-4 ring-white/20">
              <NagekeoLogo className="w-12 h-14 object-contain" />
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-700/60 border border-blue-400/40 text-blue-200 text-[11px] font-bold tracking-wider uppercase mb-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>SISEKAR • RSUD Aeramo Nagekeo</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Masukkan PIN Akses Survei
            </h1>

            <p className="text-xs sm:text-sm text-blue-100/90 mt-1.5 max-w-sm">
              Gunakan 6-digit PIN yang diberikan oleh petugas pelayanan RSUD Aeramo untuk membuka formulir
            </p>
          </div>
        </div>

        {/* Form Input PIN */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 relative z-10">
          
          {/* Petunjuk Singkat */}
          <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-2 font-medium">
              <KeyRound className="w-4 h-4 text-blue-700 shrink-0" />
              <span>Sistem Sekali Pakai (One-Time Access)</span>
            </div>
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 hover:underline"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Bantuan</span>
            </button>
          </div>

          {/* Kotak Input 6 Digit PIN */}
          <div>
            <label className="block text-center text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Ketik 6-Digit Nomor PIN Pasien
            </label>
            
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              {pinDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => { inputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  disabled={isValidating}
                  onChange={e => handleDigitChange(idx, e.target.value)}
                  onKeyDown={e => handleKeyDown(idx, e)}
                  className={`w-11 h-13 sm:w-13 sm:h-15 text-center text-xl sm:text-2xl font-mono font-extrabold rounded-2xl border-2 transition-all shadow-xs focus:outline-none ${
                    errorMsg 
                      ? 'border-red-400 bg-red-50/50 text-red-900 focus:border-red-600 focus:ring-4 focus:ring-red-100'
                      : digit 
                        ? 'border-blue-600 bg-blue-50/40 text-blue-950 focus:border-blue-700 focus:ring-4 focus:ring-blue-100'
                        : 'border-slate-300 bg-white text-slate-800 hover:border-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100'
                  }`}
                  autoFocus={idx === 0}
                />
              ))}
            </div>
          </div>

          {/* Pesan Kesalahan / Status PIN */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs sm:text-sm space-y-1.5 animate-in fade-in duration-200">
              <div className="flex items-start gap-2.5 font-bold text-red-800">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{errorMsg}</span>
              </div>
              {usedDetails && (
                <div className="pt-2 border-t border-red-200/80 text-[11px] text-red-700 font-medium space-y-0.5">
                  <p>• Riwayat: PIN ini telah digunakan untuk menyelesaikan survei.</p>
                  <p>• Silakan minta PIN baru kepada petugas / perawat yang bertugas.</p>
                </div>
              )}
            </div>
          )}

          {/* Tombol Verifikasi PIN */}
          <button
            type="submit"
            disabled={isValidating || pinDigits.join('').length < 4}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 hover:from-blue-800 hover:to-indigo-950 text-white font-bold text-sm shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidating ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Memverifikasi PIN Akses...</span>
              </>
            ) : (
              <>
                <span>Buka Formulir Kuesioner</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Info Keamanan & Validitas Data */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Evaluasi Pelayanan Terproteksi</span>
            </div>

            {onOpenStaffLogin && (
              <button
                type="button"
                onClick={onOpenStaffLogin}
                className="text-slate-400 hover:text-blue-700 hover:underline transition flex items-center gap-1"
              >
                <Lock className="w-3 h-3" />
                <span>Portal Petugas</span>
              </button>
            )}
          </div>

        </form>

      </div>

      {/* Modal Bantuan Cara Memperoleh PIN Pasien */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2.5 text-blue-900 font-extrabold text-base border-b pb-3">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                <Info className="w-4 h-4" />
              </div>
              <h3>Panduan Memperoleh PIN Survei</h3>
            </div>

            <div className="text-xs sm:text-sm text-slate-600 space-y-3 leading-relaxed">
              <p>
                <strong>Mengapa memerlukan PIN?</strong>
                <br />
                RSUD Aeramo menggunakan PIN sekali pakai (*one-time PIN*) untuk memastikan setiap lembar evaluasi diisi oleh pasien/keluarga asli yang sedang menerima layanan dan mencegah pengisian ganda (*anti-spam*).
              </p>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-blue-950 text-xs space-y-1">
                <p className="font-bold">Cara mendapatkan PIN:</p>
                <p>1. Minta 6-digit PIN kepada perawat ruangan rawat inap, petugas pendaftaran, atau kasir farmasi.</p>
                <p>2. Petugas juga dapat membagikan tautan langsung dengan PIN yang otomatis terisi ke WhatsApp Anda.</p>
              </div>

              <p className="text-[11px] text-slate-500">
                Setelah survei dikirim, PIN akan otomatis dinonaktifkan demi menjaga validitas data kepuasan.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="w-full py-2.5 rounded-xl bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs transition"
              >
                Mengerti &amp; Kembali
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI DATA PASIEN TERDAFTAR (POPUP SETELAH PIN DIMASUKKAN) */}
      {verifiedModalData && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-200/90 text-center animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden">
            
            {/* Latar Belakang Mawar Cantik */}
            <div className="absolute -top-12 -right-12 opacity-[0.08] pointer-events-none transform -rotate-12">
              <RoseWatermarkIcon className="w-56 h-56" />
            </div>

            {/* Header Icon Status */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 border-2 border-emerald-300 text-emerald-700 flex items-center justify-center shadow-md mb-3 ring-4 ring-emerald-50">
                <UserCheck className="w-7 h-7 text-emerald-600" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold uppercase tracking-wider mb-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>PIN &amp; Identitas Terverifikasi</span>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Selamat Datang di SISEKAR
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                RSUD Aeramo • Kabupaten Nagekeo
              </p>
            </div>

            {/* Kartu Rincian Data Pasien Terdaftar */}
            <div className="relative z-10 bg-gradient-to-br from-blue-50/80 via-slate-50 to-indigo-50/70 p-4 rounded-2xl border border-blue-200/80 text-left space-y-2.5 shadow-2xs">
              
              <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Nomor PIN Akses</span>
                <span className="font-mono font-black text-sm px-2.5 py-0.5 bg-blue-800 text-white rounded-lg shadow-2xs">
                  {verifiedModalData.pin}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nama Pasien</span>
                <p className="text-sm sm:text-base font-extrabold text-blue-950 uppercase tracking-wide">
                  {verifiedModalData.token.registeredPatientName || verifiedModalData.token.label || 'PASIEN RSUD AERAMO'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-blue-100/70">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Unit Layanan</span>
                  <p className="text-xs font-bold text-slate-800">
                    {verifiedModalData.token.registeredService || 'Rawat Inap'}
                  </p>
                </div>

                {verifiedModalData.token.registeredRoom && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kamar / Ruangan</span>
                    <p className="text-xs font-bold text-slate-800">
                      {verifiedModalData.token.registeredRoom}
                    </p>
                  </div>
                )}
              </div>

            </div>

            {/* Pesan Sambutan */}
            <p className="relative z-10 text-xs text-slate-600 leading-relaxed">
              Data Anda telah terhubung secara otomatis. Mohon berikan penilaian yang jujur dan objektif untuk peningkatan kualitas pelayanan rumah sakit.
            </p>

            {/* Tombol Lanjutkan */}
            <div className="relative z-10 pt-1">
              <button
                type="button"
                onClick={handleConfirmStartSurvey}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 hover:from-emerald-700 hover:to-teal-900 active:scale-98 text-white font-bold text-sm shadow-lg shadow-emerald-800/20 flex items-center justify-center gap-2 transition"
              >
                <span>Mulai Isi Kuesioner Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
