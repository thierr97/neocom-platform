/**
 * Utilitaires pour nettoyer les libellés de transactions bancaires
 * Retire les codes techniques et informations inutiles pour faciliter la catégorisation IA
 */

/**
 * Nettoyer le libellé brut d'une transaction bancaire
 *
 * Retire:
 * - Codes CB (CB*1234, CARTE 1234)
 * - Dates (DD/MM/YYYY, DDMMYYYY)
 * - Codes techniques
 * - Espaces multiples
 *
 * @param rawLabel - Le libellé brut de la banque
 * @returns Le libellé nettoyé
 *
 * @example
 * ```typescript
 * cleanLabel("CB*1234 AMAZON EU 08/01/2025 PARIS")
 * // Returns: "AMAZON EU PARIS"
 *
 * cleanLabel("CARTE  1234 VIR INST  JOHN DOE")
 * // Returns: "VIR INST JOHN DOE"
 * ```
 */
export function cleanLabel(rawLabel: string): string {
  if (!rawLabel) return '';

  let cleaned = rawLabel;

  // 1. Retirer les codes CB
  cleaned = cleaned.replace(/CB\*?\d+/gi, ''); // CB*1234, CB1234
  cleaned = cleaned.replace(/CARTE\s+\d+/gi, ''); // CARTE 1234

  // 2. Retirer les dates
  cleaned = cleaned.replace(/\d{2}\/\d{2}\/\d{4}/g, ''); // DD/MM/YYYY
  cleaned = cleaned.replace(/\d{2}\/\d{2}/g, ''); // DD/MM
  cleaned = cleaned.replace(/\d{8}/g, ''); // DDMMYYYY

  // 3. Retirer les codes techniques bancaires
  cleaned = cleaned.replace(/VIR\s+INST/gi, 'VIREMENT'); // VIR INST → VIREMENT
  cleaned = cleaned.replace(/PRLV\s+SEPA/gi, 'PRELEVEMENT'); // PRLV SEPA → PRELEVEMENT
  cleaned = cleaned.replace(/\bECH\b/gi, 'ECHEANCE'); // ECH → ECHEANCE

  // 4. Retirer les numéros de référence techniques
  cleaned = cleaned.replace(/REF\s*:\s*\w+/gi, ''); // REF: 123ABC
  cleaned = cleaned.replace(/ID\s*:\s*\w+/gi, ''); // ID: 123ABC

  // 5. Retirer les caractères spéciaux inutiles
  cleaned = cleaned.replace(/[*#]/g, ' ');

  // 6. Nettoyer les espaces multiples
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Extraire le nom du commerçant/tiers du libellé
 *
 * @param label - Le libellé (nettoyé ou brut)
 * @returns Le nom probable du tiers
 *
 * @example
 * ```typescript
 * extractCounterparty("AMAZON EU PARIS")
 * // Returns: "AMAZON EU"
 *
 * extractCounterparty("VIR JOHN DOE")
 * // Returns: "JOHN DOE"
 * ```
 */
export function extractCounterparty(label: string): string {
  if (!label) return '';

  let counterparty = label;

  // Retirer les mots-clés bancaires communs
  const bankKeywords = [
    'VIREMENT',
    'PRELEVEMENT',
    'ECHEANCE',
    'VIR',
    'PRLV',
    'ECH',
    'RETRAIT',
    'DAB',
    'PARIS',
    'FRANCE',
  ];

  for (const keyword of bankKeywords) {
    counterparty = counterparty.replace(new RegExp(`\\b${keyword}\\b`, 'gi'), '');
  }

  // Nettoyer et retourner
  return counterparty.replace(/\s+/g, ' ').trim();
}

/**
 * Déterminer si c'est un retrait DAB (distributeur automatique)
 */
export function isATMWithdrawal(label: string): boolean {
  return /\b(DAB|RETRAIT|ATM|GAB)\b/i.test(label);
}

/**
 * Déterminer si c'est un virement
 */
export function isTransfer(label: string): boolean {
  return /\b(VIR|VIREMENT|TRANSFER)\b/i.test(label);
}

/**
 * Déterminer si c'est un prélèvement
 */
export function isDirectDebit(label: string): boolean {
  return /\b(PRLV|PRELEVEMENT|SEPA)\b/i.test(label);
}

/**
 * Déterminer si c'est un paiement par carte
 */
export function isCardPayment(label: string): boolean {
  return /\b(CB|CARTE|CARD)\b/i.test(label);
}

/**
 * Détecter des mots-clés de catégories communes
 *
 * @param label - Le libellé
 * @returns La catégorie détectée ou null
 */
export function detectCategory(label: string): string | null {
  const labelLower = label.toLowerCase();

  // Catégories avec mots-clés
  const categories: Record<string, string[]> = {
    'Alimentation': ['carrefour', 'auchan', 'leclerc', 'intermarche', 'lidl', 'super u'],
    'Restaurants': ['restaurant', 'brasserie', 'pizzeria', 'bistro', 'cafe'],
    'Transport': ['sncf', 'ratp', 'uber', 'taxi', 'essence', 'total', 'esso', 'shell'],
    'Loyer': ['loyer', 'habitation', 'residence'],
    'Électricité/Eau': ['edf', 'engie', 'veolia', 'suez', 'eau'],
    'Télécom': ['orange', 'sfr', 'free', 'bouygues', 'telephone', 'internet'],
    'Assurance': ['assurance', 'axa', 'maif', 'macif', 'mgen'],
    'Santé': ['pharmacie', 'medecin', 'dentiste', 'mutuelle', 'cpam'],
    'Shopping': ['amazon', 'fnac', 'darty', 'h&m', 'zara'],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    for (const keyword of keywords) {
      if (labelLower.includes(keyword)) {
        return category;
      }
    }
  }

  return null;
}

/**
 * Formater un montant pour l'affichage
 *
 * @param amount - Le montant
 * @param currency - La devise (défaut: EUR)
 * @returns Le montant formaté
 *
 * @example
 * ```typescript
 * formatAmount(-120.50)
 * // Returns: "-120,50 €"
 *
 * formatAmount(1500, "USD")
 * // Returns: "1 500,00 $"
 * ```
 */
export function formatAmount(amount: number, currency: string = 'EUR'): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount);

  return formatted;
}

/**
 * Identifier si le libellé contient un IBAN
 */
export function containsIBAN(label: string): boolean {
  // Format IBAN simplifié: FRxx xxxx xxxx xxxx xxxx xxxx xxx
  return /\b[A-Z]{2}\d{2}[\s\d]+\b/.test(label);
}

/**
 * Extraire l'IBAN du libellé si présent
 */
export function extractIBAN(label: string): string | null {
  const match = label.match(/\b([A-Z]{2}\d{2}[\s\d]{15,})\b/);
  if (match) {
    return match[1].replace(/\s/g, '');
  }
  return null;
}
