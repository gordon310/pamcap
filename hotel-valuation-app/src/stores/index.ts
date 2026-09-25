import { create } from 'zustand';
import type {
  ValuationInput,
  ValuationResult,
  Opinion,
  Adjustment,
  Version,
  Expert,
  Evaluation,
  ValuationRecord,
  AdjustmentEntry,
  RecordKind,
} from '../types';
import { calculateValuation } from '../services/valuation-engine';
import { loadExpert, saveExpert, clearExpert } from '../services/profile';
import {
  loadRecords,
  saveRecords,
  loadExperts,
  saveExperts,
  loadAdjustments,
  saveAdjustments,
  appendRecord,
  upsertExpert,
  adjustmentRows,
  adjustmentsToCSV,
  type ImportBundle,
} from '../services/records';
import baselineData from '../utils/baseline.json';
import { repairLegacyRatio } from '../utils/units';

interface AppState {
  input: ValuationInput | null;
  result: ValuationResult | null;
  baseline: any;
  overrides: any;
  opinions: Opinion[];
  adjustments: Adjustment[];
  versions: Version[];
  currentVersionId: string | null;
  expert: Expert | null;
  experts: Expert[];
  remoteExperts: Expert[];
  evaluation: Evaluation | null;
  records: ValuationRecord[];
  adjustmentLog: AdjustmentEntry[];
  currentRecordId: string | null;
  lastPruned: number;
  calculate: (input: ValuationInput) => void;
  revalue: () => void;
  addOpinion: (opinion: Omit<Opinion, 'id' | 'at'>) => void;
  updateOpinion: (id: string, opinion: Opinion) => void;
  deleteOpinion: (id: string) => void;
  adjustCoefficient: (keyPath: string, newValue: number, reason: string) => void;
  createVersion: (status?: string) => void;
  setCurrentVersion: (versionId: string) => void;
  loginExpert: (expert: Expert) => void;
  registerExpert: (expert: Expert) => void;
  loadRemoteExperts: (experts: Expert[]) => void;
  logoutExpert: () => void;
  setEvaluation: (content: string) => void;
  loadRecord: (record: ValuationRecord) => void;
  deleteRecord: (id: string) => void;
  importRecords: (bundle: ImportBundle) => void;
  exportAdjustmentSubmission: () => { json: string; csv: string; count: number };
  exportSkillPackage: () => any;
}

function getByPath(obj: any, path: string): any {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

function makeRecord(
  input: ValuationInput,
  overrides: any,
  result: ValuationResult,
  expert: Expert | null,
  kind: RecordKind,
): ValuationRecord {
  return {
    id: `R${Date.now()}${Math.floor(Math.random() * 1000)}`,
    at: new Date().toISOString(),
    kind,
    expert: expert || { name: '未登记', email: '' },
    input,
    overrides,
    result,
    evaluation: null,
  };
}

export const useStore = create<AppState>((set, get) => ({
  input: null,
  result: null,
  baseline: baselineData,
  overrides: {},
  opinions: [],
  adjustments: [],
  versions: [],
  currentVersionId: null,
  expert: loadExpert(),
  experts: loadExperts(),
  remoteExperts: [],
  evaluation: null,
  records: loadRecords(),
  adjustmentLog: loadAdjustments(),
  currentRecordId: null,
  lastPruned: 0,

  calculate: (input: ValuationInput) => {
    const { overrides, expert, records } = get();
    const result = calculateValuation(input, overrides);
    const record = makeRecord(input, overrides, result, expert, 'initial');
    const appended = appendRecord(records, record);
    saveRecords(appended.records);

    set({
      input,
      result,
      opinions: [], // Reset opinions for new calculation
      adjustments: [], // Reset adjustments for new calculation
      evaluation: null, // 新计算需重新评估
      records: appended.records,
      currentRecordId: record.id,
      lastPruned: appended.pruned,
    });
  },

  revalue: () => {
    const { input, overrides, expert, records } = get();
    if (!input) return;
    const result = calculateValuation(input, overrides);
    const record = makeRecord(input, overrides, result, expert, 'revalue');
    const appended = appendRecord(records, record);
    saveRecords(appended.records);

    set({
      result,
      evaluation: null,
      records: appended.records,
      currentRecordId: record.id,
      lastPruned: appended.pruned,
    });
  },

  loginExpert: (expert: Expert) => {
    const normalized: Expert = { name: expert.name.trim(), email: expert.email.trim() };
    const experts = upsertExpert(get().experts, normalized);
    saveExperts(experts);
    saveExpert(normalized);
    set({ expert: normalized, experts, evaluation: null });
  },

  registerExpert: (expert: Expert) => {
    get().loginExpert(expert);
  },

  loadRemoteExperts: (experts: Expert[]) => {
    set({ remoteExperts: experts });
  },

  logoutExpert: () => {
    clearExpert();
    set({ expert: null, evaluation: null });
  },

  setEvaluation: (content: string) => {
    const { expert, records, currentRecordId } = get();
    const evaluation: Evaluation = {
      content,
      author: expert?.name || '专家',
      email: expert?.email || '',
      at: new Date().toISOString(),
    };
    let nextRecords = records;
    if (currentRecordId) {
      nextRecords = records.map((r) => (r.id === currentRecordId ? { ...r, evaluation } : r));
      saveRecords(nextRecords);
    }
    set({ evaluation, records: nextRecords });
  },

  loadRecord: (record: ValuationRecord) => {
    const input = record.input
      ? {
          ...record.input,
          occupancy_input: repairLegacyRatio(record.input.occupancy_input),
          fb_ratio: repairLegacyRatio(record.input.fb_ratio),
        }
      : null;
    const overrides = record.overrides || {};
    const evaluation = record.evaluation || null;
    const result = record.result || null;
    set({ input, overrides, evaluation, result, currentRecordId: record.id });
  },

  addOpinion: (opinion: Omit<Opinion, 'id' | 'at'>) => {
    const newOpinion: Opinion = {
      ...opinion,
      id: `OP${Date.now()}`,
      at: new Date().toISOString(),
    };

    set((state) => ({
      opinions: [...state.opinions, newOpinion],
    }));
  },

  updateOpinion: (id: string, updatedOpinion: Opinion) => {
    set((state) => ({
      opinions: state.opinions.map((op) => (op.id === id ? updatedOpinion : op)),
    }));
  },

  deleteOpinion: (id: string) => {
    set((state) => ({
      opinions: state.opinions.filter((op) => op.id !== id),
    }));
  },

  adjustCoefficient: (keyPath: string, newValue: number, reason: string) => {
    const state = get();
    const currentOverrides = state.overrides;
    const newOverrides = { ...currentOverrides };

    const pathParts = keyPath.split('.');
    let current = newOverrides;

    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }

    const lastPart = pathParts[pathParts.length - 1];
    const previousOverride = getByPath(currentOverrides, keyPath);
    const oldValue = previousOverride !== undefined ? previousOverride : getByPath(state.baseline, keyPath);
    current[lastPart] = newValue;

    const adjustment: Adjustment = {
      who: state.expert?.name || '专家',
      at: new Date().toISOString(),
      key: keyPath,
      old: oldValue,
      new: newValue,
      reason,
    };

    const entry: AdjustmentEntry = {
      id: `ADJ${Date.now()}${Math.floor(Math.random() * 1000)}`,
      at: adjustment.at,
      expert: state.expert || { name: '未登记', email: '' },
      hotel_name: state.input?.hotel_name || '',
      key: keyPath,
      old: oldValue,
      new: newValue,
      reason,
      recordId: state.currentRecordId || undefined,
    };
    const adjustmentLog = [...state.adjustmentLog, entry];
    saveAdjustments(adjustmentLog);

    const input = state.input;
    if (input) {
      const result = calculateValuation(input, newOverrides);
      set((s) => ({
        overrides: newOverrides,
        result,
        adjustments: [...s.adjustments, adjustment],
        adjustmentLog,
      }));
    } else {
      set((s) => ({
        overrides: newOverrides,
        adjustments: [...s.adjustments, adjustment],
        adjustmentLog,
      }));
    }
  },

  createVersion: (status = 'draft') => {
    const newVersion: Version = {
      id: `v${Date.now()}`,
      status,
      at: new Date().toISOString(),
    };

    set((state) => ({
      versions: [...state.versions, newVersion],
      currentVersionId: newVersion.id,
    }));
  },

  setCurrentVersion: (versionId: string) => {
    set({ currentVersionId: versionId });
  },

  deleteRecord: (id: string) => {
    const records = get().records.filter((r) => r.id !== id);
    saveRecords(records);
    set({ records });
  },

  importRecords: (bundle: ImportBundle) => {
    const recordMap = new Map<string, ValuationRecord>();
    [...get().records, ...(bundle.records || [])].forEach((r) => recordMap.set(r.id, r));
    const records = [...recordMap.values()].sort((a, b) => a.at.localeCompare(b.at));

    const experts = (bundle.experts || []).reduce(
      (acc, e) => upsertExpert(acc, e),
      get().experts,
    );

    const entryMap = new Map<string, AdjustmentEntry>();
    [...get().adjustmentLog, ...(bundle.adjustments || [])].forEach((e) => entryMap.set(e.id, e));
    const adjustmentLog = [...entryMap.values()].sort((a, b) => a.at.localeCompare(b.at));

    saveRecords(records);
    saveExperts(experts);
    saveAdjustments(adjustmentLog);
    set({ records, experts, adjustmentLog, lastPruned: 0 });
  },

  exportAdjustmentSubmission: () => {
    const { adjustmentLog, experts } = get();
    const json = JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        experts,
        adjustments: adjustmentRows(adjustmentLog),
      },
      null,
      2,
    );
    return { json, csv: adjustmentsToCSV(adjustmentLog), count: adjustmentLog.length };
  },

  exportSkillPackage: () => {
    const state = get();
    if (!state.input || !state.result) {
      return null;
    }

    const skillPackage = {
      metadata: {
        name: 'hotel-valuation-skill',
        version: '1.0.0',
        description: '酒店资产估值验证技能包',
        createdAt: new Date().toISOString(),
      },
      expert: state.expert,
      evaluation: state.evaluation,
      input: state.input,
      result: state.result,
      baseline: { ...state.baseline, ...state.overrides },
      opinions: state.opinions,
      adjustments: state.adjustments,
      versions: state.versions,
      records: state.records,
      schema: {
        input: 'ValuationInput schema',
        output: 'ValuationResult schema with trace',
      },
    };

    return skillPackage;
  },
}));
