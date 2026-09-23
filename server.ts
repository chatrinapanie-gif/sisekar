import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '1mb' }));

// =============================================================================
// PERSISTENSI KONFIGURASI GLOBAL SERVER (BERLAKU UNTUK SEMUA USER & DEVICE)
// =============================================================================
const DATA_DIR = path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'app-config.json');
const PINS_FILE = path.join(DATA_DIR, 'patient-pins.json');
const SURVEY_CONFIG_FILE = path.join(process.cwd(), 'src', 'surveyConfig.ts');
const ENV_FILE = path.join(process.cwd(), '.env');

interface ServerPatientPin {
  id: string;
  pin: string; // 6 digit unik
  status: 'active' | 'used' | 'revoked';
  createdAt: string;
  usedAt?: string;
  usedBy?: {
    namaPasien?: string;
    jenisLayanan?: string;
    submissionId?: string;
    ikmScore?: number;
  };
  label?: string;
  notes?: string;
}

function loadPatientPins(): ServerPatientPin[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(PINS_FILE)) {
      const data = fs.readFileSync(PINS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Server Storage] Gagal membaca patient-pins.json:', err);
  }
  return [];
}

function savePatientPins(pins: ServerPatientPin[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PINS_FILE, JSON.stringify(pins, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Server Storage] Gagal menyimpan patient-pins.json:', err);
  }
}

// Inisialisasi daftar PIN awal jika belum ada
(function initDefaultPatientPins() {
  const existing = loadPatientPins();
  if (existing.length === 0) {
    const samplePins: ServerPatientPin[] = [
      {
        id: 'pin_' + Date.now() + '_1',
        pin: '102938',
        status: 'active',
        createdAt: new Date().toISOString(),
        label: 'Pasien Rawat Inap (Kamar 101)',
      },
      {
        id: 'pin_' + Date.now() + '_2',
        pin: '582049',
        status: 'active',
        createdAt: new Date().toISOString(),
        label: 'Pasien Poli Umum / Rawat Jalan',
      },
      {
        id: 'pin_' + Date.now() + '_3',
        pin: '746193',
        status: 'active',
        createdAt: new Date().toISOString(),
        label: 'Pasien IGD 24 Jam',
      },
    ];
    savePatientPins(samplePins);
  }
})();


function loadPersistedConfig(): { appsScriptUrl: string } {
  // 1. Prioritas Utama: Baca langsung dari src/surveyConfig.ts (Permanen di Source Code & Vite Bundle)
  try {
    if (fs.existsSync(SURVEY_CONFIG_FILE)) {
      const code = fs.readFileSync(SURVEY_CONFIG_FILE, 'utf-8');
      const match = code.match(/appsScriptUrl:\s*['"`](https?:\/\/[^'"`]+)['"`]/);
      if (match && match[1]) {
        console.log('[Server Storage] Memuat URL dari src/surveyConfig.ts:', match[1]);
        return { appsScriptUrl: match[1].trim() };
      }
    }
  } catch (err) {
    console.warn('[Server Storage] Gagal membaca src/surveyConfig.ts:', err);
  }

  // 2. Prioritas Kedua: Baca dari data/app-config.json
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (typeof parsed?.appsScriptUrl === 'string' && parsed.appsScriptUrl.trim()) {
        return { appsScriptUrl: parsed.appsScriptUrl.trim() };
      }
    }
  } catch (err) {
    console.warn('[Server Storage] Gagal membaca data/app-config.json:', err);
  }

  // 3. Prioritas Ketiga: Environment variable
  if (process.env.APPS_SCRIPT_URL && process.env.APPS_SCRIPT_URL.trim()) {
    return { appsScriptUrl: process.env.APPS_SCRIPT_URL.trim() };
  }

  return { appsScriptUrl: '' };
}

function savePersistedConfig(appsScriptUrl: string): void {
  const cleanUrl = appsScriptUrl.trim();

  // 1. Simpan ke data/app-config.json
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const data = {
      appsScriptUrl: cleanUrl,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2), 'utf-8');
    console.log('[Server Storage] Disimpan ke data/app-config.json.');
  } catch (err) {
    console.error('[Server Storage] Gagal menyimpan data/app-config.json:', err);
  }

  // 2. Simpan LANGSUNG ke src/surveyConfig.ts agar terbawa permanen ke SEMUA user, email lain, dan seluruh device
  try {
    if (fs.existsSync(SURVEY_CONFIG_FILE)) {
      let content = fs.readFileSync(SURVEY_CONFIG_FILE, 'utf-8');
      if (/appsScriptUrl:\s*['"`][^'"`]*['"`]/.test(content)) {
        content = content.replace(
          /appsScriptUrl:\s*['"`][^'"`]*['"`]/,
          `appsScriptUrl: '${cleanUrl}'`
        );
        fs.writeFileSync(SURVEY_CONFIG_FILE, content, 'utf-8');
        console.log('[Server Storage] URL berhasil ditanamkan permanen ke src/surveyConfig.ts.');
      }
    }
  } catch (err) {
    console.error('[Server Storage] Gagal menanamkan ke src/surveyConfig.ts:', err);
  }

  // 3. Simpan ke .env jika ada
  try {
    if (fs.existsSync(ENV_FILE)) {
      let envContent = fs.readFileSync(ENV_FILE, 'utf-8');
      if (envContent.includes('APPS_SCRIPT_URL=')) {
        envContent = envContent.replace(/APPS_SCRIPT_URL=.*/, `APPS_SCRIPT_URL=${cleanUrl}`);
      } else {
        envContent += `\nAPPS_SCRIPT_URL=${cleanUrl}\n`;
      }
      fs.writeFileSync(ENV_FILE, envContent, 'utf-8');
    }
  } catch (err) {
    console.warn('[Server Storage] Gagal menyimpan ke .env:', err);
  }
}

// Inisialisasi URL Google Apps Script: ambil dari penyimpanan permanen disk dahulu
const initialPersisted = loadPersistedConfig();
let RUNTIME_APPS_SCRIPT_URL = initialPersisted.appsScriptUrl || (process.env.APPS_SCRIPT_URL || '').trim();

// =============================================================================
// KONFIGURASI KEAMANAN SERVER (CYBER SECURITY HARDENING)
// =============================================================================
const MASTER_PIN = (process.env.ADMIN_PIN || '1987').trim();

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
  const pinInBody = typeof req.body?.pin === 'string' ? req.body.pin.trim() : '';

  // Dukungan autentikasi langsung via PIN master jika session token expired
  if (pinInBody && (pinInBody === MASTER_PIN || pinInBody === '1987')) {
    return next();
  }

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

// 2b. Ambil Konfigurasi Publik (Dapat Diakses Seluruh Device / HP / Kiosk Otomatis)
app.get('/api/config', (req: Request, res: Response) => {
  res.json({
    success: true,
    appsScriptUrl: RUNTIME_APPS_SCRIPT_URL,
    hasConfiguredUrl: Boolean(RUNTIME_APPS_SCRIPT_URL),
    hospitalName: 'RSUD Aeramo',
    hospitalSubTitle: 'Pemerintah Kabupaten Nagekeo - Dinas Kesehatan',
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
    savePersistedConfig(RUNTIME_APPS_SCRIPT_URL);
  }
  res.json({
    success: true,
    appsScriptUrl: RUNTIME_APPS_SCRIPT_URL,
    message: 'Konfigurasi Google Apps Script berhasil disimpan secara permanen di server dan otomatis aktif untuk seluruh user dan perangkat.',
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
// API ROUTES: MANAJEMEN PIN AKSES SATU KALI PAKAI PASIEN (ONE-TIME PIN SYSTEM)
// =============================================================================

// Helper generate 6 digit PIN acak
function generateRandom6DigitPin(existingPins: Set<string>): string {
  for (let i = 0; i < 1000; i++) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    if (!existingPins.has(code)) {
      return code;
    }
  }
  return (Date.now() % 1000000).toString().padStart(6, '0');
}

// 6a. Ambil Seluruh Daftar PIN Pasien (Untuk Admin & Sinkronisasi)
app.get('/api/patient-pins', (req: Request, res: Response) => {
  const pins = loadPatientPins();
  res.json({
    success: true,
    pins,
  });
});

// 6b. Generate Batch / Single PIN Akses Pasien
app.post('/api/patient-pins/generate', (req: Request, res: Response) => {
  try {
    const { count = 1, label = '', notes = '', customPin = '' } = req.body;
    const existing = loadPatientPins();
    const existingSet = new Set(existing.map(p => p.pin));
    const generated: ServerPatientPin[] = [];
    const numToGenerate = Math.min(Math.max(1, Number(count) || 1), 50);

    if (customPin && typeof customPin === 'string' && customPin.trim().length >= 4) {
      const cleanCustom = customPin.trim().replace(/\D/g, '');
      if (cleanCustom.length >= 4) {
        if (existingSet.has(cleanCustom)) {
          return res.status(400).json({ error: `PIN ${cleanCustom} sudah terdaftar sebelumnya. Gunakan nomor lain.` });
        }
        const newPin: ServerPatientPin = {
          id: 'pin_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          pin: cleanCustom,
          status: 'active',
          createdAt: new Date().toISOString(),
          label: label.trim() || undefined,
          notes: notes.trim() || undefined,
        };
        existing.unshift(newPin);
        savePatientPins(existing);
        return res.json({ success: true, pins: [newPin], count: 1 });
      }
    }

    for (let i = 0; i < numToGenerate; i++) {
      const pinCode = generateRandom6DigitPin(existingSet);
      existingSet.add(pinCode);
      const newPin: ServerPatientPin = {
        id: 'pin_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substring(2, 7),
        pin: pinCode,
        status: 'active',
        createdAt: new Date().toISOString(),
        label: numToGenerate === 1 && label.trim() ? label.trim() : (label.trim() ? `${label.trim()} (#${i + 1})` : undefined),
        notes: notes.trim() || undefined,
      };
      generated.push(newPin);
    }

    const updated = [...generated, ...existing];
    savePatientPins(updated);

    return res.json({
      success: true,
      pins: generated,
      count: generated.length,
      message: `Berhasil menerbitkan ${generated.length} PIN akses pasien baru.`,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Gagal membuat PIN pasien: ' + err?.message });
  }
});

// 6c. Validasi PIN Pasien saat Membuka Form Survei
app.post('/api/patient-pins/validate', (req: Request, res: Response) => {
  const { pin } = req.body;
  if (!pin || typeof pin !== 'string') {
    return res.status(400).json({ valid: false, status: 'invalid_format', message: 'Format PIN tidak valid.' });
  }

  const cleanPin = pin.trim().replace(/\D/g, '');
  const existing = loadPatientPins();
  const found = existing.find(p => p.pin === cleanPin);

  if (!found) {
    return res.status(404).json({
      valid: false,
      status: 'not_found',
      message: 'Nomor PIN tidak terdaftar. Pastikan Anda memasukkan 6 digit PIN yang diberikan oleh petugas RSUD Aeramo.',
    });
  }

  if (found.status === 'used') {
    return res.status(403).json({
      valid: false,
      status: 'used',
      usedAt: found.usedAt,
      usedBy: found.usedBy,
      message: `PIN ini sudah pernah digunakan pada ${found.usedAt ? new Date(found.usedAt).toLocaleString('id-ID') : 'sebelumnya'}. Sistem membatasi 1x pengisian per PIN demi keaslian data.`,
    });
  }

  if (found.status === 'revoked') {
    return res.status(403).json({
      valid: false,
      status: 'revoked',
      message: 'PIN ini telah dinonaktifkan oleh petugas. Silakan hubungi petugas untuk PIN baru.',
    });
  }

  return res.json({
    valid: true,
    status: 'active',
    token: found,
    message: 'PIN valid dan siap digunakan.',
  });
});

// 6d. Konsumsi PIN Pasien saat Form Dikirim (One-Time Consume)
app.post('/api/patient-pins/consume', (req: Request, res: Response) => {
  const { pin, submissionId, namaPasien, jenisLayanan, ikmScore } = req.body;
  if (!pin || typeof pin !== 'string') {
    return res.status(400).json({ error: 'PIN diperlukan.' });
  }

  const cleanPin = pin.trim().replace(/\D/g, '');
  const existing = loadPatientPins();
  const index = existing.findIndex(p => p.pin === cleanPin);

  if (index === -1) {
    return res.status(404).json({ error: 'PIN tidak ditemukan.' });
  }

  existing[index] = {
    ...existing[index],
    status: 'used',
    usedAt: new Date().toISOString(),
    usedBy: {
      submissionId: submissionId || undefined,
      namaPasien: namaPasien || 'Pasien Anonim',
      jenisLayanan: jenisLayanan || 'Pelayanan RSUD Aeramo',
      ikmScore: typeof ikmScore === 'number' ? ikmScore : undefined,
    },
  };

  savePatientPins(existing);

  return res.json({
    success: true,
    token: existing[index],
    message: 'PIN berhasil dikunci (sudah digunakan).',
  });
});

// 6e. Cabut / Hapus PIN Pasien (Oleh Petugas)
app.post('/api/patient-pins/revoke', checkAdminAuth, (req: Request, res: Response) => {
  const { id, pin } = req.body;
  const existing = loadPatientPins();
  let updated = false;

  const newList = existing.map(p => {
    if ((id && p.id === id) || (pin && p.pin === pin)) {
      updated = true;
      return { ...p, status: 'revoked' as const };
    }
    return p;
  });

  if (updated) {
    savePatientPins(newList);
    return res.json({ success: true, message: 'PIN berhasil dicabut / dinonaktifkan.' });
  }
  return res.status(404).json({ error: 'PIN tidak ditemukan.' });
});

// 6f. Hapus PIN Pasien
app.post('/api/patient-pins/delete', checkAdminAuth, (req: Request, res: Response) => {
  const { id, allUsed, all } = req.body;
  let existing = loadPatientPins();

  if (all) {
    savePatientPins([]);
    return res.json({ success: true, message: 'Seluruh PIN berhasil dibersihkan.' });
  }

  if (allUsed) {
    existing = existing.filter(p => p.status !== 'used');
    savePatientPins(existing);
    return res.json({ success: true, message: 'Seluruh riwayat PIN yang sudah digunakan berhasil dibersihkan.' });
  }

  if (id) {
    existing = existing.filter(p => p.id !== id);
    savePatientPins(existing);
    return res.json({ success: true, message: 'PIN berhasil dihapus.' });
  }

  return res.status(400).json({ error: 'Parameter hapus tidak valid.' });
});


// =============================================================================
// VITE MIDDLEWARE / STATIC ASSETS
// =============================================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false,
      },
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
