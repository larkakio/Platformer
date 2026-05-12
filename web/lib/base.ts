export const APP_NAME = "Neon Flux Relay";

/** Base.dev verification (root layout mirrors this in `<meta>`). */
export function getPublicBaseAppId(): string | undefined {
  const v = process.env.NEXT_PUBLIC_BASE_APP_ID?.trim();
  return v ? v : undefined;
}
