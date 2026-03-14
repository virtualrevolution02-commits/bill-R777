import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Check your .env file.");
}

const dbUrl = process.env.DATABASE_URL;
// Add pooling and performance params if not already present
let connectionString = dbUrl;
if (dbUrl && !dbUrl.includes("pooler")) {
  // Try to append pooling if it looks like a standard neon URL
  connectionString = dbUrl.replace(".aws.neon.tech", "-pooler.ap-southeast-1.aws.neon.tech");
}

export const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000, // Slightly more time for initial 5G handshake
  keepAlive: true,
});

export const db = drizzle(pool, { schema });
