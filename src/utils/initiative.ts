import { executeCPRCheck, ManualD10Input } from './dice';
import { ActiveCombatState, Combatant } from '../types/combat';

export function rollInitiative(c: Pick<Combatant, 'ref' | 'armorPenalty' | 'initiativeBonus'>, manual?: ManualD10Input): number {
  return executeCPRCheck(c.ref, (c.armorPenalty ?? 0) + (c.initiativeBonus ?? 0), 0, undefined, manual).grandTotal;
}

// Reroll tied groups to establish their order; original initiative values stay visible.
export function sortInitiative<T extends Pick<Combatant, 'initiative' | 'ref' | 'armorPenalty' | 'initiativeBonus'>>(actors: T[], rerollTies = true, depth = 0): T[] {
  const ordered = [...actors].sort((a, b) => b.initiative - a.initiative);
  if (!rerollTies) return ordered;
  if (depth > 32) throw new Error('Не удалось разрешить ничью инициативы. Повторите бросок.');
  const result: T[] = [];
  for (let start = 0; start < ordered.length;) {
    let end = start + 1;
    while (end < ordered.length && ordered[end].initiative === ordered[start].initiative) end++;
    const tied = ordered.slice(start, end);
    if (tied.length === 1) result.push(tied[0]);
    else {
      const rerolls = tied.map((actor, i) => ({ ...actor, initiative: rollInitiative(actor), originalIndex: i }));
      const ranked = sortInitiative(rerolls, true, depth + 1);
      result.push(...ranked.map(r => tied[r.originalIndex]));
    }
    start = end;
  }
  return result;
}

// Ordinary edits/restores keep already resolved ties. Explicit initiative rolls
// resolve ties once; all reorders preserve the current actor during active combat.
export function orderCombatants(state: ActiveCombatState, combatants = state.combatants): ActiveCombatState {
  const ordered = sortInitiative(combatants, false);
  return { ...state, combatants: ordered,
    currentTurnIndex: state.isActive ? preserveTurn(state.combatants, ordered, state.currentTurnIndex) : 0 };
}

export function preserveTurn<T extends { id: string }>(before: T[], after: T[], index: number): number {
  const id = before[index]?.id;
  const found = after.findIndex(c => c.id === id);
  return found >= 0 ? found : Math.min(index, Math.max(0, after.length - 1));
}
