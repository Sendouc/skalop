import { createCookieSessionStorage } from "@remix-run/node";
import invariant from "tiny-invariant";

const ONE_YEAR_IN_SECONDS = 31_536_000;
export const SESSION_KEY = "user";
export const IMPERSONATED_SESSION_KEY = "impersonated_user";

if (process.env.NODE_ENV === "production") {
  invariant(process.env["SESSION_SECRET"], "SESSION_SECRET is required");
}
export const authSessionStorage = createCookieSessionStorage({
  cookie: {
    name: "_session",
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secrets: [process.env["SESSION_SECRET"] ?? "secret"],
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR_IN_SECONDS,
  },
});

// TODO: check how this works when deployed
export async function getAuthenticatedUserId(req: Request) {
  const session = await authSessionStorage.getSession(
    req.headers.get("Cookie")
  );

  const userId =
    session.get(IMPERSONATED_SESSION_KEY) ?? session.get(SESSION_KEY);

  return userId as number | undefined;
}
