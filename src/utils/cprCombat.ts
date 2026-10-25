import { CriticalInjury, Weapon } from '../types/character';
import { CPR_CRITICAL_INJURIES_BODY, CPR_CRITICAL_INJURIES_HEAD } from '../data/cprRules';
import { rollD6 } from './dice';
import { Combatant } from '../types/combat';

export function skillBase(c: Combatant | undefined, pattern: RegExp, stat: 'ref' | 'dex'): number | undefined {
  const skill = c?.skills?.find(s => pattern.test(`${s.id ?? ''} ${s.nameRu ?? ''} ${(s as { name?: string }).name ?? ''}`));
  return skill?.base ?? (skill?.level !== undefined && c ? c[stat] + skill.level : undefined);
}

export function attackBase(c: Combatant | undefined, weapon: Pick<Weapon, 'category' | 'skillId'>, melee: boolean): number | undefined {
  const category = `${weapon.skillId ?? ''} ${weapon.category}`.toLowerCase();
  const pattern = /autofire/.test(category) ? /autofire|автоогонь|очеред/i : /brawl/.test(category) ? /brawl|драка/i :
    /martial/.test(category) ? /martial|боев.*искус/i : melee ? /melee|холодное/i :
    /bow/.test(category) ? /archery|луки|арбалет/i : /launcher/.test(category) ? /heavy.?weapons|тяжёлое оружие|тяжелое оружие/i :
    /rifle|shotgun/.test(category) ? /shoulder.?arms|длинноствольное/i : /handgun|короткоствольное|стрельба из ПП/i;
  const base = skillBase(c, pattern, melee ? 'dex' : 'ref');
  // Older custom/gang templates use one explicitly supplied Shooting base.
  return base ?? (!melee && !/autofire/.test(category) && /pistol|rifle|shotgun|smg/.test(category)
    ? skillBase(c, /^\s*(?:стрельба|shooting)\s*$/i, 'ref') : undefined);
}

export function activeInjuries(injuries: CriticalInjury[] = []): CriticalInjury[] {
  const canonical = [...CPR_CRITICAL_INJURIES_BODY, ...CPR_CRITICAL_INJURIES_HEAD];
  return injuries.filter(i => i.isActive).map(i => ({ ...i, ...canonical.find(rule => rule.id === i.id), isActive: true }));
}

export function rollCriticalInjury(location: 'head' | 'body', existing: CriticalInjury[] = [], manual?: string | number): CriticalInjury | undefined {
  const pool = location === 'head' ? CPR_CRITICAL_INJURIES_HEAD : CPR_CRITICAL_INJURIES_BODY;
  const used = new Set(activeInjuries(existing).map(i => i.id));
  const available = pool.filter(i => !used.has(i.id));
  const selected = available.find(i => typeof manual === 'string' ? i.id === manual : i.rollNumber === manual);
  if (selected) return { ...selected, isActive: true };
  if (!available.length) return undefined;
  // Equivalent to rerolling used results, without an unbounded rejection loop.
  const weighted = available.flatMap(i => Array.from({ length: 6 - Math.abs(7 - i.rollNumber) }, () => i));
  const result = weighted[Math.floor(Math.random() * weighted.length)];
  return { ...result, isActive: true };
}

export function deathSaveModifier(c: Pick<Combatant, 'criticalInjuries' | 'deathSavePenalties'>): number {
  return c.deathSavePenalties + activeInjuries(c.criticalInjuries).reduce((sum, i) => sum + (i.deathSaveModifier ?? 0), 0);
}

export function actionModifier(c: Combatant, isMelee = false): number {
  return getWoundedStatus(c.hpCurrent, c.hpMax).penalty + (c.armorPenalty ?? 0) +
    activeInjuries(c.criticalInjuries).reduce((sum, i) => sum + (i.actionModifier ?? 0) + (isMelee ? i.meleeModifier ?? 0 : i.rangedModifier ?? 0), 0);
}

export function effectiveMove(c: Combatant): number {
  return Math.max(1, c.move + (c.armorPenalty ?? 0) + (c.hpCurrent <= 0 ? -6 : 0) +
    activeInjuries(c.criticalInjuries).reduce((sum, i) => sum + (i.moveModifier ?? 0), 0));
}

export function applyCombatDamage(c: Combatant, hpLoss: number, location: 'head' | 'body', newSp: number, injury?: CriticalInjury): Combatant {
  const mortalHit = c.hpCurrent <= 0 && hpLoss > 0 && !c.isDead;
  let nextInjury = injury;
  if (injury && activeInjuries(c.criticalInjuries).some(i => i.id === injury.id)) nextInjury = rollCriticalInjury(location, c.criticalInjuries);
  if (!nextInjury && mortalHit) nextInjury = rollCriticalInjury(location, c.criticalInjuries);
  return { ...c, hpCurrent: Math.max(0, c.hpCurrent - hpLoss),
    [location === 'head' ? 'headSp' : 'bodySp']: newSp,
    criticalInjuries: nextInjury ? [...c.criticalInjuries, nextInjury] : c.criticalInjuries,
    deathSavePenalties: c.deathSavePenalties + (mortalHit ? 1 : 0),
    isStabilized: hpLoss > 0 ? false : c.isStabilized };
}

export interface ApplyDamageParams {
  rawDamage: number;
  location: 'head' | 'body';
  targetSp: number;
  isMelee?: boolean; // Melee weapons and Martial Arts ignore half armor SP
  isApAmmo?: boolean; // AP ammo ablates SP by 2 instead of 1
  isCritInjuryRoll?: boolean; // If two 6s rolled, +5 bonus damage and auto injury
  manualInjuryRoll2d6?: number; // Optional manual 2d6 roll (2-12)
  manualInjuryId?: string; // Optional manual selection of specific injury ID
  existingInjuries?: CriticalInjury[];
  targetHp?: number;
  coverHp?: number;
  isBrawling?: boolean;
  armorPenetration?: 'none' | 'half' | 'ignore';
}

export interface DamageResolutionResult {
  effectiveSp: number;
  penetratingDamage: number;
  finalHpLoss: number;
  isPenetrated: boolean;
  spAblated: number;
  newSp: number;
  critBonusHp: number;
  criticalInjury?: CriticalInjury;
  logSummary: string;
  newCoverHp?: number;
}

export function resolveCprDamage(params: ApplyDamageParams): DamageResolutionResult {
  const {
    rawDamage,
    location,
    targetSp,
    isMelee = false,
    isApAmmo = false,
    isCritInjuryRoll = false,
    manualInjuryRoll2d6,
    manualInjuryId,
    existingInjuries = [], targetHp, coverHp = 0, isBrawling = false
  } = params;

  if (![rawDamage, targetSp, coverHp].every(n => Number.isInteger(n) && n >= 0)) throw new Error('Урон, SP и HP укрытия должны быть целыми неотрицательными числами.');
  if (coverHp > 0) return {
    effectiveSp: targetSp, penetratingDamage: 0, finalHpLoss: 0, isPenetrated: false,
    spAblated: 0, newSp: targetSp, critBonusHp: 0, newCoverHp: Math.max(0, coverHp - rawDamage),
    logSummary: `Атака укрытия: ${rawDamage} урона. HP укрытия ${coverHp} → ${Math.max(0, coverHp - rawDamage)}. Избыточный урон теряется; цель не повреждена.`
  };

  // Melee attacks ignore half armor SP (round down in CPR)
  const penetration = params.armorPenetration ?? (isMelee && !isBrawling ? 'half' : 'none');
  const effectiveSp = penetration === 'ignore' ? 0 : penetration === 'half' ? Math.floor(targetSp / 2) : targetSp;
  const headMultiplier = Math.max(2, ...activeInjuries(existingInjuries).map(i => i.headMultiplier ?? 2));
  const isPenetrated = rawDamage > effectiveSp;

  let penetratingDamage = 0;
  let finalHpLoss = 0;
  let spAblated = 0;
  let newSp = targetSp;

  if (isPenetrated) {
    penetratingDamage = rawDamage - effectiveSp;
    // Head shots multiply penetrating damage by 2
    finalHpLoss = location === 'head' ? penetratingDamage * headMultiplier : penetratingDamage;

    // Ablation
    spAblated = isApAmmo ? 2 : 1;
    newSp = Math.max(0, targetSp - spAblated);
  }

  // Two 6's rule: +5 bonus damage and a Critical Injury (even if armor wasn't penetrated!)
  let critBonusHp = 0;
  let criticalInjury: CriticalInjury | undefined;

  const causesInjury = isCritInjuryRoll || (targetHp !== undefined && targetHp <= 0 && finalHpLoss > 0);
  if (causesInjury) {
    critBonusHp = 5;
    finalHpLoss += critBonusHp;

    criticalInjury = rollCriticalInjury(location, existingInjuries, manualInjuryId ?? manualInjuryRoll2d6);
  }

  // Format log message
  let logSummary = `Урон: ${rawDamage} по [${location === 'head' ? 'ГОЛОВЕ' : 'ТЕЛУ'}]. Броня ОС: ${effectiveSp}. `;
  if (isPenetrated) {
    logSummary += `ПРОБИТИЕ! Пробивающий урон: ${penetratingDamage}${location === 'head' ? ' x' + headMultiplier + ' (голова) = ' + penetratingDamage * headMultiplier : ''}. Броня стёрта на -${spAblated} (теперь ОС ${newSp}). `;
  } else {
    logSummary += `Броня отразила атаку! (0 урона). `;
  }

  if (causesInjury && criticalInjury) {
    logSummary += `КРИТИЧЕСКАЯ ТРАВМА: +5 урона и [${criticalInjury.nameRu}]! `;
  }

  logSummary += `Итого потеряно ПЗ: ${finalHpLoss}.`;

  return {
    effectiveSp,
    penetratingDamage,
    finalHpLoss,
    isPenetrated,
    spAblated,
    newSp,
    critBonusHp,
    criticalInjury,
    logSummary
  };
}

export function getWoundedStatus(hpCurrent: number, hpMax: number): {
  labelRu: string;
  penalty: number;
  colorClass: string;
} {
  if (hpCurrent <= 0) {
    return {
      labelRu: 'СМЕРТЕЛЬНО РАНЕН (-4)',
      penalty: -4,
      colorClass: 'text-red-500 bg-red-950/80 border-red-600 animate-pulse'
    };
  }
  if (hpCurrent < Math.ceil(hpMax / 2)) {
    return {
      labelRu: 'ТЯЖЕЛО РАНЕН (-2)',
      penalty: -2,
      colorClass: 'text-amber-400 bg-amber-950/60 border-amber-600'
    };
  }
  return {
    labelRu: 'НОРМА (0)',
    penalty: 0,
    colorClass: 'text-emerald-400 bg-emerald-950/40 border-emerald-600/60'
  };
}
