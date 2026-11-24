// LIBER MORTIS — sprites em pixel art (personagens originais)
// Cada sprite é uma matriz de caracteres; cada caractere é uma cor da paleta.
'use strict';

const SPRITES = {};

// ── CORVO — o detetive ───────────────────────────────────────────
// Chapéu de aba larga, sobretudo cinza de gola alta, monóculo dourado,
// cachecol carmesim e um corvo de olho vermelho no ombro.
SPRITES.detective = {
  palette: {
    k: '#07070b', h: '#1c1c26', H: '#34344a', r: '#8a0f1f',
    w: '#eadfd2', s: '#b39d8e', e: '#14141e', y: '#d4af37', Y: '#fff4b0',
    g: '#3c3f4f', G: '#60657c', n: '#24263a', t: '#a3122c', T: '#d42a44',
    c: '#d8d2c4', b: '#101018', B: '#2a2a3a', R: '#ff3344', l: '#6b5a3e', L: '#a08454'
  },
  rows: [
    '............................',
    '............kkkk............',
    '..........kkhhhhkk..........',
    '.........khhhhHHhhk.........',
    '.........khhhhHHhhk.........',
    '.........khhhhhhhhk.........',
    '.........krrrrrrrrk.........',
    '.....kkkkkhhhhhhhhkkkkk.....',
    '...kkhhhhhhhhhhhhhhhhhhkk...',
    '....kkkkkkkkkkkkkkkkkkkk....',
    '.........keeeeeeeek.........',
    '.........kewwwwwwek.........',
    '...kbbk..kwekwwyyYk.........',
    '..kbRbbk.kwwwwyYyyk.........',
    '.ybbbbbbkkswwwwyysk.........',
    '..kbbbbbk.kswkkwsk..........',
    '..kBbbbbk..ktwwtk...........',
    '...kbbbkkkgtTttTtgkkk.......',
    '...kgkbkgGgtTttTtgGgk.......',
    '..kgGgggGgkkcccckkgGgk......',
    '..kgGgggGgkcctkcckgGggk.....',
    '..kgGgggGgkcktTkckgGggk.....',
    '..kgGggGgkgkktTkkgkgGggk....',
    '.kgGggkGgkggkkTkkggkgGgk....',
    '.kgGgk.kgkgggkkkgggkkgGk....',
    '.kwwk..kgkgggGggggggk.kwk...',
    '.kssk..kgkggggGgggggk.kLLk..',
    '..kk...kgkggggGggggk.klLLlk.',
    '.......kgkggggGggggk.kllllk.',
    '.......kgggggggggggk..kllk..',
    '.......kggggggkggggk........',
    '......kgggggk.kgggggk.......',
    '......knnnnk...knnnnk.......',
    '.....kbbbbbk...kbbbbbk......',
    '.....kkkkkkk...kkkkkkk......'
  ]
};

// ── VÉSPER, "A SENTENÇA" — a assassina ───────────────────────────
// Capuz negro com forro carmesim, mechas prateadas, olhos rubros
// incandescentes e o grimório negro com o selo dourado.
SPRITES.killer = {
  palette: {
    k: '#050407', B: '#120c18', P: '#241830', Q: '#3e2a50', c: '#5e0a1a', C: '#a3122c',
    w: '#efe4dc', s: '#bfa8a0', R: '#ff2240', X: '#ffd6dc', a: '#d6d6e6', A: '#8e8ea8',
    m: '#0a0a0e', M: '#26262e', y: '#d4af37', Y: '#fff0a0', p: '#e9e0c8', e: '#2a0a12'
  },
  rows: [
    '............................',
    '...........kkkkkk...........',
    '.........kkPPPPPPkk.........',
    '........kPPQQQQPPPPk........',
    '.......kPPQQPPPPPPPPk.......',
    '......kPPQPPPPPPPPPPPk......',
    '......kPPPPkkkkkkPPPPk......',
    '.....kPPPkkaaaaaakkPPPk.....',
    '.....kPPkaaAaaaaAaakPPk.....',
    '.....kPPkaAwwwwwwAakPPk.....',
    '.....kPPkAwwwwwwwwAkPPk.....',
    '.....kPPkawRXwwXRwakPPk.....',
    '.....kPPkAwwwwwwwwAkPPk.....',
    '.....kPPkaswwwwwwsakPPk.....',
    '.....kPPkaAswkkwsAakPPk.....',
    '....kPPPkaakswwskaakPPPk....',
    '....kPPckaAAkkkkAAakcPPk....',
    '...kPPccCkkkPPPPkkkCccPPk...',
    '...kPPcCCcPPPPPPPPcCCcPPk...',
    '..kPPPcCcPPPQPPQPPPcCcPPPk..',
    '..kPPPcCcPPPQPPQPPPcCcPPPk..',
    '..kPPccCcPPkkkkkkkPcCcPPPk..',
    '..kPPcCCcPkmmmmmmmkcCCcPPk..',
    '..kPPcCcPkwmMyYyMmwkcCcPPk..',
    '..kPPcCcPkwmMyMyMmwkcCcPPk..',
    '..kPPcCcPPkmMMyMMmkPcCcPPk..',
    '..kPPcCcPPkmmmmmmmkPcCcPPk..',
    '..kPPcCcPPPkkkkkkkPPcCcPPk..',
    '..kPPcCcPPPPPPPPPPPPcCcPPk..',
    '.kPPPcCcPPPPPQPPPPPPcCcPPPk.',
    '.kPPccCcPPPPPQPPPPPPcCccPPk.',
    '.kPPcCCcPPPPPPQPPPPPcCCcPPk.',
    'kPPPcCcPPPPPPPQPPPPPPcCcPPPk',
    'kkPPkkkPPPPkkkkkkPPPPkkkPPkk',
    '.kkk..kkkkk......kkkkk..kkk.'
  ]
};

// ── NOCTUA — a entidade do grimório ─────────────────────────────
// Espírito-mariposa com rosto de porcelana rachada.
SPRITES.spirit = {
  palette: {
    k: '#060508', d: '#2a2236', D: '#4a3c5c', v: '#6c5a84', V: '#9a86b4',
    w: '#f2ece4', s: '#b8aea8', R: '#ff1e3c', o: '#c9a24a', x: '#3a0010'
  },
  rows: [
    '..kk..................kk..',
    '.kVk..................kVk.',
    '..kvk................kvk..',
    'kk..kk.....kkkk.....kk..kk',
    'kdkk..k..kkwwwwkk..k..kkdk',
    'kdDvkk.kkwwwwwwwwkk.kkvDdk',
    'kdDVvvkkwwwwwwwwwwkkvvVDdk',
    'kdDVVvkwwkkwwwwkkwwkvVVDdk',
    'kdDVovkwkRRkwwkRRkwkvoVDdk',
    'kdDVVvkwwkkwwwwkkwwkvVVDdk',
    '.kdDVvkswwwwwkwwwwskvVDdk.',
    '.kdDvvkkswkxxxxkwskkvvDdk.',
    '..kdDvvkkswkkkkwskkvvDdk..',
    '..kddDvvkkssssssk.kvDddk..',
    '...kddDvkkkddddkkkvDddk...',
    '...kkddkk.kdDDdk.kkddkk...',
    '.....kkk..kdDDdk..kkk.....',
    '...........kddk...........',
    '............kk............'
  ]
};

// Desenha uma matriz de pixel art em um <canvas>
function drawSprite(canvas, sprite, scale, opts = {}) {
  const rows = sprite.rows;
  const w = Math.max(...rows.map(r => r.length));
  const h = rows.length;
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const pal = Object.assign({}, sprite.palette, opts.override || {});
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      ctx.fillStyle = pal[ch] || '#f0f';
      const xx = opts.flip ? (w - 1 - x) : x;
      ctx.fillRect(xx * scale, y * scale, scale, scale);
    }
  }
  return canvas;
}

function makeSprite(name, scale, opts) {
  const c = document.createElement('canvas');
  c.className = 'sprite sprite-' + name;
  drawSprite(c, SPRITES[name], scale, opts);
  return c;
}

// ── Retratos procedurais dos cidadãos (12x14) ───────────────────
const PORTRAIT_HAIR = [
  [ // curto
    '....HHHH....',
    '..HHHHHHHH..',
    '.HHHHHHHHHH.',
    '.HHwwwwwwHH.',
    '.Hwwwwwwwwh.',
    '.wweEwwEeww.',
    '.wwwwwwwwww.',
    '.wwwwSSwwww.',
    '..wwwmmwww..',
    '...wwwwww...',
    '....wwww....',
    '..CCCwwCCC..',
    '.CCCCccCCCC.',
    'CCCCCccCCCCC'
  ],
  [ // longo
    '...HHHHHH...',
    '..HHHHHHHH..',
    '.HHHHHHHHHH.',
    '.HHwwwwwwHH.',
    'HHwwwwwwwwHH',
    'HwweEwwEewwH',
    'HwwwwwwwwwwH',
    'HHwwwSSwwwHH',
    'HHwwwmmwwwHH',
    'HH.wwwwww.HH',
    'HH..wwww..HH',
    'HHCCCwwCCCHH',
    '.CCCCccCCCC.',
    'CCCCCccCCCCC'
  ],
  [ // chapéu-coco
    '...KKKKKK...',
    '...KKKKKK...',
    '...KKKKKK...',
    '.KKKKKKKKKK.',
    '.HwwwwwwwwH.',
    '.wweEwwEeww.',
    '.wwwwwwwwww.',
    '.wwwwSSwwww.',
    '..wwwmmwww..',
    '...wwwwww...',
    '....wwww....',
    '..CCCwwCCC..',
    '.CCCCccCCCC.',
    'CCCCCccCCCCC'
  ],
  [ // coque
    '....HHHH....',
    '....HHHH....',
    '..HHHHHHHH..',
    '.HHHHHHHHHH.',
    '.Hwwwwwwwwh.',
    '.wweEwwEeww.',
    '.wwwwwwwwww.',
    '.wwwwSSwwww.',
    '..wwwmmwww..',
    '...wwwwww...',
    '....wwww....',
    '..CCCwwCCC..',
    '.CCCCccCCCC.',
    'CCCCCccCCCCC'
  ]
];
const HAIR_COLORS = ['#1a1418', '#3b2a20', '#6b4a2a', '#b9b2a8', '#7a1a1a', '#2c2c40', '#c8a060', '#4a4a4a'];
const SKIN_COLORS = ['#efe2d6', '#e0c4a8', '#c69c78', '#9a6e50', '#6e4a34', '#f4e8e0'];
const CLOTH_COLORS = ['#2a2a3a', '#3a1a24', '#1e2e2a', '#40302a', '#22223a', '#4a4a58', '#301830'];

function makePortrait(look, scale = 4) {
  const tpl = PORTRAIT_HAIR[look.hair % PORTRAIT_HAIR.length];
  const skin = SKIN_COLORS[look.skin % SKIN_COLORS.length];
  const sprite = {
    rows: tpl,
    palette: {
      H: HAIR_COLORS[look.hc % HAIR_COLORS.length], h: HAIR_COLORS[look.hc % HAIR_COLORS.length],
      K: '#121216', w: skin, S: shade(skin, -28), m: '#5a2026', e: '#ffffff', E: '#101014',
      C: CLOTH_COLORS[look.cloth % CLOTH_COLORS.length], c: '#d8d0c0'
    }
  };
  const c = document.createElement('canvas');
  c.className = 'portrait';
  drawSprite(c, sprite, scale);
  return c;
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}
