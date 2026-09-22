/**
 * Layanan Manajemen Sesi QR Code dengan Batas Waktu Kadaluarsa 2 Jam
 * RSUD Aeramo - Kabupaten Nagekeo
 */

import { QRSession } from '../types';

const QR_SESSION_STORAGE_KEY = 'sisekar_active_qr_session';
export const DEFAULT_SESSION_DURATION_HOURS = 2; // 2 Jam
export const DEFAULT_SESSION_DURATION_MS = DEFAULT_SESSION_DURATION_HOURS * 60 * 60 * 1000; // 7,200,000 ms

/**
 * Membuat payload data QR code yang berisi URL tujuan dan timestamp kedaluwarsa 2 jam
 */
export function generateQRPayload(appsScriptUrl: string, durationMs = DEFAULT_SESSION_DURATION_MS): string {
  const now = Date.now();
  const expiresAt = now + durationMs;
  const token = 'QR-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + now;
  
  const payloadData = {
    url: appsScriptUrl.trim(),
    token,
    cat: now,       // Created At
    exp: expiresAt, // Expires At (2 jam)
    org: 'RSUD Aeramo',
    v: 1
  };

  // Encode ke base64 agar aman dalam QR Code
  try {
    const jsonStr = JSON.stringify(payloadData);
    const b64 = btoa(unescape(encodeURIComponent(jsonStr)));
    return b64;
  } catch {
    return JSON.stringify(payloadData);
  }
}

/**
 * Membuat URL lengkap yang bisa di-scan oleh kamera HP bawaan mana pun
 */
export function generateShareableQRLink(appsScriptUrl: string, origin = window.location.origin): string {
  const payload = generateQRPayload(appsScriptUrl);
  return `${origin}/?qr=${encodeURIComponent(payload)}`;
}

/**
 * Memverifikasi dan mengaktifkan sesi dari hasil scan QR atau URL parameter
 */
export function parseAndActivateQRSession(rawScanData: string): { success: boolean; session?: QRSession; message: string } {
  if (!rawScanData) {
    return { success: false, message: 'Data QR Code kosong.' };
  }

  try {
    let cleanData = rawScanData.trim();

    // Jika data adalah URL lengkap (misal di-scan dari kamera bawaan HP)
    if (cleanData.includes('?qr=')) {
      const urlObj = new URL(cleanData);
      cleanData = urlObj.searchParams.get('qr') || '';
    } else if (cleanData.includes('?scriptUrl=')) {
      const urlObj = new URL(cleanData);
      const directUrl = urlObj.searchParams.get('scriptUrl') || '';
      if (directUrl.startsWith('https://script.google.com')) {
        const session: QRSession = {
          appsScriptUrl: directUrl,
          token: 'DIRECT-' + Date.now(),
          createdAt: Date.now(),
          expiresAt: Date.now() + DEFAULT_SESSION_DURATION_MS,
          hospitalName: 'RSUD Aeramo'
        };
        saveActiveQRSession(session);
        return { success: true, session, message: 'Sesi survei aktif selama 2 jam.' };
      }
    }

    // Decode Base64 jika format terenkode
    let parsed: any;
    try {
      const decodedStr = decodeURIComponent(escape(atob(cleanData)));
      parsed = JSON.parse(decodedStr);
    } catch {
      // Jika format JSON biasa
      parsed = JSON.parse(cleanData);
    }

    if (!parsed || !parsed.url) {
      return { success: false, message: 'QR Code tidak valid atau format tidak dikenali.' };
    }

    const now = Date.now();
    const expiresAt = typeof parsed.exp === 'number' ? parsed.exp : (now + DEFAULT_SESSION_DURATION_MS);

    // Periksa apakah waktu 2 jam sudah kadaluarsa
    if (now >= expiresAt) {
      return { 
        success: false, 
        message: 'QR Code ini telah KADALUARSA (batas waktu 2 jam telah habis). Silakan minta petugas RSUD Aeramo untuk membuat QR Code baru.' 
      };
    }

    const session: QRSession = {
      appsScriptUrl: parsed.url,
      token: parsed.token || ('TKN-' + now),
      createdAt: parsed.cat || (expiresAt - DEFAULT_SESSION_DURATION_MS),
      expiresAt: expiresAt,
      hospitalName: parsed.org || 'RSUD Aeramo'
    };

    saveActiveQRSession(session);
    return { 
      success: true, 
      session, 
      message: 'Berhasil mendaftarkan survei! Sesi Anda aktif selama 2 jam.' 
    };
  } catch (err: any) {
    // Cek jika rawScanData langsung berupa URL Google Apps Script
    if (rawScanData.startsWith('https://script.google.com')) {
      const session: QRSession = {
        appsScriptUrl: rawScanData.trim(),
        token: 'RAW-' + Date.now(),
        createdAt: Date.now(),
        expiresAt: Date.now() + DEFAULT_SESSION_DURATION_MS,
        hospitalName: 'RSUD Aeramo'
      };
      saveActiveQRSession(session);
      return { success: true, session, message: 'URL Google Apps Script terdaftar untuk 2 jam.' };
    }
    return { success: false, message: 'Gagal memproses QR Code: ' + (err.message || 'Format tidak sesuai.') };
  }
}

/**
 * Menyimpan sesi aktif ke LocalStorage
 */
export function saveActiveQRSession(session: QRSession): void {
  try {
    localStorage.setItem(QR_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    console.warn('Gagal menyimpan sesi QR ke localStorage:', e);
  }
}

/**
 * Mengambil sesi QR aktif. Jika sudah kadaluarsa (> 2 jam), otomatis dihapus dan mengembalikan null.
 */
export function getActiveQRSession(): QRSession | null {
  try {
    const raw = localStorage.getItem(QR_SESSION_STORAGE_KEY);
    if (!raw) return null;
    
    const session: QRSession = JSON.parse(raw);
    if (!session || !session.expiresAt) {
      clearQRSession();
      return null;
    }

    const now = Date.now();
    // Jika sudah melewati batas 2 jam, hapus sesi
    if (now >= session.expiresAt) {
      clearQRSession();
      return null;
    }

    return session;
  } catch {
    clearQRSession();
    return null;
  }
}

/**
 * Menghapus sesi QR aktif (misal setelah kadaluarsa atau logout)
 */
export function clearQRSession(): void {
  try {
    localStorage.removeItem(QR_SESSION_STORAGE_KEY);
  } catch {}
}

/**
 * Menghitung sisa waktu dalam format jam:menit:detik (HH:MM:SS)
 */
export function formatRemainingTime(expiresAt: number): { formatted: string; isExpired: boolean; secondsLeft: number } {
  const now = Date.now();
  const diffMs = expiresAt - now;

  if (diffMs <= 0) {
    return { formatted: '00:00:00', isExpired: true, secondsLeft: 0 };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return { formatted, isExpired: false, secondsLeft: totalSeconds };
}
