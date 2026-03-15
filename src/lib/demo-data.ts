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
