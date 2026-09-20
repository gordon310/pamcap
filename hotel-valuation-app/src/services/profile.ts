import type { Evaluation, Expert } from '../types';

const EXPERT_KEY = 'pamcap.expert';

export function isValidEmail(email: string): boolean {
  const value = (email || '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

function safeStorage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function loadExpert(): Expert | null {
  const storage = safeStorage();
  if (!storage) return null;
  const raw = storage.getItem(EXPERT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Expert;
    if (parsed && parsed.name && parsed.email) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function saveExpert(expert: Expert): void {
  const storage = safeStorage();
  if (!storage) return;
  storage.setItem(EXPERT_KEY, JSON.stringify(expert));
}

export function clearExpert(): void {
  const storage = safeStorage();
  if (!storage) return;
  storage.removeItem(EXPERT_KEY);
}

export function hasEvaluation(evaluation: Evaluation | null): boolean {
  return !!evaluation && evaluation.content.trim().length > 0;
}
