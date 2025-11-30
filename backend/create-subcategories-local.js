const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://thierrycyrillefrancillette@localhost:5432/neoserv_db?schema=public'
    }
  }
});

// Configuration des sous-catégories par catégorie parente
const SUBCATEGORIES_CONFIG = {
  // Informatique et technologie
  'Informatique': [
    { name: 'Ordinateurs Portables', slug: 'ordinateurs-portables' },
    { name: 'Ordinateurs de Bureau', slug: 'ordinateurs-bureau' },
    { name: 'Composants PC', slug: 'composants-pc' },
    { name: 'Périphériques', slug: 'peripheriques' },
    { name: 'Stockage', slug: 'stockage' },
  ],

  'Électronique': [
    { name: 'Smartphones', slug: 'smartphones' },
    { name: 'Tablettes', slug: 'tablettes' },
    { name: 'Audio', slug: 'audio' },
    { name: 'Photo & Vidéo', slug: 'photo-video' },
    { name: 'Accessoires Électroniques', slug: 'accessoires-electroniques' },
  ],

  'Réseau': [
    { name: 'Routeurs', slug: 'routeurs' },
    { name: 'Switches', slug: 'switches' },
    { name: 'Points d\'accès WiFi', slug: 'points-acces-wifi' },
    { name: 'Câbles Réseau', slug: 'cables-reseau' },
    { name: 'Modems', slug: 'modems' },
  ],

  // Maison et bureau
  'Mobilier': [
    { name: 'Bureaux', slug: 'bureaux' },
    { name: 'Chaises', slug: 'chaises' },
    { name: 'Rangements', slug: 'rangements' },
    { name: 'Tables', slug: 'tables' },
    { name: 'Canapés', slug: 'canapes' },
  ],

  'Électroménager': [
    { name: 'Gros Électroménager', slug: 'gros-electromenager' },
    { name: 'Petit Électroménager', slug: 'petit-electromenager' },
    { name: 'Cuisine', slug: 'cuisine' },
    { name: 'Entretien', slug: 'entretien' },
    { name: 'Climatisation', slug: 'climatisation' },
  ],

  // Loisirs et culture
  'Livres': [
    { name: 'Romans', slug: 'romans' },
    { name: 'Livres Professionnels', slug: 'livres-professionnels' },
    { name: 'BD & Comics', slug: 'bd-comics' },
    { name: 'Livres pour Enfants', slug: 'livres-enfants' },
    { name: 'Magazines', slug: 'magazines' },
  ],

  'Jouets': [
    { name: 'Jouets d\'éveil', slug: 'jouets-eveil' },
    { name: 'Jeux de Construction', slug: 'jeux-construction' },
    { name: 'Jeux de Société', slug: 'jeux-societe' },
    { name: 'Poupées & Figurines', slug: 'poupees-figurines' },
    { name: 'Jeux d\'Extérieur', slug: 'jeux-exterieur' },
  ],

  'Sports': [
    { name: 'Fitness & Musculation', slug: 'fitness-musculation' },
    { name: 'Sports Collectifs', slug: 'sports-collectifs' },
    { name: 'Sports de Raquette', slug: 'sports-raquette' },
    { name: 'Cyclisme', slug: 'cyclisme' },
    { name: 'Sports Nautiques', slug: 'sports-nautiques' },
  ],

  // Mode et beauté
  'Vêtements': [
    { name: 'Vêtements Homme', slug: 'vetements-homme' },
    { name: 'Vêtements Femme', slug: 'vetements-femme' },
    { name: 'Vêtements Enfant', slug: 'vetements-enfant' },
    { name: 'Sous-vêtements', slug: 'sous-vetements' },
    { name: 'Vêtements de Sport', slug: 'vetements-sport' },
  ],

  'Chaussures': [
    { name: 'Chaussures Homme', slug: 'chaussures-homme' },
    { name: 'Chaussures Femme', slug: 'chaussures-femme' },
    { name: 'Chaussures Enfant', slug: 'chaussures-enfant' },
    { name: 'Baskets', slug: 'baskets' },
    { name: 'Chaussures de Sport', slug: 'chaussures-sport' },
  ],

  'Beauté': [
    { name: 'Soins du Visage', slug: 'soins-visage' },
    { name: 'Maquillage', slug: 'maquillage' },
    { name: 'Parfums', slug: 'parfums' },
    { name: 'Soins du Corps', slug: 'soins-corps' },
    { name: 'Soins Cheveux', slug: 'soins-cheveux' },
  ],

  // Alimentation
  'Alimentation': [
    { name: 'Produits Frais', slug: 'produits-frais' },
    { name: 'Épicerie Salée', slug: 'epicerie-salee' },
    { name: 'Épicerie Sucrée', slug: 'epicerie-sucree' },
    { name: 'Boissons', slug: 'boissons' },
    { name: 'Produits Bio', slug: 'produits-bio' },
  ],

  // Automobile
  'Automobile': [
    { name: 'Pièces Détachées', slug: 'pieces-detachees' },
    { name: 'Accessoires Auto', slug: 'accessoires-auto' },
    { name: 'Entretien Auto', slug: 'entretien-auto' },
    { name: 'Équipements Électroniques', slug: 'equipements-electroniques' },
    { name: 'Pneus & Jantes', slug: 'pneus-jantes' },
  ],

  // Jardin et bricolage
  'Jardin': [
    { name: 'Plantes & Graines', slug: 'plantes-graines' },
    { name: 'Outils de Jardin', slug: 'outils-jardin' },
    { name: 'Mobilier de Jardin', slug: 'mobilier-jardin' },
    { name: 'Barbecue', slug: 'barbecue' },
    { name: 'Décoration Jardin', slug: 'decoration-jardin' },
  ],

  'Bricolage': [
    { name: 'Outillage à Main', slug: 'outillage-main' },
    { name: 'Outillage Électroportatif', slug: 'outillage-electroportatif' },
    { name: 'Quincaillerie', slug: 'quincaillerie' },
    { name: 'Peinture', slug: 'peinture' },
    { name: 'Plomberie', slug: 'plomberie' },
  ],
};

// Fonction pour déterminer la sous-catégorie d'un produit basé sur son nom et description
function determineSubcategory(product, parentCategory, subcategories) {
  const productName = product.name.toLowerCase();
  const productDesc = (product.description || '').toLowerCase();
  const text = `${productName} ${productDesc}`;

  // Mapping de mots-clés vers sous-catégories
  const keywordMap = {
    // Informatique
    'laptop|portable|notebook': 'Ordinateurs Portables',
    'desktop|tour|pc fixe': 'Ordinateurs de Bureau',
    'processeur|carte graphique|carte mère|ram|mémoire': 'Composants PC',
    'souris|clavier|écran|moniteur|webcam': 'Périphériques',
    'disque dur|ssd|clé usb|carte sd': 'Stockage',

    // Électronique
    'smartphone|téléphone|iphone|samsung galaxy': 'Smartphones',
    'tablette|ipad': 'Tablettes',
    'casque|écouteurs|enceinte|haut-parleur': 'Audio',
    'appareil photo|caméra|gopro': 'Photo & Vidéo',
    'chargeur|cable|coque|protection': 'Accessoires Électroniques',

    // Réseau
    'routeur|router': 'Routeurs',
    'switch|commutateur': 'Switches',
    'point d\'accès|wifi|access point': 'Points d\'accès WiFi',
    'câble|rj45|ethernet': 'Câbles Réseau',
    'modem|box': 'Modems',

    // Mobilier
    'bureau|desk': 'Bureaux',
    'chaise|fauteuil|siège': 'Chaises',
    'étagère|armoire|meuble de rangement': 'Rangements',
    'table': 'Tables',
    'canapé|sofa': 'Canapés',

    // Électroménager
    'réfrigérateur|lave-linge|four|cuisinière': 'Gros Électroménager',
    'mixeur|blender|grille-pain|cafetière': 'Petit Électroménager',
    'robot cuisine|batteur|autocuiseur': 'Cuisine',
    'aspirateur|nettoyeur|fer à repasser': 'Entretien',
    'climatiseur|ventilateur|chauffage': 'Climatisation',

    // Sports
    'haltère|banc|tapis|yoga|fitness': 'Fitness & Musculation',
    'football|basketball|volleyball|rugby': 'Sports Collectifs',
    'tennis|badminton|squash|raquette': 'Sports de Raquette',
    'vélo|vtt|cyclisme': 'Cyclisme',
    'natation|surf|plongée|kayak': 'Sports Nautiques',

    // Vêtements
    'homme|men': 'Vêtements Homme',
    'femme|women': 'Vêtements Femme',
    'enfant|bébé|kids': 'Vêtements Enfant',
    'sous-vêtement|slip|soutien-gorge': 'Sous-vêtements',
    'running|training|sport': 'Vêtements de Sport',

    // Beauté
    'crème|sérum|visage': 'Soins du Visage',
    'rouge à lèvres|mascara|fond de teint|maquillage': 'Maquillage',
    'parfum|eau de toilette|cologne': 'Parfums',
    'gel douche|lotion|corps': 'Soins du Corps',
    'shampoing|après-shampoing|cheveux': 'Soins Cheveux',
  };

  // Chercher une correspondance
  for (const [pattern, subcatName] of Object.entries(keywordMap)) {
    const regex = new RegExp(pattern, 'i');
    if (regex.test(text)) {
      const subcat = subcategories.find(s => s.name === subcatName);
      if (subcat) return subcat;
    }
  }

  // Si aucune correspondance, retourner la première sous-catégorie disponible
  return subcategories[0] || null;
}

async function main() {
  try {
    console.log('🚀 Création des sous-catégories en local...\n');

    // Récupérer toutes les catégories existantes
    console.log('📋 Récupération des catégories...');
    const existingCategories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      }
    });
    console.log(`✅ ${existingCategories.length} catégories trouvées\n`);

    // Récupérer tous les produits (sélection explicite des champs pour éviter searchTerms)
    console.log('📦 Récupération des produits...');
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        categoryId: true
      }
    });
    console.log(`✅ ${products.length} produits trouvés\n`);

    let totalSubcategoriesCreated = 0;
    let totalProductsMoved = 0;

    // Pour chaque catégorie parente, créer les sous-catégories
    for (const parentCategory of existingCategories) {
      const subcategoriesConfig = SUBCATEGORIES_CONFIG[parentCategory.name];

      if (!subcategoriesConfig || parentCategory.parentId) {
        // Pas de sous-catégories configurées pour cette catégorie, ou c'est déjà une sous-catégorie
        continue;
      }

      console.log(`\n📁 Traitement de la catégorie: ${parentCategory.name}`);
      console.log(`   Nombre de produits: ${parentCategory._count?.products || 0}`);

      // Créer les sous-catégories
      const createdSubcategories = [];
      for (const subcat of subcategoriesConfig) {
        try {
          const existingSubcat = await prisma.category.findFirst({
            where: {
              slug: subcat.slug
            }
          });

          if (existingSubcat) {
            console.log(`   ⚠️  Sous-catégorie existe déjà: ${subcat.name}`);
            createdSubcategories.push(existingSubcat);
          } else {
            const newSubcat = await prisma.category.create({
              data: {
                name: subcat.name,
                slug: subcat.slug,
                description: `${subcat.name} - ${parentCategory.name}`,
                parentId: parentCategory.id
              },
              include: {
                _count: {
                  select: { products: true }
                }
              }
            });
            createdSubcategories.push(newSubcat);
            totalSubcategoriesCreated++;
            console.log(`   ✅ Sous-catégorie créée: ${subcat.name}`);
          }
        } catch (error) {
          console.log(`   ❌ Erreur lors de la création de ${subcat.name}:`, error.message);
        }
      }

      // Affecter les produits aux sous-catégories
      const categoryProducts = products.filter(p => p.categoryId === parentCategory.id);

      if (categoryProducts.length > 0 && createdSubcategories.length > 0) {
        console.log(`\n   📦 Affectation de ${categoryProducts.length} produits aux sous-catégories...`);

        for (const product of categoryProducts) {
          try {
            const subcategory = determineSubcategory(product, parentCategory, createdSubcategories);

            if (subcategory) {
              await prisma.product.update({
                where: { id: product.id },
                data: { categoryId: subcategory.id }
              });
              totalProductsMoved++;
              console.log(`   ✅ ${product.name} → ${subcategory.name}`);
            }
          } catch (error) {
            console.log(`   ❌ Erreur pour ${product.name}:`, error.message);
          }
        }
      }
    }

    console.log('\n\n✅ Création des sous-catégories terminée!');
    console.log(`📊 Statistiques:`);
    console.log(`   - ${totalSubcategoriesCreated} sous-catégories créées`);
    console.log(`   - ${totalProductsMoved} produits réorganisés`);
    console.log('🎉 Tous les produits ont été réorganisés dans leurs sous-catégories respectives.');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
