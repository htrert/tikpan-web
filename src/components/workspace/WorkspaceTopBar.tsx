import { Bell, CreditCard, Search, Sparkles } from "lucide-react";
import type { CreativeModel, UserProfile } from "../../types";
import { TokenBadge } from "../TokenBadge";

export function WorkspaceTopBar({ model, user }: { model: CreativeModel; user: UserProfile }) {
  return (
    <div className="sticky top-16 z-20 -mx-1 mb-4 rounded-3xl border border-white/80 bg-white/82 px-4 py-3 shadow-sm backdrop-blur-2xl lg:top-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black text-slate-400">创作工作台 · {model.name}</p>
          <p className="mt-1 truncate text-sm font-black text-slate-950">今天想创作什么？</p>
        </div>

        <label className="relative min-w-0 flex-1 xl:max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="h-11 w-full rounded-full border border-slate-200 bg-white/85 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
            placeholder="搜索模型、智能体、页面和操作..."
          />
        </label>

        <div className="flex shrink-0 items-center gap-2">
          <button className="hidden h-10 items-center gap-2 rounded-full bg-violet-100 px-4 text-sm font-black text-violet-700 md:inline-flex" type="button">
            <Sparkles className="h-4 w-4" />
            AI 工作台
          </button>
          <TokenBadge tokens={user.tokens} />
          <button className="inline-flex h-10 items-center gap-2 rounded-full bg-teal-50 px-4 text-sm font-black text-teal-700 shadow-sm transition hover:bg-teal-100" type="button">
            <CreditCard className="h-4 w-4" />
            充值
          </button>
          <button aria-label="通知" className="grid h-10 w-10 place-items-center rounded-full bg-white text-slate-500 shadow-sm" type="button">
            <Bell className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
