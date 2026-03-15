"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import type { Machine, MaintenanceInterval } from "@/lib/demo-data";
import {
  getMachineById,
  deleteMachine,
  isDeletable,
  getIntervalsForMachine,
  addInterval,
  deleteInterval,
  completeInterval,
} from "@/lib/machine-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Loader2,
  CheckCircle,
  Trash2,
  AlertTriangle,
  Clock,
  Check,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadAndProcessDocument } from "@/lib/ai/documents";

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
  const router = useRouter();

  const [machine, setMachine] = useState<Machine | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setMachine(getMachineById(machineId));
    setIntervals(getIntervalsForMachine(machineId));
    setLoaded(true);
  }, [machineId]);

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
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Interval state
  const [intervals, setIntervals] = useState<MaintenanceInterval[]>([]);
  const [intervalDialogOpen, setIntervalDialogOpen] = useState(false);
  const [newIntervalLabel, setNewIntervalLabel] = useState("");
  const [newIntervalDue, setNewIntervalDue] = useState("");
  const [newIntervalMonths, setNewIntervalMonths] = useState("");

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const canDelete = isDeletable(machineId);

  if (!loaded) return null;

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

  async function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    type: "document" | "photo"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadSuccess(null);

    const result = await uploadAndProcessDocument(file, machineId, type);

    if (result.success) {
      setUploadSuccess(file.name);
      setTimeout(() => setUploadSuccess(null), 3000);
    } else {
      console.error("Upload failed:", result.error);
    }

    setUploading(false);
    e.target.value = "";
  }

  function handleDelete() {
    if (deleteConfirmText.trim().toLowerCase() !== "ja") return;
    deleteMachine(machineId);
    setDeleteDialogOpen(false);
    router.push("/machines" as never);
  }

  function handleAddInterval() {
    if (!newIntervalLabel.trim() || !newIntervalDue) return;
    const updated = addInterval({
      machineId,
      label: newIntervalLabel,
      dueDate: newIntervalDue,
      intervalMonths: newIntervalMonths ? Number(newIntervalMonths) : null,
      lastCompleted: null,
    });
    setIntervals(updated);
    setNewIntervalLabel("");
    setNewIntervalDue("");
    setNewIntervalMonths("");
    setIntervalDialogOpen(false);
  }

  function handleCompleteInterval(id: string) {
    completeInterval(id);
    setIntervals(getIntervalsForMachine(machineId));
  }

  function handleDeleteInterval(id: string) {
    deleteInterval(id);
    setIntervals(getIntervalsForMachine(machineId));
  }

  function getDaysUntilDue(dueDate: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
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
          <TabsTrigger value="intervals" className="flex-1 gap-2 rounded-lg">
            <Clock className="h-4 w-4" />
            {t("intervals")}
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex-1 gap-2 rounded-lg">
            <ClipboardList className="h-4 w-4" />
            {t("maintenanceLog")}
          </TabsTrigger>
        </TabsList>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            onChange={(e) => handleFileUpload(e, "document")}
          />
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFileUpload(e, "photo")}
          />

          {uploadSuccess && (
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-green-300 bg-green-50 px-4 py-2 text-sm text-green-800">
              <CheckCircle className="h-4 w-4 shrink-0" />
              {uploadSuccess}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-2 rounded-xl"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {t("uploadDocument")}
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-2 rounded-xl"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploading}
            >
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

        {/* Intervals Tab */}
        <TabsContent value="intervals" className="mt-4">
          <Dialog open={intervalDialogOpen} onOpenChange={setIntervalDialogOpen}>
            <DialogTrigger className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              {t("addInterval")}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("addInterval")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {t("intervalLabel")}
                  </label>
                  <Input
                    value={newIntervalLabel}
                    onChange={(e) => setNewIntervalLabel(e.target.value)}
                    placeholder={t("intervalLabelPlaceholder")}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {t("dueDate")}
                  </label>
                  <Input
                    type="date"
                    value={newIntervalDue}
                    onChange={(e) => setNewIntervalDue(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {t("intervalMonths")}
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={newIntervalMonths}
                    onChange={(e) => setNewIntervalMonths(e.target.value)}
                    placeholder={t("intervalMonthsHint")}
                  />
                </div>
                <Button onClick={handleAddInterval} className="w-full rounded-xl">
                  {tCommon("save")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {intervals.length > 0 ? (
            <div className="mt-4 space-y-2">
              {intervals.map((interval) => {
                const days = getDaysUntilDue(interval.dueDate);
                const isOverdue = days < 0;
                const isDueToday = days === 0;
                const isDueSoon = days > 0 && days <= 14;

                return (
                  <div
                    key={interval.id}
                    className={cn(
                      "rounded-xl border p-3",
                      isOverdue && "border-red-300 bg-red-50",
                      isDueSoon && !isOverdue && "border-yellow-300 bg-yellow-50"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{interval.label}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {interval.dueDate}
                          </span>
                          <span className="flex items-center gap-1">
                            {interval.intervalMonths ? (
                              <>
                                <RefreshCw className="h-3 w-3" />
                                {interval.intervalMonths} {t("recurring")}
                              </>
                            ) : (
                              t("oneTime")
                            )}
                          </span>
                        </div>
                        {interval.lastCompleted && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t("lastCompleted")}: {interval.lastCompleted}
                          </p>
                        )}
                        {isOverdue && (
                          <p className="mt-1 text-xs font-semibold text-red-600">
                            {t("overdue")} ({Math.abs(days)}d)
                          </p>
                        )}
                        {isDueToday && (
                          <p className="mt-1 text-xs font-semibold text-yellow-700">
                            {t("dueToday")}
                          </p>
                        )}
                        {isDueSoon && !isDueToday && (
                          <p className="mt-1 text-xs text-yellow-700">
                            {t("dueSoon", { days })}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-green-600 hover:bg-green-100 hover:text-green-700"
                          onClick={() => handleCompleteInterval(interval.id)}
                          title={t("markComplete")}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive hover:bg-red-100"
                          onClick={() => handleDeleteInterval(interval.id)}
                          title={tCommon("delete")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-8 text-center text-sm text-muted-foreground">
              {t("noIntervals")}
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

      {/* Delete Button (only for user-added machines) */}
      {canDelete && (
        <div className="mt-3">
          <Dialog
            open={deleteDialogOpen}
            onOpenChange={(open) => {
              setDeleteDialogOpen(open);
              if (!open) setDeleteConfirmText("");
            }}
          >
            <DialogTrigger className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 text-sm font-medium text-destructive hover:bg-destructive hover:text-destructive-foreground">
              <Trash2 className="h-4 w-4" />
              {t("deleteMachine")}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  {t("deleteConfirmTitle")}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  {t("deleteConfirmMessage", { name: machine.name })}
                </p>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {t("deleteConfirmLabel")}
                  </label>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={t("deleteConfirmPlaceholder")}
                    className="rounded-xl"
                  />
                </div>
                <Button
                  onClick={handleDelete}
                  disabled={deleteConfirmText.trim().toLowerCase() !== "ja"}
                  variant="destructive"
                  className="w-full rounded-xl"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("deleteConfirm")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
