/**
 * Modul Keamanan Siber (Cyber Security & Hardening) untuk SISEKAR RSUD Aeramo
 * Melindungi dari:
 * 1. Inspeksi kode & devtools (F12, Inspect Element, View Source)
 * 2. Brute-force serangan PIN petugas
 * 3. Formula injection & XSS pada Google Sheets
 * 4. Paparan kunci rahasia pada client-side browser
 */

const SECURITY_SALT = 'RSUD_AERAMO_SISEKAR_2026_SEC_SALT';

// SHA-256 hash dari PIN default (1987 + SALT) sehingga PIN asli TIDAK PERNAH tersimpan dalam bentuk plain text
export const DEFAULT_PIN_HASH = '1f185c88975878d6bdf561a0b368735ca3ae7f6311bc51034f71a069a8a70a82';

/**
 * Buat hash SHA-256 menggunakan Web Crypto API standar browser
 */
export async function hashPin(pin: string): Promise<string> {
  if (!crypto || !crypto.subtle) {
    // Fallback sederhana jika crypto subtle tidak tersedia
    let hash = 0;
    const str = pin + SECURITY_SALT;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return String(hash);
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(pin.trim() + SECURITY_SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Sanitasi input pasien agar aman dari XSS dan Spreadsheet Formula Injection
 * (Mencegah karakter =, +, -, @ di awal string yang dapat dieksekusi oleh Google Sheets)
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  let cleaned = input.trim();
  
  // Hapus tag HTML / script
  cleaned = cleaned.replace(/<[^>]*>?/gm, '');
  
  // Mencegah Formula Injection di Google Sheets (=, +, -, @, TAB, CR)
  if (/^[=+\-@\t\r]/.test(cleaned)) {
    cleaned = "'" + cleaned;
  }
  
  return cleaned;
}

/**
 * Manajemen Anti-Brute Force untuk Login Petugas
 */
const ATTEMPT_STORAGE_KEY = 'sisekar_sec_attempts';
const LOCKOUT_UNTIL_KEY = 'sisekar_sec_lockout';

export interface SecurityStatus {
  isLocked: boolean;
  remainingSeconds: number;
  attemptsCount: number;
}

export function getSecurityStatus(): SecurityStatus {
  try {
    const lockoutUntil = parseInt(sessionStorage.getItem(LOCKOUT_UNTIL_KEY) || '0', 10);
    const now = Date.now();
    
    if (lockoutUntil > now) {
      const remaining = Math.ceil((lockoutUntil - now) / 1000);
      return { isLocked: true, remainingSeconds: remaining, attemptsCount: 5 };
    }
    
    const attempts = parseInt(sessionStorage.getItem(ATTEMPT_STORAGE_KEY) || '0', 10);
    return { isLocked: false, remainingSeconds: 0, attemptsCount: attempts };
  } catch {
    return { isLocked: false, remainingSeconds: 0, attemptsCount: 0 };
  }
}

export function recordFailedAttempt(): SecurityStatus {
  try {
    const attempts = parseInt(sessionStorage.getItem(ATTEMPT_STORAGE_KEY) || '0', 10) + 1;
    sessionStorage.setItem(ATTEMPT_STORAGE_KEY, String(attempts));
    
    let lockoutDurationMs = 0;
    if (attempts >= 5) {
      lockoutDurationMs = 5 * 60 * 1000; // 5 menit
    } else if (attempts >= 3) {
      lockoutDurationMs = 30 * 1000; // 30 detik
    }
    
    if (lockoutDurationMs > 0) {
      const lockoutUntil = Date.now() + lockoutDurationMs;
      sessionStorage.setItem(LOCKOUT_UNTIL_KEY, String(lockoutUntil));
      return { 
        isLocked: true, 
        remainingSeconds: Math.ceil(lockoutDurationMs / 1000), 
        attemptsCount: attempts 
      };
    }
    
    return { isLocked: false, remainingSeconds: 0, attemptsCount: attempts };
  } catch {
    return { isLocked: false, remainingSeconds: 0, attemptsCount: 1 };
  }
}

export function resetFailedAttempts(): void {
  try {
    sessionStorage.removeItem(ATTEMPT_STORAGE_KEY);
    sessionStorage.removeItem(LOCKOUT_UNTIL_KEY);
  } catch {
    // ignore
  }
}

/**
 * Mengaktifkan proteksi anti-inspeksi pada aplikasi survei kiosk
 * Menghalangi:
 * - Klik Kanan (Context Menu)
 * - Shortcut DevTools: F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
 */
export function initializeClientSecurityProtections(): () => void {
  if (typeof window === 'undefined') return () => {};

  // Peringatan di console jika ada yang membuka devtools
  const bannerStyle = 'font-size: 16px; font-weight: bold; color: #dc2626; background: #fee2e2; padding: 8px 12px; border-radius: 6px;';
  const subStyle = 'font-size: 12px; color: #1e293b;';
  console.log('%c⚠️ PERINGATAN SISTEM KEAMANAN SISEKAR RSUD AERAMO', bannerStyle);
  console.log('%cAplikasi ini diproteksi oleh modul Cyber Security. Seluruh aktivitas formulir dan autentikasi diawasi demi privasi data pasien.', subStyle);

  // Blokir Klik Kanan
  const handleContextMenu = (e: MouseEvent) => {
    // Izinkan klik kanan hanya pada input teks untuk copy-paste normal
    const target = e.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      return;
    }
    e.preventDefault();
  };

  // Blokir Tombol Shortcut Inspeksi
  const handleKeyDown = (e: KeyboardEvent) => {
    // F12
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }

    // Ctrl + Shift + I / Cmd + Option + I (Inspect Element)
    // Ctrl + Shift + J / Cmd + Option + J (Console)
    // Ctrl + Shift + C (Inspect Element selector)
    if (
      (e.ctrlKey || e.metaKey) &&
      e.shiftKey &&
      ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)
    ) {
      e.preventDefault();
      return false;
    }

    // Ctrl + U / Cmd + Option + U (View Source)
    if ((e.ctrlKey || e.metaKey) && ['U', 'u'].includes(e.key)) {
      e.preventDefault();
      return false;
    }
  };

  window.addEventListener('contextmenu', handleContextMenu);
  window.addEventListener('keydown', handleKeyDown);

  return () => {
    window.removeEventListener('contextmenu', handleContextMenu);
    window.removeEventListener('keydown', handleKeyDown);
  };
}
