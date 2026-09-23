/**
 * Kode Google Apps Script (Code.gs & index.html) siap pakai untuk Google Sheets.
 * Dilengkapi Sistem Manajemen & Rotasi Mingguan Otomatis:
 * 1. "Rekap_Survei_Aktif" (Data minggu berjalan, cepat & ringan)
 * 2. "Arsip_Mingguan_Survei" (Penyimpanan historis permanen, data aman tidak terhapus)
 * RSUD AERAMO - KABUPATEN NAGEKEO
 */

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ==============================================================================
 * KUESIONER SURVEI KEPUASAN PASIEN & DASHBOARD ADMIN EKSEKUTIF
 * RUMAH SAKIT UMUM DAERAH (RSUD) AERAMO - KABUPATEN NAGEKEO
 * FILE: Code.gs (Google Apps Script Backend + Multi-Device PIN System + Auto Archiver)
 * ==============================================================================
 * Petunjuk Pemasangan di Google Apps Script:
 * 1. Buka Google Sheet Anda di Google Drive.
 * 2. Klik menu "Ekstensi" (Extensions) > "Apps Script".
 * 3. Di file default "Code.gs", hapus isinya dan tempel seluruh kode ini.
 * 4. Buat file HTML baru:
 *    - Klik tanda tambah (+) di samping Files > pilih "HTML".
 *    - Beri nama: index (otomatis menjadi index.html).
 *    - Tempelkan kode dari tab "index.html (Dashboard)" ke file tersebut.
 * 5. Klik ikon Save (Disket).
 * 6. Klik tombol "Terapkan" (Deploy) > "Penerapan baru" (New deployment):
 *    - Jenis: "Aplikasi web" (Web app).
 *    - Jalankan sebagai: "Saya" (Me / email Anda).
 *    - Siapa yang memiliki akses: "Siapa saja" (Anyone)  <--- WAJIB!
 * 7. Klik "Deploy", izinkan otorisasi akun Google.
 * ==============================================================================
 */

const SHEET_NAME_RESPONSES = "Data_Survei_Aeramo"; // Sheet Aktif Minggu Berjalan
const SHEET_NAME_ARCHIVE = "Arsip_Mingguan_Survei"; // Sheet Arsip Permanen
const SHEET_NAME_PINS = "PIN_PASIEN"; // Sheet Database PIN Akses Pasien
const SHEET_NAME_DASHBOARD = "Dashboard_IKM";

/**
 * Menu Kustom di Google Sheet untuk Petugas & Admin RSUD Aeramo
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("📊 SISEKAR RSUD Aeramo")
    .addItem("🔑 Buat 10 PIN Pasien Baru (Otomatis)", "generate10PinsMenu")
    .addItem("🔑 Buat 50 PIN Pasien Baru (Otomatis)", "generate50PinsMenu")
    .addItem("📋 Periksa & Siapkan Tab Sheet PIN_PASIEN", "setupPinSheetManual")
    .addSeparator()
    .addItem("🔄 Jalankan Rotasi & Arsip Mingguan", "rotasiMingguanOtomatis")
    .addItem("⚙️ Pasang Auto-Trigger Mingguan Otomatis", "setupWeeklyTrigger")
    .addSeparator()
    .addItem("📈 Perbarui Dashboard IKM", "refreshDashboardManually")
    .addToUi();
}

/**
 * Mencari Tab PIN di Google Sheet (Mendukung PIN_PASIEN, PIN PASIEN, PIN, Pin, dll.)
 */
function findPinSheet(ss) {
  let pinSheet = ss.getSheetByName(SHEET_NAME_PINS);
  if (pinSheet) return pinSheet;

  // Cek jika pengguna menamai tab lain seperti "PIN PASIEN", "PIN", "Pin", "Data PIN"
  const allSheets = ss.getSheets();
  for (let s = 0; s < allSheets.length; s++) {
    const name = allSheets[s].getName().toLowerCase().trim();
    if (name === "pin" || name.indexOf("pin") !== -1) {
      return allSheets[s];
    }
  }

  // Jika belum ada, buat tab PIN_PASIEN baru
  return ensurePinSheetExists(ss);
}

/**
 * Inisialisasi / Siapkan Header Tab Sheet PIN_PASIEN
 */
function setupPinSheetManual() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensurePinSheetExists(ss);
  SpreadsheetApp.getUi().alert("✓ Tab 'PIN_PASIEN' berhasil disiapkan & siap digunakan oleh seluruh pasien!");
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
    pinSheet.setColumnWidth(2, 120); // STATUS (AKTIF / NON AKTIF)
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
      ["'268907", "AKTIF", "CHATRINA HERLOFINA PANIE", "Rawat Inap", "Kamar Mawar 102", nowStr, "", "", "", "", "", "PIN Pasien Resmi RSUD Aeramo"],
      ["'582049", "AKTIF", "Pasien Poliklinik", "Rawat Jalan / Poliklinik", "Poli Penyakit Dalam", nowStr, "", "", "", "", "", "PIN Contoh Poli"],
      ["'746193", "AKTIF", "Pasien IGD 24 Jam", "IGD (Instalasi Gawat Darurat)", "Bed Triase", nowStr, "", "", "", "", "", "PIN Contoh IGD"],
      ["'391824", "AKTIF", "Pasien Farmasi / Apotek", "Farmasi / Apotek", "-", nowStr, "", "", "", "", "", "PIN Contoh Farmasi"],
      ["'829104", "AKTIF", "Ibu & Anak (VK)", "Kebidanan & Kandungan (Ruang Bersalin / VK)", "Kamar Bersalin", nowStr, "", "", "", "", "", "PIN Contoh VK"]
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
  const sheet = findPinSheet(ss);
  
  const existingValues = sheet.getLastRow() > 1 
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().map(function(r) { return String(r[0]).replace(/\\D/g, ""); })
    : [];
  const existingSet = {};
  existingValues.forEach(function(p) { existingSet[p] = true; });

  const rows = [];
  const nowStr = Utilities.formatDate(new Date(), "Asia/Makassar", "yyyy-MM-dd HH:mm:ss 'WITA'");

  for (let i = 0; i < count; i++) {
    let pinCode = String(Math.floor(100000 + Math.random() * 900000));
    while (existingSet[pinCode]) {
      pinCode = String(Math.floor(100000 + Math.random() * 900000));
    }
    existingSet[pinCode] = true;
    rows.push(["'" + pinCode, "AKTIF", "", "Rawat Inap", "", nowStr, "", "", "", "", "", defaultLabel || "Dibuat via Menu Google Sheet"]);
  }

  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 12).setValues(rows);
  }
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
    const rawPin = String(params.pin || "").trim().replace(/\\D/g, "");
    return ContentService.createTextOutput(JSON.stringify(validatePatientPinInSheet(rawPin)))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // 2. Mengambil Semua Daftar PIN dari Tab PIN_PASIEN
  if (action === "get_pins") {
    return ContentService.createTextOutput(JSON.stringify(getAllPinsFromSheet()))
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

  try {
    const template = HtmlService.createTemplateFromFile("index");
    return template.evaluate()
      .setTitle("Dashboard Survei Kepuasan Pasien - RSUD Aeramo")
      .addMetaTag("viewport", "width=device-width, initial-scale=1.0")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    return ContentService.createTextOutput(
      "Dashboard Eksekutif RSUD Aeramo Aktif. (Untuk tampilan visual lengkap, pastikan file HTML bernama 'index' sudah dibuat di Apps Script)."
    );
  }
}

/**
 * Logika Validasi PIN di Tab Sheet PIN_PASIEN
 */
function validatePatientPinInSheet(rawPin) {
  if (!rawPin || rawPin.length < 4) {
    return {
      valid: false,
      status: "invalid_format",
      message: "Format PIN tidak valid. Masukkan 6 digit angka."
    };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = findPinSheet(ss);
  
  if (sheet.getLastRow() <= 1) {
    return {
      valid: false,
      status: "not_found",
      message: "Belum ada PIN yang terdaftar di Google Sheet. Silakan hubungi petugas RSUD Aeramo."
    };
  }

  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, Math.max(sheet.getLastColumn(), 12)).getValues();
  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const pinInCell = String(row[0] || "").replace(/\\D/g, "");
    if (pinInCell === rawPin) {
      const statusRaw = String(row[1] || "").toUpperCase().trim();
      const regPatientName = String(row[2] || "").trim();
      const regService = String(row[3] || "").trim() || "Rawat Inap";
      const regRoom = String(row[4] || "").trim();
      const createdAt = String(row[5] || "");
      const usedAt = String(row[6] || "");
      const usedBy = String(row[7] || "");

      // Cek apakah status NON AKTIF / TERPAKAI / USED / REVOKED / TIDAK AKTIF
      const isNonAktif = statusRaw.indexOf("NON") !== -1 || 
                         statusRaw.indexOf("TERPAKAI") !== -1 || 
                         statusRaw.indexOf("USED") !== -1 || 
                         statusRaw.indexOf("REVOKED") !== -1 || 
                         statusRaw.indexOf("TIDAK") !== -1 || 
                         statusRaw.indexOf("MATI") !== -1 ||
                         statusRaw.indexOf("OFF") !== -1;

      if (isNonAktif) {
        return {
          valid: false,
          status: "used",
          pin: rawPin,
          registeredPatientName: regPatientName,
          registeredService: regService,
          registeredRoom: regRoom,
          label: regPatientName ? "Pasien: " + regPatientName : regService,
          usedAt: usedAt,
          usedBy: usedBy,
          message: "PIN ini sudah NON-AKTIF (sudah digunakan pada " + (usedAt || "sebelumnya") + (usedBy ? " oleh " + usedBy : "") + "). Sistem membatasi 1x pengisian per PIN demi keaslian data."
        };
      }

      // Status AKTIF / Valid
      return {
        valid: true,
        status: "active",
        pin: rawPin,
        registeredPatientName: regPatientName,
        registeredService: regService,
        registeredRoom: regRoom,
        label: regPatientName ? "Pasien: " + regPatientName : (regRoom ? regService + " (" + regRoom + ")" : regService),
        createdAt: createdAt,
        token: {
          id: "pin_sheet_" + (i + 2),
          pin: rawPin,
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
    message: "PIN tidak ditemukan di Google Sheet RSUD Aeramo. Pastikan nomor PIN benar sesuai yang diberikan petugas."
  };
}

/**
 * Mengambil Seluruh PIN dari Tab PIN_PASIEN dalam Format JSON
 */
function getAllPinsFromSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = findPinSheet(ss);
  if (sheet.getLastRow() <= 1) {
    return { success: true, pins: [] };
  }

  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, Math.max(sheet.getLastColumn(), 12)).getValues();
  const pins = [];
  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const cleanPin = String(row[0] || "").replace(/\\D/g, "");
    if (cleanPin) {
      const statusRaw = String(row[1] || "").toUpperCase().trim();
      const isUsed = statusRaw.indexOf("NON") !== -1 || statusRaw.indexOf("TERPAKAI") !== -1 || statusRaw.indexOf("USED") !== -1;
      const isRevoked = statusRaw.indexOf("REVOKED") !== -1 || statusRaw.indexOf("TIDAK") !== -1;
      const regName = String(row[2] || "").trim();
      const regSvc = String(row[3] || "").trim();
      const regRoom = String(row[4] || "").trim();
      pins.push({
        id: "pin_sheet_" + (i + 2),
        pin: cleanPin,
        status: isUsed ? "used" : (isRevoked ? "revoked" : "active"),
        registeredPatientName: regName,
        registeredService: regSvc,
        registeredRoom: regRoom,
        label: regName ? "Pasien: " + regName : (regRoom ? regSvc + " (" + regRoom + ")" : (regSvc || "Google Sheet")),
        createdAt: String(row[5] || ""),
        usedAt: String(row[6] || ""),
        usedBy: row[7] ? {
          namaPasien: String(row[7] || ""),
          jenisLayanan: String(row[8] || ""),
          ikmScore: Number(row[9]) || undefined,
          submissionId: String(row[10] || "")
        } : undefined,
        notes: String(row[11] || "")
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
      const cleanPin = String(data.pin || "").replace(/\\D/g, "");
      return ContentService.createTextOutput(JSON.stringify(validatePatientPinInSheet(cleanPin)))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // B. Tambahkan PIN Baru ke Sheet dari Admin Menu
    if (action === "create_pins" && Array.isArray(data.pins)) {
      const pinSheet = findPinSheet(ss);
      const rowsToAdd = [];
      const nowStr = Utilities.formatDate(new Date(), "Asia/Makassar", "yyyy-MM-dd HH:mm:ss 'WITA'");
      
      data.pins.forEach(function(p) {
        const pinCode = String(p.pin || p).replace(/\\D/g, "");
        if (pinCode) {
          rowsToAdd.push([
            "'" + pinCode,
            "AKTIF",
            p.registeredPatientName || "",
            p.registeredService || "Rawat Inap",
            p.registeredRoom || "",
            p.createdAt || nowStr,
            "",
            "",
            "",
            "",
            "",
            p.notes || "Dibuat dari Menu SISEKAR"
          ]);
        }
      });

      if (rowsToAdd.length > 0) {
        pinSheet.getRange(pinSheet.getLastRow() + 1, 1, rowsToAdd.length, 12).setValues(rowsToAdd);
      }

      lock.releaseLock();
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: "Berhasil menambahkan " + rowsToAdd.length + " PIN ke Google Sheet!",
        count: rowsToAdd.length
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

    const patientPinUsed = String(data.patientPin || data.pin || "").replace(/\\D/g, "");
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

    // OTOMATIS UBAH STATUS PIN MENJADI "NON AKTIF" DI GOOGLE SHEET!
    if (patientPinUsed) {
      markPinNonAktifInSheet(ss, patientPinUsed, {
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
      message: "Terima kasih! Survei kepuasan Anda berhasil dicatat ke Google Sheet RSUD Aeramo dan PIN telah dinonaktifkan.",
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
 * Mengubah Status PIN Menjadi "NON AKTIF" di Google Sheet
 */
function markPinNonAktifInSheet(ss, cleanPin, info) {
  try {
    const pinSheet = findPinSheet(ss);
    if (pinSheet.getLastRow() <= 1) return;

    const values = pinSheet.getRange(2, 1, pinSheet.getLastRow() - 1, 1).getValues();
    const nowStr = Utilities.formatDate(new Date(), "Asia/Makassar", "yyyy-MM-dd HH:mm:ss 'WITA'");

    for (let i = 0; i < values.length; i++) {
      const pinInCell = String(values[i][0] || "").replace(/\\D/g, "");
      if (pinInCell === cleanPin) {
        const rowIdx = i + 2;
        pinSheet.getRange(rowIdx, 2).setValue("NON AKTIF"); // Kolom 2: STATUS UBAH MENJADI NON AKTIF
        pinSheet.getRange(rowIdx, 7).setValue(nowStr); // Kolom 7: DIGUNAKAN_PADA
        pinSheet.getRange(rowIdx, 8).setValue(info.namaPasien || "-"); // Kolom 8: NAMA_RESPONDEN_SURVEI
        pinSheet.getRange(rowIdx, 9).setValue(info.jenisLayanan || "-"); // Kolom 9: LAYANAN_SURVEI
        pinSheet.getRange(rowIdx, 10).setValue(info.ikmScore || ""); // Kolom 10: SKOR_IKM
        pinSheet.getRange(rowIdx, 11).setValue(info.submissionId || ""); // Kolom 11: SUBMISSION_ID
        break;
      }
    }
  } catch (err) {
    Logger.log("Error marking PIN non-aktif in sheet: " + err);
  }
}

/**
 * Otomatisasi Rotasi & Arsip Mingguan (Weekly Data Maintenance)
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

  const currentWeekLabel = "Minggu-" + Utilities.formatDate(new Date(), "Asia/Makassar", "yyyy-'W'ww");
  const archiveRows = activeData.map(function(row) {
    return [currentWeekLabel].concat(row);
  });

  archiveSheet.getRange(archiveSheet.getLastRow() + 1, 1, archiveRows.length, archiveRows[0].length).setValues(archiveRows);
  activeSheet.deleteRows(2, lastRow - 1);
  updateDashboardSheet(ss);

  return "Berhasil memindahkan " + activeData.length + " data survei ke Sheet Arsip (" + currentWeekLabel + "). Sheet aktif kembali segar!";
}

function setupWeeklyTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "rotasiMingguanOtomatis") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  ScriptApp.newTrigger("rotasiMingguanOtomatis")
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(1)
    .inTimezone("Asia/Makassar")
    .create();
    
  SpreadsheetApp.getUi().alert("✓ Auto-Trigger Berhasil Diaktifkan! Setiap hari Senin pukul 01:00 WITA data survei akan otomatis diarsipkan.");
}

function refreshDashboardManually() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  updateDashboardSheet(ss);
  SpreadsheetApp.getUi().alert("✓ Dashboard IKM berhasil diperbarui!");
}

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
  <title>Dashboard Survei Kepuasan Pasien - RSUD Aeramo</title>
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

  <!-- Header Atas -->
  <header class="bg-gradient-to-r from-blue-900 via-blue-950 to-slate-900 text-white shadow-md sticky top-0 z-30">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-black text-xl text-white shadow-xs">
          ⚕️
        </div>
        <div>
          <h1 class="text-base sm:text-lg font-extrabold tracking-tight leading-tight">
            Dashboard Survei Kepuasan Pasien
          </h1>
          <p class="text-xs text-blue-200">
            RSUD Aeramo • Kabupaten Nagekeo
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end">
        <span class="text-[11px] text-blue-200 hidden md:inline">
          Sinkron Otomatis Google Sheets
        </span>
        <button
          onclick="fetchData()"
          id="btn-refresh"
          class="px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 active:scale-95 text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
        >
          <svg id="refresh-spinner" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          <span id="btn-refresh-text">Muat Ulang</span>
        </button>
        <button
          onclick="exportCSV()"
          id="btn-export-csv"
          class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold transition flex items-center gap-1.5"
        >
          <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <span>Ekspor CSV</span>
        </button>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

    <!-- Info Banner Panduan & Update Struktur Data -->
    <div class="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs">
      <div class="flex items-center gap-2">
        <span class="text-base">ℹ️</span>
        <div>
          <strong class="font-bold text-blue-900">Arsitektur Manajemen Mingguan Aktif:</strong>
          <span class="text-blue-800"> Data aktif minggu berjalan tersimpan di sheet <code>Data_Survei_Aeramo</code>, dan otomatis dirotasi ke <code>Arsip_Mingguan_Survei</code> agar sheet tetap ringan dan cepat tanpa menghapus data historis.</span>
        </div>
      </div>
      <div class="text-[11px] text-blue-700 whitespace-nowrap font-medium self-end sm:self-auto">
        Formula IKM: Skala 100 (KemenPAN-RB)
      </div>
    </div>

    <!-- KPI Ringkasan Eksekutif -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      
      <!-- Total Responden -->
      <div class="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 space-y-1">
        <p class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Responden</p>
        <div class="flex items-baseline gap-2">
          <span id="kpi-total" class="text-2xl sm:text-3xl font-black text-slate-900">0</span>
          <span class="text-xs text-slate-400">pasien</span>
        </div>
        <p class="text-[10px] text-slate-400 pt-1">Terakhir update: <span id="label-last-updated">-</span></p>
      </div>

      <!-- IKM (Skala 100) -->
      <div class="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 space-y-1">
        <p class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Indeks Kepuasan (IKM 100)</p>
        <div class="flex items-baseline gap-2">
          <span id="kpi-ikm" class="text-2xl sm:text-3xl font-black text-blue-700">0.00</span>
          <span class="text-xs text-slate-400">/ 100</span>
        </div>
        <div class="pt-1">
          <span id="kpi-mutu-badge" class="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-blue-100 text-blue-800">
            -
          </span>
        </div>
      </div>

      <!-- Skor Rata-Rata (1-4) -->
      <div class="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 space-y-1">
        <p class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Skor Rata-Rata</p>
        <div class="flex items-baseline gap-2">
          <span id="kpi-score" class="text-2xl sm:text-3xl font-black text-emerald-700">0.00</span>
          <span class="text-xs text-slate-400">/ 4.00</span>
        </div>
        <p class="text-[10px] text-slate-500 pt-1">Skala Likert Kuesioner</p>
      </div>

      <!-- Tingkat Kepuasan % -->
      <div class="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 space-y-1">
        <p class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tingkat Pasien Puas</p>
        <div class="flex items-baseline gap-2">
          <span id="kpi-puas-rate" class="text-2xl sm:text-3xl font-black text-indigo-700">0%</span>
        </div>
        <p class="text-[10px] text-slate-500 pt-1">Responden nilai &gt;= 3.00 (Baik/Sangat Baik)</p>
      </div>

    </div>

    <!-- Grafik Visualisasi Data -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Grafik Rata-Rata 7 Unsur Pelayanan -->
      <div class="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 lg:col-span-2 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-bold text-slate-900 text-sm sm:text-base">Rata-Rata Aspek Pelayanan Rawat Inap (Skala 1 - 4)</h3>
            <p class="text-xs text-slate-500">Perbandingan skor 7 unsur kepuasan pasien RSUD Aeramo</p>
          </div>
          <span class="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 font-semibold text-slate-600">Q1 s/d Q7</span>
        </div>
        <div class="relative h-64 sm:h-72 w-full">
          <canvas id="chartUnsur"></canvas>
        </div>
      </div>

      <!-- Donut Chart Distribusi Mutu -->
      <div class="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-200/80 space-y-4">
        <div>
          <h3 class="font-bold text-slate-900 text-sm sm:text-base">Distribusi Mutu Pelayanan</h3>
          <p class="text-xs text-slate-500">Kategori mutu berdasarkan standar IKM</p>
        </div>
        <div class="relative h-64 w-full flex items-center justify-center">
          <canvas id="chartMutu"></canvas>
        </div>
      </div>

    </div>

    <!-- Tabel Data Responden -->
    <div class="bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden space-y-4">
      
      <!-- Bar Filter & Pencarian -->
      <div class="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 class="font-bold text-slate-900 text-base flex items-center gap-2">
            <span>Daftar Jawaban Responden Pasien</span>
            <span id="label-count-filtered" class="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">0</span>
            <span class="text-xs text-slate-400 font-normal">dari <span id="label-count-total">0</span> total</span>
          </h3>
          <p class="text-xs text-slate-500">Klik salah satu baris untuk melihat rincian lengkap kuesioner pasien</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <!-- Filter Layanan -->
          <select
            id="filter-layanan"
            onchange="applyFilters()"
            class="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Semua Unit Layanan</option>
            <option value="Rawat Inap">Rawat Inap</option>
            <option value="Radiologi">Radiologi</option>
            <option value="Rawat Jalan">Rawat Jalan</option>
            <option value="IGD">IGD (Gawat Darurat)</option>
            <option value="Farmasi">Farmasi / Obat</option>
            <option value="Laboratorium">Laboratorium</option>
            <option value="Kebidanan">Kebidanan & Kandungan</option>
            <option value="Lainnya">Lainnya</option>
          </select>

          <!-- Filter Mutu -->
          <select
            id="filter-mutu"
            onchange="applyFilters()"
            class="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Semua Predikat Mutu</option>
            <option value="A">Sangat Baik (A)</option>
            <option value="B">Baik (B)</option>
            <option value="C">Cukup (C)</option>
            <option value="D">Kurang Baik (D)</option>
          </select>

          <!-- Input Cari -->
          <input
            type="text"
            id="input-search"
            oninput="applyFilters()"
            placeholder="Cari nama / tanggal..."
            class="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-44 sm:w-56"
          />
        </div>
      </div>

      <!-- Container Tabel Responsif -->
      <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-100/80 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
            <tr>
              <th class="py-3 px-3">Waktu / Tgl</th>
              <th class="py-3 px-3">Nama Pasien</th>
              <th class="py-3 px-3">Demografi</th>
              <th class="py-3 px-3">Layanan</th>
              <th class="py-3 px-2 text-center">Q1 Kamar</th>
              <th class="py-3 px-2 text-center">Q2 Bersih</th>
              <th class="py-3 px-2 text-center">Q3 Fasilitas</th>
              <th class="py-3 px-2 text-center">Q4 Tenang</th>
              <th class="py-3 px-2 text-center">Q5 Dokter</th>
              <th class="py-3 px-2 text-center">Q6 Info</th>
              <th class="py-3 px-2 text-center">Q7 Perawat</th>
              <th class="py-3 px-2 text-center">Rata-rata</th>
              <th class="py-3 px-2 text-center">IKM (100)</th>
              <th class="py-3 px-2 text-center">Mutu</th>
              <th class="py-3 px-3">Saran / Masukan</th>
            </tr>
          </thead>
          <tbody id="table-body" class="divide-y divide-slate-100 font-medium text-slate-700">
            <tr>
              <td colspan="15" class="py-12 text-center text-slate-400">
                Memuat data survei dari Google Sheets...
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>

  </main>

  <script>
    var rawData = null;
    var filteredList = [];
    var chartUnsurInstance = null;
    var chartMutuInstance = null;

    document.addEventListener('DOMContentLoaded', function() {
      fetchData();
    });

    function fetchData() {
      var btn = document.getElementById('btn-refresh');
      var spinner = document.getElementById('refresh-spinner');
      var btnText = document.getElementById('btn-refresh-text');

      if (btnText) btnText.innerText = 'Memuat...';
      if (spinner) spinner.classList.add('animate-spin');

      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(data) {
            handleDataLoaded(data);
            if (btnText) btnText.innerText = 'Muat Ulang';
            if (spinner) spinner.classList.remove('animate-spin');
          })
          .withFailureHandler(function(err) {
            alert('Gagal mengambil data dari Google Sheets: ' + err);
            if (btnText) btnText.innerText = 'Muat Ulang';
            if (spinner) spinner.classList.remove('animate-spin');
          })
          .getDashboardData();
      } else {
        if (btnText) btnText.innerText = 'Muat Ulang';
        if (spinner) spinner.classList.remove('animate-spin');
      }
    }

    function handleDataLoaded(data) {
      rawData = data;
      filteredList = data.recentResponses || [];

      document.getElementById('kpi-total').innerText = data.totalResponden || 0;
      document.getElementById('kpi-ikm').innerText = (data.avgIkm || 0).toFixed(2);
      document.getElementById('kpi-score').innerText = (data.avgScore || 0).toFixed(2);
      document.getElementById('kpi-puas-rate').innerText = (data.kepuasanRate || 0) + '%';
      document.getElementById('label-last-updated').innerText = data.lastUpdated || '-';

      var badge = document.getElementById('kpi-mutu-badge');
      if (badge) {
        badge.innerText = data.mutuPelayanan || '-';
        if (data.avgIkm >= 88.3) {
          badge.className = 'px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-emerald-100 text-emerald-800';
        } else if (data.avgIkm >= 76.6) {
          badge.className = 'px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-blue-100 text-blue-800';
        } else if (data.avgIkm >= 65) {
          badge.className = 'px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-amber-100 text-amber-800';
        } else {
          badge.className = 'px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-rose-100 text-rose-800';
        }
      }

      renderCharts(data);
      applyFilters();
    }

    function renderCharts(data) {
      var ctxUnsur = document.getElementById('chartUnsur');
      if (ctxUnsur) {
        if (chartUnsurInstance) chartUnsurInstance.destroy();
        var u = data.unsurScores || { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, q7: 0 };
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
  </script>
</body>
</html>
`;
