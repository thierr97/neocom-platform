/**
 * Fix: bannières avec id vide (créées avec id: "" au lieu d'un UUID)
 */
import prisma from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export async function fixBannerIds() {
  try {
    const fixed = await prisma.$executeRaw`
      UPDATE "ShopBanner"
      SET id = gen_random_uuid()::text
      WHERE id = '' OR id IS NULL
    `;
    if (fixed > 0) {
      console.log(`✅ [FixBannerIds] ${fixed} bannière(s) avec ID vide corrigée(s)`);
    }
  } catch {
    // gen_random_uuid() peut ne pas être disponible, essayer uuid_generate_v4()
    try {
      const fixed = await prisma.$executeRaw`
        UPDATE "ShopBanner"
        SET id = uuid_generate_v4()::text
        WHERE id = '' OR id IS NULL
      `;
      if (fixed > 0) {
        console.log(`✅ [FixBannerIds] ${fixed} bannière(s) corrigée(s)`);
      }
    } catch (err) {
      console.warn('⚠️  [FixBannerIds] Impossible de corriger automatiquement les IDs vides:', err);
    }
  }
}
