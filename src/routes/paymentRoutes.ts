import { Router } from 'express';
import { listPaymentMethods, upsertPaymentMethod } from '../controllers/paymentController';
import { requireRoles } from '../lib/auth';
import { ROLES } from '../lib/roles';
import { validate } from '../middleware/validate';
import { upsertPaymentMethodSchema } from '../schemas';

const router = Router();

router.use(requireRoles(ROLES.BOUC_USER, ROLES.ORG_ADMIN, ROLES.ORG_ADMIN_ENTERPRISE));

/**
 * @openapi
 * /v1/portal/payments:
 *   get:
 *     summary: List the current user's payment methods
 *     tags: [Payments]
 *     responses:
 *       '200': { description: Payment method list }
 *       '403': { description: Forbidden }
 *   put:
 *     summary: Create or update the current user's payment method
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               brand: { type: string, example: visa }
 *               last4: { type: string, example: "4242" }
 *     responses:
 *       '200': { description: Payment method saved }
 *       '400': { description: Validation error }
 */
router.get('/', listPaymentMethods);
router.put('/', validate(upsertPaymentMethodSchema), upsertPaymentMethod);

export default router;
