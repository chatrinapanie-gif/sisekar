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
 * Sinkronisasi antrean yang belum terkirim
 */
export async function syncAllPendingQueue(scriptUrl: string): Promise<{
  syncedCount: number;
  failedCount: number;
}> {
  const queue = loadPendingQueue();
  if (queue.length === 0 || !scriptUrl) {
    return { syncedCount: 0, failedCount: 0 };
  }

  let syncedCount = 0;
  let failedCount = 0;

  for (const item of queue) {
    try {
      await fetch(scriptUrl.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(item),
      });

      const updated: SurveySubmission = {
        ...item,
        status: 'synced',
        syncedAt: new Date().toISOString(),
        errorMessage: undefined,
      };
      saveSubmissionLocally(updated);
      removeFromPendingQueue(item.id);
      syncedCount++;
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
    'Rata-rata Skor (1-4)',
    'Indeks IKM (Skala 100)',
    'Mutu Layanan',
    'Saran',
    'Status Sinkron',
  ];

  const rows = submissions.map(s => [
    `"${s.id}"`,
    `"${s.tanggalSurvei}"`,
    `"${s.jamSurvei}"`,
    `"${s.namaPasien || '(Anonim)'}"`,
    `"${s.jenisKelamin}"`,
    `"${s.pendidikan}"`,
    `"${s.usia}"`,
    `"${s.pekerjaan}"`,
    `"${s.jenisLayanan}"`,
    s.answers?.['q1_kenyamanan_kamar'] || '-',
    s.answers?.['q2_kebersihan_kamar'] || '-',
    s.answers?.['q3_kualitas_fasilitas'] || '-',
    s.answers?.['q4_ketenangan_keamanan'] || '-',
    s.averageScore,
    s.ikmScore,
    `"${s.mutuLayanan}"`,
    `"${(s.saran || '').replace(/"/g, '""')}"`,
    `"${s.status}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `RSUD_Aeramo_Survei_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
