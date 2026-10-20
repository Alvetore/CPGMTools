import React, { useState } from 'react';
import { Dices, X, Sparkles, AlertTriangle, Skull, Shield, Heart } from 'lucide-react';
import { executeCPRCheck, rollDamageFormula, executeDeathSave, rollD10, rollD6 } from '../../utils/dice';
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

  // Damage state
  const [damageFormula, setDamageFormula] = useState<string>('4d6');
  const [damageResult, setDamageResult] = useState<any | null>(null);

  // Death Save state
  const [bodyStat, setBodyStat] = useState<number>(6);
  const [deathPenalty, setDeathPenalty] = useState<number>(0);
  const [deathResult, setDeathResult] = useState<any | null>(null);

  const handleRollCheck = () => {
    sfx.playClick();
    const res = executeCPRCheck(baseStatSkill, modifier, luckSpent, targetDv);
    setCheckResult(res);
  };

  const handleRollDamage = (formula: string) => {
    sfx.playHit();
    const res = rollDamageFormula(formula);
    setDamageResult(res);
  };

  const handleRollDeathSave = () => {
    const res = executeDeathSave(bodyStat, deathPenalty);
    setDeathResult(res);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-900 border border-amber-600/70 rounded-lg max-w-lg w-full max-h-[92vh] overflow-y-auto clip-cyber shadow-[0_0_30px_rgba(245,158,11,0.25)]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950/80 via-zinc-900 to-zinc-900 px-5 py-3.5 border-b border-amber-800 flex items-center justify-between">
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

        <div className="p-5 space-y-4 text-xs font-tech">
          
          {/* TAB 1: 1d10 Check */}
          {activeTab === 'check' && (
            <div className="space-y-3.5">
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

              <button
                onClick={handleRollCheck}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-black font-orbitron font-bold text-xs rounded transition-all clip-cyber-btn shadow-md uppercase tracking-wider"
              >
                Бросить проверку 1d10
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
              <div>
                <label className="text-zinc-400 block mb-1 uppercase text-[11px]">Формула урона</label>
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
                        handleRollDamage(formula);
                      }}
                      className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-300 hover:border-red-500 text-xs font-tech"
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handleRollDamage(damageFormula)}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-orbitron font-bold text-xs rounded transition-all clip-cyber-btn shadow-md uppercase tracking-wider"
              >
                Бросить урон ({damageFormula})
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
                    Выпавшие кости: [{damageResult.diceRolls.join(', ')}] = {damageResult.baseSum}
                    {damageResult.bonusDamage > 0 && ` + ${damageResult.bonusDamage} бонус за две шестерки`}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Death Save */}
          {activeTab === 'deathsave' && (
            <div className="space-y-3.5">
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

              <div className="p-2.5 bg-zinc-950 border border-zinc-800 rounded text-zinc-400 text-xs">
                Правило спасброска CPR: бросается 1d10 + штраф раундов. Если результат СТРОГО МЕНЬШЕ характеристики ТЕЛО — персонаж выжил в этом ходу. Выпадение натуральной 10 означает мгновенную смерть.
              </div>

              <button
                onClick={handleRollDeathSave}
                className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-orbitron font-bold text-xs rounded transition-all clip-cyber-btn shadow-md uppercase tracking-wider"
              >
                Бросить спасбросок от смерти (1d10)
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
