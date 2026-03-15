import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { MAX_MACHINE_PAGES } from "@/lib/machine-store";
import { AppShell } from "@/components/layout/app-shell";
import { MachineDetailContent } from "@/components/machines/machine-detail-content";

export function generateStaticParams() {
  const ids = Array.from({ length: MAX_MACHINE_PAGES }, (_, i) => String(i + 1));
  return routing.locales.flatMap((locale) =>
    ids.map((id) => ({ locale, id }))
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
