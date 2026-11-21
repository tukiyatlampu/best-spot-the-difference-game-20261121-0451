// Selisih Senja — data scene. Satu-satunya sumber kebenaran untuk isi game:
// nama, timer, palet, dan tepat 10 perbedaan per scene. Koordinat scene
// 0..620 (x) dan 0..400 (y), sama untuk kedua panel. Render (render.js)
// membaca daftar ini dan menggambar tiap perbedaan secara parametrik.

export const PANEL_WIDTH = 620;
export const PANEL_HEIGHT = 400;

// Toleransi klik (px, koordinat scene) di sekitar pusat perbedaan.
export const HIT_RADIUS = 18;

// Jarak minimum antar pusat perbedaan di satu scene (dijaga saat desain).
export const MIN_DIFF_GAP = 60;

export const SCENES = [
  {
    id: 'harbor',
    name: 'Pelabuhan Fajar',
    level: 'Mudah',
    levelClass: '',
    seconds: 180,
    blurb: 'Fajar di dermaga: kapal berlayar, mercusuar menyala, burung pulang.',
    palette: {
      sun: '#FFD166',
      accent: '#EF7D57',
      sea: '#66B7C4',
      deep: '#354F68',
      cream: '#FFF1D6',
    },
    diffs: [
      { id: 's1d01', x: 80, y: 65, label: 'Matahari membesar', kind: 'ukuran', r: 24, ring: [80, 65, 36, 42] },
      { id: 's1d02', x: 270, y: 60, label: 'Satu burung hilang', kind: 'jumlah' },
      { id: 's1d03', x: 510, y: 90, label: 'Atap mercusuar menguning', kind: 'warna', area: [[490, 102], [530, 102], [510, 70]] },
      { id: 's1d04', x: 365, y: 135, label: 'Bendera kapal hilang', kind: 'hilang', area: [[365, 116], [398, 125], [365, 134]] },
      { id: 's1d05', x: 165, y: 170, label: 'Layar kapal menjadi jingga', kind: 'warna', area: [[250, 125], [250, 215], [140, 215], [170, 145]] },
      { id: 's1d06', x: 315, y: 225, label: 'Jendela kapal jadi persegi', kind: 'bentuk' },
      { id: 's1d07', x: 540, y: 215, label: 'Gulungan tali bergeser', kind: 'posisi', ellipse: [540, 205, 36, 14] },
      { id: 's1d08', x: 65, y: 330, label: 'Jaring dermaga hilang', kind: 'hilang', ellipse: [65, 330, 28, 20], segs: [[[42, 315], [52, 348]], [[50, 315], [60, 348]], [[58, 315], [68, 348]], [[66, 315], [76, 348]], [[88, 315], [78, 348]], [[80, 315], [70, 348]], [[72, 315], [62, 348]], [[64, 315], [54, 348]]] },
      { id: 's1d09', x: 220, y: 325, label: 'Peti membesar', kind: 'ukuran', r: 26, area: [[192, 316], [248, 316], [248, 364], [192, 364]] },
      { id: 's1d10', x: 425, y: 316, label: 'Pelampung jadi biru', kind: 'warna' },
    ],
  },
  {
    id: 'market',
    name: 'Pasar Malam Lentera',
    level: 'Sedang',
    levelClass: 'medium',
    seconds: 150,
    blurb: 'Lentera menyala, kios ramai, kucing mengintai jeruk dagangan.',
    palette: {
      night: '#241C3E',
      lantern: '#FFBF69',
      pink: '#D95D71',
      purple: '#8D78C4',
      teal: '#55A99A',
    },
    diffs: [
      { id: 's2d01', x: 70, y: 60, label: 'Lentera jadi ungu', kind: 'warna', ellipse: [70, 60, 16, 20] },
      { id: 's2d02', x: 225, y: 97, label: 'Rumbai lentera hilang', kind: 'hilang' },
      { id: 's2d03', x: 262, y: 222, label: 'Bola gerobak jadi merah', kind: 'warna' },
      { id: 's2d04', x: 150, y: 230, label: 'Satu toples jadi krem', kind: 'warna', area: [[140, 230], [160, 230], [160, 252], [140, 252]] },
      { id: 's2d05', x: 105, y: 185, label: 'Papan harga miring lain', kind: 'rotasi', area: [[66, 170], [76, 155], [135, 155], [144, 170], [144, 200], [135, 215], [76, 215], [66, 200]] },
      // Topi: marker/hint di tengah topi (305,160), bukan di wajah (305,180).
      { id: 's2d06', x: 305, y: 180, label: 'Topi pedagang jadi ungu', kind: 'warna', area: [[283, 168], [327, 168], [320, 152], [305, 146], [290, 152]], ellipse: [305, 168, 26, 7], dp: [305, 160] },
      { id: 's2d07', x: 500, y: 190, label: 'Gagang gerobak naik', kind: 'posisi', segs: [[[505, 192], [560, 262]], [[505, 176], [560, 246]], [[495, 185], [515, 195]], [[495, 169], [515, 179]]], segTol: 10 },
      // Kain: oktagon yang mendekati rounded-rect sebenarnya (sudut 4 px
      // dipotong), dikurangi lingkaran bola identik (480,248) r9 + margin
      // 1 px yang menutupi sudut kanan bawah kain; r: 0 mematikan
      // fallback radius supaya klik pada bola itu tetap meleset.
      { id: 's2d08', x: 467, y: 239, label: 'Kain kios jadi kuning', kind: 'warna', area: [[454, 228], [480, 228], [484, 232], [484, 246], [480, 250], [454, 250], [450, 246], [450, 232]], exclude: [480, 248, 10], r: 0 },
      { id: 's2d09', x: 319, y: 320, label: 'Ekor kucing jadi lurus', kind: 'bentuk' },
      { id: 's2d10', x: 90, y: 325, label: 'Satu jeruk hilang', kind: 'jumlah', ellipse: [104, 328, 12, 10] },
    ],
  },
  {
    id: 'observatory',
    name: 'Observatorium Bintang',
    level: 'Sulit',
    levelClass: 'hard',
    seconds: 120,
    blurb: 'Langit terbuka di atas kubah: teleskop, peta langit, dan detail kecil.',
    palette: {
      sky: '#111B35',
      wall: '#34476A',
      ice: '#87BBD1',
      lilac: '#C3A6DD',
      parchment: '#F2DFAB',
    },
    diffs: [
      { id: 's3d01', x: 100, y: 90, label: 'Bintang jadi enam ujung', kind: 'bentuk' },
      // Cincin planet: marker/hint di ujung goresan (292,107) — pusat
      // (265,95) tidak bisa diklik karena badan planet identik.
      { id: 's3d02', x: 265, y: 95, label: 'Cincin planet miring', kind: 'rotasi', rellipse: [[265, 95, 30, 8, 24], [265, 95, 30, 8, 12]], r: 0, dp: [292, 107] },
      { id: 's3d03', x: 449, y: 86, label: 'Ekor komet memendek', kind: 'ukuran', r: 20 },
      { id: 's3d04', x: 200, y: 164, label: 'Lampu gantung jadi biru', kind: 'warna' },
      { id: 's3d05', x: 100, y: 190, label: 'Jarum jam maju', kind: 'rotasi', segs: [[[100, 190], [114, 173]], [[100, 190], [119, 179]]], segTol: 6 },
      { id: 's3d06', x: 300, y: 180, label: 'Cincin lensa jadi ungu', kind: 'warna', ellipse: [300, 180, 20, 9] },
      { id: 's3d07', x: 501, y: 157, label: 'Ujung celah kubah merata', kind: 'bentuk' },
      { id: 's3d08', x: 83, y: 344, label: 'Satu buku rak bawah hilang', kind: 'jumlah' },
      // Cincin kolom teleskop bawah hilang di varian (dulu s3d09 simbol
      // peta — dipindah ke sini agar sebaran vertikal scene 3 tidak lagi
      // 3 langit / 4 tengah / 3 bawah dengan celah y190–y320).
      { id: 's3d09', x: 300, y: 272, label: 'Cincin kolom teleskop hilang', kind: 'hilang' },
      { id: 's3d10', x: 530, y: 325, label: 'Sekrup panel hilang', kind: 'hilang' },
    ],
  },
];

// Skor: 100 per temuan + bonus combo 25 x min(runtun-1, 4) + bonus waktu
// 2 x detik tersisa saat scene selesai.
export const SCORE_BASE = 100;
export const SCORE_COMBO_STEP = 25;
export const SCORE_COMBO_CAP = 4;
export const SCORE_TIME_BONUS = 2;

// Bonus combo untuk temuan ke-n dalam satu runtun benar (n mulai 1).
export function comboBonus(streak) {
  return SCORE_COMBO_STEP * Math.min(Math.max(streak - 1, 0), SCORE_COMBO_CAP);
}

// Skor satu scene yang selesai dengan `finds` temuan beruntun penuh.
export function sceneScore(finds, secondsLeft) {
  let total = 0;
  for (let i = 1; i <= finds; i += 1) total += SCORE_BASE + comboBonus(i);
  return total + SCORE_TIME_BONUS * Math.max(0, Math.floor(secondsLeft));
}

export function sceneById(id) {
  return SCENES.find((scene) => scene.id === id) || null;
}

export function formatTime(seconds) {
  const left = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(left / 60);
  const rest = left % 60;
  return minutes + ':' + String(rest).padStart(2, '0');
}
