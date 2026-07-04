import { History, Image, Plus, Search, Video } from "lucide-react";
import type { CapabilityCategory, CreativeModel } from "../../types";
import { currentUser } from "../../appData";
import { cn, formatTokens } from "../../lib";
import { ModelCard } from "./ModelCard";

type WorkspaceSidebarProps = {
  category: CapabilityCategory;
  query: string;
  selectedModelId: string;
  tabs: Array<{ key: CapabilityCategory; label: string }>;
  models: CreativeModel[];
  onCategoryChange: (category: CapabilityCategory) => void;
  onModelSelect: (model: CreativeModel) => void;
  onQueryChange: (value: string) => void;
};

export function WorkspaceSidebar({
  category,
  query,
  selectedModelId,
  tabs,
  models,
  onCategoryChange,
  onModelSelect,
  onQueryChange,
}: WorkspaceSidebarProps) {
  const grouped = models.reduce<Record<string, CreativeModel[]>>((acc, model) => {
    acc[model.group] = acc[model.group] ?? [];
    acc[model.group].push(model);
    return acc;
  }, {});

  return (
    <div className="sticky top-16 flex h-[calc(100vh-64px)] flex-col gap-4 overflow-hidden p-4">
      <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 text-sm font-black text-white shadow-sm transition hover:bg-slate-950" type="button">
        <Plus className="h-4 w-4" />
        新建任务
      </button>

      <div className="grid grid-cols-2 gap-2">
        {[
          { key: "image" as const, label: "图片模型", icon: Image },
          { key: "video" as const, label: "视频模型", icon: Video },
        ].map((item) => {
          const Icon = item.icon;
          const active = category === item.key;

          return (
            <button
              key={item.key}
              aria-pressed={active}
              className={cn(
                "flex h-12 items-center justify-center gap-2 rounded-xl border text-sm font-black shadow-sm transition",
                active
                  ? "border-violet-200 bg-violet-100/80 text-violet-700"
                  : "border-transparent bg-white/70 text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-950",
              )}
              type="button"
              onClick={() => onCategoryChange(item.key)}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={cn(
              "h-8 rounded-lg px-2.5 text-xs font-black transition",
              category === tab.key ? "bg-violet-100 text-violet-700" : "text-slate-500 hover:bg-white/80 hover:text-slate-950",
            )}
            type="button"
            onClick={() => onCategoryChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          className="h-11 w-full rounded-xl border border-slate-200 bg-white/80 pl-9 pr-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-300 focus:ring-4 focus:ring-teal-100"
          placeholder="搜索图片或视频模型..."
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {Object.entries(grouped).map(([group, groupModels]) => (
          <div key={group} className="mb-4">
            <p className="mb-2 px-1 text-xs font-black text-slate-400">{group}</p>
            <div className="grid gap-2">
              {groupModels.map((model) => (
                <ModelCard key={model.id} active={model.id === selectedModelId} model={model} onSelect={() => onModelSelect(model)} />
              ))}
            </div>
          </div>
        ))}
        {models.length === 0 && (
          <div className="rounded-2xl border border-dashed border-violet-200 bg-white/65 p-4 text-center text-sm font-bold leading-6 text-slate-500">
            这个分类还没有模型。后续可在后台新增分类下的模型、参数和调用配置。
          </div>
        )}
      </div>

      <div className="grid gap-2">
        <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/75 px-3 py-3 text-sm font-bold text-slate-600 shadow-sm transition hover:border-violet-200 hover:text-violet-700" type="button">
          <History className="h-4 w-4" />
          历史记录
        </button>
        <div className="flex items-center justify-between gap-3 rounded-xl bg-white/80 p-3 shadow-sm">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-teal-500 text-xs font-black text-white">
              {currentUser.initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-950">{currentUser.name}</p>
              <p className="truncate text-xs font-bold text-amber-600">{formatTokens(currentUser.tokens)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
