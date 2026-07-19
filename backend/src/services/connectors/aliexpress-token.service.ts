import axios from 'axios';
import crypto from 'crypto';
import cron from 'node-cron';
import prisma from '../../config/database';

/**
 * Gestion du token OAuth AliExpress avec auto-refresh.
 *
 * Contexte : l'access_token AliExpress expire en 24 h (refresh_token : 48 h,
 * statut d'app « Test »). Les variables d'env sont statiques sur Render, donc :
 *  - les tokens vivants sont gardés en mémoire et persistés dans la table
 *    `settings` (clé `aliexpress_tokens`) pour survivre aux redémarrages ;
 *  - ALIEXPRESS_ACCESS_TOKEN / ALIEXPRESS_REFRESH_TOKEN ne servent que de
 *    graine initiale (premier démarrage ou après ré-autorisation manuelle) ;
 *  - le refresh est déclenché à la demande (marge 30 min avant expiration)
 *    et par un cron toutes les 6 h.
 *
 * Si le refresh_token expire aussi (serveur arrêté > 48 h), il faut refaire
 * l'autorisation OAuth dans la console openservice.aliexpress.com et mettre à
 * jour les variables d'env — l'erreur levée l'explique.
 */

const REST_URL = () => process.env.ALIEXPRESS_REST_URL || 'https://api-sg.aliexpress.com/rest';
const SETTINGS_KEY = 'aliexpress_tokens';
const REFRESH_MARGIN_MS = 30 * 60 * 1000;

interface TokenState {
  accessToken: string;
  refreshToken: string;
  /** Epoch ms d'expiration de l'access token (0 = inconnu → refresh au 1er usage). */
  expireAt: number;
  /** Epoch ms d'expiration du refresh token (0 = inconnu). */
  refreshExpireAt: number;
}

let state: TokenState | null = null;
let inflight: Promise<string> | null = null;

/** Signature GOP pour les endpoints /rest : HMAC-SHA256(path + params triés). */
function signRest(path: string, params: Record<string, string>, secret: string): string {
  const base = path + Object.keys(params).sort().map((k) => `${k}${params[k]}`).join('');
  return crypto.createHmac('sha256', secret).update(base, 'utf8').digest('hex').toUpperCase();
}

async function loadState(): Promise<TokenState | null> {
  if (state) return state;
  try {
    const row = await prisma.settings.findUnique({ where: { key: SETTINGS_KEY } });
    if (row) {
      const parsed = JSON.parse(row.value) as TokenState;
      if (parsed?.accessToken && parsed?.refreshToken) {
        state = parsed;
        return state;
      }
    }
  } catch (e: any) {
    console.error('[aliexpress-token] lecture settings impossible:', e.message);
  }
  const envAccess = process.env.ALIEXPRESS_ACCESS_TOKEN;
  const envRefresh = process.env.ALIEXPRESS_REFRESH_TOKEN;
  if (envAccess) {
    state = { accessToken: envAccess, refreshToken: envRefresh || '', expireAt: 0, refreshExpireAt: 0 };
    return state;
  }
  return null;
}

async function persistState(s: TokenState): Promise<void> {
  try {
    await prisma.settings.upsert({
      where: { key: SETTINGS_KEY },
      update: { value: JSON.stringify(s), type: 'json' },
      create: { key: SETTINGS_KEY, value: JSON.stringify(s), type: 'json' },
    });
  } catch (e: any) {
    console.error('[aliexpress-token] persistance settings impossible:', e.message);
  }
}

async function refreshTokens(current: TokenState): Promise<TokenState> {
  const appKey = process.env.ALIEXPRESS_APP_KEY!;
  const appSecret = process.env.ALIEXPRESS_APP_SECRET!;
  if (!current.refreshToken) {
    throw new Error('Refresh token AliExpress absent — refaites l’autorisation OAuth et renseignez ALIEXPRESS_REFRESH_TOKEN');
  }

  const path = '/auth/token/refresh';
  const params: Record<string, string> = {
    app_key: appKey,
    refresh_token: current.refreshToken,
    sign_method: 'sha256',
    timestamp: String(Date.now()),
  };
  params.sign = signRest(path, params, appSecret);

  const r = await axios.post(REST_URL() + path, new URLSearchParams(params).toString(), {
    headers: { 'content-type': 'application/x-www-form-urlencoded;charset=utf-8' },
    timeout: 30000,
  });
  const d = r.data || {};
  if (!d.access_token) {
    throw new Error(`Refresh du token AliExpress refusé: ${JSON.stringify(d).slice(0, 300)} — si le refresh_token a expiré (48 h), refaites l’autorisation OAuth dans la console openservice.aliexpress.com`);
  }
  const next: TokenState = {
    accessToken: String(d.access_token),
    refreshToken: String(d.refresh_token || current.refreshToken),
    expireAt: Number(d.expire_time) || Date.now() + Number(d.expires_in || 86400) * 1000,
    refreshExpireAt: Number(d.refresh_token_valid_time) || Date.now() + Number(d.refresh_expires_in || 172800) * 1000,
  };
  await persistState(next);
  console.log(`[aliexpress-token] token rafraîchi, expire ${new Date(next.expireAt).toISOString()}`);
  return next;
}

/**
 * Retourne un access token valide, en le rafraîchissant si nécessaire.
 * À utiliser à la place de process.env.ALIEXPRESS_ACCESS_TOKEN.
 */
export async function getAliExpressSession(): Promise<string> {
  const s = await loadState();
  if (!s) {
    throw new Error('Token AliExpress manquant (ALIEXPRESS_ACCESS_TOKEN) — faites l’autorisation OAuth de l’app dans la console openservice.aliexpress.com');
  }
  if (s.expireAt && s.expireAt - Date.now() > REFRESH_MARGIN_MS) {
    return s.accessToken;
  }
  if (!inflight) {
    inflight = refreshTokens(s)
      .then((next) => {
        state = next;
        return next.accessToken;
      })
      .catch((e) => {
        // Repli : si un refresh échoue mais qu'un access token existe encore,
        // on tente avec lui (il est peut-être toujours valide) en loggant l'erreur.
        console.error('[aliexpress-token] refresh échoué:', e.message);
        if (s.accessToken) return s.accessToken;
        throw e;
      })
      .finally(() => { inflight = null; });
  }
  return inflight;
}

/** Cron de maintien : rafraîchit bien avant les 24 h d'expiration. */
export function scheduleAliExpressTokenRefresh() {
  if (!process.env.ALIEXPRESS_APP_KEY || !process.env.ALIEXPRESS_APP_SECRET) return;
  const expr = process.env.ALIEXPRESS_TOKEN_REFRESH_CRON || '15 */6 * * *';
  cron.schedule(expr, () => {
    getAliExpressSession().catch((e) => console.error('[aliexpress-token]', e.message));
  });
  console.log(`[aliexpress-token] refresh planifié : ${expr}`);
}
