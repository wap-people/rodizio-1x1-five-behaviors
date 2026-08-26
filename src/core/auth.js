/**
 * Login sem senha, por link enviado no e-mail corporativo.
 *
 * Por que assim: o site é estático e público, e a regra do Firestore exige
 * `request.auth.token.email` terminando em @wap.ind.br. Login com a Microsoft
 * seria o ideal (o tenant da WAP já é Entra ID), mas exige registro de app no
 * Azure com o TI. O link por e-mail entrega a mesma garantia — só entra quem
 * tem acesso à caixa @wap.ind.br — sem depender de ninguém.
 *
 * O provedor "E-mail/senha" fica ligado no console porque o Firebase não
 * permite ativar o link isoladamente. O app nunca oferece cadastro por senha,
 * e a regra exige `email_verified`, que só o link produz — cadastro por senha
 * nasce com `email_verified: false` e não alcança os dados.
 */
import { loadFirebase, withTimeout, TIMEOUT_MS } from './firebase.js';

const PENDING_EMAIL = 'rodizio1x1:pendingEmail:v1';
const CORPORATE = /^[^@\s]+@wap\.ind\.br$/i;

export const isCorporate = (email) => CORPORATE.test(String(email || '').trim());

/** URL de retorno do link. Sem query nem hash: precisa bater com o domínio autorizado. */
const returnUrl = () => window.location.origin + window.location.pathname;

export async function createAuth(cfg) {
  const { au, auth } = await loadFirebase(cfg);

  return {
    get user() {
      return auth.currentUser;
    },

    /** Resolve no primeiro estado conhecido — evita piscar a tela de login em quem já entrou. */
    ready() {
      return new Promise((resolve) => {
        const off = au.onAuthStateChanged(auth, (u) => {
          off();
          resolve(u);
        });
      });
    },

    onChange(cb) {
      return au.onAuthStateChanged(auth, cb);
    },

    async sendLink(email) {
      const to = String(email || '').trim().toLowerCase();
      if (!isCorporate(to)) throw new Error('Use seu e-mail @wap.ind.br.');

      await withTimeout(
        au.sendSignInLinkToEmail(auth, to, { url: returnUrl(), handleCodeInApp: true }),
        TIMEOUT_MS.write, 'enviar o link'
      );

      // Guardado para fechar o ciclo sem pedir o e-mail de novo na volta.
      try {
        localStorage.setItem(PENDING_EMAIL, to);
      } catch {
        /* modo anônimo: vamos pedir o e-mail de novo ao voltar */
      }
      return to;
    },

    /**
     * Conclui o login quando a pessoa volta pelo link do e-mail.
     * @returns {Promise<{done:boolean, needsEmail?:boolean, error?:string}>}
     */
    async finishLinkSignIn() {
      if (!au.isSignInWithEmailLink(auth, window.location.href)) return { done: false };

      let email = '';
      try {
        email = localStorage.getItem(PENDING_EMAIL) || '';
      } catch { /* segue sem */ }

      // Link aberto em outro aparelho ou outro navegador: só o e-mail resolve.
      if (!email) return { done: false, needsEmail: true };

      try {
        await withTimeout(
          au.signInWithEmailLink(auth, email, window.location.href),
          TIMEOUT_MS.write, 'concluir o login'
        );
        try { localStorage.removeItem(PENDING_EMAIL); } catch { /* ok */ }
        // Tira o código da barra de endereço: link de login não deve ficar no histórico.
        window.history.replaceState({}, '', returnUrl());
        return { done: true };
      } catch (err) {
        window.history.replaceState({}, '', returnUrl());
        return { done: false, error: friendly(err) };
      }
    },

    /** Usado quando o link foi aberto em outro aparelho. */
    async finishWithEmail(email) {
      const to = String(email || '').trim().toLowerCase();
      if (!isCorporate(to)) throw new Error('Use seu e-mail @wap.ind.br.');
      await withTimeout(
        au.signInWithEmailLink(auth, to, window.location.href),
        TIMEOUT_MS.write, 'concluir o login'
      );
      try { localStorage.removeItem(PENDING_EMAIL); } catch { /* ok */ }
      window.history.replaceState({}, '', returnUrl());
    },

    signOut() {
      return au.signOut(auth);
    }
  };
}

function friendly(err) {
  const code = err?.code || '';
  if (code === 'auth/invalid-action-code') return 'Este link já foi usado ou expirou. Peça um novo.';
  if (code === 'auth/expired-action-code') return 'Este link expirou. Peça um novo.';
  if (code === 'auth/invalid-email') return 'E-mail inválido.';
  return err?.message || 'Não consegui concluir o login.';
}
