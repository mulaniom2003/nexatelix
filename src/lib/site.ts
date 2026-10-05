/**
 * Central brand + business configuration.
 * Replace the placeholder contact details with your real ones.
 */
export const site = {
  name: "NexaTelix",
  legalName: "NexaTelix Communications",
  tagline: "Every message, delivered.",
  description:
    "Send verified RCS, SMS, WhatsApp and Telegram messages from one panel and one API, with live delivery receipts.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://nexatelix.com",
  contact: {
    telegramChannel: "NexaTelix", // t.me/<handle> (public channel)
    telegramSupport: "MulaniOm", // direct chat
    salesEmail: "sales@nexatelix.com", // forwarded by Porkbun
    supportEmail: "support@nexatelix.com", // forwarded by Porkbun
    whatsapp: "919879993043", // digits only, with country code
    whatsappDisplay: "+91 98799 93043",
    linkedin: "https://www.linkedin.com/company/nexatelix/",
  },
  // Facts about the product (not traffic claims), shown under the homepage hero.
  stats: [
    { value: 4, suffix: "", label: "Channels, one panel" },
    { value: 4, suffix: "", label: "Buttons per RCS card" },
    { value: 0, prefix: "$", suffix: "", label: "Setup fee" },
    { value: 0, prefix: "$", suffix: "", label: "Monthly fee" },
  ],
} as const;

export const links = {
  telegram: `https://t.me/${site.contact.telegramChannel}`,
  telegramSupport: `https://t.me/${site.contact.telegramSupport}`,
  sales: `mailto:${site.contact.salesEmail}`,
  support: `mailto:${site.contact.supportEmail}`,
  whatsapp: `https://wa.me/${site.contact.whatsapp}`,
  linkedin: site.contact.linkedin,
};

export const nav = [
  { href: "/sms", label: "SMS" },
  { href: "/rcs", label: "RCS" },
  { href: "/whatsapp", label: "WhatsApp" },
  { href: "/telegram", label: "Telegram" },
  { href: "/gaming", label: "iGaming" },
  { href: "/pricing", label: "Pricing" },
  { href: "/developers", label: "Developers" },
  { href: "/contact", label: "Contact" },
];

export type ChannelKey = "sms" | "rcs" | "whatsapp" | "telegram";

export const channels: Record<
  ChannelKey,
  { name: string; short: string; from: number; unit: string; blurb: string; href: string; index: string }
> = {
  rcs: {
    name: "RCS Business",
    short: "RCS",
    from: 0.0025,
    unit: "message",
    blurb: "Verified sender, rich cards, carousels and action buttons — inside the native messages app.",
    href: "/rcs",
    index: "01",
  },
  sms: {
    name: "SMS",
    short: "SMS",
    from: 0.0015,
    unit: "segment",
    blurb: "OTP, transactional and promotional traffic over SIM, HQ and direct operator routes.",
    href: "/sms",
    index: "02",
  },
  whatsapp: {
    name: "WhatsApp",
    short: "WA",
    from: 0.006,
    unit: "message",
    blurb: "Official Business API with templates and two-way chat, plus high-volume broadcast tiers.",
    href: "/whatsapp",
    index: "03",
  },
  telegram: {
    name: "Telegram",
    short: "TG",
    from: 0.02,
    unit: "message",
    blurb: "Username-based delivery to 900M+ users. Up to 200,000 messages a day.",
    href: "/telegram",
    index: "04",
  },
};

/** Fallback prices used when the database is not configured (mirrors the seed). */
export type PriceRow = {
  id?: number;
  channel: ChannelKey;
  tier: string;
  label: string;
  description: string | null;
  unit_price: number;
  min_volume: number;
  active?: boolean;
  sort?: number;
};

export const fallbackPrices: PriceRow[] = [
  { channel: "sms", tier: "sim", label: "SIM Route", description: "Highest volume, lowest cost. Promotional blasts.", unit_price: 0.0015, min_volume: 0 },
  { channel: "sms", tier: "hq", label: "HQ Route", description: "Balanced quality and deliverability.", unit_price: 0.0025, min_volume: 0 },
  { channel: "sms", tier: "direct", label: "Direct Route", description: "Direct operator connections. Best for OTP.", unit_price: 0.0045, min_volume: 0 },
  { channel: "rcs", tier: "standard", label: "RCS Starter", description: "Up to 100K messages.", unit_price: 0.0035, min_volume: 0 },
  { channel: "rcs", tier: "standard", label: "RCS Growth", description: "100K – 500K messages.", unit_price: 0.003, min_volume: 100000 },
  { channel: "rcs", tier: "standard", label: "RCS Enterprise", description: "500K+ messages.", unit_price: 0.0025, min_volume: 500000 },
  { channel: "whatsapp", tier: "official", label: "Business API", description: "Official Meta channel, template messages.", unit_price: 0.012, min_volume: 0 },
  { channel: "whatsapp", tier: "standard", label: "Broadcast Text", description: "Text and media broadcast.", unit_price: 0.006, min_volume: 0 },
  { channel: "whatsapp", tier: "buttons", label: "Interactive Buttons", description: "CTA and quick-reply buttons.", unit_price: 0.038, min_volume: 0 },
  { channel: "telegram", tier: "standard", label: "Telegram Bulk", description: "Username-based delivery, 200K/day.", unit_price: 0.02, min_volume: 0 },
];
