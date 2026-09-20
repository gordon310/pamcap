import { create } from 'zustand';
import type { ValuationInput, ValuationResult, Opinion, Adjustment, Version, Expert, Evaluation } from '../types';
import { calculateValuation } from '../services/valuation-engine';
import { loadExpert, saveExpert, clearExpert } from '../services/profile';
import baselineData from '../utils/baseline.json';

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
  evaluation: Evaluation | null;
  calculate: (input: ValuationInput) => void;
  addOpinion: (opinion: Omit<Opinion, 'id' | 'at'>) => void;
  updateOpinion: (id: string, opinion: Opinion) => void;
  deleteOpinion: (id: string) => void;
  adjustCoefficient: (keyPath: string, newValue: number, reason: string) => void;
  createVersion: (status?: string) => void;
  setCurrentVersion: (versionId: string) => void;
  registerExpert: (expert: Expert) => void;
  logoutExpert: () => void;
  setEvaluation: (content: string) => void;
  exportSkillPackage: () => any;
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
  evaluation: null,

  calculate: (input: ValuationInput) => {
    const { overrides } = get();
    const result = calculateValuation(input, overrides);
    
    set({ 
      input,
      result,
      opinions: [], // Reset opinions for new calculation
      adjustments: [], // Reset adjustments for new calculation
      evaluation: null, // 新计算需重新评估
    });
  },

  registerExpert: (expert: Expert) => {
    saveExpert(expert);
    set({ expert });
  },

  logoutExpert: () => {
    clearExpert();
    set({ expert: null, evaluation: null });
  },

  setEvaluation: (content: string) => {
    const { expert } = get();
    set({
      evaluation: {
        content,
        author: expert?.name || '专家',
        email: expert?.email || '',
        at: new Date().toISOString(),
      },
    });
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
      opinions: state.opinions.map(op => op.id === id ? updatedOpinion : op),
    }));
  },

  deleteOpinion: (id: string) => {
    set((state) => ({
      opinions: state.opinions.filter(op => op.id !== id),
    }));
  },

  adjustCoefficient: (keyPath: string, newValue: number, reason: string) => {
    // Update overrides
    const currentOverrides = get().overrides;
    const newOverrides = { ...currentOverrides };
    
    // Set the new value at the specified path
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
    current[lastPart] = newValue;
    
    // Create adjustment record
    const adjustment: Adjustment = {
      who: '专家',
      at: new Date().toISOString(),
      key: keyPath,
      old: get().baseline[keyPath] || 'N/A', // This is a simplification
      new: newValue,
      reason,
    };
    
    // Recalculate with new overrides
    const input = get().input;
    if (input) {
      const result = calculateValuation(input, newOverrides);
      
      set((state) => ({
        overrides: newOverrides,
        result,
        adjustments: [...state.adjustments, adjustment],
      }));
    } else {
      set((state) => ({
        overrides: newOverrides,
        adjustments: [...state.adjustments, adjustment],
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
      baseline: { ...state.baseline, ...state.overrides }, // Include overrides in exported baseline
      opinions: state.opinions,
      adjustments: state.adjustments,
      versions: state.versions,
      schema: {
        input: 'ValuationInput schema',
        output: 'ValuationResult schema with trace'
      }
    };
    
    return skillPackage;
  },
}));