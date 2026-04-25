"use client";

import { Settings, Globe, Shield, Key, Server, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const settingsSections = [
  {
    id: "general",
    icon: Settings,
    title: "General",
    fields: [
      { label: "Platform Name", value: "DevDeploy", type: "text" },
      { label: "Default Region", value: "EU West (Frankfurt)", type: "select" },
      { label: "Default Branch", value: "main", type: "text" },
    ],
  },
  {
    id: "domains",
    icon: Globe,
    title: "Domain Settings",
    fields: [
      { label: "Base Domain", value: "devdeploy.app", type: "text" },
      { label: "Wildcard SSL", value: "Enabled", type: "toggle" },
      { label: "Auto SSL Renewal", value: "Enabled", type: "toggle" },
    ],
  },
  {
    id: "security",
    icon: Shield,
    title: "Security",
    fields: [
      { label: "Two-Factor Auth", value: "Disabled", type: "toggle" },
      { label: "API Key Rotation", value: "Never", type: "select" },
      { label: "Audit Logs", value: "Enabled", type: "toggle" },
    ],
  },
  {
    id: "registry",
    icon: Server,
    title: "Container Registry",
    fields: [
      { label: "Registry URL", value: "registry.devdeploy.app", type: "text" },
      { label: "Registry Username", value: "devdeploy", type: "text" },
      { label: "Registry Password", value: "••••••••", type: "password" },
    ],
  },
];

export default function DeploySettingsPage() {
  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 bg-zinc-900/50 px-6 py-4">
        <div>
          <h1 className="text-xl font-bold text-white">Platform Settings</h1>
          <p className="text-sm text-zinc-400">Configure your deployment platform</p>
        </div>
      </div>

      <div className="p-6 space-y-5 max-w-2xl">
        {settingsSections.map((section) => (
          <div key={section.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <section.icon className="h-4 w-4 text-violet-400" />
              <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">{section.title}</h2>
            </div>
            {section.fields.map((field) => (
              <div key={field.label} className="space-y-1.5">
                <label className="text-xs text-zinc-400">{field.label}</label>
                {field.type === "toggle" ? (
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "relative h-5 w-9 cursor-pointer rounded-full transition-colors",
                      field.value === "Enabled" ? "bg-violet-600" : "bg-zinc-700"
                    )}>
                      <div className={cn(
                        "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                        field.value === "Enabled" ? "translate-x-4" : "translate-x-0.5"
                      )} />
                    </div>
                    <span className="text-sm text-zinc-300">{field.value}</span>
                  </div>
                ) : (
                  <input
                    type={field.type === "password" ? "password" : "text"}
                    defaultValue={field.value}
                    className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-violet-500"
                  />
                )}
              </div>
            ))}
            <Button size="sm" className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs">
              <Save className="h-3.5 w-3.5" />
              Save {section.title}
            </Button>
          </div>
        ))}

        {/* API Keys */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-violet-400" />
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">API Keys</h2>
          </div>
          <div className="space-y-2">
            {[
              { name: "Production Key", key: "dk_prod_•••••••••••••••••••••••", created: "Apr 2026" },
              { name: "CI/CD Key", key: "dk_ci_•••••••••••••••••••••••", created: "Apr 2026" },
            ].map((apiKey) => (
              <div key={apiKey.name} className="flex items-center gap-3 rounded-lg bg-zinc-800 px-4 py-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-200">{apiKey.name}</p>
                  <p className="font-mono text-xs text-zinc-500">{apiKey.key}</p>
                </div>
                <span className="text-xs text-zinc-600">{apiKey.created}</span>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-red-400/60 hover:text-red-400 hover:bg-red-500/10">
                  Revoke
                </Button>
              </div>
            ))}
          </div>
          <Button size="sm" className="gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs">
            <Key className="h-3.5 w-3.5" />
            Generate New API Key
          </Button>
        </div>
      </div>
    </div>
  );
}
