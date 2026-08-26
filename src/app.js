/**
 * Orquestrador: estado em memória, ações e ciclo de render.
 *
 * Fluxo: config.js + store → S (estado) → rebuild() monta o plano →
 * render() desenha a view atual. Toda ação muda S, persiste e chama render().
 */
import { CONFIG } from '../config.js';
import { PARTICIPANTS, byId, mail, short, initials, TIERS } from './data/participants.js';
import { buildPlan, pairKey, pct } from './core/schedule.js';
import { createStore } from './core/store.js';
import {
  teamsMeetingLink, teamsChatLink, buildICS, buildCSV, download
} from './core/integrations.js';
import { paintIcons } from './ui/icons.js';
import { fmtDate, fmtLong, todayISO, esc } from './ui/format.js';
import { viewMe, viewRounds, viewMatrix, viewPeople, viewConfig, whoList } from './ui/views.js';

/* ─────────────── estado ─────────────── */
const S = {
  me: null,
  view: 'me',
  cfg: { ...CONFIG.defaults },
  status: {},
  rounds: [], organizers: {}, dates: [], plan: {},
  meFilter: 'all', meQuery: '',
  storeInfo: { driver: '—', shared: false, degraded: false },

  activeIds: () => PARTICIPANTS.filter((p) => !S.cfg.disabled.includes(p.id)).map((p) => p.id),
  mailOf: (id) => S.cfg.emails[id] || mail(byId(id)),
  chatLink: (otherId) => teamsChatLink(otherId, { cfg: S.cfg, mailOf: S.mailOf }),

  statsAll() {
    const total = Object.keys(S.plan).length;
    let done = 0, sched = 0, late = 0;
    const today = todayISO();
    for (const k of Object.keys(S.plan)) {
      const st = S.status[k];
      if (st?.st === 'done') { done++; continue; }
      if (st?.st === 'sched') sched++;
      if (S.plan[k].date < today) late++;
    }
    return { total, done, sched, late, pending: total - done };
  },

  statsOf(id) {
    let done = 0, total = 0, late = 0;
    const today = todayISO();
    for (const k of Object.keys(S.plan)) {
      const [a, b] = k.split('-').map(Number);
      if (a !== id && b !== id) continue;
      total++;
      if (S.status[k]?.st === 'done') done++;
      else if (S.plan[k].date < today) late++;
    }
    return { done, total, late, pct: pct(done, total) };
  }
};

let store;

/* ─────────────── plano ─────────────── */
function rebuild() {
  const { rounds, organizers, dates, plan } = buildPlan(S.activeIds(), {
    start: S.cfg.start,
    weekdays: S.cfg.weekdays
  });
  Object.assign(S, { rounds, organizers, dates, plan });
}

/* ─────────────── feedback ─────────────── */
let toastTimer;
function toast(msg, icon = 'check') {
  const el = document.getElementById('toast');
  el.innerHTML = `<span data-ic="${icon}" data-sz="16" style="color:var(--ok)"></span>${esc(msg)}`;
  paintIcons(el);
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), 3400);
}

const copy = (text, msg) =>
  navigator.clipboard.writeText(text)
    .then(() => toast(msg || 'Copiado.', 'copy'))
    .catch(() => toast('Não consegui copiar.', 'alert'));

/* ─────────────── render ─────────────── */
const VIEWS = { me: viewMe, rounds: viewRounds, matrix: viewMatrix, people: viewPeople, config: viewConfig };

function render() {
  const main = document.getElementById('main');
  main.innerHTML = (VIEWS[S.view] || viewMe)(S);
  paintIcons(main);

  document.querySelectorAll('[data-view]').forEach((b) => {
    if (b.dataset.view === S.view) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });

  const s = S.statsAll();
  document.getElementById('globalBar').style.width = `${pct(s.done, s.total)}%`;
  document.getElementById('globalTxt').textContent = `${s.done} / ${s.total}`;
  document.getElementById('driveTop').href = S.cfg.driveUrl;

  const me = S.me ? byId(S.me) : null;
  document.getElementById('whoName').textContent = me ? short(me.n) : 'Identificar-se';
  const avatar = document.getElementById('whoAv');
  avatar.textContent = me ? initials(me.n) : '?';
  avatar.className = `avatar ${me ? TIERS[me.t].cls : 'av-ger'} !w-[20px] !h-[20px] !rounded-md !text-[9px]`;
  document.getElementById('navMeCount').textContent = me ? (() => {
    const st = S.statsOf(S.me);
    return `${st.done}/${st.total}`;
  })() : '';
}

/** Re-render preservando o foco e o cursor de um input (usado na busca). */
function renderKeepFocus(id) {
  const before = document.getElementById(id);
  const pos = before ? before.selectionStart : null;
  render();
  const after = document.getElementById(id);
  if (after) {
    after.focus();
    try { after.setSelectionRange(pos, pos); } catch { /* input date/time não suporta */ }
  }
}

/* ─────────────── ações ─────────────── */
const App = {
  setView(v) { S.view = v; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); },
  setFilter(f) { S.meFilter = f; render(); },
  setQuery(q) { S.meQuery = q; renderKeepFocus('meSearch'); },

  async setStatus(a, b, st, dt, nt) {
    const k = pairKey(a, b);
    if (!st) delete S.status[k];
    else S.status[k] = { st, dt: dt || '', nt: nt || '', by: S.me ? short(byId(S.me).n) : '' };
    await store.saveStatus(S.status);
    render();
  },

  openTeams(a, b) {
    const pl = S.plan[pairKey(a, b)];
    window.open(
      teamsMeetingLink(a, b, { date: pl?.date, cfg: S.cfg, mailOf: S.mailOf }),
      '_blank', 'noopener'
    );
    if (!S.status[pairKey(a, b)]) App.setStatus(a, b, 'sched', pl?.date || '');
  },

  openDone(a, b) {
    const k = pairKey(a, b);
    const cur = S.status[k] || {};
    const pl = S.plan[k];
    const today = todayISO();

    document.getElementById('doneTitle').textContent = `${short(byId(a).n)} × ${short(byId(b).n)}`;
    document.getElementById('doneSub').textContent =
      `Rodada ${pl?.round ?? '—'} · previsto para ${pl ? fmtDate(pl.date) : '—'}`;
    document.getElementById('doneDate').value = cur.dt || (pl && pl.date <= today ? pl.date : today);
    document.getElementById('doneWho').value = S.me ? short(byId(S.me).n) : '—';
    document.getElementById('doneNote').value = cur.nt || '';
    document.getElementById('doneUndo').style.display = cur.st === 'done' ? '' : 'none';

    const dlg = document.getElementById('doneDlg');
    dlg.onclose = () => {
      if (dlg.returnValue === 'ok') {
        App.setStatus(a, b, 'done',
          document.getElementById('doneDate').value,
          document.getElementById('doneNote').value);
        toast('1x1 registrado como concluído.');
      } else if (dlg.returnValue === 'undo') {
        App.setStatus(a, b, null);
        toast('Registro removido.', 'refresh');
      }
    };
    dlg.showModal();
  },

  openWho() {
    const input = document.getElementById('whoSearch');
    input.value = '';
    App.drawWho('');
    document.getElementById('whoDlg').showModal();
    setTimeout(() => input.focus(), 60);
  },

  drawWho(q) {
    const box = document.getElementById('whoList');
    box.innerHTML = whoList(q, S.me);
    paintIcons(box);
  },

  pickMe(id) {
    S.me = id;
    store.setMe(id);
    document.getElementById('whoDlg').close();
    App.setView('me');
    toast(`Bem-vindo(a), ${short(byId(id).n)}.`, 'user');
  },

  async applyConfig() {
    const weekdays = [...document.querySelectorAll('[data-day]')].filter((i) => i.checked).map((i) => +i.dataset.day);
    if (!weekdays.length) return toast('Escolha pelo menos um dia da semana.', 'alert');
    S.cfg.start = document.getElementById('cStart').value || S.cfg.start;
    S.cfg.time = document.getElementById('cTime').value || S.cfg.time;
    S.cfg.duration = +document.getElementById('cDur').value;
    S.cfg.driveUrl = document.getElementById('cDrive').value.trim() || S.cfg.driveUrl;
    S.cfg.weekdays = weekdays;
    await store.saveConfig(S.cfg);
    rebuild();
    render();
    toast('Rodízio recalculado.');
  },

  async fixEmail(id, value) {
    const v = value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return toast('E-mail inválido.', 'alert');
    S.cfg.emails[id] = v;
    await store.saveConfig(S.cfg);
    render();
    toast('E-mail atualizado.');
  },

  async toggleActive(id) {
    S.cfg.disabled = S.cfg.disabled.includes(id)
      ? S.cfg.disabled.filter((x) => x !== id)
      : [...S.cfg.disabled, id];
    await store.saveConfig(S.cfg);
    rebuild();
    render();
    toast(S.cfg.disabled.includes(id)
      ? `${short(byId(id).n)} saiu do rodízio.`
      : `${short(byId(id).n)} voltou ao rodízio.`, 'refresh');
  },

  async wipe() {
    if (!confirm('Isso apaga TODOS os registros de 1x1 concluídos e agendados, para todos os participantes. Continuar?')) return;
    S.status = {};
    await store.saveStatus(S.status);
    render();
    toast('Registros zerados.', 'refresh');
  },

  myPairs() {
    return Object.keys(S.plan)
      .filter((k) => { const [a, b] = k.split('-').map(Number); return a === S.me || b === S.me; })
      .sort((x, y) => S.plan[x].round - S.plan[y].round);
  },

  downloadMyICS() {
    if (!S.me) return App.openWho();
    const items = App.myPairs().map((k) => {
      const [a, b] = k.split('-').map(Number);
      return { a, b, date: S.plan[k].date };
    });
    download(
      `meus-1x1-${short(byId(S.me).n).toLowerCase().replace(/\s+/g, '-')}.ics`,
      buildICS(items, { cfg: S.cfg, mailOf: S.mailOf, organizers: S.organizers }),
      'text/calendar'
    );
    toast('Agenda baixada. Abra o arquivo para importar no Outlook/Teams.', 'download');
  },

  downloadAllICS() {
    const items = Object.keys(S.plan).map((k) => {
      const [a, b] = k.split('-').map(Number);
      return { a, b, date: S.plan[k].date };
    });
    download('rodizio-1x1-completo.ics',
      buildICS(items, { cfg: S.cfg, mailOf: S.mailOf, organizers: S.organizers }), 'text/calendar');
    toast(`Arquivo com os ${items.length} encontros baixado.`, 'download');
  },

  exportCSV() {
    download('rodizio-1x1-five-behaviors.csv',
      buildCSV({ plan: S.plan, status: S.status, organizers: S.organizers, mailOf: S.mailOf, fmtDate }),
      'text/csv');
    toast('CSV exportado.');
  },

  copyMyList() {
    if (!S.me) return App.openWho();
    const lines = App.myPairs().map((k) => {
      const [a, b] = k.split('-').map(Number);
      const other = a === S.me ? b : a;
      const st = S.status[k];
      const who = st?.st === 'done' ? 'CONCLUÍDO' : S.organizers[k] === S.me ? 'você convida' : 'ele(a) convida';
      return `R${String(S.plan[k].round).padStart(2, '0')} ${fmtDate(S.plan[k].date)} ${S.cfg.time} — ${byId(other).n} (${byId(other).c}) — ${who}`;
    });
    copy(`Meus 1x1 · Five Behaviors — ${byId(S.me).n}\n\n${lines.join('\n')}\n\nRelatórios: ${S.cfg.driveUrl}`, 'Lista copiada.');
  },

  copyEmails() {
    copy(S.activeIds().map((id) => S.mailOf(id)).join('; '), 'E-mails copiados.');
  },

  toggleBW() {
    const on = document.documentElement.dataset.bw !== '1';
    document.documentElement.dataset.bw = on ? '1' : '0';
    toast(on ? 'Modo preto e branco ativado.' : 'Cores restauradas.', 'contrast');
  }
};
window.App = App;

/* ─────────────── boot ─────────────── */
async function boot() {
  store = await createStore(CONFIG.storage);
  S.storeInfo = { driver: store.driver, shared: store.shared, degraded: store.degraded };

  const data = await store.load();
  S.status = data.status || {};
  S.cfg = { ...CONFIG.defaults, ...(data.config || {}) };
  S.cfg.emails = { ...(data.config?.emails || {}) };
  S.cfg.disabled = [...(data.config?.disabled || [])];
  S.me = store.getMe();

  rebuild();
  paintIcons(document);
  render();

  // outra pessoa (ou outra aba) alterou algo → atualiza sem recarregar
  store.watch((remote) => {
    S.status = remote.status || {};
    S.cfg = { ...CONFIG.defaults, ...(remote.config || {}) };
    rebuild();
    render();
  });

  document.querySelectorAll('[data-view]').forEach((b) => {
    b.onclick = () => App.setView(b.dataset.view);
  });
  document.getElementById('whoBtn').onclick = App.openWho;
  document.getElementById('bwBtn').onclick = App.toggleBW;
  document.getElementById('whoSearch').addEventListener('input', (e) => App.drawWho(e.target.value));

  if (store.degraded) {
    toast('Firestore indisponível — trabalhando em modo local.', 'alert');
  }
  if (!S.me) setTimeout(App.openWho, 450);
}

boot().catch((err) => {
  console.error(err);
  document.getElementById('main').innerHTML =
    `<div class="card p-8 text-center"><div class="text-[15px] font-bold mb-1">Falha ao iniciar</div>
     <p class="text-[13px]" style="color:var(--muted)">${esc(err.message)}</p>
     <p class="text-[12px] mt-2" style="color:var(--subtle)">Abra o console do navegador para o detalhe técnico.</p></div>`;
});
