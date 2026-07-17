import {
  SupplierConnector, NormalizedSupplierProduct, SupplierOrderRequest,
  SupplierOrderResult, TrackingInfo, UnsupportedOperationError, PlatformKey, isMockMode,
} from './types';
import { fetchProductPage, extractFromHtml } from '../ai-import.service';

/**
 * Connecteur générique "URL" — pour les plateformes SANS API publique de
 * dropshipping : Temu, Shein, et toute autre source.
 *
 * ⚠️ Temu ne supporte pas officiellement le dropshipping (pas d'API publique,
 * emballage orange) et Shein n'a aucun programme officiel (zone grise,
 * photos protégées par le droit d'auteur). Ce connecteur sert donc à :
 *   - la veille produit et l'import de fiche (extraction best-effort de la page),
 *   - PAS à l'auto-commande (placeOrder → MANUAL_REQUIRED côté service commandes).
 *
 * Recommandation NeoServ : sourcer l'équivalent chez CJ/AliExpress quand c'est possible.
 */

function mockProduct(platform: PlatformKey, url: string | null): NormalizedSupplierProduct {
  return {
    platform,
    externalId: null,
    sourceUrl: url,
    title: `[SIMULATION] Produit ${platform} — robe d'été fluide imprimé tropical`,
    description: 'Robe légère en polyester, coupe évasée, imprimé tropical, tailles S à XXL.',
    images: [],
    costPrice: 9.99,
    shippingCost: 2.5,
    currency: 'EUR',
    stockQty: null,
    deliveryDaysMin: 15,
    deliveryDaysMax: 40,
    attributes: { matiere: 'Polyester', tailles: 'S-XXL' },
    variants: [],
    rawText: 'Données simulées (SOURCING_MOCK=1).',
    mock: true,
  };
}

export class UrlConnector implements SupplierConnector {
  readonly platform: PlatformKey;

  constructor(platform: PlatformKey) {
    this.platform = platform;
  }

  isConfigured(): boolean {
    return true; // toujours utilisable : extraction de page best-effort
  }

  supportsAutoOrder(): boolean {
    return false; // pas d'API officielle → commande fournisseur manuelle
  }

  async fetchProduct(ref: { externalId?: string | null; url?: string | null }): Promise<NormalizedSupplierProduct> {
    if (!ref.url) {
      if (isMockMode()) return mockProduct(this.platform, null);
      throw new Error(`${this.platform} : fournissez l'URL de la page produit`);
    }

    const html = await fetchProductPage(ref.url);
    const src = extractFromHtml(ref.url, html);

    if (!src.fetched && isMockMode()) return mockProduct(this.platform, ref.url);

    // Prix : meilleur indice trouvé dans la page (JSON-LD prioritaire)
    let costPrice: number | null = null;
    for (const ld of src.jsonLd) {
      const offers = Array.isArray(ld?.offers) ? ld.offers[0] : ld?.offers;
      const p = Number(offers?.price ?? offers?.lowPrice);
      if (Number.isFinite(p) && p > 0) { costPrice = p; break; }
    }
    if (costPrice === null && src.priceHints.length) {
      const p = Number(String(src.priceHints[0]).replace(',', '.'));
      if (Number.isFinite(p) && p > 0) costPrice = p;
    }

    return {
      platform: this.platform,
      externalId: null,
      sourceUrl: ref.url,
      title: src.title,
      description: src.description,
      images: src.images,
      costPrice,
      shippingCost: null,
      currency: 'EUR',
      stockQty: null,
      deliveryDaysMin: this.platform === 'SHEIN' || this.platform === 'TEMU' ? 15 : null,
      deliveryDaysMax: this.platform === 'SHEIN' || this.platform === 'TEMU' ? 40 : null,
      attributes: {},
      variants: [],
      rawText: src.textExcerpt,
    };
  }

  async refreshPricingStock(ref: { externalId?: string | null; url?: string | null; variantKey?: string | null }) {
    const p = await this.fetchProduct(ref);
    return { costPrice: p.costPrice, shippingCost: p.shippingCost, stockQty: p.stockQty };
  }

  async placeOrder(_req: SupplierOrderRequest): Promise<SupplierOrderResult> {
    throw new UnsupportedOperationError(this.platform, 'placeOrder');
  }

  async getTracking(_externalOrderId: string): Promise<TrackingInfo> {
    throw new UnsupportedOperationError(this.platform, 'getTracking');
  }
}

export const temuConnector = new UrlConnector('TEMU');
export const sheinConnector = new UrlConnector('SHEIN');
export const genericUrlConnector = new UrlConnector('AUTRE');
