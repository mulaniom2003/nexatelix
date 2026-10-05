/** Shared by the browser and the server. */

/** Digits only, no leading 00 or +. */
export function cleanNumber(raw: string) {
  return raw.replace(/[^\d]/g, "").replace(/^00/, "");
}

export function parseNumbers(raw: string) {
  const parts = raw.split(/[\r\n,;\t ]+/).map((s) => s.trim()).filter(Boolean);
  const clean = parts.map(cleanNumber).filter((n) => /^\d{7,15}$/.test(n));
  const unique = [...new Set(clean)];
  return { total: parts.length, list: unique, invalid: parts.length - clean.length, duplicates: clean.length - unique.length };
}

export type LiteRoute = { dial_code: string; price: number; country: string; iso: string; assigned?: boolean };

/** Longest dial-code match (same rule as the server). */
export function matchRoute<T extends LiteRoute>(msisdn: string, routes: T[]): T | null {
  let best: T | null = null;
  for (const r of routes) {
    if (!r.dial_code || !msisdn.startsWith(r.dial_code)) continue;
    if (!best || r.dial_code.length > best.dial_code.length || (r.dial_code.length === best.dial_code.length && r.assigned && !best.assigned)) best = r;
  }
  return best;
}

export function estimate(numbers: string[], routes: LiteRoute[], parts: number) {
  let cost = 0;
  let covered = 0;
  const countries = new Map<string, number>();
  for (const n of numbers) {
    const r = matchRoute(n, routes);
    if (!r) continue;
    covered++;
    cost += r.price * parts;
    countries.set(r.country, (countries.get(r.country) ?? 0) + 1);
  }
  return { cost, covered, uncovered: numbers.length - covered, countries: [...countries.entries()].sort((a, b) => b[1] - a[1]) };
}
