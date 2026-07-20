/**
 * Devine une catégorie française à partir du nom/titre d'un produit.
 * Utilisé par l'import dropshipping ET le script de nettoyage du catalogue.
 * Retourne toujours un nom de catégorie réel (jamais « À catégoriser ») —
 * repli « Bazar » pour les produits non reconnus.
 */

// Ordre important : les règles les plus spécifiques d'abord.
const RULES: Array<[string, RegExp]> = [
  // Téléphonie & accessoires
  ['Accessoires Téléphonies', /coque|étui.*(téléphone|iphone|samsung|xiaomi)|protection.*écran|verre trempé|magsafe|magnétique.*(iphone|téléphone)|anneau.*téléphone|popsocket|support.*téléphone|chargeur.*(sans fil|induction|téléphone)|c[âa]ble.*(usb|charge|lightning|type.?c)|powerbank|batterie externe|airpods/i],
  // High-tech & électronique
  ['High-Tech & Gadgets', /écouteur|casque|enceinte|bluetooth|montre connect|smartwatch|projecteur|clavier|souris|webcam|micro|hub usb|adaptateur hdmi|disque|clé usb|manette|console|caméra|surveillance|wifi|drone|led.*(rgb|bande|ruban)|ventilateur|humidificateur/i],
  // Éclairage
  ['Éclairage', /lampe|veilleuse|guirlande|ampoule|luminaire|néon|torche|projecteur.*lumière|éclairage|spot(?!ify)/i],
  // Cuisine
  ['Cuisine', /cuisine|couteau|éplucheur|balance.*cuisine|thermomètre.*cuisine|planche.*découper|passoire|moule|spatule|ustensile|bouilloire|mixeur|presse.?agrume|gourde|bouteille.*(eau|sport|infuseur)|thermos|isotherme|tasse|mug/i],
  // Maison & déco
  ['Maison & Déco', /rangement|organisateur|boîte.*rangement|étag[èe]re|crochet|tapis|rideau|coussin|plaid|horloge|cadre|miroir(?!.*grossissant)|vase|bougie|diffuseur|décoration|sticker.*mur|autocollant.*mur|panier.*linge|housse.*(coussin|canapé)/i],
  // Salle de bain
  ['Salle de Bain', /douche|salle de bain|savon|brosse.*dent|porte.?savon|serviette|pommeau|rideau.*douche/i],
  // Beauté & bien-être
  ['Beauté & Bien-être', /maquillage|rouge à lèvres|pinceau.*maquillage|manucure|vernis|faux ongles|rouleau.*(jade|visage)|masseur|massage|épilateur|tondeuse|rasoir|soin.*(visage|peau)|sérum|crème|miroir.*grossissant|cheveux|coiffure|lisseur|boucleur|parfum|luminothérapie/i],
  // Mode & bijoux
  ['Mode & Bijoux', /collier|bracelet|bague|boucles.*oreilles|bijou|montre(?!.*connect)|lunettes.*soleil|casquette|chapeau|bonnet|écharpe|gants(?!.*(jardin|musculation))|ceinture|portefeuille|porte.?carte|sac(?!.*(aspirateur|congélation))|pochette|foulard|cravate/i],
  // Sport & fitness
  ['Sport & Fitness', /fitness|musculation|yoga|tapis.*sport|élastique.*(sport|fitness)|corde à sauter|haltère|gourde.*sport|brassard.*sport|vélo|randonnée|natation|running/i],
  // Auto & moto
  ['Auto & Moto', /voiture|auto(?!collant)|moto|véhicule|volant|pneu|tableau de bord|support.*voiture|organiseur.*voiture|nettoyage.*voiture|siège.*auto/i],
  // Animalerie
  ['Animalerie', /chien|chat|animal|animaux|gamelle|laisse|harnais|litière|aquarium|jouet.*(chien|chat)|croquette/i],
  // Bébé & enfant
  ['Bébé & Enfant', /bébé|enfant|biberon|body.*bébé|jouet.*éveil|poussette|tétine|couche/i],
  // Jeux & jouets
  ['Jeux & Jouets', /jouet|jeu.*(société|éducatif)|puzzle|peluche|figurine|lego|brique.*construction|cube.*magique|rubik/i],
  // Jardin
  ['Jardin', /jardin|plante|arrosage|arrosoir|gants.*jardin|graine|pot.*fleur|serre|tuyau.*arrosage|solaire.*jardin/i],
  // Bricolage & outils
  ['Bricolage & Outils', /outil|perceuse|tournevis|clé.*(molette|à cliquet)|marteau|scie|mètre|niveau.*laser|pince|multifonction|visserie|bricolage/i],
  // Bureau
  ['Fournitures de Bureau', /bureau|stylo|carnet|agenda|classeur|trousse|calculatrice|organiseur.*bureau|tableau.*blanc|marqueur/i],
];

/** Nom de catégorie de repli (catch-all réel, jamais « À catégoriser »). */
export const FALLBACK_CATEGORY = 'Bazar';

export function guessCategory(title: string | null | undefined): string {
  const t = (title || '').toLowerCase();
  for (const [name, rx] of RULES) if (rx.test(t)) return name;
  return FALLBACK_CATEGORY;
}
