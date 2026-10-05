import { Nav } from "@/components/site/Nav";
import { Experience } from "@/components/site/Experience";
import { Footer } from "@/components/site/Blocks";
import { getSession } from "@/lib/auth";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getSession();
  return (
    <>
      <Experience />
      <Nav signedIn={Boolean(user)} />
      <main>{children}</main>
      <Footer />
    </>
  );
}
