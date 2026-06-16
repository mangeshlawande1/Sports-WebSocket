import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing");
}

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,

    ssl: {
        rejectUnauthorized: false,
    }
});

pool.on("error", (err) => {
    console.error("Unexpected pool error:", err);
});

export const db = drizzle(pool);