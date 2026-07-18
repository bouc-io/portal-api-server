import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { getUserContextFromRequest } from '../lib/auth';
import { createComponentLogger } from '../lib/logger';

const log = createComponentLogger('payment-controller');

/**
 * GET /v1/portal/payments
 * List all payment methods scoped to the caller's org or user
 */
export const listPaymentMethods = async (req: Request, res: Response) => {
    const ctx = getUserContextFromRequest(req);
    if (!ctx) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } });
    }
    const { userId, orgId } = ctx;
    const scopeWhere = orgId ? { org_id: orgId } : { user_id: userId };

    try {
        const payment_methods = await prisma.paymentMethod.findMany({
            where: scopeWhere,
            orderBy: { created_at: 'desc' },
        });
        res.json({ payment_methods });
    } catch (error) {
        log.error({ err: error }, 'Failed to list payment methods');
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list payment methods' } });
    }
};

/**
 * PUT /v1/portal/payments
 * Upsert the default payment method scoped to the caller's org or user.
 * Replaces the existing default (there is at most one default at a time).
 */
export const upsertPaymentMethod = async (req: Request, res: Response) => {
    const ctx = getUserContextFromRequest(req);
    if (!ctx) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } });
    }
    const { userId, orgId } = ctx;
    const scopeWhere = orgId ? { org_id: orgId } : { user_id: userId };

    const { brand, last4, expiry } = req.body;
    if (!brand || !last4 || !expiry) {
        return res.status(400).json({
            error: { code: 'VALIDATION_ERROR', message: 'brand, last4, and expiry are required' },
        });
    }

    try {
        // Clear existing default for this org/user before setting new one
        await prisma.paymentMethod.updateMany({
            where: { ...scopeWhere, is_default: true },
            data: { is_default: false },
        });

        const paymentMethod = await prisma.paymentMethod.create({
            data: { ...scopeWhere, brand, last4, expiry, is_default: true },
        });

        log.info({ userId, orgId, brand, last4 }, 'Payment method updated');
        res.json(paymentMethod);
    } catch (error) {
        log.error({ err: error }, 'Failed to upsert payment method');
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update payment method' } });
    }
};
