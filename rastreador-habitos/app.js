'use strict';

/* ================= Constantes ================= */
const STORE_KEY = 'rastreador-habitos:v1';
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const DS_LONG = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const PALETTE = ['#B5413F', '#4A6B8F', '#A88A3A', '#5E7D4F', '#7A5C93', '#8B5A4A', '#3E8A8A', '#C26A2E'];
const ACCENTS = [
  ['Carmesim', '#8E1B1B'], ['Marinho', '#1F4E79'], ['Floresta', '#2F5D3A'],
  ['Arcano', '#5B2C6F'], ['Âmbar', '#9A5A0F'], ['Grafite', '#3A3A3A'],
];
const TITLES = {
  hoje: 'Rastreador de Hábitos', mes: 'Hábitos do Mês', progresso: 'Gráfico de Hábitos',
  evolucao: 'Mapa de Evolução', ajustes: 'Ajustes',
};
const MAX_PILLARS = 8, MIN_PILLARS = 3;

/* ================= Utilidades ================= */
const $ = (s, el = document) => el.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 9);
const pad = n => String(n).padStart(2, '0');
const mkey = (y, m) => `${y}-${pad(m + 1)}`;
const parseKey = k => { const [y, m] = k.split('-').map(Number); return { y, m: m - 1 }; };
const daysIn = k => { const { y, m } = parseKey(k); return new Date(y, m + 1, 0).getDate(); };
const shiftKey = (k, n) => { const { y, m } = parseKey(k); const d = new Date(y, m + n, 1); return mkey(d.getFullYear(), d.getMonth()); };
const weekday = (k, d) => { const { y, m } = parseKey(k); return new Date(y, m, d).getDay(); };
const today = () => { const d = new Date(); return { key: mkey(d.getFullYear(), d.getMonth()), day: d.getDate() }; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmt1 = v => (Math.round(v * 10) / 10).toFixed(1);
const listPt = arr => arr.length <= 1 ? (arr[0] || '') : arr.slice(0, -1).join(', ') + ' e ' + arr[arr.length - 1];
const monthName = k => { const { y, m } = parseKey(k); return `${MESES[m]} ${y}`; };
const vibrate = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { /* sem vibração */ } };

/* ================= Modelo de dados ================= */
function defaultTemplate() {
  const pil = [
    ['Treino', 12], ['Leitura', 20], ['Comer saudável', 25], ['Sono', 24], ['Estudo', 20], ['Renda extra', 12],
  ].map(([name, meta], i) => ({ id: uid(), name, meta, color: PALETTE[i], manual: 0 }));
  const P = pil.map(p => p.id);
  const hab = [
    ['Treino', 0], ['Leitura', 1], ['Beber 2L de água', -1], ['Comer saudável', 2],
    ['Dormir cedo', 3], ['Estudo', 4], ['Caminhada', 0], ['Renda extra', 5],
  ].map(([name, pi], i) => ({ id: uid(), name, color: PALETTE[pi >= 0 ? pi : 6], pillarId: pi >= 0 ? P[pi] : '' }));
  return {
    habits: hab,
    pillars: pil,
    rewards: [
      { id: uid(), at: 20, text: 'Escreva aqui o prêmio que deseja coletar' },
      { id: uid(), at: 40, text: 'Escreva aqui o prêmio que deseja coletar' },
      { id: uid(), at: 60, text: 'Escreva aqui o prêmio que deseja coletar' },
    ],
    checks: {},
    reflection: '',
  };
}

function cloneStructure(src) {
  const c = JSON.parse(JSON.stringify(src));
  return { habits: c.habits, pillars: c.pillars.map(p => ({ ...p, manual: 0 })), rewards: c.rewards, checks: {}, reflection: '' };
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) { const s = JSON.parse(raw); if (s && s.months) return s; }
  } catch (e) { /* armazenamento indisponível */ }
  return { version: 1, settings: { theme: 'auto', accent: '#8E1B1B', compare: true }, months: {} };
}
let state = load();
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { toast('Não foi possível salvar neste navegador.'); } }

/** Retorna o mês; se não existir, cria herdando a estrutura do mês anterior mais próximo. */
function month(key) {
  if (state.months[key]) return state.months[key];
  const keys = Object.keys(state.months).sort();
  const before = keys.filter(k => k < key).pop();
  const after = keys.find(k => k > key);
  const src = state.months[before || after];
  state.months[key] = src ? cloneStructure(src) : defaultTemplate();
  return state.months[key];
}

const isDone = (m, hid, d) => !!(m.checks[hid] && m.checks[hid][d]);
const dayCount = (m, d) => m.habits.reduce((a, h) => a + (isDone(m, h.id, d) ? 1 : 0), 0);
const habitCount = (m, hid, key) => { const n = daysIn(key); const c = m.checks[hid] || {}; return Object.keys(c).filter(d => c[d] && +d <= n).length; };
const monthTotal = (m, key) => m.habits.reduce((a, h) => a + habitCount(m, h.id, key), 0);
const lastDay = key => { const t = today(); if (key === t.key) return t.day; if (key < t.key) return daysIn(key); return 0; };
const ladderMax = m => Math.max(10, ...m.rewards.map(r => +r.at || 0));
const isFuture = (key, d) => { const t = today(); return key > t.key || (key === t.key && d > t.day); };

function pillarDone(m, p, key) {
  const linked = m.habits.filter(h => h.pillarId === p.id);
  if (!linked.length) return { done: +p.manual || 0, auto: false, n: 0 };
  return { done: linked.reduce((a, h) => a + habitCount(m, h.id, key), 0), auto: true, n: linked.length };
}
const pillarLevel = (done, meta) => meta > 0 ? clamp(done / meta * 10, 0, 10) : 0;

function streak(hid, key, day) {
  const { y, m } = parseKey(key);
  const d = new Date(y, m, day);
  const done = dt => { const mo = state.months[mkey(dt.getFullYear(), dt.getMonth())]; return !!(mo && mo.checks[hid] && mo.checks[hid][dt.getDate()]); };
  if (!done(d)) d.setDate(d.getDate() - 1);
  let n = 0;
  while (n < 2000 && done(d)) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

/* ================= Estado de interface ================= */
const ui = { tab: 'hoje', key: today().key, day: today().day, scrolledGrid: false };
try {
  const saved = JSON.parse(sessionStorage.getItem('rh-ui') || 'null');
  if (saved && saved.tab) ui.tab = saved.tab;
} catch (e) { /* ignore */ }

function defaultDay(key) { const t = today(); if (key === t.key) return t.day; if (key < t.key) return daysIn(key); return 1; }
function setMonth(key) { ui.key = key; ui.day = defaultDay(key); ui.scrolledGrid = false; render(); }

/* ================= Tema ================= */
function applyTheme() {
  const s = state.settings;
  const dark = s.theme === 'dark' || (s.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.style.setProperty('--accent-base', s.accent);
  $('meta[name="theme-color"]').setAttribute('content', dark ? '#171412' : s.accent);
}
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => state.settings.theme === 'auto' && applyTheme());

/* ================= Toast ================= */
let toastTimer;
function toast(msg, reward = false) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast show' + (reward ? ' reward' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.className = 'toast' + (reward ? ' reward' : ''); }, reward ? 3200 : 2200);
}

/* ================= Ações ================= */
function toggle(hid, d) {
  const key = ui.key, m = month(key);
  if (isFuture(key, d)) { toast('Esse dia ainda não chegou.'); return; }
  const before = monthTotal(m, key);
  m.checks[hid] = m.checks[hid] || {};
  if (m.checks[hid][d]) delete m.checks[hid][d]; else m.checks[hid][d] = 1;
  const after = monthTotal(m, key);
  save();
  vibrate(after > before ? 12 : 6);
  const hit = m.rewards.filter(r => before < r.at && after >= r.at).sort((a, b) => b.at - a.at)[0];
  if (hit) { vibrate([30, 60, 30, 60, 80]); toast(`🎁 Recompensa desbloqueada: ${hit.text}`, true); }
  render();
}

/* ================= Views ================= */
const checkSvg = '<svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

function ringSvg(done, total, sub) {
  const r = 36, c = 2 * Math.PI * r, f = total ? done / total : 0;
  return `<svg class="ring" viewBox="0 0 84 84"><circle class="bg" cx="42" cy="42" r="${r}"/>
    <circle class="fg" cx="42" cy="42" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - f)}" transform="rotate(-90 42 42)"/>
    <text x="42" y="44" text-anchor="middle">${done}/${total}</text><text class="sub" x="42" y="58" text-anchor="middle">${esc(sub)}</text></svg>`;
}

function nextRewardLine(m, total) {
  const next = [...m.rewards].sort((a, b) => a.at - b.at).find(r => total < r.at);
  const max = ladderMax(m);
  const pct = clamp(total / max * 100, 0, 100);
  return `<div style="margin-top:6px">Escada de recompensas: <b>${total}/${max}</b>
    <div class="bar"><i style="width:${pct}%"></i></div>
    <div class="muted" style="font-size:12.5px;margin-top:4px">${next ? `Faltam <b>${next.at - total}</b> para: ${esc(next.text)}` : 'Todas as recompensas do mês desbloqueadas! 🏆'}</div></div>`;
}

function viewHoje(m) {
  const key = ui.key, n = daysIn(key), t = today();
  ui.day = clamp(ui.day, 1, n);
  const d = ui.day, total = monthTotal(m, key), cnt = dayCount(m, d), H = m.habits.length || 1;
  const pillarName = id => (m.pillars.find(p => p.id === id) || {}).name;
  let strip = '';
  for (let i = 1; i <= n; i++) {
    const c = dayCount(m, i);
    strip += `<button class="day${i === d ? ' sel' : ''}${key === t.key && i === t.day ? ' today' : ''}" data-act="day" data-d="${i}" ${isFuture(key, i) ? 'disabled' : ''}>
      <span class="wd">${DS_LONG[weekday(key, i)]}</span><span class="n">${i}</span><span class="pip"><i style="width:${c / H * 100}%"></i></span></button>`;
  }
  const isToday = key === t.key && d === t.day;
  const cards = m.habits.map(h => {
    const done = isDone(m, h.id, d), s = streak(h.id, key, d), pn = pillarName(h.pillarId);
    return `<button class="habit${done ? ' done' : ''}" style="--c:${h.color}" data-act="toggle" data-h="${h.id}" data-d="${d}" aria-pressed="${done}">
      <span class="info"><span class="name">${esc(h.name)}</span>
      <span class="meta">${pn ? esc(pn) + ' · ' : ''}${habitCount(m, h.id, key)}× no mês${s > 1 ? ` · 🔥 ${s} dias seguidos` : ''}</span></span>
      <span class="check">${checkSvg}</span></button>`;
  }).join('');
  return `
    <div class="panel"><span class="tag">${isToday ? 'Hoje' : `Dia ${d}`} · ${DS_LONG[weekday(key, d)]}</span>
      <div class="summary">${ringSvg(cnt, m.habits.length, 'hábitos')}
        <div class="summary-txt">${cnt === m.habits.length && cnt > 0 ? '<b>Dia completo!</b> ⚔️' : `Você concluiu <b>${cnt}</b> de ${m.habits.length} hábitos neste dia.`}
        ${nextRewardLine(m, total)}</div></div>
    </div>
    <div class="section"><div class="days" id="days">${strip}</div></div>
    <div class="habits">${cards || `<div class="empty">Nenhum hábito ainda.<br><br><button class="btn" data-act="goto" data-tab="ajustes">Adicionar hábitos</button></div>`}</div>
    <p class="footnote">Missão do mês: progresso visível, recompensa conquistada.</p>`;
}

function viewMes(m) {
  const key = ui.key, n = daysIn(key), t = today();
  let head = '<th class="hcol">Hábito</th>';
  for (let i = 1; i <= n; i++) head += `<th class="${key === t.key && i === t.day ? 'today' : ''}">${i}<small>${DS[weekday(key, i)]}</small></th>`;
  const rows = m.habits.map(h => {
    let r = `<th class="hcol" style="--c:${h.color}" title="${esc(h.name)}">${esc(h.name)}</th>`;
    for (let i = 1; i <= n; i++) {
      const wd = weekday(key, i);
      r += `<td class="${isFuture(key, i) ? 'future' : ''}${wd === 0 || wd === 6 ? ' weekend' : ''}"><button data-act="toggle" data-h="${h.id}" data-d="${i}" aria-label="${esc(h.name)} dia ${i}">${isDone(m, h.id, i) ? checkSvg : ''}</button></td>`;
    }
    return `<tr>${r}</tr>`;
  }).join('');
  let foot = '<td class="hcol">Total do dia</td>';
  for (let i = 1; i <= n; i++) { const c = dayCount(m, i); foot += `<td>${c || ''}</td>`; }
  const best = m.habits.map(h => [h.name, habitCount(m, h.id, key)]).sort((a, b) => b[1] - a[1]);
  return `
    <div class="panel"><span class="tag">Hábitos do mês</span>
      <p class="hint">Toque em um quadrado para marcar ✓. Deslize para os lados para ver todos os dias.</p>
      <div class="grid-wrap"><div class="grid-scroll" id="gridScroll"><table class="grid">
        <thead><tr>${head}</tr></thead><tbody>${rows}</tbody><tfoot><tr>${foot}</tr></tfoot></table></div></div>
      <div class="legend-row"><span>Total no mês: <b style="color:var(--accent)">${monthTotal(m, key)}</b></span>
        <span>${best[0] && best[0][1] ? `Destaque: <b>${esc(best[0][0])}</b> (${best[0][1]}×)` : ''}</span></div>
    </div>
    <div class="panel"><span class="tag">Por hábito</span>
      ${m.habits.map(h => { const c = habitCount(m, h.id, key), ld = lastDay(key) || n; return `
        <div style="margin:10px 0"><div style="display:flex;justify-content:space-between;font-size:14px"><b>${esc(h.name)}</b><span class="muted">${c}/${ld} dias · ${Math.round(c / ld * 100)}%</span></div>
        <div class="bar"><i style="width:${clamp(c / ld * 100, 0, 100)}%;background:${h.color}"></i></div></div>`; }).join('')}
    </div>`;
}

function lineChart(m, key) {
  const n = daysIn(key), last = lastDay(key), H = Math.max(1, m.habits.length);
  const W = 360, Ht = 230, L = 26, R = 8, T = 10, B = 34;
  const x = d => L + (d - 1) * (W - L - R) / (n - 1), y = v => T + (Ht - T - B) * (1 - v / H);
  let g = '';
  for (let v = 0; v <= H; v++) g += `<line class="gl" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="lbl" x="${L - 7}" y="${y(v) + 3}" text-anchor="end">${v}</text>`;
  for (let d = 1; d <= n; d++) {
    g += `<line class="gl" x1="${x(d)}" x2="${x(d)}" y1="${T}" y2="${y(0)}"/>`;
    if (d % 2 === 1 || n < 20) g += `<text class="lbl" x="${x(d)}" y="${y(0) + 11}" text-anchor="middle">${d}</text>`;
  }
  g += `<line class="ax" x1="${L}" x2="${L}" y1="${T - 4}" y2="${y(0)}"/><line class="ax" x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}"/>`;
  const pts = [];
  for (let d = 1; d <= last; d++) pts.push([x(d), y(dayCount(m, d))]);
  if (pts.length) {
    g += `<polyline class="line" points="${pts.map(p => p.join(',')).join(' ')}"/>`;
    g += pts.map(p => `<circle class="pt" cx="${p[0]}" cy="${p[1]}" r="2.8"/>`).join('');
  }
  g += `<text class="axis-title" x="${(L + W - R) / 2}" y="${Ht - 4}" text-anchor="middle">DIAS DO MÊS</text>`;
  g += `<text class="axis-title" transform="translate(7 ${(T + y(0)) / 2}) rotate(-90)" text-anchor="middle">HÁBITOS FEITOS</text>`;
  return `<svg class="chart" viewBox="0 0 ${W} ${Ht}" role="img" aria-label="Gráfico de hábitos feitos por dia">${g}</svg>`;
}

function ladder(m, total) {
  const max = ladderMax(m);
  const h = clamp(Math.floor(560 / max), 5, 14);
  const marks = new Set(m.rewards.map(r => +r.at));
  let rungs = '';
  for (let i = 1; i <= max; i++) {
    const showNum = h >= 9 || i % 5 === 0 || i === 1 || marks.has(i);
    rungs += `<div class="rung${i <= total ? ' on' : ''}${marks.has(i) ? ' mark' : ''}${i === total ? ' now' : ''}"><span class="num">${showNum ? i : ''}</span><span class="blk" style="height:${h}px"></span></div>`;
  }
  const full = max * h;
  const sorted = [...m.rewards].sort((a, b) => b.at - a.at);
  const CARD = 62, GAP = 8;
  let prevTop = -Infinity;
  const cards = sorted.map(r => {
    let top = full - r.at * h - CARD / 2 + h / 2;
    top = Math.max(top, prevTop + CARD + GAP, 0);
    prevTop = top;
    const on = total >= r.at;
    return `<div class="reward${on ? ' on' : ''}" style="top:${top}px;min-height:${CARD}px">
      <h4>Recompensa · Marco ${r.at}</h4><p>${esc(r.text)}</p><span class="st">${on ? '✓ desbloqueada' : `🔒 faltam ${r.at - total}`}</span></div>`;
  }).join('');
  const height = Math.max(full, prevTop + CARD);
  return `<div class="ladder" style="min-height:${height}px"><div class="rungs">${rungs}</div><div class="rewards">${cards}</div></div>`;
}

function autoSummary(m, key) {
  const last = lastDay(key) || daysIn(key), total = monthTotal(m, key);
  const counts = m.habits.map(h => [h.name.toLowerCase(), habitCount(m, h.id, key)]).sort((a, b) => b[1] - a[1]);
  if (!counts.length) return '';
  const top = counts.slice(0, 3).filter(c => c[1] > 0).map(c => c[0]);
  const low = counts.slice(-2).reverse().map(c => c[0]);
  const fim = key < today().key ? 'No fim do mês' : `Até o dia ${last}`;
  return `${fim}, somei ${total} hábitos concluídos.\n` +
    (top.length ? `Fui mais consistente com ${listPt(top)}.\n` : '') +
    `Próximo foco: melhorar ${listPt(low)}.`;
}

function viewProgresso(m) {
  const key = ui.key, total = monthTotal(m, key), last = lastDay(key);
  const daily = []; for (let d = 1; d <= last; d++) daily.push(dayCount(m, d));
  const best = daily.length ? Math.max(...daily) : 0;
  const avg = daily.length ? total / daily.length : 0;
  const perfect = daily.filter(c => c === m.habits.length && c > 0).length;
  const possible = last * m.habits.length;
  return `
    <div class="stats">
      <div class="stat"><b>${total}</b><span>hábitos feitos</span></div>
      <div class="stat"><b>${possible ? Math.round(total / possible * 100) : 0}%</b><span>consistência</span></div>
      <div class="stat"><b>${fmt1(avg)}</b><span>média por dia</span></div>
      <div class="stat"><b>${perfect}</b><span>dias completos (máx. ${best})</span></div>
    </div>
    <div class="panel"><span class="tag">Gráfico de hábitos</span>
      <p class="hint">Quantos hábitos você concluiu em cada dia. Cada um soma 1 bloco na Escada de Recompensas.</p>
      ${lineChart(m, key)}
    </div>
    <div class="panel"><span class="tag">Escada de recompensas</span>
      <p class="hint center">Cada hábito concluído = 1 bloco preenchido.<br>Ao alcançar um marco, colete a recompensa. <a href="#" data-act="goto" data-tab="ajustes" style="color:var(--accent)">Editar prêmios</a></p>
      ${ladder(m, total)}
    </div>
    <div class="panel"><span class="tag">Reflexão do mês</span>
      <textarea class="reflect" id="reflect" placeholder="Como foi o mês? O que funcionou? Qual o próximo foco?">${esc(m.reflection)}</textarea>
      <div class="row-btns"><button class="btn ghost small" data-act="auto-reflect">✨ Gerar rascunho automático</button></div>
    </div>
    <p class="footnote">Missão do mês: progresso visível, recompensa conquistada.</p>`;
}

function pillarStats(m, key) {
  return m.pillars.map(p => { const r = pillarDone(m, p, key); return { p, ...r, level: pillarLevel(r.done, +p.meta) }; });
}

function radar(stats, prevStats) {
  const N = stats.length, S = 340, C = S / 2, Rr = 112;
  const ang = i => -Math.PI / 2 + i * 2 * Math.PI / N;
  const pt = (i, v) => [C + Math.cos(ang(i)) * Rr * v / 10, C + Math.sin(ang(i)) * Rr * v / 10];
  const poly = v => Array.from({ length: N }, (_, i) => pt(i, v).map(n => n.toFixed(1)).join(',')).join(' ');
  let g = '';
  for (let v = 1; v <= 10; v++) g += `<polygon class="web${v === 10 ? ' outer' : ''}" points="${poly(v)}"/>`;
  for (let i = 0; i < N; i++) { const [x, y] = pt(i, 10); g += `<line class="spoke" x1="${C}" y1="${C}" x2="${x}" y2="${y}"/>`; }
  for (let v = 1; v <= 10; v++) { const [x, y] = pt(0, v); g += `<text class="tick" x="${x - 4}" y="${y + 2.5}" text-anchor="end">${v}</text>`; }
  if (prevStats && prevStats.length === N) {
    g += `<polygon class="prev" points="${prevStats.map((s, i) => pt(i, s.level).join(',')).join(' ')}"/>`;
  }
  g += `<polygon class="shape" points="${stats.map((s, i) => pt(i, s.level).join(',')).join(' ')}"/>`;
  g += `<circle class="center" cx="${C}" cy="${C}" r="2.5"/>`;
  stats.forEach((s, i) => {
    const [x, y] = pt(i, s.level);
    g += `<circle cx="${x}" cy="${y}" r="5.2" fill="var(--card)" stroke="${s.p.color}" stroke-width="3.2"/>`;
    const [lx, ly] = pt(i, 12.6);
    const cos = Math.cos(ang(i));
    const anchor = Math.abs(cos) < 0.2 ? 'middle' : cos > 0 ? 'start' : 'end';
    const name = s.p.name.length > 16 ? s.p.name.slice(0, 15) + '…' : s.p.name;
    const dy = Math.sin(ang(i)) < -0.5 ? -4 : Math.sin(ang(i)) > 0.5 ? 8 : 2;
    g += `<text class="pnum" x="${lx}" y="${ly + dy - 10}" text-anchor="${anchor}">PILAR ${i + 1}</text>`;
    g += `<text class="plabel" x="${lx}" y="${ly + dy}" text-anchor="${anchor}">${esc(name)}</text>`;
  });
  return `<svg class="chart radar" viewBox="-30 -10 ${S + 60} ${S + 20}" role="img" aria-label="Gráfico radar dos pilares">${g}</svg>`;
}

function profile(stats) {
  const sorted = [...stats].sort((a, b) => b.level - a.level);
  const lv = stats.map(s => s.level);
  const spread = Math.max(...lv) - Math.min(...lv);
  const avg = lv.reduce((a, b) => a + b, 0) / lv.length;
  const strong = sorted.slice(0, 2), weak = sorted.slice(-2).reverse();
  const nm = s => s.p.name.toLowerCase();
  if (lv.every(v => v === 0)) return ['Mês em branco', 'Marque seus hábitos ou registre o progresso manual para desenhar o mapa.'];
  if (spread <= 2) return [avg >= 6 ? 'Evolução equilibrada' : 'Base equilibrada',
    avg >= 6 ? 'Você está avançando de forma parecida nas principais áreas.' : 'As áreas estão parecidas entre si — hora de subir todas juntas.'];
  const top = sorted.filter(s => s.level >= sorted[0].level - 1.5).slice(0, 3);
  return [`Foco em ${listPt(top.slice(0, 2).map(s => s.p.name))}`,
    `O desenho puxa para ${listPt(top.map(nm))}; ${listPt(weak.map(nm))} ${weak.length > 1 ? 'ficaram' : 'ficou'} mais atrás.`];
}

function viewEvolucao(m) {
  const key = ui.key, stats = pillarStats(m, key);
  const prevKey = shiftKey(key, -1), pm = state.months[prevKey];
  let prevStats = null;
  if (state.settings.compare && pm && monthTotal(pm, prevKey) + pm.pillars.reduce((a, p) => a + (+p.manual || 0), 0) > 0) {
    prevStats = stats.map(s => {
      const pp = pm.pillars.find(x => x.id === s.p.id);
      if (!pp) return { level: 0 };
      const r = pillarDone(pm, pp, prevKey);
      return { level: pillarLevel(r.done, +pp.meta) };
    });
  }
  const [title, desc] = profile(stats);
  const sorted = [...stats].sort((a, b) => b.level - a.level);
  const pct = s => `${s.p.name} (${Math.round(s.level * 10)}%)`;
  const rows = stats.map((s, i) => `<tr>
      <td><b>${i + 1}</b></td><td><span class="sw" style="background:${s.p.color}"></span></td>
      <td class="l">${esc(s.p.name)}<small>${s.auto ? `automático · ${s.n} hábito${s.n > 1 ? 's' : ''}` : 'manual'}</small></td>
      <td>${s.p.meta}</td>
      <td>${s.auto ? s.done : `<span class="stepper"><button data-act="pm" data-p="${s.p.id}" data-v="-1" aria-label="menos">−</button><span>${s.done}</span><button data-act="pm" data-p="${s.p.id}" data-v="1" aria-label="mais">+</button></span>`}</td>
      <td class="lvl">${fmt1(s.level)}</td></tr>`).join('');
  return `
    <div class="radar-head"><h2>${esc(title)}</h2><p>${esc(desc)}</p></div>
    ${radar(stats, prevStats)}
    <label class="toggle-line"><input type="checkbox" data-act="compare" ${state.settings.compare ? 'checked' : ''}> Comparar com ${MESES[parseKey(prevKey).m].toLowerCase()} (linha tracejada)</label>
    <div class="panel"><span class="tag">Pilares do mês</span>
      <table class="pillars"><thead><tr><th>#</th><th>Cor</th><th style="text-align:left">Pilar</th><th>Meta</th><th>Feito</th><th>Nível</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="note">Nível = feito ÷ meta × 10. Pilares ligados a hábitos somam automaticamente os ✓ do mês; os demais você registra com − / +. <a href="#" data-act="goto" data-tab="ajustes" style="color:var(--accent)">Personalizar pilares</a></p>
    </div>
    <div class="panel howto"><span class="tag">Como ler</span>
      <p>Áreas mais fortes: <b>${esc(listPt(sorted.slice(0, 2).map(pct)))}</b>.</p>
      <p>Áreas mais fracas: <b>${esc(listPt(sorted.slice(-2).reverse().map(pct)))}</b>.</p>
      <p class="muted">Quanto mais a linha puxa para um lado, mais aquele pilar recebeu progresso no mês.</p>
    </div>
    <p class="footnote">A linha mostra a direção do progresso sem esconder a teia do gráfico.</p>`;
}

let installEvt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if (ui.tab === 'ajustes') render(); });

function viewAjustes(m) {
  const key = ui.key, s = state.settings;
  const pOpts = sel => `<option value="">— sem pilar —</option>` + m.pillars.map(p => `<option value="${p.id}" ${p.id === sel ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
  const habits = m.habits.map((h, i) => `
    <div class="set-item">
      <input type="color" value="${h.color}" data-kind="habit" data-id="${h.id}" data-f="color" aria-label="Cor">
      <div class="col"><input type="text" value="${esc(h.name)}" data-kind="habit" data-id="${h.id}" data-f="name" aria-label="Nome do hábito" maxlength="40">
        <div class="line"><label>Pilar</label><select data-kind="habit" data-id="${h.id}" data-f="pillarId">${pOpts(h.pillarId)}</select></div></div>
      <div class="moves"><button class="mini" data-act="move" data-kind="habits" data-i="${i}" data-v="-1" aria-label="Subir">▲</button><button class="mini" data-act="move" data-kind="habits" data-i="${i}" data-v="1" aria-label="Descer">▼</button></div>
      <button class="mini del" data-act="del" data-kind="habits" data-id="${h.id}" aria-label="Remover">✕</button>
    </div>`).join('');
  const pillars = m.pillars.map((p, i) => `
    <div class="set-item">
      <input type="color" value="${p.color}" data-kind="pillar" data-id="${p.id}" data-f="color" aria-label="Cor">
      <div class="col"><input type="text" value="${esc(p.name)}" data-kind="pillar" data-id="${p.id}" data-f="name" aria-label="Nome do pilar" maxlength="30">
        <div class="line"><label>Meta no mês</label><input type="number" min="1" max="999" value="${p.meta}" data-kind="pillar" data-id="${p.id}" data-f="meta" inputmode="numeric"></div></div>
      <div class="moves"><button class="mini" data-act="move" data-kind="pillars" data-i="${i}" data-v="-1" aria-label="Subir">▲</button><button class="mini" data-act="move" data-kind="pillars" data-i="${i}" data-v="1" aria-label="Descer">▼</button></div>
      <button class="mini del" data-act="del" data-kind="pillars" data-id="${p.id}" aria-label="Remover" ${m.pillars.length <= MIN_PILLARS ? 'disabled style="opacity:.3"' : ''}>✕</button>
    </div>`).join('');
  const rewards = [...m.rewards].sort((a, b) => a.at - b.at).map(r => `
    <div class="set-item">
      <div class="col"><div class="line"><label>Marco</label><input type="number" min="1" max="999" value="${r.at}" data-kind="reward" data-id="${r.id}" data-f="at" inputmode="numeric"><label>blocos</label></div>
        <input type="text" value="${esc(r.text)}" data-kind="reward" data-id="${r.id}" data-f="text" aria-label="Prêmio" maxlength="60"></div>
      <button class="mini del" data-act="del" data-kind="rewards" data-id="${r.id}" aria-label="Remover">✕</button>
    </div>`).join('');
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  return `
    <p class="note" style="margin-top:14px">As alterações valem para <b>${monthName(key)}</b>. Meses novos herdam a estrutura do mês anterior (hábitos, pilares e recompensas), com as marcações zeradas.</p>

    <div class="panel"><span class="tag">Hábitos</span>
      <div class="set-list">${habits || '<p class="hint">Nenhum hábito.</p>'}</div>
      <div class="row-btns"><button class="btn" data-act="add-habit">+ Novo hábito</button></div>
    </div>

    <div class="panel"><span class="tag">Pilares (mapa de evolução)</span>
      <p class="hint">De ${MIN_PILLARS} a ${MAX_PILLARS} pilares. Ligue hábitos a um pilar para o "feito" ser contado automaticamente.</p>
      <div class="set-list">${pillars}</div>
      <div class="row-btns"><button class="btn" data-act="add-pillar" ${m.pillars.length >= MAX_PILLARS ? 'disabled style="opacity:.4"' : ''}>+ Novo pilar</button></div>
    </div>

    <div class="panel"><span class="tag">Recompensas</span>
      <p class="hint">A escada vai até o maior marco (${ladderMax(m)} blocos). Cada hábito concluído = 1 bloco.</p>
      <div class="set-list">${rewards}</div>
      <div class="row-btns"><button class="btn" data-act="add-reward">+ Nova recompensa</button></div>
    </div>

    <div class="panel"><span class="tag">Aparência</span>
      <div class="set-label">Tema</div>
      <div class="seg">${[['auto', 'Automático'], ['light', 'Claro'], ['dark', 'Escuro']].map(([v, l]) => `<button class="${s.theme === v ? 'on' : ''}" data-act="theme" data-v="${v}">${l}</button>`).join('')}</div>
      <div class="set-label">Cor de destaque</div>
      <div class="swatches">${ACCENTS.map(([n, c]) => `<button class="${s.accent === c ? 'on' : ''}" style="background:${c}" data-act="accent" data-v="${c}" aria-label="${n}" title="${n}"></button>`).join('')}
        <input type="color" value="${s.accent}" data-kind="setting" data-f="accent" aria-label="Cor personalizada" title="Cor personalizada"></div>
    </div>

    <div class="panel"><span class="tag">Instalar no celular</span>
      ${standalone ? '<p class="hint">✓ App instalado. Funciona offline.</p>' :
        installEvt ? '<p class="hint">Instale como aplicativo: abre em tela cheia, com ícone próprio e funciona offline.</p><button class="btn" data-act="install">Instalar app</button>' :
        isIOS ? '<p class="hint">No iPhone/iPad: toque em <b>Compartilhar</b> (□↑) no Safari e depois em <b>Adicionar à Tela de Início</b>.</p>' :
        '<p class="hint">No Android (Chrome): menu ⋮ → <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>. No iPhone: Safari → Compartilhar → <b>Adicionar à Tela de Início</b>.</p>'}
    </div>

    <div class="panel"><span class="tag">Dados</span>
      <p class="hint">Seus dados ficam salvos só neste aparelho. Faça backup para levar para outro celular.</p>
      <div class="row-btns">
        <button class="btn ghost small" data-act="export">⬇ Exportar backup</button>
        <label class="btn ghost small">⬆ Importar backup<input type="file" accept="application/json,.json" data-act="import" hidden></label>
        <button class="btn ghost small" data-act="example">Carregar exemplo</button>
      </div>
      <div class="row-btns">
        <button class="btn danger small" data-act="clear-month">Limpar marcações do mês</button>
        <button class="btn danger small" data-act="reset">Apagar tudo</button>
      </div>
    </div>`;
}

const VIEWS = { hoje: viewHoje, mes: viewMes, progresso: viewProgresso, evolucao: viewEvolucao, ajustes: viewAjustes };

/* ================= Render ================= */
function render() {
  applyTheme();
  const m = month(ui.key);
  const t = today();
  $('#monthLabel').innerHTML = `${monthName(ui.key).toUpperCase()}${ui.key !== t.key ? '<small>· voltar a hoje</small>' : ''}`;
  $('#title').textContent = TITLES[ui.tab];
  document.querySelectorAll('.tabbar button').forEach(b => b.classList.toggle('on', b.dataset.tab === ui.tab));
  const v = $('#view');
  const gs = $('#gridScroll'), keepGrid = gs ? gs.scrollLeft : null;
  const ds = $('#days'), keepDays = ds ? ds.scrollLeft : null;
  v.innerHTML = VIEWS[ui.tab](m);
  const g2 = $('#gridScroll');
  if (g2) {
    if (keepGrid !== null && ui.scrolledGrid) g2.scrollLeft = keepGrid;
    else { const d = lastDay(ui.key); g2.scrollLeft = Math.max(0, (d - 5) * 34); ui.scrolledGrid = true; }
  }
  const d2 = $('#days');
  if (d2) {
    if (keepDays !== null) d2.scrollLeft = keepDays;
    const sel = d2.querySelector('.sel');
    if (sel && (keepDays === null || sel.offsetLeft < d2.scrollLeft || sel.offsetLeft + sel.offsetWidth > d2.scrollLeft + d2.clientWidth)) {
      d2.scrollLeft = sel.offsetLeft - d2.clientWidth / 2 + sel.offsetWidth / 2;
    }
  }
  try { sessionStorage.setItem('rh-ui', JSON.stringify({ tab: ui.tab })); } catch (e) { /* ignore */ }
}

/* ================= Eventos ================= */
function findItem(m, kind, id) {
  const list = { habit: m.habits, pillar: m.pillars, reward: m.rewards }[kind];
  return list && list.find(x => x.id === id);
}

document.addEventListener('click', e => {
  const tabBtn = e.target.closest('.tabbar button');
  if (tabBtn) { ui.tab = tabBtn.dataset.tab; render(); window.scrollTo({ top: 0 }); return; }
  const el = e.target.closest('[data-act]');
  if (!el || el.tagName === 'INPUT') return;
  const act = el.dataset.act, m = month(ui.key);
  switch (act) {
    case 'prev-month': setMonth(shiftKey(ui.key, -1)); break;
    case 'next-month': setMonth(shiftKey(ui.key, 1)); break;
    case 'this-month': setMonth(today().key); break;
    case 'day': ui.day = +el.dataset.d; render(); break;
    case 'toggle': toggle(el.dataset.h, +el.dataset.d); break;
    case 'goto': e.preventDefault(); ui.tab = el.dataset.tab; render(); window.scrollTo({ top: 0 }); break;
    case 'auto-reflect': {
      const txt = autoSummary(m, ui.key);
      if (m.reflection.trim() && !confirm('Substituir o texto atual pelo rascunho automático?')) break;
      m.reflection = txt; save(); render(); break;
    }
    case 'pm': {
      const p = m.pillars.find(x => x.id === el.dataset.p);
      p.manual = Math.max(0, (+p.manual || 0) + (+el.dataset.v)); save(); vibrate(6); render(); break;
    }
    case 'add-habit': {
      m.habits.push({ id: uid(), name: 'Novo hábito', color: PALETTE[m.habits.length % PALETTE.length], pillarId: '' });
      save(); render();
      const inputs = document.querySelectorAll('[data-kind="habit"][data-f="name"]');
      const last = inputs[inputs.length - 1]; if (last) { last.focus(); last.select(); }
      break;
    }
    case 'add-pillar': {
      if (m.pillars.length >= MAX_PILLARS) break;
      m.pillars.push({ id: uid(), name: 'Novo pilar', meta: 10, color: PALETTE[m.pillars.length % PALETTE.length], manual: 0 });
      save(); render(); break;
    }
    case 'add-reward': {
      const max = Math.max(0, ...m.rewards.map(r => +r.at));
      m.rewards.push({ id: uid(), at: max + 20, text: 'Novo prêmio' }); save(); render(); break;
    }
    case 'del': {
      const kind = el.dataset.kind, id = el.dataset.id;
      if (kind === 'pillars' && m.pillars.length <= MIN_PILLARS) break;
      const item = m[kind].find(x => x.id === id);
      if (!confirm(`Remover "${item.name || item.text}"?`)) break;
      m[kind] = m[kind].filter(x => x.id !== id);
      if (kind === 'habits') delete m.checks[id];
      if (kind === 'pillars') m.habits.forEach(h => { if (h.pillarId === id) h.pillarId = ''; });
      save(); render(); break;
    }
    case 'move': {
      const list = m[el.dataset.kind], i = +el.dataset.i, j = i + (+el.dataset.v);
      if (j < 0 || j >= list.length) break;
      [list[i], list[j]] = [list[j], list[i]]; save(); render(); break;
    }
    case 'theme': state.settings.theme = el.dataset.v; save(); render(); break;
    case 'accent': state.settings.accent = el.dataset.v; save(); render(); break;
    case 'install': if (installEvt) { installEvt.prompt(); installEvt.userChoice.finally(() => { installEvt = null; render(); }); } break;
    case 'export': exportData(); break;
    case 'example':
      if (Object.keys(state.months).length && !confirm('Carregar o exemplo vai substituir todos os seus dados. Continuar?')) break;
      loadExample(); break;
    case 'clear-month':
      if (!confirm(`Apagar todas as marcações de ${monthName(ui.key)}?`)) break;
      m.checks = {}; m.reflection = ''; m.pillars.forEach(p => { p.manual = 0; }); save(); render(); toast('Mês limpo.'); break;
    case 'reset':
      if (!confirm('Apagar TODOS os dados do app? Isso não pode ser desfeito.')) break;
      state.months = {}; save(); setMonth(today().key); toast('Tudo apagado. Recomeçando com o modelo padrão.'); break;
  }
});

document.addEventListener('input', e => {
  const el = e.target;
  if (el.id === 'reflect') { month(ui.key).reflection = el.value; save(); return; }
  if (el.type === 'text' && el.dataset.kind) {
    const it = findItem(month(ui.key), el.dataset.kind, el.dataset.id);
    if (it) { it[el.dataset.f] = el.value; save(); }
  }
});

document.addEventListener('change', e => {
  const el = e.target, m = month(ui.key);
  if (el.dataset.act === 'compare') { state.settings.compare = el.checked; save(); render(); return; }
  if (el.dataset.act === 'import') { importData(el.files[0]); el.value = ''; return; }
  if (el.dataset.kind === 'setting') { state.settings[el.dataset.f] = el.value; save(); render(); return; }
  if (!el.dataset.kind) return;
  const it = findItem(m, el.dataset.kind, el.dataset.id);
  if (!it) return;
  let v = el.value;
  if (el.type === 'number') v = clamp(Math.round(+v || 1), 1, 999);
  if (el.type === 'text') { v = v.trim() || (el.dataset.kind === 'reward' ? 'Prêmio' : 'Sem nome'); }
  it[el.dataset.f] = v;
  save(); render();
});

/* ================= Backup ================= */
function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `rastreador-habitos-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('Backup exportado.');
}
function importData(file) {
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const s = JSON.parse(r.result);
      if (!s || typeof s.months !== 'object') throw new Error('formato');
      if (!confirm('Importar este backup vai substituir os dados atuais. Continuar?')) return;
      state = { version: 1, settings: { theme: 'auto', accent: '#8E1B1B', compare: true, ...(s.settings || {}) }, months: s.months };
      save(); render(); toast('Backup importado!');
    } catch (err) { toast('Arquivo inválido.'); }
  };
  r.readAsText(file);
}

/* ================= Exemplo (baseado no PDF) ================= */
function loadExample() {
  let seed = 2026;
  const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const tpl = defaultTemplate();
  tpl.rewards = [
    { id: uid(), at: 40, text: 'Chocolate' },
    { id: uid(), at: 90, text: '1 hora de videogame' },
    { id: uid(), at: 150, text: 'Jantar especial' },
  ];
  // Padrão dos 10 primeiros dias do PDF (Treino, Leitura, Água, Comer, Dormir, Estudo, Caminhada, Renda)
  const pdf = [[2, 4, 6, 9], [1, 2, 3, 4, 5, 7, 9, 10], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [1, 2, 4, 5, 6, 7, 8, 9], [1, 3, 5, 7, 10], [2, 4, 6, 9], [4, 6, 8], [10]];
  const prob = [0.42, 0.8, 0.9, 0.8, 0.62, 0.55, 0.35, 0.3];
  const t = today();
  const prevKey = shiftKey(t.key, -1);
  state.months = {};
  const fill = (key, upTo, usePdf) => {
    const m = cloneStructure(tpl);
    m.habits.forEach((h, i) => {
      m.checks[h.id] = {};
      for (let d = 1; d <= upTo; d++) {
        const on = usePdf && d <= 10 ? pdf[i].includes(d) : rnd() < prob[i];
        if (on) m.checks[h.id][d] = 1;
      }
    });
    state.months[key] = m;
    return m;
  };
  const pm = fill(prevKey, daysIn(prevKey), false);
  pm.reflection = autoSummary(pm, prevKey);
  const cm = fill(t.key, Math.max(0, t.day - 1), true);
  cm.reflection = autoSummary(cm, t.key);
  save();
  ui.tab = 'hoje';
  setMonth(t.key);
  toast('Exemplo carregado! Explore as abas.');
}

/* ================= Início ================= */
render();
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
// Ao voltar para o app depois da meia-noite, atualiza o "hoje".
let lastSeen = today().key + today().day;
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  const t = today(), now = t.key + t.day;
  if (now !== lastSeen) { lastSeen = now; setMonth(t.key); }
});
