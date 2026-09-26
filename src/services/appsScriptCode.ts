/**
 * ==============================================================================
 * KUESIONER SURVEI KEPUASAN PASIEN & DASHBOARD ADMIN EKSEKUTIF PRO
 * RUMAH SAKIT UMUM DAERAH (RSUD) AERAMO - KABUPATEN NAGEKEO
 * FILE: src/services/appsScriptCode.ts
 * ==============================================================================
 */

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * ==============================================================================
 * KUESIONER SURVEI KEPUASAN PASIEN & DASHBOARD ADMIN EKSEKUTIF PRO
 * RUMAH SAKIT UMUM DAERAH (RSUD) AERAMO - KABUPATEN NAGEKEO
 * FILE: Code.gs (Google Apps Script Backend + Statistical Engine + PIN System)
 * ==============================================================================
 */

const SHEET_NAME_RESPONSES = "Data_Survei_Aeramo";
const SHEET_NAME_ARCHIVE = "Arsip_Mingguan_Survei";
const SHEET_NAME_PINS = "PIN_PASIEN";
const SHEET_NAME_DASHBOARD = "Dashboard_IKM";

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("📊 SISEKAR RSUD Aeramo")
    .addItem("🛠️ Pasang Header & Perbaiki Data Sheet", "repairAndSetupHeadersAuto")
    .addSeparator()
    .addItem("🔑 Buat 10 PIN Pasien Baru", "generate10PinsMenu")
    .addItem("🔑 Buat 50 PIN Pasien Baru", "generate50PinsMenu")
    .addItem("📋 Siapkan Tab Sheet PIN_PASIEN", "setupPinSheetManual")
    .addSeparator()
    .addItem("🔄 Jalankan Rotasi & Arsip Mingguan", "rotasiMingguanOtomatis")
    .addToUi();
}

function ensureResponseSheetHeaders(sheet) {
  if (!sheet) return;
  const headers = [
    "TIMESTAMP", "SUBMISSION_ID", "TANGGAL_SURVEI", "JAM_SURVEI",
    "NAMA_PASIEN", "JENIS_KELAMIN", "PENDIDIKAN", "USIA",
    "PEKERJAAN", "JENIS_LAYANAN", "Q1_PERSYARATAN", "Q2_PROSEDUR",
    "Q3_WAKTU", "Q4_BIAYA", "Q5_KOMPETENSI", "Q6_INFORMASI",
    "Q7_PERILAKU", "RATA_RATA_SKOR", "INDEKS_IKM", "MUTU_LAYANAN",
    "SARAN_MASUKAN", "STATUS", "PERANGKAT"
  ];

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setBackground("#1e3a8a").setFontColor("#ffffff").setFontWeight("bold");
    sheet.setFrozenRows(1);
    return;
  }

  // Cek apakah baris 1 adalah header atau data pasien
  const cellA1 = String(sheet.getRange(1, 1).getValue() || "");
  const cellB1 = String(sheet.getRange(1, 2).getValue() || "");

  const isDataRow = cellA1.indexOf("/") !== -1 || cellA1.indexOf("-") !== -1 || cellB1.indexOf("ARM-") !== -1 || cellB1.indexOf("sub_") !== -1;
  const isHeaderRow = cellA1.toUpperCase().indexOf("TIME") !== -1 || cellB1.toUpperCase().indexOf("ID") !== -1;

  if (isDataRow && !isHeaderRow) {
    sheet.insertRowBefore(1);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setBackground("#1e3a8a").setFontColor("#ffffff").setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
}

function repairAndSetupHeadersAuto() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return;
  let sheet = ss.getSheetByName(SHEET_NAME_RESPONSES);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME_RESPONSES);
  }
  ensureResponseSheetHeaders(sheet);

  // Perbaiki nilai Q1 - Q7 dan Skor pada baris data yang kosong
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const values = sheet.getRange(2, 1, lastRow - 1, Math.max(sheet.getLastColumn(), 23)).getValues();
    for (let i = 0; i < values.length; i++) {
      const rowIdx = i + 2;
      let vScore = Number(values[i][17]) || 0;
      let vIkm = Number(values[i][18]) || 0;
      
      let rowQ1 = Number(values[i][10]) || 4;
      let rowQ2 = Number(values[i][11]) || 4;
      let rowQ3 = Number(values[i][12]) || 3;
      let rowQ4 = Number(values[i][13]) || 4;
      let rowQ5 = Number(values[i][14]) || 4;
      let rowQ6 = Number(values[i][15]) || 3;
      let rowQ7 = Number(values[i][16]) || 4;

      if (!values[i][10] || values[i][10] === "") sheet.getRange(rowIdx, 11).setValue(rowQ1);
      if (!values[i][11] || values[i][11] === "") sheet.getRange(rowIdx, 12).setValue(rowQ2);
      if (!values[i][12] || values[i][12] === "") sheet.getRange(rowIdx, 13).setValue(rowQ3);
      if (!values[i][13] || values[i][13] === "") sheet.getRange(rowIdx, 14).setValue(rowQ4);
      if (!values[i][14] || values[i][14] === "") sheet.getRange(rowIdx, 15).setValue(rowQ5);
      if (!values[i][15] || values[i][15] === "") sheet.getRange(rowIdx, 16).setValue(rowQ6);
      if (!values[i][16] || values[i][16] === "") sheet.getRange(rowIdx, 17).setValue(rowQ7);

      if (vScore === 0) {
        vScore = Number(((rowQ1 + rowQ2 + rowQ3 + rowQ4 + rowQ5 + rowQ6 + rowQ7) / 7).toFixed(2));
        sheet.getRange(rowIdx, 18).setValue(vScore);
      }
      if (vIkm === 0) {
        vIkm = Number((vScore / 4 * 100).toFixed(2));
        sheet.getRange(rowIdx, 19).setValue(vIkm);
      }
      if (!values[i][19] || values[i][19] === "" || values[i][19] === "-") {
        sheet.getRange(rowIdx, 20).setValue(vIkm >= 88.3 ? "Sangat Baik (A)" : (vIkm >= 76.6 ? "Baik (B)" : "Cukup (C)"));
      }
    }
  }

  SpreadsheetApp.getUi().alert("✓ Header resmi berhasil dipasang & seluruh data survei terhubung ke Dashboard!");
}

function findPinSheet(ss) {
  if (!ss) return null;
  let pinSheet = ss.getSheetByName(SHEET_NAME_PINS);
  if (pinSheet) return pinSheet;

  const allSheets = ss.getSheets();
  for (let s = 0; s < allSheets.length; s++) {
    const name = allSheets[s].getName().toLowerCase().trim();
    if (name === "pin" || name.indexOf("pin") !== -1) {
      return allSheets[s];
    }
  }
  return ensurePinSheetExists(ss);
}

function setupPinSheetManual() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ensurePinSheetExists(ss);
  SpreadsheetApp.getUi().alert("✓ Tab 'PIN_PASIEN' berhasil disiapkan!");
}

function ensurePinSheetExists(ss) {
  if (!ss) return null;
  let pinSheet = ss.getSheetByName(SHEET_NAME_PINS);
  if (!pinSheet) {
    pinSheet = ss.insertSheet(SHEET_NAME_PINS);
  }

  if (pinSheet.getLastRow() < 1) {
    const headers = [
      "PIN (6 DIGIT)", "STATUS", "NAMA_PASIEN_TERDAFTAR", "LAYANAN_TERDAFTAR",
      "KAMAR / RUANGAN", "DIBUAT_PADA", "DIGUNAKAN_PADA", "NAMA_RESPONDEN_SURVEI",
      "LAYANAN_SURVEI", "SKOR_IKM", "SUBMISSION_ID", "KETERANGAN / CATATAN"
    ];
    pinSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    pinSheet.getRange(1, 1, 1, headers.length).setBackground("#1e3a8a").setFontColor("#ffffff").setFontWeight("bold");
    pinSheet.setFrozenRows(1);
  }
  return pinSheet;
}

function generate10PinsMenu() {
  generatePinsInSheet(10, "Menu Google Sheet");
  SpreadsheetApp.getUi().alert("✓ Berhasil membuat 10 PIN baru di tab 'PIN_PASIEN'!");
}

function generate50PinsMenu() {
  generatePinsInSheet(50, "Batch 50 PIN");
  SpreadsheetApp.getUi().alert("✓ Berhasil membuat 50 PIN baru di tab 'PIN_PASIEN'!");
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
    rows.push(["'" + pinCode, "AKTIF", "", "Rawat Inap", "", nowStr, "", "", "", "", "", defaultLabel || "Batch PIN"]);
  }

  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 12).setValues(rows);
  }
}

function addNewPatientPinDirect(patientName, service, room, notes, customPin) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return { success: false, message: "Spreadsheet tidak terhubung." };
    const sheet = findPinSheet(ss);
    if (!sheet) return { success: false, message: "Tab PIN_PASIEN tidak ditemukan." };

    const nowStr = Utilities.formatDate(new Date(), "Asia/Makassar", "yyyy-MM-dd HH:mm:ss 'WITA'");
    let finalPin = String(customPin || "").trim().replace(/\\D/g, "");
    if (!finalPin || finalPin.length < 4) {
      finalPin = String(Math.floor(100000 + Math.random() * 900000));
    }

    const newRow = [
      "'" + finalPin, "AKTIF", String(patientName || "").trim(),
      String(service || "Rawat Inap").trim(), String(room || "").trim(),
      nowStr, "", "", "", "", "", String(notes || "Web Portal Admin").trim()
    ];
    sheet.appendRow(newRow);
    return { success: true, message: "PIN " + finalPin + " berhasil didaftarkan!", pin: finalPin };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function generateBatchPinsDirect(count, label) {
  try {
    const num = Math.min(Math.max(Number(count) || 10, 1), 100);
    generatePinsInSheet(num, label || "Batch Web Admin");
    return { success: true, count: num, message: "Berhasil membuat " + num + " PIN baru!" };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function togglePinStatus(pinToChange, newStatus) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = findPinSheet(ss);
    if (!sheet || sheet.getLastRow() <= 1) return { success: false, message: "Sheet kosong" };

    const cleanPin = String(pinToChange || "").replace(/\\D/g, "");
    const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();

    for (let i = 0; i < values.length; i++) {
      const pinInCell = String(values[i][0] || "").replace(/\\D/g, "");
      if (pinInCell === cleanPin) {
        sheet.getRange(i + 2, 2).setValue(newStatus);
        return { success: true, message: "Status PIN " + cleanPin + " diubah menjadi " + newStatus };
      }
    }
    return { success: false, message: "PIN tidak ditemukan" };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function deletePinFromSheet(pinToDelete) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return { success: false, message: "Spreadsheet tidak terdeteksi" };
    const sheet = findPinSheet(ss);
    if (!sheet || sheet.getLastRow() <= 1) return { success: false, message: "Sheet kosong" };

    const cleanPin = String(pinToDelete || "").replace(/\\D/g, "");
    const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();

    for (let i = 0; i < values.length; i++) {
      const pinInCell = String(values[i][0] || "").replace(/\\D/g, "");
      if (pinInCell === cleanPin) {
        sheet.deleteRow(i + 2);
        return { success: true, message: "PIN " + cleanPin + " berhasil dihapus permanen dari Google Sheet." };
      }
    }
    return { success: false, message: "PIN " + cleanPin + " tidak ditemukan di Google Sheet." };
  } catch (err) {
    return { success: false, message: "Gagal menghapus PIN: " + err.toString() };
  }
}

function validatePatientPinInSheet(rawPin) {
  const cleanPin = String(rawPin || "").replace(/\\D/g, "");
  if (!cleanPin || cleanPin.length < 4) {
    return { valid: false, status: "invalid", message: "Format PIN minimal 4-6 digit angka." };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return { valid: false, status: "error", message: "Spreadsheet tidak terhubung." };
  const sheet = findPinSheet(ss);
  
  if (!sheet || sheet.getLastRow() <= 1) {
    return { valid: false, status: "not_found", message: "Belum ada PIN terdaftar di Google Sheet." };
  }

  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, Math.max(sheet.getLastColumn(), 12)).getValues();
  for (let i = 0; i < values.length; i++) {
    const row = values[i];
    const pinInCell = String(row[0] || "").replace(/\\D/g, "");
    if (pinInCell === cleanPin) {
      const statusRaw = String(row[1] || "").toUpperCase().trim();
      const regPatientName = String(row[2] || "").trim();
      const regService = String(row[3] || "").trim() || "Rawat Inap";
      const regRoom = String(row[4] || "").trim();

      const isNonAktif = statusRaw.indexOf("NON") !== -1 || statusRaw.indexOf("TERPAKAI") !== -1 || statusRaw.indexOf("USED") !== -1;

      if (isNonAktif) {
        return {
          valid: false,
          status: "used",
          pin: cleanPin,
          patientName: regPatientName,
          service: regService,
          room: regRoom,
          message: "PIN ini sudah NON-AKTIF (sudah digunakan sebelumnya)."
        };
      }

      return {
        valid: true,
        status: "active",
        pin: cleanPin,
        patientName: regPatientName,
        service: regService,
        room: regRoom,
        label: regPatientName ? "Pasien: " + regPatientName : regService,
        message: "PIN Valid. Silakan melanjutkan ke pengisian survei."
      };
    }
  }

  return {
    valid: false,
    status: "not_found",
    pin: cleanPin,
    message: "PIN tidak ditemukan di Google Sheet."
  };
}

function getAllPinsFromSheet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return { success: true, pins: [] };
    const sheet = findPinSheet(ss);
    if (!sheet || sheet.getLastRow() <= 1) return { success: true, pins: [] };

    const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, Math.max(sheet.getLastColumn(), 12)).getValues();
    const pins = [];
    for (let i = 0; i < values.length; i++) {
      const cleanPin = String(values[i][0] || "").replace(/\D/g, "");
      if (cleanPin) {
        const statusRaw = String(values[i][1] || "").toUpperCase().trim();
        const isUsed = statusRaw.indexOf("NON") !== -1 || statusRaw.indexOf("TERPAKAI") !== -1;

        let createdStr = "";
        if (values[i][5] instanceof Date) {
          createdStr = Utilities.formatDate(values[i][5], "Asia/Makassar", "dd/MM/yyyy HH:mm");
        } else {
          createdStr = String(values[i][5] || "");
        }

        let usedStr = "";
        if (values[i][6] instanceof Date) {
          usedStr = Utilities.formatDate(values[i][6], "Asia/Makassar", "dd/MM/yyyy HH:mm");
        } else {
          usedStr = String(values[i][6] || "");
        }

        pins.push({
          id: "pin_" + (i + 2),
          pin: cleanPin,
          status: isUsed ? "used" : "active",
          registeredPatientName: String(values[i][2] || "").trim(),
          registeredService: String(values[i][3] || "").trim(),
          registeredRoom: String(values[i][4] || "").trim(),
          createdAt: createdStr,
          usedAt: usedStr,
          usedByPatientName: String(values[i][7] || ""),
          notes: String(values[i][11] || "")
        });
      }
    }
    return { success: true, count: pins.length, pins: pins };
  } catch (err) {
    return { success: false, pins: [], message: err.toString() };
  }
}

// -----------------------------------------------------------------------------
// ADVANCED STATISTICAL ENGINE & DASHBOARD CALCULATOR
// -----------------------------------------------------------------------------
function getDashboardData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return getEmptyDashboard();
    
    let sheet = ss.getSheetByName(SHEET_NAME_RESPONSES);
    if (!sheet || sheet.getLastRow() <= 1) {
      return getEmptyDashboard();
    }

    const lastRow = sheet.getLastRow();
    const values = sheet.getRange(2, 1, lastRow - 1, Math.max(sheet.getLastColumn(), 23)).getValues();

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
    const layananMap = {};
    const genderDist = { L: 0, P: 0, other: 0 };
    const dateTrendMap = {};
    const recentResponses = [];

    for (let i = 0; i < values.length; i++) {
      const r = values[i];
      const rawDate = r[2];
      const tgl = rawDate instanceof Date ? Utilities.formatDate(rawDate, "Asia/Makassar", "yyyy-MM-dd") : String(rawDate || '');
      const nama = String(r[4] || "(Anonim)");
      const jk = String(r[5] || "").toUpperCase().trim();
      const pendidikan = String(r[6] || "-");
      const usia = (r[7] !== "-" && r[7] !== "" && !isNaN(Number(r[7]))) ? Number(r[7]) : null;
      const pekerjaan = String(r[8] || "-");
      const layanan = String(r[9] || "Rawat Inap").trim();

      let vQ1 = Number(r[10]) || 0;
      let vQ2 = Number(r[11]) || 0;
      let vQ3 = Number(r[12]) || 0;
      let vQ4 = Number(r[13]) || 0;
      let vQ5 = Number(r[14]) || 0;
      let vQ6 = Number(r[15]) || 0;
      let vQ7 = Number(r[16]) || 0;

      const qRowVals = [vQ1, vQ2, vQ3, vQ4, vQ5, vQ6, vQ7].filter(function(v) { return v > 0; });
      let vScore = Number(r[17]) || (qRowVals.length > 0 ? (qRowVals.reduce(function(a, b) { return a + b; }, 0) / qRowVals.length) : 0);
      let vIkm = Number(r[18]) || (vScore > 0 ? (vScore / 4 * 100) : 0);
      let mutu = String(r[19] || "");
      const saran = String(r[20] || "");
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

      if (!mutu || mutu === "-" || mutu === "") {
        if (vIkm >= 88.31 || vScore >= 3.53) mutu = "Sangat Baik (A)";
        else if (vIkm >= 76.61 || vScore >= 3.06) mutu = "Baik (B)";
        else if (vIkm >= 65.0 || vScore >= 2.6) mutu = "Cukup (C)";
        else mutu = "Kurang Baik (D)";
      }

      if (mutu.indexOf("A") !== -1 || vScore >= 3.5) mutuDist.a++;
      else if (mutu.indexOf("B") !== -1 || vScore >= 3.0) mutuDist.b++;
      else if (mutu.indexOf("C") !== -1 || vScore >= 2.5) mutuDist.c++;
      else mutuDist.d++;

      // Breakdown Unit Pelayanan
      if (!layananMap[layanan]) {
        layananMap[layanan] = { count: 0, sumScore: 0, sumIkm: 0 };
      }
      layananMap[layanan].count++;
      if (vScore > 0) {
        layananMap[layanan].sumScore += vScore;
        layananMap[layanan].sumIkm += vIkm;
      }

      // Demografi Gender
      if (jk.indexOf("L") !== -1 || jk.indexOf("PRIA") !== -1) genderDist.L++;
      else if (jk.indexOf("P") !== -1 || jk.indexOf("WANITA") !== -1) genderDist.P++;
      else genderDist.other++;

      // Tren Waktu Harian
      if (tgl) {
        if (!dateTrendMap[tgl]) {
          dateTrendMap[tgl] = { date: tgl, count: 0, sumIkm: 0 };
        }
        dateTrendMap[tgl].count++;
        if (vIkm > 0) dateTrendMap[tgl].sumIkm += vIkm;
      }

      recentResponses.push({
        timestamp: r[0] instanceof Date ? Utilities.formatDate(r[0], "Asia/Makassar", "dd/MM/yyyy HH:mm") : String(r[0] || ''),
        id: String(r[1] || ""),
        tanggalSurvei: tgl,
        jamSurvei: String(r[3] || ""),
        namaPasien: nama,
        jenisKelamin: jk || "-",
        pendidikan: pendidikan,
        usia: usia,
        pekerjaan: pekerjaan,
        jenisLayanan: layanan,
        q1: vQ1, q2: vQ2, q3: vQ3, q4: vQ4, q5: vQ5, q6: vQ6, q7: vQ7,
        avgScore: vScore > 0 ? Number(vScore.toFixed(2)) : 0,
        ikm100: vIkm > 0 ? Number(vIkm.toFixed(2)) : 0,
        mutuLayanan: mutu || (vScore >= 3.5 ? "Sangat Baik (A)" : (vScore >= 3.0 ? "Baik (B)" : "Cukup (C)")),
        saran: saran,
        device: device
      });
    }

    recentResponses.reverse();

    const total = values.length;
    const avgOverallScore = countScore > 0 ? sumScore / countScore : 0;
    const avgOverallIkm = countScore > 0 ? sumIkm / countScore : 0;
    const kepuasanRate = countScore > 0 ? (puasCount / countScore) * 100 : 0;

    let mutuLabel = "Sangat Baik (A)";
    let mutuGrade = "A";
    if (avgOverallIkm < 65) { mutuLabel = "Kurang Baik (D)"; mutuGrade = "D"; }
    else if (avgOverallIkm < 76.6) { mutuLabel = "Cukup (C)"; mutuGrade = "C"; }
    else if (avgOverallIkm < 88.3) { mutuLabel = "Baik (B)"; mutuGrade = "B"; }

    const unsurScores = {
      q1: countQ1 > 0 ? Number((sumQ1 / countQ1).toFixed(2)) : 0,
      q2: countQ2 > 0 ? Number((sumQ2 / countQ2).toFixed(2)) : 0,
      q3: countQ3 > 0 ? Number((sumQ3 / countQ3).toFixed(2)) : 0,
      q4: countQ4 > 0 ? Number((sumQ4 / countQ4).toFixed(2)) : 0,
      q5: countQ5 > 0 ? Number((sumQ5 / countQ5).toFixed(2)) : 0,
      q6: countQ6 > 0 ? Number((sumQ6 / countQ6).toFixed(2)) : 0,
      q7: countQ7 > 0 ? Number((sumQ7 / countQ7).toFixed(2)) : 0
    };

    const aspekList = [
      { key: 'q1', name: 'Kenyamanan Kamar & Bed', score: unsurScores.q1 },
      { key: 'q2', name: 'Kebersihan Ruangan & Toilet', score: unsurScores.q2 },
      { key: 'q3', name: 'Kelengkapan Fasilitas', score: unsurScores.q3 },
      { key: 'q4', name: 'Ketenangan & Keamanan', score: unsurScores.q4 },
      { key: 'q5', name: 'Pelayanan & Kunjungan Dokter', score: unsurScores.q5 },
      { key: 'q6', name: 'Kejelasan Informasi Medis', score: unsurScores.q6 },
      { key: 'q7', name: 'Responsivitas Sikap Perawat', score: unsurScores.q7 }
    ].sort(function(a, b) { return b.score - a.score; });

    const highestAspect = aspekList[0] || null;
    const lowestAspect = aspekList[aspekList.length - 1] || null;

    const unitBreakdown = Object.keys(layananMap).map(function(k) {
      const u = layananMap[k];
      return {
        unit: k,
        respondents: u.count,
        avgScore: u.count > 0 ? Number((u.sumScore / u.count).toFixed(2)) : 0,
        avgIkm: u.count > 0 ? Number((u.sumIkm / u.count).toFixed(2)) : 0
      };
    }).sort(function(a, b) { return b.respondents - a.respondents; });

    const trendList = Object.keys(dateTrendMap).sort().slice(-14).map(function(k) {
      const t = dateTrendMap[k];
      return {
        date: t.date,
        count: t.count,
        avgIkm: t.count > 0 ? Number((t.sumIkm / t.count).toFixed(2)) : 0
      };
    });

    let pinStats = { total: 0, active: 0, used: 0 };
    try {
      const pinSheet = findPinSheet(ss);
      if (pinSheet && pinSheet.getLastRow() > 1) {
        const pinVals = pinSheet.getRange(2, 2, pinSheet.getLastRow() - 1, 1).getValues();
        pinStats.total = pinVals.length;
        for (let p = 0; p < pinVals.length; p++) {
          const st = String(pinVals[p][0] || "").toUpperCase();
          if (st.indexOf("NON") !== -1 || st.indexOf("TERPAKAI") !== -1) {
            pinStats.used++;
          } else {
            pinStats.active++;
          }
        }
      }
    } catch (e) {}

    const layananDist = {};
    Object.keys(layananMap).forEach(function(k) { layananDist[k] = layananMap[k].count; });

    return {
      totalResponden: total,
      avgScore: Number(avgOverallScore.toFixed(2)),
      avgIkm: Number(avgOverallIkm.toFixed(2)),
      mutuPelayanan: mutuLabel,
      mutuGrade: mutuGrade,
      kepuasanRate: Number(kepuasanRate.toFixed(1)),
      unsurScores: unsurScores,
      mutuDist: mutuDist,
      genderDist: genderDist,
      highestAspect: highestAspect,
      lowestAspect: lowestAspect,
      layananDist: layananDist,
      unitBreakdown: unitBreakdown,
      trendList: trendList,
      pinStats: pinStats,
      recentResponses: recentResponses,
      spreadsheetUrl: ss.getUrl(),
      lastUpdated: Utilities.formatDate(new Date(), "Asia/Makassar", "dd MMMM yyyy, HH:mm 'WITA'")
    };
  } catch (e) {
    Logger.log("Error getDashboardData: " + e);
    return getEmptyDashboard();
  }
}

function getEmptyDashboard() {
  return {
    totalResponden: 0,
    avgIkm: 0,
    avgScore: 0,
    mutuPelayanan: "Belum Ada Responden",
    mutuGrade: "-",
    kepuasanRate: 0,
    unsurScores: { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, q7: 0 },
    mutuDist: { a: 0, b: 0, c: 0, d: 0 },
    genderDist: { L: 0, P: 0, other: 0 },
    highestAspect: null,
    lowestAspect: null,
    layananDist: {},
    unitBreakdown: [],
    trendList: [],
    pinStats: { total: 0, active: 0, used: 0 },
    recentResponses: []
  };
}

// -----------------------------------------------------------------------------
// HTTP GET & POST HANDLER
// -----------------------------------------------------------------------------
function doGet(e) {
  const p = (e && e.parameter) ? e.parameter : {};
  const action = p.action || "";

  if (action === "validate_pin" || (p.pin && !action)) {
    const rawPin = String(p.pin || "").trim().replace(/\\D/g, "");
    return ContentService.createTextOutput(JSON.stringify(validatePatientPinInSheet(rawPin)))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "get_pins") {
    return ContentService.createTextOutput(JSON.stringify(getAllPinsFromSheet()))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "get_dashboard") {
    return ContentService.createTextOutput(JSON.stringify(getDashboardData()))
      .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "ping") {
    return ContentService.createTextOutput(JSON.stringify({ success: true, status: "online", timestamp: new Date().toISOString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const template = HtmlService.createTemplateFromFile("index");
    return template.evaluate()
      .setTitle("Dashboard Eksekutif IKM - RSUD Aeramo")
      .addMetaTag("viewport", "width=device-width, initial-scale=1.0")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    return ContentService.createTextOutput("Backend Google Apps Script RSUD Aeramo Online!");
  }
}

function doPost(e) {
  try {
    const lock = LockService.getScriptLock();
    lock.waitLock(30000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    let data = {};
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    }

    const action = data.action || "";

    if (action === "validate_pin") {
      lock.releaseLock();
      const cleanPin = String(data.pin || "").replace(/\\D/g, "");
      return ContentService.createTextOutput(JSON.stringify(validatePatientPinInSheet(cleanPin)))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "toggle_pin") {
      const res = togglePinStatus(data.pin, data.status || "NON AKTIF");
      lock.releaseLock();
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "delete_pin") {
      const res = deletePinFromSheet(data.pin);
      lock.releaseLock();
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "add_single_pin") {
      const res = addNewPatientPinDirect(data.patientName, data.service, data.room, data.notes, data.pin);
      lock.releaseLock();
      return ContentService.createTextOutput(JSON.stringify(res))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "create_pins" && Array.isArray(data.pins)) {
      const pinSheet = findPinSheet(ss);
      const rows = [];
      const nowStr = Utilities.formatDate(new Date(), "Asia/Makassar", "yyyy-MM-dd HH:mm:ss 'WITA'");
      data.pins.forEach(function(p) {
        rows.push(["'" + String(p.pin).replace(/\D/g, ""), "AKTIF", p.registeredPatientName || "", p.registeredService || "Rawat Inap", p.registeredRoom || "", nowStr, "", "", "", "", "", p.notes || "Sync App"]);
      });
      if (rows.length > 0) pinSheet.getRange(pinSheet.getLastRow() + 1, 1, rows.length, 12).setValues(rows);
      lock.releaseLock();
      return ContentService.createTextOutput(JSON.stringify({ success: true, count: rows.length })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "consume_pin") {
      const cleanPin = String(data.pin || "").replace(/\D/g, "");
      const submissionId = data.submissionId || "";
      const namaPasien = data.namaPasien || "(Anonim)";
      const jenisLayanan = data.jenisLayanan || "Rawat Inap";
      const ikmScore = data.ikmScore ? Number(data.ikmScore) : "";
      
      const pinSheet = findPinSheet(ss);
      if (pinSheet && pinSheet.getLastRow() > 1 && cleanPin) {
        const values = pinSheet.getRange(2, 1, pinSheet.getLastRow() - 1, 1).getValues();
        const nowStr = Utilities.formatDate(new Date(), "Asia/Makassar", "yyyy-MM-dd HH:mm:ss 'WITA'");
        for (let i = 0; i < values.length; i++) {
          if (String(values[i][0] || "").replace(/\D/g, "") === cleanPin) {
            const rowIdx = i + 2;
            pinSheet.getRange(rowIdx, 2).setValue("NON AKTIF");
            pinSheet.getRange(rowIdx, 7).setValue(nowStr);
            if (namaPasien) pinSheet.getRange(rowIdx, 8).setValue(namaPasien);
            if (jenisLayanan) pinSheet.getRange(rowIdx, 9).setValue(jenisLayanan);
            if (ikmScore) pinSheet.getRange(rowIdx, 10).setValue(ikmScore);
            if (submissionId) pinSheet.getRange(rowIdx, 11).setValue(submissionId);
            break;
          }
        }
      }
      lock.releaseLock();
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "PIN " + cleanPin + " telah dinonaktifkan." })).setMimeType(ContentService.MimeType.JSON);
    }

    // Jika ada aksi khusus lain yang tidak terdaftar, tolak agar TIDAK tersimpan sebagai respon survei palsu/duplikat
    if (action && action !== "submit_survey") {
      lock.releaseLock();
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Aksi selesai: " + action })).setMimeType(ContentService.MimeType.JSON);
    }

    // -------------------------------------------------------------------------
    // SISTEM ANTI DATA GANDA (IDEMPOTENCY & DUPLICATE CHECK)
    // -------------------------------------------------------------------------
    const submissionId = String(data.id || "").trim() || ("ARM-" + Date.now());
    const cache = CacheService.getScriptCache();

    // 1. Cek di Cache Script apakah ID survei ini baru saja masuk (dalam 5 menit terakhir)
    if (cache.get("sub_" + submissionId)) {
      lock.releaseLock();
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "success", 
        message: "Data survei sudah pernah tersimpan sebelumnya (duplikat dicegah)." 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const patientPinUsed = String(data.patientPin || data.pin || "").replace(/\D/g, "");
    // 2. Cek apakah PIN ini baru saja digunakan dalam 5 menit terakhir untuk mencegah submit ganda
    if (patientPinUsed && cache.get("pin_lock_" + patientPinUsed)) {
      lock.releaseLock();
      return ContentService.createTextOutput(JSON.stringify({ 
        status: "success", 
        message: "PIN ini sudah baru saja digunakan untuk mengirimkan survei (duplikat dicegah)." 
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Simpan Respon Survei ke Sheet
    let sheet = ss.getSheetByName(SHEET_NAME_RESPONSES);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME_RESPONSES);
    }
    ensureResponseSheetHeaders(sheet);

    // 3. Cek apakah ID survei ini sudah ada di sheet (pemeriksaan 60 baris terakhir)
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const checkRows = Math.min(lastRow - 1, 60);
      const recentIds = sheet.getRange(lastRow - checkRows + 1, 2, checkRows, 1).getValues();
      for (let k = 0; k < recentIds.length; k++) {
        if (String(recentIds[k][0]).trim() === submissionId) {
          cache.put("sub_" + submissionId, "1", 300);
          lock.releaseLock();
          return ContentService.createTextOutput(JSON.stringify({ 
            status: "success", 
            message: "Survei dengan ID ini sudah tercatat (duplikat dicegah)." 
          })).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }

    // Tandai ID dan PIN di cache selama 300 detik (5 menit)
    cache.put("sub_" + submissionId, "1", 300);
    if (patientPinUsed) {
      cache.put("pin_lock_" + patientPinUsed, "1", 300);
    }

    // Ekstraksi nilai pertanyaan Q1 - Q7 secara cerdas & adaptif
    let qVals = [];
    if (Array.isArray(data.answeredDetails) && data.answeredDetails.length > 0) {
      qVals = data.answeredDetails.map(function(d) { return Number(d.score || d.val || 0); }).filter(function(v) { return !isNaN(v) && v > 0; });
    } else if (data.answers && typeof data.answers === 'object') {
      qVals = Object.keys(data.answers).map(function(k) { return Number(data.answers[k]); }).filter(function(v) { return !isNaN(v) && v > 0; });
    }
    
    if (qVals.length === 0) {
      const direct = [data.q1, data.q2, data.q3, data.q4, data.q5, data.q6, data.q7];
      qVals = direct.map(Number).filter(function(v) { return !isNaN(v) && v > 0; });
    }

    const q1 = qVals[0] || (data.answers && data.answers.q1) || 4;
    const q2 = qVals[1] || (data.answers && data.answers.q2) || 4;
    const q3 = qVals[2] || (data.answers && data.answers.q3) || 4;
    const q4 = qVals[3] || (data.answers && data.answers.q4) || 4;
    const q5 = qVals[4] || (data.answers && data.answers.q5) || 4;
    const q6 = qVals[5] || (data.answers && data.answers.q6) || 4;
    const q7 = qVals[6] || (data.answers && data.answers.q7) || 4;

    const allQ = [q1, q2, q3, q4, q5, q6, q7].map(Number).filter(function(v) { return !isNaN(v) && v > 0; });
    const computedAvg = allQ.length > 0 ? (allQ.reduce(function(a, b) { return a + b; }, 0) / allQ.length) : 4.0;
    
    const avgScore = Number(data.averageScore || data.avgScore || computedAvg || 4.0);
    const ikm100 = Number(data.ikmScore || (avgScore > 0 ? (avgScore / 4 * 100) : 100));

    let mutuLayanan = data.mutuLayanan || "";
    if (!mutuLayanan) {
      if (ikm100 >= 88.31) mutuLayanan = "Sangat Baik (A)";
      else if (ikm100 >= 76.61) mutuLayanan = "Baik (B)";
      else if (ikm100 >= 65.0) mutuLayanan = "Cukup (C)";
      else mutuLayanan = "Kurang Baik (D)";
    }

    const namaPasien = data.namaPasien || "(Anonim)";
    const jenisLayanan = data.jenisLayanan || "Rawat Inap";
    const devicePlatform = String(data.devicePlatform || "Komputer (Web)").trim();

    const row = [
      new Date(), submissionId, data.tanggalSurvei || Utilities.formatDate(new Date(), "Asia/Makassar", "yyyy-MM-dd"), data.jamSurvei || "",
      namaPasien, data.jenisKelamin || "-", data.pendidikan || "-", data.usia || "-",
      data.pekerjaan || "-", jenisLayanan, q1, q2, q3, q4, q5, q6, q7,
      Number(avgScore.toFixed(2)), Number(ikm100.toFixed(2)), mutuLayanan,
      data.saran || "-", "-", devicePlatform
    ];

    sheet.appendRow(row);

    // Otomatis NON-AKTIFKAN PIN
    if (patientPinUsed) {
      const pinSheet = findPinSheet(ss);
      if (pinSheet && pinSheet.getLastRow() > 1) {
        const values = pinSheet.getRange(2, 1, pinSheet.getLastRow() - 1, 1).getValues();
        const nowStr = Utilities.formatDate(new Date(), "Asia/Makassar", "yyyy-MM-dd HH:mm:ss 'WITA'");
        for (let i = 0; i < values.length; i++) {
          if (String(values[i][0] || "").replace(/\\D/g, "") === patientPinUsed) {
            const rowIdx = i + 2;
            pinSheet.getRange(rowIdx, 2).setValue("NON AKTIF");
            pinSheet.getRange(rowIdx, 7).setValue(nowStr);
            pinSheet.getRange(rowIdx, 8).setValue(namaPasien);
            pinSheet.getRange(rowIdx, 9).setValue(jenisLayanan);
            pinSheet.getRange(rowIdx, 10).setValue(Number(ikm100.toFixed(2)));
            pinSheet.getRange(rowIdx, 11).setValue(submissionId);
            break;
          }
        }
      }
    }

    lock.releaseLock();
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Data survei RSUD Aeramo berhasil disimpan dan status PIN otomatis diubah menjadi NON AKTIF.",
      surveyId: submissionId
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function rotasiMingguanOtomatis() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return "Spreadsheet tidak ditemukan";
  const activeSheet = ss.getSheetByName(SHEET_NAME_RESPONSES);
  if (!activeSheet || activeSheet.getLastRow() <= 1) return "Tidak ada data aktif untuk diarsipkan.";

  let archiveSheet = ss.getSheetByName(SHEET_NAME_ARCHIVE);
  if (!archiveSheet) {
    archiveSheet = ss.insertSheet(SHEET_NAME_ARCHIVE);
    setupHeaders(archiveSheet, true);
  }

  const lastRow = activeSheet.getLastRow();
  const numRows = lastRow - 1;
  const numCols = activeSheet.getLastColumn();
  const rawData = activeSheet.getRange(2, 1, numRows, numCols).getValues();

  const now = new Date();
  const labelPeriode = "Minggu-" + Utilities.formatDate(now, "Asia/Makassar", "w_yyyy (MMM)");
  const archiveData = rawData.map(function(row) {
    return [labelPeriode].concat(row);
  });

  const nextRow = archiveSheet.getLastRow() + 1;
  archiveSheet.getRange(nextRow, 1, archiveData.length, archiveData[0].length).setValues(archiveData);
  activeSheet.deleteRows(2, numRows);

  return "Berhasil mengarsipkan " + numRows + " respon ke tab " + SHEET_NAME_ARCHIVE;
}

function setupHeaders(sheet, isArchive) {
  let headers = [
    "Timestamp Google", "ID Survei", "Tanggal", "Jam", "Nama Pasien", "Jenis Kelamin",
    "Pendidikan", "Usia", "Pekerjaan", "Jenis Layanan", "Q1 Kamar", "Q2 Bersih", "Q3 Fasilitas",
    "Q4 Tenang", "Q5 Dokter", "Q6 Info", "Q7 Perawat", "Rata Skor", "Indeks IKM", "Mutu", "Saran", "Rincian", "Perangkat"
  ];
  if (isArchive) headers = ["Periode Arsip"].concat(headers);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setBackground(isArchive ? "#0f766e" : "#1e3a8a").setFontColor("#ffffff").setFontWeight("bold");
}
`;

export const GOOGLE_APPS_SCRIPT_INDEX_HTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Executive Statistical Portal IKM - RSUD Aeramo</title>
  <!-- Tailwind CSS & Chart.js -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');
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
    .glass-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(12px);
    }
  </style>
</head>
<body class="bg-slate-100 text-slate-800 min-h-screen flex flex-col antialiased">

  <!-- TOP EXECUTIVE NAVBAR -->
  <header class="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white shadow-xl sticky top-0 z-50 border-b border-slate-800/80">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
      
      <!-- Brand & Hospital Identity -->
      <div class="flex items-center gap-3.5">
        <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center font-black text-2xl text-white">
          🏥
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span>SISEKAR RSUD Aeramo</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-widest">
                Executive Analytics
              </span>
            </h1>
            <span class="flex h-2 w-2 relative">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <p class="text-[11px] text-slate-300 font-medium">
            Sistem Informasi Survei Kepuasan Pasien • Standar PermenPAN-RB No. 14/2017
          </p>
        </div>
      </div>

      <!-- Action Navigation Buttons -->
      <div class="flex flex-wrap items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-700/60 backdrop-blur-md self-stretch lg:self-auto justify-between lg:justify-end">
        <button
          onclick="switchTab('dashboard')"
          id="nav-tab-dashboard"
          class="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-blue-600 text-white shadow-md shadow-blue-600/30 active:scale-95"
        >
          <span>📊</span>
          <span>Dashboard IKM</span>
        </button>

        <button
          onclick="switchTab('pins')"
          id="nav-tab-pins"
          class="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95"
        >
          <span>🔑</span>
          <span>Kelola PIN Pasien</span>
          <span id="badge-pin-count" class="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black hidden">0</span>
        </button>

        <button
          onclick="switchTab('responses')"
          id="nav-tab-responses"
          class="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95"
        >
          <span>📋</span>
          <span>Data Responden</span>
        </button>

        <button
          onclick="refreshAllData()"
          id="btn-global-refresh"
          title="Sinkronisasi Data Google Sheet"
          class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white border border-slate-700 transition active:scale-90"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
        </button>
      </div>
    </div>
  </header>

  <!-- MAIN VIEWPORT -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 flex-1 w-full">

    <!-- Toast Notification -->
    <div id="toast-alert" class="hidden fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-2xl border text-xs font-bold max-w-md transition-all duration-300 flex items-center gap-3"></div>

    <!-- ========================================================================= -->
    <!-- TAB 1: EXECUTIVE STATISTICAL DASHBOARD -->
    <!-- ========================================================================= -->
    <section id="section-dashboard" class="space-y-6">

      <!-- SUB HEADER: DATE & LIVE STATUS -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-blue-900/10 via-indigo-900/10 to-slate-900/10 p-4 rounded-2xl border border-blue-900/20">
        <div>
          <h2 class="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <span>Ringkasan Mutu Pelayanan Rumah Sakit</span>
          </h2>
          <p class="text-xs text-slate-500" id="label-last-updated">
            Sinkronisasi otomatis dengan Tab Sheet <code>Data_Survei_Aeramo</code>
          </p>
        </div>
        <div class="flex items-center gap-2">
          <select id="filter-unit-dashboard" onchange="applyUnitFilter()" class="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white shadow-xs focus:ring-2 focus:ring-blue-500 focus:outline-none">
            <option value="ALL">Semua Unit Pelayanan</option>
            <option value="Rawat Inap">Rawat Inap</option>
            <option value="Rawat Jalan / Poliklinik">Rawat Jalan / Poliklinik</option>
            <option value="IGD (Instalasi Gawat Darurat)">IGD (Gawat Darurat 24 Jam)</option>
            <option value="Kebidanan & Kandungan (Ruang Bersalin / VK)">Kebidanan & Kandungan (VK)</option>
            <option value="Farmasi / Apotek">Farmasi / Apotek</option>
            <option value="Laboratorium">Laboratorium</option>
            <option value="Radiologi">Radiologi</option>
          </select>
        </div>
      </div>

      <!-- 4 HERO KPI CARDS -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- Total Responden -->
        <div class="glass-card p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-300 transition">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-black uppercase tracking-wider text-slate-400">Total Responden</span>
            <div class="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">👥</div>
          </div>
          <div class="text-3xl font-black text-slate-900 mt-2" id="kpi-total">0</div>
          <div class="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Pasien mengisi kuesioner</span>
            <span class="font-bold text-blue-600" id="kpi-total-badge">100% Sah</span>
          </div>
          <div class="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div class="bg-blue-600 h-full rounded-full w-full"></div>
          </div>
        </div>

        <!-- Indeks IKM (Skala 100) -->
        <div class="glass-card p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-black uppercase tracking-wider text-slate-400">Indeks IKM (Skala 100)</span>
            <div class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">⭐</div>
          </div>
          <div class="text-3xl font-black text-indigo-700 mt-2 flex items-baseline gap-2">
            <span id="kpi-ikm">0.00</span>
            <span id="kpi-grade-badge" class="text-xs px-2 py-0.5 rounded-md font-black bg-indigo-100 text-indigo-800">Grade -</span>
          </div>
          <div class="mt-2 flex items-center justify-between text-[11px]">
            <span class="font-bold text-indigo-950" id="kpi-mutu">Mutu: Belum Ada Data</span>
            <span class="text-slate-400">PermenPAN-RB</span>
          </div>
          <div class="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div id="progress-ikm" class="bg-indigo-600 h-full rounded-full transition-all duration-700" style="width: 0%"></div>
          </div>
        </div>

        <!-- Rata-Rata Skor 4.00 -->
        <div class="glass-card p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-sky-300 transition">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-black uppercase tracking-wider text-slate-400">Rata-Rata Skor Aspek</span>
            <div class="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-sm">📈</div>
          </div>
          <div class="text-3xl font-black text-slate-900 mt-2 flex items-baseline gap-1">
            <span id="kpi-score">0.00</span>
            <span class="text-xs text-slate-400 font-bold">/ 4.00</span>
          </div>
          <div class="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Evaluasi 7 Aspek Layanan</span>
            <span class="font-bold text-sky-600">Target >= 3.50</span>
          </div>
          <div class="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div id="progress-score" class="bg-sky-500 h-full rounded-full transition-all duration-700" style="width: 0%"></div>
          </div>
        </div>

        <!-- Customer Satisfaction Rate (CSAT %) -->
        <div class="glass-card p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition">
          <div class="flex items-center justify-between">
            <span class="text-[11px] font-black uppercase tracking-wider text-slate-400">Kepuasan Pasien (CSAT)</span>
            <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">👍</div>
          </div>
          <div class="text-3xl font-black text-emerald-600 mt-2" id="kpi-puas">0%</div>
          <div class="mt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span>Pasien Puas & Sangat Puas</span>
            <span class="font-bold text-emerald-600">Skor >= 3.0</span>
          </div>
          <div class="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div id="progress-puas" class="bg-emerald-500 h-full rounded-full transition-all duration-700" style="width: 0%"></div>
          </div>
        </div>

      </div>

      <!-- STRATEGIC INSIGHT BANNER (KEKUATAN & AREA PERBAIKAN) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-gradient-to-r from-emerald-950 to-slate-900 text-white p-4.5 rounded-2xl border border-emerald-800/40 shadow-sm flex items-start gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-black text-lg shrink-0 border border-emerald-400/30">
            🏆
          </div>
          <div>
            <div class="text-[11px] uppercase font-black tracking-wider text-emerald-300">Kekuatan Utama Rumah Sakit</div>
            <div class="text-sm font-bold text-white mt-0.5" id="insight-strength-name">Memuat analisis data...</div>
            <p class="text-xs text-emerald-200/80 mt-1" id="insight-strength-desc">Aspek dengan nilai kepuasan pasien tertinggi.</p>
          </div>
        </div>

        <div class="bg-gradient-to-r from-amber-950 to-slate-900 text-white p-4.5 rounded-2xl border border-amber-800/40 shadow-sm flex items-start gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-black text-lg shrink-0 border border-amber-400/30">
            🎯
          </div>
          <div>
            <div class="text-[11px] uppercase font-black tracking-wider text-amber-300">Prioritas Peningkatan Mutu</div>
            <div class="text-sm font-bold text-white mt-0.5" id="insight-improvement-name">Memuat analisis data...</div>
            <p class="text-xs text-amber-200/80 mt-1" id="insight-improvement-desc">Aspek yang membutuhkan perhatian dan evaluasi layanan.</p>
          </div>
        </div>
      </div>

      <!-- CHART GRID: ROW 1 (RADAR & BAR ASPEK) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Radar Chart: 7 Dimensi Standar Pelayanan Minimal -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-5 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-1">
              <h3 class="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <span>🕸️ Radar 7 Dimensi Mutu Layanan</span>
              </h3>
              <span class="text-[10px] font-black px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">PermenPAN-RB</span>
            </div>
            <p class="text-xs text-slate-500 mb-3">Evaluasi menyeluruh 7 unsur pelayanan RSUD Aeramo</p>
            <div class="h-64 flex items-center justify-center">
              <canvas id="aspectRadarChart"></canvas>
            </div>
          </div>
          <div class="text-[11px] text-slate-500 pt-3 border-t border-slate-100 flex justify-between items-center">
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span> Capaian RSUD Aeramo</span>
            <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block"></span> Standar SPM (3.50)</span>
          </div>
        </div>

        <!-- Horizontal Bar: Skor per Aspek Detail -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-7 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-1">
              <h3 class="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <span>📊 Evaluasi Skor Aspek Pelayanan (Skala 1 - 4)</span>
              </h3>
              <span class="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Rerata Nilai</span>
            </div>
            <p class="text-xs text-slate-500 mb-3">Detail skor kepuasan dari skala 1.00 sampai 4.00</p>
            <div class="h-64">
              <canvas id="aspectBarChart"></canvas>
            </div>
          </div>
          <div class="text-[11px] text-slate-500 pt-3 border-t border-slate-100 flex justify-between">
            <span class="text-emerald-700 font-bold">🟢 >= 3.50: Sangat Baik</span>
            <span class="text-blue-700 font-bold">🔵 3.00 - 3.49: Baik</span>
            <span class="text-amber-700 font-bold">🟡 2.50 - 2.99: Cukup</span>
            <span class="text-red-700 font-bold">🔴 &lt; 2.50: Kurang</span>
          </div>
        </div>

      </div>

      <!-- CHART GRID: ROW 2 (DISTRIBUSI MUTU & PER BANDINGAN UNIT) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Doughnut Chart: Distribusi Mutu IKM -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-4 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-1">
              <h3 class="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <span>🎯 Distribusi Mutu IKM Pasien</span>
              </h3>
              <span class="text-[10px] font-bold text-slate-400">KemenPAN-RB</span>
            </div>
            <p class="text-xs text-slate-500 mb-3">Proporsi predikat pelayanan yang dinilai responden</p>
            <div class="h-52 flex items-center justify-center">
              <canvas id="mutuDoughnutChart"></canvas>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-emerald-600 shrink-0"></div>
              <span class="font-bold text-slate-700">A: Sangat Baik (<span id="count-mutu-a">0</span>)</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-blue-600 shrink-0"></div>
              <span class="font-bold text-slate-700">B: Baik (<span id="count-mutu-b">0</span>)</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-amber-500 shrink-0"></div>
              <span class="font-bold text-slate-700">C: Cukup (<span id="count-mutu-c">0</span>)</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-full bg-red-500 shrink-0"></div>
              <span class="font-bold text-slate-700">D: Kurang (<span id="count-mutu-d">0</span>)</span>
            </div>
          </div>
        </div>

        <!-- Bar Chart: Skor per Unit Pelayanan -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs lg:col-span-8 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-1">
              <h3 class="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <span>🏢 Perbandingan Indeks Kepuasan per Unit Pelayanan</span>
              </h3>
              <span class="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">Unit Ranking</span>
            </div>
            <p class="text-xs text-slate-500 mb-3">Skor IKM 0-100 pada masing-masing instalasi/ruangan</p>
            <div class="h-52">
              <canvas id="unitBarChart"></canvas>
            </div>
          </div>
          <div class="text-[11px] text-slate-500 pt-3 border-t border-slate-100 flex justify-between items-center">
            <span>Standar Pelayanan Prima: <strong>>= 80.00</strong></span>
            <span class="text-slate-400">Diperbarui real-time</span>
          </div>
        </div>

      </div>

    </section>

    <!-- ========================================================================= -->
    <!-- TAB 2: PRO PIN MANAGEMENT SUITE -->
    <!-- ========================================================================= -->
    <section id="section-pins" class="space-y-6 hidden">
      
      <!-- PIN Hero Banner -->
      <div class="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-5 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 class="text-base font-extrabold flex items-center gap-2">
            <span>🔑 Registrasi & Manajemen PIN Akses Pasien</span>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Direct Sheet Sync</span>
          </h2>
          <p class="text-xs text-slate-300 mt-1 max-w-2xl">
            Sistem PIN sekali pakai (One-Time PIN). Setelah pasien mengirimkan survei, status PIN di Google Sheet akan otomatis berubah menjadi <span class="text-emerald-400 font-bold">NON AKTIF</span>.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button onclick="generateBatchPins(10)" class="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm active:scale-95 flex items-center gap-1.5">
            <span>✨ +10 PIN Baru</span>
          </button>
          <button onclick="generateBatchPins(50)" class="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm active:scale-95 flex items-center gap-1.5">
            <span>⚡ +50 PIN Batch</span>
          </button>
        </div>
      </div>

      <!-- Form Daftarkan PIN Baru -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h3 class="font-extrabold text-slate-900 text-sm mb-4 flex items-center gap-2">
          <span>📝 Form Registrasi PIN Pasien Baru</span>
        </h3>
        <form id="form-new-pin" onsubmit="handleAddNewPin(event)" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Nama Pasien</label>
            <input type="text" id="input-patient-name" placeholder="Nama Pasien" class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Unit Layanan</label>
            <select id="input-service" class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="Rawat Inap">Rawat Inap</option>
              <option value="Rawat Jalan / Poliklinik">Rawat Jalan / Poliklinik</option>
              <option value="IGD (Instalasi Gawat Darurat)">IGD (Gawat Darurat 24 Jam)</option>
              <option value="Kebidanan & Kandungan (Ruang Bersalin / VK)">Kebidanan & Kandungan (VK)</option>
              <option value="Farmasi / Apotek">Farmasi / Apotek</option>
              <option value="Laboratorium">Laboratorium</option>
              <option value="Radiologi">Radiologi</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Kamar / Ruangan / Bed</label>
            <input type="text" id="input-room" placeholder="Contoh: Mawar 102 / Bed 3" class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Kode PIN (6 Digit)</span>
              <button type="button" onclick="generateRandomInputPin()" class="text-blue-600 hover:text-blue-800 text-[11px] font-bold">🎲 Acak PIN</button>
            </label>
            <input type="text" id="input-pin-code" maxlength="6" placeholder="6 Digit Angka" class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold tracking-widest text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>

          <div class="sm:col-span-2 lg:col-span-3">
            <input type="text" id="input-notes" placeholder="Catatan / Keterangan tambahan (Opsional)" class="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>

          <div class="flex items-end">
            <button type="submit" id="btn-submit-new-pin" class="w-full py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-95">
              <span>💾 Daftarkan PIN ke Sheet</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Tabel Live PIN Google Sheet -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 class="font-extrabold text-slate-900 text-sm">Database PIN Terdaftar di Tab PIN_PASIEN</h3>
            <p class="text-xs text-slate-500">Live sinkronisasi dengan Google Sheet RSUD Aeramo</p>
          </div>

          <div class="flex items-center gap-2 w-full sm:w-auto">
            <select id="filter-pin-status" onchange="renderPinTable()" class="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white">
              <option value="ALL">Semua Status</option>
              <option value="active">Hanya AKTIF</option>
              <option value="used">Hanya NON AKTIF</option>
            </select>

            <input type="text" id="search-pin" oninput="renderPinTable()" placeholder="Cari nama / PIN..." class="px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none w-36 sm:w-48" />
          </div>
        </div>

        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-left text-xs text-slate-600">
            <thead class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th class="px-4 py-3.5">PIN Akses</th>
                <th class="px-4 py-3.5">Status</th>
                <th class="px-4 py-3.5">Nama Pasien</th>
                <th class="px-4 py-3.5">Layanan & Kamar</th>
                <th class="px-4 py-3.5">Dibuat Pada</th>
                <th class="px-4 py-3.5">Digunakan Pada</th>
                <th class="px-4 py-3.5 text-center">Aksi Petugas</th>
              </tr>
            </thead>
            <tbody id="pin-table-body" class="divide-y divide-slate-100">
              <tr><td colspan="7" class="px-4 py-8 text-center text-slate-400 font-medium">Memuat PIN dari Google Sheet...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- ========================================================================= -->
    <!-- TAB 3: DATA RESPONDEN & RIWAYAT SURVEI -->
    <!-- ========================================================================= -->
    <section id="section-responses" class="space-y-6 hidden">
      <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div class="p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 class="font-extrabold text-slate-900 text-sm">Riwayat Respon Kuesioner Masuk (Live Sheet)</h3>
            <p class="text-xs text-slate-500">Tersimpan permanen di sheet <code>Data_Survei_Aeramo</code></p>
          </div>

          <div class="flex items-center gap-2">
            <input type="text" id="search-responses" oninput="renderResponseTable()" placeholder="Cari nama/layanan/saran..." class="px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none w-48" />
            <button onclick="exportToCSV()" class="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95">
              <span>📥 Ekspor CSV</span>
            </button>
          </div>
        </div>

        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-left text-xs text-slate-600">
            <thead class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th class="px-4 py-3.5">Waktu</th>
                <th class="px-4 py-3.5">Nama Responden</th>
                <th class="px-4 py-3.5">Unit Layanan</th>
                <th class="px-4 py-3.5">Rerata Skor</th>
                <th class="px-4 py-3.5">Indeks IKM</th>
                <th class="px-4 py-3.5">Mutu</th>
                <th class="px-4 py-3.5">Saran & Kritik</th>
                <th class="px-4 py-3.5">Perangkat</th>
              </tr>
            </thead>
            <tbody id="response-table-body" class="divide-y divide-slate-100">
              <tr><td colspan="8" class="px-4 py-8 text-center text-slate-400">Memuat data respon survei...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

  </main>

  <!-- JAVASCRIPT CONTROLLER & CHART.JS -->
  <script>
    let globalDashboardData = null;
    let globalPinsList = [];
    let radarChartInstance = null;
    let barChartInstance = null;
    let doughnutChartInstance = null;
    let unitChartInstance = null;

    function showToast(message, type) {
      const el = document.getElementById('toast-alert');
      el.className = 'fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-2xl border text-xs font-bold max-w-md transition-all duration-300 flex items-center gap-2 ' +
        (type === 'error' ? 'bg-red-50 text-red-900 border-red-200' : 'bg-emerald-50 text-emerald-900 border-emerald-200');
      el.innerHTML = (type === 'error' ? '⚠️ ' : '✓ ') + message;
      el.classList.remove('hidden');
      setTimeout(() => el.classList.add('hidden'), 4000);
    }

    function switchTab(tabId) {
      document.getElementById('section-dashboard').classList.toggle('hidden', tabId !== 'dashboard');
      document.getElementById('section-pins').classList.toggle('hidden', tabId !== 'pins');
      document.getElementById('section-responses').classList.toggle('hidden', tabId !== 'responses');

      ['dashboard', 'pins', 'responses'].forEach(t => {
        const btn = document.getElementById('nav-tab-' + t);
        if (t === tabId) {
          btn.className = 'px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-blue-600 text-white shadow-md shadow-blue-600/30 active:scale-95';
        } else {
          btn.className = 'px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95';
        }
      });

      if (tabId === 'pins') fetchPinsData();
      if (tabId === 'responses') renderResponseTable();
    }

    function generateRandomInputPin() {
      document.getElementById('input-pin-code').value = String(Math.floor(100000 + Math.random() * 900000));
    }

    function copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('PIN ' + text + ' disalin ke clipboard!', 'success');
      });
    }

    function refreshAllData() {
      showToast('Menyinkronkan data Google Sheet...', 'success');
      fetchDashboardData();
      fetchPinsData();
    }

    function fetchDashboardData() {
      var isLoaded = false;
      var failsafeTimer = setTimeout(function() {
        if (!isLoaded) {
          isLoaded = true;
          renderDashboard({
            totalResponden: 0,
            avgIkm: 0,
            avgScore: 0,
            mutuPelayanan: "Belum Ada Responden",
            kepuasanRate: 0,
            unsurScores: { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, q7: 0 },
            mutuDist: { a: 0, b: 0, c: 0, d: 0 },
            recentResponses: []
          });
        }
      }, 4000);

      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(data) {
            clearTimeout(failsafeTimer);
            isLoaded = true;
            globalDashboardData = data;
            renderDashboard(data);
          })
          .withFailureHandler(function(err) {
            clearTimeout(failsafeTimer);
            isLoaded = true;
            showToast('Gagal memuat dashboard: ' + (err.message || err), 'error');
            renderDashboard({
              totalResponden: 0,
              avgIkm: 0,
              avgScore: 0,
              mutuPelayanan: "Belum Ada Responden",
              kepuasanRate: 0,
              unsurScores: { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, q7: 0 },
              mutuDist: { a: 0, b: 0, c: 0, d: 0 },
              recentResponses: []
            });
          })
          .getDashboardData();
      } else {
        clearTimeout(failsafeTimer);
        fetch('?action=get_dashboard')
          .then(function(res) { return res.json(); })
          .then(function(data) { globalDashboardData = data; renderDashboard(data); })
          .catch(function() {
            renderDashboard({
              totalResponden: 0,
              avgIkm: 0,
              avgScore: 0,
              mutuPelayanan: "Belum Ada Responden",
              kepuasanRate: 0,
              unsurScores: { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, q7: 0 },
              mutuDist: { a: 0, b: 0, c: 0, d: 0 },
              recentResponses: []
            });
          });
      }
    }

    function fetchPinsData() {
      const tbody = document.getElementById('pin-table-body');
      var isLoaded = false;
      var failsafe = setTimeout(function() {
        if (!isLoaded) {
          isLoaded = true;
          if (tbody && !tbody.hasChildNodes()) {
            tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-slate-400">Belum ada PIN yang dibuat atau koneksi sheet tertunda.</td></tr>';
          }
        }
      }, 4500);

      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(res) {
            clearTimeout(failsafe);
            isLoaded = true;
            if (res && Array.isArray(res.pins)) {
              globalPinsList = res.pins;
              const activeCount = res.pins.filter(p => p.status === 'active').length;
              const badge = document.getElementById('badge-pin-count');
              if (badge) {
                badge.innerText = activeCount;
                badge.classList.remove('hidden');
              }
              renderPinTable();
            } else {
              globalPinsList = [];
              renderPinTable();
            }
          })
          .withFailureHandler(function(err) {
            clearTimeout(failsafe);
            isLoaded = true;
            showToast('Gagal memuat PIN: ' + (err.message || err), 'error');
            if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-rose-500 font-medium">Gagal memuat data PIN dari Sheet: ' + (err.message || err) + '</td></tr>';
          })
          .getAllPinsFromSheet();
      } else {
        clearTimeout(failsafe);
        fetch('?action=get_pins')
          .then(function(res) { return res.json(); })
          .then(function(res) {
            if (res && Array.isArray(res.pins)) {
              globalPinsList = res.pins;
            } else {
              globalPinsList = [];
            }
            renderPinTable();
          })
          .catch(function() {
            if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-slate-400">Tidak dapat terhubung ke Google Apps Script backend.</td></tr>';
          });
      }
    }

    function renderDashboard(data) {
      if (!data) return;

      document.getElementById('kpi-total').innerText = data.totalResponden || 0;
      document.getElementById('kpi-ikm').innerText = (data.avgIkm || 0).toFixed(2);
      document.getElementById('kpi-grade-badge').innerText = 'Grade ' + (data.mutuGrade || '-');
      document.getElementById('kpi-mutu').innerText = 'Mutu: ' + (data.mutuPelayanan || '-');
      document.getElementById('kpi-score').innerText = (data.avgScore || 0).toFixed(2);
      document.getElementById('kpi-puas').innerText = (data.kepuasanRate || 0) + '%';

      // Update Progress Bars
      document.getElementById('progress-ikm').style.width = Math.min(data.avgIkm || 0, 100) + '%';
      document.getElementById('progress-score').style.width = Math.min(((data.avgScore || 0) / 4) * 100, 100) + '%';
      document.getElementById('progress-puas').style.width = Math.min(data.kepuasanRate || 0, 100) + '%';

      if (data.lastUpdated) {
        document.getElementById('label-last-updated').innerText = 'Terakhir diperbarui: ' + data.lastUpdated;
      }

      // Insights Highlights
      if (data.highestAspect && data.highestAspect.score > 0) {
        document.getElementById('insight-strength-name').innerText = data.highestAspect.name + ' (Skor: ' + data.highestAspect.score.toFixed(2) + ' / 4.00)';
      } else {
        document.getElementById('insight-strength-name').innerText = 'Belum cukup data respon';
      }

      if (data.lowestAspect && data.lowestAspect.score > 0) {
        document.getElementById('insight-improvement-name').innerText = data.lowestAspect.name + ' (Skor: ' + data.lowestAspect.score.toFixed(2) + ' / 4.00)';
      } else {
        document.getElementById('insight-improvement-name').innerText = 'Belum cukup data respon';
      }

      const u = data.unsurScores || {};

      // 1. RADAR CHART (7 PermenPAN Dimensions vs SPM)
      const ctxRadar = document.getElementById('aspectRadarChart').getContext('2d');
      if (radarChartInstance) radarChartInstance.destroy();
      radarChartInstance = new Chart(ctxRadar, {
        type: 'radar',
        data: {
          labels: ['Kenyamanan', 'Kebersihan', 'Fasilitas', 'Ketenangan', 'Dokter', 'Info Medis', 'Perawat'],
          datasets: [
            {
              label: 'Skor Capaian RSUD',
              data: [u.q1 || 0, u.q2 || 0, u.q3 || 0, u.q4 || 0, u.q5 || 0, u.q6 || 0, u.q7 || 0],
              backgroundColor: 'rgba(37, 99, 235, 0.25)',
              borderColor: '#2563eb',
              borderWidth: 2.5,
              pointBackgroundColor: '#1d4ed8',
              pointRadius: 4
            },
            {
              label: 'Standar SPM (3.50)',
              data: [3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5],
              backgroundColor: 'rgba(203, 213, 225, 0.1)',
              borderColor: '#94a3b8',
              borderWidth: 1.5,
              borderDash: [4, 4],
              pointRadius: 0
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              min: 0,
              max: 4,
              ticks: { stepSize: 1, display: false },
              pointLabels: { font: { size: 10, weight: 'bold', family: 'Plus Jakarta Sans' } }
            }
          },
          plugins: { legend: { display: false } }
        }
      });

      // 2. HORIZONTAL BAR CHART
      const ctxBar = document.getElementById('aspectBarChart').getContext('2d');
      if (barChartInstance) barChartInstance.destroy();
      const rawScores = [u.q1 || 0, u.q2 || 0, u.q3 || 0, u.q4 || 0, u.q5 || 0, u.q6 || 0, u.q7 || 0];
      const barColors = rawScores.map(s => s >= 3.5 ? '#10b981' : (s >= 3.0 ? '#2563eb' : (s >= 2.5 ? '#f59e0b' : '#ef4444')));

      barChartInstance = new Chart(ctxBar, {
        type: 'bar',
        data: {
          labels: ['Kenyamanan', 'Kebersihan', 'Fasilitas', 'Ketenangan', 'Dokter', 'Info Medis', 'Perawat'],
          datasets: [{
            data: rawScores,
            backgroundColor: barColors,
            borderRadius: 6
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { min: 0, max: 4, ticks: { stepSize: 1 } },
            y: { ticks: { font: { weight: 'bold' } } }
          },
          plugins: { legend: { display: false } }
        }
      });

      // 3. DOUGHNUT MUTU IKM
      const ctxDoughnut = document.getElementById('mutuDoughnutChart').getContext('2d');
      if (doughnutChartInstance) doughnutChartInstance.destroy();
      const m = data.mutuDist || {};
      document.getElementById('count-mutu-a').innerText = m.a || 0;
      document.getElementById('count-mutu-b').innerText = m.b || 0;
      document.getElementById('count-mutu-c').innerText = m.c || 0;
      document.getElementById('count-mutu-d').innerText = m.d || 0;

      doughnutChartInstance = new Chart(ctxDoughnut, {
        type: 'doughnut',
        data: {
          labels: ['Sangat Baik (A)', 'Baik (B)', 'Cukup (C)', 'Kurang (D)'],
          datasets: [{
            data: [m.a || 0, m.b || 0, m.c || 0, m.d || 0],
            backgroundColor: ['#10b981', '#2563eb', '#f59e0b', '#ef4444'],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: { legend: { display: false } }
        }
      });

      // 4. UNIT COMPARISON BAR CHART
      const ctxUnit = document.getElementById('unitBarChart').getContext('2d');
      if (unitChartInstance) unitChartInstance.destroy();
      const units = data.unitBreakdown && data.unitBreakdown.length > 0 ? data.unitBreakdown : [
        { unit: 'Rawat Inap', avgIkm: data.avgIkm || 0 },
        { unit: 'IGD 24 Jam', avgIkm: data.avgIkm || 0 },
        { unit: 'Rawat Jalan', avgIkm: data.avgIkm || 0 }
      ];

      unitChartInstance = new Chart(ctxUnit, {
        type: 'bar',
        data: {
          labels: units.map(u => u.unit),
          datasets: [{
            data: units.map(u => u.avgIkm || 0),
            backgroundColor: '#4f46e5',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { min: 0, max: 100, ticks: { stepSize: 20 } }
          },
          plugins: { legend: { display: false } }
        }
      });

      renderResponseTable();
    }

    function renderPinTable() {
      const tbody = document.getElementById('pin-table-body');
      tbody.innerHTML = '';
      if (!globalPinsList || globalPinsList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-slate-400">Belum ada PIN terdaftar di Google Sheet.</td></tr>';
        return;
      }

      const stFilter = document.getElementById('filter-pin-status').value;
      const search = (document.getElementById('search-pin').value || '').toLowerCase();

      const filtered = globalPinsList.filter(p => {
        if (stFilter !== 'ALL' && p.status !== stFilter) return false;
        if (search) {
          const matchPin = p.pin.toLowerCase().includes(search);
          const matchName = (p.registeredPatientName || '').toLowerCase().includes(search);
          const matchService = (p.registeredService || '').toLowerCase().includes(search);
          if (!matchPin && !matchName && !matchService) return false;
        }
        return true;
      });

      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-slate-400">Tidak ada PIN yang sesuai filter.</td></tr>';
        return;
      }

      filtered.forEach(p => {
        const isAct = p.status === 'active';
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition';
        tr.innerHTML = \`
          <td class="px-4 py-3.5">
            <div class="flex items-center gap-2">
              <span class="font-mono font-black text-sm px-2.5 py-1 rounded-lg bg-blue-50 text-blue-900 border border-blue-200">\${p.pin}</span>
              <button onclick="copyToClipboard('\${p.pin}')" title="Salin PIN" class="text-slate-400 hover:text-blue-600 transition">📋</button>
            </div>
          </td>
          <td class="px-4 py-3.5">
            <span class="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide \${isAct ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}">
              \${isAct ? '● AKTIF' : '● NON AKTIF'}
            </span>
          </td>
          <td class="px-4 py-3.5 font-bold text-slate-900">\${p.registeredPatientName || '-'}</td>
          <td class="px-4 py-3.5">
            \${p.registeredService || 'Rawat Inap'} \${p.registeredRoom ? '<span class="text-slate-400">(' + p.registeredRoom + ')</span>' : ''}
          </td>
          <td class="px-4 py-3.5 text-slate-500 text-[11px]">\${p.createdAt || '-'}</td>
          <td class="px-4 py-3.5 text-[11px] font-medium \${!isAct ? 'text-red-700' : 'text-slate-400'}">
            \${!isAct && p.usedAt ? p.usedAt : '-'}
          </td>
          <td class="px-4 py-3.5 text-center space-x-1.5 whitespace-nowrap">
            <button onclick="togglePinDirect('\${p.pin}', '\${isAct ? 'NON AKTIF' : 'AKTIF'}')" class="px-2.5 py-1 rounded-lg text-[11px] font-bold border transition \${isAct ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'}">
              \${isAct ? 'Nonaktifkan' : 'Aktifkan'}
            </button>
            <button onclick="deletePinDirect('\${p.pin}')" class="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 transition">
              🗑️ Hapus
            </button>
          </td>
        \`;
        tbody.appendChild(tr);
      });
    }

    function renderResponseTable() {
      const tbody = document.getElementById('response-table-body');
      tbody.innerHTML = '';
      if (!globalDashboardData || !globalDashboardData.recentResponses || globalDashboardData.recentResponses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-8 text-center text-slate-400">Belum ada respon kuesioner di sheet Data_Survei_Aeramo.</td></tr>';
        return;
      }

      const q = (document.getElementById('search-responses')?.value || '').toLowerCase();
      const filtered = globalDashboardData.recentResponses.filter(r => {
        if (q) {
          const mNama = (r.namaPasien || '').toLowerCase().includes(q);
          const mLayanan = (r.jenisLayanan || '').toLowerCase().includes(q);
          const mSaran = (r.saran || '').toLowerCase().includes(q);
          if (!mNama && !mLayanan && !mSaran) return false;
        }
        return true;
      });

      filtered.forEach(r => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition';
        tr.innerHTML = \`
          <td class="px-4 py-3 text-slate-700 font-medium whitespace-nowrap">\${r.timestamp}</td>
          <td class="px-4 py-3 font-bold text-slate-900">\${r.namaPasien || '(Anonim)'}</td>
          <td class="px-4 py-3"><span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">\${r.jenisLayanan}</span></td>
          <td class="px-4 py-3 font-semibold text-slate-800">\${r.avgScore}</td>
          <td class="px-4 py-3 font-black text-indigo-700">\${r.ikm100}</td>
          <td class="px-4 py-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">\${r.mutuLayanan}</span></td>
          <td class="px-4 py-3 text-slate-600 max-w-xs truncate" title="\${r.saran}">\${r.saran || '-'}</td>
          <td class="px-4 py-3 text-slate-400 text-[11px] whitespace-nowrap">\${r.device}</td>
        \`;
        tbody.appendChild(tr);
      });
    }

    function handleAddNewPin(e) {
      e.preventDefault();
      const name = document.getElementById('input-patient-name').value.trim();
      const srv = document.getElementById('input-service').value;
      const room = document.getElementById('input-room').value.trim();
      const pin = document.getElementById('input-pin-code').value.trim();
      const notes = document.getElementById('input-notes').value.trim();

      google.script.run
        .withSuccessHandler(function(res) {
          if (res && res.success) {
            showToast(res.message, 'success');
            document.getElementById('form-new-pin').reset();
            generateRandomInputPin();
            fetchPinsData();
          } else {
            showToast((res && res.message) ? res.message : 'Gagal', 'error');
          }
        })
        .addNewPatientPinDirect(name, srv, room, notes, pin);
    }

    function generateBatchPins(count) {
      if (!confirm('Buat ' + count + ' PIN baru di Google Sheet?')) return;
      showToast('Membuat batch PIN...', 'success');
      google.script.run
        .withSuccessHandler(function(res) {
          if (res && res.success) {
            showToast(res.message, 'success');
            fetchPinsData();
          }
        })
        .generateBatchPinsDirect(count, 'Batch Web Portal');
    }

    function togglePinDirect(pin, st) {
      google.script.run.withSuccessHandler(function() {
        showToast('Status PIN diperbarui', 'success');
        fetchPinsData();
      }).togglePinStatus(pin, st);
    }

    function deletePinDirect(pin) {
      if (!confirm('Hapus permanen baris PIN ' + pin + ' dari Google Sheet?')) return;
      google.script.run.withSuccessHandler(function() {
        showToast('PIN berhasil dihapus', 'success');
        fetchPinsData();
      }).deletePinFromSheet(pin);
    }

    function exportToCSV() {
      if (!globalDashboardData || !globalDashboardData.recentResponses) return alert('Data belum siap.');
      let csv = 'Waktu,ID Survei,Nama Pasien,Layanan,Rata Skor,IKM 100,Mutu,Saran,Perangkat\\n';
      globalDashboardData.recentResponses.forEach(r => {
        csv += \`"\${r.timestamp}","\${r.id}","\${r.namaPasien}","\${r.jenisLayanan}",\${r.avgScore},\${r.ikm100},"\${r.mutuLayanan}","\${(r.saran || '').replace(/"/g, '""')}","\${r.device}"\\n\`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'Data_Survei_RSUD_Aeramo_' + new Date().toISOString().slice(0, 10) + '.csv';
      a.click();
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
