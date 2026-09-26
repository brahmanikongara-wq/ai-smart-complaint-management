import { Router } from 'express';
import {
  handleChatMessage,
  getChatHistory,
  submitComplaintFromChat,
} from '../controllers/chatbot.controller';
import { optionalAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/message', optionalAuth, handleChatMessage);
router.get('/history/:sessionToken', optionalAuth, getChatHistory);
router.post('/submit-complaint', optionalAuth, submitComplaintFromChat);

export default router;
