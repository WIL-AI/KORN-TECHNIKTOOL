"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Machine } from "@/lib/demo-data";
import { getAllMachines, addMachineAndNotify } from "@/lib/machine-store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  Wrench,
  ChevronRight,
  MapPin,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors = {
  online: "bg-green-500",
  maintenance: "bg-yellow-500",
  offline: "bg-red-500",
};

export function MachineListContent() {
  const t = useTranslations("machines");
  const tCommon = useTranslations("common");
  const [search, setSearch] = useState("");
  const [machines, setMachines] = useState<Machine[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("");
  const [newLocation, setNewLocation] = useState("");

  // Load machines from store (demo + localStorage) on mount
  useEffect(() => {
    setMachines(getAllMachines());
  }, []);

  const filtered = machines.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.type.toLowerCase().includes(search.toLowerCase()) ||
      m.location.toLowerCase().includes(search.toLowerCase())
  );

  function handleAddMachine() {
    if (!newName.trim()) return;
    const updated = addMachineAndNotify({
      name: newName,
      type: newType || "Unbekannt",
      location: newLocation || "—",
      status: "online",
      lastMaintenance: new Date().toISOString().split("T")[0],
      documentsCount: 0,
    });
    setMachines(updated);
    setNewName("");
    setNewType("");
    setNewLocation("");
    setDialogOpen(false);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger className="inline-flex h-8 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            {t("addMachine")}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("addMachine")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  {t("name")}
                </label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="z.B. CNC Fräse X500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  {t("type")}
                </label>
                <Input
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  placeholder="z.B. CNC Fräsmaschine"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  {t("location")}
                </label>
                <Input
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="z.B. Halle A, Platz 12"
                />
              </div>
              <Button onClick={handleAddMachine} className="w-full rounded-xl">
                {tCommon("save")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tCommon("search") + "..."}
          className="rounded-xl pl-10"
        />
      </div>

      {/* Machine List */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          {tCommon("noResults")}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((machine) => (
            <Link
              key={machine.id}
              href={`/machines/${machine.id}` as never}
              className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Wrench className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{machine.name}</p>
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      statusColors[machine.status]
                    )}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{machine.type}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {machine.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {machine.lastMaintenance}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
