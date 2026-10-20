import { CriticalInjury } from '../types/character';
import { CPR_CRITICAL_INJURIES_BODY, CPR_CRITICAL_INJURIES_HEAD } from '../data/cprRules';
import { rollD6 } from './dice';

export interface ApplyDamageParams {
  rawDamage: number;
  location: 'head' | 'body';
  targetSp: number;
  isMelee?: boolean; // Melee weapons and Martial Arts ignore half armor SP
  isApAmmo?: boolean; // AP ammo ablates SP by 2 instead of 1
  isCritInjuryRoll?: boolean; // If two 6s rolled, +5 bonus damage and auto injury
  manualInjuryRoll2d6?: number; // Optional manual 2d6 roll (2-12)
  manualInjuryId?: string; // Optional manual selection of specific injury ID
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
    manualInjuryId
  } = params;

  // Melee attacks ignore half armor SP (round down in CPR)
  const effectiveSp = isMelee ? Math.floor(targetSp / 2) : targetSp;
  const isPenetrated = rawDamage > effectiveSp;

  let penetratingDamage = 0;
  let finalHpLoss = 0;
  let spAblated = 0;
  let newSp = targetSp;

  if (isPenetrated) {
    penetratingDamage = rawDamage - effectiveSp;
    // Head shots multiply penetrating damage by 2
    finalHpLoss = location === 'head' ? penetratingDamage * 2 : penetratingDamage;

    // Ablation
    spAblated = isApAmmo ? 2 : 1;
    newSp = Math.max(0, targetSp - spAblated);
  }

  // Two 6's rule: +5 bonus damage and a Critical Injury (even if armor wasn't penetrated!)
  let critBonusHp = 0;
  let criticalInjury: CriticalInjury | undefined;

  if (isCritInjuryRoll) {
    critBonusHp = 5;
    finalHpLoss += critBonusHp;

    const injuryPool = location === 'head' ? CPR_CRITICAL_INJURIES_HEAD : CPR_CRITICAL_INJURIES_BODY;

    if (manualInjuryId) {
      const match = injuryPool.find(i => i.id === manualInjuryId);
      if (match) {
        criticalInjury = { ...match, isActive: true };
      }
    } else {
      // Roll 2d6 for injury or use manual roll
      const roll2d6 = manualInjuryRoll2d6 !== undefined 
        ? Math.min(12, Math.max(2, manualInjuryRoll2d6))
        : rollD6() + rollD6();
      const match = injuryPool.find(i => i.rollNumber === roll2d6);
      if (match) {
        criticalInjury = { ...match, isActive: true };
      }
    }
  }

  // Format log message
  let logSummary = `Урон: ${rawDamage} по [${location === 'head' ? 'ГОЛОВЕ' : 'ТЕЛУ'}]. Броня ОС: ${effectiveSp}. `;
  if (isPenetrated) {
    logSummary += `ПРОБИТИЕ! Пробивающий урон: ${penetratingDamage}${location === 'head' ? ' x2 (голова) = ' + penetratingDamage * 2 : ''}. Броня стёрта на -${spAblated} (теперь ОС ${newSp}). `;
  } else {
    logSummary += `Броня отразила атаку! (0 урона). `;
  }

  if (isCritInjuryRoll && criticalInjury) {
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
  if (hpCurrent <= Math.ceil(hpMax / 2)) {
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
