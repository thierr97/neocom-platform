import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Vérifier la configuration
const checkConfig = () => {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    console.warn('⚠️  Cloudinary non configuré - Les variables d\'environnement sont manquantes');
    return false;
  }
  console.log('✅ Cloudinary configuré:', process.env.CLOUDINARY_CLOUD_NAME);
  return true;
};

// Exécuter la vérification au démarrage
checkConfig();

export default cloudinary;
