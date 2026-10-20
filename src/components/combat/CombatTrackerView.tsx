import React, { useState, useEffect } from 'react';
import { 
  Play, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  Crosshair, 
  Shield, 
  Heart, 
  Skull, 
  AlertTriangle, 
  Trash2, 
  Volume2, 
  Flame, 
  CheckCircle,
  Clock,
  Sparkles,
  Dices,
  Edit3,
  X
} from 'lucide-react';
import { Combatant, ActiveCombatState, CombatLogEntry, Condition } from '../../types/combat';
import { CriticalInjury, Weapon } from '../../types/character';
import { getWoundedStatus } from '../../utils/cprCombat';
import { executeDeathSave, rollD10 } from '../../utils/dice';
import { sfx } from '../../utils/audio';
import { AttackResolverModal } from './AttackResolverModal';
import { CPR_CRITICAL_INJURIES_BODY, CPR_CRITICAL_INJURIES_HEAD } from '../../data/cprRules';

interface CombatTrackerViewProps {
  combatState: ActiveCombatState;
  setCombatState: React.Dispatch<React.SetStateAction<ActiveCombatState>>;
  onOpenBestiaryModal: () => void;
  onAddPartyToCombat: () => void;
}

export const CombatTrackerView: React.FC<CombatTrackerViewProps> = ({
  combatState,
  setCombatState,
  onOpenBestiaryModal,
  onAddPartyToCombat
}) => {
  const [activeAttacker, setActiveAttacker] = useState<Combatant | null>(null);
  const [injuryModalCombatant, setInjuryModalCombatant] = useState<Combatant | null>(null);
  const [isLogExpanded, setIsLogExpanded] = useState<boolean>(true);

  // Death Save manual/auto modal state
  const [deathSaveModalTarget, setDeathSaveModalTarget] = useState<Combatant | null>(null);
  const [deathSaveMode, setDeathSaveMode] = useState<'auto' | 'manual'>('auto');
  const [manualDeathD10, setManualDeathD10] = useState<number>(5);
  const [deathSaveResult, setDeathSaveResult] = useState<any | null>(null);

  // Initiative manual/bulk modal state
  const [isInitiativeModalOpen, setIsInitiativeModalOpen] = useState<boolean>(false);
  const [initiativeDraft, setInitiativeDraft] = useState<{ [id: string]: number }>({});

  // Quick add manual combatant modal
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [newCombatantName, setNewCombatantName] = useState<string>('');
  const [newCombatantType, setNewCombatantType] = useState<Combatant['type']>('enemy');
  const [newCombatantHp, setNewCombatantHp] = useState<number>(30);
  const [newCombatantHeadSp, setNewCombatantHeadSp] = useState<number>(11);
  const [newCombatantBodySp, setNewCombatantBodySp] = useState<number>(11);
  const [newCombatantRef, setNewCombatantRef] = useState<number>(6);

  // Keyboard shortcut: Space for Next Turn
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && combatState.isActive && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        handleNextTurn();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [combatState]);

  const addLog = (message: string, type: CombatLogEntry['type']) => {
    const entry: CombatLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      round: combatState.round,
      message,
      type
    };
    setCombatState(prev => ({
      ...prev,
      log: [entry, ...prev.log.slice(0, 49)] // Keep last 50
    }));
  };

  const handleStartCombat = () => {
    sfx.playCritSuccess();
    setCombatState(prev => ({
      ...prev,
      isActive: true,
      round: 1,
      currentTurnIndex: 0
    }));
    addLog('Бой начался! Раунд 1.', 'system');
  };

  const handleNextTurn = () => {
    sfx.playClick();
    if (combatState.combatants.length === 0) return;

    let nextIndex = combatState.currentTurnIndex + 1;
    let nextRound = combatState.round;

    if (nextIndex >= combatState.combatants.length) {
      nextIndex = 0;
      nextRound += 1;
      addLog(`Начался новый раунд ${nextRound}!`, 'system');
    }

    // Tick conditions and death saves for active combatant
    const current = combatState.combatants[nextIndex];
    if (current && current.hpCurrent <= 0) {
      // Increase death save penalties by 1
      handleUpdateCombatant(current.id, {
        deathSavePenalties: (current.deathSavePenalties || 0) + 1
      });
      addLog(`${current.name} в смертельном ранении. Штраф к спасброску увеличен до +${(current.deathSavePenalties || 0) + 1}!`, 'deathsave');
    }

    setCombatState(prev => ({
      ...prev,
      round: nextRound,
      currentTurnIndex: nextIndex
    }));
  };

  const handlePrevTurn = () => {
    sfx.playClick();
    if (combatState.combatants.length === 0) return;

    let prevIndex = combatState.currentTurnIndex - 1;
    let prevRound = combatState.round;

    if (prevIndex < 0) {
      prevIndex = combatState.combatants.length - 1;
      prevRound = Math.max(1, prevRound - 1);
    }

    setCombatState(prev => ({
      ...prev,
      round: prevRound,
      currentTurnIndex: prevIndex
    }));
  };

  const handleRollAllInitiative = () => {
    sfx.playDiceRoll();
    const updated = combatState.combatants.map(c => {
      const roll = rollD10();
      const init = roll + c.ref;
      return { ...c, initiative: init };
    });

    // Sort descending by initiative, tie-break by REF
    updated.sort((a, b) => {
      if (b.initiative !== a.initiative) return b.initiative - a.initiative;
      return b.ref - a.ref;
    });

    setCombatState(prev => ({
      ...prev,
      combatants: updated,
      currentTurnIndex: 0
    }));

    addLog('Брошена инициатива для всех участников (1d10 + РЕФ).', 'system');
  };

  const handleUpdateCombatant = (id: string, updates: Partial<Combatant>) => {
    setCombatState(prev => ({
      ...prev,
      combatants: prev.combatants.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  };

  const handleAblateArmor = (id: string, location: 'head' | 'body', amount: number = 1) => {
    sfx.playAblate();
    const c = combatState.combatants.find(x => x.id === id);
    if (!c) return;

    if (location === 'head') {
      const newSp = Math.max(0, c.headSp - amount);
      handleUpdateCombatant(id, { headSp: newSp });
      addLog(`${c.name}: броня головы стёрта на -${amount} (теперь ОС ${newSp}).`, 'damage');
    } else {
      const newSp = Math.max(0, c.bodySp - amount);
      handleUpdateCombatant(id, { bodySp: newSp });
      addLog(`${c.name}: броня тела стёрта на -${amount} (теперь ОС ${newSp}).`, 'damage');
    }
  };

  const handleRepairArmor = (id: string, location: 'head' | 'body') => {
    sfx.playClick();
    const c = combatState.combatants.find(x => x.id === id);
    if (!c) return;
    if (location === 'head') {
      handleUpdateCombatant(id, { headSp: c.headSpMax });
      addLog(`${c.name}: броня головы восстановлена до максимума (${c.headSpMax}).`, 'heal');
    } else {
      handleUpdateCombatant(id, { bodySp: c.bodySpMax });
      addLog(`${c.name}: броня тела восстановлена до максимума (${c.bodySpMax}).`, 'heal');
    }
  };

  const handleQuickHpAdjust = (id: string, delta: number) => {
    const c = combatState.combatants.find(x => x.id === id);
    if (!c) return;
    if (delta < 0) sfx.playHit(); else sfx.playClick();

    const newHp = Math.min(c.hpMax, Math.max(0, c.hpCurrent + delta));
    const wasDefeated = c.isDefeated;
    const isNowDefeated = newHp <= 0;

    handleUpdateCombatant(id, { 
      hpCurrent: newHp,
      isDefeated: isNowDefeated
    });

    addLog(`${c.name}: ОЗ ${delta > 0 ? '+' : ''}${delta} (теперь ${newHp}/${c.hpMax}).`, delta < 0 ? 'damage' : 'heal');
  };

  const handleDeathSaveRoll = (c: Combatant, manualRoll?: number) => {
    const result = executeDeathSave(c.body, c.deathSavePenalties || 0, manualRoll);
    addLog(`${c.name}: ${result.message}`, 'deathsave');
    if (!result.isSaved) {
      handleUpdateCombatant(c.id, { isDefeated: true });
    }
    return result;
  };

  const handleRemoveCombatant = (id: string) => {
    sfx.playClick();
    setCombatState(prev => ({
      ...prev,
      combatants: prev.combatants.filter(c => c.id !== id),
      currentTurnIndex: Math.min(prev.currentTurnIndex, Math.max(0, prev.combatants.length - 2))
    }));
  };

  const handleAddQuickCombatant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCombatantName.trim()) return;

    const newC: Combatant = {
      id: `c-${Date.now()}`,
      name: newCombatantName.trim(),
      type: newCombatantType,
      initiative: 0,
      ref: newCombatantRef,
      dex: newCombatantRef,
      move: 5,
      body: 6,
      hpCurrent: newCombatantHp,
      hpMax: newCombatantHp,
      deathSavePenalties: 0,
      headSp: newCombatantHeadSp,
      headSpMax: newCombatantHeadSp,
      bodySp: newCombatantBodySp,
      bodySpMax: newCombatantBodySp,
      weapons: [
        {
          id: `w-${Date.now()}`,
          name: 'Тяжёлый пистолет',
          category: 'Heavy Pistol',
          damage: '3d6',
          standardRof: 2,
          magCapacity: 8,
          currentAmmo: 8,
          ammoType: 'Пистолетные'
        }
      ],
      conditions: [],
      criticalInjuries: [],
      isDefeated: false,
      isDelayed: false
    };

    setCombatState(prev => ({
      ...prev,
      combatants: [...prev.combatants, newC]
    }));

    setNewCombatantName('');
    setIsQuickAddOpen(false);
    sfx.playClick();
    addLog(`Добавлен участник: ${newC.name}`, 'system');
  };

  const activeCombatant = combatState.combatants[combatState.currentTurnIndex];

  return (
    <div className="space-y-4">
      
      {/* Top Combat Bar */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg flex flex-wrap items-center justify-between gap-3 shadow-lg">
        
        {/* Round & Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-zinc-950 px-3.5 py-2 rounded border border-red-900/60">
            <span className="text-zinc-400 font-tech text-xs uppercase">РАУНД:</span>
            <span className="font-orbitron font-black text-xl text-red-500">{combatState.round}</span>
          </div>

          {!combatState.isActive ? (
            <button
              onClick={handleStartCombat}
              disabled={combatState.combatants.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-orbitron font-bold text-xs rounded transition-all clip-cyber-btn shadow-md"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>НАЧАТЬ БОЙ</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevTurn}
                title="Предыдущий ход"
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={handleNextTurn}
                title="Следующий ход (Горячая клавиша: Space)"
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-orbitron font-black text-xs rounded transition-all clip-cyber-btn shadow-[0_0_15px_rgba(245,158,11,0.4)]"
              >
                <span>СЛЕДУЮЩИЙ ХОД [ПРОБЕЛ]</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  if (confirm('Сбросить бой? Раунд вернется к 1.')) {
                    sfx.playClick();
                    setCombatState(prev => ({ ...prev, isActive: false, round: 1, currentTurnIndex: 0 }));
                    addLog('Бой завершен.', 'system');
                  }
                }}
                title="Сбросить бой"
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-red-400 rounded border border-zinc-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Combat Management Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRollAllInitiative}
            disabled={combatState.combatants.length === 0}
            className="px-3 py-1.5 text-xs font-orbitron font-bold text-cyan-300 bg-cyan-950/40 border border-cyan-600/50 hover:bg-cyan-900/60 rounded transition-all"
          >
            БРОСИТЬ ИНИЦИАТИВУ ВСЕМ (АВТО)
          </button>

          <button
            onClick={() => {
              const draft: { [id: string]: number } = {};
              combatState.combatants.forEach(c => {
                draft[c.id] = c.initiative > c.ref ? Math.min(10, Math.max(1, c.initiative - c.ref)) : 5;
              });
              setInitiativeDraft(draft);
              setIsInitiativeModalOpen(true);
            }}
            disabled={combatState.combatants.length === 0}
            className="px-3 py-1.5 text-xs font-orbitron font-bold text-amber-300 bg-amber-950/40 border border-amber-600/50 hover:bg-amber-900/60 rounded transition-all"
          >
            ✍️ ВВОД ИНИЦИАТИВЫ
          </button>

          <button
            onClick={onAddPartyToCombat}
            className="px-3 py-1.5 text-xs font-orbitron font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-600/50 hover:bg-emerald-900/60 rounded transition-all"
          >
            + ПАРТИЯ ИГРОКОВ
          </button>

          <button
            onClick={onOpenBestiaryModal}
            className="px-3 py-1.5 text-xs font-orbitron font-bold text-red-300 bg-red-950/40 border border-red-600/50 hover:bg-red-900/60 rounded transition-all"
          >
            + ИЗ БЕСТИАРИЯ
          </button>

          <button
            onClick={() => setIsQuickAddOpen(true)}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded border border-zinc-700 transition-colors"
            title="Быстрое добавление комбатанта"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Combatant Spotlight */}
      {combatState.isActive && activeCombatant && (
        <div className="bg-gradient-to-r from-red-950/80 via-zinc-900 to-zinc-900 border-2 border-red-500 p-4 rounded-lg shadow-[0_0_25px_rgba(239,68,68,0.3)] animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-tech text-red-400 tracking-widest uppercase flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span>СЕЙЧАС ХОДИТ</span>
              </div>
              <h2 className="font-orbitron font-black text-white text-xl sm:text-2xl flex items-center gap-2">
                {activeCombatant.name}
                {activeCombatant.handle && (
                  <span className="text-zinc-400 text-sm font-normal">«{activeCombatant.handle}»</span>
                )}
              </h2>
              <div className="text-xs text-zinc-400 font-tech mt-1 flex flex-wrap items-center gap-3">
                <span>Инициатива: <strong className="text-white">{activeCombatant.initiative}</strong></span>
                <span>РЕФ: <strong className="text-cyan-400">{activeCombatant.ref}</strong></span>
                <span>ЛОВ: <strong className="text-cyan-400">{activeCombatant.dex}</strong></span>
                <span>СКО: <strong className="text-cyan-400">{activeCombatant.move}</strong></span>
                <span>ТЕЛО: <strong className="text-cyan-400">{activeCombatant.body}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveAttacker(activeCombatant)}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-orbitron font-bold text-xs rounded transition-all clip-cyber-btn shadow-lg"
              >
                <Crosshair className="w-4 h-4" />
                <span>АТАКОВАТЬ ЦЕЛЬ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Combatants List */}
      <div className="space-y-2.5">
        {combatState.combatants.length === 0 ? (
          <div className="bg-zinc-900/60 border border-dashed border-zinc-800 p-8 rounded-lg text-center space-y-3">
            <Skull className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="font-orbitron font-bold text-zinc-300">В бою пока нет участников</h3>
            <p className="text-xs text-zinc-500 max-w-md mx-auto font-tech">
              Добавьте постоянную партию игроков одной кнопкой или выберите противников из официального бестиария Cyberpunk RED!
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={onAddPartyToCombat}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-orbitron font-bold text-xs rounded clip-cyber-sm"
              >
                + ДОБАВИТЬ ПАРТИЮ
              </button>
              <button
                onClick={onOpenBestiaryModal}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-orbitron font-bold text-xs rounded clip-cyber-sm"
              >
                + ИЗ БЕСТИАРИЯ
              </button>
            </div>
          </div>
        ) : (
          combatState.combatants.map((c, index) => {
            const isActive = combatState.isActive && index === combatState.currentTurnIndex;
            const wounded = getWoundedStatus(c.hpCurrent, c.hpMax);

            return (
              <div
                key={c.id}
                className={`bg-zinc-900 p-3 sm:p-4 rounded-lg border transition-all ${
                  isActive 
                    ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.25)] bg-gradient-to-r from-red-950/40 via-zinc-900 to-zinc-900' 
                    : c.isDefeated
                    ? 'border-zinc-800/60 opacity-60 bg-zinc-950/60'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  
                  {/* Left: Initiative, Name, Type, Status */}
                  <div className="flex items-start gap-3 min-w-[260px]">
                    {/* Initiative badge */}
                    <div className="flex flex-col items-center justify-center bg-zinc-950 border border-zinc-800 px-2 py-1.5 rounded min-w-[42px]">
                      <span className="text-[9px] font-tech text-zinc-500 uppercase">ИНИ</span>
                      <input
                        type="number"
                        value={c.initiative}
                        onChange={(e) => handleUpdateCombatant(c.id, { initiative: parseInt(e.target.value) || 0 })}
                        className="w-8 bg-transparent text-center font-orbitron font-black text-amber-400 text-sm outline-none"
                      />
                    </div>

                    {/* Name & badges */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-orbitron font-bold text-white text-sm sm:text-base">
                          {c.name}
                        </span>
                        <span className={`text-[10px] font-tech px-1.5 py-0.2 rounded border font-bold uppercase ${
                          c.type === 'player' ? 'bg-emerald-950 border-emerald-700 text-emerald-400' :
                          c.type === 'enemy' ? 'bg-red-950 border-red-700 text-red-400' :
                          c.type === 'ally' ? 'bg-cyan-950 border-cyan-700 text-cyan-400' :
                          'bg-zinc-800 border-zinc-700 text-zinc-400'
                        }`}>
                          {c.type === 'player' ? 'Игрок' : c.type === 'enemy' ? 'Враг' : c.type === 'ally' ? 'Союзник' : 'Дрон'}
                        </span>
                      </div>

                      {/* CPR Wounded Status Badge */}
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className={`text-[10px] font-tech font-bold px-2 py-0.5 rounded border ${wounded.colorClass}`}>
                          {wounded.labelRu}
                        </span>

                        {/* Death save button if 0 HP */}
                        {c.hpCurrent <= 0 && (
                          <button
                            onClick={() => {
                              setDeathSaveModalTarget(c);
                              setDeathSaveResult(null);
                              setManualDeathD10(5);
                              setDeathSaveMode('auto');
                            }}
                            className="text-[10px] font-orbitron font-bold px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded animate-pulse"
                          >
                            Спасбросок смерти (Штраф +{c.deathSavePenalties})
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle: HP Bar and Quick Adjust */}
                  <div className="flex-1 max-w-sm space-y-1">
                    <div className="flex items-center justify-between text-xs font-tech">
                      <span className="text-zinc-400 flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-red-500" />
                        <span>Здоровье (HP):</span>
                      </span>
                      <strong className="text-white">
                        {c.hpCurrent} / {c.hpMax}
                      </strong>
                    </div>

                    <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-zinc-800">
                      <div
                        className={`h-full transition-all duration-300 ${
                          c.hpCurrent <= 0 ? 'bg-zinc-700' :
                          c.hpCurrent <= c.hpMax / 2 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.max(0, Math.min(100, (c.hpCurrent / c.hpMax) * 100))}%` }}
                      ></div>
                    </div>

                    {/* Quick HP +/- */}
                    <div className="flex items-center gap-1 pt-0.5">
                      {[-5, -1, +1, +5].map((delta) => (
                        <button
                          key={delta}
                          onClick={() => handleQuickHpAdjust(c.id, delta)}
                          className={`flex-1 py-0.5 text-[10px] font-tech font-bold rounded border transition-colors ${
                            delta < 0
                              ? 'bg-zinc-950 border-zinc-800 text-red-400 hover:bg-red-950'
                              : 'bg-zinc-950 border-zinc-800 text-emerald-400 hover:bg-emerald-950'
                          }`}
                        >
                          {delta > 0 ? `+${delta}` : delta}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right: Head & Body Armor with Ablation */}
                  <div className="flex items-center gap-3">
                    {/* Head Armor */}
                    <div className="bg-zinc-950 p-2 rounded border border-zinc-800 text-center min-w-[90px]">
                      <div className="text-[10px] font-tech text-zinc-500 uppercase">Голова (Head)</div>
                      <div className="font-orbitron font-bold text-sm text-cyan-400">
                        {c.headSp} <span className="text-[10px] text-zinc-500">/{c.headSpMax}</span>
                      </div>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <button
                          onClick={() => handleAblateArmor(c.id, 'head', 1)}
                          title="Стереть броню -1 SP"
                          className="px-1.5 py-0.5 text-[10px] bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 rounded font-tech"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleRepairArmor(c.id, 'head')}
                          title="Восстановить броню головы"
                          className="px-1.5 py-0.5 text-[10px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded font-tech"
                        >
                          ОС
                        </button>
                      </div>
                    </div>

                    {/* Body Armor */}
                    <div className="bg-zinc-950 p-2 rounded border border-zinc-800 text-center min-w-[90px]">
                      <div className="text-[10px] font-tech text-zinc-500 uppercase">Тело (Body)</div>
                      <div className="font-orbitron font-bold text-sm text-cyan-400">
                        {c.bodySp} <span className="text-[10px] text-zinc-500">/{c.bodySpMax}</span>
                      </div>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <button
                          onClick={() => handleAblateArmor(c.id, 'body', 1)}
                          title="Стереть броню -1 SP"
                          className="px-1.5 py-0.5 text-[10px] bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 rounded font-tech"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleRepairArmor(c.id, 'body')}
                          title="Восстановить броню тела"
                          className="px-1.5 py-0.5 text-[10px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded font-tech"
                        >
                          ОС
                        </button>
                      </div>
                    </div>

                    {/* Actions: Attack & Delete */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => setActiveAttacker(c)}
                        title="Атаковать из этого участника"
                        className="p-2 bg-red-950 hover:bg-red-900 border border-red-700 text-red-400 hover:text-white rounded transition-colors"
                      >
                        <Crosshair className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleRemoveCombatant(c.id)}
                        title="Удалить из боя"
                        className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-500 hover:text-red-400 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Critical Injuries tag list */}
                {c.criticalInjuries && c.criticalInjuries.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-zinc-800/80 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-tech text-red-400 uppercase">Травмы:</span>
                    {c.criticalInjuries.map((injury, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-tech px-2 py-0.5 rounded bg-red-950/80 border border-red-700 text-red-300 flex items-center gap-1"
                        title={injury.effectRu}
                      >
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                        <span>{injury.nameRu}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Combat Log */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow-lg">
        <div 
          onClick={() => setIsLogExpanded(!isLogExpanded)}
          className="bg-zinc-950 px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between cursor-pointer hover:bg-zinc-900/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <span className="font-orbitron font-bold text-xs text-zinc-300 uppercase tracking-wider">
              Журнал событий боя ({combatState.log.length})
            </span>
          </div>
          <span className="text-xs font-tech text-zinc-500">
            {isLogExpanded ? 'Свернуть ▲' : 'Развернуть ▼'}
          </span>
        </div>

        {isLogExpanded && (
          <div className="p-3 max-h-48 overflow-y-auto space-y-1 text-xs font-tech">
            {combatState.log.length === 0 ? (
              <div className="text-zinc-600 text-center py-2">Событий пока нет</div>
            ) : (
              combatState.log.map((log) => (
                <div key={log.id} className="flex items-start gap-2 py-0.5 border-b border-zinc-800/40">
                  <span className="text-zinc-500 min-w-[50px]">{log.timestamp}</span>
                  <span className="text-red-400 font-bold min-w-[45px]">Р{log.round}</span>
                  <span className={`flex-1 ${
                    log.type === 'attack' ? 'text-amber-300' :
                    log.type === 'damage' ? 'text-red-300' :
                    log.type === 'heal' ? 'text-emerald-300' :
                    log.type === 'deathsave' ? 'text-purple-300 font-bold' :
                    'text-zinc-300'
                  }`}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Attack Resolver Modal */}
      {activeAttacker && (
        <AttackResolverModal
          attacker={activeAttacker}
          combatants={combatState.combatants}
          onClose={() => setActiveAttacker(null)}
          onApplyDamage={(targetId, hpLoss, location, newSp, logText, critInjury) => {
            const target = combatState.combatants.find(c => c.id === targetId);
            if (!target) return;

            const nextHp = Math.max(0, target.hpCurrent - hpLoss);
            const isNowDefeated = nextHp <= 0;
            const updatedInjuries = critInjury 
              ? [...(target.criticalInjuries || []), critInjury] 
              : target.criticalInjuries;

            if (location === 'head') {
              handleUpdateCombatant(targetId, {
                hpCurrent: nextHp,
                headSp: newSp,
                isDefeated: isNowDefeated,
                criticalInjuries: updatedInjuries
              });
            } else {
              handleUpdateCombatant(targetId, {
                hpCurrent: nextHp,
                bodySp: newSp,
                isDefeated: isNowDefeated,
                criticalInjuries: updatedInjuries
              });
            }

            addLog(logText, 'damage');
          }}
        />
      )}

      {/* Quick Add Combatant Modal */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleAddQuickCombatant} className="bg-zinc-900 border border-zinc-700 rounded-lg max-w-md w-full p-5 space-y-4 clip-cyber shadow-2xl">
            <h3 className="font-orbitron font-bold text-white text-base">ДОБАВИТЬ УЧАСТНИКА</h3>
            
            <div>
              <label className="text-xs font-tech text-zinc-400 block mb-1">Имя / Кличка</label>
              <input
                type="text"
                required
                value={newCombatantName}
                onChange={(e) => setNewCombatantName(e.target.value)}
                placeholder="например, Бустер Мальстрём"
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-white font-medium focus:border-red-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-tech text-zinc-400 block mb-1">Тип</label>
                <select
                  value={newCombatantType}
                  onChange={(e) => setNewCombatantType(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-white outline-none"
                >
                  <option value="enemy">Враг</option>
                  <option value="player">Игрок</option>
                  <option value="ally">Союзник</option>
                  <option value="neutral">Нейтрал / Дрон</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-tech text-zinc-400 block mb-1">РЕФ (REF)</label>
                <input
                  type="number"
                  value={newCombatantRef}
                  onChange={(e) => setNewCombatantRef(parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-tech text-zinc-400 block mb-1">HP (ПЗ)</label>
                <input
                  type="number"
                  value={newCombatantHp}
                  onChange={(e) => setNewCombatantHp(parseInt(e.target.value) || 1)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-white outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-tech text-zinc-400 block mb-1">Голова ОС</label>
                <input
                  type="number"
                  value={newCombatantHeadSp}
                  onChange={(e) => setNewCombatantHeadSp(parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-white outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-tech text-zinc-400 block mb-1">Тело ОС</label>
                <input
                  type="number"
                  value={newCombatantBodySp}
                  onChange={(e) => setNewCombatantBodySp(parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-white outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(false)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white rounded"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-orbitron font-bold text-xs rounded clip-cyber-sm"
              >
                Добавить
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Death Save Modal with Manual/Auto input */}
      {deathSaveModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-purple-600/70 rounded-lg max-w-md w-full p-5 space-y-4 clip-cyber shadow-[0_0_30px_rgba(168,85,247,0.25)]">
            <div className="flex items-center justify-between border-b border-purple-900/60 pb-3">
              <div className="flex items-center gap-2">
                <Skull className="w-5 h-5 text-purple-400" />
                <h3 className="font-orbitron font-bold text-white text-base">СПАСБРОСОК ОТ СМЕРТИ</h3>
              </div>
              <button
                onClick={() => setDeathSaveModalTarget(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-zinc-950 p-3 rounded border border-zinc-800 text-xs font-tech space-y-1">
              <div className="text-white font-bold text-sm">{deathSaveModalTarget.name}</div>
              <div className="text-zinc-400 flex items-center justify-between">
                <span>Характеристика ТЕЛО: <strong className="text-white">{deathSaveModalTarget.body}</strong></span>
                <span>Штраф раундов смерти: <strong className="text-purple-400">+{deathSaveModalTarget.deathSavePenalties || 0}</strong></span>
              </div>
              <div className="text-[11px] text-zinc-500 pt-1">
                Для выживания нужно выбросить на 1d10 + штраф СТРОГО МЕНЬШЕ характеристики ТЕЛО. Выпадение 10 — мгновенная смерть.
              </div>
            </div>

            {/* Mode switch */}
            <div className="flex items-center justify-between bg-zinc-950 p-2 rounded border border-zinc-800">
              <span className="text-zinc-400 text-xs font-tech font-bold uppercase">Режим броска:</span>
              <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800 text-xs font-tech">
                <button
                  type="button"
                  onClick={() => setDeathSaveMode('auto')}
                  className={`px-2.5 py-1 rounded flex items-center gap-1 transition-colors ${
                    deathSaveMode === 'auto' ? 'bg-purple-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Dices className="w-3.5 h-3.5" />
                  Автобросок
                </button>
                <button
                  type="button"
                  onClick={() => setDeathSaveMode('manual')}
                  className={`px-2.5 py-1 rounded flex items-center gap-1 transition-colors ${
                    deathSaveMode === 'manual' ? 'bg-purple-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Ручной кубик
                </button>
              </div>
            </div>

            {/* Manual input */}
            {deathSaveMode === 'manual' && (
              <div className="p-3 bg-zinc-950 rounded border border-purple-500/50 space-y-2 animate-in fade-in text-xs font-tech">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-300">Выпало на 1d10 (1–10):</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={manualDeathD10}
                    onChange={(e) => setManualDeathD10(parseInt(e.target.value) || 1)}
                    className="w-16 bg-zinc-900 border border-purple-500 rounded px-2.5 py-1 text-center font-bold text-purple-300 text-sm"
                  />
                  {manualDeathD10 === 10 && (
                    <span className="text-red-400 font-bold animate-pulse">Крит. провал (10)!</span>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                const res = handleDeathSaveRoll(
                  deathSaveModalTarget,
                  deathSaveMode === 'manual' ? manualDeathD10 : undefined
                );
                setDeathSaveResult(res);
              }}
              className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-orbitron font-bold text-xs rounded transition-all clip-cyber-btn shadow-md uppercase tracking-wider"
            >
              {deathSaveMode === 'manual' ? 'Применить ручной бросок' : 'Бросить 1d10 (автоматически)'}
            </button>

            {deathSaveResult && (
              <div className={`p-3.5 rounded border text-xs font-tech ${
                deathSaveResult.isSaved ? 'bg-emerald-950/60 border-emerald-600 text-emerald-200' : 'bg-red-950/70 border-red-600 text-red-200'
              }`}>
                <div className="font-orbitron font-bold text-sm mb-1">
                  {deathSaveResult.isSaved ? 'Спасбросок успешен! Персонаж жив.' : 'Спасбросок провален! Персонаж погибает.'}
                </div>
                <div>{deathSaveResult.message}</div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-zinc-800">
              <button
                onClick={() => setDeathSaveModalTarget(null)}
                className="px-4 py-1.5 text-xs text-zinc-400 hover:text-white rounded"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk/Manual Initiative Modal */}
      {isInitiativeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-amber-600/70 rounded-lg max-w-lg w-full max-h-[85vh] overflow-y-auto p-5 space-y-4 clip-cyber shadow-[0_0_30px_rgba(245,158,11,0.25)]">
            <div className="flex items-center justify-between border-b border-amber-900/60 pb-3">
              <div className="flex items-center gap-2">
                <Dices className="w-5 h-5 text-amber-400" />
                <h3 className="font-orbitron font-bold text-white text-base">ВВОД И РАСЧЕТ ИНИЦИАТИВЫ</h3>
              </div>
              <button
                onClick={() => setIsInitiativeModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs font-tech text-zinc-400">
              Введите результат физического кубика 1d10 для каждого участника или бросьте случайно. Инициатива = РЕФ + 1d10.
            </p>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const draft: { [id: string]: number } = {};
                  combatState.combatants.forEach(c => {
                    draft[c.id] = rollD10();
                  });
                  setInitiativeDraft(draft);
                }}
                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-cyan-300 text-xs font-tech font-bold rounded border border-zinc-700 flex items-center gap-1.5"
              >
                <Dices className="w-3.5 h-3.5" />
                Бросить случайные 1d10 для всех
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {combatState.combatants.map(c => {
                const rolled = initiativeDraft[c.id] ?? 5;
                const total = c.ref + rolled;
                return (
                  <div key={c.id} className="flex items-center justify-between bg-zinc-950 p-2.5 rounded border border-zinc-800 text-xs font-tech">
                    <div>
                      <span className="font-bold text-white mr-2">{c.name}</span>
                      <span className="text-zinc-500">РЕФ: {c.ref}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400 text-[11px]">1d10:</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={rolled}
                        onChange={(e) => {
                          const val = Math.min(10, Math.max(1, parseInt(e.target.value) || 1));
                          setInitiativeDraft(prev => ({ ...prev, [c.id]: val }));
                        }}
                        className="w-12 bg-zinc-900 border border-amber-500/70 rounded px-1.5 py-0.5 text-center font-bold text-amber-300"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setInitiativeDraft(prev => ({ ...prev, [c.id]: rollD10() }));
                        }}
                        title="Бросить 1d10 для этого участника"
                        className="p-1 text-zinc-400 hover:text-white"
                      >
                        🎲
                      </button>
                      <span className="font-orbitron font-bold text-white min-w-[45px] text-right">
                        = {total}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsInitiativeModalOpen(false)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white rounded"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  sfx.playDiceRoll();
                  const updated = combatState.combatants.map(c => {
                    const rolled = initiativeDraft[c.id] ?? 5;
                    return { ...c, initiative: c.ref + rolled };
                  });
                  // Sort descending by initiative, tie-break by REF
                  updated.sort((a, b) => {
                    if (b.initiative !== a.initiative) return b.initiative - a.initiative;
                    return b.ref - a.ref;
                  });
                  setCombatState(prev => ({
                    ...prev,
                    combatants: updated,
                    currentTurnIndex: 0
                  }));
                  addLog('Инициатива обновлена и отсортирована.', 'system');
                  setIsInitiativeModalOpen(false);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-orbitron font-bold text-xs rounded clip-cyber-sm"
              >
                Применить и отсортировать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
