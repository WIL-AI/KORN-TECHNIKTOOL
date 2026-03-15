import { useTranslations } from "next-intl";
import { Wrench } from "lucide-react";

export default function HomePage() {
  const t = useTranslations("dashboard");
  const tNav = useTranslations("nav");

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("title")}
            </h1>
            <p className="text-sm text-muted-foreground">{tNav("machines")}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border bg-card p-6">
            <p className="text-sm text-muted-foreground">
              {t("totalMachines")}
            </p>
            <p className="mt-1 text-3xl font-semibold">0</p>
          </div>
          <div className="rounded-2xl border bg-card p-6">
            <p className="text-sm text-muted-foreground">
              {t("pendingMaintenance")}
            </p>
            <p className="mt-1 text-3xl font-semibold">0</p>
          </div>
          <div className="rounded-2xl border bg-card p-6">
            <p className="text-sm text-muted-foreground">
              {t("documentsUploaded")}
            </p>
            <p className="mt-1 text-3xl font-semibold">0</p>
          </div>
          <div className="rounded-2xl border bg-card p-6">
            <p className="text-sm text-muted-foreground">
              {t("recentActivity")}
            </p>
            <p className="mt-1 text-3xl font-semibold">—</p>
          </div>
        </div>
      </div>
    </main>
  );
}
