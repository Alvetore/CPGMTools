import React, { useEffect, useRef, useState } from 'react';
import { Crosshair, Shield, Zap, Skull, Check, X, AlertTriangle, Dices, Edit3, ArrowLeftRight, Target } from 'lucide-react';
import { Combatant } from '../../types/combat';
import { CPR_RANGE_DV_TABLE, CPR_CRITICAL_INJURIES_HEAD, CPR_CRITICAL_INJURIES_BODY, RANGE_BANDS, RangeBand, weaponRangeKey } from '../../data/cprRules';
import { executeCPRCheck, rollDamageFormula } from '../../utils/dice';
import { resolveCprDamage, actionModifier, activeInjuries, skillBase, attackBase, getWoundedStatus } from '../../utils/cprCombat';
import { sfx } from '../../utils/audio';

function getDefenseModifier(c: Combatant): number {
  return getWoundedStatus(c.hpCurrent, c.hpMax).penalty + (c.armorPenalty ?? 0) + activeInjuries(c.criticalInjuries).reduce((n, i) => n + (i.actionModifier ?? 0), 0);
}

interface AttackResolverModalProps {
  attacker?: Combatant;
  initialAttacker?: Combatant;
  initialTarget?: Combatant;
  combatants: Combatant[];
  onClose: () => void;
  onApplyDamage: (
    targetId: string,
    hpLoss: number,
    location: 'head' | 'body',
    newSp: number,
    logText: string,
    criticalInjury?: any,
    newCoverHp?: number
  ) => void;
  onSpendResources?: (attackerId: string, weaponIndex: number, ammo: number, luck: number) => void;
}

export const AttackResolverModal: React.FC<AttackResolverModalProps> = ({
  attacker: legacyAttacker,
  initialAttacker,
  initialTarget,
  combatants,
  onClose,
  onApplyDamage,
  onSpendResources
}) => {
  const defaultAttacker = initialAttacker || legacyAttacker || combatants[0];

  // Attacker & Target selection
  const [attackerId, setAttackerId] = useState<string>(defaultAttacker?.id || '');
  const currentAttacker = combatants.find(c => c.id === attackerId) || defaultAttacker;

  const potentialTargets = combatants.filter(c => c.id !== currentAttacker?.id && !c.isDead);
  const defaultTargetId = initialTarget && initialTarget.id !== currentAttacker?.id
    ? initialTarget.id
    : potentialTargets[0]?.id || '';

  const [targetId, setTargetId] = useState<string>(defaultTargetId);
  const currentTarget = combatants.find(c => c.id === targetId);

  // Selected weapon
  const [selectedWeaponIndex, setSelectedWeaponIndex] = useState<number>(0);
  const attackerWeapons = currentAttacker?.weapons || [];
  const activeWeapon = attackerWeapons[selectedWeaponIndex] || {
    name: 'Без оружия (Brawling)',
    damage: `${(currentAttacker?.body ?? 6) < 5 ? 1 : (currentAttacker?.body ?? 6) < 7 ? 2 : (currentAttacker?.body ?? 6) < 11 ? 3 : 4}d6`,
    category: 'Brawling',
    standardRof: 2,
    currentAmmo: 0,
    magCapacity: 0
  };

  // Attack parameters
  const [selectedRange, setSelectedRange] = useState<RangeBand>('7-12m');
  const [targetLocation, setTargetLocation] = useState<'head' | 'body'>('body');
  const [isMelee, setIsMelee] = useState<boolean>(/melee|brawl|martial/i.test(activeWeapon.category ?? ''));
  const [isApAmmo, setIsApAmmo] = useState<boolean>(false);
  const [isAmbush, setIsAmbush] = useState<boolean>(false);
  const [coverHp, setCoverHp] = useState<number>(currentTarget?.coverHp ?? 0);
  const [attackerSkillBase, setAttackerSkillBase] = useState<number>(attackBase(currentAttacker, activeWeapon, isMelee) ?? (currentAttacker?.ref ?? 6) + 4);
  const [luckSpent, setLuckSpent] = useState<number>(0);

  // Attack Roll Mode (Auto vs Manual vs Direct Player Total)
  const [attackMode, setAttackMode] = useState<'auto' | 'manual' | 'player_total'>('auto');
  const [manualD10, setManualD10] = useState<number>(5);
  const [manualExploded, setManualExploded] = useState<number>(5);
  const [manualBotch, setManualBotch] = useState<number>(5);
  const [directPlayerTotal, setDirectPlayerTotal] = useState<number>(18);

  // Damage Roll Mode (Auto vs Manual)
  const [damageMode, setDamageMode] = useState<'auto' | 'manual'>('auto');
  const [manualDamageTotal, setManualDamageTotal] = useState<number>(12);
  const [manualIsCrit, setManualIsCrit] = useState<boolean>(false);
  const [manualInjuryId, setManualInjuryId] = useState<string>('');

  // Resolution state
  const [attackRoll, setAttackRoll] = useState<any | null>(null);
  const [damageRoll, setDamageRoll] = useState<any | null>(null);
  const [damageResolution, setDamageResolution] = useState<any | null>(null);
  const [defenseTotal, setDefenseTotal] = useState<number | ''>('');
  const [defenseBase, setDefenseBase] = useState<number | ''>(skillBase(currentTarget, /evasion|уклонение/i, 'dex') ?? '');
  const [dodgeBullets, setDodgeBullets] = useState(false);
  const [attackError, setAttackError] = useState('');
  const [situationalModifier, setSituationalModifier] = useState(0);
  const [autofire, setAutofire] = useState(false);
  const isBrawling = /brawl|драка/i.test(activeWeapon.category);
  const rangeKey = weaponRangeKey(activeWeapon);
  const canAutofire = rangeKey === 'smg' || rangeKey === 'assault_rifle';
  const ammoCost = isMelee ? 0 : autofire ? 10 : 1;
  const cannotDodge = activeInjuries(currentTarget?.criticalInjuries).some(i => i.noDodge);
  const committed = useRef(false);

  useEffect(() => {
    setAttackRoll(null); setDamageRoll(null); setDamageResolution(null); setAttackError('');
  }, [attackerId, targetId, selectedWeaponIndex, selectedRange, targetLocation, isMelee, isApAmmo, isAmbush,
    coverHp, attackerSkillBase, luckSpent, attackMode, manualD10, manualExploded, manualBotch,
    directPlayerTotal, defenseTotal, dodgeBullets, situationalModifier, autofire]);

  // Swap Attacker & Target
  const handleSwapAttackerTarget = () => {
    if (!currentTarget || !currentAttacker) return;
    const oldAttackerId = attackerId;
    const oldTargetId = targetId;
    setAttackerId(oldTargetId);
    setTargetId(oldAttackerId);
    setSelectedWeaponIndex(0);
    const weapon = currentTarget.weapons[0];
    const melee = /melee|brawl|martial/i.test(weapon?.category ?? '');
    setIsMelee(melee);
    setAttackerSkillBase(attackBase(currentTarget, weapon ?? { category: 'Heavy Pistol' }, melee) ?? currentTarget.ref + 4);
    setDefenseBase(skillBase(currentAttacker, /evasion|уклонение/i, 'dex') ?? '');
    setDefenseTotal('');
    setAutofire(false);
    setCoverHp(currentAttacker.coverHp ?? 0);
    setAttackRoll(null);
    setDamageRoll(null);
    setDamageResolution(null);
  };

  // Calculate Target DV
  const defenseRequired = (isMelee || dodgeBullets) && !isAmbush && !cannotDodge;
  const tableKey = autofire ? rangeKey === 'smg' ? 'autofire_smg' : 'autofire_rifle' : rangeKey;
  const rangedDv = tableKey ? CPR_RANGE_DV_TABLE[tableKey]?.dvs[selectedRange] : undefined;
  const targetDv = defenseRequired ? Number(defenseTotal) : isMelee ? 0 : rangedDv;

  // Aimed shot penalty (-8 in CPR)
  const aimedShotPenalty = targetLocation === 'head' ? -8 : 0;
  const injuriesList = targetLocation === 'head' ? CPR_CRITICAL_INJURIES_HEAD : CPR_CRITICAL_INJURIES_BODY;

  const handleRollAttack = () => {
    sfx.playClick();
    setAttackError('');
    if (!currentTarget || !currentAttacker || currentAttacker.isDead) return;
    if (defenseRequired && defenseTotal === '') { setAttackError('Введите итог уклонения цели или бросьте её Evasion перед атакой.'); return; }
    if (!isMelee && (targetDv === null || targetDv === undefined)) { setAttackError('Для этого оружия и дистанции нет допустимой сложности.'); return; }
    if (autofire && (!canAutofire || targetLocation === 'head')) { setAttackError('Автоогонь: только ПП/штурмовая винтовка, попадание в тело.'); return; }
    if (/launcher|shell|buckshot/i.test(activeWeapon.category)) { setAttackError('Атаки по области разрешайте отдельно по правилам области и укрытий. Этот резолвер обрабатывает одну цель.'); return; }
    if (!isMelee && activeWeapon.currentAmmo < ammoCost) { setAttackError(`Недостаточно патронов: требуется ${ammoCost}.`); return; }
    if (attackMode !== 'player_total' && (!Number.isInteger(luckSpent) || luckSpent < 0 || (currentAttacker.luckCurrent !== undefined && luckSpent > currentAttacker.luckCurrent))) { setAttackError('Недопустимый расход Удачи.'); return; }
    let result: any;

    if ((isAmbush || cannotDodge) && isMelee) {
      result = {
        baseVal: attackerSkillBase,
        luckSpent: 0,
        firstDie: 10,
        d10Total: 10,
        grandTotal: attackerSkillBase + 10,
        targetDv: 0,
        margin: attackerSkillBase + 10,
        isSuccess: true,
        isCritSuccess: true,
        isCritFail: false,
        isManualRoll: false,
        textSummary: '🎯 [ЗАСАДА] Атака ближнего боя / захват автоматически попадает в застигнутую врасплох цель!'
      };
    } else if (attackMode === 'player_total') {
      const grandTotal = directPlayerTotal;
      const margin = grandTotal - targetDv!;
      const isSuccess = grandTotal > targetDv!;
      result = {
        baseVal: 0,
        luckSpent: 0,
        firstDie: 0,
        d10Total: 0,
        grandTotal,
        targetDv,
        margin,
        isSuccess,
        isCritSuccess: false,
        isCritFail: false,
        isManualRoll: true,
        textSummary: `Итог броска игрока: ${grandTotal} против СЛ (DV) ${targetDv} ➔ ${isSuccess ? 'УСПЕХ (ПОПАДАНИЕ!)' : 'ПРОВАЛ (ПРОМАХ)'} (перевес: ${margin > 0 ? '+' : ''}${margin})`
      };
    } else if (attackMode === 'manual') {
      result = executeCPRCheck(attackerSkillBase, aimedShotPenalty + actionModifier(currentAttacker, isMelee) + situationalModifier, luckSpent, targetDv!, {
        firstDie: manualD10,
        explodedDie: manualD10 === 10 ? manualExploded : undefined,
        botchDie: manualD10 === 1 ? manualBotch : undefined
      });
    } else {
      result = executeCPRCheck(attackerSkillBase, aimedShotPenalty + actionModifier(currentAttacker, isMelee) + situationalModifier, luckSpent, targetDv!);
    }

    setAttackRoll(result);

    if (result.isSuccess) {
      if (damageMode === 'auto') {
        handleRollDamage(result);
      } else {
        handleApplyManualDamage(result);
      }
    } else {
      setDamageRoll(null);
      setDamageResolution(null);
    }
  };

  const handleRollDamage = (check = attackRoll) => {
    let dResult;
    try { dResult = rollDamageFormula(autofire ? '2d6' : activeWeapon.damage || '3d6'); }
    catch (error) { setAttackError(String(error)); return; }
    if (autofire) dResult.totalDamage *= Math.min(rangeKey === 'smg' ? 3 : 4, Math.max(1, check.margin));
    setDamageRoll(dResult);

    if (currentTarget) {
      const currentSp = targetLocation === 'head' ? currentTarget.headSp : currentTarget.bodySp;
      const absorbedByCover = Math.min(coverHp, dResult.totalDamage);

      const resolved = resolveCprDamage({
        rawDamage: dResult.totalDamage,
        location: targetLocation,
        targetSp: currentSp,
        isMelee,
        isApAmmo,
        isCritInjuryRoll: dResult.isCriticalInjury,
        existingInjuries: currentTarget.criticalInjuries, targetHp: currentTarget.hpCurrent, coverHp, isBrawling
      });

      if (coverHp > 0) {
        resolved.logSummary = `[Укрытие поглотило ${absorbedByCover}/${coverHp} HP] ${resolved.logSummary}`;
      }
      setDamageResolution(resolved);
    }
  };

  const handleApplyManualDamage = (_check = attackRoll) => {
    let dResult;
    try { dResult = rollDamageFormula(activeWeapon.damage || '3d6', {
      totalDamage: manualDamageTotal,
      isCriticalInjury: manualIsCrit
    }); } catch (error) { setAttackError(String(error)); setDamageResolution(null); return; }
    if (autofire) dResult.totalDamage *= Math.min(rangeKey === 'smg' ? 3 : 4, Math.max(1, _check.margin));
    setDamageRoll(dResult);

    if (currentTarget) {
      const currentSp = targetLocation === 'head' ? currentTarget.headSp : currentTarget.bodySp;
      const absorbedByCover = Math.min(coverHp, dResult.totalDamage);

      const resolved = resolveCprDamage({
        rawDamage: dResult.totalDamage,
        location: targetLocation,
        targetSp: currentSp,
        isMelee,
        isApAmmo,
        isCritInjuryRoll: manualIsCrit,
        manualInjuryId: manualIsCrit && manualInjuryId ? manualInjuryId : undefined,
        existingInjuries: currentTarget.criticalInjuries, targetHp: currentTarget.hpCurrent, coverHp, isBrawling
      });

      if (coverHp > 0) {
        resolved.logSummary = `[Укрытие поглотило ${absorbedByCover}/${coverHp} HP] ${resolved.logSummary}`;
      }
      setDamageResolution(resolved);
    }
  };

  const handleApply = () => {
    if (!currentTarget || !damageResolution || committed.current) return;
    committed.current = true;
    sfx.playHit();
    onApplyDamage(
      currentTarget.id,
      damageResolution.finalHpLoss,
      targetLocation,
      damageResolution.newSp,
      `${currentAttacker.name} атакует [${currentTarget.name}]: ${damageResolution.logSummary}`,
      damageResolution.criticalInjury,
      damageResolution.newCoverHp
    );
    onSpendResources?.(currentAttacker.id, selectedWeaponIndex, ammoCost, attackMode === 'player_total' ? 0 : luckSpent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-900 border border-red-600/70 rounded-lg max-w-xl w-full max-h-[90dvh] overflow-y-auto clip-cyber shadow-[0_0_30px_rgba(239,68,68,0.25)]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950 to-zinc-900 px-4 sm:px-5 py-3 border-b border-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-red-500" />
            <h3 className="font-orbitron font-bold text-white text-base tracking-wide">
              РЕЗОЛВЕР АТАКИ И УРОНА
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 sm:p-5 space-y-3 sm:space-y-4 text-sm">
          <p className="text-xs text-zinc-400">ROF, действия, особые боеприпасы, бонусы способностей и условные эффекты травм контролирует ГМ. База навыка = STAT + уровень; готовый итог игрока уже включает все модификаторы.</p>
          {/* Attacker & Target Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 items-center bg-zinc-950 p-3 rounded border border-zinc-800">
            {/* Attacker Box */}
            <div className="space-y-1">
              <span className="text-[11px] text-cyan-400 font-tech uppercase font-bold flex items-center gap-1">
                <Crosshair className="w-3.5 h-3.5" />
                Атакующий (кто бьёт)
              </span>
              <select
                value={attackerId}
                onChange={(e) => {
                  const newAttackerId = e.target.value;
                  setAttackerId(newAttackerId);
                  const newAttacker = combatants.find(c => c.id === newAttackerId);
                  if (newAttacker) {
                    setSelectedWeaponIndex(0);
                    const w = newAttacker.weapons[0];
                    const melee = /melee|brawl|martial/i.test(w?.category ?? '');
                    setIsMelee(melee);
                    setAttackerSkillBase(attackBase(newAttacker, w ?? { category: 'Heavy Pistol' }, melee) ?? newAttacker.ref + 4);
                    setAutofire(false);
                  }
                  if (targetId === newAttackerId) {
                    const fallback = combatants.find(c => c.id !== newAttackerId && !c.isDead);
                    setTargetId(fallback?.id || '');
                    setDefenseBase(skillBase(fallback, /evasion|уклонение/i, 'dex') ?? '');
                    setCoverHp(fallback?.coverHp ?? 0);
                  }
                  setDefenseTotal('');
                  setAttackRoll(null);
                  setDamageRoll(null);
                  setDamageResolution(null);
                }}
                className="w-full bg-zinc-900 border border-cyan-700/70 rounded px-2.5 py-1.5 text-white font-bold text-xs outline-none focus:border-cyan-400"
              >
                {combatants.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type === 'player' ? 'Игрок' : 'NPC'} | РЕФ {c.ref})
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center pt-2 sm:pt-4">
              <button
                type="button"
                onClick={handleSwapAttackerTarget}
                title="Поменять местами атакующего и цель"
                className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white rounded-full transition-all shadow"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            </div>

            {/* Target Box */}
            <div className="space-y-1">
              <span className="text-[11px] text-red-400 font-tech uppercase font-bold flex items-center gap-1">
                <Target className="w-3.5 h-3.5" />
                Жертва / Цель (получает урон)
              </span>
              {potentialTargets.length === 0 ? (
                <div className="text-xs text-red-400 py-1">Нет других доступных целей</div>
              ) : (
                <select
                  value={targetId}
                  onChange={(e) => {
                    setTargetId(e.target.value);
                    const target = combatants.find(c => c.id === e.target.value);
                    setDefenseTotal('');
                    setDefenseBase(skillBase(target, /evasion|уклонение/i, 'dex') ?? '');
                    setCoverHp(target?.coverHp ?? 0);
                    setAttackRoll(null);
                    setDamageRoll(null);
                    setDamageResolution(null);
                  }}
                  className="w-full bg-zinc-900 border border-red-700/70 rounded px-2.5 py-1.5 text-white font-bold text-xs outline-none focus:border-red-400"
                >
                  {potentialTargets.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} (HP {t.hpCurrent}/{t.hpMax} | Голова {t.headSp} | Тело {t.bodySp})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Weapon Selection */}
          <div>
            <label className="text-xs font-tech text-zinc-400 block mb-1.5 uppercase">
              Оружие атакующего ({currentAttacker?.name})
            </label>
            {attackerWeapons.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attackerWeapons.map((w, idx) => (
                  <button
                    key={w.id || idx}
                    type="button"
                    onClick={() => {
                      setSelectedWeaponIndex(idx);
                      const melee = /melee|brawl|martial/i.test(w.category ?? '');
                      setIsMelee(melee);
                      setAttackerSkillBase(attackBase(currentAttacker, w, melee) ?? (melee ? currentAttacker.dex : currentAttacker.ref) + 4);
                      setAutofire(false);
                      setAttackRoll(null);
                    }}
                    className={`text-left p-2.5 rounded border transition-all ${
                      selectedWeaponIndex === idx
                        ? 'bg-red-950/60 border-red-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="font-bold text-xs">{w.name}</div>
                    <div className="text-[11px] font-tech text-zinc-400 flex items-center justify-between mt-1">
                      <span>Урон: <strong className="text-amber-400">{w.damage}</strong></span>
                      <span>СКОР: {w.standardRof}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-2.5 bg-zinc-950 rounded border border-zinc-800 text-xs text-zinc-400">
                Тяжёлый пистолет (3d6, СКОР 2)
              </div>
            )}
          </div>

          {/* Attack Setup: Range & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-tech text-zinc-400 block mb-1 uppercase">Дистанция до цели</label>
              <select
                value={selectedRange}
                onChange={(e) => {
                  setSelectedRange(e.target.value as any);
                  setAttackRoll(null);
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-tech outline-none focus:border-red-500"
              >
                {RANGE_BANDS.map(band => <option key={band} value={band}>{band.replace('m', ' м')}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-tech text-zinc-400 block mb-1 uppercase">Зона попадания</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTargetLocation('body');
                    setAttackRoll(null);
                  }}
                  className={`py-1.5 px-3 rounded text-xs font-bold border transition-all ${
                    targetLocation === 'body'
                      ? 'bg-zinc-800 border-cyan-400 text-cyan-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}
                >
                  Тело (Body)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTargetLocation('head');
                    setAttackRoll(null);
                  }}
                  className={`py-1.5 px-3 rounded text-xs font-bold border transition-all ${
                    targetLocation === 'head'
                      ? 'bg-red-950 border-red-500 text-red-300'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}
                >
                  Голова (-8, урон x2)
                </button>
              </div>
            </div>
          </div>

          {/* Options: Melee, AP Ammo, Ambush & Cover */}
          <div className="space-y-2 bg-zinc-950 p-2.5 rounded border border-zinc-800 text-xs font-tech text-zinc-300">
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMelee}
                  onChange={(e) => {
                    setIsMelee(e.target.checked);
                    setAttackRoll(null);
                  }}
                  className="accent-red-500"
                />
                <span>Ближний бой: холодное / боевые искусства — половина SP; Brawling — полная броня</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isApAmmo}
                  onChange={(e) => {
                    setIsApAmmo(e.target.checked);
                    setAttackRoll(null);
                  }}
                  className="accent-red-500"
                />
                <span>Бронебойные патроны (AP: -2 ОС стирания)</span>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-900">
              <label className="flex items-center gap-2 cursor-pointer text-amber-300 font-bold">
                <input
                  type="checkbox"
                  checked={isAmbush}
                  onChange={(e) => {
                    setIsAmbush(e.target.checked);
                    setAttackRoll(null);
                  }}
                  className="accent-amber-500"
                />
                <span>🎯 Атака из засады (Мили: автохит; Стрельба: цель не уклоняется)</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-zinc-400">Укрытие цели:</span>
                <input type="number" min="0" aria-label="HP укрытия цели"
                  value={coverHp}
                  onChange={(e) => {
                    setCoverHp(Math.max(0, parseInt(e.target.value) || 0));
                    setDamageResolution(null);
                  }}
                  className="bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-white font-tech text-xs"
                />
              </div>
            </div>
          </div>

          {/* Target DV Info */}
          <div className="space-y-2 bg-zinc-950 p-3 border border-zinc-700 rounded text-xs">
            <p className="text-zinc-400">Проверьте базу STAT + навык. Если навык не импортирован, задайте её вручную. Штрафы ранения, брони и общие модификаторы активных травм добавляются автоматически; штраф используемой кисти и условия задайте ниже. Готовый итог игрока уже должен включать все модификаторы.</p>
            <label className="flex items-center gap-2">Условия / используемая кисть:
              <input aria-label="Ситуационный модификатор" type="number" value={situationalModifier} onChange={e => { setSituationalModifier(Number(e.target.value) || 0); setAttackRoll(null); }} className="w-16 bg-zinc-900 border rounded" />
            </label>
            {canAutofire && <label className="flex gap-2"><input type="checkbox" checked={autofire} onChange={e => {
              setAutofire(e.target.checked); setTargetLocation('body'); setAttackRoll(null);
              setAttackerSkillBase(attackBase(currentAttacker, { ...activeWeapon, category: `Autofire ${activeWeapon.category}` }, false) ?? currentAttacker.ref + 4);
            }} />Автоогонь: 10 патронов, 2d6 × перевес (максимум {rangeKey === 'smg' ? 3 : 4})</label>}
            {!isMelee && <label className="flex gap-2"><input type="checkbox" checked={dodgeBullets} disabled={cannotDodge} onChange={e => { setDodgeBullets(e.target.checked); setDefenseTotal(''); setAttackRoll(null); }} />Цель объявляет уклонение от пуль (REF8 или разрешающая способность)</label>}
            {defenseRequired && <div className="space-y-2">
              <label>База Evasion цели: <input aria-label="База Evasion цели" type="number" value={defenseBase} onChange={e => setDefenseBase(e.target.value === '' ? '' : Number(e.target.value))} className="w-16 bg-zinc-900 border rounded" /></label>
              <button disabled={defenseBase === ''} onClick={() => {
                const mod = currentTarget ? getDefenseModifier(currentTarget) : 0;
                setDefenseTotal(executeCPRCheck(Number(defenseBase), mod).grandTotal); setAttackRoll(null);
              }} className="px-2 py-1 bg-cyan-800 rounded disabled:opacity-40">Бросить уклонение</button>
              <label className="block">Готовый итог уклонения с модификаторами: <input aria-label="Итог уклонения" type="number" value={defenseTotal} onChange={e => { setDefenseTotal(e.target.value === '' ? '' : Number(e.target.value)); setAttackRoll(null); }} className="w-16 bg-zinc-900 border rounded" /></label>
            </div>}
            {attackError && <p role="alert" className="text-red-400">{attackError}</p>}
          </div>
          <div className="flex items-center justify-between p-3 bg-zinc-950 rounded border border-zinc-800 text-xs">
            <div>
              <span className="text-zinc-500 font-tech">База навыка стрелка: </span>
              <input
                type="number"
                value={attackerSkillBase}
                onChange={(e) => setAttackerSkillBase(parseInt(e.target.value) || 0)}
                className="w-14 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-center font-bold text-amber-400 ml-1"
              />
              {aimedShotPenalty !== 0 && (
                <span className="text-red-400 ml-1.5 font-bold font-tech">{aimedShotPenalty} в голову</span>
              )}
            </div>

            <div className="text-right">
              <span className="text-zinc-500 font-tech">Сложность (Target DV): </span>
              <strong className="text-white font-orbitron text-sm ml-1">{defenseRequired && defenseTotal === '' ? 'Нужен бросок Evasion' : targetDv ?? 'Недопустимая дальность / категория'}</strong>
            </div>
          </div>

          {/* Step 1: Mode Switch & Attack Roll */}
          {attackMode !== 'player_total' && <label className="block text-xs text-amber-300">
            Удача до броска (доступно: {currentAttacker?.luckCurrent ?? 'укажите вручную'})
            <input aria-label="Расход Удачи" type="number" min="0" max={currentAttacker?.luckCurrent} value={luckSpent}
              onChange={e => setLuckSpent(Number(e.target.value))} className="ml-2 w-16 bg-zinc-950 border rounded px-2 py-1" />
          </label>}
          <div className="bg-zinc-950 p-3 rounded border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-orbitron font-bold text-white flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-red-500" />
                1. ПРОВЕРКА АТАКИ
              </span>

              <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800 text-[11px] font-tech flex-wrap">
                <button
                  type="button"
                  onClick={() => setAttackMode('auto')}
                  className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                    attackMode === 'auto' ? 'bg-red-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Dices className="w-3 h-3" />
                  Автобросок
                </button>
                <button
                  type="button"
                  onClick={() => setAttackMode('manual')}
                  className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                    attackMode === 'manual' ? 'bg-amber-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Edit3 className="w-3 h-3" />
                  Кубик 1d10
                </button>
                <button
                  type="button"
                  onClick={() => setAttackMode('player_total')}
                  className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                    attackMode === 'player_total' ? 'bg-emerald-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                  title="Ввести готовый итог атаки, названный игроком за столом"
                >
                  <Target className="w-3 h-3" />
                  Итог игрока (ИРЛ)
                </button>
              </div>
            </div>

            {/* Direct Player Total Mode (IRL Tabletop) */}
            {attackMode === 'player_total' && (
              <div className="p-3 bg-zinc-900/90 rounded border border-emerald-600/50 text-xs font-tech space-y-2 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <span className="text-emerald-300 font-bold">Итоговый результат атаки игрока (бросок + база):</span>
                  <input
                    type="number"
                    value={directPlayerTotal}
                    onChange={(e) => setDirectPlayerTotal(parseInt(e.target.value) || 0)}
                    className="w-20 bg-zinc-950 border border-emerald-500 rounded px-2.5 py-1 text-center font-bold text-white text-base"
                  />
                  <span className="text-zinc-400">vs DV {targetDv}</span>
                </div>
                <div className="text-[11px] text-zinc-400">
                  Игрок бросил дайс за столом и назвал число? Просто введите его сюда без лишних вычислений.
                </div>
              </div>
            )}

            {/* Manual input controls for 1d10 */}
            {attackMode === 'manual' && (
              <div className="p-2.5 bg-zinc-900/90 rounded border border-amber-600/40 text-xs font-tech space-y-2 animate-in fade-in">
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <span className="text-zinc-400 mr-2">Результат 1d10 (1–10):</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={manualD10}
                      onChange={(e) => setManualD10(parseInt(e.target.value) || 1)}
                      className="w-16 bg-zinc-950 border border-amber-500 rounded px-2 py-1 text-center font-bold text-amber-300"
                    />
                  </div>

                  {manualD10 === 10 && (
                    <div className="flex items-center gap-2 text-emerald-400 animate-in fade-in">
                      <span>Взрыв (+10):</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={manualExploded}
                        onChange={(e) => setManualExploded(parseInt(e.target.value) || 1)}
                        className="w-14 bg-zinc-950 border border-emerald-500 rounded px-2 py-1 text-center font-bold text-emerald-300"
                      />
                      <span className="text-[10px] text-zinc-400">доп. 1d10</span>
                    </div>
                  )}

                  {manualD10 === 1 && (
                    <div className="flex items-center gap-2 text-red-400 animate-in fade-in">
                      <span>Провал (-1):</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={manualBotch}
                        onChange={(e) => setManualBotch(parseInt(e.target.value) || 1)}
                        className="w-14 bg-zinc-950 border border-red-500 rounded px-2 py-1 text-center font-bold text-red-300"
                      />
                      <span className="text-[10px] text-zinc-400">штраф 1d10</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleRollAttack}
              disabled={!currentTarget}
              className={`w-full py-2 px-4 text-white font-orbitron font-bold text-xs tracking-wider rounded transition-all clip-cyber-btn shadow-lg ${
                attackMode === 'player_total' 
                  ? 'bg-emerald-600 hover:bg-emerald-500' 
                  : attackMode === 'manual' 
                  ? 'bg-amber-600 hover:bg-amber-500' 
                  : 'bg-red-600 hover:bg-red-500'
              }`}
            >
              {attackMode === 'player_total'
                ? `ПРИМЕНИТЬ РЕЗУЛЬТАТ ИГРОКА (${directPlayerTotal} vs DV ${targetDv})`
                : attackMode === 'manual'
                ? 'ПРИМЕНИТЬ РУЧНОЙ БРОСОК АТАКИ'
                : 'БРОСИТЬ АТАКУ (1d10 + База)'}
            </button>
          </div>

          {/* Attack Roll Result */}
          {attackRoll && (
            <div className={`p-3.5 rounded border text-xs ${
              attackRoll.isSuccess 
                ? 'bg-emerald-950/40 border-emerald-600/70 text-emerald-200' 
                : 'bg-red-950/40 border-red-600/70 text-red-200'
            }`}>
              <div className="flex items-center justify-between font-orbitron font-bold text-sm mb-1">
                <span>{attackRoll.isSuccess ? 'ПОПАДАНИЕ!' : 'ПРОМАХ!'}</span>
                <span>Итог: {attackRoll.grandTotal} vs DV {attackRoll.targetDv}</span>
              </div>
              <p className="font-tech text-zinc-300">{attackRoll.textSummary}</p>
              {!attackRoll.isSuccess && <button onClick={() => { if (committed.current) return; committed.current = true; onSpendResources?.(currentAttacker.id, selectedWeaponIndex, ammoCost, attackMode === 'player_total' ? 0 : luckSpent); onClose(); }} className="mt-2 px-3 py-2 border rounded">Зафиксировать промах и расход ресурсов</button>}
            </div>
          )}

          {/* Step 2: Damage Resolution */}
          {attackRoll && attackRoll.isSuccess && (
            <div className="p-3.5 bg-zinc-950 rounded border border-amber-600/60 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-orbitron font-bold text-amber-400 uppercase">
                  2. Расчет урона ({activeWeapon.damage})
                </span>

                <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800 text-[11px] font-tech">
                  <button
                    type="button"
                    onClick={() => {
                      setDamageMode('auto');
                      handleRollDamage();
                    }}
                    className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                      damageMode === 'auto' ? 'bg-amber-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Dices className="w-3 h-3" />
                    Автобросок
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDamageMode('manual');
                      handleApplyManualDamage();
                    }}
                    className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                      damageMode === 'manual' ? 'bg-cyan-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Edit3 className="w-3 h-3" />
                    Ручной урон
                  </button>
                </div>
              </div>

              {/* Manual Damage Input */}
              {damageMode === 'manual' && (
                <div className="p-3 bg-zinc-900/90 rounded border border-cyan-600/40 space-y-2.5 font-tech animate-in fade-in">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400">Чистый урон с кубиков:</span>
                      <input
                        type="number"
                        min="0"
                        value={manualDamageTotal}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setManualDamageTotal(val); setDamageResolution(null);
                        }}
                        className="w-20 bg-zinc-950 border border-cyan-500 rounded px-2.5 py-1 text-center font-bold text-white text-sm"
                      />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer text-amber-300 font-bold">
                      <input
                        type="checkbox"
                        checked={manualIsCrit}
                        onChange={(e) => {
                          setManualIsCrit(e.target.checked); setDamageResolution(null);
                        }}
                        className="accent-amber-500"
                      />
                      <span>Выпало две 6-ки (+5 урона и травма)</span>
                    </label>
                  </div>

                  {/* Manual Injury Selection */}
                  {manualIsCrit && (
                    <div className="pt-1 border-t border-zinc-800 flex flex-wrap items-center gap-2">
                      <span className="text-zinc-400 text-[11px]">Выбрать травму (или бросить случайно):</span>
                      <select
                        value={manualInjuryId}
                        onChange={(e) => { setManualInjuryId(e.target.value); setDamageResolution(null); }}
                        className="bg-zinc-950 border border-red-700/80 rounded px-2 py-1 text-red-300 text-xs outline-none"
                      >
                        <option value="">Случайный бросок 2d6 по таблице</option>
                        {injuriesList.map(inj => (
                          <option key={inj.id} value={inj.id}>
                            {inj.rollNumber}: {inj.nameRu} ({inj.effectRu.substring(0, 45)}...)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleApplyManualDamage()}
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded text-xs"
                  >
                    Пересчитать ручной урон
                  </button>
                </div>
              )}

              {damageRoll && (
                <div className="text-zinc-300 font-tech">
                  {damageRoll.isManualRoll ? (
                    <span>Введён ручной урон: <strong className="text-white text-sm">{damageRoll.totalDamage}</strong></span>
                  ) : (
                    <span>
                      Кубики: [{damageRoll?.diceRolls.join(', ')}] = {damageRoll?.baseSum}
                      {damageRoll?.bonusDamage > 0 && `; +${damageRoll.bonusDamage} отдельно в HP`}
                      {' ➔ '} Итоговый урон: <strong className="text-white text-sm">{damageRoll?.totalDamage}</strong>
                    </span>
                  )}
                  {damageRoll?.isCriticalInjury && (
                    <span className="ml-2 px-2 py-0.5 rounded bg-red-600 text-white font-bold font-tech animate-pulse inline-flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      КРИТИЧЕСКАЯ ТРАВМА (+5 урона)
                    </span>
                  )}
                </div>
              )}

              {damageResolution && currentTarget && (
                <>
                  <div className="p-2 bg-zinc-900 rounded border border-zinc-800 text-zinc-200 font-tech">
                    {damageResolution.logSummary}
                  </div>

                  {damageResolution.criticalInjury && (
                    <div className="p-2 bg-red-950/60 border border-red-700/80 rounded text-red-200 font-tech">
                      <strong>Получена травма: {damageResolution.criticalInjury.nameRu}</strong>
                      <div className="text-[11px] text-zinc-300 mt-0.5">{damageResolution.criticalInjury.effectRu}</div>
                    </div>
                  )}

                  {/* Explicit Target Confirmation Box */}
                  <div className="p-2.5 bg-emerald-950/40 border border-emerald-600/60 rounded text-emerald-200 font-tech space-y-1">
                    <div className="font-bold text-xs uppercase flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Получатель урона: {currentTarget.name}</span>
                    </div>
                    <div className="text-[11px] text-zinc-300">
                      ОЗ цели: {currentTarget.hpCurrent} ➔ <strong className="text-white">{Math.max(0, currentTarget.hpCurrent - damageResolution.finalHpLoss)}</strong> / {currentTarget.hpMax}
                      {' | '} 
                      Броня [{targetLocation === 'head' ? 'Голова' : 'Тело'}]: ОС {targetLocation === 'head' ? currentTarget.headSp : currentTarget.bodySp} ➔ <strong className="text-white">ОС {damageResolution.newSp}</strong>
                    </div>
                  </div>

                  <button
                    onClick={handleApply}
                    className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-orbitron font-bold tracking-wider rounded transition-all clip-cyber-btn shadow-lg"
                  >
                    ПРИМЕНИТЬ УРОН К ЦЕЛИ [{currentTarget.name.toUpperCase()}]
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
