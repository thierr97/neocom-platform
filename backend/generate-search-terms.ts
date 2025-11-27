import prisma from './src/config/database';

// Dictionnaire de synonymes pour une recherche intelligente
const SYNONYM_DICTIONARY: Record<string, string[]> = {
  // Bagages et valises
  'valise': ['bagage', 'sac', 'bagagerie', 'trolley', 'cabine', 'soute', 'voyage'],
  'bagage': ['valise', 'sac', 'bagagerie', 'trolley', 'voyage'],
  'sac': ['valise', 'bagage', 'besace', 'sacoche', 'pochette'],
  'trolley': ['valise', 'bagage', 'chariot'],

  // Accessoires
  'cadenas': ['serrure', 'verrou', 'securite', 'protection', 'antivol'],
  'serrure': ['cadenas', 'verrou', 'securite', 'protection'],
  'corde': ['sangle', 'attache', 'fixation', 'cordon'],
  'sangle': ['corde', 'attache', 'fixation', 'courroie'],
  'etiquette': ['tag', 'badge', 'identification', 'marquage'],
  'protection': ['housse', 'couverture', 'cover', 'protege'],
  'housse': ['protection', 'couverture', 'cover', 'protege'],

  // Instruments de mesure
  'balance': ['pese', 'pesee', 'mesure', 'poids'],
  'pese': ['balance', 'pesee', 'mesure', 'poids'],
  'pesee': ['balance', 'pese', 'mesure', 'poids'],

  // Tapis
  'tapis': ['paillasson', 'natte', 'carpette', 'descente'],
  'paillasson': ['tapis', 'natte'],

  // Matériaux
  'abs': ['plastique', 'rigide', 'dur'],
  'polycarbonate': ['plastique', 'rigide', 'resistant'],
  'tissu': ['textile', 'toile', 'etoffe'],
  'cuir': ['peau', 'leather'],
  'silicone': ['caoutchouc', 'souple'],
  'pvc': ['plastique', 'vinyle'],

  // Couleurs communes
  'noir': ['black', 'fonce', 'sombre'],
  'blanc': ['white', 'clair'],
  'bleu': ['blue', 'azure', 'marine'],
  'rouge': ['red', 'bordeaux', 'vermillon'],
  'vert': ['green', 'olive'],
  'gris': ['gray', 'grey', 'anthracite'],
  'rose': ['pink', 'fuchsia'],
  'beige': ['creme', 'ecru', 'ivoire'],
  'marron': ['brown', 'brun', 'chocolat'],

  // Tailles
  'petit': ['mini', 'small', 'compact', 'xs', 's'],
  'moyen': ['medium', 'standard', 'm'],
  'grand': ['large', 'big', 'xl', 'xxl', 'maxi'],
  'cabine': ['small', 'petit', 'avion', 'soute'],

  // Caractéristiques
  'leger': ['light', 'allege', 'poids plume'],
  'resistant': ['solide', 'robuste', 'durable'],
  'portable': ['transportable', 'mobile', 'nomade'],
  'pliable': ['pliant', 'repliable'],
  'rigide': ['dur', 'solide', 'coque'],
  'souple': ['flexible', 'mou'],

  // Voyage
  'voyage': ['deplacement', 'trip', 'tourisme', 'vacances'],
  'avion': ['vol', 'aerien', 'cabine', 'soute'],
};

// Fonction pour nettoyer et normaliser un texte
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
    .replace(/[^a-z0-9\s-]/g, ' ') // Garder seulement lettres, chiffres, espaces et tirets
    .replace(/\s+/g, ' ') // Réduire les espaces multiples
    .trim();
}

// Fonction pour extraire les mots-clés d'un texte
function extractKeywords(text: string): string[] {
  const normalized = normalizeText(text);
  const words = normalized.split(' ').filter(word => word.length > 2); // Ignorer les mots de moins de 3 lettres
  return Array.from(new Set(words)); // Enlever les doublons
}

// Fonction pour générer des synonymes
function generateSynonyms(word: string): string[] {
  const normalized = normalizeText(word);
  const synonyms = new Set<string>();

  // Ajouter le mot lui-même
  synonyms.add(normalized);

  // Chercher dans le dictionnaire
  for (const [key, values] of Object.entries(SYNONYM_DICTIONARY)) {
    const normalizedKey = normalizeText(key);
    if (normalized.includes(normalizedKey) || normalizedKey.includes(normalized)) {
      values.forEach(syn => synonyms.add(normalizeText(syn)));
    }
  }

  return Array.from(synonyms);
}

// Fonction pour générer les termes de recherche pour un produit
function generateSearchTerms(product: any): string[] {
  const searchTerms = new Set<string>();

  // 1. Extraire les mots du nom du produit
  const nameKeywords = extractKeywords(product.name);
  nameKeywords.forEach(word => {
    searchTerms.add(word);
    // Ajouter les synonymes
    generateSynonyms(word).forEach(syn => searchTerms.add(syn));
  });

  // 2. Extraire les mots de la description
  if (product.description) {
    const descKeywords = extractKeywords(product.description);
    descKeywords.forEach(word => {
      searchTerms.add(word);
      // Ajouter quelques synonymes (pas tous pour ne pas surcharger)
      const syns = generateSynonyms(word).slice(0, 3);
      syns.forEach(syn => searchTerms.add(syn));
    });
  }

  // 3. Ajouter le SKU normalisé
  if (product.sku) {
    searchTerms.add(normalizeText(product.sku));
  }

  // 4. Ajouter les tags existants
  if (product.tags && product.tags.length > 0) {
    product.tags.forEach((tag: string) => {
      const normalized = normalizeText(tag);
      searchTerms.add(normalized);
      generateSynonyms(normalized).forEach(syn => searchTerms.add(syn));
    });
  }

  // 5. Ajouter les mots-clés SEO existants
  if (product.metaKeywords && product.metaKeywords.length > 0) {
    product.metaKeywords.forEach((keyword: string) => {
      searchTerms.add(normalizeText(keyword));
    });
  }

  // Filtrer les termes trop courts ou vides
  return Array.from(searchTerms).filter(term => term.length > 2);
}

async function updateSearchTerms() {
  console.log('🔍 Génération des termes de recherche pour tous les produits...\n');

  try {
    // Récupérer tous les produits
    const products = await prisma.product.findMany({
      select: {
        id: true,
        sku: true,
        name: true,
        description: true,
        tags: true,
        metaKeywords: true,
      }
    });

    console.log(`📦 ${products.length} produits trouvés\n`);

    let updated = 0;
    let errors = 0;

    // Traiter chaque produit
    for (const product of products) {
      try {
        const searchTerms = generateSearchTerms(product);

        await prisma.product.update({
          where: { id: product.id },
          data: { searchTerms }
        });

        updated++;

        // Afficher un exemple tous les 100 produits
        if (updated % 100 === 0) {
          console.log(`✓ ${updated}/${products.length} produits traités...`);
        }

        // Afficher le premier produit comme exemple
        if (updated === 1) {
          console.log('📝 Exemple de termes générés:');
          console.log(`   Produit: ${product.name}`);
          console.log(`   Termes: ${searchTerms.slice(0, 15).join(', ')}${searchTerms.length > 15 ? '...' : ''}`);
          console.log(`   Total: ${searchTerms.length} termes\n`);
        }

      } catch (error) {
        errors++;
        console.error(`❌ Erreur pour ${product.sku}:`, error.message);
      }
    }

    console.log('\n======================================================================');
    console.log('✅ GÉNÉRATION DES TERMES DE RECHERCHE TERMINÉE');
    console.log('======================================================================');
    console.log(`✓ Produits mis à jour: ${updated}`);
    console.log(`✗ Erreurs: ${errors}`);
    console.log('======================================================================\n');

  } catch (error) {
    console.error('❌ Erreur globale:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
updateSearchTerms();
