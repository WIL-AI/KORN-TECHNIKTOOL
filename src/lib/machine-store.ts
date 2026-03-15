import { demoMachines, demoIntervals, type Machine, type MaintenanceInterval } from "./demo-data";

const STORAGE_KEY = "korn-machines";
const INTERVALS_KEY = "korn-intervals";
const LOGS_KEY = "korn-maintenance-logs";
const DOCS_KEY = "korn-documents";

/** Max pre-generated machine detail pages (see generateStaticParams) */
export const MAX_MACHINE_PAGES = 50;

// ============================================================
// MACHINES
// ============================================================

function getUserMachines(): Machine[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setUserMachines(machines: Machine[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(machines));
}

export function getAllMachines(): Machine[] {
  const deletedIds = getDeletedDemoIds();
  const activeDemos = demoMachines.filter((m) => !deletedIds.includes(m.id));
  return [...getUserMachines(), ...activeDemos];
}

export function getMachineById(id: string): Machine | undefined {
  return getAllMachines().find((m) => m.id === id);
}

function getNextId(): string {
  const userMachines = getUserMachines();
  const demoIds = demoMachines.map((m) => Number(m.id));
  const userIds = userMachines.map((m) => Number(m.id)).filter((n) => !isNaN(n));
  const allIds = [...demoIds, ...userIds];
  const maxId = allIds.length > 0 ? Math.max(...allIds) : 0;
  return String(maxId + 1);
}

export function addMachine(machineData: Omit<Machine, "id">): Machine[] {
  const userMachines = getUserMachines();
  const machine: Machine = { id: getNextId(), ...machineData };
  userMachines.unshift(machine);
  setUserMachines(userMachines);
  return getAllMachines();
}

const DELETED_DEMOS_KEY = "korn-deleted-demos";

function getDeletedDemoIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(DELETED_DEMOS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setDeletedDemoIds(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DELETED_DEMOS_KEY, JSON.stringify(ids));
}

export function deleteMachine(id: string): boolean {
  // Try user machines first
  const userMachines = getUserMachines();
  const index = userMachines.findIndex((m) => m.id === id);
  if (index !== -1) {
    userMachines.splice(index, 1);
    setUserMachines(userMachines);
    return true;
  }
  // If demo machine, mark as deleted
  if (demoMachines.some((m) => m.id === id)) {
    const deleted = getDeletedDemoIds();
    if (!deleted.includes(id)) {
      deleted.push(id);
      setDeletedDemoIds(deleted);
    }
    return true;
  }
  return false;
}

export function isDeletable(_id: string): boolean {
  return true;
}

// ============================================================
// MAINTENANCE INTERVALS
// ============================================================

function getUserIntervals(): MaintenanceInterval[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(INTERVALS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setUserIntervals(intervals: MaintenanceInterval[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(INTERVALS_KEY, JSON.stringify(intervals));
}

export function getAllIntervals(): MaintenanceInterval[] {
  return [...getUserIntervals(), ...demoIntervals];
}

export function getIntervalsForMachine(machineId: string): MaintenanceInterval[] {
  return getAllIntervals().filter((i) => i.machineId === machineId);
}

export function addInterval(data: Omit<MaintenanceInterval, "id">): MaintenanceInterval[] {
  const intervals = getUserIntervals();
  const interval: MaintenanceInterval = {
    id: `i-${Date.now()}`,
    ...data,
  };
  intervals.unshift(interval);
  setUserIntervals(intervals);
  return getIntervalsForMachine(data.machineId);
}

export function deleteInterval(id: string): boolean {
  const intervals = getUserIntervals();
  const index = intervals.findIndex((i) => i.id === id);
  if (index === -1) return false;
  intervals.splice(index, 1);
  setUserIntervals(intervals);
  return true;
}

export function completeInterval(id: string): void {
  // Check user intervals first
  const userIntervals = getUserIntervals();
  const userIdx = userIntervals.findIndex((i) => i.id === id);

  const today = new Date().toISOString().split("T")[0];

  if (userIdx !== -1) {
    userIntervals[userIdx].lastCompleted = today;
    if (userIntervals[userIdx].intervalMonths) {
      const next = new Date();
      next.setMonth(next.getMonth() + userIntervals[userIdx].intervalMonths!);
      userIntervals[userIdx].dueDate = next.toISOString().split("T")[0];
    }
    setUserIntervals(userIntervals);
  } else {
    // For demo intervals, copy to user storage with updated dates
    const demoInterval = demoIntervals.find((i) => i.id === id);
    if (!demoInterval) return;

    const updated = { ...demoInterval, lastCompleted: today };
    if (updated.intervalMonths) {
      const next = new Date();
      next.setMonth(next.getMonth() + updated.intervalMonths);
      updated.dueDate = next.toISOString().split("T")[0];
    }
    // Store as user interval (overrides demo)
    const intervals = getUserIntervals();
    intervals.push(updated);
    setUserIntervals(intervals);
  }
}

export interface DueReminder {
  interval: MaintenanceInterval;
  machine: Machine;
  daysUntilDue: number;
  isOverdue: boolean;
}

/**
 * Get all due/overdue maintenance reminders, sorted by urgency.
 */
export function getDueReminders(withinDays = 14): DueReminder[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const allIntervals = getAllIntervals();

  // Deduplicate: user intervals override demo intervals with same ID
  const userIds = new Set(getUserIntervals().map((i) => i.id));
  const deduped = allIntervals.filter((i) => {
    if (userIds.has(i.id)) {
      return getUserIntervals().some((u) => u.id === i.id);
    }
    return true;
  });

  const reminders: DueReminder[] = [];

  for (const interval of deduped) {
    const dueDate = new Date(interval.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const diffMs = dueDate.getTime() - today.getTime();
    const daysUntilDue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysUntilDue <= withinDays) {
      const machine = getMachineById(interval.machineId);
      if (machine) {
        reminders.push({
          interval,
          machine,
          daysUntilDue,
          isOverdue: daysUntilDue < 0,
        });
      }
    }
  }

  return reminders.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}

// ============================================================
// MAINTENANCE LOGS
// ============================================================

export interface MaintenanceLog {
  id: string;
  machineId: string;
  note: string;
  date: string;
}

const demoLogs: MaintenanceLog[] = [
  { id: "log-d1", machineId: "1", note: "Ölwechsel durchgeführt, Filter getauscht.", date: "2026-03-10" },
  { id: "log-d2", machineId: "1", note: "Kalibrierung der Achsen.", date: "2026-02-28" },
  { id: "log-d3", machineId: "2", note: "Spindellager geprüft und geschmiert.", date: "2026-03-05" },
  { id: "log-d4", machineId: "3", note: "Schweißdrahtvorschub justiert.", date: "2026-02-20" },
];

function getUserLogs(): MaintenanceLog[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(LOGS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setUserLogs(logs: MaintenanceLog[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}

export function getLogsForMachine(machineId: string): MaintenanceLog[] {
  const userLogs = getUserLogs().filter((l) => l.machineId === machineId);
  const demo = demoLogs.filter((l) => l.machineId === machineId);
  return [...userLogs, ...demo];
}

export function addLog(machineId: string, note: string): MaintenanceLog[] {
  const logs = getUserLogs();
  logs.unshift({
    id: `log-${Date.now()}`,
    machineId,
    note,
    date: new Date().toISOString().split("T")[0],
  });
  setUserLogs(logs);
  return getLogsForMachine(machineId);
}

export function deleteLog(id: string): boolean {
  const logs = getUserLogs();
  const index = logs.findIndex((l) => l.id === id);
  if (index === -1) return false;
  logs.splice(index, 1);
  setUserLogs(logs);
  return true;
}

// ============================================================
// LOCAL DOCUMENTS (localStorage fallback)
// ============================================================

export interface LocalDocument {
  id: string;
  machineId: string;
  fileName: string;
  fileSize: string;
  type: "document" | "photo";
  date: string;
}

function getUserDocs(): LocalDocument[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(DOCS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setUserDocs(docs: LocalDocument[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DOCS_KEY, JSON.stringify(docs));
}

export function getDocsForMachine(machineId: string): LocalDocument[] {
  return getUserDocs().filter((d) => d.machineId === machineId);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function addLocalDoc(machineId: string, fileName: string, fileSize: number, type: "document" | "photo"): { docs: LocalDocument[]; docId: string } {
  const docs = getUserDocs();
  const docId = `doc-${Date.now()}`;
  docs.unshift({
    id: docId,
    machineId,
    fileName,
    fileSize: formatFileSize(fileSize),
    type,
    date: new Date().toISOString().split("T")[0],
  });
  setUserDocs(docs);
  return { docs: getDocsForMachine(machineId), docId };
}

export function deleteLocalDoc(id: string): boolean {
  const docs = getUserDocs();
  const index = docs.findIndex((d) => d.id === id);
  if (index === -1) return false;
  docs.splice(index, 1);
  setUserDocs(docs);
  // Clean up stored file data
  try { localStorage.removeItem(`korn-doc-data-${id}`); } catch {}
  return true;
}

export function saveDocData(docId: string, dataUrl: string): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(`korn-doc-data-${docId}`, dataUrl); } catch {}
}

export function getDocData(docId: string): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem(`korn-doc-data-${docId}`); } catch { return null; }
}

// ============================================================
// LISTENERS
// ============================================================

type Listener = () => void;
const listeners = new Set<Listener>();

export function onMachinesChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners() {
  listeners.forEach((l) => l());
}

export function addMachineAndNotify(machineData: Omit<Machine, "id">): Machine[] {
  const result = addMachine(machineData);
  notifyListeners();
  return result;
}
