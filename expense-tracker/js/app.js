/* BlueLedger - Expense Tracker | HTML + CSS + vanilla JavaScript
   Data is stored in the browser (localStorage). No server needed. */
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const LS = {
  get: (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v))
};
const EXP_CATS = ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Education', 'Entertainment', 'Other'];
const INC_CATS = ['Salary', 'Freelance', 'Gift', 'Other'];
const COLORS = ['#1F5BFF', '#7CC4FF', '#0A1F44', '#4b8bff', '#a9d6ff', '#2b3f73', '#6fa3ff', '#cfe3ff'];
const inr = n => '\u20B9' + Math.round(n).toLocaleString('en-IN');
const today = () => new Date().toISOString().slice(0, 10);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let session = LS.get('bl_session', null);   // email of logged-in user
let tx = [];                                // transactions of that user
let budget = 0;

/* ---------- helpers ---------- */
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.id); toast.id = setTimeout(() => t.classList.remove('show'), 2400);
}
async function hash(p) {
  if (window.crypto && crypto.subtle) {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(p));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  }
  let h = 0; for (const c of p) h = (h * 31 + c.charCodeAt(0)) | 0; return 'f' + h;
}
const users = () => LS.get('bl_users', {});
const save = () => { LS.set('bl_tx_' + session, tx); LS.set('bl_bud_' + session, budget); };
function load() { tx = LS.get('bl_tx_' + session, []); budget = LS.get('bl_bud_' + session, 0); }
const ym = d => d.slice(0, 7);
const thisMonth = () => today().slice(0, 7);

/* ---------- demo data ---------- */
async function seedDemo() {
  const u = users();
  if (u['demo@blueledger.com']) return;
  u['demo@blueledger.com'] = { name: 'Demo User', pass: await hash('Demo@1234') };
  LS.set('bl_users', u);
  const items = [['Salary', 'income', 'Salary', 45000, 1], ['Freelance project', 'income', 'Freelance', 8000, 12],
    ['Groceries', 'expense', 'Food', 3200, 3], ['Metro card', 'expense', 'Transport', 800, 5], ['Electricity bill', 'expense', 'Bills', 2100, 8],
    ['Movie night', 'expense', 'Entertainment', 900, 14], ['Online course', 'expense', 'Education', 2500, 16], ['New shoes', 'expense', 'Shopping', 2800, 20], ['Lunch out', 'expense', 'Food', 650, 22]];
  const out = []; let id = 1;
  for (let m = 0; m < 6; m++) {
    const base = new Date(); base.setDate(1); base.setMonth(base.getMonth() - m);
    items.forEach(([title, type, category, amt, day], i) => {
      const d = new Date(base.getFullYear(), base.getMonth(), day);
      if (d > new Date()) return;
      const jitter = type === 'expense' ? Math.round(amt * (0.8 + ((i * 7 + m * 3) % 5) / 10)) : amt;
      out.push({ id: id++, title, type, category, amount: jitter, date: d.toLocaleDateString('en-CA') });
    });
  }
  LS.set('bl_tx_demo@blueledger.com', out);
  LS.set('bl_bud_demo@blueledger.com', 15000);
}

/* ---------- routing (hash based, works on GitHub Pages) ---------- */
const PROTECTED = ['dashboard', 'transactions', 'reports'];
function route() {
  let v = (location.hash.replace('#/', '') || 'home');
  if (!$('#view-' + v)) v = 'home';
  if (PROTECTED.includes(v) && !session) { v = 'auth'; toast('Log in to see that page.'); }
  $$('.view').forEach(s => s.hidden = s.id !== 'view-' + v);
  $$('[data-nav]').forEach(a => a.classList.toggle('on', a.dataset.nav === v));
  $('#menu').classList.remove('open');
  window.scrollTo(0, 0);
  ({ dashboard: renderDash, transactions: renderTx, reports: renderReports }[v] || (() => { }))();
}
function updateNav() {
  $('#navAuth').hidden = !!session; $('#logoutBtn').hidden = !session;
}

/* ---------- auth ---------- */
function strength(p) {
  let s = 0; if (p.length >= 8) s++; if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++; if (/\d/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}
function login(email) {
  session = email; LS.set('bl_session', email); load(); updateNav(); location.hash = '#/dashboard';
  setTimeout(() => { const s = budgetState(); if (s.level === 2) showModal(s); }, 400);
}

$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const email = $('#lEmail').value.trim().toLowerCase(), pass = $('#lPass').value, u = users()[email];
  if (!email || !pass) return $('#lErr').textContent = 'Enter your email and password.';
  if (!u || u.pass !== await hash(pass)) return $('#lErr').textContent = 'Email or password is incorrect. Check both and try again.';
  $('#lErr').textContent = ''; toast('Welcome back, ' + u.name.split(' ')[0] + '!'); login(email);
});
$('#regForm').addEventListener('submit', async e => {
  e.preventDefault();
  const name = $('#rName').value.trim(), email = $('#rEmail').value.trim().toLowerCase(), p = $('#rPass').value, p2 = $('#rPass2').value, err = $('#rErr');
  if (name.length < 2) return err.textContent = 'Enter your full name.';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return err.textContent = 'Enter a valid email address.';
  if (strength(p) < 3 || p.length < 8) return err.textContent = 'Password needs 8+ characters with upper case, lower case and a number.';
  if (p !== p2) return err.textContent = 'The two passwords do not match.';
  const u = users();
  if (u[email]) return err.textContent = 'This email is already registered. Log in instead.';
  u[email] = { name, pass: await hash(p) }; LS.set('bl_users', u);
  err.textContent = ''; e.target.reset(); toast('Account created. Welcome, ' + name.split(' ')[0] + '!'); login(email);
});
$('#rPass').addEventListener('input', e => {
  const s = strength(e.target.value), bar = $('#meterBar');
  bar.style.width = s * 25 + '%'; bar.style.background = ['#e5484d', '#e5484d', '#f59e0b', '#1F5BFF', '#0e9f6e'][s];
  $('#meterTxt').textContent = ['Use 8+ characters with upper, lower case and a number.', 'Weak', 'Fair', 'Good', 'Strong'][s];
});
$$('.tab').forEach(b => b.addEventListener('click', () => {
  $$('.tab').forEach(t => t.classList.toggle('active', t === b));
  $('#loginForm').hidden = b.dataset.tab !== 'login'; $('#regForm').hidden = b.dataset.tab !== 'register';
}));
$$('[data-eye]').forEach(b => b.addEventListener('click', () => {
  const i = $('#' + b.dataset.eye); i.type = i.type === 'password' ? 'text' : 'password'; b.textContent = i.type === 'password' ? 'Show' : 'Hide';
}));
const fillDemo = () => { $('#lEmail').value = 'demo@blueledger.com'; $('#lPass').value = 'Demo@1234'; };
$('#fillDemo').addEventListener('click', fillDemo);
$('#tryDemo').addEventListener('click', () => setTimeout(fillDemo, 50));
$('#logoutBtn').addEventListener('click', () => { session = null; localStorage.removeItem('bl_session'); updateNav(); toast('You are logged out.'); location.hash = '#/home'; });
$('#burger').addEventListener('click', () => $('#menu').classList.toggle('open'));

/* ---------- home live preview ---------- */
let liveSum = 0;
$('#liveChips').innerHTML = EXP_CATS.slice(0, 6).map(c => `<button type="button">${c}</button>`).join('');
$('#liveChips').addEventListener('click', e => {
  if (e.target.tagName !== 'BUTTON') return;
  liveSum += Number($('#liveAmt').value) || 0; $('#liveTotal').textContent = inr(liveSum);
});

/* ---------- charts (plain canvas) ---------- */
function setup(c, h) {
  const dpr = window.devicePixelRatio || 1, w = c.parentElement.clientWidth - 48;
  c.width = w * dpr; c.height = h * dpr; c.style.height = h + 'px';
  const x = c.getContext('2d'); x.scale(dpr, dpr); x.clearRect(0, 0, w, h); return [x, w, h];
}
function donut(c, data) {
  const [x, w, h] = setup(c, 260), total = data.reduce((a, d) => a + d.v, 0);
  const cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 8;
  if (!total) { x.fillStyle = '#5b6f93'; x.font = '15px DM Sans'; x.textAlign = 'center'; x.fillText('No spending this month yet', cx, cy); return; }
  let a = -Math.PI / 2;
  data.forEach((d, i) => { const s = d.v / total * Math.PI * 2; x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, R, a, a + s); x.fillStyle = COLORS[i % COLORS.length]; x.fill(); a += s; });
  x.beginPath(); x.arc(cx, cy, R * 0.6, 0, 7); x.fillStyle = '#fff'; x.fill();
  x.fillStyle = '#0A1F44'; x.textAlign = 'center'; x.font = '700 22px Bricolage Grotesque, sans-serif'; x.fillText(inr(total), cx, cy + 6);
}
function bars(c, months) {
  const [x, w, h] = setup(c, 280), pad = 34, bw = (w - pad) / months.length, max = Math.max(1, ...months.flatMap(m => [m.inc, m.exp]));
  x.strokeStyle = '#d3e2fb'; x.fillStyle = '#5b6f93'; x.font = '12px DM Sans'; x.textAlign = 'center';
  for (let i = 0; i <= 4; i++) { const y = h - 30 - (h - 50) * i / 4; x.beginPath(); x.moveTo(pad, y); x.lineTo(w, y); x.stroke(); }
  months.forEach((m, i) => {
    const gx = pad + i * bw + bw * 0.15, k = bw * 0.33;
    [[m.inc, '#7CC4FF'], [m.exp, '#1F5BFF']].forEach(([v, col], j) => {
      const bh = (h - 50) * v / max; x.fillStyle = col; x.fillRect(gx + j * k, h - 30 - bh, k - 3, bh);
    });
    x.fillStyle = '#5b6f93'; x.fillText(m.label, pad + i * bw + bw / 2, h - 10);
  });
  x.textAlign = 'left'; x.fillStyle = '#7CC4FF'; x.fillRect(pad, 2, 10, 10); x.fillStyle = '#16294d'; x.fillText('Income', pad + 14, 11);
  x.fillStyle = '#1F5BFF'; x.fillRect(pad + 80, 2, 10, 10); x.fillStyle = '#16294d'; x.fillText('Spending', pad + 94, 11);
}

/* ---------- budget alerts ---------- */
// level 0 = safe, 1 = warning (80%+), 2 = over budget
function budgetState() {
  const exp = sum(tx.filter(r => ym(r.date) === thisMonth()), 'expense');
  const pct = budget ? exp / budget * 100 : 0;
  return { exp, pct, level: !budget ? 0 : pct >= 100 ? 2 : pct >= 80 ? 1 : 0 };
}
function showModal(s) {
  const over = s.level === 2;
  $('#mBox').classList.toggle('over', over);
  $('#mIcon').textContent = '!';
  $('#mTitle').textContent = over ? 'You have crossed your monthly budget' : 'You are close to your monthly budget';
  $('#mBody').textContent = over
    ? `You have spent ${inr(s.exp)} this month, which is ${inr(s.exp - budget)} over your ${inr(budget)} budget. Review your spending or raise the budget on the Reports page.`
    : `You have used ${Math.round(s.pct)}% of your ${inr(budget)} budget. Only ${inr(budget - s.exp)} is left this month.`;
  $('#budModal').hidden = false; $('#mClose').focus();
  if (over && navigator.vibrate) navigator.vibrate([200, 100, 200]);
}
const closeModal = () => { $('#budModal').hidden = true; };
$('#mClose').addEventListener('click', closeModal);
$('#mReview').addEventListener('click', closeModal);
$('#budModal').addEventListener('click', e => { if (e.target.id === 'budModal') closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
// Pop the alert only when the level goes UP (safe -> warning -> over), so it never nags on every change.
function checkBudget(prevLevel) { const s = budgetState(); if (s.level > prevLevel) showModal(s); }

/* ---------- dashboard ---------- */
const sum = (arr, t) => arr.filter(r => r.type === t).reduce((a, r) => a + r.amount, 0);
function renderDash() {
  if (!session) return;
  const name = users()[session]?.name || 'there', mo = tx.filter(r => ym(r.date) === thisMonth());
  const inc = sum(mo, 'income'), exp = sum(mo, 'expense'), bal = sum(tx, 'income') - sum(tx, 'expense');
  $('#welcome').textContent = 'Hello, ' + name.split(' ')[0];
  $('#sBal').textContent = inr(bal); $('#sInc').textContent = inr(inc); $('#sExp').textContent = inr(exp);
  const pct = budget ? Math.round(exp / budget * 100) : 0;
  $('#sBud').textContent = budget ? pct + '%' : 'Not set';
  const bar = $('#budBar'); bar.style.width = Math.min(pct, 100) + '%'; bar.style.background = pct >= 100 ? '#e5484d' : pct >= 80 ? '#f59e0b' : '#1F5BFF';
  $('#budTxt').textContent = !budget ? 'Set a monthly budget on the Reports page.' : pct >= 100 ? `You are ${inr(exp - budget)} over your ${inr(budget)} budget.` : `${inr(budget - exp)} left of your ${inr(budget)} budget.`;
  const al = $('#budAlert'), st = budgetState();
  al.hidden = st.level === 0; al.classList.toggle('over', st.level === 2);
  al.textContent = st.level === 2 ? `Budget alert: you are ${inr(exp - budget)} over your monthly budget.` : st.level === 1 ? `Heads up: you have used ${pct}% of your monthly budget.` : '';
  const by = {}; mo.filter(r => r.type === 'expense').forEach(r => by[r.category] = (by[r.category] || 0) + r.amount);
  const data = Object.entries(by).map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v);
  donut($('#donut'), data);
  $('#legend').innerHTML = data.map((d, i) => `<li><i style="background:${COLORS[i % COLORS.length]}"></i>${d.k} ${inr(d.v)}</li>`).join('');
  const rec = [...tx].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).slice(0, 5);
  $('#recent').innerHTML = rec.length ? rec.map(r => `<li><span>${esc(r.title)}<br><small class="hint">${r.date} &middot; ${r.category}</small></span><b class="${r.type === 'income' ? 'pos-t' : ''}" style="color:${r.type === 'income' ? '#0e9f6e' : '#e5484d'}">${r.type === 'income' ? '+' : '-'}${inr(r.amount)}</b></li>`).join('') : '<li>No activity yet. Add your first transaction.</li>';
}

/* ---------- transactions ---------- */
function fillCats(sel, list, all) { sel.innerHTML = (all ? '<option value="">All categories</option>' : '') + list.map(c => `<option>${c}</option>`).join(''); }
fillCats($('#fCat'), [...EXP_CATS, ...INC_CATS.filter(c => !EXP_CATS.includes(c))], true);
const syncCats = () => fillCats($('#txCat'), $('#txType').value === 'income' ? INC_CATS : EXP_CATS);
$('#txType').addEventListener('change', syncCats); syncCats();

function resetForm() { $('#txForm').reset(); $('#txId').value = ''; $('#txDate').value = today(); $('#txSave').textContent = 'Add transaction'; $('#txCancel').hidden = true; syncCats(); }
$('#txCancel').addEventListener('click', resetForm);
$('#txForm').addEventListener('submit', e => {
  e.preventDefault();
  const title = $('#txTitle').value.trim(), amount = parseFloat($('#txAmt').value), date = $('#txDate').value, err = $('#txErr');
  if (!title) return err.textContent = 'Give the transaction a title.';
  if (!(amount > 0)) return err.textContent = 'Amount must be greater than zero.';
  if (!date) return err.textContent = 'Pick a date.';
  err.textContent = '';
  const rec = { title, amount, date, type: $('#txType').value, category: $('#txCat').value }, id = $('#txId').value;
  const before = budgetState().level;
  if (id) { tx = tx.map(r => r.id == id ? { ...r, ...rec } : r); toast('Transaction updated.'); }
  else { rec.id = Date.now(); tx.push(rec); toast('Transaction added.'); }
  save(); resetForm(); renderTx(); checkBudget(before);
});
['fSearch', 'fType', 'fCat'].forEach(id => $('#' + id).addEventListener('input', renderTx));
function renderTx() {
  if (!session) return;
  if (!$('#txDate').value) $('#txDate').value = today();
  const q = $('#fSearch').value.toLowerCase(), t = $('#fType').value, c = $('#fCat').value;
  const rows = tx.filter(r => r.title.toLowerCase().includes(q) && (!t || r.type === t) && (!c || r.category === c)).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  $('#txEmpty').hidden = rows.length > 0;
  $('#txBody').innerHTML = rows.map(r => `<tr><td>${r.date}</td><td>${esc(r.title)}</td><td><span class="tag">${r.category}</span></td>
    <td class="r" style="color:${r.type === 'income' ? '#0e9f6e' : '#e5484d'};font-weight:700">${r.type === 'income' ? '+' : '-'}${inr(r.amount)}</td>
    <td class="r"><button class="icon" data-edit="${r.id}">Edit</button><button class="icon del" data-del="${r.id}">Delete</button></td></tr>`).join('');
}
$('#txBody').addEventListener('click', e => {
  const ed = e.target.dataset.edit, dl = e.target.dataset.del;
  if (ed) {
    const r = tx.find(x => x.id == ed); $('#txId').value = r.id; $('#txTitle').value = r.title; $('#txAmt').value = r.amount;
    $('#txType').value = r.type; syncCats(); $('#txCat').value = r.category; $('#txDate').value = r.date;
    $('#txSave').textContent = 'Save changes'; $('#txCancel').hidden = false; $('#txTitle').focus(); window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  if (dl && confirm('Delete this transaction?')) { tx = tx.filter(r => r.id != dl); save(); renderTx(); toast('Transaction deleted.'); }
});
$('#csvBtn').addEventListener('click', () => {
  if (!tx.length) return toast('Nothing to export yet.');
  const csv = ['Date,Title,Type,Category,Amount', ...tx.map(r => [r.date, '"' + r.title.replace(/"/g, '""') + '"', r.type, r.category, r.amount].join(','))].join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'blueledger-transactions.csv'; a.click();
  toast('CSV downloaded.');
});

/* ---------- reports ---------- */
function renderReports() {
  if (!session) return;
  const ms = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
    const key = d.toLocaleDateString('en-CA').slice(0, 7), rows = tx.filter(r => ym(r.date) === key);
    ms.push({ label: d.toLocaleString('en', { month: 'short' }), inc: sum(rows, 'income'), exp: sum(rows, 'expense') });
  }
  bars($('#bars'), ms);
  $('#budInput').value = budget || '';
  const mo = tx.filter(r => ym(r.date) === thisMonth() && r.type === 'expense'), by = {};
  mo.forEach(r => by[r.category] = (by[r.category] || 0) + r.amount);
  const top = Object.entries(by).sort((a, b) => b[1] - a[1])[0], cur = ms[5], prev = ms[4], ins = [];
  ins.push(top ? `<li><span>Top category</span><b>${top[0]} (${inr(top[1])})</b></li>` : '<li>No spending recorded this month.</li>');
  if (prev.exp) { const ch = Math.round((cur.exp - prev.exp) / prev.exp * 100); ins.push(`<li><span>Spending vs last month</span><b>${ch >= 0 ? '+' : ''}${ch}%</b></li>`); }
  const avg = ms.reduce((a, m) => a + m.exp, 0) / 6; ins.push(`<li><span>6-month average spend</span><b>${inr(avg)}</b></li>`);
  ins.push(`<li><span>Savings this month</span><b>${inr(cur.inc - cur.exp)}</b></li>`);
  $('#insights').innerHTML = ins.join('');
}
$('#budForm').addEventListener('submit', e => {
  e.preventDefault(); const v = parseFloat($('#budInput').value);
  if (!(v >= 0)) return toast('Enter a budget of zero or more.');
  const before = budgetState().level;
  budget = v; save(); toast('Budget saved.'); renderReports(); checkBudget(before);
});

/* ---------- init ---------- */
window.addEventListener('hashchange', route);
window.addEventListener('resize', () => { const v = location.hash; if (v === '#/dashboard') renderDash(); if (v === '#/reports') renderReports(); });
(async function init() {
  await seedDemo();
  if (session && !users()[session]) { session = null; localStorage.removeItem('bl_session'); }
  if (session) load();
  updateNav(); resetForm(); route();
})();
