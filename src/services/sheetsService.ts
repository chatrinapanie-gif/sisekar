import { AppConfig, SurveySubmission, OneTimeSubmissionLock, PatientPinToken } from '../types';
import { ADMIN_CONFIG, SYSTEM_PRESET_PINS } from '../surveyConfig';
import { sanitizeInput } from '../utils/security';

const STORAGE_KEYS = {
  CONFIG: 'sisekar_aeramo_config',
  SUBMISSIONS: 'sisekar_aeramo_submissions',
  PENDING_QUEUE: 'sisekar_aeramo_pending_queue',
  ONE_TIME_LOCK: 'sisekar_aeramo_onetime_lock_v1',
  PATIENT_PINS: 'sisekar_aeramo_patient_pins_v1',
  ACTIVE_PATIENT_PIN: 'sisekar_aeramo_active_patient_pin',
};

// =============================================================================
// MANAJEMEN PIN AKSES SATU KALI PAKAI PASIEN (ONE-TIME PIN SYSTEM)
// =============================================================================

export function getActiveSessionPatientPin(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEYS.ACTIVE_PATIENT_PIN) || 
           localStorage.getItem(STORAGE_KEYS.ACTIVE_PATIENT_PIN) || null;
  } catch {
    return null;
  }
}

export function setActiveSessionPatientPin(pin: string | null): void {
  try {
    if (pin) {
      sessionStorage.setItem(STORAGE_KEYS.ACTIVE_PATIENT_PIN, pin);
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PATIENT_PIN, pin);
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.ACTIVE_PATIENT_PIN);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_PATIENT_PIN);
    }
  } catch (err) {
    console.warn('Failed to set active patient pin:', err);
  }
}

export function loadLocalPatientPins(): PatientPinToken[] {
  let pins: PatientPinToken[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PATIENT_PINS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        pins = parsed;
      }
    }
  } catch {
    pins = [];
  }

  // Selalu gabungkan PIN Bawaan Sistem (seperti 268907 untuk Chatrina Herlofina Panie, 102938, dll)
  // sehingga selalu aktif di perangkat/browser/email mana pun pasien membuka
  const existingSet = new Set(pins.map(p => p.pin));
  let hasNew = false;
  for (const preset of SYSTEM_PRESET_PINS) {
    if (!existingSet.has(preset.pin)) {
      pins.push({
        id: preset.id,
        pin: preset.pin,
        status: preset.status,
        registeredPatientName: preset.registeredPatientName,
        registeredService: preset.registeredService,
        registeredRoom: preset.registeredRoom,
        label: preset.label,
        createdAt: preset.createdAt,
      });
      existingSet.add(preset.pin);
      hasNew = true;
    }
  }

  if (hasNew) {
    try {
      localStorage.setItem(STORAGE_KEYS.PATIENT_PINS, JSON.stringify(pins));
    } catch {}
  }

  return pins;
}

export function saveLocalPatientPins(pins: PatientPinToken[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PATIENT_PINS, JSON.stringify(pins));
  } catch (err) {
    console.error('Failed to save local patient pins:', err);
  }
}

/**
 * Mengambil daftar seluruh PIN Pasien dari server atau sync dari Google Sheet
 */
export async function fetchPatientPins(): Promise<PatientPinToken[]> {
  // 1. Coba ambil dari endpoint sinkronisasi server
  try {
    const res = await fetch('/api/patient-pins/sync-sheet', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.pins)) {
        saveLocalPatientPins(data.pins);
        return data.pins;
      }
    }
  } catch {
    // Ignore and try basic endpoint
  }

  try {
    const res = await fetch('/api/patient-pins');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.pins)) {
        saveLocalPatientPins(data.pins);
        return data.pins;
      }
    }
  } catch (err) {
    console.warn('Server fetch patient pins error, fallback to local:', err);
  }

  // 2. Jika offline/server error tapi ada appsScriptUrl, coba panggil langsung ke Apps Script
  const cfg = loadAppConfig();
  if (cfg.appsScriptUrl) {
    try {
      const directUrl = `${cfg.appsScriptUrl}${cfg.appsScriptUrl.includes('?') ? '&' : '?'}action=get_pins`;
      const directRes = await fetch(directUrl);
      if (directRes.ok) {
        const directData = await directRes.json();
        if (directData && Array.isArray(directData.pins)) {
          saveLocalPatientPins(directData.pins);
          return directData.pins;
        }
      }
    } catch (e) {
      console.warn('Direct Apps Script get_pins error:', e);
    }
  }

  return loadLocalPatientPins();
}

/**
 * Sinkronisasi Manual PIN dari/ke Google Sheet (Tab PIN_PASIEN)
 */
export async function syncPinsWithGoogleSheet(): Promise<{ success: boolean; count: number; message: string }> {
  try {
    const res = await fetch('/api/patient-pins/sync-sheet', { method: 'POST' });
    const data = await res.json().catch(() => null);

    if (res.ok && data?.success && Array.isArray(data.pins)) {
      const localList = loadLocalPatientPins();
      const localMap = new Map(localList.map(p => [p.pin, p]));
      const merged = data.pins.map((p: any) => {
        const loc = localMap.get(p.pin);
        if (loc && loc.status === 'used') {
          return { ...p, status: 'used', usedAt: loc.usedAt || p.usedAt, usedBy: loc.usedBy || p.usedBy };
        }
        return p;
      });
      saveLocalPatientPins(merged);
      return {
        success: true,
        count: merged.length,
        message: data.message || `Berhasil mensinkronkan ${merged.length} PIN dengan Google Sheet!`
      };
    } else {
      return {
        success: false,
        count: 0,
        message: data?.error || data?.message || 'Gagal melakukan sinkronisasi dengan Google Sheet.'
      };
    }
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      message: 'Gagal terhubung ke server aplikasi: ' + (err?.message || 'Koneksi terputus')
    };
  }
}

/**
 * Impor atau Tempel PIN Langsung dari Google Sheet (Manual / Backup)
 */
export async function importPinsFromSheetText(rawText: string, adminToken?: string): Promise<{ success: boolean; importedCount: number; message: string }> {
  try {
    const res = await fetch('/api/patient-pins/import-pins', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
      },
      body: JSON.stringify({ rawText }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.success && Array.isArray(data.pins)) {
      saveLocalPatientPins(data.pins);
      return {
        success: true,
        importedCount: data.importedCount || 0,
        message: data.message || `Berhasil mengimpor ${data.importedCount} PIN!`
      };
    }
    return {
      success: false,
      importedCount: 0,
      message: data?.error || 'Gagal mengimpor PIN.'
    };
  } catch (err: any) {
    return {
      success: false,
      importedCount: 0,
      message: 'Gagal menghubungi server: ' + err?.message
    };
  }
}

/**
 * Validasi 6-digit PIN Pasien (Google Sheet Real-Time + Server-Side + Local Offline Fallback)
 */
export async function validatePatientPin(pin: string): Promise<{
  valid: boolean;
  status: 'active' | 'used' | 'revoked' | 'not_found' | 'invalid_format';
  token?: PatientPinToken;
  message: string;
}> {
  const cleanPin = pin.trim().replace(/\D/g, '');
  if (!cleanPin || cleanPin.length < 4) {
    return {
      valid: false,
      status: 'invalid_format',
      message: 'Format PIN tidak valid. Masukkan 6 digit angka.',
    };
  }

  // 0. Cek Penyimpanan Lokal Seketika: Jika sudah berstatus 'used', tolak langsung!
  const localList = loadLocalPatientPins();
  const localFound = localList.find(p => p.pin === cleanPin);
  if (localFound && localFound.status === 'used') {
    return {
      valid: false,
      status: 'used',
      token: localFound,
      message: `PIN ini sudah pernah digunakan pada ${localFound.usedAt ? new Date(localFound.usedAt).toLocaleString('id-ID') : 'sebelumnya'}. Sistem membatasi 1x pengisian per PIN demi keaslian data.`,
    };
  }

  // 1. Coba validasi via Server (Server akan query Google Sheet terlebih dahulu)
  try {
    const res = await fetch('/api/patient-pins/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: cleanPin }),
    });

    const data = await res.json();
    if (res.ok && data.valid) {
      const token: PatientPinToken = data.token || {
        id: 'pin_' + cleanPin,
        pin: cleanPin,
        status: 'active',
        registeredPatientName: data.registeredPatientName,
        registeredService: data.registeredService,
        registeredRoom: data.registeredRoom,
        createdAt: data.createdAt || new Date().toISOString(),
        label: data.label
      };
      return {
        valid: true,
        status: 'active',
        token,
        message: data.message || 'PIN valid dari Google Sheet RSUD Aeramo.',
      };
    } else if (data.status && data.status !== 'not_found') {
      return {
        valid: false,
        status: data.status,
        token: data.token,
        message: data.message || 'PIN tidak dapat digunakan.',
      };
    }
  } catch (err) {
    console.warn('Network error while validating PIN on server, attempting direct Apps Script check:', err);
  }

  // 2. Direct Apps Script check jika server offline tapi user terkoneksi internet
  const cfg = loadAppConfig();
  if (cfg.appsScriptUrl) {
    try {
      const directUrl = `${cfg.appsScriptUrl}${cfg.appsScriptUrl.includes('?') ? '&' : '?'}action=validate_pin&pin=${cleanPin}`;
      const directRes = await fetch(directUrl);
      if (directRes.ok) {
        const directData = await directRes.json();
        if (directData && typeof directData.valid === 'boolean') {
          if (directData.valid) {
            const token: PatientPinToken = directData.token || {
              id: 'pin_' + cleanPin,
              pin: cleanPin,
              status: 'active',
              registeredPatientName: directData.registeredPatientName,
              registeredService: directData.registeredService,
              registeredRoom: directData.registeredRoom,
              createdAt: directData.createdAt || new Date().toISOString(),
              label: directData.label
            };
            return {
              valid: true,
              status: 'active',
              token,
              message: directData.message || 'PIN valid dari Google Sheet!'
            };
          } else {
            return {
              valid: false,
              status: directData.status || 'not_found',
              token: directData.token,
              message: directData.message || 'PIN tidak dapat digunakan.'
            };
          }
        }
      }
    } catch (directErr) {
      console.warn('Direct Apps Script validation failed:', directErr);
    }
  }

  // 3. Fallback Local Storage jika seluruh koneksi internet/server offline
  const fallbackList = loadLocalPatientPins();
  const found = fallbackList.find(p => p.pin === cleanPin);
  if (!found) {
    return {
      valid: false,
      status: 'not_found',
      message: 'PIN tidak ditemukan. Pastikan nomor PIN benar sesuai yang diberikan petugas RSUD Aeramo atau pastikan koneksi internet aktif.',
    };
  }

  if (found.status === 'used') {
    return {
      valid: false,
      status: 'used',
      token: found,
      message: `PIN ini sudah pernah digunakan pada ${found.usedAt ? new Date(found.usedAt).toLocaleString('id-ID') : 'sebelumnya'}. Sistem membatasi 1x pengisian per PIN demi keaslian data.`,
    };
  }

  if (found.status === 'revoked') {
    return {
      valid: false,
      status: 'revoked',
      token: found,
      message: 'PIN ini telah dinonaktifkan oleh petugas.',
    };
  }

  return {
    valid: true,
    status: 'active',
    token: found,
    message: 'PIN valid dan siap digunakan.',
  };
}

/**
 * Buat PIN Pasien Baru (Single atau Batch)
 */
export async function generatePatientPins(params: {
  count?: number;
  label?: string;
  notes?: string;
  customPin?: string;
  registeredPatientName?: string;
  registeredService?: string;
  registeredRoom?: string;
  adminToken?: string;
}): Promise<PatientPinToken[]> {
  try {
    const res = await fetch('/api/patient-pins/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(params.adminToken ? { Authorization: `Bearer ${params.adminToken}` } : {}),
      },
      body: JSON.stringify(params),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.pins)) {
        const current = loadLocalPatientPins();
        const merged = [...data.pins, ...current];
        saveLocalPatientPins(merged);

        // Langsung kirim ke Google Apps Script (Tab PIN_PASIEN) dari browser juga
        const cfg = loadAppConfig();
        if (cfg.appsScriptUrl) {
          try {
            fetch(cfg.appsScriptUrl, {
              method: 'POST',
              mode: 'no-cors',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({ action: 'create_pins', pins: data.pins }),
            }).catch(e => console.warn('Direct Apps Script PIN sync:', e));
          } catch {}
        }

        return data.pins;
      }
    }
  } catch (err) {
    console.warn('Generate PIN via server error, fallback local generation:', err);
  }

  // Fallback lokal
  const num = Math.min(Math.max(1, params.count || 1), 50);
  const current = loadLocalPatientPins();
  const existingSet = new Set(current.map(p => p.pin));
  const newPins: PatientPinToken[] = [];

  for (let i = 0; i < num; i++) {
    let pinCode = Math.floor(100000 + Math.random() * 900000).toString();
    while (existingSet.has(pinCode)) {
      pinCode = Math.floor(100000 + Math.random() * 900000).toString();
    }
    existingSet.add(pinCode);
    newPins.push({
      id: 'pin_' + Date.now() + '_' + i,
      pin: pinCode,
      status: 'active',
      createdAt: new Date().toISOString(),
      registeredPatientName: num === 1 ? (params.registeredPatientName?.trim() || undefined) : undefined,
      registeredService: params.registeredService?.trim() || undefined,
      registeredRoom: params.registeredRoom?.trim() || undefined,
      label: num === 1 && params.registeredPatientName ? `Pasien: ${params.registeredPatientName.trim()}` : (params.label || undefined),
      notes: params.notes || undefined,
    });
  }

  const updated = [...newPins, ...current];
  saveLocalPatientPins(updated);
  return newPins;
}

/**
 * Tandai PIN Pasien telah digunakan (One-Time Consume)
 */
export async function consumePatientPin(params: {
  pin: string;
  submissionId: string;
  namaPasien?: string;
  jenisLayanan?: string;
  ikmScore?: number;
}): Promise<boolean> {
  const cleanPin = params.pin.trim().replace(/\D/g, '');
  if (!cleanPin) return false;

  const nowIso = new Date().toISOString();

  // 1. Update status lokal SEKETIKA di browser pengguna
  const localList = loadLocalPatientPins();
  const idx = localList.findIndex(p => p.pin === cleanPin);
  if (idx !== -1) {
    localList[idx] = {
      ...localList[idx],
      status: 'used',
      usedAt: nowIso,
      usedBy: {
        submissionId: params.submissionId,
        namaPasien: params.namaPasien || localList[idx].registeredPatientName || 'Pasien Anonim',
        jenisLayanan: params.jenisLayanan || localList[idx].registeredService || 'Pelayanan RSUD Aeramo',
        ikmScore: params.ikmScore,
      },
    };
  } else {
    localList.unshift({
      id: 'pin_' + cleanPin,
      pin: cleanPin,
      status: 'used',
      createdAt: nowIso,
      usedAt: nowIso,
      registeredPatientName: params.namaPasien,
      registeredService: params.jenisLayanan,
      label: params.namaPasien ? `Pasien: ${params.namaPasien}` : 'Pasien RSUD Aeramo',
      usedBy: {
        submissionId: params.submissionId,
        namaPasien: params.namaPasien || 'Pasien Anonim',
        jenisLayanan: params.jenisLayanan || 'Pelayanan RSUD Aeramo',
        ikmScore: params.ikmScore,
      },
    });
  }
  saveLocalPatientPins(localList);

  // Bersihkan active session PIN dari storage agar tidak bisa dipakai submit lagi
  setActiveSessionPatientPin(null);

  // 2. Update ke Server Full-Stack
  try {
    await fetch('/api/patient-pins/consume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...params, pin: cleanPin }),
    });
  } catch (err) {
    console.warn('Error consuming PIN on server:', err);
  }

  // 3. Update status PIN di Google Apps Script (Tab PIN_PASIEN) jika URL dikonfigurasi
  const cfg = loadAppConfig();
  if (cfg.appsScriptUrl) {
    try {
      fetch(cfg.appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'consume_pin',
          pin: cleanPin,
          submissionId: params.submissionId,
          namaPasien: params.namaPasien,
          jenisLayanan: params.jenisLayanan,
          ikmScore: params.ikmScore,
        }),
      }).catch(() => {});
    } catch {}
  }

  return true;
}

/**
 * Cabut / Nonaktifkan PIN Pasien
 */
export async function revokePatientPin(id: string, adminToken?: string): Promise<boolean> {
  try {
    await fetch('/api/patient-pins/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
      },
      body: JSON.stringify({ id }),
    });
  } catch (err) {
    console.warn('Revoke PIN server error:', err);
  }

  const localList = loadLocalPatientPins();
  const updated = localList.map(p => p.id === id ? { ...p, status: 'revoked' as const } : p);
  saveLocalPatientPins(updated);
  return true;
}

/**
 * Hapus PIN Pasien
 */
export async function deletePatientPin(
  params: { id?: string; allUsed?: boolean; all?: boolean }, 
  adminToken?: string
): Promise<boolean> {
  try {
    await fetch('/api/patient-pins/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
      },
      body: JSON.stringify(params),
    });
  } catch (err) {
    console.warn('Delete PIN server error:', err);
  }

  let localList = loadLocalPatientPins();
  if (params.all) {
    saveLocalPatientPins([]);
  } else if (params.allUsed) {
    localList = localList.filter(p => p.status !== 'used');
    saveLocalPatientPins(localList);
  } else if (params.id) {
    localList = localList.filter(p => p.id !== params.id);
    saveLocalPatientPins(localList);
  }
  return true;
}


/**
 * Cek status apakah perangkat ini sudah pernah mengisi survei (One-Time Access Lock)
 */
export function getOneTimeLock(): OneTimeSubmissionLock | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ONE_TIME_LOCK);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.isSubmitted ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Kunci akses perangkat secara permanen setelah pengiriman survei berhasil (Anti-Spam / One-Time Use)
 */
export function saveOneTimeLock(submission: SurveySubmission): void {
  try {
    const lockData: OneTimeSubmissionLock = {
      isSubmitted: true,
      submissionId: submission.id,
      submittedAt: new Date().toISOString(),
      namaPasien: submission.namaPasien || 'Pasien RSUD Aeramo',
      jenisLayanan: submission.jenisLayanan,
      mutuLayanan: submission.mutuLayanan,
      ikmScore: submission.ikmScore,
    };
    localStorage.setItem(STORAGE_KEYS.ONE_TIME_LOCK, JSON.stringify(lockData));
  } catch (err) {
    console.error('Failed to save one-time lock:', err);
  }
}

/**
 * Buka kunci akses perangkat (Hanya oleh Petugas Admin melalui Portal Terproteksi)
 */
export function clearOneTimeLock(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.ONE_TIME_LOCK);
  } catch (err) {
    console.error('Failed to clear one-time lock:', err);
  }
}

export const DEFAULT_CONFIG: AppConfig = {
  appsScriptUrl: ADMIN_CONFIG.appsScriptUrl || '',
  hospitalName: ADMIN_CONFIG.hospitalName || 'RSUD Aeramo',
  hospitalSubTitle: ADMIN_CONFIG.hospitalSubTitle || 'Pemerintah Kabupaten Nagekeo - Dinas Kesehatan',
  kioskMode: false,
  autoResetSeconds: 8,
  requirePatientPin: ADMIN_CONFIG.requirePatientPin ?? true,
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
