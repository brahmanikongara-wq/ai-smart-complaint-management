import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '../controllers/notification.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.get('/', authenticateJWT, getNotifications);
router.patch('/:id/read', authenticateJWT, markAsRead);
router.patch('/read-all', authenticateJWT, markAllAsRead);

export default router;
