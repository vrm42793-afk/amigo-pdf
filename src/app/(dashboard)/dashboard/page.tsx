import { UploadWidget } from "@/components/dashboard/upload-widget";
import { RecentFilesWidget } from "@/components/dashboard/recent-files-widget";
import { StorageWidget } from "@/components/dashboard/storage-widget";
import { AiUsageStatisticsWidget, RecentAiActivityWidget } from "@/components/dashboard/ai-widgets";

export const metadata = {
  title: "Dashboard | AMIGO PDF",
};

export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Upload and manage your documents
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload + Recent (left 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <UploadWidget />
          <RecentFilesWidget />
        </div>

        {/* Sidebar widgets (right 1/3) */}
        <div className="space-y-4">
          <StorageWidget />
          <AiUsageStatisticsWidget />
          <RecentAiActivityWidget />
        </div>
      </div>
    </div>
  );
}
