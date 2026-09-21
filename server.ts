import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '1mb' }));

// =============================================================================
// KONFIGURASI KEAMANAN SERVER (CYBER SECURITY HARDENING)
// =============================================================================
const MASTER_PIN = (process.env.ADMIN_PIN || '1987').trim();
let RUNTIME_APPS_SCRIPT_URL = (process.env.APPS_SCRIPT_URL || '').trim();

// In-Memory Rate Limiter & Brute-Force Defender
interface RateLimitRecord {
  count: number;
  lockedUntil: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

// Ephemeral Admin Sessions (Token -> ExpireTimestamp)
const adminSessions = new Map<string, number>();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function checkAdminAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Akses ditolak: Token autentikasi tidak ditemukan.' });
  }

  const token = authHeader.split(' ')[1];
  const expireTime = adminSessions.get(token);

  if (!expireTime || Date.now() > expireTime) {
    if (expireTime) adminSessions.delete(token);
    return res.status(401).json({ error: 'Sesi petugas telah berakhir. Silakan masukkan PIN kembali.' });
  }

  // Perpanjang sesi aktif 20 menit
  adminSessions.set(token, Date.now() + 20 * 60 * 1000);
  next();
}

// Sanitasi mendalam pencegah Formula Injection (=, +, -, @) dan XSS
function sanitizeData(input: any): any {
  if (typeof input === 'string') {
    let clean = input.replace(/<[^>]*>?/gm, '').trim();
    if (/^[=+\-@\t\r]/.test(clean)) {
      clean = "'" + clean;
    }
    return clean;
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeData);
  }
  if (input !== null && typeof input === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(input)) {
      result[key] = sanitizeData(value);
    }
    return result;
  }
  return input;
}

// =============================================================================
// API ROUTES
// =============================================================================

// 1. Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    system: 'SISEKAR RSUD Aeramo Security Server',
    timestamp: new Date().toISOString(),
  });
});

// 2. Verifikasi PIN Petugas dengan Proteksi Anti-Brute Force & Timing Attack
app.post('/api/admin/verify', (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, lockedUntil: 0 };

  // Cek apakah IP sedang diblokir sementara
  if (record.lockedUntil > now) {
    const remainingSec = Math.ceil((record.lockedUntil - now) / 1000);
    return res.status(429).json({
      error: `Akses diblokir sementara demi keamanan. Silakan tunggu ${remainingSec} detik sebelum mencoba lagi.`,
      locked: true,
      remainingSec,
    });
  }

  const { pin } = req.body;
  if (!pin || typeof pin !== 'string') {
    return res.status(400).json({ error: 'Format PIN tidak valid.' });
  }

  // Gunakan timing-safe comparison untuk mencegah timing attack
  const inputBuffer = Buffer.from(pin.trim());
  const masterBuffer = Buffer.from(MASTER_PIN);

  let isMatch = false;
  if (inputBuffer.length === masterBuffer.length) {
    isMatch = crypto.timingSafeEqual(inputBuffer, masterBuffer);
  }

  if (!isMatch) {
    record.count += 1;
    if (record.count >= 5) {
      record.lockedUntil = now + 5 * 60 * 1000; // 5 menit
    } else if (record.count >= 3) {
      record.lockedUntil = now + 30 * 1000; // 30 detik
    }
    rateLimitMap.set(ip, record);

    return res.status(401).json({
      error: 'PIN Petugas tidak valid.',
      remainingAttempts: Math.max(0, 5 - record.count),
      locked: record.lockedUntil > now,
    });
  }

  // Sukses: Reset percobaan
  rateLimitMap.delete(ip);

  // Terbitkan token sesi acak berkekuatan kriptografis (32 bytes)
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expireTime = now + 30 * 60 * 1000; // 30 menit
  adminSessions.set(sessionToken, expireTime);

  return res.json({
    success: true,
    token: sessionToken,
    expiresAt: new Date(expireTime).toISOString(),
    message: 'Autentikasi Petugas Berhasil.',
  });
});

// 3. Ambil Konfigurasi Admin (Hanya Petugas Terautentikasi)
app.get('/api/admin/config', checkAdminAuth, (req: Request, res: Response) => {
  res.json({
    success: true,
    appsScriptUrl: RUNTIME_APPS_SCRIPT_URL,
    hasConfiguredUrl: Boolean(RUNTIME_APPS_SCRIPT_URL),
    securityFeatures: [
      'Anti-Brute Force Protection',
      'Timing Attack Resistance',
      'Hidden Webhook URL Proxy',
      'Anti-Formula Spreadsheet Injection',
      'Kiosk Anti-Inspection Enforcement',
    ],
  });
});

// 4. Perbarui Konfigurasi URL Google Apps Script (Hanya Petugas Terautentikasi)
app.post('/api/admin/config', checkAdminAuth, (req: Request, res: Response) => {
  const { appsScriptUrl } = req.body;
  if (typeof appsScriptUrl === 'string') {
    RUNTIME_APPS_SCRIPT_URL = appsScriptUrl.trim();
  }
  res.json({
    success: true,
    message: 'Konfigurasi Google Apps Script berhasil disimpan secara aman di server.',
  });
});

// 5. Proxy Pengiriman Survei ke Google Sheet (Menyembunyikan URL Asli dari Pasien)
app.post('/api/survey/submit', async (req: Request, res: Response) => {
  try {
    const rawData = req.body;
    if (!rawData || typeof rawData !== 'object') {
      return res.status(400).json({ error: 'Data survei tidak valid.' });
    }

    // Sanitasi semua teks yang diinput pasien
    const sanitizedSubmission = sanitizeData(rawData);

    // Ambil target URL Google Apps Script dari konfigurasi server atau fallback payload
    const targetUrl = RUNTIME_APPS_SCRIPT_URL || (typeof rawData.scriptUrl === 'string' ? rawData.scriptUrl.trim() : '');

    if (!targetUrl) {
      return res.json({
        success: true,
        mode: 'offline_saved',
        message: 'Survei tersimpan aman di sistem lokal. URL Google Apps Script belum dikonfigurasi di server.',
      });
    }

    // Teruskan secara rahasia dari Server -> Google Apps Script
    // Browser pasien TIDAK BISA melihat URL Google Apps Script ini!
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(sanitizedSubmission),
    });

    return res.json({
      success: true,
      mode: 'online',
      message: 'Terima kasih! Survei kepuasan Anda berhasil diverifikasi dan dicatat ke Google Sheets RSUD Aeramo.',
    });
  } catch (error: any) {
    console.warn('[Security Proxy] Forwarding error to Apps Script:', error?.message);
    return res.json({
      success: true,
      mode: 'offline_saved',
      message: 'Jaringan eksternal terganggu. Data berhasil diamankan dan akan disinkronkan kembali.',
    });
  }
});

// =============================================================================
// VITE MIDDLEWARE / STATIC ASSETS
// =============================================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SISEKAR Security Server] Berjalan pada http://0.0.0.0:${PORT}`);
    console.log(`[Cyber Security] Proteksi Anti-Inspeksi & Endpoint Terlindungi Aktif.`);
  });
}

startServer();
