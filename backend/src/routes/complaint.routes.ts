import { Router } from 'express';
import {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateStatus,
  assignStaff,
  addFeedback,
  checkDuplicates,
} from '../controllers/complaint.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

// Citizen & public endpoints
router.get('/', authenticateJWT, getComplaints);
router.post('/', authenticateJWT, upload.array('attachments', 5), createComplaint);
router.post('/check-duplicates', authenticateJWT, checkDuplicates);
router.get('/:id', authenticateJWT, getComplaintById);
router.post('/:id/feedback', authenticateJWT, addFeedback);

// Staff and Admin workflow endpoints
router.patch(
  '/:id/status',
  authenticateJWT,
  authorizeRoles('AGENT', 'MANAGER', 'ADMIN'),
  updateStatus
);

router.patch(
  '/:id/assign',
  authenticateJWT,
  authorizeRoles('MANAGER', 'ADMIN'),
  assignStaff
);

export default router;
