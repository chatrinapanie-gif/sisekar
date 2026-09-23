import React, { useState, useEffect, useMemo } from 'react';
import { 
  Send, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Clock, 
  Sparkles,
  Calendar,
  User,
  GraduationCap,
  Briefcase,
  Layers,
  HelpCircle,
  FileSpreadsheet,
  Check,
  Table as TableIcon,
  LayoutGrid,
  ShieldCheck,
  ChevronDown,
  Smartphone,
  QrCode,
  Camera
} from 'lucide-react';
import { NagekeoLogo } from './NagekeoLogo';
import { HospitalBannerSlider } from './HospitalBannerSlider';
import { RoseWatermarkIcon } from './RoseWatermark';
import { 
  HOSPITAL_HEADER_INFO, 
  SKALA_OPTIONS, 
  SERVICE_OPTIONS,
  SERVICE_QUESTIONS,
  getQuestionsForService,
  getServiceOption,
  ServiceKey,
  SURVEY_SECTIONS 
} from '../surveyConfig';
import { 
  JamSurvei, 
  JenisKelamin, 
  Pendidikan, 
  Pekerjaan, 
  SkalaKepuasan, 
  SurveySubmission, 
  AppConfig,
  PatientPinToken
} from '../types';
import { sendSurveyToGoogleSheet, saveOneTimeLock, consumePatientPin, getActiveSessionPatientPin } from '../services/sheetsService';

interface SurveyFormProps {
  config: AppConfig;
  isOnline: boolean;
  onSubmissionSuccess: (submission: SurveySubmission) => void;
  onOpenGuide: () => void;
  patientPin?: string;
  patientPinToken?: PatientPinToken;
}

const mapServiceTextToKey = (text?: string): ServiceKey => {
  if (!text) return 'rawat_inap';
  const lower = text.toLowerCase();
  if (lower.includes('jalan') || lower.includes('poli')) return 'rawat_jalan';
  if (lower.includes('igd') || lower.includes('darurat')) return 'igd';
  if (lower.includes('vk') || lower.includes('bidan') || lower.includes('kandungan') || lower.includes('kia')) return 'kebidanan';
  if (lower.includes('farmasi') || lower.includes('obat') || lower.includes('apotek')) return 'farmasi';
  if (lower.includes('radiologi') || lower.includes('rontgen')) return 'radiologi';
  if (lower.includes('lab')) return 'laboratorium';
  if (lower.includes('inap') || lower.includes('bangsal') || lower.includes('kamar')) return 'rawat_inap';
  return 'rawat_inap';
};

const getOptionColors = (val: 1 | 2 | 3 | 4, isSelected: boolean) => {
  switch (val) {
    case 1:
      return {
        card: isSelected 
          ? 'bg-rose-50/95 border-rose-500 ring-2 ring-rose-400 shadow-md text-slate-900' 
          : 'bg-rose-50/30 border-rose-200/90 hover:border-rose-300 hover:bg-rose-50/60 text-slate-800',
        badge: isSelected
          ? 'bg-rose-600 text-white font-bold'
          : 'bg-rose-100 text-rose-800 font-bold border border-rose-200',
      };
    case 2:
      return {
        card: isSelected 
          ? 'bg-amber-50/95 border-amber-500 ring-2 ring-amber-400 shadow-md text-slate-900' 
          : 'bg-amber-50/30 border-amber-200/90 hover:border-amber-300 hover:bg-amber-50/60 text-slate-800',
        badge: isSelected
          ? 'bg-amber-600 text-white font-bold'
          : 'bg-amber-100 text-amber-800 font-bold border border-amber-200',
      };
    case 3:
      return {
        card: isSelected 
          ? 'bg-blue-50/95 border-blue-600 ring-2 ring-blue-400 shadow-md text-slate-900' 
          : 'bg-blue-50/30 border-blue-200/90 hover:border-blue-300 hover:bg-blue-50/60 text-slate-800',
        badge: isSelected
          ? 'bg-blue-600 text-white font-bold'
          : 'bg-blue-100 text-blue-800 font-bold border border-blue-200',
      };
    case 4:
      return {
        card: isSelected 
          ? 'bg-emerald-50/95 border-emerald-600 ring-2 ring-emerald-400 shadow-md text-slate-900' 
          : 'bg-emerald-50/30 border-emerald-200/90 hover:border-emerald-300 hover:bg-emerald-50/60 text-slate-800',
        badge: isSelected
          ? 'bg-emerald-600 text-white font-bold'
          : 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-200',
      };
  }
};

export const SurveyForm: React.FC<SurveyFormProps> = ({
  config,
  isOnline,
  onSubmissionSuccess,
  onOpenGuide,
  patientPin,
  patientPinToken,
}) => {
  // Profil Responden (Gambar 2)
  const todayStr = new Date().toISOString().slice(0, 10);
  const [tanggalSurvei, setTanggalSurvei] = useState<string>(todayStr);
  const [jamSurvei, setJamSurvei] = useState<JamSurvei>('08.00 – 14.00 WITA');
  const [namaPasien, setNamaPasien] = useState<string>(patientPinToken?.registeredPatientName || '');
  const [jenisKelamin, setJenisKelamin] = useState<JenisKelamin>('L');
  const [pendidikan, setPendidikan] = useState<Pendidikan>('SMA');
  const [usia, setUsia] = useState<string>('32');
  const [pekerjaan, setPekerjaan] = useState<Pekerjaan>('SWASTA');
  const [pekerjaanLainnya, setPekerjaanLainnya] = useState<string>('');
  const [selectedServiceKey, setSelectedServiceKey] = useState<ServiceKey>(() => {
    return patientPinToken?.registeredService 
      ? mapServiceTextToKey(patientPinToken.registeredService)
      : 'rawat_inap';
  });
  const [customLayananText, setCustomLayananText] = useState<string>('');
  const [jenisLayanan, setJenisLayanan] = useState<string>(patientPinToken?.registeredService || 'Rawat Inap');

  // Modal Pop-Up Setelah Pengisian Berhasil
  const [submittedModalData, setSubmittedModalData] = useState<SurveySubmission | null>(null);

  // Otomatis isi data pasien dari token PIN jika ada pembaruan
  useEffect(() => {
    if (patientPinToken) {
      if (patientPinToken.registeredPatientName) {
        setNamaPasien(patientPinToken.registeredPatientName);
      }
      if (patientPinToken.registeredService) {
        const matchedKey = mapServiceTextToKey(patientPinToken.registeredService);
        setSelectedServiceKey(matchedKey);
        setJenisLayanan(patientPinToken.registeredService);
        const newSecs = getQuestionsForService(matchedKey);
        const newQs = newSecs.flatMap(s => s.questions);
        setAnswers(prev => {
          const updated = { ...prev };
          newQs.forEach((q, idx) => {
            if (updated[q.id] === undefined) {
              updated[q.id] = (idx % 2 === 0 ? 4 : 3) as SkalaKepuasan;
            }
          });
          return updated;
        });
      }
    }
  }, [patientPinToken]);

  // Dapatkan metadata layanan yang sedang aktif (judul, deskripsi)
  const activeServiceOption = useMemo(() => {
    return getServiceOption(selectedServiceKey);
  }, [selectedServiceKey]);

  // Dapatkan struktur pertanyaan khusus sesuai jenis layanan yang dipilih
  const currentSections = useMemo(() => {
    return getQuestionsForService(selectedServiceKey);
  }, [selectedServiceKey]);

  const allQuestions = useMemo(() => {
    return currentSections.flatMap(s => s.questions);
  }, [currentSections]);

  // Inisialisasi default jawaban nilai 4 (Sangat Puas) / 3 (Puas) untuk pertanyaan awal
  const [answers, setAnswers] = useState<Record<string, SkalaKepuasan>>(() => {
    const initAns: Record<string, SkalaKepuasan> = {};
    const defaultQs = getQuestionsForService('rawat_inap').flatMap(s => s.questions);
    defaultQs.forEach((q, idx) => {
      initAns[q.id] = (idx % 2 === 0 ? 4 : 3) as SkalaKepuasan;
    });
    return initAns;
  });

  const totalQuestionsCount = allQuestions.length;
  const answeredCount = allQuestions.filter(q => answers[q.id] !== undefined).length;

  const [saran, setSaran] = useState<string>('');
  // Mode Tampilan: 'table' (Format Tabel Pas Layar HP) atau 'cards' (Format Kartu)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Status Pengiriman
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    show: boolean;
    mode: 'online' | 'offline_saved';
    message: string;
    countdown: number;
    avgScore: number;
    ikm: number;
  }>({
    show: false,
    mode: 'online',
    message: '',
    countdown: config.autoResetSeconds,
    avgScore: 0,
    ikm: 0,
  });

  // Countdown auto reset
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (submitResult.show && submitResult.countdown > 0) {
      timer = setTimeout(() => {
        setSubmitResult(prev => ({ ...prev, countdown: prev.countdown - 1 }));
      }, 1000);
    } else if (submitResult.show && submitResult.countdown <= 0) {
      handleResetForm();
    }
    return () => clearTimeout(timer);
  }, [submitResult.show, submitResult.countdown]);

  const handleSelectAnswer = (qId: string, val: SkalaKepuasan) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  // Handler saat jenis layanan diubah dari dropdown
  const handleServiceChange = (newKey: ServiceKey) => {
    setSelectedServiceKey(newKey);
    const serviceInfo = getServiceOption(newKey);
    const resolvedName = newKey === 'lainnya' ? (customLayananText.trim() || 'Layanan Lainnya') : serviceInfo.label;
    setJenisLayanan(resolvedName);

    // Otomatis siapkan jawaban default untuk pertanyaan layanan baru agar user langsung siap mengisi
    const newSecs = getQuestionsForService(newKey);
    const newQs = newSecs.flatMap(s => s.questions);
    setAnswers(prev => {
      const updated = { ...prev };
      newQs.forEach((q, idx) => {
        if (updated[q.id] === undefined) {
          updated[q.id] = (idx % 2 === 0 ? 4 : 3) as SkalaKepuasan;
        }
      });
      return updated;
    });
  };

  const handleResetForm = () => {
    setTanggalSurvei(new Date().toISOString().slice(0, 10));
    setJamSurvei('08.00 – 14.00 WITA');
    setNamaPasien('');
    setJenisKelamin('L');
    setPendidikan('SMA');
    setUsia('32');
    setPekerjaan('SWASTA');
    setPekerjaanLainnya('');
    setSelectedServiceKey('rawat_inap');
    setCustomLayananText('');
    setJenisLayanan('Rawat Inap');

    // Inisialisasi ulang jawaban default
    const defaultQs = getQuestionsForService('rawat_inap').flatMap(s => s.questions);
    const initAns: Record<string, SkalaKepuasan> = {};
    defaultQs.forEach((q, idx) => {
      initAns[q.id] = (idx % 2 === 0 ? 4 : 3) as SkalaKepuasan;
    });
    setAnswers(initAns);
    setSaran('');
    setSubmitResult({
      show: false,
      mode: 'online',
      message: '',
      countdown: config.autoResetSeconds,
      avgScore: 0,
      ikm: 0,
    });
  };

  const calculateStatistics = () => {
    const vals: number[] = Object.values(answers);
    if (vals.length === 0) return { avg: 0, ikm: 0, mutu: 'Baik (B)' };
    const total = vals.reduce((a, b) => a + b, 0);
    const avg = Number((total / vals.length).toFixed(2));
    const ikm = Number(((avg / 4) * 100).toFixed(2));
    let mutu = 'Sangat Baik (A)';
    if (ikm < 65) mutu = 'Kurang Baik (D)';
    else if (ikm < 76.6) mutu = 'Cukup (C)';
    else if (ikm < 88.3) mutu = 'Baik (B)';
    return { avg, ikm, mutu };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { avg, ikm, mutu } = calculateStatistics();
    const now = new Date();
    const submissionId = `ARM-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
    const platform = isAndroid ? 'Android PWA' : 'Web Browser';

    const answeredDetails = currentSections.flatMap(sec => sec.questions).map((q, idx) => {
      const val = answers[q.id];
      const qOptions = q.options && q.options.length === 4 ? q.options : SKALA_OPTIONS;
      const opt = qOptions.find(o => o.value === val);
      return {
        qIndex: idx + 1,
        id: q.id,
        aspek: q.aspek,
        uraian: q.uraian,
        score: val || 0,
        label: opt ? opt.label : (val ? `Nilai ${val}` : '-'),
      };
    });

    const submission: SurveySubmission = {
      id: submissionId,
      timestamp: now.toISOString(),
      localDateFormatted: now.toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      tanggalSurvei,
      jamSurvei,
      namaPasien: namaPasien.trim() || '(Anonim)',
      jenisKelamin,
      pendidikan,
      usia: usia ? Number(usia) : '-',
      pekerjaan,
      pekerjaanLainnya: pekerjaan === 'LAINNYA' ? pekerjaanLainnya : undefined,
      jenisLayanan,
      answers,
      answeredDetails,
      averageScore: avg,
      ikmScore: ikm,
      mutuLayanan: mutu,
      saran: saran.trim() || undefined,
      status: 'pending',
      devicePlatform: platform,
      patientPin: patientPin || patientPinToken?.pin || getActiveSessionPatientPin() || undefined,
    };

    const effectivePatientPin = submission.patientPin;

    // KONSUMSI PIN SEKETIKA: Langsung ubah status PIN menjadi 'used' (terpakai) secara lokal dan di server
    // sehingga jika koneksi ke Google Apps Script lambat/tertunda, PIN sudah pasti hangus dan tidak bisa dipakai ulang
    if (effectivePatientPin) {
      await consumePatientPin({
        pin: effectivePatientPin,
        submissionId: submission.id,
        namaPasien: submission.namaPasien,
        jenisLayanan: submission.jenisLayanan,
        ikmScore: submission.ikmScore,
      });
    }

    const res = await sendSurveyToGoogleSheet(submission, config.appsScriptUrl);

    // Kunci aplikasi secara permanen (One-Time Access Lock) agar tidak bisa diisi ulang
    saveOneTimeLock(submission);

    setIsSubmitting(false);
    // Tampilkan Modal Konfirmasi Hasil Pengisian Survei
    setSubmittedModalData(submission);
  };

  const handleFinishAndLock = () => {
    if (submittedModalData) {
      onSubmissionSuccess(submittedModalData);
      setSubmittedModalData(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Layar Sukses Pengiriman
  if (submitResult.show) {
    return (
      <div className="max-w-xl mx-auto py-8 px-4 sm:px-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-100 text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-blue-700 via-sky-600 to-blue-800" />
          
          <div className="w-20 h-20 mx-auto rounded-full bg-blue-50 border-4 border-blue-100 flex items-center justify-center text-blue-700 mb-4 shadow-inner">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Survei Berhasil Dikirim!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
            {submitResult.message}
          </p>

          <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-medium">Nama Pasien:</span>
              <span className="font-semibold text-slate-800">{namaPasien || '(Anonim)'}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-medium">Layanan yang Diterima:</span>
              <span className="font-semibold text-slate-800">{jenisLayanan}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-medium">Rata-Rata Skor Kepuasan:</span>
              <span className="font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">
                {submitResult.avgScore} / 4.00 (IKM: {submitResult.ikm}%)
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-medium">Status Penilaian:</span>
              <span className="font-semibold px-2 py-0.5 rounded text-[11px] bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                <span>Data Berhasil Diterima Sistem RSUD Aeramo</span>
              </span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Reset otomatis dalam <strong>{submitResult.countdown}s</strong>
            </span>
            <button
              onClick={handleResetForm}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs sm:text-sm shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Isi Survei Baru</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 px-3 sm:px-6">
      
      {/* Top Utility Bar (Panduan Pengisian & Cetak Fisik) */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          {patientPin ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>PIN Pasien: <strong className="font-mono bg-emerald-200/70 px-1.5 py-0.5 rounded text-emerald-950">{patientPin}</strong></span>
              {patientPinToken?.registeredPatientName && (
                <span className="text-emerald-700 ml-1 font-semibold">• Pasien: {patientPinToken.registeredPatientName}</span>
              )}
            </span>
          ) : (
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Format Resmi Dokumen RSUD Aeramo • Nagekeo</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold border border-blue-200 transition"
            title="Lihat petunjuk dan panduan pengisian survei"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Panduan Pengisian</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition"
            title="Cetak formulir fisik kuesioner ke printer / PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cetak Dokumen Fisik</span>
            <span className="sm:hidden">Cetak</span>
          </button>
        </div>
      </div>

      {/* BANNER SLIDESHOW 10 GAMBAR RSUD AERAMO (TAMPILAN INTERAKTIF PASIEN) */}
      <div className="mb-6 print:hidden">
        <HospitalBannerSlider />
      </div>

      {/* KERTAS FORMULIR RESMI DENGAN KOP SURAT (SESUAI GAMBAR 1 & GAMBAR 2) */}
      <form onSubmit={handleSubmit} className="relative overflow-hidden bg-white rounded-3xl p-5 sm:p-10 shadow-xl border border-slate-200/90 ring-1 ring-rose-950/5 text-slate-900 print:shadow-none print:p-0 print:border-none">
        
        {/* WATERMARK MAWAR MERAH ELEGAN DI TENGAH KERTAS KUESIONER */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
          <div className="opacity-[0.065] sm:opacity-[0.075] print:opacity-[0.08] transform rotate-12 scale-110 sm:scale-125 transition-opacity">
            <RoseWatermarkIcon className="w-[520px] h-[520px] sm:w-[680px] sm:h-[680px]" />
          </div>
        </div>

        {/* WATERMARK MAWAR MERAH DI SUDUT KANAN ATAS FORMULIR */}
        <div className="absolute -top-14 -right-14 pointer-events-none select-none z-0 opacity-[0.09] sm:opacity-[0.11] transform -rotate-12 transition-opacity">
          <RoseWatermarkIcon className="w-64 h-64 sm:w-80 sm:h-80" />
        </div>

        {/* WATERMARK MAWAR MERAH DI SUDUT KIRI BAWAH FORMULIR */}
        <div className="absolute -bottom-14 -left-14 pointer-events-none select-none z-0 opacity-[0.09] sm:opacity-[0.11] transform rotate-45 transition-opacity">
          <RoseWatermarkIcon className="w-64 h-64 sm:w-80 sm:h-80" />
        </div>

        {/* AKSEN MAWAR LEMBUT DI SUDUT KIRI ATAS FORMULIR */}
        <div className="hidden sm:block absolute -top-16 -left-16 pointer-events-none select-none z-0 opacity-[0.07] transform rotate-90">
          <RoseWatermarkIcon className="w-60 h-60" />
        </div>
        
        <div className="relative z-10 space-y-6 sm:space-y-8">
        
        {/* ========================================================================= */}
        {/* KOP SURAT KHUSUS CETAK FISIK (HANYA MUNCUL KETIKA PRINT)                  */}
        {/* ========================================================================= */}
        <div className="hidden print:block relative pb-3 border-b-[3px] border-black">
          <div className="flex items-center justify-between gap-3 sm:gap-6">
            
            {/* Logo Kabupaten Nagekeo */}
            <div className="shrink-0 flex items-center justify-center pl-1 sm:pl-2">
              <NagekeoLogo className="w-16 h-20 sm:w-20 sm:h-24 drop-shadow-xs" />
            </div>

            {/* Teks Kop Surat Resmi */}
            <div className="flex-1 text-center font-serif text-slate-900">
              <h2 className="text-xs sm:text-base font-bold tracking-wider uppercase leading-tight">
                {HOSPITAL_HEADER_INFO.kabupaten}
              </h2>
              <h3 className="text-xs sm:text-sm font-bold tracking-wider uppercase leading-tight mt-0.5">
                {HOSPITAL_HEADER_INFO.dinas}
              </h3>
              <h1 className="text-sm sm:text-xl font-extrabold tracking-tight uppercase leading-tight mt-1 text-slate-950">
                {HOSPITAL_HEADER_INFO.namaRS}
              </h1>
              <p className="text-[11px] sm:text-xs font-sans text-slate-700 mt-1">
                {HOSPITAL_HEADER_INFO.alamat}
              </p>
              <p className="text-[11px] sm:text-xs font-sans text-slate-700">
                Email : <a href={`mailto:${HOSPITAL_HEADER_INFO.email}`} className="text-blue-700 underline">{HOSPITAL_HEADER_INFO.email}</a>
              </p>
            </div>

            {/* Placeholder kanan untuk simetri kop resmi */}
            <div className="w-12 sm:w-16 hidden xs:block shrink-0" />
          </div>

          {/* Garis Ganda Standar Kop Dinas (Tebal & Tipis) */}
          <div className="w-full h-0.5 bg-black mt-1" />
        </div>

        {/* ========================================================================= */}
        {/* JUDUL DOKUMEN & IDENTITAS SURVEI                                          */}
        {/* ========================================================================= */}
        <div className="text-center mt-2 sm:mt-4 mb-6 relative">
          
          {/* Badge Resmi yang Mewah & Elegan */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-rose-50 via-blue-50 to-indigo-50 border border-blue-200/80 shadow-xs text-blue-950 text-xs font-bold uppercase tracking-wider mb-3 print:hidden">
            <Sparkles className="w-3.5 h-3.5 text-rose-600" />
            <span>Kuesioner Resmi Rumah Sakit</span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          </div>

          {/* Judul Kuesioner dengan Tipografi Berkelas */}
          <h2 className="text-lg sm:text-2xl font-extrabold uppercase tracking-tight font-serif text-slate-950 leading-snug">
            KUESIONER SURVEY KEPUASAN PASIEN
            <div className="my-1 sm:my-1.5">
              <span className="inline-block px-3 py-0.5 rounded-lg bg-blue-50 border border-blue-200/70 text-blue-900 text-sm sm:text-lg font-sans font-bold shadow-2xs">
                PELAYANAN {activeServiceOption.label.toUpperCase()}
              </span>
            </div>
            <div className="text-sm sm:text-lg text-slate-800 font-bold font-sans tracking-normal mt-1 flex items-center justify-center gap-2">
              <span className="h-px w-8 sm:w-12 bg-gradient-to-r from-transparent to-rose-400" />
              <span>RSUD AERAMO - KABUPATEN NAGEKEO</span>
              <span className="h-px w-8 sm:w-12 bg-gradient-to-l from-transparent to-rose-400" />
            </div>
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 mt-2 font-sans max-w-lg mx-auto print:hidden">
            Mohon berikan penilaian objektif Anda untuk peningkatan mutu pelayanan kami
          </p>
        </div>

        {/* ========================================================================= */}
        {/* BAGIAN ATAS / PROFIL SESUAI PERSIS GAMBAR 2                               */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200 text-xs sm:text-sm space-y-4 font-sans mb-6">
          
          {/* Baris Tanggal Survei */}
          <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
            <span className="font-bold text-slate-800">Tanggal Survei :</span>
            <div className="sm:col-span-2">
              <input
                type="date"
                value={tanggalSurvei}
                onChange={e => setTanggalSurvei(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Baris Jam Survei */}
          <div className="grid grid-cols-1 sm:grid-cols-3 items-start sm:items-center gap-2">
            <span className="font-bold text-slate-800">Jam Survey :</span>
            <div className="sm:col-span-2 flex flex-wrap items-center gap-2.5">
              {(['08.00 – 14.00 WITA', '14.00 – 20.00 WITA'] as JamSurvei[]).map(slot => (
                <label 
                  key={slot} 
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold cursor-pointer select-none transition ${
                    jamSurvei === slot 
                      ? 'bg-blue-50 border-blue-600 text-blue-900 ring-1 ring-blue-500 shadow-xs' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="jamSurvei"
                    value={slot}
                    checked={jamSurvei === slot}
                    onChange={() => setJamSurvei(slot)}
                    className="w-4 h-4 text-blue-700 focus:ring-blue-600"
                  />
                  <span>{slot}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Nama Pasien (Opsional) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2 pt-2 border-t border-slate-200/60">
            <span className="font-bold text-slate-800">Nama Pasien (Opsional) :</span>
            <div className="sm:col-span-2">
              <input
                type="text"
                placeholder="Boleh dikosongkan jika ingin anonim..."
                value={namaPasien}
                onChange={e => setNamaPasien(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Header Sub-Bagian PROFIL */}
          <div className="pt-2 text-center font-bold uppercase tracking-widest text-slate-800 text-xs sm:text-sm">
            --- PROFIL ---
          </div>

          {/* Jenis Kelamin */}
          <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
            <span className="font-bold text-slate-800">Jenis Kelamin :</span>
            <div className="sm:col-span-2 flex items-center gap-3">
              {(['L', 'P'] as JenisKelamin[]).map(jk => (
                <label 
                  key={jk} 
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl border text-xs sm:text-sm font-semibold cursor-pointer select-none transition flex-1 sm:flex-initial ${
                    jenisKelamin === jk 
                      ? 'bg-blue-50 border-blue-600 text-blue-900 ring-1 ring-blue-500 shadow-xs' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="jenisKelamin"
                    value={jk}
                    checked={jenisKelamin === jk}
                    onChange={() => setJenisKelamin(jk)}
                    className="w-4 h-4 text-blue-700 focus:ring-blue-600"
                  />
                  <span className="font-bold">{jk}</span>
                  <span className="text-slate-500 font-normal text-xs">
                    ({jk === 'L' ? 'Laki-laki' : 'Perempuan'})
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Pendidikan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 items-start sm:items-center gap-2">
            <span className="font-bold text-slate-800">Pendidikan :</span>
            <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
              {(['SD', 'SMP', 'SMA', 'S1', 'S2'] as Pendidikan[]).map(pend => (
                <label 
                  key={pend} 
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer select-none transition ${
                    pendidikan === pend 
                      ? 'bg-blue-50 border-blue-600 text-blue-900 ring-1 ring-blue-500 shadow-xs' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="pendidikan"
                    value={pend}
                    checked={pendidikan === pend}
                    onChange={() => setPendidikan(pend)}
                    className="w-3.5 h-3.5 text-blue-700 focus:ring-blue-600"
                  />
                  <span>{pend}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Usia */}
          <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
            <span className="font-bold text-slate-800">Usia :</span>
            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={120}
                value={usia}
                onChange={e => setUsia(e.target.value)}
                className="w-24 px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-center text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <span className="text-slate-700 font-medium">tahun</span>
            </div>
          </div>

          {/* Pekerjaan */}
          <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2">
            <span className="font-bold text-slate-800 mt-1">Pekerjaan :</span>
            <div className="sm:col-span-2 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {(['PNS', 'TNI', 'POLRI', 'SWASTA', 'WIRAUSAHA', 'LAINNYA'] as Pekerjaan[]).map(pek => (
                  <label 
                    key={pek} 
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer select-none transition ${
                      pekerjaan === pek 
                        ? 'bg-blue-50 border-blue-600 text-blue-900 ring-1 ring-blue-500 shadow-xs' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="pekerjaan"
                      value={pek}
                      checked={pekerjaan === pek}
                      onChange={() => setPekerjaan(pek)}
                      className="w-3.5 h-3.5 text-blue-700 focus:ring-blue-600"
                    />
                    <span>{pek}</span>
                  </label>
                ))}
              </div>
              {pekerjaan === 'LAINNYA' && (
                <input
                  type="text"
                  placeholder="Sebutkan jenis pekerjaan Anda..."
                  value={pekerjaanLainnya}
                  onChange={e => setPekerjaanLainnya(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              )}
            </div>
          </div>

          {/* Jenis layanan yang diterima (DROPDOWN DENGAN PERTANYAAN DINAMIS PER LAYANAN) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 items-start sm:items-center gap-2 pt-2 border-t border-slate-200/60">
            <div>
              <span className="font-bold text-slate-800 block">Jenis layanan yang diterima :</span>
              <span className="text-[11px] text-blue-700 font-semibold">Pilih jenis layanan untuk evaluasi</span>
            </div>
            <div className="sm:col-span-2 space-y-2">
              <div className="relative">
                <select
                  value={selectedServiceKey}
                  onChange={e => handleServiceChange(e.target.value as ServiceKey)}
                  className="w-full appearance-none px-4 py-2.5 pr-10 rounded-xl border-2 border-blue-600/70 bg-white font-bold text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition cursor-pointer shadow-xs"
                >
                  {SERVICE_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id} className="text-slate-900 font-medium py-1">
                      {opt.label} ({getQuestionsForService(opt.id).flatMap(s => s.questions).length} Soal)
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-blue-700">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              {/* Input nama kustom jika memilih opsi "Lainnya" */}
              {selectedServiceKey === 'lainnya' && (
                <input
                  type="text"
                  placeholder="Ketikkan nama unit atau poli lainnya di RSUD Aeramo..."
                  value={customLayananText}
                  onChange={e => {
                    const txt = e.target.value;
                    setCustomLayananText(txt);
                    setJenisLayanan(txt.trim() || 'Layanan Lainnya');
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-blue-300 bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              )}

              {/* Keterangan singkat layanan yang dipilih */}
              <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200">
                <span className="font-semibold text-blue-800">Unit Terpilih:</span>
                <span className="truncate">{activeServiceOption.description}</span>
              </div>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* INSTRUKSI SURVEI (SESUAI GAMBAR 1)                                        */}
        {/* ========================================================================= */}
        <div className="mb-6 space-y-2 text-xs sm:text-sm text-slate-700">
          <p className="font-bold text-slate-900">Instruksi:</p>
          <p className="leading-relaxed text-justify">
            {HOSPITAL_HEADER_INFO.instruksi}
          </p>
        </div>

        {/* ========================================================================= */}
        {/* BILAH KONTROL: PROGRESS SURVEI & TOGGLE FORMAT RESPONSIF LAYAR HP         */}
        {/* ========================================================================= */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-900 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Progres Kuesioner:
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                answeredCount === totalQuestionsCount 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-blue-600 text-white'
              }`}>
                {answeredCount} dari {totalQuestionsCount} Soal Terjawab
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-700/50 px-2 py-0.5 rounded-md">
                <Smartphone className="w-3 h-3" />
                <span>Pas Layar HP (Tanpa Geser)</span>
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full sm:w-64 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${totalQuestionsCount > 0 ? Math.round((answeredCount / totalQuestionsCount) * 100) : 0}%` }}
              />
            </div>
          </div>

          {/* Toggle Tampilan: Format Tabel (Banyak Pertanyaan) vs Kartu Vertikal */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700/80 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Format Tabel ({totalQuestionsCount} Soal)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                viewMode === 'cards'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Format Kartu</span>
            </button>
          </div>
        </div>

        {/* Informasi Layanan yang Sedang Dievaluasi */}
        <div className="mb-6 p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between gap-2 print:hidden">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
            <p className="text-xs sm:text-sm text-slate-800 font-bold truncate">
              Kuesioner Layanan: <span className="text-blue-800 underline">{activeServiceOption.label}</span>
            </p>
          </div>
          <span className="text-[11px] font-semibold text-blue-700 bg-white px-2.5 py-0.5 rounded-md border border-blue-200 shrink-0">
            {totalQuestionsCount} Pertanyaan Evaluasi
          </span>
        </div>

        {/* ========================================================================= */}
        {/* TABEL ASPEK YANG DISURVEI (DINAMIS SESUAI JENIS LAYANAN YANG DIPILIH)     */}
        {/* ========================================================================= */}
        {currentSections.map(section => (
          <div key={section.id} className="mb-8 space-y-4">
            
            {/* Judul Bagian */}
            <div className="border-b-2 border-slate-900 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-700 inline-block"></span>
                  <span>{section.title}</span>
                </h3>
                {section.description && (
                  <p className="text-xs text-slate-500 mt-0.5">{section.description}</p>
                )}
              </div>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full w-fit">
                {section.questions.length} Pertanyaan
              </span>
            </div>

            {/* 1. TAMPILAN DALAM FORMAT TABEL (DESKTOP TABEL LENGKAP & MOBILE PAS LAYAR HP TANPA PERLU DIGESER) */}
            {viewMode === 'table' && (
              <div className="print:hidden space-y-3">
                {/* 1A. TAMPILAN DESKTOP (MD KE ATAS): TABEL RESMI RAPI DENGAN EMOJI, ANGKA, DAN TEKS */}
                <div className="hidden md:block rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                  <table className="w-full border-collapse text-left text-xs sm:text-sm table-fixed">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-bold">
                        <th className="p-3 w-12 text-center border-r border-slate-200/80">No</th>
                        <th className="p-3 border-r border-slate-200/80">
                          Aspek &amp; Uraian Penilaian
                        </th>
                        {[
                          { value: 1, label: 'Skala 1 (Kurang)', emoji: '😡', theme: 'bg-rose-50 text-rose-900 border-rose-200' },
                          { value: 2, label: 'Skala 2 (Cukup)', emoji: '😮', theme: 'bg-amber-50 text-amber-900 border-amber-200' },
                          { value: 3, label: 'Skala 3 (Baik)', emoji: '😊', theme: 'bg-blue-50 text-blue-900 border-blue-200' },
                          { value: 4, label: 'Skala 4 (Sangat Baik)', emoji: '🤩', theme: 'bg-emerald-50 text-emerald-900 border-emerald-200' },
                        ].map(col => {
                          return (
                            <th 
                              key={col.value} 
                              className={`p-2.5 w-32 text-center border-r border-slate-200/80 last:border-r-0 ${col.theme}`}
                            >
                              <div className="flex flex-col items-center justify-center gap-0.5">
                                <span className="text-xl select-none" role="img" aria-label={col.label}>
                                  {col.emoji}
                                </span>
                                <span className="font-bold text-xs leading-tight">
                                  {col.label}
                                </span>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {section.questions.map((q, idx) => {
                        const currentVal = answers[q.id];
                        const isAnswered = currentVal !== undefined;
                        const qOptions = q.options && q.options.length === 4 ? q.options : SKALA_OPTIONS;

                        return (
                          <tr 
                            key={q.id}
                            className={`transition-colors ${
                              isAnswered ? 'bg-white hover:bg-slate-50/60' : 'bg-rose-50/15 hover:bg-rose-50/30'
                            }`}
                          >
                            {/* Kolom 1: Nomor */}
                            <td className="p-3 text-center align-middle font-bold text-slate-700 border-r border-slate-100">
                              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold inline-flex items-center justify-center border border-slate-200">
                                {idx + 1}
                              </span>
                            </td>

                            {/* Kolom 2: Aspek & Uraian */}
                            <td className="p-3.5 align-middle border-r border-slate-100 space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                  {q.aspek}
                                </span>
                                {isAnswered ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <Check className="w-3 h-3 text-emerald-600" />
                                    <span>Nilai {currentVal}</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                    Wajib
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                {q.uraian}
                              </p>
                            </td>

                            {/* Kolom 3-6: Pilihan Skala Nilai 1, 2, 3, 4 (Dengan Text Spesifik Tiap Pertanyaan) */}
                            {qOptions.map(opt => {
                              const isSelected = currentVal === opt.value;
                              return (
                                <td 
                                  key={opt.value} 
                                  className="p-2 text-center align-middle border-r border-slate-100 last:border-r-0"
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleSelectAnswer(q.id, opt.value)}
                                    title={`${opt.label}: ${opt.description || ''}`}
                                    className={`w-full py-2.5 px-1 rounded-xl border transition-all active:scale-95 flex flex-col items-center justify-center gap-0.5 select-none cursor-pointer ${
                                      isSelected
                                        ? opt.value === 1
                                          ? 'bg-rose-600 text-white border-rose-700 shadow-sm ring-2 ring-rose-300'
                                          : opt.value === 2
                                            ? 'bg-amber-500 text-white border-amber-600 shadow-sm ring-2 ring-amber-300'
                                            : opt.value === 3
                                              ? 'bg-blue-600 text-white border-blue-700 shadow-sm ring-2 ring-blue-300'
                                              : 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-300'
                                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                                    }`}
                                  >
                                    <span className="text-lg select-none" role="img" aria-label={opt.label}>
                                      {opt.emoji || (opt.value === 1 ? '😡' : opt.value === 2 ? '😮' : opt.value === 3 ? '😊' : '🤩')}
                                    </span>
                                    <span className="text-xs font-bold flex items-center gap-0.5">
                                      <span>{opt.value}</span>
                                      {isSelected && <Check className="w-3 h-3 text-white" />}
                                    </span>
                                    <span className={`text-[10px] font-bold leading-tight line-clamp-2 px-0.5 ${
                                      isSelected ? 'text-white' : 'text-slate-700'
                                    }`}>
                                      {opt.label}
                                    </span>
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 1B. TAMPILAN KHUSUS PONSEL / LAYAR HP (< MD): 100% PAS LAYAR, TIDAK PERLU DIGESER SAMA SEKALI */}
                <div className="md:hidden space-y-3">
                  {section.questions.map((q, idx) => {
                    const currentVal = answers[q.id];
                    const isAnswered = currentVal !== undefined;
                    const qOptions = q.options && q.options.length === 4 ? q.options : SKALA_OPTIONS;

                    return (
                      <div 
                        key={q.id}
                        className={`p-3 rounded-2xl border transition-colors shadow-2xs space-y-2.5 ${
                          isAnswered ? 'bg-white border-slate-200' : 'bg-rose-50/20 border-rose-200'
                        }`}
                      >
                        {/* Header Soal: Nomor + Aspek + Status */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <span className="w-6 h-6 rounded-full bg-blue-700 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <div>
                              <h4 className="font-bold text-slate-900 text-xs leading-snug">
                                {q.aspek}
                              </h4>
                              <p className="text-[11px] text-slate-600 leading-relaxed mt-0.5">
                                {q.uraian}
                              </p>
                            </div>
                          </div>
                          {isAnswered ? (
                            <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <Check className="w-3 h-3 text-emerald-700" />
                              <span>{currentVal}</span>
                            </span>
                          ) : (
                            <span className="shrink-0 text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              Wajib
                            </span>
                          )}
                        </div>

                        {/* 4 Opsi Jawaban dalam Grid 4 Kolom (Pas 100% Layar HP, Disertai Emoji + Angka + Text Lengkap) */}
                        <div className="grid grid-cols-4 gap-1 sm:gap-1.5 w-full pt-1">
                          {qOptions.map(opt => {
                            const isSelected = currentVal === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleSelectAnswer(q.id, opt.value)}
                                className={`w-full min-h-[64px] py-2 px-1 rounded-xl border flex flex-col items-center justify-between text-center transition-all active:scale-95 select-none cursor-pointer ${
                                  isSelected
                                    ? opt.value === 1
                                      ? 'bg-rose-600 text-white border-rose-700 shadow-sm ring-2 ring-rose-300'
                                      : opt.value === 2
                                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm ring-2 ring-amber-300'
                                        : opt.value === 3
                                          ? 'bg-blue-600 text-white border-blue-700 shadow-sm ring-2 ring-blue-300'
                                          : 'bg-emerald-600 text-white border-emerald-700 shadow-sm ring-2 ring-emerald-300'
                                    : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                                }`}
                              >
                                <span className="text-lg select-none" role="img" aria-label={opt.label}>
                                  {opt.emoji || (opt.value === 1 ? '😡' : opt.value === 2 ? '😮' : opt.value === 3 ? '😊' : '🤩')}
                                </span>
                                <span className="text-xs font-bold flex items-center justify-center gap-0.5">
                                  <span>{opt.value}</span>
                                  {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                                </span>
                                <span className={`text-[9px] font-bold leading-tight line-clamp-2 px-0.5 ${
                                  isSelected ? 'text-white' : 'text-slate-700'
                                }`}>
                                  {opt.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. TAMPILAN ALTERNATIF KARTU VERTIKAL (JUGA 100% PAS LAYAR HP, BEBAS GESER) */}
            {viewMode === 'cards' && (
              <div className="space-y-4 print:hidden">
                {section.questions.map((q, idx) => {
                  const qOptions = q.options && q.options.length === 4 ? q.options : SKALA_OPTIONS;

                  return (
                    <div 
                      key={q.id}
                      className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 transition-all"
                    >
                      {/* Header Soal & Aspek */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-blue-800 text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                            {q.aspek}
                          </h4>
                        </div>
                        {answers[q.id] ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 w-fit self-start sm:self-auto border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-700" />
                            <span>Nilai {answers[q.id]} Terpilih</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 w-fit self-start sm:self-auto">
                            Wajib dipilih
                          </span>
                        )}
                      </div>

                      {/* Uraian Pertanyaan */}
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                        {q.uraian}
                      </p>

                      {/* 4 Pilihan Jawaban dalam Grid Responsif (Pas Layar HP, Disertai Text Lengkap) */}
                      <div className="grid grid-cols-4 gap-1 sm:gap-2 pt-1">
                        {qOptions.map(opt => {
                          const isSelected = answers[q.id] === opt.value;
                          const colors = getOptionColors(opt.value, isSelected);

                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => handleSelectAnswer(q.id, opt.value)}
                              className={`text-center rounded-xl p-2 sm:p-3 border transition-all active:scale-95 flex flex-col items-center justify-between gap-1 cursor-pointer select-none min-h-[70px] sm:min-h-[85px] ${colors.card}`}
                            >
                              <span className="text-xl sm:text-2xl select-none" role="img" aria-label={opt.label}>
                                {opt.emoji || (opt.value === 1 ? '😡' : opt.value === 2 ? '😮' : opt.value === 3 ? '😊' : '🤩')}
                              </span>
                              <div className="w-full">
                                <span className="font-bold text-xs block text-slate-900 flex items-center justify-center gap-0.5">
                                  <span>{opt.value}.</span>
                                  {isSelected && (
                                    <span className="w-3.5 h-3.5 rounded-full bg-slate-900 text-white inline-flex items-center justify-center">
                                      <Check className="w-2 h-2 text-white" />
                                    </span>
                                  )}
                                </span>
                                <span className="font-bold text-[9px] sm:text-xs block text-slate-800 leading-tight line-clamp-2">
                                  {opt.label}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAMPILAN CETAK FISIK (TABEL HITAM PUTIH RESMI KETIKA DI-PRINT KE KERTAS) */}
            <div className="hidden print:block overflow-x-auto border-2 border-slate-900 rounded-xl">
              <table className="w-full border-collapse text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-900 text-slate-900 font-bold">
                    <th className="p-3 border-r border-slate-900 w-1/4 sm:w-1/4 text-center">
                      Aspek yang Disurvei
                    </th>
                    <th className="p-3 border-r border-slate-900 w-2/5 sm:w-2/5 text-center">
                      Uraian
                    </th>
                    <th className="p-3 w-1/3 sm:w-1/3 text-center">
                      Skala Kepuasan
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y border-slate-900">
                  {section.questions.map((q, idx) => {
                    const qOptions = q.options && q.options.length === 4 ? q.options : SKALA_OPTIONS;

                    return (
                      <tr key={q.id}>
                        {/* Kolom 1: Aspek */}
                        <td className="p-3 border-r border-slate-900 font-bold text-slate-900 align-top">
                          {idx + 1}. {q.aspek}
                        </td>

                        {/* Kolom 2: Uraian */}
                        <td className="p-3 border-r border-slate-900 text-slate-800 leading-relaxed align-top">
                          {q.uraian}
                        </td>

                        {/* Kolom 3: Skala Kepuasan */}
                        <td className="p-3 align-top">
                          <div className="space-y-1.5">
                            {qOptions.map(opt => (
                              <div key={opt.value} className="flex items-center gap-2 text-xs">
                                <span className={`w-3.5 h-3.5 border border-slate-700 inline-block text-center text-[10px] leading-3 ${answers[q.id] === opt.value ? 'bg-slate-900 text-white font-bold' : ''}`}>
                                  {answers[q.id] === opt.value ? '✓' : ''}
                                </span>
                                <span>{opt.label} {opt.shortLabel ? `(${opt.shortLabel})` : ''}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        ))}

        {/* Saran Tambahan (Opsional) */}
        <div className="mb-6 space-y-1.5">
          <label className="block text-xs sm:text-sm font-bold text-slate-800">
            Saran & Masukan untuk RSUD Aeramo (Opsional) :
          </label>
          <textarea
            rows={3}
            placeholder="Tulis kritik atau saran membangun Anda untuk perbaikan fasilitas dan pelayanan kami..."
            value={saran}
            onChange={e => setSaran(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Action Buttons Bar */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <button
            type="button"
            onClick={handleResetForm}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
          >
            Reset Isian
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            id="btn-submit-aeramo-survey"
            className="w-full sm:w-auto flex-1 max-w-md py-3 px-6 rounded-xl bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-900/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Menyimpan ke Google Sheet...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Kirim Survei ke Google Sheet</span>
              </>
            )}
          </button>
        </div>

        </div>

      </form>

      {/* MODAL POP-UP KONFIRMASI SETELAH SURVEI DIINPUT / DISUBMIT */}
      {submittedModalData && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-200 relative overflow-hidden">
            
            {/* Latar Belakang Mawar Cantik */}
            <div className="absolute -top-12 -right-12 opacity-[0.08] pointer-events-none transform -rotate-12">
              <RoseWatermarkIcon className="w-56 h-56" />
            </div>

            {/* Header Icon Status Berhasil */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 border-2 border-emerald-300 text-emerald-700 flex items-center justify-center shadow-lg mb-3 ring-4 ring-emerald-50">
                <CheckCircle2 className="w-9 h-9 text-emerald-600 animate-bounce" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Survei Berhasil Dikirim &amp; Disimpan</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Terima Kasih atas Penilaian Anda!
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                RSUD Aeramo • Pemerintah Kabupaten Nagekeo
              </p>
            </div>

            {/* Kartu Ringkasan Hasil Pengisian Pasien */}
            <div className="relative z-10 bg-gradient-to-br from-slate-50 via-blue-50/50 to-emerald-50/50 p-4 sm:p-5 rounded-2xl border border-slate-200/90 text-left space-y-2.5 text-xs">
              
              <div className="flex justify-between items-center border-b border-slate-200/70 pb-2">
                <span className="text-slate-500 font-medium">Nomor Registrasi Responden:</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                  {submittedModalData.id}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Nama Pasien:</span>
                <span className="font-bold text-slate-900 uppercase">
                  {submittedModalData.namaPasien || '(Anonim)'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Unit Layanan Dinilai:</span>
                <span className="font-semibold text-slate-800">
                  {submittedModalData.jenisLayanan}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200/70">
                <span className="text-slate-600 font-bold">Indeks Kepuasan (IKM):</span>
                <span className="font-black text-blue-900 bg-blue-100/90 px-2.5 py-1 rounded-lg border border-blue-200">
                  {submittedModalData.ikmScore}% • {submittedModalData.mutuLayanan}
                </span>
              </div>

              {submittedModalData.patientPin && (
                <div className="flex justify-between items-center text-[11px] text-emerald-800 bg-emerald-50/80 p-2 rounded-lg border border-emerald-200">
                  <span className="font-medium">Status PIN Pasien:</span>
                  <span className="font-bold">✓ Terpakai &amp; Terkunci Otomatis</span>
                </div>
              )}
            </div>

            {/* Pesan Apresiasi Direksi RSUD Aeramo */}
            <p className="relative z-10 text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
              Setiap kritik, saran, dan nilai yang Anda berikan menjadi amanah berharga bagi perbaikan sarana, keramahan petugas, dan mutu pelayanan kesehatan RSUD Aeramo ke depannya.
            </p>

            {/* Tombol Aksi */}
            <div className="relative z-10 pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full sm:w-auto px-4 py-3 rounded-2xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Bukti</span>
              </button>

              <button
                type="button"
                onClick={handleFinishAndLock}
                className="w-full flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 hover:from-blue-800 hover:to-indigo-950 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition"
              >
                <span>Selesai &amp; Kunci Akses Formulir</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
