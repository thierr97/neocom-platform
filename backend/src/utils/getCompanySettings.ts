import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CompanySettings {
  name: string;
  address: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
  mobile?: string;
  email?: string;
  website?: string;
  siret?: string;
  vatNumber?: string;
  rcs?: string;
  legalForm?: string;
  capital?: string;
  description?: string;
  region?: string;
}

/**
 * Récupère les paramètres de l'entreprise depuis la base de données
 * Retourne les valeurs par défaut si non définies
 */
export async function getCompanySettings(): Promise<CompanySettings> {
  try {
    // Récupérer tous les settings qui commencent par "company_"
    const settingsFromDb = await prisma.settings.findMany({
      where: {
        key: {
          startsWith: 'company_'
        }
      }
    });

    // Convertir en objet
    const settingsObj: any = {};
    settingsFromDb.forEach(setting => {
      const key = setting.key.replace('company_', '');
      settingsObj[key] = setting.value;
    });

    // Retourner avec valeurs par défaut si besoin
    return {
      name: settingsObj.name || process.env.COMPANY_NAME || 'NEOSERV',
      address: settingsObj.address || process.env.COMPANY_ADDRESS || '123 Avenue des Champs-Élysées',
      addressLine2: settingsObj.addressLine2 || '',
      city: settingsObj.city || process.env.COMPANY_CITY || 'Paris',
      postalCode: settingsObj.postalCode || process.env.COMPANY_ZIP || '75008',
      country: settingsObj.country || process.env.COMPANY_COUNTRY || 'France',
      phone: settingsObj.phone || process.env.COMPANY_PHONE || '+33 1 23 45 67 89',
      mobile: settingsObj.mobile || '',
      email: settingsObj.email || process.env.COMPANY_EMAIL || 'contact@neoserv.fr',
      website: settingsObj.website || '',
      siret: settingsObj.siret || process.env.COMPANY_SIRET || '123 456 789 00012',
      vatNumber: settingsObj.vatNumber || process.env.COMPANY_VAT || 'FR12345678900',
      rcs: settingsObj.rcs || '',
      legalForm: settingsObj.legalForm || '',
      capital: settingsObj.capital || '',
      description: settingsObj.description || '',
      region: settingsObj.region || '',
    };
  } catch (error) {
    console.error('Error fetching company settings:', error);
    // Retourner les valeurs par défaut en cas d'erreur
    return {
      name: process.env.COMPANY_NAME || 'NEOSERV',
      address: process.env.COMPANY_ADDRESS || '123 Avenue des Champs-Élysées',
      city: process.env.COMPANY_CITY || 'Paris',
      postalCode: process.env.COMPANY_ZIP || '75008',
      country: process.env.COMPANY_COUNTRY || 'France',
      phone: process.env.COMPANY_PHONE || '+33 1 23 45 67 89',
      email: process.env.COMPANY_EMAIL || 'contact@neoserv.fr',
      siret: process.env.COMPANY_SIRET || '123 456 789 00012',
      vatNumber: process.env.COMPANY_VAT || 'FR12345678900',
    };
  }
}

/**
 * Récupère les informations bancaires (RIB)
 * Charge depuis la base de données avec fallback sur les variables d'environnement
 */
export interface BankInfo {
  bankCode: string;
  branchCode: string;
  accountNumber: string;
  accountKey: string;
  bic: string;
  iban: string;
  accountHolder: string;
}

export async function getBankInfo(): Promise<BankInfo> {
  try {
    // Récupérer tous les settings qui commencent par "bank_"
    const settingsFromDb = await prisma.settings.findMany({
      where: {
        key: {
          startsWith: 'bank_'
        }
      }
    });

    // Convertir en objet
    const settingsObj: any = {};
    settingsFromDb.forEach(setting => {
      const key = setting.key.replace('bank_', '');
      settingsObj[key] = setting.value;
    });

    // Retourner avec valeurs par défaut si besoin
    return {
      bankCode: settingsObj.bankCode || process.env.BANK_CODE || '',
      branchCode: settingsObj.branchCode || process.env.BRANCH_CODE || '',
      accountNumber: settingsObj.accountNumber || process.env.ACCOUNT_NUMBER || '',
      accountKey: settingsObj.accountKey || process.env.ACCOUNT_KEY || '',
      bic: settingsObj.bic || process.env.BIC_CODE || '',
      iban: settingsObj.iban || process.env.IBAN_CODE || '',
      accountHolder: settingsObj.accountHolder || process.env.ACCOUNT_HOLDER || process.env.COMPANY_NAME || 'NEOSERV',
    };
  } catch (error) {
    console.error('Error fetching bank info:', error);
    // Retourner les valeurs par défaut en cas d'erreur
    return {
      bankCode: process.env.BANK_CODE || '',
      branchCode: process.env.BRANCH_CODE || '',
      accountNumber: process.env.ACCOUNT_NUMBER || '',
      accountKey: process.env.ACCOUNT_KEY || '',
      bic: process.env.BIC_CODE || '',
      iban: process.env.IBAN_CODE || '',
      accountHolder: process.env.ACCOUNT_HOLDER || process.env.COMPANY_NAME || 'NEOSERV',
    };
  }
}
