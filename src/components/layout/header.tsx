"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Header() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [showLang, setShowLang] = useState(false);

  function switchLocale(newLocale: "de" | "en") {
    router.replace(pathname, { locale: newLocale });
    setShowLang(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/KORN-TECHNIKTOOL/korn-logo.svg"
            alt="KORN Logo"
            className="h-10 w-10 object-contain"
          />
          <span className="text-lg font-semibold tracking-tight">
            {t("appName")}
          </span>
        </div>

        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setShowLang(!showLang)}
          >
            <Globe className="h-4 w-4" />
            <span className="uppercase">{locale}</span>
          </Button>

          {showLang && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowLang(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-1 min-w-32 rounded-lg border bg-popover p-1 shadow-md">
                <button
                  onClick={() => switchLocale("de")}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent",
                    locale === "de" && "font-medium"
                  )}
                >
                  {locale === "de" && <Check className="h-3 w-3" />}
                  {t("german")}
                </button>
                <button
                  onClick={() => switchLocale("en")}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent",
                    locale === "en" && "font-medium"
                  )}
                >
                  {locale === "en" && <Check className="h-3 w-3" />}
                  {t("english")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
