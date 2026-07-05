import { Bell, CreditCard, Sparkles } from "lucide-react";
import type { AccountSection, AppRoute, FrontendNavItem, UserProfile } from "../types";
import { cn } from "../lib";
import { TokenBadge } from "./TokenBadge";
import { UserMenu } from "./UserMenu";

type TopNavProps = {
  navItems: FrontendNavItem[] | null;
  route: AppRoute;
  user: UserProfile;
  onNavigate: (route: AppRoute, section?: AccountSection) => void;
};

export function TopNav({ navItems, route, user, onNavigate }: TopNavProps) {
  const visibleNavItems =
    navItems?.filter((item) => item.visible).sort((a, b) => a.sortOrder - b.sortOrder) ??
    ([
      { key: "workspace", label: "创作工作台", visible: true, sortOrder: 10 },
      { key: "explore", label: "探索/市场", visible: true, sortOrder: 20 },
      { key: "library", label: "作品库", visible: true, sortOrder: 30 },
    ] satisfies FrontendNavItem[]);

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-white/70 bg-[#f8faf7]/80 backdrop-blur-2xl">
      <div className="mx-auto flex h-full max-w-[1500px] items-center justify-between gap-3 px-4 sm:px-6">
        <button
          className="flex min-w-0 items-center gap-2 rounded-full px-2 py-1 text-left transition hover:bg-white/70"
          type="button"
          onClick={() => onNavigate("workspace")}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-950 text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="hidden text-sm font-black tracking-normal text-slate-950 sm:block">Tikpan AI</span>
        </button>

        <nav className="flex shrink-0 rounded-full border border-slate-200/70 bg-white/70 p-1 shadow-sm">
          {visibleNavItems.map((item) => (
            <button
              key={item.key}
              className={cn(
                "h-9 rounded-full px-3 text-sm font-bold transition sm:px-5",
                route === item.key ? "bg-slate-950 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
              )}
              type="button"
              onClick={() => onNavigate(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex min-w-0 items-center justify-end gap-2">
          <button
            aria-label="通知"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-slate-200/70 bg-white/75 text-slate-600 shadow-sm transition hover:border-teal-200 hover:text-teal-700"
            type="button"
          >
            <Bell className="h-4 w-4" />
          </button>
          <TokenBadge tokens={user.tokens} />
          <button
            className="hidden h-10 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-teal-600 md:inline-flex"
            type="button"
            onClick={() => onNavigate("account", "assets")}
          >
            <CreditCard className="h-4 w-4" />
            充值
          </button>
          <UserMenu user={user} onNavigate={onNavigate} />
        </div>
      </div>
    </header>
  );
}
