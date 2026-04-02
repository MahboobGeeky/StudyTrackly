import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().optional().default(4000),
  MONGO_URI: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().optional().default("7d"),
  CORS_ORIGIN: z.string().optional(),
});

export const env = schema.parse(process.env);

