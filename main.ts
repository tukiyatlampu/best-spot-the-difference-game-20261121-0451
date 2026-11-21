// Selisih Senja — entry program (Node 22, standard library only).
//
// The repository holds a static browser game in game/ and its screenshots in
// screenshots/. This program hands the entry in: it copies both folders into
// the output directory and writes dossier.json there with the vendored
// make.fun dossier builder (vendor/makefun-game.ts, the kit's copy, unchanged).
//
// The grader runs this program twice in a sandbox with a read-only repo and
// a writable /output; both runs must write identical bytes. Outside that
// sandbox, MAKEFUN_OUTPUT_DIR stands in for /output:
//
//   MAKEFUN_OUTPUT_DIR=out node main.ts
//
// No network, no install step, no dependency beyond the Node standard library.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Directory of this file, so the program works from any working directory.
const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps, from the competition's gate: the dossier text cap
// shapes the bytes; the rest refuse an entry the scorer would refuse, so the
// program fails here exactly where the scorer would (more than 4 screenshots,
// one over 256 KiB, game/ over 993 entries or 48 MiB, a game path over
// 1000 bytes). game/ plus screenshots/ plus dossier.json share /output's
// own 1000-entry cap, hence the 993-file game cap.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function copyTree(source, target) {
  // Start from an empty target so a stale file from an earlier run can never
  // leak into this run's output (both runs must be byte-identical).
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

mkdirSync(outDir, { recursive: true });
copyTree(join(repoRoot, 'game'), join(outDir, 'game'));
if (existsSync(join(repoRoot, 'screenshots'))) {
  copyTree(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'));
} else {
  mkdirSync(join(outDir, 'screenshots'), { recursive: true });
}

writeFileSync(join(outDir, 'dossier.json'), buildDossier(outDir, DOSSIER_CAPS));
