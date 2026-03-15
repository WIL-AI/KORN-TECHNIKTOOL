"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { LayoutDashboard, Wrench, ScanLine, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const links = [
    { href: "/" as const, label: t("dashboard"), icon: LayoutDashboard },
    { href: "/machines" as const, label: t("machines"), icon: Wrench },
    { href: "/scanner" as const, label: t("scanner"), icon: ScanLine },
    { href: "/chat" as const, label: t("chat"), icon: MessageCircle },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-lg shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-1">
        {links.map((link) => {
          const isActive =
            pathname === `/${pathname.split("/")[1]}${link.href === "/" ? "" : link.href}` ||
            (link.href !== "/" && pathname.includes(link.href));
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-6 w-6", isActive && "stroke-[2.5]")} />
              <span className="text-[11px]">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
