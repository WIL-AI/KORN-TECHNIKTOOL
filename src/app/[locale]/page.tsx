import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
/* eslint-disable @next/next/no-img-element */

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <DashboardContent />;
}

function DashboardContent() {
  const t = useTranslations("dashboard");
  const tNav = useTranslations("nav");

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8 flex items-center gap-4">
          <img
            src="/KORN-TECHNIKTOOL/korn-logo.svg"
            alt="KORN Logo"
            className="h-12 w-12 object-contain"
          />
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
            <p className="mt-1 text-3xl font-semibold text-primary">0</p>
          </div>
          <div className="rounded-2xl border bg-card p-6">
            <p className="text-sm text-muted-foreground">
              {t("pendingMaintenance")}
            </p>
            <p className="mt-1 text-3xl font-semibold text-primary">0</p>
          </div>
          <div className="rounded-2xl border bg-card p-6">
            <p className="text-sm text-muted-foreground">
              {t("documentsUploaded")}
            </p>
            <p className="mt-1 text-3xl font-semibold text-primary">0</p>
          </div>
          <div className="rounded-2xl border bg-card p-6">
            <p className="text-sm text-muted-foreground">
              {t("recentActivity")}
            </p>
            <p className="mt-1 text-3xl font-semibold text-primary">—</p>
          </div>
        </div>
      </div>
    </main>
  );
}
