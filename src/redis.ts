import { Redis } from "ioredis";
import invariant from "tiny-invariant";

invariant(
  process.env["REDIS_URL"],
  "You must set the REDIS_URL environment variable"
);

export const redis = new Redis(process.env["REDIS_URL"]);
