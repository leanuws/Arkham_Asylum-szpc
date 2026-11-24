// LIBER MORTIS — motor do jogo
'use strict';

// ═════════════════════════════ DADOS ═════════════════════════════
const SLOTS = ['00h', '04h', '08h', '12h', '16h', '20h'];
const SLOT_DESC = ['madrugada', 'antes da aurora', 'manhã', 'meio-dia', 'tarde', 'crepúsculo'];
const DISTRICTS = ['Catedral', 'Docas', 'Jardins', 'Burgo Velho'];
const DIST_ICON = ['✝', '⚓', '❀', '♜'];
const CITIZEN_NAMES = [
  'Helena Vaz', 'Otávio Lis', 'Mirela Cruz', 'Bento Faro', 'Ísis Moraes', 'Caio Duarte',
  'Lívia Sá', 'Teodoro Brum', 'Nina Rocha', 'Ravi Torres', 'Alba Neves', 'Dante Prado',
  'Júlia Mendes', 'Hugo Sales', 'Clara Lobo', 'Félix Rangel', 'Irene Vasco', 'Silas Moura'
];
const JOBS = ['relojoeira', 'coveiro', 'bibliotecária', 'boticário', 'organista', 'estudante', 'tipógrafa', 'juiz aposentado',
  'enfermeira', 'violinista', 'restauradora', 'carteiro', 'fotógrafa', 'sacristão', 'pintora', 'alfaiate', 'professora', 'cocheiro'];
const DET_NAMES = ['MORVAN', 'ADRIEL', 'SEVERO', 'LUCIEN', 'CASSIO', 'ORLAND', 'EZEQUI', 'DORIAN', 'VALMIR', 'TOBIAS'];
const CRIM_FIRST = ['Bruno', 'Ítalo', 'Marta', 'Rui', 'Sônia', 'Gael', 'Vera', 'Joel', 'Lara', 'Nestor', 'Olga', 'Pietro', 'Rita', 'Samuel', 'Tânia', 'Ulisses', 'Yara', 'Zeca', 'Edgar', 'Fausto', 'Gilda', 'Igor', 'Kátia', 'Lauro', 'Mauro', 'Nádia'];
const CRIM_LAST = ['Corvelo', 'Taranto', 'Bessa', 'Quintal', 'Amarante', 'Fontes', 'Garrido', 'Lacerda', 'Penha', 'Rebelo', 'Soares', 'Valadão', 'Xavier', 'Barreto', 'Cunha', 'Dorneles'];
const CRIMES = ['incendiou um orfanato', 'envenenou o próprio irmão', 'chefia uma rede de contrabando', 'fugiu da prisão de Vel Noctis',
  'assaltou a capela de São Judas', 'sequestrou um herdeiro', 'matou três guardas', 'fraudou o asilo municipal',
  'afogou um rival nas docas', 'vendia ópio a crianças', 'atacou peregrinos na estrada', 'saqueou túmulos do cemitério'];
const CAUSES = ['parada cardíaca', 'queda da escadaria', 'febre súbita', 'afogamento', 'colapso no meio da rua'];

const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const $ = s => document.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

const KILLS_TO_WIN = 7;
const MAX_DAYS = 12;
const MAX_INK = 5;

let S = null; // estado da partida

// ═════════════════════════════ ÁUDIO ═════════════════════════════
const Audio = {
  ctx: null, master: null, scratchGain: null, droneOn: false,
  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain(); this.master.gain.value = .5; this.master.connect(this.ctx.destination);
      // ruído do bico de pena
      const len = this.ctx.sampleRate * 2, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3200; bp.Q.value = 1.2;
      this.scratchGain = this.ctx.createGain(); this.scratchGain.gain.value = 0;
      src.connect(bp); bp.connect(this.scratchGain); this.scratchGain.connect(this.master); src.start();
      this.drone();
    } catch (e) { this.ctx = null; }
  },
  tone(freq, dur, type = 'sine', vol = .3, when = 0, slide = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + when, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + .05);
  },
  drone() { // órgão grave em loop
    if (!this.ctx || this.droneOn) return; this.droneOn = true;
    [55, 82.4, 110.0, 130.8].forEach((f, i) => {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain(), lfo = this.ctx.createOscillator(), lg = this.ctx.createGain();
      o.type = i % 2 ? 'triangle' : 'sawtooth'; o.frequency.value = f;
      const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
      g.gain.value = .022; lfo.frequency.value = .07 + i * .03; lg.gain.value = .014;
      lfo.connect(lg); lg.connect(g.gain); o.connect(lp); lp.connect(g); g.connect(this.master); o.start(); lfo.start();
    });
  },
  bell() { [196, 392, 588, 784].forEach((f, i) => this.tone(f, 3.2 - i * .5, 'sine', .22 / (i + 1))); },
  heart() { this.tone(60, .18, 'sine', .7); this.tone(52, .22, 'sine', .55, .22); },
  sting() { this.tone(880, .6, 'sawtooth', .12, 0, -700); this.tone(110, 1.2, 'square', .1); this.tone(233, 1.2, 'sawtooth', .07); },
  click() { this.tone(520, .06, 'triangle', .12); },
  win() { [262, 311, 392, 523].forEach((f, i) => this.tone(f, 1.6, 'triangle', .15, i * .18)); },
  lose() { [392, 349, 311, 196].forEach((f, i) => this.tone(f, 1.4, 'sawtooth', .09, i * .25)); },
  scratch(v) { if (this.scratchGain) this.scratchGain.gain.setTargetAtTime(v, this.ctx.currentTime, .03); }
};

// ═════════════════════════════ UI BÁSICA ═════════════════════════════
function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $('#' + id).classList.add('active');
}
function flash() { const f = $('#flash'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); }
function shake() { const a = $('#app'); a.classList.remove('shake'); void a.offsetWidth; a.classList.add('shake'); }
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }
function vibrate(p) { if (navigator.vibrate) navigator.vibrate(p); }

function openSheet(build) { const c = $('#sheet-card'); c.innerHTML = ''; build(c); $('#sheet').classList.remove('hidden'); }
function closeSheet() { $('#sheet').classList.add('hidden'); }
$('#sheet').addEventListener('click', e => { if (e.target.id === 'sheet') closeSheet(); });

function scene(spriteName, html, opts = {}) {
  const s = el('div', 'scene' + (opts.right ? ' right' : ''));
  const who = el('div', 'who' + (spriteName === 'spirit' ? ' spirit-float' : ''));
  who.appendChild(makeSprite(spriteName, 4, { flip: opts.flip }));
  s.appendChild(who);
  s.appendChild(el('div', 'bubble' + (opts.dark ? ' dark' : ''), html));
  return s;
}

function interlude(title, sub, ms = 1500) {
  return new Promise(res => {
    const d = el('div', 'interlude', `<h2>${title}</h2><p>${sub}</p>`);
    $('#scr-game').appendChild(d);
    Audio.bell();
    setTimeout(() => { d.style.transition = 'opacity .4s'; d.style.opacity = 0; setTimeout(() => { d.remove(); res(); }, 400); }, ms);
  });
}

// ═════════════════════════════ CRIAÇÃO DA PARTIDA ═════════════════════════════
function newGame(role) {
  const names = shuffle(CITIZEN_NAMES).slice(0, 12);
  const dists = shuffle([0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3]);
  const jobs = shuffle(JOBS);
  const citizens = names.map((name, i) => ({
    name, job: jobs[i], district: dists[i],
    busy: new Set(shuffle([0, 1, 2, 3, 4, 5]).slice(0, 3)),
    look: { hair: rnd(4), hc: rnd(8), skin: rnd(6), cloth: rnd(7) }
  }));
  const killer = rnd(12);
  S = {
    role, day: 1, citizens, killer,
    detName: pick(DET_NAMES), letters: new Set(),
    ink: 3, judg: 0, cred: 2, ap: 2,
    watched: null, bait: null,
    interrogated: new Set(), cleared: new Set(), marked: new Set(),
    killSlots: [],            // horários de morte conhecidos pelo detetive
    districtKnown: null,      // bairro da assassina, se revelado
    clues: [],                // registro de pistas do detetive
    score: Array(12).fill(1), // suspeita interna da IA detetive
    dayNews: [], nightReport: [], over: false, lastBaitDay: -9
  };
  show('scr-game');
  briefing();
}

function killerC() { return S.citizens[S.killer]; }
function freeSlots(c) { return [0, 1, 2, 3, 4, 5].filter(s => !c.busy.has(s)); }

// Candidatos consistentes com o que o detetive sabe
function consistent(i) {
  const c = S.citizens[i];
  if (S.cleared.has(i)) return false;
  if (S.districtKnown != null && c.district !== S.districtKnown) return false;
  if (S.interrogated.has(i) && S.killSlots.some(s => c.busy.has(s))) return false;
  return true;
}
function candidates() { return S.citizens.map((_, i) => i).filter(consistent); }

// ═════════════════════════════ HUD ═════════════════════════════
function hud(phase) {
  $('#hud-phase').textContent = phase;
  $('#hud-daynum').textContent = S.day;
  const st = $('#hud-stats'); st.innerHTML = '';
  const judg = `<span class="stat" title="Julgamentos"><i>☩</i>${S.judg}/${KILLS_TO_WIN}</span>`;
  if (S.role === 'killer') {
    st.innerHTML = judg +
      `<span class="stat" title="Tinta"><i>✒</i><span class="pips">${'●'.repeat(S.ink)}${'○'.repeat(MAX_INK - S.ink)}</span></span>` +
      `<span class="stat" title="Letras do nome de Corvo"><i>✉</i>${S.letters.size}/6</span>`;
  } else {
    st.innerHTML = judg +
      `<span class="stat" title="Credibilidade"><i>⚖</i>${'♦'.repeat(S.cred)}${'◇'.repeat(2 - S.cred)}</span>` +
      `<span class="stat" title="Ações"><i>✦</i>${S.ap} PA</span>`;
  }
}

// ═════════════════════════════ ABERTURA ═════════════════════════════
function briefing() {
  const st = $('#stage'); st.innerHTML = '';
  hud('Prólogo');
  if (S.role === 'killer') {
    const k = killerC();
    st.appendChild(scene('spirit', `Hihihi… O grimório escolheu você, <b>${k.name}</b>. Trace um nome em minhas páginas e a hora em que escrever será a hora da morte.`, { dark: true }));
    st.appendChild(scene('killer', `De dia, sou só uma ${k.job} do bairro <b>${DISTRICTS[k.district]}</b>. À noite, sou <b>A Sentença</b>.`, { right: true }));
    const p = el('div', 'panel');
    p.innerHTML = `<h3>Sua identidade secreta</h3>
      <p><b>${k.name}</b> — ${k.job}, ${DIST_ICON[k.district]} ${DISTRICTS[k.district]}</p>
      <p class="mt">Você está <b>sozinha</b> (pode escrever) às: <span class="gold">${freeSlots(k).map(s => SLOTS[s]).join(' · ')}</span></p>
      <p class="mt muted">Corvo vai cruzar as horas das mortes com a agenda de cada cidadão. Varie, atrase, engane.</p>`;
    st.appendChild(p);
    st.appendChild(scene('detective', `Sentença… sei que você está entre os doze. E vou provar.`, { flip: false }));
    const b = el('button', 'btn btn-blood mt', 'Começar');
    b.onclick = () => { Audio.click(); startDay(); };
    st.appendChild(b);
  } else {
    st.appendChild(scene('detective', `Doze cidadãos de Vel Noctis. Um deles mata com um caderno. Eu, que não tenho nome, vou encontrar quem tem.`));
    st.appendChild(scene('killer', `Mostre o rosto, detetive. Diga seu nome… e o resto eu escrevo.`, { right: true, dark: true }));
    const p = el('div', 'panel');
    p.innerHTML = `<h3>Seus métodos</h3>
      <ul class="news">
        <li><b>Interrogar</b> (1 PA): revela a agenda do cidadão. Mas ele vê seu rosto.</li>
        <li><b>Vigiar</b> (1 PA): se a assassina escrever sob sua vigilância, é presa.</li>
        <li><b>Isca</b> (2 PA): um criminoso falso aparece na TV de um único bairro.</li>
        <li><b>Acusar</b>: segure o botão. Dois erros e você cai em descrédito.</li>
      </ul>`;
    st.appendChild(p);
    const b = el('button', 'btn btn-ash mt', 'Abrir o caso');
    b.onclick = () => { Audio.click(); startDay(); };
    st.appendChild(b);
  }
}

// ═════════════════════════════ CICLO ═════════════════════════════
function startDay() {
  if (S.over) return;
  S.ap = 2; S.watched = null; S.bait = null; S.dayNews = [];
  if (S.role === 'detective') renderBoard();
  else { aiDetectiveDay(); if (!S.over) renderKillerDusk(); }
}

function generateCriminals() {
  const r = Math.random();
  const nNat = r < .15 ? 0 : r < .6 ? 1 : 2;
  const used = new Set();
  const mk = (kind, district) => {
    let n; do { n = pick(CRIM_FIRST) + ' ' + pick(CRIM_LAST); } while (used.has(n)); used.add(n);
    return { name: n, crime: pick(CRIMES), kind, district, look: { hair: rnd(4), hc: rnd(8), skin: rnd(6), cloth: rnd(7) } };
  };
  const nat = Array.from({ length: nNat }, () => mk('nat', null));
  const loc = DISTRICTS.map((_, d) => mk('loc', d));
  let bait = null;
  if (S.bait != null) { bait = mk('nat', null); bait.bait = true; bait.baitDistrict = S.bait; }
  return { nat, loc, bait };
}

// Lista que a assassina enxerga na TV
function visibleTargets(crims) {
  const k = killerC();
  const list = crims.nat.slice();
  if (crims.bait && crims.bait.baitDistrict === k.district) list.splice(rnd(list.length + 1), 0, crims.bait);
  list.push(crims.loc[k.district]);
  return list;
}

// Sensação de vigilância (Noctua): 75% de acerto, 15% de alarme falso
function senseWatched() {
  if (S.watched === S.killer) return Math.random() < .75;
  return Math.random() < .15;
}

function endDay() {
  if (S.over) return;
  closeSheet();
  interlude('A noite cai', `Dia ${S.day} — as velas se apagam em Vel Noctis`).then(() => {
    S.crims = generateCriminals();
    S.sensed = senseWatched();
    if (S.role === 'killer') renderGrimoire();
    else resolveNight(aiKillerNight());
  });
}

// ═════════════════════════════ RESOLUÇÃO DA NOITE ═════════════════════════════
function resolveNight(act) {
  const k = killerC();
  const rep = []; // relatório público (o que o detetive descobre)
  const priv = []; // o que só a assassina percebe
  const day = S.day;

  // Prisão em flagrante
  if (act.type !== 'skip' && S.watched === S.killer) {
    return endGame('detective', 'caught');
  }

  if (act.type === 'name') {
    if (S.letters.size >= 6) return endGame('killer', 'name');
  }

  if (act.type === 'kill') {
    const t = act.target;
    S.ink -= 1 + (act.delay ? 1 : 0);
    S.judg++;
    const cause = pick(CAUSES);
    let line = `<b>${t.name}</b>, que ${t.crime}, morreu de ${cause}`;
    if (act.delay) line += ` — mas o legista afirma que <i>a hora foi escolhida</i>. Impossível saber quando o nome foi escrito.`;
    else { line += ` às <b>${SLOTS[act.slot]}</b>.`; if (!S.killSlots.includes(act.slot)) S.killSlots.push(act.slot); }
    rep.push({ t: line, c: 'alert' });
    if (t.bait) {
      S.districtKnown = k.district;
      rep.push({ t: `<b>${t.name} nunca existiu.</b> Era uma isca exibida só no bairro ${DIST_ICON[k.district]} ${DISTRICTS[k.district]}. A Sentença mora lá!`, c: 'good' });
      priv.push(`ERA UMA ARMADILHA. Corvo agora sabe que você mora em ${DISTRICTS[k.district]}.`);
    } else if (t.kind === 'loc' && S.districtKnown == null) {
      S.districtKnown = k.district;
      rep.push({ t: `${t.name} só aparecia na TV local de ${DIST_ICON[k.district]} ${DISTRICTS[k.district]}. A Sentença assiste a esse canal.`, c: 'good' });
      priv.push(`Um criminoso local… Corvo deduziu que você mora em ${DISTRICTS[k.district]}.`);
    }
    if (S.watched != null && S.watched !== S.killer) {
      S.cleared.add(S.watched);
      rep.push({ t: `${S.citizens[S.watched].name} estava sob vigilância durante a morte. <b>Inocente.</b>`, c: 'good' });
    }
    if (S.bait != null && !t.bait) {
      rep.push({ t: `A isca exibida em ${DISTRICTS[S.bait]} não foi tocada.` });
      S.citizens.forEach((c, i) => { if (c.district === S.bait) S.score[i] *= .6; });
    }
  } else if (act.type === 'follow') {
    S.ink -= 1;
    const missing = [0, 1, 2, 3, 4, 5].filter(i => !S.letters.has(i));
    const got = pick(missing); S.letters.add(got);
    priv.push(`Você seguiu Corvo pelas vielas e viu a letra <b>${S.detName[got]}</b> numa carta endereçada a ele.`);
    rep.push({ t: 'Nenhuma morte nesta noite.' });
    if (Math.random() < .35) {
      const s = pick(freeSlots(k));
      if (!S.killSlots.includes(s)) S.killSlots.push(s);
      rep.push({ t: `Corvo percebeu que estava sendo seguido às <b>${SLOTS[s]}</b>. Quem o seguia estava livre nesse horário.`, c: 'alert' });
      priv.push(`Corvo notou você às ${SLOTS[s]}. Esse horário virou pista.`);
    }
    if (S.watched != null && S.watched !== S.killer) {
      S.cleared.add(S.watched);
      rep.push({ t: `${S.citizens[S.watched].name} estava vigiado(a) enquanto alguém seguia Corvo. <b>Inocente.</b>`, c: 'good' });
    }
  } else { // skip
    rep.push({ t: 'Nenhuma morte nesta noite. A cidade respira.' });
    if (S.watched != null) {
      S.score[S.watched] *= 3;
      rep.push({ t: `A noite em que <b>${S.citizens[S.watched].name}</b> foi vigiado(a) foi a única sem mortes… Coincidência?`, c: 'alert' });
    }
  }

  S.clues.push(...rep.map(r => ({ day, ...r })));
  S.nightReport = rep; S.nightPriv = priv;
  S.ink = Math.min(MAX_INK, S.ink + 1);

  if (S.judg >= KILLS_TO_WIN) return endGame('killer', 'judg');
  S.day++;
  if (S.day > MAX_DAYS) return endGame('killer', 'time');

  interlude('Amanhece', `Dia ${S.day}`, 1200).then(renderMorning);
}

function renderMorning() {
  const st = $('#stage'); st.innerHTML = ''; st.scrollTop = 0;
  hud('Aurora');
  if (S.role === 'killer') {
    const p = el('div', 'panel');
    p.innerHTML = '<h3>Jornal da manhã</h3>';
    const ul = el('ul', 'news');
    S.nightReport.forEach(r => ul.appendChild(el('li', r.c || '', r.t)));
    p.appendChild(ul); st.appendChild(p);
    if (S.nightPriv.length) st.appendChild(scene('spirit', S.nightPriv.join('<br>'), { dark: true }));
    const n = candidates().length;
    const p2 = el('div', 'panel');
    p2.innerHTML = `<h3>O que Corvo sabe</h3>
      <p>Horários das mortes: <span class="gold">${S.killSlots.length ? S.killSlots.map(s => SLOTS[s]).join(', ') : 'nenhum'}</span></p>
      <p>Seu bairro: <span class="gold">${S.districtKnown != null ? DISTRICTS[S.districtKnown] : 'desconhecido'}</span></p>
      <p class="mt">Suspeitos na lista dele: <b>${n}</b> de 12</p>`;
    st.appendChild(p2);
    const b = el('button', 'btn btn-blood', 'Viver mais um dia');
    b.onclick = () => { Audio.click(); startDay(); };
    st.appendChild(b);
  } else {
    st.appendChild(scene('detective', S.nightReport.some(r => r.c === 'alert') ? 'Mais um corpo… cada morte é uma assinatura. Vamos ler.' : 'Nada? Ninguém para de matar sem motivo.'));
    const p = el('div', 'panel');
    p.innerHTML = '<h3>Relatório da noite</h3>';
    const ul = el('ul', 'news');
    S.nightReport.forEach(r => ul.appendChild(el('li', r.c || '', r.t)));
    p.appendChild(ul); st.appendChild(p);
    const b = el('button', 'btn btn-ash', 'Ao quadro de evidências');
    b.onclick = () => { Audio.click(); startDay(); };
    st.appendChild(b);
  }
}

// ═════════════════════════════ IA — DETETIVE ═════════════════════════════
function aiDetectiveDay() {
  const news = S.dayNews;
  const tryAccuse = (force) => {
    const c = candidates();
    if (!c.length) return false;
    let target = null;
    if (c.length === 1) target = c[0];
    else if (force || (S.day >= 8 && c.length <= 3) || (S.day >= 10 && c.length <= 5)) {
      target = c.slice().sort((a, b) => S.score[b] - S.score[a] + (Math.random() - .5) * .3)[0];
    }
    if (target == null) return false;
    accuse(target, news);
    return true;
  };
  if (tryAccuse(false) || S.over) return;

  let ap = 2, watchedSet = false;
  while (ap > 0) {
    const c = candidates();
    const unint = c.filter(i => !S.interrogated.has(i));
    if (S.districtKnown == null && ap === 2 && S.day >= 2 && S.day - S.lastBaitDay > 2 && Math.random() < .4) {
      const cnt = [0, 0, 0, 0]; c.forEach(i => cnt[S.citizens[i].district] += S.score[i]);
      S.bait = cnt.indexOf(Math.max(...cnt)); S.lastBaitDay = S.day; ap = 0;
      continue; // isca é secreta
    }
    if (unint.length && (ap === 2 || watchedSet || Math.random() < .5)) {
      const i = unint.sort((a, b) => S.score[b] - S.score[a] + (Math.random() - .5))[0];
      interrogate(i, news); ap--;
    } else if (!watchedSet && c.length) {
      const i = c.slice().sort((a, b) => S.score[b] - S.score[a] + (Math.random() - .5) * .8)[0];
      S.watched = i; watchedSet = true; ap--;
    } else ap--;
  }
  if (!S.over) tryAccuse(S.day >= MAX_DAYS);
}

function interrogate(i, news) {
  S.interrogated.add(i);
  const c = S.citizens[i];
  if (i === S.killer) {
    const missing = [0, 1, 2, 3, 4, 5].filter(x => !S.letters.has(x));
    const got = shuffle(missing).slice(0, 2); got.forEach(x => S.letters.add(x));
    if (news) news.push({ t: `Corvo bateu à <b>sua</b> porta e fez perguntas sobre sua rotina. Você viu o rosto dele… e as letras <b>${got.map(x => S.detName[x]).join(', ') || '—'}</b> bordadas no lenço.`, c: 'alert' });
  } else if (news) news.push({ t: `Corvo foi visto interrogando ${c.name} (${c.job}, ${DISTRICTS[c.district]}).` });
}

function accuse(i, news) {
  const c = S.citizens[i];
  if (i === S.killer) return endGame('detective', 'accuse');
  S.cleared.add(i); S.cred--;
  const missing = [0, 1, 2, 3, 4, 5].filter(x => !S.letters.has(x));
  const got = shuffle(missing).slice(0, 2); got.forEach(x => S.letters.add(x));
  const msg = `Corvo acusou publicamente <b>${c.name}</b> — e errou. Na coletiva humilhante, deixou escapar letras do próprio nome: <b>${got.map(x => S.detName[x]).join(', ')}</b>.`;
  if (news) news.push({ t: msg, c: 'good' });
  S.lastAccuse = { name: c.name, letters: got };
  if (S.cred <= 0) return endGame('killer', 'cred');
}

// ═════════════════════════════ IA — ASSASSINA ═════════════════════════════
function aiKillerNight() {
  const k = killerC();
  if (S.letters.size >= 6) return { type: 'name' };
  if (S.sensed) return { type: 'skip' };
  const vis = visibleTargets(S.crims);
  const whisperBait = S.crims.bait && Math.random() < .4;
  const nats = vis.filter(t => t.kind === 'nat' && !(t.bait && whisperBait));
  const loc = vis.find(t => t.kind === 'loc');
  const slots = freeSlots(k);
  const mkKill = t => ({ type: 'kill', target: t, slot: pick(slots), delay: S.ink >= 2 && (Math.random() < .45 || S.interrogated.has(S.killer)) });
  if (S.letters.size >= 3 && S.ink >= 1 && Math.random() < .3) return { type: 'follow' };
  if (S.districtKnown != null && loc && Math.random() < .5) return mkKill(loc);
  if (nats.length) return mkKill(pick(nats));
  if (S.ink >= 1 && Math.random() < .5) return { type: 'follow' };
  if (loc && (S.districtKnown != null || Math.random() < .5)) return mkKill(loc);
  return { type: 'skip' };
}

// ═════════════════════════════ JOGADOR — ASSASSINA ═════════════════════════════
function renderKillerDusk() {
  const st = $('#stage'); st.innerHTML = ''; st.scrollTop = 0;
  hud('Dia');
  const k = killerC();
  st.appendChild(scene('killer', `Mais um dia fingindo ser só ${k.name}…`, { right: true }));
  const p = el('div', 'panel'); p.innerHTML = '<h3>Rumores do dia</h3>';
  const ul = el('ul', 'news');
  if (!S.dayNews.length) ul.appendChild(el('li', '', 'Corvo passou o dia trancado. Ninguém sabe o que ele tramou.'));
  S.dayNews.forEach(r => ul.appendChild(el('li', r.c || '', r.t)));
  p.appendChild(ul); st.appendChild(p);

  const p2 = el('div', 'panel');
  p2.innerHTML = `<h3>Você</h3><p>${k.name} · ${DIST_ICON[k.district]} ${DISTRICTS[k.district]}</p>
    <p>Livre às: <span class="gold">${freeSlots(k).map(s => SLOTS[s]).join(' · ')}</span></p>
    <p class="mt">Suspeitos na lista de Corvo: <b>${candidates().length}</b> de 12 ${S.interrogated.has(S.killer) ? '— <b>sua agenda está nas mãos dele</b>' : ''}</p>`;
  st.appendChild(p2);
  const b = el('button', 'btn btn-blood', 'Esperar a noite');
  b.onclick = () => { Audio.click(); endDay(); };
  st.appendChild(b);
}

function renderGrimoire() {
  const st = $('#stage'); st.innerHTML = ''; st.scrollTop = 0;
  hud('Noite');
  const k = killerC();
  const vis = visibleTargets(S.crims);

  if (S.sensed) {
    st.appendChild(scene('spirit', 'Hihi… sinto olhos sobre você esta noite. Alguém observa sua janela. Ou será só o vento?', { dark: true }));
    Audio.heart(); setTimeout(() => Audio.heart(), 900); vibrate([60, 120, 60]);
  } else if (S.crims.bait && S.crims.bait.baitDistrict === k.district && Math.random() < .4) {
    st.appendChild(scene('spirit', `Um dos rostos na TV hoje… cheira a tinta fresca. A mentira tem cheiro, sabia?`, { dark: true }));
  } else {
    st.appendChild(scene('spirit', pick(['As páginas estão famintas.', 'Quem será julgado esta noite?', 'Corvo também está acordado, sabia?', 'Hihi… adoro o som da pena.']), { dark: true }));
  }

  const g = el('div', 'grimoire');
  const page = el('div', 'grim-page');
  page.innerHTML = `<div class="grim-title">Liber Mortis</div><div class="grim-sub">rostos na televisão esta noite</div>`;
  const list = el('div', 'targets');
  vis.forEach(t => {
    const row = el('div', 'target');
    const tv = el('div', 'tv'); tv.appendChild(makePortrait(t.look, 3)); row.appendChild(tv);
    row.appendChild(el('div', 'info', `<div class="nm">${t.name}</div><div class="cr">${t.crime}</div>`));
    row.appendChild(el('span', 'tag ' + (t.kind === 'nat' ? 'nat' : 'loc'), t.kind === 'nat' ? 'Nacional' : 'Local · ' + DISTRICTS[k.district]));
    row.onclick = () => { Audio.click(); chooseSlot(t); };
    list.appendChild(row);
  });
  if (!vis.length) list.appendChild(el('p', 'hint', 'Nenhum rosto esta noite.'));
  page.appendChild(list);
  g.appendChild(page); st.appendChild(g);

  // Página do nome do detetive
  const g2 = el('div', 'grimoire');
  const p2 = el('div', 'grim-page');
  p2.style.minHeight = '0';
  p2.innerHTML = `<div class="grim-sub">o nome verdadeiro de Corvo</div>`;
  const nm = el('div', 'det-name');
  for (let i = 0; i < 6; i++) nm.appendChild(el('span', '', S.letters.has(i) ? S.detName[i] : ''));
  p2.appendChild(nm);
  g2.appendChild(p2); st.appendChild(g2);

  const acts = el('div', 'row');
  if (S.letters.size >= 6) {
    const bn = el('button', 'btn btn-blood', `Escrever <b>${S.detName}</b>`);
    bn.onclick = () => traceName(S.detName, () => resolveNight({ type: 'name' }), true);
    st.appendChild(bn);
  }
  const bf = el('button', 'btn btn-sm btn-ash', 'Seguir Corvo<small>1 tinta · aprende 1 letra</small>');
  if (S.ink < 1 || S.letters.size >= 6) bf.disabled = true;
  bf.onclick = () => { Audio.click(); confirmSheet('Seguir Corvo esta noite?', 'Você não escreverá nenhum nome. Se estiver sendo vigiada, será pega. Corvo pode perceber o horário em que você o seguiu.', () => resolveNight({ type: 'follow' })); };
  const bs = el('button', 'btn btn-sm btn-ghost', 'Fechar o livro<small>não fazer nada</small>');
  bs.onclick = () => { Audio.click(); confirmSheet('Passar a noite em silêncio?', 'Se Corvo estiver vigiando alguém, uma noite sem mortes chamará atenção para essa pessoa.', () => resolveNight({ type: 'skip' })); };
  acts.append(bf, bs); acts.classList.add('mt');
  st.appendChild(acts);
}

function confirmSheet(title, text, yes) {
  openSheet(c => {
    c.appendChild(el('h3', '', title));
    c.appendChild(el('p', 'muted', text));
    const r = el('div', 'row mt');
    const a = el('button', 'btn btn-blood', 'Sim'); a.onclick = () => { closeSheet(); yes(); };
    const b = el('button', 'btn btn-ghost', 'Não'); b.onclick = closeSheet;
    r.append(a, b); c.appendChild(r);
  });
}

function chooseSlot(target) {
  const k = killerC();
  let slot = null, delay = false;
  openSheet(c => {
    c.appendChild(el('h3', '', `Julgar ${target.name}`));
    c.appendChild(el('p', 'muted', 'Escolha a hora em que vai escrever. Só nas horas em que está sozinha.'));
    const clock = el('div', 'clock');
    SLOTS.forEach((s, i) => {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const b = el('button', 'slot ' + (k.busy.has(i) ? 'busy' : 'free'), `${s}<small>${k.busy.has(i) ? 'ocupada' : SLOT_DESC[i]}</small>`);
      b.style.left = (50 + Math.cos(a) * 37) + '%'; b.style.top = (50 + Math.sin(a) * 37) + '%';
      if (S.killSlots.includes(i)) b.innerHTML += '';
      b.onclick = () => { Audio.click(); slot = i; clock.querySelectorAll('.slot').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); upd(); };
      clock.appendChild(b);
    });
    c.appendChild(clock);
    const tg = el('div', 'toggle mt', `<div class="box"></div><div class="t"><b>Morte tardia</b> (+1 tinta)<br><span class="muted">A morte acontece em outra hora: Corvo não saberá quando você escreveu.</span></div>`);
    tg.onclick = () => { if (S.ink < 2) { toast('Tinta insuficiente'); return; } delay = !delay; tg.classList.toggle('on', delay); upd(); };
    c.appendChild(tg);
    const warn = el('p', 'hint'); warn.style.color = '#ffb0bc'; c.appendChild(warn);
    const go = el('button', 'btn btn-blood', 'Pegar a pena');
    const upd = () => {
      go.disabled = slot == null || S.ink < 1;
      const known = S.killSlots;
      warn.textContent = slot == null ? '' : delay ? 'A hora ficará oculta.' : known.includes(slot) ? `Corvo já conhece o horário ${SLOTS[slot]}: repetir não revela nada novo.` : `Novo horário ${SLOTS[slot]}: quem estiver ocupado nele será descartado por Corvo.`;
    };
    upd();
    go.onclick = () => { closeSheet(); traceName(target.name, () => resolveNight({ type: 'kill', target, slot, delay })); };
    c.appendChild(go);
  });
}

// ── Mecânica de traçar o nome com o dedo ──
function traceName(name, done, final) {
  const st = $('#stage'); st.innerHTML = ''; st.scrollTop = 0;
  hud('Noite');
  st.appendChild(scene('spirit', final ? 'O nome dele… escreva devagar. Saboreie.' : `Trace cada letra de <b>${name}</b>. Sem tremer.`, { dark: true }));
  const g = el('div', 'grimoire');
  const page = el('div', 'grim-page');
  const wrap = el('div', 'trace-wrap');
  const cv = document.createElement('canvas');
  wrap.appendChild(cv); page.appendChild(wrap);
  const bar = el('div', 'trace-bar', '<div></div>'); page.appendChild(bar);
  page.appendChild(el('div', 'hint', 'Passe o dedo sobre as letras fantasmas'));
  g.appendChild(page); st.appendChild(g);
  const cancel = el('button', 'btn btn-ghost btn-sm', 'Desistir');
  cancel.onclick = () => renderGrimoire();
  st.appendChild(cancel);

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = wrap.clientWidth, words = name.split(' ');
  const lineH = 92, H = lineH * words.length + 20;
  cv.width = W * dpr; cv.height = H * dpr; cv.style.height = H + 'px';
  const ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);

  // texto-guia
  const ghost = document.createElement('canvas'); ghost.width = W; ghost.height = H;
  const gx = ghost.getContext('2d');
  let fs = 70;
  gx.font = `${fs}px UnifrakturMaguntia, serif`;
  const widest = Math.max(...words.map(w => gx.measureText(w).width));
  if (widest > W - 20) fs = Math.floor(fs * (W - 20) / widest);
  gx.font = `${fs}px UnifrakturMaguntia, serif`;
  gx.textAlign = 'center'; gx.textBaseline = 'middle'; gx.fillStyle = '#000';
  words.forEach((w, i) => gx.fillText(w, W / 2, 10 + lineH * i + lineH / 2));
  const data = gx.getImageData(0, 0, W, H).data;
  const pts = [];
  for (let y = 0; y < H; y += 5) for (let x = 0; x < W; x += 5) if (data[(y * W + x) * 4 + 3] > 140) pts.push({ x, y, hit: false });
  const drawGhost = () => {
    ctx.clearRect(0, 0, W, H);
    ctx.font = gx.font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(90,40,30,.22)';
    words.forEach((w, i) => ctx.fillText(w, W / 2, 10 + lineH * i + lineH / 2));
  };
  drawGhost();

  let last = null, hits = 0, finished = false;
  const R = 15;
  const pos = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const mark = p => {
    for (const q of pts) if (!q.hit && (q.x - p.x) ** 2 + (q.y - p.y) ** 2 < R * R) { q.hit = true; hits++; }
  };
  const stroke = (a, b) => {
    ctx.strokeStyle = '#120406'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(163,18,44,.8)'; ctx.shadowBlur = 4;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    ctx.shadowBlur = 0;
    const d = Math.hypot(b.x - a.x, b.y - a.y), steps = Math.ceil(d / 6);
    for (let i = 0; i <= steps; i++) mark({ x: a.x + (b.x - a.x) * i / steps, y: a.y + (b.y - a.y) * i / steps });
    Audio.scratch(Math.min(.35, d / 40));
    if (Math.random() < .05) { ctx.fillStyle = 'rgba(120,0,16,.7)'; ctx.beginPath(); ctx.arc(b.x + rnd(9) - 4, b.y + rnd(9) - 4, 1 + Math.random() * 2.5, 0, 7); ctx.fill(); }
  };
  const progress = () => {
    const pr = hits / pts.length; bar.firstChild.style.width = Math.min(100, pr / .78 * 100) + '%';
    if (pr >= .78 && !finished) {
      finished = true; Audio.scratch(0);
      Audio.sting(); flash(); shake(); vibrate([40, 60, 200]);
      setTimeout(done, 900);
    }
  };
  cv.addEventListener('pointerdown', e => { if (finished) return; cv.setPointerCapture(e.pointerId); last = pos(e); mark(last); e.preventDefault(); });
  cv.addEventListener('pointermove', e => { if (!last || finished) return; const p = pos(e); stroke(last, p); last = p; progress(); e.preventDefault(); });
  const up = () => { last = null; Audio.scratch(0); };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
}

// ═════════════════════════════ JOGADOR — DETETIVE ═════════════════════════════
function renderBoard() {
  const st = $('#stage'); st.innerHTML = '';
  hud('Dia');
  const cands = candidates();
  const head = el('div', 'board-head');
  head.innerHTML = `<span class="chip">Horas das mortes: <b>${S.killSlots.length ? S.killSlots.map(s => SLOTS[s]).join(' ') : '—'}</b></span>
    <span class="chip">Bairro: <b>${S.districtKnown != null ? DIST_ICON[S.districtKnown] + ' ' + DISTRICTS[S.districtKnown] : '?'}</b></span>
    <span class="chip">Possíveis: <b>${cands.length}</b></span>`;
  st.appendChild(head);

  const board = el('div', 'board');
  S.citizens.forEach((c, i) => {
    const card = el('div', 'card');
    card.style.setProperty('--rot', ((i * 37) % 7 - 3) * .6 + 'deg');
    if (!consistent(i)) card.classList.add('cleared');
    else if (S.marked.has(i)) card.classList.add('marked');
    if (S.watched === i) card.classList.add('watched');
    card.appendChild(makePortrait(c.look, 4));
    card.appendChild(el('div', 'cn', c.name));
    card.appendChild(el('div', 'cd', `${DIST_ICON[c.district]} ${DISTRICTS[c.district]}`));
    const sc = el('div', 'sched');
    SLOTS.forEach((_, s) => {
      const sp = el('span');
      if (S.interrogated.has(i)) sp.className = c.busy.has(s) ? 'busy' : 'free';
      if (S.killSlots.includes(s)) sp.classList.add('kill');
      sc.appendChild(sp);
    });
    card.appendChild(sc);
    card.onclick = () => { Audio.click(); citizenSheet(i); };
    board.appendChild(card);
  });
  st.appendChild(board);
  st.appendChild(el('div', 'legend', `<span><i style="background:#2a2030"></i>ocupado</span><span><i style="background:#f4ecd8;outline:1px solid #9a8a6a"></i>livre</span><span><i style="background:#b8ab8c"></i>desconhecido</span><span><i style="background:#b8ab8c;box-shadow:inset 0 -3px 0 #a3122c"></i>hora de morte</span>`));

  const bar = el('div', 'actions-bar');
  const bb = el('button', 'btn btn-sm btn-ash', 'Isca<small>2 PA</small>');
  if (S.ap < 2 || S.bait != null) bb.disabled = true;
  bb.onclick = () => { Audio.click(); baitSheet(); };
  const bl = el('button', 'btn btn-sm btn-ghost', 'Pistas<small>registro</small>');
  bl.onclick = () => { Audio.click(); cluesSheet(); };
  const be = el('button', 'btn btn-sm btn-blood', 'Fim do dia<small>' + (S.ap ? S.ap + ' PA sobrando' : 'noite') + '</small>');
  be.onclick = () => { Audio.click(); endDay(); };
  bar.append(bb, bl, be);
  st.appendChild(bar);
}

function citizenSheet(i) {
  const c = S.citizens[i];
  openSheet(box => {
    const top = el('div', 'sheet-top');
    top.appendChild(makePortrait(c.look, 6));
    top.appendChild(el('div', '', `<h3>${c.name}</h3><div class="muted">${c.job} · ${DIST_ICON[c.district]} ${DISTRICTS[c.district]}</div>
      <div>${!consistent(i) ? '<span class="gold">Descartado(a) pelas evidências</span>' : S.watched === i ? '<span class="gold">Sob vigilância esta noite</span>' : ''}</div>`));
    box.appendChild(top);
    const sch = el('div', 'big-sched');
    SLOTS.forEach((s, k) => {
      const known = S.interrogated.has(i);
      sch.appendChild(el('div', known ? (c.busy.has(k) ? 'busy' : 'free') : 'unk', `${s}<br>${known ? (c.busy.has(k) ? 'ocupado' : 'sozinho') : '?'}`));
    });
    box.appendChild(sch);
    if (S.interrogated.has(i)) box.appendChild(el('p', 'muted', `"${pick(['Eu? Eu estava trabalhando, como sempre.', 'Pergunte a quem quiser. Minha rotina é um relógio.', 'Que olhar é esse, detetive?', 'Durmo cedo. A cidade à noite me assusta.'])}"`));

    const r = el('div', 'row');
    const bi = el('button', 'btn btn-sm btn-ash', 'Interrogar<small>1 PA · revela agenda</small>');
    if (S.ap < 1 || S.interrogated.has(i)) bi.disabled = true;
    bi.onclick = () => {
      S.ap--; interrogate(i, null); Audio.heart();
      renderBoard(); citizenSheet(i);
      toast(`${c.name} respondeu às perguntas… e viu seu rosto.`);
    };
    const bw = el('button', 'btn btn-sm btn-ash', 'Vigiar<small>1 PA · esta noite</small>');
    if (S.ap < 1 || S.watched != null || !consistent(i)) bw.disabled = true;
    bw.onclick = () => { S.ap--; S.watched = i; Audio.click(); closeSheet(); renderBoard(); toast(`Seus homens vigiarão ${c.name} esta noite.`); };
    r.append(bi, bw); box.appendChild(r);

    const bm = el('button', 'btn btn-sm btn-ghost', S.marked.has(i) ? 'Remover marcação ✕' : 'Marcar como improvável ✕');
    bm.onclick = () => { S.marked.has(i) ? S.marked.delete(i) : S.marked.add(i); closeSheet(); renderBoard(); };
    box.appendChild(bm);

    const ba = el('button', 'btn btn-blood hold', `<span class="fill"></span>Segure para ACUSAR`);
    if (!consistent(i)) ba.disabled = true;
    holdButton(ba, 1400, () => {
      closeSheet();
      if (i === S.killer) { endGame('detective', 'accuse'); return; }
      const before = S.letters.size;
      accuse(i, null);
      if (S.over) return;
      flash(); shake(); Audio.lose();
      renderBoard();
      openSheet(b2 => {
        b2.appendChild(scene('detective', `${c.name} era inocente… A imprensa está em cima de mim. E na confusão, gritaram parte do meu nome.`));
        b2.appendChild(el('p', 'muted', `Credibilidade: ${S.cred}/2. A Sentença agora conhece ${S.letters.size - before >= 0 ? 'mais letras' : ''} do seu nome.`));
        const ok = el('button', 'btn btn-ash', 'Continuar'); ok.onclick = closeSheet; b2.appendChild(ok);
      });
    });
    box.appendChild(ba);
  });
}

function holdButton(btn, ms, cb) {
  let t0 = 0, raf = 0;
  const fill = btn.querySelector('.fill');
  const step = () => {
    const p = (performance.now() - t0) / ms;
    fill.style.width = Math.min(100, p * 100) + '%';
    if (p >= 1) { stop(); cb(); return; }
    if (Math.floor(p * 6) !== Math.floor((p - .02) * 6)) { Audio.heart(); vibrate(20); }
    raf = requestAnimationFrame(step);
  };
  const start = e => { e.preventDefault(); t0 = performance.now(); raf = requestAnimationFrame(step); };
  const stop = () => { cancelAnimationFrame(raf); fill.style.width = '0'; };
  btn.addEventListener('pointerdown', start);
  btn.addEventListener('pointerup', stop); btn.addEventListener('pointerleave', stop); btn.addEventListener('pointercancel', stop);
  btn.addEventListener('contextmenu', e => e.preventDefault());
}

function baitSheet() {
  openSheet(c => {
    c.appendChild(el('h3', '', 'Plantar uma isca'));
    c.appendChild(el('p', 'muted', 'Um criminoso inventado aparecerá como "nacional" — mas só na TV de um bairro. Se a Sentença o julgar, saberemos onde ela mora.'));
    const cnt = [0, 0, 0, 0]; candidates().forEach(i => cnt[S.citizens[i].district]++);
    DISTRICTS.forEach((d, i) => {
      const b = el('button', 'btn btn-sm btn-ash', `${DIST_ICON[i]} ${d}<small>${cnt[i]} suspeito(s) possíveis</small>`);
      if (!cnt[i]) b.disabled = true;
      b.onclick = () => { S.bait = i; S.ap -= 2; closeSheet(); renderBoard(); toast(`Isca exibida na TV de ${d}.`); };
      c.appendChild(b);
    });
    const x = el('button', 'btn btn-ghost btn-sm', 'Cancelar'); x.onclick = closeSheet; c.appendChild(x);
  });
}

function cluesSheet() {
  openSheet(c => {
    c.appendChild(el('h3', '', 'Registro de pistas'));
    if (!S.clues.length) c.appendChild(el('p', 'muted', 'Nenhuma pista ainda. A primeira noite dirá algo.'));
    const ul = el('ul', 'news');
    S.clues.slice().reverse().forEach(r => ul.appendChild(el('li', r.c || '', `<span class="muted">Noite ${r.day}:</span> ${r.t}`)));
    c.appendChild(ul);
    c.appendChild(el('p', 'muted mt', 'Lembre: a assassina só escreve quando está sozinha. Quem estava ocupado na hora de uma morte é inocente. Mortes "tardias" não revelam a hora.'));
    const x = el('button', 'btn btn-ghost btn-sm', 'Fechar'); x.onclick = closeSheet; c.appendChild(x);
  });
}

// ═════════════════════════════ FIM ═════════════════════════════
function endGame(winner, reason) {
  S.over = true; closeSheet();
  const k = killerC();
  const playerWon = winner === S.role;
  const T = {
    caught: ['Flagrante', `Os homens de Corvo arrombaram a janela de <b>${k.name}</b> com a pena ainda molhada. O grimório foi selado em ferro.`],
    accuse: ['Xeque-mate', `Corvo apontou para <b>${k.name}</b>. As provas fecharam o cerco: as horas, o bairro, o silêncio. A Sentença foi julgada.`],
    name: ['O Nome', `Seis letras. <b>${S.detName}</b>. Corvo levou a mão ao peito no meio da praça e caiu. Ninguém em Vel Noctis ousa mais investigar.`],
    judg: ['O Novo Mundo', `Sete julgamentos. O crime em Vel Noctis cessou por medo. <b>${k.name}</b> sorri na missa de domingo, intocável.`],
    cred: ['Descrédito', `Duas acusações falsas. Corvo foi afastado do caso, e a cidade passou a idolatrar A Sentença. Ela era <b>${k.name}</b>.`],
    time: ['A Cidade se Curvou', `Doze dias e Corvo não chegou a um nome. A Sentença — <b>${k.name}</b> — continua escrevendo.`]
  }[reason];
  setTimeout(() => {
    show('scr-end');
    $('#end-title').textContent = playerWon ? (S.role === 'killer' ? 'Vitória da Sentença' : 'Caso Encerrado') : 'Derrota';
    $('#end-text').innerHTML = `<i>${T[0]}.</i> ${T[1]}`;
    const art = $('#end-art'); art.innerHTML = '<div class="speed-lines"></div>';
    const det = makeSprite('detective', 5), kil = makeSprite('killer', 5), sp = makeSprite('spirit', 4);
    if (winner === 'killer') { det.classList.add('fallen'); art.append(kil, sp, det); sp.style.width = '100px'; sp.style.alignSelf = 'flex-start'; }
    else { kil.classList.add('fallen'); art.append(det, kil); }
    playerWon ? Audio.win() : Audio.lose();
    flash();
  }, 500);
}

// ═════════════════════════════ INICIALIZAÇÃO ═════════════════════════════
(function init() {
  $('.duo-det').appendChild(makeSprite('detective', 4));
  $('.duo-kil').appendChild(makeSprite('killer', 4, { flip: true }));
  const em = $('.embers');
  for (let i = 0; i < 26; i++) {
    const e = el('i');
    e.style.left = Math.random() * 100 + '%';
    e.style.setProperty('--dx', (Math.random() * 80 - 40) + 'px');
    e.style.animationDuration = (6 + Math.random() * 8) + 's';
    e.style.animationDelay = (-Math.random() * 12) + 's';
    em.appendChild(e);
  }
  document.querySelectorAll('[data-role]').forEach(b => b.onclick = () => { Audio.init(); Audio.click(); newGame(b.dataset.role); });
  document.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { Audio.click(); show(b.dataset.go); });
  $('#btn-howto').onclick = () => { Audio.init(); Audio.click(); show('scr-howto'); };
  $('#btn-again').onclick = () => { Audio.click(); newGame(S.role); };
  document.addEventListener('pointerdown', () => Audio.init(), { once: true });
})();
