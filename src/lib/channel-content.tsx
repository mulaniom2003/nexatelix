import type { ReactNode } from "react";
import type { PhoneItem, PhoneTheme } from "@/components/site/Phone";
import { Icon } from "@/components/icons";
import type { ChannelKey } from "./site";

type Feature = { ico: (p: React.SVGProps<SVGSVGElement>) => ReactNode; t: string; d: string };

export type ChannelContent = {
  slug: string;
  index: string;
  eyebrow: string;
  metaTitle: string;
  metaDescription: string;
  title: ReactNode;
  lead: string;
  meta: { b: string; label: string }[];
  phone: { theme: PhoneTheme; name: string; sub: string; initials: string; verified?: boolean; items: PhoneItem[]; input: string };
  features: Feature[];
  spotlight: { idx: string; title: ReactNode; lead: string; ticks: string[] };
  compare?: { head: [string, string]; rows: [string, string, string][] };
  priceChannels: ChannelKey[];
  faq: [string, string][];
};

export const channelContent: Record<"rcs" | "sms" | "whatsapp" | "telegram" | "gaming", ChannelContent> = {
  rcs: {
    slug: "rcs",
    index: "01",
    eyebrow: "RCS Business Messaging",
    metaTitle: "RCS Business Messaging",
    metaDescription: "Send verified RCS messages with your logo, rich cards, carousels, buttons and read receipts, with automatic SMS fallback.",
    title: <>Texts with your <em>logo</em> on them.</>,
    lead: "RCS lands in the phone's own messages app with your brand name, a verified tick, images, buttons and one-tap replies. Phones without RCS get an SMS automatically.",
    meta: [
      { b: "Verified", label: "Brand sender" },
      { b: "4 buttons", label: "Per rich card" },
      { b: "Read", label: "Receipts per user" },
    ],
    phone: {
      theme: "rcs",
      name: "Urban Thread",
      sub: "Verified business",
      initials: "UT",
      verified: true,
      input: "RCS message",
      items: [
        { kind: "in", text: "Hi Om, the jacket you saved is back in stock." },
        { kind: "rich", art: "dusk", caption: "Back in stock", title: "Wool overshirt · Charcoal", text: "₹3,499 · Sizes S to XL. Free returns for 30 days.", buttons: ["Buy now", "See sizes"] },
        { kind: "chips", items: ["Reserve for 24h", "Not interested"] },
        { kind: "out", text: "Reserve for 24h", time: "Read" },
        { kind: "in", text: "Done. It's held for you until 9:41 PM tomorrow." },
      ],
    },
    features: [
      { ico: Icon.shield, t: "Verified sender", d: "Your name, logo, banner and colour at the top of every chat, with the verified tick." },
      { ico: Icon.image, t: "Rich cards & carousels", d: "Image or video with a title, description and up to four action buttons. Swipe through up to ten cards." },
      { ico: Icon.cursor, t: "Suggested replies", d: "Chips under the message let people reply in one tap, so conversations don't stall." },
      { ico: Icon.eye, t: "Read receipts", d: "Know who received, read and tapped each message, not just that it was sent." },
      { ico: Icon.repeat, t: "SMS fallback", d: "Handsets without RCS receive a plain SMS version automatically, billed at SMS rates." },
      { ico: Icon.chart, t: "Campaign reports", d: "Delivery, read and click rates per campaign, with a CSV of every recipient's status." },
    ],
    spotlight: {
      idx: "02 — Compared",
      title: <>What SMS <em>can't</em> do.</>,
      lead: "Same handset, same messages app. RCS just carries far more than 160 characters of plain text.",
      ticks: ["Works on Android Messages and iPhone iOS 18+", "No app for your customer to install", "Opt-out handled by the carrier", "Brand approval usually takes a few days"],
    },
    compare: {
      head: ["SMS", "RCS"],
      rows: [
        ["Sender", "Short code or sender ID", "Brand name, logo, verified tick"],
        ["Content", "160 characters of text", "Images, video, cards, carousels"],
        ["Actions", "A pasted link", "Buttons and suggested replies"],
        ["Tracking", "Delivered (sometimes)", "Delivered, read and clicked"],
        ["Fallback", "—", "Automatic SMS"],
      ],
    },
    priceChannels: ["rcs"],
    faq: [
      ["Which phones receive RCS?", "Android phones using Google Messages, and iPhones on iOS 18 or later where the carrier supports RCS. Everyone else gets the SMS fallback."],
      ["How long does brand verification take?", "Usually a few working days. We submit your brand name, logo and use case to the carriers and keep you updated in the panel."],
      ["Am I charged for the fallback?", "Yes, a fallback message is billed at the SMS rate for that country, and only when the fallback is actually sent."],
    ],
  },

  sms: {
    slug: "sms",
    index: "02",
    eyebrow: "Bulk & transactional SMS",
    metaTitle: "Bulk SMS & OTP",
    metaDescription: "OTP, transactional and promotional SMS over SIM, HQ and direct operator routes.",
    title: <>The channel <em>every</em> phone has.</>,
    lead: "OTP codes, order alerts and promotions over three route tiers. Choose cost or speed per campaign, and get a delivery receipt for each number.",
    meta: [
      { b: "3 routes", label: "SIM · HQ · Direct" },
      { b: "2.8s", label: "Median OTP" },
      { b: "Unicode", label: "Hindi, Gujarati & more" },
    ],
    phone: {
      theme: "sms",
      name: "VK-NEXATX",
      sub: "Text message",
      initials: "NX",
      input: "Text message",
      items: [
        { kind: "in", text: "482913 is your login code for Paywise. It expires in 5 minutes. Do not share it.", time: "9:41" },
        { kind: "in", text: "Rs 2,450 debited from A/c XX4410 on 03-Oct at Amazon. Not you? Call 1800-000-0000.", time: "9:44" },
        { kind: "in", text: "Your order #A1029 has shipped and will arrive Monday. Track: nxtx.in/t/A1029", time: "10:02" },
      ],
    },
    features: [
      { ico: Icon.bolt, t: "Direct operator routes", d: "Lowest latency for OTP and banking alerts, with priority queues on direct connections." },
      { ico: Icon.route, t: "Three route tiers", d: "SIM for volume, HQ for balance, Direct for critical traffic. Switch per campaign." },
      { ico: Icon.globe, t: "Domestic & international", d: "One account and one price list for Indian and international numbers." },
      { ico: Icon.tag, t: "Sender IDs & DLT", d: "Register sender IDs and DLT templates for India, handled from the panel." },
      { ico: Icon.clock, t: "Scheduling", d: "Send now or schedule by date and time, with per-country quiet hours." },
      { ico: Icon.download, t: "Delivery reports", d: "Per-number DLR status, downloadable as CSV once a campaign completes." },
    ],
    spotlight: {
      idx: "02 — Routes",
      title: <>Pick the <em>route</em>, not the provider.</>,
      lead: "Every campaign chooses a route tier. You'll see the per-segment price before you send.",
      ticks: ["SIM route: cheapest, best for promotions", "HQ route: balanced deliverability for alerts", "Direct route: operator connections for OTP", "Segment counter for GSM-7 and Unicode messages"],
    },
    priceChannels: ["sms"],
    faq: [
      ["What counts as one SMS?", "One segment: up to 160 GSM characters, or 70 for Unicode (Hindi, Gujarati, emoji). Longer messages are split into 153 or 67-character segments, each billed separately."],
      ["Do I need DLT registration in India?", "Yes, for Indian numbers you need a registered entity, header and template. We guide you through it and attach your IDs to each campaign."],
      ["Which route should I use for OTP?", "Direct. It's the most expensive tier but the fastest and most reliable."],
    ],
  },

  whatsapp: {
    slug: "whatsapp",
    index: "03",
    eyebrow: "WhatsApp messaging",
    metaTitle: "WhatsApp Business messaging",
    metaDescription: "Send WhatsApp template messages, media and interactive buttons through the official Business API or broadcast tiers.",
    title: <>Where your customers <em>already</em> chat.</>,
    lead: "Template messages, images, documents and buttons on the app most of India opens dozens of times a day. Choose the official Business API or a high-volume broadcast tier.",
    meta: [
      { b: "Official", label: "Business API" },
      { b: "Media", label: "Image, video, PDF" },
      { b: "2-way", label: "Replies to your panel" },
    ],
    phone: {
      theme: "wa",
      name: "Shree Travels",
      sub: "Business account",
      initials: "ST",
      verified: true,
      input: "Message",
      items: [
        { kind: "in", text: "Namaste! Your Ahmedabad → Udaipur trip is confirmed for 12 Oct.", time: "9:41" },
        { kind: "rich", art: "lime", caption: "Ticket", title: "Volvo AC Sleeper · Seat L4", text: "Departs 22:30 from Paldi. Boarding opens 22:00.", buttons: ["Download ticket", "Share location"] },
        { kind: "out", text: "Can I change to an upper berth?", time: "9:43" },
        { kind: "in", text: "Yes, U4 is free. Shall we switch it for you?", time: "9:43" },
      ],
    },
    features: [
      { ico: Icon.shield, t: "Official Business API", d: "Approved templates through Meta's channel, with your verified business profile." },
      { ico: Icon.image, t: "Rich media", d: "Send images, video, PDFs and locations alongside your message text." },
      { ico: Icon.cursor, t: "Interactive buttons", d: "Quick-reply and call-to-action buttons that drive replies and clicks." },
      { ico: Icon.inbox, t: "Two-way replies", d: "Customer replies come back into your panel so you can answer within the 24-hour window." },
      { ico: Icon.users, t: "Broadcast tiers", d: "High-volume text and media broadcasts for lists that have opted in." },
      { ico: Icon.chart, t: "Read & reply rates", d: "Sent, delivered, read and replied per campaign." },
    ],
    spotlight: {
      idx: "02 — Tiers",
      title: <>Three ways to <em>send.</em></>,
      lead: "Pick the tier that matches your list and your message.",
      ticks: ["Business API: templates via the official Meta channel", "Broadcast text: plain text and media at volume", "Interactive: messages with reply and CTA buttons", "Every tier requires recipients who opted in"],
    },
    priceChannels: ["whatsapp"],
    faq: [
      ["Do templates need approval?", "On the official Business API, yes. Meta usually reviews a template within minutes to a few hours."],
      ["Can customers reply?", "Yes. Replies arrive in your panel, and you can answer freely for 24 hours after their last message."],
      ["Do I need my own WhatsApp number?", "For the Business API you'll register a number to your business. We help with the setup."],
    ],
  },

  telegram: {
    slug: "telegram",
    index: "04",
    eyebrow: "Telegram delivery",
    metaTitle: "Telegram bulk messaging",
    metaDescription: "Deliver messages to Telegram users by username, up to 200,000 a day, with buttons and media.",
    title: <>Reach users by <em>@username.</em></>,
    lead: "Deliver to Telegram users by username instead of phone number. Up to 200,000 messages a day, with images and inline buttons.",
    meta: [
      { b: "900M+", label: "Telegram users" },
      { b: "200K", label: "Messages / day" },
      { b: "@user", label: "No phone needed" },
    ],
    phone: {
      theme: "tg",
      name: "CryptoDesk",
      sub: "bot",
      initials: "CD",
      input: "Message",
      items: [
        { kind: "in", text: "Weekly market wrap is ready. BTC +4.2%, ETH +6.1% this week.", time: "9:41" },
        { kind: "rich", art: "ocean", caption: "Wrap #42", title: "Top movers this week", text: "Five charts and the three numbers that mattered.", buttons: ["Read the wrap", "Mute weekly updates"] },
        { kind: "out", text: "Read the wrap", time: "9:42" },
      ],
    },
    features: [
      { ico: Icon.telegram, t: "Username delivery", d: "Send to @usernames from your list. No phone numbers required." },
      { ico: Icon.bolt, t: "High daily volume", d: "Up to 200,000 messages per day per account, spread to avoid limits." },
      { ico: Icon.image, t: "Media & buttons", d: "Images, video and inline URL buttons on every message." },
      { ico: Icon.users, t: "List cleaning", d: "Usernames are validated and de-duplicated before you're charged." },
      { ico: Icon.clock, t: "Scheduling", d: "Queue campaigns for a specific date and time." },
      { ico: Icon.chart, t: "Delivery report", d: "Delivered and failed per username, downloadable after each campaign." },
    ],
    spotlight: {
      idx: "02 — How it works",
      title: <>Upload a list. <em>Send.</em></>,
      lead: "Paste or upload usernames, write your message, add a button, and send.",
      ticks: ["Usernames validated (5–32 characters)", "Duplicates removed automatically", "Charged only for valid recipients", "Best for communities that expect your updates"],
    },
    priceChannels: ["telegram"],
    faq: [
      ["What format should usernames be in?", "One per line, with or without the @. We validate and clean the list before the campaign is priced."],
      ["Are failed deliveries charged?", "You're charged for valid usernames in the campaign. Usernames that don't exist are removed before pricing."],
    ],
  },

  gaming: {
    slug: "gaming",
    index: "05",
    eyebrow: "Messaging for iGaming",
    metaTitle: "iGaming messaging",
    metaDescription: "OTP, deposit confirmations and opt-in promotions for gaming operators across SMS, RCS, WhatsApp and Telegram.",
    title: <>Fast codes. <em>Clean</em> promos.</>,
    lead: "Gaming operators need OTPs that arrive in seconds and promotions that reach the right players only. We route each message type over the channel that suits it.",
    meta: [
      { b: "2.8s", label: "Median OTP" },
      { b: "4", label: "Channels" },
      { b: "Opt-in", label: "Promo lists only" },
    ],
    phone: {
      theme: "rcs",
      name: "Royal Arena",
      sub: "Verified business",
      initials: "RA",
      verified: true,
      input: "RCS message",
      items: [
        { kind: "in", text: "Your Royal Arena login code is 771204." },
        { kind: "in", text: "Deposit of ₹2,000 received. Your balance is ₹5,250." },
        { kind: "rich", art: "lime", caption: "Weekend", title: "Free spins on Saturday", text: "For members who opted into offers. Reply STOP to unsubscribe.", buttons: ["View offer"] },
      ],
    },
    features: [
      { ico: Icon.bolt, t: "Priority OTP", d: "Direct routes and an SMS fallback chain keep login codes inside seconds." },
      { ico: Icon.wallet, t: "Transaction alerts", d: "Deposit, withdrawal and bonus confirmations the moment they happen." },
      { ico: Icon.users, t: "Segmented promos", d: "Send offers only to players who opted in, with unsubscribe handled automatically." },
      { ico: Icon.lock, t: "Responsible messaging", d: "Quiet hours, frequency caps and self-exclusion lists respected on every campaign." },
    ],
    spotlight: {
      idx: "02 — Routing",
      title: <>The right channel for <em>each</em> message.</>,
      lead: "OTP and alerts go fast and plain. Promotions go rich, only to players who asked for them.",
      ticks: ["OTP: Direct SMS, then RCS fallback", "Alerts: RCS with SMS fallback", "Promotions: RCS, WhatsApp or Telegram to opt-in lists", "Local regulations checked per country"],
    },
    priceChannels: ["sms", "rcs"],
    faq: [
      ["Which countries do you support for gaming traffic?", "It depends on local regulation. Tell us your markets and we'll confirm which channels and routes are allowed."],
      ["Can I send promotions to all players?", "Only to players who opted in to marketing. Self-excluded players are always skipped."],
    ],
  },
};
