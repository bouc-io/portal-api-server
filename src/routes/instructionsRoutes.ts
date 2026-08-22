import { Router } from 'express';
import {
    listInstructions,
    createInstruction,
    updateInstruction,
    deleteInstruction,
    toggleInstruction,
} from '../controllers/instructionsController';
import { requireRoles } from '../lib/auth';
import { ROLES } from '../lib/roles';
import { validate } from '../middleware/validate';
import { createInstructionSchema, updateInstructionSchema } from '../schemas';

const router = Router();

// All platform roles have access to portal instructions (each user manages their own)
router.use(requireRoles(
    ROLES.BOUC_ADMIN, ROLES.BOUC_FINANCE, ROLES.BOUC_OPS, ROLES.BOUC_ENGINEER, ROLES.BOUC_SRE,
    ROLES.BOUC_USER, ROLES.ORG_ADMIN, ROLES.ORG_ADMIN_ENTERPRISE, ROLES.ORG_USER, ROLES.PUBLIC_USER,
));

/**
 * @openapi
 * /v1/portal/instructions:
 *   get:
 *     summary: List the current user's personal instructions
 *     tags: [Instructions]
 *     responses:
 *       '200': { description: Instruction list }
 *       '403': { description: Forbidden }
 *   post:
 *     summary: Create a personal instruction
 *     tags: [Instructions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string }
 *               priority: { type: integer }
 *               is_active: { type: boolean }
 *     responses:
 *       '201': { description: Instruction created }
 *       '400': { description: Validation error }
 */
router.get('/', listInstructions);
router.post('/', validate(createInstructionSchema), createInstruction);

/**
 * @openapi
 * /v1/portal/instructions/{id}:
 *   put:
 *     summary: Update a personal instruction
 *     tags: [Instructions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200': { description: Instruction updated }
 *       '400': { description: Validation error }
 *   delete:
 *     summary: Delete a personal instruction
 *     tags: [Instructions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '204': { description: Instruction deleted }
 */
router.put('/:id', validate(updateInstructionSchema), updateInstruction);
router.delete('/:id', deleteInstruction);

/**
 * @openapi
 * /v1/portal/instructions/{id}/toggle:
 *   patch:
 *     summary: Toggle a personal instruction's active state
 *     tags: [Instructions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200': { description: Instruction toggled }
 */
router.patch('/:id/toggle', toggleInstruction);

export default router;
