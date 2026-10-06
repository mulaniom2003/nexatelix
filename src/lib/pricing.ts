import type { ChannelKey, PriceRow } from "./site";

/** GSM-7 basic charset (+ extension chars count double). */
const GSM =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM_EXT = "^{}\\[~]|€";

export function smsSegments(text: string): { segments: number; encoding: "GSM-7" | "UCS-2"; length: number } {
  let gsm = true;
  let len = 0;
  for (const ch of text) {
    if (GSM.includes(ch)) len += 1;
    else if (GSM_EXT.includes(ch)) len += 2;
    else {
      gsm = false;
      break;
    }
  }
  if (!gsm) {
    const n = [...text].length;
    return { segments: n === 0 ? 1 : n <= 70 ? 1 : Math.ceil(n / 67), encoding: "UCS-2", length: n };
  }
  return { segments: len === 0 ? 1 : len <= 160 ? 1 : Math.ceil(len / 153), encoding: "GSM-7", length: len };
}

/** Pick the best applicable price row for a channel/tier at a given volume. */
export function resolvePrice(prices: PriceRow[], channel: ChannelKey, tier: string, volume: number): PriceRow | undefined {
  return prices
    .filter((p) => p.channel === channel && p.tier === tier && (p.active ?? true) && volume >= p.min_volume)
    .sort((a, b) => b.min_volume - a.min_volume)[0];
}

export function tiersFor(prices: PriceRow[], channel: ChannelKey) {
  const seen = new Map<string, PriceRow>();
  for (const p of prices.filter((p) => p.channel === channel && (p.active ?? true))) {
    const cur = seen.get(p.tier);
    if (!cur || p.min_volume < cur.min_volume) seen.set(p.tier, p);
  }
  return [...seen.values()];
}

export function usd(n: number, digits = 2) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", minimumFractionDigits: digits, maximumFractionDigits: Math.max(digits, 2) }).format(n);
}

export function rate(n: number) {
  return "€" + Number(n).toFixed(4).replace(/0+$/, "").replace(/\.$/, ".00");
}

export function num(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

/** Parse a recipients file: one entry per line / comma. Dedupes. */
export function parseRecipients(raw: string, channel: ChannelKey) {
  const parts = raw
    .split(/[\r\n,;\t]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const clean = parts
    .map((s) => (channel === "telegram" ? s.replace(/^@/, "").toLowerCase() : s.replace(/[^\d+]/g, "")))
    .filter((s) => (channel === "telegram" ? /^[a-z0-9_]{4,32}$/.test(s) : /^\+?\d{7,15}$/.test(s)));
  const unique = [...new Set(clean)];
  return { total: parts.length, valid: unique.length, duplicates: clean.length - unique.length, invalid: parts.length - clean.length, list: unique };
}
