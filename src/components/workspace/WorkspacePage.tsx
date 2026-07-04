import { AnimatePresence, motion } from "framer-motion";
import { Menu, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { capabilityTabs, creativeModels } from "../../appData";
import type { CapabilityCategory, CreativeModel } from "../../types";
import { cn } from "../../lib";
import { WorkspaceSidebar } from "./WorkspaceSidebar";
import { ResultPanel } from "./ResultPanel";
import { PromptComposer } from "./PromptComposer";

export function WorkspacePage({ templatePrompt }: { templatePrompt: string }) {
  const [category, setCategory] = useState<CapabilityCategory>("all");
  const [query, setQuery] = useState("");
  const [selectedModelId, setSelectedModelId] = useState(creativeModels[0].id);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");

  const filteredModels = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return creativeModels.filter((model) => {
      const matchesCategory = category === "all" || model.category === category;
      const matchesQuery =
        !normalizedQuery ||
        [model.name, model.group, model.description, ...model.bestFor, ...model.tags].some((item) => item.toLowerCase().includes(normalizedQuery));
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);

  const selectedModel = creativeModels.find((model) => model.id === selectedModelId) ?? creativeModels[0];

  const selectModel = (model: CreativeModel) => {
    setSelectedModelId(model.id);
    setMobileSidebarOpen(false);
  };

  const changeCategory = (nextCategory: CapabilityCategory) => {
    setCategory(nextCategory);
    const nextModel = creativeModels.find((model) => nextCategory === "all" || model.category === nextCategory);
    if (nextModel) setSelectedModelId(nextModel.id);
  };

  return (
    <div className="fine-grid min-h-[calc(100vh-64px)]">
      <div className="mx-auto flex max-w-[1540px] gap-0 px-0 lg:px-0">
        <aside className="hidden w-[286px] shrink-0 border-r border-violet-100/80 bg-violet-50/55 lg:block">
          <WorkspaceSidebar
            category={category}
            query={query}
            selectedModelId={selectedModel.id}
            tabs={capabilityTabs}
            models={filteredModels}
            onCategoryChange={changeCategory}
            onModelSelect={selectModel}
            onQueryChange={setQuery}
          />
        </aside>

        <div className="min-w-0 flex-1 px-4 py-4 sm:px-6 lg:py-6">
          <div className="mb-3 flex items-center justify-between gap-3 lg:hidden">
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

          <section className="flex min-h-[calc(100vh-112px)] flex-col gap-4 pb-6">
            <ResultPanel generatedPrompt={generatedPrompt} model={selectedModel} />
            <PromptComposer initialPrompt={templatePrompt} model={selectedModel} onGenerate={setGeneratedPrompt} />
          </section>
        </div>
      </div>

      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-sm lg:hidden"
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
                tabs={capabilityTabs}
                models={filteredModels}
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
