import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { getUserContextFromRequest } from '../lib/auth';
import { createComponentLogger } from '../lib/logger';

const log = createComponentLogger('billing-controller');

/**
 * GET /v1/portal/billings/subscription
 * Returns the client's current active subscription and full history.
 * Response: { current: Subscription | null, history: Subscription[] }
 */
export const getSubscription = async (req: Request, res: Response) => {
    const ctx = getUserContextFromRequest(req);
    if (!ctx) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } });
    }
    const { userId, orgId } = ctx;
    const scopeWhere = orgId ? { org_id: orgId } : { user_id: userId };

    try {
        const all = await prisma.subscription.findMany({
            where: scopeWhere,
            orderBy: { started_at: 'desc' },
        });

        const current = all.find((s) => s.status === 'active') ?? null;
        const history = all.filter((s) => s.status !== 'active');

        res.json({ current, history });
    } catch (error) {
        log.error({ err: error }, 'Failed to get subscription');
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get subscription' } });
    }
};

/**
 * PUT /v1/portal/billings/subscription
 * Change plan: closes the current active subscription (sets ended_at + status)
 * and creates a new active subscription record.
 * Body: { plan, price, cancel? } — if cancel=true, closes without creating a new one.
 */
export const updateSubscription = async (req: Request, res: Response) => {
    const ctx = getUserContextFromRequest(req);
    if (!ctx) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } });
    }
    const { userId, orgId } = ctx;
    const scopeWhere = orgId ? { org_id: orgId } : { user_id: userId };

    const { plan, price, cancel } = req.body;

    if (!cancel && (!plan || !price)) {
        return res.status(400).json({
            error: { code: 'VALIDATION_ERROR', message: 'plan and price are required unless cancel=true' },
        });
    }

    try {
        const now = new Date();

        // Close any currently active subscription scoped to this user/org
        await prisma.subscription.updateMany({
            where: { ...scopeWhere, status: 'active' },
            data: {
                status: cancel ? 'cancelled' : 'expired',
                ended_at: now,
            },
        });

        if (cancel) {
            log.info({ userId, orgId }, 'Subscription cancelled');
            return res.json({ current: null });
        }

        // Create the new active subscription
        const subscription = await prisma.subscription.create({
            data: {
                ...scopeWhere,
                plan,
                price,
                status: 'active',
                started_at: now,
            },
        });

        log.info({ userId, orgId, plan: subscription.plan }, 'Subscription changed');
        res.status(201).json({ current: subscription });
    } catch (error) {
        log.error({ err: error }, 'Failed to update subscription');
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update subscription' } });
    }
};

/**
 * GET /v1/portal/billings/invoices
 * List all invoices ordered by date descending
 */
export const listInvoices = async (req: Request, res: Response) => {
    const ctx = getUserContextFromRequest(req);
    if (!ctx) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } });
    }
    const { userId, orgId } = ctx;
    const scopeWhere = orgId ? { org_id: orgId } : { user_id: userId };

    try {
        const invoices = await prisma.invoice.findMany({
            where: scopeWhere,
            orderBy: { date: 'desc' },
        });
        res.json({ invoices });
    } catch (error) {
        log.error({ err: error }, 'Failed to list invoices');
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list invoices' } });
    }
};

/**
 * GET /v1/portal/billings/invoices/:id
 * Get a single invoice by ID — verifies caller owns the invoice
 */
export const getInvoice = async (req: Request, res: Response) => {
    const ctx = getUserContextFromRequest(req);
    if (!ctx) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } });
    }
    const { userId, orgId } = ctx;

    const id = String(req.params.id);

    try {
        const invoice = await prisma.invoice.findUnique({ where: { id } });
        if (!invoice) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Invoice not found' } });
        }

        // Ownership check: invoice must belong to the caller's org or user
        const ownedByOrg = orgId && invoice.org_id === orgId;
        const ownedByUser = invoice.user_id === userId;
        if (!ownedByOrg && !ownedByUser) {
            log.warn({ userId, orgId, invoice_id: id }, 'Forbidden access to invoice');
            return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } });
        }

        res.json(invoice);
    } catch (error) {
        log.error({ err: error, id }, 'Failed to get invoice');
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to get invoice' } });
    }
};
