(() => {
'use strict';

/* ───────── constants ───────── */
const KEY = 'tasknote.v1';
const CATS = [
  { id: 'work',   name: 'งาน',      color: '#4f7cff' },
  { id: 'meet',   name: 'ประชุม',   color: '#a855f7' },
  { id: 'me',     name: 'ส่วนตัว',  color: '#10b981' },
  { id: 'study',  name: 'เรียน',    color: '#f59e0b' },
  { id: 'money',  name: 'การเงิน',  color: '#14b8a6' },
  { id: 'health', name: 'สุขภาพ',   color: '#ef4444' },
];
const CAT = Object.fromEntries(CATS.map(c => [c.id, c]));
const PRI = [{ v: 0, n: 'ปกติ' }, { v: 1, n: 'ต่ำ' }, { v: 2, n: 'กลาง' }, { v: 3, n: 'สูง' }];
const DOW = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const DEFAULTS = { theme: 'auto', weekStart: 1, notify: false };

const ICONS = {
  check: '<polyline points="20 6 9 17 4 12"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  cal: '<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  repeat: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 013-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 01-3 3H3"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  tune: '<path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  note: '<path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  left: '<path d="M15 18l-6-6 6-6"/>',
  right: '<path d="M9 18l6-6-6-6"/>',
  bell: '<path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  allok: '<circle cx="12" cy="12" r="10"/><path d="M8 12.5l2.7 2.7L16 9.5"/>',
};
const ic = n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]}</svg>`;

/* ───────── helpers ───────── */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const p2 = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const todayStr = () => ymd(new Date());
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
const diffDays = (a, b) => Math.round((parse(a) - parse(b)) / 864e5);
const nowHM = () => { const d = new Date(); return `${p2(d.getHours())}:${p2(d.getMinutes())}`; };
const fDate = new Intl.DateTimeFormat('th-TH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const fShort = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short' });
const fMonth = new Intl.DateTimeFormat('th-TH', { month: 'long', year: 'numeric' });
const fLong = new Intl.DateTimeFormat('th-TH', { weekday: 'long', day: 'numeric', month: 'long' });
const rel = s => {
  const n = diffDays(s, todayStr());
  return n === 0 ? 'วันนี้' : n === 1 ? 'พรุ่งนี้' : n === -1 ? 'เมื่อวาน' : fDate.format(parse(s));
};

function nextDate(s, rep) {
  const t = todayStr();
  let d = s, guard = 0;
  do {
    const x = parse(d);
    if (rep === 'daily') x.setDate(x.getDate() + 1);
    else if (rep === 'weekly') x.setDate(x.getDate() + 7);
    else if (rep === 'weekday') { do x.setDate(x.getDate() + 1); while (x.getDay() === 0 || x.getDay() === 6); }
    else if (rep === 'monthly') {
      const day = x.getDate(); x.setDate(1); x.setMonth(x.getMonth() + 1);
      x.setDate(Math.min(day, new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate()));
    }
    d = ymd(x);
  } while (d <= t && ++guard < 400); // รอบถัดไปต้องหลังวันนี้เสมอ
  return d;
}

/* ───────── state ───────── */
let state = load();
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d && Array.isArray(d.tasks)) return { tasks: d.tasks, log: d.log || [], settings: { ...DEFAULTS, ...d.settings } };
  } catch (e) { /* ignore */ }
  const t = todayStr();
  return {
    tasks: [{ id: uid(), title: 'ยินดีต้อนรับสู่ TaskNote 👋', note: 'แตะที่งานเพื่อแก้ไข • ปัดซ้ายเพื่อลบ • แตะวงกลมเพื่อทำเสร็จ', date: t, time: '', pri: 2, cat: 'me', done: false, subs: [{ id: uid(), t: 'ลองเพิ่มงานใหม่ด้วยปุ่ม +', d: false }, { id: uid(), t: 'เปิดดูปฏิทินที่แท็บ "ปฏิทิน"', d: false }], repeat: '', remind: '', created: Date.now() }],
    log: [], settings: { ...DEFAULTS },
  };
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (e) { toast('บันทึกไม่สำเร็จ: พื้นที่เก็บข้อมูลเต็ม'); }
}
const ui = { tab: 'today', month: new Date(new Date().getFullYear(), new Date().getMonth(), 1), sel: todayStr(), filter: 'open', cat: '', q: '' };
const byId = id => state.tasks.find(t => t.id === id);

function cmp(a, b) {
  if (!!a.done !== !!b.done) return a.done ? 1 : -1;
  const ka = (a.date || '9999-99-99') + (a.time || '99:99'), kb = (b.date || '9999-99-99') + (b.time || '99:99');
  if (ka !== kb) return ka < kb ? -1 : 1;
  return (b.pri || 0) - (a.pri || 0) || a.created - b.created;
}
const endOf = t => t.endDate || t.date;
const covers = (t, s) => !!t.date && t.date <= s && s <= endOf(t);
const isLate = t => !t.done && t.date && (endOf(t) < todayStr() || (endOf(t) === todayStr() && !t.endDate && t.time && t.time < nowHM()));

/* ───────── actions on data ───────── */
function toggle(id) {
  const t = byId(id); if (!t) return;
  if (!t.done && t.repeat && t.date) {
    state.log.push({ id: t.id, d: todayStr() });
    const span = t.endDate ? diffDays(t.endDate, t.date) : 0;
    t.date = nextDate(t.date, t.repeat); t.notified = 0;
    if (t.endDate) t.endDate = addDays(t.date, span);
    (t.subs || []).forEach(s => s.d = false);
    toast(`ทำซ้ำ — รอบถัดไป ${rel(t.date)}`);
  } else if (!t.done) {
    t.done = true; t.doneAt = Date.now(); state.log.push({ id: t.id, d: todayStr() });
  } else {
    t.done = false; t.doneAt = 0;
    for (let i = state.log.length - 1; i >= 0; i--) if (state.log[i].id === t.id) { state.log.splice(i, 1); break; }
  }
  if (state.log.length > 3000) state.log.splice(0, state.log.length - 3000);
  save(); render(); navigator.vibrate?.(12); updateBadge();
}
function remove(id) {
  const i = state.tasks.findIndex(t => t.id === id); if (i < 0) return;
  const [t] = state.tasks.splice(i, 1);
  save(); render(); updateBadge();
  toast('ลบงานแล้ว', 'เลิกทำ', () => { state.tasks.splice(Math.min(i, state.tasks.length), 0, t); save(); render(); updateBadge(); });
}

/* ───────── views ───────── */
const app = $('#app');
let lastTab = null;

function row(t, showDate) {
  const cat = CAT[t.cat], late = isLate(t), subs = t.subs || [], sd = subs.filter(s => s.d).length, bits = [];
  if (t.endDate) {
    const T = todayStr(), n = diffDays(t.endDate, t.date) + 1, cur = T >= t.date && T <= t.endDate ? ` · วันที่ ${diffDays(T, t.date) + 1}/${n}` : ` · ${n} วัน`;
    bits.push(`<span class="${late ? 'late' : 'span'}">${ic('cal')}${esc(fShort.format(parse(t.date)))} – ${esc(fShort.format(parse(t.endDate)))}${cur}</span>`);
  } else if (showDate && t.date) bits.push(`<span class="${late ? 'late' : ''}">${ic('cal')}${esc(rel(t.date))}</span>`);
  if (t.time) bits.push(`<span class="${late ? 'late' : ''}">${ic('clock')}${esc(t.time)}</span>`);
  if (cat) bits.push(`<span><i class="dot" style="background:${cat.color}"></i>${cat.name}</span>`);
  if (subs.length) bits.push(`<span>${ic('list')}${sd}/${subs.length}</span>`);
  if (t.repeat) bits.push(`<span>${ic('repeat')}</span>`);
  if (t.remind !== '' && t.remind != null) bits.push(`<span>${ic('bell')}</span>`);
  if (t.note) bits.push(`<span>${ic('note')}</span>`);
  return `<div class="swipe"><div class="swipe-bg">${ic('trash')} ลบ</div>
    <div class="task pri${t.pri || 0} ${t.done ? 'done' : ''}" data-act="edit" data-id="${t.id}">
      <button class="chk" data-act="toggle" data-id="${t.id}" aria-label="${t.done ? 'ยกเลิกเสร็จ' : 'ทำเสร็จ'}">${ic('check')}</button>
      <div class="tb"><div class="tt">${esc(t.title)}</div>${bits.length ? `<div class="tm">${bits.join('')}</div>` : ''}</div>
    </div></div>`;
}
const section = (title, list, opts = {}) => list.length ? `<section class="sec"><div class="sec-h ${opts.late ? 'late' : ''}"><span>${title}</span><span class="n">${list.length}</span></div><div class="card">${list.map(t => row(t, opts.showDate)).join('')}</div></section>` : '';
const empty = (icon, h, p) => `<div class="empty"><div class="big">${ic(icon)}</div><h3>${h}</h3><p>${p}</p></div>`;

function viewToday() {
  const T = todayStr(), open = state.tasks.filter(t => !t.done).sort(cmp);
  const late = open.filter(t => t.date && endOf(t) < T);
  const today = state.tasks.filter(t => covers(t, T)).sort(cmp);
  const soon = open.filter(t => t.date > T && t.date <= addDays(T, 7));
  const later = open.filter(t => t.date > addDays(T, 7));
  const nodate = open.filter(t => !t.date);
  const total = today.length, done = today.filter(t => t.done).length, pct = total ? done / total : 0;
  const h = new Date().getHours();
  const greet = h < 4 ? 'ดึกแล้ว พักผ่อนบ้างนะ' : h < 12 ? 'สวัสดีตอนเช้า' : h < 17 ? 'สวัสดีตอนบ่าย' : h < 20 ? 'สวัสดีตอนเย็น' : 'สวัสดีตอนค่ำ';
  const C = 2 * Math.PI * 26;
  const msg = !total && !late.length ? 'วันนี้ว่าง — เพิ่มงานได้เลย' : done === total && !late.length ? 'เยี่ยมมาก! ทำครบแล้ว 🎉' : `เหลืออีก ${total - done + late.length} งาน${late.length ? ` (เลยกำหนด ${late.length})` : ''}`;
  return `<header class="top"><div><p class="eyebrow">${greet}</p><h1>${fLong.format(new Date())}</h1></div></header>
  <div class="hero"><div class="ring"><svg viewBox="0 0 64 64"><circle class="bg" cx="32" cy="32" r="26"/><circle class="fg" cx="32" cy="32" r="26" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct)}"/></svg><b>${Math.round(pct * 100)}%</b></div>
  <div><h2>งานวันนี้ ${done}/${total}</h2><p>${msg}</p></div></div>
  ${section('เลยกำหนด', late, { late: true, showDate: true })}
  ${section('วันนี้', today)}
  ${section('7 วันข้างหน้า', soon, { showDate: true })}
  ${section('ไกลกว่านั้น', later, { showDate: true })}
  ${section('ไม่มีกำหนด', nodate)}
  ${!state.tasks.length ? empty('allok', 'ยังไม่มีงาน', 'แตะปุ่ม + เพื่อเริ่มจดงานแรกของคุณ') : (!today.length && !late.length && !soon.length && !later.length && !nodate.length ? empty('allok', 'ไม่มีงานค้าง', 'พักผ่อนได้เลย ✨') : '')}`;
}

function dayTasks(s) { return state.tasks.filter(t => covers(t, s)).sort(cmp); }
function viewCalendar() {
  const ws = state.settings.weekStart, y = ui.month.getFullYear(), m = ui.month.getMonth();
  const off = (new Date(y, m, 1).getDay() - ws + 7) % 7, dim = new Date(y, m + 1, 0).getDate(), rows = Math.ceil((off + dim) / 7);
  const T = todayStr();
  const map = {};
  state.tasks.forEach(t => {
    if (!t.date) return;
    for (let s = t.date, n = 0; s <= endOf(t) && n < 400; s = addDays(s, 1), n++) (map[s] ||= []).push(t);
  });
  let cells = '';
  for (let i = 0; i < rows * 7; i++) {
    const d = new Date(y, m, 1 - off + i), s = ymd(d), ts = map[s] || [], open = ts.filter(t => !t.done);
    const dots = (open.length ? open : ts).slice(0, 3).map(t => `<i style="background:${CAT[t.cat]?.color || '#9aa1b2'};${t.done ? 'opacity:.35' : ''}"></i>`).join('') + (ts.length > 3 ? `<em>+</em>` : '');
    cells += `<button class="day ${d.getMonth() !== m ? 'out' : ''} ${s === T ? 'today' : ''} ${s === ui.sel ? 'sel' : ''} ${[0, 6].includes(d.getDay()) ? 'we' : ''}" data-act="selday" data-d="${s}" aria-label="${esc(fLong.format(d))}"><span class="num">${d.getDate()}</span><span class="dots">${dots}</span></button>`;
  }
  const dow = Array.from({ length: 7 }, (_, i) => { const k = (ws + i) % 7; return `<span class="${[0, 6].includes(k) ? 'we' : ''}">${DOW[k]}</span>`; }).join('');
  const list = dayTasks(ui.sel);
  return `<header class="top"><div><p class="eyebrow">ปฏิทิน</p><h1>${esc(fMonth.format(ui.month))}</h1></div>
    <div class="cal-nav"><button class="icon-btn" data-act="prevm" aria-label="เดือนก่อน">${ic('left')}</button><button class="pill-btn" data-act="todaym">วันนี้</button><button class="icon-btn" data-act="nextm" aria-label="เดือนถัดไป">${ic('right')}</button></div></header>
  <div class="card cal"><div class="dow">${dow}</div><div class="grid" id="grid">${cells}</div></div>
  <section class="sec"><div class="sec-h"><span>${esc(rel(ui.sel))} · ${esc(fShort.format(parse(ui.sel)))}</span><button class="btn-sm" data-act="add" data-d="${ui.sel}">+ เพิ่มงาน</button></div>
  ${list.length ? `<div class="card">${list.map(t => row(t)).join('')}</div>` : `<div class="card">${empty('cal', 'ไม่มีกำหนดการ', 'แตะ "+ เพิ่มงาน" เพื่อวางแผนวันนี้')}</div>`}</section>`;
}

function filtered() {
  const q = ui.q.trim().toLowerCase();
  return state.tasks.filter(t => (ui.filter === 'all' || (ui.filter === 'open' ? !t.done : t.done)) && (!ui.cat || t.cat === ui.cat) &&
    (!q || (t.title + ' ' + (t.note || '') + ' ' + (t.subs || []).map(s => s.t).join(' ')).toLowerCase().includes(q))).sort(ui.filter === 'done' ? (a, b) => (b.doneAt || 0) - (a.doneAt || 0) : cmp);
}
function allList() {
  const list = filtered();
  if (!list.length) return `<div class="card">${empty('search', 'ไม่พบงาน', ui.q ? 'ลองค้นหาด้วยคำอื่น' : 'ยังไม่มีงานในหมวดนี้')}</div>`;
  if (ui.filter === 'done') return `<div class="card">${list.map(t => row(t, true)).join('')}</div>`;
  const groups = new Map();
  list.forEach(t => { const k = t.date || ''; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(t); });
  return [...groups].map(([k, ts]) => {
    const late = ts.some(isLate);
    return `<section class="sec"><div class="sec-h ${late ? 'late' : ''}"><span>${k ? esc(rel(k)) : 'ไม่มีกำหนด'}</span><span class="n">${ts.length}</span></div><div class="card">${ts.map(t => row(t)).join('')}</div></section>`;
  }).join('');
}
function viewAll() {
  const seg = [['open', 'ค้างอยู่'], ['done', 'เสร็จแล้ว'], ['all', 'ทั้งหมด']].map(([v, n]) => `<button class="${ui.filter === v ? 'on' : ''}" data-act="filter" data-v="${v}">${n}</button>`).join('');
  const chips = [`<button class="chip ${!ui.cat ? 'on' : ''}" data-act="cat" data-v="">ทุกหมวด</button>`, ...CATS.map(c => `<button class="chip ${ui.cat === c.id ? 'on' : ''}" data-act="cat" data-v="${c.id}"><i class="dot" style="background:${c.color}"></i>${c.name}</button>`)].join('');
  return `<header class="top"><div><p class="eyebrow">${state.tasks.filter(t => !t.done).length} งานค้าง</p><h1>งานทั้งหมด</h1></div></header>
  <label class="search">${ic('search')}<input id="q" type="search" placeholder="ค้นหางาน…" value="${esc(ui.q)}" enterkeyhint="search"></label>
  <div class="seg mb">${seg}</div><div class="chips">${chips}</div><div id="allList">${allList()}</div>`;
}

function streak() {
  const days = new Set(state.log.map(l => l.d)); let n = 0, d = todayStr();
  if (!days.has(d)) d = addDays(d, -1);
  while (days.has(d)) { n++; d = addDays(d, -1); }
  return n;
}
function viewSettings() {
  const s = state.settings, T = todayStr();
  const counts = Array.from({ length: 7 }, (_, i) => { const d = addDays(T, i - 6); return { d, n: state.log.filter(l => l.d === d).length }; });
  const max = Math.max(1, ...counts.map(c => c.n));
  const bars = counts.map(c => `<div class="bar ${c.n ? '' : 'z'}"><span>${c.n || ''}</span><i style="height:${Math.max(4, c.n / max * 52)}px"></i><span>${DOW[parse(c.d).getDay()]}</span></div>`).join('');
  const seg = (k, opts) => `<div class="seg">${opts.map(([v, n]) => `<button class="${String(s[k]) === String(v) ? 'on' : ''}" data-act="set" data-k="${k}" data-v="${v}">${n}</button>`).join('')}</div>`;
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  return `<header class="top"><div><p class="eyebrow">TaskNote</p><h1>ตั้งค่า</h1></div></header>
  <div class="stats"><div class="stat"><b>${state.tasks.filter(t => !t.done).length}</b><span>งานค้าง</span></div><div class="stat"><b>${state.log.length}</b><span>ทำเสร็จทั้งหมด</span></div><div class="stat"><b>${streak()}🔥</b><span>วันติดต่อกัน</span></div></div>
  <section class="sec"><div class="sec-h"><span>ผลงาน 7 วันล่าสุด</span></div><div class="card"><div class="bars">${bars}</div></div></section>
  <section class="sec"><div class="sec-h"><span>การแสดงผล</span></div><div class="card">
    <div class="set-row"><div class="l"><b>ธีม</b></div>${seg('theme', [['auto', 'อัตโนมัติ'], ['light', 'สว่าง'], ['dark', 'มืด']])}</div>
    <div class="set-row"><div class="l"><b>สัปดาห์เริ่มวัน</b></div>${seg('weekStart', [[1, 'จันทร์'], [0, 'อาทิตย์']])}</div></div></section>
  <section class="sec"><div class="sec-h"><span>แจ้งเตือน</span></div><div class="card">
    <div class="set-row"><div class="l"><b>แจ้งเตือนงาน</b><small>${'Notification' in window ? 'แจ้งเตือนขณะเปิดแอพหรืออยู่เบื้องหลัง' : 'เบราว์เซอร์นี้ไม่รองรับ'}${!standalone ? ' • บน iPhone ต้องเพิ่มไปหน้าจอโฮมก่อน' : ''}</small></div><button class="sw ${s.notify ? 'on' : ''}" data-act="notif" role="switch" aria-checked="${!!s.notify}" aria-label="แจ้งเตือน"></button></div></div></section>
  <section class="sec"><div class="sec-h"><span>ข้อมูล</span></div><div class="card">
    <div class="set-row"><div class="l"><b>สำรองข้อมูล</b><small>บันทึกเป็นไฟล์ JSON</small></div><button class="btn-sm" data-act="export">ส่งออก</button></div>
    <div class="set-row"><div class="l"><b>นำเข้าข้อมูล</b><small>รวมกับข้อมูลที่มีอยู่</small></div><button class="btn-sm" data-act="import">นำเข้า</button></div>
    <div class="set-row"><div class="l"><b>ล้างงานที่เสร็จแล้ว</b><small>${state.tasks.filter(t => t.done).length} รายการ</small></div><button class="btn-sm red" data-act="clear">ล้าง</button></div></div></section>
  ${deferredInstall ? `<section class="sec"><div class="card"><div class="set-row"><div class="l"><b>ติดตั้งแอพ</b><small>เพิ่มไปยังหน้าจอโฮม</small></div><button class="btn-sm" data-act="install">ติดตั้ง</button></div></div></section>` : (!standalone && /iphone|ipad/i.test(navigator.userAgent) ? `<section class="sec"><div class="card"><div class="set-row"><div class="l"><b>ติดตั้งบน iPhone</b><small>แตะปุ่มแชร์ ⬆︎ ใน Safari แล้วเลือก “เพิ่มไปยังหน้าจอโฮม”</small></div></div></div></section>` : '')}
  <p class="foot">ข้อมูลเก็บในเครื่องของคุณเท่านั้น • TaskNote v1.0</p>`;
}

function render() {
  const keep = ui.tab === lastTab ? app.scrollTop : 0;
  app.innerHTML = { today: viewToday, calendar: viewCalendar, all: viewAll, settings: viewSettings }[ui.tab]();
  if (ui.tab !== lastTab) app.firstElementChild?.classList.add('view-in');
  app.scrollTop = keep; lastTab = ui.tab;
  const tabs = [['today', 'sun', 'วันนี้'], ['calendar', 'cal', 'ปฏิทิน'], null, ['all', 'list', 'งานทั้งหมด'], ['settings', 'tune', 'ตั้งค่า']];
  $('#tabbar').innerHTML = tabs.map(t => t ? `<button class="tab ${ui.tab === t[0] ? 'on' : ''}" data-act="tab" data-v="${t[0]}" ${ui.tab === t[0] ? 'aria-current="page"' : ''}>${ic(t[1])}<span>${t[2]}</span></button>`
    : `<button class="fab" data-act="add" aria-label="เพิ่มงานใหม่">${ic('plus')}</button>`).join('');
}

/* ───────── toast ───────── */
function toast(msg, label, fn, ms = 4500) {
  const el = document.createElement('div'); el.className = 'toast';
  el.innerHTML = `<span>${esc(msg)}</span>${label ? `<button>${esc(label)}</button>` : ''}`;
  const close = () => { el.classList.add('out'); setTimeout(() => el.remove(), 200); };
  if (label) el.querySelector('button').onclick = () => { fn(); close(); };
  $('#toasts').appendChild(el); setTimeout(close, ms);
  while ($('#toasts').children.length > 3) $('#toasts').firstChild.remove();
}

/* ───────── editor sheet ───────── */
const sheet = $('#sheet'), form = $('#form');
let draft = null, editingId = null;

function buildStatic() {
  $('#f-pri').innerHTML = PRI.map(p => `<button type="button" data-v="${p.v}">${p.n}</button>`).join('');
  $('#f-cat').innerHTML = `<button type="button" class="chip" data-v="">ไม่ระบุ</button>` + CATS.map(c => `<button type="button" class="chip" data-v="${c.id}"><i class="dot" style="background:${c.color}"></i>${c.name}</button>`).join('');
  $('#f-quick').innerHTML = [['วันนี้', 0], ['พรุ่งนี้', 1], ['สัปดาห์หน้า', 7], ['ไม่กำหนด', null]].map(([n, v]) => `<button type="button" class="chip" data-q="${v}">${n}</button>`).join('');
}
function syncSpan() {
  const s = $('#f-date').value, e = $('#f-end').value;
  $('#f-end').min = s || '';
  if (e && (!s || e <= s)) $('#f-end').value = e = '';
  $('#f-span').textContent = s && e ? `ต่อเนื่อง ${diffDays(e, s) + 1} วัน (${fShort.format(parse(s))} – ${fShort.format(parse(e))})` : '';
}
function syncSheet() {
  syncSpan();
  $('#f-pri').querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.v === draft.pri));
  $('#f-cat').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === draft.cat));
  const d = $('#f-date').value, T = todayStr();
  $('#f-quick').querySelectorAll('button').forEach(b => {
    const q = b.dataset.q; b.classList.toggle('on', q === 'null' ? !d : d === addDays(T, +q));
  });
}
function renderSubs() {
  $('#f-subs').innerHTML = draft.subs.map((s, i) => `<div class="sub ${s.d ? 'd' : ''}"><button type="button" class="chk" data-i="${i}" data-sub="t" aria-label="เสร็จ">${ic('check')}</button><input class="sub-in" data-i="${i}" value="${esc(s.t)}" maxlength="200" placeholder="งานย่อย"><button type="button" class="x" data-i="${i}" data-sub="x" aria-label="ลบ">${ic('x')}</button></div>`).join('');
  $('#f-subs').querySelectorAll('.sub').forEach((el, i) => el.querySelector('.chk').classList.toggle('done-on', draft.subs[i].d));
}
function openEditor(id, presetDate) {
  const t = id ? byId(id) : null; editingId = t ? t.id : null;
  draft = t ? { pri: t.pri || 0, cat: t.cat || '', subs: (t.subs || []).map(s => ({ ...s })) } : { pri: 0, cat: '', subs: [] };
  $('#sheetTitle').textContent = t ? 'แก้ไขงาน' : 'งานใหม่';
  $('#f-title').value = t?.title || ''; $('#f-note').value = t?.note || '';
  $('#f-date').value = t ? t.date || '' : (presetDate ?? (ui.tab === 'calendar' ? ui.sel : todayStr()));
  $('#f-time').value = t?.time || '';
  $('#f-end').value = t?.endDate || '';
  $('#f-repeat').value = t?.repeat || ''; $('#f-remind').value = t?.remind ?? '';
  $('#f-delete').hidden = !t;
  renderSubs(); syncSheet();
  sheet.hidden = false; $('.sheet-body').scrollTop = 0;
  history.pushState({ sheet: 1 }, '');
  if (!t) setTimeout(() => $('#f-title').focus(), 280);
}
function hideSheet() { sheet.hidden = true; document.activeElement?.blur?.(); }
function closeSheet() { if (history.state?.sheet) history.back(); else hideSheet(); }
window.addEventListener('popstate', () => { if (!sheet.hidden) hideSheet(); });

sheet.addEventListener('click', e => {
  if (e.target.closest('[data-close]')) return closeSheet();
  const pri = e.target.closest('#f-pri button'); if (pri) { draft.pri = +pri.dataset.v; return syncSheet(); }
  const cat = e.target.closest('#f-cat button'); if (cat) { draft.cat = cat.dataset.v; return syncSheet(); }
  const q = e.target.closest('#f-quick button');
  if (q) { $('#f-date').value = q.dataset.q === 'null' ? '' : addDays(todayStr(), +q.dataset.q); if (q.dataset.q === 'null') $('#f-end').value = ''; return syncSheet(); }
  if (e.target.closest('#f-endclear')) { $('#f-end').value = ''; return syncSheet(); }
  const sub = e.target.closest('[data-sub]');
  if (sub) { const i = +sub.dataset.i; if (sub.dataset.sub === 'x') draft.subs.splice(i, 1); else draft.subs[i].d = !draft.subs[i].d; return renderSubs(); }
  if (e.target.closest('#f-addsub')) { draft.subs.push({ id: uid(), t: '', d: false }); renderSubs(); return $('#f-subs').querySelector('.sub:last-child .sub-in').focus(); }
  if (e.target.closest('#f-delete')) { const id = editingId; closeSheet(); setTimeout(() => remove(id), 60); }
});
$('#f-date').addEventListener('input', syncSheet);
$('#f-end').addEventListener('input', () => {
  const s = $('#f-date').value, e = $('#f-end').value;
  if (e && !s) $('#f-date').value = todayStr();
  if (e && $('#f-date').value > e) { $('#f-end').value = ''; toast('วันสิ้นสุดต้องหลังวันเริ่ม'); }
  syncSheet();
});
$('#f-subs').addEventListener('input', e => { if (e.target.matches('.sub-in')) draft.subs[+e.target.dataset.i].t = e.target.value; });
$('#f-subs').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches('.sub-in')) { e.preventDefault(); $('#f-addsub').click(); } });

form.addEventListener('submit', e => {
  e.preventDefault();
  const title = $('#f-title').value.trim();
  if (!title) { $('#f-title').focus(); return toast('กรุณาใส่ชื่องาน'); }
  let date = $('#f-date').value, time = $('#f-time').value;
  const repeat = $('#f-repeat').value, remind = $('#f-remind').value;
  if (!date && (repeat || remind !== '' || time)) { date = todayStr(); toast('ตั้งวันที่เป็นวันนี้ให้อัตโนมัติ'); }
  const subs = draft.subs.filter(s => s.t.trim()).map(s => ({ ...s, t: s.t.trim() }));
  let endDate = $('#f-end').value; if (!date || endDate <= date) endDate = '';
  const data = { title, note: $('#f-note').value.trim(), date, endDate, time, pri: draft.pri, cat: draft.cat, subs, repeat, remind };
  if (editingId) {
    const t = byId(editingId); const resched = t.date !== date || t.time !== time || t.remind !== remind;
    Object.assign(t, data); if (resched) t.notified = 0;
  } else state.tasks.push({ id: uid(), done: false, created: Date.now(), notified: 0, ...data });
  if (date) { ui.sel = date; ui.month = new Date(parse(date).getFullYear(), parse(date).getMonth(), 1); }
  save(); closeSheet(); render(); updateBadge(); tick();
});

/* ───────── events ───────── */
let swallow = 0;
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el || sheet.contains(el)) return;
  if (Date.now() < swallow) return;
  const { act, id, v, d, k } = el.dataset;
  switch (act) {
    case 'tab': if (ui.tab !== v) { ui.tab = v; render(); } else app.scrollTo({ top: 0, behavior: 'smooth' }); break;
    case 'add': openEditor(null, d); break;
    case 'edit': openEditor(id); break;
    case 'toggle': toggle(id); break;
    case 'selday': ui.sel = d; { const x = parse(d); if (x.getMonth() !== ui.month.getMonth()) ui.month = new Date(x.getFullYear(), x.getMonth(), 1); } render(); break;
    case 'prevm': shiftMonth(-1); break;
    case 'nextm': shiftMonth(1); break;
    case 'todaym': ui.sel = todayStr(); ui.month = new Date(new Date().getFullYear(), new Date().getMonth(), 1); render(); break;
    case 'filter': ui.filter = v; render(); break;
    case 'cat': ui.cat = v; render(); break;
    case 'set': state.settings[k] = k === 'weekStart' ? +v : v; save(); applyTheme(); render(); break;
    case 'notif': toggleNotify(); break;
    case 'export': exportData(); break;
    case 'import': importData(); break;
    case 'clear': clearDone(); break;
    case 'install': deferredInstall?.prompt(); deferredInstall = null; break;
  }
});
function shiftMonth(n) { ui.month = new Date(ui.month.getFullYear(), ui.month.getMonth() + n, 1); render(); }

app.addEventListener('input', e => {
  if (e.target.id === 'q') { ui.q = e.target.value; $('#allList').innerHTML = allList(); }
});

/* swipe: ปัดซ้ายที่แถวงานเพื่อลบ / ปัดซ้าย-ขวาที่ปฏิทินเพื่อเปลี่ยนเดือน */
let sw = null;
app.addEventListener('pointerdown', e => {
  const task = e.target.closest('.task'), grid = e.target.closest('#grid');
  if ((!task && !grid) || e.target.closest('.chk')) return;
  sw = { task, grid, x: e.clientX, y: e.clientY, dx: 0, lock: null };
});
window.addEventListener('pointermove', e => {
  if (!sw) return;
  const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
  if (!sw.lock && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) sw.lock = Math.abs(dx) > Math.abs(dy) * 1.4 ? 'x' : 'y';
  if (sw.lock === 'x' && sw.task) { sw.dx = Math.min(0, dx); sw.task.style.transition = 'none'; sw.task.style.transform = `translateX(${sw.dx}px)`; }
  if (sw.lock === 'x') sw.dx = dx;
});
const endSwipe = cancel => {
  if (!sw) return; const s = sw; sw = null;
  if (s.lock === 'x') swallow = Date.now() + 350;
  if (s.task) {
    s.task.style.transition = ''; s.task.style.transform = '';
    if (!cancel && s.lock === 'x' && s.dx < -90) { const id = s.task.dataset.id; navigator.vibrate?.(15); remove(id); }
  } else if (s.grid && !cancel && s.lock === 'x' && Math.abs(s.dx) > 60) shiftMonth(s.dx < 0 ? 1 : -1);
};
window.addEventListener('pointerup', () => endSwipe(false));
window.addEventListener('pointercancel', () => endSwipe(true));

/* ───────── theme ───────── */
function applyTheme() {
  const t = state.settings.theme, r = document.documentElement;
  if (t === 'auto') r.removeAttribute('data-theme'); else r.dataset.theme = t;
  const dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  $('#themeColor').content = dark ? '#0b0d14' : '#f4f5f9';
}
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);

/* ───────── data import/export ───────── */
function exportData() {
  const blob = new Blob([JSON.stringify({ app: 'tasknote', version: 1, exported: new Date().toISOString(), ...state }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `tasknote-${todayStr()}.json`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast('ส่งออกข้อมูลแล้ว');
}
function importData() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json,.json';
  inp.onchange = async () => {
    try {
      const d = JSON.parse(await inp.files[0].text());
      if (!Array.isArray(d.tasks)) throw 0;
      const ids = new Set(state.tasks.map(t => t.id)); let n = 0;
      d.tasks.forEach(t => {
        if (!t || typeof t.title !== 'string') return;
        const clean = { id: String(t.id || uid()), title: t.title.slice(0, 200), note: String(t.note || '').slice(0, 2000), date: /^\d{4}-\d{2}-\d{2}$/.test(t.date) ? t.date : '', endDate: /^\d{4}-\d{2}-\d{2}$/.test(t.endDate) && /^\d{4}-\d{2}-\d{2}$/.test(t.date) && t.endDate > t.date ? t.endDate : '', time: /^\d{2}:\d{2}$/.test(t.time) ? t.time : '', pri: [0, 1, 2, 3].includes(t.pri) ? t.pri : 0, cat: CAT[t.cat] ? t.cat : '', done: !!t.done, doneAt: +t.doneAt || 0, subs: Array.isArray(t.subs) ? t.subs.map(s => ({ id: String(s.id || uid()), t: String(s.t || '').slice(0, 200), d: !!s.d })) : [], repeat: ['daily', 'weekday', 'weekly', 'monthly'].includes(t.repeat) ? t.repeat : '', remind: t.remind === '' || t.remind == null ? '' : String(t.remind), created: +t.created || Date.now(), notified: 0 };
        const i = state.tasks.findIndex(x => x.id === clean.id);
        if (i >= 0) state.tasks[i] = clean; else state.tasks.push(clean);
        ids.add(clean.id); n++;
      });
      save(); render(); updateBadge(); toast(`นำเข้า ${n} งานแล้ว`);
    } catch (e) { toast('ไฟล์ไม่ถูกต้อง'); }
  };
  inp.click();
}
function clearDone() {
  const n = state.tasks.filter(t => t.done).length;
  if (!n) return toast('ไม่มีงานที่เสร็จแล้ว');
  if (!confirm(`ล้างงานที่เสร็จแล้ว ${n} รายการ?`)) return;
  const backup = state.tasks.slice();
  state.tasks = state.tasks.filter(t => !t.done); save(); render();
  toast(`ล้าง ${n} งานแล้ว`, 'เลิกทำ', () => { state.tasks = backup; save(); render(); });
}

/* ───────── notifications / badge ───────── */
async function toggleNotify() {
  const s = state.settings;
  if (s.notify) { s.notify = false; save(); return render(); }
  if (!('Notification' in window)) return toast('เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน — บน iPhone ให้เพิ่มแอพไปหน้าจอโฮมก่อน', null, null, 7000);
  const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (perm === 'granted') { s.notify = true; toast('เปิดการแจ้งเตือนแล้ว'); } else toast('ไม่ได้รับอนุญาตให้แจ้งเตือน — เปิดได้ที่การตั้งค่าเบราว์เซอร์');
  save(); render();
}
function dueMs(t) { if (!t.date) return null; const [y, m, d] = t.date.split('-').map(Number), [h, mi] = (t.time || '09:00').split(':').map(Number); return new Date(y, m - 1, d, h, mi).getTime(); }
async function notify(t, when) {
  const body = when <= 0 ? 'ถึงเวลาแล้ว' : `อีก ${Math.max(1, Math.round(when / 6e4))} นาที`;
  toast(`⏰ ${t.title} — ${body}`, null, null, 8000);
  navigator.vibrate?.([120, 60, 120]);
  if (state.settings.notify && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      const opts = { body, tag: t.id, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' };
      if (reg) reg.showNotification(t.title, opts); else new Notification(t.title, opts);
    } catch (e) { /* ignore */ }
  }
}
function tick() {
  const now = Date.now(); let changed = false;
  state.tasks.forEach(t => {
    if (t.done || t.remind === '' || t.remind == null) return;
    const due = dueMs(t); if (due == null) return;
    const at = due - (+t.remind) * 6e4, key = at;
    if (now >= at && now - due < 864e5 && t.notified !== key) { t.notified = key; changed = true; notify(t, due - now); }
  });
  if (changed) { save(); render(); }
}
function updateBadge() {
  const n = state.tasks.filter(t => !t.done && t.date && t.date <= todayStr()).length;
  try { n ? navigator.setAppBadge?.(n) : navigator.clearAppBadge?.(); } catch (e) { /* ignore */ }
}

/* ───────── boot ───────── */
let deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; if (ui.tab === 'settings') render(); });
window.addEventListener('appinstalled', () => { deferredInstall = null; toast('ติดตั้งแอพแล้ว'); });

let dayMark = todayStr();
function onWake() { if (dayMark !== todayStr()) { dayMark = todayStr(); if (ui.sel < dayMark && ui.tab !== 'calendar') ui.sel = dayMark; } render(); tick(); updateBadge(); }
document.addEventListener('visibilitychange', () => { if (!document.hidden) onWake(); });
window.addEventListener('focus', () => { if (sheet.hidden) onWake(); });
setInterval(() => { if (!document.hidden) { tick(); if (dayMark !== todayStr() && sheet.hidden) onWake(); } }, 20000);

buildStatic(); applyTheme(); render(); updateBadge(); tick();
if (new URLSearchParams(location.search).get('new')) setTimeout(() => openEditor(null), 300);
navigator.storage?.persist?.();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
