import { Router, Request, Response } from 'express';
import { AiService } from '../services/ai.service';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

// /api/v1/ai/classify
router.post('/classify', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description required' });
    }
    const result = await AiService.classifyComplaint(title, description);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// /api/v1/ai/sentiment
router.post('/sentiment', authenticateJWT, (req: Request, res: Response) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description required' });
    }
    const result = AiService.analyzeSentimentAndUrgency(title, description);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// /api/v1/ai/duplicate-check
router.post('/duplicate-check', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { title, description, excludeId } = req.body;
    if (!title && !description) {
      return res.status(400).json({ success: false, message: 'Title or description required' });
    }
    const result = await AiService.findSimilarComplaints(title || '', description || '', excludeId);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// /api/v1/ai/suggest-response
router.post('/suggest-response', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { title, description, categoryName, priority, userName } = req.body;
    const draft = await AiService.generateAutoResponseDraft({
      title: title || 'Inquiry',
      description: description || '',
      category: categoryName ? { name: categoryName } : undefined,
      priority: priority || 'MEDIUM',
      userName,
    });
    return res.json({ success: true, data: { draft } });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
