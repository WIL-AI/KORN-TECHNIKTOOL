import { demoMachines, demoIntervals, type Machine, type MaintenanceInterval } from "./demo-data";

const STORAGE_KEY = "korn-machines";
const INTERVALS_KEY = "korn-intervals";

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
  return [...getUserMachines(), ...demoMachines];
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

export function deleteMachine(id: string): boolean {
  const userMachines = getUserMachines();
  const index = userMachines.findIndex((m) => m.id === id);
  if (index === -1) return false;
  userMachines.splice(index, 1);
  setUserMachines(userMachines);
  return true;
}

export function isDeletable(id: string): boolean {
  return getUserMachines().some((m) => m.id === id);
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
