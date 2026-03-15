export interface MaintenanceInterval {
  id: string;
  machineId: string;
  label: string;
  dueDate: string; // ISO date string YYYY-MM-DD
  intervalMonths: number | null; // recurring interval in months, null = one-time
  lastCompleted: string | null; // ISO date when last completed
}

export interface Machine {
  id: string;
  name: string;
  type: string;
  location: string;
  status: "online" | "maintenance" | "offline";
  lastMaintenance: string;
  documentsCount: number;
}

export const demoMachines: Machine[] = [
  {
    id: "1",
    name: "CNC Fräse X500",
    type: "CNC Fräsmaschine",
    location: "Halle A, Platz 12",
    status: "online",
    lastMaintenance: "2026-02-28",
    documentsCount: 5,
  },
  {
    id: "2",
    name: "Drehbank T200",
    type: "Drehmaschine",
    location: "Halle A, Platz 7",
    status: "maintenance",
    lastMaintenance: "2026-03-10",
    documentsCount: 3,
  },
  {
    id: "3",
    name: "Schweißroboter R1",
    type: "Schweißanlage",
    location: "Halle B, Platz 1",
    status: "online",
    lastMaintenance: "2026-01-15",
    documentsCount: 8,
  },
  {
    id: "4",
    name: "Hydraulikpresse HP50",
    type: "Presse",
    location: "Halle C, Platz 3",
    status: "offline",
    lastMaintenance: "2026-03-01",
    documentsCount: 2,
  },
];

export const demoIntervals: MaintenanceInterval[] = [
  {
    id: "i1",
    machineId: "1",
    label: "TÜV-Prüfung",
    dueDate: "2026-03-20",
    intervalMonths: 12,
    lastCompleted: "2025-03-20",
  },
  {
    id: "i2",
    machineId: "1",
    label: "Ölwechsel",
    dueDate: "2026-04-15",
    intervalMonths: 6,
    lastCompleted: "2025-10-15",
  },
  {
    id: "i3",
    machineId: "2",
    label: "Planmäßige Wartung",
    dueDate: "2026-03-10",
    intervalMonths: 3,
    lastCompleted: "2025-12-10",
  },
  {
    id: "i4",
    machineId: "3",
    label: "Sicherheitsinspektion",
    dueDate: "2026-03-25",
    intervalMonths: 6,
    lastCompleted: "2025-09-25",
  },
  {
    id: "i5",
    machineId: "4",
    label: "Hydrauliköl-Wechsel",
    dueDate: "2026-03-05",
    intervalMonths: 4,
    lastCompleted: "2025-11-05",
  },
];
