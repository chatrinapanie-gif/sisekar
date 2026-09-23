/**
 * Kode Google Apps Script (Code.gs & index.html) siap pakai untuk Google Sheets.
 * Dilengkapi Sistem Manajemen PIN Multi-Device & Rotasi Mingguan Otomatis:
 * 1. "Data_Survei_Aeramo" (Data minggu berjalan, cepat & ringan)
 * 2. "Arsip_Mingguan_Survei" (Penyimpanan historis permanen, data aman tidak terhapus)
 * 3. "PIN_PASIEN" (Database PIN Akses Pasien & Status AKTIF / NON AKTIF)
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
 * 6. Klik tombol "Terapkan" (Deploy) > "Kelola penerapan" (Manage deployments) > Edit (Ikon Pensil) > Versi: "Versi baru" (New version) > Klik "Terapkan" (Deploy).
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
  if (!ss) return null;
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
  if (!ss) return null;
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
  if (!ss) return;
  const sheet = findPinSheet(ss);
  if (!sheet) return;
  
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
 * Fungsi untuk Input / Tambah 1 PIN Pasien dari Halaman Web index.html
 */
function addNewPatientPinDirect(patientName, service, room, notes, customPin) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) {
      return { success: false, message: "Spreadsheet tidak terhubung. Buka Ekstensi > Apps Script di dalam Sheet Anda." };
    }
    const sheet = findPinSheet(ss);
    if (!sheet) {
      return { success: false, message: "Tab PIN_PASIEN tidak ditemukan." };
    }

    const nowStr = Utilities.formatDate(new Date(), "Asia/Makassar", "yyyy-MM-dd HH:mm:ss 'WITA'");

    let finalPin = String(customPin || "").trim().replace(/\\D/g, "");
    if (!finalPin || finalPin.length < 4) {
      finalPin = String(Math.floor(100000 + Math.random() * 900000));
    }

    // Pastikan tidak duplikat
    const existingValues = sheet.getLastRow() > 1 
      ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().map(function(r) { return String(r[0]).replace(/\\D/g, ""); })
      : [];
    if (existingValues.indexOf(finalPin) !== -1) {
      return { success: false, message: "PIN " + finalPin + " sudah pernah terdaftar di sheet. Silakan gunakan PIN lain." };
    }

    const newRow = [
      "'" + finalPin,
      "AKTIF",
      String(patientName || "").trim(),
      String(service || "Rawat Inap").trim(),
      String(room || "").trim(),
      nowStr,
      "",
      "",
      "",
      "",
      "",
      String(notes || "Input dari Web Dashboard Admin").trim()
    ];

    sheet.appendRow(newRow);
    return {
      success: true,
      message: "PIN " + finalPin + " berhasil didaftarkan untuk " + (patientName || "Pasien Baru") + "!",
      pin: finalPin
    };
  } catch (err) {
    return { success: false, message: "Gagal menyimpan PIN: " + err.toString() };
  }
}

/**
 * Fungsi untuk Batch Generate PIN dari Halaman Web index.html
 */
function generateBatchPinsDirect(count, label) {
  try {
    const num = Math.min(Math.max(Number(count) || 10, 1), 100);
    generatePinsInSheet(num, label || "Batch dari Web Admin");
    return { success: true, count: num, message: "Berhasil membuat " + num + " PIN baru!" };
  } catch (err) {
    return { success: false, message: "Gagal membuat batch PIN: " + err.toString() };
  }
}

/**
 * Fungsi untuk Mengubah Status PIN (AKTIF / NON AKTIF) dari Web index.html
 */
function togglePinStatus(pinToChange, newStatus) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return { success: false, message: "Spreadsheet tidak terdeteksi" };
    const sheet = findPinSheet(ss);
    if (!sheet || sheet.getLastRow() <= 1) return { success: false, message: "Sheet kosong" };

    const cleanPin = String(pinToChange || "").replace(/\\D/g, "");
    const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();

    for (let i = 0; i < values.length; i++) {
      const pinInCell = String(values[i][0] || "").replace(/\\D/g, "");
      if (pinInCell === cleanPin) {
        const rowIdx = i + 2;
        sheet.getRange(rowIdx, 2).setValue(newStatus);
        return { success: true, message: "Status PIN " + cleanPin + " diubah menjadi " + newStatus };
      }
    }
    return { success: false, message: "PIN tidak ditemukan" };
  } catch (err) {
    return { success: false, message: err.toString() };
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
  if (params.api === "true" || action === "get_dashboard_data" || action === "stats") {
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
      status: "invalid",
      message: "Format PIN tidak valid. Masukkan 6 digit angka PIN pasien Anda."
    };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    return { valid: false, status: "error", message: "Database spreadsheet tidak terhubung." };
  }
  const sheet = findPinSheet(ss);
  
  if (!sheet || sheet.getLastRow() <= 1) {
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
          patientName: regPatientName || undefined,
          service: regService,
          room: regRoom || undefined,
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
        patientName: regPatientName || undefined,
        service: regService,
        room: regRoom || undefined,
        createdAt: createdAt,
        label: regPatientName ? "Pasien: " + regPatientName : (regService + (regRoom ? " - " + regRoom : "")),
        message: "PIN Valid. Selamat mengisi Survei Kepuasan Pasien RSUD Aeramo."
      };
    }
  }

  return {
    valid: false,
    status: "not_found",
    pin: rawPin,
    message: "PIN (" + rawPin + ") tidak ditemukan di daftar pasien terdaftar Google Sheet. Periksa kembali atau minta PIN baru ke petugas."
  };
}

/**
 * Mengambil Semua Data PIN dari Tab Sheet
 */
function getAllPinsFromSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return { success: true, pins: [] };
  const sheet = findPinSheet(ss);
  if (!sheet || sheet.getLastRow() <= 1) {
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
        statusRaw: statusRaw || "AKTIF",
        registeredPatientName: regName,
        registeredService: regSvc,
        registeredRoom: regRoom,
        createdAt: String(row[5] || ""),
        usedAt: String(row[6] || ""),
        usedByPatientName: String(row[7] || ""),
        usedByService: String(row[8] || ""),
        ikmScore: String(row[9] || ""),
        notes: String(row[11] || "")
      });
    }
  }
  return { success: true, count: pins.length, pins: pins };
}

/**
 * Melayani Pengiriman Data Survei & Tambah PIN via HTTP POST
 */
function doPost(e) {
  try {
    const lock = LockService.getScriptLock();
    lock.waitLock(30000); // Mencegah tabrakan penginputan serentak

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error("Spreadsheet tidak terdeteksi");

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

    // B. Tambahkan 1 PIN Baru (Single PIN) via POST
    if (action === "add_single_pin") {
      const res = addNewPatientPinDirect(data.patientName, data.service, data.room, data.notes, data.pin);
      lock.releaseLock();
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // C. Ubah Status PIN via POST
    if (action === "toggle_pin") {
      const res = togglePinStatus(data.pin, data.status);
      lock.releaseLock();
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // D. Tambahkan PIN Batch Baru ke Sheet
    if (action === "create_pins") {
      if (Array.isArray(data.pins)) {
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
      } else if (data.count) {
        const res = generateBatchPinsDirect(data.count, data.label);
        lock.releaseLock();
        return ContentService.createTextOutput(JSON.stringify(res))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    // E. Tangani ping uji koneksi
    if (data.test === true || data.namaPasien === "UJI_KONEKSI_SISTEM" || data.namaPasien === "DIAGNOSTIC_PING") {
      lock.releaseLock();
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        mode: "online",
        message: "Koneksi Google Apps Script RSUD Aeramo aktif & siap menerima data survei."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // F. Simpan Hasil Survei Pasien
    let sheet = ss.getSheetByName(SHEET_NAME_RESPONSES);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME_RESPONSES);
      setupHeaders(sheet, false);
    } else {
      checkAndUpgradeHeaders(sheet);
    }

    const answers = data.answers || {};
    const answeredDetails = data.answeredDetails || [];

    const q1 = answers.q1 || answers.aspek1 || data.q1 || "";
    const q2 = answers.q2 || answers.aspek2 || data.q2 || "";
    const q3 = answers.q3 || answers.aspek3 || data.q3 || "";
    const q4 = answers.q4 || answers.aspek4 || data.q4 || "";
    const q5 = answers.q5 || answers.aspek5 || data.q5 || "";
    const q6 = answers.q6 || answers.aspek6 || data.q6 || "";
    const q7 = answers.q7 || answers.aspek7 || data.q7 || "";

    let answerValues = [q1, q2, q3, q4, q5, q6, q7].map(Number).filter(function(v) { return !isNaN(v) && v > 0; });
    if (answerValues.length === 0 && typeof answers === "object") {
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
    if (!pinSheet || pinSheet.getLastRow() <= 1) return;

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
  if (!ss) return "Spreadsheet tidak ditemukan";
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
  if (ss) {
    updateDashboardSheet(ss);
    SpreadsheetApp.getUi().alert("✓ Dashboard IKM berhasil diperbarui!");
  }
}

function getDashboardData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    return { totalResponden: 0, avgIkm: 0, avgScore: 0, mutuPelayanan: "-", unsurScores: { q1:0, q2:0, q3:0, q4:0, q5:0, q6:0, q7:0 }, mutuDist: {a:0,b:0,c:0,d:0}, recentResponses: [] };
  }
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
  <title>Portal Admin & Dashboard IKM - RSUD Aeramo</title>
  <!-- Tailwind CSS & Chart.js -->
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
<body class="bg-slate-100 text-slate-800 min-h-screen flex flex-col">

  <!-- Header Atas Dashboard Eksekutif -->
  <header class="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white shadow-lg sticky top-0 z-40 border-b border-blue-900/50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class="flex items-center gap-3.5">
        <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 border border-white/20 flex items-center justify-center font-black text-2xl text-white shadow-md shadow-blue-900/40">
          🏥
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-lg sm:text-xl font-extrabold tracking-tight text-white leading-tight">
              SISEKAR RSUD Aeramo
            </h1>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              Admin Portal
            </span>
          </div>
          <p class="text-xs text-blue-200/90 font-medium">
            Sistem Informasi Survei Kepuasan Pasien • Kabupaten Nagekeo
          </p>
        </div>
      </div>

      <!-- Tab Navigasi Utama -->
      <div class="flex flex-wrap items-center gap-1.5 bg-white/10 p-1.5 rounded-xl border border-white/10 backdrop-blur-md self-stretch md:self-auto">
        <button
          onclick="switchTab('dashboard')"
          id="nav-tab-dashboard"
          class="px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 bg-blue-600 text-white shadow-sm"
        >
          <span>📊</span>
          <span>Dashboard IKM</span>
        </button>

        <button
          onclick="switchTab('pins')"
          id="nav-tab-pins"
          class="px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 text-slate-200 hover:text-white hover:bg-white/10"
        >
          <span>🔑</span>
          <span>Kelola & Input PIN</span>
          <span id="badge-active-pins" class="px-1.5 py-0.2 bg-emerald-500 text-white text-[10px] rounded-full font-black hidden">0</span>
        </button>

        <button
          onclick="switchTab('responses')"
          id="nav-tab-responses"
          class="px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 text-slate-200 hover:text-white hover:bg-white/10"
        >
          <span>📋</span>
          <span>Data Responden</span>
        </button>

        <button
          onclick="refreshAllData()"
          id="btn-global-refresh"
          title="Sinkronisasi Data Google Sheet"
          class="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        </button>
      </div>
    </div>
  </header>

  <!-- Konten Utama -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 flex-1 w-full">

    <!-- Toast Notifikasi -->
    <div id="toast-alert" class="hidden fixed bottom-5 right-5 z-50 p-4 rounded-2xl shadow-2xl border text-sm font-semibold max-w-md transition-all duration-300"></div>

    <!-- ========================================================================= -->
    <!-- TAB 1: DASHBOARD STATISTIK & GRAFIK IKM -->
    <!-- ========================================================================= -->
    <section id="section-dashboard" class="space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Responden</span>
            <span class="text-xl">👥</span>
          </div>
          <div class="text-3xl font-extrabold text-slate-900 mt-2" id="kpi-total">-</div>
          <span class="text-[11px] text-slate-500 mt-1 block">Pasien mengisi kuesioner</span>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Indeks IKM (Skala 100)</span>
            <span class="text-xl">⭐</span>
          </div>
          <div class="text-3xl font-extrabold text-blue-700 mt-2" id="kpi-ikm">-</div>
          <span class="text-[11px] font-bold text-blue-600 mt-1 block" id="kpi-mutu">Mutu Pelayanan: -</span>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Rata-Rata Skor</span>
            <span class="text-xl">📊</span>
          </div>
          <div class="text-3xl font-extrabold text-slate-900 mt-2" id="kpi-score">-</div>
          <span class="text-[11px] text-slate-500 mt-1 block">Dari skala 4.00</span>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Tingkat Kepuasan</span>
            <span class="text-xl">👍</span>
          </div>
          <div class="text-3xl font-extrabold text-emerald-600 mt-2" id="kpi-puas">-</div>
          <span class="text-[11px] text-emerald-700 mt-1 block font-medium">Persentase pasien puas (Skor >= 3)</span>
        </div>
      </div>

      <!-- Grafik Visual -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs lg:col-span-2">
          <h3 class="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
            <span>📈</span>
            <span>Skor Rata-Rata per Aspek Pelayanan (Skala 1 - 4)</span>
          </h3>
          <p class="text-xs text-slate-500 mb-4">Evaluasi 7 aspek layanan RSUD Aeramo</p>
          <div class="h-64">
            <canvas id="aspectBarChart"></canvas>
          </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 class="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
              <span>🎯</span>
              <span>Distribusi Mutu IKM</span>
            </h3>
            <p class="text-xs text-slate-500 mb-4">KemenPAN-RB (A, B, C, D)</p>
            <div class="h-48 flex items-center justify-center">
              <canvas id="mutuDoughnutChart"></canvas>
            </div>
          </div>
          <div class="text-[11px] text-slate-500 pt-3 border-t border-slate-100 flex justify-around">
            <span class="text-emerald-700 font-semibold">A: Sangat Baik</span>
            <span class="text-blue-700 font-semibold">B: Baik</span>
            <span class="text-amber-700 font-semibold">C: Cukup</span>
            <span class="text-red-700 font-semibold">D: Kurang</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ========================================================================= -->
    <!-- TAB 2: MANAJEMEN & INPUT PIN PASIEN (DI SINI TEMPAT INPUT PIN) -->
    <!-- ========================================================================= -->
    <section id="section-pins" class="space-y-6 hidden">
      <!-- Banner Penjelasan -->
      <div class="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 class="text-base font-bold flex items-center gap-2">
            <span>🔑</span>
            <span>Registrasi & Pengelolaan PIN Pasien Multi-Device</span>
          </h2>
          <p class="text-xs text-blue-200 mt-1 max-w-2xl">
            Input atau generate 6 digit PIN untuk pasien. Pasien memasukkan PIN ini di perangkat HP mereka. Setelah survei terkirim, status PIN otomatis berganti menjadi <strong>"NON AKTIF"</strong> di Google Sheet.
          </p>
        </div>

        <!-- Tombol Buat Cepat Batch -->
        <div class="flex items-center gap-2">
          <button
            onclick="generateBatchPins(10)"
            id="btn-batch-10"
            class="px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <span>✨</span>
            <span>Buat 10 PIN Instan</span>
          </button>
          <button
            onclick="generateBatchPins(50)"
            id="btn-batch-50"
            class="px-3.5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 active:scale-95"
          >
            <span>⚡</span>
            <span>Buat 50 PIN</span>
          </button>
        </div>
      </div>

      <!-- FORM INPUT PIN PASIEN BARU -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <h3 class="font-extrabold text-slate-900 text-sm sm:text-base mb-1 flex items-center gap-2">
          <span class="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">1</span>
          <span>Formulir Pendaftaran PIN Pasien Baru</span>
        </h3>
        <p class="text-xs text-slate-500 mb-5">
          Daftarkan pasien yang akan mengisi survei. PIN bisa di-generate acak otomatis atau Anda tentukan sendiri.
        </p>

        <form id="form-new-pin" onsubmit="handleAddNewPin(event)" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Nama Pasien -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5">
              Nama Pasien <span class="text-slate-400 font-normal">(Opsional)</span>
            </label>
            <input
              type="text"
              id="input-patient-name"
              placeholder="Contoh: Chatrina H. Panie"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <!-- Unit Layanan -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5">
              Unit / Jenis Pelayanan
            </label>
            <select
              id="input-service"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
            >
              <option value="Rawat Inap">Rawat Inap</option>
              <option value="Rawat Jalan / Poliklinik">Rawat Jalan / Poliklinik</option>
              <option value="IGD (Instalasi Gawat Darurat)">IGD (Gawat Darurat 24 Jam)</option>
              <option value="Kebidanan & Kandungan (Ruang Bersalin / VK)">Kebidanan & Kandungan (VK)</option>
              <option value="ICU / HCU">ICU / HCU</option>
              <option value="Laboratorium">Laboratorium</option>
              <option value="Radiologi">Radiologi</option>
              <option value="Farmasi / Apotek">Farmasi / Apotek</option>
              <option value="Fisioterapi / Rehabilitasi Medik">Fisioterapi</option>
            </select>
          </div>

          <!-- Kamar / Ruangan -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5">
              Kamar / Ruangan / Bed
            </label>
            <input
              type="text"
              id="input-room"
              placeholder="Contoh: Mawar 102 / Bed 3"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <!-- PIN (Otomatis / Kustom) -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Kode PIN (6 Digit)</span>
              <button
                type="button"
                onclick="generateRandomInputPin()"
                class="text-blue-600 hover:text-blue-800 text-[11px] font-bold flex items-center gap-1"
              >
                <span>🎲 Acak PIN</span>
              </button>
            </label>
            <input
              type="text"
              id="input-pin-code"
              maxlength="6"
              placeholder="6 Digit PIN"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold tracking-widest text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <!-- Catatan & Tombol Simpan -->
          <div class="sm:col-span-2 lg:col-span-3">
            <input
              type="text"
              id="input-notes"
              placeholder="Catatan / Keterangan tambahan (Contoh: Pasien Pulang Hari Ini)"
              class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div class="flex items-end">
            <button
              type="submit"
              id="btn-submit-new-pin"
              class="w-full py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-95"
            >
              <span id="btn-submit-spinner" class="hidden">⏳</span>
              <span id="btn-submit-icon">💾</span>
              <span id="btn-submit-text">Daftarkan PIN ke Sheet</span>
            </button>
          </div>
        </form>
      </div>

      <!-- TABEL DAFTAR SEMUA PIN -->
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div class="p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 class="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">2</span>
              <span>Database PIN Pasien Terdaftar di Google Sheet</span>
            </h3>
            <p class="text-xs text-slate-500">
              Live status langsung dari tab <code>PIN_PASIEN</code> di Google Spreadsheet.
            </p>
          </div>

          <!-- Filter & Pencarian -->
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <select
              id="filter-pin-status"
              onchange="renderPinTable()"
              class="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="ALL">Semua Status</option>
              <option value="active">Hanya AKTIF</option>
              <option value="used">Hanya NON AKTIF / Digunakan</option>
            </select>

            <input
              type="text"
              id="search-pin"
              oninput="renderPinTable()"
              placeholder="Cari nama / PIN..."
              class="px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none w-36 sm:w-48"
            />
          </div>
        </div>

        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-left text-xs text-slate-600">
            <thead class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th class="px-4 py-3.5">PIN</th>
                <th class="px-4 py-3.5">Status</th>
                <th class="px-4 py-3.5">Nama Pasien</th>
                <th class="px-4 py-3.5">Layanan & Kamar</th>
                <th class="px-4 py-3.5">Dibuat Pada</th>
                <th class="px-4 py-3.5">Digunakan Pada / Oleh</th>
                <th class="px-4 py-3.5 text-center">Aksi Petugas</th>
              </tr>
            </thead>
            <tbody id="pin-table-body" class="divide-y divide-slate-100">
              <tr>
                <td colspan="7" class="px-4 py-8 text-center text-slate-400 font-medium">Memuat data PIN dari Google Sheet...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- ========================================================================= -->
    <!-- TAB 3: DATA RESPONDEN & TANGGAPAN SURVEI -->
    <!-- ========================================================================= -->
    <section id="section-responses" class="space-y-6 hidden">
      <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div class="p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 class="font-extrabold text-slate-900 text-sm sm:text-base">
              Riwayat Lengkap Kuesioner Masuk
            </h3>
            <p class="text-xs text-slate-500">
              Data tersinkronisasi otomatis dari sheet <code>Data_Survei_Aeramo</code>.
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button
              onclick="exportToCSV()"
              class="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <span>📥</span>
              <span>Ekspor CSV / Excel</span>
            </button>
          </div>
        </div>

        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-left text-xs text-slate-600">
            <thead class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th class="px-4 py-3.5">Waktu</th>
                <th class="px-4 py-3.5">Nama Pasien</th>
                <th class="px-4 py-3.5">Jenis Layanan</th>
                <th class="px-4 py-3.5">Rata-Rata Skor</th>
                <th class="px-4 py-3.5">Indeks IKM</th>
                <th class="px-4 py-3.5">Mutu</th>
                <th class="px-4 py-3.5">Saran / Masukan</th>
                <th class="px-4 py-3.5">Perangkat</th>
              </tr>
            </thead>
            <tbody id="response-table-body" class="divide-y divide-slate-100">
              <tr>
                <td colspan="8" class="px-4 py-8 text-center text-slate-400">Memuat data respon...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

  </main>

  <!-- Footer -->
  <footer class="bg-white border-t border-slate-200/80 py-4 px-6 text-center text-xs text-slate-500 mt-auto">
    <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
      <div>
        <strong>RSUD Aeramo</strong> • Kabupaten Nagekeo, Nusa Tenggara Timur
      </div>
      <div class="text-slate-400">
        SISEKAR Pelayanan Pasien • Sistem Keamanan Terintegrasi PIN Sekali Pakai
      </div>
    </div>
  </footer>

  <!-- JAVASCRIPT ENGINE UNTUK DASHBOARD & PIN MANAGEMENT -->
  <script>
    let globalDashboardData = null;
    let globalPinsList = [];
    let aspectChartInstance = null;
    let mutuChartInstance = null;

    function showToast(message, type) {
      const el = document.getElementById('toast-alert');
      el.className = 'fixed bottom-5 right-5 z-50 p-4 rounded-2xl shadow-2xl border text-xs font-bold max-w-md transition-all duration-300 ' +
        (type === 'error' ? 'bg-red-50 text-red-900 border-red-200' : 'bg-emerald-50 text-emerald-900 border-emerald-200');
      el.innerHTML = (type === 'error' ? '⚠️ ' : '✓ ') + message;
      el.classList.remove('hidden');
      setTimeout(() => el.classList.add('hidden'), 4000);
    }

    function setButtonLoading(btnId, isLoading, defaultText) {
      const btn = document.getElementById(btnId);
      if (!btn) return;
      btn.disabled = isLoading;
      if (isLoading) {
        btn.classList.add('opacity-75', 'cursor-wait');
        const textSpan = document.getElementById(btnId + '-text') || btn;
        if (textSpan) textSpan.innerText = 'Menyimpan ke Sheet...';
      } else {
        btn.classList.remove('opacity-75', 'cursor-wait');
        const textSpan = document.getElementById(btnId + '-text') || btn;
        if (textSpan) textSpan.innerText = defaultText || 'Daftarkan PIN ke Sheet';
      }
    }

    function switchTab(tabId) {
      document.getElementById('section-dashboard').classList.toggle('hidden', tabId !== 'dashboard');
      document.getElementById('section-pins').classList.toggle('hidden', tabId !== 'pins');
      document.getElementById('section-responses').classList.toggle('hidden', tabId !== 'responses');

      const tabs = ['dashboard', 'pins', 'responses'];
      tabs.forEach(t => {
        const btn = document.getElementById('nav-tab-' + t);
        if (t === tabId) {
          btn.className = 'px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 bg-blue-600 text-white shadow-sm';
        } else {
          btn.className = 'px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 text-slate-200 hover:text-white hover:bg-white/10';
        }
      });

      if (tabId === 'pins') {
        fetchPinsData();
      }
    }

    function generateRandomInputPin() {
      const pin = String(Math.floor(100000 + Math.random() * 900000));
      document.getElementById('input-pin-code').value = pin;
    }

    function refreshAllData() {
      fetchDashboardData();
      fetchPinsData();
    }

    function fetchDashboardData() {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(data) {
            globalDashboardData = data;
            renderDashboard(data);
          })
          .withFailureHandler(function(err) {
            showToast('Gagal memuat dashboard: ' + err.message, 'error');
          })
          .getDashboardData();
      }
    }

    function fetchPinsData() {
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(res) {
            if (res && res.pins) {
              globalPinsList = res.pins;
              renderPinTable();
              updatePinBadges();
            }
          })
          .withFailureHandler(function(err) {
            showToast('Gagal mengambil daftar PIN: ' + err.message, 'error');
          })
          .getAllPinsFromSheet();
      }
    }

    function renderDashboard(data) {
      if (!data) return;
      document.getElementById('kpi-total').innerText = data.totalResponden || 0;
      document.getElementById('kpi-ikm').innerText = data.avgIkm || 0;
      document.getElementById('kpi-mutu').innerText = 'Mutu: ' + (data.mutuPelayanan || '-');
      document.getElementById('kpi-score').innerText = (data.avgScore || 0) + ' / 4.00';
      document.getElementById('kpi-puas').innerText = (data.kepuasanRate || 0) + '%';

      // Bar Chart Skor Aspek
      const ctxBar = document.getElementById('aspectBarChart').getContext('2d');
      if (aspectChartInstance) aspectChartInstance.destroy();
      aspectChartInstance = new Chart(ctxBar, {
        type: 'bar',
        data: {
          labels: ['Kamar & Bed', 'Kebersihan', 'Fasilitas', 'Kenyamanan', 'Kunjungan Dokter', 'Informasi Medis', 'Kesiapan Perawat'],
          datasets: [{
            label: 'Skor Mutu (1-4)',
            data: [
              data.unsurScores.q1,
              data.unsurScores.q2,
              data.unsurScores.q3,
              data.unsurScores.q4,
              data.unsurScores.q5,
              data.unsurScores.q6,
              data.unsurScores.q7
            ],
            backgroundColor: '#2563eb',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { min: 0, max: 4, ticks: { stepSize: 1 } }
          }
        }
      });

      // Doughnut Chart Mutu
      const ctxMutu = document.getElementById('mutuDoughnutChart').getContext('2d');
      if (mutuChartInstance) mutuChartInstance.destroy();
      mutuChartInstance = new Chart(ctxMutu, {
        type: 'doughnut',
        data: {
          labels: ['Sangat Baik (A)', 'Baik (B)', 'Cukup (C)', 'Kurang (D)'],
          datasets: [{
            data: [data.mutuDist.a, data.mutuDist.b, data.mutuDist.c, data.mutuDist.d],
            backgroundColor: ['#059669', '#2563eb', '#d97706', '#dc2626']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });

      // Render Respon Tabel
      const tbody = document.getElementById('response-table-body');
      tbody.innerHTML = '';
      if (!data.recentResponses || data.recentResponses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-8 text-center text-slate-400">Belum ada survei yang masuk.</td></tr>';
        return;
      }

      data.recentResponses.forEach(function(r) {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition';
        tr.innerHTML = \`
          <td class="px-4 py-3 whitespace-nowrap text-slate-700 font-medium">\${r.timestamp}</td>
          <td class="px-4 py-3 font-bold text-slate-900">\${r.namaPasien || '(Anonim)'}</td>
          <td class="px-4 py-3"><span class="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium text-[11px]">\${r.jenisLayanan}</span></td>
          <td class="px-4 py-3 font-semibold text-slate-800">\${r.avgScore}</td>
          <td class="px-4 py-3 font-bold text-blue-700">\${r.ikm100}</td>
          <td class="px-4 py-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">\${r.mutuLayanan}</span></td>
          <td class="px-4 py-3 text-slate-600 max-w-xs truncate" title="\${r.saran}">\${r.saran || '-'}</td>
          <td class="px-4 py-3 text-slate-400 text-[11px]">\${r.device}</td>
        \`;
        tbody.appendChild(tr);
      });
    }

    function updatePinBadges() {
      const activeCount = globalPinsList.filter(p => p.status === 'active').length;
      const badge = document.getElementById('badge-active-pins');
      if (activeCount > 0) {
        badge.innerText = activeCount;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    function renderPinTable() {
      const filterStatus = document.getElementById('filter-pin-status').value;
      const search = (document.getElementById('search-pin').value || '').toLowerCase().trim();
      const tbody = document.getElementById('pin-table-body');
      tbody.innerHTML = '';

      let list = globalPinsList.filter(function(p) {
        if (filterStatus !== 'ALL' && p.status !== filterStatus) return false;
        if (search) {
          const combined = (p.pin + ' ' + (p.registeredPatientName || '') + ' ' + (p.registeredService || '') + ' ' + (p.usedByPatientName || '')).toLowerCase();
          if (combined.indexOf(search) === -1) return false;
        }
        return true;
      });

      if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-slate-400">Tidak ada PIN yang sesuai filter.</td></tr>';
        return;
      }

      list.forEach(function(p) {
        const isAct = p.status === 'active';
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition';
        tr.innerHTML = \`
          <td class="px-4 py-3.5 whitespace-nowrap">
            <span class="font-mono font-extrabold text-sm tracking-widest px-2.5 py-1 rounded-lg \${isAct ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}">\${p.pin}</span>
          </td>
          <td class="px-4 py-3.5 whitespace-nowrap">
            <span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase \${isAct ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-red-100 text-red-800 border border-red-200'}">
              \${isAct ? '● AKTIF' : '● NON AKTIF'}
            </span>
          </td>
          <td class="px-4 py-3.5 font-bold text-slate-900">\${p.registeredPatientName || '<span class="text-slate-400 font-normal">(Umum / Belum Dinamai)</span>'}</td>
          <td class="px-4 py-3.5">
            <div class="text-slate-800 font-semibold">\${p.registeredService || 'Rawat Inap'}</div>
            \${p.registeredRoom ? '<div class="text-[11px] text-slate-500">' + p.registeredRoom + '</div>' : ''}
          </td>
          <td class="px-4 py-3.5 text-slate-500 text-[11px] whitespace-nowrap">\${p.createdAt || '-'}</td>
          <td class="px-4 py-3.5 text-[11px]">
            \${!isAct && p.usedAt ? '<div class="text-slate-700 font-medium">' + p.usedAt + '</div>' : '<span class="text-slate-400">-</span>'}
            \${p.usedByPatientName ? '<div class="text-blue-700 font-semibold">' + p.usedByPatientName + '</div>' : ''}
          </td>
          <td class="px-4 py-3.5 text-center whitespace-nowrap">
            <button
              onclick="togglePinStatusDirect('\${p.pin}', '\${isAct ? 'NON AKTIF' : 'AKTIF'}')"
              class="px-2.5 py-1 rounded-lg text-[11px] font-bold border transition active:scale-95 \${isAct ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}"
            >
              \${isAct ? 'Nonaktifkan' : 'Aktifkan'}
            </button>
          </td>
        \`;
        tbody.appendChild(tr);
      });
    }

    // HANDLER SIMPAN PIN DENGAN SAFETY TIMEOUT & ERROR CATCH
    function handleAddNewPin(e) {
      e.preventDefault();
      const patientName = document.getElementById('input-patient-name').value.trim();
      const service = document.getElementById('input-service').value;
      const room = document.getElementById('input-room').value.trim();
      const pinCode = document.getElementById('input-pin-code').value.trim();
      const notes = document.getElementById('input-notes').value.trim();

      setButtonLoading('btn-submit-new-pin', true, 'Daftarkan PIN ke Sheet');

      // Safety timeout: jika Google Apps Script tidak merespons dalam 12 detik
      const timeoutId = setTimeout(function() {
        setButtonLoading('btn-submit-new-pin', false, 'Daftarkan PIN ke Sheet');
        showToast('Koneksi lambat. Silakan periksa apakah Anda sudah menerapkan "Versi Baru" (New Version) di Deploy Apps Script.', 'error');
      }, 12000);

      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(res) {
            clearTimeout(timeoutId);
            setButtonLoading('btn-submit-new-pin', false, 'Daftarkan PIN ke Sheet');
            if (res && res.success) {
              showToast(res.message, 'success');
              document.getElementById('form-new-pin').reset();
              generateRandomInputPin();
              fetchPinsData();
            } else {
              showToast((res && res.message) ? res.message : 'Gagal menambahkan PIN', 'error');
            }
          })
          .withFailureHandler(function(err) {
            clearTimeout(timeoutId);
            setButtonLoading('btn-submit-new-pin', false, 'Daftarkan PIN ke Sheet');
            showToast('Error Server Apps Script: ' + err.message + '. Pastikan Anda telah membuat Penerapan Versi Baru (New Deployment).', 'error');
          })
          .addNewPatientPinDirect(patientName, service, room, notes, pinCode);
      } else {
        clearTimeout(timeoutId);
        setButtonLoading('btn-submit-new-pin', false, 'Daftarkan PIN ke Sheet');
        showToast('Lingkungan google.script tidak terdeteksi. Buka dashboard dari URL Google Web App resmi.', 'error');
      }
    }

    function generateBatchPins(count) {
      if (!confirm('Buat ' + count + ' PIN pasien baru secara otomatis di Google Sheet?')) return;
      showToast('Sedang membuat ' + count + ' PIN baru...', 'success');
      
      const btnId = 'btn-batch-' + count;
      const btn = document.getElementById(btnId);
      if (btn) btn.disabled = true;

      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(res) {
            if (btn) btn.disabled = false;
            if (res && res.success) {
              showToast(res.message, 'success');
              fetchPinsData();
            } else {
              showToast((res && res.message) ? res.message : 'Gagal membuat batch PIN', 'error');
            }
          })
          .withFailureHandler(function(err) {
            if (btn) btn.disabled = false;
            showToast('Gagal membuat batch PIN: ' + err.message, 'error');
          })
          .generateBatchPinsDirect(count, 'Batch dari Web Portal Admin');
      }
    }

    function togglePinStatusDirect(pin, newStatus) {
      showToast('Memperbarui status PIN...', 'success');
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(res) {
            if (res && res.success) {
              showToast(res.message, 'success');
              fetchPinsData();
            } else {
              showToast((res && res.message) ? res.message : 'Gagal mengubah status', 'error');
            }
          })
          .withFailureHandler(function(err) {
            showToast('Gagal mengubah status: ' + err.message, 'error');
          })
          .togglePinStatus(pin, newStatus);
      }
    }

    function exportToCSV() {
      if (!globalDashboardData || !globalDashboardData.recentResponses) {
        alert('Data belum siap untuk diekspor.');
        return;
      }
      let csv = 'Waktu,ID Survei,Nama Pasien,Jenis Layanan,Rata Skor,IKM 100,Mutu,Saran,Perangkat\\n';
      globalDashboardData.recentResponses.forEach(function(r) {
        csv += '"' + (r.timestamp || '') + '","' + (r.id || '') + '","' + (r.namaPasien || '') + '","' + (r.jenisLayanan || '') + '",' + (r.avgScore || 0) + ',' + (r.ikm100 || 0) + ',"' + (r.mutuLayanan || '') + '","' + (r.saran || '').replace(/"/g, '""') + '","' + (r.device || '') + '"\\n';
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'Survei_Kepuasan_RSUD_Aeramo_' + new Date().toISOString().slice(0,10) + '.csv';
      link.click();
    }

    window.onload = function() {
      generateRandomInputPin();
      fetchDashboardData();
      fetchPinsData();
    };
  </script>
</body>
</html>
`;
