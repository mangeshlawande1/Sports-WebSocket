import {
    pgTable, pgEnum, serial, varchar, integer, timestamp, jsonb, text,
    index, unique,
} from "drizzle-orm/pg-core";


/**
 * Match Status Enum
 */

export const matchStatusEnum = pgEnum("match_status", [
    "scheduled",
    "live",
    "finished",
]);

/**
 * Matches Table
 */
export const matches = pgTable("matches", {
    id: serial("id").primaryKey(),
    sport: varchar("sport", { length: 50 }).notNull(),
    homeTeam: varchar("home_team", { length: 150 }).notNull(),
    awayTeam: varchar("away_team", { length: 150 }).notNull(),
    status: matchStatusEnum("status")
        .default("scheduled")
        .notNull(),
    startTime: timestamp("start_time", {
        withTimezone: true,
    }),
    endTime: timestamp("end_time", {
        withTimezone: true,
    }),
    homeScore: integer("home_score")
        .default(0)
        .notNull(),
    awayScore: integer("away_score")
        .default(0)
        .notNull(),
    createdAt: timestamp("created_at", {
        withTimezone: true,
    })
        .defaultNow()
        .notNull(),
}, (table) => ({
    statusIdx: index("matches_status_idx").on(table.status),
}));
/**
 * Commentary Table
 */
export const commentary = pgTable("commentary", {
    id: serial("id").primaryKey(),
    matchId: integer("match_id")
        .references(() => matches.id, {
            onDelete: "cascade",
        })
        .notNull(),
    minute: integer("minute"),
    sequence: integer("sequence").notNull(),
    period: varchar("period", {
        length: 50,
    }),
    eventType: varchar("event_type", {
        length: 100,
    }).notNull(),
    actor: varchar("actor", {
        length: 150,
    }),
    team: varchar("team", {
        length: 150,
    }),
    message: text("message").notNull(),
    metadata: jsonb("metadata"),
    tags: text("tags").array(),
    createdAt: timestamp("created_at", {
        withTimezone: true,
    })
        .defaultNow()
        .notNull(),
},  (table) => ({
    matchIdIdx: index("commentary_match_id_idx").on(table.matchId),
    matchIdSequenceUnique: unique("commentary_match_id_sequence_unique").on(table.matchId, table.sequence),
}));
