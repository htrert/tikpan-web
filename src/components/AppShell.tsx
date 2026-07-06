import { AnimatePresence, motion } from "framer-motion";
import type { AccountSection, AppRoute, FrontendNavItem, Template, UserProfile } from "../types";
import { TopNav } from "./TopNav";
import { WorkspacePage } from "./workspace/WorkspacePage";
import { ExplorePage } from "./explore/ExplorePage";
import { AccountPage } from "./account/AccountPage";
import { AccountLibrary } from "./account/AccountLibrary";
import { AdminPlaceholder } from "./admin/AdminPlaceholder";

type AppShellProps = {
  accountSection: AccountSection;
  isAdmin: boolean;
  navItems: FrontendNavItem[] | null;
  route: AppRoute;
  templatePrompt: string;
  user: UserProfile;
  onAccountSectionChange: (section: AccountSection) => void;
  onNavigate: (route: AppRoute, section?: AccountSection) => void;
  onUseTemplate: (template: Template) => void;
};

export function AppShell({
  accountSection,
  isAdmin,
  navItems,
  route,
  templatePrompt,
  user,
  onAccountSectionChange,
  onNavigate,
  onUseTemplate,
}: AppShellProps) {
  if (route === "admin") {
    return <AdminPlaceholder isAdmin={isAdmin} user={user} onNavigate={onNavigate} />;
  }

  return (
    <div className="min-h-screen bg-[#f7f4ff] text-slate-950">
      <TopNav navItems={navItems} route={route} user={user} onNavigate={onNavigate} />
      <AnimatePresence mode="wait">
        <motion.main
          key={route}
          animate={{ opacity: 1, y: 0 }}
          className="min-h-[calc(100vh-64px)]"
          exit={{ opacity: 0, y: 8 }}
          initial={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          {route === "workspace" && <WorkspacePage templatePrompt={templatePrompt} />}
          {route === "explore" && <ExplorePage onUseTemplate={onUseTemplate} />}
          {route === "library" && (
            <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:py-8">
              <AccountLibrary onNavigate={onNavigate} />
            </div>
          )}
          {route === "account" && (
            <AccountPage
              activeSection={accountSection}
              user={user}
              onActiveSectionChange={onAccountSectionChange}
              onNavigate={onNavigate}
            />
          )}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
