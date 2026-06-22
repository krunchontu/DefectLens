import { execSync } from "child_process";
import path from "path";

export default function globalSetup() {
  const testDbPath = path.resolve(__dirname, "../test.db");
  const schemaPath = path.resolve(__dirname, "../../../prisma/schema.prisma");
  const env = { ...process.env, DATABASE_URL: `file:${testDbPath}` };
  const cwd = path.resolve(__dirname, "..");
  const opts = { cwd, env, stdio: "pipe" as const };

  // Generate Prisma client (only once for the entire test run)
  execSync(`npx prisma generate --schema="${schemaPath}"`, opts);
  // Push schema to the test database
  execSync(`npx prisma db push --schema="${schemaPath}" --skip-generate --accept-data-loss`, opts);
}
