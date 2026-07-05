import type { LucideIcon } from "lucide-react";
import type { RouteMode } from "./productData";

export type AppRoute = "workspace" | "explore" | "library" | "account" | "admin";

export type AccountSection = "assets" | "library" | "presets" | "orders" | "settings";

export type CapabilityCategory = "all" | "image" | "video" | "chat" | "audio" | "workflow" | "agent" | "office" | "copywriting" | "my";

export type CreativeModelCategory = Exclude<CapabilityCategory, "all" | "my">;

export type CreativeControlOption = {
  label: string;
  value: string | number | boolean;
};

export type CreativeControl = {
  key: string;
  label: string;
  type: "textarea" | "text" | "select" | "segmented" | "slider" | "switch" | "number" | "file";
  required?: boolean;
  advanced?: boolean;
  helper?: string;
  defaultValue?: string | number | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: CreativeControlOption[];
};

export type FrontendNavItem = {
  key: AppRoute;
  label: string;
  visible: boolean;
  sortOrder: number;
};

export type CapabilityMenuItem = {
  key: CapabilityCategory;
  label: string;
  description: string;
  icon: "sparkles" | "image" | "video" | "file-text" | "audio" | "bot" | "workflow" | "office";
  modelIds: string[];
  visible: boolean;
  sortOrder: number;
};

export type FrontendConfig = {
  navItems: FrontendNavItem[];
  capabilityMenu: CapabilityMenuItem[];
  defaultRouteMode: RouteMode;
};

export type CreativeModel = {
  id: string;
  name: string;
  category: CreativeModelCategory;
  group: string;
  description: string;
  bestFor: string[];
  tags: string[];
  cost: number;
  controls: CreativeControl[];
  icon: LucideIcon;
  provider?: string;
  favorite?: boolean;
  health?: number;
  subtitle?: string;
  routeMode?: RouteMode;
};

export type Template = {
  id: string;
  title: string;
  category: string;
  description: string;
  prompt: string;
  tokens: number;
  accent: "teal" | "violet" | "amber" | "sky";
};

export type UserProfile = {
  initials: string;
  name: string;
  email: string;
  role: "creator" | "admin";
  tokens: number;
  frozenTokens: number;
  plan: string;
  monthlyAllowance: number;
};

export type LibraryAsset = {
  id: string;
  title: string;
  type: "图片" | "视频";
  createdAt: string;
  model: string;
  favorite?: boolean;
};

export type LedgerItem = {
  id: string;
  title: string;
  time: string;
  tokens: number;
  status: "已完成" | "已退回" | "冻结中";
};

export type OrderRecord = {
  id: string;
  tokens: number;
  status: "已完成" | "处理中" | "已取消";
  time: string;
};
