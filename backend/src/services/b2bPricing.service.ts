import prisma from '../config/database';

/**
 * Service de calcul des prix B2B
 * Gère les règles de tarification, paliers, remises clients PRO
 */

export interface PricingInput {
  productId: string;
  quantity: number;
  customerId?: string;
  categoryId?: string;
  basePrice: number; // Prix actuel du produit
}

export interface PricingResult {
  unitPriceHT: number; // Prix unitaire HT après application des règles
  totalHT: number; // Prix total HT
  tva: number; // TVA (20% par défaut)
  totalTTC: number; // Prix total TTC
  discount: number; // Montant de remise appliquée
  discountPercent: number; // Pourcentage de remise
  ruleApplied?: {
    id: string;
    name: string;
    type: string;
    scope: string;
  };
  tier?: {
    min: number;
    max: number | null;
    discount: number;
  };
}

/**
 * Calcul du prix B2B pour un produit
 */
export async function calculateB2BPrice(input: PricingInput): Promise<PricingResult> {
  const { productId, quantity, customerId, categoryId, basePrice } = input;

  // Récupérer toutes les règles applicables
  const rules = await getApplicableRules(productId, customerId, categoryId);

  // Appliquer la règle la plus avantageuse pour le client
  let bestPrice = basePrice;
  let bestRule: any = null;
  let appliedTier: any = null;

  for (const rule of rules) {
    const result = applyRule(rule, basePrice, quantity);

    if (result.price < bestPrice) {
      bestPrice = result.price;
      bestRule = rule;
      appliedTier = result.tier;
    }
  }

  // Si client PRO avec remise par défaut
  if (customerId && !bestRule) {
    const customerProfile = await prisma.proCustomerProfile.findFirst({
      where: { customerId, status: 'APPROVED' },
    });

    if (customerProfile && customerProfile.defaultDiscount && customerProfile.defaultDiscount > 0) {
      const discountedPrice = basePrice * (1 - customerProfile.defaultDiscount / 100);
      if (discountedPrice < bestPrice) {
        bestPrice = discountedPrice;
      }
    }
  }

  // Calcul final
  const unitPriceHT = bestPrice;
  const totalHT = unitPriceHT * quantity;
  const discount = (basePrice - unitPriceHT) * quantity;
  const discountPercent = ((basePrice - unitPriceHT) / basePrice) * 100;
  const tva = totalHT * 0.2; // 20% TVA
  const totalTTC = totalHT + tva;

  return {
    unitPriceHT,
    totalHT,
    tva,
    totalTTC,
    discount,
    discountPercent,
    ruleApplied: bestRule
      ? {
          id: bestRule.id,
          name: bestRule.name,
          type: bestRule.priceType,
          scope: bestRule.scope,
        }
      : undefined,
    tier: appliedTier,
  };
}

/**
 * Récupérer les règles applicables pour un produit/client
 * Ordre de priorité: CUSTOMER > PRODUCT > CATEGORY > GLOBAL
 */
async function getApplicableRules(
  productId: string,
  customerId?: string,
  categoryId?: string
): Promise<any[]> {
  const now = new Date();

  // Règles par ordre de priorité
  const rules = await prisma.b2BPricingRule.findMany({
    where: {
      isActive: true,
      OR: [
        // Règle spécifique au client
        { scope: 'CUSTOMER', customerId: customerId },
        // Règle spécifique au produit
        { scope: 'PRODUCT', targetId: productId },
        // Règle pour la catégorie
        { scope: 'CATEGORY', targetId: categoryId },
        // Règle globale
        { scope: 'GLOBAL' },
      ],
      AND: [
        // Validité
        {
          OR: [
            { validFrom: null },
            { validFrom: { lte: now } },
          ],
        },
        {
          OR: [
            { validTo: null },
            { validTo: { gte: now } },
          ],
        },
      ],
    },
    orderBy: [
      { priority: 'desc' }, // Priorité manuelle
      // Ordre de scope (customer first, global last)
      { scope: 'asc' }, // CATEGORY < CUSTOMER < GLOBAL < PRODUCT alphabetically
    ],
  });

  // Trier manuellement par scope (CUSTOMER > PRODUCT > CATEGORY > GLOBAL)
  const scopeOrder: Record<string, number> = {
    CUSTOMER: 1,
    PRODUCT: 2,
    CATEGORY: 3,
    GLOBAL: 4,
  };

  return rules.sort((a, b) => {
    if (a.priority !== b.priority) {
      return b.priority - a.priority; // Priorité manuelle d'abord
    }
    return scopeOrder[a.scope] - scopeOrder[b.scope];
  });
}

/**
 * Appliquer une règle de pricing à un produit
 */
function applyRule(
  rule: any,
  basePrice: number,
  quantity: number
): { price: number; tier?: any } {
  // Vérifier MOQ (Minimum Order Quantity)
  if (rule.minimumQuantity && quantity < rule.minimumQuantity) {
    return { price: basePrice };
  }

  // Obtenir le prix de base selon la configuration
  let priceBase = basePrice;
  if (rule.basePrice === 'MSRP') {
    // TODO: Récupérer MSRP depuis le produit
    priceBase = basePrice;
  } else if (rule.basePrice === 'COST') {
    // TODO: Récupérer coût depuis le produit
    priceBase = basePrice * 0.6; // Exemple: 60% du prix de vente
  }

  // Appliquer selon le type de pricing
  switch (rule.priceType) {
    case 'FIXED':
      return { price: rule.value || basePrice };

    case 'DISCOUNT_PERCENT':
      const discountedPrice = priceBase * (1 - (rule.value || 0) / 100);
      return { price: discountedPrice };

    case 'TIERS':
      return applyTierPricing(rule, priceBase, quantity);

    default:
      return { price: basePrice };
  }
}

/**
 * Appliquer une tarification par paliers (tiers)
 */
function applyTierPricing(
  rule: any,
  basePrice: number,
  quantity: number
): { price: number; tier?: any } {
  if (!rule.tiersJson) {
    return { price: basePrice };
  }

  let tiers: any[];
  try {
    tiers = typeof rule.tiersJson === 'string'
      ? JSON.parse(rule.tiersJson)
      : rule.tiersJson;
  } catch (e) {
    console.error('Invalid tiers JSON:', e);
    return { price: basePrice };
  }

  // Trier les paliers par quantité min
  tiers.sort((a, b) => a.min - b.min);

  // Trouver le palier applicable
  let applicableTier = null;
  for (const tier of tiers) {
    if (quantity >= tier.min && (tier.max === null || tier.max === undefined || quantity <= tier.max)) {
      applicableTier = tier;
      break;
    }
  }

  if (!applicableTier) {
    return { price: basePrice };
  }

  // Appliquer la remise du palier
  const discountedPrice = basePrice * (1 - (applicableTier.discount || 0) / 100);

  return {
    price: discountedPrice,
    tier: applicableTier,
  };
}

/**
 * Calculer les prix pour plusieurs produits (panier)
 */
export async function calculateCartB2BPrices(
  items: Array<{
    productId: string;
    quantity: number;
    basePrice: number;
    categoryId?: string;
  }>,
  customerId?: string
): Promise<{
  items: Array<PricingResult & { productId: string }>;
  subtotalHT: number;
  totalDiscount: number;
  totalTVA: number;
  totalTTC: number;
}> {
  const pricedItems = await Promise.all(
    items.map(async (item) => {
      const pricing = await calculateB2BPrice({
        productId: item.productId,
        quantity: item.quantity,
        customerId,
        categoryId: item.categoryId,
        basePrice: item.basePrice,
      });

      return {
        productId: item.productId,
        ...pricing,
      };
    })
  );

  const subtotalHT = pricedItems.reduce((sum, item) => sum + item.totalHT, 0);
  const totalDiscount = pricedItems.reduce((sum, item) => sum + item.discount, 0);
  const totalTVA = pricedItems.reduce((sum, item) => sum + item.tva, 0);
  const totalTTC = pricedItems.reduce((sum, item) => sum + item.totalTTC, 0);

  return {
    items: pricedItems,
    subtotalHT,
    totalDiscount,
    totalTVA,
    totalTTC,
  };
}

/**
 * Prévisualiser le prix pour un produit donné (pour l'admin)
 */
export async function previewPrice(
  productId: string,
  customerId?: string,
  quantity: number = 1
): Promise<{
  base: number;
  quantities: Array<{
    qty: number;
    pricing: PricingResult;
  }>;
}> {
  // Récupérer le prix de base du produit
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { price: true },
  });

  if (!product) {
    throw new Error('Product not found');
  }

  const basePrice = product.price;

  // Calculer pour différentes quantités (pour montrer les paliers)
  const quantities = [1, 10, 50, 100, 500];
  const previews = await Promise.all(
    quantities.map(async (qty) => ({
      qty,
      pricing: await calculateB2BPrice({
        productId,
        customerId,
        quantity: qty,
        basePrice,
      }),
    }))
  );

  return {
    base: basePrice,
    quantities: previews,
  };
}
