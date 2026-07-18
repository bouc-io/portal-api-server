import { Router } from 'express';
import healthRoutes from './healthRoutes';
import instructionsRoutes from './instructionsRoutes';
import configRoutes from './configRoutes';
import billingRoutes from './billingRoutes';
import paymentRoutes from './paymentRoutes';

const router = Router();

// Health probes
router.use('/health', healthRoutes);

// LLM instructions CRUD (JWT required per-controller)
router.use('/instructions', instructionsRoutes);

// Internal service-to-service config (no auth)
router.use('/config', configRoutes);

// Billing: subscription and invoices (JWT required per-controller)
router.use('/billings', billingRoutes);

// Payment methods (JWT required per-controller)
router.use('/payments', paymentRoutes);

export default router;
