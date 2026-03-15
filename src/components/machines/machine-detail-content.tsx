"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { demoMachines } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  QrCode,
  Upload,
  Camera,
  FileText,
  ClipboardList,
  MapPin,
  Calendar,
  Wrench,
  Plus,
  MessageCircle,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors = {
  online: "bg-green-500",
  maintenance: "bg-yellow-500",
  offline: "bg-red-500",
};

const statusLabels: Record<string, string> = {
  online: "Online",
  maintenance: "Wartung",
  offline: "Offline",
};

interface MaintenanceEntry {
  id: string;
  note: string;
  date: string;
}

export function MachineDetailContent({ machineId }: { machineId: string }) {
  const t = useTranslations("machines");
  const tCommon = useTranslations("common");
  const tChat = useTranslations("chat");

  const machine = demoMachines.find((m) => m.id === machineId);
  const [showQr, setShowQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<MaintenanceEntry[]>([
    {
      id: "1",
      note: "Ölwechsel durchgeführt, Filter getauscht.",
      date: "2026-03-10",
    },
    { id: "2", note: "Kalibrierung der Achsen.", date: "2026-02-28" },
  ]);
  const [newNote, setNewNote] = useState("");
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);

  if (!machine) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">{tCommon("noResults")}</p>
      </div>
    );
  }

  function addNote() {
    if (!newNote.trim()) return;
    setLogs([
      {
        id: String(Date.now()),
        note: newNote,
        date: new Date().toISOString().split("T")[0],
      },
      ...logs,
    ]);
    setNewNote("");
    setNoteDialogOpen(false);
  }

  const qrUrl = typeof window !== "undefined"
    ? `${window.location.origin}${window.location.pathname.split("/").slice(0, 2).join("/")}/machines/${machineId}`
    : `/machines/${machineId}`;

  async function generateQr() {
    try {
      const QRCode = (await import("qrcode")).default;
      const url = await QRCode.toDataURL(qrUrl, {
        width: 300,
        margin: 2,
        color: { dark: "#B32423", light: "#FFFFFF" },
      });
      setQrDataUrl(url);
    } catch {
      // fallback - show placeholder
    }
  }

  function toggleQr() {
    if (!showQr && !qrDataUrl) {
      generateQr();
    }
    setShowQr(!showQr);
  }

  function downloadQr() {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.download = `QR-${machine?.name || "machine"}.png`;
    link.href = qrDataUrl;
    link.click();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      {/* Back Button */}
      <Link
        href="/machines"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {tCommon("back")}
      </Link>

      {/* Machine Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Wrench className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">{machine.name}</h1>
            <p className="text-sm text-muted-foreground">{machine.type}</p>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {machine.location}
              </span>
              <span className="flex items-center gap-1">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    statusColors[machine.status]
                  )}
                />
                {statusLabels[machine.status]}
              </span>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-2 rounded-xl"
          onClick={toggleQr}
        >
          <QrCode className="h-4 w-4" />
          {t("qrCode")}
        </Button>
      </div>

      {/* QR Code Display */}
      {showQr && (
        <div className="mb-6 rounded-2xl border bg-card p-6 text-center">
          {qrDataUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={qrDataUrl}
              alt={`QR Code - ${machine.name}`}
              className="mx-auto mb-4 h-48 w-48 rounded-xl"
            />
          ) : (
            <div className="mx-auto mb-4 flex h-48 w-48 items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-white">
              <QrCode className="h-16 w-16 text-primary/30" />
            </div>
          )}
          <p className="mb-2 text-xs text-muted-foreground">{qrUrl}</p>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-xl"
            onClick={downloadQr}
            disabled={!qrDataUrl}
          >
            <Download className="h-4 w-4" />
            {t("downloadQr")}
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="w-full rounded-xl">
          <TabsTrigger value="documents" className="flex-1 gap-2 rounded-lg">
            <FileText className="h-4 w-4" />
            {t("documents")}
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex-1 gap-2 rounded-lg">
            <ClipboardList className="h-4 w-4" />
            {t("maintenanceLog")}
          </TabsTrigger>
        </TabsList>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-4">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 gap-2 rounded-xl">
              <Upload className="h-4 w-4" />
              {t("uploadDocument")}
            </Button>
            <Button variant="outline" className="flex-1 gap-2 rounded-xl">
              <Camera className="h-4 w-4" />
              {t("uploadPhoto")}
            </Button>
          </div>

          {machine.documentsCount > 0 ? (
            <div className="mt-4 space-y-2">
              {Array.from({ length: Math.min(machine.documentsCount, 3) }).map(
                (_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border p-3"
                  >
                    <FileText className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {i === 0
                          ? "Betriebsanleitung.pdf"
                          : i === 1
                            ? "Wartungsplan_2026.pdf"
                            : "Sicherheitsdatenblatt.pdf"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {i === 0 ? "2.4 MB" : i === 1 ? "1.1 MB" : "890 KB"}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="mt-8 text-center text-sm text-muted-foreground">
              {t("noDocuments")}
            </div>
          )}
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="mt-4">
          <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
            <DialogTrigger className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              {t("addNote")}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("addNote")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Wartungsnotiz eingeben..."
                  rows={4}
                />
                <Button onClick={addNote} className="w-full rounded-xl">
                  {tCommon("save")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {logs.length > 0 ? (
            <div className="mt-4 space-y-2">
              {logs.map((entry) => (
                <div key={entry.id} className="rounded-xl border p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {entry.date}
                  </div>
                  <p className="text-sm">{entry.note}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 text-center text-sm text-muted-foreground">
              {t("noLogs")}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Chat Button */}
      <div className="mt-6">
        <Link href={`/chat?machine=${machineId}` as never}>
          <Button
            variant="outline"
            className="w-full gap-2 rounded-xl border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            size="lg"
          >
            <MessageCircle className="h-5 w-5" />
            {tChat("title")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
