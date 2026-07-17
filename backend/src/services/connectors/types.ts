/**
 * Module Sourcing — interface commune des connecteurs fournisseurs.
 *
 * Chaque plateforme (AliExpress, CJ, Temu, Shein…) est encapsulée dans un
 * connecteur qui traduit son API (ou ses pages) vers ce format interne.
 * Ajouter une plateforme = implémenter SupplierConnector, rien d'autre à toucher.
 */

export type PlatformKey = 'ALIEXPRESS' | 'CJDROPSHIPPING' | 'TEMU' | 'SHEIN' | 'AUTRE';

/** Produit fournisseur normalisé (avant enrichissement IA). */
export interface NormalizedSupplierProduct {
  platform: PlatformKey;
  externalId: string | null;
  sourceUrl: string | null;
  title: string | null;
  description: string | null;
  images: string[];
  /** Coût unitaire fournisseur (dans currency). */
  costPrice: number | null;
  shippingCost: number | null;
  currency: string;
  stockQty: number | null;
  deliveryDaysMin: number | null;
  deliveryDaysMax: number | null;
  /** Attributs bruts (specs, variantes…) pour le prompt IA. */
  attributes: Record<string, string>;
  variants: { key: string; label: string; price: number | null; stock: number | null }[];
  /** Texte brut supplémentaire utile à l'IA. */
  rawText: string;
  /** true si les données proviennent d'une simulation (mode mock, sans clés API). */
  mock?: boolean;
}

export interface SupplierOrderRequest {
  externalProductId: string;
  variantKey?: string | null;
  quantity: number;
  recipient: {
    fullName: string;
    phone?: string | null;
    address: string;
    city: string;
    postalCode: string;
    country: string; // ex: "GP" / "FR"
  };
  /** Référence interne NeoServ (n° de commande) pour traçabilité. */
  internalRef: string;
}

export interface SupplierOrderResult {
  placed: boolean;
  externalOrderId: string | null;
  message: string;
}

export interface TrackingInfo {
  trackingNumber: string | null;
  carrier: string | null;
  trackingUrl: string | null;
  status: string | null;
  delivered: boolean;
}

/** Interface commune. Les méthodes non supportées lèvent UnsupportedOperationError. */
export interface SupplierConnector {
  readonly platform: PlatformKey;
  /** Le connecteur est-il utilisable (clés API présentes ou mode mock actif) ? */
  isConfigured(): boolean;
  /** Peut-il passer des commandes fournisseur automatiquement ? */
  supportsAutoOrder(): boolean;
  /** Récupère un produit par id externe ou URL. */
  fetchProduct(ref: { externalId?: string | null; url?: string | null }): Promise<NormalizedSupplierProduct>;
  /** Rafraîchit coût/stock (pour la synchro). */
  refreshPricingStock(ref: { externalId?: string | null; url?: string | null; variantKey?: string | null }): Promise<{
    costPrice: number | null;
    shippingCost: number | null;
    stockQty: number | null;
  }>;
  /** Place une commande fournisseur (si supporté). */
  placeOrder(req: SupplierOrderRequest): Promise<SupplierOrderResult>;
  /** Récupère le suivi d'une commande fournisseur (si supporté). */
  getTracking(externalOrderId: string): Promise<TrackingInfo>;
}

export class UnsupportedOperationError extends Error {
  constructor(platform: string, op: string) {
    super(`${platform} ne supporte pas l'opération "${op}" (pas d'API officielle) — traitement manuel requis`);
    this.name = 'UnsupportedOperationError';
  }
}

/** Mode simulation : permet de tester tout le pipeline sans clés API. */
export const isMockMode = (): boolean => process.env.SOURCING_MOCK === '1';
