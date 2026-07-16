import axios from 'axios';

/**
 * Import IA dropshipping — extraction d'infos produit depuis une URL
 * (AliExpress, Temu, Shein, Alibaba, Amazon…) puis structuration par IA
 * pour créer une fiche produit NeoServ prête à vendre.
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = process.env.AI_IMPORT_MODEL || 'claude-haiku-4-5-20251001';

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,*/*;q=0.8',
  'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.6',
};

export type SourcePlatform =
  | 'aliexpress' | 'temu' | 'shein' | 'alibaba' | 'amazon' | 'cdiscount' | 'autre';

export interface ExtractedSource {
  platform: SourcePlatform;
  fetched: boolean;
  title: string | null;
  description: string | null;
  images: string[];
  priceHints: string[];
  jsonLd: any[];
  textExcerpt: string;
}

export interface ProductProposal {
  name: string;
  shortDescription: string;
  descriptionHtml: string;
  categoryId: string | null;
  categoryName: string | null;
  tags: string[];
  searchTerms: string[];
  metaTitle: string;
  metaDescription: string;
  costPrice: number | null;
  suggestedPrice: number | null;
  images: string[];
  notes: string;
}

export function detectPlatform(url: string): SourcePlatform {
  const h = (() => { try { return new URL(url).hostname; } catch { return ''; } })();
  if (/aliexpress/i.test(h)) return 'aliexpress';
  if (/temu/i.test(h)) return 'temu';
  if (/shein/i.test(h)) return 'shein';
  if (/alibaba/i.test(h)) return 'alibaba';
  if (/amazon/i.test(h)) return 'amazon';
  if (/cdiscount/i.test(h)) return 'cdiscount';
  return 'autre';
}

/** Récupère la page produit (best effort — les plateformes anti-bot peuvent refuser). */
export async function fetchProductPage(url: string): Promise<string | null> {
  try {
    const r = await axios.get(url, {
      headers: BROWSER_HEADERS,
      timeout: 15000,
      maxRedirects: 5,
      responseType: 'text',
      // Certaines plateformes renvoient 403/302 vers captcha : on prend ce qu'on peut
      validateStatus: (s) => s >= 200 && s < 400,
    });
    return typeof r.data === 'string' ? r.data : null;
  } catch {
    return null;
  }
}

function metaContent(html: string, patterns: RegExp[]): string[] {
  const out: string[] = [];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    const global = new RegExp(re.source, 'gi');
    while ((m = global.exec(html)) !== null) {
      if (m[1]) out.push(m[1].trim());
      if (out.length > 20) break;
    }
  }
  return out;
}

/** Extrait les infos exploitables du HTML brut. */
export function extractFromHtml(url: string, html: string | null): ExtractedSource {
  const platform = detectPlatform(url);
  if (!html) {
    return { platform, fetched: false, title: null, description: null, images: [], priceHints: [], jsonLd: [], textExcerpt: '' };
  }

  const ogTitle = metaContent(html, [/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i])[0] || null;
  const titleTag = (html.match(/<title[^>]*>([^<]{5,300})<\/title>/i)?.[1] || '').trim() || null;
  const ogDesc = metaContent(html, [
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
  ])[0] || null;

  // Images : og:image + CDN connus des plateformes
  const images = new Set<string>();
  metaContent(html, [/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i]).forEach((u) => images.add(u));
  const cdnRe = /https?:\/\/[^"'\s\\]+(?:alicdn\.com|kwcdn\.com|temu\.com|shein\.com|ltwebstatic\.com|media-amazon\.com)[^"'\s\\]*\.(?:jpe?g|png|webp)[^"'\s\\]*/gi;
  let im: RegExpExecArray | null;
  while ((im = cdnRe.exec(html)) !== null && images.size < 12) {
    const u = im[0].replace(/\\u002F/g, '/').replace(/\\\//g, '/');
    if (!/(?:32x32|50x50|64x64|_\.webp)/.test(u)) images.add(u);
  }

  // JSON-LD (souvent le plus fiable : name, image, offers.price)
  const jsonLd: any[] = [];
  const ldRe = /<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi;
  let ld: RegExpExecArray | null;
  while ((ld = ldRe.exec(html)) !== null && jsonLd.length < 5) {
    try { jsonLd.push(JSON.parse(ld[1])); } catch { /* ignore */ }
  }

  // Indices de prix dans le JS inline
  const priceHints = metaContent(html, [
    /"(?:sale_?price|salePrice|minPrice|price)"\s*:\s*"?([0-9]+[.,][0-9]{2})/i,
    /itemprop=["']price["'][^>]+content=["']([^"']+)["']/i,
  ]).slice(0, 6);

  // Texte brut (pour l'IA)
  const textExcerpt = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 5000);

  return {
    platform,
    fetched: true,
    title: ogTitle || titleTag,
    description: ogDesc,
    images: [...images].slice(0, 10),
    priceHints,
    jsonLd,
    textExcerpt,
  };
}

function extraireJson(texte: string): any {
  const debut = texte.indexOf('{');
  if (debut === -1) throw new Error("Réponse IA sans JSON");
  let profondeur = 0;
  for (let i = debut; i < texte.length; i++) {
    if (texte[i] === '{') profondeur++;
    if (texte[i] === '}') profondeur--;
    if (profondeur === 0) return JSON.parse(texte.slice(debut, i + 1));
  }
  throw new Error('JSON IA incomplet');
}

/** Appelle Claude pour transformer l'extraction en fiche produit NeoServ. */
export async function analyzeWithAI(params: {
  url: string;
  source: ExtractedSource;
  rawText?: string;
  marginPct: number;
  categories: { id: string; name: string }[];
}): Promise<ProductProposal> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY manquante — ajoutez-la dans les variables d'environnement");
  }
  const { url, source, rawText, marginPct, categories } = params;

  const categoriesTxt = categories.map((c) => `${c.id} :: ${c.name}`).join('\n');

  const prompt = `Tu es le responsable catalogue de NeoServ (neoserv.fr), boutique en ligne en Guadeloupe.
On importe un produit en dropshipping depuis ${source.platform} pour le revendre.

## Données extraites de la page source (${url})
- Page récupérée : ${source.fetched ? 'oui' : 'NON (site anti-bot)'}
- Titre : ${source.title || 'inconnu'}
- Description meta : ${source.description || 'inconnue'}
- Indices de prix trouvés : ${source.priceHints.join(', ') || 'aucun'}
- JSON-LD : ${JSON.stringify(source.jsonLd).slice(0, 1500) || 'aucun'}
- Extrait texte de la page : ${source.textExcerpt.slice(0, 3000) || 'aucun'}
${rawText ? `\n## Informations collées par l'admin (source fiable, prioritaire)\n${rawText.slice(0, 3000)}` : ''}

## Catégories NeoServ disponibles (id :: nom)
${categoriesTxt}

## Ta mission
Produis une fiche produit VENDEUSE en français pour le marché antillais. Règles STRICTES :
1. N'INVENTE RIEN de factuel : caractéristiques uniquement si présentes dans les données. Si une info manque, ne la mentionne pas.
2. name : nom court et clair en français (max 70 caractères), sans mots-clés spam.
3. shortDescription : 1-2 phrases de vente (max 160 caractères).
4. descriptionHtml : description structurée en HTML simple (<p>, <ul>, <li>, <strong>), 80-180 mots, ton direct, bénéfices concrets, PAS de jargon ("révolutionnaire" interdit).
5. categoryId : choisis l'id LE PLUS pertinent dans la liste ci-dessus (obligatoire).
6. costPrice : prix fournisseur en euros si identifiable dans les données (nombre), sinon null.
7. suggestedPrice : si costPrice connu → costPrice × ${(1 + marginPct / 100).toFixed(2)} arrondi au 0,90 supérieur (ex: 7,43 → 7,90). Sinon null.
8. images : recopie UNIQUEMENT les URLs d'images produit plausibles parmi : ${JSON.stringify(source.images)}. Exclus logos/sprites. Max 6.
9. tags : 3-6 tags français. searchTerms : 8-15 termes de recherche (synonymes, fautes courantes, créole si pertinent).
10. notes : signale en une phrase ce qui manque (ex: "prix fournisseur non détecté, à saisir").

Réponds UNIQUEMENT avec un objet JSON :
{"name":"","shortDescription":"","descriptionHtml":"","categoryId":"","categoryName":"","tags":[],"searchTerms":[],"metaTitle":"","metaDescription":"","costPrice":null,"suggestedPrice":null,"images":[],"notes":""}`;

  const r = await axios.post(
    ANTHROPIC_URL,
    {
      model: ANTHROPIC_MODEL,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    },
    {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      timeout: 60000,
    }
  );

  const texte = r.data?.content?.[0]?.text || '';
  const brut = extraireJson(texte);

  // Garde-fous serveur (l'IA reste une proposition, jamais une vérité)
  const catIds = new Set(categories.map((c) => c.id));
  const categoryId = catIds.has(brut.categoryId) ? brut.categoryId : null;
  const images = Array.isArray(brut.images)
    ? brut.images.filter((u: any) => typeof u === 'string' && /^https?:\/\//.test(u)).slice(0, 6)
    : [];

  return {
    name: String(brut.name || source.title || 'Produit sans nom').slice(0, 120),
    shortDescription: String(brut.shortDescription || '').slice(0, 200),
    descriptionHtml: String(brut.descriptionHtml || ''),
    categoryId,
    categoryName: categoryId ? categories.find((c) => c.id === categoryId)?.name || null : null,
    tags: Array.isArray(brut.tags) ? brut.tags.slice(0, 8).map(String) : [],
    searchTerms: Array.isArray(brut.searchTerms) ? brut.searchTerms.slice(0, 20).map(String) : [],
    metaTitle: String(brut.metaTitle || brut.name || '').slice(0, 70),
    metaDescription: String(brut.metaDescription || brut.shortDescription || '').slice(0, 160),
    costPrice: typeof brut.costPrice === 'number' && brut.costPrice > 0 ? brut.costPrice : null,
    suggestedPrice: typeof brut.suggestedPrice === 'number' && brut.suggestedPrice > 0 ? brut.suggestedPrice : null,
    images,
    notes: String(brut.notes || ''),
  };
}
