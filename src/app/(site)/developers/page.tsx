import type { Metadata } from "next";
import { PageHero, Cta } from "@/components/site/Blocks";
import { CodeTabs } from "@/components/site/CodeTabs";
import { Btn } from "@/components/Btn";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Developers",
  description: "One REST API for RCS, SMS, WhatsApp and Telegram. Send messages, check balance and receive delivery webhooks.",
};

const BASE = `${site.url}/api/v1`;

const send = [
  {
    label: "cURL",
    code: `curl ${BASE}/messages \\
  -H "Authorization: Bearer $NX_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "channel": "rcs",
    "to": ["919812345678"],
    "card": {
      "title": "Order A1029 has shipped",
      "text": "Arriving Monday between 2 and 4 PM.",
      "media": "https://cdn.example.com/parcel.jpg",
      "buttons": [{ "text": "Track parcel", "url": "https://example.com/t/A1029" }]
    },
    "replies": ["Change address", "Talk to us"]
  }'`,
  },
  {
    label: "Node.js",
    code: `const res = await fetch("${BASE}/messages", {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${process.env.NX_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    channel: "sms",
    route: "direct",
    sender_id: "NEXATX",
    to: ["919812345678"],
    text: "482913 is your login code. It expires in 5 minutes.",
  }),
});

const { campaign_id, cost, status } = await res.json();
// → { campaign_id: "…", status: "pending", recipients: 1, segments: 1, cost: 0.0045 }`,
  },
  {
    label: "Python",
    code: `import os, requests

r = requests.post(
    "${BASE}/messages",
    headers={"Authorization": f"Bearer {os.environ['NX_API_KEY']}"},
    json={
        "channel": "telegram",
        "to": ["@username_one", "@username_two"],
        "text": "Weekly update is live.",
        "buttons": [{"text": "Read it", "url": "https://example.com/w/42"}],
    },
)
print(r.json())  # {"campaign_id": "...", "cost": 0.04, "status": "pending", ...}`,
  },
];

const endpoints = [
  ["POST", "/messages", "Send to one or many recipients on any channel."],
  ["GET", "/campaigns/{id}", "Status, counts and cost for a campaign."],
  ["GET", "/balance", "Current wallet balance in EUR."],
  ["GET", "/prices", "Your rate card, per channel and route."],
  ["GET", "/campaigns/{id}/report", "Redirects to a download link for the delivery report, once ready."],
];

export default function Developers() {
  return (
    <>
      <PageHero
        index="07"
        eyebrow="Developers"
        title={<>One API, <em>four</em> channels.</>}
        lead="Send RCS, SMS, WhatsApp and Telegram through the same JSON endpoint. Change the channel field, keep the rest of your code."
      >
        <div className="hero-cta">
          <Btn href="/signup">Get an API key</Btn>
          <Btn href="#send" variant="ghost" arrow={false}>Read the docs</Btn>
        </div>
      </PageHero>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap docs">
          <nav className="docs-nav" aria-label="API sections">
            <a href="#auth">Authentication</a>
            <a href="#send">Send a message</a>
            <a href="#endpoints">Endpoints</a>
            <a href="#webhooks">Status updates</a>
            <a href="#errors">Errors & limits</a>
          </nav>
          <div className="docs-body">
            <section id="auth">
              <h2 className="h3">Authentication</h2>
              <p className="lead">
                Create a key in your panel under <span className="mono">API keys</span> and send it as a bearer token. Keys are shown once; store them as a secret.
              </p>
              <pre className="code">{`Authorization: Bearer nx_live_••••••••••••••••`}</pre>
            </section>

            <section id="send">
              <h2 className="h3">Send a message</h2>
              <p className="lead">Create a key in your panel first. The cost is debited from your wallet when the campaign is accepted; if your balance is too low, the request fails with 402. Numbers go with country code; Telegram takes @usernames.</p>
              <CodeTabs tabs={send} />
            </section>

            <section id="endpoints">
              <h2 className="h3">Endpoints</h2>
              <div>
                {endpoints.map(([m, p, d]) => (
                  <div className="endpoint" key={p}>
                    <span className="m">{m}</span>
                    <code>{p}</code>
                    <p>{d}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="webhooks">
              <h2 className="h3">Status updates</h2>
              <p className="lead">Poll <span className="mono">GET /campaigns/{"{id}"}</span> to follow a campaign from <span className="mono">pending</span> to <span className="mono">sending</span> to <span className="mono">completed</span>, with delivered and failed counts. Webhooks are coming soon.</p>
            </section>

            <section id="errors">
              <h2 className="h3">Errors & limits</h2>
              <div>
                {[
                  ["400", "Invalid request. The response body names the field."],
                  ["401", "Missing or revoked API key."],
                  ["402", "Wallet balance is too low for this campaign."],
                  ["404", "Campaign not found, or its report isn't ready yet."],
                ].map(([c, d]) => (
                  <div className="endpoint" key={c}>
                    <span className="m">{c}</span>
                    <span>{d}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>

      <Cta />
    </>
  );
}
