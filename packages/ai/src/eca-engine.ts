import type { EcaAction, EcaCondition, EcaEvent, EcaRule } from './types';

function getField(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur && typeof cur === 'object') cur = (cur as Record<string, unknown>)[p];
    else return undefined;
  }
  return cur;
}

function matchCondition(c: EcaCondition, payload: unknown): boolean {
  const v = getField(payload, c.field);
  switch (c.op) {
    case 'eq':
      return v === c.value;
    case 'ne':
      return v !== c.value;
    case 'gt':
      return typeof v === 'number' && typeof c.value === 'number' && v > c.value;
    case 'lt':
      return typeof v === 'number' && typeof c.value === 'number' && v < c.value;
    case 'gte':
      return typeof v === 'number' && typeof c.value === 'number' && v >= c.value;
    case 'lte':
      return typeof v === 'number' && typeof c.value === 'number' && v <= c.value;
    case 'in':
      return Array.isArray(c.value) && (c.value as unknown[]).includes(v);
    case 'nin':
      return Array.isArray(c.value) && !(c.value as unknown[]).includes(v);
    case 'contains': {
      if (typeof v === 'string' && typeof c.value === 'string')
        return v.toLowerCase().includes(c.value.toLowerCase());
      if (Array.isArray(v)) return (v as unknown[]).includes(c.value);
      return false;
    }
    case 'between': {
      if (!Array.isArray(c.value) || c.value.length !== 2) return false;
      const [lo, hi] = c.value as [number, number];
      return typeof v === 'number' && v >= lo && v <= hi;
    }
    case 'regex': {
      if (typeof v !== 'string' || typeof c.value !== 'string') return false;
      try {
        return new RegExp(c.value).test(v);
      } catch {
        return false;
      }
    }
  }
}

export interface EvaluationResult {
  matched: { ruleId: string; ruleName: string; actions: EcaAction[] }[];
  emitted: EcaAction[];
}

export function evaluate(event: EcaEvent, payload: unknown, rules: EcaRule[]): EvaluationResult {
  const matched: EvaluationResult['matched'] = [];
  const emitted: EcaAction[] = [];
  for (const r of rules) {
    if (!r.enabled) continue;
    if (r.event !== event) continue;
    const ok = r.conditions.length === 0 || r.conditions.every((c) => matchCondition(c, payload));
    if (ok) {
      matched.push({ ruleId: r.id, ruleName: r.name, actions: r.actions });
      emitted.push(...r.actions);
    }
  }
  return { matched, emitted };
}

export function recordRuleHistory(r: EcaRule, payload: unknown, matched: boolean): EcaRule {
  return {
    ...r,
    history: [
      {
        at: new Date().toISOString(),
        payload,
        matched,
        actionsRun: matched ? r.actions.map((a) => a.type) : [],
      },
      ...r.history.slice(0, 99),
    ],
  };
}
