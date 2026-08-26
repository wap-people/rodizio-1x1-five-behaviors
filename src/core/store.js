/**
 * Persistência com drivers plugáveis, escolhidos em config.js.
 *
 *  'local'    — localStorage. Zero configuração, funciona no GitHub Pages na hora,
 *               mas cada pessoa enxerga só os próprios registros.
 *  'firebase' — Firestore. Todo mundo vê e edita o mesmo painel, em tempo real,
 *               continua sendo site estático (sem servidor). Requer o projeto
 *               Firebase criado e o objeto `firebase` preenchido em config.js.
 *  'memory'   — fallback automático quando nada mais está disponível.
 *
 * Guardamos dois documentos lógicos: `status` (registros dos encontros) e
 * `config` (calendário, e-mails corrigidos, desativados). A identificação
 * "quem sou eu" é sempre local ao dispositivo, nunca compartilhada.
 *
 * O Firestore aqui exige login: a regra de segurança só libera para conta
 * @wap.ind.br autenticada. Quem cuida disso é `auth.js`, antes do boot.
 */
import { loadFirebase, withTimeout, TIMEOUT_MS } from './firebase.js';

const K = {
  status: 'rodizio1x1:status:v1',
  config: 'rodizio1x1:config:v1',
  me: 'rodizio1x1:me:v1'
};

const safeParse = (raw, fallback) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

/* ─────────────── driver: memória ─────────────── */
function memoryDriver() {
  let state = { status: {}, config: {} };
  return {
    name: 'memory',
    shared: false,
    async init() {},
    async read() {
      return state;
    },
    async write(patch) {
      state = { ...state, ...patch };
    },
    watch() {}
  };
}

/* ─────────────── driver: localStorage ─────────────── */
function localDriver() {
  const ok = (() => {
    try {
      localStorage.setItem('__t', '1');
      localStorage.removeItem('__t');
      return true;
    } catch {
      return false;
    }
  })();
  if (!ok) return memoryDriver();

  return {
    name: 'local',
    shared: false,
    async init() {},
    async read() {
      return {
        status: safeParse(localStorage.getItem(K.status), {}),
        config: safeParse(localStorage.getItem(K.config), {})
      };
    },
    async write(patch) {
      if (patch.status) localStorage.setItem(K.status, JSON.stringify(patch.status));
      if (patch.config) localStorage.setItem(K.config, JSON.stringify(patch.config));
    },
    // outra aba do mesmo navegador altera → reflete aqui
    watch(cb) {
      window.addEventListener('storage', (e) => {
        if (e.key === K.status || e.key === K.config) this.read().then(cb);
      });
    }
  };
}

/* ─────────────── driver: Firestore ─────────────── */
function firebaseDriver(cfg) {
  let db = null;
  let ref = null;
  let mods = null;
  const path = cfg.collection || 'rodizio';
  const docId = cfg.document || 'estado';

  return {
    name: 'firebase',
    shared: true,
    async init() {
      const { app, fs } = await loadFirebase(cfg);
      mods = fs;
      db = fs.getFirestore(app);
      ref = fs.doc(db, path, docId);
    },
    async read() {
      const snap = await withTimeout(mods.getDoc(ref), TIMEOUT_MS.read, 'leitura');
      const d = snap.exists() ? snap.data() : {};
      return { status: d.status || {}, config: d.config || {} };
    },
    async write(patch) {
      await withTimeout(mods.setDoc(ref, patch, { merge: true }), TIMEOUT_MS.write, 'escrita');
    },
    watch(cb) {
      mods.onSnapshot(ref, (snap) => {
        const d = snap.exists() ? snap.data() : {};
        cb({ status: d.status || {}, config: d.config || {} });
      });
    }
  };
}

/**
 * Degradar para local nao e detalhe de robustez: e o que separa "o painel
 * compartilhado esta fora do ar" de "o gestor clicou em Registrar 1x1, nao
 * aconteceu nada e o registro sumiu". Falha de leitura derruba o boot inteiro;
 * falha de escrita e pior ainda, porque e silenciosa.
 *
 * @param {object} storageCfg  config.storage vindo de config.js
 * @param {{onDegrade?: (msg: string) => void}} [hooks]
 */
export async function createStore(storageCfg, hooks = {}) {
  const wanted = storageCfg?.driver || 'local';
  let live;
  let backup = null;
  let degraded = false;

  if (wanted === 'firebase' && storageCfg.firebase?.projectId) {
    const remote = firebaseDriver(storageCfg.firebase);
    try {
      await remote.init();
      live = remote;
      backup = localDriver();
    } catch (err) {
      console.warn('[store] Firestore nao inicializou; seguindo em modo local.', err);
      live = localDriver();
      degraded = true;
    }
  } else {
    live = localDriver();
    await live.init();
  }

  /** Troca o Firestore pelo localStorage no meio da sessao, uma vez so. */
  function degrade(err, acao) {
    console.warn(`[store] Firestore falhou na ${acao}; seguindo em modo local.`, err);
    if (degraded || !backup) return;
    degraded = true;
    live = backup;
    backup = null;
    hooks.onDegrade?.('Firestore indisponível — o que você registrar fica só neste navegador.');
  }

  let cache = { status: {}, config: {} };

  return {
    get driver() {
      return live.name;
    },
    get shared() {
      return live.shared;
    },
    get degraded() {
      return degraded;
    },
    async load() {
      try {
        cache = await live.read();
      } catch (err) {
        degrade(err, 'leitura');
        cache = await live.read();
      }
      return cache;
    },
    async saveStatus(status) {
      cache = { ...cache, status };
      try {
        await live.write({ status });
      } catch (err) {
        degrade(err, 'escrita');
        await live.write({ status });
      }
    },
    async saveConfig(config) {
      cache = { ...cache, config };
      try {
        await live.write({ config });
      } catch (err) {
        degrade(err, 'escrita');
        await live.write({ config });
      }
    },
    getMe() {
      try {
        return localStorage.getItem(K.me) ? Number(localStorage.getItem(K.me)) : null;
      } catch {
        return null;
      }
    },
    setMe(id) {
      try {
        localStorage.setItem(K.me, String(id));
      } catch {
        /* modo anônimo: segue só nesta sessão */
      }
    },
    /** Recebe alterações feitas por outras pessoas (Firestore) ou outras abas. */
    watch(cb) {
      try {
        live.watch?.((data) => {
          cache = data;
          cb(data);
        });
      } catch (err) {
        console.warn('[store] sem atualizacao em tempo real.', err);
      }
    }
  };
}
