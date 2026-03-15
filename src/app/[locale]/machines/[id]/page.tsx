import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { demoMachines } from "@/lib/demo-data";
import { AppShell } from "@/components/layout/app-shell";
import { MachineDetailContent } from "@/components/machines/machine-detail-content";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    demoMachines.map((m) => ({ locale, id: m.id }))
  );
}

export default async function MachineDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return (
    <AppShell>
      <MachineDetailContent machineId={id} />
    </AppShell>
  );
}
