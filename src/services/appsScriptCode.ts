/**
 * Kode Google Apps Script (Code.gs & index.html) siap pakai untuk Google Sheets.
 * Disesuaikan khusus untuk Dashboard Eksekutif & Backend Kuesioner Survei Pasien
 * RSUD AERAMO - KABUPATEN NAGEKEO
 */

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ==============================================================================
 * KUESIONER SURVEI KEPUASAN PASIEN & DASHBOARD ADMIN EKSEKUTIF
 * RUMAH SAKIT UMUM DAERAH (RSUD) AERAMO - KABUPATEN NAGEKEO
 * FILE: Code.gs (Google Apps Script Backend)
 * ==============================================================================
 * Petunjuk Pemasangan di Google Apps Script:
 * 1. Buat Google Sheet baru di Google Drive Anda (atau buka sheet yang sudah ada).
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
 * 8. Jika memperbarui script yang sudah berjalan:
 *    - Klik "Terapkan" (Deploy) > "Kelola penerapan" (Manage deployments).
 *    - Klik ikon Pensil (Edit) > pilih "Versi baru" (New version) > klik "Terapkan" (Deploy).
 * ==============================================================================
 */

const SHEET_NAME_RESPONSES = "Data_Survei_Aeramo";
const SHEET_NAME_DASHBOARD = "Dashboard_IKM";

/**
 * Melayani Tampilan Halaman Dashboard Admin via Web App URL
 */
function doGet(e) {
  // Jika dipanggil dengan parameter ?api=true, kembalikan JSON data mentah
  if (e && e.parameter && e.parameter.api === "true") {
    return ContentService.createTextOutput(JSON.stringify(getDashboardData()))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Menampilkan Halaman Dashboard Interaktif
  try {
    const template = HtmlService.createTemplateFromFile("index");
    return template.evaluate()
      .setTitle("Dashboard Survei Kepuasan Pasien - RSUD Aeramo")
      .addMetaTag("viewport", "width=device-width, initial-scale=1.0")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    return ContentService.createTextOutput(
      "Error memuat template index.html: " + err.message +
      ". Pastikan Anda telah membuat file HTML bernama 'index' di Google Apps Script."
    );
  }
}

/**
 * Menerima kiriman data survei baru dari formulir Web / Android / Tablet
 */
function doPost(e) {
  try {
    const lock = LockService.getScriptLock();
    lock.waitLock(30000); // Kunci 30 detik mencegah tabrakan data serentak

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME_RESPONSES);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME_RESPONSES);
      setupHeaders(sheet);
    } else {
      checkAndUpgradeHeaders(sheet);
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
    const answeredDetails = data.answeredDetails || [];

    // Ekstraksi nilai Q1 s/d Q7 secara cerdas (mendukung ri_q1..ri_q7, q1..q7, atau array answeredDetails)
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

      // Fallback untuk layanan lain (Radiologi, Rawat Jalan, IGD, dsb.)
      var answerKeys = Object.keys(answers);
      if (!q1 && answerKeys.length > 0) q1 = Number(answers[answerKeys[0]]) || 0;
      if (!q2 && answerKeys.length > 1) q2 = Number(answers[answerKeys[1]]) || 0;
      if (!q3 && answerKeys.length > 2) q3 = Number(answers[answerKeys[2]]) || 0;
      if (!q4 && answerKeys.length > 3) q4 = Number(answers[answerKeys[3]]) || 0;
      if (!q5 && answerKeys.length > 4) q5 = Number(answers[answerKeys[4]]) || 0;
      if (!q6 && answerKeys.length > 5) q6 = Number(answers[answerKeys[5]]) || 0;
      if (!q7 && answerKeys.length > 6) q7 = Number(answers[answerKeys[6]]) || 0;
    }

    // Hitung rata-rata semua pertanyaan yang dijawab
    var answerValues = [];
    if (Array.isArray(answeredDetails) && answeredDetails.length > 0) {
      answerValues = answeredDetails.map(function(d) { return Number(d.score); }).filter(function(v) { return !isNaN(v) && v > 0; });
    } else {
      answerValues = Object.values(answers).map(Number).filter(function(v) { return !isNaN(v) && v > 0; });
    }
    const totalScore = answerValues.reduce(function(a, b) { return a + b; }, 0);
    const avgScore = answerValues.length > 0 ? totalScore / answerValues.length : (Number(data.averageScore) || 0);
    
    // Konversi ke IKM Skala 100 (Nilai / 4 * 100)
    const ikm100 = data.ikmScore ? Number(data.ikmScore) : ((avgScore / 4) * 100);

    let mutuLayanan = data.mutuLayanan;
    if (!mutuLayanan) {
      mutuLayanan = "Sangat Baik (A)";
      if (ikm100 < 65) mutuLayanan = "Kurang Baik (D)";
      else if (ikm100 < 76.6) mutuLayanan = "Cukup (C)";
      else if (ikm100 < 88.3) mutuLayanan = "Baik (B)";
    }

    // Rincian lengkap pertanyaan & jawaban
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

    // Baris data lengkap 23 kolom
    const row = [
      new Date(), // 0: Timestamp Google
      data.id || Utilities.getUuid(), // 1: ID Survei
      data.tanggalSurvei || Utilities.formatDate(new Date(), "Asia/Makassar", "yyyy-MM-dd"), // 2: Tgl
      data.jamSurvei || "08.00 – 14.00 WITA", // 3: Jam
      data.namaPasien || "(Anonim / Tidak Diisi)", // 4: Nama
      data.jenisKelamin || "-", // 5: JK
      data.pendidikan || "-", // 6: Pendidikan
      data.usia ? Number(data.usia) : "-", // 7: Usia
      data.pekerjaan === "LAINNYA" && data.pekerjaanLainnya ? "LAINNYA: " + data.pekerjaanLainnya : (data.pekerjaan || "-"), // 8: Pekerjaan
      data.jenisLayanan || "Rawat Inap", // 9: Layanan
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
      data.devicePlatform || "Android / Web" // 22: Perangkat
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
 * Mengambil dan memproses seluruh data survei untuk dikirimkan ke Dashboard Admin (index.html)
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
    
    // Periksa apakah baris ini mengikuti format 23 kolom baru atau 19 kolom lama
    const isNewFormat = (r.length >= 20 && (
      String(r[19] || '').indexOf('Baik') !== -1 || 
      String(r[19] || '').indexOf('Cukup') !== -1 || 
      (typeof r[14] === 'number' && r[14] <= 4 && typeof r[17] === 'number')
    ));

    const tgl = r[2] instanceof Date ? Utilities.formatDate(r[2], "Asia/Makassar", "yyyy-MM-dd") : String(r[2] || '');
    const nama = String(r[4] || "(Anonim)");
    const jk = String(r[5] || "").toUpperCase();
    const usia = (r[7] !== "-" && r[7] !== "" && !isNaN(Number(r[7]))) ? Number(r[7]) : null;
    const layanan = String(r[9] || "Rawat Inap");

    let vQ1 = 0, vQ2 = 0, vQ3 = 0, vQ4 = 0, vQ5 = 0, vQ6 = 0, vQ7 = 0;
    let vScore = 0, vIkm = 0, mutu = '', saran = '', rincian = '', device = 'Web';

    if (isNewFormat) {
      vQ1 = Number(r[10]);
      vQ2 = Number(r[11]);
      vQ3 = Number(r[12]);
      vQ4 = Number(r[13]);
      vQ5 = Number(r[14]);
      vQ6 = Number(r[15]);
      vQ7 = Number(r[16]);
      vScore = Number(r[17]);
      vIkm = Number(r[18]);
      mutu = String(r[19] || "");
      saran = String(r[20] || "");
      rincian = String(r[21] || "");
      device = String(r[22] || "Web");
    } else {
      vQ1 = Number(r[10]);
      vQ2 = Number(r[11]);
      vQ3 = Number(r[12]);
      vQ4 = Number(r[13]);
      vQ5 = 0;
      vQ6 = 0;
      vQ7 = 0;
      vScore = Number(r[14]);
      vIkm = Number(r[15]);
      mutu = String(r[16] || "");
      saran = String(r[17] || "");
      device = String(r[18] || "Web");
    }

    if (isNaN(vQ1)) vQ1 = 0;
    if (isNaN(vQ2)) vQ2 = 0;
    if (isNaN(vQ3)) vQ3 = 0;
    if (isNaN(vQ4)) vQ4 = 0;
    if (isNaN(vQ5)) vQ5 = 0;
    if (isNaN(vQ6)) vQ6 = 0;
    if (isNaN(vQ7)) vQ7 = 0;

    if (vQ1 > 0) { sumQ1 += vQ1; countQ1++; }
    if (vQ2 > 0) { sumQ2 += vQ2; countQ2++; }
    if (vQ3 > 0) { sumQ3 += vQ3; countQ3++; }
    if (vQ4 > 0) { sumQ4 += vQ4; countQ4++; }
    if (vQ5 > 0) { sumQ5 += vQ5; countQ5++; }
    if (vQ6 > 0) { sumQ6 += vQ6; countQ6++; }
    if (vQ7 > 0) { sumQ7 += vQ7; countQ7++; }

    if (!isNaN(vScore) && vScore > 0) {
      sumScore += vScore;
      sumIkm += (!isNaN(vIkm) && vIkm > 0) ? vIkm : (vScore / 4 * 100);
      countScore++;
      if (vScore >= 3.0) puasCount++;
    }

    // Distribusi Mutu
    if (mutu.indexOf("A") !== -1 || mutu.indexOf("Sangat Baik") !== -1) mutuDist.a++;
    else if (mutu.indexOf("B") !== -1 || mutu.indexOf("Baik") !== -1) mutuDist.b++;
    else if (mutu.indexOf("C") !== -1 || mutu.indexOf("Cukup") !== -1) mutuDist.c++;
    else if (mutu.indexOf("D") !== -1 || mutu.indexOf("Kurang") !== -1) mutuDist.d++;
    else if (vScore >= 3.5) mutuDist.a++;
    else if (vScore >= 3.0) mutuDist.b++;
    else if (vScore >= 2.5) mutuDist.c++;
    else mutuDist.d++;

    // Distribusi Layanan
    layananDist[layanan] = (layananDist[layanan] || 0) + 1;

    // Distribusi Gender
    if (jk.indexOf("L") !== -1) genderDist.L++;
    else if (jk.indexOf("P") !== -1) genderDist.P++;
    else genderDist.other++;

    // Simpan data respon
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
      avgScore: !isNaN(vScore) && vScore > 0 ? Number(vScore.toFixed(2)) : 0,
      ikm100: !isNaN(vIkm) && vIkm > 0 ? Number(vIkm.toFixed(2)) : (!isNaN(vScore) && vScore > 0 ? Number((vScore/4*100).toFixed(2)) : 0),
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
 * Setup Header Kolom Spreadsheet (23 Kolom Lengkap)
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

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground("#1e3a8a")
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
}

/**
 * Upgrade Header jika sheet lama masih menggunakan 19 kolom
 */
function checkAndUpgradeHeaders(sheet) {
  try {
    if (sheet.getLastColumn() < 23) {
      setupHeaders(sheet);
    }
  } catch (e) {
    // Ignore if locked
  }
}

/**
 * Ringkasan Sheet Dashboard IKM
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
          <strong class="font-bold text-blue-900">Struktur Instrumen Lengkap:</strong>
          <span class="text-blue-800"> Dashboard ini memuat 7 unsur evaluasi Rawat Inap (Kenyamanan, Kebersihan, Fasilitas, Ketenangan, Kunjungan Dokter, Penjelasan Medis, Responsivitas Perawat) serta rincian lengkap untuk unit Radiologi, Rawat Jalan, dan IGD.</span>
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
              <th class="py-3 px-2 text-center" title="1. Kenyamanan Kamar & Tempat Tidur">Q1 Kamar</th>
              <th class="py-3 px-2 text-center" title="2. Kebersihan Kamar & Kamar Mandi">Q2 Bersih</th>
              <th class="py-3 px-2 text-center" title="3. Ketersediaan & Fasilitas Kamar">Q3 Fasilitas</th>
              <th class="py-3 px-2 text-center" title="4. Ketenangan & Keamanan Lingkungan">Q4 Tenang</th>
              <th class="py-3 px-2 text-center" title="5. Kunjungan Dokter">Q5 Dokter</th>
              <th class="py-3 px-2 text-center" title="6. Kejelasan Informasi Medis Dokter">Q6 Info</th>
              <th class="py-3 px-2 text-center" title="7. Responsivitas & Kesiapan Perawat">Q7 Perawat</th>
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

  <!-- Modal Detail Jawaban Pasien -->
  <div id="modal-detail" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs hidden items-center justify-center p-4">
    <div class="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 class="font-bold text-slate-900 text-base" id="modal-title">Rincian Lengkap Jawaban Pasien</h3>
          <p class="text-xs text-slate-500" id="modal-sub">-</p>
        </div>
        <button onclick="closeModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold">
          ✕
        </button>
      </div>

      <div id="modal-content" class="space-y-4 text-xs text-slate-700">
        <!-- Rendered by JS -->
      </div>

      <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
        <button
          onclick="printModalSheet()"
          class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
          </svg>
          <span>Cetak Lembar Pasien Ini</span>
        </button>
        <button
          onclick="closeModal()"
          class="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-xs"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>

  <script>
    var rawData = null;
    var filteredList = [];
    var chartUnsurInstance = null;
    var chartMutuInstance = null;
    var currentModalRecord = null;

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
        console.warn('google.script.run tidak tersedia. Berjalan di lingkungan simulasi.');
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
      // 1. Chart Rata-rata 7 Unsur Pelayanan
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
              backgroundColor: [
                '#2563eb',
                '#059669',
                '#d97706',
                '#7c3aed',
                '#0284c7',
                '#4f46e5',
                '#0d9488'
              ],
              borderRadius: 8,
              borderSkipped: false,
              barThickness: 22
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                max: 4.0,
                ticks: {
                  stepSize: 1.0,
                  font: { family: 'Plus Jakarta Sans', size: 11 }
                },
                grid: { color: '#f1f5f9' }
              },
              x: {
                ticks: {
                  font: { family: 'Plus Jakarta Sans', size: 10, weight: '600' }
                },
                grid: { display: false }
              }
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: function(c) {
                    return ' Skor Rata-Rata: ' + c.raw.toFixed(2) + ' / 4.00';
                  }
                }
              }
            }
          }
        });
      }

      // 2. Chart Donut Distribusi Mutu
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
              backgroundColor: ['#059669', '#2563eb', '#d97706', '#e11d48'],
              borderWidth: 2,
              borderColor: '#ffffff'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  boxWidth: 12,
                  font: { family: 'Plus Jakarta Sans', size: 10, weight: '600' }
                }
              }
            },
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
        
        var matchMutu = true;
        if (filterMutu !== 'ALL') {
          matchMutu = item.mutuLayanan.indexOf(filterMutu) !== -1;
        }

        var matchSearch = !search ||
          (item.namaPasien && item.namaPasien.toLowerCase().indexOf(search) !== -1) ||
          (item.tanggalSurvei && item.tanggalSurvei.toLowerCase().indexOf(search) !== -1) ||
          (item.jenisLayanan && item.jenisLayanan.toLowerCase().indexOf(search) !== -1) ||
          (item.saran && item.saran.toLowerCase().indexOf(search) !== -1);

        return matchLayanan && matchMutu && matchSearch;
      });

      renderTable();
    }

    function formatScoreCell(val) {
      if (!val || val === 0 || val === '-') {
        return '<span class="text-slate-300 font-normal">-</span>';
      }
      var colorClass = 'text-blue-700 bg-blue-50';
      if (val === 4) colorClass = 'text-emerald-700 bg-emerald-50';
      else if (val === 3) colorClass = 'text-blue-700 bg-blue-50';
      else if (val === 2) colorClass = 'text-amber-700 bg-amber-50';
      else if (val === 1) colorClass = 'text-rose-700 bg-rose-50';
      return '<span class="inline-block w-6 h-6 leading-6 text-center rounded-md font-bold text-xs ' + colorClass + '">' + val + '</span>';
    }

    function formatScoreBadge(val) {
      if (!val || val === 0 || val === '-') {
        return '<span class="text-slate-300 font-normal">-</span>';
      }
      var colorClass = 'text-blue-700 bg-blue-100';
      if (val === 4) colorClass = 'text-emerald-800 bg-emerald-100';
      else if (val === 3) colorClass = 'text-blue-800 bg-blue-100';
      else if (val === 2) colorClass = 'text-amber-800 bg-amber-100';
      else if (val === 1) colorClass = 'text-rose-800 bg-rose-100';
      return '<span class="px-2 py-0.5 rounded-full font-bold text-xs ' + colorClass + '">Nilai ' + val + '</span>';
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
        
        var mutuClass = 'bg-blue-50 text-blue-700 border-blue-200';
        if (r.mutuLayanan.indexOf('A') !== -1 || r.mutuLayanan.indexOf('Sangat Baik') !== -1) {
          mutuClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        } else if (r.mutuLayanan.indexOf('C') !== -1) {
          mutuClass = 'bg-amber-50 text-amber-700 border-amber-200';
        } else if (r.mutuLayanan.indexOf('D') !== -1) {
          mutuClass = 'bg-rose-50 text-rose-700 border-rose-200';
        }

        html += '<tr onclick="openDetail(' + i + ')" class="hover:bg-blue-50/50 cursor-pointer transition border-b border-slate-100">' +
          '<td class="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">' + r.tanggalSurvei + '<br><span class="text-[10px] text-slate-400">' + (r.jamSurvei || '') + '</span></td>' +
          '<td class="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">' + escapeHtml(r.namaPasien) + '</td>' +
          '<td class="py-3 px-3 text-[11px] text-slate-600 whitespace-nowrap">' + (r.jenisKelamin === 'L' ? '👨 L' : (r.jenisKelamin === 'P' ? '👩 P' : '-')) + ' • ' + (r.usia ? r.usia + ' thn' : '-') + '</td>' +
          '<td class="py-3 px-3 whitespace-nowrap"><span class="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-[11px] text-slate-700">' + escapeHtml(r.jenisLayanan) + '</span></td>' +
          '<td class="py-3 px-2 text-center">' + formatScoreCell(r.q1) + '</td>' +
          '<td class="py-3 px-2 text-center">' + formatScoreCell(r.q2) + '</td>' +
          '<td class="py-3 px-2 text-center">' + formatScoreCell(r.q3) + '</td>' +
          '<td class="py-3 px-2 text-center">' + formatScoreCell(r.q4) + '</td>' +
          '<td class="py-3 px-2 text-center">' + formatScoreCell(r.q5) + '</td>' +
          '<td class="py-3 px-2 text-center">' + formatScoreCell(r.q6) + '</td>' +
          '<td class="py-3 px-2 text-center">' + formatScoreCell(r.q7) + '</td>' +
          '<td class="py-3 px-2 text-center font-extrabold text-slate-900">' + (r.avgScore > 0 ? r.avgScore.toFixed(2) : '-') + '</td>' +
          '<td class="py-3 px-2 text-center font-black text-blue-800">' + (r.ikm100 > 0 ? r.ikm100.toFixed(1) : '-') + '</td>' +
          '<td class="py-3 px-2 text-center whitespace-nowrap"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ' + mutuClass + '">' + r.mutuLayanan + '</span></td>' +
          '<td class="py-3 px-3 max-w-xs truncate text-slate-600" title="' + escapeHtml(r.saran) + '">' + (r.saran ? escapeHtml(r.saran) : '<span class="text-slate-300 italic">-</span>') + '</td>' +
        '</tr>';
      }

      tbody.innerHTML = html;
    }

    function openDetail(index) {
      var r = filteredList[index];
      if (!r) return;
      currentModalRecord = r;

      document.getElementById('modal-sub').innerText = r.tanggalSurvei + ' • ' + (r.jamSurvei || '') + ' (' + r.jenisLayanan + ')';
      
      var aspectListHtml = '';
      if (r.rincianAspek && r.rincianAspek !== '-') {
        var items = r.rincianAspek.split(' | ');
        aspectListHtml = '<div class="space-y-1.5">';
        for (var k = 0; k < items.length; k++) {
          aspectListHtml += '<div class="p-2 rounded-lg bg-white border border-blue-100 flex justify-between items-center text-xs text-slate-700"><span>' + escapeHtml(items[k]) + '</span></div>';
        }
        aspectListHtml += '</div>';
      } else {
        aspectListHtml = 
          '<div class="space-y-1.5">' +
            '<div class="flex justify-between items-center py-1 border-b border-blue-100 text-xs text-slate-700"><span>1. Kenyamanan Kamar & Tempat Tidur:</span> ' + formatScoreBadge(r.q1) + '</div>' +
            '<div class="flex justify-between items-center py-1 border-b border-blue-100 text-xs text-slate-700"><span>2. Kebersihan Kamar & Kamar Mandi:</span> ' + formatScoreBadge(r.q2) + '</div>' +
            '<div class="flex justify-between items-center py-1 border-b border-blue-100 text-xs text-slate-700"><span>3. Fasilitas & Peralatan Kamar:</span> ' + formatScoreBadge(r.q3) + '</div>' +
            '<div class="flex justify-between items-center py-1 border-b border-blue-100 text-xs text-slate-700"><span>4. Ketenangan & Keamanan Lingkungan:</span> ' + formatScoreBadge(r.q4) + '</div>' +
            '<div class="flex justify-between items-center py-1 border-b border-blue-100 text-xs text-slate-700"><span>5. Frekuensi Kunjungan Dokter:</span> ' + formatScoreBadge(r.q5) + '</div>' +
            '<div class="flex justify-between items-center py-1 border-b border-blue-100 text-xs text-slate-700"><span>6. Kejelasan Informasi Penjelasan Dokter:</span> ' + formatScoreBadge(r.q6) + '</div>' +
            '<div class="flex justify-between items-center py-1 text-xs text-slate-700"><span>7. Responsivitas & Kesiapan Perawat:</span> ' + formatScoreBadge(r.q7) + '</div>' +
          '</div>';
      }

      var content = 
        '<div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">' +
          '<div class="flex justify-between"><strong>Nama Pasien:</strong> <span>' + escapeHtml(r.namaPasien) + '</span></div>' +
          '<div class="flex justify-between"><strong>Demografi:</strong> <span>' + (r.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan') + ' / ' + (r.usia ? r.usia + ' Tahun' : '-') + '</span></div>' +
          '<div class="flex justify-between"><strong>Pendidikan:</strong> <span>' + escapeHtml(r.pendidikan) + '</span></div>' +
          '<div class="flex justify-between"><strong>Pekerjaan:</strong> <span>' + escapeHtml(r.pekerjaan) + '</span></div>' +
          '<div class="flex justify-between"><strong>Jenis Layanan:</strong> <span class="font-bold text-blue-700">' + escapeHtml(r.jenisLayanan) + '</span></div>' +
        '</div>' +

        '<div class="bg-blue-50/60 p-4 rounded-2xl border border-blue-200 space-y-2.5">' +
          '<h4 class="font-bold text-blue-900 mb-1">Rincian Penilaian Aspek Kepuasan:</h4>' +
          aspectListHtml +
          '<div class="pt-2.5 border-t border-blue-200 flex justify-between font-bold text-slate-800">' +
            '<span>Rata-Rata: ' + (r.avgScore > 0 ? r.avgScore.toFixed(2) : '-') + '</span>' +
            '<span class="text-blue-700">Indeks IKM: ' + (r.ikm100 > 0 ? r.ikm100.toFixed(2) : '-') + ' (' + r.mutuLayanan + ')</span>' +
          '</div>' +
        '</div>' +

        '<div class="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 space-y-1">' +
          '<h4 class="font-bold text-amber-900">Saran & Masukan Pasien:</h4>' +
          '<p class="text-slate-700 leading-relaxed italic">' + (r.saran ? escapeHtml(r.saran) : 'Tidak ada saran tambahan.') + '</p>' +
        '</div>';

      document.getElementById('modal-content').innerHTML = content;
      document.getElementById('modal-detail').classList.remove('hidden');
      document.getElementById('modal-detail').classList.add('flex');
    }

    function closeModal() {
      document.getElementById('modal-detail').classList.add('hidden');
      document.getElementById('modal-detail').classList.remove('flex');
    }

    function printModalSheet() {
      if (!currentModalRecord) return;
      var w = window.open('', '_blank');
      var r = currentModalRecord;
      var printHtml = 
        '<html><head><title>Lembar Survei - ' + escapeHtml(r.namaPasien) + '</title>' +
        '<style>body{font-family:sans-serif;padding:30px;color:#1e293b}h2{color:#1e3a8a;margin-bottom:4px}table{width:100%;border-collapse:collapse;margin-top:15px}td,th{border:1px solid #cbd5e1;padding:8px 12px;font-size:12px}.bg{background:#f8fafc;font-weight:bold}</style>' +
        '</head><body>' +
        '<h2>RSUD AERAMO - LEMBAR EVALUASI KEPUASAN PASIEN</h2>' +
        '<p style="font-size:12px;color:#64748b;margin-top:0">Kabupaten Nagekeo | Waktu Survei: ' + r.tanggalSurvei + ' ' + (r.jamSurvei || '') + '</p>' +
        '<hr/>' +
        '<table>' +
          '<tr><td class="bg" width="30%">ID Survei</td><td>' + r.id + '</td></tr>' +
          '<tr><td class="bg">Nama Pasien</td><td>' + escapeHtml(r.namaPasien) + '</td></tr>' +
          '<tr><td class="bg">Jenis Kelamin / Usia</td><td>' + (r.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan') + ' / ' + (r.usia || '-') + ' Tahun</td></tr>' +
          '<tr><td class="bg">Pendidikan / Pekerjaan</td><td>' + escapeHtml(r.pendidikan) + ' / ' + escapeHtml(r.pekerjaan) + '</td></tr>' +
          '<tr><td class="bg">Jenis Layanan</td><td>' + escapeHtml(r.jenisLayanan) + '</td></tr>' +
          '<tr><td class="bg">Skor Rata-Rata</td><td><strong>' + r.avgScore.toFixed(2) + '</strong> (Skala 1 - 4)</td></tr>' +
          '<tr><td class="bg">Indeks IKM 100</td><td><strong>' + r.ikm100.toFixed(2) + '</strong> (' + r.mutuLayanan + ')</td></tr>' +
          '<tr><td class="bg">Rincian Aspek</td><td>' + (r.rincianAspek ? escapeHtml(r.rincianAspek) : ('Q1: ' + r.q1 + ', Q2: ' + r.q2 + ', Q3: ' + r.q3 + ', Q4: ' + r.q4 + ', Q5: ' + r.q5 + ', Q6: ' + r.q6 + ', Q7: ' + r.q7)) + '</td></tr>' +
          '<tr><td class="bg">Saran / Masukan</td><td>' + (r.saran ? escapeHtml(r.saran) : '-') + '</td></tr>' +
        '</table>' +
        '<p style="font-size:11px;color:#94a3b8;margin-top:20px;text-align:right">Dicetak dari Dashboard RSUD Aeramo pada ' + new Date().toLocaleString('id-ID') + '</p>' +
        '</body></html>';
      w.document.write(printHtml);
      w.document.close();
      setTimeout(function() { w.print(); }, 500);
    }

    function exportCSV() {
      if (!filteredList || filteredList.length === 0) {
        alert('Tidak ada data untuk diekspor.');
        return;
      }

      var headers = [
        'Tanggal', 'Jam', 'Nama Pasien', 'Jenis Kelamin', 'Usia', 'Pendidikan', 'Pekerjaan', 'Jenis Layanan',
        'Q1 Kamar', 'Q2 Kebersihan', 'Q3 Fasilitas', 'Q4 Ketenangan', 'Q5 Dokter', 'Q6 Info Medis', 'Q7 Perawat',
        'Rata-Rata Skor', 'IKM 100', 'Mutu Pelayanan', 'Saran', 'Rincian Aspek'
      ];
      var csvRows = [headers.join(',')];

      for (var i = 0; i < filteredList.length; i++) {
        var r = filteredList[i];
        var row = [
          '"' + r.tanggalSurvei + '"',
          '"' + (r.jamSurvei || '') + '"',
          '"' + (r.namaPasien || '').replace(/"/g, '""') + '"',
          '"' + r.jenisKelamin + '"',
          '"' + (r.usia || '') + '"',
          '"' + r.pendidikan + '"',
          '"' + (r.pekerjaan || '').replace(/"/g, '""') + '"',
          '"' + r.jenisLayanan + '"',
          r.q1 || '-',
          r.q2 || '-',
          r.q3 || '-',
          r.q4 || '-',
          r.q5 || '-',
          r.q6 || '-',
          r.q7 || '-',
          r.avgScore || 0,
          r.ikm100 || 0,
          '"' + r.mutuLayanan + '"',
          '"' + (r.saran || '').replace(/"/g, '""') + '"',
          '"' + (r.rincianAspek || '').replace(/"/g, '""') + '"'
        ];
        csvRows.push(row.join(','));
      }

      var blob = new Blob([csvRows.join('\\n')], { type: 'text/csv;charset=utf-8;' });
      var url = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'Laporan_Survei_Kepuasan_RSUD_Aeramo_' + new Date().toISOString().slice(0, 10) + '.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    function escapeHtml(text) {
      if (!text) return '';
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  </script>
</body>
</html>
`;
