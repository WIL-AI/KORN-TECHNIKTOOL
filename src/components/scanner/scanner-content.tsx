"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ScanLine, Camera, CheckCircle, XCircle } from "lucide-react";

export function ScannerContent() {
  const t = useTranslations("scanner");
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<"found" | "notFound" | null>(null);

  function startScan() {
    setScanning(true);
    setResult(null);

    // Simulated scan - will be replaced with html5-qrcode in Step 4
    setTimeout(() => {
      setScanning(false);
      setResult("found");
      setTimeout(() => {
        router.push("/machines/1" as never);
      }, 1500);
    }, 3000);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        {t("title")}
      </h1>

      <div className="flex flex-col items-center">
        {/* Scanner Viewport */}
        <div className="relative mb-6 flex h-72 w-72 items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-primary/30 bg-black/5">
          {scanning ? (
            <>
              <div className="absolute inset-0 flex items-center justify-center">
                <Camera className="h-16 w-16 text-primary/30" />
              </div>
              <div className="absolute left-4 right-4 h-0.5 animate-pulse bg-primary"
                   style={{ top: '50%' }} />
              <p className="absolute bottom-4 text-sm text-primary">
                {t("scanning")}
              </p>
            </>
          ) : result === "found" ? (
            <div className="flex flex-col items-center gap-2">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="font-medium text-green-600">{t("found")}</p>
            </div>
          ) : result === "notFound" ? (
            <div className="flex flex-col items-center gap-2">
              <XCircle className="h-16 w-16 text-red-500" />
              <p className="font-medium text-red-600">{t("notFound")}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <ScanLine className="h-16 w-16" />
              <p className="max-w-[200px] text-center text-sm">
                {t("instruction")}
              </p>
            </div>
          )}
        </div>

        <Button
          onClick={scanning ? () => setScanning(false) : startScan}
          size="lg"
          className="w-full max-w-xs gap-2 rounded-xl"
          variant={scanning ? "outline" : "default"}
        >
          <ScanLine className="h-5 w-5" />
          {scanning ? t("stopScan") : t("startScan")}
        </Button>
      </div>
    </div>
  );
}
