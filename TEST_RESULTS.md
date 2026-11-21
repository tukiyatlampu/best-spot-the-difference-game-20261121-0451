# TEST_RESULTS — Selisih Senja (best-spot-the-difference-game-20261121-0451)

QA final oleh koordinator, Sabtu 2026-11-21 ~15:35–16:20 WIB (ronde 5–9
setelah judge 2-pass). Hanya hasil run nyata di bawah ini. (Koreksi:
versi sebelumnya file ini menulis jam WIB ~3–4 jam lebih larut karena
salah konversi dari jam UTC VM; angka di bawah ini sudah diperbaiki
berdasarkan stempel UTC yang tercatat.) Versi R2 di file
ini sebelumnya mencantumkan ukuran screenshot yang sudah kedaluwarsa —
angka di bawah ini adalah ukuran file yang benar saat ini, diverifikasi
langsung.

## Screenshot

Perintah: headless Chrome 157.0.8103.81 (`/opt/meta-chromium/chrome`) via CDP
(Node 24 WebSocket bawaan, skrip `/tmp/shot-qa/cdp.mjs shots`), viewport
1280x800, tunggu `window.__shotReady=true`, lalu `Page.captureScreenshot`
PNG -> JPEG kualitas 85 via PIL.

Catatan penyimpangan: `http://localhost:8080` TIDAK bisa dimuat Chrome build ini —
setiap navigasi ke loopback ditolak `net::ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS`.
Screenshot diambil dari file repo yang sama tanpa modifikasi via
`file://.../game/index.html?shot=...` dengan flag `--allow-file-access-from-files`
(+ policy WebGL image `/var/lib/hatch-browser/rootfs-base/usr/share/hatch/chromium/webgl-allowed-domains.txt`
yang wajib untuk startup Chrome ini). `node serve.ts --port 8080` sendiri
terverifikasi jalan (`curl http://localhost:8080/` -> HTTP 200); isi yang
dirender identik karena file-nya sama.

| File | Byte | SHA256 (12 awal) | Dimensi | `__shotReady` | Console error | Verifikasi visual (dibaca sebagai gambar) |
| --- | --- | --- | --- | --- | --- | --- |
| `screenshots/1-cover.jpg` | 126369 | `779298c0…` | 1280x800 | true | 0 | Scene 1 Pelabuhan Fajar; dua panel berdampingan (kapal + mercusuar); 3 lingkaran hijau bercentang pada perbedaan ketemu; HUD terbaca: "Ditemukan 3/10 · Sisa 7", "2:37", skor 375 Combo x3, Hint 3, 3 dot hijau + 7 abu-abu. Berubah dari versi R2 hanya karena teks helpbar bertambah "(−2 dtk, combo putus)". |
| `screenshots/2-mid.jpg` | 138460 | `4ec5acf4…` | 1280x800 | true | 0 | Scene 2 Pasar Malam Lentera; dua panel berdampingan (kios + lentera); 5 lingkaran hijau bercentang — marker topi kini di tengah topi (bukan di wajah); spanduk berujung runcing identik di kedua panel; bola gerobak merah jadi salah satu marker. HUD terbaca: "Ditemukan 5/10 · Sisa 5", "1:48", skor 2582 Combo x5, Hint 2, 5 dot hijau + 5 abu-abu. Dibaca ulang sebagai gambar setelah retake 2026-11-21 16:11 WIB. |
| `screenshots/3-win.jpg` | 99892 | `e28fae05…` | 1280x800 | true | 0 | Scene 3 Observatorium Bintang tuntas; overlay kemenangan terbaca: "Selisih Senja Tamat!", "Kamu menuntaskan 3 scene: Pelabuhan Fajar 10/10 (1832) · Pasar Malam Lentera 10/10 (1812) · Observatorium Bintang 10/10 (1796).", "Skor Total: 5440", tombol "Main Lagi"; marker cincin planet kini di ujung goresan, marker cincin kolom di tabung teleskop; peta langit identik di kedua panel. HUD "Ditemukan 10/10 · Sisa 0", "0:23", Hint 0. Dibaca ulang sebagai gambar setelah retake 2026-11-21 16:11 WIB. |

Semua ≤256 KiB, sisi panjang 1280, sisi pendek 800. Footer kartu scene terisi
di ketiga shot (status Berjalan/Tuntas/Belum tuntas), tidak ada pita kosong.
Catatan determinisme: retake cover 2026-11-21 15:50 WIB menghasilkan JPG yang
berbeda sha dari versi R2 padahal scene 1 tidak berubah — selisihnya hanya
54 piksel di area dot HUD (rentang x616–623, y64–71), max selisih kanal 4/255:
raster jitter Chrome yang tidak terlihat mata. Bukan regresi.

## Play-test fungsional (CDP, `node /tmp/shot-qa/cdp-fix8.mjs`)

Run 2026-11-21 16:05 WIB, Chrome headless di 127.0.0.1:9222, pemetaan klik
sudah memakai rumus border-correct (border 3 px, konten 614x394 — sama
dengan engine). **Semua PASS (3 retry + 3 hint-guard + 30 hit + 7 miss +
2 piksel), 0 console error.**

- Retry: 90 klik meleset membakar waktu scene 1 (-2 dtk per klik) sampai
  overlay "Waktu Habis" muncul; tombol sekunder "Coba Lagi Scene Ini"
  tampil; setelah diklik, counter kembali 0/10, skor 0, timer 3:00.
- Hint guard: klik tombol Hint 2x cepat: stok 3 -> 2 -> 2 (klik kedua
  diabaikan selagi hint aktif); synthetic keydown H dengan `repeat: true`
  diabaikan (stok tetap 2); H normal setelah hint kedaluwarsa (1,3 dtk)
  memakai satu (stok 1).
- Scene 1 (10/10): halo matahari `(120,65)` HIT via ring [36,42] -> 1/10;
  langit di antara halo `(100,90)` MISS; klik-ulang s1d01 `(80,65)`
  diabaikan — counter & skor tetap, timer drop 0 dtk; benang jaring
  `(42,316)` HIT via segs; tepi gulungan tali, burung, atap, bendera,
  layar, jendela, peti, pelampung — HIT.
- Scene 2 (10/10): sudut papan, mahkota topi `(305,160)`, badan toples,
  jeruk, lentera, rumbai — HIT; bola identik di atas kain `(480,248)`
  MISS (tetap 6/10); bola gerobak merah `(262,222)` HIT; gagang, sudut
  kain `(451,239)` HIT via oktagon+exclude; ekor — HIT.
- Scene 3 (10/10): pusat planet `(265,95)` MISS (r:0, tetap 0/10);
  langit di luar cincin `(300,103)` MISS (jarak 5,92 px dari kontur,
  toleransi 2 px); sky-gap cincin `(287,102)` MISS (2,47 px dari kontur);
  ujung cincin `(292,107)` HIT; klik-ulang di pusat cincin yang sudah
  ketemu `(265,95)` diabaikan — counter & skor tetap, timer drop 1 dtk
  (tanpa penalti -2 dtk); jarum jam, lampu, bintang, komet, lensa, celah,
  buku, peta kini identik `(303,316)` MISS, cincin kolom `(300,272)` HIT,
  sekrup — HIT.
- Playthrough tuntas: overlay "Selisih Senja Tamat!", Skor Total 5569
  pada run ini (skor demo `?shot=win` yang statis tetap 5440 — playthrough
  bervariasi menurut combo/waktu dan pemakaian hint, wajar).
- Piksel (mode `?shot=win`): roda gigi `(420,320)` identik di kedua panel
  `[47,69,105,255]` vs `[47,69,105,255]`; lampu `(200,164)` berbeda
  `[255,246,222,255]` vs `[225,238,244,255]`.
- Teks penalti terverifikasi visual (`/tmp/shot-qa/miss.png`, dibaca sebagai
  gambar): silang merah di titik meleset + teks "−2 dtk · combo putus" di
  bawahnya, tampil di kedua panel; helpbar juga mencantumkan penalti.
- Geometri Node (dari `scenes.js`): min gap antar anchor scene 1 = 103,0;
  scene 2 = 59,1 (s2d07–s2d08, 0,9 di bawah pedoman 60 — area hit disjoin:
  kain x450–484 vs gagang x≥495, tidak ambigu); scene 3 = 88,0.
  Sebaran vertikal scene 3 (y anchor terurut): 86, 90, 95, 157, 164, 180,
  190, 272, 325, 344 — celah y190–y320 sudah terisi target tabung (272).
  Target langit (y<110): scene 1 = 3, scene 2 = 2, scene 3 = 3.
- Hint (H), N, R via keyboard TIDAK diuji end-to-end dalam run ini kecuali
  guard repeat-H di atas; tidak diklaim lebih dari itu.

## main.ts 2x (determinism)

```sh
MAKEFUN_OUTPUT_DIR=/tmp/qa-finala node --experimental-strip-types main.ts  # exit 0
MAKEFUN_OUTPUT_DIR=/tmp/qa-finalb node --experimental-strip-types main.ts  # exit 0
sha256sum /tmp/qa-finala/dossier.json /tmp/qa-finalb/dossier.json
# d8936e28578a02db55a6fe1d4fb39f5cd235d5ba6ea84afa3b79d7bfb5a5d7de  keduanya
diff -r /tmp/qa-finala /tmp/qa-finalb   # identik, tanpa output
node -e "JSON.parse(...dossier.json)"    # JSON valid
```

`dossier.json` 562632 byte, key: `cover`, `images`, `schema`, `text`.
`out/` berisi `dossier.json` + `game/` (6 file) + `screenshots/` (3 file).

## Judge 2-pass (gpt-6.1-sol Mode MAX, sebagai juri make.fun paling kritis)

Trayektori: **78 → 84 → 88 → 90 → 94 → 93 → 93 → 94 → 94** (ronde 1–9;
verdict tersimpan di `/tmp/judge-verdict.txt` s.d. `/tmp/judge9-verdict.txt`).
Ronde 6 (93/100): minta segs jaring, exclude bola kain, retry scene,
nearFoundMarker — keempatnya diperbaiki & lolos play-test ronde 7.
Ronde 7 (93/100): minta oktagon kain + exclude lingkaran, rellipse
simbol peta, guard hint, teks penalti — diperbaiki (simbol peta lalu
diganti cincin kolom pada ronde 8). Ronde 8 (94/100): minta uji jarak
kontur elips (bukan pita rho), sebaran vertikal scene 3, dan titik tampil
hint/marker — ketiganya diperbaiki & lolos play-test ronde 8.
Ronde 9 (94/100): memverifikasi semua perbaikan ronde 8 (jarak kontur
2 px, cincin kolom di (300,272), tidak ada perbedaan ke-11); sisa:
pola posisi antarscene, biaya hint tak dijelaskan (SUDAH diperbaiki
setelah verdict: tooltip tombol + layar judul + README + status hint),
duplikasi geometri data vs renderer, dan margin panel 20 px kiri vs
4 px kanan (judge sendiri mengoreksi: canvas tidak terpotong — polish
kecil). **PLATEAU — target 95/100 tidak tercapai:** skor mentok di
93–94 selama 5 ronde berturut-turut (94, 93, 93, 94, 94); setiap ronde
menemukan nitpick baru yang semakin kecil/subjektif (sudut kain 4 px,
lebar pita cincin, pola posisi, duplikasi data), sementara semua
kelemahan besar sudah habis. Perbaikan lebih lanjut berarti redesign
beberapa perbedaan + refactor struktur dengan risiko regresi, tanpa
bukti akan menembus 95 — diminishing returns, seperti token-radar
yang plateau di 91/100. Paket dinyatakan selesai pada 94/100.

## Zero-fail QA (direktori bersih `/tmp/qa-final`)

Salin hanya: `LICENSE`, `README.md`, `TEST_RESULTS.md`, `main.ts`,
`serve.ts`, `vendor/`, `game/`, `screenshots/`, `.makefun/` (tanpa `kit/`,
`kit.zip`). 16 file, 515705 byte (angka ini dari run sebelum update
terakhir file ini; lihat catatan di bawah).

- `MAKEFUN_OUTPUT_DIR=/tmp/qa-finala node --experimental-strip-types main.ts`
  -> exit 0; `dossier.json` JSON valid (lihat atas).
- `grep -rInE "api_key|apikey|password|passwd|private[ _-]?key|BEGIN.*PRIVATE|secret|token" game/ main.ts serve.ts`
  -> tidak ada temuan (0). Wallet hanya ada di `.makefun/owner.json` (wajib, 58 byte).
- `grep -rInE "https?://" game/` -> tidak ada temuan (0).
  `http://` di luar `game/` hanya ada di `serve.ts` (server dev lokal +
  komentar) dan `README.md` (instruksi pakai) — bukan fetch resource game.
- Referensi `index.html` (`./styles.css`, `./main.js`) ada; semua import modul
  (`engine.js` <- `scenes.js`/`render.js`, `main.js` <- `engine.js`,
  `render.js` <- `scenes.js`) ada; `node --check` semua JS lolos.
- `game/` total 76204 byte (6 file).

## Kit check lokal

```sh
node kit/best-spot-the-difference-game-20261121-0451-kit/cli/makefun.mjs check \
  --kit kit/best-spot-the-difference-game-20261121-0451-kit --repo /tmp/qa-final --worktree
# Run 2026-11-21 16:17 WIB. --worktree dipakai karena dir QA bukan git repo.
# TIDAK ada git init yang dijalankan (keputusan user masih pending).
```

Hasil: **4 passed, 1 failed, 15 skipped, 5 checked at submission**, exit 1,
`not ready: fix transcripts_present, then check again`.

- pass: `competition_open` (sekarang 2026-11-21T09:17Z, dalam jendela
  buka 2026-11-21T04:51Z s.d. deadline 2026-11-21T16:51:00Z),
  `snapshot` (16 file, 515705 byte, dalam cap),
  `license_osi` (SPDX MIT), `entrypoint` (main.ts, node22).
- FAIL (ekspektasi, belum ada transcripts — urusan submit parent):
  `transcripts_present` ("no transcripts were uploaded").
- skip: `prerequisites`, `strategy_note`, `committed_secret`, dan 12 check
  transcript — semuanya "no transcript session parsed".
- at submission (dicek saat submit, bukan sekarang): `repo_public`,
  `repo_owner`, `repo_created_after_open`, `commit_in_repo`,
  `duplicate_snapshot`.
- Catatan: kit check mengukur snapshot 514765 byte pada tree dengan
  TEST_RESULTS.md 12189 byte. File ini lalu tumbuh menjadi 13129 byte
  (update bagian judge + angka final), sehingga total repo kini 515834
  byte (16 file); tidak ada file lain yang berubah setelah kit check.

## Perubahan kode game (ronde 6–8, setelah judge 93–94)

- `game/scenes.js`: s1d08 tambah `segs` benang jaring (8 segmen); s2d08
  jadi oktagon + `exclude: [480, 248, 10]` + `r: 0`; s2d06 tambah
  `dp: [305, 160]`; s3d02 tambah `dp: [292, 107]`; s3d09 diganti simbol
  peta -> cincin kolom teleskop `(300,272)`.
- `game/engine.js`: dukungan `ring` + `exclude`; pemetaan klik
  border-correct; skip fallback `r: 0`; `nearFoundMarker` (anchor + dp,
  radius 21); `distToEllipse` + `RING_TOL = 2` menggantikan pita rho;
  `retryScene()` (skor kembali ke awal scene, hasil scene sebelumnya
  dipertahankan); guard hint aktif di `useHint()`; penalti dijelaskan di
  body layar judul.
- `game/render.js`: spanduk selalu runcing; bola gerobak merah di varian;
  cincin kolom bawah hilang di varian; peta langit selalu sama;
  `drawMarkers` memakai `dp`; `drawMissCross` menulis "−2 dtk · combo
  putus" di titik meleset.
- `game/main.js`: `overlaySecondary` memanggil `retryScene()` di layar
  sceneDone; keydown mengabaikan `event.repeat`.
- `game/index.html`: helpbar mencantumkan penalti meleset; tombol Hint
  ber-tooltip "Hint (H) — memutus combo".
- `game/engine.js` (tambahan ronde 9): status hint menyebut "combo direset";
  body layar judul menyebut "Hint juga memutus combo".
- `screenshots/`: ketiga file retake (marker pindah + helpbar baru).
- File yang TIDAK berubah sejak R2: `game/styles.css`, `main.ts`,
  `serve.ts`, `LICENSE`, `vendor/makefun-game.ts` (salinan kit, sha256
  `dc671875…`), `.makefun/owner.json`.

## Status record

`makefun record` DITOLAK server (HTTP 400) — bounty ini tidak menerima
recorded transcripts. Submit nanti via loose/bundle oleh parent.
