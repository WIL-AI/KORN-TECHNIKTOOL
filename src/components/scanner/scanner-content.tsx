"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ScanLine, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export function ScannerContent() {
  const t = useTranslations("scanner");
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<"found" | "notFound" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<unknown>(null);

  const stopScanner = useCallback(async () => {
    const scanner = html5QrCodeRef.current as {
      isScanning?: boolean;
      stop?: () => Promise<void>;
      clear?: () => void;
    } | null;
    if (scanner?.isScanning) {
      try {
        await scanner.stop!();
      } catch {
        // ignore stop errors
      }
    }
    try {
      scanner?.clear?.();
    } catch {
      // ignore clear errors
    }
    html5QrCodeRef.current = null;
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  function handleScanResult(decodedText: string) {
    stopScanner();

    // Extract machine ID from URL pattern: /machines/{id} or /[locale]/machines/{id}
    const match = decodedText.match(/\/machines\/([a-zA-Z0-9-]+)/);
    if (match) {
      setResult("found");
      setTimeout(() => {
        router.push(`/machines/${match[1]}` as never);
      }, 1200);
    } else {
      setResult("notFound");
      setTimeout(() => setResult(null), 3000);
    }
  }

  async function startScan() {
    setError(null);
    setResult(null);

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      const scannerId = "qr-scanner-viewport";
      const scanner = new Html5Qrcode(scannerId);
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          handleScanResult(decodedText);
        },
        () => {
          // QR code not found in frame - ignore
        }
      );

      setScanning(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : String(err);

      if (
        message.includes("Permission") ||
        message.includes("NotAllowed")
      ) {
        setError(t("permissionDenied"));
      } else {
        setError(message);
      }
      setScanning(false);
    }
  }

  function handleStop() {
    stopScanner();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">
        {t("title")}
      </h1>

      <div className="flex flex-col items-center">
        {/* Scanner Viewport */}
        <div
          ref={scannerRef}
          className="relative mb-6 w-full max-w-xs overflow-hidden rounded-3xl border-2 border-primary/20 bg-black"
        >
          <div
            id="qr-scanner-viewport"
            className="aspect-square w-full"
          />

          {!scanning && !result && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/5 text-muted-foreground">
              <ScanLine className="h-16 w-16" />
              <p className="max-w-[200px] text-center text-sm">
                {t("instruction")}
              </p>
            </div>
          )}

          {result === "found" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/90">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <p className="font-medium text-green-600">{t("found")}</p>
            </div>
          )}

          {result === "notFound" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/90">
              <XCircle className="h-16 w-16 text-red-500" />
              <p className="font-medium text-red-600">{t("notFound")}</p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Scan Button */}
        <Button
          onClick={scanning ? handleStop : startScan}
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
