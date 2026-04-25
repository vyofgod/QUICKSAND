"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Palette,
  Github,
  GitlabIcon as Gitlab,
  ExternalLink,
  User,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { signIn } from "next-auth/react";

// ─── Appearance Settings ──────────────────────────────────────────────────────

function AppearanceSettings() {
  const { data: prefs, isLoading } = trpc.user.getPreferences.useQuery();
  const updateMutation = trpc.user.updatePreferences.useMutation({
    onSuccess: () => toast.success("Appearance settings saved"),
    onError: () => toast.error("Failed to save settings"),
  });

  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (prefs) {
      setTheme((prefs.theme as "light" | "dark" | "system") ?? "system");
      setSidebarCollapsed(prefs.sidebarCollapsed ?? false);
    }
  }, [prefs]);

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Appearance
        </CardTitle>
        <CardDescription>Customize the look of the application</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-2">
          <Label htmlFor="theme">Theme</Label>
          <Select
            value={theme}
            onValueChange={(v) => setTheme(v as "light" | "dark" | "system")}
          >
            <SelectTrigger id="theme">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Sidebar collapsed by default</Label>
            <p className="text-sm text-muted-foreground">
              Start with the sidebar hidden
            </p>
          </div>
          <Switch
            checked={sidebarCollapsed}
            onCheckedChange={setSidebarCollapsed}
          />
        </div>

        <Button
          onClick={() => updateMutation.mutate({ theme, sidebarCollapsed })}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? "Saving…" : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Notifications Settings ───────────────────────────────────────────────────

function NotificationsSettings() {
  const { data: prefs, isLoading } = trpc.user.getPreferences.useQuery();
  const updateMutation = trpc.user.updatePreferences.useMutation({
    onSuccess: () => toast.success("Notification settings saved"),
    onError: () => toast.error("Failed to save settings"),
  });

  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(true);

  useEffect(() => {
    if (prefs) {
      setNotifications(prefs.enableNotifications ?? true);
      setSound(prefs.enableSoundAlerts ?? true);
    }
  }, [prefs]);

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </CardTitle>
        <CardDescription>Manage how you receive alerts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Browser notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive notifications in the browser
            </p>
          </div>
          <Switch checked={notifications} onCheckedChange={setNotifications} />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Sound alerts</Label>
            <p className="text-sm text-muted-foreground">
              Play a sound when a timer ends
            </p>
          </div>
          <Switch checked={sound} onCheckedChange={setSound} />
        </div>

        <Button
          onClick={() =>
            updateMutation.mutate({
              enableNotifications: notifications,
              enableSoundAlerts: sound,
            })
          }
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? "Saving…" : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Integrations ─────────────────────────────────────────────────────────────

function IntegrationsSettings() {
  const { data: profile, isLoading } = trpc.user.getProfile.useQuery();
  const syncMutation = trpc.repository.syncAll.useMutation({
    onSuccess: (data) =>
      toast.success(
        `Synced ${data.repositoriesAdded} repos, ${data.commitsAdded} commits`
      ),
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  const githubAccount = profile?.accounts.find((a) => a.provider === "github");
  const gitlabAccount = profile?.accounts.find((a) => a.provider === "gitlab");

  const username =
    githubAccount?.providerUsername ||
    gitlabAccount?.providerUsername ||
    profile?.name;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Accounts</CardTitle>
        <CardDescription>Manage your Git provider connections</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* GitHub */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black">
              <Github className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">GitHub</p>
              {githubAccount && username ? (
                <div className="mt-0.5 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-sm text-green-600 dark:text-green-400">
                    Connected as{" "}
                    <a
                      href={`https://github.com/${username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 font-medium hover:underline"
                    >
                      @{username}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not connected</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {githubAccount ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
              >
                <RefreshCw
                  className={`mr-1.5 h-3.5 w-3.5 ${syncMutation.isPending ? "animate-spin" : ""}`}
                />
                Sync repos
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => signIn("github")}
              >
                Connect
              </Button>
            )}
          </div>
        </div>

        {/* GitLab */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500 text-white">
              <Gitlab className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">GitLab</p>
              {gitlabAccount && username ? (
                <div className="mt-0.5 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  <span className="text-sm text-green-600 dark:text-green-400">
                    Connected as{" "}
                    <a
                      href={`https://gitlab.com/${username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 font-medium hover:underline"
                    >
                      @{username}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not connected</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {gitlabAccount ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
              >
                <RefreshCw
                  className={`mr-1.5 h-3.5 w-3.5 ${syncMutation.isPending ? "animate-spin" : ""}`}
                />
                Sync repos
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => signIn("gitlab")}
              >
                Connect
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Profile (read-only from OAuth) ──────────────────────────────────────────

function ProfileInfo() {
  const { data: profile, isLoading } = trpc.user.getProfile.useQuery();

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (!profile) return null;

  const githubAccount = profile.accounts.find((a) => a.provider === "github");
  const gitlabAccount = profile.accounts.find((a) => a.provider === "gitlab");
  const provider = githubAccount ? "GitHub" : gitlabAccount ? "GitLab" : null;

  const displayName =
    githubAccount?.providerUsername ||
    gitlabAccount?.providerUsername ||
    profile.name ||
    "User";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Account Information
        </CardTitle>
        <CardDescription>
          Your profile is managed by your connected {provider ?? "OAuth"}{" "}
          account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.image ?? undefined} />
            <AvatarFallback className="text-xl">
              {displayName?.charAt(0)?.toUpperCase() ??
                profile.email?.charAt(0)?.toUpperCase() ??
                "U"}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <p className="text-lg font-semibold">{displayName}</p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            {provider && (
              <Badge variant="secondary" className="text-xs">
                {provider === "GitHub" ? (
                  <Github className="mr-1 h-3 w-3" />
                ) : (
                  <Gitlab className="mr-1 h-3 w-3" />
                )}
                Signed in with {provider}
              </Badge>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
          Your name, email, and profile picture are synced from your{" "}
          {provider ?? "OAuth"} account. To update them, change your{" "}
          {provider ?? "provider"} profile and sign in again.
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-4">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4">
          <ProfileInfo />
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <IntegrationsSettings />
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <AppearanceSettings />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <NotificationsSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
