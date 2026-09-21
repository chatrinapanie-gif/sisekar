import React from 'react';
import { 
  ListTodo, 
  RotateCcw, 
  Download, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Star, 
  User, 
  Building2,
  AlertCircle
} from 'lucide-react';
import { SurveySubmission } from '../types';
import { exportToCSV } from '../services/sheetsService';

interface HistoryViewProps {
  submissions: SurveySubmission[];
  pendingCount: number;
  isSyncing: boolean;
  onSyncAll: () => void;
  onClearHistory: () => void;
  isOnline: boolean;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  submissions,
  pendingCount,
  isSyncing,
  onSyncAll,
  onClearHistory,
  isOnline,
}) => {
  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 px-3 sm:px-6 space-y-5">
      
      {/* Action Header Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-blue-700" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Riwayat Survei RSUD Aeramo
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Total {submissions.length} survei tersimpan di memori perangkat ini.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {pendingCount > 0 && (
            <button
              onClick={onSyncAll}
              disabled={isSyncing || !isOnline}
              id="btn-sync-all-history"
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Kirim {pendingCount} Antrean</span>
            </button>
          )}

          <button
            onClick={() => exportToCSV(submissions)}
            disabled={submissions.length === 0}
            id="btn-export-csv"
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh CSV / Excel</span>
          </button>

          {submissions.length > 0 && (
            <button
              onClick={onClearHistory}
              id="btn-clear-history"
              className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition"
              title="Bersihkan riwayat dari perangkat ini"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Warning info if pending items */}
      {pendingCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Ada <strong>{pendingCount} survei</strong> yang belum terkirim ke Google Sheet. Klik tombol "Kirim Antrean" di atas saat koneksi internet aktif.
          </span>
        </div>
      )}

      {/* List */}
      {submissions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <ListTodo className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-slate-700">Belum Ada Data Survei</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Survei kepuasan yang diisi pasien akan tercatat di sini dan dikirimkan ke Google Sheet RSUD Aeramo.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 hover:border-blue-200 transition-colors space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {item.id}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {item.tanggalSurvei} • {item.jamSurvei}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {item.devicePlatform}
                  </span>
                </div>

                {/* Status Badge */}
                <div>
                  {item.status === 'synced' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Terkirim ke Sheet</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-300">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Antrean Offline</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Data Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-slate-400 font-medium">Profil Responden</p>
                  <p className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                    <User className="w-3.5 h-3.5 text-blue-700" />
                    <span>{item.namaPasien || '(Anonim)'}</span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {item.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} • {item.usia} thn • {item.pendidikan} • {item.pekerjaan}
                  </p>
                </div>

                <div>
                  <p className="text-slate-400 font-medium">Layanan Diterima</p>
                  <p className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-700" />
                    <span>{item.jenisLayanan}</span>
                  </p>
                </div>

                <div>
                  <p className="text-slate-400 font-medium">Skor & Mutu</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="font-bold text-blue-900 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded">
                      <Star className="w-3.5 h-3.5 fill-blue-700 text-blue-700" />
                      {item.averageScore} / 4.00
                    </span>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      IKM: {item.ikmScore}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Mutu: <span className="font-semibold text-slate-700">{item.mutuLayanan}</span>
                  </p>
                </div>
              </div>

              {/* Saran */}
              {item.saran && (
                <div className="p-2.5 rounded-xl bg-slate-50 text-xs text-slate-600 italic border border-slate-100">
                  "{item.saran}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
