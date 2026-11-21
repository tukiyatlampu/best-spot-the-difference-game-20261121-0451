// Selisih Senja — semua gambar vektor. Satu fungsi gambar per scene, dipanggil
// dua kali: panel kiri (variant=false, asli) dan panel kanan (variant=true).
// Setiap perbedaan dari scenes.js diwujudkan sebagai cabang `variant` di sini:
// ada/tidak ada, warna, jumlah, posisi, ukuran, rotasi, atau bentuk.
// `found` = Set id perbedaan yang sudah ditemukan; `fx` membawa efek sesaat
// (denyut marker, silang meleset, highlight hint) dan jam `now` dalam detik.

import { PANEL_WIDTH, PANEL_HEIGHT } from './scenes.js';

// ---------- util bentuk ----------

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ring(ctx, x, y, r, width, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function poly(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
  ctx.fill();
}

function line(ctx, x1, y1, x2, y2, width, color) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

// Bintang berujung `points` (5 atau 6), rotasi dalam radian.
function star(ctx, x, y, rOuter, rInner, points, rot) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i += 1) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = rot + (i * Math.PI) / points;
    const px = x + r * Math.cos(a);
    const py = y + r * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function vGrad(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  for (const [at, color] of stops) g.addColorStop(at, color);
  return g;
}

// ---------- marker & efek (digambar di atas kedua panel) ----------

function drawFoundRing(ctx, x, y, now, freshAge) {
  const r = 19 + 2.5 * Math.sin(now * 5);
  ctx.save();
  ctx.shadowColor = 'rgba(74, 222, 128, 0.9)';
  ctx.shadowBlur = 12;
  ring(ctx, x, y, r, 4, '#4ADE80');
  ctx.restore();
  // Temuan terbaru: satu cincin ekspansi singkat (~200 ms) sebelum menyatu
  // dengan denyut biasa, supaya jawaban terakhir selalu menonjol.
  if (freshAge !== null && freshAge < 0.2) {
    const k = 1 - freshAge / 0.2;
    ctx.save();
    ctx.globalAlpha = 0.9 * k;
    ring(ctx, x, y, r + 6 + 14 * (1 - k), 3, '#D6FFB0');
    ctx.restore();
  }
  ctx.beginPath();
  ctx.moveTo(x - 8, y);
  ctx.lineTo(x - 2, y + 6);
  ctx.lineTo(x + 9, y - 7);
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

function drawHintRing(ctx, x, y, now) {
  const r = 21 + 3 * Math.sin(now * 6);
  ctx.save();
  ctx.setLineDash([8, 6]);
  ctx.shadowColor = 'rgba(242, 165, 65, 0.9)';
  ctx.shadowBlur = 12;
  ring(ctx, x, y, r, 3.5, '#F2A541');
  ctx.restore();
}

function drawMissCross(ctx, x, y, age) {
  const alpha = Math.max(0, 1 - age / 0.7);
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  line(ctx, x - 11, y - 11, x + 11, y + 11, 4, '#EF4444');
  line(ctx, x + 11, y - 11, x - 11, y + 11, 4, '#EF4444');
  // Jelaskan konsekuensi meleset tepat di titik klik: status bar saja
  // mudah terlewat saat mata tertuju pada panel.
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#EF4444';
  ctx.fillText('−2 dtk · combo putus', x, y + 26);
  ctx.restore();
}

function drawMarkers(ctx, scene, found, fx) {
  const now = fx.now;
  for (const diff of scene.diffs) {
    if (!found.has(diff.id)) continue;
    const freshAge = fx.lastFound && fx.lastFound.id === diff.id ? now - fx.lastFound.started : null;
    // Marker di titik tampil (diff.dp bila ada): menandai bagian yang
    // benar-benar berubah, bukan sekadar anchor data.
    const mx = diff.dp ? diff.dp[0] : diff.x;
    const my = diff.dp ? diff.dp[1] : diff.y;
    drawFoundRing(ctx, mx, my, now, freshAge);
  }
  if (fx.hint) drawHintRing(ctx, fx.hint.x, fx.hint.y, now);
  for (const miss of fx.misses) drawMissCross(ctx, miss.x, miss.y, now - miss.started);
}

// ---------- SCENE 1: Pelabuhan Fajar ----------

function drawHarbor(ctx, scene, variant) {
  const p = scene.palette;
  // Langit fajar.
  ctx.fillStyle = vGrad(ctx, 0, 235, [[0, '#FFE9B8'], [0.55, '#FFD166'], [1, '#F7B267']]);
  ctx.fillRect(0, 0, PANEL_WIDTH, 235);
  // Awan.
  ctx.fillStyle = 'rgba(255, 241, 214, 0.85)';
  ellipse(ctx, 350, 48, 46, 13);
  ellipse(ctx, 375, 56, 34, 11);
  ellipse(ctx, 180, 38, 38, 11);
  ellipse(ctx, 470, 120, 40, 10);
  // Matahari: s1d01 ukuran 21 vs 25 (cukup kentara, tidak ekstrem).
  const sunR = variant ? 25 : 21;
  ctx.fillStyle = 'rgba(255, 209, 102, 0.35)';
  circle(ctx, 80, 65, sunR + 16);
  ctx.fillStyle = p.sun;
  circle(ctx, 80, 65, sunR);
  ctx.fillStyle = '#FFF6DA';
  circle(ctx, 80, 65, sunR * 0.55);
  // Burung: s1d02 tiga vs dua (yang tengah hilang).
  ctx.strokeStyle = p.deep;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  const birds = [[245, 55], [270, 60], [295, 52]];
  birds.forEach(([bx, by], i) => {
    if (variant && i === 1) return;
    ctx.beginPath();
    ctx.moveTo(bx - 9, by);
    ctx.quadraticCurveTo(bx - 4, by - 7, bx, by);
    ctx.quadraticCurveTo(bx + 4, by - 7, bx + 9, by);
    ctx.stroke();
  });
  // Bukit jauh di horizon.
  ctx.fillStyle = 'rgba(53, 79, 104, 0.55)';
  poly(ctx, [[0, 235], [120, 203], [240, 235], [380, 212], [520, 235], [620, 222], [620, 235]]);
  // Laut.
  ctx.fillStyle = vGrad(ctx, 235, 400, [[0, '#66B7C4'], [1, '#2E6E7E']]);
  ctx.fillRect(0, 235, PANEL_WIDTH, 165);
  // Ombak.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 2;
  const waves = [[40, 268], [180, 285], [330, 265], [480, 288], [560, 262], [120, 372], [300, 385], [520, 372]];
  for (const [wx, wy] of waves) {
    ctx.beginPath();
    ctx.moveTo(wx - 26, wy);
    ctx.quadraticCurveTo(wx, wy - 7, wx + 26, wy);
    ctx.stroke();
  }
  // Dermaga kanan (jetty) + gulungan tali: s1d07 posisi.
  ctx.fillStyle = '#6B4A2F';
  ctx.fillRect(470, 195, 150, 20);
  ctx.fillStyle = '#7D5A3A';
  for (let px = 478; px < 620; px += 24) ctx.fillRect(px, 195, 3, 20);
  ctx.fillStyle = '#5A3D26';
  ctx.fillRect(482, 215, 10, 34);
  ctx.fillRect(592, 215, 10, 34);
  const coilX = variant ? 528 : 552;
  ctx.strokeStyle = '#D8C9A3';
  ctx.lineWidth = 3;
  ring(ctx, coilX, 205, 12, 3, '#D8C9A3');
  ring(ctx, coilX, 205, 7, 2.5, '#B89B6A');
  // Mercusuar di batu karang.
  ctx.fillStyle = '#5A5A72';
  poly(ctx, [[468, 245], [500, 228], [545, 232], [562, 245], [562, 262], [468, 262]]);
  ctx.fillStyle = '#FFF1D6';
  poly(ctx, [[492, 245], [528, 245], [524, 102], [496, 102]]);
  ctx.fillStyle = '#EF7D57';
  ctx.fillRect(494, 205, 32, 14);
  ctx.fillRect(496, 158, 28, 14);
  // Ruang lampu + sorot.
  ctx.fillStyle = '#FFE9A8';
  ctx.fillRect(498, 92, 24, 12);
  ctx.fillStyle = 'rgba(255, 233, 168, 0.25)';
  poly(ctx, [[500, 98], [380, 60], [380, 130]]);
  // Atap mercusuar: s1d03 warna jingga vs kuning.
  ctx.fillStyle = variant ? '#FFD166' : '#EF7D57';
  poly(ctx, [[490, 102], [530, 102], [510, 70]]);
  // Kapal: lambung, tiang, layar, kabin, bendera.
  ctx.fillStyle = '#7A4A2B';
  ctx.beginPath();
  ctx.moveTo(120, 215);
  ctx.lineTo(430, 215);
  ctx.quadraticCurveTo(418, 258, 380, 258);
  ctx.lineTo(160, 258);
  ctx.quadraticCurveTo(128, 258, 120, 215);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8A5A35';
  ctx.fillRect(120, 215, 310, 8);
  // Layar: s1d05 warna krem vs jingga.
  ctx.fillStyle = variant ? '#EF7D57' : '#FFF1D6';
  poly(ctx, [[250, 125], [250, 215], [140, 215], [170, 145]]);
  ctx.strokeStyle = 'rgba(53, 79, 104, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(250, 125);
  ctx.lineTo(140, 215);
  ctx.stroke();
  // Tiang.
  line(ctx, 250, 215, 250, 122, 5, '#5A3D26');
  line(ctx, 365, 215, 365, 112, 5, '#5A3D26');
  // Bendera: s1d04 hilang di varian.
  if (!variant) {
    ctx.fillStyle = '#EF7D57';
    poly(ctx, [[365, 116], [398, 125], [365, 134]]);
  }
  // Kabin + jendela: s1d06 lingkaran vs persegi.
  ctx.fillStyle = '#FFF1D6';
  ctx.fillRect(288, 196, 54, 42);
  ctx.strokeStyle = '#7A4A2B';
  ctx.lineWidth = 2;
  ctx.strokeRect(288, 196, 54, 42);
  ctx.fillStyle = '#66B7C4';
  if (variant) ctx.fillRect(305, 215, 20, 20);
  else circle(ctx, 315, 225, 10);
  // Lubang intip lambung.
  ctx.fillStyle = '#2E6E7E';
  for (const px of [170, 210, 255, 390]) circle(ctx, px, 240, 6);
  // Dermaga kiri + jaring: s1d08 hilang di varian.
  ctx.fillStyle = '#6B4A2F';
  ctx.fillRect(0, 295, 150, 20);
  ctx.fillStyle = '#5A3D26';
  ctx.fillRect(20, 315, 10, 30);
  ctx.fillRect(130, 315, 10, 30);
  if (!variant) {
    ctx.strokeStyle = '#D8C9A3';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i += 1) {
      line(ctx, 42 + i * 8, 315, 52 + i * 8, 348, 1.5, '#D8C9A3');
      line(ctx, 88 - i * 8, 315, 78 - i * 8, 348, 1.5, '#D8C9A3');
    }
    ctx.fillStyle = 'rgba(216, 201, 163, 0.30)';
    ctx.beginPath();
    ctx.ellipse(65, 330, 26, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#D8C9A3';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(65, 330, 26, 18, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Pantai depan.
  ctx.fillStyle = '#E9CD9A';
  ctx.beginPath();
  ctx.moveTo(0, 335);
  ctx.quadraticCurveTo(200, 322, 420, 335);
  ctx.quadraticCurveTo(540, 340, 620, 328);
  ctx.lineTo(620, 400);
  ctx.lineTo(0, 400);
  ctx.closePath();
  ctx.fill();
  // Peti: s1d09 lebar 48 vs 56.
  const crateW = variant ? 56 : 48;
  ctx.fillStyle = '#B07A3E';
  ctx.fillRect(220 - crateW / 2, 316, crateW, 48);
  ctx.strokeStyle = '#7A4A2B';
  ctx.lineWidth = 2;
  ctx.strokeRect(220 - crateW / 2, 316, crateW, 48);
  line(ctx, 220 - crateW / 2, 316, 220 + crateW / 2, 364, 2, '#7A4A2B');
  line(ctx, 220 + crateW / 2, 316, 220 - crateW / 2, 364, 2, '#7A4A2B');
  // Pelampung: s1d10 jingga vs biru muda.
  ctx.fillStyle = variant ? '#66B7C4' : '#EF7D57';
  circle(ctx, 425, 316, 16);
  ctx.fillStyle = '#FFF1D6';
  ctx.fillRect(409, 312, 32, 8);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  circle(ctx, 419, 310, 3);
  // Kerang & batu di pantai.
  ctx.fillStyle = '#FFF1D6';
  ellipse(ctx, 90, 372, 8, 5);
  ellipse(ctx, 330, 380, 7, 4);
  ctx.fillStyle = '#8A8A9A';
  circle(ctx, 520, 372, 6);
  circle(ctx, 560, 385, 5);
}

// ---------- SCENE 2: Pasar Malam Lentera ----------

function drawMarket(ctx, scene, variant) {
  const p = scene.palette;
  // Langit malam + tanah.
  ctx.fillStyle = vGrad(ctx, 0, 300, [[0, '#241C3E'], [1, '#3A2B5C']]);
  ctx.fillRect(0, 0, PANEL_WIDTH, 300);
  ctx.fillStyle = '#241C3E';
  ctx.fillRect(0, 300, PANEL_WIDTH, 100);
  // Bintang-bintang kecil (posisi tetap).
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  for (const [sx, sy, sr] of [[40, 30, 1.5], [120, 22, 1], [200, 38, 1.5], [330, 26, 1], [430, 30, 1.5], [500, 24, 1], [600, 36, 1.5], [90, 100, 1], [250, 110, 1.2], [600, 110, 1]]) {
    circle(ctx, sx, sy, sr);
  }
  // Bulan.
  ctx.fillStyle = '#F2DFAB';
  circle(ctx, 585, 40, 18);
  ctx.fillStyle = 'rgba(36, 28, 62, 0.35)';
  circle(ctx, 579, 36, 4);
  circle(ctx, 590, 46, 3);
  // Kawat lentera.
  ctx.strokeStyle = '#120E24';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 42);
  ctx.quadraticCurveTo(310, 62, 620, 42);
  ctx.stroke();
  // Lentera gantung (kecuali yang di tengah spanduk).
  const lanterns = [
    [70, 60, variant ? p.purple : p.pink, true],
    [150, 55, '#FFBF69', false],
    [225, 70, '#D95D71', false],
    [470, 58, '#55A99A', false],
  ];
  for (const [lx, ly, color] of lanterns) {
    line(ctx, lx, 44, lx, ly - 16, 1.5, '#120E24');
    ctx.fillStyle = color;
    ellipse(ctx, lx, ly, 13, 17);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ellipse(ctx, lx - 4, ly - 5, 4, 6);
    ctx.fillStyle = '#FFD97A';
    ctx.fillRect(lx - 7, ly - 21, 14, 4);
    ctx.fillRect(lx - 7, ly + 17, 14, 4);
  }
  // Rumbai lentera tengah: s2d02 hilang di varian.
  if (!variant) {
    ctx.strokeStyle = '#FFD97A';
    ctx.lineWidth = 2;
    line(ctx, 221, 88, 221, 106, 2, '#FFD97A');
    line(ctx, 225, 88, 225, 106, 2, '#FFD97A');
    line(ctx, 229, 88, 229, 106, 2, '#FFD97A');
  }
  // Spanduk: selalu berujung runcing di kedua panel (dulu s2d03, kini
  // perbedaan dipindah ke bola gerobak agar baris langit tidak lagi
  // berjumlah tiga di semua scene).
  ctx.fillStyle = '#D95D71';
  ctx.beginPath();
  ctx.moveTo(300, 48);
  ctx.lineTo(408, 48);
  ctx.lineTo(420, 65);
  ctx.lineTo(408, 82);
  ctx.lineTo(300, 82);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#F2DFAB';
  ctx.lineWidth = 2;
  ctx.strokeRect(306, 54, 96, 22);
  ctx.fillStyle = '#F2DFAB';
  ctx.fillRect(314, 61, 60, 4);
  ctx.fillRect(314, 69, 40, 4);
  // Kios kiri: atap garis, meja, barang.
  ctx.fillStyle = '#D95D71';
  poly(ctx, [[25, 120], [195, 120], [180, 155], [40, 155]]);
  ctx.fillStyle = '#FFF1D6';
  for (let i = 0; i < 4; i += 1) poly(ctx, [[55 + i * 35, 120], [72 + i * 35, 120], [66 + i * 35, 155], [52 + i * 35, 155]]);
  ctx.fillStyle = '#6B4A2F';
  ctx.fillRect(35, 250, 150, 50);
  ctx.fillStyle = '#7D5A3A';
  ctx.fillRect(35, 250, 150, 8);
  // Toples di meja kiri. s2d04: toples keempat jadi krem di varian.
  const jars = [[55, 232, '#55A99A'], [85, 228, '#FFBF69'], [115, 232, '#8D78C4'], [150, 230, '#D95D71']];
  jars.forEach(([jx, jy, jc], i) => {
    ctx.fillStyle = variant && i === 3 ? '#F2DFAB' : jc;
    rr(ctx, jx - 10, jy, 20, 22, 4);
    ctx.fillStyle = '#FFF1D6';
    ctx.fillRect(jx - 10, jy, 20, 5);
  });
  // Papan harga: s2d05 rotasi +12 vs -12 derajat.
  ctx.save();
  ctx.translate(105, 185);
  ctx.rotate((variant ? -12 : 12) * Math.PI / 180);
  ctx.fillStyle = '#F2DFAB';
  ctx.fillRect(-35, -23, 70, 46);
  ctx.strokeStyle = '#6B4A2F';
  ctx.lineWidth = 2;
  ctx.strokeRect(-35, -23, 70, 46);
  ctx.fillStyle = '#241C3E';
  ctx.fillRect(-24, -13, 48, 4);
  ctx.fillRect(-24, -3, 34, 4);
  ctx.fillRect(-24, 7, 44, 4);
  ctx.restore();
  // Keranjang jeruk: s2d10 lima vs empat.
  ctx.fillStyle = '#8A5A35';
  poly(ctx, [[55, 330], [130, 330], [122, 352], [63, 352]]);
  const oranges = [[68, 328], [86, 320], [104, 328], [118, 322], [92, 336]];
  oranges.forEach(([ox, oy], i) => {
    if (variant && i === 2) return;
    ctx.fillStyle = '#F28C1E';
    circle(ctx, ox, oy, 9);
    ctx.fillStyle = '#55A99A';
    ellipse(ctx, ox + 3, oy - 8, 4, 2);
  });
  // Pedagang di balik gerobak tengah.
  ctx.fillStyle = p.teal;
  ctx.fillRect(278, 205, 54, 50);
  ctx.fillStyle = '#F2C49B';
  circle(ctx, 305, 182, 16);
  ctx.fillStyle = '#241C3E';
  circle(ctx, 299, 180, 2);
  circle(ctx, 311, 180, 2);
  ctx.strokeStyle = '#241C3E';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(305, 188, 5, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // Topi pedagang: s2d06 hijau kebiruan vs ungu.
  ctx.fillStyle = variant ? p.purple : p.teal;
  ellipse(ctx, 305, 168, 26, 7);
  ctx.beginPath();
  ctx.moveTo(283, 168);
  ctx.quadraticCurveTo(305, 140, 327, 168);
  ctx.closePath();
  ctx.fill();
  // Gerobak tengah + barang.
  ctx.fillStyle = '#6B4A2F';
  ctx.fillRect(235, 250, 140, 40);
  ctx.fillStyle = '#8A5A35';
  ctx.fillRect(245, 228, 40, 22);
  ctx.fillRect(295, 224, 46, 26);
  // s2d03: bola kuning di gerobak jadi merah di varian.
  ctx.fillStyle = variant ? '#D95D71' : '#FFBF69';
  circle(ctx, 262, 222, 7);
  ctx.fillStyle = '#FFBF69';
  circle(ctx, 318, 218, 8);
  ctx.fillStyle = '#2A2118';
  circle(ctx, 260, 305, 16);
  circle(ctx, 350, 305, 16);
  ctx.fillStyle = '#8D78C4';
  circle(ctx, 260, 305, 6);
  circle(ctx, 350, 305, 6);
  // Kucing: s2d09 ekor melengkung vs lurus.
  ctx.fillStyle = '#3A3A4A';
  ellipse(ctx, 295, 322, 16, 12);
  circle(ctx, 295, 306, 9);
  poly(ctx, [[288, 300], [291, 292], [295, 299]]);
  poly(ctx, [[297, 299], [301, 292], [304, 300]]);
  ctx.strokeStyle = '#3A3A4A';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(308, 328);
  if (variant) ctx.lineTo(330, 314);
  else ctx.quadraticCurveTo(326, 330, 330, 312);
  ctx.stroke();
  // Kios kanan: atap, meja, lampu gantung: s2d04 empat vs tiga.
  ctx.fillStyle = '#8D78C4';
  poly(ctx, [[430, 120], [600, 120], [585, 155], [445, 155]]);
  ctx.fillStyle = '#FFF1D6';
  for (let i = 0; i < 4; i += 1) poly(ctx, [[462 + i * 35, 120], [479 + i * 35, 120], [473 + i * 35, 155], [459 + i * 35, 155]]);
  ctx.fillStyle = '#6B4A2F';
  ctx.fillRect(435, 250, 160, 50);
  ctx.fillStyle = '#7D5A3A';
  ctx.fillRect(435, 250, 160, 8);
  const bulbs = [520, 540, 560, 580];
  bulbs.forEach((bx) => {
    line(ctx, bx, 58, bx, 70, 1.5, '#120E24');
    ctx.fillStyle = '#FFD97A';
    circle(ctx, bx, 75, 5);
  });
  // Barang kios kanan: kain & kue. s2d08: kain jadi kuning di varian.
  ctx.fillStyle = variant ? '#FFBF69' : '#D95D71';
  rr(ctx, 450, 228, 34, 22, 4);
  ctx.fillStyle = '#55A99A';
  rr(ctx, 495, 226, 34, 24, 4);
  ctx.fillStyle = '#FFBF69';
  rr(ctx, 540, 230, 34, 20, 4);
  // Gerobak kanan + gagang: s2d07 gagang naik 16px.
  const handleDy = variant ? -16 : 0;
  ctx.strokeStyle = '#8A5A35';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(560, 262 + handleDy);
  ctx.lineTo(505, 192 + handleDy);
  ctx.stroke();
  line(ctx, 495, 185 + handleDy, 515, 195 + handleDy, 6, '#5A3D26');
  ctx.fillStyle = '#6B4A2F';
  ctx.fillRect(445, 255, 120, 40);
  ctx.fillStyle = '#D95D71';
  circle(ctx, 480, 248, 9);
  circle(ctx, 520, 246, 9);
  // Roda gerobak kanan: selalu sama di kedua panel (dulu s2d08, kini
  // perbedaan dipindah ke kain kios agar baris bawah tidak berulang).
  const wheelR = 19;
  ctx.fillStyle = '#2A2118';
  circle(ctx, 505, 325, wheelR);
  ctx.fillStyle = '#FFBF69';
  circle(ctx, 505, 325, 5);
  ctx.fillStyle = '#2A2118';
  circle(ctx, 462, 325, 14);
  // Batu jalan.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
  for (const [gx, gy] of [[60, 360], [180, 375], [330, 362], [420, 380], [560, 365], [240, 390], [90, 388]]) {
    ellipse(ctx, gx, gy, 26, 8);
  }
}

// ---------- SCENE 3: Observatorium Bintang ----------

// Bintang latar (posisi tetap, di luar titik perbedaan).
const FIELD_STARS = [
  [30, 40, 1.5], [120, 30, 1], [170, 90, 1.5], [290, 40, 1], [340, 95, 1.2],
  [460, 35, 1.5], [520, 110, 1], [590, 90, 1.2], [40, 120, 1], [150, 130, 1.2],
  [330, 120, 1], [430, 125, 1.5], [580, 140, 1], [90, 100, 1], [210, 115, 1],
  [370, 38, 1], [500, 45, 1.2], [610, 55, 1], [260, 95, 1], [480, 95, 1],
];

function drawObservatory(ctx, scene, variant) {
  const p = scene.palette;
  // Langit malam.
  ctx.fillStyle = vGrad(ctx, 0, 400, [[0, '#111B35'], [0.6, '#1D2C52'], [1, '#24365F']]);
  ctx.fillRect(0, 0, PANEL_WIDTH, 400);
  // Bintang latar + rasi.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  for (const [sx, sy, sr] of FIELD_STARS) circle(ctx, sx, sy, sr);
  ctx.strokeStyle = 'rgba(195, 166, 221, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, 30);
  ctx.lineTo(170, 90);
  ctx.lineTo(210, 115);
  ctx.stroke();
  // Bintang kiri: s3d01 lima vs enam ujung. Baris langit scene 3 digeser
  // (+35,+30) dari pola scene 2 supaya lokasi jawaban tidak mudah dihafal.
  ctx.fillStyle = '#F2DFAB';
  star(ctx, 100, 90, 16, 7, variant ? 6 : 5, -Math.PI / 2);
  // Planet bercincin: s3d02 kemiringan cincin 12 vs 24 derajat.
  ctx.fillStyle = p.ice;
  circle(ctx, 265, 95, 18);
  ctx.fillStyle = 'rgba(135, 187, 209, 0.6)';
  circle(ctx, 259, 89, 5);
  ctx.save();
  ctx.translate(265, 95);
  ctx.rotate((variant ? 24 : 12) * Math.PI / 180);
  ctx.strokeStyle = p.lilac;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 0, 30, 8, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  // Komet: s3d03 ekor 40 vs 32 px.
  const tailLen = variant ? 32 : 40;
  const tailEnd = [435 + tailLen * 0.7, 100 - tailLen * 0.7];
  const tailGrad = ctx.createLinearGradient(435, 100, tailEnd[0], tailEnd[1]);
  tailGrad.addColorStop(0, 'rgba(255, 241, 214, 0.9)');
  tailGrad.addColorStop(1, 'rgba(255, 241, 214, 0)');
  ctx.strokeStyle = tailGrad;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(435, 100);
  ctx.lineTo(tailEnd[0], tailEnd[1]);
  ctx.stroke();
  ctx.fillStyle = '#FFF1D6';
  circle(ctx, 435, 100, 8);
  // Bintang kembar: selalu dua di kedua panel (hiasan identik).
  ctx.fillStyle = '#F2DFAB';
  star(ctx, 579, 95, 7, 3, 4, 0);
  star(ctx, 595, 92, 7, 3, 4, 0);
  // Dinding kubah kiri & kanan (membingkai langit).
  ctx.fillStyle = p.wall;
  ctx.beginPath();
  ctx.moveTo(0, 150);
  ctx.quadraticCurveTo(150, 128, 186, 180);
  ctx.lineTo(170, 350);
  ctx.lineTo(0, 350);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(620, 150);
  ctx.quadraticCurveTo(480, 128, 452, 180);
  ctx.lineTo(468, 350);
  ctx.lineTo(620, 350);
  ctx.closePath();
  ctx.fill();
  // Panel garis dinding.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.5;
  line(ctx, 20, 200, 160, 210, 1.5, 'rgba(255, 255, 255, 0.12)');
  line(ctx, 480, 210, 600, 200, 1.5, 'rgba(255, 255, 255, 0.12)');
  // Celah kubah kanan: s3d07 ujung bulat vs rata.
  ctx.fillStyle = '#0B1226';
  ctx.beginPath();
  if (variant) {
    ctx.moveTo(490, 150);
    ctx.lineTo(512, 150);
    ctx.lineTo(512, 240);
    ctx.lineTo(490, 240);
  } else {
    ctx.moveTo(490, 165);
    ctx.arc(501, 165, 11, Math.PI, 0);
    ctx.lineTo(512, 240);
    ctx.lineTo(490, 240);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#87BBD1';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Jam dinding: s3d05 jarum menit maju 20 derajat.
  ctx.fillStyle = '#F2DFAB';
  circle(ctx, 100, 190, 26);
  ctx.strokeStyle = '#111B35';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(100, 190, 26, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#111B35';
  circle(ctx, 100, 190, 2);
  const minuteAngle = (variant ? -30 : -50) * Math.PI / 180;
  line(ctx, 100, 190, 100 + 22 * Math.cos(minuteAngle), 190 + 22 * Math.sin(minuteAngle), 2.5, '#111B35');
  line(ctx, 100, 190, 100 - 12, 190 - 8, 3, '#111B35');
  // Rak buku kiri: s3d08 enam vs lima buku.
  ctx.fillStyle = '#5A3A28';
  ctx.fillRect(40, 280, 90, 80);
  ctx.fillStyle = '#3A2418';
  ctx.fillRect(46, 306, 78, 4);
  ctx.fillRect(46, 332, 78, 4);
  const bookColors = ['#D95D71', '#55A99A', '#FFBF69', '#8D78C4', '#87BBD1', '#EF7D57'];
  bookColors.forEach((bc, i) => {
    ctx.fillStyle = bc;
    ctx.fillRect(48 + i * 12, 308, 10, 24);
  });
  ctx.fillStyle = '#8D78C4';
  ctx.fillRect(48, 336, 22, 16);
  // s3d08: buku kedua rak bawah hilang di varian.
  if (!variant) {
    ctx.fillStyle = '#FFBF69';
    ctx.fillRect(74, 336, 18, 16);
  }
  // Lantai.
  ctx.fillStyle = '#1A2340';
  ctx.fillRect(0, 350, PANEL_WIDTH, 50);
  ctx.fillStyle = 'rgba(135, 187, 209, 0.25)';
  ctx.fillRect(0, 350, PANEL_WIDTH, 3);
  // Karpet bundar di bawah teleskop.
  ctx.fillStyle = '#7A2E3A';
  ellipse(ctx, 300, 372, 90, 14);
  // Teleskop: dudukan, kolom, tabung, cincin lensa.
  ctx.fillStyle = '#5A6B8A';
  ctx.fillRect(270, 340, 60, 12);
  ctx.fillRect(292, 295, 16, 46);
  ctx.fillStyle = '#87BBD1';
  ctx.fillRect(286, 180, 28, 112);
  ctx.fillStyle = '#5A6B8A';
  ctx.fillRect(286, 230, 28, 8);
  // s3d09: cincin kolom bawah hilang di varian.
  if (!variant) ctx.fillRect(286, 268, 28, 8);
  ctx.fillStyle = '#2A3A5C';
  circle(ctx, 300, 292, 10);
  // Cincin lensa: s3d06 biru muda vs ungu.
  ctx.fillStyle = '#0B1226';
  ctx.beginPath();
  ctx.ellipse(300, 180, 18, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = variant ? p.lilac : p.ice;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(300, 180, 18, 7, 0, 0, Math.PI * 2);
  ctx.stroke();
  // Papan peta langit: selalu sama di kedua panel (dulu s3d09 simbol
  // bergeser — perbedaan dipindah ke cincin kolom teleskop).
  ctx.fillStyle = '#F2DFAB';
  ctx.fillRect(230, 290, 110, 62);
  ctx.strokeStyle = '#5A3A28';
  ctx.lineWidth = 3;
  ctx.strokeRect(230, 290, 110, 62);
  ctx.fillStyle = '#111B35';
  for (const [cx, cy] of [[245, 305], [260, 300], [320, 302], [330, 318], [245, 332], [325, 338]]) {
    circle(ctx, cx, cy, 2);
  }
  const symX = 285;
  ctx.fillStyle = '#D95D71';
  circle(ctx, symX, 320, 6);
  ctx.strokeStyle = '#D95D71';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(symX, 320, 11, 4, -0.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#111B35';
  ctx.fillRect(240, 344, 60, 3);
  // Panel kontrol kubah kanan: s3d10 sekrup hilang di varian.
  ctx.fillStyle = '#2A3A5C';
  ctx.fillRect(490, 300, 80, 45);
  ctx.strokeStyle = '#87BBD1';
  ctx.lineWidth = 2;
  ctx.strokeRect(490, 300, 80, 45);
  ctx.fillStyle = '#55A99A';
  circle(ctx, 510, 315, 4);
  ctx.fillStyle = '#D95D71';
  circle(ctx, 528, 315, 4);
  ctx.fillStyle = '#FFD97A';
  ctx.fillRect(540, 310, 18, 10);
  ctx.fillStyle = '#C8D6E8';
  circle(ctx, 505, 338, 3);
  circle(ctx, 555, 338, 3);
  if (!variant) circle(ctx, 530, 325, 3);
  // Lampu gantung kecil: s3d04 kuning vs biru muda.
  line(ctx, 200, 140, 200, 158, 2, '#C8D6E8');
  ctx.fillStyle = variant ? '#87BBD1' : '#FFD97A';
  circle(ctx, 200, 164, 6);
  // Roda gigi hiasan: warnanya TETAP di kedua panel (dulu sempat mewarisi
  // warna lampu dan menjadi perbedaan ke-11 tanpa entri — jangan diulang).
  ctx.strokeStyle = 'rgba(200, 214, 232, 0.6)';
  ctx.lineWidth = 2;
  ctx.fillStyle = 'rgba(135, 187, 209, 0.15)';
  circle(ctx, 420, 320, 14);
  ctx.beginPath();
  ctx.arc(420, 320, 14, 0, Math.PI * 2);
  ctx.stroke();
}

// ---------- pintu masuk gambar ----------

const DRAWERS = {
  harbor: drawHarbor,
  market: drawMarket,
  observatory: drawObservatory,
};

// Gambar satu panel penuh (latar + perbedaan parametrik + marker).
// `variant` false = asli (kiri), true = varian (kanan).
export function drawScene(ctx, scene, variant, found, fx) {
  ctx.clearRect(0, 0, PANEL_WIDTH, PANEL_HEIGHT);
  const draw = DRAWERS[scene.id];
  draw(ctx, scene, variant);
  drawMarkers(ctx, scene, found, fx);
}
