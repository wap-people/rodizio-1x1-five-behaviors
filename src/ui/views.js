/**
 * Renderização das telas. Cada view é uma função pura `(S) => string` que
 * devolve HTML; quem injeta e pinta os ícones é o app.js.
 *
 * Os handlers inline chamam `App.*` (exposto em window pelo app.js). Para um
 * app interno deste tamanho isso é mais legível do que uma camada de eventos
 * delegados — se a tela crescer, migre para addEventListener por delegação.
 */
import { PARTICIPANTS, TIERS, byId, initials, short } from '../data/participants.js';
import { pairKey, pct } from '../core/schedule.js';
import { fmtDate, fmtShort, fmtLong, todayISO, WEEKDAYS, esc } from './format.js';

const av = (p, extra = '') =>
  `<span class="avatar ${TIERS[p.t].cls} ${extra}" title="${esc(p.n)}">${initials(p.n)}</span>`;

const kpi = (label, value, sub, color) => `
  <div class="card card-top p-4 reveal">
    <div class="text-[10.5px] font-bold uppercase tracking-[.09em]" style="color:var(--subtle)">${label}</div>
    <div class="text-[30px] font-extrabold mono leading-[1.15] mt-1" style="color:${color || 'var(--text)'}">${value}</div>
    <div class="text-[11.5px] mt-0.5" style="color:var(--muted)">${sub}</div>
  </div>`;

const emptyCard = (msg) => `
  <div class="card p-10 text-center reveal">
    <div class="text-[14px] font-bold mb-1">Nada para mostrar</div>
    <p class="text-[13px]" style="color:var(--muted)">${msg}</p>
  </div>`;

function statusTag(S, key) {
  const s = S.status[key];
  const pl = S.plan[key];
  if (s?.st === 'done')
    return `<span class="tag t-done"><span data-ic="check" data-sz="12"></span>Concluído${s.dt ? ' · ' + fmtDate(s.dt) : ''}</span>`;
  if (s?.st === 'sched')
    return `<span class="tag t-sched"><span data-ic="calendar" data-sz="12"></span>Agendado</span>`;
  if (pl && pl.date < todayISO())
    return `<span class="tag t-late"><span data-ic="alert" data-sz="12"></span>Atrasado</span>`;
  return `<span class="tag t-pend"><span data-ic="clock" data-sz="12"></span>Pendente</span>`;
}

/**
 * Anel de progresso em SVG inline. Não é enfeite: o número sozinho ("12/29")
 * não diz se está perto ou longe do fim, e a barra fina some no meio da tela.
 */
function ring(percent, size = 58, color = 'var(--amber)') {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true" style="flex:none">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="#232327" stroke-width="6"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="6"
      stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - percent / 100)}"
      transform="rotate(-90 ${size / 2} ${size / 2})"/>
    <text x="50%" y="50%" text-anchor="middle" dy=".36em" fill="var(--text)"
      font-size="${Math.round(size * 0.28)}" font-weight="800">${percent}</text>
  </svg>`;
}

/** Barra empilhada: concluído + agendado sobre o total. */
function stackedBar(done, sched, total, height = 8) {
  const p = (n) => (total ? (n / total) * 100 : 0);
  return `<div class="bar" style="display:flex;height:${height}px">
    <i style="width:${p(done)}%;background:var(--ok)"></i>
    <i style="width:${p(sched)}%;background:var(--warn);border-radius:0"></i>
  </div>`;
}

const legend = (done, sched, pend) => `
  <div class="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11.5px]" style="color:var(--muted)">
    <span class="inline-flex items-center gap-1.5"><i style="width:8px;height:8px;border-radius:2px;background:var(--ok);display:inline-block"></i>Concluído ${done}</span>
    <span class="inline-flex items-center gap-1.5"><i style="width:8px;height:8px;border-radius:2px;background:var(--warn);display:inline-block"></i>Agendado ${sched}</span>
    <span class="inline-flex items-center gap-1.5"><i style="width:8px;height:8px;border-radius:2px;background:#232327;display:inline-block"></i>Pendente ${pend}</span>
  </div>`;

/* ══════════════════════ VISÃO GERAL ══════════════════════ */
export function viewDash(S) {
  if (!S.rounds.length) return emptyCard('Reative pelo menos dois participantes para o rodízio existir.');

  const g = S.statsAll();
  const today = todayISO();
  const pend = g.total - g.done - g.sched;
  const roundNow = Math.min(S.dates.filter((d) => d < today).length + 1, S.rounds.length);
  const mine = S.me ? S.statsOf(S.me) : null;

  const upcoming = Object.keys(S.plan)
    .filter((k) => S.status[k]?.st !== 'done' && S.plan[k].date >= today)
    .sort((x, y) => S.plan[x].date.localeCompare(S.plan[y].date) || S.plan[x].round - S.plan[y].round)
    .slice(0, 7);

  const rank = S.activeIds()
    .map((id) => ({ p: byId(id), st: S.statsOf(id) }))
    .sort((x, y) => y.st.pct - x.st.pct || x.p.n.localeCompare(y.p.n));

  return `
  <div class="flex flex-wrap items-end justify-between gap-3 mb-4">
    <div>
      <div class="text-[10.5px] font-bold uppercase tracking-[.09em]" style="color:var(--subtle)">The Five Behaviors · Long Vision</div>
      <h1 class="text-[20px] font-extrabold leading-tight mt-0.5">Visão geral da dinâmica</h1>
      <p class="text-[13px] mt-1" style="color:var(--muted)">
        ${S.activeIds().length} participantes · ${g.total} encontros · ${S.rounds.length} rodadas de
        ${Math.floor(S.activeIds().length / 2)} conversas simultâneas. Cada pessoa conversa com todas as outras exatamente uma vez.
      </p>
    </div>
    <button class="btn" onclick="App.downloadAllICS()"><span data-ic="download" data-sz="15"></span>Agenda completa (.ics)</button>
  </div>

  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
    ${kpi('Encontros no total', g.total, `${S.activeIds().length} pessoas · ${S.activeIds().length - 1} por pessoa`)}
    ${kpi('Concluídos', g.done, `${g.pct}% da jornada`, 'var(--ok)')}
    ${kpi('Agendados', g.sched, 'com data confirmada', 'var(--warn)')}
    ${kpi('Atrasados', g.late, g.late ? 'rodadas já vencidas' : 'nenhum atrasado', g.late ? 'var(--danger)' : 'var(--muted)')}
  </div>

  <div class="grid lg:grid-cols-3 gap-3">
    <div class="card p-5 lg:col-span-2 reveal">
      <div class="flex items-center gap-4">
        ${ring(g.pct, 64)}
        <div class="flex-1 min-w-0">
          <div class="flex items-baseline justify-between gap-3 flex-wrap">
            <span class="text-[13px] font-bold">Progresso geral</span>
            <span class="text-[12px]" style="color:var(--muted)">Rodada em curso:
              <b class="mono" style="color:var(--amber)">${roundNow}</b> de ${S.rounds.length}</span>
          </div>
          <div class="mt-2">${stackedBar(g.done, g.sched, g.total)}</div>
          ${legend(g.done, g.sched, pend)}
        </div>
      </div>

      ${mine ? `
      <div class="mt-4 pt-4 border-t flex items-center gap-4" style="border-color:var(--border)">
        ${ring(mine.pct, 58, 'var(--lime)')}
        <div class="flex-1 min-w-0">
          <div class="text-[13px] font-bold">Você — ${esc(short(byId(S.me).n))}</div>
          <div class="mt-2">${stackedBar(mine.done, mine.sched || 0, mine.total)}</div>
          <div class="text-[11.5px] mt-2" style="color:var(--muted)">
            ${mine.done} de ${mine.total} · <b style="color:${mine.late ? 'var(--danger)' : 'var(--ok)'}">${mine.late} atrasado${mine.late === 1 ? '' : 's'}</b>
          </div>
        </div>
      </div>` : `
      <div class="mt-4 pt-4 border-t text-[12.5px]" style="border-color:var(--border);color:var(--muted)">
        Identifique-se no topo para ver também o seu progresso pessoal aqui.
      </div>`}

      <div class="mt-5 pt-4 border-t" style="border-color:var(--border)">
        <div class="text-[10.5px] font-bold uppercase tracking-[.09em] mb-2" style="color:var(--subtle)">Próximos encontros</div>
        ${upcoming.length ? upcoming.map((k) => {
          const [a, b] = k.split('-').map(Number);
          const pl = S.plan[k];
          return `<div class="row" style="grid-template-columns:58px 1fr auto">
            <div class="mono text-[12px]" style="color:var(--muted)">${fmtShort(pl.date)}
              <div class="text-[10px] uppercase" style="color:var(--subtle)">${WEEKDAYS[new Date(pl.date + 'T12:00:00').getDay()]}</div>
            </div>
            <div class="min-w-0">
              <div class="text-[13px] font-bold truncate">${esc(short(byId(a).n))}
                <span style="color:var(--subtle);font-weight:400">×</span> ${esc(short(byId(b).n))}</div>
              <div class="text-[11.5px]" style="color:var(--muted)">Rodada ${pl.round} · ${S.cfg.time}</div>
            </div>
            ${statusTag(S, k)}
          </div>`;
        }).join('') : `<div class="text-[13px] py-4 text-center" style="color:var(--muted)">Nenhum encontro futuro previsto.</div>`}
      </div>
    </div>

    <div class="card p-5 reveal">
      <div class="text-[10.5px] font-bold uppercase tracking-[.09em] mb-3" style="color:var(--subtle)">Ranking de conclusão</div>
      <div style="max-height:560px;overflow:auto">
        ${rank.map(({ p, st }) => `
          <button class="row w-full text-left" style="grid-template-columns:34px 1fr 46px" onclick="App.pickMe(${p.id})" title="Ver a agenda de ${esc(p.n)}">
            ${av(p)}
            <div class="min-w-0">
              <div class="text-[12.5px] font-bold truncate">${esc(short(p.n))}</div>
              <div class="mt-1">${stackedBar(st.done, st.sched || 0, st.total, 5)}</div>
            </div>
            <div class="mono text-[12px] text-right" style="color:var(--muted)">${st.done}/${st.total}</div>
          </button>`).join('')}
      </div>
    </div>
  </div>`;
}

/* ══════════════════════ MEUS 1x1 ══════════════════════ */
export function viewMe(S) {
  if (!S.me) {
    return `<div class="card p-10 text-center reveal">
      <div class="mx-auto mb-4 w-12 h-12 rounded-xl grid place-items-center" style="background:rgba(255,176,35,.12);color:var(--amber)"><span data-ic="user" data-sz="22"></span></div>
      <div class="text-[17px] font-bold">Identifique-se para começar</div>
      <p class="text-[13px] mt-1.5 mx-auto max-w-[420px]" style="color:var(--muted)">Escolha seu nome e o sistema monta sua agenda pessoal de 1x1 — quem você encontra, quando, quem convida e o que já foi feito.</p>
      <button class="btn btn-primary mt-5" onclick="App.openWho()"><span data-ic="user" data-sz="15"></span>Escolher meu nome</button>
    </div>`;
  }

  const me = byId(S.me);
  const st = S.statsOf(S.me);
  const today = todayISO();

  const all = Object.keys(S.plan)
    .filter((k) => { const [a, b] = k.split('-').map(Number); return a === S.me || b === S.me; })
    .map((k) => {
      const [a, b] = k.split('-').map(Number);
      return { k, other: a === S.me ? b : a, pl: S.plan[k], s: S.status[k] || null, isOrg: S.organizers[k] === S.me };
    })
    .sort((x, y) => x.pl.round - y.pl.round);

  const q = S.meQuery.toLowerCase();
  const shown = all.filter((it) => {
    const p = byId(it.other);
    if (q && !(p.n.toLowerCase().includes(q) || p.c.toLowerCase().includes(q))) return false;
    const done = it.s?.st === 'done';
    if (S.meFilter === 'done') return done;
    if (S.meFilter === 'open') return !done;
    if (S.meFilter === 'late') return !done && it.pl.date < today;
    if (S.meFilter === 'next') return !done && it.pl.date >= today;
    return true;
  });

  const next = all.find((it) => it.s?.st !== 'done' && it.pl.date >= today);
  const orgOpen = all.filter((i) => i.isOrg && i.s?.st !== 'done').length;
  const count = (f) => all.filter(f).length;
  const chips = [
    ['all', 'Todos', all.length],
    ['open', 'Em aberto', count((i) => i.s?.st !== 'done')],
    ['next', 'Próximos', count((i) => i.s?.st !== 'done' && i.pl.date >= today)],
    ['late', 'Atrasados', count((i) => i.s?.st !== 'done' && i.pl.date < today)],
    ['done', 'Concluídos', count((i) => i.s?.st === 'done')]
  ];

  return `
  <div class="flex flex-wrap items-end justify-between gap-3 mb-4">
    <div>
      <h1 class="text-[22px] font-extrabold tracking-[-.02em]">Meus 1x1</h1>
      <p class="text-[13px]" style="color:var(--muted)">${esc(me.n)} · ${esc(me.c)}</p>
    </div>
    <div class="flex gap-2 flex-wrap">
      <button class="btn btn-sm" onclick="App.downloadMyICS()"><span data-ic="download" data-sz="14"></span>Baixar minha agenda (.ics)</button>
      <button class="btn btn-sm" onclick="App.copyMyList()"><span data-ic="copy" data-sz="14"></span>Copiar minha lista</button>
    </div>
  </div>

  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
    ${kpi('Concluídos', `${st.done}<span class="text-[15px] font-bold" style="color:var(--subtle)">/${st.total}</span>`, `${st.pct}% da sua jornada`, 'var(--ok)')}
    ${kpi('Em aberto', st.total - st.done, 'encontros restantes')}
    ${kpi('Atrasados', st.late, st.late ? 'passaram da data prevista' : 'nenhum atrasado', st.late ? 'var(--danger)' : 'var(--muted)')}
    ${kpi('Você convida', orgOpen, 'convites que saem de você', 'var(--amber)')}
  </div>

  ${next ? `
  <div class="card card-top p-4 md:p-5 mb-4 reveal" style="border-color:rgba(255,176,35,.32)">
    <div class="flex flex-wrap items-center gap-4">
      <div class="text-[10.5px] font-bold uppercase tracking-[.09em] w-full" style="color:var(--amber)">Seu próximo encontro</div>
      ${av(byId(next.other), '!w-11 !h-11 !text-sm')}
      <div class="min-w-0 flex-1">
        <div class="text-[16px] font-bold truncate">${esc(byId(next.other).n)}</div>
        <div class="text-[12.5px] truncate" style="color:var(--muted)">${esc(byId(next.other).c)}</div>
      </div>
      <div class="text-right">
        <div class="text-[15px] font-bold mono">${fmtLong(next.pl.date)}</div>
        <div class="text-[12px] mono" style="color:var(--muted)">${S.cfg.time} · ${S.cfg.duration} min · rodada ${next.pl.round}</div>
      </div>
      <div class="flex gap-2 w-full sm:w-auto">
        ${next.isOrg
          ? `<button class="btn btn-primary btn-sm flex-1" onclick="App.openTeams(${S.me},${next.other})"><span data-ic="video" data-sz="14"></span>Criar convite no Teams</button>`
          : `<span class="tag t-neutral"><span data-ic="mail" data-sz="12"></span>${esc(short(byId(next.other).n))} envia o convite</span>`}
        <a class="btn btn-sm" href="${S.chatLink(next.other)}" target="_blank" rel="noopener"><span data-ic="chat" data-sz="14"></span>Chat</a>
      </div>
    </div>
  </div>` : ''}

  <div class="flex flex-wrap gap-2 items-center mb-3">
    ${chips.map(([v, l, n]) => `<button class="btn btn-sm ${S.meFilter === v ? 'btn-primary' : ''}" onclick="App.setFilter('${v}')">${l} <span class="mono opacity-70">${n}</span></button>`).join('')}
    <div class="relative ml-auto w-full sm:w-[240px]">
      <span class="absolute left-3 top-1/2 -translate-y-1/2" style="color:var(--subtle)" data-ic="search" data-sz="14"></span>
      <input id="meSearch" class="inp !pl-9" placeholder="Filtrar pessoa ou área…" value="${esc(S.meQuery)}" oninput="App.setQuery(this.value)">
    </div>
  </div>

  <div class="card overflow-hidden reveal">
    ${shown.length ? shown.map((it) => {
      const p = byId(it.other);
      const done = it.s?.st === 'done';
      return `<div class="row" style="grid-template-columns:38px 1fr auto">
        ${av(p)}
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-bold text-[14px] truncate ${done ? 'opacity-60' : ''}">${esc(p.n)}</span>
            ${statusTag(S, it.k)}
            ${it.isOrg ? '<span class="tag t-neutral">Você convida</span>' : ''}
            ${it.s?.rm ? `<span class="tag t-late" title="Já foi cancelado e precisa ser remarcado"><span data-ic="undo" data-sz="12"></span>Remarcado ${it.s.rm}×</span>` : ''}
          </div>
          <div class="text-[12px] mt-0.5 truncate" style="color:var(--muted)">
            ${esc(p.c)} · <span class="mono">Rodada ${it.pl.round} — ${fmtLong(it.pl.date)}, ${S.cfg.time}</span>
          </div>
          ${it.s?.nt ? `<div class="text-[12px] mt-1 pl-2 border-l-2" style="border-color:var(--border);color:var(--subtle)">${esc(it.s.nt)}</div>` : ''}
        </div>
        <div class="flex gap-1.5 items-center">
          <a class="btn btn-sm btn-ghost" href="${S.reportOf(it.other)}" target="_blank" rel="noopener"
             title="Relatório comparativo de vocês dois" aria-label="Abrir o relatório comparativo com ${esc(p.n)}"><span data-ic="filetext" data-sz="15"></span></a>
          <a class="btn btn-sm btn-ghost" href="mailto:${esc(S.mailOf(it.other))}" title="E-mail" aria-label="Enviar e-mail"><span data-ic="mail" data-sz="15"></span></a>
          <a class="btn btn-sm btn-ghost" href="${S.chatLink(it.other)}" target="_blank" rel="noopener" title="Chat no Teams" aria-label="Abrir chat no Teams"><span data-ic="chat" data-sz="15"></span></a>
          ${it.s?.st === 'sched'
            ? `<button class="btn btn-sm" onclick="App.cancelSched(${S.me},${it.other})" title="Cancelar o agendamento e voltar para pendente"><span data-ic="calx" data-sz="14"></span><span class="hidden md:inline">Cancelar</span></button>`
            : `<button class="btn btn-sm" onclick="App.openTeams(${S.me},${it.other})" title="Abrir agendamento no Teams"><span data-ic="video" data-sz="14"></span><span class="hidden md:inline">Teams</span></button>`}
          <button class="btn btn-sm ${done ? '' : 'btn-primary'}" onclick="App.openDone(${S.me},${it.other})"><span data-ic="check" data-sz="14"></span><span class="hidden md:inline">${done ? 'Editar' : 'Concluir'}</span></button>
        </div>
      </div>`;
    }).join('') : `<div class="p-10 text-center text-[13px]" style="color:var(--muted)">Nenhum encontro neste filtro.</div>`}
  </div>`;
}

/* ══════════════════════ RODÍZIO ══════════════════════ */
export function viewRounds(S) {
  if (!S.rounds.length) return emptyCard('Reative pelo menos dois participantes para o rodízio existir.');
  const s = S.statsAll();
  const today = todayISO();
  const last = S.dates[S.dates.length - 1];

  return `
  <div class="flex flex-wrap items-end justify-between gap-3 mb-4">
    <div>
      <h1 class="text-[22px] font-extrabold tracking-[-.02em]">Rodízio automático</h1>
      <p class="text-[13px]" style="color:var(--muted)">${S.rounds.length} rodadas · ${S.rounds[0].length} encontros simultâneos por rodada · todos se encontram exatamente uma vez</p>
    </div>
    <div class="flex gap-2">
      <button class="btn btn-sm" onclick="App.setView('config')"><span data-ic="settings" data-sz="14"></span>Ajustar datas</button>
      <button class="btn btn-sm" onclick="App.exportCSV()"><span data-ic="download" data-sz="14"></span>CSV completo</button>
    </div>
  </div>

  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
    ${kpi('Encontros no total', s.total, `${S.activeIds().length} participantes ativos`)}
    ${kpi('Concluídos', s.done, `${pct(s.done, s.total)}% do programa`, 'var(--ok)')}
    ${kpi('Atrasados', s.late, 'rodadas já vencidas', s.late ? 'var(--danger)' : 'var(--muted)')}
    ${kpi('Encerramento', fmtShort(last), `última rodada em ${fmtDate(last)}`, 'var(--amber)')}
  </div>

  <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
    ${S.rounds.map((pairs, i) => {
      const date = S.dates[i];
      const done = pairs.filter(([a, b]) => S.status[pairKey(a, b)]?.st === 'done').length;
      const past = date < today;
      const full = done === pairs.length;
      const mine = S.me ? pairs.find(([a, b]) => a === S.me || b === S.me) : null;
      return `<div class="card p-4 reveal" style="border-color:${mine ? 'rgba(255,176,35,.3)' : 'var(--border)'}">
        <div class="flex items-start justify-between gap-2 mb-2">
          <div>
            <div class="text-[10.5px] font-bold uppercase tracking-[.09em]" style="color:var(--subtle)">Rodada ${i + 1}</div>
            <div class="text-[15px] font-bold mono">${fmtLong(date)} <span class="text-[12px] font-semibold" style="color:var(--muted)">${fmtShort(date)} · ${S.cfg.time}</span></div>
          </div>
          <span class="tag ${full ? 't-done' : past ? 't-late' : 't-pend'}">${done}/${pairs.length}</span>
        </div>
        <div class="bar mb-3"><i style="width:${pct(done, pairs.length)}%;background:${full ? 'var(--ok)' : 'var(--amber)'}"></i></div>
        ${mine ? `<div class="mb-2.5 p-2 rounded-lg text-[12.5px] flex items-center gap-2" style="background:rgba(255,176,35,.09)">
          <span data-ic="arrow" data-sz="14" style="color:var(--amber)"></span>
          <span>Você com <b>${esc(short(byId(mine[0] === S.me ? mine[1] : mine[0]).n))}</b></span></div>` : ''}
        <details><summary class="text-[12px] cursor-pointer select-none" style="color:var(--muted)">Ver os ${pairs.length} pares</summary>
          <div class="mt-2 space-y-1">${pairs.map(([a, b]) => {
            const ok = S.status[pairKey(a, b)]?.st === 'done';
            return `<div class="text-[12px] flex items-center gap-1.5 ${ok ? 'opacity-55' : ''}">
              <span class="w-1.5 h-1.5 rounded-full" style="background:${ok ? 'var(--ok)' : past ? 'var(--danger)' : '#3f3f46'}"></span>
              ${esc(short(byId(a).n))} <span style="color:var(--subtle)">×</span> ${esc(short(byId(b).n))}</div>`;
          }).join('')}</div>
        </details>
      </div>`;
    }).join('')}
  </div>`;
}

/* ══════════════════════ MATRIZ ══════════════════════ */
export function viewMatrix(S) {
  if (!S.rounds.length) return emptyCard('Reative pelo menos dois participantes para ver a matriz.');
  const ids = S.activeIds();

  return `
  <div class="flex flex-wrap items-end justify-between gap-3 mb-4">
    <div>
      <h1 class="text-[22px] font-extrabold tracking-[-.02em]">Matriz geral</h1>
      <p class="text-[13px]" style="color:var(--muted)">Todos × todos. Clique numa célula para registrar o encontro.</p>
    </div>
    <div class="flex gap-3 items-center text-[11.5px] flex-wrap" style="color:var(--muted)">
      <span class="flex items-center gap-1.5"><i class="cellbox c-done !w-3 !h-3"></i>Concluído</span>
      <span class="flex items-center gap-1.5"><i class="cellbox c-sched !w-3 !h-3"></i>Agendado</span>
      <span class="flex items-center gap-1.5"><i class="cellbox c-pend !w-3 !h-3"></i>Pendente</span>
    </div>
  </div>

  <div class="card p-4 overflow-auto reveal">
    <table class="mx border-separate" style="border-spacing:2px">
      <thead><tr><th></th>${ids.map((id) => `<th style="height:96px;vertical-align:bottom">
        <div style="writing-mode:vertical-rl;transform:rotate(180deg);font-size:10.5px;font-weight:600;white-space:nowrap;padding-bottom:4px;color:${id === S.me ? 'var(--amber)' : 'var(--muted)'}">${esc(short(byId(id).n))}</div></th>`).join('')}</tr></thead>
      <tbody>${ids.map((r) => `<tr>
        <th style="text-align:right;padding-right:8px;font-size:11px;font-weight:600;white-space:nowrap;color:${r === S.me ? 'var(--amber)' : 'var(--muted)'}">${esc(short(byId(r).n))}</th>
        ${ids.map((c) => {
          if (r === c) return '<td><i class="cellbox c-self"></i></td>';
          const k = pairKey(r, c);
          const s = S.status[k];
          const pl = S.plan[k];
          const cls = s?.st === 'done' ? 'c-done' : s?.st === 'sched' ? 'c-sched' : 'c-pend';
          const mine = r === S.me || c === S.me ? 'c-me' : '';
          const lbl = `${short(byId(r).n)} × ${short(byId(c).n)} — rodada ${pl?.round ?? '?'}, ${pl ? fmtDate(pl.date) : '?'}`;
          return `<td><button class="cellbox ${cls} ${mine}" title="${esc(lbl)}" aria-label="${esc(lbl)}" onclick="App.openDone(${r},${c})"></button></td>`;
        }).join('')}</tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

/* ══════════════════════ PARTICIPANTES ══════════════════════ */
export function viewPeople(S) {
  const rank = S.activeIds()
    .map((id) => ({ p: byId(id), ...S.statsOf(id) }))
    .sort((a, b) => b.done - a.done || a.p.n.localeCompare(b.p.n));

  const byMail = {};
  PARTICIPANTS.forEach((p) => {
    const m = S.mailOf(p.id).toLowerCase();
    (byMail[m] = byMail[m] || []).push(p.id);
  });
  const dup = Object.values(byMail).filter((v) => v.length > 1).flat();

  return `
  <div class="flex flex-wrap items-end justify-between gap-3 mb-4">
    <div>
      <h1 class="text-[22px] font-extrabold tracking-[-.02em]">Participantes</h1>
      <p class="text-[13px]" style="color:var(--muted)">${S.activeIds().length} ativos de ${PARTICIPANTS.length}. Corrija e-mails e desative quem sair do programa.</p>
    </div>
    <button class="btn btn-sm" onclick="App.copyEmails()"><span data-ic="copy" data-sz="14"></span>Copiar e-mails</button>
  </div>

  ${dup.length ? `<div class="card p-3.5 mb-4 flex items-start gap-2.5" style="border-color:rgba(248,113,113,.35);background:rgba(248,113,113,.06)">
    <span data-ic="alert" data-sz="16" style="color:var(--danger);margin-top:1px"></span>
    <div class="text-[12.5px]"><b>E-mail duplicado detectado</b> em ${dup.map((id) => esc(short(byId(id).n))).join(' e ')}. Isso veio da planilha de origem — corrija abaixo antes de disparar convites, senão a pessoa errada recebe.</div>
  </div>` : ''}

  <div class="card overflow-hidden reveal">
    ${rank.map((r, i) => {
      const off = S.cfg.disabled.includes(r.p.id);
      return `<div class="row ${off ? 'opacity-45' : ''}" style="grid-template-columns:26px 38px 1fr 130px auto">
        <span class="mono text-[12px] font-bold" style="color:${i < 3 && r.done ? 'var(--amber)' : 'var(--subtle)'}">${i + 1}</span>
        ${av(r.p)}
        <div class="min-w-0">
          <div class="font-bold text-[14px] truncate flex items-center gap-2">${esc(r.p.n)}
            ${r.p.id === S.me ? '<span class="tag t-neutral">você</span>' : ''}
            <span class="tag t-neutral">${TIERS[r.p.t].label}</span>
          </div>
          <div class="text-[12px] truncate" style="color:var(--muted)">${esc(r.p.c)}</div>
          <input class="inp !py-1 !px-2 !text-[11.5px] mt-1 max-w-[300px]" value="${esc(S.mailOf(r.p.id))}"
                 onchange="App.fixEmail(${r.p.id}, this.value)" aria-label="E-mail de ${esc(r.p.n)}">
        </div>
        <div>
          <div class="text-[11.5px] mono mb-1" style="color:var(--muted)">${r.done}/${r.total} · ${r.pct}%${r.late ? ` · <span style="color:var(--danger)">${r.late} atrasado(s)</span>` : ''}</div>
          <div class="bar"><i style="width:${r.pct}%"></i></div>
        </div>
        <button class="btn btn-sm btn-ghost" onclick="App.toggleActive(${r.p.id})">${off ? 'Reativar' : 'Desativar'}</button>
      </div>`;
    }).join('')}
  </div>`;
}

/* ══════════════════════ CONFIGURAÇÃO ══════════════════════ */
export function viewConfig(S) {
  const s = S.statsAll();
  const weeks = Math.ceil(S.rounds.length / (S.cfg.weekdays.length || 1));

  return `
  <h1 class="text-[22px] font-extrabold tracking-[-.02em] mb-1">Configuração</h1>
  <p class="text-[13px] mb-4" style="color:var(--muted)">Mudanças aqui recalculam o rodízio inteiro. Os registros de encontros concluídos são preservados.</p>

  <div class="grid lg:grid-cols-2 gap-3">
    <div class="card card-top p-5 reveal">
      <div class="text-[14px] font-bold mb-3">Calendário do rodízio</div>
      <div class="grid sm:grid-cols-2 gap-3">
        <div><label class="lbl" for="cStart">Início do programa</label><input type="date" id="cStart" class="inp" value="${S.cfg.start}"></div>
        <div><label class="lbl" for="cTime">Horário padrão</label><input type="time" id="cTime" class="inp" value="${S.cfg.time}"></div>
      </div>
      <div class="mt-3">
        <label class="lbl">Dias da semana das rodadas</label>
        <div class="flex flex-wrap gap-1.5">${[1, 2, 3, 4, 5].map((d) => `
          <label class="btn btn-sm ${S.cfg.weekdays.includes(d) ? 'btn-primary' : ''}" style="cursor:pointer">
            <input type="checkbox" class="sr" data-day="${d}" ${S.cfg.weekdays.includes(d) ? 'checked' : ''}
                   onchange="this.parentNode.classList.toggle('btn-primary', this.checked)">${WEEKDAYS[d]}</label>`).join('')}</div>
      </div>
      <div class="mt-3">
        <label class="lbl" for="cDur">Duração de cada 1x1</label>
        <select id="cDur" class="inp">${[30, 45, 60, 90].map((v) => `<option value="${v}" ${S.cfg.duration === v ? 'selected' : ''}>${v} minutos</option>`).join('')}</select>
      </div>
      <div class="mt-4 p-3 rounded-lg text-[12.5px]" style="background:var(--surface-2)">
        <b class="mono" style="color:var(--amber)">${S.rounds.length} rodadas</b> · ${S.cfg.weekdays.length || 1} por semana ⇒ cerca de
        <b class="mono">${weeks} semanas</b>, terminando em <b class="mono">${fmtDate(S.dates[S.dates.length - 1])}</b>.
      </div>
      <button class="btn btn-primary mt-4" onclick="App.applyConfig()"><span data-ic="check" data-sz="15"></span>Aplicar e recalcular</button>
    </div>

    <div class="card p-5 reveal">
      <div class="text-[14px] font-bold mb-3">Relatórios Five Behaviors</div>
      <label class="lbl" for="cDrive">Pasta no Google Drive (Long Vision)</label>
      <input id="cDrive" class="inp" value="${esc(S.cfg.driveUrl)}">
      <p class="text-[12px] mt-2" style="color:var(--muted)">Este link entra automaticamente no corpo de todo convite do Teams e de todo evento .ics.</p>

      <div class="text-[14px] font-bold mt-6 mb-3">Exportar</div>
      <div class="flex flex-wrap gap-2">
        <button class="btn" onclick="App.exportCSV()"><span data-ic="download" data-sz="15"></span>Plano completo (CSV)</button>
        <button class="btn" onclick="App.downloadAllICS()"><span data-ic="calendar" data-sz="15"></span>Todos os encontros (.ics)</button>
      </div>

      <div class="text-[14px] font-bold mt-6 mb-2">Como funciona o Teams aqui</div>
      <ul class="text-[12.5px] space-y-1.5 pl-4" style="color:var(--muted);list-style:disc">
        <li>O botão <b style="color:var(--text)">Teams</b> abre a tela de novo agendamento já preenchida com título, convidado, data, horário e pauta. Você confere e envia — o link da reunião é gerado pelo próprio Teams.</li>
        <li>Cada par tem <b style="color:var(--text)">um organizador definido</b> pelo sistema, distribuído de forma equilibrada, para ninguém receber convite duplicado.</li>
        <li>O <b style="color:var(--text)">.ics</b> reserva os horários na agenda, mas não cria a sala — a sala vem do convite do Teams.</li>
      </ul>

      <div class="text-[14px] font-bold mt-6 mb-2">Onde os dados ficam</div>
      <p class="text-[12.5px]" style="color:var(--muted)">
        ${S.storeInfo.shared
          ? 'Armazenamento compartilhado ativo: todo mundo vê e edita o mesmo painel, em tempo real.'
          : 'Armazenamento local: os registros ficam apenas neste navegador. Para o painel ser comum a todos, configure o Firestore em <code class="mono">config.js</code> (instruções no README).'}
        Sua identificação pessoal fica sempre só no seu dispositivo.
      </p>
      <p class="text-[11.5px] mt-1 mono" style="color:var(--subtle)">driver: ${S.storeInfo.driver}${S.storeInfo.degraded ? ' (fallback — Firestore falhou)' : ''}</p>

      <button class="btn mt-4" onclick="App.wipe()" style="border-color:rgba(248,113,113,.4);color:var(--danger)"><span data-ic="refresh" data-sz="15"></span>Zerar todos os registros</button>
    </div>
  </div>

  <div class="card p-5 mt-3 reveal">
    <div class="text-[14px] font-bold mb-1">Situação atual</div>
    <p class="text-[12.5px] mb-3" style="color:var(--muted)">${s.done} de ${s.total} encontros concluídos · ${s.sched} agendados · ${s.late} vencidos sem registro.</p>
    <div class="bar" style="height:10px"><i style="width:${pct(s.done, s.total)}%"></i></div>
  </div>`;
}

/* ══════════════════════ SELETOR DE IDENTIDADE ══════════════════════ */
export function whoList(query, me) {
  const q = (query || '').toLowerCase();
  const list = PARTICIPANTS.filter((p) => !q || p.n.toLowerCase().includes(q) || p.c.toLowerCase().includes(q));
  if (!list.length) return `<div class="p-6 text-center text-[13px]" style="color:var(--muted)">Ninguém encontrado.</div>`;
  return list.map((p) => `
    <button class="w-full flex items-center gap-3 p-2.5 rounded-[10px] hover:bg-[#1d1d20] text-left" onclick="App.pickMe(${p.id})">
      ${av(p)}
      <div class="min-w-0">
        <div class="text-[13.5px] font-semibold truncate">${esc(p.n)}</div>
        <div class="text-[11.5px] truncate" style="color:var(--muted)">${esc(p.c)}</div>
      </div>
      ${p.id === me ? '<span class="tag t-done ml-auto">atual</span>' : ''}
    </button>`).join('');
}
