/**
 * Kode Google Apps Script (Code.gs) siap pakai untuk Google Sheets.
 * Disesuaikan khusus untuk Kuesioner Survei Kepuasan Pasien
 * RSUD AERAMO - KABUPATEN NAGEKEO
 */

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ==============================================================================
 * KUESIONER SURVEY KEPUASAN PASIEN
 * RUMAH SAKIT UMUM DAERAH AERAMO - KABUPATEN NAGEKEO
 * BACKEND GOOGLE APPS SCRIPT + GOOGLE SHEETS
 * ==============================================================================
 * Petunjuk Pemasangan:
 * 1. Buat Google Sheet baru di Google Drive Anda (contoh: "Survei Kepuasan RSUD Aeramo").
 * 2. Klik menu "Extensions" (Ekstensi) > "Apps Script".
 * 3. Hapus semua kode default di Code.gs, lalu paste seluruh script ini.
 * 4. Klik ikon Save (Disket).
 * 5. Klik tombol "Deploy" (Terapkan) > "New deployment" (Penerapan baru).
 * 6. Pilih tipe: "Web app" (Aplikasi web).
 * 7. Pengaturan:
 *    - Description: "RSUD Aeramo Survey Webhook v2"
 *    - Execute as: "Me" (Email Google Anda)
 *    - Who has access: "Anyone" (Siapa saja)  <--- WAJIB DIPILIH!
 * 8. Klik "Deploy", izinkan otorisasi jika diminta.
 * 9. Salin "Web app URL" (akhiran /exec) dan tempel ke tab Google Sheet URL di aplikasi.
 * ==============================================================================
 */

const SHEET_NAME_RESPONSES = "Data_Survei_Aeramo";
const SHEET_NAME_DASHBOARD = "Dashboard_IKM";

/**
 * Menerima kiriman data survei dari formulir Web / Android
 */
function doPost(e) {
  try {
    const lock = LockService.getScriptLock();
    lock.waitLock(30000); // Kunci selama 30 detik untuk mencegah tumpang tindih data

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME_RESPONSES);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME_RESPONSES);
      setupHeaders(sheet);
    }

    let data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    } else {
      throw new Error("Tidak ada payload data yang diterima.");
    }

    const answers = data.answers || {};

    // Ambil jawaban pertanyaan Bagian 1 (Skala 1 - 4)
    const q1 = Number(answers.q1_kenyamanan_kamar || answers["1"] || 0);
    const q2 = Number(answers.q2_kebersihan_kamar || answers["2"] || 0);
    const q3 = Number(answers.q3_kualitas_fasilitas || answers["3"] || 0);
    const q4 = Number(answers.q4_ketenangan_keamanan || answers["4"] || 0);

    // Hitung rata-rata semua jawaban yang ada
    const answerValues = Object.values(answers).map(Number).filter(v => !isNaN(v) && v > 0);
    const totalScore = answerValues.reduce((a, b) => a + b, 0);
    const avgScore = answerValues.length > 0 ? totalScore / answerValues.length : 0;
    
    // Konversi ke IKM Skala 100 (Nilai / 4 * 100)
    const ikm100 = (avgScore / 4) * 100;

    let mutuLayanan = "Sangat Baik (A)";
    if (ikm100 < 65) mutuLayanan = "Kurang Baik (D)";
    else if (ikm100 < 76.6) mutuLayanan = "Cukup (C)";
    else if (ikm100 < 88.3) mutuLayanan = "Baik (B)";

    // Baris data tersusun rapi sesuai instrumen RSUD Aeramo
    const row = [
      new Date(), // Timestamp Google
      data.id || Utilities.getUuid(),
      data.tanggalSurvei || Utilities.formatDate(new Date(), "Asia/Makassar", "yyyy-MM-dd"),
      data.jamSurvei || "08.00 – 14.00 WITA",
      data.namaPasien || "(Tidak Diisi / Anonim)",
      data.jenisKelamin || "-",
      data.pendidikan || "-",
      data.usia ? Number(data.usia) : "-",
      data.pekerjaan === "LAINNYA" && data.pekerjaanLainnya ? "LAINNYA: " + data.pekerjaanLainnya : (data.pekerjaan || "-"),
      data.jenisLayanan || "Rawat Inap",
      q1 || "-",
      q2 || "-",
      q3 || "-",
      q4 || "-",
      Number(avgScore.toFixed(2)),
      Number(ikm100.toFixed(2)),
      mutuLayanan,
      data.saran || "-",
      data.devicePlatform || "Android / Web"
    ];

    sheet.appendRow(row);
    updateDashboardSheet(ss);

    lock.releaseLock();

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Data survei RSUD Aeramo berhasil disimpan ke Google Sheet!",
      surveyId: data.id,
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
 * Handle GET untuk uji koneksi dari aplikasi
 */
function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_RESPONSES);
  const total = sheet ? Math.max(0, sheet.getLastRow() - 1) : 0;

  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    hospital: "RSUD Aeramo - Kabupaten Nagekeo",
    totalSurvei: total,
    spreadsheetName: ss.getName(),
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Setup Header Kolom Spreadsheet sesuai Kuesioner Resmi
 */
function setupHeaders(sheet) {
  const headers = [
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
    "Rata-rata Skor (Skala 1-4)",
    "Indeks IKM (Skala 100)",
    "Mutu Pelayanan",
    "Saran / Masukan",
    "Perangkat Pengisi"
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground("#1e3a8a")
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
}

/**
 * Ringkasan Dashboard IKM Otomatis
 */
function updateDashboardSheet(ss) {
  let dash = ss.getSheetByName(SHEET_NAME_DASHBOARD);
  if (!dash) {
    dash = ss.insertSheet(SHEET_NAME_DASHBOARD);
  }

  dash.getRange("A1").setValue("DASHBOARD SURVEI KEPUASAN PASIEN - RSUD AERAMO").setFontWeight("bold").setFontSize(13);
  dash.getRange("A2").setValue("Kabupaten Nagekeo | Terakhir Diperbarui: " + new Date().toLocaleString("id-ID")).setFontStyle("italic");

  const cards = [
    ["Total Responden", '=COUNTA(Data_Survei_Aeramo!B2:B)'],
    ["Rata-Rata IKM (Skala 100)", '=IFERROR(AVERAGE(Data_Survei_Aeramo!P2:P), 0)'],
    ["1. Kenyamanan Kamar & Tempat Tidur", '=IFERROR(AVERAGE(Data_Survei_Aeramo!K2:K), 0)'],
    ["2. Kebersihan Kamar & Kamar Mandi", '=IFERROR(AVERAGE(Data_Survei_Aeramo!L2:L), 0)'],
    ["3. Kualitas & Fasilitas Kamar", '=IFERROR(AVERAGE(Data_Survei_Aeramo!M2:M), 0)'],
    ["4. Ketenangan & Keamanan Lingkungan", '=IFERROR(AVERAGE(Data_Survei_Aeramo!N2:N), 0)']
  ];

  for (let i = 0; i < cards.length; i++) {
    const row = 4 + i;
    dash.getRange(row, 1).setValue(cards[i][0]).setFontWeight("bold");
    dash.getRange(row, 2).setFormula(cards[i][1]).setNumberFormat("0.00");
  }

  dash.getRange("A4:B9").setBorder(true, true, true, true, true, true);
}
`;
