import type { DashboardStats, UserSettings } from "@/types";

export type AppOutletContext = {
  stats: DashboardStats | null;
  reload: () => Promise<void>;
  settings: UserSettings | null;
};
