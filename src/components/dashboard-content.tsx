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
  ChevronRight,
  ChevronDown,
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

  const totalDocs = machines.reduce((a, m) => a + m.documentsCount, 0);
  const overdueCount = reminders.filter((r) => r.isOverdue).length;

  const [showReminders, setShowReminders] = useState(false);
  const [showMachines, setShowMachines] = useState(false);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        {t("title")}
      </h1>

      {/* Stats Grid – compact */}
      <div className="mb-6 grid grid-cols-4 gap-2">
        <div className="rounded-xl border bg-card px-3 py-2 text-center">
          <Wrench className="mx-auto mb-1 h-4 w-4 text-primary" />
          <p className="text-lg font-semibold text-primary">{machines.length}</p>
          <p className="text-[10px] leading-tight text-muted-foreground">{t("totalMachines")}</p>
        </div>
        <div className="rounded-xl border bg-card px-3 py-2 text-center">
          <AlertTriangle className="mx-auto mb-1 h-4 w-4 text-yellow-600" />
          <p className="text-lg font-semibold">{reminders.length}</p>
          <p className="text-[10px] leading-tight text-muted-foreground">{t("pendingMaintenance")}</p>
        </div>
        <div className="rounded-xl border bg-card px-3 py-2 text-center">
          <FileText className="mx-auto mb-1 h-4 w-4 text-blue-600" />
          <p className="text-lg font-semibold">{totalDocs}</p>
          <p className="text-[10px] leading-tight text-muted-foreground">{t("documentsUploaded")}</p>
        </div>
        <div className="rounded-xl border bg-card px-3 py-2 text-center">
          <Clock className="mx-auto mb-1 h-4 w-4 text-red-600" />
          <p className={cn("text-lg font-semibold", overdueCount > 0 && "text-red-600")}>{overdueCount}</p>
          <p className="text-[10px] leading-tight text-muted-foreground">{t("overdueCount")}</p>
        </div>
      </div>

      {/* Quick Add – directly below stats */}
      <Link href="/machines" className="mb-6 block">
        <Button className="w-full gap-2 rounded-xl" size="lg">
          <Plus className="h-5 w-5" />
          {tMachines("addMachine")}
        </Button>
      </Link>

      {/* Due Reminders – collapsible */}
      {reminders.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowReminders(!showReminders)}
            className={cn(
              "flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors",
              overdueCount > 0 ? "border-red-300 bg-red-50" : "border-yellow-300 bg-yellow-50"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                overdueCount > 0 ? "bg-red-100" : "bg-yellow-100"
              )}>
                <AlertTriangle className={cn("h-5 w-5", overdueCount > 0 ? "text-red-600" : "text-yellow-600")} />
              </div>
              <div>
                <p className="font-semibold text-sm">{t("dueReminders")}</p>
                <p className="text-xs text-muted-foreground">
                  {reminders.length} {t("pendingMaintenance").toLowerCase()}
                  {overdueCount > 0 && ` · ${overdueCount} ${t("overdueCount").toLowerCase()}`}
                </p>
              </div>
            </div>
            <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", showReminders && "rotate-180")} />
          </button>

          {showReminders && (
            <div className="mt-2 space-y-2">
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
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    reminder.isOverdue ? "bg-red-100" : "bg-yellow-100"
                  )}>
                    {reminder.isOverdue ? (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    ) : (
                      <Calendar className="h-4 w-4 text-yellow-600" />
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
          )}
        </div>
      )}

      {/* Machines – collapsible */}
      <div className="mb-4">
        <button
          onClick={() => setShowMachines(!showMachines)}
          className="flex w-full items-center justify-between rounded-xl border bg-card p-3 text-left transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Wrench className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{tNav("machines")}</p>
              <p className="text-xs text-muted-foreground">
                {machines.length} {t("totalMachines").toLowerCase()}
              </p>
            </div>
          </div>
          <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform", showMachines && "rotate-180")} />
        </button>

        {showMachines && (
          <div className="mt-2 space-y-2">
            {machines.map((machine) => (
              <Link
                key={machine.id}
                href={`/machines/${machine.id}` as never}
                className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-accent"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Wrench className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{machine.name}</p>
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
        )}
      </div>
    </div>
  );
}
