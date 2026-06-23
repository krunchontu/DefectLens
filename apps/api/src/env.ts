import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

// --- DATABASE_URL validation ---
const VALID_PREFIXES = ["file:", "postgresql://", "postgres://"] as const;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error(
    "[DefectLens] Fatal: DATABASE_URL is not set. " +
      "Set it to a SQLite path (file:./dev.db) or a Postgres connection string (postgresql://...)."
  );
  process.exit(1);
}

const hasValidPrefix = VALID_PREFIXES.some((prefix) =>
  databaseUrl.startsWith(prefix)
);

if (!hasValidPrefix) {
  console.error(
    `[DefectLens] Fatal: DATABASE_URL has an invalid format ("${databaseUrl.slice(0, 30)}..."). ` +
      `It must start with one of: ${VALID_PREFIXES.join(", ")}`
  );
  process.exit(1);
}

/** Whether the configured database is Postgres (true) or SQLite (false). */
export const isPostgres = databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://");
