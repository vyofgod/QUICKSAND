"use client";

import { useState } from "react";
import { Plus, Check, Trash2, TestTube, X, Loader2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc/client";
import { toast } from "sonner";

const channels = [
  { id: "Slack", icon: "💬", desc: "Slack Webhook URL", field: "webhookUrl", placeholder: "https://hooks.slack.com/services/..." },
  { id: "Discord", icon: "🎮", desc: "Discord Webhook URL", field: "webhookUrl", placeholder: "https://discord.com/api/webhooks/..." },
  { id: "Telegram", icon: "✈️", desc: "Bot Token + Chat ID", field: "token", placeholder: "1234567890:ABCdef..." },
  { id: "Email", icon: "📧", desc: "Email address", field: "email", placeholder: "alerts@example.com" },
  { id: "Webhook", icon: "🔗", desc: "Generic HTTP POST URL", field: "webhookUrl", placeholder: "https://example.com/webhook" },
  { id: "Ntfy", icon: "📱", desc: "ntfy.sh topic URL", field: "webhookUrl", placeholder: "https://ntfy.sh/mytopic" },
  { id: "Pushover", icon: "🔔", desc: "Pushover API Token", field: "token", placeholder: "azGDORePK8gMaC0QOYAMyEEuzJnyUi" },
  { id: "Gotify", icon: "⚡", desc: "Gotify server URL + token", field: "webhookUrl", placeholder: "https://gotify.example.com" },
] as const;

type ChannelId = (typeof channels)[number]["id"];

const eventTypes = [
  { id: "deploy_success", label: "Deployment Success", color: "text-green-400" },
  { id: "deploy_failed", label: "Deployment Failed", color: "text-red-400" },
  { id: "deploy_started", label: "Deployment Started", color: "text-blue-400" },
  { id: "server_down", label: "Server Down", color: "text-red-400" },
  { id: "server_up", label: "Server Up", color: "text-green-400" },
  { id: "high_cpu", label: "High CPU (>80%)", color: "text-yellow-400" },
  { id: "high_memory", label: "High Memory (>80%)", color: "text-yellow-400" },
  { id: "ssl_expiry", label: "SSL Certificate Expiry", color: "text-orange-400" },
  { id: "backup_done", label: "Backup Completed", color: "text-zinc-400" },
  { id: "backup_failed", label: "Backup Failed", color: "text-red-400" },
];

const defaultEvents = ["deploy_success", "deploy_failed", "server_down"];

export default function NotificationsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<ChannelId | "">("");
  const [form, setForm] = useState({ name: "", webhookUrl: "", token: "", chatId: "", email: "" });
  const [selectedEvents, setSelectedEvents] = useState<string[]>(defaultEvents);

  const utils = api.useUtils();
  const { data: notifChannels = [], isLoading, refetch } = api.deploy.notification.list.useQuery();

  const createMutation = api.deploy.notification.create.useMutation({
    onSuccess: () => {
      utils.deploy.notification.list.invalidate();
      setShowAdd(false);
      setSelectedChannel("");
      setForm({ name: "", webhookUrl: "", token: "", chatId: "", email: "" });
      setSelectedEvents(defaultEvents);
      toast.success("Notification channel added");
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = api.deploy.notification.delete.useMutation({
    onSuccess: () => { utils.deploy.notification.list.invalidate(); toast.success("Channel removed"); },
    onError: (e) => toast.error(e.message),
  });
  const toggleMutation = api.deploy.notification.toggleStatus.useMutation({
    onSuccess: () => utils.deploy.notification.list.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const handleCreate = () => {
    if (!selectedChannel || !form.name) return toast.error("Channel type and name are required");
    if (selectedEvents.length === 0) return toast.error("Select at least one event");
    createMutation.mutate({
      name: form.name,
      channelType: selectedChannel,
      webhookUrl: form.webhookUrl || undefined,
      token: form.token || undefined,
      chatId: form.chatId || undefined,
      email: form.email || undefined,
      events: selectedEvents,
    });
  };

  const toggleEvent = (id: string) => {
    setSelectedEvents((prev) => prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]);
  };

  return (
    <div className="min-h-full bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 bg-zinc-900/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">Notifications</h1>
            <p className="text-sm text-zinc-400">Configure alerts for deployments, servers and databases</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => refetch()} className="text-zinc-400 hover:text-white hover:bg-zinc-800">
              <Bell className="h-4 w-4" />
            </Button>
            <Button className="gap-2 bg-violet-600 hover:bg-violet-700 text-white" onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4" />Add Channel
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Configured channels */}
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">
            Configured Channels ({notifChannels.length})
          </h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-600" />
            </div>
          ) : notifChannels.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 py-10 text-center">
              <Bell className="mx-auto h-8 w-8 text-zinc-700 mb-2" />
              <p className="text-sm text-zinc-500">No notification channels configured yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifChannels.map((config) => {
                const cid = String(config.id);
                const ch = channels.find((c) => c.id === config.channelType);
                return (
                  <div key={cid} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-lg">
                        {ch?.icon ?? "🔔"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-100">{config.name}</span>
                          <Badge variant="outline" className={cn("text-[10px] border-0 px-1.5",
                            config.status === "active" ? "bg-green-500/10 text-green-400" : "bg-zinc-700 text-zinc-500")}>
                            {config.status}
                          </Badge>
                          <span className="text-xs text-zinc-500">{config.channelType}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {config.events.map((e) => (
                            <span key={e} className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                              {eventTypes.find((t) => t.id === e)?.label ?? e}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                          onClick={() => toast.info("Test notification sent")}>
                          <TestTube className="h-3.5 w-3.5" />Test
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-zinc-400 hover:text-zinc-200"
                          onClick={() => toggleMutation.mutate({ id: cid })}>
                          {config.status === "active" ? "Disable" : "Enable"}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500/60 hover:text-red-400 hover:bg-red-500/10"
                          onClick={() => deleteMutation.mutate({ id: cid })}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Available channels grid */}
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Available Channels</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {channels.map((ch) => (
              <button key={ch.id} onClick={() => { setSelectedChannel(ch.id); setShowAdd(true); }}
                className="flex flex-col items-start rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-left hover:border-zinc-600 transition-colors">
                <span className="text-2xl mb-2">{ch.icon}</span>
                <span className="font-medium text-zinc-100 text-sm">{ch.id}</span>
                <span className="text-xs text-zinc-500 mt-0.5">{ch.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Events reference */}
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide mb-3">Available Events</h2>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            {eventTypes.map((event, idx) => (
              <div key={event.id} className={cn("flex items-center gap-3 px-5 py-3", idx !== eventTypes.length - 1 && "border-b border-zinc-800")}>
                <span className={`text-sm font-medium ${event.color}`}>{event.label}</span>
                <span className="ml-auto font-mono text-xs text-zinc-600">{event.id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Channel Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Add Notification Channel</h2>
              <button onClick={() => { setShowAdd(false); setSelectedChannel(""); }} className="text-zinc-500 hover:text-zinc-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            {!selectedChannel ? (
              <div className="grid grid-cols-2 gap-2">
                {channels.map((ch) => (
                  <button key={ch.id} onClick={() => setSelectedChannel(ch.id)}
                    className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-800 p-3 text-left hover:border-zinc-600">
                    <span className="text-xl">{ch.icon}</span>
                    <div>
                      <p className="text-sm text-zinc-200">{ch.id}</p>
                      <p className="text-xs text-zinc-500">{ch.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2">
                  <span className="text-xl">{channels.find((c) => c.id === selectedChannel)?.icon}</span>
                  <span className="text-sm font-medium text-zinc-200">{selectedChannel}</span>
                  <button className="ml-auto text-zinc-500 hover:text-zinc-300" onClick={() => setSelectedChannel("")}>
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Channel Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder={`My ${selectedChannel} channel`}
                    className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500" />
                </div>

                {selectedChannel === "Telegram" ? (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-zinc-400">Bot Token *</Label>
                      <Input value={form.token} onChange={(e) => setForm((f) => ({ ...f, token: e.target.value }))}
                        placeholder="1234567890:ABCdef..."
                        className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-zinc-400">Chat ID *</Label>
                      <Input value={form.chatId} onChange={(e) => setForm((f) => ({ ...f, chatId: e.target.value }))}
                        placeholder="-100123456789"
                        className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500" />
                    </div>
                  </>
                ) : selectedChannel === "Email" ? (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-400">Email Address *</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="alerts@example.com"
                      className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500" />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-zinc-400">{channels.find((c) => c.id === selectedChannel)?.desc} *</Label>
                    <Input value={form.webhookUrl} onChange={(e) => setForm((f) => ({ ...f, webhookUrl: e.target.value }))}
                      placeholder={channels.find((c) => c.id === selectedChannel)?.placeholder}
                      className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500" />
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs text-zinc-400">Notify on *</Label>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-800 p-3 space-y-2 max-h-48 overflow-y-auto">
                    {eventTypes.map((event) => (
                      <label key={event.id} className="flex items-center gap-2 cursor-pointer hover:bg-zinc-700 px-2 py-1 rounded">
                        <input type="checkbox" checked={selectedEvents.includes(event.id)}
                          onChange={() => toggleEvent(event.id)}
                          className="rounded border-zinc-600 bg-zinc-700 text-violet-500" />
                        <span className={`text-xs ${event.color}`}>{event.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <Button variant="outline" className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                onClick={() => { setShowAdd(false); setSelectedChannel(""); }}>
                Cancel
              </Button>
              {selectedChannel && (
                <Button className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                  disabled={createMutation.isPending} onClick={handleCreate}>
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  Save Channel
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
