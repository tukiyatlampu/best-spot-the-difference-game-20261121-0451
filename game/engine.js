// Selisih Senja — mesin game: state, aturan, dan semua interaksi.
// Render murni ada di render.js; file ini hanya memutuskan APA yang terjadi
// (klik benar/salah, hint, timer, skor, pindah scene, mode shot) dan
// menyinkronkan HUD. Tidak ada network, tidak ada aset eksternal.

import {
  SCENES,
  HIT_RADIUS,
  PANEL_WIDTH,
  PANEL_HEIGHT,
  comboBonus,
  sceneScore,
  formatTime,
} from './scenes.js';
import { drawScene } from './render.js';

export const HINTS_PER_SCENE = 3;
export const HINT_SHOW_SECONDS = 1.2;
export const MISS_SHOW_SECONDS = 0.7;
export const END_PAUSE_MS = 900;

// Frekuensi bip (SolAPI: sinus, jeda 20 ms antar nada berurutan).
const TONE = {
  correct: [[880, 0.09], [1174, 0.1]],
  wrong: [[160, 0.16]],
  hint: [[660, 0.1]],
  sceneDone: [[523, 0.09], [659, 0.09], [784, 0.15]],
  win: [[784, 0.1], [988, 0.1], [1175, 0.2]],
};

export function createEngine(deps) {
  const { canvasLeft, canvasRight, els } = deps;

  const state = {
    screen: 'title', // title | play | sceneDone | gameDone
    sceneIndex: 0,
    found: new Set(),
    score: 0,
    sceneScoreNow: 0,
    combo: 0,
    bestCombo: 0,
    hintsLeft: HINTS_PER_SCENE,
    timeLeft: 0,
    deadline: null, // stempel performance.now() saat waktu habis (mode play)
    shot: null,
    ending: false,
    misses: [],
    hint: null,
    lastFound: null, // { id, started } temuan terbaru, untuk aksen cincin
    results: [], // { name, found, score } per scene yang selesai
    lastSceneBonus: 0,
    scoreAtEntry: 0, // skor saat scene berjalan dimulai (untuk Coba Lagi)
    resultsAtEntry: 0, // panjang results saat scene berjalan dimulai
  };

  let audioCtx = null;
  let endTimer = null;

  const scene = () => SCENES[state.sceneIndex];
  const nowSec = () => performance.now() / 1000;
  const foundCount = () => state.found.size;

  // ---------- suara (WebAudio, oscillator, tanpa file) ----------

  function ensureAudio() {
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        audioCtx = null;
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }

  function playTones(notes) {
    if (!audioCtx || state.shot) return;
    let at = audioCtx.currentTime + 0.02;
    for (const [freq, dur] of notes) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.12, at);
      gain.gain.exponentialRampToValueAtTime(0.001, at + dur);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(at);
      osc.stop(at + dur + 0.02);
      at += dur + 0.02;
    }
  }

  // ---------- overlay & HUD ----------

  function showOverlay({ kicker, title, body, score, primary, secondary, hint }) {
    els.overlayKicker.textContent = kicker || '';
    els.overlayTitle.textContent = title || '';
    els.overlayBody.textContent = body || '';
    els.overlayScore.textContent = score || '';
    els.overlayPrimary.textContent = primary || '';
    els.overlayPrimary.style.display = primary ? '' : 'none';
    els.overlaySecondary.textContent = secondary || '';
    els.overlaySecondary.style.display = secondary ? '' : 'none';
    els.overlayHint.textContent = hint || '';
    els.overlay.classList.remove('overlay-hidden');
  }

  function hideOverlay() {
    els.overlay.classList.add('overlay-hidden');
  }

  function syncHud() {
    const sc = scene();
    els.sceneName.textContent = sc.name;
    els.sceneLevel.textContent = sc.level;
    els.sceneLevel.className = 'hud-tag' + (sc.levelClass ? ' ' + sc.levelClass : '');
    els.timerText.textContent = formatTime(state.timeLeft);
    const frac = Math.max(0, Math.min(1, state.timeLeft / sc.seconds));
    els.timerFill.style.width = (frac * 100).toFixed(1) + '%';
    els.timerFill.classList.toggle('low', state.timeLeft <= 30);
    els.timerBlock.classList.toggle('urgent', state.timeLeft <= 30);
    els.scoreText.textContent = String(state.score);
    if (state.combo >= 2) {
      els.comboText.textContent = 'Combo x' + Math.min(state.combo, 5);
      els.comboText.classList.remove('combo-hidden');
    } else {
      els.comboText.classList.add('combo-hidden');
    }
    els.counterText.innerHTML =
      'Ditemukan ' + foundCount() + '/10 &middot; Sisa ' + (10 - foundCount());
    const dots = els.progressDots.children;
    for (let i = 0; i < dots.length; i += 1) dots[i].classList.toggle('on', i < foundCount());
    els.hintCount.textContent = String(state.hintsLeft);
    els.hintBtn.disabled = state.screen !== 'play' || state.hintsLeft <= 0;
    // Kartu scene di footer: selesai (10/10) / gagal (hasil tersimpan <10)
    // / sedang berjalan / menunggu.
    if (els.sceneCards) {
      els.sceneCards.forEach((card, i) => {
        const res = state.results[i];
        const done = res && res.found === 10;
        const failed = res && res.found < 10;
        const active = i === state.sceneIndex && state.screen === 'play';
        card.classList.toggle('done', !!done);
        card.classList.toggle('failed', !!failed);
        card.classList.toggle('active', !!active && !done && !failed);
        const stateEl = card.querySelector('.scene-card-state');
        if (stateEl) {
          stateEl.textContent = done
            ? '✓ Tuntas 10/10'
            : failed
              ? 'Belum tuntas ' + res.found + '/10'
              : active
                ? '● Berjalan'
                : '· Menunggu';
        }
      });
    }
  }

  function buildDots() {
    els.progressDots.innerHTML = '';
    for (let i = 0; i < 10; i += 1) {
      const dot = document.createElement('i');
      els.progressDots.appendChild(dot);
    }
  }

  function setStatus(text) {
    els.status.textContent = text;
  }

  // ---------- alur scene ----------

  function showTitle() {
    state.score = 0;
    state.results = [];
    startScene(0, true);
    state.screen = 'title'; // startScene sets 'play'; title screen blocks play & timer
    showOverlay({
      kicker: 'Game Cari Perbedaan',
      title: 'Selisih Senja',
      body: 'Dua gambar hampir sama — kiri ASLI, kanan VARIAN. Temukan 10 perbedaan di setiap scene sebelum waktu habis. Klik di panel mana pun, kiri atau kanan sama saja. Klik yang meleset memotong waktu 2 detik dan memutus combo. Hint juga memutus combo.',
      score: '3 scene · 30 perbedaan · Hint 3x per scene',
      primary: 'Mulai Bermain',
      secondary: '',
      hint: 'H = Hint · N = Scene berikut · R = Ulang dari awal',
    });
    syncHud();
  }

  function startScene(index, silent) {
    if (endTimer) {
      clearTimeout(endTimer);
      endTimer = null;
    }
    state.sceneIndex = index;
    state.found = new Set();
    state.sceneScoreNow = 0;
    state.combo = 0;
    state.hintsLeft = HINTS_PER_SCENE;
    state.timeLeft = scene().seconds;
    state.deadline = performance.now() + scene().seconds * 1000;
    state.scoreAtEntry = state.score;
    state.resultsAtEntry = state.results.length;
    state.misses = [];
    state.hint = null;
    state.lastFound = null;
    state.ending = false;
    state.screen = 'play';
    buildDots();
    hideOverlay();
    if (!silent) setStatus('Scene ' + scene().name + ' dimulai. Temukan 10 perbedaan.');
    syncHud();
  }

  function startGame() {
    ensureAudio();
    state.score = 0;
    state.results = [];
    startScene(0);
  }

  function endScene(reason) {
    if (state.screen !== 'play') return;
    state.ending = false;
    const sc = scene();
    const complete = reason === 'complete';
    const bonus = complete ? 2 * Math.floor(state.timeLeft) : 0;
    state.lastSceneBonus = bonus;
    state.sceneScoreNow += bonus;
    state.score += bonus;
    state.results.push({ name: sc.name, found: foundCount(), score: state.sceneScoreNow });
    state.screen = 'sceneDone';
    state.hint = null;
    playTones(complete ? TONE.sceneDone : TONE.wrong);
    showOverlay({
      kicker: complete ? 'Scene Selesai' : 'Waktu Habis',
      title: complete ? sc.name + ' Tuntas!' : sc.name,
      body: complete
        ? 'Kamu menemukan semua 10 perbedaan. Bonus waktu +' + bonus + ' poin.'
        : 'Kamu menemukan ' + foundCount() + ' dari 10 perbedaan. Skor parsial tetap tersimpan, lanjut ke scene berikut.',
      score: 'Skor scene: ' + state.sceneScoreNow + ' · Skor total: ' + state.score,
      primary: state.sceneIndex + 1 < SCENES.length ? 'Scene Berikut' : 'Lihat Hasil Akhir',
      secondary: complete ? '' : 'Coba Lagi Scene Ini',
      hint: complete
        ? 'Tekan N untuk lanjut · R untuk ulang dari awal'
        : 'Coba Lagi: skor kembali ke awal scene, hasil scene sebelumnya tetap tersimpan · N lanjut · R ulang dari awal',
    });
    setStatus(
      complete
        ? 'Scene ' + sc.name + ' selesai. Skor scene ' + state.sceneScoreNow + '.'
        : 'Waktu habis di scene ' + sc.name + '.',
    );
    syncHud();
  }

  function nextScene() {
    ensureAudio();
    if (state.screen === 'sceneDone') {
      if (state.sceneIndex + 1 < SCENES.length) startScene(state.sceneIndex + 1);
      else finishGame();
    } else if (state.screen === 'gameDone') {
      startGame();
    }
  }

  // Ulang scene yang gagal karena waktu habis TANPA mengulang scene yang
  // sudah tuntas: hasil scene sebelumnya dipertahankan, skor dikembalikan
  // ke nilai saat scene ini dimulai (poin parsial percobaan gagal hangus,
  // supaya tidak bisa di-farming dengan gagal berulang).
  function retryScene() {
    ensureAudio();
    if (state.screen !== 'sceneDone') return;
    const last = state.results[state.results.length - 1];
    if (!last || last.found === 10) return; // scene tuntas tidak perlu diulang
    state.results.length = state.resultsAtEntry;
    state.score = state.scoreAtEntry;
    startScene(state.sceneIndex);
    setStatus('Scene ' + scene().name + ' diulang dari awal. Skor kembali ke ' + state.score + '.');
  }

  function finishGame() {
    state.screen = 'gameDone';
    const lines = state.results
      .map((r) => r.name + ' ' + r.found + '/10 (' + r.score + ')')
      .join(' · ');
    // Rayakan hanya bila SEMUA scene tuntas 10/10; bila ada yang gagal,
    // katakan terus terang — kemenangan harus berarti.
    const perfect = state.results.length === SCENES.length && state.results.every((r) => r.found === 10);
    playTones(perfect ? TONE.win : TONE.sceneDone);
    showOverlay({
      kicker: perfect ? 'Petualangan Selesai' : 'Permainan Berakhir',
      title: perfect ? 'Selisih Senja Tamat!' : 'Perjalanan Berakhir',
      body: perfect
        ? 'Kamu menuntaskan 3 scene: ' + lines + '.'
        : 'Hasil akhir: ' + lines + '. Ada scene yang belum tuntas 10/10 — main lagi dan raih semuanya!',
      score: 'Skor Total: ' + state.score,
      primary: 'Main Lagi',
      secondary: '',
      hint: 'Tekan R untuk main lagi dari Scene 1',
    });
    setStatus(
      perfect
        ? 'Permainan selesai. Skor total ' + state.score + '.'
        : 'Permainan berakhir. Skor total ' + state.score + '.',
    );
    syncHud();
  }

  // Uji titik-di-dalam-poligon (ray casting) untuk perbedaan berarea besar.
  function pointInPoly(x, y, pts) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i, i += 1) {
      const xi = pts[i][0];
      const yi = pts[i][1];
      const xj = pts[j][0];
      const yj = pts[j][1];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  // Jarak titik ke segmen garis (untuk perbedaan berbentuk garis: gagang).
  function distToSeg(x, y, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let t = len2 === 0 ? 0 : ((x - ax) * dx + (y - ay) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(x - (ax + t * dx), y - (ay + t * dy));
  }

  // Jarak piksel terdekat ke kontur elips (sampel 360 titik): toleransi
  // seragam di sepanjang cincin, tidak seperti pita rho yang di sumbu
  // panjang memberi kelonggaran ~6 px (langit kosong ikut kena — titik
  // (300,103) berjarak 5,92 px dari kontur) sementara di sumbu pendek
  // hanya ~1,6 px. Toleransi 2 px = setengah lebar goresan (3 px) +
  // 0,5 px: goresan yang terlihat selalu kena; titik sela antar cincin
  // (287,102: 2,47 px dari kontur) tetap meleset.
  const RING_TOL = 2;
  function distToEllipse(x, y, re) {
    const rad = (re[4] * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    let min = Infinity;
    for (let i = 0; i < 360; i += 1) {
      const t = (i / 360) * Math.PI * 2;
      const lx = re[2] * Math.cos(t);
      const ly = re[3] * Math.sin(t);
      const px = re[0] + lx * cos - ly * sin;
      const py = re[1] + lx * sin + ly * cos;
      const d = Math.hypot(x - px, y - py);
      if (d < min) min = d;
    }
    return min;
  }

  // Sisa waktu dari deadline; dipakai juga di awal handler input supaya
  // klik yang datang setelah tenggat tidak lagi diterima.
  function refreshTime() {
    if (state.deadline !== null) state.timeLeft = Math.max(0, (state.deadline - performance.now()) / 1000);
    return state.timeLeft;
  }

  function nearestDiff(x, y) {
    return matchDiff(x, y, false);
  }

  // Klik di dekat marker temuan yang sudah tercatat (cincin hijau r~19):
  // pemain mengklik TANDANYA, bukan mencari lagi — abaikan, jangan hukum.
  // Perlu karena diff geometri murni (mis. cincin planet, r: 0) tidak
  // mencakup pusatnya sendiri, jadi klik tepat di tengah marker yang sudah
  // ketemu akan jatuh ke cabang meleset tanpa pemeriksaan ini.
  // Periksa BOTH anchor dan titik tampil (diff.dp): badan planet di anchor
  // adalah bagian dari objek yang sudah ketemu, walau markernya digambar
  // di ujung goresan — klik di atasnya tetap klik pada temuan, bukan miss.
  function nearFoundMarker(x, y) {
    for (const diff of scene().diffs) {
      if (!state.found.has(diff.id)) continue;
      if (Math.hypot(diff.x - x, diff.y - y) <= 21) return true;
      if (diff.dp && Math.hypot(diff.dp[0] - x, diff.dp[1] - y) <= 21) return true;
    }
    return false;
  }

  // Cocokkan klik dengan satu perbedaan dari `pool`: false = yang belum
  // ditemukan, true = yang sudah ditemukan (untuk mengabaikan klik ulang).
  function matchDiff(x, y, found) {
    const pool = scene().diffs.filter((d) => state.found.has(d.id) === found);
    // Dulu: area geometri sesuai bentuk fitur — poligon, elips, elips
    // berotasi, atau segmen dengan toleransi — mencakup gabungan bentuk
    // asli dan varian. Klik di mana pun pada bagian yang berubah harus
    // dihitung, bukan hanya di dekat pusatnya.
    for (const diff of pool) {
      if (diff.area && pointInPoly(x, y, diff.area)) {
        // Pengecualian lingkaran: bagian area yang tertutup objek identik
        // (mis. bola di atas kain) bukan bagian perbedaan — jangan hitung,
        // lanjut periksa diff lain / fallback (r: 0 menolaknya).
        const ex = diff.exclude;
        if (!ex || Math.hypot(x - ex[0], y - ex[1]) > ex[2]) return diff;
      }
      // Pita cincin: klik pada annulus [rDalam, rLuar] di sekitar pusat
      // (dipakai halo matahari: piringan dalam ditutupi r, pita halo yang
      // berubah ditutupi ring; langit di antaranya tetap meleset).
      if (diff.ring) {
        const d = Math.hypot(x - diff.ring[0], y - diff.ring[1]);
        if (d >= diff.ring[2] && d <= diff.ring[3]) return diff;
      }
      if (diff.ellipse) {
        const ex = diff.ellipse[0];
        const ey = diff.ellipse[1];
        const erx = diff.ellipse[2];
        const ery = diff.ellipse[3];
        if (((x - ex) / erx) * ((x - ex) / erx) + ((y - ey) / ery) * ((y - ey) / ery) <= 1) return diff;
      }
      if (diff.rellipse) {
        // Elips berotasi diuji lewat JARAK ke kontur (bukan pita rho):
        // hanya klik di dekat garis cincin yang dihitung, supaya klik di
        // langit kosong di antara kedua putaran cincin tidak lagi
        // diterima. r: 0 pada diff mematikan fallback radius di bawah
        // untuk diff ini.
        for (const re of diff.rellipse) {
          if (distToEllipse(x, y, re) <= RING_TOL) return diff;
        }
      }
      if (diff.segs) {
        for (const seg of diff.segs) {
          if (distToSeg(x, y, seg[0][0], seg[0][1], seg[1][0], seg[1][1]) <= (diff.segTol || 10)) return diff;
        }
      }
    }
    // Baru sesudah itu: radius di sekitar pusat perbedaan.
    let best = null;
    let bestDist = Infinity;
    for (const diff of pool) {
      const d = Math.hypot(diff.x - x, diff.y - y);
      if (d < bestDist) {
        bestDist = d;
        best = diff;
      }
    }
    // Radius per perbedaan (diff.r) bila ada — matahari & peti yang berubah
    // ukuran mendapat area klik yang sepadan; r: 0 mematikan fallback ini
    // (dipakai diff yang hanya boleh kena lewat geometrinya, mis. cincin
    // planet yang badannya identik di kedua panel): pusat yang identik
    // tidak boleh diterima lewat perbandingan 0 <= 0.
    if (best && best.r === 0) return null;
    const radius = best && best.r !== undefined ? best.r : HIT_RADIUS;
    return bestDist <= radius ? best : null;
  }

  function handlePanelClick(canvas, clientX, clientY) {
    ensureAudio();
    if (state.screen !== 'play' || state.ending || state.shot) return;
    // Tenggat diperiksa saat input diterima: klik setelah waktu habis
    // tidak boleh lagi menemukan apa pun (tick berikutnya bisa terlambat).
    if (refreshTime() <= 0) {
      syncHud();
      endScene('timeout');
      return;
    }
    // Petakan koordinat klien ke ruang gambar 620x400. Canvas memakai
    // box-sizing: border-box, jadi rect menyertakan border 3 px: kurangi
    // border dan bagi dengan ukuran konten (clientWidth/Height), bukan
    // ukuran rect, agar tidak bergeser ~3 unit per sumbu.
    const rect = canvas.getBoundingClientRect();
    const borderX = (rect.width - canvas.clientWidth) / 2;
    const borderY = (rect.height - canvas.clientHeight) / 2;
    const x = ((clientX - rect.left - borderX) / canvas.clientWidth) * PANEL_WIDTH;
    const y = ((clientY - rect.top - borderY) / canvas.clientHeight) * PANEL_HEIGHT;
    if (x < 0 || x > PANEL_WIDTH || y < 0 || y > PANEL_HEIGHT) return;
    const hit = nearestDiff(x, y);
    if (hit) {
      state.found.add(hit.id);
      state.lastFound = { id: hit.id, started: nowSec() };
      state.combo += 1;
      state.bestCombo = Math.max(state.bestCombo, state.combo);
      const gained = 100 + comboBonus(state.combo);
      state.score += gained;
      state.sceneScoreNow += gained;
      state.hint = null;
      playTones(TONE.correct);
      setStatus('Ketemu: ' + hit.label + '. +' + gained + ' poin. ' + foundCount() + ' dari 10.');
      if (foundCount() === 10) {
        state.ending = true;
        endTimer = setTimeout(() => endScene('complete'), END_PAUSE_MS);
      }
    } else if (matchDiff(x, y, true) || nearFoundMarker(x, y)) {
      // Klik ulang pada perbedaan yang sudah ditemukan: abaikan saja —
      // bukan kesalahan, jadi tanpa reset combo dan tanpa penalti waktu.
      setStatus('Itu sudah ketemu — cari perbedaan yang lain.');
    } else {
      // Meleset: combo reset DAN waktu berkurang 2 detik — spam klik harus
      // ada harganya, supaya pencarian teliti lebih menguntungkan. Penalti
      // menggeser deadline, jadi tetap tepat walau frame terlambat.
      state.combo = 0;
      if (state.deadline !== null) state.deadline -= 2000;
      state.timeLeft = Math.max(0, state.timeLeft - 2);
      state.misses.push({ x, y, started: nowSec() });
      playTones(TONE.wrong);
      setStatus('Bukan di situ. Combo kembali ke awal, waktu -2 detik.');
      // Penalti bisa menghabiskan waktu: akhiri segera, jangan tunggu tick.
      if (state.timeLeft <= 0) {
        syncHud();
        endScene('timeout');
        return;
      }
    }
    syncHud();
  }

  function useHint() {
    ensureAudio();
    if (state.screen !== 'play' || state.ending || state.shot) return;
    // Jangan konsumsi hint baru selagi petunjuk sebelumnya masih aktif
    // (1,2 dtk): menahan tombol / menekan berulang tidak boleh menghabiskan
    // stok untuk target yang sama sebelum pemain sempat mengekliknya.
    if (state.hint) return;
    if (refreshTime() <= 0) {
      syncHud();
      endScene('timeout');
      return;
    }
    if (state.hintsLeft <= 0) return;
    const next = scene().diffs.find((d) => !state.found.has(d.id));
    if (!next) return;
    state.hintsLeft -= 1;
    state.combo = 0;
    // Petunjuk menunjuk ke titik tampil (diff.dp bila ada): untuk cincin
    // planet itu ujung goresannya — bukan pusatnya yang tidak bisa diklik.
    const hx = next.dp ? next.dp[0] : next.x;
    const hy = next.dp ? next.dp[1] : next.y;
    state.hint = { x: hx, y: hy, started: nowSec() };
    playTones(TONE.hint);
    setStatus('Hint dipakai — combo direset. Lihat lingkaran kuning yang berdenyut — ' + next.label + '.');
    syncHud();
  }

  function restart() {
    ensureAudio();
    startGame();
  }

  // ---------- loop ----------

  function tick(dt) {
    if (state.shot || state.screen !== 'play' || state.ending) return;
    // Sisa waktu dihitung dari deadline berbasis performance.now(), bukan
    // dari akumulasi dt: jeda frame (tab pindah, frame rate rendah) tidak
    // lagi "membuang" waktu secara diam-diam — tekanan waktu tetap nyata.
    refreshTime();
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      syncHud();
      endScene('timeout');
      return;
    }
    if (state.hint && nowSec() - state.hint.started > HINT_SHOW_SECONDS) state.hint = null;
    state.misses = state.misses.filter((m) => nowSec() - m.started < MISS_SHOW_SECONDS);
    syncHud();
  }

  function render(now) {
    const fx = { now, misses: state.misses, hint: state.hint, lastFound: state.lastFound };
    const ctxL = canvasLeft.getContext('2d');
    const ctxR = canvasRight.getContext('2d');
    drawScene(ctxL, scene(), false, state.found, fx);
    drawScene(ctxR, scene(), true, state.found, fx);
  }

  // ---------- mode shot: state demo statis & deterministik ----------

  function stageShot(kind) {
    state.shot = kind;
    state.deadline = null; // mode shot: timer beku, tick tidak berjalan
    if (kind === 'cover') {
      state.sceneIndex = 0;
      state.found = new Set(['s1d01', 's1d02', 's1d03']);
      state.timeLeft = 157;
      state.score = 375;
      state.sceneScoreNow = 375;
      state.combo = 3;
      state.hintsLeft = 3;
      state.screen = 'play';
    } else if (kind === 'mid') {
      state.sceneIndex = 1;
      state.found = new Set(['s2d01', 's2d02', 's2d03', 's2d04', 's2d05']);
      state.timeLeft = 108;
      state.score = sceneScore(10, 41) + 750;
      state.sceneScoreNow = 750;
      state.combo = 5;
      state.hintsLeft = 2;
      state.screen = 'play';
      // Scene 1 sudah tuntas di skor ini — catat agar kartu scene konsisten.
      state.results = [{ name: SCENES[0].name, found: 10, score: sceneScore(10, 41) }];
    } else if (kind === 'win') {
      state.sceneIndex = 2;
      state.found = new Set(SCENES[2].diffs.map((d) => d.id));
      state.timeLeft = 23;
      state.score = sceneScore(10, 41) + sceneScore(10, 31) + sceneScore(10, 23);
      state.sceneScoreNow = sceneScore(10, 23);
      state.combo = 10;
      state.hintsLeft = 0;
      state.screen = 'gameDone';
      state.results = [
        { name: SCENES[0].name, found: 10, score: sceneScore(10, 41) },
        { name: SCENES[1].name, found: 10, score: sceneScore(10, 31) },
        { name: SCENES[2].name, found: 10, score: sceneScore(10, 23) },
      ];
    } else {
      return false;
    }
    buildDots();
    if (kind === 'win') {
      const lines = state.results
        .map((r) => r.name + ' ' + r.found + '/10 (' + r.score + ')')
        .join(' · ');
      showOverlay({
        kicker: 'Petualangan Selesai',
        title: 'Selisih Senja Tamat!',
        body: 'Kamu menuntaskan 3 scene: ' + lines + '.',
        score: 'Skor Total: ' + state.score,
        primary: 'Main Lagi',
        secondary: '',
        hint: 'Tekan R untuk main lagi dari Scene 1',
      });
    } else {
      hideOverlay();
    }
    syncHud();
    return true;
  }

  return {
    state,
    showTitle,
    startGame,
    nextScene,
    retryScene,
    restart,
    handlePanelClick,
    useHint,
    tick,
    render,
    stageShot,
  };
}
