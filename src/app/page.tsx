import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Sparkles,
  GitPullRequest,
  GitBranch,
  TrendingUp,
  Flame,
  Rocket,
  Zap,
  Shield,
  Smartphone,
  Github,
  ArrowRight,
} from "lucide-react";
import { ScrollToTop } from "@/components/scroll-to-top";

export default async function HomePage() {
  const session = await auth();

  // If user is logged in, redirect to dashboard
  if (session) {
    redirect("/dashboard");
  }

  // Otherwise show landing page
  return (
    <>
      <ScrollToTop />
      <div className="flex min-h-screen flex-col scroll-smooth">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-20 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Sparkles className="h-6 w-6" />
              </div>
              <span className="text-2xl font-bold tracking-tight">
                DevFocus
              </span>
            </div>
            <nav className="flex items-center gap-8">
              <Link
                href="#features"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Features
              </Link>
              <Link
                href="#about"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                About
              </Link>
              <Link href="/auth/signin">
                <Button size="lg" className="rounded-full px-8">
                  Get Started
                </Button>
              </Link>
            </nav>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container flex flex-col items-center gap-10 py-32 text-center">
          <Badge variant="secondary" className="rounded-full px-5 py-2 text-sm">
            <Sparkles className="mr-2 h-4 w-4" />
            AI-Powered Productivity
          </Badge>
          <h1 className="max-w-5xl text-6xl font-bold tracking-tight sm:text-7xl lg:text-8xl">
            Focus on what matters.
            <br />
            <span className="text-primary">Build better software.</span>
          </h1>
          <p className="max-w-3xl text-xl leading-relaxed text-muted-foreground sm:text-2xl">
            The ultimate productivity dashboard for developers. Manage tasks,
            track time, and get AI-powered insights to boost your productivity.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            <Link href="/auth/signin">
              <Button
                size="lg"
                className="h-14 gap-2 rounded-full px-10 text-lg"
              >
                Start Free Trial
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="h-14 gap-2 rounded-full px-10 text-lg"
              asChild
            >
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-5 w-5" />
                View on GitHub
              </a>
            </Button>
          </div>
          <div className="mt-16 flex flex-wrap items-center justify-center gap-x-20 gap-y-8 text-xl">
            <div className="flex items-center gap-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <span className="font-semibold text-muted-foreground">
                Free forever
              </span>
            </div>
            <div className="flex items-center gap-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <span className="font-semibold text-muted-foreground">
                No credit card required
              </span>
            </div>
            <div className="flex items-center gap-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <span className="font-semibold text-muted-foreground">
                Open source
              </span>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="border-t bg-muted/50 py-32">
          <div className="container">
            <div className="mb-20 text-center">
              <h2 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl">
                Everything you need to stay productive
              </h2>
              <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
                Powerful features designed specifically for developers
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-2">
                <CardHeader className="space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <CheckCircle2 className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Task Management</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Organize your work with a powerful Kanban board. Drag, drop,
                    and prioritize tasks effortlessly.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2">
                <CardHeader className="space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <GitPullRequest className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-xl">PR Reviews</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    See pending review requests, open PRs, CI/CD status, and
                    conflict warnings across all your repos.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2">
                <CardHeader className="space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <Flame className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Commit Streaks</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Build coding habits with daily commit streaks, contribution
                    graphs, and achievement badges.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2">
                <CardHeader className="space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <Rocket className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Deployments</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Deploy from GitHub/GitLab, manage env vars, view build logs,
                    and rollback in one click.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2">
                <CardHeader className="space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <Sparkles className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-xl">AI Insights</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Get personalized recommendations and insights powered by
                    advanced AI to optimize your workflow.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2">
                <CardHeader className="space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <GitBranch className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Git Integration</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Connect GitHub and GitLab to track commits, PRs, and
                    repository activity in one place.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2">
                <CardHeader className="space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <TrendingUp className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Analytics</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Visualize your productivity with detailed charts and
                    statistics. Track progress over time.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2">
                <CardHeader className="space-y-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <Zap className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Offline Mode</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Work without interruption. All your data syncs automatically
                    when you're back online.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-t py-32">
          <div className="container">
            <div className="grid gap-16 md:grid-cols-3">
              <div className="space-y-3 text-center">
                <div className="text-5xl font-bold tracking-tight">10,000+</div>
                <div className="text-lg text-muted-foreground">
                  Active Developers
                </div>
              </div>
              <div className="space-y-3 text-center">
                <div className="text-5xl font-bold tracking-tight">1M+</div>
                <div className="text-lg text-muted-foreground">
                  Tasks Completed
                </div>
              </div>
              <div className="space-y-3 text-center">
                <div className="text-5xl font-bold tracking-tight">50K+</div>
                <div className="text-lg text-muted-foreground">Focus Hours</div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="about" className="border-t bg-muted/50 py-32">
          <div className="container">
            <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
              <div className="flex flex-col justify-center space-y-8">
                <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
                  Built for developers, by developers
                </h2>
                <p className="text-xl leading-relaxed text-muted-foreground">
                  We understand the challenges of staying focused in a world
                  full of distractions. DevFocus helps you take control of your
                  time and build better software.
                </p>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold">Privacy First</h3>
                      <p className="text-base leading-relaxed text-muted-foreground">
                        Your data is encrypted and never shared with third
                        parties.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Smartphone className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold">
                        Works Everywhere
                      </h3>
                      <p className="text-base leading-relaxed text-muted-foreground">
                        Access your dashboard from any device, anywhere.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold">Lightning Fast</h3>
                      <p className="text-base leading-relaxed text-muted-foreground">
                        Built with modern tech for blazing fast performance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative h-[500px] w-full rounded-2xl border-2 bg-gradient-to-br from-primary/10 to-primary/5 p-12">
                  <div className="flex h-full flex-col justify-center gap-6">
                    <div className="h-16 w-3/4 rounded-xl bg-primary/20" />
                    <div className="h-10 w-1/2 rounded-xl bg-primary/15" />
                    <div className="mt-6 h-40 w-full rounded-xl bg-primary/10" />
                    <div className="flex gap-3">
                      <div className="h-10 w-24 rounded-xl bg-primary/20" />
                      <div className="h-10 w-24 rounded-xl bg-primary/20" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t py-32">
          <div className="container space-y-8 text-center">
            <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Ready to boost your productivity?
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
              Join thousands of developers who are already using DevFocus
            </p>
            <Link href="/auth/signin">
              <Button
                size="lg"
                className="mt-4 h-14 gap-2 rounded-full px-10 text-lg"
              >
                Get Started for Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t py-12">
          <div className="container">
            <div className="grid gap-8 md:grid-cols-4">
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <span className="text-lg font-bold">DevFocus</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  The ultimate productivity dashboard for developers.
                </p>
              </div>
              <div>
                <h3 className="mb-4 font-semibold">Product</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link href="#features" className="hover:underline">
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link href="/docs" className="hover:underline">
                      Documentation
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-4 font-semibold">Company</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link href="#about" className="hover:underline">
                      About
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="mb-4 font-semibold">Legal</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <Link href="/privacy" className="hover:underline">
                      Privacy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="hover:underline">
                      Terms
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
              © 2026 DevFocus. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
