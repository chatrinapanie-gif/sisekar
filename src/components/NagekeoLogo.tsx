import React from 'react';

export const NagekeoLogo: React.FC<{ className?: string }> = ({ className = 'w-16 h-16' }) => {
  return (
    <svg 
      viewBox="0 0 200 240" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Logo Kabupaten Nagekeo"
    >
      {/* Perisai Segilima */}
      <path 
        d="M100 8 L188 40 L170 190 L100 232 L30 190 L12 40 Z" 
        fill="#1e3a8a" 
        stroke="#facc15" 
        strokeWidth="6" 
        strokeLinejoin="round" 
      />
      
      {/* Garis Border Dalam Emas */}
      <path 
        d="M100 18 L176 46 L160 182 L100 220 L40 182 L24 46 Z" 
        fill="#0284c7" 
        stroke="#fef08a" 
        strokeWidth="2" 
      />

      {/* Gunung Ebulobo Siluet */}
      <path 
        d="M38 160 L100 85 L162 160 Z" 
        fill="#059669" 
        stroke="#065f46" 
        strokeWidth="2" 
      />
      <path 
        d="M75 160 L100 95 L125 160 Z" 
        fill="#10b981" 
      />

      {/* Gelombang Laut di Bawah */}
      <path 
        d="M40 168 Q 60 160, 80 168 T 120 168 T 160 168 L152 188 L100 216 L48 188 Z" 
        fill="#0369a1" 
      />
      <path 
        d="M45 174 Q 65 168, 85 174 T 125 174 T 155 174" 
        stroke="#bae6fd" 
        strokeWidth="3" 
        strokeLinecap="round" 
        fill="none" 
      />

      {/* Rumah Adat Sa'o & Tiang Peo Khas Nagekeo */}
      {/* Rumah Tradisional / Atap Jerami */}
      <path 
        d="M100 70 L68 135 L132 135 Z" 
        fill="#b45309" 
        stroke="#78350f" 
        strokeWidth="2" 
      />
      {/* Tiang Cabang Peo Adat */}
      <path 
        d="M100 60 L100 148" 
        stroke="#fef08a" 
        strokeWidth="5" 
        strokeLinecap="round" 
      />
      {/* Cabang Tanduk Peo Kiri & Kanan */}
      <path 
        d="M80 82 Q 100 100, 120 82" 
        stroke="#fef08a" 
        strokeWidth="4" 
        strokeLinecap="round" 
        fill="none" 
      />
      <path 
        d="M85 70 Q 100 85, 115 70" 
        stroke="#fef08a" 
        strokeWidth="3" 
        strokeLinecap="round" 
        fill="none" 
      />

      {/* Pita Bintang / Emas */}
      <circle cx="100" cy="40" r="7" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
      
      {/* Padi & Kapas Ringkas */}
      <path 
        d="M34 140 Q 26 80, 48 50" 
        stroke="#eab308" 
        strokeWidth="3" 
        strokeLinecap="round" 
        fill="none" 
      />
      <path 
        d="M166 140 Q 174 80, 152 50" 
        stroke="#eab308" 
        strokeWidth="3" 
        strokeLinecap="round" 
        fill="none" 
      />

      {/* Tulisan Dasar Tahun Berdiri */}
      <rect x="75" y="195" width="50" height="15" rx="3" fill="#fef08a" />
      <text 
        x="100" 
        y="206" 
        textAnchor="middle" 
        fontSize="9" 
        fontWeight="bold" 
        fill="#78350f" 
        fontFamily="sans-serif"
      >
        NAGEKEO
      </text>
    </svg>
  );
};
