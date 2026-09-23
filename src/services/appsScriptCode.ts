/**
 * Kode Google Apps Script (Code.gs & index.html) siap pakai untuk Google Sheets.
 * Dilengkapi Sistem Manajemen & Rotasi Mingguan Otomatis:
 * 1. "Rekap_Survei_Aktif" (Data minggu berjalan, cepat & ringan)
 * 2. "Arsip_Mingguan_Survei" (Penyimpanan historis permanen, data aman tidak terhapus)
 * RSUD AERAMO - KABUPATEN NAGEKEO
 */

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ==============================================================================
 * KUESIONER SURVEI KEPUASAN PASIEN & BACKEND API SINKRONISASI PIN
 * RUMAH SAKIT UMUM DAERAH (RSUD) AERAMO - KABUPATEN NAGEKEO
 * FILE TUNGGAL: Code.gs (Hanya butuh 1 file ini saja di Apps Script!)
 * ==============================================================================
 * Petunjuk Pemasangan Cepat:
 * 1. Buka Google Sheet Anda di Google Drive.
 * 2. Klik menu "Ekstensi" (Extensions) > "Apps Script".
 * 3. Jika ada file "index.html" lama, Anda boleh MENGHAPUSNYA (Hanya butuh Code.gs).
 * 4. Di file "Code.gs", hapus seluruh isinya dan tempel kode ini.
 * 5. Klik ikon Save (Disket).
 * 6. Klik tombol "Terapkan" (Deploy) > "Kelola Penerapan" (Manage Deployments):
 *    - Klik ikon Pensil (Edit).
 *    - Versi: Pilih "Versi baru" (New version).
 *    - Siapa yang memiliki akses: Pilih "Siapa saja" (Anyone)  <--- WAJIB!
 *    - Klik "Deploy".
 * ==============================================================================
 */

const SHEET_NAME_RESPONSES = "Data_Survei_Aeramo"; // Sheet Aktif Minggu Berjalan
const SHEET_NAME_ARCHIVE = "Arsip_Mingguan_Survei"; // Sheet Arsip Permanen
const SHEET_NAME_PINS = "PIN_PASIEN"; // Sheet Database PIN Akses Pasien Multi-Device
const SHEET_NAME_DASHBOARD = "Dashboard_IKM";

/**
 * Menu Kustom di Google Sheet untuk Petugas & Admin RSUD Aeramo (OPSIONAL / CADANGAN)
 * CATATAN PENTING:
 * Pembuatan PIN kini 100% dapat dilakukan langsung dari DASHBOARD ADMIN WEB
 * tanpa perlu membuka Google Sheet sama sekali. Menu onOpen ini hanya cadangan manual.
 */
function onOpen() {
  try {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu("📊 SISEKAR RSUD Aeramo")
      .addItem("🔑 Buat 10 PIN Pasien Baru (Cadangan Manual)", "generate10PinsMenu")
      .addItem("🔑 Buat 50 PIN Pasien Baru (Cadangan Manual)", "generate50PinsMenu")
      .addItem("📋 Periksa & Siapkan Tab Sheet PIN_PASIEN", "setupPinSheetManual")
      .addSeparator()
      .addItem("🔄 Jalankan Rotasi & Arsip Mingguan", "rotasiMingguanOtomatis")
      .addItem("⚙️ Pasang Auto-Trigger Mingguan Otomatis", "setupWeeklyTrigger")
      .addSeparator()
      .addItem("📈 Perbarui Dashboard IKM", "refreshDashboardManually")
      .addToUi();
  } catch (err) {}
}

/**
 * Inisialisasi / Siapkan Header Tab Sheet PIN_PASIEN
 */
function setupPinSheetManual() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensurePinSheetExists(ss);
  SpreadsheetApp.getUi().alert("✓ Tab 'PIN_PASIEN' berhasil disiapkan & siap digunakan oleh seluruh perangkat!");
}

function findPinSheet(ss) {
  if (!ss) return null;
  const candidates = [
    SHEET_NAME_PINS, "PIN_PASIEN", "PIN", "Pin", "Pins", "PIN Pasien", "Pin Pasien", "Data PIN", "DAFTAR_PIN", "Sheet_PIN"
  ];
  for (let i = 0; i < candidates.length; i++) {
    const s = ss.getSheetByName(candidates[i]);
    if (s) return s;
  }
  // Cek sheet mana pun yang di baris header ada kata 'PIN'
  const allSheets = ss.getSheets();
  for (let i = 0; i < allSheets.length; i++) {
    const s = allSheets[i];
    if (s.getLastRow() >= 1) {
      const maxCols = Math.min(Math.max(s.getLastColumn(), 1), 20);
      const headers = s.getRange(1, 1, 1, maxCols).getValues()[0];
      for (let c = 0; c < headers.length; c++) {
        const h = String(headers[c] || "").toUpperCase();
        if (h.indexOf("PIN") > -1) return s;
      }
    }
  }
  return ensurePinSheetExists(ss);
}

function detectPinSheetColumns(sheet) {
  const defaultMapping = {
    colPin: 1,       // 1-based (Col A)
    colStatus: 2,    // Col B
    colPatient: 3,   // Col C
    colService: 4,   // Col D
    colRoom: 5,      // Col E
    colCreatedAt: 6, // Col F
    colUsedAt: 7,    // Col G
    colUsedBy: 8,    // Col H
    colLayananSurvei: 9,
    colIkm: 10,
    colSubmissionId: 11,
    colNotes: 12
  };

  if (!sheet || sheet.getLastRow() < 1) return defaultMapping;

  const maxCols = Math.min(Math.max(sheet.getLastColumn(), 12), 30);
  const headerRow = sheet.getRange(1, 1, 1, maxCols).getValues()[0];
  
  let foundPin = -1;
  let foundStatus = -1;
  let foundPatient = -1;
  let foundService = -1;
  let foundRoom = -1;
  let foundCreated = -1;
  let foundUsed = -1;
  let foundUsedBy = -1;
  let foundIkm = -1;
  let foundSubId = -1;
  let foundNotes = -1;

  for (let c = 0; c < headerRow.length; c++) {
    const h = String(headerRow[c] || "").toLowerCase().trim();
    if (!h) continue;

    if (foundPin === -1 && (h === "pin" || h.indexOf("pin") > -1 || h.indexOf("kode pin") > -1 || h.indexOf("token") > -1)) {
      foundPin = c + 1;
    } else if (foundStatus === -1 && (h.indexOf("status") > -1 || h.indexOf("kondisi") > -1 || h.indexOf("state") > -1)) {
      foundStatus = c + 1;
    } else if (foundPatient === -1 && (h.indexOf("nama_pasien") > -1 || h.indexOf("nama pasien") > -1 || (h.indexOf("pasien") > -1 && h.indexOf("pin") === -1))) {
      foundPatient = c + 1;
    } else if (foundService === -1 && (h.indexOf("layanan") > -1 || h.indexOf("unit") > -1 || h.indexOf("instalasi") > -1 || h.indexOf("poli") > -1)) {
      foundService = c + 1;
    } else if (foundRoom === -1 && (h.indexOf("kamar") > -1 || h.indexOf("ruang") > -1 || h.indexOf("bed") > -1)) {
      foundRoom = c + 1;
    } else if (foundCreated === -1 && (h.indexOf("dibuat") > -1 || h.indexOf("created") > -1 || h.indexOf("terbit") > -1)) {
      foundCreated = c + 1;
    } else if (foundUsed === -1 && (h.indexOf("digunakan") > -1 || h.indexOf("used_at") > -1 || h.indexOf("dipakai") > -1)) {
      foundUsed = c + 1;
    } else if (foundUsedBy === -1 && (h.indexOf("responden") > -1 || h.indexOf("pengisi") > -1 || h.indexOf("digunakan oleh") > -1)) {
      foundUsedBy = c + 1;
    } else if (foundIkm === -1 && (h.indexOf("ikm") > -1 || h.indexOf("skor") > -1 || h.indexOf("nilai") > -1)) {
      foundIkm = c + 1;
    } else if (foundSubId === -1 && (h.indexOf("submission") > -1 || h.indexOf("id_survei") > -1)) {
      foundSubId = c + 1;
    } else if (foundNotes === -1 && (h.indexOf("catatan") > -1 || h.indexOf("ket") > -1 || h.indexOf("note") > -1)) {
      foundNotes = c + 1;
    }
  }

  // Jika di baris header tidak terdeteksi kata "PIN", periksa baris ke-2 (data) untuk menemukan kolom mana yang berisi 6-digit angka
  if (foundPin === -1 && sheet.getLastRow() >= 2) {
    const sampleRow = sheet.getRange(2, 1, 1, maxCols).getValues()[0];
    for (let c = 0; c < sampleRow.length; c++) {
      const clean = String(sampleRow[c] || "").replace(/\D/g, "");
      if (clean.length === 6) {
        foundPin = c + 1;
        break;
      }
    }
  }

  return {
    colPin: foundPin > 0 ? foundPin : 1,
    colStatus: foundStatus > 0 ? foundStatus : (foundPin === 2 ? 3 : 2),
    colPatient: foundPatient > 0 ? foundPatient : 3,
    colService: foundService > 0 ? foundService : 4,
    colRoom: foundRoom > 0 ? foundRoom : 5,
    colCreatedAt: foundCreated > 0 ? foundCreated : 6,
    colUsedAt: foundUsed > 0 ? foundUsed : 7,
    colUsedBy: foundUsedBy > 0 ? foundUsedBy : 8,
    colLayananSurvei: 9,
    colIkm: foundIkm > 0 ? foundIkm : 10,
    colSubmissionId: foundSubId > 0 ? foundSubId : 11,
    colNotes: foundNotes > 0 ? foundNotes : 12
  };
}

function ensurePinSheetExists(ss) {
  let pinSheet = ss.getSheetByName(SHEET_NAME_PINS);
  if (!pinSheet) {
    pinSheet = ss.insertSheet(SHEET_NAME_PINS);
  }

  // Jika belum ada header
  if (pinSheet.getLastRow() < 1) {
    const headers = [
      "PIN (6 DIGIT)", 
      "STATUS", 
      "NAMA_PASIEN_TERDAFTAR",
      "LAYANAN_TERDAFTAR",
      "KAMAR / RUANGAN",
      "DIBUAT_PADA", 
      "DIGUNAKAN_PADA", 
      "NAMA_RESPONDEN_SURVEI", 
      "LAYANAN_SURVEI", 
      "SKOR_IKM", 
      "SUBMISSION_ID", 
      "KETERANGAN / CATATAN"
    ];
    pinSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format Header Cantik
    const headerRange = pinSheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#1e3a8a")
      .setFontColor("#ffffff")
      .setFontWeight("bold")
      .setHorizontalAlignment("center")
      .setFontFamily("Arial");
    
    pinSheet.setFrozenRows(1);
    pinSheet.setColumnWidth(1, 130); // PIN
    pinSheet.setColumnWidth(2, 110); // STATUS
    pinSheet.setColumnWidth(3, 240); // NAMA PASIEN
    pinSheet.setColumnWidth(4, 180); // LAYANAN
    pinSheet.setColumnWidth(5, 160); // KAMAR
    pinSheet.setColumnWidth(6, 160); // DIBUAT
    pinSheet.setColumnWidth(7, 160); // DIGUNAKAN
    pinSheet.setColumnWidth(8, 200); // RESPONDEN
    pinSheet.setColumnWidth(9, 180); // LAYANAN SURVEI
    pinSheet.setColumnWidth(10, 100); // IKM
    pinSheet.setColumnWidth(11, 220); // ID
    pinSheet.setColumnWidth(12, 200); // KET

    // Buat beberapa PIN contoh awal jika kosong
    const nowStr = Utilities.formatDate(new Date(), "Asia/Makassar", "yyyy-MM-dd HH:mm:ss 'WITA'");
    const initialSamples = [
      ["'582049", "AKTIF", "CHATRINA HERLOFINA PANIE", "Rawat Inap", "Kamar Mawar 102", nowStr, "", "", "", "", "", "PIN Contoh Pasien Terdaftar"],
      ["'746193", "AKTIF", "Pasien Poliklinik", "Rawat Jalan / Poliklinik", "Poli Penyakit Dalam", nowStr, "", "", "", "", "", "PIN Contoh Poli"],
      ["'391824", "AKTIF", "Pasien Gawat Darurat", "IGD 24 Jam", "Bed 03", nowStr, "", "", "", "", "", "PIN Contoh IGD"],
      ["'829104", "AKTIF", "Ibu & Anak", "Kebidanan & Kandungan (VK)", "Kamar Bersalin", nowStr, "", "", "", "", "", "PIN Contoh VK"],
      ["'615284", "AKTIF", "Pasien Umum", "Pelayanan RSUD Aeramo", "-", nowStr, "", "", "", "", "", "PIN Bawaan Sistem RSUD Aeramo"]
    ];
    pinSheet.getRange(2, 1, initialSamples.length, 12).setValues(initialSamples);
  }
  return pinSheet;
}

/**
 * Menu Buat 10 PIN Otomatis di Google Sheet
 */
function generate10PinsMenu() {
  generatePinsInSheet(10, "PIN Cetak Loket / Pendaftaran");
  SpreadsheetApp.getUi().alert("✓ Berhasil membuat 10 PIN Pasien Baru di tab 'PIN_PASIEN'!");
}

/**
 * Menu Buat 50 PIN Otomatis di Google Sheet
 */
function generate50PinsMenu() {
  generatePinsInSheet(50, "PIN Batch Mingguan");
  SpreadsheetApp.getUi().alert("✓ Berhasil membuat 50 PIN Pasien Baru di tab 'PIN_PASIEN'!");
}

function generatePinsInSheet(count, defaultLabel) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = findPinSheet(ss) || ensurePinSheetExists(ss);
  
  const colMap = detectPinSheetColumns(sheet);
  const maxCols = Math.max(sheet.getLastColumn(), 12);
  const existingValues = sheet.getLastRow() > 1 
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, maxCols).getValues()
    : [];
  const existingSet = {};
  for (let i = 0; i < existingValues.length; i++) {
    const p = String(existingValues[i][colMap.colPin - 1] || "").replace(/\D/g, "");
    if (p) existingSet[p] = true;
  }

  const rows = [];
  const nowStr = Utilities.formatDate(new Date(), "Asia/Makassar", "yyyy-MM-dd HH:mm:ss 'WITA'");

  for (let i = 0; i < count; i++) {
    let pinCode = String(Math.floor(100000 + Math.random() * 900000));
    while (existingSet[pinCode]) {
      pinCode = String(Math.floor(100000 + Math.random() * 900000));
    }
    existingSet[pinCode] = true;

    const rowArr = new Array(Math.max(sheet.getLastColumn(), 12)).fill("");
    rowArr[colMap.colPin - 1] = "'" + pinCode;
    rowArr[colMap.colStatus - 1] = "AKTIF";
    if (colMap.colService - 1 >= 0) rowArr[colMap.colService - 1] = "Rawat Inap";
    if (colMap.colCreatedAt - 1 >= 0) rowArr[colMap.colCreatedAt - 1] = nowStr;
    if (colMap.colNotes - 1 >= 0) rowArr[colMap.colNotes - 1] = defaultLabel || "Dibuat via Menu Google Sheet";
    if (colMap.colPin === 2 && rowArr[0] === "") rowArr[0] = sheet.getLastRow() + rows.length + 1;
    rows.push(rowArr);
  }

  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    SpreadsheetApp.flush();
  }
}

/**
 * Otomatisasi Rotasi & Arsip Mingguan (Weekly Data Maintenance)
 * Menjaga sheet aktif tetap ringan & responsif tanpa menghapus data historis sedikit pun.
 */
function rotasiMingguanOtomatis() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const activeSheet = ss.getSheetByName(SHEET_NAME_RESPONSES);
  if (!activeSheet || activeSheet.getLastRow() <= 1) {
    return "Tidak ada data aktif untuk diarsipkan.";
  }

  let archiveSheet = ss.getSheetByName(SHEET_NAME_ARCHIVE);
  if (!archiveSheet) {
    archiveSheet = ss.insertSheet(SHEET_NAME_ARCHIVE);
    setupHeaders(archiveSheet, true);
  }

  const lastRow = activeSheet.getLastRow();
  const numCols = Math.max(activeSheet.getLastColumn(), 23);
  const activeData = activeSheet.getRange(2, 1, lastRow - 1, numCols).getValues();

  // Tambahkan label periode minggu sebelum diarsipkan
  const currentWeekLabel = "Minggu-" + Utilities.formatDate(new Date(), "Asia/Makassar", "yyyy-'W'ww");
  const archiveRows = activeData.map(function(row) {
    const newRow = [currentWeekLabel].concat(row);
    return newRow;
  });

  // Salin ke sheet arsip historis
  archiveSheet.getRange(archiveSheet.getLastRow() + 1, 1, archiveRows.length, archiveRows[0].length).setValues(archiveRows);

  // Bersihkan sheet aktif (sisakan header)
  activeSheet.deleteRows(2, lastRow - 1);
  updateDashboardSheet(ss);

  return "Berhasil memindahkan " + activeData.length + " data survei ke Sheet Arsip (" + currentWeekLabel + "). Sheet aktif kembali segar!";
}

/**
 * Buat trigger otomatis setiap hari Senin jam 01:00 WITA
 */
function setupWeeklyTrigger() {
  // Hapus trigger lama jika ada
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "rotasiMingguanOtomatis") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // Buat trigger mingguan baru
  ScriptApp.newTrigger("rotasiMingguanOtomatis")
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(1)
    .inTimezone("Asia/Makassar")
    .create();
    
  SpreadsheetApp.getUi().alert("✓ Auto-Trigger Berhasil Diaktifkan! Setiap hari Senin pukul 01:00 WITA data survei akan otomatis diarsipkan ke '" + SHEET_NAME_ARCHIVE + "' sehingga sheet selalu ringan dan cepat.");
}

function refreshDashboardManually() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  updateDashboardSheet(ss);
  SpreadsheetApp.getUi().alert("✓ Dashboard IKM berhasil diperbarui!");
}

/**
 * Melayani Permintaan GET:
 * 1. Validasi PIN Pasien dari Seluruh HP / Perangkat (?action=validate_pin&pin=123456)
 * 2. Mengambil Semua PIN Aktif (?action=get_pins)
 * 3. Healthcheck / Ping Koneksi (?action=ping)
 * 4. Tampilan Web App Dashboard Admin Eksekutif
 */
function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};
  const action = params.action || "";

  // 1. Validasi PIN Pasien dari HP/Perangkat Mana Pun
  if (action === "validate_pin" || (params.pin && !action)) {
    const rawPin = String(params.pin || "").trim().replace(/\D/g, "");
    return ContentService.createTextOutput(JSON.stringify(validatePatientPinInSheet(rawPin)))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 1b. Tandai PIN sebagai Terpakai via GET (?action=consume_pin&pin=123456)
  if (action === "consume_pin" || action === "mark_pin_used") {
    const rawPin = String(params.pin || "").trim().replace(/\D/g, "");
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const result = markPinUsedInSheet(ss, rawPin, {
      submissionId: params.submissionId || "",
      namaPasien: params.namaPasien || "",
      jenisLayanan: params.jenisLayanan || "",
      ikmScore: params.ikmScore ? Number(params.ikmScore) : 0
    });
    return ContentService.createTextOutput(JSON.stringify(result || { success: true, message: "PIN " + rawPin + " berhasil ditandai sebagai TERPAKAI" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 2. Mengambil Semua Daftar PIN dari Tab PIN_PASIEN
  if (action === "get_pins") {
    return ContentService.createTextOutput(JSON.stringify(getAllPinsFromSheet()))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 2b. Buat / Tambah PIN Pasien Baru Langsung dari Web Dashboard (Tanpa Perlu Buka Sheet / onOpen)
  if (action === "create_pin" || action === "add_pin" || action === "generate_pin") {
    const res = generatePinFromDashboard({
      count: Number(params.count) || 1,
      customPin: params.pin || params.customPin || "",
      registeredPatientName: params.name || params.namaPasien || params.registeredPatientName || "",
      registeredService: params.service || params.layanan || params.registeredService || "Rawat Inap",
      registeredRoom: params.room || params.kamar || params.registeredRoom || "",
      notes: params.notes || "Diterbitkan dari Dashboard Web SISEKAR"
    });
    return ContentService.createTextOutput(JSON.stringify(res))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 3. Ping Uji Koneksi
  if (action === "ping" || params.ping === "true") {
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      mode: "online",
      message: "Google Apps Script RSUD Aeramo Online & Terhubung!",
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // 4. API Data JSON Dashboard
  if (params.api === "true") {
    return ContentService.createTextOutput(JSON.stringify(getDashboardData()))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 5. Tampilan Halaman Dashboard Admin Eksekutif (Web App)
  try {
    return HtmlService.createHtmlOutputFromFile("index")
      .setTitle("Dashboard Admin & Penerbitan PIN - RSUD Aeramo")
      .addMetaTag("viewport", "width=device-width, initial-scale=1.0")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    // Fallback cerdas jika file index.html belum dibuat / dihapus di Apps Script
    const fallbackHtml = '<!DOCTYPE html>' +
      '<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
      '<title>Dashboard Admin - RSUD Aeramo</title>' +
      '<style>body{font-family:system-ui,-apple-system,sans-serif;background:#0f172a;color:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px;}' +
      '.card{background:#1e293b;border:1px solid #334155;border-radius:24px;padding:32px;max-width:540px;text-align:center;box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);}' +
      '.badge{background:#065f46;color:#34d399;font-weight:bold;font-size:12px;padding:6px 14px;border-radius:9999px;display:inline-block;margin-bottom:16px;}' +
      'h1{font-size:20px;margin:0 0 8px 0;color:#38bdf8;}p{font-size:13px;color:#94a3b8;line-height:1.6;margin:0 0 20px 0;}' +
      '.box{background:#0f172a;border:1px solid #334155;border-radius:16px;padding:16px;font-size:12px;text-align:left;color:#cbd5e1;line-height:1.7;}' +
      '</style></head><body><div class="card">' +
      '<div class="badge">&#10003; SISTEM SINKRONISASI ONLINE</div>' +
      '<h1>Backend Google Apps Script RSUD Aeramo</h1>' +
      '<p>Sistem API &amp; Sinkronisasi PIN Pasien aktif. Untuk mengaktifkan tampilan Dashboard Visual Eksekutif penuh di sini:</p>' +
      '<div class="box"><b>Langkah Pasang File index.html (Opsional untuk Dashboard):</b><br>1. Di editor Apps Script, klik tanda <b>+</b> di samping Files &gt; pilih <b>HTML</b>.<br>2. Beri nama: <b>index</b> (otomatis menjadi <code>index.html</code>).<br>3. Buka portal survei &gt; tab Panduan Script &gt; salin kode <b>index.html</b> &gt; paste ke file index.<br>4. Deploy ulang sebagai Versi Baru.</div>' +
      '</div></body></html>';

    return HtmlService.createHtmlOutput(fallbackHtml)
      .setTitle("Dashboard Admin - RSUD Aeramo")
      .addMetaTag("viewport", "width=device-width, initial-scale=1.0")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

/**
 * ============================================================================
 * FUNGSI SERVER-SIDE UNTUK DASHBOARD ADMIN & PENERBITAN PIN (index.html)
 * Dipanggil langsung oleh index.html melalui google.script.run
 * ============================================================================
 */

function generatePinFromDashboard(params) {
  try {
    if (typeof params === "string") {
      try { params = JSON.parse(params); } catch(e) {}
    }
    params = params || {};
    const count = Math.min(Math.max(1, Number(params.count) || 1), 50);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = findPinSheet(ss) || ensurePinSheetExists(ss);
    
    const colMap = detectPinSheetColumns(sheet);
    const maxCols = Math.max(sheet.getLastColumn(), 12);
    if (sheet.getMaxColumns() < maxCols) {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), maxCols - sheet.getMaxColumns());
    }

    const existingValues = sheet.getLastRow() > 1 
      ? sheet.getRange(2, 1, sheet.getLastRow() - 1, maxCols).getValues()
      : [];
    const existingSet = {};
    for (let i = 0; i < existingValues.length; i++) {
      const p = String(existingValues[i][colMap.colPin - 1] || "").replace(/\D/g, "");
      if (p) existingSet[p] = true;
    }

    const rows = [];
    const generatedPins = [];
    const nowStr = Utilities.formatDate(new Date(), "Asia/Makassar", "yyyy-MM-dd HH:mm:ss 'WITA'");

    function buildRow(pinCode, pName, svc, room, notes) {
      const rowArr = new Array(Math.max(sheet.getLastColumn(), 12)).fill("");
      rowArr[colMap.colPin - 1] = "'" + pinCode;
      rowArr[colMap.colStatus - 1] = "AKTIF";
      if (colMap.colPatient - 1 >= 0) rowArr[colMap.colPatient - 1] = pName || "";
      if (colMap.colService - 1 >= 0) rowArr[colMap.colService - 1] = svc || "Rawat Inap";
      if (colMap.colRoom - 1 >= 0) rowArr[colMap.colRoom - 1] = room || "";
      if (colMap.colCreatedAt - 1 >= 0) rowArr[colMap.colCreatedAt - 1] = nowStr;
      if (colMap.colNotes - 1 >= 0) rowArr[colMap.colNotes - 1] = notes || "Diterbitkan dari Dashboard";
      if (colMap.colPin === 2 && rowArr[0] === "") rowArr[0] = sheet.getLastRow() + rows.length;
      return rowArr;
    }

    if (params.customPin && String(params.customPin).trim().length >= 4) {
      const cleanCustom = String(params.customPin).trim().replace(/\D/g, "");
      rows.push(buildRow(
        cleanCustom,
        params.registeredPatientName,
        params.registeredService,
        params.registeredRoom,
        params.notes || "Diterbitkan dari Dashboard Apps Script"
      ));
      generatedPins.push({
        pin: cleanCustom,
        status: "active",
        registeredPatientName: params.registeredPatientName || "",
        registeredService: params.registeredService || "Rawat Inap",
        registeredRoom: params.registeredRoom || "",
        createdAt: nowStr
      });
    } else {
      for (let i = 0; i < count; i++) {
        let pinCode = String(Math.floor(100000 + Math.random() * 900000));
        let attempts = 0;
        while (existingSet[pinCode] && attempts < 100) {
          pinCode = String(Math.floor(100000 + Math.random() * 900000));
          attempts++;
        }
        existingSet[pinCode] = true;
        const pName = count === 1 ? (params.registeredPatientName || "") : "";
        const pRoom = count === 1 ? (params.registeredRoom || "") : "";
        rows.push(buildRow(
          pinCode,
          pName,
          params.registeredService,
          pRoom,
          params.notes || (count === 1 ? "Diterbitkan dari Dashboard Apps Script" : "Batch " + count + " PIN dari Dashboard Apps Script")
        ));
        generatedPins.push({
          pin: pinCode,
          status: "active",
          registeredPatientName: pName,
          registeredService: params.registeredService || "Rawat Inap",
          registeredRoom: pRoom,
          createdAt: nowStr
        });
      }
    }

    for (let r = 0; r < rows.length; r++) {
      sheet.appendRow(rows[r]);
    }

    SpreadsheetApp.flush();

    return {
      success: true,
      message: "Berhasil menerbitkan " + rows.length + " PIN baru di tab PIN_PASIEN!",
      pins: generatedPins
    };
  } catch (err) {
    Logger.log("Error generatePinFromDashboard: " + err);
    return { success: false, message: "Gagal membuat PIN: " + (err.message || String(err)) };
  }
}

function revokePinFromSheet(pin) {
  try {
    const cleanPin = String(pin).replace(/\D/g, "");
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = findPinSheet(ss) || ensurePinSheetExists(ss);
    if (!sheet || sheet.getLastRow() <= 1) return { success: false, message: "Sheet kosong" };

    const colMap = detectPinSheetColumns(sheet);
    const maxCols = Math.max(sheet.getLastColumn(), 12);
    const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, maxCols).getValues();

    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      let matched = false;
      const pInCell = String(row[colMap.colPin - 1] || "").replace(/\D/g, "");
      if (pInCell === cleanPin) {
        matched = true;
      } else {
        for (let c = 0; c < row.length; c++) {
          if (String(row[c] || "").trim().replace(/\D/g, "") === cleanPin) {
            matched = true;
            break;
          }
        }
      }

      if (matched) {
        sheet.getRange(i + 2, colMap.colStatus).setValue("NONAKTIF");
        SpreadsheetApp.flush();
        return { success: true, message: "PIN " + cleanPin + " berhasil dinonaktifkan." };
      }
    }
    return { success: false, message: "PIN tidak ditemukan" };
  } catch (err) {
    return { success: false, message: "Gagal nonaktifkan PIN: " + err.message };
  }
}

function deletePinFromSheet(pin) {
  try {
    const cleanPin = String(pin).replace(/\D/g, "");
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = findPinSheet(ss) || ensurePinSheetExists(ss);
    if (!sheet || sheet.getLastRow() <= 1) return { success: false, message: "Sheet kosong" };

    const colMap = detectPinSheetColumns(sheet);
    const maxCols = Math.max(sheet.getLastColumn(), 12);
    const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, maxCols).getValues();

    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      let matched = false;
      const pInCell = String(row[colMap.colPin - 1] || "").replace(/\D/g, "");
      if (pInCell === cleanPin) {
        matched = true;
      } else {
        for (let c = 0; c < row.length; c++) {
          if (String(row[c] || "").trim().replace(/\D/g, "") === cleanPin) {
            matched = true;
            break;
          }
        }
      }

      if (matched) {
        sheet.deleteRow(i + 2);
        SpreadsheetApp.flush();
        return { success: true, message: "PIN " + cleanPin + " berhasil dihapus dari sheet." };
      }
    }
    return { success: false, message: "PIN tidak ditemukan" };
  } catch (err) {
    return { success: false, message: "Gagal menghapus PIN: " + err.message };
  }
}

/**
 * Logika Validasi PIN di Tab Sheet PIN_PASIEN (Dinamis & Omni-Kolom)
 * Mampu membaca nomor PIN di kolom mana pun (Kolom A, B, C, D, dsb.)
 */
function validatePatientPinInSheet(rawPin) {
  if (!rawPin || String(rawPin).trim().length < 4) {
    return {
      valid: false,
      status: "invalid_format",
      message: "Format PIN tidak valid. Masukkan 6 digit angka."
    };
  }

  const cleanPin = String(rawPin).trim().replace(/\D/g, "");
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = findPinSheet(ss);
  
  if (!sheet || sheet.getLastRow() <= 1) {
    return {
      valid: false,
      status: "not_found",
      message: "Belum ada PIN yang terdaftar di Google Sheet RSUD Aeramo. Silakan buat PIN terlebih dahulu."
    };
  }

  const colMap = detectPinSheetColumns(sheet);
  const maxCols = Math.max(sheet.getLastColumn(), 12);
  const totalRows = sheet.getLastRow() - 1;
  const values = sheet.getRange(2, 1, totalRows, maxCols).getValues();

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    let isMatched = false;
    let pinColumnIdx = colMap.colPin - 1;

    // 1. Cek pada kolom PIN utama hasil deteksi header
    const primaryPinVal = String(row[pinColumnIdx] || "").replace(/\D/g, "");
    if (primaryPinVal === cleanPin || (cleanPin.length === 6 && primaryPinVal.padStart(6, '0') === cleanPin)) {
      isMatched = true;
    } else {
      // 2. PENGECEKAN OMNI-KOLOM (JIKA PIN BERADA DI KOLOM B, C, D, DSB)
      for (let c = 0; c < row.length; c++) {
        const cellVal = String(row[c] || "").trim().replace(/\D/g, "");
        if (cellVal === cleanPin || (cleanPin.length === 6 && cellVal.length >= 4 && cellVal.padStart(6, '0') === cleanPin)) {
          isMatched = true;
          pinColumnIdx = c;
          break;
        }
      }
    }

    if (isMatched) {
      // Deteksi Status
      let status = String(row[colMap.colStatus - 1] || "").toUpperCase().trim();
      // Jika di kolom status tidak valid, cari kata AKTIF/TERPAKAI di seluruh kolom baris ini
      if (!status || (status.indexOf("AKTIF") === -1 && status.indexOf("TERPAKAI") === -1 && status.indexOf("USED") === -1 && status.indexOf("NONAKTIF") === -1)) {
        for (let c = 0; c < row.length; c++) {
          const v = String(row[c] || "").toUpperCase().trim();
          if (v.indexOf("AKTIF") > -1 || v.indexOf("ACTIVE") > -1) {
            status = "AKTIF";
            break;
          } else if (v.indexOf("TERPAKAI") > -1 || v.indexOf("USED") > -1) {
            status = "TERPAKAI";
            break;
          } else if (v.indexOf("NONAKTIF") > -1 || v.indexOf("REVOKED") > -1) {
            status = "NONAKTIF";
            break;
          }
        }
      }
      if (!status) status = "AKTIF"; // Default aktif

      const regPatientName = String(row[colMap.colPatient - 1] || "").trim();
      const regService = String(row[colMap.colService - 1] || "").trim() || "Rawat Inap";
      const regRoom = String(row[colMap.colRoom - 1] || "").trim();
      const createdAt = String(row[colMap.colCreatedAt - 1] || "");
      const usedAt = String(row[colMap.colUsedAt - 1] || "");
      const usedBy = String(row[colMap.colUsedBy - 1] || "");

      if (status === "TERPAKAI" || status === "USED" || status.indexOf("TERPAKAI") > -1 || status.indexOf("USED") > -1) {
        return {
          valid: false,
          status: "used",
          pin: cleanPin,
          registeredPatientName: regPatientName,
          registeredService: regService,
          registeredRoom: regRoom,
          label: regPatientName ? "Pasien: " + regPatientName : regService,
          usedAt: usedAt,
          usedBy: usedBy,
          message: "PIN ini sudah pernah digunakan pada " + (usedAt || "sebelumnya") + (usedBy ? " oleh " + usedBy : "") + ". Sistem membatasi 1x pengisian per PIN demi keaslian data."
        };
      }

      if (status === "NONAKTIF" || status === "REVOKED") {
        return {
          valid: false,
          status: "revoked",
          pin: cleanPin,
          message: "PIN ini telah dinonaktifkan oleh petugas RSUD Aeramo."
        };
      }

      // Status AKTIF
      return {
        valid: true,
        status: "active",
        pin: cleanPin,
        registeredPatientName: regPatientName,
        registeredService: regService,
        registeredRoom: regRoom,
        label: regPatientName ? "Pasien: " + regPatientName : (regRoom ? regService + " (" + regRoom + ")" : regService),
        createdAt: createdAt,
        token: {
          id: "pin_sheet_" + (i + 2),
          pin: cleanPin,
          status: "active",
          registeredPatientName: regPatientName,
          registeredService: regService,
          registeredRoom: regRoom,
          createdAt: createdAt,
          label: regPatientName ? "Pasien: " + regPatientName : regService
        },
        message: "PIN valid untuk pasien " + (regPatientName || "RSUD Aeramo") + "!"
      };
    }
  }

  return {
    valid: false,
    status: "not_found",
    message: "PIN " + cleanPin + " tidak ditemukan di Google Sheet RSUD Aeramo. Pastikan nomor PIN benar sesuai yang diberikan petugas."
  };
}

/**
 * Mengambil Seluruh PIN dari Tab PIN_PASIEN dalam Format JSON (Adaptif Semua Kolom)
 */
function getAllPinsFromSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = findPinSheet(ss);
  if (!sheet || sheet.getLastRow() <= 1) {
    return { success: true, pins: [] };
  }

  const colMap = detectPinSheetColumns(sheet);
  const maxCols = Math.max(sheet.getLastColumn(), 12);
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, maxCols).getValues();
  const pins = [];

  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    
    // Cari PIN di kolom PIN terdeteksi atau di sembarang kolom jika kosong
    let cleanPin = String(row[colMap.colPin - 1] || "").replace(/\D/g, "");
    if (!cleanPin || cleanPin.length < 4) {
      for (let c = 0; c < row.length; c++) {
        const testPin = String(row[c] || "").replace(/\D/g, "");
        if (testPin.length === 6) {
          cleanPin = testPin;
          break;
        }
      }
    }

    if (cleanPin) {
      let rawStatus = String(row[colMap.colStatus - 1] || "").toUpperCase().trim();
      if (!rawStatus || (rawStatus.indexOf("AKTIF") === -1 && rawStatus.indexOf("TERPAKAI") === -1 && rawStatus.indexOf("USED") === -1 && rawStatus.indexOf("NONAKTIF") === -1)) {
        for (let c = 0; c < row.length; c++) {
          const v = String(row[c] || "").toUpperCase().trim();
          if (v.indexOf("AKTIF") > -1 || v.indexOf("ACTIVE") > -1) {
            rawStatus = "AKTIF";
            break;
          } else if (v.indexOf("TERPAKAI") > -1 || v.indexOf("USED") > -1) {
            rawStatus = "TERPAKAI";
            break;
          } else if (v.indexOf("NONAKTIF") > -1) {
            rawStatus = "NONAKTIF";
            break;
          }
        }
      }
      const isUsed = rawStatus === "TERPAKAI" || rawStatus === "USED" || rawStatus.indexOf("TERPAKAI") > -1 || rawStatus.indexOf("USED") > -1;
      const isRevoked = rawStatus === "NONAKTIF" || rawStatus === "REVOKED";

      const regName = String(row[colMap.colPatient - 1] || "").trim();
      const regSvc = String(row[colMap.colService - 1] || "").trim();
      const regRoom = String(row[colMap.colRoom - 1] || "").trim();

      pins.push({
        id: "pin_sheet_" + (i + 2),
        pin: cleanPin,
        status: isUsed ? "used" : (isRevoked ? "revoked" : "active"),
        registeredPatientName: regName,
        registeredService: regSvc,
        registeredRoom: regRoom,
        label: regName ? "Pasien: " + regName : (regRoom ? regSvc + " (" + regRoom + ")" : (regSvc || "Google Sheet")),
        createdAt: String(row[colMap.colCreatedAt - 1] || ""),
        usedAt: String(row[colMap.colUsedAt - 1] || ""),
        usedBy: row[colMap.colUsedBy - 1] ? {
          namaPasien: String(row[colMap.colUsedBy - 1] || ""),
          jenisLayanan: String(row[colMap.colLayananSurvei - 1] || ""),
          ikmScore: Number(row[colMap.colIkm - 1]) || undefined,
          submissionId: String(row[colMap.colSubmissionId - 1] || "")
        } : undefined,
        notes: String(row[colMap.colNotes - 1] || "")
      });
    }
  }

  return { success: true, pins: pins };
}

/**
 * Menerima kiriman data (Survei Baru, Pembuatan PIN, atau Validasi PIN)
 */
function doPost(e) {
  try {
    const lock = LockService.getScriptLock();
    lock.waitLock(30000); // Mencegah tabrakan penginputan serentak

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    let data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    } else {
      throw new Error("Tidak ada payload data yang diterima.");
    }

    const action = data.action || "";

    // A. Validasi PIN via POST
    if (action === "validate_pin") {
      lock.releaseLock();
      const cleanPin = String(data.pin || "").replace(/\D/g, "");
      return ContentService.createTextOutput(JSON.stringify(validatePatientPinInSheet(cleanPin)))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // A2. Tandai PIN sebagai Terpakai via POST (One-Time Consume Action)
    if (action === "consume_pin" || action === "mark_pin_used") {
      lock.releaseLock();
      const cleanPin = String(data.pin || "").replace(/\D/g, "");
      const result = markPinUsedInSheet(ss, cleanPin, {
        submissionId: data.submissionId || "",
        namaPasien: data.namaPasien || "",
        jenisLayanan: data.jenisLayanan || "",
        ikmScore: data.ikmScore ? Number(data.ikmScore) : 0
      });
      return ContentService.createTextOutput(JSON.stringify(result || {
        success: true,
        message: "PIN " + cleanPin + " berhasil ditandai sebagai TERPAKAI di Google Sheet."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // B1. Terbitkan PIN dari Dashboard Web via POST
    if (action === "create_pin" || action === "generate_pin" || action === "generatePinFromDashboard") {
      lock.releaseLock();
      const res = generatePinFromDashboard(data);
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // B. Tambahkan PIN Baru ke Sheet dari Admin Portal
    if (action === "create_pins" && Array.isArray(data.pins)) {
      const pinSheet = findPinSheet(ss) || ensurePinSheetExists(ss);
      const colMap = detectPinSheetColumns(pinSheet);
      const nowStr = Utilities.formatDate(new Date(), "Asia/Makassar", "yyyy-MM-dd HH:mm:ss 'WITA'");
      let addedCount = 0;
      
      data.pins.forEach(function(p) {
        const pinCode = String(p.pin || p).replace(/\D/g, "");
        if (pinCode) {
          const rowArr = new Array(Math.max(pinSheet.getLastColumn(), 12)).fill("");
          rowArr[colMap.colPin - 1] = "'" + pinCode;
          rowArr[colMap.colStatus - 1] = "AKTIF";
          if (colMap.colPatient - 1 >= 0) rowArr[colMap.colPatient - 1] = p.registeredPatientName || "";
          if (colMap.colService - 1 >= 0) rowArr[colMap.colService - 1] = p.registeredService || "Rawat Inap";
          if (colMap.colRoom - 1 >= 0) rowArr[colMap.colRoom - 1] = p.registeredRoom || "";
          if (colMap.colCreatedAt - 1 >= 0) rowArr[colMap.colCreatedAt - 1] = p.createdAt || nowStr;
          if (colMap.colNotes - 1 >= 0) rowArr[colMap.colNotes - 1] = p.notes || "Dibuat dari Admin Portal";
          if (colMap.colPin === 2 && rowArr[0] === "") rowArr[0] = pinSheet.getLastRow() + 1;
          pinSheet.appendRow(rowArr);
          addedCount++;
        }
      });

      SpreadsheetApp.flush();
      lock.releaseLock();
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Berhasil menambahkan " + addedCount + " PIN ke Google Sheet!",
        count: addedCount
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // C. Tangani ping uji koneksi
    if (data.test === true || data.namaPasien === "UJI_KONEKSI_SISTEM" || data.namaPasien === "DIAGNOSTIC_PING") {
      lock.releaseLock();
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        mode: "online",
        message: "Koneksi Google Apps Script RSUD Aeramo aktif & siap menerima data survei."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // D. Simpan Hasil Survei Pasien
    let sheet = ss.getSheetByName(SHEET_NAME_RESPONSES);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME_RESPONSES);
      setupHeaders(sheet, false);
    } else {
      checkAndUpgradeHeaders(sheet);
    }

    const answers = data.answers || {};
    const answeredDetails = data.answeredDetails || [];

    // Ekstraksi nilai Q1 s/d Q7 secara cerdas
    let q1 = 0, q2 = 0, q3 = 0, q4 = 0, q5 = 0, q6 = 0, q7 = 0;

    if (Array.isArray(answeredDetails) && answeredDetails.length > 0) {
      q1 = Number(answeredDetails[0] && answeredDetails[0].score) || 0;
      q2 = Number(answeredDetails[1] && answeredDetails[1].score) || 0;
      q3 = Number(answeredDetails[2] && answeredDetails[2].score) || 0;
      q4 = Number(answeredDetails[3] && answeredDetails[3].score) || 0;
      q5 = Number(answeredDetails[4] && answeredDetails[4].score) || 0;
      q6 = Number(answeredDetails[5] && answeredDetails[5].score) || 0;
      q7 = Number(answeredDetails[6] && answeredDetails[6].score) || 0;
    } else {
      q1 = Number(answers.ri_q1_kenyamanan_kamar || answers.q1_kenyamanan_kamar || answers.q1 || answers["1"] || 0);
      q2 = Number(answers.ri_q2_kebersihan_kamar || answers.q2_kebersihan_kamar || answers.q2 || answers["2"] || 0);
      q3 = Number(answers.ri_q3_kualitas_fasilitas || answers.q3_kualitas_fasilitas || answers.q3 || answers["3"] || 0);
      q4 = Number(answers.ri_q4_ketenangan_keamanan || answers.q4_ketenangan_keamanan || answers.q4 || answers["4"] || 0);
      q5 = Number(answers.ri_q5_kunjungan_nakes || answers.q5_kunjungan_nakes || answers.q5 || answers["5"] || 0);
      q6 = Number(answers.ri_q6_kejelasan_informasi || answers.q6_kejelasan_informasi || answers.q6 || answers["6"] || 0);
      q7 = Number(answers.ri_q7_ketersediaan_responsive || answers.q7_ketersediaan_responsive || answers.q7 || answers["7"] || 0);

      var answerKeys = Object.keys(answers);
      if (!q1 && answerKeys.length > 0) q1 = Number(answers[answerKeys[0]]) || 0;
      if (!q2 && answerKeys.length > 1) q2 = Number(answers[answerKeys[1]]) || 0;
      if (!q3 && answerKeys.length > 2) q3 = Number(answers[answerKeys[2]]) || 0;
      if (!q4 && answerKeys.length > 3) q4 = Number(answers[answerKeys[3]]) || 0;
      if (!q5 && answerKeys.length > 4) q5 = Number(answers[answerKeys[4]]) || 0;
      if (!q6 && answerKeys.length > 5) q6 = Number(answers[answerKeys[5]]) || 0;
      if (!q7 && answerKeys.length > 6) q7 = Number(answers[answerKeys[6]]) || 0;
    }

    var answerValues = [];
    if (Array.isArray(answeredDetails) && answeredDetails.length > 0) {
      answerValues = answeredDetails.map(function(d) { return Number(d.score); }).filter(function(v) { return !isNaN(v) && v > 0; });
    } else {
      answerValues = Object.values(answers).map(Number).filter(function(v) { return !isNaN(v) && v > 0; });
    }
    const totalScore = answerValues.reduce(function(a, b) { return a + b; }, 0);
    const avgScore = answerValues.length > 0 ? totalScore / answerValues.length : (Number(data.averageScore) || 0);
    const ikm100 = data.ikmScore ? Number(data.ikmScore) : ((avgScore / 4) * 100);

    let mutuLayanan = data.mutuLayanan;
    if (!mutuLayanan) {
      mutuLayanan = "Sangat Baik (A)";
      if (ikm100 < 65) mutuLayanan = "Kurang Baik (D)";
      else if (ikm100 < 76.6) mutuLayanan = "Cukup (C)";
      else if (ikm100 < 88.3) mutuLayanan = "Baik (B)";
    }

    let rincianAspekText = "-";
    if (Array.isArray(answeredDetails) && answeredDetails.length > 0) {
      rincianAspekText = answeredDetails.map(function(d, i) {
        return (i + 1) + ". " + d.aspek + ": " + d.score + " (" + d.label + ")";
      }).join(" | ");
    } else {
      var entries = Object.entries(answers);
      if (entries.length > 0) {
        rincianAspekText = entries.map(function(pair, i) {
          return (i + 1) + ". " + pair[0] + ": " + pair[1];
        }).join(" | ");
      }
    }

    const patientPinUsed = String(data.patientPin || data.pin || "").replace(/\D/g, "");
    const submissionId = data.id || Utilities.getUuid();
    const namaPasien = data.namaPasien || "(Anonim / Tidak Diisi)";
    const jenisLayanan = data.jenisLayanan || "Rawat Inap";

    const row = [
      new Date(), // 0: Timestamp Google
      submissionId, // 1: ID Survei (Unik)
      data.tanggalSurvei || Utilities.formatDate(new Date(), "Asia/Makassar", "yyyy-MM-dd"), // 2: Tgl
      data.jamSurvei || "08.00 – 14.00 WITA", // 3: Jam
      namaPasien, // 4: Nama
      data.jenisKelamin || "-", // 5: JK
      data.pendidikan || "-", // 6: Pendidikan
      data.usia ? Number(data.usia) : "-", // 7: Usia
      data.pekerjaan === "LAINNYA" && data.pekerjaanLainnya ? "LAINNYA: " + data.pekerjaanLainnya : (data.pekerjaan || "-"), // 8: Pekerjaan
      jenisLayanan, // 9: Layanan
      q1 || "-", // 10: Q1 Kamar
      q2 || "-", // 11: Q2 Bersih
      q3 || "-", // 12: Q3 Fasilitas
      q4 || "-", // 13: Q4 Tenang
      q5 || "-", // 14: Q5 Kunjungan Dokter
      q6 || "-", // 15: Q6 Info Dokter
      q7 || "-", // 16: Q7 Perawat
      Number(avgScore.toFixed(2)), // 17: AvgScore
      Number(ikm100.toFixed(2)), // 18: IKM 100
      mutuLayanan, // 19: Mutu
      data.saran || "-", // 20: Saran
      rincianAspekText, // 21: Rincian Lengkap
      data.devicePlatform || (patientPinUsed ? "Web/HP (PIN: " + patientPinUsed + ")" : "Android / Web") // 22: Perangkat
    ];

    sheet.appendRow(row);

    // OTOMATIS TANDAI PIN SEBAGAI TERPAKAI DI TAB PIN_PASIEN GOOGLE SHEET!
    if (patientPinUsed) {
      markPinUsedInSheet(ss, patientPinUsed, {
        submissionId: submissionId,
        namaPasien: namaPasien,
        jenisLayanan: jenisLayanan,
        ikmScore: Number(ikm100.toFixed(2))
      });
    }

    updateDashboardSheet(ss);

    lock.releaseLock();

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Terima kasih! Survei kepuasan Anda berhasil dicatat ke Google Sheet RSUD Aeramo.",
      surveyId: submissionId,
      patientPin: patientPinUsed,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Tandai Baris PIN di Tab PIN_PASIEN sebagai TERPAKAI (Adaptif Semua Kolom)
 */
function markPinUsedInSheet(ss, cleanPin, info) {
  try {
    const pinSheet = findPinSheet(ss);
    if (!cleanPin) return { success: false, message: "PIN kosong" };

    const targetPin = String(cleanPin).replace(/\D/g, "");
    const nowStr = Utilities.formatDate(new Date(), "Asia/Makassar", "yyyy-MM-dd HH:mm:ss 'WITA'");
    let found = false;

    if (pinSheet && pinSheet.getLastRow() > 1) {
      const colMap = detectPinSheetColumns(pinSheet);
      const maxCols = Math.max(pinSheet.getLastColumn(), 12);
      const values = pinSheet.getRange(2, 1, pinSheet.getLastRow() - 1, maxCols).getValues();

      for (let i = 0; i < values.length; i++) {
        const row = values[i];
        let matched = false;

        // Cek pada kolom PIN yang terdeteksi
        const pVal = String(row[colMap.colPin - 1] || "").replace(/\D/g, "");
        if (pVal === targetPin || (targetPin.length === 6 && pVal.padStart(6, '0') === targetPin)) {
          matched = true;
        } else {
          // Cek omni-kolom (jika PIN ada di kolom lain)
          for (let c = 0; c < row.length; c++) {
            const cv = String(row[c] || "").trim().replace(/\D/g, "");
            if (cv === targetPin || (targetPin.length === 6 && cv.padStart(6, '0') === targetPin)) {
              matched = true;
              break;
            }
          }
        }

        if (matched) {
          const rowIdx = i + 2;
          pinSheet.getRange(rowIdx, colMap.colStatus).setValue("TERPAKAI");
          if (colMap.colUsedAt > 0) pinSheet.getRange(rowIdx, colMap.colUsedAt).setValue(nowStr);
          if (colMap.colUsedBy > 0) pinSheet.getRange(rowIdx, colMap.colUsedBy).setValue((info && info.namaPasien) || "-");
          if (colMap.colLayananSurvei > 0) pinSheet.getRange(rowIdx, colMap.colLayananSurvei).setValue((info && info.jenisLayanan) || "-");
          if (colMap.colIkm > 0) pinSheet.getRange(rowIdx, colMap.colIkm).setValue((info && info.ikmScore) || "");
          if (colMap.colSubmissionId > 0) pinSheet.getRange(rowIdx, colMap.colSubmissionId).setValue((info && info.submissionId) || "");
          SpreadsheetApp.flush();
          found = true;
          break;
        }
      }
    }

    if (!found && pinSheet) {
      const colMap = detectPinSheetColumns(pinSheet);
      const rowArr = new Array(Math.max(pinSheet.getLastColumn(), 12)).fill("");
      rowArr[colMap.colPin - 1] = "'" + targetPin;
      rowArr[colMap.colStatus - 1] = "TERPAKAI";
      if (colMap.colPatient - 1 >= 0) rowArr[colMap.colPatient - 1] = (info && info.namaPasien) || "Pasien Terdaftar";
      if (colMap.colService - 1 >= 0) rowArr[colMap.colService - 1] = (info && info.jenisLayanan) || "Rawat Inap";
      if (colMap.colCreatedAt - 1 >= 0) rowArr[colMap.colCreatedAt - 1] = nowStr;
      if (colMap.colUsedAt - 1 >= 0) rowArr[colMap.colUsedAt - 1] = nowStr;
      if (colMap.colUsedBy - 1 >= 0) rowArr[colMap.colUsedBy - 1] = (info && info.namaPasien) || "-";
      if (colMap.colLayananSurvei - 1 >= 0) rowArr[colMap.colLayananSurvei - 1] = (info && info.jenisLayanan) || "-";
      if (colMap.colIkm - 1 >= 0) rowArr[colMap.colIkm - 1] = (info && info.ikmScore) || "";
      if (colMap.colSubmissionId - 1 >= 0) rowArr[colMap.colSubmissionId - 1] = (info && info.submissionId) || "";
      if (colMap.colNotes - 1 >= 0) rowArr[colMap.colNotes - 1] = "Otomatis dicatat saat pengisian survei";
      if (colMap.colPin === 2 && rowArr[0] === "") rowArr[0] = pinSheet.getLastRow();
      pinSheet.appendRow(rowArr);
    }

    return { success: true, pin: targetPin, status: "TERPAKAI", message: "PIN " + targetPin + " berhasil ditandai sebagai TERPAKAI di Google Sheet." };
  } catch (err) {
    Logger.log("Error marking PIN used in sheet: " + err);
    return { success: false, error: String(err) };
  }
}

/**
 * Mengambil data untuk Dashboard Admin (Menggabungkan data aktif & arsip)
 */
function getDashboardData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_RESPONSES);

  const emptyResponse = {
    totalResponden: 0,
    avgIkm: 0,
    avgScore: 0,
    mutuPelayanan: "Belum Ada Data",
    kepuasanRate: 0,
    unsurScores: { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, q7: 0 },
    mutuDist: { a: 0, b: 0, c: 0, d: 0 },
    layananDist: {},
    genderDist: { L: 0, P: 0 },
    recentResponses: [],
    spreadsheetUrl: ss.getUrl(),
    lastUpdated: Utilities.formatDate(new Date(), "Asia/Makassar", "dd MMMM yyyy, HH:mm 'WITA'")
  };

  if (!sheet || sheet.getLastRow() <= 1) {
    return emptyResponse;
  }

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  const numCols = Math.max(lastCol, 23);
  const values = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();

  let sumQ1 = 0, countQ1 = 0;
  let sumQ2 = 0, countQ2 = 0;
  let sumQ3 = 0, countQ3 = 0;
  let sumQ4 = 0, countQ4 = 0;
  let sumQ5 = 0, countQ5 = 0;
  let sumQ6 = 0, countQ6 = 0;
  let sumQ7 = 0, countQ7 = 0;
  let sumScore = 0, countScore = 0;
  let sumIkm = 0;
  let puasCount = 0;

  const mutuDist = { a: 0, b: 0, c: 0, d: 0 };
  const layananDist = {};
  const genderDist = { L: 0, P: 0, other: 0 };
  const recentResponses = [];

  for (let i = 0; i < values.length; i++) {
    const r = values[i];
    const tgl = r[2] instanceof Date ? Utilities.formatDate(r[2], "Asia/Makassar", "yyyy-MM-dd") : String(r[2] || '');
    const nama = String(r[4] || "(Anonim)");
    const jk = String(r[5] || "").toUpperCase();
    const usia = (r[7] !== "-" && r[7] !== "" && !isNaN(Number(r[7]))) ? Number(r[7]) : null;
    const layanan = String(r[9] || "Rawat Inap");

    const vQ1 = Number(r[10]) || 0;
    const vQ2 = Number(r[11]) || 0;
    const vQ3 = Number(r[12]) || 0;
    const vQ4 = Number(r[13]) || 0;
    const vQ5 = Number(r[14]) || 0;
    const vQ6 = Number(r[15]) || 0;
    const vQ7 = Number(r[16]) || 0;
    const vScore = Number(r[17]) || 0;
    const vIkm = Number(r[18]) || (vScore > 0 ? (vScore / 4 * 100) : 0);
    const mutu = String(r[19] || "");
    const saran = String(r[20] || "");
    const rincian = String(r[21] || "");
    const device = String(r[22] || "Web");

    if (vQ1 > 0) { sumQ1 += vQ1; countQ1++; }
    if (vQ2 > 0) { sumQ2 += vQ2; countQ2++; }
    if (vQ3 > 0) { sumQ3 += vQ3; countQ3++; }
    if (vQ4 > 0) { sumQ4 += vQ4; countQ4++; }
    if (vQ5 > 0) { sumQ5 += vQ5; countQ5++; }
    if (vQ6 > 0) { sumQ6 += vQ6; countQ6++; }
    if (vQ7 > 0) { sumQ7 += vQ7; countQ7++; }

    if (vScore > 0) {
      sumScore += vScore;
      sumIkm += vIkm;
      countScore++;
      if (vScore >= 3.0) puasCount++;
    }

    if (mutu.indexOf("A") !== -1 || mutu.indexOf("Sangat Baik") !== -1) mutuDist.a++;
    else if (mutu.indexOf("B") !== -1 || mutu.indexOf("Baik") !== -1) mutuDist.b++;
    else if (mutu.indexOf("C") !== -1 || mutu.indexOf("Cukup") !== -1) mutuDist.c++;
    else if (mutu.indexOf("D") !== -1 || mutu.indexOf("Kurang") !== -1) mutuDist.d++;
    else if (vScore >= 3.5) mutuDist.a++;
    else if (vScore >= 3.0) mutuDist.b++;
    else if (vScore >= 2.5) mutuDist.c++;
    else mutuDist.d++;

    layananDist[layanan] = (layananDist[layanan] || 0) + 1;

    if (jk.indexOf("L") !== -1) genderDist.L++;
    else if (jk.indexOf("P") !== -1) genderDist.P++;
    else genderDist.other = (genderDist.other || 0) + 1;

    recentResponses.push({
      timestamp: r[0] instanceof Date ? Utilities.formatDate(r[0], "Asia/Makassar", "dd/MM/yyyy HH:mm") : String(r[0]),
      id: String(r[1] || Utilities.getUuid()),
      tanggalSurvei: tgl,
      jamSurvei: String(r[3] || ""),
      namaPasien: nama,
      jenisKelamin: jk,
      pendidikan: String(r[6] || "-"),
      usia: usia,
      pekerjaan: String(r[8] || "-"),
      jenisLayanan: layanan,
      q1: vQ1,
      q2: vQ2,
      q3: vQ3,
      q4: vQ4,
      q5: vQ5,
      q6: vQ6,
      q7: vQ7,
      avgScore: vScore > 0 ? Number(vScore.toFixed(2)) : 0,
      ikm100: vIkm > 0 ? Number(vIkm.toFixed(2)) : 0,
      mutuLayanan: mutu || (vScore >= 3.5 ? "Sangat Baik (A)" : (vScore >= 3.0 ? "Baik (B)" : "Cukup (C)")),
      saran: (saran && saran !== "-") ? saran : "",
      rincianAspek: (rincian && rincian !== "-") ? rincian : "",
      device: device || "Web"
    });
  }

  recentResponses.reverse();

  const total = values.length;
  const avgOverallScore = countScore > 0 ? sumScore / countScore : 0;
  const avgOverallIkm = countScore > 0 ? sumIkm / countScore : 0;
  const kepuasanRate = countScore > 0 ? (puasCount / countScore) * 100 : 0;

  let mutuLabel = "Sangat Baik (A)";
  if (avgOverallIkm < 65) mutuLabel = "Kurang Baik (D)";
  else if (avgOverallIkm < 76.6) mutuLabel = "Cukup (C)";
  else if (avgOverallIkm < 88.3) mutuLabel = "Baik (B)";

  return {
    totalResponden: total,
    avgScore: Number(avgOverallScore.toFixed(2)),
    avgIkm: Number(avgOverallIkm.toFixed(2)),
    mutuPelayanan: mutuLabel,
    kepuasanRate: Number(kepuasanRate.toFixed(1)),
    unsurScores: {
      q1: countQ1 > 0 ? Number((sumQ1 / countQ1).toFixed(2)) : 0,
      q2: countQ2 > 0 ? Number((sumQ2 / countQ2).toFixed(2)) : 0,
      q3: countQ3 > 0 ? Number((sumQ3 / countQ3).toFixed(2)) : 0,
      q4: countQ4 > 0 ? Number((sumQ4 / countQ4).toFixed(2)) : 0,
      q5: countQ5 > 0 ? Number((sumQ5 / countQ5).toFixed(2)) : 0,
      q6: countQ6 > 0 ? Number((sumQ6 / countQ6).toFixed(2)) : 0,
      q7: countQ7 > 0 ? Number((sumQ7 / countQ7).toFixed(2)) : 0
    },
    mutuDist: mutuDist,
    layananDist: layananDist,
    genderDist: genderDist,
    recentResponses: recentResponses,
    spreadsheetUrl: ss.getUrl(),
    lastUpdated: Utilities.formatDate(new Date(), "Asia/Makassar", "dd MMMM yyyy, HH:mm 'WITA'")
  };
}

/**
 * Setup Header Kolom Spreadsheet
 */
function setupHeaders(sheet, isArchive) {
  let headers = [
    "Timestamp Google",
    "ID Survei",
    "Tanggal Survei",
    "Jam Survei",
    "Nama Pasien (Opsional)",
    "Jenis Kelamin",
    "Pendidikan",
    "Usia (Tahun)",
    "Pekerjaan",
    "Jenis Layanan yang Diterima",
    "1. Kenyamanan Kamar & Tempat Tidur",
    "2. Kebersihan Kamar & Kamar Mandi",
    "3. Ketersediaan & Fasilitas Kamar",
    "4. Ketenangan & Keamanan Lingkungan",
    "5. Kunjungan Dokter",
    "6. Kejelasan Informasi Medis",
    "7. Responsivitas & Kesiapan Perawat",
    "Rata-rata Skor (Skala 1-4)",
    "Indeks IKM (Skala 100)",
    "Mutu Pelayanan",
    "Saran / Masukan",
    "Rincian Aspek Lengkap",
    "Perangkat Pengisi"
  ];

  if (isArchive) {
    headers = ["Periode Arsip"].concat(headers);
  }

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground(isArchive ? "#0f766e" : "#1e3a8a")
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
}

function checkAndUpgradeHeaders(sheet) {
  try {
    if (sheet.getLastColumn() < 23) {
      setupHeaders(sheet, false);
    }
  } catch (e) {}
}

function updateDashboardSheet(ss) {
  let dash = ss.getSheetByName(SHEET_NAME_DASHBOARD);
  if (!dash) {
    dash = ss.insertSheet(SHEET_NAME_DASHBOARD);
  }

  dash.getRange("A1").setValue("DASHBOARD SURVEI KEPUASAN PASIEN - RSUD AERAMO").setFontWeight("bold").setFontSize(13);
  dash.getRange("A2").setValue("Kabupaten Nagekeo | Terakhir Diperbarui: " + new Date().toLocaleString("id-ID")).setFontStyle("italic");

  const cards = [
    ["Total Responden Minggu Ini", '=COUNTA(Data_Survei_Aeramo!B2:B)'],
    ["Rata-Rata IKM (Skala 100)", '=IFERROR(AVERAGE(Data_Survei_Aeramo!S2:S), 0)'],
    ["1. Kenyamanan Kamar & Tempat Tidur", '=IFERROR(AVERAGE(Data_Survei_Aeramo!K2:K), 0)'],
    ["2. Kebersihan Kamar & Kamar Mandi", '=IFERROR(AVERAGE(Data_Survei_Aeramo!L2:L), 0)'],
    ["3. Kualitas & Fasilitas Kamar", '=IFERROR(AVERAGE(Data_Survei_Aeramo!M2:M), 0)'],
    ["4. Ketenangan & Keamanan Lingkungan", '=IFERROR(AVERAGE(Data_Survei_Aeramo!N2:N), 0)'],
    ["5. Kunjungan Dokter", '=IFERROR(AVERAGE(Data_Survei_Aeramo!O2:O), 0)'],
    ["6. Kejelasan Informasi Dokter", '=IFERROR(AVERAGE(Data_Survei_Aeramo!P2:P), 0)'],
    ["7. Responsivitas Perawat", '=IFERROR(AVERAGE(Data_Survei_Aeramo!Q2:Q), 0)']
  ];

  for (let i = 0; i < cards.length; i++) {
    const row = 4 + i;
    dash.getRange(row, 1).setValue(cards[i][0]).setFontWeight("bold");
    dash.getRange(row, 2).setFormula(cards[i][1]).setNumberFormat("0.00");
  }

  dash.getRange("A4:B12").setBorder(true, true, true, true, true, true);
}
`;

export const GOOGLE_APPS_SCRIPT_INDEX_HTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portal Eksekutif & Manajemen PIN - RSUD Aeramo</title>
  <!-- Tailwind CSS & Chart.js CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .custom-scrollbar::-webkit-scrollbar {
      height: 6px;
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f1f5f9;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 9999px;
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen">

  <!-- Header Atas & Navigasi -->
  <header class="bg-gradient-to-r from-blue-900 via-blue-950 to-slate-900 text-white shadow-md sticky top-0 z-30">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-black text-xl text-white shadow-xs">
          ⚕️
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-base sm:text-lg font-extrabold tracking-tight leading-tight">
              Portal Admin &amp; PIN Pasien
            </h1>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30">
              RSUD Aeramo
            </span>
          </div>
          <p class="text-xs text-blue-200">
            Sistem Informasi Survei Kepuasan &amp; Manajemen Akses Pasien
          </p>
        </div>
      </div>

      <!-- Tab Menu Utama -->
      <div class="flex items-center gap-1.5 bg-white/10 p-1 rounded-xl border border-white/15 self-stretch sm:self-auto justify-center">
        <button
          onclick="switchTab('dashboard')"
          id="tab-btn-dashboard"
          class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 bg-white text-blue-950 shadow-xs"
        >
          <span>📊 Dashboard &amp; IKM</span>
        </button>

        <button
          onclick="switchTab('pins')"
          id="tab-btn-pins"
          class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 text-blue-200 hover:text-white"
        >
          <span>🔑 Kelola PIN Pasien</span>
          <span id="badge-pins-active" class="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-white font-black">0</span>
        </button>

        <button
          onclick="switchTab('archive')"
          id="tab-btn-archive"
          class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 text-blue-200 hover:text-white"
        >
          <span>📁 Rotasi &amp; Arsip</span>
        </button>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2 self-end sm:self-auto">
        <button
          onclick="refreshAll()"
          id="btn-refresh"
          class="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 active:scale-95 text-xs font-semibold shadow-xs transition flex items-center gap-1.5 text-white"
        >
          <svg id="refresh-spinner" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          <span id="btn-refresh-text">Muat Data</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Toast Notification Container -->
  <div id="toast-container" class="fixed top-20 right-5 z-50 flex flex-col gap-2 pointer-events-none"></div>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 py-6">

    <!-- TAB 1: DASHBOARD IKM -->
    <div id="tab-content-dashboard" class="space-y-6">
      <div class="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs">
        <div class="flex items-center gap-2">
          <span class="text-base">ℹ️</span>
          <div>
            <strong class="font-bold text-blue-900">Sistem Survei Kepuasan Pasien RSUD Aeramo:</strong>
            <span class="text-blue-800"> Menghitung Indeks Kepuasan Masyarakat (IKM) standar KemenPAN-RB berdasarkan 7 unsur pelayanan rawat inap.</span>
          </div>
        </div>
        <button
          onclick="exportCSV()"
          class="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1 shadow-xs self-end sm:self-auto"
        >
          <span>📥 Ekspor CSV</span>
        </button>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div class="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 space-y-1">
          <p class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Responden</p>
          <div class="flex items-baseline gap-2">
            <span id="kpi-total" class="text-2xl sm:text-3xl font-black text-slate-900">0</span>
            <span class="text-xs text-slate-400">pasien</span>
          </div>
          <p class="text-[10px] text-slate-400 pt-1">Terakhir update: <span id="label-last-updated">-</span></p>
        </div>

        <div class="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 space-y-1">
          <p class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Indeks Kepuasan (IKM 100)</p>
          <div class="flex items-baseline gap-2">
            <span id="kpi-ikm" class="text-2xl sm:text-3xl font-black text-blue-700">0.00</span>
            <span class="text-xs text-slate-400">/ 100</span>
          </div>
          <div class="pt-1">
            <span id="kpi-mutu-badge" class="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-blue-100 text-blue-800">-</span>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 space-y-1">
          <p class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Skor Rata-Rata</p>
          <div class="flex items-baseline gap-2">
            <span id="kpi-score" class="text-2xl sm:text-3xl font-black text-emerald-700">0.00</span>
            <span class="text-xs text-slate-400">/ 4.00</span>
          </div>
          <p class="text-[10px] text-slate-500 pt-1">Skala Likert Kuesioner</p>
        </div>

        <div class="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 space-y-1">
          <p class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tingkat Pasien Puas</p>
          <div class="flex items-baseline gap-2">
            <span id="kpi-puas-rate" class="text-2xl sm:text-3xl font-black text-indigo-700">0%</span>
          </div>
          <p class="text-[10px] text-slate-500 pt-1">Responden nilai &gt;= 3.00 (Baik)</p>
        </div>
      </div>

      <!-- Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 lg:col-span-2 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-bold text-slate-900 text-sm sm:text-base">Rata-Rata Aspek Pelayanan (Skala 1 - 4)</h3>
              <p class="text-xs text-slate-500">Perbandingan skor 7 unsur kepuasan pasien RSUD Aeramo</p>
            </div>
            <span class="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 font-semibold text-slate-600">Q1 s/d Q7</span>
          </div>
          <div class="relative h-64 sm:h-72 w-full">
            <canvas id="chartUnsur"></canvas>
          </div>
        </div>

        <div class="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 space-y-4">
          <div>
            <h3 class="font-bold text-slate-900 text-sm sm:text-base">Distribusi Mutu Pelayanan</h3>
            <p class="text-xs text-slate-500">Kategori mutu IKM</p>
          </div>
          <div class="relative h-64 w-full flex items-center justify-center">
            <canvas id="chartMutu"></canvas>
          </div>
        </div>
      </div>

      <!-- Tabel Responden -->
      <div class="bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden space-y-4">
        <div class="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 class="font-bold text-slate-900 text-base flex items-center gap-2">
              <span>Daftar Jawaban Responden Pasien</span>
              <span id="label-count-filtered" class="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">0</span>
              <span class="text-xs text-slate-400 font-normal">dari <span id="label-count-total">0</span> total</span>
            </h3>
            <p class="text-xs text-slate-500">Data survei yang masuk dari kuesioner pasien</p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <select
              id="filter-layanan"
              onchange="applyFilters()"
              class="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold"
            >
              <option value="ALL">Semua Unit Layanan</option>
              <option value="Rawat Inap">Rawat Inap</option>
              <option value="Radiologi">Radiologi</option>
              <option value="Rawat Jalan">Rawat Jalan</option>
              <option value="IGD">IGD</option>
              <option value="Farmasi">Farmasi</option>
              <option value="Laboratorium">Laboratorium</option>
              <option value="Kebidanan">Kebidanan</option>
            </select>

            <select
              id="filter-mutu"
              onchange="applyFilters()"
              class="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold"
            >
              <option value="ALL">Semua Predikat</option>
              <option value="A">Sangat Baik (A)</option>
              <option value="B">Baik (B)</option>
              <option value="C">Cukup (C)</option>
              <option value="D">Kurang (D)</option>
            </select>

            <input
              type="text"
              id="input-search"
              oninput="applyFilters()"
              placeholder="Cari nama / tanggal..."
              class="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 w-48"
            />
          </div>
        </div>

        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-100/80 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th class="py-3 px-3">Waktu</th>
                <th class="py-3 px-3">Nama Pasien</th>
                <th class="py-3 px-3">Demografi</th>
                <th class="py-3 px-3">Layanan</th>
                <th class="py-3 px-2 text-center">Q1</th>
                <th class="py-3 px-2 text-center">Q2</th>
                <th class="py-3 px-2 text-center">Q3</th>
                <th class="py-3 px-2 text-center">Q4</th>
                <th class="py-3 px-2 text-center">Q5</th>
                <th class="py-3 px-2 text-center">Q6</th>
                <th class="py-3 px-2 text-center">Q7</th>
                <th class="py-3 px-2 text-center">Rata2</th>
                <th class="py-3 px-2 text-center">IKM 100</th>
                <th class="py-3 px-2 text-center">Mutu</th>
                <th class="py-3 px-3">Saran / Masukan</th>
              </tr>
            </thead>
            <tbody id="table-body" class="divide-y divide-slate-100">
              <tr>
                <td colspan="15" class="py-12 text-center text-slate-400">Memuat data survei...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 2: KELOLA & TERBITKAN PIN -->
    <div id="tab-content-pins" class="space-y-6 hidden">
      <div class="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-4">
        <div class="flex items-center justify-between border-b pb-3">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
              🔑
            </div>
            <div>
              <h3 class="font-extrabold text-slate-900 text-base">Terbitkan PIN Akses Pasien Baru</h3>
              <p class="text-xs text-slate-500">PIN 6-digit sekali pakai langsung tersimpan ke sheet <strong>PIN_PASIEN</strong></p>
            </div>
          </div>
          <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            Multi-Perangkat Aktif
          </span>
        </div>

        <form id="form-create-pin" onsubmit="handleCreatePin(event)" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">Jumlah PIN yang Diterbitkan</label>
            <select id="pin-count" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-semibold">
              <option value="1">1 PIN Pasien</option>
              <option value="5">5 PIN Sekaligus</option>
              <option value="10">10 PIN Sekaligus</option>
              <option value="20">20 PIN Sekaligus</option>
              <option value="50">50 PIN Sekaligus</option>
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">Nama Pasien (Opsional jika 1 PIN)</label>
            <input
              type="text"
              id="pin-patient-name"
              placeholder="Contoh: Ny. Siti Rahma"
              class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">Unit Layanan</label>
            <select id="pin-service" class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-slate-50">
              <option value="Rawat Inap">Rawat Inap</option>
              <option value="Radiologi">Radiologi</option>
              <option value="Rawat Jalan">Rawat Jalan</option>
              <option value="IGD">IGD (Gawat Darurat)</option>
              <option value="Farmasi">Farmasi</option>
              <option value="Laboratorium">Laboratorium</option>
              <option value="Kebidanan">Kebidanan</option>
            </select>
          </div>

          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">Nomor / Nama Ruangan</label>
            <input
              type="text"
              id="pin-room"
              placeholder="Contoh: Kamar Melati 03"
              class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>

          <div class="sm:col-span-2 lg:col-span-3">
            <label class="block text-[11px] font-bold text-slate-700 mb-1">PIN Kustom (Opsional - Biarkan Kosong untuk Acak Otomatis)</label>
            <input
              type="text"
              id="pin-custom"
              maxlength="6"
              placeholder="Ketik 6 digit angka (misal: 255966) atau kosongkan"
              class="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 font-mono tracking-widest"
            />
          </div>

          <div class="flex items-end">
            <button
              type="submit"
              id="btn-submit-pin"
              class="w-full py-2 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 active:scale-95 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
            >
              <span>✨ Terbitkan PIN Sekarang</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Tabel Daftar PIN Pasien -->
      <div class="bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden space-y-4">
        <div class="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 class="font-bold text-slate-900 text-base flex items-center gap-2">
              <span>Database PIN Pasien Terdaftar</span>
              <span id="label-pins-total" class="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">0</span>
            </h3>
            <p class="text-xs text-slate-500">Daftar seluruh PIN di sheet <strong>PIN_PASIEN</strong> beserta status penggunaannya</p>
          </div>

          <div class="flex items-center gap-2">
            <select
              id="filter-pin-status"
              onchange="renderPinsTable()"
              class="text-xs px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 font-semibold"
            >
              <option value="ALL">Semua Status</option>
              <option value="active">AKTIF (Belum Digunakan)</option>
              <option value="used">TERPAKAI</option>
              <option value="revoked">DICABUT</option>
            </select>

            <input
              type="text"
              id="input-search-pin"
              oninput="renderPinsTable()"
              placeholder="Cari nomor PIN / nama..."
              class="text-xs px-3 py-1.5 rounded-xl border border-slate-300 w-48"
            />
          </div>
        </div>

        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-100/80 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th class="py-3 px-4">Nomor PIN</th>
                <th class="py-3 px-3">Status</th>
                <th class="py-3 px-3">Nama Pasien</th>
                <th class="py-3 px-3">Layanan</th>
                <th class="py-3 px-3">Ruangan</th>
                <th class="py-3 px-3">Dibuat Pada</th>
                <th class="py-3 px-3">Terpakai Pada</th>
                <th class="py-3 px-4 text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody id="table-pins-body" class="divide-y divide-slate-100">
              <tr>
                <td colspan="8" class="py-12 text-center text-slate-400">Memuat data PIN...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 3: ARSIP -->
    <div id="tab-content-archive" class="space-y-6 hidden">
      <div class="bg-white rounded-3xl p-6 shadow-xs border border-slate-200 space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg">
            📁
          </div>
          <div>
            <h3 class="font-extrabold text-slate-900 text-base">Arsitektur Manajemen Mingguan &amp; Arsip Permanen</h3>
            <p class="text-xs text-slate-500">Struktur Google Sheet RSUD Aeramo untuk menjaga kecepatan akses</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div class="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-2">
            <span class="text-xs font-bold text-blue-900 block">1. Sheet Aktif (Data_Survei_Aeramo)</span>
            <p class="text-[11px] text-blue-800 leading-relaxed">
              Menampung jawaban kuesioner pasien untuk minggu berjalan. Data di sini diolah menjadi grafik IKM terkini.
            </p>
          </div>

          <div class="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2">
            <span class="text-xs font-bold text-emerald-900 block">2. Sheet PIN (PIN_PASIEN)</span>
            <p class="text-[11px] text-emerald-800 leading-relaxed">
              Menyimpan seluruh PIN sekali pakai yang diterbitkan untuk pasien dari semua unit dan gadget.
            </p>
          </div>

          <div class="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 space-y-2">
            <span class="text-xs font-bold text-purple-900 block">3. Sheet Arsip (Arsip_Mingguan_Survei)</span>
            <p class="text-[11px] text-purple-800 leading-relaxed">
              Setiap pergantian minggu, data lama dipindahkan ke sini secara otomatis sehingga riwayat survei tersimpan abadi.
            </p>
          </div>
        </div>
      </div>
    </div>

  </main>

  <script>
    var currentTab = 'dashboard';
    var rawData = null;
    var rawPins = [];
    var filteredList = [];
    var chartUnsurInstance = null;
    var chartMutuInstance = null;

    function switchTab(tabName) {
      currentTab = tabName;
      document.getElementById('tab-content-dashboard').classList.toggle('hidden', tabName !== 'dashboard');
      document.getElementById('tab-content-pins').classList.toggle('hidden', tabName !== 'pins');
      document.getElementById('tab-content-archive').classList.toggle('hidden', tabName !== 'archive');

      var btnD = document.getElementById('tab-btn-dashboard');
      var btnP = document.getElementById('tab-btn-pins');
      var btnA = document.getElementById('tab-btn-archive');

      btnD.className = tabName === 'dashboard'
        ? 'px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 bg-white text-blue-950 shadow-xs'
        : 'px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 text-blue-200 hover:text-white';

      btnP.className = tabName === 'pins'
        ? 'px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 bg-white text-blue-950 shadow-xs'
        : 'px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 text-blue-200 hover:text-white';

      btnA.className = tabName === 'archive'
        ? 'px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 bg-white text-blue-950 shadow-xs'
        : 'px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 text-blue-200 hover:text-white';

      if (tabName === 'pins' && rawPins.length === 0) {
        fetchPins();
      }
    }

    function showToast(msg, type) {
      var cont = document.getElementById('toast-container');
      var el = document.createElement('div');
      el.className = 'px-4 py-2.5 rounded-xl shadow-lg text-xs font-bold text-white transition-all transform duration-300 ' +
        (type === 'error' ? 'bg-red-600' : 'bg-emerald-600');
      el.innerText = msg;
      cont.appendChild(el);
      setTimeout(function() {
        el.style.opacity = '0';
        setTimeout(function() { el.remove(); }, 300);
      }, 3000);
    }

    function refreshAll() {
      fetchData();
      fetchPins();
    }

    function fetchData() {
      var spinner = document.getElementById('refresh-spinner');
      if (spinner) spinner.classList.add('animate-spin');

      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(onDataLoaded)
          .withFailureHandler(onDataError)
          .getDashboardData();
      } else {
        fetch('?api=true')
          .then(function(res) { return res.json(); })
          .then(onDataLoaded)
          .catch(onDataError);
      }
    }

    function fetchPins() {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(onPinsLoaded)
          .withFailureHandler(function() {})
          .getAllPinsFromSheet();
      } else {
        fetch('?action=get_pins')
          .then(function(res) { return res.json(); })
          .then(onPinsLoaded)
          .catch(function() {});
      }
    }

    function onPinsLoaded(res) {
      if (res && Array.isArray(res.pins)) {
        rawPins = res.pins;
      } else if (Array.isArray(res)) {
        rawPins = res;
      }
      var activeCount = rawPins.filter(function(p) { return p.status === 'active' || p.status === 'AKTIF'; }).length;
      document.getElementById('badge-pins-active').innerText = activeCount;
      document.getElementById('label-pins-total').innerText = rawPins.length + ' PIN';
      renderPinsTable();
    }

    function renderPinsTable() {
      var tbody = document.getElementById('table-pins-body');
      if (!tbody) return;

      var filterStatus = document.getElementById('filter-pin-status').value;
      var search = (document.getElementById('input-search-pin').value || '').toLowerCase().trim();

      var list = rawPins.filter(function(p) {
        var pStatus = (p.status || '').toLowerCase();
        var matchStatus = (filterStatus === 'ALL') ||
          (filterStatus === 'active' && (pStatus === 'active' || pStatus === 'aktif')) ||
          (filterStatus === 'used' && (pStatus === 'used' || pStatus === 'terpakai')) ||
          (filterStatus === 'revoked' && (pStatus === 'revoked' || pStatus === 'dicabut'));

        var matchSearch = !search ||
          (p.pin && String(p.pin).indexOf(search) !== -1) ||
          (p.registeredPatientName && p.registeredPatientName.toLowerCase().indexOf(search) !== -1) ||
          (p.registeredService && p.registeredService.toLowerCase().indexOf(search) !== -1) ||
          (p.registeredRoom && p.registeredRoom.toLowerCase().indexOf(search) !== -1);

        return matchStatus && matchSearch;
      });

      if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="py-10 text-center text-slate-400">Belum ada data PIN yang sesuai filter.</td></tr>';
        return;
      }

      var html = '';
      for (var i = 0; i < list.length; i++) {
        var p = list[i];
        var isUsed = p.status === 'used' || p.status === 'TERPAKAI';
        var isRevoked = p.status === 'revoked' || p.status === 'DICABUT';

        var statusBadge = isUsed
          ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-300">TERPAKAI</span>'
          : (isRevoked
            ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-800 border border-red-300">DICABUT</span>'
            : '<span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">AKTIF</span>');

        html += '<tr class="border-b border-slate-100 hover:bg-slate-50/80">' +
          '<td class="py-3 px-4 font-mono text-sm font-black text-blue-950 tracking-wider">' + p.pin + '</td>' +
          '<td class="py-3 px-3">' + statusBadge + '</td>' +
          '<td class="py-3 px-3 font-bold text-slate-900">' + escapeHtml(p.registeredPatientName || '-') + '</td>' +
          '<td class="py-3 px-3 text-slate-600">' + escapeHtml(p.registeredService || 'Rawat Inap') + '</td>' +
          '<td class="py-3 px-3 text-slate-600">' + escapeHtml(p.registeredRoom || '-') + '</td>' +
          '<td class="py-3 px-3 text-[11px] text-slate-400 whitespace-nowrap">' + (p.createdAt || '-') + '</td>' +
          '<td class="py-3 px-3 text-[11px] text-slate-400 whitespace-nowrap">' + (p.usedAt || '-') + '</td>' +
          '<td class="py-3 px-4 text-center">' +
          '<button onclick="copyPinText(\'' + p.pin + '\')" class="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] border border-blue-200 transition active:scale-95">Salin PIN</button>' +
          '</td>' +
          '</tr>';
      }
      tbody.innerHTML = html;
    }

    function copyPinText(pin) {
      navigator.clipboard.writeText(pin);
      showToast('PIN ' + pin + ' berhasil disalin ke clipboard!', 'success');
    }

    function handleCreatePin(e) {
      e.preventDefault();
      var count = Number(document.getElementById('pin-count').value) || 1;
      var pName = document.getElementById('pin-patient-name').value.trim();
      var svc = document.getElementById('pin-service').value;
      var room = document.getElementById('pin-room').value.trim();
      var customPin = document.getElementById('pin-custom').value.trim();

      var btn = document.getElementById('btn-submit-pin');
      btn.disabled = true;
      btn.innerText = 'Menerbitkan...';

      var payload = {
        count: count,
        customPin: customPin,
        registeredPatientName: pName,
        registeredService: svc,
        registeredRoom: room,
        notes: 'Diterbitkan dari Dashboard Apps Script'
      };

      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(res) {
            btn.disabled = false;
            btn.innerText = '✨ Terbitkan PIN Sekarang';
            if (res && res.success) {
              showToast(res.message || 'PIN berhasil dibuat!', 'success');
              document.getElementById('pin-patient-name').value = '';
              document.getElementById('pin-room').value = '';
              document.getElementById('pin-custom').value = '';
              fetchPins();
            } else {
              showToast((res && res.message) || 'Gagal membuat PIN', 'error');
            }
          })
          .withFailureHandler(function(err) {
            btn.disabled = false;
            btn.innerText = '✨ Terbitkan PIN Sekarang';
            showToast('Error: ' + err.message, 'error');
          })
          .generatePinFromDashboard(payload);
      } else {
        fetch('?action=create_pin&count=' + count + '&pin=' + encodeURIComponent(customPin) + '&name=' + encodeURIComponent(pName) + '&service=' + encodeURIComponent(svc) + '&room=' + encodeURIComponent(room))
          .then(function(res) { return res.json(); })
          .then(function(res) {
            btn.disabled = false;
            btn.innerText = '✨ Terbitkan PIN Sekarang';
            if (res && res.success) {
              showToast(res.message || 'PIN berhasil dibuat!', 'success');
              fetchPins();
            }
          })
          .catch(function(err) {
            btn.disabled = false;
            btn.innerText = '✨ Terbitkan PIN Sekarang';
            showToast('Error: ' + err.message, 'error');
          });
      }
    }

    function onDataLoaded(data) {
      var spinner = document.getElementById('refresh-spinner');
      if (spinner) spinner.classList.remove('animate-spin');

      if (!data) return;
      rawData = data;

      document.getElementById('kpi-total').innerText = data.totalResponden || 0;
      document.getElementById('kpi-ikm').innerText = (data.ikm100 || 0).toFixed(2);
      document.getElementById('kpi-score').innerText = (data.avgScoreTotal || 0).toFixed(2);
      document.getElementById('kpi-puas-rate').innerText = (data.persentasePuas || 0).toFixed(1) + '%';
      document.getElementById('label-last-updated').innerText = data.lastUpdated || '-';

      var badge = document.getElementById('kpi-mutu-badge');
      var mutu = data.mutuLayanan || '-';
      badge.innerText = 'Mutu: ' + mutu;
      badge.className = 'px-2 py-0.5 rounded-md text-[11px] font-extrabold ' +
        (mutu.indexOf('A') !== -1 ? 'bg-emerald-100 text-emerald-800' :
         mutu.indexOf('B') !== -1 ? 'bg-blue-100 text-blue-800' :
         mutu.indexOf('C') !== -1 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800');

      renderCharts(data);
      applyFilters();
    }

    function onDataError(err) {
      var spinner = document.getElementById('refresh-spinner');
      if (spinner) spinner.classList.remove('animate-spin');
      showToast('Gagal memuat data: ' + (err.message || err), 'error');
    }

    function renderCharts(data) {
      var ctxUnsur = document.getElementById('chartUnsur');
      if (ctxUnsur && data.unsurAvg) {
        if (chartUnsurInstance) chartUnsurInstance.destroy();
        var u = data.unsurAvg;
        chartUnsurInstance = new Chart(ctxUnsur, {
          type: 'bar',
          data: {
            labels: [
              ['1. Kenyamanan', 'Kamar & Tidur'],
              ['2. Kebersihan', 'Kamar & Mandi'],
              ['3. Fasilitas', 'Peralatan'],
              ['4. Ketenangan', '& Keamanan'],
              ['5. Kunjungan', 'Dokter'],
              ['6. Penjelasan', 'Info Dokter'],
              ['7. Responsif', 'Perawat']
            ],
            datasets: [{
              label: 'Skor Rata-rata (1 - 4)',
              data: [u.q1, u.q2, u.q3, u.q4, u.q5, u.q6, u.q7],
              backgroundColor: ['#2563eb', '#059669', '#d97706', '#7c3aed', '#0284c7', '#4f46e5', '#0d9488'],
              borderRadius: 8,
              barThickness: 22
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true, max: 4.0 }
            },
            plugins: { legend: { display: false } }
          }
        });
      }

      var ctxMutu = document.getElementById('chartMutu');
      if (ctxMutu) {
        if (chartMutuInstance) chartMutuInstance.destroy();
        var m = data.mutuDist || { a: 0, b: 0, c: 0, d: 0 };
        chartMutuInstance = new Chart(ctxMutu, {
          type: 'doughnut',
          data: {
            labels: ['Sangat Baik (A)', 'Baik (B)', 'Cukup (C)', 'Kurang Baik (D)'],
            datasets: [{
              data: [m.a, m.b, m.c, m.d],
              backgroundColor: ['#059669', '#2563eb', '#d97706', '#e11d48']
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%'
          }
        });
      }
    }

    function applyFilters() {
      if (!rawData || !rawData.recentResponses) return;

      var filterLayanan = document.getElementById('filter-layanan').value;
      var filterMutu = document.getElementById('filter-mutu').value;
      var search = (document.getElementById('input-search').value || '').toLowerCase().trim();

      filteredList = rawData.recentResponses.filter(function(item) {
        var matchLayanan = (filterLayanan === 'ALL') || (item.jenisLayanan === filterLayanan);
        var matchMutu = (filterMutu === 'ALL') || (item.mutuLayanan.indexOf(filterMutu) !== -1);
        var matchSearch = !search ||
          (item.namaPasien && item.namaPasien.toLowerCase().indexOf(search) !== -1) ||
          (item.tanggalSurvei && item.tanggalSurvei.toLowerCase().indexOf(search) !== -1) ||
          (item.jenisLayanan && item.jenisLayanan.toLowerCase().indexOf(search) !== -1);

        return matchLayanan && matchMutu && matchSearch;
      });

      renderTable();
    }

    function renderTable() {
      var tbody = document.getElementById('table-body');
      document.getElementById('label-count-filtered').innerText = filteredList.length;
      document.getElementById('label-count-total').innerText = (rawData && rawData.recentResponses) ? rawData.recentResponses.length : 0;

      if (!filteredList || filteredList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="15" class="py-12 text-center text-slate-400">Belum ada data responden yang sesuai filter.</td></tr>';
        return;
      }

      var html = '';
      for (var i = 0; i < filteredList.length; i++) {
        var r = filteredList[i];
        html += '<tr class="border-b border-slate-100">' +
          '<td class="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">' + r.tanggalSurvei + '<br><span class="text-[10px] text-slate-400">' + (r.jamSurvei || '') + '</span></td>' +
          '<td class="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">' + escapeHtml(r.namaPasien) + '</td>' +
          '<td class="py-3 px-3 text-slate-500 whitespace-nowrap">' + r.jenisKelamin + ' • ' + (r.usia || '-') + ' th</td>' +
          '<td class="py-3 px-3 font-semibold text-blue-900">' + escapeHtml(r.jenisLayanan) + '</td>' +
          '<td class="py-3 px-2 text-center">' + (r.q1 || '-') + '</td>' +
          '<td class="py-3 px-2 text-center">' + (r.q2 || '-') + '</td>' +
          '<td class="py-3 px-2 text-center">' + (r.q3 || '-') + '</td>' +
          '<td class="py-3 px-2 text-center">' + (r.q4 || '-') + '</td>' +
          '<td class="py-3 px-2 text-center">' + (r.q5 || '-') + '</td>' +
          '<td class="py-3 px-2 text-center">' + (r.q6 || '-') + '</td>' +
          '<td class="py-3 px-2 text-center">' + (r.q7 || '-') + '</td>' +
          '<td class="py-3 px-2 text-center font-bold text-emerald-700">' + r.avgScore.toFixed(2) + '</td>' +
          '<td class="py-3 px-2 text-center font-bold text-blue-700">' + r.ikm100.toFixed(2) + '</td>' +
          '<td class="py-3 px-2 text-center">' + r.mutuLayanan + '</td>' +
          '<td class="py-3 px-3 text-slate-600 max-w-xs truncate">' + (r.saran ? escapeHtml(r.saran) : '-') + '</td>' +
          '</tr>';
      }
      tbody.innerHTML = html;
    }

    function exportCSV() {
      if (!filteredList || filteredList.length === 0) {
        alert('Tidak ada data untuk diekspor.');
        return;
      }

      var headers = ['Tanggal', 'Jam', 'Nama Pasien', 'JK', 'Usia', 'Layanan', 'AvgScore', 'IKM100', 'Mutu', 'Saran'];
      var csvRows = [headers.join(',')];

      for (var i = 0; i < filteredList.length; i++) {
        var r = filteredList[i];
        var row = [
          '"' + r.tanggalSurvei + '"',
          '"' + (r.jamSurvei || '') + '"',
          '"' + (r.namaPasien || '').replace(/"/g, '""') + '"',
          '"' + r.jenisKelamin + '"',
          '"' + (r.usia || '') + '"',
          '"' + r.jenisLayanan + '"',
          r.avgScore || 0,
          r.ikm100 || 0,
          '"' + r.mutuLayanan + '"',
          '"' + (r.saran || '').replace(/"/g, '""') + '"'
        ];
        csvRows.push(row.join(','));
      }

      var blob = new Blob([csvRows.join('\\n')], { type: 'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'Laporan_Survei_RSUD_Aeramo_' + new Date().toISOString().slice(0, 10) + '.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    function escapeHtml(text) {
      if (!text) return '';
      return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    window.addEventListener('load', function() {
      refreshAll();
    });
  </script>
</body>
</html>
`;