import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  documentId,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { COLLECTIONS, UI } from "@/lib/constants";
import { getDb } from "@/lib/firebase";
import { normaliseCategory } from "@/lib/schedule";
import { clampMinutes } from "@/lib/time";
import type {
  Block,
  BlockDraft,
  DateKey,
  DayRecord,
  ScheduledSnapshot,
  WeekdayIndex,
} from "@/lib/types";

/**
 * Firestore access layer.
 *
 * All reads and writes are user-scoped under `users/{uid}/…`, which keeps the
 * security rules a single ownership check (see `firestore.rules`).
 *
 * Documents are validated on read rather than trusted: this is an open-source
 * app where data may predate a schema change or have been edited by hand in the
 * Firebase console, and one malformed field should not blank the whole UI.
 */

/* -------------------------------------------------------------------------- */
/* Paths                                                                      */
/* -------------------------------------------------------------------------- */

const blocksPath = (uid: string) =>
  collection(getDb(), COLLECTIONS.users, uid, COLLECTIONS.blocks);

const blockDoc = (uid: string, blockId: string) =>
  doc(getDb(), COLLECTIONS.users, uid, COLLECTIONS.blocks, blockId);

const daysPath = (uid: string) =>
  collection(getDb(), COLLECTIONS.users, uid, COLLECTIONS.days);

const dayDoc = (uid: string, date: DateKey) =>
  doc(getDb(), COLLECTIONS.users, uid, COLLECTIONS.days, date);

/* -------------------------------------------------------------------------- */
/* Deserialisation                                                            */
/* -------------------------------------------------------------------------- */

const VALID_WEEKDAYS = new Set([0, 1, 2, 3, 4, 5, 6]);

function toBlock(id: string, data: Record<string, unknown>): Block {
  const start = clampMinutes(Number(data.startMinutes ?? 0));
  const rawEnd = clampMinutes(Number(data.endMinutes ?? 0));

  const days = Array.isArray(data.days)
    ? (data.days
        .map(Number)
        .filter((day) => VALID_WEEKDAYS.has(day)) as WeekdayIndex[])
    : [];

  return {
    id,
    title: typeof data.title === "string" ? data.title : "Untitled block",
    category: normaliseCategory(String(data.category ?? "")),
    days,
    startMinutes: start,
    // Guarantee a positive duration even if stored data is inconsistent.
    endMinutes: rawEnd > start ? rawEnd : Math.min(start + 30, 24 * 60),
    notes: typeof data.notes === "string" ? data.notes : undefined,
    archived: Boolean(data.archived),
    createdAt: Number(data.createdAt ?? 0),
    updatedAt: Number(data.updatedAt ?? 0),
  };
}

function toSnapshotEntry(value: unknown): ScheduledSnapshot | null {
  if (typeof value !== "object" || value === null) return null;
  const data = value as Record<string, unknown>;
  if (typeof data.blockId !== "string") return null;

  const start = clampMinutes(Number(data.startMinutes ?? 0));
  const end = clampMinutes(Number(data.endMinutes ?? 0));

  return {
    blockId: data.blockId,
    title: typeof data.title === "string" ? data.title : "Untitled block",
    category: normaliseCategory(String(data.category ?? "")),
    startMinutes: start,
    endMinutes: end > start ? end : start,
  };
}

function toDayRecord(id: string, data: Record<string, unknown>): DayRecord {
  return {
    date: id,
    completed: Array.isArray(data.completed)
      ? data.completed.filter(
          (value): value is string => typeof value === "string",
        )
      : [],
    scheduled: Array.isArray(data.scheduled)
      ? data.scheduled
          .map(toSnapshotEntry)
          .filter((entry): entry is ScheduledSnapshot => entry !== null)
      : [],
    note: typeof data.note === "string" ? data.note : undefined,
    updatedAt: Number(data.updatedAt ?? 0),
  };
}

/* -------------------------------------------------------------------------- */
/* Blocks (weekly template)                                                   */
/* -------------------------------------------------------------------------- */

/** Live subscription to the user's weekly template. */
export function subscribeToBlocks(
  uid: string,
  onChange: (blocks: Block[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const q = query(blocksPath(uid), orderBy("startMinutes", "asc"));

  return onSnapshot(
    q,
    (snapshot) => {
      onChange(snapshot.docs.map((d) => toBlock(d.id, d.data())));
    },
    onError,
  );
}

export async function createBlock(
  uid: string,
  id: string,
  draft: BlockDraft,
): Promise<void> {
  const now = Date.now();
  await setDoc(blockDoc(uid, id), {
    ...sanitiseDraft(draft),
    archived: draft.archived ?? false,
    createdAt: now,
    updatedAt: now,
    // Server time is written alongside the client clock for auditing; the
    // client value is what the UI sorts by, so a skewed clock stays local.
    serverUpdatedAt: serverTimestamp(),
  });
}

export async function updateBlock(
  uid: string,
  id: string,
  draft: BlockDraft,
): Promise<void> {
  await updateDoc(blockDoc(uid, id), {
    ...sanitiseDraft(draft),
    ...(draft.archived === undefined ? {} : { archived: draft.archived }),
    updatedAt: Date.now(),
    serverUpdatedAt: serverTimestamp(),
  });
}

export async function setBlockArchived(
  uid: string,
  id: string,
  archived: boolean,
): Promise<void> {
  await updateDoc(blockDoc(uid, id), {
    archived,
    updatedAt: Date.now(),
    serverUpdatedAt: serverTimestamp(),
  });
}

export async function deleteBlock(uid: string, id: string): Promise<void> {
  await deleteDoc(blockDoc(uid, id));
}

/** Clamp and trim user input before it reaches Firestore. */
function sanitiseDraft(draft: BlockDraft) {
  const start = clampMinutes(draft.startMinutes);
  const end = clampMinutes(draft.endMinutes);

  return {
    title:
      draft.title.trim().slice(0, UI.maxBlockTitleLength) || "Untitled block",
    category: normaliseCategory(draft.category),
    days: [...new Set(draft.days)]
      .filter((day) => VALID_WEEKDAYS.has(day))
      .sort(),
    startMinutes: start,
    endMinutes: end > start ? end : Math.min(start + 30, 24 * 60),
    notes: (draft.notes ?? "").trim().slice(0, UI.maxNoteLength),
  };
}

/* -------------------------------------------------------------------------- */
/* Day records                                                                */
/* -------------------------------------------------------------------------- */

/** Live subscription to a single day. */
export function subscribeToDay(
  uid: string,
  date: DateKey,
  onChange: (record: DayRecord | undefined) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    dayDoc(uid, date),
    (snapshot) => {
      onChange(
        snapshot.exists()
          ? toDayRecord(snapshot.id, snapshot.data())
          : undefined,
      );
    },
    onError,
  );
}

/**
 * Fetch day records in an inclusive date range.
 *
 * Document ids are `yyyy-MM-dd`, which sorts lexicographically the same as
 * chronologically — so a `documentId()` range query works without a separate
 * date field or a composite index.
 */
export async function fetchDaysInRange(
  uid: string,
  startDate: DateKey,
  endDate: DateKey,
): Promise<Map<DateKey, DayRecord>> {
  const q = query(
    daysPath(uid),
    where(documentId(), ">=", startDate),
    where(documentId(), "<=", endDate),
  );

  const snapshot = await getDocs(q);
  const records = new Map<DateKey, DayRecord>();

  for (const d of snapshot.docs) {
    records.set(d.id, toDayRecord(d.id, d.data()));
  }
  return records;
}

/**
 * Mark a block complete or incomplete for a date.
 *
 * `arrayUnion`/`arrayRemove` make this idempotent and safe against races
 * between devices — two tabs toggling the same block converge instead of
 * clobbering each other's array.
 *
 * The scheduled snapshot is written on the same call so history is preserved
 * even if the template changes later.
 */
export async function setBlockCompletion(
  uid: string,
  date: DateKey,
  blockId: string,
  completed: boolean,
  scheduled: ScheduledSnapshot[],
): Promise<void> {
  await setDoc(
    dayDoc(uid, date),
    {
      date,
      scheduled,
      completed: completed ? arrayUnion(blockId) : arrayRemove(blockId),
      updatedAt: Date.now(),
      serverUpdatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/** Save the free-text reflection for a day. */
export async function setDayNote(
  uid: string,
  date: DateKey,
  note: string,
): Promise<void> {
  await setDoc(
    dayDoc(uid, date),
    {
      date,
      note: note.slice(0, UI.maxNoteLength),
      updatedAt: Date.now(),
      serverUpdatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
