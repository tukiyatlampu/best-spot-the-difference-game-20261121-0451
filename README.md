# Selisih Senja — Cari Perbedaannya

[![make.fun](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/tukiyatlampu/best-spot-the-difference-game-20261121-0451/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/tukiyatlampu/best-spot-the-difference-game-20261121-0451/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)

Game spot-the-difference di browser: dua gambar senja yang hampir identik berdampingan, cari 10 perbedaan di tiap scene. Tiga scene bertingkat — Pelabuhan Fajar (mudah, 3:00), Pasar Malam Lentera (sedang, 2:30), Observatorium Bintang (sulit, 2:00) — dengan skor, combo, hint, dan timer.

## Cara main

- Klik perbedaan di panel A atau B. Lingkaran hijau = ketemu, silang merah = meleset (combo reset, waktu −2 detik). Klik ulang pada yang sudah ketemu diabaikan, tanpa penalti.
- **H** — Hint (sorot satu perbedaan yang belum ketemu, 3x per scene; memakai hint memutus combo). **N** — Scene berikut. **R** — Ulang dari Scene 1.
- Waktu habis di satu scene tidak mengulang semuanya: tombol **Coba Lagi Scene Ini** mengulang scene itu saja (skor kembali ke awal scene, hasil scene yang sudah tuntas tetap tersimpan).
- HUD menampilkan scene, waktu, skor, dan "Ditemukan X/10 · Sisa Y". Kartu scene di bawah menunjukkan progres tiap scene (Berjalan / Tuntas / Belum tuntas). Selesaikan 10/10 sebelum waktu habis untuk lanjut ke scene berikutnya.

## Cara jalanin lokal

```sh
node serve.ts            # http://localhost:8080
```

## Cara cek (hand-in)

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` menyalin `game/` dan `screenshots/` ke direktori output dan menulis `dossier.json` di sana. Jalankan dua kali: kedua run harus menghasilkan byte yang identik.

Repo: https://github.com/tukiyatlampu/best-spot-the-difference-game-20261121-0451 — entry untuk [best-spot-the-difference-game-20261121-0451](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451) di make.fun.

## Arsitektur

- `game/index.html` — struktur halaman: HUD, dua canvas panel, helpbar, overlay.
- `game/styles.css` — tampilan HUD, panel, overlay, dan responsif.
- `game/scenes.js` — data 3 scene: nama, timer, palet, dan 10 perbedaan per scene (koordinat + label).
- `game/render.js` — menggambar tiap scene secara parametrik ke kedua canvas (kiri asli, kanan varian).
- `game/engine.js` — state game: klik, hit-test, hint, timer, skor/combo, pindah scene, mode shot.
- `game/main.js` — bootstrap: event klik/keyboard, loop frame, dan mode `?shot=` untuk screenshot.
- `main.ts` — hand-in: salin `game/` + `screenshots/` ke output, tulis `dossier.json` via `vendor/makefun-game.ts`.
- `serve.ts` — server statis lokal untuk `game/` (stdlib Node saja, tanpa dependensi).

## Scene + timer

| Scene | Tingkat | Waktu |
| --- | --- | --- |
| Pelabuhan Fajar | Mudah | 3:00 |
| Pasar Malam Lentera | Sedang | 2:30 |
| Observatorium Bintang | Sulit | 2:00 |

Tiap scene punya tepat 10 perbedaan. Skor: 100 per temuan + bonus combo sampai +100 + bonus 2/detik tersisa saat scene selesai.
