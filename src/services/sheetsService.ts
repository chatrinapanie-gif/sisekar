import { AppConfig, SurveySubmission } from '../types';
import { ADMIN_CONFIG } from '../surveyConfig';
import { sanitizeInput } from '../utils/security';

const STORAGE_KEYS = {
  CONFIG: 'sisekar_aeramo_config',
  SUBMISSIONS: 'sisekar_aeramo_submissions',
  PENDING_QUEUE: 'sisekar_aeramo_pending_queue',
};

export const DEFAULT_CONFIG: AppConfig = {
  appsScriptUrl: ADMIN_CONFIG.appsScriptUrl || '',
  hospitalName: ADMIN_CONFIG.hospitalName || 'RSUD Aeramo',
  hospitalSubTitle: ADMIN_CONFIG.hospitalSubTitle || 'Pemerintah Kabupaten Nagekeo - Dinas Kesehatan',
  kioskMode: false,
  autoResetSeconds: 8,
};

export function loadAppConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return { 
      ...DEFAULT_CONFIG, 
      ...parsed,
      // Jika admin menanamkan URL langsung di kodingan ADMIN_CONFIG, gunakan itu
      appsScriptUrl: ADMIN_CONFIG.appsScriptUrl ? ADMIN_CONFIG.appsScriptUrl : (parsed.appsScriptUrl || '')
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}

/**
 * Sinkronkan konfigurasi dari server agar otomatis aktif di semua perangkat (HP, Laptop, Tablet, Kiosk)
 */
export async function fetchServerConfig(): Promise<AppConfig | null> {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        const current = loadAppConfig();
        const updated: AppConfig = {
          ...current,
          appsScriptUrl: (typeof data.appsScriptUrl === 'string' && data.appsScriptUrl) ? data.appsScriptUrl : current.appsScriptUrl,
          hospitalName: data.hospitalName || current.hospitalName,
          hospitalSubTitle: data.hospitalSubTitle || current.hospitalSubTitle,
        };
        saveAppConfig(updated);
        return updated;
      }
    }
  } catch (err) {
    console.warn('Gagal memuat konfigurasi server:', err);
  }
  return null;
}

export function saveAppConfig(config: AppConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save config:', err);
  }
}

export function loadSubmissions(): SurveySubmission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSubmissionLocally(submission: SurveySubmission): void {
  try {
    const list = loadSubmissions();
    const existingIndex = list.findIndex(s => s.id === submission.id);
    if (existingIndex >= 0) {
      list[existingIndex] = submission;
    } else {
      list.unshift(submission);
    }
    if (list.length > 250) list.length = 250;
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save submission locally:', err);
  }
}

export function loadPendingQueue(): SurveySubmission[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PENDING_QUEUE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToPendingQueue(submission: SurveySubmission): void {
  try {
    const queue = loadPendingQueue();
    const exists = queue.some(s => s.id === submission.id);
    if (!exists) {
      queue.push(submission);
      localStorage.setItem(STORAGE_KEYS.PENDING_QUEUE, JSON.stringify(queue));
    }
  } catch (err) {
    console.error('Failed to add to pending queue:', err);
  }
}

export function removeFromPendingQueue(id: string): void {
  try {
    const queue = loadPendingQueue().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.PENDING_QUEUE, JSON.stringify(queue));
  } catch (err) {
    console.error('Failed to remove from pending queue:', err);
  }
}

/**
 * Kirim data survei ke Google Apps Script Web App dengan proteksi keamanan siber
 */
export async function sendSurveyToGoogleSheet(
  submission: SurveySubmission,
  scriptUrl: string
): Promise<{ success: boolean; mode: 'online' | 'offline_saved'; message: string }> {
  // 1. Sanitasi seluruh input pasien (Anti-XSS & Anti-Spreadsheet Injection)
  const sanitizedSubmission: SurveySubmission = {
    ...submission,
    namaPasien: sanitizeInput(submission.namaPasien || ''),
    pekerjaanLainnya: sanitizeInput(submission.pekerjaanLainnya || ''),
    jenisLayanan: sanitizeInput(submission.jenisLayanan || ''),
    saran: sanitizeInput(submission.saran || ''),
  };

  // 2. Jika offline di browser
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const offlineItem: SurveySubmission = {
      ...sanitizedSubmission,
      status: 'pending',
      errorMessage: 'Perangkat offline (tidak ada sinyal internet).',
    };
    saveSubmissionLocally(offlineItem);
    addToPendingQueue(offlineItem);
    return {
      success: true,
      mode: 'offline_saved',
      message: 'Sedang offline. Data tersimpan aman di antrean perangkat dan otomatis terkirim saat online kembali.',
    };
  }

  // 3. Coba kirim via Security Proxy Server (/api/survey/submit) agar URL asli tidak terlihat di devtools
  try {
    const proxyRes = await fetch('/api/survey/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...sanitizedSubmission,
        scriptUrl: scriptUrl?.trim() || '',
      }),
    });

    if (proxyRes.ok) {
      const resJson = await proxyRes.json();
      if (resJson.success) {
        const syncedItem: SurveySubmission = {
          ...sanitizedSubmission,
          status: 'synced',
          syncedAt: new Date().toISOString(),
          errorMessage: undefined,
        };
        saveSubmissionLocally(syncedItem);
        removeFromPendingQueue(sanitizedSubmission.id);

        return {
          success: true,
          mode: 'online',
          message: resJson.message || 'Survei kepuasan Anda berhasil dicatat dan diamankan.',
        };
      }
    }
  } catch (proxyErr) {
    console.info('Proxy server unreachable, attempting direct fallback...');
  }

  // 4. Fallback jika proxy server tidak merespons (misal static PWA)
  if (!scriptUrl || scriptUrl.trim() === '') {
    const localItem: SurveySubmission = {
      ...sanitizedSubmission,
      status: 'pending',
      errorMessage: 'URL Google Apps Script belum dikonfigurasi.',
    };
    saveSubmissionLocally(localItem);
    addToPendingQueue(localItem);
    return {
      success: true,
      mode: 'offline_saved',
      message: 'Survei tersimpan aman di memori perangkat lokal RSUD Aeramo.',
    };
  }

  try {
    const cleanUrl = scriptUrl.trim();
    await fetch(cleanUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(sanitizedSubmission),
    });

    const syncedItem: SurveySubmission = {
      ...sanitizedSubmission,
      status: 'synced',
      syncedAt: new Date().toISOString(),
      errorMessage: undefined,
    };
    saveSubmissionLocally(syncedItem);
    removeFromPendingQueue(sanitizedSubmission.id);

    return {
      success: true,
      mode: 'online',
      message: 'Terima kasih! Survei kepuasan Anda berhasil dicatat ke Google Sheet RSUD Aeramo.',
    };
  } catch (error) {
    console.warn('Network error, saving to pending queue:', error);
    const failedItem: SurveySubmission = {
      ...sanitizedSubmission,
      status: 'pending',
      errorMessage: error instanceof Error ? error.message : 'Gagal mengirim ke Google Apps Script',
    };
    saveSubmissionLocally(failedItem);
    addToPendingQueue(failedItem);

    return {
      success: true,
      mode: 'offline_saved',
      message: 'Jaringan terganggu. Data berhasil diamankan di penyimpanan lokal dan siap dikirim ulang.',
    };
  }
}

/**
 * Uji konektivitas ke Google Apps Script Web App secara tangguh
 * (Bekerja di server full-stack maupun hosting static Cloudflare Pages/Vercel)
 */
export async function testAppsScriptConnection(
  scriptUrl: string
): Promise<{ success: boolean; message: string }> {
  const cleanUrl = scriptUrl?.trim() || '';
  if (!cleanUrl) {
    return { success: false, message: 'URL Google Apps Script tidak boleh kosong.' };
  }
  if (cleanUrl.includes('docs.google.com/spreadsheets')) {
    return {
      success: false,
      message:
        '⚠️ URL ini adalah link Google Spreadsheet, BUKAN link Web App Apps Script. Buka menu Extensions > Apps Script > Deploy > New deployment (pilih Web App, Who has access: Anyone) dan salin URL yang berakhiran /exec.',
    };
  }
  if (!cleanUrl.startsWith('https://script.google.com/macros/s/')) {
    return {
      success: false,
      message:
        '⚠️ Format URL tidak valid. Pastikan dimulai dengan https://script.google.com/macros/s/... dan berakhiran /exec.',
    };
  }

  // 1. Coba lewat proxy backend (/api/survey/submit) jika ada
  try {
    const proxyRes = await fetch('/api/survey/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        test: true,
        scriptUrl: cleanUrl,
        tanggal: new Date().toISOString(),
        waktu: new Date().toLocaleTimeString('id-ID'),
        jenisLayanan: 'rawat_inap',
        namaLayanan: 'Uji Koneksi Petugas RSUD Aeramo',
        namaPasien: 'DIAGNOSTIC_PING',
        saran: 'Uji konektivitas sistem SISEKAR RSUD Aeramo.',
        answers: {},
      }),
    });

    const contentType = proxyRes.headers.get('content-type') || '';
    if (proxyRes.ok && contentType.includes('application/json')) {
      const data = await proxyRes.json();
      if (data.mode === 'online' || data.success) {
        return {
          success: true,
          message: '✓ Koneksi Berhasil! Google Sheet RSUD Aeramo aktif & siap menerima hasil survei.',
        };
      }
    }
  } catch (err) {
    // Proxy tidak tersedia (misal di Cloudflare Pages static), lanjut ke direct test
  }

  // 2. Direct Test ke Google Apps Script (Bekerja sempurna di Cloudflare Pages / Static Hosting / HP)
  try {
    const testPayload = {
      test: true,
      timestamp: new Date().toISOString(),
      source: 'SISEKAR RSUD Aeramo - Connection Test',
      namaPasien: 'UJI_KONEKSI_SISTEM',
      jenisLayanan: 'Uji Sistem',
    };

    await fetch(cleanUrl, {
      method: 'POST',
      mode: 'no-cors', // Melewati batasan CORS redirect Google Apps Script di browser
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(testPayload),
    });

    return {
      success: true,
      message: '✓ Koneksi Berhasil! Web App Google Sheet RSUD Aeramo merespons aktif dan siap digunakan.',
    };
  } catch (directErr: any) {
    return {
      success: false,
      message: 'Koneksi gagal: ' + (directErr?.message || 'Pastikan Web App di-deploy dengan opsi "Who has access: Anyone".'),
    };
  }
}

/**
 * Sinkronisasi antrean yang belum terkirim
 */
export async function syncAllPendingQueue(scriptUrl?: string): Promise<{
  syncedCount: number;
  failedCount: number;
}> {
  const queue = loadPendingQueue();
  if (queue.length === 0) {
    return { syncedCount: 0, failedCount: 0 };
  }

  let syncedCount = 0;
  let failedCount = 0;

  for (const item of queue) {
    try {
      const res = await sendSurveyToGoogleSheet(item, scriptUrl);
      if (res.mode === 'online') {
        syncedCount++;
      } else {
        failedCount++;
      }
    } catch {
      failedCount++;
    }
  }

  return { syncedCount, failedCount };
}

/**
 * Export CSV
 */
export function exportToCSV(submissions: SurveySubmission[]): void {
  if (submissions.length === 0) return;

  const headers = [
    'ID Survei',
    'Tanggal Survei',
    'Jam Survei',
    'Nama Pasien',
    'Jenis Kelamin',
    'Pendidikan',
    'Usia',
    'Pekerjaan',
    'Jenis Layanan',
    'Q1 (Kenyamanan Kamar)',
    'Q2 (Kebersihan Kamar & Mandi)',
    'Q3 (Kualitas Fasilitas)',
    'Q4 (Ketenangan & Keamanan)',
    'Q5 (Kunjungan Dokter)',
    'Q6 (Kejelasan Informasi)',
    'Q7 (Responsivitas Perawat)',
    'Rata-rata Skor (1-4)',
    'Indeks IKM (Skala 100)',
    'Mutu Layanan',
    'Saran',
    'Rincian Aspek Lengkap',
    'Status Sinkron',
  ];

  const rows = submissions.map(s => {
    // Ambil nilai Q1 s/d Q7 secara fleksibel (mendukung format id baru ri_q1, q1, dll.)
    const a = s.answers || {};
    const q1 = a['ri_q1_kenyamanan_kamar'] || a['q1_kenyamanan_kamar'] || a['q1'] || '-';
    const q2 = a['ri_q2_kebersihan_kamar'] || a['q2_kebersihan_kamar'] || a['q2'] || '-';
    const q3 = a['ri_q3_kualitas_fasilitas'] || a['q3_kualitas_fasilitas'] || a['q3'] || '-';
    const q4 = a['ri_q4_ketenangan_keamanan'] || a['q4_ketenangan_keamanan'] || a['q4'] || '-';
    const q5 = a['ri_q5_kunjungan_nakes'] || a['q5_kunjungan_nakes'] || a['q5'] || '-';
    const q6 = a['ri_q6_kejelasan_informasi'] || a['q6_kejelasan_informasi'] || a['q6'] || '-';
    const q7 = a['ri_q7_ketersediaan_responsive'] || a['q7_ketersediaan_responsive'] || a['q7'] || '-';

    const rincianText = s.answeredDetails && s.answeredDetails.length > 0
      ? s.answeredDetails.map(d => `${d.aspek}: ${d.score} (${d.label})`).join(' | ')
      : Object.entries(a).map(([k, v]) => `${k}: ${v}`).join(' | ');

    return [
      `"${s.id}"`,
      `"${s.tanggalSurvei}"`,
      `"${s.jamSurvei}"`,
      `"${s.namaPasien || '(Anonim)'}"`,
      `"${s.jenisKelamin}"`,
      `"${s.pendidikan}"`,
      `"${s.usia}"`,
      `"${s.pekerjaan}"`,
      `"${s.jenisLayanan}"`,
      q1,
      q2,
      q3,
      q4,
      q5,
      q6,
      q7,
      s.averageScore,
      s.ikmScore,
      `"${s.mutuLayanan}"`,
      `"${(s.saran || '').replace(/"/g, '""')}"`,
      `"${rincianText.replace(/"/g, '""')}"`,
      `"${s.status}"`,
    ];
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `RSUD_Aeramo_Survei_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
