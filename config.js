/**
 * Configuração da implantação. É o único arquivo que a área de People precisa
 * mexer para trocar datas, link dos relatórios ou ligar o painel compartilhado.
 *
 * Nada aqui é segredo: como o site é estático, tudo neste arquivo fica visível
 * para quem abrir a página. Não coloque credencial que não possa ser pública —
 * as chaves do Firebase Web são identificadores públicos por design, e quem
 * protege os dados são as regras de segurança do Firestore (veja o README).
 */
export const CONFIG = {
  defaults: {
    /** Primeira rodada. A partir daqui o sistema procura os dias escolhidos. */
    start: '2026-09-08',

    /** Dias da semana das rodadas. 0=Dom, 1=Seg … 6=Sáb. */
    weekdays: [2, 4],

    /** Horário padrão de todas as rodadas (todos os pares da rodada em paralelo). */
    time: '14:00',

    /** Duração de cada 1x1, em minutos. */
    duration: 45,

    /** Pasta dos relatórios comparativos Five Behaviors (Long Vision). */
    driveUrl: 'https://drive.google.com/drive/folders/1WrTvfNq25rg3ib7S5G86TWlGntAtHDPT',

    /** Correções de e-mail feitas pela interface: { [id]: 'novo@wap.ind.br' } */
    emails: {},

    /** Ids fora do rodízio no momento (mantém o histórico). */
    disabled: []
  },

  storage: {
    /**
     * 'local'    → localStorage. Funciona no ato, sem configurar nada,
     *              mas cada pessoa vê só os próprios registros.
     * 'firebase' → Firestore. Painel único e em tempo real para todo mundo.
     *              Continua sendo site estático. Passo a passo no README.
     */
    driver: 'local',

    firebase: {
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: '',
      collection: 'rodizio',
      document: 'estado'
    }
  }
};
