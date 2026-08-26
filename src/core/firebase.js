/**
 * Carregamento do SDK do Firebase, compartilhado entre o Firestore (store.js)
 * e o login (auth.js).
 *
 * Precisa ser um ponto único: `initializeApp` chamado duas vezes com a mesma
 * configuração lança `app/duplicate-app`. Aqui a promessa é memoizada, então
 * quem chamar primeiro carrega e os demais reaproveitam.
 */

/**
 * O SDK do Firestore não rejeita quando o backend está inacessível: ele
 * repete indefinidamente. Sem isto, projeto mal configurado, banco não criado
 * ou CDN bloqueada pela rede corporativa deixam o app parado no "Carregando"
 * para sempre, e nenhum try/catch chega a rodar.
 */
export const TIMEOUT_MS = { read: 6000, write: 8000 };

export function withTimeout(promise, ms, acao) {
  let t;
  return Promise.race([
    promise.finally(() => clearTimeout(t)),
    new Promise((_, reject) => {
      t = setTimeout(() => reject(new Error(`Firebase não respondeu em ${ms}ms (${acao}).`)), ms);
    })
  ]);
}

let pending = null;

/** @returns {Promise<{app:object, fs:object, au:object, auth:object}>} */
export function loadFirebase(cfg) {
  if (!pending) pending = start(cfg);
  return pending;
}

async function start(cfg) {
  const V = cfg.sdkVersion || '10.12.2';
  const base = `https://www.gstatic.com/firebasejs/${V}`;

  // A CDN do gstatic também pode estar bloqueada na rede da empresa.
  const [appMod, fs, au] = await withTimeout(Promise.all([
    import(`${base}/firebase-app.js`),
    import(`${base}/firebase-firestore.js`),
    import(`${base}/firebase-auth.js`)
  ]), TIMEOUT_MS.read, 'carregar o SDK');

  const app = appMod.initializeApp(cfg);
  return { app, fs, au, auth: au.getAuth(app) };
}
