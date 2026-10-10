// IndexedDB layer using Dexie for the Survey Data Collector.
// All data stays on the device and survives reloads/offline use.

import Dexie, { type Table } from "dexie";
import type { SurveyRecord } from "./types";

export class SurveyDatabase extends Dexie {
  records!: Table<SurveyRecord, string>;

  constructor() {
    super("survey-db");
    this.version(1).stores({
      // id = primary key, captured_at indexed for sorting newest-first
      records: "id, captured_at",
    });
  }
}

let _db: SurveyDatabase | null = null;

/**
 * Returns a singleton Dexie instance. Safe to call in the browser only.
 * Returns null on the server (no IndexedDB).
 */
export function getDb(): SurveyDatabase | null {
  if (typeof window === "undefined") return null;
  if (!_db) {
    _db = new SurveyDatabase();
  }
  return _db;
}

/** Add a record. Returns the inserted id. */
export async function addRecord(record: SurveyRecord): Promise<string> {
  const db = getDb();
  if (!db) throw new Error("IndexedDB is not available on the server");
  return db.records.add(record);
}

/** List all records newest-first. */
export async function listRecords(): Promise<SurveyRecord[]> {
  const db = getDb();
  if (!db) return [];
  return db.records.orderBy("captured_at").reverse().toArray();
}

/** Count all records. */
export async function countRecords(): Promise<number> {
  const db = getDb();
  if (!db) return 0;
  return db.records.count();
}

/** Delete a single record by id. */
export async function deleteRecord(id: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.records.delete(id);
}

/** Remove every record. */
export async function clearAll(): Promise<void> {
  const db = getDb();
  if (!db) return;
  await db.records.clear();
}

/**
 * Ask the browser to keep our data even under storage pressure.
 * No-op where unsupported. Returns true if persistence was granted.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) {
    return false;
  }
  try {
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
