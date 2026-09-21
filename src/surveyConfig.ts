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
  appsScriptUrl: '', // Contoh: 'https://script.google.com/macros/s/AKfycbw.../exec'
  
  hospitalName: 'RSUD Aeramo',
  hospitalSubTitle: 'Pemerintah Kabupaten Nagekeo - Dinas Kesehatan',
};

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
  email: 'rsdaeramo2017@gmail.com',
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
      title: 'Bagian 1 : Kenyamanan dan Fasilitas Kamar Rawat Inap',
      description: 'Penilaian terhadap fasilitas, kebersihan, dan kenyamanan kamar rawat inap',
      questions: [
        {
          id: 'ri_q1_kenyamanan_kamar',
          aspek: 'Kenyamanan Kamar dan Tempat Tidur',
          uraian: 'Bagaimana penilaian Anda terhadap kenyamanan kamar dan tempat tidur selama masa rawat inap?',
        },
        {
          id: 'ri_q2_kebersihan_kamar',
          aspek: 'Kebersihan Kamar dan Kamar Mandi',
          uraian: 'Bagaimana penilaian Anda terhadap kebersihan kamar dan kamar mandi yang Anda gunakan selama masa rawat inap?',
        },
        {
          id: 'ri_q3_kualitas_fasilitas',
          aspek: 'Ketersediaan dan Kualitas Fasilitas di Kamar',
          uraian: 'Seberapa puas Anda dengan ketersediaan dan kualitas fasilitas di kamar (misalnya, AC, ventilasi, perlengkapan tidur)?',
        },
        {
          id: 'ri_q4_ketenangan_keamanan',
          aspek: 'Ketenangan dan Keamanan Lingkungan',
          uraian: 'Bagaimana Anda menilai ketenangan dan keamanan lingkungan rawat inap selama Anda dirawat?',
        },
      ],
    },
    {
      id: 'ri_bagian_2',
      title: 'Bagian 2 : Pelayanan Dokter dan Perawat Rawat Inap',
      description: 'Penilaian terhadap komunikasi, keramahan, dan ketanggapan tenaga kesehatan',
      questions: [
        {
          id: 'ri_q5_keramahan_nakes',
          aspek: 'Keramahan dan Kesopanan Petugas',
          uraian: 'Bagaimana sikap keramahan, kesopanan, dan kepedulian dokter dan perawat dalam melayani Anda?',
        },
        {
          id: 'ri_q6_kejelasan_informasi',
          aspek: 'Kejelasan Informasi Pengobatan',
          uraian: 'Apakah dokter memberikan penjelasan yang jelas dan mudah dipahami mengenai perkembangan kesehatan Anda?',
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
