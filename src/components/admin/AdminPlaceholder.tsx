import { ArrowLeft, Bell, ChevronDown, CircleDollarSign, FileText, Grid2X2, Home, KeyRound, LayoutDashboard, LockKeyhole, MessageSquare, Moon, ReceiptText, Search, Settings, ShieldCheck, Sparkles, Ticket, UsersRound, WalletCards } from "lucide-react";
import { useState } from "react";
import { adminModelProviders, adminNavGroups, adminProfile, adminRecentLogs } from "../../adminData";
import type { AccountSection, AppRoute, UserProfile } from "../../types";
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
