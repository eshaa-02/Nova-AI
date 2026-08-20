import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { WorkspacePreview } from "@/components/marketing/WorkspacePreview";
import { FeaturesGrid } from "@/components/marketing/FeaturesGrid";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <main>
        {/* ---------- Hero ---------- */}
        <section className="mx-auto max-w-8xl px-5 pb-20 pt-20 sm:px-8 sm:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs text-text-secondary">
              <Sparkles size={12} className="text-accent" />
              Intelligence, beautifully unified.
            </span>

            <h1 className="mt-7 font-display text-5xl leading-[1.08] text-text sm:text-6xl lg:text-7xl">
              Your thinking,
              <br />
              refined.
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-text-secondary sm:text-lg">
              Nova AI brings conversation, creation, analysis, and intelligent tools into one
              beautifully designed workspace.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/register">
                <Button size="lg" className="gap-2">
                  Start for free <ArrowRight size={16} />
                </Button>
              </Link>
              <Link href="/chat">
                <Button size="lg" variant="secondary">
                  Explore Nova AI
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-16 sm:mt-20">
            <WorkspacePreview />
          </div>
        </section>

        <FeaturesGrid />

        {/* ---------- Why Nova AI / security ---------- */}
        <section className="border-y border-border/60 bg-surface/40">
          <div className="mx-auto grid max-w-8xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:gap-20">
            <div>
              <h2 className="font-display text-3xl text-text sm:text-4xl">Built to be trusted</h2>
              <p className="mt-4 text-text-secondary leading-relaxed">
                Your conversations, files, and creations are private by default. Nova AI never
                fabricates a result — if a capability isn&apos;t configured, we tell you plainly
                instead of pretending it worked.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                { title: "Private by design", body: "Every conversation, file, and generation is scoped to your account." },
                { title: "No fake answers", body: "Responses come from a real, configured AI provider — never canned or invented." },
                { title: "Secure sessions", body: "HTTP-only cookies, rotated refresh tokens, and rate-limited endpoints." },
                { title: "Transparent capability", body: "Features without a configured provider say so instead of faking success." },
              ].map((item) => (
                <div key={item.title} className="rounded-lg border border-border bg-background p-5">
                  <h3 className="text-sm font-medium text-text">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Final CTA ---------- */}
        <section className="mx-auto max-w-8xl px-5 py-24 text-center sm:px-8">
          <h2 className="font-display text-3xl text-text sm:text-4xl">
            Start thinking with Nova AI today
          </h2>
          <p className="mx-auto mt-4 max-w-md text-text-secondary">
            Free to get started. No credit card required.
          </p>
          <div className="mt-8">
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Start for free <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
