import React from 'react';

interface RoseWatermarkProps {
  className?: string;
  opacity?: string;
}

/**
 * Komponen Vektor Watermark Bunga Mawar Elegan (Rose Watermark)
 * Didesain khusus dengan garis kelopak bertingkat berkesan anggun & profesional
 * Cocok sebagai latar belakang kertas kuesioner dan background aplikasi.
 */
export const RoseWatermarkIcon: React.FC<RoseWatermarkProps> = ({ 
  className = "w-96 h-96", 
  opacity = "opacity-[0.04]" 
}) => {
  return (
    <svg 
      viewBox="0 0 500 500" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={`${className} ${opacity} pointer-events-none select-none`}
      aria-hidden="true"
    >
      {/* Kelopak Luar Mawar */}
      <path 
        d="M250 80 C290 80, 360 110, 380 160 C400 210, 390 270, 360 320 C330 370, 290 410, 250 430 C210 410, 170 370, 140 320 C110 270, 100 210, 120 160 C140 110, 210 80, 250 80 Z" 
        stroke="currentColor" 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* Layer Kelopak Tengah Mawar */}
      <path 
        d="M210 140 C240 110, 290 110, 320 145 C350 180, 355 230, 335 275 C315 320, 275 350, 245 360 C215 350, 175 320, 160 275 C145 230, 160 175, 210 140 Z" 
        stroke="currentColor" 
        strokeWidth="3.5" 
      />

      <path 
        d="M280 160 C330 180, 340 230, 320 270 C300 310, 260 330, 230 330 C190 330, 170 290, 180 250 C190 210, 230 190, 270 195" 
        stroke="currentColor" 
        strokeWidth="3" 
      />

      {/* Inti Kuncup Kelopak Mawar (Rose Bud Core) */}
      <path 
        d="M245 200 C265 190, 285 205, 280 225 C275 245, 250 255, 235 245 C220 235, 225 210, 245 200 Z" 
        stroke="currentColor" 
        strokeWidth="3" 
      />
      <path 
        d="M240 215 C250 210, 260 215, 260 225 C260 235, 248 240, 240 235 C232 230, 232 220, 240 215 Z" 
        stroke="currentColor" 
        strokeWidth="2.5" 
      />

      {/* Garis Spiral Lipatan Kelopak Bunga Mawar */}
      <path 
        d="M170 200 C150 240, 160 290, 200 330 C240 370, 290 370, 330 330 C370 290, 370 230, 340 180" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeDasharray="1 1"
      />
      <path 
        d="M190 160 C150 190, 140 250, 170 300 C200 350, 270 380, 320 350" 
        stroke="currentColor" 
        strokeWidth="2.5" 
      />
      <path 
        d="M310 150 C350 190, 360 250, 330 300 C300 350, 230 380, 180 350" 
        stroke="currentColor" 
        strokeWidth="2.5" 
      />

      {/* Kelopak Samping & Daun Penyangga Bawah */}
      <path 
        d="M250 430 C240 460, 210 480, 180 470 C150 460, 160 430, 180 415 C200 400, 230 410, 250 430 Z" 
        stroke="currentColor" 
        strokeWidth="2.5" 
      />
      <path 
        d="M250 430 C260 460, 290 480, 320 470 C350 460, 340 430, 320 415 C300 400, 270 410, 250 430 Z" 
        stroke="currentColor" 
        strokeWidth="2.5" 
      />
      
      {/* Batang & Duri Halus Estetik */}
      <path 
        d="M250 430 Q245 460 240 495" 
        stroke="currentColor" 
        strokeWidth="3" 
        strokeLinecap="round" 
      />
      <path 
        d="M242 465 Q230 460 225 455" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
      <path 
        d="M245 480 Q258 475 262 470" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />

      {/* Daun Mawar Kiri */}
      <path 
        d="M130 280 C80 270, 50 310, 60 340 C70 370, 120 370, 150 340 C180 310, 160 285, 130 280 Z" 
        stroke="currentColor" 
        strokeWidth="2" 
      />
      <path 
        d="M75 325 Q110 320 140 330" 
        stroke="currentColor" 
        strokeWidth="1.5" 
      />

      {/* Daun Mawar Kanan */}
      <path 
        d="M370 280 C420 270, 450 310, 440 340 C430 370, 380 370, 350 340 C320 310, 340 285, 370 280 Z" 
        stroke="currentColor" 
        strokeWidth="2" 
      />
      <path 
        d="M425 325 Q390 320 360 330" 
        stroke="currentColor" 
        strokeWidth="1.5" 
      />
    </svg>
  );
};

/**
 * Latar Belakang Pola Watermark Mawar Seluruh Layar (Full App Background Watermark)
 */
export const RoseWatermarkBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      
      {/* Mawar Besar di Kiri Atas */}
      <div className="absolute -top-24 -left-24 text-rose-800 opacity-[0.035] transform -rotate-12">
        <RoseWatermarkIcon className="w-[450px] h-[450px] sm:w-[600px] sm:h-[600px]" />
      </div>

      {/* Mawar Besar di Kanan Bawah */}
      <div className="absolute -bottom-28 -right-28 text-rose-900 opacity-[0.035] transform rotate-45">
        <RoseWatermarkIcon className="w-[500px] h-[500px] sm:w-[680px] sm:h-[680px]" />
      </div>

      {/* Mawar Halus di Sisi Tengah Kanan */}
      <div className="hidden md:block absolute top-1/3 -right-20 text-rose-700 opacity-[0.025] transform rotate-15">
        <RoseWatermarkIcon className="w-[380px] h-[380px]" />
      </div>

      {/* Mawar Halus di Sisi Tengah Kiri */}
      <div className="hidden md:block absolute bottom-1/4 -left-20 text-rose-700 opacity-[0.025] transform -rotate-45">
        <RoseWatermarkIcon className="w-[380px] h-[380px]" />
      </div>

      {/* Partikel Kelopak Mawar Lembut Melayang */}
      <div className="absolute inset-0 bg-[radial-gradient(#f43f5e_0.75px,transparent_0.75px)] [background-size:36px_36px] opacity-[0.02]" />
    </div>
  );
};
