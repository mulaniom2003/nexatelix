"use server";
import { z } from "zod";
import { Resend } from "resend";
import { site } from "@/lib/site";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name."),
  email: z.email("Please enter a valid email address."),
  company: z.string().trim().max(120).optional(),
  channel: z.enum(["rcs", "sms", "whatsapp", "telegram", "other"]),
  volume: z.string().trim().max(40).optional(),
  message: z.string().trim().min(10, "Tell us a little more (at least 10 characters).").max(4000),
});

export type ContactState = { ok: boolean; message: string } | null;

export async function sendContact(_prev: ContactState, form: FormData): Promise<ContactState> {
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check the form." };

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO;
  if (!key || !to) {
    return { ok: false, message: `Email isn't connected yet. Please message us on Telegram @${site.contact.telegramSupport} instead.` };
  }

  const d = parsed.data;
  try {
    const { error } = await new Resend(key).emails.send({
      from: process.env.CONTACT_FROM ?? `${site.name} <onboarding@resend.dev>`,
      to,
      replyTo: d.email,
      subject: `New enquiry: ${d.channel.toUpperCase()} · ${d.name}`,
      text: [`Name: ${d.name}`, `Email: ${d.email}`, `Company: ${d.company || "—"}`, `Channel: ${d.channel}`, `Monthly volume: ${d.volume || "—"}`, "", d.message].join("\n"),
    });
    if (error) throw new Error(error.message);
    return { ok: true, message: "Thanks. We'll reply within a few hours." };
  } catch {
    return { ok: false, message: `Your message didn't send. Please try again, or reach us on Telegram @${site.contact.telegramSupport}.` };
  }
}
