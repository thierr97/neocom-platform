import axios from 'axios';
import {
  SupplierConnector, NormalizedSupplierProduct, SupplierOrderRequest,
  SupplierOrderResult, TrackingInfo, isMockMode,
} from './types';

/**
 * Connecteur CJ Dropshipping — API officielle v2 (developers.cjdropshipping.com).
 *
 * Prérequis (variables d'environnement) :
 *   CJ_EMAIL   — e-mail du compte CJ
 *   CJ_API_KEY — clé API générée dans CJ (My CJ → Authorization → API)
 *   CJ_API_URL — optionnel (défaut: https://developers.cjdropshipping.com/api2.0/v1)
 *
 * Avantages CJ : entrepôts EU/US (délais réduits vers les Antilles),
 * emballage neutre, sourcing à la demande des produits vus sur Temu/Shein.
 */

const BASE = () => process.env.CJ_API_URL || 'https://developers.cjdropshipping.com/api2.0/v1';

function hasKeys(): boolean {
  return Boolean(process.env.CJ_EMAIL && process.env.CJ_API_KEY);
}

// Cache du token (valable ~15 jours côté CJ ; on garde 12h par prudence)
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token;
  const r = await axios.post(`${BASE()}/authentication/getAccessToken`, {
    email: process.env.CJ_EMAIL,
    password: process.env.CJ_API_KEY,
  }, { timeout: 20000 });
  const token = r.data?.data?.accessToken;
  if (!token) throw new Error(`Authentification CJ échouée: ${r.data?.message || 'réponse inattendue'}`);
  cachedToken = { token, expiresAt: Date.now() + 12 * 3600 * 1000 };
  return token;
}

async function cjGet(path: string, params: Record<string, any>): Promise<any> {
  const token = await getToken();
  const r = await axios.get(`${BASE()}${path}`, {
    params,
    headers: { 'CJ-Access-Token': token },
    timeout: 30000,
  });
  if (r.data?.result === false || (r.data?.code && r.data.code !== 200)) {
    throw new Error(`CJ API: ${r.data?.message || 'erreur inconnue'}`);
  }
  return r.data?.data;
}

async function cjPost(path: string, body: Record<string, any>): Promise<any> {
  const token = await getToken();
  const r = await axios.post(`${BASE()}${path}`, body, {
    headers: { 'CJ-Access-Token': token },
    timeout: 30000,
  });
  if (r.data?.result === false || (r.data?.code && r.data.code !== 200)) {
    throw new Error(`CJ API: ${r.data?.message || 'erreur inconnue'}`);
  }
  return r.data?.data;
}

/** Extrait le pid d'une URL CJ (…-p-XXXXXXXX.html ou ?pid=). */
export function cjIdFromUrl(url: string): string | null {
  const m = url.match(/[?&]pid=([A-F0-9-]{8,40})/i) || url.match(/-p-([A-F0-9]{8,40})\.html/i);
  return m ? m[1] : null;
}

function mockProduct(externalId: string | null, url: string | null): NormalizedSupplierProduct {
  return {
    platform: 'CJDROPSHIPPING',
    externalId: externalId || 'MOCK-CJ-PID-0001',
    sourceUrl: url,
    title: '[SIMULATION] Organisateur de tiroir extensible en bambou',
    description: 'Organisateur de couverts en bambou naturel, extensible de 30 à 55 cm, 7 compartiments.',
    images: ['https://cf.cjdropshipping.com/mock-1.jpg'],
    costPrice: 6.8,
    shippingCost: 3.5,
    currency: 'USD',
    stockQty: 1200,
    deliveryDaysMin: 6,
    deliveryDaysMax: 14,
    attributes: { matiere: 'Bambou', dimensions: '30-55 × 44 × 6 cm', entrepot: 'EU (Allemagne)' },
    variants: [{ key: 'CJSKU-STD', label: 'Standard', price: 6.8, stock: 1200 }],
    rawText: 'Données simulées (SOURCING_MOCK=1) — ajoutez CJ_EMAIL et CJ_API_KEY pour les données réelles.',
    mock: true,
  };
}

export class CJConnector implements SupplierConnector {
  readonly platform = 'CJDROPSHIPPING' as const;

  isConfigured(): boolean {
    return hasKeys() || isMockMode();
  }

  supportsAutoOrder(): boolean {
    return hasKeys() || isMockMode();
  }

  async fetchProduct(ref: { externalId?: string | null; url?: string | null }): Promise<NormalizedSupplierProduct> {
    const externalId = ref.externalId || (ref.url ? cjIdFromUrl(ref.url) : null);
    if (!hasKeys()) {
      if (isMockMode()) return mockProduct(externalId, ref.url || null);
      throw new Error('Clés API CJ manquantes (CJ_EMAIL / CJ_API_KEY). Générez une clé dans CJ → Authorization → API, ou activez SOURCING_MOCK=1 pour tester.');
    }
    if (!externalId) throw new Error("Impossible d'extraire le pid CJ de la référence fournie");

    const p = await cjGet('/product/query', { pid: externalId });
    if (!p) throw new Error(`Produit CJ introuvable (pid=${externalId})`);

    const variants: any[] = Array.isArray(p.variants) ? p.variants : [];
    const images: string[] = (() => {
      try {
        const arr = typeof p.productImage === 'string' && p.productImage.startsWith('[')
          ? JSON.parse(p.productImage) : [p.productImage];
        return (Array.isArray(arr) ? arr : []).filter(Boolean).slice(0, 8);
      } catch { return p.productImage ? [String(p.productImage)] : []; }
    })();

    return {
      platform: 'CJDROPSHIPPING',
      externalId,
      sourceUrl: ref.url || null,
      title: p.productNameEn || p.productName || null,
      description: String(p.description || '').replace(/<[^>]+>/g, ' ').slice(0, 3000) || null,
      images,
      costPrice: Number(p.sellPrice) || null,
      shippingCost: null, // calculé via logistic/freightCalculate à la commande
      currency: 'USD',
      stockQty: variants.reduce((a, v) => a + (Number(v.variantStandard ? v.stock : v.stock) || 0), 0) || null,
      deliveryDaysMin: 6,
      deliveryDaysMax: 20,
      attributes: {
        categorie: p.categoryName || '',
        poids: p.packWeight ? `${p.packWeight} g` : '',
        materiau: p.materialNameEn || '',
      },
      variants: variants.slice(0, 20).map((v) => ({
        key: String(v.vid || v.variantSku || ''),
        label: String(v.variantNameEn || v.variantKey || ''),
        price: Number(v.variantSellPrice) || null,
        stock: Number(v.stock) || null,
      })),
      rawText: '',
    };
  }

  async refreshPricingStock(ref: { externalId?: string | null; url?: string | null; variantKey?: string | null }) {
    const p = await this.fetchProduct(ref);
    const variant = ref.variantKey ? p.variants.find((v) => v.key === ref.variantKey) : null;
    return {
      costPrice: variant?.price ?? p.costPrice,
      shippingCost: p.shippingCost,
      stockQty: variant?.stock ?? p.stockQty,
    };
  }

  async placeOrder(req: SupplierOrderRequest): Promise<SupplierOrderResult> {
    if (!hasKeys()) {
      if (isMockMode()) {
        return { placed: true, externalOrderId: `MOCK-CJ-${Date.now()}`, message: 'Commande simulée (SOURCING_MOCK=1)' };
      }
      throw new Error('Clés API CJ manquantes — auto-commande impossible');
    }

    const data = await cjPost('/shopping/order/createOrderV2', {
      orderNumber: req.internalRef,
      shippingZip: req.recipient.postalCode,
      shippingCountryCode: req.recipient.country || 'GP',
      shippingCountry: req.recipient.country === 'GP' ? 'Guadeloupe' : req.recipient.country,
      shippingProvince: '',
      shippingCity: req.recipient.city,
      shippingAddress: req.recipient.address,
      shippingCustomerName: req.recipient.fullName,
      shippingPhone: req.recipient.phone || '',
      logisticName: process.env.CJ_LOGISTIC_NAME || 'CJPacket Ordinary',
      fromCountryCode: process.env.CJ_FROM_COUNTRY || 'CN',
      payType: 2, // solde CJ (à approvisionner dans le compte CJ)
      products: [{ vid: req.variantKey || req.externalProductId, quantity: req.quantity }],
    });

    const externalOrderId = data?.orderId ? String(data.orderId) : null;
    return {
      placed: Boolean(externalOrderId),
      externalOrderId,
      message: externalOrderId ? 'Commande CJ créée' : 'Réponse CJ sans orderId',
    };
  }

  async getTracking(externalOrderId: string): Promise<TrackingInfo> {
    if (!hasKeys()) {
      if (isMockMode()) {
        return { trackingNumber: 'MOCKCJ456FR', carrier: 'CJPacket', trackingUrl: 'https://www.trackingmore.com/track/en/MOCKCJ456FR', status: 'IN_TRANSIT', delivered: false };
      }
      throw new Error('Clés API CJ manquantes');
    }
    const data = await cjGet('/shopping/order/getOrderDetail', { orderId: externalOrderId });
    const trackingNumber = data?.trackNumber || null;
    return {
      trackingNumber,
      carrier: data?.logisticName || null,
      trackingUrl: trackingNumber ? `https://www.17track.net/fr#nums=${trackingNumber}` : null,
      status: data?.orderStatus || null,
      delivered: /DELIVERED/i.test(String(data?.orderStatus || '')),
    };
  }
}

export const cjConnector = new CJConnector();
