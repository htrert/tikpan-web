import { GitBranch, Save } from "lucide-react";
import { adminParameters } from "../../../adminData";
import { GlassCard } from "../../GlassCard";

export function AdminRouting() {
  return (
    <div className="grid gap-4">
      <GlassCard className="p-5">
        <p className="text-sm font-black text-teal-700">参数映射</p>
        <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">不同上游各自映射</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
          同一个平台模型可以走多个上游渠道。某个上游不支持的参数配置为 omit；字段名不同就改映射；枚举不同就用 map。
        </p>
      </GlassCard>

      <GlassCard className="p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-700">
            <GitBranch className="h-4 w-4" />
          </span>
          <div>
            <p className="font-black text-slate-950">ch-cangyuan-gpt-image-2-4k</p>
            <p className="text-sm font-semibold text-slate-500">当前只有一条主渠道，后续可新增备用渠道。</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/78">
          <div className="hidden grid-cols-[1fr_1fr_0.8fr_1fr] bg-slate-50 px-4 py-3 text-xs font-black text-slate-400 md:grid">
            <span>平台参数</span>
            <span>上游参数</span>
            <span>转换</span>
            <span>默认值</span>
          </div>
          {adminParameters.map((parameter) => (
            <div key={parameter.key} className="grid gap-2 border-t border-slate-100 px-4 py-3 md:grid-cols-[1fr_1fr_0.8fr_1fr] md:items-center">
              <span className="font-mono text-sm font-black text-slate-900">{parameter.key}</span>
              <input className="h-9 rounded-lg border border-slate-200 bg-white px-3 font-mono text-xs font-bold text-slate-700 outline-none focus:border-violet-300" defaultValue={parameter.upstream} />
              <select className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 outline-none focus:border-violet-300" defaultValue={parameter.transform}>
                <option value="direct">direct</option>
                <option value="map">map</option>
                <option value="default">default</option>
                <option value="omit">omit</option>
                <option value="template">template</option>
              </select>
              <input className="h-9 rounded-lg border border-slate-200 bg-white px-3 font-mono text-xs font-bold text-slate-700 outline-none focus:border-violet-300" defaultValue={parameter.defaultValue} />
            </div>
          ))}
        </div>

        <button className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-violet-700 px-4 text-sm font-black text-white" type="button">
          <Save className="h-4 w-4" />
          保存映射草稿
        </button>
      </GlassCard>
    </div>
  );
}
