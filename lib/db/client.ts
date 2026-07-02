import { Pool, type QueryResultRow } from "pg";

let pool: Pool | undefined;

function isTransientConnectionError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();

  return message.includes("econnreset") || message.includes("connection terminated") || message.includes("timeout");
}

export function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }

  return pool;
}

export async function query<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  try {
    const result = await getPool().query<T>(text, values);
    return result.rows;
  } catch (error) {
    if (!isTransientConnectionError(error)) {
      throw error;
    }

    await pool?.end().catch(() => undefined);
    pool = undefined;
    const result = await getPool().query<T>(text, values);
    return result.rows;
  }
}
