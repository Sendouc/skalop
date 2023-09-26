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
    name: "__session",
    sameSite: "lax",
    path: "/",
    httpOnly: true,
    secrets: [process.env["SESSION_SECRET"] ?? "secret"],
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR_IN_SECONDS,
  },
});

export async function getAuthenticatedUserId(rawSessionValue: string) {
  const session = await authSessionStorage.getSession(
    `__session=${rawSessionValue}`
  );

  const userId =
    session.get(IMPERSONATED_SESSION_KEY) ?? session.get(SESSION_KEY);

  return userId as number | undefined;
}

// https://www.30secondsofcode.org/js/s/parse-cookie/
const parseCookie = (str: string): Record<string, string> =>
  str
    .split(";")
    .map((v) => v.split("="))
    .reduce((acc, v) => {
      // @ts-expect-error it's all gonna be fine typescript
      acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
      return acc;
    }, {});

export const extractSession = (cookie: string | null) => {
  if (!cookie) return null;

  return parseCookie(cookie)["__session"] ?? null;
};
