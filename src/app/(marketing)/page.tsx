import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  Sparkles,
  GitPullRequest,
  GitBranch,
  TrendingUp,
  Zap,
  Shield,
  Smartphone,
  Github,
  ArrowRight,
  Star,
  Users,
  Code2,
  Calendar,
  BarChart3,
  Flame,
  Rocket,
  Target,
  Award,
  Mail,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">DevFocus</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm font-medium hover:underline"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium hover:underline"
            >
              Pricing
            </Link>
            <Link href="#about" className="text-sm font-medium hover:underline">
              About
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container flex flex-col items-center gap-8 py-24 text-center">
        <Badge variant="secondary" className="px-4 py-1">
          <Sparkles className="mr-2 h-3 w-3" />
          AI-Powered Productivity
        </Badge>
        <h1 className="max-w-4xl text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          Focus on what matters.
          <br />
          <span className="text-primary">Build better software.</span>
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground sm:text-xl">
          The ultimate developer platform. Manage tasks, review PRs, track
          commit streaks, deploy projects, and get AI-powered insights.
        </p>
        <div className="flex gap-4">
          <Link href="/auth/signin">
            <Button size="lg" className="gap-2">
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="https://github.com/yourusername/devfocus" target="_blank">
            <Button size="lg" variant="outline" className="gap-2">
              <Github className="h-4 w-4" />
              View on GitHub
            </Button>
          </Link>
        </div>
        <div className="mt-8 flex items-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Free forever
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            No credit card required
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Open source
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t bg-muted/50 py-24">
        <div className="container">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Everything you need to stay productive
            </h2>
            <p className="text-lg text-muted-foreground">
              Powerful features designed specifically for developers
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Task Management</CardTitle>
                <CardDescription>
                  Organize your work with a powerful Kanban board. Drag, drop,
                  and prioritize tasks effortlessly.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <GitPullRequest className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>PR Reviews</CardTitle>
                <CardDescription>
                  See pending review requests, open PRs, CI/CD status, and
                  conflict warnings in one unified dashboard.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Flame className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Commit Streaks</CardTitle>
                <CardDescription>
                  Track daily commit streaks, contribution graphs, and unlock
                  achievements as you build coding habits.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Rocket className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Deployments</CardTitle>
                <CardDescription>
                  Deploy projects from GitHub/GitLab, manage environment
                  variables, view build logs, and rollback with one click.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>AI Insights</CardTitle>
                <CardDescription>
                  Get personalized recommendations and insights powered by
                  advanced AI to optimize your workflow.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <GitBranch className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Git Integration</CardTitle>
                <CardDescription>
                  Connect GitHub and GitLab to track commits, PRs, and
                  repository activity in one place.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>
                  Visualize your productivity with detailed charts and
                  statistics. Track progress over time.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Offline Mode</CardTitle>
                <CardDescription>
                  Work without interruption. All your data syncs automatically
                  when you're back online.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-t py-24">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold">10,000+</div>
              <div className="text-muted-foreground">Active Developers</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold">1M+</div>
              <div className="text-muted-foreground">Tasks Completed</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold">50K+</div>
              <div className="text-muted-foreground">Focus Hours</div>
            </div>
            <div className="text-center">
              <div className="mb-2 text-4xl font-bold">4.9/5</div>
              <div className="text-muted-foreground">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-t bg-muted/50 py-24">
        <div className="container">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              How DevFocus Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Get started in minutes and boost your productivity today
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-background text-2xl font-bold">
                  1
                </div>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Sign Up Free</h3>
              <p className="text-muted-foreground">
                Create your account in seconds. No credit card required, no
                hidden fees.
              </p>
            </div>

            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-background text-2xl font-bold">
                  2
                </div>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Connect Your Tools</h3>
              <p className="text-muted-foreground">
                Integrate with GitHub, GitLab, and your favorite development
                tools.
              </p>
            </div>

            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-background text-2xl font-bold">
                  3
                </div>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Start Building</h3>
              <p className="text-muted-foreground">
                Track your tasks, focus time, and watch your productivity soar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="border-t py-24">
        <div className="container">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Loved by developers worldwide
            </h2>
            <p className="text-lg text-muted-foreground">
              See what our users have to say about DevFocus
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="mb-2 flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>
                <CardDescription className="text-base">
                  "DevFocus completely changed how I manage my projects. The
                  PR review dashboard and commit streak tracker keep me
                  focused and accountable."
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold">
                    SA
                  </div>
                  <div>
                    <div className="font-semibold">Sarah Anderson</div>
                    <div className="text-sm text-muted-foreground">
                      Full Stack Developer
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>
                <CardDescription className="text-base">
                  "The GitHub integration is seamless. I can track all my
                  commits and PRs without leaving the dashboard. Absolutely love
                  it!"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold">
                    MC
                  </div>
                  <div>
                    <div className="font-semibold">Michael Chen</div>
                    <div className="text-sm text-muted-foreground">
                      Senior Engineer
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="mb-2 flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>
                <CardDescription className="text-base">
                  "Best productivity tool I've used. The AI insights help me
                  identify patterns and improve my workflow every day."
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold">
                    EP
                  </div>
                  <div>
                    <div className="font-semibold">Emma Peterson</div>
                    <div className="text-sm text-muted-foreground">
                      Tech Lead
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="border-t bg-muted/50 py-24">
        <div className="container">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-muted-foreground">
              Choose the plan that's right for you
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Free</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <CardDescription className="mt-4">
                  Perfect for individual developers getting started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>Up to 50 tasks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>Basic analytics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>Commit streak tracker</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>1 GitHub integration</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>Mobile app access</span>
                  </li>
                </ul>
                <Link href="/auth/signin" className="mt-6 block">
                  <Button className="w-full" variant="outline">
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-primary">
              <CardHeader>
                <div className="mb-2">
                  <Badge>Most Popular</Badge>
                </div>
                <CardTitle className="text-2xl">Pro</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$12</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <CardDescription className="mt-4">
                  For professional developers who want more
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>Unlimited tasks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>Advanced analytics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>AI-powered insights</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>Unlimited integrations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>Custom themes</span>
                  </li>
                </ul>
                <Link href="/auth/signin" className="mt-6 block">
                  <Button className="w-full">Start Free Trial</Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Team</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$39</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <CardDescription className="mt-4">
                  For teams that want to collaborate
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>Everything in Pro</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>Up to 10 team members</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>Team analytics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>Shared workspaces</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>Admin controls</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span>24/7 support</span>
                  </li>
                </ul>
                <Link href="/auth/signin" className="mt-6 block">
                  <Button className="w-full" variant="outline">
                    Contact Sales
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t py-24">
        <div className="container">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about DevFocus
            </p>
          </div>

          <div className="mx-auto max-w-3xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Is DevFocus really free?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! Our free plan includes all core features and is free
                  forever. No credit card required to get started.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Can I cancel my subscription anytime?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Absolutely. You can cancel your subscription at any time from
                  your account settings. No questions asked.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Which Git platforms do you support?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We currently support GitHub and GitLab. Support for Bitbucket
                  and other platforms is coming soon.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is my data secure?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes. We use industry-standard encryption to protect your data.
                  Your information is never shared with third parties.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Do you offer a mobile app?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  DevFocus is a progressive web app (PWA) that works great on
                  mobile devices. Native iOS and Android apps are in
                  development.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Can I use DevFocus offline?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! DevFocus works offline and automatically syncs your data
                  when you're back online.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="border-t bg-muted/50 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <Mail className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Stay updated
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Get the latest productivity tips, feature updates, and developer
              insights delivered to your inbox.
            </p>
            <form className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                className="flex-1"
              />
              <Button type="submit">Subscribe</Button>
            </form>
            <p className="mt-4 text-sm text-muted-foreground">
              No spam. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="border-t py-24">
        <div className="container">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Why developers choose DevFocus
            </h2>
            <p className="text-lg text-muted-foreground">
              More than just a task manager
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <Shield className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Privacy First</CardTitle>
                <CardDescription>
                  Your data is encrypted end-to-end and never shared with third
                  parties. We take your privacy seriously.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Smartphone className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Works Everywhere</CardTitle>
                <CardDescription>
                  Access your dashboard from any device, anywhere. Seamless sync
                  across desktop, tablet, and mobile.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Lightning Fast</CardTitle>
                <CardDescription>
                  Built with modern tech stack for blazing fast performance. No
                  lag, no waiting, just pure productivity.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Code2 className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Developer-Friendly</CardTitle>
                <CardDescription>
                  Keyboard shortcuts, dark mode, and integrations with tools you
                  already use. Built by developers, for developers.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Users className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Team Collaboration</CardTitle>
                <CardDescription>
                  Share workspaces, assign tasks, and track team progress.
                  Perfect for remote and distributed teams.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Award className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Open Source</CardTitle>
                <CardDescription>
                  Fully open source and transparent. Contribute, customize, and
                  make it your own. Community-driven development.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="border-t bg-muted/50 py-24">
        <div className="container">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Perfect for every workflow
            </h2>
            <p className="text-lg text-muted-foreground">
              Whether you're a solo developer or part of a team
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <Target className="mb-2 h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">For Solo Developers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                  <div>
                    <h4 className="font-semibold">Stay Consistent</h4>
                    <p className="text-sm text-muted-foreground">
                      Build coding habits with commit streaks and earn
                      achievements for milestones
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                  <div>
                    <h4 className="font-semibold">Track Progress</h4>
                    <p className="text-sm text-muted-foreground">
                      Visualize your productivity trends and celebrate your wins
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                  <div>
                    <h4 className="font-semibold">Manage Side Projects</h4>
                    <p className="text-sm text-muted-foreground">
                      Keep all your projects organized in one place
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="mb-2 h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">
                  For Development Teams
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                  <div>
                    <h4 className="font-semibold">Collaborate Seamlessly</h4>
                    <p className="text-sm text-muted-foreground">
                      Share tasks, assign work, and track team velocity
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                  <div>
                    <h4 className="font-semibold">Team Analytics</h4>
                    <p className="text-sm text-muted-foreground">
                      Get insights into team productivity and identify
                      bottlenecks
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                  <div>
                    <h4 className="font-semibold">Sprint Planning</h4>
                    <p className="text-sm text-muted-foreground">
                      Plan sprints, set goals, and track deliverables
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="border-t py-24">
        <div className="container">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Integrates with your favorite tools
            </h2>
            <p className="text-lg text-muted-foreground">
              Connect DevFocus with the tools you already use
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="text-center">
              <CardHeader>
                <Github className="mx-auto h-12 w-12" />
                <CardTitle>GitHub</CardTitle>
                <CardDescription>
                  Track commits, PRs, and issues
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <GitBranch className="mx-auto h-12 w-12" />
                <CardTitle>GitLab</CardTitle>
                <CardDescription>Sync your GitLab projects</CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Calendar className="mx-auto h-12 w-12" />
                <CardTitle>Google Calendar</CardTitle>
                <CardDescription>Sync your schedule</CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <BarChart3 className="mx-auto h-12 w-12" />
                <CardTitle>Analytics</CardTitle>
                <CardDescription>Export data to your tools</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground">
              More integrations coming soon: Jira, Slack, Discord, and more
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t py-24">
        <div className="container text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Ready to boost your productivity?
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Join thousands of developers who are already using DevFocus
          </p>
          <Link href="/auth/signin">
            <Button size="lg" className="gap-2">
              Get Started for Free
              <ArrowRight className="h-4 w-4" />
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
                  <Link href="#pricing" className="hover:underline">
                    Pricing
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
                <li>
                  <Link href="/blog" className="hover:underline">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:underline">
                    Contact
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
                <li>
                  <Link href="/security" className="hover:underline">
                    Security
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
  );
}
