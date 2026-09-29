import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export { pool };

export async function query(
  text: string,
  params?: unknown[]
) {
  return pool.query(text, params);
}