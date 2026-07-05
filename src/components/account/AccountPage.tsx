import type { AccountSection, AppRoute, UserProfile } from "../../types";
import { AccountSidebar } from "./AccountSidebar";
import { AccountAssets } from "./AccountAssets";
import { AccountLibrary } from "./AccountLibrary";
import { AccountPresets } from "./AccountPresets";
import { AccountOrders } from "./AccountOrders";
import { AccountSettings } from "./AccountSettings";

type AccountPageProps = {
  activeSection: AccountSection;
  user: UserProfile;
  onActiveSectionChange: (section: AccountSection) => void;
  onNavigate: (route: AppRoute, section?: AccountSection) => void;
};

export function AccountPage({ activeSection, user, onActiveSectionChange, onNavigate }: AccountPageProps) {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f8faf7]">
      <div className="mx-auto grid max-w-[1500px] gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[260px_1fr] lg:py-8">
        <AccountSidebar activeSection={activeSection} onActiveSectionChange={onActiveSectionChange} />
        <section className="min-w-0">
          {activeSection === "assets" && <AccountAssets user={user} onNavigate={onNavigate} />}
          {activeSection === "library" && <AccountLibrary onNavigate={onNavigate} />}
          {activeSection === "presets" && <AccountPresets />}
          {activeSection === "orders" && <AccountOrders />}
          {activeSection === "settings" && <AccountSettings user={user} />}
        </section>
      </div>
    </div>
  );
}
