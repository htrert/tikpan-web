import { useEffect, useMemo, useState } from "react";
import { AppShell } from "./components/AppShell";
import { currentUser } from "./appData";
import { getFrontendConfig } from "./apiClient";
import type { AccountSection, AppRoute, FrontendNavItem, Template } from "./types";

function routeFromPath(pathname: string): AppRoute {
  if (pathname.startsWith("/explore")) return "explore";
  if (pathname.startsWith("/library")) return "library";
  if (pathname.startsWith("/account")) return "account";
  if (pathname.startsWith("/admin")) return "admin";
  return "workspace";
}

function pathForRoute(route: AppRoute) {
  if (route === "explore") return "/explore";
  if (route === "library") return "/library";
  if (route === "account") return "/account";
  if (route === "admin") return "/admin";
  return "/workspace";
}

function App() {
  const [route, setRoute] = useState<AppRoute>(() =>
    typeof window === "undefined" ? "workspace" : routeFromPath(window.location.pathname),
  );
  const [accountSection, setAccountSection] = useState<AccountSection>("assets");
  const [navItems, setNavItems] = useState<FrontendNavItem[] | null>(null);
  const [templatePrompt, setTemplatePrompt] = useState("");

  useEffect(() => {
    const handlePopState = () => {
      setRoute(routeFromPath(window.location.pathname));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getFrontendConfig()
      .then((config) => {
        if (!cancelled) setNavItems(config.navItems);
      })
      .catch(() => {
        if (!cancelled) setNavItems(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const navigate = useMemo(
    () => (nextRoute: AppRoute, nextAccountSection?: AccountSection) => {
      if (nextAccountSection) setAccountSection(nextAccountSection);
      setRoute(nextRoute);

      const nextPath = pathForRoute(nextRoute);
      if (typeof window !== "undefined" && window.location.pathname !== nextPath) {
        window.history.pushState({}, "", nextPath);
      }
    },
    [],
  );

  const useTemplate = (template: Template) => {
    setTemplatePrompt(template.prompt);
    navigate("workspace");
  };

  return (
    <AppShell
      accountSection={accountSection}
      isAdmin={currentUser.role === "admin"}
      navItems={navItems}
      route={route}
      templatePrompt={templatePrompt}
      user={currentUser}
      onAccountSectionChange={setAccountSection}
      onNavigate={navigate}
      onUseTemplate={useTemplate}
    />
  );
}

export default App;
