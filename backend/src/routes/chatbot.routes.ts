import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as chatbot from '../controllers/chatbot.controller';

/**
 * /api/chatbot — Assistant client IA (PUBLIC, rate-limité).
 */
const router = Router();

// 20 messages / 5 min / IP : suffisant pour une conversation humaine,
// bloque l'abus (chaque message coûte un appel IA).
const chatLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Trop de messages — patientez quelques minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/message', chatLimiter, chatbot.postMessage);
router.post('/feedback', chatLimiter, chatbot.postFeedback);
router.get('/widget.js', chatbot.getWidget);

export default router;
