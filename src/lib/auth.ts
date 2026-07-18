import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createComponentLogger } from './logger';

const log = createComponentLogger('auth');

export interface UserContext {
    userId: string;
    orgId: string | null;
    roles: string[];
    accessToken: string;
}

export const getUserContextFromRequest = (req: Request): UserContext | null => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;

    const token = authHeader
        .split(',')
        .map((s) => s.trim())
        .find((s) => s.startsWith('Bearer '))
        ?.split(' ')[1];

    if (!token) return null;

    try {
        const decoded = jwt.decode(token);
        const userId = (decoded && (decoded as any).preferred_username) || null;
        if (!userId) return null;

        const orgId: string | null =
            (decoded as any).org_id ||
            (req.headers['x-auth-request-org'] as string) ||
            null;

        const roles: string[] =
            (decoded as any).realm_access?.roles ||
            (req.headers['x-auth-request-roles'] as string || '').split(',').filter(Boolean);

        return { userId, orgId, roles, accessToken: token };
    } catch (error) {
        log.error({ err: error }, 'Failed to decode token');
        return null;
    }
};

export const getUserIdFromRequest = (req: Request): string | null => {
    const context = getUserContextFromRequest(req);
    return context?.userId || null;
};

/**
 * Middleware: require at least one of the specified roles.
 * Pass no roles to require only a valid token (any authenticated user).
 */
export const requireRoles = (...allowed: string[]) =>
    (req: Request, res: Response, next: NextFunction) => {
        const ctx = getUserContextFromRequest(req);
        if (!ctx) {
            return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } });
        }
        if (allowed.length > 0 && !ctx.roles.some((r) => allowed.includes(r))) {
            return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } });
        }
        next();
    };
