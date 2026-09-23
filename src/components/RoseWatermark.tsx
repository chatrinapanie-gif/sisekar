import React from 'react';

interface RoseWatermarkProps {
  className?: string;
  opacity?: string;
  variant?: 'outline' | 'filled' | 'duotone';
  color?: string;
}

/**
 * Komponen Vektor Watermark Bunga Mawar Merah Mewah (Masterpiece Botanical Crimson Rose)
 * Didesain dengan detail anatomi botani presisi, lekukan kelopak berlapis berestetika tinggi,
 * gradasi bayangan beludru merah crimson mewah, serta tekstur urat daun elegan.
 */
export const RoseWatermarkIcon: React.FC<RoseWatermarkProps> = ({ 
  className = "w-96 h-96", 
  opacity = "opacity-100",
}) => {
  const uniqueId = React.useId().replace(/:/g, '_');

  return (
    <svg 
      viewBox="0 0 600 600" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={`${className} ${opacity} pointer-events-none select-none`}
      aria-hidden="true"
    >
      <defs>
        {/* Gradasi Utama Kelopak Merah Mawar Beludru (Velvet Crimson Rose Gradient) */}
        <linearGradient id={`rosePrimary_${uniqueId}`} x1="150" y1="100" x2="450" y2="480" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="25%" stopColor="#f43f5e" />
          <stop offset="55%" stopColor="#e11d48" />
          <stop offset="80%" stopColor="#be123c" />
          <stop offset="100%" stopColor="#881337" />
        </linearGradient>

        {/* Gradasi Bayangan Dalam Kelopak (Deep Velvet Shadow) */}
        <linearGradient id={`roseShadow_${uniqueId}`} x1="300" y1="180" x2="300" y2="420" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9f1239" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#881337" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#4c0519" stopOpacity="1" />
        </linearGradient>

        {/* Gradasi Highlight Lembut Kilau Kelopak (Petal Rim Highlight) */}
        <linearGradient id={`petalHighlight_${uniqueId}`} x1="200" y1="80" x2="400" y2="350" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffe4e6" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#fda4af" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.3" />
        </linearGradient>

        {/* Pendaran Cahaya Kelopak Bawah (Soft Radial Petal Glow) */}
        <radialGradient id={`roseGlow_${uniqueId}`} cx="300" cy="270" r="240" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fff1f2" stopOpacity="0.6" />
          <stop offset="35%" stopColor="#ffe4e6" stopOpacity="0.4" />
          <stop offset="65%" stopColor="#fda4af" stopOpacity="0.22" />
          <stop offset="90%" stopColor="#f43f5e" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#e11d48" stopOpacity="0" />
        </radialGradient>

        {/* Gradasi Daun Botani Emerald Mewah (Emerald Botanical Leaf Gradient) */}
        <linearGradient id={`leafEmerald_${uniqueId}`} x1="100" y1="300" x2="500" y2="550" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="40%" stopColor="#059669" />
          <stop offset="75%" stopColor="#047857" />
          <stop offset="100%" stopColor="#064e3b" />
        </linearGradient>

        {/* Gradasi Tangkai & Kelopak Dasar (Sepal & Stem Gradient) */}
        <linearGradient id={`stemGrad_${uniqueId}`} x1="280" y1="460" x2="310" y2="580" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="60%" stopColor="#047857" />
          <stop offset="100%" stopColor="#022c22" />
        </linearGradient>

        {/* Filter Bayangan Halus untuk Dimensi Seni Berkelas */}
        <filter id={`roseGlowFilter_${uniqueId}`} x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#881337" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* ========================================================================= */}
      {/* 0. PENDARAN LEMBUT SILUET MAWAR MERAH (BACKGROUND GLOW)                   */}
      {/* ========================================================================= */}
      <circle cx="300" cy="270" r="235" fill={`url(#roseGlow_${uniqueId})`} />

      {/* ========================================================================= */}
      {/* 1. DAUN-DAUN BOTANI & TANGKAI (BOTANICAL LEAVES & STEM)                   */}
      {/* ========================================================================= */}
      <g strokeLinecap="round" strokeLinejoin="round">
        
        {/* Tangkai Bunga Mawar (Curved Rose Stem) */}
        <path 
          d="M298 460 C295 500, 290 545, 282 585" 
          stroke={`url(#stemGrad_${uniqueId})`} 
          strokeWidth="6" 
        />
        {/* Duri Mawar Artistik */}
        <path 
          d="M293 515 C282 512, 272 516, 268 522 C276 525, 285 524, 292 522" 
          fill="#047857" 
          stroke={`url(#stemGrad_${uniqueId})`} 
          strokeWidth="1.5" 
        />
        <path 
          d="M287 550 C298 547, 306 550, 310 556 C302 558, 294 556, 286 554" 
          fill="#047857" 
          stroke={`url(#stemGrad_${uniqueId})`} 
          strokeWidth="1.5" 
        />

        {/* DAUN KIRI MEKAR (LEFT BOTANICAL LEAF WITH SERRATIONS & VEINS) */}
        <g>
          {/* Badan Daun Kiri */}
          <path 
            d="M170 340 C120 310, 60 345, 45 400 C40 435, 75 470, 125 475 C185 480, 230 425, 245 375 C215 355, 195 348, 170 340 Z" 
            fill="#10b981" 
            fillOpacity="0.12" 
            stroke={`url(#leafEmerald_${uniqueId})`} 
            strokeWidth="3.5" 
          />
          {/* Tulang Utama Daun Kiri */}
          <path 
            d="M245 375 C190 395, 120 425, 52 408" 
            stroke={`url(#leafEmerald_${uniqueId})`} 
            strokeWidth="2.5" 
          />
          {/* Urat-Urat Cabang Daun Kiri */}
          <path d="M195 388 Q180 365, 160 355" stroke={`url(#leafEmerald_${uniqueId})`} strokeWidth="1.8" />
          <path d="M180 395 Q175 425, 185 448" stroke={`url(#leafEmerald_${uniqueId})`} strokeWidth="1.8" />
          <path d="M150 405 Q135 380, 115 372" stroke={`url(#leafEmerald_${uniqueId})`} strokeWidth="1.8" />
          <path d="M135 412 Q130 440, 140 462" stroke={`url(#leafEmerald_${uniqueId})`} strokeWidth="1.8" />
          <path d="M105 418 Q95 398, 80 392" stroke={`url(#leafEmerald_${uniqueId})`} strokeWidth="1.8" />
          <path d="M90 420 Q92 445, 102 458" stroke={`url(#leafEmerald_${uniqueId})`} strokeWidth="1.8" />
        </g>

        {/* DAUN KANAN MEKAR (RIGHT BOTANICAL LEAF WITH SERRATIONS & VEINS) */}
        <g>
          {/* Badan Daun Kanan */}
          <path 
            d="M430 340 C480 310, 540 345, 555 400 C560 435, 525 470, 475 475 C415 480, 370 425, 355 375 C385 355, 405 348, 430 340 Z" 
            fill="#10b981" 
            fillOpacity="0.12" 
            stroke={`url(#leafEmerald_${uniqueId})`} 
            strokeWidth="3.5" 
          />
          {/* Tulang Utama Daun Kanan */}
          <path 
            d="M355 375 C410 395, 480 425, 548 408" 
            stroke={`url(#leafEmerald_${uniqueId})`} 
            strokeWidth="2.5" 
          />
          {/* Urat-Urat Cabang Daun Kanan */}
          <path d="M405 388 Q420 365, 440 355" stroke={`url(#leafEmerald_${uniqueId})`} strokeWidth="1.8" />
          <path d="M420 395 Q425 425, 415 448" stroke={`url(#leafEmerald_${uniqueId})`} strokeWidth="1.8" />
          <path d="M450 405 Q465 380, 485 372" stroke={`url(#leafEmerald_${uniqueId})`} strokeWidth="1.8" />
          <path d="M465 412 Q470 440, 460 462" stroke={`url(#leafEmerald_${uniqueId})`} strokeWidth="1.8" />
          <path d="M495 418 Q505 398, 520 392" stroke={`url(#leafEmerald_${uniqueId})`} strokeWidth="1.8" />
          <path d="M510 420 Q508 445, 498 458" stroke={`url(#leafEmerald_${uniqueId})`} strokeWidth="1.8" />
        </g>

        {/* SEPAL / MAHKOTA BAWAH KELOPAK (BOTANICAL SEPALS) */}
        <path 
          d="M298 460 C275 490, 230 512, 195 498 C225 470, 260 455, 298 460 Z" 
          fill="#059669" 
          fillOpacity="0.2" 
          stroke={`url(#leafEmerald_${uniqueId})`} 
          strokeWidth="2.8" 
        />
        <path 
          d="M298 460 C321 490, 366 512, 401 498 C371 470, 336 455, 298 460 Z" 
          fill="#059669" 
          fillOpacity="0.2" 
          stroke={`url(#leafEmerald_${uniqueId})`} 
          strokeWidth="2.8" 
        />
      </g>

      {/* ========================================================================= */}
      {/* 2. LAPISAN KELOPAK MAWAR BOTANI LUAR (OUTER BLOOMING PETALS)              */}
      {/* ========================================================================= */}
      <g filter={`url(#roseGlowFilter_${uniqueId})`} strokeLinecap="round" strokeLinejoin="round">
        
        {/* Kelopak Dasar Bawah Tengah */}
        <path 
          d="M190 410 C240 470, 360 470, 410 410 C380 445, 220 445, 190 410 Z" 
          fill="#be123c" 
          fillOpacity="0.14" 
          stroke={`url(#rosePrimary_${uniqueId})`} 
          strokeWidth="4" 
        />

        {/* Kelopak Luar Kiri Bawah */}
        <path 
          d="M130 260 C90 325, 110 405, 195 435 C160 380, 145 320, 160 255 C145 258, 136 258, 130 260 Z" 
          fill="#e11d48" 
          fillOpacity="0.1" 
          stroke={`url(#rosePrimary_${uniqueId})`} 
          strokeWidth="4" 
        />

        {/* Kelopak Luar Kanan Bawah */}
        <path 
          d="M470 260 C510 325, 490 405, 405 435 C440 380, 455 320, 440 255 C455 258, 464 258, 470 260 Z" 
          fill="#e11d48" 
          fillOpacity="0.1" 
          stroke={`url(#rosePrimary_${uniqueId})`} 
          strokeWidth="4" 
        />

        {/* Kelopak Luar Atas Kiri */}
        <path 
          d="M165 170 C130 220, 140 290, 195 330 C220 280, 210 215, 195 160 C180 162, 172 165, 165 170 Z" 
          fill="#f43f5e" 
          fillOpacity="0.1" 
          stroke={`url(#rosePrimary_${uniqueId})`} 
          strokeWidth="3.5" 
        />

        {/* Kelopak Luar Atas Kanan */}
        <path 
          d="M435 170 C470 220, 460 290, 405 330 C380 280, 390 215, 405 160 C420 162, 428 165, 435 170 Z" 
          fill="#f43f5e" 
          fillOpacity="0.1" 
          stroke={`url(#rosePrimary_${uniqueId})`} 
          strokeWidth="3.5" 
        />

        {/* Kelopak Puncak Mahkota Mawar */}
        <path 
          d="M225 105 C275 80, 325 80, 375 105 C395 135, 360 165, 300 170 C240 165, 205 135, 225 105 Z" 
          fill="#fda4af" 
          fillOpacity="0.15" 
          stroke={`url(#rosePrimary_${uniqueId})`} 
          strokeWidth="4" 
        />

        {/* ========================================================================= */}
        {/* 3. KELOPAK LAPIS TENGAH MEKAR (MID-TIER BLOOMING OVERLAYS)               */}
        {/* ========================================================================= */}
        {/* Kelopak Melengkung Sisi Kiri Tengah */}
        <path 
          d="M175 230 C210 160, 310 145, 365 185 C320 215, 260 230, 205 285 C185 270, 178 250, 175 230 Z" 
          fill="#e11d48" 
          fillOpacity="0.16" 
          stroke={`url(#rosePrimary_${uniqueId})`} 
          strokeWidth="4" 
        />

        {/* Kelopak Melengkung Sisi Kanan Tengah */}
        <path 
          d="M425 230 C390 160, 290 145, 235 185 C280 215, 340 230, 395 285 C415 270, 422 250, 425 230 Z" 
          fill="#be123c" 
          fillOpacity="0.18" 
          stroke={`url(#rosePrimary_${uniqueId})`} 
          strokeWidth="4" 
        />

        {/* Cangkir Kelopak Utama Bawah (Main Lower Rose Cup) */}
        <path 
          d="M205 285 C230 375, 370 375, 395 285 C360 335, 240 335, 205 285 Z" 
          fill="#881337" 
          fillOpacity="0.22" 
          stroke={`url(#rosePrimary_${uniqueId})`} 
          strokeWidth="4.5" 
        />

        {/* Lipatan Kelopak Dalam Kiri */}
        <path 
          d="M215 220 C245 190, 335 190, 365 240 C325 275, 265 275, 215 220 Z" 
          fill="#9f1239" 
          fillOpacity="0.25" 
          stroke={`url(#roseShadow_${uniqueId})`} 
          strokeWidth="3.8" 
        />

        {/* Lipatan Kelopak Dalam Kanan */}
        <path 
          d="M385 220 C355 190, 265 190, 235 240 C275 275, 335 275, 385 220 Z" 
          fill="#881337" 
          fillOpacity="0.25" 
          stroke={`url(#roseShadow_${uniqueId})`} 
          strokeWidth="3.8" 
        />

        {/* ========================================================================= */}
        {/* 4. INTI SPIRAL KUNCUP MAWAR BELUDRU (VELVET ROSE HEART SPIRAL)           */}
        {/* ========================================================================= */}
        {/* Dasar Inti Kuncup */}
        <path 
          d="M260 210 C275 190, 325 190, 340 210 C345 235, 330 255, 300 260 C270 255, 255 235, 260 210 Z" 
          fill="#4c0519" 
          fillOpacity="0.4" 
          stroke={`url(#roseShadow_${uniqueId})`} 
          strokeWidth="4" 
        />

        {/* Spiral Kelopak Dalam Lapisan 1 */}
        <path 
          d="M272 215 C285 200, 315 200, 328 215 C330 230, 318 245, 300 248 C282 245, 270 230, 272 215 Z" 
          fill="#881337" 
          fillOpacity="0.5" 
          stroke={`url(#rosePrimary_${uniqueId})`} 
          strokeWidth="3.5" 
        />

        {/* Spiral Pusaran Inti Tengah */}
        <path 
          d="M285 220 C292 210, 308 210, 315 220 C318 232, 308 240, 300 240 C292 240, 282 232, 285 220 Z" 
          fill="#be123c" 
          fillOpacity="0.6" 
          stroke={`url(#rosePrimary_${uniqueId})`} 
          strokeWidth="3" 
        />

        {/* Titik Pusat Kuncup Mawar */}
        <path 
          d="M294 225 C298 220, 304 220, 306 225 C308 230, 302 234, 299 234 C296 234, 292 230, 294 225" 
          stroke={`url(#petalHighlight_${uniqueId})`} 
          strokeWidth="2.5" 
        />

        {/* ========================================================================= */}
        {/* 5. AKSEN TEKSTUR & KILAUAN TEPI KELOPAK (ARTISTIC HIGHLIGHTS & ACCENTS)   */}
        {/* ========================================================================= */}
        {/* Lekukan Tepi Kelopak Halus Kiri */}
        <path 
          d="M175 200 C155 240, 160 300, 205 345" 
          stroke={`url(#petalHighlight_${uniqueId})`} 
          strokeWidth="2.2" 
        />
        {/* Lekukan Tepi Kelopak Halus Kanan */}
        <path 
          d="M425 200 C445 240, 440 300, 395 345" 
          stroke={`url(#petalHighlight_${uniqueId})`} 
          strokeWidth="2.2" 
        />
        {/* Garis Aksen Rona Bawah */}
        <path 
          d="M235 415 C275 440, 325 440, 365 415" 
          stroke={`url(#petalHighlight_${uniqueId})`} 
          strokeWidth="2.5" 
        />
      </g>
    </svg>
  );
};

/**
 * Latar Belakang Pola Watermark Bunga Mawar Merah Mewah (Full Screen Luxury Rose Watermark Background)
 * Menyajikan komposisi visual artistik dengan tingkat kejernihan seimbang, tidak mengganggu keterbacaan teks survei.
 */
export const RoseWatermarkBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      
      {/* Mawar Merah Utama di Kiri Atas */}
      <div className="absolute -top-32 -left-32 opacity-[0.11] sm:opacity-[0.13] transform -rotate-15 transition-all duration-300">
        <RoseWatermarkIcon className="w-[540px] h-[540px] sm:w-[720px] sm:h-[720px]" />
      </div>

      {/* Mawar Merah Utama di Kanan Bawah */}
      <div className="absolute -bottom-36 -right-36 opacity-[0.11] sm:opacity-[0.14] transform rotate-40 transition-all duration-300">
        <RoseWatermarkIcon className="w-[560px] h-[560px] sm:w-[750px] sm:h-[750px]" />
      </div>

      {/* Mawar Merah Aksen di Kanan Tengah */}
      <div className="hidden lg:block absolute top-1/3 -right-28 opacity-[0.085] transform rotate-12">
        <RoseWatermarkIcon className="w-[450px] h-[450px]" />
      </div>

      {/* Mawar Merah Aksen di Kiri Bawah */}
      <div className="hidden lg:block absolute bottom-1/4 -left-28 opacity-[0.085] transform -rotate-35">
        <RoseWatermarkIcon className="w-[450px] h-[450px]" />
      </div>

      {/* Pola Pendaran Halus Geometris Mawar di Latar Belakang */}
      <div className="absolute inset-0 bg-[radial-gradient(#e11d48_1.2px,transparent_1.2px)] [background-size:48px_48px] opacity-[0.035]" />
    </div>
  );
};
