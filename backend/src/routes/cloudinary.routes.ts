import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import multer from 'multer';
import cloudinary from '../config/cloudinary';
import { AuthRequest } from '../middleware/auth';
import { Response } from 'express';

const router = Router();

// Configuration Multer pour upload en mémoire
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Accepter uniquement les images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seulement les fichiers image sont acceptés'));
    }
  },
});

// Upload une image de produit
router.post(
  '/upload-product-image',
  authenticateToken,
  requireRole('ADMIN'),
  upload.single('image'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Aucune image fournie',
        });
      }

      const { sku } = req.body;
      if (!sku) {
        return res.status(400).json({
          success: false,
          message: 'SKU requis',
        });
      }

      // Upload vers Cloudinary depuis le buffer
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'neoserv/products',
          public_id: sku,
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 1200, crop: 'limit' },
            { quality: 'auto:best' },
            { fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            console.error('Erreur upload Cloudinary:', error);
            return res.status(500).json({
              success: false,
              message: 'Erreur lors de l\'upload vers Cloudinary',
              error: error.message,
            });
          }

          return res.json({
            success: true,
            message: 'Image uploadée avec succès',
            data: {
              url: result?.secure_url,
              publicId: result?.public_id,
              width: result?.width,
              height: result?.height,
              format: result?.format,
            },
          });
        }
      );

      // Pipe le buffer vers Cloudinary
      const bufferStream = require('stream').Readable.from(req.file.buffer);
      bufferStream.pipe(uploadStream);
    } catch (error: any) {
      console.error('Erreur upload image:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'upload de l\'image',
        error: error.message,
      });
    }
  }
);

// Upload multiple images pour un produit
router.post(
  '/upload-product-images',
  authenticateToken,
  requireRole('ADMIN'),
  upload.array('images', 5), // Max 5 images
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Aucune image fournie',
        });
      }

      const { sku } = req.body;
      if (!sku) {
        return res.status(400).json({
          success: false,
          message: 'SKU requis',
        });
      }

      const files = req.files as Express.Multer.File[];
      const uploadPromises = files.map((file, index) => {
        return new Promise((resolve, reject) => {
          const publicId = index === 0 ? sku : `${sku}_${index}`;

          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'neoserv/products',
              public_id: publicId,
              resource_type: 'image',
              transformation: [
                { width: 1200, height: 1200, crop: 'limit' },
                { quality: 'auto:best' },
                { fetch_format: 'auto' },
              ],
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve({
                  url: result?.secure_url,
                  publicId: result?.public_id,
                  width: result?.width,
                  height: result?.height,
                });
              }
            }
          );

          const bufferStream = require('stream').Readable.from(file.buffer);
          bufferStream.pipe(uploadStream);
        });
      });

      const results = await Promise.all(uploadPromises);

      res.json({
        success: true,
        message: `${results.length} image(s) uploadée(s) avec succès`,
        data: results,
      });
    } catch (error: any) {
      console.error('Erreur upload images:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'upload des images',
        error: error.message,
      });
    }
  }
);

// Supprimer une image de Cloudinary
router.delete(
  '/delete-image/:publicId',
  authenticateToken,
  requireRole('ADMIN'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { publicId } = req.params;

      // Le publicId vient avec le format "neoserv/products/sku"
      const fullPublicId = publicId.replace(/\//g, '/');

      const result = await cloudinary.uploader.destroy(fullPublicId);

      if (result.result === 'ok') {
        res.json({
          success: true,
          message: 'Image supprimée avec succès',
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Image non trouvée',
        });
      }
    } catch (error: any) {
      console.error('Erreur suppression image:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de l\'image',
        error: error.message,
      });
    }
  }
);

export default router;
