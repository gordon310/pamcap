import type { AdjustmentEntry, Expert, ValuationRecord } from '../types';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const RECORDS_KEY = 'pamcap.records';
export const EXPERTS_KEY = 'pamcap.experts';
export const ADJUSTMENTS_KEY = 'pamcap.adjustments';

// ~3.5MB, leaving headroom under the usual 5MB localStorage quota.
export const MAX_RECORDS_BYTES = 3_500_000;

export interface ImportBundle {
  records?: ValuationRecord[];
  experts?: Expert[];
  adjustments?: AdjustmentEntry[];
}

export interface AdjustmentRow {
  at: string;
  expert_name: string;
  expert_email: string;
  hotel_name: string;
  key: string;
  old: number | string;
  new: number;
  reason: string;
  record_id: string;
}

function getDefaultStorage(): StorageLike | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

function loadJSON<T>(key: string, storage: StorageLike | null): T[] {
  if (!storage) return [];
  const raw = storage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function saveJSON(key: string, value: unknown, storage: StorageLike | null): void {
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage disabled: keep the in-memory state usable.
  }
}

export function isExpertRegistered(expert: Expert, experts: Expert[]): boolean {
  const name = (expert.name || '').trim();
  const email = (expert.email || '').trim().toLowerCase();
  return experts.some(
    (e) => (e.name || '').trim() === name && (e.email || '').trim().toLowerCase() === email,
  );
}

export function upsertExpert(experts: Expert[], expert: Expert): Expert[] {
  if (isExpertRegistered(expert, experts)) return experts;
  return [...experts, { name: expert.name.trim(), email: expert.email.trim() }];
}

function serializedSize(records: ValuationRecord[]): number {
  return JSON.stringify(records).length;
}

export function appendRecord(
  records: ValuationRecord[],
  record: ValuationRecord,
  maxBytes: number = MAX_RECORDS_BYTES,
): { records: ValuationRecord[]; pruned: number } {
  const list = [...records, record];
  let pruned = 0;
  while (list.length > 1 && serializedSize(list) > maxBytes) {
    list.shift();
    pruned += 1;
  }
  return { records: list, pruned };
}

export function adjustmentRows(entries: AdjustmentEntry[]): AdjustmentRow[] {
  return entries.map((e) => ({
    at: e.at,
    expert_name: e.expert?.name || '',
    expert_email: e.expert?.email || '',
    hotel_name: e.hotel_name,
    key: e.key,
    old: e.old,
    new: e.new,
    reason: e.reason,
    record_id: e.recordId || '',
  }));
}

function csvEscape(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function adjustmentsToCSV(entries: AdjustmentEntry[]): string {
  const header = ['时间', '专家', '邮箱', '酒店', '系数路径', '原值', '新值', '原因', '记录ID'];
  const lines = adjustmentRows(entries).map((row) => [
    row.at,
    row.expert_name,
    row.expert_email,
    row.hotel_name,
    row.key,
    row.old,
    row.new,
    row.reason,
    row.record_id,
  ]);
  return [header, ...lines].map((cols) => cols.map(csvEscape).join(',')).join('\n');
}

export function parseImport(text: string): ImportBundle {
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object') return {};
    const bundle: ImportBundle = {};
    if (Array.isArray(parsed.records)) bundle.records = parsed.records as ValuationRecord[];
    if (Array.isArray(parsed.experts)) bundle.experts = parsed.experts as Expert[];
    if (Array.isArray(parsed.adjustments)) bundle.adjustments = parsed.adjustments as AdjustmentEntry[];
    return bundle;
  } catch {
    return {};
  }
}

export function loadRecords(storage: StorageLike | null = getDefaultStorage()): ValuationRecord[] {
  return loadJSON<ValuationRecord>(RECORDS_KEY, storage);
}

export function saveRecords(
  records: ValuationRecord[],
  storage: StorageLike | null = getDefaultStorage(),
): { pruned: number } {
  const list = [...records];
  let pruned = 0;
  while (list.length > 1 && serializedSize(list) > MAX_RECORDS_BYTES) {
    list.shift();
    pruned += 1;
  }
  saveJSON(RECORDS_KEY, list, storage);
  return { pruned };
}

export function loadExperts(storage: StorageLike | null = getDefaultStorage()): Expert[] {
  return loadJSON<Expert>(EXPERTS_KEY, storage);
}

export function saveExperts(experts: Expert[], storage: StorageLike | null = getDefaultStorage()): void {
  saveJSON(EXPERTS_KEY, experts, storage);
}

export function loadAdjustments(storage: StorageLike | null = getDefaultStorage()): AdjustmentEntry[] {
  return loadJSON<AdjustmentEntry>(ADJUSTMENTS_KEY, storage);
}

export function saveAdjustments(
  entries: AdjustmentEntry[],
  storage: StorageLike | null = getDefaultStorage(),
): void {
  saveJSON(ADJUSTMENTS_KEY, entries, storage);
}
