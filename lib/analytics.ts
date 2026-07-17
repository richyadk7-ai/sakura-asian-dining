const PRIVATE_PATHS = ["/admin", "/reservation/confirmation"];

export function sanitizePublicObservation<T extends { url: string }>(event: T): T | null {
  try {
    const url = new URL(event.url, "https://sakura.invalid");
    if (PRIVATE_PATHS.some((path) => url.pathname.startsWith(path) || url.pathname.includes(path))) return null;
    url.search = "";
    url.hash = "";
    const sanitizedUrl = event.url.startsWith("http") ? url.toString() : url.pathname;
    return { ...event, url: sanitizedUrl };
  } catch {
    return null;
  }
}
