import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Pause, 
  Play, 
  Building2, 
  BedDouble, 
  Stethoscope, 
  HeartPulse, 
  UserCheck, 
  Pill, 
  FlaskConical, 
  Scan, 
  Baby, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { NagekeoLogo } from './NagekeoLogo';
import { HOSPITAL_HEADER_INFO } from '../surveyConfig';

export interface BannerSlide {
  id: number;
  title: string;
  subtitle: string;
  category: string;
  imageUrl: string;
  icon: React.ReactNode;
  tag: string;
}

export const BANNER_SLIDES: BannerSlide[] = [
  {
    id: 1,
    title: 'Gedung Utama & Pelayanan RSUD Aeramo',
    subtitle: 'Pusat Layanan Kesehatan Terpadu, Modern & Terpercaya Kabupaten Nagekeo',
    category: 'Profil Rumah Sakit',
    tag: 'RSUD Aeramo Nagekeo',
    imageUrl: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=1600&q=80',
    icon: <Building2 className="w-4 h-4" />
  },
  {
    id: 2,
    title: 'Pelayanan Rawat Inap Nyaman & Higienis',
    subtitle: 'Fasilitas kamar berstandar dengan kebersihan, ketenangan & kenyamanan optimal',
    category: 'Instalasi Rawat Inap',
    tag: 'Kenyamanan Pasien',
    imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1600&q=80',
    icon: <BedDouble className="w-4 h-4" />
  },
  {
    id: 3,
    title: 'Pemeriksaan & Konsultasi Dokter Spesialis',
    subtitle: 'Pelayanan medis komprehensif, komunikatif, dan penuh dedikasi untuk kesembuhan pasien',
    category: 'Tenaga Medis',
    tag: 'Dokter Spesialis & Umum',
    imageUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=1600&q=80',
    icon: <Stethoscope className="w-4 h-4" />
  },
  {
    id: 4,
    title: 'Instalasi Gawat Darurat (IGD) 24 Jam',
    subtitle: 'Kesiapsiagaan penanganan gawat darurat cepat, sigap, dan profesional setiap saat',
    category: 'Gawat Darurat',
    tag: 'Siaga 24 Jam',
    imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1600&q=80',
    icon: <HeartPulse className="w-4 h-4" />
  },
  {
    id: 5,
    title: 'Keperawatan Responsif & Penuh Empati',
    subtitle: 'Perawat dan bidan yang ramah, cekatan, dan siap melayani dengan ketulusan hati',
    category: 'Asuhan Keperawatan',
    tag: 'Pelayanan Humanis',
    imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1600&q=80',
    icon: <UserCheck className="w-4 h-4" />
  },
  {
    id: 6,
    title: 'Instalasi Farmasi & Pelayanan Obat Cepat',
    subtitle: 'Ketersediaan obat bermutu, informasi penggunaan jelas, dan penyerahan resep tepat waktu',
    category: 'Farmasi & Apotek',
    tag: 'Obat Terjamin & Akurat',
    imageUrl: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=1600&q=80',
    icon: <Pill className="w-4 h-4" />
  },
  {
    id: 7,
    title: 'Laboratorium Diagnostik Terintegrasi',
    subtitle: 'Pemeriksaan laboratorium akurat didukung teknologi mutakhir dan analis kompeten',
    category: 'Laboratorium Klinik',
    tag: 'Diagnostik Akurat',
    imageUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1600&q=80',
    icon: <FlaskConical className="w-4 h-4" />
  },
  {
    id: 8,
    title: 'Pelayanan Radiologi & Pencitraan Medis',
    subtitle: 'Fasilitas rontgen dan radiodiagnostik modern untuk penegakan diagnosis yang presisi',
    category: 'Radiologi',
    tag: 'Pencitraan Medis',
    imageUrl: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1600&q=80',
    icon: <Scan className="w-4 h-4" />
  },
  {
    id: 9,
    title: 'Pelayanan Kebidanan & Kesehatan Ibu Anak',
    subtitle: 'Perawatan persalinan aman, ramah ibu dan anak, serta pendampingan laktasi profesional',
    category: 'Kebidanan & KIA',
    tag: 'Ibu & Anak Sehat',
    imageUrl: 'https://images.unsplash.com/photo-1531983412531-1f49a365ffed?auto=format&fit=crop&w=1600&q=80',
    icon: <Baby className="w-4 h-4" />
  },
  {
    id: 10,
    title: 'Lingkungan Rumah Sakit Asri & Ramah Pasien',
    subtitle: 'Komitmen mutu berkelanjutan demi kepuasan dan keselamatan seluruh masyarakat Nagekeo',
    category: 'Budaya Mutu & Keselamatan',
    tag: 'Keselamatan Pasien',
    imageUrl: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1600&q=80',
    icon: <Sparkles className="w-4 h-4" />
  }
];

export const HospitalBannerSlider: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % BANNER_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + BANNER_SLIDES.length) % BANNER_SLIDES.length);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (!isPaused) {
      timerRef.current = setInterval(() => {
        nextSlide();
      }, 5000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, nextSlide]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (diff > 50) {
      nextSlide();
    } else if (diff < -50) {
      prevSlide();
    }
    setTouchStart(null);
  };

  const currentSlide = BANNER_SLIDES[currentIndex];

  return (
    <div 
      className="relative w-full rounded-3xl overflow-hidden shadow-xl border border-slate-200/90 group select-none print:hidden bg-slate-950"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Container Gambar Slider */}
      <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden">
        {BANNER_SLIDES.map((slide, idx) => {
          const isActive = idx === currentIndex;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105 pointer-events-none'
              } transform transition-transform duration-7000`}
            >
              <img
                src={slide.imageUrl}
                alt={slide.title}
                className="w-full h-full object-cover object-center brightness-[0.78] contrast-[1.05]"
                loading={idx === 0 ? 'eager' : 'lazy'}
              />
              
              {/* Overlay Gradient Elegan untuk Keterbacaan Teks Maksimal */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/30 to-transparent" />
            </div>
          );
        })}

        {/* Badge Identitas Resmi RSUD Aeramo di Pojok Kiri Atas */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-3 bg-slate-900/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 shadow-lg text-white">
          <div className="p-1.5 bg-white rounded-xl shadow-xs shrink-0 ring-2 ring-white/30">
            <NagekeoLogo className="w-7 h-9 object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-blue-300">
                {HOSPITAL_HEADER_INFO.dinas}
              </span>
              <span className="w-1 h-1 rounded-full bg-blue-400" />
              <span className="text-[10px] text-slate-300 font-medium">Nagekeo</span>
            </div>
            <h3 className="text-xs sm:text-sm font-extrabold text-white tracking-wide uppercase">
              {HOSPITAL_HEADER_INFO.namaRS}
            </h3>
          </div>
        </div>

        {/* Tombol Play / Pause & Counter di Pojok Kanan Atas */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/20 text-white font-mono text-xs font-bold shadow-md">
            {currentIndex + 1} <span className="text-slate-400 font-normal">/</span> {BANNER_SLIDES.length}
          </span>
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className="w-8 h-8 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-slate-800 transition shadow-md"
            title={isPaused ? 'Lanjutkan Auto-Slide' : 'Jeda Slider'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Konten Teks Keterangan Slide di Bagian Bawah */}
        <div className="absolute bottom-6 left-4 right-4 sm:left-6 sm:right-6 z-20 text-white space-y-2 max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/90 backdrop-blur-sm border border-blue-400/40 text-[11px] sm:text-xs font-bold text-white shadow-xs">
              {currentSlide.icon}
              <span>{currentSlide.tag}</span>
            </span>

            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Standar Mutu Pelayanan</span>
            </span>
          </div>

          <h2 className="text-base sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
            {currentSlide.title}
          </h2>

          <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 drop-shadow-xs font-medium max-w-xl">
            {currentSlide.subtitle}
          </p>
        </div>

        {/* Navigasi Panah Kiri & Kanan */}
        <button
          type="button"
          onClick={prevSlide}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-900/95 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition opacity-80 group-hover:opacity-100 hover:scale-105 active:scale-95 shadow-lg"
          title="Slide Sebelumnya"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          type="button"
          onClick={nextSlide}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-900/95 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition opacity-80 group-hover:opacity-100 hover:scale-105 active:scale-95 shadow-lg"
          title="Slide Berikutnya"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Progress Bar Waktu Slide */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
          <div 
            key={currentIndex}
            className={`h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all ${
              isPaused ? 'w-full opacity-60' : 'w-full animate-[progress_5000ms_linear]'
            }`}
          />
        </div>

      </div>

      {/* Bar Indikator 10 Titik / Navigasi Slide di Bawah */}
      <div className="bg-slate-900/95 backdrop-blur-md px-4 py-3 flex items-center justify-between gap-3 border-t border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          {BANNER_SLIDES.map((slide, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => goToSlide(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  isActive 
                    ? 'w-8 bg-blue-500 shadow-xs shadow-blue-500/50' 
                    : 'w-2.5 bg-slate-700 hover:bg-slate-500'
                }`}
                title={`Slide ${idx + 1}: ${slide.title}`}
              />
            );
          })}
        </div>

        <div className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
          Geser atau klik untuk melihat layanan RSUD Aeramo
        </div>
      </div>

    </div>
  );
};
