import React from 'react';
import { 
  Wifi, 
  WifiOff, 
  HelpCircle, 
  FileText,
  Heart
} from 'lucide-react';
import { NagekeoLogo } from './NagekeoLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { AppConfig } from '../types';

interface HeaderProps {
  config: AppConfig;
  isOnline: boolean;
  activeTab: 'survey' | 'guide';
  setActiveTab: (tab: 'survey' | 'guide') => void;
  isDeviceLocked?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isOnline,
  activeTab,
  setActiveTab,
  isDeviceLocked,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all print:hidden">
      {/* Offline Alert Strip if disconnected */}
      {!isOnline && (
        <div className="bg-amber-500 text-amber-950 text-xs py-1 px-4 text-center font-medium flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Mode Offline aktif — data survei tetap tersimpan aman di perangkat dan otomatis terkirim saat internet terhubung.</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          
          {/* Logo & Brand Identity */}
          <div 
            onClick={() => setActiveTab('survey')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shadow-xs">
              <NagekeoLogo className="w-7 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black tracking-tight text-blue-950">RSUD AERAMO</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                  SISEKAR
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-[170px] sm:max-w-xs">
                Survei Kepuasan Pasien &amp; Keluarga
              </p>
            </div>
          </div>

          {/* Action Bar Right */}
          <div className="flex items-center gap-2">
            {/* Status Jaringan Ramah */}
            <div 
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isOnline 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
              title={isOnline ? 'Terhubung dengan Internet' : 'Sedang Offline'}
            >
              {isOnline ? <Wifi className="w-3 h-3 text-emerald-600" /> : <WifiOff className="w-3 h-3 text-amber-600" />}
              <span className="text-[11px]">{isOnline ? 'Online' : 'Offline'}</span>
            </div>

            {/* PWA Install Button untuk HP Pasien */}
            <PWAInstallButton />
          </div>

        </div>

        {/* Navigation Tabs Bar — HANYA Form Survei & Panduan Pengisian */}
        <div className="flex items-center space-x-2 border-t border-slate-100 py-1.5">
          <button
            onClick={() => setActiveTab('survey')}
            id="nav-tab-survey"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
              activeTab === 'survey'
                ? 'bg-blue-800 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isDeviceLocked ? 'Tanda Terima Survei (Selesai)' : 'Formulir Survei'}</span>
          </button>

          {!isDeviceLocked && (
            <button
              onClick={() => setActiveTab('guide')}
              id="nav-tab-guide"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
                activeTab === 'guide'
                  ? 'bg-blue-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-blue-700" />
              <span>Panduan Pengisian</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
