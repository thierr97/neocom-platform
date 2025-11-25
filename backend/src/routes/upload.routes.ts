import express from 'express';
import { upload } from '../middleware/upload';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Upload single image
router.post('/image', authMiddleware, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier uploadé'
      });
    }

    const imageUrl = `/uploads/products/${req.file.filename}`;
    
    return res.json({
      success: true,
      message: 'Image uploadée avec succès',
      data: {
        url: imageUrl,
        filename: req.file.filename
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

    const imageUrls = req.files.map((file: Express.Multer.File) => ({
      url: `/uploads/products/${file.filename}`,
      filename: file.filename
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
