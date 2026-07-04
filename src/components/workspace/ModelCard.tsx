import type { CreativeModel } from "../../types";
import { cn, formatTokens } from "../../lib";

export function ModelCard({ active, model, onSelect }: { active: boolean; model: CreativeModel; onSelect: () => void }) {
  const Icon = model.icon;

  return (
    <button
      className={cn(
        "w-full rounded-xl border p-3 text-left transition",
        active ? "border-violet-300 bg-white shadow-sm ring-2 ring-violet-100" : "border-slate-200/70 bg-white/75 hover:border-violet-200 hover:bg-white",
      )}
      type="button"
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", active ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-500")}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-black text-slate-950">{model.name}</span>
          <span className="mt-1 block truncate text-xs font-semibold text-slate-500">{model.description}</span>
        </span>
        <span className="shrink-0 text-xs font-black text-emerald-600">{model.health}%</span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap gap-1">
          {model.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="rounded-full bg-white px-2 py-1 text-[11px] font-black text-slate-500 shadow-sm">
              {tag}
            </span>
          ))}
        </div>
        <span className="shrink-0 text-xs font-black text-slate-500">{formatTokens(model.cost)} / 次</span>
      </div>
    </button>
  );
}
