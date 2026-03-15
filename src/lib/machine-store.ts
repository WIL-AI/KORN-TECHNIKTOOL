import { demoMachines, type Machine } from "./demo-data";

const STORAGE_KEY = "korn-machines";

/** Max pre-generated machine detail pages (see generateStaticParams) */
export const MAX_MACHINE_PAGES = 50;

/**
 * Get user-added machines from localStorage.
 */
function getUserMachines(): Machine[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save user-added machines to localStorage.
 */
function setUserMachines(machines: Machine[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(machines));
}

/**
 * Get all machines (demo + user-added).
 */
export function getAllMachines(): Machine[] {
  return [...getUserMachines(), ...demoMachines];
}

/**
 * Find a machine by ID (searches both demo and user-added).
 */
export function getMachineById(id: string): Machine | undefined {
  return getAllMachines().find((m) => m.id === id);
}

/**
 * Get the next sequential ID for a new machine.
 */
function getNextId(): string {
  const userMachines = getUserMachines();
  const demoIds = demoMachines.map((m) => Number(m.id));
  const userIds = userMachines.map((m) => Number(m.id)).filter((n) => !isNaN(n));
  const allIds = [...demoIds, ...userIds];
  const maxId = allIds.length > 0 ? Math.max(...allIds) : 0;
  return String(maxId + 1);
}

/**
 * Add a new machine with a sequential ID and persist to localStorage.
 * Returns the updated full list.
 */
export function addMachine(machineData: Omit<Machine, "id">): Machine[] {
  const userMachines = getUserMachines();
  const machine: Machine = { id: getNextId(), ...machineData };
  userMachines.unshift(machine);
  setUserMachines(userMachines);
  return getAllMachines();
}

/**
 * Delete a machine from localStorage (demo machines cannot be deleted).
 * Returns true if deleted.
 */
export function deleteMachine(id: string): boolean {
  const userMachines = getUserMachines();
  const index = userMachines.findIndex((m) => m.id === id);
  if (index === -1) return false; // demo machines can't be deleted
  userMachines.splice(index, 1);
  setUserMachines(userMachines);
  return true;
}

/**
 * Check if a machine is deletable (only user-added machines).
 */
export function isDeletable(id: string): boolean {
  return getUserMachines().some((m) => m.id === id);
}

/**
 * Notify listeners when machines change.
 */
type Listener = () => void;
const listeners = new Set<Listener>();

export function onMachinesChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners() {
  listeners.forEach((l) => l());
}

/**
 * Add a machine and notify listeners.
 */
export function addMachineAndNotify(machineData: Omit<Machine, "id">): Machine[] {
  const result = addMachine(machineData);
  notifyListeners();
  return result;
}
