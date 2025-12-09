import express from 'express';
import { authenticateToken } from '../middleware/auth';
import * as creditNoteController from '../controllers/credit-note.controller';

const router = express.Router();

// Protéger toutes les routes avec l'authentification
router.use(authenticateToken);

// GET /api/credit-notes - Liste des avoirs
router.get('/', creditNoteController.getCreditNotes);

// GET /api/credit-notes/:id - Détail d'un avoir
router.get('/:id', creditNoteController.getCreditNoteById);

// POST /api/credit-notes - Créer un avoir
router.post('/', creditNoteController.createCreditNote);

// DELETE /api/credit-notes/:id - Supprimer un avoir
router.delete('/:id', creditNoteController.deleteCreditNote);

// GET /api/credit-notes/:id/pdf - Télécharger le PDF
router.get('/:id/pdf', creditNoteController.downloadCreditNotePDF);

export default router;
