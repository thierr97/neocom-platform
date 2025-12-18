import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Ensure upload directory exists
const uploadDir = 'uploads/courier-documents';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage for courier documents
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Format: userId-documentType-timestamp.ext
    // Example: abc123-ID_CARD-1703001234567.pdf
    const userId = (req as any).user?.userId || 'unknown';
    const documentType = (req.body.type || 'DOCUMENT').toUpperCase();
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${userId}-${documentType}-${timestamp}${ext}`;
    cb(null, filename);
  }
});

// File filter - accept only images and PDFs
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format de fichier non autorisé. Formats acceptés: JPG, PNG, GIF, PDF'));
  }
};

// Create multer upload instance for courier documents
export const courierDocumentUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: fileFilter
});
