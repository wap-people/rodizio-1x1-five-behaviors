/**
 * Integrações externas: deep links do Microsoft Teams, arquivos .ics e CSV.
 *
 * Por que deep link e não Microsoft Graph:
 * criar a reunião de verdade sem nenhum clique exigiria um app registrado no
 * Entra ID com consentimento de administrador e um backend para guardar o
 * segredo — nada disso cabe em um site estático. O deep link abre a tela de
 * agendamento do Teams já preenchida (título, convidado, data, hora e pauta);
 * a pessoa só confere e envia, e o link da reunião é gerado pelo próprio Teams.
 *
 * Formato do deep link documentado pela Microsoft:
 * https://learn.microsoft.com/microsoftteams/platform/concepts/build-and-test/deep-link-workflow
 */
import { byId, short } from '../data/participants.js';
import { REPORTS } from '../data/reports.js';
import { pairKey, addMinutes } from './schedule.js';

/**
 * Link do relatório comparativo do par — o PDF, não a pasta.
 *
 * Preferimos a orientação de quem está olhando (`me`), porque o relatório é
 * escrito da perspectiva do dono da pasta. Quando ela não existe, cai para a
 * inversa: é a mesma comparação vista do outro lado, e melhor que jogar a
 * pessoa na raiz do Drive para procurar entre 32 pastas.
 *
 * Sem nenhuma das duas, devolve a pasta raiz de `cfg.driveUrl` como último
 * recurso — nunca `null`, para o botão não sumir da interface.
 */
export function reportLink(me, other, cfg) {
  const id = REPORTS[me]?.[other] || REPORTS[other]?.[me];
  return id ? `https://drive.google.com/file/d/${id}/view` : cfg.driveUrl;
}

/** O par tem relatório próprio, ou o link é só a pasta raiz? */
export const hasReport = (a, b) => Boolean(REPORTS[a]?.[b] || REPORTS[b]?.[a]);

const TEAMS_MEETING = 'https://teams.microsoft.com/l/meeting/new';
const TEAMS_CHAT = 'https://teams.microsoft.com/l/chat/0/0';

/** Fuso de São Paulo: UTC-3 fixo (o Brasil não adota horário de verão desde 2019). */
const TZ_OFFSET = '-03:00';
const TZ_HOURS = 3;

export const subject = (a, b) =>
  `1x1 Five Behaviors · ${short(byId(a).n)} × ${short(byId(b).n)}`;

/** Corpo do convite. Sem acentuação exótica para não quebrar em cliente antigo. */
export function agenda(a, b, cfg) {
  return (
    `Encontro 1x1 da dinamica The Five Behaviors (Long Vision).\n\n` +
    `Antes da conversa, abra o relatorio comparativo de voces dois:\n${reportLink(a, b, cfg)}\n\n` +
    `Roteiro sugerido (${cfg.duration} min):\n` +
    `1. Confianca - onde cada um se sente mais e menos a vontade para se expor\n` +
    `2. Conflito - como cada perfil reage ao debate de ideias\n` +
    `3. Comprometimento e Responsabilidade - o que trava a clareza entre nos\n` +
    `4. Resultados - 1 acordo pratico para a rotina entre as areas\n\n` +
    `${byId(a).c} x ${byId(b).c}`
  );
}

export function teamsMeetingLink(a, b, { date, cfg, mailOf }) {
  const p = new URLSearchParams();
  p.set('subject', subject(a, b));
  p.set('attendees', [mailOf(a), mailOf(b)].join(','));
  p.set('content', agenda(a, b, cfg));
  if (date) {
    p.set('startTime', `${date}T${cfg.time}:00${TZ_OFFSET}`);
    p.set('endTime', `${date}T${addMinutes(cfg.time, cfg.duration)}:00${TZ_OFFSET}`);
  }
  return `${TEAMS_MEETING}?${p.toString()}`;
}

export function teamsChatLink(otherId, { cfg, mailOf, me }) {
  const p = new URLSearchParams();
  p.set('users', mailOf(otherId));
  p.set(
    'message',
    `Oi! Vamos marcar nosso 1x1 do Five Behaviors? Nosso relatorio comparativo esta em ${reportLink(me, otherId, cfg)}`
  );
  return `${TEAMS_CHAT}?${p.toString()}`;
}

/* ─────────────── ICS ─────────────── */

const escapeICS = (s) =>
  String(s)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');

function stamp(date, time, plusMin) {
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d, h + TZ_HOURS, mi));
  dt.setUTCMinutes(dt.getUTCMinutes() + (plusMin || 0));
  return dt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Gera o conteúdo de um arquivo .ics.
 * Atenção: o .ics reserva o horário na agenda, mas não cria a sala do Teams —
 * a sala vem do convite enviado pelo deep link.
 */
export function buildICS(items, { cfg, mailOf, organizers }) {
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const events = items.map(({ a, b, date }) => {
    const org = byId(organizers[pairKey(a, b)] ?? a);
    return [
      'BEGIN:VEVENT',
      `UID:rodizio1x1-${pairKey(a, b)}-${date}@wap.ind.br`,
      `DTSTAMP:${now}`,
      `DTSTART:${stamp(date, cfg.time, 0)}`,
      `DTEND:${stamp(date, cfg.time, cfg.duration)}`,
      `SUMMARY:${escapeICS(subject(a, b))}`,
      `DESCRIPTION:${escapeICS(agenda(a, b, cfg))}`,
      'LOCATION:Microsoft Teams',
      `ORGANIZER;CN=${escapeICS(org.n)}:mailto:${mailOf(org.id)}`,
      `ATTENDEE;CN=${escapeICS(byId(a).n)};RSVP=TRUE:mailto:${mailOf(a)}`,
      `ATTENDEE;CN=${escapeICS(byId(b).n)};RSVP=TRUE:mailto:${mailOf(b)}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeICS('1x1 Five Behaviors em 15 min')}`,
      'END:VALARM',
      'END:VEVENT'
    ].join('\r\n');
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WAP//Rodizio 1x1 Five Behaviors//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR'
  ].join('\r\n');
}

/* ─────────────── CSV ─────────────── */

export function buildCSV({ plan, status, organizers, mailOf, fmtDate }) {
  const rows = [
    ['Rodada','Data prevista','Pessoa A','Cargo A','E-mail A','Pessoa B','Cargo B','E-mail B','Organizador','Status','Data realizada','Nota']
  ];
  Object.keys(plan)
    .sort((x, y) => plan[x].round - plan[y].round)
    .forEach((k) => {
      const [a, b] = k.split('-').map(Number);
      const s = status[k] || {};
      rows.push([
        plan[k].round,
        fmtDate(plan[k].date),
        byId(a).n, byId(a).c, mailOf(a),
        byId(b).n, byId(b).c, mailOf(b),
        short(byId(organizers[k]).n),
        s.st === 'done' ? 'Concluído' : s.st === 'sched' ? 'Agendado' : 'Pendente',
        s.dt ? fmtDate(s.dt) : '',
        (s.nt || '').replace(/"/g, "'")
      ]);
    });
  return rows.map((r) => r.map((c) => `"${c}"`).join(';')).join('\n');
}

/** Dispara o download de um texto como arquivo. */
export function download(filename, text, mime = 'text/plain') {
  const blob = new Blob(['\ufeff' + text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
