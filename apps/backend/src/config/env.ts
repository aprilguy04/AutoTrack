import { config } from "dotenv";
import { z } from "zod";
import { resolve } from "path";

// Загружаем .env файл из корня backend
config({ path: resolve(process.cwd(), ".env") });

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().positive().default(3001),
  CORS_ORIGIN: z.string().default("*"),
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  // Auth
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
});

export type Env = z.infer<typeof schema>;

export const env: Env = schema.parse(process.env);


