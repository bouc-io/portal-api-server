import { Router } from 'express';
import { listActiveInstructions } from '../controllers/instructionsController';
import { requireRoles } from '../lib/auth';

const router = Router();

// Config routes are role-guarded: scoping enforced in controller.
// requireRoles() with no args = any valid token required.
router.use(requireRoles());

// GET /v1/portal/config/instructions - active instructions for internal services (no auth)
router.get('/instructions', listActiveInstructions);

export default router;
