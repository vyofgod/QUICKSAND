"use client";

import { Clock, Package, Rocket } from "lucide-react";

export default function ServicesPage() {
  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white">
              Services &amp; Templates
            </h1>
            <p className="mt-0.5 text-sm text-zinc-400">
              One-click deploy for{" "}
              <span className="font-medium text-violet-400">
                280+ open-source services
              </span>
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1">
              <Clock className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-xs font-medium text-violet-300">
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Message */}
      <div className="flex flex-col items-center justify-center px-6 py-32 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10">
          <Package className="h-10 w-10 text-violet-400" />
        </div>
        <h2 className="mb-3 text-2xl font-bold text-white">
          Services Coming Soon
        </h2>
        <p className="mb-2 max-w-md text-zinc-400">
          We&apos;re working hard to bring you 280+ one-click deployment
          templates for popular open-source services.
        </p>
        <p className="max-w-lg text-sm text-zinc-500">
          This feature will include services like Plausible, Uptime Kuma,
          Grafana, Gitea, Nextcloud, Ollama, and many more. Stay tuned!
        </p>

        <div className="mt-8 flex items-center gap-2">
          <Rocket className="h-4 w-4 text-violet-400" />
          <span className="text-sm text-zinc-400">
            Expected launch: Q2 2026
          </span>
        </div>
      </div>
    </div>
  );
}
