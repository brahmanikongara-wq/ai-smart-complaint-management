import { Router } from 'express';
import {
  getAnalytics,
  getStaffPerformance,
  getDepartments,
  createDepartment,
  getCategories,
  createCategory,
  getUsers,
  updateUserRole,
} from '../controllers/admin.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

// Public/authenticated metadata
router.get('/departments', authenticateJWT, getDepartments);
router.get('/categories', authenticateJWT, getCategories);

// Admin & Manager Only
router.get(
  '/analytics',
  authenticateJWT,
  authorizeRoles('ADMIN', 'MANAGER'),
  getAnalytics
);

router.get(
  '/staff-performance',
  authenticateJWT,
  authorizeRoles('ADMIN', 'MANAGER'),
  getStaffPerformance
);

router.post(
  '/departments',
  authenticateJWT,
  authorizeRoles('ADMIN'),
  createDepartment
);

router.post(
  '/categories',
  authenticateJWT,
  authorizeRoles('ADMIN'),
  createCategory
);

router.get(
  '/users',
  authenticateJWT,
  authorizeRoles('ADMIN'),
  getUsers
);

router.patch(
  '/users/:id/role',
  authenticateJWT,
  authorizeRoles('ADMIN'),
  updateUserRole
);

export default router;
