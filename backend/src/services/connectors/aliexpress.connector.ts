import axios from 'axios';
import crypto from 'crypto';
import {
  SupplierConnector, NormalizedSupplierProduct, SupplierOrderRequest,
  SupplierOrderResult, TrackingInfo, isMockMode,
} from './types';
import { getAliExpressSession } from './aliexpress-token.service';

/**
 * Connecteur AliExpress — API officielle dropshipping (AliExpress Open Platform).
 *
 * Prérequis (variables d'environnement) :
 *   ALIEXPRESS_APP_KEY      — clé d'application (console open.aliexpress.com)
 *   ALIEXPRESS_APP_SECRET   — secret d'application
 *   ALIEXPRESS_ACCESS_TOKEN — token de session obtenu via le flux OAuth de la console
 *                             (graine initiale ; ensuite auto-refresh + persistance en base,
 *                              voir aliexpress-token.service.ts)
 *   ALIEXPRESS_REFRESH_TOKEN — refresh token du même flux OAuth (48 h)
 *   ALIEXPRESS_API_URL      — optionnel (défaut: https://api-sg.aliexpress.com/sync)
 *
 * Sans clés : si SOURCING_MOCK=1, renvoie des données simulées (tests bout en bout) ;
 * sinon les appels échouent avec un message explicite.
 *
 * Méthodes de l'Open Platform utilisées (protocole TOP, signature HMAC-SHA256) :
 *   aliexpress.ds.product.get            — fiche produit dropshipping
 *   aliexpress.ds.order.create           — création de commande (auto-fulfillment)
 *   aliexpress.ds.order.tracking.get     — suivi logistique
 */

const API_URL = () => process.env.ALIEXPRESS_API_URL || 'https://api-sg.aliexpress.com/sync';

function hasKeys(): boolean {
  return Boolean(process.env.ALIEXPRESS_APP_KEY && process.env.ALIEXPRESS_APP_SECRET && process.env.ALIEXPRESS_ACCESS_TOKEN);
}

/** Signature TOP : HMAC-SHA256 des paramètres triés, hex majuscule. */
function signParams(params: Record<string, string>, secret: string): string {
  const sorted = Object.keys(params).sort();
  const base = sorted.map((k) => `${k}${params[k]}`).join('');
  return crypto.createHmac('sha256', secret).update(base, 'utf8').digest('hex').toUpperCase();
}

async function callAliExpress(method: string, bizParams: Record<string, any>): Promise<any> {
  const appKey = process.env.ALIEXPRESS_APP_KEY!;
  const appSecret = process.env.ALIEXPRESS_APP_SECRET!;
  const session = await getAliExpressSession(); // auto-refresh 24 h géré par aliexpress-token.service

  const params: Record<string, string> = {
    app_key: appKey,
    method,
    session,
    timestamp: String(Date.now()),
    sign_method: 'sha256',
    v: '2.0',
    format: 'json',
  };
  for (const [k, v] of Object.entries(bizParams)) {
    params[k] = typeof v === 'string' ? v : JSON.stringify(v);
  }
  params.sign = signParams(params, appSecret);

  const r = await axios.post(API_URL(), new URLSearchParams(params).toString(), {
    headers: { 'content-type': 'application/x-www-form-urlencoded;charset=utf-8' },
    timeout: 30000,
  });

  if (r.data?.error_response) {
    const e = r.data.error_response;
    throw new Error(`AliExpress API ${e.code || ''}: ${e.msg || 'erreur inconnue'}${e.sub_msg ? ` — ${e.sub_msg}` : ''}`);
  }
  return r.data;
}

/** Extrait l'id produit d'une URL AliExpress (…/item/1005001234567890.html). */
export function aliexpressIdFromUrl(url: string): string | null {
  const m = url.match(/item\/(\d{6,20})(?:\.html)?/) || url.match(/[?&]productId=(\d{6,20})/);
  return m ? m[1] : null;
}

function mockProduct(externalId: string | null, url: string | null): NormalizedSupplierProduct {
  return {
    platform: 'ALIEXPRESS',
    externalId: externalId || '1005000000000000',
    sourceUrl: url,
    title: '[SIMULATION] Coque silicone antichoc pour smartphone — plusieurs coloris',
    description: 'Coque de protection en silicone TPU souple, bords renforcés antichoc, compatible charge sans fil. Coloris : noir, bleu, rouge.',
    images: [
      'https://ae01.alicdn.com/kf/mock-image-1.jpg',
      'https://ae01.alicdn.com/kf/mock-image-2.jpg',
    ],
    costPrice: 2.35,
    shippingCost: 1.2,
    currency: 'EUR',
    stockQty: 5000,
    deliveryDaysMin: 12,
    deliveryDaysMax: 25,
    attributes: { matiere: 'Silicone TPU', compatibilite: 'iPhone 15 / 15 Pro', couleur: 'Noir, Bleu, Rouge' },
    variants: [
      { key: 'SKU-NOIR', label: 'Noir', price: 2.35, stock: 3000 },
      { key: 'SKU-BLEU', label: 'Bleu', price: 2.35, stock: 2000 },
    ],
    rawText: 'Données simulées (SOURCING_MOCK=1) — ajoutez les clés ALIEXPRESS_* pour les données réelles.',
    mock: true,
  };
}

export class AliExpressConnector implements SupplierConnector {
  readonly platform = 'ALIEXPRESS' as const;

  isConfigured(): boolean {
    return hasKeys() || isMockMode();
  }

  supportsAutoOrder(): boolean {
    return hasKeys() || isMockMode();
  }

  async fetchProduct(ref: { externalId?: string | null; url?: string | null }): Promise<NormalizedSupplierProduct> {
    const externalId = ref.externalId || (ref.url ? aliexpressIdFromUrl(ref.url) : null);
    if (!hasKeys()) {
      if (isMockMode()) return mockProduct(externalId, ref.url || null);
      throw new Error('Clés API AliExpress manquantes (ALIEXPRESS_APP_KEY / APP_SECRET / ACCESS_TOKEN). Créez une application sur open.aliexpress.com, ou activez SOURCING_MOCK=1 pour tester.');
    }
    if (!externalId) throw new Error("Impossible d'extraire l'identifiant produit AliExpress de la référence fournie");

    const data = await callAliExpress('aliexpress.ds.product.get', {
      product_id: externalId,
      ship_to_country: process.env.ALIEXPRESS_SHIP_TO || 'FR',
      target_currency: 'EUR',
      target_language: 'fr',
    });

    // La réponse TOP est enveloppée : {aliexpress_ds_product_get_response:{result:{…}}}
    const result = data?.aliexpress_ds_product_get_response?.result || {};
    const base = result?.ae_item_base_info_dto || {};
    const skuList: any[] = result?.ae_item_sku_info_dtos?.ae_item_sku_info_d_t_o || [];
    const images: string[] = String(result?.ae_multimedia_info_dto?.image_urls || '')
      .split(';').filter(Boolean).slice(0, 8);

    const skuPrices = skuList
      .map((s) => Number(s?.offer_sale_price ?? s?.sku_price))
      .filter((n) => Number.isFinite(n) && n > 0);
    const skuStocks = skuList
      .map((s) => Number(s?.sku_available_stock ?? s?.ipm_sku_stock))
      .filter((n) => Number.isFinite(n));

    const attributes: Record<string, string> = {};
    const attrs: any[] = result?.ae_item_properties?.ae_item_property || [];
    for (const a of attrs.slice(0, 25)) {
      if (a?.attr_name && a?.attr_value) attributes[String(a.attr_name)] = String(a.attr_value);
    }

    return {
      platform: 'ALIEXPRESS',
      externalId,
      sourceUrl: ref.url || `https://www.aliexpress.com/item/${externalId}.html`,
      title: base?.subject || null,
      description: (base?.detail || '').replace(/<[^>]+>/g, ' ').slice(0, 3000) || null,
      images,
      costPrice: skuPrices.length ? Math.min(...skuPrices) : null,
      shippingCost: null, // dépend du SKU + destination, calculé à la commande
      currency: 'EUR',
      stockQty: skuStocks.length ? skuStocks.reduce((a, b) => a + b, 0) : null,
      deliveryDaysMin: 10,
      deliveryDaysMax: 30,
      attributes,
      variants: skuList.slice(0, 20).map((s) => ({
        key: String(s?.sku_attr || s?.sku_id || ''),
        label: String(s?.sku_attr_name || s?.sku_attr || ''),
        price: Number(s?.offer_sale_price ?? s?.sku_price) || null,
        stock: Number(s?.sku_available_stock ?? s?.ipm_sku_stock) || null,
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
        return { placed: true, externalOrderId: `MOCK-AE-${Date.now()}`, message: 'Commande simulée (SOURCING_MOCK=1)' };
      }
      throw new Error('Clés API AliExpress manquantes — auto-commande impossible');
    }

    const payload = {
      param_place_order_request4_open_api_d_t_o: {
        logistics_address: {
          contact_person: req.recipient.fullName,
          full_name: req.recipient.fullName,
          mobile_no: req.recipient.phone || '',
          phone_country: '+590',
          address: req.recipient.address,
          city: req.recipient.city,
          zip: req.recipient.postalCode,
          country: req.recipient.country || 'GP',
          locale: 'fr_FR',
        },
        product_items: [{
          product_id: Number(req.externalProductId),
          product_count: req.quantity,
          sku_attr: req.variantKey || '',
          logistics_service_name: process.env.ALIEXPRESS_LOGISTICS || '',
          order_memo: `NeoServ ${req.internalRef}`,
        }],
      },
    };

    const data = await callAliExpress('aliexpress.ds.order.create', payload);
    const result = data?.aliexpress_ds_order_create_response?.result || {};
    const ids: any[] = result?.order_list?.number || result?.order_list || [];
    const externalOrderId = Array.isArray(ids) && ids.length ? String(ids[0]) : null;
    if (!result?.is_success && !externalOrderId) {
      throw new Error(`AliExpress a refusé la commande: ${JSON.stringify(result).slice(0, 300)}`);
    }
    return { placed: true, externalOrderId, message: 'Commande AliExpress créée' };
  }

  async getTracking(externalOrderId: string): Promise<TrackingInfo> {
    if (!hasKeys()) {
      if (isMockMode()) {
        return { trackingNumber: 'MOCKTRACK123FR', carrier: 'Cainiao', trackingUrl: 'https://global.cainiao.com/detail.htm?mailNoList=MOCKTRACK123FR', status: 'IN_TRANSIT', delivered: false };
      }
      throw new Error('Clés API AliExpress manquantes');
    }
    const data = await callAliExpress('aliexpress.ds.order.tracking.get', {
      ae_order_id: externalOrderId,
      language: 'fr_FR',
    });
    const result = data?.aliexpress_ds_order_tracking_get_response?.result || {};
    const pkg = result?.data?.tracking_detail_line_list?.[0] || result?.details?.details?.[0] || {};
    const trackingNumber = pkg?.mail_no || pkg?.logistics_no || null;
    return {
      trackingNumber,
      carrier: pkg?.logistics_service || null,
      trackingUrl: trackingNumber ? `https://global.cainiao.com/detail.htm?mailNoList=${trackingNumber}` : null,
      status: pkg?.package_status || null,
      delivered: /delivered|signé|livré/i.test(String(pkg?.package_status || '')),
    };
  }
}

export const aliexpressConnector = new AliExpressConnector();
