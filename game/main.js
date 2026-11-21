// Selisih Senja — bootstrap: baca ?shot, pasang event, jalankan loop.
// ?shot=cover|mid|win merender satu state demo statis (timer beku, tanpa
// animasi berjalan) untuk screenshot; tanpa ?shot game berjalan normal
// dari layar judul.

import { createEngine } from './engine.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');

const els = {
  sceneName: document.getElementById('sceneName'),
  sceneLevel: document.getElementById('sceneLevel'),
  timerText: document.getElementById('timerText'),
  timerFill: document.getElementById('timerFill'),
  timerBlock: document.querySelector('.timer-block'),
  scoreText: document.getElementById('scoreText'),
  comboText: document.getElementById('comboText'),
  counterText: document.getElementById('counterText'),
  progressDots: document.getElementById('progressDots'),
  hintBtn: document.getElementById('hintBtn'),
  hintCount: document.getElementById('hintCount'),
  overlay: document.getElementById('overlay'),
  overlayKicker: document.getElementById('overlayKicker'),
  overlayTitle: document.getElementById('overlayTitle'),
  overlayBody: document.getElementById('overlayBody'),
  overlayScore: document.getElementById('overlayScore'),
  overlayPrimary: document.getElementById('overlayPrimary'),
  overlaySecondary: document.getElementById('overlaySecondary'),
  overlayHint: document.getElementById('overlayHint'),
  status: document.getElementById('status'),
  sceneCards: document.querySelectorAll('.scene-card'),
};

const canvasLeft = document.getElementById('panelLeft');
const canvasRight = document.getElementById('panelRight');

const engine = createEngine({ canvasLeft, canvasRight, els });

canvasLeft.addEventListener('click', (event) => {
  engine.handlePanelClick(canvasLeft, event.clientX, event.clientY);
});
canvasRight.addEventListener('click', (event) => {
  engine.handlePanelClick(canvasRight, event.clientX, event.clientY);
});

els.hintBtn.addEventListener('click', () => engine.useHint());

els.overlayPrimary.addEventListener('click', () => {
  if (engine.state.screen === 'title') engine.startGame();
  else if (engine.state.screen === 'sceneDone') engine.nextScene();
  else if (engine.state.screen === 'gameDone') engine.restart();
});

els.overlaySecondary.addEventListener('click', () => {
  if (engine.state.screen === 'sceneDone') engine.retryScene();
  else engine.restart();
});

window.addEventListener('keydown', (event) => {
  // Abaikan pengulangan tombol (key held): sekali tekan = sekali aksi,
  // supaya menahan H tidak menghabiskan hint dan menahan N tidak
  // melompati scene.
  if (event.repeat) return;
  const key = event.key.toLowerCase();
  if (key === 'h') engine.useHint();
  else if (key === 'n') engine.nextScene();
  else if (key === 'r') engine.restart();
});

if (shot && engine.stageShot(shot)) {
  // Mode shot: gambar sekali dengan jam beku (denyut marker diam),
  // tanpa loop dan tanpa timer — siap screenshot.
  engine.render(0.6);
  engine.render(0.6);
  window.__shotReady = true;
} else {
  engine.showTitle();
  let last = performance.now();
  const frame = (now) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    engine.tick(dt);
    engine.render(now / 1000);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
