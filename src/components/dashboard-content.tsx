"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Machine } from "@/lib/demo-data";
import { getAllMachines, getDueReminders, type DueReminder } from "@/lib/machine-store";
import {
  Wrench,
  FileText,
  AlertTriangle,
  Activity,
  ChevronRight,
  Plus,
  Clock,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const statusColors = {
  online: "bg-green-500",
  maintenance: "bg-yellow-500",
  offline: "bg-red-500",
};

export function DashboardContent() {
  const t = useTranslations("dashboard");
  const tMachines = useTranslations("machines");
  const tNav = useTranslations("nav");

  const [machines, setMachines] = useState<Machine[]>([]);
  const [reminders, setReminders] = useState<DueReminder[]>([]);

  useEffect(() => {
    setMachines(getAllMachines());
    setReminders(getDueReminders(30));
  }, []);

  const onlineCount = machines.filter((m) => m.status === "online").length;
  const totalDocs = machines.reduce((a, m) => a + m.documentsCount, 0);
  const overdueCount = reminders.filter((r) => r.isOverdue).length;

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
            {machines.length}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-500/10">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </div>
          <p className="text-xs text-muted-foreground">
            {t("pendingMaintenance")}
          </p>
          <p className="text-2xl font-semibold">{reminders.length}</p>
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
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
            <Clock className="h-4 w-4 text-red-600" />
          </div>
          <p className="text-xs text-muted-foreground">{t("overdueCount")}</p>
          <p className={cn("text-2xl font-semibold", overdueCount > 0 && "text-red-600")}>
            {overdueCount}
          </p>
        </div>
      </div>

      {/* Due Reminders */}
      {reminders.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">{t("dueReminders")}</h2>
          <div className="space-y-2">
            {reminders.map((reminder) => (
              <Link
                key={reminder.interval.id}
                href={`/machines/${reminder.machine.id}` as never}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-accent",
                  reminder.isOverdue && "border-red-300 bg-red-50",
                  !reminder.isOverdue && reminder.daysUntilDue <= 7 && "border-yellow-300 bg-yellow-50"
                )}
              >
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  reminder.isOverdue ? "bg-red-100" : "bg-yellow-100"
                )}>
                  {reminder.isOverdue ? (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  ) : (
                    <Calendar className="h-5 w-5 text-yellow-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {reminder.machine.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {reminder.interval.label}
                  </p>
                  <p className={cn(
                    "text-xs font-medium mt-0.5",
                    reminder.isOverdue ? "text-red-600" : "text-yellow-700"
                  )}>
                    {reminder.isOverdue
                      ? `${tMachines("overdue")} (${Math.abs(reminder.daysUntilDue)}d)`
                      : reminder.daysUntilDue === 0
                        ? t("dueTodayShort")
                        : t("dueIn", { days: reminder.daysUntilDue })}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      )}

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
        {machines.slice(0, 3).map((machine) => (
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
