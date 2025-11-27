/**
 * Script de démonstration pour générer UNE image IA
 * Utilisez ceci pour tester avant de lancer la génération en masse
 */

const Replicate = require('replicate');

async function generateDemoImage() {
  console.log('🎨 DÉMONSTRATION - Génération d\'une image IA\n');

  // Vérifier le token
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    console.error('❌ REPLICATE_API_TOKEN manquant!');
    console.log('\n💡 Pour obtenir votre token:');
    console.log('   1. Allez sur https://replicate.com');
    console.log('   2. Créez un compte (GRATUIT)');
    console.log('   3. Account → API Tokens');
    console.log('   4. Copiez votre token');
    console.log('   5. Ajoutez dans .env: REPLICATE_API_TOKEN=r8_xxx...');
    console.log('\n📝 Puis relancez: REPLICATE_API_TOKEN=r8_xxx node demo-ai-image.js\n');
    process.exit(1);
  }

  const replicate = new Replicate({ auth: token });

  // Prompt pour une valise professionnelle
  const prompt = `Professional product photography, modern black suitcase,
    front view, centered, white background, studio lighting,
    high quality, 4k resolution, sharp focus, commercial photography style,
    e-commerce product image, clean background, professional lighting`;

  const negativePrompt = `low quality, blurry, distorted, watermark, text,
    logo, signature, cartoon, drawing, illustration, people, hands`;

  console.log('📝 Prompt:', prompt.substring(0, 100) + '...');
  console.log('⏳ Génération en cours (30-60 secondes)...\n');

  try {
    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          prompt: prompt,
          negative_prompt: negativePrompt,
          num_outputs: 1,
          guidance_scale: 7.5,
          num_inference_steps: 50,
          width: 1024,
          height: 1024
        }
      }
    );

    if (output && output.length > 0) {
      console.log('✅ Image générée avec succès!\n');
      console.log('🔗 URL de l\'image:');
      console.log(output[0]);
      console.log('\n💡 Ouvrez cette URL dans votre navigateur pour voir le résultat!');
      console.log('\n📊 Coût estimé: ~$0.01');
      console.log('🎯 Qualité: Professionnelle, 1024x1024px');

      console.log('\n✅ Prêt à générer des images pour vos produits!');
      console.log('📖 Consultez GUIDE_AI_IMAGES.md pour plus d\'infos');
    } else {
      console.log('❌ Aucune image générée');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);

    if (error.message.includes('authentication')) {
      console.log('\n💡 Votre token API semble invalide.');
      console.log('   Vérifiez qu\'il commence bien par "r8_"');
    } else if (error.message.includes('credits') || error.message.includes('billing')) {
      console.log('\n💡 Vous n\'avez plus de crédits gratuits.');
      console.log('   Ajoutez un mode de paiement sur https://replicate.com/account');
    }
  }
}

// Lancer la démo
generateDemoImage();
