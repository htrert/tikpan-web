import { AnimatePresence, motion } from "framer-motion";
import { Menu, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { capabilityTabs, creativeModels, currentUser } from "../../appData";
import {
  createRemoteTaskByModelId,
  getFrontendConfig,
  getRemoteTaskRecord,
  listPublicCreativeModels,
  quoteRemoteTask,
  type RemoteTaskRecord,
} from "../../apiClient";
import { platformModels as localPlatformModels } from "../../productData";
import type { StudioInput } from "../../orchestrator";
import type { CapabilityCategory, CapabilityMenuItem, CreativeModel, FrontendConfig } from "../../types";
import { WorkspaceSidebar } from "./WorkspaceSidebar";
import { ResultPanel } from "./ResultPanel";
import { PromptComposer } from "./PromptComposer";
import { WorkspaceTopBar } from "./WorkspaceTopBar";

export function WorkspacePage({ templatePrompt }: { templatePrompt: string }) {
  const [frontendConfig, setFrontendConfig] = useState<FrontendConfig | null>(null);
  const [remoteModels, setRemoteModels] = useState<CreativeModel[]>(creativeModels);
  const [catalogError, setCatalogError] = useState("");
  const [category, setCategory] = useState<CapabilityCategory>("image");
  const [query, setQuery] = useState("");
  const [selectedModelId, setSelectedModelId] = useState(creativeModels[0].id);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [activeTask, setActiveTask] = useState<RemoteTaskRecord | null>(null);
  const [taskError, setTaskError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      try {
        const [config, models] = await Promise.all([getFrontendConfig(), listPublicCreativeModels()]);
        if (cancelled) return;
        setFrontendConfig(config);
        setRemoteModels(models.length > 0 ? models : creativeModels);
        const defaultCapability = config.capabilityMenu.find((item) => item.visible && item.modelIds.length > 0)?.key ?? "image";
        setCategory(defaultCapability);
        const defaultModelId = config.capabilityMenu.find((item) => item.key === defaultCapability)?.modelIds[0] ?? models[0]?.id;
        if (defaultModelId) setSelectedModelId(defaultModelId);
      } catch (error) {
        if (!cancelled) {
          setCatalogError(error instanceof Error ? error.message : "后端能力目录读取失败，已使用本地演示数据。");
        }
      }
    }

    void loadCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  const capabilityMenu = useMemo<CapabilityMenuItem[]>(() => {
    if (frontendConfig?.capabilityMenu.length) {
      return frontendConfig.capabilityMenu.filter((item) => item.visible);
    }

    return capabilityTabs
      .filter((tab) => tab.key !== "all" && tab.key !== "my")
      .map((tab, index) => ({
        key: tab.key,
        label: tab.label,
        description: "",
        icon: tab.key === "image" ? "image" : tab.key === "video" ? "video" : tab.key === "audio" ? "audio" : "sparkles",
        modelIds: creativeModels.filter((model) => model.category === tab.key).map((model) => model.id),
        visible: true,
        sortOrder: index * 10,
      }));
  }, [frontendConfig]);

  const models = remoteModels;

  const filteredModels = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const activeCapability = capabilityMenu.find((item) => item.key === category);
    return models.filter((model) => {
      const configuredIds = activeCapability?.modelIds ?? [];
      const matchesCategory =
        category === "all" ||
        (category === "my" ? model.favorite : configuredIds.length > 0 ? configuredIds.includes(model.id) : model.category === category);
      const matchesQuery =
        !normalizedQuery ||
        [model.name, model.group, model.description, ...model.bestFor, ...model.tags].some((item) => item.toLowerCase().includes(normalizedQuery));
      return matchesCategory && matchesQuery;
    });
  }, [capabilityMenu, category, models, query]);

  const selectedModel = models.find((model) => model.id === selectedModelId) ?? filteredModels[0] ?? models[0] ?? creativeModels[0];

  const selectModel = (model: CreativeModel) => {
    setSelectedModelId(model.id);
    setMobileSidebarOpen(false);
  };

  const changeCategory = (nextCategory: CapabilityCategory) => {
    setCategory(nextCategory);
    const menuItem = capabilityMenu.find((item) => item.key === nextCategory);
    const nextModel = models.find((model) =>
      nextCategory === "all" ||
      (nextCategory === "my" ? model.favorite : menuItem?.modelIds.length ? menuItem.modelIds.includes(model.id) : model.category === nextCategory),
    );
    if (nextModel) setSelectedModelId(nextModel.id);
  };

  const handleGenerate = async (input: StudioInput) => {
    setTaskError("");
    setActiveTask(null);
    setGeneratedPrompt(String(input.prompt ?? input.message ?? input.script ?? input.product ?? ""));

    try {
      const platformModel = localPlatformModels.find((model) => model.id === selectedModel.id) ?? localPlatformModels.find((model) => model.modality === selectedModel.category) ?? localPlatformModels[0];
      if (platformModel) {
        const quote = await quoteRemoteTask({
          model: { ...platformModel, id: selectedModel.id },
          input,
          routeMode: frontendConfig?.defaultRouteMode ?? selectedModel.routeMode ?? "balanced",
        });
        if (!quote.allowed) {
          setTaskError(quote.blockers.map((blocker) => blocker.message).join("；") || quote.message);
          return;
        }
      }

      const created = await createRemoteTaskByModelId({
        modelId: selectedModel.id,
        input,
        routeMode: frontendConfig?.defaultRouteMode ?? selectedModel.routeMode ?? "balanced",
      });
      setActiveTask(created);

      if (["completed", "failed", "cancelled", "expired"].includes(created.status)) {
        if (created.status === "failed") setTaskError(created.error?.message ?? created.message ?? "后端任务失败。");
        return;
      }

      for (let attempt = 0; attempt < 8; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 900));
        const nextTask = await getRemoteTaskRecord(created.task_id);
        setActiveTask(nextTask);
        if (["completed", "failed", "cancelled", "expired"].includes(nextTask.status)) {
          if (nextTask.status === "failed") setTaskError(nextTask.error?.message ?? nextTask.message ?? "后端任务失败。");
          break;
        }
      }
    } catch (error) {
      setTaskError(error instanceof Error ? error.message : "后端生成请求失败。");
    }
  };

  return (
    <div className="fine-grid min-h-[calc(100vh-64px)]">
      <div className="mx-auto flex max-w-[1600px] gap-0 px-0 lg:px-0">
        <aside className="hidden w-[302px] shrink-0 border-r border-violet-100/80 bg-violet-50/55 md:block">
          <WorkspaceSidebar
            category={category}
            query={query}
            selectedModelId={selectedModel.id}
            tabs={capabilityMenu}
            models={filteredModels}
            catalogError={catalogError}
            onCategoryChange={changeCategory}
            onModelSelect={selectModel}
            onQueryChange={setQuery}
          />
        </aside>

        <div className="min-w-0 flex-1 px-4 py-4 sm:px-6 lg:py-6">
          <div className="mb-3 flex items-center justify-between gap-3 md:hidden">
            <button
              className="inline-flex h-10 items-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-bold text-white shadow-sm"
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
              选择能力
            </button>
            <span className="truncate text-sm font-black text-slate-700">{selectedModel.name}</span>
          </div>

          <WorkspaceTopBar model={selectedModel} user={currentUser} />
          <section className="flex min-h-[calc(100vh-184px)] flex-col gap-4 pb-6">
            <ResultPanel error={taskError} generatedPrompt={generatedPrompt} model={selectedModel} task={activeTask} />
            <PromptComposer initialPrompt={templatePrompt} model={selectedModel} onGenerate={handleGenerate} />
          </section>
        </div>
      </div>

      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-sm md:hidden"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
          >
            <motion.aside
              animate={{ x: 0 }}
              className="h-full w-[86vw] max-w-sm bg-[#f8faf7] p-3 shadow-2xl"
              exit={{ x: "-100%" }}
              initial={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="inline-flex items-center gap-2 text-sm font-black text-slate-950">
                  <Sparkles className="h-4 w-4 text-teal-600" />
                  创作能力
                </div>
                <button
                  aria-label="关闭"
                  className="grid h-9 w-9 place-items-center rounded-full bg-white text-slate-500 shadow-sm"
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <WorkspaceSidebar
                category={category}
                query={query}
                selectedModelId={selectedModel.id}
                tabs={capabilityMenu}
                models={filteredModels}
                catalogError={catalogError}
                onCategoryChange={changeCategory}
                onModelSelect={selectModel}
                onQueryChange={setQuery}
              />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
