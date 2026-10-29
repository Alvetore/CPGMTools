import React, { useState } from 'react';
import { Dices, X, AlertTriangle, Edit3 } from 'lucide-react';
import { executeCPRCheck, rollDamageFormula, executeDeathSave } from '../../utils/dice';
import { sfx } from '../../utils/audio';

interface DiceRollerModalProps {
  onClose: () => void;
}

export const DiceRollerModal: React.FC<DiceRollerModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'check' | 'damage' | 'deathsave'>('check');

  // Check state
  const [baseStatSkill, setBaseStatSkill] = useState<number>(12);
  const [modifier, setModifier] = useState<number>(0);
  const [luckSpent, setLuckSpent] = useState<number>(0);
  const [targetDv, setTargetDv] = useState<number>(15);
  const [checkResult, setCheckResult] = useState<any | null>(null);

  // Check manual state
  const [checkMode, setCheckMode] = useState<'auto' | 'manual'>('auto');
  const [manualD10, setManualD10] = useState<number>(5);
  const [manualExploded, setManualExploded] = useState<number>(5);
  const [manualBotch, setManualBotch] = useState<number>(5);

  // Damage state
  const [damageFormula, setDamageFormula] = useState<string>('4d6');
  const [damageResult, setDamageResult] = useState<any | null>(null);

  // Damage manual state
  const [damageMode, setDamageMode] = useState<'auto' | 'manual'>('auto');
  const [manualDamageTotal, setManualDamageTotal] = useState<number>(14);
  const [manualDamageIsCrit, setManualDamageIsCrit] = useState<boolean>(false);

  // Death Save state
  const [bodyStat, setBodyStat] = useState<number>(6);
  const [deathPenalty, setDeathPenalty] = useState<number>(0);
  const [deathResult, setDeathResult] = useState<any | null>(null);

  // Death Save manual state
  const [deathMode, setDeathMode] = useState<'auto' | 'manual'>('auto');
  const [manualDeathD10, setManualDeathD10] = useState<number>(5);

  const handleRollCheck = () => {
    sfx.playClick();
    let res;
    if (checkMode === 'manual') {
      res = executeCPRCheck(baseStatSkill, modifier, luckSpent, targetDv, {
        firstDie: manualD10,
        explodedDie: manualD10 === 10 ? manualExploded : undefined,
        botchDie: manualD10 === 1 ? manualBotch : undefined
      });
    } else {
      res = executeCPRCheck(baseStatSkill, modifier, luckSpent, targetDv);
    }
    setCheckResult(res);
  };

  const handleRollDamage = (formula: string) => {
    sfx.playHit();
    let res;
    if (damageMode === 'manual') {
      res = rollDamageFormula(formula, {
        totalDamage: manualDamageTotal,
        isCriticalInjury: manualDamageIsCrit
      });
    } else {
      res = rollDamageFormula(formula);
    }
    setDamageResult(res);
  };

  const handleRollDeathSave = () => {
    let res;
    if (deathMode === 'manual') {
      res = executeDeathSave(bodyStat, deathPenalty, manualDeathD10);
    } else {
      res = executeDeathSave(bodyStat, deathPenalty);
    }
    setDeathResult(res);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-900 border border-amber-600/70 rounded-lg max-w-lg w-full max-h-[90dvh] overflow-y-auto clip-cyber shadow-[0_0_30px_rgba(245,158,11,0.25)]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950/80 via-zinc-900 to-zinc-900 px-4 sm:px-5 py-3 border-b border-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dices className="w-5 h-5 text-amber-400" />
            <h3 className="font-orbitron font-bold text-white text-base tracking-wide">
              ДАЙСРОЛЛЕР CYBERPUNK RED
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-zinc-800 bg-zinc-950 text-xs font-orbitron font-bold">
          <button
            onClick={() => setActiveTab('check')}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              activeTab === 'check' ? 'border-amber-500 text-amber-400 bg-zinc-900' : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Проверка (1d10)
          </button>
          <button
            onClick={() => setActiveTab('damage')}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              activeTab === 'damage' ? 'border-red-500 text-red-400 bg-zinc-900' : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Урон (Nd6)
          </button>
          <button
            onClick={() => setActiveTab('deathsave')}
            className={`flex-1 py-2.5 text-center transition-colors border-b-2 ${
              activeTab === 'deathsave' ? 'border-purple-500 text-purple-400 bg-zinc-900' : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Спасбросок смерти
          </button>
        </div>

        <div className="p-3.5 sm:p-5 space-y-3.5 sm:space-y-4 text-xs font-tech">
          
          {/* TAB 1: 1d10 Check */}
          {activeTab === 'check' && (
            <div className="space-y-3.5">
              {/* Mode switch */}
              <div className="flex items-center justify-between bg-zinc-950 p-2 rounded border border-zinc-800">
                <span className="text-zinc-400 uppercase text-[11px] font-bold">Режим броска:</span>
                <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800">
                  <button
                    onClick={() => setCheckMode('auto')}
                    className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
                      checkMode === 'auto' ? 'bg-amber-600 text-black font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Dices className="w-3.5 h-3.5" />
                    Автобросок
                  </button>
                  <button
                    onClick={() => setCheckMode('manual')}
                    className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
                      checkMode === 'manual' ? 'bg-amber-600 text-black font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Ручной ввод кубика
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1 uppercase text-[11px]">База (ХАР + Навык)</label>
                  <input
                    type="number"
                    value={baseStatSkill}
                    onChange={(e) => setBaseStatSkill(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-bold text-sm outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1 uppercase text-[11px]">Модификатор ситуации</label>
                  <input
                    type="number"
                    value={modifier}
                    onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-bold text-sm outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1 uppercase text-[11px]">Очки Удачи (LUCK)</label>
                  <input
                    type="number"
                    min="0"
                    value={luckSpent}
                    onChange={(e) => setLuckSpent(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-amber-400 font-bold text-sm outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1 uppercase text-[11px]">Целевая сложность (DV)</label>
                  <input
                    type="number"
                    value={targetDv}
                    onChange={(e) => setTargetDv(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-bold text-sm outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Quick DV Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-zinc-500 text-[10px] uppercase mr-1">Быстрые DV:</span>
                {[9, 13, 15, 17, 21, 24, 29].map((dv) => (
                  <button
                    key={dv}
                    onClick={() => setTargetDv(dv)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                      targetDv === dv ? 'bg-amber-950 border-amber-500 text-amber-300' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    DV {dv}
                  </button>
                ))}
              </div>

              {/* Manual D10 inputs */}
              {checkMode === 'manual' && (
                <div className="p-3 bg-zinc-950 rounded border border-amber-500/50 space-y-2 animate-in fade-in">
                  <div className="text-[11px] font-bold text-amber-300 uppercase">Ручной результат дайса 1d10:</div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400">1d10 (1–10):</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={manualD10}
                        onChange={(e) => setManualD10(parseInt(e.target.value) || 1)}
                        className="w-16 bg-zinc-900 border border-amber-500 rounded px-2 py-1 text-center font-bold text-amber-300 text-sm"
                      />
                    </div>

                    {manualD10 === 10 && (
                      <div className="flex items-center gap-2 text-emerald-400 animate-in fade-in">
                        <span>Взрыв (+10!):</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={manualExploded}
                          onChange={(e) => setManualExploded(parseInt(e.target.value) || 1)}
                          className="w-14 bg-zinc-900 border border-emerald-500 rounded px-2 py-1 text-center font-bold text-emerald-300"
                        />
                      </div>
                    )}

                    {manualD10 === 1 && (
                      <div className="flex items-center gap-2 text-red-400 animate-in fade-in">
                        <span>Провал (-1!):</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={manualBotch}
                          onChange={(e) => setManualBotch(parseInt(e.target.value) || 1)}
                          className="w-14 bg-zinc-900 border border-red-500 rounded px-2 py-1 text-center font-bold text-red-300"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={handleRollCheck}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-black font-orbitron font-bold text-xs rounded transition-all clip-cyber-btn shadow-md uppercase tracking-wider"
              >
                {checkMode === 'manual' ? 'Применить ручной бросок 1d10' : 'Бросить проверку 1d10'}
              </button>

              {checkResult && (
                <div className={`p-3.5 rounded border ${
                  checkResult.isSuccess ? 'bg-emerald-950/40 border-emerald-600/70' : 'bg-red-950/40 border-red-600/70'
                }`}>
                  <div className="flex items-center justify-between font-orbitron font-bold text-sm mb-1">
                    <span className={checkResult.isSuccess ? 'text-emerald-400' : 'text-red-400'}>
                      {checkResult.isSuccess ? 'УСПЕШНАЯ ПРОВЕРКА!' : 'ПРОВАЛ ПРОВЕРКИ!'}
                    </span>
                    <span className="text-white">Итог: {checkResult.grandTotal}</span>
                  </div>
                  <div className="text-zinc-300 mt-1">{checkResult.textSummary}</div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Nd6 Damage */}
          {activeTab === 'damage' && (
            <div className="space-y-3.5">
              {/* Mode switch */}
              <div className="flex items-center justify-between bg-zinc-950 p-2 rounded border border-zinc-800">
                <span className="text-zinc-400 uppercase text-[11px] font-bold">Режим урона:</span>
                <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800">
                  <button
                    onClick={() => setDamageMode('auto')}
                    className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
                      damageMode === 'auto' ? 'bg-red-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Dices className="w-3.5 h-3.5" />
                    Автобросок
                  </button>
                  <button
                    onClick={() => setDamageMode('manual')}
                    className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
                      damageMode === 'manual' ? 'bg-red-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Ручной ввод урона
                  </button>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 uppercase text-[11px]">Формула оружия</label>
                <input
                  type="text"
                  value={damageFormula}
                  onChange={(e) => setDamageFormula(e.target.value)}
                  placeholder="3d6, 4d6, 5d6..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white font-orbitron font-bold text-sm outline-none focus:border-red-500"
                />
              </div>

              {/* Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                {['1d6 (Лёгкое)', '2d6 (Среднее)', '3d6 (Тяж. пистолет)', '4d6 (Очень тяж.)', '5d6 (Винтовка)', '6d6', '8d6 (Ракетница)'].map((p) => {
                  const formula = p.split(' ')[0];
                  return (
                    <button
                      key={p}
                      onClick={() => {
                        setDamageFormula(formula);
                        if (damageMode === 'auto') {
                          handleRollDamage(formula);
                        }
                      }}
                      className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-300 hover:border-red-500 text-xs font-tech"
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              {/* Manual Damage Inputs */}
              {damageMode === 'manual' && (
                <div className="p-3 bg-zinc-950 rounded border border-red-500/50 space-y-2.5 animate-in fade-in">
                  <div className="text-[11px] font-bold text-red-300 uppercase">Ручные параметры урона:</div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400">Суммарный урон с кубиков:</span>
                      <input
                        type="number"
                        min="0"
                        value={manualDamageTotal}
                        onChange={(e) => setManualDamageTotal(parseInt(e.target.value) || 0)}
                        className="w-20 bg-zinc-900 border border-red-500 rounded px-2.5 py-1 text-center font-bold text-white text-sm"
                      />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer text-amber-300 font-bold">
                      <input
                        type="checkbox"
                        checked={manualDamageIsCrit}
                        onChange={(e) => setManualDamageIsCrit(e.target.checked)}
                        className="accent-amber-500"
                      />
                      <span>Выпало две 6-ки (+5 урона)</span>
                    </label>
                  </div>
                </div>
              )}

              <button
                onClick={() => handleRollDamage(damageFormula)}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-orbitron font-bold text-xs rounded transition-all clip-cyber-btn shadow-md uppercase tracking-wider"
              >
                {damageMode === 'manual' ? 'Применить ручной урон' : `Бросить урон (${damageFormula})`}
              </button>

              {damageResult && (
                <div className="p-3.5 bg-zinc-950 rounded border border-red-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-orbitron font-bold text-white text-base">
                      Итоговый урон: <strong className="text-red-400">{damageResult.totalDamage}</strong>
                    </span>
                    {damageResult.isCriticalInjury && (
                      <span className="px-2 py-0.5 rounded bg-red-600 text-white font-bold font-tech animate-pulse flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        КРИТ (+5 урона)
                      </span>
                    )}
                  </div>

                  <div className="text-zinc-300 font-tech">
                    {damageResult.isManualRoll ? (
                      <span>Ручной ввод урона</span>
                    ) : (
                      <span>
                        Выпавшие кости: [{damageResult.diceRolls.join(', ')}] = {damageResult.baseSum}
                        {damageResult.bonusDamage > 0 && ` + ${damageResult.bonusDamage} бонус за две шестерки`}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Death Save */}
          {activeTab === 'deathsave' && (
            <div className="space-y-3.5">
              {/* Mode switch */}
              <div className="flex items-center justify-between bg-zinc-950 p-2 rounded border border-zinc-800">
                <span className="text-zinc-400 uppercase text-[11px] font-bold">Режим спасброска:</span>
                <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800">
                  <button
                    onClick={() => setDeathMode('auto')}
                    className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
                      deathMode === 'auto' ? 'bg-purple-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Dices className="w-3.5 h-3.5" />
                    Автобросок
                  </button>
                  <button
                    onClick={() => setDeathMode('manual')}
                    className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors ${
                      deathMode === 'manual' ? 'bg-purple-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Ручной ввод кубика
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1 uppercase text-[11px]">Характеристика ТЕЛО (BODY)</label>
                  <input
                    type="number"
                    value={bodyStat}
                    onChange={(e) => setBodyStat(parseInt(e.target.value) || 1)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-bold text-sm outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1 uppercase text-[11px]">Штраф раундов смерти (+1/раунд)</label>
                  <input
                    type="number"
                    min="0"
                    value={deathPenalty}
                    onChange={(e) => setDeathPenalty(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-purple-400 font-bold text-sm outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Manual Death Save D10 input */}
              {deathMode === 'manual' && (
                <div className="p-3 bg-zinc-950 rounded border border-purple-500/50 space-y-2 animate-in fade-in">
                  <div className="text-[11px] font-bold text-purple-300 uppercase">Ручной результат дайса 1d10:</div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">1d10 (1–10):</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={manualDeathD10}
                      onChange={(e) => setManualDeathD10(parseInt(e.target.value) || 1)}
                      className="w-16 bg-zinc-900 border border-purple-500 rounded px-2 py-1 text-center font-bold text-purple-300 text-sm"
                    />
                    {manualDeathD10 === 10 && (
                      <span className="text-red-400 font-bold text-xs ml-2 animate-pulse">
                        💀 Натуральная 10 = Мгновенная смерть!
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded text-zinc-400 text-xs">
                Правило спасброска CPR: бросается 1d10 + штраф раундов. Если результат СТРОГО МЕНЬШЕ характеристики ТЕЛО — персонаж выжил в этом ходу. Выпадение натуральной 10 означает мгновенную смерть.
              </div>

              <button
                onClick={handleRollDeathSave}
                className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-orbitron font-bold text-xs rounded transition-all clip-cyber-btn shadow-md uppercase tracking-wider"
              >
                {deathMode === 'manual' ? 'Применить ручной спасбросок (1d10)' : 'Бросить спасбросок от смерти (1d10)'}
              </button>

              {deathResult && (
                <div className={`p-3.5 rounded border ${
                  deathResult.isSaved ? 'bg-emerald-950/40 border-emerald-600/70 text-emerald-200' : 'bg-red-950/60 border-red-600 text-red-200'
                }`}>
                  <div className="font-orbitron font-bold text-sm mb-1">
                    {deathResult.isSaved ? 'ВЫЖИЛ В ЭТОМ ХОДУ!' : 'СМЕРТЬ ПЕРСОНАЖА!'}
                  </div>
                  <div>{deathResult.message}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
