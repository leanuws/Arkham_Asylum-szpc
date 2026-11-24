// LIBER MORTIS — RPG estilo portátil 8-bit (personagens originais)
'use strict';

// ════════════════════ TELA E PALETAS ════════════════════
const W = 160, H = 144, TS = 16;
const cv = document.getElementById('screen');
const g = cv.getContext('2d');
g.imageSmoothingEnabled = false;
const PALS = [
  { name: 'GÓTICO', c: ['#0d0810', '#4e1424', '#a4505c', '#ecdcc4'] },
  { name: 'CLÁSSICO', c: ['#0f380f', '#306230', '#8bac0f', '#c4d68a'] },
  { name: 'SÉPIA', c: ['#1e140c', '#5c3c24', '#a8805a', '#f0dcb4'] },
  { name: 'LUAR', c: ['#08080e', '#34344e', '#8888a8', '#e8e8f4'] }
];
let palIdx = 0, PAL = PALS[0].c;
let CACHE = {};
function setPal(i) { palIdx = i; PAL = PALS[i].c; CACHE = {}; }

function mk(w, h, fn) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  const r = (a, b, ww, hh, i) => { x.fillStyle = PAL[i]; x.fillRect(a, b, ww, hh); };
  fn(r, x); return c;
}
function cached(key, w, h, fn) { const k = key + '|' + palIdx; return CACHE[k] || (CACHE[k] = mk(w, h, fn)); }
const R = (x, y, w, h, i) => { g.fillStyle = PAL[i]; g.fillRect(x, y, w, h); };

// ════════════════════ UTIL ════════════════════
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ════════════════════ ÁUDIO (chiptune) ════════════════════
const Audio = {
  ctx: null, out: null,
  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.out = this.ctx.createGain(); this.out.gain.value = .55; this.out.connect(this.ctx.destination);
      Music.restart();
    } catch (e) { this.ctx = null; }
  },
  note(m, dur, type = 'square', vol = .06, t = 0) {
    if (!this.ctx) return;
    const f = 440 * Math.pow(2, (m - 69) / 12);
    const o = this.ctx.createOscillator(), gn = this.ctx.createGain();
    const at = t || this.ctx.currentTime;
    o.type = type; o.frequency.value = f;
    gn.gain.setValueAtTime(vol, at); gn.gain.exponentialRampToValueAtTime(.0001, at + dur);
    o.connect(gn); gn.connect(this.out); o.start(at); o.stop(at + dur + .02);
  },
  sfx(name) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const S = {
      blip: () => this.note(84, .03, 'square', .025),
      sel: () => { this.note(76, .05, 'square', .06); this.note(83, .07, 'square', .06, t + .05); },
      bump: () => this.note(40, .08, 'square', .06),
      hit: () => { this.note(50, .1, 'sawtooth', .1); this.note(38, .15, 'square', .08, t + .06); },
      heal: () => [72, 76, 79, 84].forEach((m, i) => this.note(m, .1, 'triangle', .1, t + i * .07)),
      alert: () => { this.note(88, .08, 'square', .08); this.note(88, .12, 'square', .08, t + .12); },
      door: () => { this.note(55, .1, 'triangle', .1); this.note(50, .2, 'triangle', .1, t + .1); },
      level: () => [72, 76, 79, 84, 79, 84].forEach((m, i) => this.note(m, .14, 'square', .07, t + i * .1)),
      death: () => { this.note(81, .6, 'sawtooth', .07); this.note(45, 1.2, 'square', .08); this.note(44, 1.2, 'square', .06, t + .3); },
      scratch: () => this.note(96 + rnd(6), .02, 'sawtooth', .015)
    };
    S[name] && S[name]();
  }
};
const SONGS = {
  town: { bpm: 112, mel: [69, 0, 72, 0, 76, 0, 74, 72, 71, 0, 0, 0, 67, 0, 69, 0, 65, 0, 69, 0, 72, 0, 71, 69, 68, 0, 0, 0, 64, 0, 0, 0],
          bass: [45, 0, 0, 0, 52, 0, 0, 0, 43, 0, 0, 0, 50, 0, 0, 0, 41, 0, 0, 0, 48, 0, 0, 0, 40, 0, 0, 0, 47, 0, 0, 0] },
  battle: { bpm: 168, mel: [69, 72, 76, 72, 69, 72, 77, 76, 74, 71, 68, 71, 74, 76, 77, 76, 69, 72, 76, 81, 79, 77, 76, 74, 72, 71, 69, 68, 69, 0, 64, 0],
            bass: [45, 45, 57, 45, 45, 45, 57, 45, 44, 44, 56, 44, 44, 44, 56, 44, 41, 41, 53, 41, 43, 43, 55, 43, 40, 40, 52, 40, 45, 0, 40, 0] },
  boss: { bpm: 180, mel: [64, 0, 65, 64, 0, 71, 0, 70, 64, 0, 65, 64, 0, 76, 75, 74, 69, 0, 70, 69, 0, 76, 0, 75, 72, 71, 70, 69, 68, 0, 0, 0],
          bass: [40, 40, 40, 40, 41, 41, 41, 41, 40, 40, 40, 40, 46, 46, 46, 46, 45, 45, 45, 45, 46, 46, 46, 46, 44, 44, 44, 44, 40, 0, 40, 0] },
  night: { bpm: 70, mel: [81, 0, 0, 0, 77, 0, 0, 0, 76, 0, 0, 0, 72, 0, 0, 0, 74, 0, 0, 0, 71, 0, 0, 0, 68, 0, 0, 0, 0, 0, 0, 0],
           bass: [45, 0, 0, 0, 0, 0, 0, 0, 41, 0, 0, 0, 0, 0, 0, 0, 38, 0, 0, 0, 0, 0, 0, 0, 40, 0, 0, 0, 0, 0, 0, 0] },
  title: { bpm: 84, mel: [57, 0, 60, 0, 64, 0, 69, 0, 68, 0, 64, 0, 71, 0, 0, 0, 65, 0, 69, 0, 72, 0, 76, 0, 75, 0, 71, 0, 69, 0, 0, 0],
           bass: [33, 0, 0, 0, 0, 0, 0, 0, 32, 0, 0, 0, 0, 0, 0, 0, 29, 0, 0, 0, 0, 0, 0, 0, 28, 0, 0, 0, 0, 0, 0, 0] }
};
const Music = {
  song: null, step: 0, next: 0, timer: null,
  play(name) { if (this.song === SONGS[name]) return; this.song = SONGS[name] || null; this.step = 0; this.restart(); },
  restart() {
    if (!Audio.ctx) return;
    this.next = Audio.ctx.currentTime + .05;
    if (!this.timer) this.timer = setInterval(() => this.tick(), 40);
  },
  tick() {
    const s = this.song; if (!s || !Audio.ctx) return;
    const dt = 60 / s.bpm / 2;
    while (this.next < Audio.ctx.currentTime + .15) {
      const m = s.mel[this.step % s.mel.length], b = s.bass[this.step % s.bass.length];
      if (m) Audio.note(m, dt * .9, 'square', .035, this.next);
      if (b) Audio.note(b, dt * 1.7, 'triangle', .09, this.next);
      this.next += dt; this.step++;
    }
  }
};

// ════════════════════ ENTRADA ════════════════════
const keys = { up: 0, down: 0, left: 0, right: 0, A: 0, B: 0, START: 0, SELECT: 0 };
const pressed = new Set();
function press(k) { if (!keys[k]) pressed.add(k); keys[k] = 1; Audio.init(); }
function release(k) { keys[k] = 0; }
function took(k) { if (pressed.has(k)) { pressed.delete(k); return true; } return false; }
const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right',
  z: 'A', Enter: 'A', ' ': 'A', x: 'B', Backspace: 'B', Escape: 'B', Shift: 'SELECT', p: 'START', Tab: 'START' };
addEventListener('keydown', e => { const k = KEYMAP[e.key]; if (k) { e.preventDefault(); press(k); } });
addEventListener('keyup', e => { const k = KEYMAP[e.key]; if (k) release(k); });
document.querySelectorAll('[data-k]').forEach(b => {
  const k = b.dataset.k;
  b.addEventListener('pointerdown', e => { e.preventDefault(); b.classList.add('on'); press(k); if (navigator.vibrate) navigator.vibrate(8); });
  const up = () => { b.classList.remove('on'); release(k); };
  b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
});
(function dpad() {
  const d = document.getElementById('dpad');
  let cur = null;
  const set = dir => {
    if (cur === dir) return;
    if (cur) { release(cur); d.querySelector('.' + cur).classList.remove('on'); }
    cur = dir;
    if (dir) { press(dir); d.querySelector('.' + dir).classList.add('on'); if (navigator.vibrate) navigator.vibrate(5); }
  };
  const at = e => {
    const r = d.getBoundingClientRect(); const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
    if (Math.hypot(x, y) < 12) return null;
    return Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up');
  };
  d.addEventListener('pointerdown', e => { e.preventDefault(); d.setPointerCapture(e.pointerId); set(at(e)); });
  d.addEventListener('pointermove', e => { if (e.buttons || e.pointerType === 'touch') set(at(e)); });
  const end = () => set(null);
  d.addEventListener('pointerup', end); d.addEventListener('pointercancel', end);
})();

// ════════════════════ TEXTO ════════════════════
const FONT = '8px "Press Start 2P", monospace';
const plain = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
function text(s, x, y, i = 0) { s = plain(String(s)); g.font = FONT; g.textBaseline = 'top'; g.fillStyle = PAL[i]; g.fillText(s, x, y); }
function box(x, y, w, h) { // moldura gótica
  R(x, y, w, h, 3); R(x, y, w, 1, 0); R(x, y + h - 1, w, 1, 0); R(x, y, 1, h, 0); R(x + w - 1, y, 1, h, 0);
  R(x + 2, y + 2, w - 4, 1, 1); R(x + 2, y + h - 3, w - 4, 1, 1); R(x + 2, y + 2, 1, h - 4, 1); R(x + w - 3, y + 2, 1, h - 4, 1);
  [[x + 1, y + 1], [x + w - 3, y + 1], [x + 1, y + h - 3], [x + w - 3, y + h - 3]].forEach(([a, b]) => R(a, b, 2, 2, 0));
}
function wrap(s, max = 17) {
  const out = [];
  s.split('\n').forEach(par => {
    let line = '';
    par.split(' ').forEach(w => {
      if ((line + (line ? ' ' : '') + w).length > max) { if (line) out.push(line); line = w; }
      else line += (line ? ' ' : '') + w;
    });
    out.push(line);
  });
  return out;
}

// ════════════════════ UI ASSÍNCRONA (diálogo / escolha) ════════════════════
const UI = { dlg: null, choice: null, fade: 0, flash: 0, shake: 0 };
function say(s) {
  return new Promise(res => {
    const lines = wrap(s);
    const pages = []; for (let i = 0; i < lines.length; i += 3) pages.push(lines.slice(i, i + 3));
    UI.dlg = { pages, page: 0, chars: 0, res };
  });
}
async function sayAll(arr) { for (const s of arr) await say(s); }
function choose(opts, cancel = -1, x = null, y = null) {
  return new Promise(res => { UI.choice = { opts, sel: 0, res, cancel, x, y }; });
}
function updDlg() {
  const d = UI.dlg, pg = d.pages[d.page], total = pg.join('').length;
  if (d.chars < total) { d.chars += keys.A || keys.B ? 3 : 1; if (frame % 3 === 0) Audio.sfx('blip'); if (took('A') || took('B')) d.chars = total; return; }
  if (took('A') || took('B')) {
    Audio.sfx('blip');
    if (d.page < d.pages.length - 1) { d.page++; d.chars = 0; }
    else { UI.dlg = null; d.res(); }
  }
}
function drawDlg() {
  const d = UI.dlg; box(0, 96, 160, 48);
  let left = d.chars;
  d.pages[d.page].forEach((ln, i) => { const s = ln.slice(0, Math.max(0, left)); left -= ln.length; text(s, 8, 104 + i * 12); });
  if (d.chars >= d.pages[d.page].join('').length && frame % 40 < 24) { R(148, 135, 5, 1, 0); R(149, 136, 3, 1, 0); R(150, 137, 1, 1, 0); }
}
function updChoice() {
  const c = UI.choice;
  if (took('up')) { c.sel = (c.sel + c.opts.length - 1) % c.opts.length; Audio.sfx('blip'); }
  if (took('down')) { c.sel = (c.sel + 1) % c.opts.length; Audio.sfx('blip'); }
  if (took('A')) { Audio.sfx('sel'); UI.choice = null; c.res(c.sel); }
  else if (took('B') && c.cancel >= 0) { Audio.sfx('blip'); UI.choice = null; c.res(c.cancel); }
}
function drawChoice() {
  const c = UI.choice, w = Math.max(...c.opts.map(o => o.length)) * 8 + 22, h = c.opts.length * 12 + 10;
  const x = c.x != null ? c.x : 160 - w, y = c.y != null ? c.y : 96 - h;
  box(x, Math.max(0, y), w, h);
  c.opts.forEach((o, i) => { text(o, x + 14, Math.max(0, y) + 6 + i * 12); if (i === c.sel) cursor(x + 5, Math.max(0, y) + 6 + i * 12); });
}
function cursor(x, y) { R(x, y, 1, 7, 0); R(x + 1, y + 1, 1, 5, 0); R(x + 2, y + 2, 1, 3, 0); R(x + 3, y + 3, 1, 1, 0); }

// ════════════════════ TILES ════════════════════
const WALK = new Set(['.', ',', 'p', 'b']);
function ground(r) { r(0, 0, 16, 16, 3); r(3, 4, 1, 1, 2); r(11, 9, 1, 1, 2); r(7, 13, 1, 1, 2); r(13, 2, 1, 1, 2); r(1, 11, 1, 1, 2); }
function wallBase(r) { r(0, 0, 16, 16, 3); r(0, 0, 16, 1, 0); r(0, 15, 16, 1, 0); r(0, 7, 16, 1, 2); r(4, 0, 1, 7, 2); r(12, 8, 1, 7, 2); }
const TILES = {
  '.': ground,
  ',': r => { r(0, 0, 16, 16, 2); [[0, 0, 8, 5], [8, 0, 8, 5], [0, 5, 5, 6], [5, 5, 7, 6], [12, 5, 4, 6], [0, 11, 9, 5], [9, 11, 7, 5]].forEach(([x, y, w, h]) => r(x + 1, y + 1, w - 1, h - 1, 3)); },
  'p': r => { ground(r); [[2, 3], [10, 2], [6, 9], [13, 11], [3, 13]].forEach(([x, y]) => { r(x, y, 2, 2, 1); r(x + 1, y + 2, 1, 2, 2); }); },
  'T': r => { ground(r); r(2, 1, 12, 10, 0); r(3, 2, 10, 8, 1); r(5, 3, 2, 2, 2); r(9, 5, 2, 1, 2); r(6, 11, 4, 5, 0); r(7, 11, 1, 4, 1); r(1, 4, 2, 1, 0); r(13, 3, 2, 1, 0); },
  '#': r => { r(0, 0, 16, 16, 0); r(1, 1, 14, 10, 1); r(3, 3, 2, 2, 0); r(10, 2, 2, 2, 0); r(7, 6, 2, 2, 0); r(6, 11, 4, 5, 1); },
  'W': (r, x, f) => { r(0, 0, 16, 16, 1); const o = f ? 3 : 0; [[1 + o, 3], [9 + o, 7], [3 + o, 11], [11 - o, 14]].forEach(([a, b]) => r(a % 14, b, 4, 1, 2)); },
  'r': r => { r(0, 0, 16, 16, 1); for (let y = 3; y < 16; y += 4) r(0, y, 16, 1, 0); for (let y = 0; y < 16; y += 4) for (let x = (y % 8 ? 0 : 4); x < 16; x += 8) r(x, y, 1, 3, 0); },
  'h': wallBase,
  'n': r => { wallBase(r); r(4, 3, 8, 9, 0); r(5, 4, 6, 7, 2); r(7, 4, 2, 7, 0); r(5, 7, 6, 1, 0); },
  'd': r => { wallBase(r); r(4, 2, 8, 14, 0); r(5, 3, 6, 13, 1); r(5, 3, 6, 1, 2); r(9, 9, 1, 2, 3); },
  'R': r => { r(0, 0, 16, 16, 0); for (let i = 0; i < 16; i += 4) { r(i, 0, 2, 16, 1); } r(0, 15, 16, 1, 2); },
  'c': r => { r(0, 0, 16, 16, 2); r(0, 4, 16, 1, 1); r(0, 9, 16, 1, 1); r(0, 14, 16, 1, 1); r(6, 0, 1, 4, 1); r(12, 5, 1, 4, 1); r(3, 10, 1, 4, 1); },
  'w': r => { TILES.c(r); r(3, 2, 10, 12, 0); r(4, 3, 8, 10, 1); r(7, 3, 2, 10, 3); r(4, 7, 8, 2, 3); r(5, 4, 2, 2, 2); r(9, 10, 2, 2, 2); },
  'e': r => { TILES.c(r); r(3, 1, 10, 15, 0); r(4, 3, 8, 13, 1); r(5, 2, 6, 1, 0); r(7, 3, 2, 13, 0); },
  'g': r => { ground(r); r(5, 2, 6, 11, 0); r(6, 3, 4, 10, 2); r(7, 4, 2, 6, 0); r(6, 6, 4, 1, 0); r(3, 12, 10, 3, 1); },
  'f': r => { ground(r); r(0, 5, 16, 2, 0); r(0, 10, 16, 1, 0); [1, 7, 13].forEach(x => { r(x, 2, 2, 12, 0); r(x, 1, 2, 1, 1); }); },
  'l': r => { ground(r); r(7, 5, 2, 10, 0); r(5, 1, 6, 5, 0); r(6, 2, 4, 3, 3); r(5, 14, 6, 2, 0); r(4, 0, 8, 1, 0); },
  'b': r => { r(0, 0, 16, 16, 2); for (let y = 3; y < 16; y += 4) r(0, y, 16, 1, 1); r(2, 1, 1, 1, 0); r(13, 9, 1, 1, 0); },
  'o': r => { r(0, 0, 16, 16, 2); r(1, 1, 14, 14, 0); r(2, 2, 12, 12, 1); r(4, 5, 3, 1, 2); r(9, 9, 3, 1, 2); r(7, 6, 2, 4, 3); },
  's': r => { ground(r); r(3, 2, 10, 8, 0); r(4, 3, 8, 6, 2); r(5, 5, 6, 1, 1); r(7, 10, 2, 6, 0); },
  'k': r => { TILES.b(r); r(2, 2, 12, 12, 0); r(3, 3, 10, 10, 1); r(3, 7, 10, 1, 0); r(7, 3, 1, 10, 0); },
  'm': r => { ground(r); r(3, 6, 10, 9, 0); r(4, 7, 8, 7, 2); r(5, 3, 6, 4, 0); r(6, 4, 4, 3, 3); }
};
function tileCanvas(ch) {
  const f = ch === 'W' ? (Math.floor(frame / 30) % 2) : 0;
  return cached('t' + ch + f, 16, 16, (r, x) => (TILES[ch] || ground)(r, x, f));
}

// ════════════════════ MAPA DE VEL NOCTIS ════════════════════
const MW = 32, MH = 28;
let MAP = [], DOORS = {}, SIGNS = {};
const DISTRICTS = ['Catedral', 'Jardins', 'Docas', 'Burgo Velho'];
const BOXES = [ { x: 9, y: 6, w: 14, h: 5 }, { x: 2, y: 10, w: 9, h: 7 }, { x: 20, y: 8, w: 6, h: 16 }, { x: 2, y: 18, w: 17, h: 8 } ];
function buildMap() {
  MAP = Array.from({ length: MH }, () => Array(MW).fill('.'));
  DOORS = {}; SIGNS = {};
  const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < MW && y < MH) MAP[y][x] = c; };
  const rect = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(x + i, y + j, c); };
  for (let i = 0; i < MW; i++) { set(i, 0, '#'); set(i, MH - 1, '#'); }
  for (let j = 0; j < MH; j++) { set(0, j, '#'); set(MW - 1, j, '#'); }
  // caminhos
  rect(1, 10, 26, 1, ','); rect(1, 17, 26, 1, ','); rect(15, 6, 2, 21, ',');
  // catedral
  rect(12, 1, 8, 2, 'R'); rect(12, 3, 8, 2, 'c'); set(15, 3, 'w'); set(16, 3, 'w'); set(15, 4, 'e'); set(16, 4, 'e'); set(12, 3, 'w'); set(19, 3, 'w');
  DOORS['15,4'] = DOORS['16,4'] = { id: 'catedral' };
  rect(15, 5, 2, 1, ',');
  // cemitério
  rect(2, 2, 8, 1, 'f'); rect(2, 7, 8, 1, 'f'); set(5, 7, '.'); set(6, 7, '.');
  for (let y = 3; y <= 5; y += 2) for (let x = 3; x <= 8; x += 2) set(x, y, 'g');
  set(21, 2, 'g'); set(23, 2, 'g'); set(25, 3, 'm'); set(22, 4, 'g');
  // árvores
  [[1, 1], [10, 1], [11, 6], [20, 6], [27, 1], [28, 2], [29, 1], [2, 12], [9, 14], [4, 15], [7, 11], [10, 11], [1, 16], [18, 12], [13, 15], [19, 15], [28, 3], [26, 5], [12, 26], [19, 26]]
    .forEach(([x, y]) => set(x, y, 'T'));
  // jardins
  rect(3, 12, 5, 4, 'p'); set(5, 13, 'T'); rect(2, 13, 1, 2, 'p');
  // praça e fonte
  set(15, 13, 'o'); set(16, 13, 'o'); set(15, 14, 'o'); set(16, 14, 'o');
  [[13, 9], [18, 9], [13, 18], [18, 18], [7, 9], [24, 9], [7, 16], [24, 16]].forEach(([x, y]) => set(x, y, 'l'));
  // docas
  rect(27, 6, 4, 21, 'W'); rect(26, 9, 1, 18, 'W');
  rect(22, 12, 5, 1, 'b'); rect(22, 21, 5, 1, 'b'); rect(26, 12, 4, 1, 'b'); rect(26, 21, 4, 1, 'b');
  set(23, 13, 'k'); set(24, 13, 'k'); set(22, 22, 'k'); set(25, 20, 'k');
  // casas  (x, y, largura, deslocamento da porta, id)
  const house = (x, y, w, dx, id) => {
    rect(x, y, w, 2, 'r'); rect(x, y + 2, w, 1, 'h');
    for (let i = 0; i < w; i += 2) set(x + i, y + 2, 'n');
    set(x + dx, y + 2, 'd'); DOORS[(x + dx) + ',' + (y + 2)] = { id };
  };
  house(3, 19, 4, 1, 'casa0'); house(9, 19, 4, 2, 'casa1'); house(19, 19, 4, 1, 'casa2');
  house(3, 23, 4, 2, 'casa3'); house(9, 23, 5, 2, 'pousada'); house(19, 23, 4, 2, 'casa4');
  house(21, 14, 4, 1, 'armazem');
  house(22, 6, 4, 1, 'casa5');
  // placas
  set(14, 24, 's'); SIGNS['14,24'] = 'POUSADA DO CORVO BRANCO. Durma aqui para encerrar o dia.';
  set(17, 7, 's'); SIGNS['17,7'] = 'CATEDRAL DE SANTA VÉSPERA. "Todo nome um dia é chamado."';
  set(21, 11, 's'); SIGNS['21,11'] = 'DOCAS DE VEL NOCTIS. Cuidado com estranhos à noite.';
  set(11, 10 - 1, 's'); SIGNS['11,9'] = 'JARDINS DO OESTE <-   CEMITÉRIO ^';
}
function tileAt(x, y) { return (MAP[y] && MAP[y][x]) || '#'; }

// ════════════════════ PERSONAGENS NO MAPA (16x16) ════════════════════
// spec: {kind:'person'|'hat'|'hood'|'cap'|'spirit', hair, body, acc, legs, long}
function charCanvas(spec, dir, fr) {
  return cached('c' + spec.id + dir + fr, 16, 16, (r) => {
    const ob = (x, y, w, h, i) => { r(x - 1, y - 1, w + 2, h + 2, 0); r(x, y, w, h, i); };
    if (spec.kind === 'spirit') {
      const b = fr === 1 ? 1 : 0;
      ob(1, 5 + b, 4, 6, 1); ob(11, 5 + b, 4, 6, 1); r(2, 6 + b, 2, 2, 2); r(12, 6 + b, 2, 2, 2);
      ob(5, 3 + b, 6, 7, 3); r(6, 5 + b, 2, 2, 0); r(9, 5 + b, 2, 2, 0); r(7, 8 + b, 2, 1, 1);
      r(5, 0 + b, 1, 3, 0); r(10, 0 + b, 1, 3, 0); ob(7, 11 + b, 2, 3, 1);
      return;
    }
    const bo = fr === 0 ? 0 : 1, side = dir === 'left' || dir === 'right';
    const L = spec.legs != null ? spec.legs : 0;
    // pernas
    if (fr === 0) { ob(5, 12, 2, 3, L); ob(9, 12, 2, 3, L); }
    else if (fr === 1) { ob(5, 12, 2, 3, L); ob(9, 12, 2, 2, L); }
    else { ob(5, 12, 2, 2, L); ob(9, 12, 2, 3, L); }
    // corpo
    if (spec.kind === 'hood' || spec.kind === 'hat') {
      ob(3, 8 - bo, 10, 6, spec.body);
      if (spec.kind === 'hood') { r(4, 9 - bo, 1, 5, 1); r(11, 9 - bo, 1, 5, 1); }
      if (!side && dir === 'down') r(7, 8 - bo, 2, 4, spec.acc);
    } else {
      ob(4, 8 - bo, 8, 5, spec.body);
      if (dir === 'down') r(7, 8 - bo, 2, 3, spec.acc);
    }
    // cabeça
    const y0 = 2 - bo;
    if (spec.kind === 'hood') {
      ob(3, y0 - 1, 10, 8, 1);
      if (dir === 'down') { r(5, y0 + 1, 6, 5, 3); r(5, y0 + 1, 6, 1, 2); r(6, y0 + 3, 1, 1, 0); r(9, y0 + 3, 1, 1, 0); r(6, y0 + 4, 1, 1, 2); r(9, y0 + 4, 1, 1, 2); }
      else if (dir === 'left') { r(4, y0 + 1, 4, 5, 3); r(5, y0 + 3, 1, 1, 0); }
      else if (dir === 'right') { r(8, y0 + 1, 4, 5, 3); r(10, y0 + 3, 1, 1, 0); }
      return;
    }
    ob(4, y0, 8, 6, 3);
    const hc = spec.hair;
    if (dir === 'up') r(4, y0, 8, 6, hc);
    else {
      r(4, y0, 8, 2, hc);
      if (dir === 'left') r(8, y0, 4, 4, hc); else if (dir === 'right') r(4, y0, 4, 4, hc); else { r(4, y0, 1, 3, hc); r(11, y0, 1, 3, hc); }
      if (spec.long) { if (dir !== 'right') r(3, y0 + 1, 1, 6, hc); if (dir !== 'left') r(12, y0 + 1, 1, 6, hc); }
      if (dir === 'down') { r(6, y0 + 3, 1, 2, 0); r(9, y0 + 3, 1, 2, 0); }
      if (dir === 'left') r(5, y0 + 3, 1, 2, 0);
      if (dir === 'right') r(10, y0 + 3, 1, 2, 0);
    }
    if (spec.kind === 'hat') {
      r(5, y0 - 3, 6, 3, 0); r(5, y0 - 1, 6, 1, 1); r(2, y0, 12, 1, 0);
      if (dir === 'down') { r(9, y0 + 3, 2, 2, 2); r(9, y0 + 3, 1, 1, 0); }
    }
    if (spec.kind === 'cap') {
      r(4, y0 - 1, 8, 3, 0);
      if (dir === 'down') r(4, y0 + 2, 8, 1, 0); else if (dir === 'left') r(2, y0 + 1, 3, 1, 0); else if (dir === 'right') r(11, y0 + 1, 3, 1, 0);
      if (dir === 'down') r(5, y0 + 5, 6, 1, 1);
    }
  });
}

// ════════════════════ SPRITES GRANDES (batalha) ════════════════════
function lum(hex) { const n = parseInt(hex.slice(1), 16); return (.3 * (n >> 16) + .59 * ((n >> 8) & 255) + .11 * (n & 255)) / 255; }
function toIdx(hex) { const l = lum(hex); return l < .13 ? 0 : l < .33 ? 1 : l < .62 ? 2 : 3; }
function bigCanvas(key, rows, palette, scale, flip) {
  const w = Math.max(...rows.map(r => r.length)), h = rows.length;
  return cached('b' + key + scale + (flip ? 'f' : ''), w * scale, h * scale, r => {
    rows.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch === '.' || !palette[ch]) return;
      r((flip ? w - 1 - x : x) * scale, y * scale, scale, scale, toIdx(palette[ch]));
    }));
  });
}
function bigSprite(name, scale = 2, flip) { return bigCanvas(name, SPRITES[name].rows, SPRITES[name].palette, scale, flip); }
function portraitCanvas(look, scale = 4) {
  const tpl = PORTRAIT_HAIR[look.hair % PORTRAIT_HAIR.length], skin = SKIN_COLORS[look.skin % SKIN_COLORS.length];
  const pal = { H: HAIR_COLORS[look.hc % 8], h: HAIR_COLORS[look.hc % 8], K: '#121216', w: skin, S: shade(skin, -60), m: '#5a2026', e: '#ffffff', E: '#101014', C: CLOTH_COLORS[look.cloth % 7], c: '#d8d0c0' };
  if (lum(pal.H) > .55) pal.H = pal.h = '#6a6a6a';
  if (lum(skin) < .5) pal.w = '#e8d0b8';
  return bigCanvas('p' + JSON.stringify(look), tpl, pal, scale);
}

// ════════════════════ DADOS DO JOGO ════════════════════
const SLOTS = ['00h', '04h', '08h', '12h', '16h', '20h'];
const CIT_NAMES = ['Helena Vaz', 'Otávio Lis', 'Mirela Cruz', 'Bento Faro', 'Ísis Moraes', 'Caio Duarte', 'Lívia Sá', 'Teo Brum', 'Nina Rocha', 'Ravi Torres', 'Alba Neves', 'Dante Prado'];
const JOBS = ['relojoeira', 'coveiro', 'bibliotecária', 'boticário', 'organista', 'estudante', 'tipógrafa', 'juiz', 'enfermeira', 'violinista', 'pintora', 'alfaiate'];
const DET_NAMES = ['MORVAN', 'ADRIEL', 'SEVERO', 'LUCIEN', 'CASSIO', 'ORLAND', 'DORIAN', 'VALMIR', 'TOBIAS'];
const CRIM_F = ['Bruno', 'Ítalo', 'Marta', 'Rui', 'Sônia', 'Gael', 'Vera', 'Joel', 'Lara', 'Nestor', 'Olga', 'Pietro', 'Rita', 'Edgar', 'Fausto', 'Gilda', 'Igor', 'Lauro'];
const CRIM_L = ['Corvelo', 'Taranto', 'Bessa', 'Quintal', 'Fontes', 'Garrido', 'Lacerda', 'Penha', 'Rebelo', 'Valadão', 'Barreto', 'Cunha'];
const CRIMES = ['incendiou um orfanato', 'envenenou o irmão', 'contrabandeia ópio', 'fugiu da prisão', 'saqueou a capela', 'afogou um rival', 'roubou túmulos', 'matou três guardas'];
const LINES = [
  'A neblina não sobe do rio. Ela desce do céu.', 'Dizem que a catedral toca o sino sozinha.', 'Minha avó jurava que nomes têm peso.',
  'Tranco a porta três vezes antes de dormir.', 'Os criminosos sumiram das ruas. Isso é bom... não é?', 'Vi um homem de chapéu falando com um corvo.',
  'Quem escreve cartas à luz de velas hoje em dia?', 'Os sinos das 04h sempre me acordam.'
];

let S = null;
let scene = 'title', frame = 0, busy = false;
let ents = [], player = null, follower = null, cam = { x: 0, y: 0 };
let B = null; // batalha
let paper = null; // jornal
let tracing = null;

const SPEC = {
  corvo: { id: 'corvo', kind: 'hat', hair: 0, body: 1, acc: 2, legs: 0 },
  vesper: { id: 'vesper', kind: 'hood', body: 0, acc: 1, legs: 0 },
  noctua: { id: 'noctua', kind: 'spirit' },
  crim: { id: 'crim', kind: 'cap', hair: 0, body: 1, acc: 0, legs: 0 }
};

// ════════════════════ ENTIDADES ════════════════════
function ent(o) { return Object.assign({ dir: 'down', px: o.x * TS, py: o.y * TS, moving: 0, step: 0, wait: 30 + rnd(90), alert: 0 }, o); }
function occupied(x, y, self) { return ents.some(e => e !== self && !e.ghost && e.x === x && e.y === y) || (player && player !== self && player.x === x && player.y === y); }
function canWalk(x, y, self) { return WALK.has(tileAt(x, y)) && !occupied(x, y, self); }
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
function tryMove(e, dir) {
  e.dir = dir; const [dx, dy] = DIRS[dir];
  if (!canWalk(e.x + dx, e.y + dy, e)) return false;
  e.fx = e.x; e.fy = e.y; e.x += dx; e.y += dy; e.moving = 8; e.step++;
  return true;
}
function stepEnt(e) {
  if (e.moving) {
    e.moving--;
    const t = 1 - e.moving / 8;
    e.px = (e.fx + (e.x - e.fx) * t) * TS; e.py = (e.fy + (e.y - e.fy) * t) * TS;
    if (!e.moving) { e.px = e.x * TS; e.py = e.y * TS; return true; }
  }
  return false;
}
function freeSpot(box) {
  for (let k = 0; k < 200; k++) {
    const x = box.x + rnd(box.w), y = box.y + rnd(box.h);
    if (canWalk(x, y) && !(player && Math.abs(player.x - x) + Math.abs(player.y - y) < 2)) return { x, y };
  }
  return { x: 15, y: 16 };
}
function facingTile(e) { const [dx, dy] = DIRS[e.dir]; return { x: e.x + dx, y: e.y + dy }; }
function faceToward(e, t) { const dx = t.x - e.x, dy = t.y - e.y; e.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); }

// ════════════════════ NOVO JOGO ════════════════════
function newGame(role) {
  buildMap();
  const names = shuffle(CIT_NAMES).slice(0, 8), jobs = shuffle(JOBS);
  const dists = shuffle([0, 0, 1, 1, 2, 2, 3, 3]);
  const hairC = [0, 1, 2, 1, 0, 2, 1, 0];
  const citizens = names.map((name, i) => ({
    name, short: name.split(' ')[0], job: jobs[i], district: dists[i],
    busy: new Set(shuffle([0, 1, 2, 3, 4, 5]).slice(0, 3)),
    look: { hair: rnd(4), hc: rnd(8), skin: rnd(6), cloth: rnd(7) },
    spec: { id: 'cit' + i, kind: i % 3 === 2 ? 'cap' : 'person', hair: hairC[i], body: 1 + (i % 2), acc: i % 2 ? 0 : 3, legs: 0, long: i % 2 === 1 }
  }));
  S = {
    role, day: 1, actions: 3, citizens, killer: rnd(8),
    detName: pick(DET_NAMES), letters: new Set(),
    lvl: 1, xp: 0, maxhp: 24, kills: 0, cred: 2,
    K: citizens.map(() => Array(6).fill(null)), // conhecimento: 'busy' | 'free'
    killSlots: [], cleared: new Set(), talked: new Set(), log: [],
    susp: 0, learned: [], crims: [], corvoMet: false, home: null
  };
  ents = [];
  citizens.forEach((c, i) => {
    if (role === 'killer' && i === S.killer) return; // você é ela
    const p = freeSpot(BOXES[c.district]);
    ents.push(ent({ x: p.x, y: p.y, spec: c.spec, kind: 'cit', ci: i, box: BOXES[c.district] }));
  });
  if (role === 'detective') {
    player = ent({ x: 11, y: 26, spec: SPEC.corvo, dir: 'up' });
    S.homeDoor = '11,25';
  } else {
    // a casa de Vésper fica no seu bairro
    const kc = S.citizens[S.killer];
    player = ent({ x: 4, y: 22, spec: SPEC.vesper, dir: 'down' });
    S.homeDoor = '4,21';
    follower = ent({ x: 4, y: 22, spec: SPEC.noctua, ghost: true });
    const p = freeSpot({ x: 9, y: 9, w: 14, h: 9 });
    ents.push(ent({ x: p.x, y: p.y, spec: SPEC.corvo, kind: 'corvo', box: { x: 8, y: 9, w: 15, h: 10 } }));
    spawnCriminals();
  }
  if (role === 'detective') player.x = 11, player.y = 26, player.px = 11 * TS, player.py = 26 * TS;
  scene = 'world'; Music.play('town');
  run(async () => {
    await fade();
    if (role === 'detective') {
      await sayAll([
        'Vel Noctis. Os criminosos da cidade estão morrendo um a um.',
        'Ataques do coração, quedas, febres... sempre na hora marcada.',
        'Alguém entre os 8 cidadãos tem um caderno que mata. A cidade o chama de A SENTENÇA.',
        'Eu sou CORVO. Ninguém conhece meu nome verdadeiro. E deve continuar assim.',
        'Converse com todos (A) para colher boatos. Interrogue para ler a agenda completa.',
        'Quem estava OCUPADO na hora de uma morte não pode ter escrito. START abre minhas notas.',
        'Cada interrogatório que eu perder espalha uma letra do meu nome. Seis letras... e eu morro.'
      ]);
    } else {
      await sayAll([
        'NOCTUA: Hihihi... Você me encontrou, Vésper. Ou eu encontrei você?',
        'NOCTUA: Este é o LIBER MORTIS. Trace um nome nele à noite e o dono morre.',
        'NOCTUA: Mas você precisa do nome VERDADEIRO. Criminosos se escondem nas docas e becos.',
        'NOCTUA: Converse com eles para arrancar o nome. Depois volte para casa e escreva.',
        'NOCTUA: Cuidado com o homem de chapéu, CORVO. Se ele te vir, vai querer conversar.',
        'NOCTUA: Vença ele em palavras e aprenda letras do nome dele. Seis letras e... hihi.',
        'NOCTUA: 6 julgamentos e a cidade é sua. Se a suspeita chegar a 100, ele vem te buscar.'
      ]);
    }
  });
}

function spawnCriminals() {
  ents = ents.filter(e => e.kind !== 'crim');
  const n = 3;
  for (let i = 0; i < n; i++) {
    const box = i === 1 ? { x: 2, y: 18, w: 17, h: 8 } : { x: 20, y: 8, w: 6, h: 16 };
    const p = freeSpot(box);
    const c = { name: pick(CRIM_F) + ' ' + pick(CRIM_L), crime: pick(CRIMES), known: false, look: { hair: 2, hc: rnd(8), skin: rnd(6), cloth: rnd(7) } };
    ents.push(ent({ x: p.x, y: p.y, spec: SPEC.crim, kind: 'crim', crim: c, box }));
  }
}

// ════════════════════ SCRIPTS ════════════════════
function run(fn) { if (busy) return; busy = true; Promise.resolve(fn()).catch(e => console.error(e)).finally(() => { busy = false; }); }
function fade() { return new Promise(r => { UI.fade = 16; setTimeout(r, 300); }); }

async function interact() {
  const t = facingTile(player);
  const e = ents.find(n => n.x === t.x && n.y === t.y && !n.ghost);
  if (e) { faceToward(e, player); return talkTo(e); }
  const key = t.x + ',' + t.y;
  if (SIGNS[key]) return say(SIGNS[key]);
  if (DOORS[key]) return door(DOORS[key], key);
  const tl = tileAt(t.x, t.y);
  if (tl === 'g') return say(pick(['Aqui jaz... o nome foi apagado pela chuva.', 'Uma lápide sem data. Só um nome.', 'Flores secas. Alguém esteve aqui ontem.']));
  if (tl === 'm') return say('Um mausoléu antigo. Está trancado com correntes.');
  if (tl === 'W') return say('A água negra do rio Noctis. Não reflete nada.');
  if (tl === 'o') return say('A fonte da praça. As moedas no fundo parecem olhos.');
}

async function door(d, key) {
  Audio.sfx('door');
  if (key === S.homeDoor) {
    const i = await choose(['DORMIR', 'NÃO'], 1);
    if (i === 0) return night();
    return;
  }
  if (d.id === 'catedral') return say('As portas da catedral estão fechadas. Um sino toca em algum lugar lá dentro.');
  return say(pick(['Está trancada.', 'Ninguém atende.', 'Uma voz lá dentro: "Vá embora!"', 'A porta range, mas não abre.']));
}

async function talkTo(e) {
  if (e.kind === 'cit') return S.role === 'detective' ? talkCitizenDet(e) : talkCitizenKil(e);
  if (e.kind === 'crim') return talkCriminal(e);
  if (e.kind === 'corvo') return corvoEncounter(e, false);
}

// ── Detetive: cidadãos ──
async function talkCitizenDet(e) {
  const i = e.ci, c = S.citizens[i];
  await say(`${c.name.toUpperCase()}, ${c.job} (${DISTRICTS[c.district]}).`);
  const opts = ['CONVERSAR', 'INTERROGAR', 'ACUSAR', 'SAIR'];
  const k = await choose(opts, 3);
  if (k === 0) {
    if (S.talked.has(i)) return say(`${c.short}: ${pick(LINES)}`);
    S.talked.add(i);
    return gossip(i);
  }
  if (k === 1) {
    if (S.K[i].every(v => v)) return say('Você já conhece toda a agenda dessa pessoa.');
    if (S.actions <= 0) return say('Já é tarde. Volte à pousada e durma.');
    S.actions--;
    const res = await interrogation(i);
    if (res === 'win') {
      S.K[i] = SLOTS.map((_, s) => c.busy.has(s) ? 'busy' : 'free');
      await say(`${c.short} contou toda a rotina. Agenda anotada!`);
      await checkClear(i);
    }
    return;
  }
  if (k === 2) {
    await say(`Acusar ${c.name} de ser A Sentença? Errar custa caro.`);
    const y = await choose(['ACUSAR', 'NÃO'], 1);
    if (y !== 0) return;
    if (i === S.killer) return finalDuelDet(e);
    S.cred--; S.cleared.add(i);
    const got = leak(1);
    UI.shake = 12; Audio.sfx('hit');
    await sayAll([`${c.short}: Eu?! Você enlouqueceu, detetive!`, `${c.short} tinha um álibi perfeito. A cidade riu de Corvo.`, `Credibilidade: ${S.cred}/2.${got ? ' Na confusão, alguém gritou uma letra do seu nome.' : ''}`]);
    if (S.cred <= 0) return gameOver('killer', 'cred');
  }
}
async function gossip(i) {
  const c = S.citizens[i];
  const pairs = [];
  S.citizens.forEach((o, j) => { if (j !== i) SLOTS.forEach((_, s) => { if (!S.K[j][s]) pairs.push([j, s]); }); });
  if (!pairs.length) return say(`${c.short}: Já contei tudo o que sei.`);
  // prefere horários de morte conhecidos
  const hot = pairs.filter(([j, s]) => S.killSlots.includes(s));
  const [j, s] = pick(hot.length && Math.random() < .7 ? hot : pairs);
  const o = S.citizens[j], b = o.busy.has(s);
  S.K[j][s] = b ? 'busy' : 'free';
  await say(b ? `${c.short}: Às ${SLOTS[s]} eu vi ${o.short} trabalhando, cercado de gente.`
              : `${c.short}: ${o.short} sempre passa as ${SLOTS[s]} sozinho em casa. Esquisito...`);
  await say(`(Anotado: ${o.short} ${b ? 'OCUPADO' : 'SOZINHO'} às ${SLOTS[s]}.)`);
  await checkClear(j);
}
function eliminated(i) { return S.cleared.has(i) || S.killSlots.some(s => S.K[i][s] === 'busy'); }
async function checkClear(j) {
  if (eliminated(j) && !S.cleared.has(j)) { S.cleared.add(j); await say(`${S.citizens[j].short} estava ocupado numa hora de morte. INOCENTE.`); }
}
function leak(n) {
  let got = 0;
  for (let k = 0; k < n; k++) {
    const miss = [0, 1, 2, 3, 4, 5].filter(x => !S.letters.has(x));
    if (!miss.length) break; S.letters.add(pick(miss)); got++;
  }
  return got;
}

// ── Assassina: cidadãos e criminosos ──
async function talkCitizenKil(e) {
  const c = S.citizens[e.ci];
  const hint = S.susp > 70 ? 'Corvo anda perguntando de você... cuidado.' : S.susp > 40 ? 'Corvo está vigiando o seu bairro.' : pick(LINES);
  await say(`${c.short}: ${hint}`);
}
async function talkCriminal(e) {
  const c = e.crim;
  if (c.known) return say(`${c.name.toUpperCase()}: Já te disse meu nome. Some daqui.`);
  await say(`???: O que uma moça faz nas docas a essa hora? (Dizem que esse aí ${c.crime}.)`);
  const k = await choose(['CONVERSAR', 'SAIR'], 1);
  if (k !== 0) return;
  if (S.actions <= 0) return say('NOCTUA: Está amanhecendo... digo, anoitecendo. Volte para casa.');
  S.actions--;
  const res = await battle(killerVsCriminal(c));
  if (res === 'win') {
    c.known = true; S.learned.push(c);
    await say(`Você descobriu o nome: ${c.name.toUpperCase()}!`);
    await say('NOCTUA: Hihi. Agora é só escrever esta noite.');
  } else if (res === 'lose') {
    S.susp = clamp(S.susp + 15, 0, 100);
    ents = ents.filter(x => x !== e);
    await say(`Ele desconfiou e fugiu. Suspeita +15 (${S.susp}/100).`);
  }
}
async function corvoEncounter(e, spotted) {
  if (S.corvoMet) return say('CORVO: Já conversamos hoje, senhorita. Durma bem... se conseguir.');
  S.corvoMet = true;
  if (spotted) await say('CORVO: Ah. Boa noite. Posso tomar um minuto do seu tempo?');
  else await say('CORVO: Você veio até mim? Interessante...');
  const res = await battle(killerVsCorvo(false));
  if (res === 'win') {
    const got = leak(1);
    const known = [0, 1, 2, 3, 4, 5].map(x => S.letters.has(x) ? S.detName[x] : '_').join('');
    await say(got ? `Ele deixou escapar algo... O nome dele: ${known}` : 'Você já sabe o nome inteiro dele.');
  } else if (res === 'lose') {
    S.susp = clamp(S.susp + 25, 0, 100);
    await say(`CORVO: Obrigado. Foi muito... revelador. Suspeita +25 (${S.susp}/100).`);
  }
}

// ════════════════════ BATALHA ════════════════════
// cfg: {foe:{name, art(canvas), hp, lvl}, me:{name, art}, moves:[{n, d, uses, act}], foeTurn, intro, canRun, meter}
function battle(cfg) {
  return new Promise(async res => {
    Music.play(cfg.boss ? 'boss' : 'battle');
    UI.flash = 20; await wait(350);
    scene = 'battle';
    B = Object.assign({ sel: 0, focus: 0, guard: 0, foeShake: 0, meShake: 0, menu: false, enter: 40 }, cfg);
    B.foe.max = B.foe.hp; B.foe.shown = B.foe.hp;
    B.me.hp = B.me.hp != null ? B.me.hp : S.maxhp; B.me.max = S.maxhp; B.me.shown = B.me.hp;
    B.moves.forEach(m => m.left = m.uses);
    await wait(500);
    await say(cfg.intro);
    let out = null;
    while (!out) {
      const mv = await pickMove();
      if (mv === 'run') {
        if (cfg.canRun) { await say('Você encerrou a conversa e se afastou.'); out = 'run'; break; }
        await say('Não há como fugir agora!'); continue;
      }
      if (mv.left != null && mv.left <= 0) { await say('Não dá para usar isso de novo.'); continue; }
      if (mv.left != null) mv.left--;
      const r = await mv.act(B);
      if (r === 'win' || B.foe.hp <= 0) { out = 'win'; break; }
      if (r === 'lose') { out = 'lose'; break; }
      await wait(200);
      const f = await cfg.foeTurn(B);
      if (f) { out = f; break; }
      if (B.me.hp <= 0) { out = 'lose'; break; }
    }
    if (out === 'win') {
      Audio.sfx('sel');
      if (cfg.winText) await say(cfg.winText);
      await gainXP(cfg.xp || 12);
    } else if (out === 'lose' && cfg.loseText) await say(cfg.loseText);
    await wait(200);
    UI.flash = 10; await wait(250);
    scene = 'world'; B = null; Music.play('town');
    res(out);
  });
}
function pickMove() {
  return new Promise(res => { B.menu = true; B.res = res; });
}
function updBattleMenu() {
  if (!B || !B.menu || UI.dlg || UI.choice) return;
  const n = B.moves.length;
  if (took('left') && B.sel % 2) B.sel--;
  if (took('right') && B.sel % 2 === 0 && B.sel + 1 < n) B.sel++;
  if (took('up') && B.sel >= 2) B.sel -= 2;
  if (took('down') && B.sel + 2 < n) B.sel += 2;
  if (took('A')) { Audio.sfx('sel'); B.menu = false; B.res(B.moves[B.sel]); }
  else if (took('B')) { Audio.sfx('blip'); B.menu = false; B.res('run'); }
}
async function hurtFoe(d, msg) {
  if (B.focus) { d *= 2; B.focus = 0; }
  if (B.guard) { d = Math.ceil(d / 2); }
  d = Math.round(d);
  B.foe.hp = Math.max(0, B.foe.hp - d); B.foeShake = 16; Audio.sfx('hit');
  if (msg) await say(msg);
}
async function hurtMe(d, msg) {
  B.me.hp = Math.max(0, B.me.hp - d); B.meShake = 16; UI.shake = 8; Audio.sfx('hit');
  if (msg) await say(msg);
}
async function healMe(d, msg) { B.me.hp = Math.min(B.me.max, B.me.hp + d); Audio.sfx('heal'); if (msg) await say(msg); }
async function gainXP(x) {
  S.xp += x;
  await say(`Ganhou ${x} de experiência.`);
  while (S.xp >= S.lvl * 20) {
    S.xp -= S.lvl * 20; S.lvl++; S.maxhp += 4; Audio.sfx('level');
    await say(`Subiu para o NÍVEL ${S.lvl}! Compostura máxima: ${S.maxhp}.`);
  }
}
const dmg = (a, b) => a + rnd(b - a + 1) + (S.lvl - 1);

// ── Movesets do detetive ──
function detMoves(boss) {
  const m = [
    { n: 'PRESSÃO', d: 'Perguntas diretas', act: async b => hurtFoe(dmg(4, 6), 'Corvo pressiona com perguntas diretas!') },
    boss
      ? { n: 'PROVA', d: 'Usa suas pistas', uses: 3, act: async b => { const ev = evidence(); await say(`Corvo apresenta ${ev} prova(s)!`); return hurtFoe(4 + ev * 3, ev ? 'As provas a encurralam!' : 'Sem provas... só blefe.'); } }
      : { n: 'OBSERVAR', d: 'Próximo golpe x2', act: async b => { b.focus = 1; await say('Corvo observa cada gesto... O próximo golpe será dobrado!'); } },
    { n: 'BLEFE', d: '70%: dano alto', act: async b => { if (Math.random() < .7) return hurtFoe(dmg(8, 11), 'Corvo blefa: "Eu já sei de tudo."  Funcionou!'); await say('O blefe falhou!'); return hurtMe(3); } },
    { n: 'CHÁ DOCE', d: 'Recupera 9', uses: 2, act: async b => healMe(9, 'Corvo toma um chá com sete cubos de açúcar. Compostura recuperada!') }
  ];
  return m;
}
function evidence() {
  const k = S.killer; let ev = 0;
  S.killSlots.forEach(s => { if (S.K[k][s] === 'free') ev++; });
  if (S.K[k].every(v => v)) ev += 2;
  ev += S.cleared.size >= 5 ? 1 : 0;
  return ev;
}
function interrogation(i) {
  const c = S.citizens[i], isK = i === S.killer;
  return battle({
    foe: { name: c.short.toUpperCase(), art: portraitCanvas(c.look, 4), hp: (isK ? 24 : 14 + rnd(5)) + S.day, lvl: S.day + (isK ? 3 : 1), label: 'CALMA' },
    me: { name: 'CORVO', art: bigSprite('detective', 2) , label: 'COMPOST.' },
    moves: detMoves(false), canRun: true, xp: 12,
    intro: `${c.short} aceita responder às perguntas de Corvo.`,
    winText: `${c.short} perdeu a calma e falou demais!`,
    loseText: 'Corvo perdeu a compostura... e ' + c.short + ' viu algo no lenço dele.',
    foeTurn: async b => {
      const r = Math.random();
      if (isK && r < .25 && b.foe.hp < b.foe.max) { b.foe.hp = Math.min(b.foe.max, b.foe.hp + 5); Audio.sfx('heal'); await say(`${c.short} sorri friamente. Recuperou a calma.`); }
      else if (r < .45) { b.guard = 1; await say(`${c.short} responde com evasivas. O próximo golpe perde força.`); return; }
      else if (!isK && r < .55) await say(`${c.short} gagueja, nervoso.`);
      else await hurtMe(dmg(2, isK ? 6 : 4) - (S.lvl - 1) + Math.floor(S.day / 3), `${c.short} devolve com uma contra-pergunta!`);
      b.guard = 0;
    }
  }).then(async r => {
    if (isK) leak(1); // ela estudou seu rosto
    if (r === 'lose') leak(1);
    return r;
  });
}
async function finalDuelDet(e) {
  const c = S.citizens[S.killer];
  await sayAll([`${c.short}: ...`, `${c.short}: Hihi. Então você chegou até aqui, detetive.`, 'Ela abre um caderno negro escondido sob o casaco. O ar fica gelado.']);
  const r = await battle({
    boss: true,
    foe: { name: 'SENTENÇA', art: bigSprite('killer', 2, true), hp: 40 + S.day * 2, lvl: 20, label: 'CALMA' },
    me: { name: 'CORVO', art: bigSprite('detective', 2), label: 'COMPOST.' },
    moves: detMoves(true), canRun: false, xp: 50, meter: { label: 'NOME', get: () => S.letters.size },
    intro: 'DUELO FINAL! A Sentença quer escrever seu nome antes que você prove tudo!',
    foeTurn: async b => {
      const r2 = Math.random();
      if (r2 < .4) {
        leak(1); Audio.sfx('scratch');
        await say(`A Sentença rabisca uma letra... (${S.letters.size}/6)`);
        if (S.letters.size >= 6) return 'lose';
      } else if (r2 < .55) { b.foe.hp = Math.min(b.foe.max, b.foe.hp + 6); Audio.sfx('heal'); await say('Noctua sussurra no ouvido dela. Ela recupera a calma.'); }
      else await hurtMe(dmg(4, 7) - (S.lvl - 1), 'A Sentença manipula a conversa!');
    }
  });
  if (r === 'win') return gameOver('detective', 'accuse');
  return gameOver('killer', 'duel');
}

// ── Movesets da assassina ──
function kilMoves(final) {
  const m = [
    { n: 'ENCANTAR', d: 'Charme frio', act: async b => hurtFoe(dmg(4, 6), 'Vésper sorri com doçura calculada.') },
    { n: 'OUVIR', d: 'Próximo golpe x2', act: async b => { b.focus = 1; await say('Vésper apenas escuta... e memoriza cada palavra.'); } },
    { n: 'MENTIR', d: '70%: dano alto', act: async b => { if (Math.random() < .7) return hurtFoe(dmg(8, 11), 'Uma mentira perfeita!'); S.susp = clamp(S.susp + 5, 0, 100); await say('A mentira soou falsa... Suspeita +5.'); return hurtMe(3); } },
    { n: 'RECOMPOR', d: 'Recupera 9', uses: 2, act: async b => healMe(9, 'Vésper ajeita o capuz e respira fundo.') }
  ];
  if (final && S.letters.size >= 6) m[1] = { n: 'ESCREVER', d: 'O nome dele!', act: async b => { await sayAll([`Vésper tira uma página do grimório da manga e escreve: ${S.detName}.`, 'CORVO: ...!']); Audio.sfx('death'); b.foe.hp = 0; return 'win'; } };
  return m;
}
function killerVsCriminal(c) {
  return {
    foe: { name: '???', art: portraitCanvas(c.look, 4), hp: 14 + rnd(6) + S.day, lvl: S.day + 1, label: 'GUARDA' },
    me: { name: 'VÉSPER', art: bigSprite('killer', 2), label: 'MÁSCARA' },
    moves: kilMoves(false), canRun: true, xp: 12,
    intro: 'O estranho cruza os braços. Faça-o dizer o próprio nome.',
    winText: `"...Meu nome é ${c.name}. Satisfeita?"`,
    loseText: 'Ele estreitou os olhos. "Você é estranha, moça."',
    foeTurn: async b => {
      const r = Math.random();
      if (r < .3) { b.guard = 1; await say('Ele desconversa. O próximo golpe perde força.'); return; }
      await hurtMe(dmg(2, 5) - (S.lvl - 1) + Math.floor(S.day / 3), pick(['Ele te encara, desconfiado!', '"Por que tanta pergunta?"', 'Ele ri na sua cara!']));
      b.guard = 0;
    }
  };
}
function killerVsCorvo(final) {
  return {
    boss: final,
    foe: { name: 'CORVO', art: bigSprite('detective', 2, true), hp: final ? 50 + S.day * 2 : 26 + S.day * 2, lvl: final ? 25 : 10 + S.day, label: 'CALMA' },
    me: { name: 'VÉSPER', art: bigSprite('killer', 2), label: 'MÁSCARA' },
    moves: kilMoves(final), canRun: false, xp: final ? 50 : 20,
    meter: final ? { label: 'ALGEMA', get: () => B ? B.cuffs || 0 : 0 } : null,
    intro: final ? 'CONFRONTO FINAL! Corvo trouxe algemas. Convença-o antes que ele feche o cerco!' : 'Corvo quer conversar. Não deixe a máscara cair.',
    winText: final ? 'Corvo hesita. "Eu... estava errado?"' : 'CORVO: Hm. Você é boa nisso.',
    foeTurn: async b => {
      const r = Math.random();
      if (final && r < .35) { b.cuffs = (b.cuffs || 0) + 1; Audio.sfx('alert'); await say(`Corvo aperta o cerco... (${b.cuffs}/6)`); if (b.cuffs >= 6) return 'lose'; return; }
      if (r < .5) { b.foe.hp = Math.min(b.foe.max, b.foe.hp + 6); Audio.sfx('heal'); await say('Corvo come um doce e pensa melhor. Recuperou a calma.'); return; }
      if (r < .65) { b.guard = 1; await say('Corvo te observa fixamente. O próximo golpe perde força.'); return; }
      await hurtMe(dmg(3, final ? 7 : 6) - (S.lvl - 1), pick(['CORVO: "Onde você estava às 04h?"', 'CORVO: "Interessante. Continue."', 'CORVO: "Suas mãos... estão sujas de tinta?"']));
      b.guard = 0;
    }
  };
}

// ════════════════════ NOITE ════════════════════
async function night() {
  await fade();
  scene = 'night'; Music.play('night');
  if (S.role === 'detective') {
    await say('Corvo apaga a vela. Lá fora, um sino toca...');
    // IA da assassina
    const k = S.citizens[S.killer];
    if (S.letters.size >= 6) { await say('...e em algum lugar, alguém escreve seis letras.'); return gameOver('killer', 'name'); }
    const news = [];
    if (Math.random() < .88) {
      const slot = pick(SLOTS.map((_, i) => i).filter(i => !k.busy.has(i)));
      const delay = Math.random() < .33;
      const v = pick(CRIM_F) + ' ' + pick(CRIM_L);
      S.kills++;
      if (delay) news.push(`${v}, que ${pick(CRIMES)}, morreu. O legista não sabe a hora em que o nome foi escrito.`);
      else {
        news.push(`${v}, que ${pick(CRIMES)}, morreu às ${SLOTS[slot]}.`);
        if (!S.killSlots.includes(slot)) { S.killSlots.push(slot); news.push(`Novo horário de morte: ${SLOTS[slot]}. Quem estava ocupado nessa hora é inocente.`); }
      }
    } else news.push('Nenhuma morte esta noite. Estranho...');
    S.log.push(...news.map(n => `D${S.day}: ${n}`));
    if (S.kills >= 7) { await morning(news); return gameOver('killer', 'judg'); }
    S.day++; S.actions = 3; S.talked.clear();
    if (S.day > 10) { await morning(news); return gameOver('killer', 'time'); }
    S.citizens.forEach((c, i) => { if (!S.cleared.has(i) && eliminated(i)) S.cleared.add(i); });
    await morning(news);
    reshuffle();
  } else {
    await grimoireNight();
  }
}
function reshuffle() {
  ents.forEach(e => { if (e.box && e.kind !== 'crim') { const p = freeSpot(e.box); Object.assign(e, { x: p.x, y: p.y, px: p.x * TS, py: p.y * TS, moving: 0 }); } });
  scene = 'world'; Music.play('town'); fade();
}
async function morning(news) {
  scene = 'paper'; paper = { day: S.day, head: news[0] || '' };
  Audio.sfx('door');
  for (const n of news) await say(n);
}

// ── A noite da assassina: o grimório ──
async function grimoireNight() {
  scene = 'grim';
  await say('NOCTUA: A noite chegou. O grimório tem fome...');
  const opts = S.learned.map(c => c.name.toUpperCase().slice(0, 13));
  const full = S.letters.size >= 6;
  if (full) opts.unshift(S.detName + ' (CORVO)');
  opts.push('NÃO ESCREVER');
  const k = await choose(opts, opts.length - 1, 0);
  const news = [];
  if (k === opts.length - 1) {
    news.push('Nenhuma morte esta noite. A cidade estranha o silêncio.');
    S.susp = clamp(S.susp - 8, 0, 100);
  } else if (full && k === 0) {
    const ok = await traceName(S.detName);
    if (ok) { Audio.sfx('death'); return gameOver('killer', 'name'); }
    news.push('Você hesitou. A página continua em branco.');
  } else {
    const c = S.learned[full ? k - 1 : k];
    const ok = await traceName(c.name);
    if (ok) {
      S.kills++; S.learned = S.learned.filter(x => x !== c);
      ents = ents.filter(e => e.crim !== c);
      S.susp = clamp(S.susp + 10, 0, 100);
      news.push(`${c.name}, que ${c.crime}, morreu de ataque cardíaco. Julgamentos: ${S.kills}/6.`);
      news.push(`Corvo investiga a morte. Suspeita: ${S.susp}/100.`);
    } else news.push('Você hesitou. A página continua em branco.');
  }
  if (S.kills >= 6) { await morning(news); return gameOver('killer', 'judg'); }
  S.day++; S.actions = 3; S.corvoMet = false;
  S.susp = clamp(S.susp - 4, 0, 100);
  await morning(news);
  if (S.susp >= 100 || S.day > 10) {
    await sayAll(['Alguém bate à sua porta antes do amanhecer.', 'CORVO: Bom dia, Vésper. Acho que precisamos conversar. De verdade, desta vez.']);
    scene = 'world';
    const r = await battle(killerVsCorvo(true));
    return gameOver(r === 'win' ? 'killer' : 'detective', r === 'win' ? 'duel' : 'caught');
  }
  spawnCriminals(); reshuffle();
  player.x = 4; player.y = 22; player.px = 64; player.py = 352; player.dir = 'down';
  follower.x = 4; follower.y = 22; follower.px = 64; follower.py = 352;
}

// ── traçar o nome com o dedo (na própria tela) ──
function traceName(name) {
  return new Promise(res => {
    const words = name.split(' ');
    const gh = document.createElement('canvas'); gh.width = W; gh.height = H;
    const gx = gh.getContext('2d');
    let fs = 30; gx.font = `${fs}px UnifrakturMaguntia, serif`;
    const widest = Math.max(...words.map(w => gx.measureText(w).width));
    if (widest > 136) fs = Math.floor(fs * 136 / widest);
    gx.font = `${fs}px UnifrakturMaguntia, serif`; gx.textAlign = 'center'; gx.textBaseline = 'middle'; gx.fillStyle = '#000';
    const lh = 34, y0 = 70 - (words.length - 1) * lh / 2;
    words.forEach((w, i) => gx.fillText(w, 80, y0 + i * lh));
    const data = gx.getImageData(0, 0, W, H).data, pts = [];
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (data[(y * W + x) * 4 + 3] > 120) pts.push({ x, y, hit: 0 });
    const ink = document.createElement('canvas'); ink.width = W; ink.height = H;
    tracing = { gh, ink, pts, hits: 0, last: null, res, done: false, name };
    scene = 'trace';
  });
}
function tracePos(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; }
cv.addEventListener('pointerdown', e => {
  Audio.init();
  if (scene !== 'trace' || !tracing || tracing.done) return;
  cv.setPointerCapture(e.pointerId); tracing.last = tracePos(e); e.preventDefault();
});
cv.addEventListener('pointermove', e => {
  const t = tracing; if (scene !== 'trace' || !t || !t.last || t.done) return;
  const p = tracePos(e), x = t.ink.getContext('2d');
  x.strokeStyle = PAL[0]; x.lineWidth = 3; x.lineCap = 'round';
  x.beginPath(); x.moveTo(t.last.x, t.last.y); x.lineTo(p.x, p.y); x.stroke();
  const d = Math.hypot(p.x - t.last.x, p.y - t.last.y), n = Math.ceil(d / 2) + 1;
  for (let i = 0; i <= n; i++) {
    const q = { x: t.last.x + (p.x - t.last.x) * i / n, y: t.last.y + (p.y - t.last.y) * i / n };
    for (const pt of t.pts) if (!pt.hit && (pt.x - q.x) ** 2 + (pt.y - q.y) ** 2 < 36) { pt.hit = 1; t.hits++; }
  }
  if (frame % 2 === 0) Audio.sfx('scratch');
  t.last = p;
  if (t.hits / t.pts.length >= .72) {
    t.done = true; Audio.sfx('death'); UI.flash = 30; UI.shake = 14;
    if (navigator.vibrate) navigator.vibrate([40, 60, 200]);
    setTimeout(() => { tracing = null; scene = 'grim'; t.res(true); }, 900);
  }
});
const endTrace = () => { if (tracing) tracing.last = null; };
cv.addEventListener('pointerup', endTrace); cv.addEventListener('pointercancel', endTrace);

// ════════════════════ MENU START / NOTAS ════════════════════
async function startMenu() {
  Audio.sfx('sel');
  const opts = ['NOTAS', 'STATUS', 'PALETA', 'SAIR'];
  const k = await choose(opts, 3);
  if (k === 0) { scene = 'notes'; await waitKey(); scene = 'world'; }
  if (k === 1) {
    if (S.role === 'detective') await say(`CORVO  NV ${S.lvl}  XP ${S.xp}/${S.lvl * 20}\nDia ${S.day}/10  Ações: ${S.actions}\nCredibilidade ${S.cred}/2`);
    else await say(`VÉSPER  NV ${S.lvl}  XP ${S.xp}/${S.lvl * 20}\nDia ${S.day}/10  Ações: ${S.actions}\nJulgamentos ${S.kills}/6`);
    if (S.role === 'detective') await say(`Mortes: ${S.kills}/7. Seu nome exposto: ${S.letters.size}/6 letras (estimativa da imprensa).`);
    else await say(`Suspeita: ${S.susp}/100. Nome de Corvo: ${[0, 1, 2, 3, 4, 5].map(x => S.letters.has(x) ? S.detName[x] : '_').join('')}`);
  }
  if (k === 2) {
    const p = await choose(PALS.map(p => p.name), palIdx);
    setPal(p);
  }
}
let keyWaiter = null;
function waitKey() { return new Promise(r => { keyWaiter = r; }); }

// ════════════════════ FIM DE JOGO ════════════════════
async function gameOver(winner, reason) {
  const won = winner === S.role;
  const k = S.citizens[S.killer];
  scene = 'end'; Music.play(won ? 'title' : 'night');
  S.end = { won, winner };
  const T = {
    accuse: `As provas fecharam o cerco. ${k.name} era A Sentença. O grimório foi selado em ferro.`,
    duel: winner === 'killer' ? (S.role === 'killer' ? 'Corvo perdeu o duelo. Desacreditado, deixou Vel Noctis numa carruagem ao amanhecer.' : `A Sentença terminou de escrever seu nome. Corvo caiu no meio da praça.`) : '',
    name: `Seis letras. ${S.detName}. Corvo levou a mão ao peito e caiu. Ninguém mais ousa investigar.`,
    judg: S.role === 'killer' ? 'Seis julgamentos. O crime em Vel Noctis cessou por medo. A cidade agora é sua.' : `A Sentença completou seus julgamentos. Era ${k.name}.`,
    cred: `Duas acusações falsas. Corvo foi afastado do caso. A Sentença era ${k.name}.`,
    time: `Dez dias se passaram e Corvo não chegou a um nome. A Sentença era ${k.name}.`,
    caught: 'As algemas se fecharam. O grimório foi tomado e Noctua riu, voando para longe.'
  };
  UI.flash = 30;
  await wait(400);
  await say(won ? 'VITÓRIA!' : 'FIM DE JOGO...');
  await say(T[reason] || '');
  await say('Pressione A para voltar ao título.');
  scene = 'title'; S = null; player = null; follower = null; ents = []; Music.play('title'); titleSel = 0;
}

// ════════════════════ TÍTULO ════════════════════
let titleSel = 0;
async function titleMenu() {
  const k = await choose(['A SENTENÇA', 'CORVO', 'COMO JOGAR'], -1, 30, 104);
  if (k === 2) {
    await sayAll([
      'LIBER MORTIS é um duelo entre uma assassina com um caderno mortal e um detetive sem nome.',
      'Use o direcional para andar e A para conversar. START abre o menu e as notas.',
      'Batalhas são duelos de palavras em turnos. Esgote a CALMA do outro antes que ele esgote a sua.',
      'A SENTENÇA: descubra nomes de criminosos e trace-os no grimório com o dedo à noite.',
      'CORVO: colete boatos e agendas. Quem estava ocupado na hora de uma morte é inocente.',
      'Os dois querem a mesma coisa: o nome verdadeiro do outro.'
    ]);
    return;
  }
  scene = 'loading';
  setTimeout(() => newGame(k === 0 ? 'killer' : 'detective'), 30);
}

// ════════════════════ UPDATE ════════════════════
function update() {
  frame++;
  if (keyWaiter && (took('A') || took('B') || took('START'))) { const r = keyWaiter; keyWaiter = null; r(); }
  else if (UI.choice) updChoice();
  else if (UI.dlg) updDlg();
  else if (scene === 'battle') updBattleMenu();
  else if (scene === 'title' && !busy) run(titleMenu);
  else if (scene === 'world' && !busy) updWorld();
  if (scene === 'trace' && took('B') && tracing && !tracing.done) { const t = tracing; tracing = null; scene = 'grim'; t.res(false); }
  if (scene === 'world' && !UI.dlg && !UI.choice) updNPCs();
  if (B) {
    B.foe.shown += (B.foe.hp - B.foe.shown) * .15; B.me.shown += (B.me.hp - B.me.shown) * .15;
    if (B.foeShake) B.foeShake--; if (B.meShake) B.meShake--; if (B.enter) B.enter--;
  }
  pressed.clear();
}
function updWorld() {
  if (stepEnt(player)) onStep();
  if (follower) stepEnt(follower);
  if (player.moving) return;
  if (took('START')) return run(startMenu);
  if (took('A')) return run(interact);
  for (const d of ['up', 'down', 'left', 'right']) if (keys[d]) {
    const prev = { x: player.x, y: player.y };
    if (tryMove(player, d)) {
      if (follower) { follower.fx = follower.x; follower.fy = follower.y; follower.x = prev.x; follower.y = prev.y; follower.moving = 8; follower.dir = d; }
    } else if (frame % 16 === 0) Audio.sfx('bump');
    break;
  }
}
function onStep() {
  if (S.role !== 'killer' || S.corvoMet) return;
  const c = ents.find(e => e.kind === 'corvo'); if (!c || c.moving) return;
  const [dx, dy] = DIRS[c.dir];
  for (let k = 1; k <= 4; k++) {
    const x = c.x + dx * k, y = c.y + dy * k;
    if (!WALK.has(tileAt(x, y))) break;
    if (x === player.x && y === player.y) {
      run(async () => {
        c.alert = 40; Audio.sfx('alert'); await wait(700);
        while (Math.abs(c.x - player.x) + Math.abs(c.y - player.y) > 1) { tryMove(c, c.dir); while (c.moving) { await wait(16); } }
        faceToward(player, c);
        await corvoEncounter(c, true);
      });
      return;
    }
    if (ents.some(e => e !== c && e.x === x && e.y === y)) break;
  }
}
function updNPCs() {
  ents.forEach(e => {
    if (stepEnt(e)) {}
    if (e.alert) e.alert--;
    if (busy || e.moving) return;
    if (--e.wait > 0) return;
    e.wait = 40 + rnd(100);
    const d = pick(Object.keys(DIRS)); const [dx, dy] = DIRS[d];
    const nx = e.x + dx, ny = e.y + dy, b = e.box;
    if (b && (nx < b.x || ny < b.y || nx >= b.x + b.w || ny >= b.y + b.h)) { e.dir = d; return; }
    if (!tryMove(e, d)) e.dir = d;
  });
}

// ════════════════════ RENDER ════════════════════
function draw() {
  g.save();
  if (UI.shake) { g.translate(rnd(5) - 2, rnd(5) - 2); UI.shake--; }
  R(0, 0, W, H, 3);
  if (scene === 'world' || (scene === 'night' && false)) drawWorld();
  else if (scene === 'battle') drawBattle();
  else if (scene === 'title') drawTitle();
  else if (scene === 'notes') drawNotes();
  else if (scene === 'paper') drawPaper();
  else if (scene === 'grim' || scene === 'night') drawGrim();
  else if (scene === 'trace') drawTrace();
  else if (scene === 'end') drawEnd();
  if (UI.dlg) drawDlg();
  if (UI.choice) drawChoice();
  g.restore();
  if (UI.fade > 0) { g.globalAlpha = UI.fade / 16; R(0, 0, W, H, 0); g.globalAlpha = 1; UI.fade--; }
  if (UI.flash > 0) { if (UI.flash % 4 < 2) { g.globalAlpha = .8; R(0, 0, W, H, UI.flash > 15 ? 0 : 3); g.globalAlpha = 1; } UI.flash--; }
}
function drawWorld() {
  cam.x = clamp(player.px + 8 - W / 2, 0, MW * TS - W); cam.y = clamp(player.py + 8 - H / 2, 0, MH * TS - H);
  const cx = Math.round(cam.x), cy = Math.round(cam.y);
  const tx0 = Math.floor(cx / TS), ty0 = Math.floor(cy / TS);
  for (let y = ty0; y <= ty0 + 9; y++) for (let x = tx0; x <= tx0 + 10; x++) g.drawImage(tileCanvas(tileAt(x, y)), x * TS - cx, y * TS - cy);
  const all = ents.concat(follower ? [follower] : [], [player]).sort((a, b) => a.py - b.py);
  all.forEach(e => {
    const fr = e.moving ? (e.step % 2 ? 1 : 2) : (e.spec.kind === 'spirit' ? (Math.floor(frame / 20) % 2) : 0);
    const dir = e.dir === 'right' ? 'left' : e.dir;
    const c = charCanvas(e.spec, dir, fr);
    const x = Math.round(e.px - cx), y = Math.round(e.py - cy) - 2 - (e.spec.kind === 'spirit' ? 6 : 0);
    if (e.dir === 'right') { g.save(); g.translate(x + 16, y); g.scale(-1, 1); g.drawImage(c, 0, 0); g.restore(); }
    else g.drawImage(c, x, y);
    if (e.alert) { R(x + 5, y - 14, 7, 11, 0); R(x + 6, y - 13, 5, 9, 3); R(x + 8, y - 12, 1, 5, 0); R(x + 8, y - 6, 1, 1, 0); }
    if (e.kind === 'crim' && e.crim.known) { R(x + 6, y - 5, 4, 4, 0); R(x + 7, y - 4, 2, 2, 2); }
  });
  // vinheta noturna nos cantos
  R(0, 0, W, 1, 0); R(0, H - 1, W, 1, 0);
  // HUD
  if (!UI.dlg) {
    box(0, 0, 108, 14);
    text(`DIA ${S.day} AÇÕES ${S.actions}`, 4, 3);
  }
}
function hpBar(x, y, w, cur, max) {
  R(x, y, w + 2, 5, 0); R(x + 1, y + 1, w, 3, 3);
  const f = Math.max(0, Math.round(w * cur / max));
  R(x + 1, y + 1, f, 3, cur / max < .25 ? 1 : 2);
}
function drawBattle() {
  R(0, 0, W, H, 3);
  // fundo: linhas de velocidade
  for (let i = 0; i < 10; i++) R(0, 6 + i * 9, W, 1, 2);
  // plataformas
  g.fillStyle = PAL[2]; g.beginPath(); g.ellipse(124, 70, 34, 7, 0, 0, 7); g.fill();
  g.beginPath(); g.ellipse(40, 94, 38, 7, 0, 0, 7); g.fill();
  const ent = B.enter * 3;
  const fa = B.foe.art, ma = B.me.art;
  const fs = B.foeShake && B.foeShake % 4 < 2 ? 3 : 0, ms = B.meShake && B.meShake % 4 < 2 ? 3 : 0;
  if (!(B.foe.hp <= 0 && frame % 8 < 4)) g.drawImage(fa, 124 - fa.width / 2 + fs + ent, 72 - fa.height);
  g.drawImage(ma, 40 - ma.width / 2 - ms - ent, 96 - ma.height);
  // caixa do oponente
  box(2, 2, 82, 26);
  text(B.foe.name.slice(0, 9), 7, 6);
  text(`:L${B.foe.lvl}`, 7 + 0, 16, 1);
  hpBar(40, 17, 40, B.foe.shown, B.foe.max);
  // medidor especial
  if (B.meter) { const v = B.meter.get(); text(B.meter.label, 2, 32, 0); for (let i = 0; i < 6; i++) R(50 + i * 6, 32, 5, 7, i < v ? 1 : 2); }
  // caixa do jogador
  box(84, 58, 76, 36);
  text(B.me.name, 89, 62);
  text('NV' + S.lvl, 89, 72, 1);
  hpBar(114, 73, 40, B.me.shown, B.me.max);
  text(`${Math.ceil(B.me.hp)}/${B.me.max}`, 102, 83);
  if (B.menu && !UI.dlg) {
    box(0, 96, 160, 48);
    B.moves.forEach((m, i) => {
      const x = 12 + (i % 2) * 76, y = 103 + Math.floor(i / 2) * 12;
      text(m.n.slice(0, 8), x, y);
      if (i === B.sel) cursor(x - 8, y);
    });
    const m = B.moves[B.sel];
    R(4, 128, 152, 1, 1);
    text((m.d + (m.left != null ? ` (${m.left})` : '')).slice(0, 18), 8, 132, 1);
  }
}
function drawTitle() {
  R(0, 0, W, H, 0);
  // lua
  g.fillStyle = PAL[1]; g.beginPath(); g.arc(80, 34, 30, 0, 7); g.fill();
  g.fillStyle = PAL[2]; g.beginPath(); g.arc(76, 30, 22, 0, 7); g.fill();
  // catedral
  const sil = [[0, 110], [10, 110], [10, 96], [16, 86], [22, 96], [22, 110], [44, 110], [44, 84], [52, 66], [60, 84], [60, 110], [70, 110], [70, 60], [80, 40], [90, 60], [90, 110], [100, 110], [100, 84], [108, 66], [116, 84], [116, 110], [138, 110], [138, 96], [144, 86], [150, 96], [150, 110], [160, 110], [160, 144], [0, 144]];
  g.fillStyle = PAL[0]; g.beginPath(); sil.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.fill();
  R(78, 70, 4, 10, 2); R(76, 73, 8, 3, 2);
  // título
  g.font = '27px UnifrakturMaguntia, serif'; g.textAlign = 'center'; g.textBaseline = 'top';
  g.fillStyle = PAL[0]; g.fillText('Liber Mortis', 81, 5); g.fillStyle = PAL[3]; g.fillText('Liber Mortis', 80, 4);
  g.textAlign = 'left';
  const bob = Math.floor(frame / 30) % 2;
  const d = bigSprite('detective', 1), k = bigSprite('killer', 1, true);
  g.drawImage(d, 14, 72 + bob); g.drawImage(k, 116, 72 - bob);
  
}
function drawNotes() {
  R(0, 0, W, H, 3);
  if (S.role === 'detective') {
    text('NOTAS DE CORVO', 4, 3);
    SLOTS.forEach((s, j) => { const x = 52 + j * 18; text(s.slice(0, 2), x, 14, S.killSlots.includes(j) ? 0 : 2); if (S.killSlots.includes(j)) R(x, 22, 15, 1, 1); });
    S.citizens.forEach((c, i) => {
      const y = 26 + i * 12, out = eliminated(i);
      text(c.short.slice(0, 6), 2, y, out ? 2 : 0);
      if (out) R(1, y + 3, 48, 1, 1);
      SLOTS.forEach((_, j) => {
        const x = 52 + j * 18, v = S.K[i][j];
        R(x, y, 15, 9, 0);
        R(x + 1, y + 1, 13, 7, v === 'busy' ? 1 : v === 'free' ? 3 : 2);
        if (v === 'free' && S.killSlots.includes(j)) { R(x + 5, y + 3, 5, 3, 0); }
      });
    });
    text('ESCURO=OCUPADO', 2, 124, 1);
    text(`Mortes ${S.kills}/7 Nome ${S.letters.size}/6`, 2, 134, 0);
  } else {
    text('GRIMÓRIO - NOMES', 4, 4);
    if (!S.learned.length) text('(nenhum nome)', 8, 20, 2);
    S.learned.forEach((c, i) => text(c.name.slice(0, 18), 8, 18 + i * 11));
    text('NOME DE CORVO:', 4, 76);
    [0, 1, 2, 3, 4, 5].forEach(x => { R(16 + x * 22, 100, 16, 1, 0); if (S.letters.has(x)) text(S.detName[x], 20 + x * 22, 90); });
    text(`SUSPEITA ${S.susp}/100`, 4, 112);
    R(4, 124, 152, 8, 0); R(5, 125, 150, 6, 3); R(5, 125, Math.round(150 * S.susp / 100), 6, 1);
    text(`JULGAMENTOS ${S.kills}/6`, 4, 135, 1);
  }
}
function drawPaper() {
  R(0, 0, W, H, 3);
  R(4, 4, 152, 1, 0); R(4, 26, 152, 1, 0); R(4, 28, 152, 1, 0);
  g.font = '14px UnifrakturMaguntia, serif'; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillStyle = PAL[0];
  g.fillText('Gazeta de Vel Noctis', 80, 8); g.textAlign = 'left';
  text(`MANHÃ DO DIA ${paper.day}`, 22, 33, 1);
  for (let i = 0; i < 5; i++) { R(8, 48 + i * 8, 70, 2, 2); R(84, 48 + i * 8, 68, 2, 2); }
  R(84, 48, 30, 38, 1); R(86, 50, 26, 34, 0);
}
function drawGrim() {
  R(0, 0, W, H, 0);
  R(6, 6, 148, 132, 1); R(8, 8, 70, 128, 3); R(82, 8, 70, 128, 3); R(78, 8, 4, 128, 0);
  for (let i = 0; i < 10; i++) { R(12, 20 + i * 11, 62, 1, 2); R(86, 20 + i * 11, 62, 1, 2); }
  g.font = '14px UnifrakturMaguntia, serif'; g.fillStyle = PAL[1]; g.textBaseline = 'top';
  g.fillText('Liber', 22, 10); g.fillText('Mortis', 94, 10);
  if (frame % 50 < 25) { R(40, 70, 2, 2, 1); R(118, 90, 2, 2, 1); }
  const sp = bigSprite('spirit', 1);
  g.drawImage(sp, 66, 112 + (Math.floor(frame / 20) % 2));
}
function drawTrace() {
  const t = tracing;
  R(0, 0, W, H, 3);
  for (let i = 0; i < 12; i++) R(0, 12 + i * 11, W, 1, 2);
  R(0, 0, W, 10, 0); text('TRACE O NOME  B=SAIR', 2, 1, 3);
  g.globalAlpha = .28; g.drawImage(t.gh, 0, 0); g.globalAlpha = 1;
  g.drawImage(t.ink, 0, 0);
  const p = t.hits / t.pts.length / .72;
  R(0, 138, W, 6, 0); R(1, 139, Math.min(158, Math.round(158 * p)), 4, 1);
}
function drawEnd() {
  R(0, 0, W, H, 0);
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + frame / 200; g.strokeStyle = PAL[1]; g.beginPath(); g.moveTo(80, 50); g.lineTo(80 + Math.cos(a) * 200, 50 + Math.sin(a) * 200); g.stroke(); }
  const kw = S && S.end ? S.end.winner === 'killer' : true;
  const win = bigSprite(kw ? 'killer' : 'detective', 2), lose = bigSprite(kw ? 'detective' : 'killer', 1);
  g.drawImage(win, 30, 20);
  g.save(); g.translate(120, 80); g.rotate(-Math.PI / 2); g.globalAlpha = .6; g.drawImage(lose, -lose.width / 2, -lose.height / 2); g.restore(); g.globalAlpha = 1;
  if (kw) g.drawImage(bigSprite('spirit', 1), 100, 10 + (Math.floor(frame / 20) % 2));
}

// ════════════════════ LOOP ════════════════════
function loop() { update(); draw(); requestAnimationFrame(loop); }
document.fonts.load('8px "Press Start 2P"').then(() => document.fonts.load('20px UnifrakturMaguntia')).catch(() => {}).finally(() => { Music.play('title'); loop(); });
