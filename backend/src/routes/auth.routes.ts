import { Router } from 'express';
import { register, login, googleLogin, refreshToken, getProfile } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/refresh-token', refreshToken);
router.get('/profile', authenticateJWT, getProfile);

export default router;
