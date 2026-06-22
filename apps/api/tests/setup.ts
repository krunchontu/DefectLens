import { execSync } from "child_process";
import path from "path";

// Set the test database URL BEFORE anything else imports Prisma
const testDbPath = path.resolve(__dirname, "../test.db");
process.env.DATABASE_URL = `file:${testDbPath}`;

// Ensure no OpenAI key so tests use the mock analysis path
delete process.env.OPENAI_API_KEY;
