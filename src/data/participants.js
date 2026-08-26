/**
 * Participantes do rodízio 1x1 · The Five Behaviors.
 *
 * Este é o único arquivo que precisa ser editado quando alguém entra ou sai
 * da liderança. Cada `id` é permanente: nunca reaproveite o id de quem saiu,
 * porque os registros de encontros concluídos são gravados pelo par de ids.
 * Para tirar alguém do rodízio sem perder o histórico, use "Desativar" na
 * própria interface (tela Participantes) em vez de apagar a linha aqui.
 *
 * t: 'dir' (Diretoria) | 'head' (Head) | 'ger' (Gerência)
 *
 * `e64` é o e-mail em Base64. Isso NÃO é criptografia — é para o repositório
 * público e o HTML servido não conterem 30 endereços @wap.ind.br em texto
 * plano, que é o formato que os coletores automáticos de e-mail procuram.
 * Quem lê o código decodifica em um segundo; proteção de verdade seria fechar
 * o site atrás de login (veja "Privacidade" no README).
 *
 * Para gerar ou conferir um e64:  npm run email -- alguem@wap.ind.br
 */
export const PARTICIPANTS = [
  { id: 1,  n: 'Paulo da Nobrega Sanford',        c: 'CEO',                                  t: 'dir',   e64: 'cGF1bG8uc2FuZm9yZEB3YXAuaW5kLmJy' },
  { id: 2,  n: 'Bruna Hadad',                     c: 'CFO',                                  t: 'dir',   e64: 'YnJ1bmEuaGFkYWRAd2FwLmluZC5icg==' },
  { id: 3,  n: 'Eucinei Cabral de Oliveira',      c: 'Diretor Comercial',                    t: 'dir',   e64: 'ZXVjaW5laS5vbGl2ZWlyYUB3YXAuaW5kLmJy' },
  { id: 4,  n: 'Nestor Mariano Felpi',            c: 'Diretor de Operações',                 t: 'dir',   e64: 'bmVzdG9yLmZlbHBpQHdhcC5pbmQuYnI=' },
  { id: 5,  n: 'Deliane Aparecida Correa',        c: 'Diretora de Controladoria',            t: 'dir',   e64: 'ZGVsaWFuZS5jb3JyZWFAd2FwLmluZC5icg==' },
  { id: 6,  n: 'Leandro de Azevedo',              c: 'Diretor de Negócios',                  t: 'dir',   e64: 'bGVhbmRyby5hemV2ZWRvQHdhcC5pbmQuYnI=' },
  { id: 7,  n: 'Nelson Montenegro Filho',         c: 'Diretor de Filial',                    t: 'dir',   e64: 'bmVsc29uLm1vbnRlbmVncm9Ad2FwLmluZC5icg==' },
  { id: 8,  n: 'Marcio Roberto Milleo',           c: 'Head de Controladoria',                t: 'head',  e64: 'bWFyY2lvLm1pbGxlb0B3YXAuaW5kLmJy' },
  { id: 9,  n: 'Luciano Custodio da Silva',       c: 'Head de Logística',                    t: 'head',  e64: 'bHVjaWFuby5jdXN0b2Rpb0B3YXAuaW5kLmJy' },
  { id: 10, n: 'Tiago Campos da Veiga',           c: 'Head de Marketing',                    t: 'head',  e64: 'dGlhZ28udmVpZ2FAd2FwLmluZC5icg==' },
  { id: 11, n: 'Diego Mafioletti',                c: 'Head de PMO & BPM',                    t: 'head',  e64: 'ZGllZ28ubWFmaW9sZXR0aUB3YXAuaW5kLmJy' },
  { id: 12, n: 'Hideraldo Luis Simon Junior',     c: 'Head de Tecnologia da Informação',     t: 'head',  e64: 'aGlkZXJhbGRvLmp1bmlvckB3YXAuaW5kLmJy' },
  { id: 13, n: 'Karine Suelen da Silva Fonseca',  c: 'Gerente Adm de Vendas e Demanda',      t: 'ger',   e64: 'a2FyaW5lLmZvbnNlY2FAd2FwLmluZC5icg==' },
  { id: 14, n: 'Marlon de Macedo Teixeira',       c: 'Gerente Comercial de Exportação',      t: 'ger',   e64: 'bWFybG9uLm1hY2Vkb0B3YXAuaW5kLmJy' },
  { id: 15, n: 'Marcos Antonio Alves de Oliveira', c: 'Gerente de Customer Experience',       t: 'ger',   e64: 'bWFyY29zLm9saXZlaXJhQHdhcC5pbmQuYnI=' },
  { id: 16, n: 'Beatriz Momesso Paulino',         c: 'Gerente de Dados e IA',                t: 'ger',   e64: 'YmVhdHJpei5wYXVsaW5vQHdhcC5pbmQuYnI=' },
  { id: 17, n: 'Alessandra de Souza Macedo',      c: 'Gerente de Ecommerce',                 t: 'ger',   e64: 'YWxlc3NhbmRyYS5tYWNlZG9Ad2FwLmluZC5icg==' },
  { id: 18, n: 'Jean Carlo Cilivi',               c: 'Gerente de Growth Marketing',          t: 'ger',   e64: 'amVhbi5jYXJsb0B3YXAuaW5kLmJy' },
  { id: 19, n: 'Loeyderson de Meira',             c: 'Gerente de Infraestrutura e TI',       t: 'ger',   e64: 'bG95Lm1laXJhQHdhcC5pbmQuYnI=' },
  { id: 20, n: 'Aline de Oliveira',               c: 'Gerente de Marketing',                 t: 'ger',   e64: 'YWxpbmUub2xpdmVpcmFAd2FwLmluZC5icg==' },
  { id: 21, n: 'Vinicius de Moraes',              c: 'Gerente de Marketing',                 t: 'ger',   e64: 'dmluaWNpdXMubW9yYWVzQHdhcC5pbmQuYnI=' },
  { id: 22, n: 'Cicero Augusto Brandt',           c: 'Gerente de People',                    t: 'ger',   e64: 'Y2ljZXJvLmJyYW5kdEB3YXAuaW5kLmJy' },
  { id: 23, n: 'Alexandre Garuti Pinheiro',       c: 'Gerente de Suprimentos',               t: 'ger',   e64: 'YWxleGFuZHJlLnBpbmhlaXJvQHdhcC5pbmQuYnI=' },
  { id: 24, n: 'Silvia Amelia Vilela Acevedo',    c: 'Gerente de Trade Marketing',           t: 'ger',   e64: 'c2lsdmlhLnZpbGVsYUB3YXAuaW5kLmJy' },
  { id: 25, n: 'Pablo Roberto de Mello',          c: 'Gerente de Produção',                  t: 'ger',   e64: 'cGFibG8ubWVsbG9Ad2FwLmluZC5icg==' },
  { id: 26, n: 'Patricia Almeida de Carvalho',    c: 'Gerente Financeiro',                   t: 'ger',   e64: 'cGF0cmljaWEuY2FydmFsaG9Ad2FwLmluZC5icg==' },
  { id: 27, n: 'Mayra Aparecida Lucio dos Santos', c: 'Gerente de Inovação e Dev de Software', t: 'ger',   e64: 'bWF5cmEuc2FudG9zQHdhcC5pbmQuYnI=' },
  { id: 28, n: 'Bruno Balduino',                  c: 'Gerente Jurídico',                     t: 'ger',   e64: 'YnJ1bm8uYmFsZHVpbm9Ad2FwLmluZC5icg==' },
  { id: 29, n: 'Felipe Pereira Cortez',           c: 'Gerente Regional de Vendas',           t: 'ger',   e64: 'ZmVsaXBlLmNvcnRlekB3YXAuaW5kLmJy' },
  { id: 30, n: 'Thiago Lira Xavier',              c: 'Gerente Regional de Vendas',           t: 'ger',   e64: 'dGhpYWdvLnhhdmllckB3YXAuaW5kLmJy' }
];

export const TIERS = {
  dir:  { label: 'Diretoria', cls: 'av-dir'  },
  head: { label: 'Head',      cls: 'av-head' },
  ger:  { label: 'Gerência',  cls: 'av-ger'  }
};

export const byId = (id) => PARTICIPANTS.find((p) => p.id === id);

/** Decodifica o `e64`. Ponto único de leitura de e-mail em todo o sistema. */
export function mail(p) {
  if (!p?.e64) return '';
  try {
    return atob(p.e64);
  } catch {
    return '';
  }
}

/** Iniciais para o avatar: primeira letra do primeiro e do último nome. */
export function initials(name) {
  const w = name.trim().split(/\s+/).filter((x) => x.length > 2 || /^[A-Z]/.test(x));
  return ((w[0] || '')[0] + (w[w.length - 1] || '')[0]).toUpperCase();
}

/** "Marcos Antonio Alves de Oliveira" -> "Marcos Oliveira" */
export function short(name) {
  const w = name.trim().split(/\s+/);
  return w.length < 2 ? name : `${w[0]} ${w[w.length - 1]}`;
}
