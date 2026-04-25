"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Github, GitBranch, Package, ChevronRight, Rocket, Check, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc/client";
import { toast } from "sonner";

const deploymentSources = [
  { id: "github", name: "GitHub Repository", description: "Deploy from a public or private GitHub repo", icon: Github, color: "text-white", bg: "bg-zinc-800" },
  { id: "git", name: "Git Repository", description: "Any Git URL (GitLab, Bitbucket, self-hosted)", icon: GitBranch, color: "text-orange-400", bg: "bg-orange-500/10" },
  { id: "docker", name: "Docker Image", description: "Deploy any Docker image from a registry", icon: Package, color: "text-blue-400", bg: "bg-blue-500/10" },
  { id: "template", name: "Template", description: "Start with a pre-configured template", icon: Rocket, color: "text-violet-400", bg: "bg-violet-500/10" },
] as const;

const frameworks = [
  "Next.js", "Nuxt.js", "React", "Vue", "Svelte", "SvelteKit",
  "Astro", "Remix", "Angular", "Gatsby", "Node.js", "Python/FastAPI",
  "Python/Django", "Go", "Ruby on Rails", "PHP/Laravel", "Static",
];

const buildPresets: Record<string, { build: string; output: string; install: string }> = {
  "Next.js": { build: "npm run build", output: ".next", install: "npm install" },
  "Nuxt.js": { build: "npm run build", output: ".output", install: "npm install" },
  "React": { build: "npm run build", output: "build", install: "npm install" },
  "Vue": { build: "npm run build", output: "dist", install: "npm install" },
  "Astro": { build: "npm run build", output: "dist", install: "npm install" },
  "SvelteKit": { build: "npm run build", output: ".svelte-kit", install: "npm install" },
  "Static": { build: "", output: ".", install: "" },
};

type SourceType = "github" | "git" | "docker" | "template";

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [source, setSource] = useState<SourceType | "">("");
  const [form, setForm] = useState({
    name: "",
    gitUrl: "",
    dockerImage: "",
    branch: "main",
    framework: "",
    buildCommand: "npm run build",
    outputDir: "dist",
    installCommand: "npm install",
    rootDir: "./",
    envText: "",
    region: "eu-west",
    instances: "1",
    port: "3000",
    description: "",
  });

  const createMutation = api.deploy.project.create.useMutation({
    onError: (e) => toast.error(e.message),
  });
  const bulkImportMutation = api.deploy.envVar.bulkImport.useMutation({
    onError: (e) => toast.error("Env import failed: " + e.message),
  });

  const handleFrameworkChange = (fw: string) => {
    const preset = buildPresets[fw];
    setForm((f) => ({
      ...f,
      framework: fw,
      buildCommand: preset?.build ?? f.buildCommand,
      outputDir: preset?.output ?? f.outputDir,
      installCommand: preset?.install ?? f.installCommand,
    }));
  };

  const handleDeploy = async () => {
    if (!source) return;
    try {
      const project = await createMutation.mutateAsync({
        name: form.name || "my-app",
        description: form.description || undefined,
        framework: form.framework || undefined,
        branch: form.branch,
        gitUrl: form.gitUrl || undefined,
        sourceType: source as SourceType,
        dockerImage: form.dockerImage || undefined,
        buildCommand: form.buildCommand,
        outputDir: form.outputDir,
        installCommand: form.installCommand,
        rootDir: form.rootDir,
        port: parseInt(form.port, 10) || 3000,
        region: form.region,
        instances: parseInt(form.instances, 10) || 1,
      });

      const projectId = String(project.id);

      if (form.envText.trim()) {
        await bulkImportMutation.mutateAsync({
          projectId,
          envText: form.envText,
        });
      }

      toast.success("Project created successfully!");
      router.push(`/deploy/projects/${projectId}`);
    } catch {
      // error handled by onError
    }
  };

  const isCreating = createMutation.isPending;

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 bg-zinc-900/50 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/deploy">
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">New Project</h1>
            <p className="text-sm text-zinc-400">Deploy your application in minutes</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-8">
        {/* Steps indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors",
                step > s ? "bg-green-600 text-white"
                  : step === s ? "bg-violet-600 text-white"
                  : "bg-zinc-800 text-zinc-500"
              )}>
                {step > s ? <Check className="h-4 w-4" /> : s}
              </div>
              <span className={cn("text-sm", step >= s ? "text-zinc-200" : "text-zinc-600")}>
                {s === 1 ? "Source" : s === 2 ? "Configure" : "Deploy"}
              </span>
              {s < 3 && <ChevronRight className="h-4 w-4 text-zinc-700" />}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Choose your deployment source</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {deploymentSources.map((src) => (
                <button
                  key={src.id}
                  onClick={() => setSource(src.id)}
                  className={cn(
                    "flex items-start gap-4 rounded-xl border p-4 text-left transition-all",
                    source === src.id
                      ? "border-violet-500 bg-violet-500/10"
                      : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
                  )}
                >
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", src.bg)}>
                    <src.icon className={cn("h-5 w-5", src.color)} />
                  </div>
                  <div>
                    <p className="font-medium text-zinc-100">{src.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{src.description}</p>
                  </div>
                  {source === src.id && <Check className="ml-auto h-4 w-4 shrink-0 text-violet-400" />}
                </button>
              ))}
            </div>

            {(source === "github" || source === "git") && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
                <p className="text-sm font-medium text-zinc-300">Repository URL</p>
                <Input
                  placeholder={source === "github" ? "https://github.com/username/repository" : "https://gitlab.com/username/repo.git"}
                  value={form.gitUrl}
                  onChange={(e) => setForm((f) => ({ ...f, gitUrl: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                />
              </div>
            )}

            {source === "docker" && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
                <p className="text-sm font-medium text-zinc-300">Docker Image</p>
                <Input
                  placeholder="nginx:latest or registry.example.com/app:v1.0"
                  value={form.dockerImage}
                  onChange={(e) => setForm((f) => ({ ...f, dockerImage: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                />
              </div>
            )}

            <Button
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
              disabled={!source}
              onClick={() => setStep(2)}
            >
              Continue <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-white">Configure your project</h2>

            <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">General</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs">Project Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="my-app"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs">Branch</Label>
                  <Input
                    value={form.branch}
                    onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
                    placeholder="main"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-zinc-400 text-xs">Description (optional)</Label>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Brief description of this project"
                    className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs">Framework</Label>
                  <Select value={form.framework} onValueChange={handleFrameworkChange}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                      <SelectValue placeholder="Auto-detect" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      {frameworks.map((fw) => (
                        <SelectItem key={fw} value={fw} className="text-zinc-100 focus:bg-zinc-700">{fw}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs">Root Directory</Label>
                  <Input
                    value={form.rootDir}
                    onChange={(e) => setForm((f) => ({ ...f, rootDir: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">Build Settings</h3>
              <div className="space-y-3">
                {[
                  { label: "Install Command", key: "installCommand" as const },
                  { label: "Build Command", key: "buildCommand" as const },
                  { label: "Output Directory", key: "outputDir" as const },
                  { label: "Port", key: "port" as const },
                ].map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label className="text-zinc-400 text-xs">{field.label}</Label>
                    <Input
                      value={form[field.key]}
                      onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                      className="font-mono text-sm bg-zinc-800 border-zinc-700 text-zinc-100"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">Infrastructure</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs">Region</Label>
                  <Select value={form.region} onValueChange={(v) => setForm((f) => ({ ...f, region: v }))}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      <SelectItem value="eu-west" className="text-zinc-100 focus:bg-zinc-700">EU West (Frankfurt)</SelectItem>
                      <SelectItem value="us-east" className="text-zinc-100 focus:bg-zinc-700">US East (Virginia)</SelectItem>
                      <SelectItem value="us-west" className="text-zinc-100 focus:bg-zinc-700">US West (Oregon)</SelectItem>
                      <SelectItem value="ap-southeast" className="text-zinc-100 focus:bg-zinc-700">Asia Pacific (Singapore)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs">Instances</Label>
                  <Select value={form.instances} onValueChange={(v) => setForm((f) => ({ ...f, instances: v }))}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-700">
                      {["1", "2", "3", "5", "10"].map((n) => (
                        <SelectItem key={n} value={n} className="text-zinc-100 focus:bg-zinc-700">
                          {n} instance{n !== "1" ? "s" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">Environment Variables</h3>
              <textarea
                value={form.envText}
                onChange={(e) => setForm((f) => ({ ...f, envText: e.target.value }))}
                placeholder={"NODE_ENV=production\nAPI_KEY=...\nDATABASE_URL=..."}
                rows={5}
                className="w-full resize-none rounded-lg bg-zinc-800 border border-zinc-700 p-3 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500"
              />
              <p className="text-xs text-zinc-600">One variable per line in KEY=VALUE format</p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Back
              </Button>
              <Button
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                disabled={!form.name.trim()}
                onClick={() => setStep(3)}
              >
                Review &amp; Deploy <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-white">Review and deploy</h2>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 divide-y divide-zinc-800">
              {[
                { label: "Project Name", value: form.name || "my-app" },
                { label: "Source", value: source },
                { label: "Branch", value: form.branch },
                { label: "Framework", value: form.framework || "Auto-detect" },
                { label: "Build Command", value: form.buildCommand || "—" },
                { label: "Region", value: form.region },
                { label: "Instances", value: form.instances },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between px-5 py-3">
                  <span className="text-sm text-zinc-400">{row.label}</span>
                  <span className="text-sm font-mono text-zinc-100 capitalize">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Back
              </Button>
              <Button
                className="flex-1 gap-2 bg-violet-600 hover:bg-violet-700 text-white"
                disabled={isCreating}
                onClick={handleDeploy}
              >
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                {isCreating ? "Creating..." : "Deploy Now"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
