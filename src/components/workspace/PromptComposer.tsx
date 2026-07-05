import { Boxes, FolderHeart, ImagePlus, Loader2, SendHorizontal, SlidersHorizontal, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import type { CreativeControl, CreativeModel } from "../../types";
import type { StudioInput } from "../../orchestrator";
import { cn, formatTokens } from "../../lib";

type ParamValue = string | number | boolean;

function defaultValuesFor(model: CreativeModel) {
  return model.controls.reduce<Record<string, ParamValue>>((acc, parameter) => {
    if (parameter.defaultValue !== undefined) {
      acc[parameter.key] = parameter.defaultValue;
      return acc;
    }
    if (parameter.type === "switch") acc[parameter.key] = false;
    if (parameter.type === "number" || parameter.type === "slider") acc[parameter.key] = parameter.min ?? 0;
    if ((parameter.type === "select" || parameter.type === "segmented") && parameter.options?.[0]) {
      acc[parameter.key] = parameter.options[0].value;
    }
    return acc;
  }, {});
}

export function PromptComposer({
  initialPrompt,
  model,
  onGenerate,
}: {
  initialPrompt: string;
  model: CreativeModel;
  onGenerate: (input: StudioInput) => Promise<void>;
}) {
  const [prompt, setPrompt] = useState("");
  const [paramValues, setParamValues] = useState<Record<string, ParamValue>>(() => defaultValuesFor(model));
  const [smartSchedule, setSmartSchedule] = useState(true);
  const [showParameters, setShowParameters] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
  }, [initialPrompt]);

  useEffect(() => {
    setParamValues(defaultValuesFor(model));
    setPrompt("");
  }, [model.id]);

  const updateParam = (key: string, value: ParamValue) => {
    setParamValues((current) => ({ ...current, [key]: value }));
  };

  const handleGenerate = async () => {
    const text = prompt.trim() || "一张干净高级的商品视觉，突出产品质感和核心卖点。";
    const promptKey = model.controls.find((parameter) => parameter.type === "textarea" && parameter.required)?.key ?? "prompt";
    const input: StudioInput = {
      ...paramValues,
      [promptKey]: text,
    };

    setGenerating(true);
    try {
      await onGenerate(input);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="sticky bottom-4 z-20 mx-auto w-full max-w-6xl rounded-3xl border border-violet-100 bg-white/94 p-3 shadow-[0_18px_70px_rgba(80,56,140,0.14)] backdrop-blur-2xl">
      <div className="mb-2 flex flex-wrap items-center gap-2 px-2">
        <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-700 shadow-sm">{model.name}</span>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-500">{model.controls.length} 项创作设置 · 预计 {formatTokens(model.cost)}</span>
      </div>
      <div className="rounded-2xl border border-slate-200/70 bg-white p-3">
        <textarea
          className="min-h-16 w-full resize-none border-0 bg-transparent p-1 text-base font-semibold leading-7 text-slate-800 outline-none placeholder:text-slate-400"
          placeholder="描述你的画面、商品、场景或风格..."
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />

        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="grid gap-2">
            <div className="flex flex-wrap gap-2">
              <ComposerAction icon={Zap} label="自动优化" active={smartSchedule} onClick={() => setSmartSchedule((current) => !current)} />
              <ComposerAction icon={ImagePlus} label="附件 0/10" />
              <ComposerAction icon={Boxes} label="收藏夹" />
              <ComposerAction icon={FolderHeart} label="增强提示" />
              <ComposerAction icon={SlidersHorizontal} label="创作设置" active={showParameters} onClick={() => setShowParameters((current) => !current)} />
            </div>
            {showParameters && (
              <div className="grid max-h-[34vh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-4">
                {model.controls
                  .filter((parameter) => parameter.key !== "prompt")
                  .map((parameter) => (
                    <ParameterControl key={parameter.key} parameter={parameter} value={paramValues[parameter.key]} onChange={(value) => updateParam(parameter.key, value)} />
                  ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 lg:items-end">
            <div className="flex flex-col gap-1 sm:items-end">
              <p className="text-xs font-semibold text-slate-500">预估消耗 {formatTokens(model.cost)}，失败或取消自动退回。</p>
              <button
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-white shadow-[0_16px_35px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-70"
                type="button"
                disabled={generating}
                onClick={handleGenerate}
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComposerAction({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active?: boolean;
  icon: typeof Zap;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-full px-3 text-xs font-black transition",
        active ? "bg-violet-50 text-violet-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
      )}
      type="button"
      onClick={onClick}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function ParameterControl({
  parameter,
  value,
  onChange,
}: {
  parameter: CreativeControl;
  value: ParamValue | undefined;
  onChange: (value: ParamValue) => void;
}) {
  const label = (
    <div className="flex items-center justify-between gap-2">
      <span className="truncate text-xs font-black text-slate-500">{parameter.label}</span>
      {parameter.advanced && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-400">更多</span>}
    </div>
  );

  const helper = parameter.helper ? <p className="truncate text-[11px] font-semibold text-slate-400" title={parameter.helper}>{parameter.helper}</p> : null;

  if (parameter.type === "switch") {
    return (
      <div className="grid gap-2 rounded-xl bg-slate-50/80 p-2.5">
        {label}
        <button
          className={cn(
            "h-9 rounded-lg px-3 text-xs font-black transition",
            value ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-500 hover:bg-white hover:text-slate-800",
          )}
          type="button"
          onClick={() => onChange(!value)}
        >
          {value ? "开启" : "关闭"}
        </button>
        {helper}
      </div>
    );
  }

  if (parameter.type === "slider" || parameter.type === "number") {
    const numericValue = Number(value ?? parameter.defaultValue ?? parameter.min ?? 0);
    return (
      <div className="grid gap-2 rounded-xl bg-slate-50/80 p-2.5">
        {label}
        <div className="flex items-center gap-2">
          <input
            className="h-9 w-24 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
            max={parameter.max}
            min={parameter.min}
            step={parameter.step ?? 1}
            type="number"
            value={numericValue}
            onChange={(event) => onChange(Number(event.target.value))}
          />
          {parameter.type === "slider" && (
            <input
              className="h-8 min-w-0 flex-1 accent-violet-700"
              max={parameter.max}
              min={parameter.min}
              step={parameter.step ?? 1}
              type="range"
              value={numericValue}
              onChange={(event) => onChange(Number(event.target.value))}
            />
          )}
        </div>
        {parameter.type === "slider" && (
          helper
        )}
      </div>
    );
  }

  if (parameter.type === "select") {
    return (
      <div className="grid gap-2 rounded-xl bg-slate-50/80 p-2.5">
        {label}
        <select
          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
          value={String(value ?? parameter.defaultValue ?? "")}
          onChange={(event) => onChange(event.target.value)}
        >
          {parameter.options?.map((option) => (
            <option key={String(option.value)} value={String(option.value)}>
              {option.label}
            </option>
          ))}
        </select>
        {helper}
      </div>
    );
  }

  if (parameter.type === "text") {
    return (
      <label className="grid gap-2 rounded-xl bg-slate-50/80 p-2.5">
        {label}
        <input
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    );
  }

  if (parameter.type === "file") {
    return (
      <div className="grid gap-2 rounded-xl bg-slate-50/80 p-2.5">
        {label}
        <button
          className="h-9 rounded-lg border border-dashed border-slate-300 bg-white px-3 text-left text-xs font-black text-slate-500 transition hover:border-violet-300 hover:text-violet-700"
          type="button"
          onClick={() => onChange("")}
        >
          后台已配置文件参数，上传通道待接入
        </button>
        {helper}
      </div>
    );
  }

  return (
    <div className="grid gap-2 rounded-xl bg-slate-50/80 p-2.5">
      {label}
      <div className="flex flex-wrap gap-1.5">
        {parameter.options?.map((option) => (
          <button
            key={String(option.value)}
            className={cn(
              "h-8 rounded-lg px-3 text-xs font-black transition",
              String(option.value) === String(value ?? parameter.defaultValue ?? "") ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-500 hover:bg-white hover:text-slate-800",
            )}
            type="button"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {helper}
    </div>
  );
}
