import { z } from 'zod';

/**
 * Request body schemas for portal-api-server mutating routes.
 * Objects use .passthrough() so unknown keys are preserved while known fields
 * are type-checked. Apply with the validate() middleware.
 */

const priority = z.union([z.number(), z.string()]).optional();

export const upsertPaymentMethodSchema = z
  .object({
    brand: z.string().min(1, 'brand is required'),
    last4: z.string().min(1, 'last4 is required'),
    expiry: z.string().min(1, 'expiry is required'),
  })
  .passthrough();

export const updateSubscriptionSchema = z
  .object({
    plan: z.string().optional(),
    price: z.union([z.number(), z.string()]).optional(),
    cancel: z.boolean().optional(),
  })
  .passthrough();

export const createInstructionSchema = z
  .object({
    title: z.string().min(1, 'title is required'),
    content: z.string().min(1, 'content is required'),
    priority,
    is_active: z.boolean().optional(),
  })
  .passthrough();

export const updateInstructionSchema = z
  .object({
    title: z.string().optional(),
    content: z.string().optional(),
    priority,
    is_active: z.boolean().optional(),
  })
  .passthrough();
