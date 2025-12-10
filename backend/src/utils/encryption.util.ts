/**
 * Utilitaires de chiffrement pour les tokens bancaires
 * Utilise AES-256-CBC pour chiffrer les tokens d'accès API bancaires
 */

import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16; // Pour AES, IV est toujours 16 bytes
const ALGORITHM = 'aes-256-cbc';

/**
 * Vérifier que la clé de chiffrement est configurée
 */
function ensureEncryptionKey(): string {
  if (!ENCRYPTION_KEY) {
    throw new Error(
      'ENCRYPTION_KEY not configured in environment variables. ' +
        'Generate one with: node -e "console.log(crypto.randomBytes(32).toString(\'hex\'))"'
    );
  }

  if (ENCRYPTION_KEY.length !== 64) {
    // 32 bytes = 64 hex characters
    throw new Error(
      `ENCRYPTION_KEY must be 32 bytes (64 hex characters). Current length: ${ENCRYPTION_KEY.length}`
    );
  }

  return ENCRYPTION_KEY;
}

/**
 * Chiffrer un texte (token bancaire)
 *
 * @param text - Le texte à chiffrer
 * @returns Le texte chiffré au format "iv:encryptedData"
 *
 * @example
 * ```typescript
 * const token = "sk-bridge-xxx";
 * const encrypted = encrypt(token);
 * // Returns: "a1b2c3d4....:x9y8z7w6...."
 * ```
 */
export function encrypt(text: string): string {
  const key = ensureEncryptionKey();

  // Générer un IV aléatoire unique pour chaque chiffrement
  const iv = crypto.randomBytes(IV_LENGTH);

  // Créer le cipher
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(key, 'hex'),
    iv
  );

  // Chiffrer le texte
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Retourner IV + données chiffrées (séparés par :)
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Déchiffrer un texte chiffré
 *
 * @param encryptedText - Le texte chiffré au format "iv:encryptedData"
 * @returns Le texte déchiffré
 *
 * @example
 * ```typescript
 * const encrypted = "a1b2c3d4....:x9y8z7w6....";
 * const decrypted = decrypt(encrypted);
 * // Returns: "sk-bridge-xxx"
 * ```
 */
export function decrypt(encryptedText: string): string {
  const key = ensureEncryptionKey();

  // Séparer l'IV des données chiffrées
  const parts = encryptedText.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted text format. Expected "iv:encryptedData"');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const encryptedData = Buffer.from(parts[1], 'hex');

  // Créer le decipher
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(key, 'hex'),
    iv
  );

  // Déchiffrer
  let decrypted = decipher.update(encryptedData);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString('utf8');
}

/**
 * Générer une clé de chiffrement aléatoire
 * Utiliser une seule fois pour générer ENCRYPTION_KEY
 *
 * @returns Une clé de 32 bytes en hexadécimal
 *
 * @example
 * ```typescript
 * const key = generateEncryptionKey();
 * console.log('Add to .env:', key);
 * // ENCRYPTION_KEY=a1b2c3d4e5f6...
 * ```
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hasher un texte (pour signature webhook par exemple)
 *
 * @param text - Le texte à hasher
 * @param secret - Le secret pour HMAC
 * @returns Le hash en hexadécimal
 *
 * @example
 * ```typescript
 * const signature = hashHMAC(payload, webhookSecret);
 * if (signature === receivedSignature) {
 *   // Webhook valide
 * }
 * ```
 */
export function hashHMAC(text: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(text)
    .digest('hex');
}

/**
 * Vérifier une signature HMAC
 *
 * @param text - Le texte original
 * @param signature - La signature reçue
 * @param secret - Le secret pour HMAC
 * @returns true si la signature est valide
 */
export function verifyHMAC(
  text: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = hashHMAC(text, secret);

  // Utiliser timingSafeEqual pour éviter les timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    // Les buffers n'ont pas la même longueur
    return false;
  }
}
