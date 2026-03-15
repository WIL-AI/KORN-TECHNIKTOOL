"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { demoMachines } from "@/lib/demo-data";
import {
  Wrench,
  FileText,
  AlertTriangle,
  Activity,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const statusColors = {
  online: "bg-green-500",
  maintenance: "bg-yellow-500",
  offline: "bg-red-500",
};

const statusLabels: Record<string, Record<string, string>> = {
  de: { online: "Online", maintenance: "Wartung", offline: "Offline" },
  en: { online: "Online", maintenance: "Maintenance", offline: "Offline" },
};

export function DashboardContent() {
  const t = useTranslations("dashboard");
  const tMachines = useTranslations("machines");
  const tNav = useTranslations("nav");

  const onlineCount = demoMachines.filter((m) => m.status === "online").length;
  const maintenanceCount = demoMachines.filter(
    (m) => m.status === "maintenance"
  ).length;
  const totalDocs = demoMachines.reduce((a, m) => a + m.documentsCount, 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        {t("title")}
      </h1>

      {/* Stats Grid */}
      <div className="mb-8 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border bg-card p-4">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Wrench className="h-4 w-4 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground">{t("totalMachines")}</p>
          <p className="text-2xl font-semibold text-primary">
            {demoMachines.length}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/10">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </div>
          <p className="text-xs text-muted-foreground">
            {t("pendingMaintenance")}
          </p>
          <p className="text-2xl font-semibold">{maintenanceCount}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-xs text-muted-foreground">
            {t("documentsUploaded")}
          </p>
          <p className="text-2xl font-semibold">{totalDocs}</p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
            <Activity className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-xs text-muted-foreground">{t("recentActivity")}</p>
          <p className="text-2xl font-semibold">{onlineCount}</p>
        </div>
      </div>

      {/* Recent Machines */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{tNav("machines")}</h2>
        <Link href="/machines">
          <Button variant="ghost" size="sm" className="text-primary">
            {tMachines("title")}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="space-y-2">
        {demoMachines.slice(0, 3).map((machine) => (
          <Link
            key={machine.id}
            href={`/machines/${machine.id}` as never}
            className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Wrench className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{machine.name}</p>
              <p className="text-xs text-muted-foreground">
                {machine.location}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  statusColors[machine.status]
                )}
              />
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Add */}
      <Link href="/machines" className="mt-6 block">
        <Button className="w-full gap-2 rounded-xl" size="lg">
          <Plus className="h-5 w-5" />
          {tMachines("addMachine")}
        </Button>
      </Link>
    </div>
  );
}
