import express from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth';
import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';

const router = express.Router();

// Memory storage — no disk needed (works on Render)
const memUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Seulement les images sont autorisées'));
  },
});

async function uploadToCloudinary(buffer: Buffer, sku?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const publicId = sku
      ? `neoserv/products/${sku.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`
      : `neoserv/products/img_${Date.now()}`;

    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        overwrite: true,
        transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
      },
      (err, result) => {
        if (err || !result) reject(err || new Error('Upload failed'));
        else resolve(result.secure_url);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
}

// Upload single image
router.post('/image', authMiddleware, memUpload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Aucun fichier uploadé' });
    const url = await uploadToCloudinary(req.file.buffer, req.body.sku);
    return res.json({ success: true, message: 'Image uploadée avec succès', data: { url, filename: req.file.originalname } });
  } catch (error: any) {
    console.error('Error uploading image:', error);
    return res.status(500).json({ success: false, message: error.message || 'Erreur upload image' });
  }
});

// Upload multiple images
router.post('/images', authMiddleware, memUpload.array('images', 5), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) return res.status(400).json({ success: false, message: 'Aucun fichier uploadé' });
    const sku = req.body.sku;
    const results = await Promise.all(
      files.map(async (file, i) => ({
        url: await uploadToCloudinary(file.buffer, sku ? `${sku}_${i}` : undefined),
        filename: file.originalname,
      }))
    );
    return res.json({ success: true, message: 'Images uploadées avec succès', data: results });
  } catch (error: any) {
    console.error('Error uploading images:', error);
    return res.status(500).json({ success: false, message: error.message || 'Erreur upload images' });
  }
});

export default router;
