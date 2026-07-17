import { SupplierConnector, PlatformKey } from './types';
import { aliexpressConnector } from './aliexpress.connector';
import { cjConnector } from './cj.connector';
import { temuConnector, sheinConnector, genericUrlConnector } from './url.connector';

const registry: Record<PlatformKey, SupplierConnector> = {
  ALIEXPRESS: aliexpressConnector,
  CJDROPSHIPPING: cjConnector,
  TEMU: temuConnector,
  SHEIN: sheinConnector,
  AUTRE: genericUrlConnector,
};

export function getConnector(platform: PlatformKey): SupplierConnector {
  return registry[platform] || genericUrlConnector;
}

/** Détecte la plateforme depuis une URL. */
export function platformFromUrl(url: string): PlatformKey {
  let h = '';
  try { h = new URL(url).hostname; } catch { /* ignore */ }
  if (/aliexpress/i.test(h)) return 'ALIEXPRESS';
  if (/cjdropshipping/i.test(h)) return 'CJDROPSHIPPING';
  if (/temu/i.test(h)) return 'TEMU';
  if (/shein/i.test(h)) return 'SHEIN';
  return 'AUTRE';
}

export * from './types';
