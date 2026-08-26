/**
 * Núcleo do rodízio. Funções puras, sem DOM e sem dependências —
 * é o que os testes em tests/schedule.test.mjs cobrem.
 *
 * INVARIANTES (não quebrar):
 *  1. Cada par de participantes se encontra exatamente uma vez no programa.
 *  2. Dentro de uma rodada, ninguém aparece em dois encontros.
 *  3. Com n participantes ativos, o programa tem n-1 rodadas (n par)
 *     ou n rodadas com um descanso por rodada (n ímpar).
 */

/** Chave canônica e estável de um par — sempre "menor-maior". */
export const pairKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);

/**
 * Round-robin pelo método do círculo.
 * Com n ímpar, insere um "fantasma" (id 0): quem cair com ele descansa na rodada.
 * @param {number[]} ids ids dos participantes ativos
 * @returns {Array<Array<[number,number]>>} rodadas → pares
 */
export function buildRounds(ids) {
  const list = ids.slice();
  if (list.length < 2) return [];
  if (list.length % 2) list.push(0);

  const n = list.length;
  const out = [];
  let arr = list.slice();

  for (let r = 0; r < n - 1; r++) {
    const pairs = [];
    for (let i = 0; i < n / 2; i++) {
      const a = arr[i];
      const b = arr[n - 1 - i];
      if (a && b) pairs.push([Math.min(a, b), Math.max(a, b)]);
    }
    out.push(pairs);
    // fixa a primeira posição e rotaciona o resto
    const rest = arr.slice(1);
    rest.unshift(rest.pop());
    arr = [arr[0], ...rest];
  }
  return out;
}

/**
 * Define quem dispara o convite de cada par, de forma determinística e
 * equilibrada: sempre quem tem menos convites acumulados até o momento.
 * Evita convite duplicado e distribui o trabalho.
 * @returns {Record<string, number>} pairKey → id do organizador
 */
export function assignOrganizers(rounds) {
  const count = {};
  const org = {};
  for (const [a, b] of rounds.flat()) {
    const ca = count[a] || 0;
    const cb = count[b] || 0;
    const chosen = ca < cb ? a : cb < ca ? b : Math.min(a, b);
    org[pairKey(a, b)] = chosen;
    count[chosen] = (count[chosen] || 0) + 1;
  }
  return org;
}

const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * Datas das rodadas: ocorrências sucessivas dos dias-da-semana escolhidos,
 * a partir de `start` (inclusive).
 * @param {number} count quantas datas
 * @param {string} start 'YYYY-MM-DD'
 * @param {number[]} weekdays 0=Dom … 6=Sáb
 */
export function buildDates(count, start, weekdays) {
  const days = (weekdays && weekdays.length ? weekdays : [2]).slice().sort();
  const [y, m, d] = start.split('-').map(Number);
  const cur = new Date(y, m - 1, d);
  const out = [];
  let guard = 0;
  while (out.length < count && guard++ < 20000) {
    if (days.includes(cur.getDay())) out.push(iso(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/**
 * Monta o plano completo do programa.
 * @returns {{rounds, organizers, dates, plan}} plan: pairKey → {round, date}
 */
export function buildPlan(activeIds, { start, weekdays }) {
  const rounds = buildRounds(activeIds);
  if (!rounds.length) return { rounds: [], organizers: {}, dates: [], plan: {} };

  const organizers = assignOrganizers(rounds);
  const dates = buildDates(rounds.length, start, weekdays);
  const plan = {};
  rounds.forEach((pairs, i) => {
    for (const [a, b] of pairs) plan[pairKey(a, b)] = { round: i + 1, date: dates[i] };
  });
  return { rounds, organizers, dates, plan };
}

/** Soma minutos a um "HH:MM", com virada de dia. */
export function addMinutes(hhmm, min) {
  let [h, m] = hhmm.split(':').map(Number);
  m += min;
  h += Math.floor(m / 60);
  m %= 60;
  h %= 24;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
