import Anthropic from '@anthropic-ai/sdk';
import prisma from '../config/database';

/**
 * Assistant client IA de la boutique NeoServ (RAG léger).
 *
 * Garde-fous :
 *   - répond UNIQUEMENT à partir des données NeoServ injectées dans le contexte
 *     (produits trouvés, statut de commande vérifié, FAQ) — jamais d'invention ;
 *   - suivi de commande seulement si n° de commande + e-mail correspondent ;
 *   - aucune donnée de paiement manipulée ;
 *   - escalade humaine proposée quand l'IA ne sait pas.
 *
 * Variables d'environnement :
 *   ANTHROPIC_API_KEY — requis
 *   CHATBOT_MODEL     — défaut : claude-haiku-4-5-20251001
 *   SHOP_CONTACT_*    — coordonnées affichées en escalade (voir DEFAULT_FAQ)
 */

const MODEL = () => process.env.CHATBOT_MODEL || process.env.AI_IMPORT_MODEL || 'claude-haiku-4-5-20251001';
const MAX_HISTORY = 12; // messages conservés dans le contexte

const DEFAULT_FAQ = `
## Informations boutique NeoServ
- Adresse : 14 CC LE PAVILLION rue Becquerel, 97122 Baie-Mahault, Guadeloupe
- Téléphone : ${process.env.SHOP_CONTACT_PHONE || '0690 97 37 10'} (Lun-Ven 9h-18h)
- E-mail : ${process.env.SHOP_CONTACT_EMAIL || 'contact@neocom.com'}
- Paiements acceptés : Visa, Mastercard, PayPal, virement bancaire
- Livraison : DHL, La Poste, Chronopost — GRATUITE dès 100 € d'achat
- Retours : gratuits sous 30 jours (produits non ouverts) ; certains produits
  d'hygiène, lingerie et cosmétiques ne sont pas repris pour raisons d'hygiène
- Les produits expédiés par nos partenaires ont un délai indiqué sur leur fiche
  (généralement 10 à 30 jours) ; les produits en stock local partent sous 48 h
`;

/** Recherche produits pour le contexte RAG. */
async function searchProducts(query: string) {
  const words = query.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/).filter((w) => w.length > 2).slice(0, 6);
  if (!words.length) return [];

  const products = await prisma.product.findMany({
    where: {
      isVisible: true,
      status: 'ACTIVE',
      OR: [
        ...words.map((w) => ({ name: { contains: w, mode: 'insensitive' as const } })),
        { searchTerms: { hasSome: words } },
        { tags: { hasSome: words } },
      ],
    },
    select: {
      id: true, name: true, slug: true, price: true, stock: true,
      shortDescription: true, availabilityStatus: true,
      category: { select: { name: true } },
      dropshipSource: { select: { deliveryDaysMin: true, deliveryDaysMax: true } },
    },
    take: 6,
    orderBy: { isFeatured: 'desc' },
  });
  return products;
}

/** Statut de commande — uniquement si le n° ET l'e-mail correspondent. */
async function lookupOrder(orderNumber: string, email: string) {
  const order = await prisma.order.findFirst({
    where: {
      number: { equals: orderNumber.trim(), mode: 'insensitive' },
      customer: { email: { equals: email.trim(), mode: 'insensitive' } },
    },
    select: {
      number: true, status: true, paymentStatus: true, total: true, createdAt: true,
      items: { select: { quantity: true, product: { select: { name: true } } } },
    },
  });
  if (!order) return null;

  const supplierOrders = await prisma.supplierOrder.findMany({
    where: { orderId: (await prisma.order.findFirst({ where: { number: order.number }, select: { id: true } }))!.id },
    select: { status: true, trackingNumber: true, trackingUrl: true, carrier: true },
  }).catch(() => []);

  return { ...order, tracking: supplierOrders };
}

function extractOrderRef(text: string): { orderNumber: string | null; email: string | null } {
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const numMatch = text.match(/\b(?:CMD|ORD|CC)[-#]?\s?[A-Z0-9-]{4,20}\b/i) || text.match(/\b\d{5,12}\b/);
  return { orderNumber: numMatch ? numMatch[0].replace(/\s/g, '') : null, email: emailMatch ? emailMatch[0] : null };
}

export async function chat(params: {
  sessionId: string;
  message: string;
  customerEmail?: string | null;
}): Promise<{ reply: string; escalated: boolean; products: any[] }> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      reply: `Notre assistant est momentanément indisponible. Contactez-nous au ${process.env.SHOP_CONTACT_PHONE || '0690 97 37 10'} ou par e-mail à ${process.env.SHOP_CONTACT_EMAIL || 'contact@neocom.com'} (Lun-Ven 9h-18h).`,
      escalated: true,
      products: [],
    };
  }

  // Conversation persistée
  const conversation = await prisma.chatConversation.upsert({
    where: { sessionId: params.sessionId },
    create: { sessionId: params.sessionId, customerEmail: params.customerEmail || null },
    update: { ...(params.customerEmail ? { customerEmail: params.customerEmail } : {}) },
    include: { messages: { orderBy: { createdAt: 'asc' }, take: MAX_HISTORY } },
  });

  await prisma.chatMessage.create({
    data: { conversationId: conversation.id, role: 'user', content: params.message.slice(0, 2000) },
  });

  // ---- Contexte RAG ----
  const products = await searchProducts(params.message);
  const productContext = products.length
    ? products.map((p) => {
        const delay = p.dropshipSource
          ? `expédié par notre partenaire (${p.dropshipSource.deliveryDaysMin || 10}-${p.dropshipSource.deliveryDaysMax || 30} j)`
          : 'en stock local (48 h)';
        return `- ${p.name} | ${p.price.toFixed(2)} € | ${p.availabilityStatus === 'AVAILABLE' && p.stock > 0 ? 'disponible' : 'indisponible'} | ${delay} | lien: /shop/product/${p.slug} | ${p.shortDescription || ''}`;
      }).join('\n')
    : 'Aucun produit trouvé pour cette recherche.';

  // Suivi de commande si le message contient n° + e-mail
  const ref = extractOrderRef(params.message);
  const email = ref.email || params.customerEmail || conversation.customerEmail;
  let orderContext = '';
  if (ref.orderNumber && email) {
    const order = await lookupOrder(ref.orderNumber, email);
    orderContext = order
      ? `\n## Commande vérifiée ${order.number}\nStatut: ${order.status} | Paiement: ${order.paymentStatus} | Total: ${order.total.toFixed(2)} €\nArticles: ${order.items.map((i) => `${i.quantity}× ${i.product?.name}`).join(', ')}\nSuivi colis: ${order.tracking.length ? order.tracking.map((t) => `${t.carrier || ''} ${t.trackingNumber || 'en préparation'} ${t.trackingUrl || ''}`).join(' ; ') : 'pas encore expédié'}`
      : `\n## Commande introuvable\nLe n° "${ref.orderNumber}" ne correspond à aucune commande associée à ${email}. Demande au client de vérifier les deux informations.`;
  } else if (/commande|colis|livraison|suivi|track/i.test(params.message) && !orderContext) {
    orderContext = '\n## Suivi de commande\nPour donner le statut, il te faut le n° de commande ET l\'e-mail du client. Demande-les poliment si absents.';
  }

  const history = conversation.messages.slice(-MAX_HISTORY).map((m) => ({
    role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
    content: m.content,
  }));

  const system = `Tu es "Néo", l'assistant client de la boutique en ligne NeoServ (neoserv.fr), en Guadeloupe.
Ton style : chaleureux, direct, tutoiement interdit (vouvoie les clients), réponses courtes (2-5 phrases), français.

RÈGLES ABSOLUES :
1. Tu ne réponds QU'À PARTIR des données ci-dessous (produits, commande vérifiée, FAQ). Tu n'inventes JAMAIS un prix, un stock, un délai ou une politique.
2. Si l'information n'est pas dans les données : dis-le et propose le service client (${process.env.SHOP_CONTACT_PHONE || '0690 97 37 10'} / ${process.env.SHOP_CONTACT_EMAIL || 'contact@neocom.com'}).
3. Ne demande et ne traite JAMAIS de données bancaires.
4. Pour recommander un produit, cite son nom, son prix exact et son lien.
5. Si le client est mécontent ou demande un humain, réponds avec empathie et termine ta réponse par [ESCALADE].

${DEFAULT_FAQ}

## Produits correspondant à la demande du client
${productContext}
${orderContext}`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: MODEL(),
    max_tokens: 600,
    system,
    messages: [...history, { role: 'user', content: params.message.slice(0, 2000) }],
  });

  const raw = response.content
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('\n')
    .trim();

  const escalated = raw.includes('[ESCALADE]');
  const reply = raw.replace(/\[ESCALADE\]/g, '').trim();

  await prisma.chatMessage.create({
    data: { conversationId: conversation.id, role: 'assistant', content: reply.slice(0, 4000) },
  });
  if (escalated && !conversation.escalated) {
    await prisma.chatConversation.update({ where: { id: conversation.id }, data: { escalated: true } });
  }

  return { reply, escalated, products: products.map((p) => ({ name: p.name, slug: p.slug, price: p.price })) };
}

export async function rateConversation(sessionId: string, rating: number, resolved?: boolean) {
  return prisma.chatConversation.update({
    where: { sessionId },
    data: {
      rating: Math.max(1, Math.min(5, Math.round(rating))),
      ...(resolved !== undefined ? { resolved } : {}),
    },
  });
}
