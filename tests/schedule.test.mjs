import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRounds, assignOrganizers, buildDates, buildPlan, pairKey, addMinutes, pct
} from '../src/core/schedule.js';
import { PARTICIPANTS, mail } from '../src/data/participants.js';

const ids = (n) => Array.from({ length: n }, (_, i) => i + 1);

test('pairKey é canônico independente da ordem', () => {
  assert.equal(pairKey(7, 3), pairKey(3, 7));
  assert.equal(pairKey(3, 7), '3-7');
});

test('INVARIANTE 1 — cada par se encontra exatamente uma vez', () => {
  for (const n of [4, 10, 29, 30, 31]) {
    const keys = buildRounds(ids(n)).flat().map(([a, b]) => pairKey(a, b));
    assert.equal(keys.length, (n * (n - 1)) / 2, `total de pares com n=${n}`);
    assert.equal(new Set(keys).size, keys.length, `sem par repetido com n=${n}`);
  }
});

test('INVARIANTE 2 — ninguém aparece duas vezes na mesma rodada', () => {
  for (const n of [10, 29, 30]) {
    for (const round of buildRounds(ids(n))) {
      const seen = new Set();
      for (const person of round.flat()) {
        assert.ok(!seen.has(person), `pessoa ${person} duplicada na rodada (n=${n})`);
        seen.add(person);
      }
    }
  }
});

test('INVARIANTE 3 — número de rodadas e encontros por pessoa', () => {
  const par = buildRounds(ids(30));
  assert.equal(par.length, 29);
  assert.equal(par[0].length, 15);

  const impar = buildRounds(ids(29));
  assert.equal(impar.length, 29, 'com n ímpar são n rodadas, uma com descanso');
  assert.ok(impar.every((r) => r.length === 14));
});

test('cada pessoa encontra todas as outras', () => {
  const met = {};
  for (const [a, b] of buildRounds(ids(30)).flat()) {
    (met[a] ??= new Set()).add(b);
    (met[b] ??= new Set()).add(a);
  }
  for (const id of ids(30)) assert.equal(met[id].size, 29, `pessoa ${id}`);
});

test('menos de dois participantes não gera rodízio', () => {
  assert.deepEqual(buildRounds([]), []);
  assert.deepEqual(buildRounds([7]), []);
});

test('organizadores cobrem todos os pares e ficam equilibrados', () => {
  const rounds = buildRounds(ids(30));
  const org = assignOrganizers(rounds);
  assert.equal(Object.keys(org).length, 435);

  const load = {};
  for (const id of Object.values(org)) load[id] = (load[id] || 0) + 1;
  const values = ids(30).map((i) => load[i] || 0);
  assert.equal(values.reduce((a, b) => a + b, 0), 435);
  // média 14,5 — a distribuição não pode fugir muito disso
  assert.ok(Math.max(...values) - Math.min(...values) <= 6, `spread=${Math.max(...values) - Math.min(...values)}`);
});

test('o organizador é sempre um dos dois do par', () => {
  const rounds = buildRounds(ids(12));
  const org = assignOrganizers(rounds);
  for (const [a, b] of rounds.flat()) {
    assert.ok([a, b].includes(org[pairKey(a, b)]));
  }
});

test('datas caem só nos dias da semana escolhidos', () => {
  const dates = buildDates(29, '2026-09-08', [2, 4]); // terças e quintas
  assert.equal(dates.length, 29);
  assert.equal(dates[0], '2026-09-08');
  for (const d of dates) {
    const [y, m, day] = d.split('-').map(Number);
    assert.ok([2, 4].includes(new Date(y, m - 1, day).getDay()), `${d} não é terça nem quinta`);
  }
  // estritamente crescentes
  for (let i = 1; i < dates.length; i++) assert.ok(dates[i] > dates[i - 1]);
});

test('início que já cai num dia válido é aproveitado', () => {
  assert.equal(buildDates(1, '2026-09-10', [4])[0], '2026-09-10');
});

test('buildPlan liga cada par a uma rodada e uma data', () => {
  const all = PARTICIPANTS.map((p) => p.id);
  const { plan, rounds, dates } = buildPlan(all, { start: '2026-09-08', weekdays: [2, 4] });
  assert.equal(Object.keys(plan).length, 435);
  assert.equal(rounds.length, 29);
  for (const k of Object.keys(plan)) {
    assert.ok(plan[k].round >= 1 && plan[k].round <= 29);
    assert.equal(plan[k].date, dates[plan[k].round - 1]);
  }
});

test('desativar alguém encolhe o plano sem quebrar as invariantes', () => {
  const all = PARTICIPANTS.map((p) => p.id).filter((id) => id !== 23);
  const { plan, rounds } = buildPlan(all, { start: '2026-09-08', weekdays: [2, 4] });
  assert.equal(Object.keys(plan).length, (29 * 28) / 2);
  assert.ok(!Object.keys(plan).some((k) => k.split('-').map(Number).includes(23)));
  assert.equal(rounds.length, 29);
});

test('addMinutes soma com virada de hora', () => {
  assert.equal(addMinutes('14:00', 45), '14:45');
  assert.equal(addMinutes('14:30', 45), '15:15');
  assert.equal(addMinutes('23:30', 60), '00:30');
});

test('pct não divide por zero', () => {
  assert.equal(pct(0, 0), 0);
  assert.equal(pct(3, 4), 75);
});

test('participantes: ids únicos e campos obrigatórios', () => {
  const seen = new Set();
  for (const p of PARTICIPANTS) {
    assert.ok(!seen.has(p.id), `id duplicado: ${p.id}`);
    seen.add(p.id);
    assert.ok(p.n && p.c && p.e64, `campos faltando em ${p.id}`);
    assert.ok(['dir', 'head', 'ger'].includes(p.t), `nível inválido em ${p.n}`);
  }
});

// O e-mail vira convite do Teams e ATTENDEE do .ics. Um endereco repetido
// significa uma pessoa recebendo o 1x1 de outra — foi exatamente o defeito
// que veio na planilha de origem (Alexandre com o e-mail da Aline).
test('participantes: e-mails decodificam, sao validos e nao se repetem', () => {
  const seen = new Map();
  for (const p of PARTICIPANTS) {
    const e = mail(p);
    assert.match(e, /^[^@\s]+@[^@\s]+\.[^@\s]+$/, `e-mail inválido em ${p.n}`);
    assert.ok(!seen.has(e), `e-mail duplicado entre ${seen.get(e)} e ${p.n}: ${e}`);
    seen.set(e, p.n);
  }
});
