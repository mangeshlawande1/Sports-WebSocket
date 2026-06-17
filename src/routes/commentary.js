// src/routes/commentary.js

import { Router } from "express";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";

import { db } from "../db/db.js";
import { commentary } from "../db/schema.js";

import { listCommentaryQuerySchema, matchIdParamSchema } from "../validation/matches.js";
import { createCommentarySchema } from "../validation/commentary.js";

export const commentaryRouter = Router();



/**
 * GET /matches/:matchId/commentary
 *
 * Returns latest commentary events first.
 */
commentaryRouter.get(
    "/:matchId/commentary",
    async (req, res) => {
        try {

            /**
             * Validate route params
             */
            const paramsResult =
                matchIdParamSchema.safeParse(req.params);

            if (!paramsResult.success) {
                return res.status(400).json({
                    error: "Invalid match ID",
                    details: paramsResult.error.issues,
                });
            }

            /**
             * Validate query params
             */
            const queryResult =
                listCommentaryQuerySchema.safeParse(req.query);

            if (!queryResult.success) {
                return res.status(400).json({
                    error: "Invalid query parameters",
                    details: queryResult.error.issues,
                });
            }

            const { matchId } = paramsResult.data;

            /**
             * Default limit = 100
             * Schema already enforces max(100)
             */
            const limit =
                queryResult.data.limit ?? 100;

            const events = await db
                .select()
                .from(commentary)
                .where(
                    eq(commentary.matchId, matchId)
                )
                .orderBy(
                    desc(commentary.createdAt)
                )
                .limit(limit);
            if(!events.length){
                return res.status(400).json({
                    error: "unable to fetch Commentary",
                });
            }
            return res.status(200).json({
                data: events,
                count: events.length,
            });

        } catch (error) {

            console.error(
                "List commentary error:",
                error
            );

            return res.status(500).json({
                error: "Internal Server Error",
            });
        }
    }
);


/**
 * POST /matches/:matchId/commentary
 */
commentaryRouter.post(
    "/:matchId/commentary",
    async (req, res) => {

        const parsedParams =
            matchIdParamSchema.safeParse(req.params);

        if (!parsedParams.success) {
            return res.status(400).json({
                error: "Invalid match ID",
                details: parsedParams.error.issues
            });
        }

        

        const parsedBody =
            createCommentarySchema.safeParse(req.body);

        if (!parsedBody.success) {
            return res.status(400).json({
                error: "Invalid payload",
                details: parsedBody.error.issues
            });
        }

        try {

            const matchId =
                parsedParams.data.matchId;
            const [createdCommentary] = await db
                .insert(commentary)
                .values({
                    matchId,
                    ...parsedBody.data,
                })
                .returning();

            if(res.app.locals.broadcastCommentary){
                console.log(
                    "Broadcasting commentary:",
                    createdCommentary.id
                );
                
                res.app.locals.broadcastCommentary(Number(createdCommentary.matchId), createdCommentary)
            }

            return res.status(201).json({
                data: createdCommentary,
            });

        } catch (error) {

            console.error("Create commentary error:", error);

            if (error.cause?.code === "23505") {
                return res.status(409).json({
                    error: "Commentary sequence already exists for this match"
                });
            }

            return res.status(500).json({
                error: "Internal Server Error"
            });
        }
    }
);

