import React, { useState } from 'react';
import { Crosshair, Shield, Zap, Skull, Check, X, AlertTriangle, Dices, Edit3 } from 'lucide-react';
import { Combatant } from '../../types/combat';
import { CPR_RANGE_DV_TABLE, CPR_CRITICAL_INJURIES_HEAD, CPR_CRITICAL_INJURIES_BODY } from '../../data/cprRules';
import { executeCPRCheck, rollDamageFormula } from '../../utils/dice';
import { resolveCprDamage } from '../../utils/cprCombat';
import { sfx } from '../../utils/audio';

interface AttackResolverModalProps {
  attacker: Combatant;
  combatants: Combatant[];
  onClose: () => void;
  onApplyDamage: (
    targetId: string,
    hpLoss: number,
    location: 'head' | 'body',
    newSp: number,
    logText: string,
    criticalInjury?: any
  ) => void;
}

export const AttackResolverModal: React.FC<AttackResolverModalProps> = ({
  attacker,
  combatants,
  onClose,
  onApplyDamage
}) => {
  // Select target
  const potentialTargets = combatants.filter(c => c.id !== attacker.id && !c.isDefeated);
  const [targetId, setTargetId] = useState<string>(potentialTargets[0]?.id || '');
  const target = combatants.find(c => c.id === targetId);

  // Selected weapon
  const [selectedWeaponIndex, setSelectedWeaponIndex] = useState<number>(0);
  const activeWeapon = attacker.weapons[selectedWeaponIndex] || {
    name: 'Тяжёлый пистолет',
    damage: '3d6',
    category: 'Heavy Pistol',
    standardRof: 2,
    currentAmmo: 8,
    magCapacity: 8
  };

  // Attack parameters
  const [selectedRange, setSelectedRange] = useState<'0-6m' | '7-12m' | '13-25m' | '26-50m' | '51-100m'>('7-12m');
  const [targetLocation, setTargetLocation] = useState<'head' | 'body'>('body');
  const [isMelee, setIsMelee] = useState<boolean>(activeWeapon.category?.toLowerCase().includes('melee') || false);
  const [isApAmmo, setIsApAmmo] = useState<boolean>(false);
  const [attackerSkillBase, setAttackerSkillBase] = useState<number>(attacker.ref + 4); // Default to REF + 4
  const [luckSpent, setLuckSpent] = useState<number>(0);

  // Attack Roll Mode (Auto vs Manual)
  const [attackMode, setAttackMode] = useState<'auto' | 'manual'>('auto');
  const [manualD10, setManualD10] = useState<number>(5);
  const [manualExploded, setManualExploded] = useState<number>(5);
  const [manualBotch, setManualBotch] = useState<number>(5);

  // Damage Roll Mode (Auto vs Manual)
  const [damageMode, setDamageMode] = useState<'auto' | 'manual'>('auto');
  const [manualDamageTotal, setManualDamageTotal] = useState<number>(12);
  const [manualIsCrit, setManualIsCrit] = useState<boolean>(false);
  const [manualInjuryId, setManualInjuryId] = useState<string>('');

  // Resolution state
  const [attackRoll, setAttackRoll] = useState<any | null>(null);
  const [damageRoll, setDamageRoll] = useState<any | null>(null);
  const [damageResolution, setDamageResolution] = useState<any | null>(null);

  // Calculate Target DV
  let targetDv: number | null = 15;
  if (isMelee) {
    // In CPR, Melee is contested by Defender's DEX + Evasion!
    targetDv = target ? target.dex + 4 : 13;
  } else {
    // Find weapon DV from table
    const rangeKey = Object.keys(CPR_RANGE_DV_TABLE).find(k => 
      activeWeapon.category?.toLowerCase().includes(k) || 
      activeWeapon.name?.toLowerCase().includes(k)
    ) || 'pistol';
    const weaponRules = CPR_RANGE_DV_TABLE[rangeKey];
    targetDv = weaponRules?.dvs[selectedRange] ?? 15;
  }

  // Aimed shot penalty (-8 in CPR)
  const aimedShotPenalty = targetLocation === 'head' ? -8 : 0;

  const injuriesList = targetLocation === 'head' ? CPR_CRITICAL_INJURIES_HEAD : CPR_CRITICAL_INJURIES_BODY;

  const handleRollAttack = () => {
    sfx.playClick();
    let result;
    if (attackMode === 'manual') {
      result = executeCPRCheck(attackerSkillBase, aimedShotPenalty, luckSpent, targetDv ?? 15, {
        firstDie: manualD10,
        explodedDie: manualD10 === 10 ? manualExploded : undefined,
        botchDie: manualD10 === 1 ? manualBotch : undefined
      });
    } else {
      result = executeCPRCheck(attackerSkillBase, aimedShotPenalty, luckSpent, targetDv ?? 15);
    }
    setAttackRoll(result);

    if (result.isSuccess) {
      if (damageMode === 'auto') {
        handleRollDamage();
      } else {
        handleApplyManualDamage();
      }
    } else {
      setDamageRoll(null);
      setDamageResolution(null);
    }
  };

  const handleRollDamage = () => {
    const dResult = rollDamageFormula(activeWeapon.damage || '3d6');
    setDamageRoll(dResult);

    if (target) {
      const currentSp = targetLocation === 'head' ? target.headSp : target.bodySp;
      const resolved = resolveCprDamage({
        rawDamage: dResult.totalDamage,
        location: targetLocation,
        targetSp: currentSp,
        isMelee,
        isApAmmo,
        isCritInjuryRoll: dResult.isCriticalInjury
      });
      setDamageResolution(resolved);
    }
  };

  const handleApplyManualDamage = () => {
    const dResult = rollDamageFormula(activeWeapon.damage || '3d6', {
      totalDamage: manualDamageTotal,
      isCriticalInjury: manualIsCrit
    });
    setDamageRoll(dResult);

    if (target) {
      const currentSp = targetLocation === 'head' ? target.headSp : target.bodySp;
      const resolved = resolveCprDamage({
        rawDamage: dResult.totalDamage,
        location: targetLocation,
        targetSp: currentSp,
        isMelee,
        isApAmmo,
        isCritInjuryRoll: manualIsCrit,
        manualInjuryId: manualIsCrit && manualInjuryId ? manualInjuryId : undefined
      });
      setDamageResolution(resolved);
    }
  };

  const handleApply = () => {
    if (!target || !damageResolution) return;
    sfx.playHit();
    onApplyDamage(
      target.id,
      damageResolution.finalHpLoss,
      targetLocation,
      damageResolution.newSp,
      `${attacker.name} атакует [${target.name}]: ${damageResolution.logSummary}`,
      damageResolution.criticalInjury
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-900 border border-red-600/70 rounded-lg max-w-xl w-full max-h-[92vh] overflow-y-auto clip-cyber shadow-[0_0_30px_rgba(239,68,68,0.25)]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950 to-zinc-900 px-5 py-3.5 border-b border-red-800 flex items-center justify-between">
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

        <div className="p-5 space-y-4 text-sm">
          {/* Attacker & Target Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-zinc-950 p-3 rounded border border-zinc-800">
              <span className="text-[11px] text-zinc-500 font-tech uppercase block mb-1">Атакующий</span>
              <div className="font-orbitron font-bold text-cyan-400">{attacker.name}</div>
              <div className="text-xs text-zinc-400 font-tech">РЕФ {attacker.ref} | ЛОВ {attacker.dex}</div>
            </div>

            <div className="bg-zinc-950 p-3 rounded border border-zinc-800">
              <span className="text-[11px] text-zinc-500 font-tech uppercase block mb-1">Цель (Защитник)</span>
              {potentialTargets.length === 0 ? (
                <div className="text-xs text-red-400">Нет доступных целей в бою</div>
              ) : (
                <select
                  value={targetId}
                  onChange={(e) => {
                    setTargetId(e.target.value);
                    setAttackRoll(null);
                    setDamageRoll(null);
                    setDamageResolution(null);
                  }}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 text-white font-medium focus:border-red-500 outline-none"
                >
                  {potentialTargets.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} (HP {t.hpCurrent}/{t.hpMax} | Голова ОС {t.headSp} | Тело ОС {t.bodySp})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Weapon Selection */}
          <div>
            <label className="text-xs font-tech text-zinc-400 block mb-1.5 uppercase">Оружие атакующего</label>
            {attacker.weapons && attacker.weapons.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attacker.weapons.map((w, idx) => (
                  <button
                    key={w.id || idx}
                    type="button"
                    onClick={() => {
                      setSelectedWeaponIndex(idx);
                      setIsMelee(w.category?.toLowerCase().includes('melee') || false);
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
                <option value="0-6m">0–6 метров (В упор)</option>
                <option value="7-12m">7–12 метров (Ближняя)</option>
                <option value="13-25m">13–25 метров (Средняя)</option>
                <option value="26-50m">26–50 метров (Дальняя)</option>
                <option value="51-100m">51–100 метров (Сверхдальняя)</option>
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

          {/* Options: Melee & AP Ammo */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-tech text-zinc-300 bg-zinc-950 p-2.5 rounded border border-zinc-800">
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
              <span>Холодное оружие / Рукопашная (игнорирует 50% брони)</span>
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

          {/* Skill Base & Target DV Info */}
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
              <strong className="text-white font-orbitron text-sm ml-1">{targetDv ?? '—'}</strong>
            </div>
          </div>

          {/* Step 1: Mode Switch & Attack Roll */}
          <div className="bg-zinc-950 p-3 rounded border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-orbitron font-bold text-white flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-red-500" />
                1. БРОСОК АТАКИ (1d10 + База)
              </span>

              <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800 text-[11px] font-tech">
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
                  Ручной ввод
                </button>
              </div>
            </div>

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
              disabled={!target}
              className={`w-full py-2 px-4 text-white font-orbitron font-bold text-xs tracking-wider rounded transition-all clip-cyber-btn shadow-lg ${
                attackMode === 'manual' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-red-600 hover:bg-red-500'
              }`}
            >
              {attackMode === 'manual' ? 'ПРИМЕНИТЬ РУЧНОЙ БРОСОК АТАКИ' : 'БРОСИТЬ АТАКУ (1d10 + База)'}
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
                          setManualDamageTotal(val);
                        }}
                        className="w-20 bg-zinc-950 border border-cyan-500 rounded px-2.5 py-1 text-center font-bold text-white text-sm"
                      />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer text-amber-300 font-bold">
                      <input
                        type="checkbox"
                        checked={manualIsCrit}
                        onChange={(e) => {
                          setManualIsCrit(e.target.checked);
                        }}
                        className="accent-amber-500"
                      />
                      <span>Выпало две 6-ки (+5 урона и критическая травма)</span>
                    </label>
                  </div>

                  {/* Manual Injury Selection */}
                  {manualIsCrit && (
                    <div className="pt-1 border-t border-zinc-800 flex flex-wrap items-center gap-2">
                      <span className="text-zinc-400 text-[11px]">Выбрать травму (или бросить случайно):</span>
                      <select
                        value={manualInjuryId}
                        onChange={(e) => setManualInjuryId(e.target.value)}
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
                    onClick={handleApplyManualDamage}
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
                      {damageRoll?.bonusDamage > 0 && ` + ${damageRoll.bonusDamage} бонус`}
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

              {damageResolution && (
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

                  <button
                    onClick={handleApply}
                    className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-orbitron font-bold tracking-wider rounded transition-all clip-cyber-btn shadow-lg"
                  >
                    ПРИМЕНИТЬ УРОН И АБЛЯЦИЮ К ЦЕЛИ
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
