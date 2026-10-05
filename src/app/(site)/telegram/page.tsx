import type { Metadata } from "next";
import { ChannelPage } from "@/components/site/ChannelPage";
import { channelContent } from "@/lib/channel-content";

const c = channelContent.telegram;

export const metadata: Metadata = { title: c.metaTitle, description: c.metaDescription };

export default function Page() {
  return <ChannelPage c={c} />;
}
