import { ArrowLeft, Bell, ChevronDown, CircleDollarSign, FileText, Grid2X2, Home, KeyRound, LayoutDashboard, LockKeyhole, MessageSquare, Moon, ReceiptText, Search, Settings, ShieldCheck, Sparkles, Ticket, UsersRound, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { adminModelProviders, adminNavGroups, adminProfile, adminRecentLogs } from "../../adminData";
import {
  createRemoteChannel,
  getFrontendConfig,
  listRemoteChannels,
  listRemotePlatformModels,
  listRemoteProviderModels,
  listRemoteProviders,
  updateFrontendConfig,
  updateRemoteChannel,
  upsertRemoteChannelMapping,
  upsertRemotePlatformModel,
  type ChannelCreate,
  type ChannelMappingUpsert,
  type ChannelPatch,
  type PlatformModelUpsert,
} from "../../apiClient";
import { platformModels as localPlatformModels, type Channel, type PlatformModel, type Provider, type ProviderModel } from "../../productData";
import type { AccountSection, AppRoute, CapabilityMenuItem, FrontendConfig, FrontendNavItem, UserProfile } from "../../types";
import { cn, formatTokens } from "../../lib";

const navIcons: Record<string, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  "api-token": KeyRound,
  "app-code": Grid2X2,
  "usage-logs": FileText,
  "drawing-logs": FileText,
  "task-logs": ReceiptText,
  wallet: WalletCards,
  consumption: CircleDollarSign,
  "personal-settings": Settings,
  tickets: Ticket,
  "core-admin": ShieldCheck,
  "admin-panel": LayoutDashboard,
  "frontend-config": Grid2X2,
  "platform-models": Sparkles,
  "channel-routes": ReceiptText,
  users: UsersRound,
  home: Home,
  "model-market": Sparkles,
  contact: MessageSquare,
  "api-docs": FileText,
  tutorial: FileText,
};

export function AdminPlaceholder({
  isAdmin,
  user,
  onNavigate,
}: {
  isAdmin: boolean;
  user: UserProfile;
  onNavigate: (route: AppRoute, section?: AccountSection) => void;
}) {
  const [activeKey, setActiveKey] = useState("personal-settings");

  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f8faf7] px-4">
        <div className="max-w-lg rounded-3xl border border-white/80 bg-white/82 p-6 text-center shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-2xl">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-950 text-white">
            <LockKeyhole className="h-6 w-6" />
          </span>
          <h1 className="mt-5 text-2xl font-black tracking-normal text-slate-950">仅管理员可见</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-500">普通创作者前台不会显示管理入口。</p>
          <button
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-teal-600"
            type="button"
            onClick={() => onNavigate("workspace")}
          >
            <ArrowLeft className="h-4 w-4" />
            返回工作台
          </button>
        </div>
      </div>
    );
  }

  const activeLabel = adminNavGroups.flatMap((group) => group.items).find((item) => item.key === activeKey)?.label ?? "个人设置";

  return (
    <div className="min-h-screen bg-[#f5f8fc] text-slate-900">
      <header className="sticky top-0 z-40 h-16 border-b border-slate-200/70 bg-white/90 backdrop-blur-2xl">
        <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-black text-slate-950">Tikpan 管理后台</p>
              <p className="truncate text-xs font-bold text-slate-400">{activeLabel}</p>
            </div>
          </div>

          <label className="relative hidden min-w-0 flex-1 md:block md:max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="h-10 w-full rounded-full border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100" placeholder="搜索用户、模型、订单和日志..." />
          </label>

          <div className="flex items-center gap-2">
            <button className="grid h-10 w-10 place-items-center rounded-full bg-slate-50 text-slate-500" type="button"><Bell className="h-4 w-4" /></button>
            <button className="grid h-10 w-10 place-items-center rounded-full bg-slate-50 text-slate-500" type="button"><Moon className="h-4 w-4" /></button>
            <button className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-3 text-sm font-black text-slate-700 shadow-sm" type="button">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-teal-400 to-sky-500 text-xs text-white">{user.initials}</span>
              <span className="hidden sm:inline">{adminProfile.uid}</span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-64px)]">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200/70 bg-white/72 p-3 md:block">
          <button className="mb-3 flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-black text-slate-600 hover:bg-slate-50" type="button" onClick={() => onNavigate("workspace")}>
            <ArrowLeft className="h-4 w-4" />
            返回前台
          </button>
          <nav className="grid gap-4">
            {adminNavGroups.map((group) => (
              <div key={group.title}>
                <p className="mb-1 px-3 text-xs font-black text-slate-400">{group.title}</p>
                <div className="grid gap-1">
                  {group.items.map((item) => {
                    const Icon = navIcons[item.key] ?? LayoutDashboard;
                    const active = activeKey === item.key;
                    return (
                      <button
                        key={item.key}
                        className={cn(
                          "flex h-10 items-center gap-3 rounded-xl px-3 text-left text-sm font-black transition",
                          active ? "bg-sky-50 text-sky-700 shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                        )}
                        type="button"
                        onClick={() => setActiveKey(item.key)}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6">
          {activeKey === "frontend-config" && <FrontendConfigPanel />}
          {activeKey === "platform-models" && <PlatformModelsPanel />}
          {activeKey === "channel-routes" && <ChannelRoutesPanel />}
          {activeKey !== "frontend-config" && activeKey !== "platform-models" && activeKey !== "channel-routes" && (
          <>
          <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
            <div className="h-1.5 rounded-full bg-gradient-to-r from-sky-400 via-blue-500 to-teal-300" />
            <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-3xl bg-gradient-to-br from-slate-50 to-sky-50 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="grid h-20 w-20 place-items-center rounded-full bg-slate-400/80 text-3xl font-black text-white">24</span>
                    <div>
                      <h1 className="text-xl font-black text-slate-950">{adminProfile.uid}</h1>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs font-black text-slate-500">
                        <span className="rounded-full bg-white px-2.5 py-1 shadow-sm">{adminProfile.role}</span>
                        <span className="rounded-full bg-white px-2.5 py-1 shadow-sm">ID：{adminProfile.uid}</span>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 shadow-sm">已认证</span>
                      </div>
                    </div>
                  </div>
                  <button className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-white shadow-sm" type="button"><UsersRound className="h-5 w-5" /></button>
                </div>

                <div className="mt-7 grid gap-4 sm:grid-cols-4">
                  <Metric label="当前余额" value={formatTokens(adminProfile.balance)} highlight />
                  <Metric label="历史消耗" value={formatTokens(adminProfile.spent)} />
                  <Metric label="请求次数" value={String(adminProfile.requests)} />
                  <Metric label="用户分组" value={adminProfile.group} />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <SmallCard title="今日请求" value="1,286" desc="较昨日 +12%" />
                <SmallCard title="成功率" value="98.6%" desc="近 24 小时" />
                <SmallCard title="冻结 Tokens" value="0 Tokens" desc="无异常冻结" />
                <SmallCard title="待处理工单" value="3" desc="平均 18 分钟响应" />
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-lg font-black text-slate-950">可用模型</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">按平台和供应类型分组查看，可在后续后台版本中接入真实配置。</p>
              </div>
              <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-black text-rose-600">全部模型 484</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {adminModelProviders.flatMap((provider) =>
                provider.models.slice(0, 4).map((model) => (
                  <span key={`${provider.name}-${model}`} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
                    {model}
                  </span>
                )),
              )}
              <span className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-black text-white">更多 459 个模型</span>
            </div>
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
              <p className="text-lg font-black text-slate-950">模型分组</p>
              <div className="mt-4 grid gap-2">
                {adminModelProviders.map((provider) => (
                  <div key={provider.name} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                    <span className="text-sm font-black text-slate-700">{provider.name}</span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black text-slate-500 shadow-sm">{provider.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
              <p className="text-lg font-black text-slate-950">最近日志</p>
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
                {adminRecentLogs.map((log) => (
                  <div key={log.id} className="grid gap-2 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
                    <div>
                      <p className="font-black text-slate-800">{log.type}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-400">{log.user} · {log.time}</p>
                    </div>
                    <p className="font-semibold text-slate-500">{log.model}</p>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">{log.status} · {formatTokens(log.tokens)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
          </>
          )}
        </main>
      </div>
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs font-black text-slate-400">{label}</p>
      <p className={cn("mt-2 text-lg font-black", highlight ? "text-slate-950" : "text-slate-700")}>{value}</p>
    </div>
  );
}

function SmallCard({ title, value, desc }: { title: string; value: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
      <p className="text-sm font-black text-slate-500">{title}</p>
      <p className="mt-3 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-xs font-semibold text-slate-400">{desc}</p>
    </div>
  );
}

function FrontendConfigPanel() {
  const [config, setConfig] = useState<FrontendConfig | null>(null);
  const [models, setModels] = useState<Awaited<ReturnType<typeof listRemotePlatformModels>>>([]);
  const [status, setStatus] = useState("正在读取前台配置...");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getFrontendConfig(), listRemotePlatformModels(localPlatformModels)])
      .then(([config, models]) => {
        if (!cancelled) {
          setConfig(config);
          setModels(models);
          setStatus("前台导航和能力目录由这里驱动，保存后刷新前台即可生效。");
        }
      })
      .catch((error) => {
        if (!cancelled) setStatus(error instanceof Error ? error.message : "读取前台配置失败。");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const save = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const saved = await updateFrontendConfig(config);
      setConfig(saved);
      setStatus("已保存：顶部菜单、左侧能力目录、默认路由策略都会从后端配置读取。");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "保存前台配置失败。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
      <PanelHeader
        title="前台配置"
        desc="配置顶部菜单、能力目录、每个能力关联的平台模型，以及默认调度策略。"
        actionLabel={saving ? "保存中..." : "保存配置"}
        disabled={saving || !config}
        onAction={save}
      />
      {config && (
        <div className="mt-5 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="grid content-start gap-5">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">顶部菜单</p>
              <div className="mt-3 grid gap-2">
                {config.navItems.map((item, index) => (
                  <NavItemEditor
                    key={item.key}
                    item={item}
                    onChange={(next) =>
                      setConfig((current) =>
                        current
                          ? {
                              ...current,
                              navItems: current.navItems.map((navItem, navIndex) => (navIndex === index ? next : navItem)),
                            }
                          : current,
                      )
                    }
                  />
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">默认调度策略</p>
              <select
                className="mt-3 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 outline-none"
                value={config.defaultRouteMode}
                onChange={(event) =>
                  setConfig((current) => (current ? { ...current, defaultRouteMode: event.target.value as FrontendConfig["defaultRouteMode"] } : current))
                }
              >
                {["balanced", "quality", "fast", "cheap", "stable"].map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid content-start gap-3">
            {config.capabilityMenu.map((item, index) => (
              <CapabilityItemEditor
                key={item.key}
                item={item}
                models={models}
                onChange={(next) =>
                  setConfig((current) =>
                    current
                      ? {
                          ...current,
                          capabilityMenu: current.capabilityMenu.map((capability, capabilityIndex) => (capabilityIndex === index ? next : capability)),
                        }
                      : current,
                  )
                }
              />
            ))}
          </div>
        </div>
      )}
      {config && (
        <details className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <summary className="cursor-pointer text-sm font-black text-slate-700">查看配置 JSON</summary>
          <pre className="mt-3 max-h-80 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-50">{JSON.stringify(config, null, 2)}</pre>
        </details>
      )}
      <p className="mt-3 text-sm font-semibold text-slate-500">{status}</p>
    </section>
  );
}

function PlatformModelsPanel() {
  const [models, setModels] = useState<Awaited<ReturnType<typeof listRemotePlatformModels>>>([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState<PlatformModelUpsert | null>(null);
  const [status, setStatus] = useState("正在读取平台模型...");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listRemotePlatformModels(localPlatformModels)
      .then((items) => {
        if (cancelled) return;
        setModels(items);
        const first = items[0];
        if (first) {
          setSelectedId(first.id);
          setForm(platformModelToUpsert(first));
        }
        setStatus("平台模型、展示名称、分类、参数 schema 都从这里维护。");
      })
      .catch((error) => {
        if (!cancelled) setStatus(error instanceof Error ? error.message : "读取平台模型失败。");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedModel = useMemo(() => models.find((model) => model.id === selectedId), [models, selectedId]);

  const selectModel = (id: string) => {
    const next = models.find((model) => model.id === id);
    setSelectedId(id);
    if (next) setForm(platformModelToUpsert(next));
  };

  const save = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const saved = await upsertRemotePlatformModel(form, selectedId);
      setStatus(`已保存平台模型：${saved.name}`);
      const refreshed = await listRemotePlatformModels(localPlatformModels);
      setModels(refreshed);
      setSelectedId(saved.id);
      const current = refreshed.find((model) => model.id === saved.id);
      if (current) setForm(platformModelToUpsert(current));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "保存平台模型失败。");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
      <PanelHeader
        title="平台模型"
        desc="先定义给用户看的平台模型，再通过渠道映射到供应商 endpoint。"
        actionLabel={saving ? "保存中..." : "保存模型"}
        disabled={saving || !selectedModel || !form}
        onAction={save}
      />
      <div className="mt-5 grid gap-4 xl:grid-cols-[280px_1fr]">
        <div className="grid content-start gap-2">
          {models.map((model) => (
            <button
              key={model.id}
              className={cn(
                "rounded-2xl border p-3 text-left transition",
                selectedId === model.id ? "border-sky-300 bg-sky-50 text-sky-800" : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-white",
              )}
              type="button"
              onClick={() => selectModel(model.id)}
            >
              <span className="block text-sm font-black">{model.name}</span>
              <span className="mt-1 block text-xs font-semibold">{model.id}</span>
            </button>
          ))}
        </div>
        {form && <PlatformModelEditor form={form} onChange={setForm} />}
      </div>
      {form && (
        <details className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <summary className="cursor-pointer text-sm font-black text-slate-700">查看模型 JSON</summary>
          <pre className="mt-3 max-h-80 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-50">{JSON.stringify(form, null, 2)}</pre>
        </details>
      )}
      <p className="mt-3 text-sm font-semibold text-slate-500">{status}</p>
    </section>
  );
}

function ChannelRoutesPanel() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [models, setModels] = useState<PlatformModel[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [providerModels, setProviderModels] = useState<ProviderModel[]>([]);
  const [draft, setDraft] = useState<ChannelCreate>({
    platform_model_id: "",
    provider_id: "",
    provider_model_id: "",
    role: "primary",
    status: "active",
    weight: 50,
    priority: 5,
    cost_price: 0,
    sale_price: 0,
    billing_unit: "request",
    latency: 10,
    success_rate: 95,
  });
  const [status, setStatus] = useState("正在读取渠道配置...");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [nextModels, nextProviders, nextProviderModels, nextChannels] = await Promise.all([
      listRemotePlatformModels(localPlatformModels),
      listRemoteProviders(),
      listRemoteProviderModels(),
      listRemoteChannels(),
    ]);
    setModels(nextModels);
    setProviders(nextProviders);
    setProviderModels(nextProviderModels);
    setChannels(nextChannels);
    setDraft((current) => ({
      ...current,
      platform_model_id: current.platform_model_id || nextModels[0]?.id || "",
      provider_id: current.provider_id || nextProviders[0]?.id || "",
      provider_model_id: current.provider_model_id || nextProviderModels[0]?.id || "",
    }));
    setStatus("渠道决定平台模型如何映射到供应商 endpoint，可直接影响前台生成任务。");
  };

  useEffect(() => {
    let cancelled = false;
    load().catch((error) => {
      if (!cancelled) setStatus(error instanceof Error ? error.message : "读取渠道配置失败。");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const saveDraft = async () => {
    setSaving(true);
    try {
      const channel = await createRemoteChannel(draft);
      setStatus(`已创建渠道：${channel.id}`);
      await load();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "创建渠道失败。");
    } finally {
      setSaving(false);
    }
  };

  const patchChannel = async (channelId: string, patch: ChannelPatch) => {
    try {
      const updated = await updateRemoteChannel(channelId, patch);
      setChannels((current) => current.map((channel) => (channel.id === channelId ? updated : channel)));
      setStatus(`已更新渠道：${updated.id}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "更新渠道失败。");
    }
  };

  const saveMapping = async (channelId: string, mapping: ChannelMappingUpsert) => {
    try {
      const updated = await upsertRemoteChannelMapping(channelId, mapping);
      setChannels((current) => current.map((channel) => (channel.id === channelId ? updated : channel)));
      setStatus(`已保存映射：${mapping.platform_param_key}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "保存映射失败。");
    }
  };

  const providerModelOptions = providerModels.filter((model) => !draft.provider_id || model.providerId === draft.provider_id);

  return (
    <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm">
      <PanelHeader
        title="渠道映射"
        desc="按“平台模型 → 供应商模型 → 渠道/endpoint → 参数映射”管理前台真实调用链路。"
        actionLabel={saving ? "创建中..." : "创建渠道"}
        disabled={saving || !draft.platform_model_id || !draft.provider_id || !draft.provider_model_id}
        onAction={saveDraft}
      />

      <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-black text-slate-950">新建渠道</p>
        <div className="mt-3 grid gap-3 lg:grid-cols-4">
          <SelectField label="平台模型" value={draft.platform_model_id} options={models.map((model) => ({ label: model.name, value: model.id }))} onChange={(value) => setDraft((current) => ({ ...current, platform_model_id: value }))} />
          <SelectField
            label="供应商"
            value={draft.provider_id}
            options={providers.map((provider) => ({ label: provider.name, value: provider.id }))}
            onChange={(value) =>
              setDraft((current) => ({
                ...current,
                provider_id: value,
                provider_model_id: providerModels.find((model) => model.providerId === value)?.id ?? "",
              }))
            }
          />
          <SelectField label="供应商模型" value={draft.provider_model_id} options={providerModelOptions.map((model) => ({ label: model.upstreamModelName, value: model.id }))} onChange={(value) => setDraft((current) => ({ ...current, provider_model_id: value }))} />
          <SelectField label="渠道角色" value={draft.role ?? "primary"} options={["primary", "backup", "cheap", "fast", "quality"].map((role) => ({ label: role, value: role }))} onChange={(value) => setDraft((current) => ({ ...current, role: value as Channel["role"] }))} />
          <SelectField label="状态" value={draft.status ?? "active"} options={["active", "degraded", "disabled"].map((item) => ({ label: item, value: item }))} onChange={(value) => setDraft((current) => ({ ...current, status: value as Channel["status"] }))} />
          <NumberField label="权重" value={draft.weight ?? 50} onChange={(value) => setDraft((current) => ({ ...current, weight: value }))} />
          <NumberField label="成本价" value={draft.cost_price ?? 0} onChange={(value) => setDraft((current) => ({ ...current, cost_price: value }))} />
          <NumberField label="售价" value={draft.sale_price ?? 0} onChange={(value) => setDraft((current) => ({ ...current, sale_price: value }))} />
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        {channels.map((channel) => (
          <ChannelEditor
            key={channel.id}
            channel={channel}
            models={models}
            providers={providers}
            providerModels={providerModels}
            onPatch={(patch) => patchChannel(channel.id, patch)}
            onSaveMapping={(mapping) => saveMapping(channel.id, mapping)}
          />
        ))}
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-500">{status}</p>
    </section>
  );
}

function NavItemEditor({ item, onChange }: { item: FrontendNavItem; onChange: (item: FrontendNavItem) => void }) {
  return (
    <div className="grid gap-2 rounded-2xl bg-white p-3 shadow-sm sm:grid-cols-[1fr_auto_auto] sm:items-center">
      <label className="grid gap-1">
        <span className="text-xs font-black text-slate-400">{item.key}</span>
        <input
          className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-black text-slate-700 outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
          value={item.label}
          onChange={(event) => onChange({ ...item, label: event.target.value })}
        />
      </label>
      <label className="grid gap-1">
        <span className="text-xs font-black text-slate-400">排序</span>
        <input
          className="h-10 w-24 rounded-xl border border-slate-200 px-3 text-sm font-black text-slate-700 outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
          type="number"
          value={item.sortOrder}
          onChange={(event) => onChange({ ...item, sortOrder: Number(event.target.value) })}
        />
      </label>
      <Toggle checked={item.visible} label="显示" onChange={(visible) => onChange({ ...item, visible })} />
    </div>
  );
}

function CapabilityItemEditor({
  item,
  models,
  onChange,
}: {
  item: CapabilityMenuItem;
  models: Awaited<ReturnType<typeof listRemotePlatformModels>>;
  onChange: (item: CapabilityMenuItem) => void;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-xs font-black text-slate-400">能力名称</span>
            <input
              className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-black text-slate-700 outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              value={item.label}
              onChange={(event) => onChange({ ...item, label: event.target.value })}
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-black text-slate-400">图标</span>
            <select
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              value={item.icon}
              onChange={(event) => onChange({ ...item, icon: event.target.value as CapabilityMenuItem["icon"] })}
            >
              {["sparkles", "image", "video", "file-text", "audio", "bot", "workflow", "office"].map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
          </label>
        </div>
        <Toggle checked={item.visible} label="前台显示" onChange={(visible) => onChange({ ...item, visible })} />
      </div>

      <label className="mt-3 grid gap-1">
        <span className="text-xs font-black text-slate-400">说明</span>
        <textarea
          className="min-h-20 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold leading-6 text-slate-700 outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
          value={item.description}
          onChange={(event) => onChange({ ...item, description: event.target.value })}
        />
      </label>

      <div className="mt-3 grid gap-2">
        <p className="text-xs font-black text-slate-400">关联平台模型</p>
        <div className="flex flex-wrap gap-2">
          {models.map((model) => {
            const checked = item.modelIds.includes(model.id);
            return (
              <button
                key={model.id}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-black transition",
                  checked ? "border-sky-300 bg-sky-50 text-sky-700" : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-white",
                )}
                type="button"
                onClick={() =>
                  onChange({
                    ...item,
                    modelIds: checked ? item.modelIds.filter((id) => id !== model.id) : [...item.modelIds, model.id],
                  })
                }
              >
                {model.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PlatformModelEditor({ form, onChange }: { form: PlatformModelUpsert; onChange: (form: PlatformModelUpsert) => void }) {
  const updateField = <Key extends keyof PlatformModelUpsert>(key: Key, value: PlatformModelUpsert[Key]) => {
    onChange({ ...form, [key]: value });
  };

  return (
    <div className="grid gap-4">
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div className="grid gap-3 lg:grid-cols-2">
          <TextField label="模型 ID" value={form.id ?? ""} onChange={(value) => updateField("id", value)} />
          <TextField label="前台展示名" value={form.name} onChange={(value) => updateField("name", value)} />
          <TextField label="短名称" value={form.short_name} onChange={(value) => updateField("short_name", value)} />
          <label className="grid gap-1">
            <span className="text-xs font-black text-slate-400">模型分类</span>
            <select
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              value={form.modality}
              onChange={(event) => updateField("modality", event.target.value as PlatformModelUpsert["modality"])}
            >
              {["image", "video", "chat", "audio", "workflow"].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-black text-slate-400">套餐层级</span>
            <select
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
              value={form.tier}
              onChange={(event) => updateField("tier", event.target.value as PlatformModelUpsert["tier"])}
            >
              {["lite", "standard", "pro", "ultra", "Lite", "Standard", "Pro", "Ultra"].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <TextField label="预计消耗" value={form.estimated_cost} onChange={(value) => updateField("estimated_cost", value)} />
          <TextField label="预计时间" value={form.estimated_time} onChange={(value) => updateField("estimated_time", value)} />
          <TextField label="使用场景（逗号分隔）" value={form.use_cases.join("，")} onChange={(value) => updateField("use_cases", splitList(value))} />
        </div>
        <label className="mt-3 grid gap-1">
          <span className="text-xs font-black text-slate-400">前台说明</span>
          <textarea
            className="min-h-24 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold leading-6 text-slate-700 outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
          />
        </label>
        <div className="mt-3 flex flex-wrap gap-3">
          <Toggle checked={form.visible} label="前台可见" onChange={(visible) => updateField("visible", visible)} />
          <Toggle checked={form.recommended} label="推荐" onChange={(recommended) => updateField("recommended", recommended)} />
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-slate-950">参数配置</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">前台创作表单会按这些参数实时渲染。</p>
          </div>
          <button
            className="h-9 rounded-full bg-slate-950 px-3 text-xs font-black text-white"
            type="button"
            onClick={() =>
              updateField("schema", [
                ...(form.schema ?? []),
                { key: `param_${(form.schema ?? []).length + 1}`, label: "新参数", type: "text", required: false },
              ])
            }
          >
            新增参数
          </button>
        </div>
        <div className="mt-4 grid gap-3">
          {(form.schema ?? []).map((field, index) => (
            <SchemaFieldEditor
              key={`${field.key}-${index}`}
              field={field}
              onChange={(next) => updateField("schema", (form.schema ?? []).map((item, itemIndex) => (itemIndex === index ? next : item)))}
              onRemove={() => updateField("schema", (form.schema ?? []).filter((_, itemIndex) => itemIndex !== index))}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ChannelEditor({
  channel,
  models,
  providers,
  providerModels,
  onPatch,
  onSaveMapping,
}: {
  channel: Channel;
  models: PlatformModel[];
  providers: Provider[];
  providerModels: ProviderModel[];
  onPatch: (patch: ChannelPatch) => void;
  onSaveMapping: (mapping: ChannelMappingUpsert) => void;
}) {
  const model = models.find((item) => item.id === channel.platformModelId);
  const provider = providers.find((item) => item.id === channel.providerId);
  const providerModel = providerModels.find((item) => item.id === channel.providerModelId || item.upstreamModelName === channel.providerModel || item.id === channel.providerModel);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-sm font-black text-slate-950">{channel.id}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {model?.name ?? channel.platformModelId} → {provider?.name ?? channel.providerId} / {providerModel?.upstreamModelName ?? channel.providerModel}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-5">
          <SelectField label="状态" value={channel.status} options={["active", "degraded", "disabled"].map((item) => ({ label: item, value: item }))} onChange={(value) => onPatch({ status: value as Channel["status"] })} />
          <SelectField label="角色" value={channel.role} options={["primary", "backup", "cheap", "fast", "quality"].map((item) => ({ label: item, value: item }))} onChange={(value) => onPatch({ role: value as Channel["role"] })} />
          <NumberField label="权重" value={channel.weight} onChange={(value) => onPatch({ weight: value })} />
          <NumberField label="成本价" value={Number(channel.cost) || 0} onChange={(value) => onPatch({ cost_price: value })} />
          <NumberField label="售价" value={Number(channel.sale) || 0} onChange={(value) => onPatch({ sale_price: value })} />
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-3">
        <p className="text-xs font-black text-slate-400">支持参数</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {channel.supports.map((item) => (
            <span key={item} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-500 shadow-sm">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-black text-slate-950">参数映射</p>
          <button
            className="h-8 rounded-full bg-slate-950 px-3 text-xs font-black text-white"
            type="button"
            onClick={() => onSaveMapping({ platform_param_key: "new_param", upstream_param_key: "new_param", transform: "direct" })}
          >
            新增映射
          </button>
        </div>
        {channel.paramMap.map((mapping, index) => (
          <MappingEditor key={`${mapping.platform}-${index}`} mapping={mapping} onSave={onSaveMapping} />
        ))}
      </div>
    </div>
  );
}

function MappingEditor({
  mapping,
  onSave,
}: {
  mapping: Channel["paramMap"][number];
  onSave: (mapping: ChannelMappingUpsert) => void;
}) {
  const [draft, setDraft] = useState<ChannelMappingUpsert>({
    platform_param_key: mapping.platform,
    upstream_param_key: mapping.upstream,
    transform: mapping.transform,
    note: mapping.note,
    value_map: mapping.valueMap,
    default_value: mapping.defaultValue,
  });

  useEffect(() => {
    setDraft({
      platform_param_key: mapping.platform,
      upstream_param_key: mapping.upstream,
      transform: mapping.transform,
      note: mapping.note,
      value_map: mapping.valueMap,
      default_value: mapping.defaultValue,
    });
  }, [mapping]);

  return (
    <div className="grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[1fr_1fr_150px_1fr_auto] lg:items-end">
      <TextField label="平台参数" value={draft.platform_param_key} onChange={(value) => setDraft((current) => ({ ...current, platform_param_key: value }))} />
      <TextField label="上游参数" value={draft.upstream_param_key ?? ""} onChange={(value) => setDraft((current) => ({ ...current, upstream_param_key: value }))} />
      <SelectField
        label="转换"
        value={draft.transform}
        options={["direct", "map", "default", "omit", "template"].map((item) => ({ label: item, value: item }))}
        onChange={(value) => setDraft((current) => ({ ...current, transform: value as ChannelMappingUpsert["transform"] }))}
      />
      <TextField label="默认值" value={draft.default_value === undefined ? "" : String(draft.default_value)} onChange={(value) => setDraft((current) => ({ ...current, default_value: value }))} />
      <button className="h-10 rounded-xl bg-sky-100 px-3 text-xs font-black text-sky-700" type="button" onClick={() => onSave(draft)}>
        保存
      </button>
    </div>
  );
}

function SchemaFieldEditor({
  field,
  onChange,
  onRemove,
}: {
  field: NonNullable<PlatformModelUpsert["schema"]>[number];
  onChange: (field: NonNullable<PlatformModelUpsert["schema"]>[number]) => void;
  onRemove: () => void;
}) {
  const optionsText = Array.isArray(field.options)
    ? field.options.map((option) => (typeof option === "string" ? option : `${option.label}:${option.value}`)).join("，")
    : "";

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="grid gap-2 lg:grid-cols-[1fr_1fr_150px_1fr_auto] lg:items-end">
        <TextField label="参数 key" value={field.key} onChange={(value) => onChange({ ...field, key: value })} />
        <TextField label="前台名称" value={field.label} onChange={(value) => onChange({ ...field, label: value })} />
        <label className="grid gap-1">
          <span className="text-xs font-black text-slate-400">控件类型</span>
          <select
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 outline-none"
            value={field.type}
            onChange={(event) => onChange({ ...field, type: event.target.value as NonNullable<PlatformModelUpsert["schema"]>[number]["type"] })}
          >
            {["textarea", "text", "select", "segmented", "slider", "file", "switch"].map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <TextField label="默认值" value={String(field.defaultValue ?? field.value ?? "")} onChange={(value) => onChange({ ...field, defaultValue: coerceFieldValue(field.type, value), value: coerceFieldValue(field.type, value) })} />
        <button className="h-10 rounded-xl bg-rose-50 px-3 text-xs font-black text-rose-600" type="button" onClick={onRemove}>
          删除
        </button>
      </div>
      <div className="mt-2 grid gap-2 lg:grid-cols-[1fr_100px_100px_100px_auto_auto] lg:items-end">
        <TextField label="选项（label:value，逗号分隔）" value={optionsText} onChange={(value) => onChange({ ...field, options: parseOptions(value) })} />
        <TextField label="最小值" value={field.min === undefined ? "" : String(field.min)} onChange={(value) => onChange({ ...field, min: value === "" ? undefined : Number(value) })} />
        <TextField label="最大值" value={field.max === undefined ? "" : String(field.max)} onChange={(value) => onChange({ ...field, max: value === "" ? undefined : Number(value) })} />
        <TextField label="步长" value={field.step === undefined ? "" : String(field.step)} onChange={(value) => onChange({ ...field, step: value === "" ? undefined : Number(value) })} />
        <Toggle checked={Boolean(field.required)} label="必填" onChange={(required) => onChange({ ...field, required })} />
        <Toggle checked={Boolean(field.advanced)} label="高级" onChange={(advanced) => onChange({ ...field, advanced })} />
      </div>
      <TextField label="提示文案" value={field.placeholder ?? ""} onChange={(value) => onChange({ ...field, placeholder: value })} />
    </div>
  );
}

function PanelHeader({
  actionLabel,
  desc,
  disabled,
  onAction,
  title,
}: {
  actionLabel: string;
  desc: string;
  disabled?: boolean;
  onAction: () => void;
  title: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-lg font-black text-slate-950">{title}</p>
        <p className="mt-1 text-sm font-semibold text-slate-500">{desc}</p>
      </div>
      <button
        className="inline-flex h-10 items-center justify-center rounded-full bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        disabled={disabled}
        onClick={onAction}
      >
        {actionLabel}
      </button>
    </div>
  );
}

function TextField({ label, onChange, value }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-black text-slate-400">{label}</span>
      <input
        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function SelectField({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-black text-slate-400">{label}</span>
      <select
        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberField({ label, onChange, value }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-black text-slate-400">{label}</span>
      <input
        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-700 outline-none focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-xl px-3 text-xs font-black transition",
        checked ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500 hover:bg-white",
      )}
      type="button"
      onClick={() => onChange(!checked)}
    >
      {label}
    </button>
  );
}

function platformModelToUpsert(model: Awaited<ReturnType<typeof listRemotePlatformModels>>[number]): PlatformModelUpsert {
  return {
    id: model.id,
    name: model.name,
    short_name: model.shortName,
    modality: model.modality,
    tier: model.tier,
    description: model.description,
    use_cases: model.useCases,
    visible: true,
    recommended: Boolean(model.recommended),
    estimated_cost: model.price,
    estimated_time: model.eta,
    sort_order: 10,
    schema: model.schema,
  };
}

function splitList(value: string) {
  return value
    .split(/[，,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseOptions(value: string) {
  return splitList(value).map((item) => {
    const [label, rawValue] = item.split(":");
    const optionValue = rawValue ?? label;
    return {
      label: label.trim(),
      value: optionValue.trim(),
    };
  });
}

function coerceFieldValue(type: string, value: string) {
  if (type === "switch") {
    return value === "true";
  }

  if (type === "slider" && value !== "") {
    return Number(value);
  }

  return value;
}
