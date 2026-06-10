import { z } from "zod";

/**
 * Match Status Constants
 */
export const MATCH_STATUS = {
    SCHEDULED: "scheduled",
    LIVE: "live",
    FINISHED: "finished",
};

/**
 * Reusable Validators
 */
const positiveInt = z.coerce.number().int().positive();

const nonNegativeInt = z.coerce.number().int().nonnegative();

const isoDateStringSchema = z
    .string()
    .datetime({
        offset: true,
        message:
            "Must be a valid ISO 8601 datetime (e.g. 2026-06-10T18:00:00Z)",
    });

/**
 * Query Validation
 */
export const listMatchesQuerySchema = z.object({
    limit: positiveInt.max(100).optional(),
});

/**
 * Route Params
 */
export const matchIdParamSchema = z.object({
    id: positiveInt,
});

/**
 * Create Match
 */
export const createMatchSchema = z
    .object({
        sport: z
            .string()
            .trim()
            .min(1, "Sport is required")
            .max(50, "Sport cannot exceed 50 characters"),

        homeTeam: z
            .string()
            .trim()
            .min(1, "Home team is required")
            .max(150, "Home team cannot exceed 150 characters"),

        awayTeam: z
            .string()
            .trim()
            .min(1, "Away team is required")
            .max(150, "Away team cannot exceed 150 characters"),

        startTime: isoDateStringSchema,

        endTime: isoDateStringSchema,

        homeScore: nonNegativeInt.optional(),

        awayScore: nonNegativeInt.optional(),
    })
    .superRefine((data, ctx) => {
        const startTime = new Date(data.startTime);
        const endTime = new Date(data.endTime);

        if (endTime <= startTime) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["endTime"],
                message: "endTime must be after startTime",
            });
        }
    });

/**
 * Update Match Score
 */
export const updateScoreSchema = z.object({
    homeScore: nonNegativeInt,
    awayScore: nonNegativeInt,
});

/**
 * Create Commentary
 */
export const createCommentarySchema = z.object({
    matchId: positiveInt,

    minute: nonNegativeInt.optional(),

    sequence: positiveInt,

    period: z.string().trim().max(50).optional(),

    eventType: z
        .string()
        .trim()
        .min(1, "eventType is required")
        .max(100),

    actor: z.string().trim().max(150).optional(),

    team: z.string().trim().max(150).optional(),

    message: z
        .string()
        .trim()
        .min(1, "message is required"),

    metadata: z.record(z.string(), z.any()).optional(),

    tags: z.array(z.string()).optional(),
});

/**
 * Optional Commentary Query Params
 */
export const listCommentaryQuerySchema = z.object({
    limit: positiveInt.max(100).optional(),
});