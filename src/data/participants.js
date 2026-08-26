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
 */
export const PARTICIPANTS = [
  { id: 1,  n: 'Paulo da Nobrega Sanford',         c: 'CEO',                                  e: 'paulo.sanford@wap.ind.br',    t: 'dir'  },
  { id: 2,  n: 'Bruna Hadad',                      c: 'CFO',                                  e: 'bruna.hadad@wap.ind.br',      t: 'dir'  },
  { id: 3,  n: 'Eucinei Cabral de Oliveira',       c: 'Diretor Comercial',                    e: 'eucinei.oliveira@wap.ind.br', t: 'dir'  },
  { id: 4,  n: 'Nestor Mariano Felpi',             c: 'Diretor de Operações',                 e: 'nestor.felpi@wap.ind.br',     t: 'dir'  },
  { id: 5,  n: 'Deliane Aparecida Correa',         c: 'Diretora de Controladoria',            e: 'deliane.correa@wap.ind.br',   t: 'dir'  },
  { id: 6,  n: 'Leandro de Azevedo',               c: 'Diretor de Negócios',                  e: 'leandro.azevedo@wap.ind.br',  t: 'dir'  },
  { id: 7,  n: 'Nelson Montenegro Filho',          c: 'Diretor de Filial',                    e: 'nelson.montenegro@wap.ind.br',t: 'dir'  },
  { id: 8,  n: 'Marcio Roberto Milleo',            c: 'Head de Controladoria',                e: 'marcio.milleo@wap.ind.br',    t: 'head' },
  { id: 9,  n: 'Luciano Custodio da Silva',        c: 'Head de Logística',                    e: 'luciano.custodio@wap.ind.br', t: 'head' },
  { id: 10, n: 'Tiago Campos da Veiga',            c: 'Head de Marketing',                    e: 'tiago.veiga@wap.ind.br',      t: 'head' },
  { id: 11, n: 'Diego Mafioletti',                 c: 'Head de PMO & BPM',                    e: 'diego.mafioletti@wap.ind.br', t: 'head' },
  { id: 12, n: 'Hideraldo Luis Simon Junior',      c: 'Head de Tecnologia da Informação',     e: 'hideraldo.junior@wap.ind.br', t: 'head' },
  { id: 13, n: 'Karine Suelen da Silva Fonseca',   c: 'Gerente Adm de Vendas e Demanda',      e: 'karine.fonseca@wap.ind.br',   t: 'ger'  },
  { id: 14, n: 'Marlon de Macedo Teixeira',        c: 'Gerente Comercial de Exportação',      e: 'marlon.macedo@wap.ind.br',    t: 'ger'  },
  { id: 15, n: 'Marcos Antonio Alves de Oliveira', c: 'Gerente de Customer Experience',       e: 'marcos.oliveira@wap.ind.br',  t: 'ger'  },
  { id: 16, n: 'Beatriz Momesso Paulino',          c: 'Gerente de Dados e IA',                e: 'beatriz.paulino@wap.ind.br',  t: 'ger'  },
  { id: 17, n: 'Alessandra de Souza Macedo',       c: 'Gerente de Ecommerce',                 e: 'alessandra.macedo@wap.ind.br',t: 'ger'  },
  { id: 18, n: 'Jean Carlo Cilivi',                c: 'Gerente de Growth Marketing',          e: 'jean.carlo@wap.ind.br',       t: 'ger'  },
  { id: 19, n: 'Loeyderson de Meira',              c: 'Gerente de Infraestrutura e TI',       e: 'loy.meira@wap.ind.br',        t: 'ger'  },
  { id: 20, n: 'Aline de Oliveira',                c: 'Gerente de Marketing',                 e: 'aline.oliveira@wap.ind.br',   t: 'ger'  },
  { id: 21, n: 'Vinicius de Moraes',               c: 'Gerente de Marketing',                 e: 'vinicius.moraes@wap.ind.br',  t: 'ger'  },
  { id: 22, n: 'Cicero Augusto Brandt',            c: 'Gerente de People',                    e: 'cicero.brandt@wap.ind.br',    t: 'ger'  },
  // ATENÇÃO: e-mail veio duplicado na planilha de origem (igual ao da Aline de Oliveira).
  // Corrija abaixo ou pela tela Participantes antes de disparar convites.
  { id: 23, n: 'Alexandre Garuti Pinheiro',        c: 'Gerente de Suprimentos',               e: 'aline.oliveira@wap.ind.br',   t: 'ger'  },
  { id: 24, n: 'Silvia Amelia Vilela Acevedo',     c: 'Gerente de Trade Marketing',           e: 'silvia.vilela@wap.ind.br',    t: 'ger'  },
  { id: 25, n: 'Pablo Roberto de Mello',           c: 'Gerente de Produção',                  e: 'pablo.mello@wap.ind.br',      t: 'ger'  },
  { id: 26, n: 'Patricia Almeida de Carvalho',     c: 'Gerente Financeiro',                   e: 'patricia.carvalho@wap.ind.br',t: 'ger'  },
  { id: 27, n: 'Mayra Aparecida Lucio dos Santos', c: 'Gerente de Inovação e Dev de Software',e: 'mayra.santos@wap.ind.br',     t: 'ger'  },
  { id: 28, n: 'Bruno Balduino',                   c: 'Gerente Jurídico',                     e: 'bruno.balduino@wap.ind.br',   t: 'ger'  },
  { id: 29, n: 'Felipe Pereira Cortez',            c: 'Gerente Regional de Vendas',           e: 'felipe.cortez@wap.ind.br',    t: 'ger'  },
  { id: 30, n: 'Thiago Lira Xavier',               c: 'Gerente Regional de Vendas',           e: 'thiago.xavier@wap.ind.br',    t: 'ger'  }
];

export const TIERS = {
  dir:  { label: 'Diretoria', cls: 'av-dir'  },
  head: { label: 'Head',      cls: 'av-head' },
  ger:  { label: 'Gerência',  cls: 'av-ger'  }
};

export const byId = (id) => PARTICIPANTS.find((p) => p.id === id);

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
