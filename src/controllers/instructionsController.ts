import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { getUserContextFromRequest } from '../lib/auth';
import { createComponentLogger } from '../lib/logger';

const log = createComponentLogger('instructions-controller');

/**
 * GET /v1/portal/instructions
 * List all instructions scoped to the caller's org or user, ordered by priority then created_at.
 */
export const listInstructions = async (req: Request, res: Response) => {
    const ctx = getUserContextFromRequest(req);
    if (!ctx) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } });
    }
    const { userId, orgId } = ctx;
    const scopeWhere = orgId ? { org_id: orgId } : { user_id: userId };

    try {
        const instructions = await prisma.llmInstruction.findMany({
            where: scopeWhere,
            orderBy: [{ priority: 'asc' }, { created_at: 'asc' }],
        });
        res.json({ instructions });
    } catch (error) {
        log.error({ err: error }, 'Failed to list instructions');
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to list instructions' } });
    }
};

/**
 * POST /v1/portal/instructions
 * Create a new instruction scoped to the caller's org or user.
 */
export const createInstruction = async (req: Request, res: Response) => {
    const ctx = getUserContextFromRequest(req);
    if (!ctx) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } });
    }
    const { userId, orgId } = ctx;
    const scopeWhere = orgId ? { org_id: orgId } : { user_id: userId };

    const { title, content, priority, is_active } = req.body;
    if (!title || !content) {
        return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'title and content are required' } });
    }

    try {
        const instruction = await prisma.llmInstruction.create({
            data: {
                ...scopeWhere,
                title,
                content,
                priority: typeof priority === 'number' ? priority : 0,
                is_active: typeof is_active === 'boolean' ? is_active : true,
                created_by: userId,
            },
        });
        log.info({ id: instruction.id, userId, orgId }, 'Instruction created');
        res.status(201).json(instruction);
    } catch (error) {
        log.error({ err: error }, 'Failed to create instruction');
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create instruction' } });
    }
};

/**
 * PUT /v1/portal/instructions/:id
 * Update an instruction — verifies caller owns it.
 */
export const updateInstruction = async (req: Request, res: Response) => {
    const ctx = getUserContextFromRequest(req);
    if (!ctx) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } });
    }
    const { userId, orgId } = ctx;

    const id = String(req.params.id);
    const { title, content, priority, is_active } = req.body;

    try {
        const existing = await prisma.llmInstruction.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Instruction not found' } });
        }

        // Ownership check
        const ownedByOrg = orgId && existing.org_id === orgId;
        const ownedByUser = existing.user_id === userId;
        if (!ownedByOrg && !ownedByUser) {
            log.warn({ userId, orgId, instruction_id: id }, 'Forbidden update on instruction');
            return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } });
        }

        const instruction = await prisma.llmInstruction.update({
            where: { id },
            data: {
                ...(title !== undefined && { title }),
                ...(content !== undefined && { content }),
                ...(typeof priority === 'number' && { priority }),
                ...(typeof is_active === 'boolean' && { is_active }),
            },
        });
        log.info({ id, userId, orgId }, 'Instruction updated');
        res.json(instruction);
    } catch (error) {
        log.error({ err: error, id }, 'Failed to update instruction');
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update instruction' } });
    }
};

/**
 * DELETE /v1/portal/instructions/:id
 * Delete an instruction — verifies caller owns it.
 */
export const deleteInstruction = async (req: Request, res: Response) => {
    const ctx = getUserContextFromRequest(req);
    if (!ctx) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } });
    }
    const { userId, orgId } = ctx;

    const id = String(req.params.id);

    try {
        const existing = await prisma.llmInstruction.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Instruction not found' } });
        }

        // Ownership check
        const ownedByOrg = orgId && existing.org_id === orgId;
        const ownedByUser = existing.user_id === userId;
        if (!ownedByOrg && !ownedByUser) {
            log.warn({ userId, orgId, instruction_id: id }, 'Forbidden delete on instruction');
            return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } });
        }

        await prisma.llmInstruction.delete({ where: { id } });
        log.info({ id, userId, orgId }, 'Instruction deleted');
        res.status(204).send();
    } catch (error) {
        log.error({ err: error, id }, 'Failed to delete instruction');
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete instruction' } });
    }
};

/**
 * PATCH /v1/portal/instructions/:id/toggle
 * Toggle is_active — verifies caller owns it.
 */
export const toggleInstruction = async (req: Request, res: Response) => {
    const ctx = getUserContextFromRequest(req);
    if (!ctx) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } });
    }
    const { userId, orgId } = ctx;

    const id = String(req.params.id);

    try {
        const existing = await prisma.llmInstruction.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Instruction not found' } });
        }

        // Ownership check
        const ownedByOrg = orgId && existing.org_id === orgId;
        const ownedByUser = existing.user_id === userId;
        if (!ownedByOrg && !ownedByUser) {
            log.warn({ userId, orgId, instruction_id: id }, 'Forbidden toggle on instruction');
            return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } });
        }

        const instruction = await prisma.llmInstruction.update({
            where: { id },
            data: { is_active: !existing.is_active },
        });
        log.info({ id, userId, orgId, is_active: instruction.is_active }, 'Instruction toggled');
        res.json(instruction);
    } catch (error) {
        log.error({ err: error, id }, 'Failed to toggle instruction');
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to toggle instruction' } });
    }
};

/**
 * GET /v1/portal/config/instructions
 * Internal service endpoint: returns the caller's personal (user_id-scoped) active instructions.
 * Global and org-level instructions are served by admin-api-server /v1/config/instructions.
 */
export const listActiveInstructions = async (req: Request, res: Response) => {
    const ctx = getUserContextFromRequest(req);
    if (!ctx) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } });
    }

    try {
        const instructions = await prisma.llmInstruction.findMany({
            where: {
                is_active: true,
                user_id: ctx.userId,
            },
            orderBy: [{ priority: 'asc' }, { created_at: 'asc' }],
            select: { id: true, title: true, content: true, priority: true },
        });
        res.json({ instructions });
    } catch (error) {
        log.error({ err: error }, 'Failed to fetch active instructions');
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch instructions' } });
    }
};
