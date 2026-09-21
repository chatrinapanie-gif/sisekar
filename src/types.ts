/**
 * Tipe data untuk Aplikasi SISEKAR
 * (Sistem Evaluasi Kepuasan Pasien dan Keluarga)
 * RSUD Aeramo - Kabupaten Nagekeo
 */

export type JamSurvei = '08.00 – 14.00 WITA' | '14.00 – 20.00 WITA';

export type JenisKelamin = 'L' | 'P';

export type Pendidikan = 'SD' | 'SMP' | 'SMA' | 'S1' | 'S2';

export type Pekerjaan = 'PNS' | 'TNI' | 'POLRI' | 'SWASTA' | 'WIRAUSAHA' | 'LAINNYA';

export type SkalaKepuasan = 1 | 2 | 3 | 4;

export interface SkalaOptionItem {
  value: 1 | 2 | 3 | 4;
  label: string;
  shortLabel?: string;
  emoji?: string;
  description?: string;
}

export interface QuestionItem {
  id: string;
  aspek: string;
  uraian: string;
  options?: SkalaOptionItem[];
}

export interface QuestionSection {
  id: string;
  title: string;
  description?: string;
  questions: QuestionItem[];
}

export interface SurveySubmission {
  id: string;
  timestamp: string;
  localDateFormatted: string;
  
  // Sesuai Gambar 2:
  tanggalSurvei: string;
  jamSurvei: JamSurvei;
  namaPasien: string; // Opsional
  jenisKelamin: JenisKelamin;
  pendidikan: Pendidikan;
  usia: string | number;
  pekerjaan: Pekerjaan;
  pekerjaanLainnya?: string;
  jenisLayanan: string; // misal: Rawat Inap, Rawat Jalan, Farmasi, dll.
  
  // Jawaban Aspek Survei (Sesuai Gambar 1):
  answers: Record<string, SkalaKepuasan>; // map question id -> skala (1: Sangat Tidak Puas, 2: Tidak Puas, 3: Puas, 4: Sangat Puas)
  
  // Statistik
  averageScore: number; // Skala 1 - 4
  ikmScore: number;     // Skala 0 - 100
  mutuLayanan: string;  // Sangat Baik (A), Baik (B), Kurang Baik (C), Tidak Baik (D)
  saran?: string;

  status: 'synced' | 'pending' | 'failed';
  syncedAt?: string;
  errorMessage?: string;
  devicePlatform: string;
}

export interface AppConfig {
  appsScriptUrl: string;
  hospitalName: string;
  hospitalSubTitle: string;
  kioskMode: boolean;
  autoResetSeconds: number;
}
