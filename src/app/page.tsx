import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Shield,
  Users,
  Lightbulb,
  Clock,
  Hexagon
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hexagon className="h-8 w-8 text-amber-500" />
            <span className="text-xl font-bold text-white">Hive Mind</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost" className="text-slate-300 hover:text-white">
                Sign In
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-amber-500 hover:bg-amber-600 text-slate-900">
                Join the Hive
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Expert Consulting,{" "}
            <span className="text-amber-500">Without the Toll Bridge</span>
          </h1>
          <p className="text-xl text-slate-400 mb-8">
            A members-only platform connecting clients with independent experts
            for paid, time-boxed consults. We&apos;re scaffolding, not gatekeepers
            &mdash; our goal is to make you autonomous.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-8">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#manifesto">
              <Button size="lg" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                Read Our Manifesto
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <Users className="h-12 w-12 text-amber-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Curated Experts
              </h3>
              <p className="text-slate-400">
                Connect with independent consultants who have real expertise &mdash;
                not junior consultants hiding behind a brand.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <Clock className="h-12 w-12 text-amber-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Time-Boxed Consults
              </h3>
              <p className="text-slate-400">
                30, 60, or 90-minute sessions. Pay for what you need,
                get actionable insights, move forward.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-6">
              <Lightbulb className="h-12 w-12 text-amber-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Knowledge Transfer
              </h3>
              <p className="text-slate-400">
                Every engagement ends with a Transfer Pack.
                We want you to learn, not depend.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-slate-400 mb-12">
            Pay per consult. No subscriptions, no hidden fees.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6 text-center">
                <p className="text-slate-400 mb-2">30 minutes</p>
                <p className="text-4xl font-bold text-white mb-2">€75</p>
                <p className="text-sm text-slate-500">Quick consultation</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-amber-500/50 ring-2 ring-amber-500/20">
              <CardContent className="pt-6 text-center">
                <p className="text-amber-500 mb-2">60 minutes</p>
                <p className="text-4xl font-bold text-white mb-2">€140</p>
                <p className="text-sm text-slate-500">Most popular</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-6 text-center">
                <p className="text-slate-400 mb-2">90 minutes</p>
                <p className="text-4xl font-bold text-white mb-2">€195</p>
                <p className="text-sm text-slate-500">Deep dive</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Manifesto */}
      <section id="manifesto" className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Our Manifesto
          </h2>

          <div className="prose prose-invert prose-slate max-w-none">
            <Card className="bg-slate-800/30 border-slate-700">
              <CardContent className="pt-6 space-y-6 text-slate-300">
                <p>
                  There&apos;s an enormous amount of intelligence, competence, and goodwill
                  currently trapped inside organizational forms optimized to extract money
                  rather than solve problems. Consulting firms are just the most visible
                  symptom, but the deeper issue is that <strong className="text-white">expertise has been enclosed</strong>.
                </p>

                <p>
                  It&apos;s been wrapped in brands, rates, hierarchies, and rituals that make
                  it inaccessible &mdash; especially to small and medium actors who live in
                  the real economy, not in slideware.
                </p>

                <p>
                  On the other side: people who <em>do</em> have that expertise, who are not
                  charlatans, who are not junior, who are not chasing gigs on Fiverr &mdash; but
                  who have fragments of time, attention, and cognitive surplus that are currently
                  wasted or monetized very badly.
                </p>

                <div className="border-l-4 border-amber-500 pl-4 my-6">
                  <p className="text-amber-200">
                    A normal platform wants to become a <strong>toll bridge</strong>: permanent,
                    unavoidable, profitable by standing in the middle. We&apos;re building
                    <strong> temporary scaffolding</strong>. It&apos;s there while the building
                    is under construction; once the structure stands on its own, the scaffolding
                    should come off.
                  </p>
                </div>

                <p>
                  The platform is not there to replace internal competence, but to
                  <strong className="text-white"> accelerate its formation</strong>. Consulting is not
                  the product; <em>learning-by-proximity</em> is. The best possible outcome of
                  an engagement is not &quot;we&apos;ll call you again&quot;, but &quot;we don&apos;t need you
                  anymore, and that&apos;s a success&quot;.
                </p>

                <p>
                  This places us very far from classic consulting logic, where dependency
                  is quietly engineered and then sold as continuity.
                </p>

                <h3 className="text-xl font-semibold text-white mt-8 mb-4">The Hive Mind</h3>

                <p>
                  When we say &quot;hive mind&quot;, we don&apos;t mean centralization. We mean
                  <strong className="text-white"> shared cognitive residue</strong>. Not ownership
                  of people, not even ownership of solutions, but ownership of <em>patterns</em>.
                  The traces that remain after work has been done: architectural decisions,
                  reasoning paths, trade-offs, prompts, stacks, failures that taught something.
                </p>

                <p>
                  Each project leaves behind a ghost. Not the code, not the client&apos;s IP,
                  not the consultant&apos;s time &mdash; but the <em>shape of the problem and how
                  it was thought through</em>. Over time, those ghosts form a shared field of
                  knowledge that future participants can sense, draw from, and contribute to.
                </p>

                <p className="text-amber-200">
                  Nobody owns the hive; nobody <em>is</em> the hive. It exists only as long
                  as people interact with it.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <Shield className="h-16 w-16 text-amber-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Members Only
          </h2>
          <p className="text-slate-400 mb-8">
            The Hive is a gated community. No anonymous browsing.
            All meaningful resources require authentication.
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-8">
              Request Access <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Hexagon className="h-6 w-6 text-amber-500" />
              <span className="text-slate-400">Consulting Hive Mind</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <span>Scaffolding, not a toll bridge.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
