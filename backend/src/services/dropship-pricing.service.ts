import prisma from '../config/database';

/**
 * Moteur de règles de prix dropshipping.
 *
 * prix de vente = (coût fournisseur + estimation port + frais fixes) × (1 + marge%/100)
 * puis arrondi psychologique (x,90 par défaut), avec plancher optionnel.
 *
 * La règle la plus spécifique et la plus prioritaire gagne :
 *   score = priority, à égalité une règle ciblée (platform/categoryId) bat une règle globale.
 * Sans règle en base : marge par défaut DROPSHIP_DEFAULT_MARGIN_PCT (120 %).
 */

export interface PriceComputation {
  price: number | null;
  ruleId: string | null;
  ruleName: string;
  marginPct: number;
  belowMinMargin: boolean;
  details: string;
}

/** Arrondi psychologique : 7,43 → 7,90 ; 12,10 → 12,90 (terminaison configurable). */
export function psychologicalRound(value: number, ending = 0.9): number {
  if (!Number.isFinite(value) || value <= 0) return value;
  const floor = Math.floor(value);
  const candidate = floor + ending;
  const result = candidate >= value ? candidate : floor + 1 + ending;
  return Math.round(result * 100) / 100;
}

export async function findApplicableRule(params: { platform: string; categoryId?: string | null }) {
  const rules = await prisma.dropshipPricingRule.findMany({
    where: { isActive: true },
    orderBy: { priority: 'desc' },
  });

  let best: (typeof rules)[number] | null = null;
  let bestScore = -1;
  for (const r of rules) {
    if (r.platform && r.platform !== params.platform) continue;
    if (r.categoryId && r.categoryId !== (params.categoryId || '')) continue;
    // spécificité : catégorie ciblée = +2, plateforme ciblée = +1
    const specificity = (r.categoryId ? 2 : 0) + (r.platform ? 1 : 0);
    const score = r.priority * 10 + specificity;
    if (score > bestScore) { best = r; bestScore = score; }
  }
  return best;
}

export async function computeSalePrice(params: {
  platform: string;
  categoryId?: string | null;
  costPrice: number | null;
  shippingCost?: number | null;
}): Promise<PriceComputation> {
  const defaultMargin = Number(process.env.DROPSHIP_DEFAULT_MARGIN_PCT) || 120;

  if (params.costPrice === null || !Number.isFinite(params.costPrice) || params.costPrice <= 0) {
    return {
      price: null, ruleId: null, ruleName: 'aucune (coût inconnu)',
      marginPct: defaultMargin, belowMinMargin: false,
      details: 'Prix fournisseur non détecté — à saisir manuellement avant publication',
    };
  }

  const rule = await findApplicableRule(params);
  const marginPct = rule ? rule.marginPct : defaultMargin;
  const fixedFee = rule ? rule.fixedFee : 0;
  const shippingEstimate = params.shippingCost ?? (rule ? rule.shippingEstimate : 0);
  const roundEnding = rule ? rule.roundEnding : 0.9;
  const minPrice = rule?.minPrice ?? null;
  const minMarginPct = rule ? rule.minMarginPct : 30;

  const baseCost = params.costPrice + (shippingEstimate || 0) + fixedFee;
  let price = psychologicalRound(baseCost * (1 + marginPct / 100), roundEnding);
  if (minPrice !== null && price < minPrice) price = minPrice;

  const effectiveMarginPct = ((price - baseCost) / baseCost) * 100;

  return {
    price,
    ruleId: rule?.id || null,
    ruleName: rule?.name || `défaut (${defaultMargin} %)`,
    marginPct,
    belowMinMargin: effectiveMarginPct < minMarginPct,
    details: `coût ${params.costPrice.toFixed(2)} + port ${(shippingEstimate || 0).toFixed(2)} + frais ${fixedFee.toFixed(2)} → ×${(1 + marginPct / 100).toFixed(2)} → ${price.toFixed(2)} €`,
  };
}
