import { sfx } from './audio';
import confetti from 'canvas-confetti';

export function rollD10(): number {
  return Math.floor(Math.random() * 10) + 1;
}

export function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export interface ManualD10Input {
  firstDie: number;
  explodedDie?: number;
  botchDie?: number;
}

export interface CPRCheckResult {
  baseVal: number;
  luckSpent: number;
  firstDie: number;
  explodedDie?: number;
  botchDie?: number;
  d10Total: number;
  grandTotal: number;
  targetDv?: number;
  margin?: number;
  isSuccess?: boolean;
  isCritSuccess: boolean;
  isCritFail: boolean;
  isManualRoll?: boolean;
  textSummary: string;
}

export function executeCPRCheck(
  baseVal: number,
  modifier: number = 0,
  luckSpent: number = 0,
  targetDv?: number,
  manualD10?: ManualD10Input
): CPRCheckResult {
  if (!manualD10) {
    sfx.playDiceRoll();
  }

  const firstDie = manualD10 ? Math.min(10, Math.max(1, manualD10.firstDie)) : rollD10();
  let d10Total = firstDie;
  let isCritSuccess = false;
  let isCritFail = false;
  let explodedDie: number | undefined = manualD10?.explodedDie !== undefined ? Math.min(10, Math.max(1, manualD10.explodedDie)) : undefined;
  let botchDie: number | undefined = manualD10?.botchDie !== undefined ? Math.min(10, Math.max(1, manualD10.botchDie)) : undefined;

  if (firstDie === 10) {
    isCritSuccess = true;
    if (explodedDie === undefined) {
      explodedDie = rollD10();
    }
    d10Total += explodedDie;
    setTimeout(() => {
      sfx.playCritSuccess();
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#00f0ff', '#fcee0a', '#ff003c']
        });
      } catch {
        // ignore if confetti not loaded
      }
    }, 120);
  } else if (firstDie === 1) {
    isCritFail = true;
    if (botchDie === undefined) {
      botchDie = rollD10();
    }
    d10Total -= botchDie;
    setTimeout(() => {
      sfx.playCritFailure();
    }, 120);
  }

  const grandTotal = baseVal + modifier + luckSpent + d10Total;
  let margin: number | undefined;
  let isSuccess: boolean | undefined;

  if (targetDv !== undefined) {
    margin = grandTotal - targetDv;
    // In CPR: roll must BEAT the DV (strictly greater than target DV)
    isSuccess = grandTotal > targetDv;
  }

  const rollParts: string[] = [`база ${baseVal}`];
  if (modifier !== 0) rollParts.push(`мод ${modifier > 0 ? '+' : ''}${modifier}`);
  if (luckSpent > 0) rollParts.push(`удача +${luckSpent}`);

  const manualTag = manualD10 ? ' [ручной]' : '';

  if (isCritSuccess) {
    rollParts.push(`1d10${manualTag} [10! + ${explodedDie}] = +${d10Total}`);
  } else if (isCritFail) {
    rollParts.push(`1d10${manualTag} [1! - ${botchDie}] = ${d10Total}`);
  } else {
    rollParts.push(`1d10${manualTag} [${firstDie}]`);
  }

  let textSummary = `${rollParts.join(' + ')} = ${grandTotal}`;
  if (targetDv !== undefined) {
    textSummary += ` против Сл (DV) ${targetDv} ➔ ${isSuccess ? 'УСПЕХ' : 'ПРОВАЛ'} (перевес: ${margin! > 0 ? '+' : ''}${margin})`;
  }

  return {
    baseVal,
    luckSpent,
    firstDie,
    explodedDie,
    botchDie,
    d10Total,
    grandTotal,
    targetDv,
    margin,
    isSuccess,
    isCritSuccess,
    isCritFail,
    isManualRoll: !!manualD10,
    textSummary
  };
}

export interface DamageRollResult {
  formula: string;
  diceRolls: number[];
  baseSum: number;
  bonusDamage: number;
  totalDamage: number;
  sixesCount: number;
  isCriticalInjury: boolean;
  isManualRoll?: boolean;
}

export interface ManualDamageInput {
  totalDamage?: number;
  diceRolls?: number[];
  sixesCount?: number;
  isCriticalInjury?: boolean;
}

export function rollDamageFormula(
  formula: string,
  manualDamage?: ManualDamageInput
): DamageRollResult {
  sfx.playHit();
  
  // match "3d6", "4d6", "5d6" etc.
  const match = formula.trim().toLowerCase().match(/^(\d+)d6(?:\+(\d+))?$/);
  if (!match || Number(match[1]) < 1 || Number(match[1]) > 100) throw new Error('Урон: требуется формула от 1d6 до 100d6, возможно +N.');
  const count = parseInt(match[1], 10);
  const staticBonus = match && match[2] ? parseInt(match[2], 10) : 0;

  if (manualDamage) {
    const sixesCount = manualDamage.diceRolls?.filter(v => v === 6).length ?? manualDamage.sixesCount ?? 0;
    if (manualDamage.diceRolls?.some(v => !Number.isInteger(v) || v < 1 || v > 6)) throw new Error('Результат d6 должен быть от 1 до 6.');
    if (manualDamage.totalDamage !== undefined && (!Number.isInteger(manualDamage.totalDamage) || manualDamage.totalDamage < 0)) throw new Error('Урон должен быть целым неотрицательным числом.');
    const isCriticalInjury = manualDamage.isCriticalInjury ?? (sixesCount >= 2);
    const bonusDamage = isCriticalInjury ? 5 : 0;
    let baseSum = 0;
    let diceRolls: number[] = [];

    if (manualDamage.diceRolls && manualDamage.diceRolls.length > 0) {
      diceRolls = manualDamage.diceRolls;
      baseSum = diceRolls.reduce((a, b) => a + b, 0);
    } else if (manualDamage.totalDamage !== undefined) {
      baseSum = Math.max(0, manualDamage.totalDamage - staticBonus);
      diceRolls = [baseSum];
    }

    const totalDamage = manualDamage.totalDamage !== undefined
      ? manualDamage.totalDamage
      : baseSum + staticBonus;

    return {
      formula,
      diceRolls,
      baseSum,
      bonusDamage,
      totalDamage,
      sixesCount: sixesCount || (isCriticalInjury ? 2 : 0),
      isCriticalInjury,
      isManualRoll: true
    };
  }

  const diceRolls: number[] = [];
  let baseSum = 0;
  let sixesCount = 0;

  for (let i = 0; i < count; i++) {
    const val = rollD6();
    diceRolls.push(val);
    baseSum += val;
    if (val === 6) {
      sixesCount++;
    }
  }

  // Official CPR rule: Two or more 6's cause +5 bonus damage and a Critical Injury!
  const isCriticalInjury = sixesCount >= 2;
  const bonusDamage = isCriticalInjury ? 5 : 0;
  // Bonus Damage is applied directly to HP by the damage resolver, never to armor.
  const totalDamage = baseSum + staticBonus;

  return {
    formula,
    diceRolls,
    baseSum,
    bonusDamage,
    totalDamage,
    sixesCount,
    isCriticalInjury,
    isManualRoll: false
  };
}

export interface DeathSaveResult {
  roll: number;
  penalty: number;
  bodyStat: number;
  total: number;
  isSaved: boolean;
  isCriticalDeath: boolean;
  isManualRoll?: boolean;
  message: string;
}

export function executeDeathSave(
  bodyStat: number, 
  penalty: number,
  manualRoll?: number
): DeathSaveResult {
  if (manualRoll === undefined) {
    sfx.playDiceRoll();
  }
  const roll = manualRoll !== undefined ? Math.min(10, Math.max(1, manualRoll)) : rollD10();
  const total = roll + penalty;
  
  // Natural 10 is automatic death
  const isCriticalDeath = roll === 10;
  // Saved if total is LESS than BODY stat
  const isSaved = !isCriticalDeath && total < bodyStat;

  const manualPrefix = manualRoll !== undefined ? ' [ручной бросок]' : '';

  let message = '';
  if (isCriticalDeath) {
    message = `Критический провал!${manualPrefix} Выпала натуральная 10. Персонаж погибает на месте!`;
  } else if (isSaved) {
    message = `Спасбросок успешен!${manualPrefix} Бросок: 1d10(${roll}) + штраф(${penalty}) = ${total} < ТЕЛО(${bodyStat}). Персонаж цепляется за жизнь!`;
  } else {
    message = `Спасбросок провален!${manualPrefix} Бросок: 1d10(${roll}) + штраф(${penalty}) = ${total} >= ТЕЛО(${bodyStat}). Персонаж умирает!`;
  }

  return {
    roll,
    penalty,
    bodyStat,
    total,
    isSaved,
    isCriticalDeath,
    isManualRoll: manualRoll !== undefined,
    message
  };
}
