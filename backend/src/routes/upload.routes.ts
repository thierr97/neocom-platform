import express from 'express';
import { upload } from '../middleware/upload';
import { authMiddleware } from '../middleware/auth';
import fs from 'fs';
import path from 'path';

const router = express.Router();

/**
 * Convertit une image en Base64 avec son type MIME
 */
function imageToBase64(file: Express.Multer.File): string {
  try {
    // Lire le fichier
    const imageBuffer = fs.readFileSync(file.path);

    // Convertir en Base64
    const base64Image = imageBuffer.toString('base64');

    // Créer la data URL complète avec le type MIME
    const mimeType = file.mimetype;
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    // Supprimer le fichier temporaire après conversion
    try {
      fs.unlinkSync(file.path);
    } catch (unlinkError) {
      console.warn('Could not delete temporary file:', file.path);
    }

    return dataUrl;
  } catch (error) {
    console.error('Error converting image to Base64:', error);
    throw new Error('Erreur lors de la conversion de l\'image');
  }
}

// Upload single image
router.post('/image', authMiddleware, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier uploadé'
      });
    }

    // Convertir l'image en Base64
    const base64Image = imageToBase64(req.file);

    return res.json({
      success: true,
      message: 'Image uploadée avec succès',
      data: {
        url: base64Image,
        filename: req.file.originalname
      }
    });
  } catch (error: any) {
    console.error('Error uploading image:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de l\'upload de l\'image'
    });
  }
});

// Upload multiple images
router.post('/images', authMiddleware, upload.array('images', 5), (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier uploadé'
      });
    }

    // Convertir toutes les images en Base64
    const imageUrls = req.files.map((file: Express.Multer.File) => ({
      url: imageToBase64(file),
      filename: file.originalname
    }));

    return res.json({
      success: true,
      message: 'Images uploadées avec succès',
      data: imageUrls
    });
  } catch (error: any) {
    console.error('Error uploading images:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de l\'upload des images'
    });
  }
});

export default router;
