import { sfx } from './audio';
import confetti from 'canvas-confetti';

export function rollD10(): number {
  return Math.floor(Math.random() * 10) + 1;
}

export function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1;
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
  textSummary: string;
}

export function executeCPRCheck(
  baseVal: number,
  modifier: number = 0,
  luckSpent: number = 0,
  targetDv?: number
): CPRCheckResult {
  sfx.playDiceRoll();

  const firstDie = rollD10();
  let d10Total = firstDie;
  let isCritSuccess = false;
  let isCritFail = false;
  let explodedDie: number | undefined;
  let botchDie: number | undefined;

  if (firstDie === 10) {
    isCritSuccess = true;
    explodedDie = rollD10();
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
    botchDie = rollD10();
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

  if (isCritSuccess) {
    rollParts.push(`1d10 [10! + ${explodedDie}] = +${d10Total}`);
  } else if (isCritFail) {
    rollParts.push(`1d10 [1! - ${botchDie}] = ${d10Total}`);
  } else {
    rollParts.push(`1d10 [${firstDie}]`);
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
}

export function rollDamageFormula(formula: string): DamageRollResult {
  sfx.playHit();
  
  // match "3d6", "4d6", "5d6" etc.
  const match = formula.toLowerCase().match(/^(\d+)d6(?:\+(\d+))?$/);
  const count = match ? parseInt(match[1], 10) : 3;
  const staticBonus = match && match[2] ? parseInt(match[2], 10) : 0;

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
  const totalDamage = baseSum + staticBonus + bonusDamage;

  return {
    formula,
    diceRolls,
    baseSum,
    bonusDamage,
    totalDamage,
    sixesCount,
    isCriticalInjury
  };
}

export interface DeathSaveResult {
  roll: number;
  penalty: number;
  bodyStat: number;
  total: number;
  isSaved: boolean;
  isCriticalDeath: boolean;
  message: string;
}

export function executeDeathSave(bodyStat: number, penalty: number): DeathSaveResult {
  sfx.playDiceRoll();
  const roll = rollD10();
  const total = roll + penalty;
  
  // Natural 10 is automatic death
  const isCriticalDeath = roll === 10;
  // Saved if total is LESS than BODY stat
  const isSaved = !isCriticalDeath && total < bodyStat;

  let message = '';
  if (isCriticalDeath) {
    message = `Критический провал! Выпала натуральная 10. Персонаж погибает на месте!`;
  } else if (isSaved) {
    message = `Спасбросок успешен! Бросок: 1d10(${roll}) + штраф(${penalty}) = ${total} < ТЕЛО(${bodyStat}). Персонаж цепляется за жизнь!`;
  } else {
    message = `Спасбросок провален! Бросок: 1d10(${roll}) + штраф(${penalty}) = ${total} >= ТЕЛО(${bodyStat}). Персонаж умирает!`;
  }

  return {
    roll,
    penalty,
    bodyStat,
    total,
    isSaved,
    isCriticalDeath,
    message
  };
}
