/**
 * Marques / IP protégées à NE PAS importer (risque de contrefaçon ou d'atteinte
 * aux marques déposées). Utilisé par l'auto-sourcing (filtre à l'import) et le
 * script de nettoyage (masque les produits déjà en ligne).
 *
 * ⚠️ Best-effort par mots-clés du TITRE : attrape les produits qui NOMMENT la
 * marque. Les contrefaçons dont le logo n'apparaît que dans l'IMAGE ne sont pas
 * détectables ici → un contrôle visuel manuel reste nécessaire.
 *
 * NB : on ne bloque PAS les mentions de compatibilité légitimes (« pour iPhone »,
 * « compatible Samsung ») — seulement les marques dont la reproduction sur le
 * produit lui-même est typiquement de la contrefaçon.
 */
const BLOCKED = [
  // Mode & luxe
  'nike', 'adidas', 'puma', 'jordan', 'reebok', 'new balance', 'the north face',
  'gucci', 'louis vuitton', 'chanel', 'dior', 'prada', 'hermes', 'hermès', 'versace',
  'balenciaga', 'burberry', 'fendi', 'givenchy', 'lacoste', 'ralph lauren', 'tommy hilfiger',
  'rolex', 'omega', 'cartier', 'swarovski',
  // Divertissement / IP
  'disney', 'mickey', 'marvel', 'avengers', 'spider-man', 'spiderman', 'star wars',
  'pokemon', 'pokémon', 'pikachu', 'nintendo', 'super mario', 'zelda', 'sonic',
  'hello kitty', 'sanrio', 'harry potter', 'barbie', 'lego', 'stitch', 'naruto',
  'dragon ball', 'one piece', 'squid game', 'minecraft', 'roblox', 'fortnite',
  // Transport / logistique (logos souvent reproduits sur figurines/déco)
  'dhl', 'fedex', 'ups ', 'hapag-lloyd', 'hapag lloyd', 'maersk', 'evergreen shipping',
  'msc shipping', 'ocean network express', 'cma cgm',
  // Sport / clubs
  'real madrid', 'barcelona fc', 'psg', 'manchester united', 'fifa', 'nba', 'uefa',
  // Autres marques fréquemment contrefaites
  'supreme', 'off-white', 'yeezy', 'apple airpods pro', 'ferrari', 'lamborghini', 'bmw logo',
];

const RX = new RegExp('\\b(' + BLOCKED.map((b) => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'i');

/** true si le titre évoque une marque/IP protégée (à écarter). */
export function isBrandBlocked(title: string | null | undefined): boolean {
  return RX.test(title || '');
}

export const BLOCKED_TERMS = BLOCKED;
