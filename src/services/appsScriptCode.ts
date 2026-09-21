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
 * 1. Buat Google Sheet baru di Google Drive Anda.
 * 2. Klik menu "Ekstensi" (Extensions) > "Apps Script".
 * 3. Di file default "Code.gs", hapus isinya dan tempel seluruh kode ini.
 * 4. Buat file HTML baru:
 *    - Klik ikon tanda tambah (+) di samping Files > pilih "HTML".
 *    - Beri nama file: index (otomatis menjadi index.html).
 *    - Tempelkan kode dari tab "index.html (Dashboard)" ke file tersebut.
 * 5. Klik ikon Save (Disket).
 * 6. Klik tombol "Terapkan" (Deploy) > "Penerapan baru" (New deployment).
 *    - Jenis: "Aplikasi web" (Web app).
 *    - Jalankan sebagai: "Saya" (Me / email Anda).
 *    - Siapa yang memiliki akses: "Siapa saja" (Anyone)  <--- WAJIB!
 * 7. Klik "Deploy", izinkan otorisasi akun Google.
 * 8. Selesai!
 *    - URL Web App yang dihasilkan adalah Link Dashboard Admin yang bisa dibuka di browser!
 *    - URL yang sama juga ditempelkan ke aplikasi kuesioner pasien sebagai endpoint penerima data.
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
      .addMetaTag("viewport", "width=device-width, initial-scale=1, maximum-scale=1")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    return HtmlService.createHtmlOutput(
      "<div style='font-family:sans-serif;padding:30px;max-width:600px;margin:auto;text-align:center;'>" +
      "<h2 style='color:#b91c1c;'>File 'index.html' Belum Dibuat</h2>" +
      "<p>Pastikan Anda sudah membuat file HTML baru di Google Apps Script dengan nama <b>index</b> (menjadi index.html) dan menempelkan kodenya.</p>" +
      "<p style='color:#666;font-size:12px;'>Error: " + err.toString() + "</p></div>"
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

    // Ambil jawaban pertanyaan aspek pelayanan (Skala 1 - 4)
    const q1 = Number(answers.q1_kenyamanan_kamar || answers["1"] || 0);
    const q2 = Number(answers.q2_kebersihan_kamar || answers["2"] || 0);
    const q3 = Number(answers.q3_kualitas_fasilitas || answers["3"] || 0);
    const q4 = Number(answers.q4_ketenangan_keamanan || answers["4"] || 0);

    // Hitung rata-rata semua pertanyaan yang dijawab
    const answerValues = Object.values(answers).map(Number).filter(function(v) { return !isNaN(v) && v > 0; });
    const totalScore = answerValues.reduce(function(a, b) { return a + b; }, 0);
    const avgScore = answerValues.length > 0 ? totalScore / answerValues.length : 0;
    
    // Konversi ke IKM Skala 100 (Nilai / 4 * 100)
    const ikm100 = (avgScore / 4) * 100;

    let mutuLayanan = "Sangat Baik (A)";
    if (ikm100 < 65) mutuLayanan = "Kurang Baik (D)";
    else if (ikm100 < 76.6) mutuLayanan = "Cukup (C)";
    else if (ikm100 < 88.3) mutuLayanan = "Baik (B)";

    // Baris data lengkap sesuai instrumen RSUD Aeramo
    const row = [
      new Date(), // Timestamp Google
      data.id || Utilities.getUuid(),
      data.tanggalSurvei || Utilities.formatDate(new Date(), "Asia/Makassar", "yyyy-MM-dd"),
      data.jamSurvei || "08.00 – 14.00 WITA",
      data.namaPasien || "(Anonim / Tidak Diisi)",
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
    unsurScores: { q1: 0, q2: 0, q3: 0, q4: 0 },
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
  const values = sheet.getRange(2, 1, lastRow - 1, 19).getValues();

  let sumQ1 = 0, countQ1 = 0;
  let sumQ2 = 0, countQ2 = 0;
  let sumQ3 = 0, countQ3 = 0;
  let sumQ4 = 0, countQ4 = 0;
  let sumScore = 0, countScore = 0;
  let sumIkm = 0;
  let puasCount = 0;

  const mutuDist = { a: 0, b: 0, c: 0, d: 0 };
  const layananDist = {};
  const genderDist = { L: 0, P: 0, other: 0 };
  const recentResponses = [];

  for (let i = 0; i < values.length; i++) {
    const r = values[i];
    
    // Indeks Kolom:
    // 0: Timestamp | 1: ID | 2: Tgl | 3: Jam | 4: Nama | 5: JK | 6: Pend | 7: Usia
    // 8: Pekerjaan | 9: Layanan | 10: Q1 | 11: Q2 | 12: Q3 | 13: Q4 | 14: AvgScore | 15: IKM100 | 16: Mutu | 17: Saran | 18: Device
    const tgl = r[2] instanceof Date ? Utilities.formatDate(r[2], "Asia/Makassar", "yyyy-MM-dd") : String(r[2]);
    const nama = String(r[4] || "(Anonim)");
    const jk = String(r[5] || "").toUpperCase();
    const usia = r[7] !== "-" ? Number(r[7]) : null;
    const layanan = String(r[9] || "Rawat Inap");

    const vQ1 = Number(r[10]);
    const vQ2 = Number(r[11]);
    const vQ3 = Number(r[12]);
    const vQ4 = Number(r[13]);
    const vScore = Number(r[14]);
    const vIkm = Number(r[15]);
    const mutu = String(r[16] || "");
    const saran = String(r[17] || "");

    if (!isNaN(vQ1) && vQ1 > 0) { sumQ1 += vQ1; countQ1++; }
    if (!isNaN(vQ2) && vQ2 > 0) { sumQ2 += vQ2; countQ2++; }
    if (!isNaN(vQ3) && vQ3 > 0) { sumQ3 += vQ3; countQ3++; }
    if (!isNaN(vQ4) && vQ4 > 0) { sumQ4 += vQ4; countQ4++; }

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
    else mutuDist.d++;

    // Distribusi Layanan
    layananDist[layanan] = (layananDist[layanan] || 0) + 1;

    // Distribusi Gender
    if (jk.indexOf("L") !== -1) genderDist.L++;
    else if (jk.indexOf("P") !== -1) genderDist.P++;
    else genderDist.other++;

    // Simpan daftar respon
    recentResponses.push({
      timestamp: r[0] instanceof Date ? Utilities.formatDate(r[0], "Asia/Makassar", "dd/MM/yyyy HH:mm") : String(r[0]),
      id: String(r[1]),
      tanggalSurvei: tgl,
      jamSurvei: String(r[3] || ""),
      namaPasien: nama,
      jenisKelamin: jk,
      pendidikan: String(r[6] || "-"),
      usia: usia,
      pekerjaan: String(r[8] || "-"),
      jenisLayanan: layanan,
      q1: !isNaN(vQ1) ? vQ1 : 0,
      q2: !isNaN(vQ2) ? vQ2 : 0,
      q3: !isNaN(vQ3) ? vQ3 : 0,
      q4: !isNaN(vQ4) ? vQ4 : 0,
      avgScore: !isNaN(vScore) ? Number(vScore.toFixed(2)) : 0,
      ikm100: !isNaN(vIkm) ? Number(vIkm.toFixed(2)) : (!isNaN(vScore) ? Number((vScore/4*100).toFixed(2)) : 0),
      mutuLayanan: mutu || "Baik (B)",
      saran: saran !== "-" ? saran : "",
      device: String(r[18] || "Web")
    });
  }

  // Urutkan dari respon paling baru
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
      q4: countQ4 > 0 ? Number((sumQ4 / countQ4).toFixed(2)) : 0
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

export const GOOGLE_APPS_SCRIPT_INDEX_HTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard Survei Kepuasan Pasien - RSUD Aeramo</title>
  
  <!-- Tailwind CSS & Chart.js via CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
          }
        }
      }
    }
  </script>

  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    @media print {
      .no-print { display: none !important; }
      body { background: white !important; }
      .print-shadow-none { box-shadow: none !important; border: 1px solid #e2e8f0 !important; }
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen flex flex-col antialiased">

  <!-- TOP HEADER RSUD AERAMO -->
  <header class="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div class="flex items-center gap-3 text-center sm:text-left">
        <div class="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center font-black text-lg text-white shadow-md shadow-blue-500/30">
          🏥
        </div>
        <div>
          <div class="flex items-center gap-2 justify-center sm:justify-start">
            <h1 class="text-base sm:text-lg font-black tracking-tight text-white">RSUD AERAMO</h1>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-400/30">
              KAB. NAGEKEO
            </span>
          </div>
          <p class="text-xs text-slate-400">Dashboard Eksekutif Hasil Survei Kepuasan Pasien</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2 no-print">
        <button id="btn-refresh" onclick="refreshData()" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700">
          <svg id="refresh-spinner" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          <span id="refresh-text">Muat Ulang</span>
        </button>

        <button onclick="window.print()" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
          </svg>
          <span>Cetak</span>
        </button>

        <button onclick="exportCSV()" class="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <span>Ekspor CSV</span>
        </button>
      </div>
    </div>
  </header>

  <!-- SUB-BAR METADATA -->
  <div class="bg-white border-b border-slate-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
      <div class="flex items-center gap-2">
        <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span class="font-medium text-slate-700">Status Data: Real-time Sinkron Google Sheets</span>
      </div>
      <div class="flex items-center gap-2 text-slate-500">
        <span>Terakhir Diperbarui:</span>
        <span id="label-last-updated" class="font-bold text-slate-800">-</span>
      </div>
    </div>
  </div>

  <!-- MAIN CONTAINER -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 w-full">

    <!-- KPI STATS CARDS -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      
      <!-- Card 1: Total Responden -->
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs print-shadow-none">
        <div class="flex items-center justify-between text-slate-500 mb-2">
          <span class="text-xs font-bold uppercase tracking-wider">Total Responden</span>
          <span class="p-2 rounded-xl bg-blue-50 text-blue-600 font-bold text-sm">👥</span>
        </div>
        <div class="flex items-baseline gap-2">
          <span id="kpi-total" class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">0</span>
          <span class="text-xs text-slate-500 font-medium">pasien / wali</span>
        </div>
        <div class="mt-2 text-[11px] text-slate-500">
          Instrumen RSUD Aeramo
        </div>
      </div>

      <!-- Card 2: Indeks IKM Skala 100 -->
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs print-shadow-none">
        <div class="flex items-center justify-between text-slate-500 mb-2">
          <span class="text-xs font-bold uppercase tracking-wider">Indeks IKM (0-100)</span>
          <span class="p-2 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-sm">📊</span>
        </div>
        <div class="flex items-baseline gap-2">
          <span id="kpi-ikm" class="text-2xl sm:text-3xl font-black text-blue-700 tracking-tight">0.00</span>
          <span id="kpi-mutu-badge" class="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-blue-100 text-blue-800">
            -
          </span>
        </div>
        <div class="mt-2 text-[11px] text-slate-500">
          Standar KemenPAN-RB
        </div>
      </div>

      <!-- Card 3: Rata-Rata Skor Aspek (1-4) -->
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs print-shadow-none">
        <div class="flex items-center justify-between text-slate-500 mb-2">
          <span class="text-xs font-bold uppercase tracking-wider">Rata-Rata Skor</span>
          <span class="p-2 rounded-xl bg-amber-50 text-amber-600 font-bold text-sm">⭐</span>
        </div>
        <div class="flex items-baseline gap-2">
          <span id="kpi-score" class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">0.00</span>
          <span class="text-xs text-slate-500 font-medium">dari skala 4.00</span>
        </div>
        <div class="mt-2 text-[11px] text-slate-500">
          Target Layanan Prima: ≥ 3.00
        </div>
      </div>

      <!-- Card 4: Persentase Kepuasan -->
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs print-shadow-none">
        <div class="flex items-center justify-between text-slate-500 mb-2">
          <span class="text-xs font-bold uppercase tracking-wider">Tingkat Kepuasan</span>
          <span class="p-2 rounded-xl bg-purple-50 text-purple-600 font-bold text-sm">❤️</span>
        </div>
        <div class="flex items-baseline gap-2">
          <span id="kpi-puas-rate" class="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">0%</span>
          <span class="text-xs text-slate-500 font-medium">Puas / Sangat Puas</span>
        </div>
        <div class="mt-2 text-[11px] text-slate-500">
          Responden skor rata-rata ≥ 3.0
        </div>
      </div>

    </div>

    <!-- CHARTS GRID -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Chart 1: Rata-Rata per Unsur Pelayanan (Bar Chart) -->
      <div class="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs print-shadow-none flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-1">
            <h2 class="text-sm sm:text-base font-bold text-slate-900">Rata-Rata Nilai per Aspek Pelayanan</h2>
            <span class="text-[11px] text-slate-500">Skala 1.00 - 4.00</span>
          </div>
          <p class="text-xs text-slate-500 mb-4">Evaluasi kenyamanan, kebersihan, fasilitas, dan keamanan kamar RSUD Aeramo</p>
        </div>
        
        <div class="h-64 sm:h-72 w-full relative">
          <canvas id="chartUnsur"></canvas>
        </div>
      </div>

      <!-- Chart 2: Distribusi Mutu Pelayanan (Doughnut Chart) -->
      <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs print-shadow-none flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-1">
            <h2 class="text-sm sm:text-base font-bold text-slate-900">Distribusi Predikat Mutu</h2>
            <span class="text-[11px] text-slate-500">Kategori IKM</span>
          </div>
          <p class="text-xs text-slate-500 mb-4">Proporsi kepuasan responden survei</p>
        </div>

        <div class="h-56 sm:h-64 w-full relative flex items-center justify-center">
          <canvas id="chartMutu"></canvas>
        </div>

        <div class="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs text-slate-600 mt-2">
          <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> A (Sangat Baik)</div>
          <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span> B (Baik)</div>
          <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span> C (Cukup)</div>
          <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span> D (Kurang)</div>
        </div>
      </div>

    </div>

    <!-- TABEL DATA RESPONDEN LENGKAP -->
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden print-shadow-none">
      
      <!-- Filter & Search Toolbar -->
      <div class="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <h2 class="text-base font-bold text-slate-900">Daftar Hasil Responden Terbaru</h2>
          <p class="text-xs text-slate-500">Data hasil pengisian kuesioner pasien yang tersimpan di Google Sheets</p>
        </div>

        <div class="flex flex-wrap items-center gap-2 no-print">
          <!-- Filter Layanan -->
          <select id="filter-layanan" onchange="applyFilters()" class="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="ALL">Semua Jenis Layanan</option>
            <option value="Rawat Inap">Rawat Inap</option>
            <option value="Rawat Jalan">Rawat Jalan / Poliklinik</option>
            <option value="IGD">IGD (Gawat Darurat)</option>
          </select>

          <!-- Filter Mutu -->
          <select id="filter-mutu" onchange="applyFilters()" class="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="ALL">Semua Predikat</option>
            <option value="Sangat Baik">Sangat Baik (A)</option>
            <option value="Baik">Baik (B)</option>
            <option value="Cukup">Cukup (C)</option>
            <option value="Kurang">Kurang (D)</option>
          </select>

          <!-- Input Pencarian -->
          <div class="relative">
            <input 
              type="text" 
              id="search-input" 
              oninput="applyFilters()" 
              placeholder="Cari pasien / saran..." 
              class="pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-56"
            />
            <span class="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
          </div>
        </div>
      </div>

      <!-- Table Container -->
      <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-left text-xs">
          <thead class="bg-slate-100/80 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200">
            <tr>
              <th class="py-3 px-4">Waktu / Tgl</th>
              <th class="py-3 px-4">Nama Pasien</th>
              <th class="py-3 px-4">Profil Demografi</th>
              <th class="py-3 px-4">Jenis Layanan</th>
              <th class="py-3 px-4 text-center">Q1 Kamar</th>
              <th class="py-3 px-4 text-center">Q2 Bersih</th>
              <th class="py-3 px-4 text-center">Q3 Fasilitas</th>
              <th class="py-3 px-4 text-center">Q4 Tenang</th>
              <th class="py-3 px-4 text-center">Rata-rata</th>
              <th class="py-3 px-4 text-center">IKM (100)</th>
              <th class="py-3 px-4 text-center">Mutu</th>
              <th class="py-3 px-4">Saran / Masukan</th>
            </tr>
          </thead>
          <tbody id="table-body" class="divide-y divide-slate-100 font-medium text-slate-700">
            <!-- Rendered by JavaScript -->
            <tr>
              <td colspan="12" class="py-12 text-center text-slate-400">
                Memuat data survei dari Google Sheets...
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Table Footer Counter -->
      <div class="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
        <div>
          Menampilkan <span id="label-count-filtered" class="font-bold text-slate-800">0</span> dari <span id="label-count-total" class="font-bold text-slate-800">0</span> responden
        </div>
        <div class="text-[11px] text-slate-400">
          Klik baris untuk melihat rincian pengisian
        </div>
      </div>

    </div>

  </main>

  <!-- MODAL DETAIL RESPONDEN -->
  <div id="modal-detail" class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs hidden items-center justify-center p-4">
    <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 class="text-base font-bold text-slate-900">Rincian Survei Pasien</h3>
          <p id="modal-sub" class="text-xs text-slate-500">-</p>
        </div>
        <button onclick="closeModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold">
          ✕
        </button>
      </div>

      <div id="modal-content" class="text-xs space-y-3 max-h-[70vh] overflow-y-auto pr-1">
        <!-- Injected via JS -->
      </div>

      <div class="pt-3 border-t border-slate-100 flex justify-end">
        <button onclick="closeModal()" class="px-4 py-2 rounded-xl bg-slate-800 text-white font-bold text-xs">
          Tutup Rincian
        </button>
      </div>
    </div>
  </div>

  <!-- FOOTER RSUD AERAMO -->
  <footer class="bg-white border-t border-slate-200 py-4 mt-8 no-print">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 text-center sm:text-left">
      <div>
        <span class="font-bold text-slate-700">RSUD Aeramo</span> • Pemerintah Kabupaten Nagekeo, Nusa Tenggara Timur
      </div>
      <div>
        Sistem Survei Kepuasan Pasien Terintegrasi Google Apps Script
      </div>
    </div>
  </footer>

  <!-- SCRIPT LOGIC -->
  <script>
    // State lokal dashboard
    var rawData = null;
    var filteredList = [];
    var chartUnsurInstance = null;
    var chartMutuInstance = null;

    // Saat pertama kali load, ambil data
    window.addEventListener('DOMContentLoaded', function() {
      // Jika template injects data langsung:
      <? if (typeof getDashboardData === 'function') { ?>
        try {
          var serverData = <?!= JSON.stringify(getDashboardData()) ?>;
          if (serverData) {
            handleDataLoaded(serverData);
            return;
          }
        } catch (e) {
          console.log('Fallback to google.script.run');
        }
      <? } ?>

      refreshData();
    });

    function refreshData() {
      var btnText = document.getElementById('refresh-text');
      var spinner = document.getElementById('refresh-spinner');
      if (btnText) btnText.innerText = 'Memuat...';
      if (spinner) spinner.classList.add('animate-spin');

      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(res) {
            handleDataLoaded(res);
            if (btnText) btnText.innerText = 'Muat Ulang';
            if (spinner) spinner.classList.remove('animate-spin');
          })
          .withFailureHandler(function(err) {
            alert('Gagal mengambil data dari Google Sheets: ' + err.toString());
            if (btnText) btnText.innerText = 'Muat Ulang';
            if (spinner) spinner.classList.remove('animate-spin');
          })
          .getDashboardData();
      } else {
        // Mock preview jika dijalankan di luar Google Apps Script
        console.warn('google.script.run tidak tersedia. Berjalan di lingkungan preview.');
        if (btnText) btnText.innerText = 'Muat Ulang';
        if (spinner) spinner.classList.remove('animate-spin');
      }
    }

    function handleDataLoaded(data) {
      rawData = data;
      filteredList = data.recentResponses || [];

      // Update KPI
      document.getElementById('kpi-total').innerText = data.totalResponden || 0;
      document.getElementById('kpi-ikm').innerText = (data.avgIkm || 0).toFixed(2);
      document.getElementById('kpi-score').innerText = (data.avgScore || 0).toFixed(2);
      document.getElementById('kpi-puas-rate').innerText = (data.kepuasanRate || 0) + '%';
      document.getElementById('label-last-updated').innerText = data.lastUpdated || '-';

      // Badge Mutu
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
      // 1. Chart Rata-rata Unsur Pelayanan
      var ctxUnsur = document.getElementById('chartUnsur');
      if (ctxUnsur) {
        if (chartUnsurInstance) chartUnsurInstance.destroy();
        
        var u = data.unsurScores || { q1: 0, q2: 0, q3: 0, q4: 0 };
        chartUnsurInstance = new Chart(ctxUnsur, {
          type: 'bar',
          data: {
            labels: [
              ['1. Kenyamanan', 'Kamar & Tidur'],
              ['2. Kebersihan', 'Kamar & Mandi'],
              ['3. Kualitas', 'Fasilitas'],
              ['4. Ketenangan', '& Keamanan']
            ],
            datasets: [{
              label: 'Skor Rata-rata (1 - 4)',
              data: [u.q1, u.q2, u.q3, u.q4],
              backgroundColor: ['#2563eb', '#059669', '#d97706', '#7c3aed'],
              borderRadius: 8,
              borderSkipped: false,
              barThickness: 36
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: function(ctx) { return ' Skor: ' + ctx.parsed.y.toFixed(2) + ' / 4.00'; }
                }
              }
            },
            scales: {
              y: {
                min: 0,
                max: 4.0,
                ticks: { stepSize: 1 }
              }
            }
          }
        });
      }

      // 2. Chart Distribusi Mutu
      var ctxMutu = document.getElementById('chartMutu');
      if (ctxMutu) {
        if (chartMutuInstance) chartMutuInstance.destroy();
        var m = data.mutuDist || { a: 0, b: 0, c: 0, d: 0 };
        
        chartMutuInstance = new Chart(ctxMutu, {
          type: 'doughnut',
          data: {
            labels: ['Sangat Baik (A)', 'Baik (B)', 'Cukup (C)', 'Kurang (D)'],
            datasets: [{
              data: [m.a, m.b, m.c, m.d],
              backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#f43f5e'],
              borderWidth: 2,
              borderColor: '#ffffff'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            cutout: '70%'
          }
        });
      }
    }

    function applyFilters() {
      if (!rawData || !rawData.recentResponses) return;

      var filterLayanan = document.getElementById('filter-layanan').value;
      var filterMutu = document.getElementById('filter-mutu').value;
      var search = (document.getElementById('search-input').value || '').toLowerCase();

      filteredList = rawData.recentResponses.filter(function(item) {
        var matchLayanan = (filterLayanan === 'ALL') || (item.jenisLayanan === filterLayanan);
        var matchMutu = (filterMutu === 'ALL') || (item.mutuLayanan.indexOf(filterMutu) !== -1);
        var matchSearch = !search || 
          item.namaPasien.toLowerCase().indexOf(search) !== -1 ||
          item.saran.toLowerCase().indexOf(search) !== -1 ||
          item.tanggalSurvei.toLowerCase().indexOf(search) !== -1;

        return matchLayanan && matchMutu && matchSearch;
      });

      renderTable();
    }

    function renderTable() {
      var tbody = document.getElementById('table-body');
      document.getElementById('label-count-filtered').innerText = filteredList.length;
      document.getElementById('label-count-total').innerText = (rawData && rawData.recentResponses) ? rawData.recentResponses.length : 0;

      if (!filteredList || filteredList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" class="py-12 text-center text-slate-400">Belum ada data responden yang sesuai filter.</td></tr>';
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
          '<td class="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">' + r.tanggalSurvei + '<br><span class="text-[10px] text-slate-400">' + (r.jamSurvei || '') + '</span></td>' +
          '<td class="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">' + escapeHtml(r.namaPasien) + '</td>' +
          '<td class="py-3 px-4 text-[11px] text-slate-600 whitespace-nowrap">' + (r.jenisKelamin === 'L' ? '👨 Laki-laki' : (r.jenisKelamin === 'P' ? '👩 Perempuan' : '-')) + ' • ' + (r.usia ? r.usia + ' thn' : '-') + '</td>' +
          '<td class="py-3 px-4 whitespace-nowrap"><span class="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-[11px] text-slate-700">' + escapeHtml(r.jenisLayanan) + '</span></td>' +
          '<td class="py-3 px-4 text-center font-bold text-blue-700">' + r.q1 + '</td>' +
          '<td class="py-3 px-4 text-center font-bold text-emerald-700">' + r.q2 + '</td>' +
          '<td class="py-3 px-4 text-center font-bold text-amber-700">' + r.q3 + '</td>' +
          '<td class="py-3 px-4 text-center font-bold text-purple-700">' + r.q4 + '</td>' +
          '<td class="py-3 px-4 text-center font-extrabold text-slate-900">' + r.avgScore.toFixed(2) + '</td>' +
          '<td class="py-3 px-4 text-center font-black text-blue-800">' + r.ikm100.toFixed(1) + '</td>' +
          '<td class="py-3 px-4 text-center whitespace-nowrap"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ' + mutuClass + '">' + r.mutuLayanan + '</span></td>' +
          '<td class="py-3 px-4 max-w-xs truncate text-slate-600" title="' + escapeHtml(r.saran) + '">' + (r.saran ? escapeHtml(r.saran) : '<span class="text-slate-300 italic">-</span>') + '</td>' +
        '</tr>';
      }

      tbody.innerHTML = html;
    }

    function openDetail(index) {
      var r = filteredList[index];
      if (!r) return;

      document.getElementById('modal-sub').innerText = r.tanggalSurvei + ' • ' + (r.jamSurvei || '') + ' (' + r.jenisLayanan + ')';
      
      var content = 
        '<div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">' +
          '<div class="flex justify-between"><strong>Nama Pasien:</strong> <span>' + escapeHtml(r.namaPasien) + '</span></div>' +
          '<div class="flex justify-between"><strong>Demografi:</strong> <span>' + (r.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan') + ' / ' + (r.usia ? r.usia + ' Tahun' : '-') + '</span></div>' +
          '<div class="flex justify-between"><strong>Pendidikan:</strong> <span>' + escapeHtml(r.pendidikan) + '</span></div>' +
          '<div class="flex justify-between"><strong>Pekerjaan:</strong> <span>' + escapeHtml(r.pekerjaan) + '</span></div>' +
          '<div class="flex justify-between"><strong>Jenis Layanan:</strong> <span class="font-bold text-blue-700">' + escapeHtml(r.jenisLayanan) + '</span></div>' +
        '</div>' +

        '<div class="bg-blue-50/60 p-4 rounded-2xl border border-blue-200 space-y-2">' +
          '<h4 class="font-bold text-blue-900 mb-2">Nilai Aspek Kepuasan (Skala 1 - 4):</h4>' +
          '<div class="flex justify-between"><span>1. Kenyamanan Kamar & Tempat Tidur:</span> <strong class="text-base text-blue-800">' + r.q1 + '</strong></div>' +
          '<div class="flex justify-between"><span>2. Kebersihan Kamar & Kamar Mandi:</span> <strong class="text-base text-emerald-800">' + r.q2 + '</strong></div>' +
          '<div class="flex justify-between"><span>3. Kualitas & Fasilitas Kamar:</span> <strong class="text-base text-amber-800">' + r.q3 + '</strong></div>' +
          '<div class="flex justify-between"><span>4. Ketenangan & Keamanan Lingkungan:</span> <strong class="text-base text-purple-800">' + r.q4 + '</strong></div>' +
          '<div class="pt-2 border-t border-blue-200 flex justify-between font-bold text-slate-800">' +
            '<span>Rata-Rata: ' + r.avgScore.toFixed(2) + '</span>' +
            '<span class="text-blue-700">Indeks IKM: ' + r.ikm100.toFixed(2) + ' (' + r.mutuLayanan + ')</span>' +
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

    function exportCSV() {
      if (!filteredList || filteredList.length === 0) {
        alert('Tidak ada data untuk diekspor.');
        return;
      }

      var headers = ['Tanggal', 'Jam', 'Nama Pasien', 'Jenis Kelamin', 'Usia', 'Pendidikan', 'Pekerjaan', 'Jenis Layanan', 'Q1 Kenyamanan', 'Q2 Kebersihan', 'Q3 Fasilitas', 'Q4 Ketenangan', 'Rata-Rata Skor', 'IKM 100', 'Mutu Pelayanan', 'Saran'];
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
          r.q1,
          r.q2,
          r.q3,
          r.q4,
          r.avgScore,
          r.ikm100,
          '"' + r.mutuLayanan + '"',
          '"' + (r.saran || '').replace(/"/g, '""') + '"'
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
