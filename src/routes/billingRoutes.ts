import { Router } from 'express';
import {
    getSubscription,
    updateSubscription,
    listInvoices,
    getInvoice,
} from '../controllers/billingController';
import { requireRoles } from '../lib/auth';
import { ROLES } from '../lib/roles';
import { validate } from '../middleware/validate';
import { updateSubscriptionSchema } from '../schemas';

const router = Router();

// bouc_finance = read-only; WRITE_ROLES can also modify subscription
const BILLING_READ  = [ROLES.BOUC_ADMIN, ROLES.BOUC_FINANCE, ROLES.BOUC_USER, ROLES.ORG_ADMIN, ROLES.ORG_ADMIN_ENTERPRISE] as const;
const BILLING_WRITE = [ROLES.BOUC_ADMIN, ROLES.BOUC_USER, ROLES.ORG_ADMIN, ROLES.ORG_ADMIN_ENTERPRISE] as const;

/**
 * @openapi
 * /v1/portal/billings/subscription:
 *   get:
 *     summary: Get the current user's subscription
 *     tags: [Billing]
 *     responses:
 *       '200': { description: Subscription record }
 *       '403': { description: Forbidden }
 *   put:
 *     summary: Update the current user's subscription
 *     tags: [Billing]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plan: { type: string, example: pro }
 *     responses:
 *       '200': { description: Subscription updated }
 *       '400': { description: Validation error }
 */
router.get('/subscription', requireRoles(...BILLING_READ), getSubscription);
router.put('/subscription', requireRoles(...BILLING_WRITE), validate(updateSubscriptionSchema), updateSubscription);

/**
 * @openapi
 * /v1/portal/billings/invoices:
 *   get:
 *     summary: List the current user's invoices
 *     tags: [Billing]
 *     responses:
 *       '200': { description: Invoice list }
 * /v1/portal/billings/invoices/{id}:
 *   get:
 *     summary: Get a single invoice
 *     tags: [Billing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200': { description: Invoice record }
 *       '404': { description: Not found }
 */
router.get('/invoices', requireRoles(...BILLING_READ), listInvoices);
router.get('/invoices/:id', requireRoles(...BILLING_READ), getInvoice);

export default router;
