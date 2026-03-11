import { getActiveParentId } from "./parentProfile";

// --- Types ---

export interface HospitalNote {
  id: string;
  timestamp: string;
  content: string;
  category?: "doctor-said" | "decision" | "question" | "general";
  providerName?: string;
}

export interface HospitalSession {
  id: string;
  parentId: string;
  startedAt: string;
  hospitalName?: string;
  reason?: string;
  notes: HospitalNote[];
  dischargeStepsCompleted: string[];
}

const SESSIONS_KEY = "harbor_hospital_sessions";

// --- Helpers ---

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getAllSessions(): HospitalSession[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveSessions(sessions: HospitalSession[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

// --- Session CRUD ---

export function getActiveSession(): HospitalSession | null {
  const parentId = getActiveParentId();
  if (!parentId) return null;
  const sessions = getAllSessions();
  // Active session = most recent session for this parent with no endedAt concept
  // Sessions are "active" until explicitly ended (removed from active list)
  return sessions.find((s) => s.parentId === parentId) || null;
}

export function startSession(options?: {
  hospitalName?: string;
  reason?: string;
}): HospitalSession {
  const parentId = getActiveParentId();
  if (!parentId) throw new Error("No active parent profile");

  // End any existing session first
  const sessions = getAllSessions().filter((s) => s.parentId !== parentId);

  const session: HospitalSession = {
    id: generateId(),
    parentId,
    startedAt: new Date().toISOString(),
    hospitalName: options?.hospitalName,
    reason: options?.reason,
    notes: [],
    dischargeStepsCompleted: [],
  };

  sessions.push(session);
  saveSessions(sessions);
  return session;
}

export function endSession(): void {
  const parentId = getActiveParentId();
  if (!parentId) return;
  const sessions = getAllSessions().filter((s) => s.parentId !== parentId);
  saveSessions(sessions);
}

// --- Note CRUD ---

export function addNote(
  content: string,
  options?: {
    category?: HospitalNote["category"];
    providerName?: string;
  }
): HospitalNote {
  const parentId = getActiveParentId();
  if (!parentId) throw new Error("No active parent profile");

  let sessions = getAllSessions();
  let session = sessions.find((s) => s.parentId === parentId);

  // Auto-start session if none exists
  if (!session) {
    session = {
      id: generateId(),
      parentId,
      startedAt: new Date().toISOString(),
      notes: [],
      dischargeStepsCompleted: [],
    };
    sessions.push(session);
  }

  const note: HospitalNote = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    content,
    category: options?.category || "general",
    providerName: options?.providerName,
  };

  session.notes.push(note);
  saveSessions(sessions);
  return note;
}

export function updateNote(noteId: string, content: string): void {
  const parentId = getActiveParentId();
  if (!parentId) return;

  const sessions = getAllSessions();
  const session = sessions.find((s) => s.parentId === parentId);
  if (!session) return;

  const note = session.notes.find((n) => n.id === noteId);
  if (note) {
    note.content = content;
    saveSessions(sessions);
  }
}

export function deleteNote(noteId: string): void {
  const parentId = getActiveParentId();
  if (!parentId) return;

  const sessions = getAllSessions();
  const session = sessions.find((s) => s.parentId === parentId);
  if (!session) return;

  session.notes = session.notes.filter((n) => n.id !== noteId);
  saveSessions(sessions);
}

export function getSessionNotes(): HospitalNote[] {
  const session = getActiveSession();
  return session?.notes || [];
}

// --- Discharge Steps ---

export function markDischargeStep(stepId: string): void {
  const parentId = getActiveParentId();
  if (!parentId) return;

  const sessions = getAllSessions();
  const session = sessions.find((s) => s.parentId === parentId);
  if (!session) return;

  if (!session.dischargeStepsCompleted.includes(stepId)) {
    session.dischargeStepsCompleted.push(stepId);
    saveSessions(sessions);
  }
}

export function unmarkDischargeStep(stepId: string): void {
  const parentId = getActiveParentId();
  if (!parentId) return;

  const sessions = getAllSessions();
  const session = sessions.find((s) => s.parentId === parentId);
  if (!session) return;

  session.dischargeStepsCompleted = session.dischargeStepsCompleted.filter(
    (id) => id !== stepId
  );
  saveSessions(sessions);
}

export function getCompletedDischargeSteps(): string[] {
  const session = getActiveSession();
  return session?.dischargeStepsCompleted || [];
}

// --- Export ---

export function exportSessionNotes(): string {
  const session = getActiveSession();
  if (!session || session.notes.length === 0) return "";

  const categoryLabels: Record<string, string> = {
    "doctor-said": "Doctor Said",
    decision: "Decision",
    question: "Question",
    general: "Note",
  };

  const lines: string[] = [
    `Hospital Visit Notes`,
    session.hospitalName ? `Hospital: ${session.hospitalName}` : "",
    session.reason ? `Reason: ${session.reason}` : "",
    `Started: ${new Date(session.startedAt).toLocaleString()}`,
    `Exported: ${new Date().toLocaleString()}`,
    "",
    "---",
    "",
  ].filter(Boolean);

  for (const note of session.notes) {
    const time = new Date(note.timestamp).toLocaleString();
    const label = categoryLabels[note.category || "general"] || "Note";
    const provider = note.providerName ? ` (${note.providerName})` : "";
    lines.push(`[${time}] [${label}]${provider}`);
    lines.push(note.content);
    lines.push("");
  }

  return lines.join("\n");
}
