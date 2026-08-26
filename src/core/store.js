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
 */

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
      const V = cfg.sdkVersion || '10.12.2';
      const [{ initializeApp }, fs] = await Promise.all([
        import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`),
        import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`)
      ]);
      mods = fs;
      db = fs.getFirestore(initializeApp(cfg));
      ref = fs.doc(db, path, docId);
    },
    async read() {
      const snap = await mods.getDoc(ref);
      const d = snap.exists() ? snap.data() : {};
      return { status: d.status || {}, config: d.config || {} };
    },
    async write(patch) {
      await mods.setDoc(ref, patch, { merge: true });
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
 * @param {object} storageCfg  config.storage vindo de config.js
 * @returns {{driver:string, shared:boolean, degraded:boolean, load, saveStatus, saveConfig, getMe, setMe, watch}}
 */
export async function createStore(storageCfg) {
  const wanted = storageCfg?.driver || 'local';
  let driver;
  let degraded = false;

  if (wanted === 'firebase' && storageCfg.firebase?.projectId) {
    driver = firebaseDriver(storageCfg.firebase);
    try {
      await driver.init();
    } catch (err) {
      console.warn('[store] Firestore indisponível, caindo para localStorage.', err);
      driver = localDriver();
      degraded = true;
    }
  } else {
    driver = localDriver();
    await driver.init();
  }

  let cache = { status: {}, config: {} };

  return {
    driver: driver.name,
    shared: driver.shared,
    degraded,
    async load() {
      cache = await driver.read();
      return cache;
    },
    async saveStatus(status) {
      cache = { ...cache, status };
      await driver.write({ status });
    },
    async saveConfig(config) {
      cache = { ...cache, config };
      await driver.write({ config });
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
      driver.watch?.((data) => {
        cache = data;
        cb(data);
      });
    }
  };
}
