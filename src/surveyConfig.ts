import { QuestionSection } from './types';

/**
 * ============================================================================
 * KONFIGURASI GOOGLE APPS SCRIPT RSUD AERAMO (DITANAMKAN LANGSUNG OLEH ADMIN)
 * ============================================================================
 * Pasien TIDAK AKAN PERNAH melihat URL ini di layar aplikasi.
 * Masukkan URL Web App Google Apps Script Anda (yang berakhiran /exec) di bawah ini.
 * Data hasil survei pasien akan langsung otomatis tersimpan ke Google Sheet Anda!
 * ============================================================================
 */
export const ADMIN_CONFIG = {
  // Masukkan URL Google Apps Script Web App Anda di sini (atau biarkan kosong untuk diisi via Portal Petugas Terproteksi):
  appsScriptUrl: 'https://script.google.com/macros/s/AKfycbx1D4bKq6D2c1ICYIwSKtYlFDd05VXH28iZ4vQ896rAAHJPhrVU4rnYH3XOd1l38iB36g/exec', // Web App RSUD Aeramo
  
  /**
   * PENGATURAN LOGO RESMI:
   * Anda bisa memasukkan:
   * 1. Link Google Drive (Pastikan izin file disetel: "Siapa saja yang memiliki link"):
   *    Contoh: 'https://drive.google.com/file/d/1a2b3c4d5e.../view?usp=sharing'
   * 2. Atau file gambar di folder public/ : '/logo.png'
   * 3. Jika dibiarkan kosong '', aplikasi akan otomatis menampilkan logo vektor bawaan.
   */
  logoUrl: '/LOGOPEMDA (1).png', 

  hospitalName: 'RSUD Aeramo',
  hospitalSubTitle: 'Pemerintah Kabupaten Nagekeo - Dinas Kesehatan',
  requirePatientPin: true, // Wajibkan PIN Satu Kali Pakai untuk Setiap Pasien
};

export interface SystemPresetPin {
  id: string;
  pin: string;
  status: 'active' | 'used';
  registeredPatientName?: string;
  registeredService?: string;
  registeredRoom?: string;
  label?: string;
  createdAt: string;
}

/**
 * Daftar PIN Pasien Bawaan Sistem RSUD Aeramo (Permanen di Seluruh Perangkat & Email)
 */
export const SYSTEM_PRESET_PINS: SystemPresetPin[] = [
  {
    id: 'pin_268907',
    pin: '268907',
    status: 'active',
    registeredPatientName: 'CHATRINA HERLOFINA PANIE',
    registeredService: 'Rawat Inap',
    registeredRoom: 'Kamar Mawar 102',
    label: 'Pasien: CHATRINA HERLOFINA PANIE',
    createdAt: '2026-09-23T01:00:00.000Z',
  },
  {
    id: 'pin_102938',
    pin: '102938',
    status: 'active',
    registeredPatientName: 'Bapak / Ibu Pasien',
    registeredService: 'Rawat Inap',
    registeredRoom: 'Kamar 101',
    label: 'Pasien Rawat Inap (Kamar 101)',
    createdAt: '2026-09-23T01:00:00.000Z',
  },
  {
    id: 'pin_582049',
    pin: '582049',
    status: 'active',
    registeredPatientName: 'CHATRINA HERLOFINA PANIE',
    registeredService: 'Rawat Inap',
    registeredRoom: 'Kamar Mawar 102',
    label: 'Pasien: CHATRINA HERLOFINA PANIE',
    createdAt: '2026-09-23T01:30:26.831Z',
  },
  {
    id: 'pin_746193',
    pin: '746193',
    status: 'active',
    registeredPatientName: 'Pasien Poliklinik',
    registeredService: 'Rawat Jalan / Poliklinik',
    registeredRoom: 'Poli Penyakit Dalam',
    label: 'Pasien Poliklinik',
    createdAt: '2026-09-23T01:30:26.831Z',
  },
  {
    id: 'pin_391824',
    pin: '391824',
    status: 'active',
    registeredPatientName: 'Pasien Gawat Darurat',
    registeredService: 'IGD 24 Jam',
    registeredRoom: 'Bed 03',
    label: 'Pasien Gawat Darurat',
    createdAt: '2026-09-23T01:00:00.000Z',
  },
  {
    id: 'pin_829104',
    pin: '829104',
    status: 'active',
    registeredPatientName: 'Ibu & Anak',
    registeredService: 'Kebidanan & Kandungan (VK)',
    registeredRoom: 'Kamar Bersalin',
    label: 'Pasien VK / Bersalin',
    createdAt: '2026-09-23T01:00:00.000Z',
  },
  {
    id: 'pin_615284',
    pin: '615284',
    status: 'active',
    registeredPatientName: 'Pasien Umum',
    registeredService: 'Pelayanan RSUD Aeramo',
    label: 'Pasien Umum RSUD Aeramo',
    createdAt: '2026-09-23T01:00:00.000Z',
  },
  {
    id: 'pin_681619',
    pin: '681619',
    status: 'active',
    registeredPatientName: 'test',
    registeredService: 'Rawat Inap',
    label: 'Pasien: test (Rawat Inap)',
    createdAt: '2026-09-23T15:35:25.000Z',
  },
  {
    id: 'pin_905929',
    pin: '905929',
    status: 'active',
    registeredPatientName: 'test2',
    registeredService: 'Rawat Inap',
    label: 'Pasien: test2 (Rawat Inap)',
    createdAt: '2026-09-23T15:36:56.000Z',
  },
  {
    id: 'pin_777628',
    pin: '777628',
    status: 'active',
    registeredPatientName: 'Refli',
    registeredService: 'Rawat Inap',
    label: 'Pasien: Refli (Rawat Inap)',
    createdAt: '2026-09-23T15:42:39.000Z',
  },
  {
    id: 'pin_950529',
    pin: '950529',
    status: 'active',
    registeredPatientName: 'Test5',
    registeredService: 'Rawat Inap',
    label: 'Pasien: Test5 (Rawat Inap)',
    createdAt: '2026-09-23T16:02:37.000Z',
  },
];

/**
 * ============================================================================
 * KONFIGURASI FORMULIR SURVEI RSUD AERAMO - KABUPATEN NAGEKEO
 * ============================================================================
 * Anda dapat dengan sangat mudah mengembangkan dan menambah pertanyaan / bagian baru!
 * Cukup tambahkan objek di dalam array `SURVEY_SECTIONS` di bawah ini.
 * Pertanyaan baru akan otomatis tampil di layar dan dikirim ke Google Sheet.
 * ============================================================================
 */

export const HOSPITAL_HEADER_INFO = {
  kabupaten: 'PEMERINTAH KABUPATEN NAGEKEO',
  dinas: 'DINAS KESEHATAN',
  namaRS: 'RUMAH SAKIT UMUM DAERAH AERAMO',
  alamat: 'Jln. Prof. W. Z. Yohanes Kode Pos 86472',
  email: '-------/CP:-------',
  judulSurvei: 'SURVEI EVALUASI PENGALAMAN PASIEN di UNIT RAWAT INAP',
  instruksi:
    'Kami di RSUD Aeramo ingin memastikan bahwa Anda menerima pelayanan terbaik selama masa rawat inap Anda. Umpan balik Anda sangat penting bagi kami untuk meningkatkan kualitas layanan kami. Mohon luangkan waktu untuk mengisi survei ini dengan jujur. Semua jawaban Anda akan dirahasiakan.',
};

export interface SkalaOption {
  value: 1 | 2 | 3 | 4;
  label: string;
  shortLabel: string;
  emoji: string;
  description: string;
}

export const SKALA_OPTIONS: SkalaOption[] = [
  { 
    value: 1, 
    label: 'Sangat Tidak Puas', 
    shortLabel: 'STP', 
    emoji: '😡',
    description: 'Fasilitas atau pelayanan sangat mengecewakan, kotor, atau sangat mengganggu ketenangan.',
  },
  { 
    value: 2, 
    label: 'Tidak Puas', 
    shortLabel: 'TP', 
    emoji: '😮', 
    description: 'Fasilitas atau pelayanan belum memenuhi harapan dan memerlukan perbaikan segera.',
  },
  { 
    value: 3, 
    label: 'Puas', 
    shortLabel: 'P', 
    emoji: '😊', 
    description: 'Fasilitas bersih, memadai, nyaman, dan telah memenuhi standar pelayanan dengan baik.',
  },
  { 
    value: 4, 
    label: 'Sangat Puas', 
    shortLabel: 'SP', 
    emoji: '🤩', 
    description: 'Fasilitas sangat bersih, tenang, prima, dan pelayanan melebihi ekspektasi Anda.',
  },
];

/**
 * ============================================================================
 * PRESET PILIHAN JAWABAN SPESIFIK (SESUAI PERMENPAN-RB / STANDAR IKM NASIONAL)
 * ============================================================================
 * Anda dapat memasangkan preset ini ke setiap pertanyaan yang Anda inginkan
 * dengan menambahkan `options: OPSI_KESESUAIAN`, dll. pada SERVICE_QUESTIONS.
 * ============================================================================
 */

// 1. Unsur Kesesuaian Persyaratan Pelayanan (Gambar 1 No. 1)
export const OPSI_KESESUAIAN: SkalaOption[] = [
  { value: 1, label: 'Tidak sesuai', shortLabel: 'TS', emoji: '❌', description: 'Persyaratan pelayanan tidak sesuai atau sangat berbelit.' },
  { value: 2, label: 'Kurang sesuai', shortLabel: 'KS', emoji: '⚠️', description: 'Persyaratan pelayanan kurang sesuai dengan informasi.' },
  { value: 3, label: 'Sesuai', shortLabel: 'S', emoji: '✔️', description: 'Persyaratan pelayanan sesuai dengan ketentuan.' },
  { value: 4, label: 'Sangat sesuai', shortLabel: 'SS', emoji: '🌟', description: 'Persyaratan pelayanan sangat sesuai, transparan, dan jelas.' },
];

// 2. Unsur Kemudahan Sistem, Mekanisme, dan Prosedur (Gambar 1 No. 2)
export const OPSI_KEMUDAHAN: SkalaOption[] = [
  { value: 1, label: 'Tidak mudah', shortLabel: 'TM', emoji: '😣', description: 'Alur atau prosedur sangat rumit dan membingungkan.' },
  { value: 2, label: 'Kurang mudah', shortLabel: 'KM', emoji: '😕', description: 'Alur atau prosedur kurang mudah dipahami.' },
  { value: 3, label: 'Mudah', shortLabel: 'M', emoji: '🙂', description: 'Alur atau prosedur mudah dan runtut bagi pasien.' },
  { value: 4, label: 'Sangat mudah', shortLabel: 'SM', emoji: '😀', description: 'Alur atau prosedur sangat mudah, ringkas, dan praktis.' },
];

// 3. Unsur Kecepatan Waktu Pelayanan (Gambar 1 No. 3)
export const OPSI_KECEPATAN: SkalaOption[] = [
  { value: 1, label: 'Tidak cepat', shortLabel: 'TC', emoji: '⌛', description: 'Waktu pelayanan sangat lambat dan lama menunggu.' },
  { value: 2, label: 'Kurang cepat', shortLabel: 'KC', emoji: '⏳', description: 'Waktu pelayanan kurang cepat dan perlu antre.' },
  { value: 3, label: 'Cepat', shortLabel: 'C', emoji: '⚡', description: 'Waktu pelayanan cepat dan sesuai standar.' },
  { value: 4, label: 'Sangat cepat', shortLabel: 'SC', emoji: '🚀', description: 'Waktu pelayanan sangat cepat dan tanggap.' },
];

// 4. Unsur Biaya / Tarif Pelayanan (Gambar 1 No. 4)
export const OPSI_BIAYA_TARIF: SkalaOption[] = [
  { value: 1, label: 'Sangat mahal', shortLabel: 'SM', emoji: '💸', description: 'Biaya/tarif pelayanan dirasakan sangat mahal.' },
  { value: 2, label: 'Cukup mahal', shortLabel: 'CM', emoji: '💵', description: 'Biaya/tarif pelayanan dirasakan cukup mahal.' },
  { value: 3, label: 'Murah', shortLabel: 'M', emoji: '🏷️', description: 'Biaya/tarif pelayanan murah dan wajar.' },
  { value: 4, label: 'Gratis', shortLabel: 'G', emoji: '🛡️', description: 'Gratis (terjamin BPJS/JKN) atau tanpa biaya tambahan.' },
];

// 5. Unsur Kualitas Pelayanan / Spesifikasi (Gambar 1 No. 5 & Gambar 2 No. 6)
export const OPSI_KUALITAS_BAIK: SkalaOption[] = [
  { value: 1, label: 'Tidak baik', shortLabel: 'TB', emoji: '👎', description: 'Pelayanan atau penanganan dirasakan tidak baik.' },
  { value: 2, label: 'Kurang baik', shortLabel: 'KB', emoji: '⚠️', description: 'Pelayanan atau penanganan dirasakan kurang baik.' },
  { value: 3, label: 'Baik', shortLabel: 'B', emoji: '👍', description: 'Pelayanan atau penanganan baik dan memadai.' },
  { value: 4, label: 'Sangat baik', shortLabel: 'SB', emoji: '🏆', description: 'Pelayanan atau penanganan sangat baik dan memuaskan.' },
];

// 6. Unsur Perilaku Petugas / Kesopanan & Keramahan (Gambar 2 No. 7)
export const OPSI_KESOPANAN_KERAMAHAN: SkalaOption[] = [
  { value: 1, label: 'Tidak sopan, tidak ramah dan tidak rapi', shortLabel: 'TS', emoji: '😠', description: 'Petugas tidak bersikap sopan, tidak ramah, atau tidak rapi.' },
  { value: 2, label: 'Kurang sopan, kurang ramah dan kurang rapi', shortLabel: 'KS', emoji: '😐', description: 'Petugas kurang menunjukkan keramahan atau kesopanan.' },
  { value: 3, label: 'Sopan, ramah dan rapi', shortLabel: 'SR', emoji: '😊', description: 'Petugas bersikap sopan, ramah, santun, dan berpakaian rapi.' },
  { value: 4, label: 'Sangat sopan, sangat ramah dan sangat rapi', shortLabel: 'SSR', emoji: '🙏', description: 'Petugas sangat sopan, sangat ramah, hangat, dan sangat rapi.' },
];

// 7. Unsur Kualitas Sarana dan Prasarana (Gambar 2 No. 8)
export const OPSI_SARANA_PRASARANA: SkalaOption[] = [
  { value: 1, label: 'Tidak tersedia/tidak baik', shortLabel: 'TT', emoji: '🚫', description: 'Sarana/fasilitas tidak tersedia atau rusak dan tidak baik.' },
  { value: 2, label: 'Kurang tersedia/kurang baik', shortLabel: 'KT', emoji: '⚠️', description: 'Sarana/fasilitas terbatas atau kurang terawat.' },
  { value: 3, label: 'Tersedia dan baik', shortLabel: 'TB', emoji: '🏢', description: 'Sarana/fasilitas tersedia, berfungsi, dan dalam kondisi baik.' },
  { value: 4, label: 'Tersedia dan sangat baik', shortLabel: 'TSB', emoji: '✨', description: 'Sarana/fasilitas lengkap, modern, sangat bersih, dan sangat baik.' },
];

// 8. Unsur Penanganan Pengaduan, Saran dan Masukan (Gambar 2 No. 9)
export const OPSI_PENANGANAN_PENGADUAN: SkalaOption[] = [
  { value: 1, label: 'Tidak ada', shortLabel: 'TA', emoji: '❌', description: 'Tidak ada sarana pengaduan atau tindak lanjut sama sekali.' },
  { value: 2, label: 'Ada tetapi tidak berfungsi', shortLabel: 'TF', emoji: '⚠️', description: 'Ada saluran aduan namun tidak berfungsi.' },
  { value: 3, label: 'Ada tetapi kurang ditanggapi', shortLabel: 'KD', emoji: '💬', description: 'Aduan diterima tetapi kurang ditindaklanjuti secara cepat.' },
  { value: 4, label: 'Ada dan ditangani dengan baik', shortLabel: 'DB', emoji: '✅', description: 'Pengaduan ditangani secara cepat, tanggap, dan dengan solusi baik.' },
];

// 9. Opsi Kenyamanan Khusus Kamar Rawat Inap
export const OPSI_KENYAMANAN: SkalaOption[] = [
  { value: 1, label: 'Sangat tidak nyaman', shortLabel: 'STN', emoji: '😣', description: 'Kamar sangat panas, bising, atau tempat tidur tidak nyaman.' },
  { value: 2, label: 'Kurang nyaman', shortLabel: 'KN', emoji: '😐', description: 'Kamar kurang nyaman untuk istirahat pemulihan.' },
  { value: 3, label: 'Nyaman', shortLabel: 'N', emoji: '🙂', description: 'Kamar nyaman, bersih, sejuk, dan memadai.' },
  { value: 4, label: 'Sangat nyaman', shortLabel: 'SN', emoji: '🥰', description: 'Kamar sangat tenang, bersih, sejuk, dan sangat nyaman.' },
];

// 10. Opsi Kebersihan Khusus Kamar & Kamar Mandi
export const OPSI_KEBERSIHAN: SkalaOption[] = [
  { value: 1, label: 'Sangat tidak bersih', shortLabel: 'STB', emoji: '🤢', description: 'Kamar atau kamar mandi kotor, licin, berbau, atau tidak terawat.' },
  { value: 2, label: 'Kurang bersih', shortLabel: 'KB', emoji: '🧹', description: 'Ada bagian kamar mandi atau kamar yang kurang dibersihkan.' },
  { value: 3, label: 'Bersih', shortLabel: 'B', emoji: '✨', description: 'Kamar dan kamar mandi bersih, harum, dan dibersihkan berkala.' },
  { value: 4, label: 'Sangat bersih & higienis', shortLabel: 'SB', emoji: '💎', description: 'Kamar dan kamar mandi sangat bersih, kering, higienis, dan wangi.' },
];

// 11. Opsi Kejelasan Informasi Dokter / Nakes
export const OPSI_KEJELASAN: SkalaOption[] = [
  { value: 1, label: 'Tidak jelas', shortLabel: 'TJ', emoji: '❓', description: 'Penjelasan dokter tidak jelas, terburu-buru, atau membingungkan.' },
  { value: 2, label: 'Kurang jelas', shortLabel: 'KJ', emoji: '🤔', description: 'Masih banyak hal mengenai kondisi atau rencana rawat yang belum dipahami.' },
  { value: 3, label: 'Jelas', shortLabel: 'J', emoji: '💡', description: 'Dokter menjelaskan kondisi kesehatan dan perawatan secara jelas.' },
  { value: 4, label: 'Sangat jelas & komunikatif', shortLabel: 'SJ', emoji: '🌟', description: 'Dokter sangat jelas, sabar, detail, komunikatif, dan mudah dipahami.' },
];

/**
 * ============================================================================
 * DAFTAR PILIHAN DROP DOWN: JENIS LAYANAN YANG DITERIMA PASIEN
 * ============================================================================
 * Anda dapat menambah jenis layanan baru di daftar ini kapan saja.
 * ============================================================================
 */
export type ServiceKey = 
  | 'rawat_inap'
  | 'rawat_jalan'
  | 'igd'
  | 'farmasi'
  | 'laboratorium'
  | 'radiologi'
  | 'kebidanan'
  | 'lainnya';

export interface ServiceOption {
  id: ServiceKey;
  label: string;
  subTitle: string;
  badge: string;
  description: string;
}

export const SERVICE_OPTIONS: ServiceOption[] = [
  { 
    id: 'rawat_inap', 
    label: 'Rawat Inap', 
    subTitle: 'SURVEI KEPUASAN PASIEN di UNIT RAWAT INAP',
    badge: 'Unit Rawat Inap',
    description: 'Pelayanan kamar perawatan, kenyamanan, kebersihan, serta visite dokter dan perawat.'
  },
  { 
    id: 'rawat_jalan', 
    label: 'Rawat Jalan / Poliklinik', 
    subTitle: 'SURVEI KEPUASAN PASIEN di POLIKLINIK RAWAT JALAN',
    badge: 'Poliklinik Rawat Jalan',
    description: 'Pelayanan registrasi, ruang tunggu poli, serta konsultasi dokter spesialis.'
  },
  { 
    id: 'igd', 
    label: 'IGD (Instalasi Gawat Darurat)', 
    subTitle: 'SURVEI KEPUASAN PASIEN di INSTALASI GAWAT DARURAT (IGD)',
    badge: 'Gawat Darurat (IGD)',
    description: 'Pelayanan triase gawat darurat, ketanggapan dokter & perawat jaga, serta tindakan cepat.'
  },
  { 
    id: 'farmasi', 
    label: 'Farmasi / Apotek', 
    subTitle: 'SURVEI KEPUASAN PELAYANAN FARMASI & OBAT',
    badge: 'Instalasi Farmasi',
    description: 'Pelayanan penyerahan resep, kecepatan peracikan obat, dan penjelasan cara minum obat.'
  },
  { 
    id: 'laboratorium', 
    label: 'Laboratorium Klinik', 
    subTitle: 'SURVEI KEPUASAN PELAYANAN LABORATORIUM KLINIK',
    badge: 'Laboratorium Klinik',
    description: 'Pelayanan pengambilan sampel darah/urin, kebersihan ruangan, dan ketepatan hasil tes.'
  },
  { 
    id: 'radiologi', 
    label: 'Radiologi (Rontgen / USG)', 
    subTitle: 'SURVEI KEPUASAN PELAYANAN RADIOLOGI & DIAGNOSTIK',
    badge: 'Instalasi Radiologi',
    description: 'Pelayanan foto rontgen, USG, keramahan radiografer, dan kejelasan arahan posisi periksa.'
  },
  { 
    id: 'kebidanan', 
    label: 'Kebidanan & Kandungan (Ruang Bersalin / VK)', 
    subTitle: 'SURVEI KEPUASAN PELAYANAN KEBIDANAN & KANDUNGAN',
    badge: 'Kebidanan & VK',
    description: 'Pelayanan persalinan, ketelatenan bidan dan dokter obgyn, serta perawatan ibu dan bayi.'
  },
  { 
    id: 'lainnya', 
    label: 'Layanan Lainnya...', 
    subTitle: 'SURVEI KEPUASAN PASIEN & KELUARGA',
    badge: 'Layanan Rumah Sakit',
    description: 'Unit pendukung, loket administrasi, ambulans, gizi, atau layanan lain di RSUD Aeramo.'
  },
];

/**
 * ============================================================================
 * STRUKTUR PERTANYAAN KHUSUS UNTUK SETIAP JENIS LAYANAN
 * ============================================================================
 * ANDA DAPAT MENAMBAHKAN / MENGUBAH PERTANYAAN DI BAWAH INI SECARA LANGSUNG
 * DI GITHUB CODESPACES!
 *
 * Pola setiap pertanyaan:
 * {
 *   id: 'nama_unik_pertanyaan',
 *   aspek: 'Judul Aspek Singkat',
 *   uraian: 'Teks pertanyaan lengkap yang akan dibaca oleh pasien',
 * }
 * ============================================================================
 */
export const SERVICE_QUESTIONS: Record<ServiceKey, QuestionSection[]> = {
  // 1. UNIT RAWAT INAP
  rawat_inap: [
    {
      id: 'ri_bagian_1',
      title: 'Bagian 1 : Kenyamanan, Kualitas, Keramahan, Kerapihan NAKES dan Fasilitas Kamar Rawat Inap',
      description: 'Penilaian terhadap fasilitas, kebersihan, dan kenyamanan kamar rawat inap',
      questions: [
        {
          id: 'ri_q1_keterpenuhan_pelayanan',
          aspek: 'Aspek Keterpenuhan Pelayanan Pasien Rawat Inap',
          uraian: 'Menurut Bapak/Ibu, apakah persyaratan untuk mendapatkan pelayanan di Rumah Sakit ini mudah dipenuhi dan sesuai dengan pelayanan yang dibutuhkan?',
          targetPoint: 'q1', // -> Masuk ke Q1 (Persyaratan Pelayanan)
          options: OPSI_KESESUAIAN,
        },
        {
          id: 'ri_q2_kemudahan_prosedur',
          aspek: 'Aspek Kemudahan Akses dan Prosedur',
          uraian: 'Menurut Bapak/Ibu, apakah prosedur untuk mendapatkan pelayanan di ruangan/unit ini mudah dipahami dan dilakukan?',
          targetPoint: 'q2', // -> Masuk ke Q2 (Kemudahan Prosedur)
          options: OPSI_KEMUDAHAN,
        },
        {
          id: 'ri_q3_kecepatan_pelayanan',
          aspek: 'Aspek Kecepatan Pelayanan',
          uraian: 'Menurut Bapak/Ibu, apakah pelayanan yang diberikan kepada pasien dilakukan dengan cepat?',
          targetPoint: 'q3', // -> Masuk ke Q3 (Kecepatan Pelayanan)
          options: OPSI_KECEPATAN,
        },
        {
          id: 'ri_q4_kewajaran_biaya',
          aspek: 'Aspek Biaya',
          uraian: 'Menurut Bapak/Ibu, apakah biaya yang harus dibayar untuk mendapatkan pelayanan di Rumah Sakit ini sudah sesuai dan wajar?',
          targetPoint: 'q4', // -> Masuk ke Q4 (Kewajaran Biaya / Tarif)
          options: OPSI_BIAYA_TARIF,
        },
        {
          id: 'ri_q5_Kemampuan_pengetahuan',
          aspek: 'Aspek Kualitas NAKES',
          uraian: 'Menurut Bapak/Ibu, apakah petugas memiliki kemampuan dan pengetahuan yang baik dalam memberikan pelayanan kepada pasien?',
          targetPoint: 'q5', // -> Masuk ke Q5 (Kompetensi / Kualitas NAKES)
          options: OPSI_KUALITAS_BAIK,
        },
        {
          id: 'ri_q6_informasi_media',
          aspek: 'Aspek Pelayanan Informasi',
          uraian: 'Menurut Bapak/Ibu, apakah petugas menjelaskan kondisi pasien dengan jelas dan mudah dipahami?',
          targetPoint: 'q6', // -> Masuk ke Q6 (Pelayanan Informasi Medis)
          options: OPSI_KUALITAS_BAIK,
        },
        {
          id: 'ri_q7_keramahan_kerapihan',
          aspek: 'Aspek Keramahan Pelayanan dan Kerapihan',
          uraian: 'Menurut Bapak/Ibu, apakah petugas melayani pasien dengan sopan, ramah, dan berpenampilan rapi?',
          targetPoint: 'q7', // -> Masuk ke Q7 (Perilaku & Keramahan Petugas)
          options: OPSI_KESOPANAN_KERAMAHAN,
        },
        {
          id: 'ri_q8_fasilitas_sarana',
          aspek: 'Aspek Fasilitas Sarana/Prasarana',
          uraian: 'Menurut Bapak/Ibu, apakah fasilitas dan perlengkapan yang tersedia di Rumah Sakit ini cukup baik dan dapat digunakan dengan baik?',
          targetPoint: 'q1', // -> Dirata-ratakan bersama Q1 (Kualitas Fasilitas & Persyaratan Layanan)
          options: OPSI_SARANA_PRASARANA,
        },
        {
          id: 'ri_q9_pelayanan_pengaduan',
          aspek: 'Aspek Keluhan dan Pengaduan Pelayanan',
          uraian: 'Menurut Bapak/Ibu, apakah Rumah Sakit menyediakan tempat atau cara untuk menyampaikan keluhan, dan apakah keluhan tersebut ditanggapi dengan baik?',
          targetPoint: 'q6', // -> Dirata-ratakan bersama Q6 (Layanan Informasi & Respons Pengaduan)
          options: OPSI_PENANGANAN_PENGADUAN,
        },
      ],
    },
  ],

  // 2. POLIKLINIK RAWAT JALAN
  rawat_jalan: [
    {
      id: 'rj_bagian_1',
      title: 'Bagian 1 : Pendaftaran dan Ruang Tunggu Poliklinik',
      description: 'Penilaian alur antrean loket dan kenyamanan ruang tunggu poli',
      questions: [
        {
          id: 'rj_q1_kecepatan_loket',
          aspek: 'Kecepatan dan Ketepatan Loket Pendaftaran',
          uraian: 'Bagaimana penilaian Anda terhadap kecepatan dan kejelasan alur pelayanan di loket pendaftaran rawat jalan?',
        },
        {
          id: 'rj_q2_kenyamanan_ruang_tunggu',
          aspek: 'Kenyamanan dan Kebersihan Ruang Tunggu Poli',
          uraian: 'Bagaimana Anda menilai kebersihan, ketersediaan tempat duduk, dan kenyamanan ruang tunggu poliklinik?',
        },
      ],
    },
    {
      id: 'rj_bagian_2',
      title: 'Bagian 2 : Pelayanan Dokter Poliklinik',
      description: 'Penilaian konsultasi dan pemeriksaan medis di poli spesialis',
      questions: [
        {
          id: 'rj_q3_pelayanan_dokter',
          aspek: 'Pemeriksaan dan Ketelitian Dokter',
          uraian: 'Seberapa puas Anda dengan perhatian dan ketelitian dokter spesialis saat memeriksa keluhan Anda?',
        },
        {
          id: 'rj_q4_kejelasan_petunjuk',
          aspek: 'Kejelasan Arahan Pengobatan Lanjutan',
          uraian: 'Apakah dokter memberikan arahan yang jelas mengenai resep, pantangan, dan jadwal kontrol berikutnya?',
        },
      ],
    },
  ],

  // 3. INSTALASI GAWAT DARURAT (IGD)
  igd: [
    {
      id: 'igd_bagian_1',
      title: 'Pelayanan Gawat Darurat (IGD)',
      description: 'Penilaian kecepatan respon, ketanggapan, dan tindakan darurat',
      questions: [
        {
          id: 'igd_q1_kecepatan_triase',
          aspek: 'Kecepatan Respon Awal Pasien Tiba (Triase)',
          uraian: 'Seberapa cepat dan tanggap petugas medis IGD menyambut serta memeriksa Anda saat baru tiba di IGD?',
        },
        {
          id: 'igd_q2_ketanggapan_tindakan',
          aspek: 'Ketanggapan dan Keterampilan Tindakan Medis',
          uraian: 'Bagaimana penilaian Anda terhadap kesigapan dokter dan perawat IGD dalam melakukan tindakan pertolongan?',
        },
        {
          id: 'igd_q3_komunikasi_keluarga',
          aspek: 'Komunikasi dan Penjelasan kepada Keluarga',
          uraian: 'Apakah dokter/perawat IGD memberikan penjelasan yang menenangkan dan jelas mengenai kondisi darurat pasien?',
        },
      ],
    },
  ],

  // 4. INSTALASI FARMASI / APOTEK
  farmasi: [
    {
      id: 'farmasi_bagian_1',
      title: 'Pelayanan Resep dan Obat Farmasi',
      description: 'Penilaian kecepatan penyiapan obat dan edukasi aturan pakai',
      questions: [
        {
          id: 'farmasi_q1_waktu_tunggu',
          aspek: 'Waktu Tunggu Penyiapan Obat',
          uraian: 'Bagaimana penilaian Anda terhadap kecepatan waktu tunggu sejak resep diserahkan hingga obat siap diterima?',
        },
        {
          id: 'farmasi_q2_edukasi_obat',
          aspek: 'Kejelasan Informasi Aturan Minum Obat',
          uraian: 'Apakah petugas farmasi menjelaskan dosis, waktu minum, dan aturan pemakaian obat dengan jelas dan ramah?',
        },
        {
          id: 'farmasi_q3_ketersediaan_obat',
          aspek: 'Ketersediaan Obat Sesuai Resep',
          uraian: 'Seberapa lengkap ketersediaan obat yang Anda butuhkan di apotek RSUD Aeramo?',
        },
      ],
    },
  ],

  // 5. LABORATORIUM KLINIK
  laboratorium: [
    {
      id: 'lab_bagian_1',
      title: 'Pelayanan Pemeriksaan Laboratorium',
      description: 'Penilaian proses pengambilan sampel dan hasil lab',
      questions: [
        {
          id: 'lab_q1_kenyamanan_sampling',
          aspek: 'Kenyamanan Pengambilan Sampel',
          uraian: 'Bagaimana keahlian dan kehati-hatian petugas saat mengambil sampel (darah, urin, dsb)?',
        },
        {
          id: 'lab_q2_kebersihan_ruangan',
          aspek: 'Kebersihan dan Kesterilan Ruang Lab',
          uraian: 'Bagaimana penilaian Anda terhadap kebersihan dan kesterilan peralatan laboratorium?',
        },
        {
          id: 'lab_q3_ketepatan_waktu',
          aspek: 'Ketepatan Waktu Penyerahan Hasil Lab',
          uraian: 'Apakah hasil pemeriksaan laboratorium diselesaikan sesuai dengan estimasi waktu yang dijanjikan?',
        },
      ],
    },
  ],

  // 6. RADIOLOGI (RONTGEN / USG)
  radiologi: [
    {
      id: 'rad_bagian_1',
      title: 'Pelayanan Pemeriksaan Radiologi & Pencitraan',
      description: 'Penilaian ruang pemeriksaan rontgen/USG dan keramahan radiografer',
      questions: [
        {
          id: 'rad_q1_keramahan_petugas',
          aspek: 'Keramahan dan Kesabaran Petugas Radiologi',
          uraian: 'Bagaimana sikap keramahan petugas radiografer saat memandu Anda selama proses pengambilan foto rontgen/USG?',
        },
        {
          id: 'rad_q2_kenyamanan_ruangan',
          aspek: 'Kenyamanan dan Privasi Ruang Periksa',
          uraian: 'Apakah ruang pemeriksaan radiologi terasa nyaman, bersih, dan menjaga privasi Anda dengan baik?',
        },
      ],
    },
  ],

  // 7. KEBIDANAN & KANDUNGAN (VK)
  kebidanan: [
    {
      id: 'keb_bagian_1',
      title: 'Pelayanan Kebidanan dan Ruang Bersalin (VK)',
      description: 'Penilaian asuhan persalinan dan pendampingan ibu dan bayi',
      questions: [
        {
          id: 'keb_q1_kesabaran_bidan',
          aspek: 'Kesabaran dan Kelembutan Bidan / Perawat',
          uraian: 'Bagaimana kesabaran, kelembutan, dan pendampingan bidan dalam membantu proses pemeriksaan atau persalinan?',
        },
        {
          id: 'keb_q2_kenyamanan_ruang_bersalin',
          aspek: 'Kenyamanan dan Kebersihan Ruang Bersalin',
          uraian: 'Bagaimana Anda menilai kebersihan, privasi, dan ketenangan ruang persalinan/nifas di RSUD Aeramo?',
        },
      ],
    },
  ],

  // 8. LAYANAN LAINNYA
  lainnya: [
    {
      id: 'lainnya_bagian_1',
      title: 'Pelayanan Umum Rumah Sakit',
      description: 'Penilaian umum pelayanan di RSUD Aeramo',
      questions: [
        {
          id: 'lain_q1_keramahan_umum',
          aspek: 'Keramahan dan Bantuan Petugas',
          uraian: 'Bagaimana keramahan dan kesiapan seluruh staf/petugas dalam membantu kebutuhan pelayanan Anda?',
        },
        {
          id: 'lain_q2_kebersihan_lingkungan',
          aspek: 'Kebersihan Lingkungan dan Fasilitas Umum',
          uraian: 'Bagaimana penilaian Anda terhadap kebersihan toilet, lorong, dan fasilitas umum di RSUD Aeramo?',
        },
      ],
    },
  ],
};

/**
 * Mendapatkan daftar bagian & pertanyaan berdasarkan jenis layanan yang dipilih.
 * Jika key tidak ditemukan, otomatis kembali ke Rawat Inap sebagai fallback default.
 */
export function getQuestionsForService(serviceKey: string): QuestionSection[] {
  const normalizedKey = serviceKey.toLowerCase().trim() as ServiceKey;
  if (SERVICE_QUESTIONS[normalizedKey]) {
    return SERVICE_QUESTIONS[normalizedKey];
  }
  // Cek pencocokan parsial
  if (normalizedKey.includes('jalan') || normalizedKey.includes('poli')) return SERVICE_QUESTIONS.rawat_jalan;
  if (normalizedKey.includes('igd') || normalizedKey.includes('darurat')) return SERVICE_QUESTIONS.igd;
  if (normalizedKey.includes('farmasi') || normalizedKey.includes('obat') || normalizedKey.includes('apotek')) return SERVICE_QUESTIONS.farmasi;
  if (normalizedKey.includes('lab')) return SERVICE_QUESTIONS.laboratorium;
  if (normalizedKey.includes('radio') || normalizedKey.includes('rontgen') || normalizedKey.includes('usg')) return SERVICE_QUESTIONS.radiologi;
  if (normalizedKey.includes('kebidanan') || normalizedKey.includes('bersalin') || normalizedKey.includes('vk')) return SERVICE_QUESTIONS.kebidanan;

  return SERVICE_QUESTIONS.rawat_inap;
}

/**
 * Mendapatkan info metadata layanan (judul, badge)
 */
export function getServiceOption(serviceKey: string): ServiceOption {
  const opt = SERVICE_OPTIONS.find(s => s.id === serviceKey || s.label.toLowerCase() === serviceKey.toLowerCase());
  return opt || SERVICE_OPTIONS[0];
}

/**
 * Backward-compatibility: alias default untuk Rawat Inap
 */
export const SURVEY_SECTIONS: QuestionSection[] = SERVICE_QUESTIONS.rawat_inap;
