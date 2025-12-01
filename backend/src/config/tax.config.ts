/**
 * Configuration des taux de TVA
 *
 * Guadeloupe - Taux spécifiques DROM
 */

export const TAX_CONFIG = {
  // Taux normal Guadeloupe
  STANDARD_RATE: 8.5,

  // Taux réduit Guadeloupe
  REDUCED_RATE: 2.1,

  // Taux particulier Guadeloupe
  SPECIAL_RATE_1: 1.75,
  SPECIAL_RATE_2: 1.05,

  // Taux par défaut (taux normal)
  DEFAULT_RATE: 8.5,
};

/**
 * Options de taux de TVA disponibles pour les formulaires
 */
export const TAX_RATE_OPTIONS = [
  { value: 8.5, label: '8,5% - Taux normal Guadeloupe' },
  { value: 2.1, label: '2,1% - Taux réduit' },
  { value: 1.75, label: '1,75% - Taux particulier 1' },
  { value: 1.05, label: '1,05% - Taux particulier 2' },
  { value: 0, label: '0% - Exonéré' },
];

/**
 * Récupère le taux de TVA par défaut
 */
export const getDefaultTaxRate = (): number => {
  return TAX_CONFIG.DEFAULT_RATE;
};

/**
 * Calcule le montant de TVA
 */
export const calculateTax = (amount: number, taxRate?: number): number => {
  const rate = taxRate ?? TAX_CONFIG.DEFAULT_RATE;
  return amount * (rate / 100);
};

/**
 * Calcule le montant TTC à partir du HT
 */
export const calculateTTC = (amountHT: number, taxRate?: number): number => {
  const rate = taxRate ?? TAX_CONFIG.DEFAULT_RATE;
  return amountHT * (1 + rate / 100);
};

/**
 * Calcule le montant HT à partir du TTC
 */
export const calculateHT = (amountTTC: number, taxRate?: number): number => {
  const rate = taxRate ?? TAX_CONFIG.DEFAULT_RATE;
  return amountTTC / (1 + rate / 100);
};
