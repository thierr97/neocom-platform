import { Router } from 'express';
import * as quoteController from '../controllers/quote.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', quoteController.getAllQuotes);
router.get('/:id', quoteController.getQuoteById);
router.post('/', quoteController.createQuote);
router.post('/from-cart', quoteController.createQuoteFromCart);
router.patch('/:id/status', quoteController.updateQuoteStatus);
router.post('/:id/convert', quoteController.convertQuoteToOrder);
router.get('/:id/pdf', quoteController.generateQuotePDF);
router.post('/:id/send-email', quoteController.sendQuoteByEmail);
router.delete('/:id', quoteController.deleteQuote);

export default router;
