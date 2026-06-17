// src/validation/commentary.js

import { z } from "zod";

/**
 * Query params for listing commentary
 * Example:
 * GET /matches/1/commentary?limit=50
 */
export const listCommentaryQuerySchema = z.object({
    limit: z.coerce
        .number()
        .positive()
        .max(100)
        .optional(),
});

/**
 * Create commentary payload
 */
export const createCommentarySchema = z.object({
    minute: z.number()
        .int()
        .nonnegative()
        .optional(),

    sequence: z.number()
        .int()
        .nonnegative(),

    period: z.string()
        .max(50)
        .optional(),

    eventType: z.string()
        .max(100),

    actor: z.string()
        .max(150)
        .optional(),

    team: z.string()
        .max(150)
        .optional(),

    message: z.string()
        .min(1, "Message is required"),

    metadata: z.record(z.string(), z.any())
        .optional(),

    tags: z.array(z.string())
        .optional(),
});