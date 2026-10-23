import React, { useState, useEffect } from 'react';
import { 
  Network, 
  Sparkles, 
  Lock, 
  FileText, 
  Sliders, 
  Skull, 
  Bot, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp, 
  Play, 
  CheckCircle2, 
  Dices,
  RefreshCw,
  Edit3,
  X,
  AlertTriangle
} from 'lucide-react';
import { NetArchitecture, NetFloor, NetNodeType } from '../../types/netrun';
import { OFFICIAL_BLACK_ICE, DEMON_PROGRAMS } from '../../data/blackIceData';
import { executeCPRCheck, rollD6 } from '../../utils/dice';
import { sfx } from '../../utils/audio';
import { loadStoredData, saveStoredData, STORAGE_KEYS } from '../../utils/storage';

const SAMPLE_ARCHITECTURES: NetArchitecture[] = [
    {
      id: 'net-sample-1',
      title: 'Серверная регионального офиса Arasaka',
      systemName: 'Arasaka Sub-Net v4.2',
      difficulty: 'Standard',
      createdAt: Date.now(),
      floors: [
        {
          id: 'f-1',
          floorNumber: 1,
          name: 'Внешний шлюз (Access Point)',
          type: 'Password',
          dv: 8,
          description: 'Базовый межсетевой экран. Требуется взлом (Backdoor) для прохода дальше.',
          isUnlocked: false
        },
        {
          id: 'f-2',
          floorNumber: 2,
          name: 'Контрольный узел: Камеры видеонаблюдения',
          type: 'ControlNode',
          dv: 10,
          controlTarget: 'Отключение камер и датчиков движения в коридорах',
          description: 'Узел управления оптической сетью здания.',
          isUnlocked: false
        },
        {
          id: 'f-3',
          floorNumber: 3,
          name: 'Защитный барьер: Адская гончая',
          type: 'BlackIce',
          dv: 12,
          description: 'Агрессивная антиперсональная программа.',
          blackIce: {
            id: 'bi-inst-1',
            name: 'Адская гончая (Hellhound)',
            category: 'Anti-Personnel',
            spd: 6,
            atk: 6,
            def: 2,
            rezCurrent: 20,
            rezMax: 20,
            effect: OFFICIAL_BLACK_ICE.find(i => i.nameEn === 'Hellhound')!.effectRu,
            isDerezed: false
          },
          isUnlocked: false
        },
        {
          id: 'f-4',
          floorNumber: 4,
          name: 'Зашифрованный файл: Списки агентов под прикрытием',
          type: 'File',
          dv: 12,
          description: 'Ценные оперативные данные для продажи фиксеру.',
          isUnlocked: false
        },
        {
          id: 'f-5',
          floorNumber: 5,
          name: 'Контрольный узел: Потолочные турели холла',
          type: 'ControlNode',
          dv: 12,
          controlTarget: 'Перехват турелей для стрельбы по охране',
          description: 'Главный боевой терминал охраны.',
          isUnlocked: false
        },
        {
          id: 'f-6',
          floorNumber: 6,
          name: 'Ядро системы: Демон Ифрит',
          type: 'Demon',
          dv: 14,
          description: 'ИИ безопасности координирует защиту всей архитектуры.',
          isUnlocked: false
        }
      ]
    }
  ];

export const NetArchitectureView: React.FC = () => {
  const [architectures, setArchitectures] = useState<NetArchitecture[]>(() => {
    const stored = loadStoredData<NetArchitecture[]>(STORAGE_KEYS.NETWORKS, SAMPLE_ARCHITECTURES);
    return stored.length ? stored : SAMPLE_ARCHITECTURES;
  });

  const [activeArchIndex, setActiveArchIndex] = useState<number>(() => Math.max(0, Math.min(architectures.length - 1, loadStoredData(STORAGE_KEYS.NETRUN, { activeArchIndex: 0 }).activeArchIndex)));
  const activeArch = architectures[activeArchIndex] || architectures[0];

  // Runner state
  const [currentRunnerFloor, setCurrentRunnerFloor] = useState<number>(() => Math.min(activeArch.floors.length, loadStoredData(STORAGE_KEYS.NETRUN, { currentRunnerFloor: 1 }).currentRunnerFloor));
  const [netrunnerInterface, setNetrunnerInterface] = useState<number>(() => loadStoredData(STORAGE_KEYS.NETRUN, { netrunnerInterface: 6 }).netrunnerInterface);
  const [netActionsMax, setNetActionsMax] = useState<number>(() => netrunnerInterface <= 3 ? 2 : netrunnerInterface <= 6 ? 3 : netrunnerInterface <= 9 ? 4 : 5);
  const [netActionsLeft, setNetActionsLeft] = useState<number>(() => Math.min(netActionsMax, loadStoredData(STORAGE_KEYS.NETRUN, { netActionsLeft: netActionsMax }).netActionsLeft));
  const [runnerLog, setRunnerLog] = useState<string[]>(() => loadStoredData(STORAGE_KEYS.NETRUN, { runnerLog: [] as string[] }).runnerLog);
  useEffect(() => { saveStoredData(STORAGE_KEYS.NETWORKS, architectures); }, [architectures]);
  useEffect(() => { saveStoredData(STORAGE_KEYS.NETRUN, { activeArchIndex, currentRunnerFloor, netrunnerInterface, netActionsLeft, runnerLog }); }, [activeArchIndex, currentRunnerFloor, netrunnerInterface, netActionsLeft, runnerLog]);

  // Manual hack check modal states
  const [hackModalFloor, setHackModalFloor] = useState<NetFloor | null>(null);
  const [hackInputMode, setHackInputMode] = useState<'auto' | 'manual'>('auto');
  const [manualHackD10, setManualHackD10] = useState<number>(5);
  const [manualHackExploded, setManualHackExploded] = useState<number>(5);
  const [manualHackBotch, setManualHackBotch] = useState<number>(5);
  const [hackResult, setHackResult] = useState<any | null>(null);
  const [customIceDmg, setCustomIceDmg] = useState<number>(5);

  const addRunnerLog = (msg: string) => {
    setRunnerLog(prev => [msg, ...prev.slice(0, 19)]);
  };

  // Generate procedural NET Architecture
  const handleGenerateArchitecture = (difficulty: NetArchitecture['difficulty']) => {
    sfx.playCritSuccess();
    let floorCount = 4;
    let baseDv = 8;
    let titlePrefix = 'Локальная сеть клиники';

    if (difficulty === 'Standard') {
      floorCount = 6;
      baseDv = 10;
      titlePrefix = 'Корпоративный дата-центр';
    } else if (difficulty === 'Advanced') {
      floorCount = 7;
      baseDv = 12;
      titlePrefix = 'Банковское хранилище Zetatech';
    } else if (difficulty === 'Military') {
      floorCount = 9;
      baseDv = 14;
      titlePrefix = 'Военный защищенный бункер Militech';
    }

    const generatedFloors: NetFloor[] = [];

    // Floor 1: Always Password
    generatedFloors.push({
      id: `gf-1-${Date.now()}`,
      floorNumber: 1,
      name: 'Внешний шлюз / Фаервол',
      type: 'Password',
      dv: baseDv,
      description: 'Точка входа в локальную сеть через точку беспроводного доступа.',
      isUnlocked: false
    });

    let controlNodes = 0;
    for (let f = 2; f <= floorCount; f++) {
      // Pick node type
      const rand = Math.random();
      let type: NetNodeType = 'File';
      let name = `Этаж ${f}: Файловый каталог`;
      let controlTarget: string | undefined;
      let blackIce: any = undefined;

      if (f === floorCount) {
        // Last floor: Core Demon or Root File
        type = difficulty === 'Basic' ? 'File' : 'Demon';
        name = type === 'Demon' ? 'Ядро Сети: Охранный Демон' : 'Главный файл секретов';
      } else if (rand < 0.35) {
        type = 'BlackIce';
        const randomIce = OFFICIAL_BLACK_ICE[Math.floor(Math.random() * OFFICIAL_BLACK_ICE.length)];
        name = `Защитник: ${randomIce.nameRu}`;
        blackIce = {
          id: `bi-${Date.now()}-${f}`,
          name: randomIce.nameRu,
          category: randomIce.category,
          spd: randomIce.spd,
          atk: randomIce.atk,
          def: randomIce.def,
          rezCurrent: randomIce.rezMax,
          rezMax: randomIce.rezMax,
          effect: randomIce.effectRu,
          isDerezed: false,
          per: randomIce.per
        };
      } else if (rand < 0.70 && controlNodes < (floorCount <= 6 ? 2 : 3)) {
        controlNodes++;
        type = 'ControlNode';
        const targets = ['Камеры наблюдения', 'Система вентиляции (газ)', 'Автоматические двери', 'Боевые турели'];
        controlTarget = targets[Math.floor(Math.random() * targets.length)];
        name = `Узел управления: ${controlTarget}`;
      } else {
        type = 'File';
        const files = ['Финансовые отчеты', 'Личные переписки', 'Планы безопасности', 'Чертежи прототипа'];
        name = `Файл данных: ${files[Math.floor(Math.random() * files.length)]}`;
      }

      generatedFloors.push({
        id: `gf-${f}-${Date.now()}`,
        floorNumber: f,
        name,
        type,
        dv: baseDv + Math.floor(Math.random() * 3),
        controlTarget,
        blackIce,
        description: `Защищенный сегмент сети ${f}-го уровня.`,
        isUnlocked: false
      });
    }

    const newArch: NetArchitecture = {
      id: `arch-${Date.now()}`,
      title: `${titlePrefix} [${difficulty}]`,
      systemName: `SYS-${Math.floor(Math.random() * 9000 + 1000)}`,
      difficulty,
      createdAt: Date.now(),
      floors: generatedFloors
    };

    setArchitectures(prev => [newArch, ...prev]);
    setActiveArchIndex(0);
    setCurrentRunnerFloor(1);
    addRunnerLog(`Сгенерирована новая Архитектура Сети: ${newArch.title} (${floorCount} этажей).`);
  };

  // Floor interaction check
  const handleCheckFloor = (
    floor: NetFloor,
    manualD10?: { firstDie: number; explodedDie?: number; botchDie?: number }
  ) => {
    sfx.playClick();
    if (floor.floorNumber !== currentRunnerFloor) { alert('Сначала перейдите на доступный этаж.'); return; }
    if (floor.type === 'BlackIce' || floor.type === 'Demon') { alert('Бой и Slide разрешаются отдельно. Используйте трекер REZ и отметку разрешения ГМом.'); return; }
    if (netActionsLeft <= 0) {
      alert('У нетраннера закончились сетевые действия в этом ходу! Нажмите "Новый ход нетраннера".');
      return;
    }

    const roll = executeCPRCheck(netrunnerInterface, 0, 0, floor.dv, manualD10);
    setNetActionsLeft(prev => prev - 1);

    const manualPrefix = manualD10 ? ' [ручной бросок]' : '';

    if (roll.isSuccess) {
      sfx.playCritSuccess();
      addRunnerLog(`Этаж ${floor.floorNumber} [${floor.name}]: УСПЕХ!${manualPrefix} Бросок ${roll.grandTotal} vs DV ${floor.dv}. Узел взломан/разблокирован!`);
      // Update floor isUnlocked
      setArchitectures(prev => {
        const copy = [...prev];
        const currentA = { ...copy[activeArchIndex] };
        currentA.floors = currentA.floors.map(f => f.id === floor.id ? { ...f, isUnlocked: true } : f);
        copy[activeArchIndex] = currentA;
        return copy;
      });
    } else {
      sfx.playCritFailure();
      addRunnerLog(`Этаж ${floor.floorNumber} [${floor.name}]: ПРОВАЛ!${manualPrefix} Бросок ${roll.grandTotal} vs DV ${floor.dv}. Доступ заблокирован!`);
    }
    return roll;
  };

  // Black ICE combat damage
  const handleDamageBlackIce = (floor: NetFloor, dmg: number) => {
    sfx.playHit();
    if (!floor.blackIce || !Number.isInteger(dmg) || dmg <= 0) return;

    const nextRez = Math.max(0, floor.blackIce.rezCurrent - dmg);
    const isDerezed = nextRez <= 0;

    setArchitectures(prev => {
      const copy = [...prev];
      const currentA = { ...copy[activeArchIndex] };
      currentA.floors = currentA.floors.map(f => {
          if (f.id === floor.id && f.blackIce) {
          return {
            ...f,
            blackIce: {
              ...f.blackIce,
              rezCurrent: nextRez,
              isDerezed
            }
          };
        }
        return f;
      });
      copy[activeArchIndex] = currentA;
      return copy;
    });

    addRunnerLog(`${floor.blackIce.name}: получено ${dmg} урона REZ. ${isDerezed ? 'ПРОГРАММА ДЕКОМПИЛИРОВАНА (DEREZZED)!' : `Осталось REZ: ${nextRez}/${floor.blackIce.rezMax}`}`);
  };

  const handleResetNetTurn = () => {
    sfx.playClick();
    setNetActionsLeft(netActionsMax);
    addRunnerLog('--- Новый раунд Сети: сетевые действия восстановлены ---');
  };

  return (
    <div className="space-y-4">
      
      <label className="block text-sm text-cyan-300">Сохранённая архитектура
        <select aria-label="Сохранённая архитектура" value={activeArchIndex} onChange={e => {
          setActiveArchIndex(Number(e.target.value)); setCurrentRunnerFloor(1); setHackModalFloor(null);
        }} className="ml-2 bg-zinc-900 border border-zinc-700 p-2 rounded">
          {architectures.map((a, i) => <option key={a.id} value={i}>{a.title}</option>)}
        </select>
      </label>
      {/* Top Banner & Generators */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg space-y-3 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-cyan-400" />
              <h2 className="font-orbitron font-bold text-white text-base">
                ИНТЕРАКТИВНЫЙ РАННЕР СЕТИ (NET ARCHITECTURE)
              </h2>
              <span className="text-xs font-tech px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 font-bold">
                {activeArch.difficulty}
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-tech mt-0.5">
              Пошаговый трекер продвижения Нетраннера по этажам, взлом узлов управления и дуэли с Чёрным Льдом
            </p>
          </div>

          {/* Quick Generator Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-tech text-zinc-500 uppercase mr-1">Создать:</span>
            {(['Basic', 'Standard', 'Advanced', 'Military'] as NetArchitecture['difficulty'][]).map((diff) => (
              <button
                key={diff}
                onClick={() => handleGenerateArchitecture(diff)}
                className="px-2.5 py-1 text-xs font-orbitron font-bold text-cyan-300 bg-cyan-950/40 border border-cyan-700/50 hover:bg-cyan-900/60 rounded transition-all clip-cyber-sm"
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Netrunner Active HUD Panel */}
        <div className="bg-zinc-950 p-3 rounded border border-cyan-900/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs font-tech">
            <div>
              <span className="text-zinc-500">Интерфейс нетраннера: </span>
              <input
                type="number"
                value={netrunnerInterface}
                onChange={(e) => {
                  const val = Math.max(1, Math.min(10, parseInt(e.target.value) || 1));
                  setNetrunnerInterface(val);
                  // CPR rules: 1-3 = 2 actions, 4-6 = 3 actions, 7-9 = 4 actions, 10 = 5 actions
                  const maxA = val <= 3 ? 2 : val <= 6 ? 3 : val <= 9 ? 4 : 5;
                  setNetActionsMax(maxA);
                  setNetActionsLeft(prev => Math.min(prev, maxA));
                }}
                className="w-12 bg-zinc-900 border border-zinc-700 rounded text-center text-cyan-400 font-bold px-1 py-0.5 ml-1"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Сетевые действия (Net Actions):</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: netActionsMax }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-3.5 h-3.5 rounded-sm border ${
                      i < netActionsLeft
                        ? 'bg-cyan-500 border-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                        : 'bg-zinc-800 border-zinc-700'
                    }`}
                  ></span>
                ))}
              </div>
              <span className="text-cyan-400 font-bold font-orbitron text-xs ml-1">
                {netActionsLeft} / {netActionsMax}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800 text-[11px] font-tech">
              <button
                type="button"
                onClick={() => setHackInputMode('auto')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                  hackInputMode === 'auto' ? 'bg-cyan-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Dices className="w-3 h-3" />
                Автоброски
              </button>
              <button
                type="button"
                onClick={() => setHackInputMode('manual')}
                className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors ${
                  hackInputMode === 'manual' ? 'bg-amber-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Edit3 className="w-3 h-3" />
                Ручной ввод
              </button>
            </div>

            <button
              onClick={handleResetNetTurn}
              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-orbitron font-bold text-xs rounded clip-cyber-sm transition-all"
            >
              Новый ход Нетраннера
            </button>
          </div>
        </div>
      </div>

      {/* Main Floor Stack & Side Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left 2 Cols: Floor Stack */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between text-xs font-tech text-zinc-400 px-1">
            <span>ВЕРХНИЙ ЭТАЖ (ВХОД В СЕТЬ)</span>
            <span>{activeArch.floors.length} ЭТАЖЕЙ В АРХИТЕКТУРЕ</span>
          </div>

          {activeArch.floors.map((floor) => {
            const isRunnerHere = currentRunnerFloor === floor.floorNumber;

            return (
              <div
                key={floor.id}
                className={`bg-zinc-900 border rounded-lg p-3.5 transition-all relative clip-cyber-sm ${
                  isRunnerHere
                    ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] bg-gradient-to-r from-cyan-950/40 via-zinc-900 to-zinc-900'
                    : floor.isUnlocked
                    ? 'border-zinc-800/80 bg-zinc-950/60'
                    : 'border-zinc-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  
                  {/* Left: Floor Icon & Info */}
                  <div className="flex items-start gap-3">
                    {/* Floor number box */}
                    <div className="flex flex-col items-center justify-center bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 rounded min-w-[48px]">
                      <span className="text-[9px] font-tech text-zinc-500">ЭТАЖ</span>
                      <strong className="font-orbitron font-black text-cyan-400 text-base">{floor.floorNumber}</strong>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        {/* Type Icon */}
                        {floor.type === 'Password' && <Lock className="w-4 h-4 text-amber-400" />}
                        {floor.type === 'ControlNode' && <Sliders className="w-4 h-4 text-cyan-400" />}
                        {floor.type === 'BlackIce' && <Skull className="w-4 h-4 text-red-500" />}
                        {floor.type === 'Demon' && <Bot className="w-4 h-4 text-purple-400" />}
                        {floor.type === 'File' && <FileText className="w-4 h-4 text-emerald-400" />}

                        <h4 className="font-orbitron font-bold text-white text-sm">
                          {floor.name}
                        </h4>

                        {floor.isUnlocked && (
                          <span className="flex items-center gap-1 text-[10px] font-tech text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-700 font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>ВЗЛОМАН</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-zinc-400 font-tech mt-1">
                        {floor.description}
                      </p>

                      {floor.controlTarget && (
                        <div className="text-[11px] text-cyan-300 font-tech mt-0.5">
                          Контролирует: <strong>{floor.controlTarget}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: DV and Interaction Buttons */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-end gap-1.5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                    <div className="bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800 text-center font-tech">
                      <div className="text-[9px] text-zinc-500">СЛОЖНОСТЬ</div>
                      <div className="font-orbitron font-bold text-amber-400 text-xs">DV {floor.dv}</div>
                    </div>

                    <div className="flex items-center">
                      <button
                        onClick={() => {
                          if (hackInputMode === 'manual') {
                            setHackModalFloor(floor);
                            setHackResult(null);
                            setManualHackD10(5);
                          } else {
                            handleCheckFloor(floor);
                          }
                        }}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-orbitron font-bold text-xs rounded-l transition-all"
                      >
                        Взлом (Интерфейс)
                      </button>
                      <button
                        onClick={() => {
                          setHackModalFloor(floor);
                          setHackResult(null);
                          setManualHackD10(5);
                        }}
                        title="Ручной ввод броска 1d10"
                        className="p-1.5 bg-zinc-950 hover:bg-zinc-800 border-y border-r border-zinc-700 text-amber-400 rounded-r"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        const blocked = activeArch.floors.some(f => f.floorNumber < floor.floorNumber && f.floorNumber >= currentRunnerFloor &&
                          ((f.type === 'Password' && !f.isUnlocked) || (f.type === 'BlackIce' && !f.blackIce?.isDerezed && !f.isUnlocked)));
                        if (blocked) { alert('Сначала преодолейте пароль или разрешите встречу с ICE на пути.'); return; }
                        setCurrentRunnerFloor(floor.floorNumber);
                      }}
                      className={`px-2.5 py-1.5 text-xs font-tech font-bold rounded border transition-all ${
                        isRunnerHere
                          ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {isRunnerHere ? 'Здесь 📍' : 'Перейти'}
                    </button>
                  </div>
                </div>

                {(floor.type === 'BlackIce' || floor.type === 'Demon') && <button className="text-xs border border-zinc-700 rounded px-2 py-1 mt-2" onClick={() => {
                  if (floor.floorNumber !== currentRunnerFloor) { alert('Сначала перейдите на этаж встречи.'); return; }
                  setArchitectures(prev => prev.map((a, i) => i === activeArchIndex ? { ...a, floors: a.floors.map(f => f.id === floor.id ? { ...f, isUnlocked: true } : f) } : a));
                  addRunnerLog(`ГМ подтвердил разрешение встречи / Slide: этаж ${floor.floorNumber}.`);
                }}>ГМ: встреча / Slide разрешены</button>}
                {/* If Floor has Black ICE: Combat Bar */}
                {floor.blackIce && (
                  <div className="mt-3 pt-2.5 border-t border-zinc-800/80 bg-zinc-950/80 p-2.5 rounded border border-red-950 space-y-2">
                    <div className="flex items-center justify-between text-xs font-tech">
                      <div className="flex items-center gap-2">
                        <Skull className="w-4 h-4 text-red-500" />
                        <strong className="text-red-400">{floor.blackIce.name}</strong>
                        <span className="text-[10px] text-zinc-500">({floor.blackIce.category})</span>
                      </div>
                      <div className="text-zinc-300">
                        REZ (Здоровье программы): <strong className="text-white font-orbitron">{floor.blackIce.rezCurrent} / {floor.blackIce.rezMax}</strong>
                      </div>
                    </div>

                    <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden border border-zinc-800">
                      <div
                        className={`h-full ${floor.blackIce.isDerezed ? 'bg-zinc-700' : 'bg-red-600'}`}
                        style={{ width: `${Math.max(0, (floor.blackIce.rezCurrent / floor.blackIce.rezMax) * 100)}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-tech text-zinc-400 flex-wrap gap-2">
                      <div>СКОР: {floor.blackIce.spd} | АТК: {floor.blackIce.atk} | ЗАЩ: {floor.blackIce.def}</div>
                      
                      <div className="flex items-center gap-1">
                        <span className="text-zinc-500 mr-1">Урон REZ:</span>
                        {[5, 10, 15].map(dmg => (
                          <button
                            key={dmg}
                            onClick={() => handleDamageBlackIce(floor, dmg)}
                            className="px-2 py-0.5 bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 rounded font-bold"
                          >
                            -{dmg}
                          </button>
                        ))}
                        <input
                          type="number"
                          min="1"
                          value={customIceDmg}
                          onChange={(e) => setCustomIceDmg(parseInt(e.target.value) || 1)}
                          className="w-10 bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5 text-center text-white text-xs font-bold ml-1"
                        />
                        <button
                          onClick={() => handleDamageBlackIce(floor, customIceDmg)}
                          className="px-2 py-0.5 bg-red-800 hover:bg-red-700 text-white rounded font-bold text-xs"
                        >
                          -Урон
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-red-300 font-tech">
                      Особый эффект: {floor.blackIce.effect}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Col: Netrunning Log and Reference Rules */}
        <div className="space-y-4">
          
          {/* Netrunning Log */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3.5 space-y-2 shadow-md">
            <h3 className="font-orbitron font-bold text-white text-xs uppercase tracking-wide flex items-center gap-1.5">
              <Network className="w-4 h-4 text-cyan-400" />
              <span>Лог сетевых действий</span>
            </h3>

            <div className="bg-zinc-950 rounded p-2.5 max-h-60 overflow-y-auto space-y-1 text-xs font-tech">
              {runnerLog.length === 0 ? (
                <div className="text-zinc-600 text-center py-2">Сетевых действий пока не зафиксировано</div>
              ) : (
                runnerLog.map((log, i) => (
                  <div key={i} className="text-zinc-300 border-b border-zinc-850 pb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Net Action Reference Guide */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3.5 space-y-2 shadow-md text-xs font-tech">
            <h3 className="font-orbitron font-bold text-amber-400 text-xs uppercase tracking-wide">
              Памятка сетевых действий
            </h3>
            
            <div className="space-y-1.5 text-zinc-300">
              <div>
                <strong className="text-white">Jack In / Jack Out:</strong> Подключение / аварийный выход из сети (1 действие).
              </div>
              <div>
                <strong className="text-white">Pathfinder:</strong> Просканировать архитектуру на глубину (Интерфейс против DV).
              </div>
              <div>
                <strong className="text-white">Backdoor:</strong> Взломать пароль шлюза или файл (Интерфейс против DV этажа).
              </div>
              <div>
                <strong className="text-white">Control:</strong> Перехватить управление турелями, камерами или лифтом (Интерфейс против DV узла).
              </div>
              <div>
                <strong className="text-white">Eye-Dee:</strong> Изучить файл или узнать статы Чёрного Льда.
              </div>
              <div>
                <strong className="text-white">Slide:</strong> Сбежать от Чёрного Льда на другой этаж.
              </div>
              <div>
                <strong className="text-white">Virus:</strong> Заложить вирус в систему (требует контроль над узлом).
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual / Auto Hack Check Modal */}
      {hackModalFloor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-cyan-600/70 rounded-lg max-w-md w-full max-h-[90dvh] overflow-y-auto p-3.5 sm:p-5 space-y-4 clip-cyber shadow-[0_0_30px_rgba(6,182,212,0.25)] text-xs font-tech">
            <div className="flex items-center justify-between border-b border-cyan-900/60 pb-3">
              <div className="flex items-center gap-2">
                <Network className="w-5 h-5 text-cyan-400" />
                <h3 className="font-orbitron font-bold text-white text-base">ВЗЛОМ УЗЛА СЕТИ</h3>
              </div>
              <button
                onClick={() => setHackModalFloor(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-zinc-950 p-3 rounded border border-zinc-800 space-y-1">
              <div className="text-white font-bold text-sm">
                Этаж {hackModalFloor.floorNumber}: {hackModalFloor.name}
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span>Интерфейс нетраннера: <strong className="text-cyan-400">{netrunnerInterface}</strong></span>
                <span>Сложность (DV): <strong className="text-white font-orbitron text-sm">DV {hackModalFloor.dv}</strong></span>
              </div>
              <div className="text-[11px] text-zinc-500">
                Действий осталось: <strong className="text-white">{netActionsLeft} / {netActionsMax}</strong>
              </div>
            </div>

            {/* Mode switch */}
            <div className="flex items-center justify-between bg-zinc-950 p-2 rounded border border-zinc-800">
              <span className="text-zinc-400 font-bold uppercase text-[11px]">Режим проверки:</span>
              <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setHackInputMode('auto')}
                  className={`px-2.5 py-1 rounded flex items-center gap-1 transition-colors ${
                    hackInputMode === 'auto' ? 'bg-cyan-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Dices className="w-3.5 h-3.5" />
                  Автобросок
                </button>
                <button
                  type="button"
                  onClick={() => setHackInputMode('manual')}
                  className={`px-2.5 py-1 rounded flex items-center gap-1 transition-colors ${
                    hackInputMode === 'manual' ? 'bg-cyan-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Ручной кубик 1d10
                </button>
              </div>
            </div>

            {/* Manual input */}
            {hackInputMode === 'manual' && (
              <div className="p-3 bg-zinc-950 rounded border border-cyan-500/50 space-y-2 animate-in fade-in">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-300">Кубик 1d10 (1–10):</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={manualHackD10}
                      onChange={(e) => setManualHackD10(parseInt(e.target.value) || 1)}
                      className="w-16 bg-zinc-900 border border-cyan-500 rounded px-2.5 py-1 text-center font-bold text-cyan-300 text-sm"
                    />
                  </div>

                  {manualHackD10 === 10 && (
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <span>Взрыв (+10):</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={manualHackExploded}
                        onChange={(e) => setManualHackExploded(parseInt(e.target.value) || 1)}
                        className="w-12 bg-zinc-900 border border-emerald-500 rounded px-1.5 py-0.5 text-center font-bold text-emerald-300"
                      />
                    </div>
                  )}

                  {manualHackD10 === 1 && (
                    <div className="flex items-center gap-1.5 text-red-400">
                      <span>Провал (-1):</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={manualHackBotch}
                        onChange={(e) => setManualHackBotch(parseInt(e.target.value) || 1)}
                        className="w-12 bg-zinc-900 border border-red-500 rounded px-1.5 py-0.5 text-center font-bold text-red-300"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                const manualInput = hackInputMode === 'manual' ? {
                  firstDie: manualHackD10,
                  explodedDie: manualHackD10 === 10 ? manualHackExploded : undefined,
                  botchDie: manualHackD10 === 1 ? manualHackBotch : undefined
                } : undefined;
                const res = handleCheckFloor(hackModalFloor, manualInput);
                setHackResult(res);
              }}
              className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-orbitron font-bold text-xs rounded transition-all clip-cyber-btn shadow-md uppercase tracking-wider"
            >
              {hackInputMode === 'manual' ? 'Применить ручной бросок взлома' : 'Выполнить взлом (автобросок)'}
            </button>

            {hackResult && (
              <div className={`p-3 rounded border text-xs font-tech ${
                hackResult.isSuccess ? 'bg-emerald-950/60 border-emerald-600 text-emerald-200' : 'bg-red-950/60 border-red-600 text-red-200'
              }`}>
                <div className="font-orbitron font-bold text-sm mb-1">
                  {hackResult.isSuccess ? 'УСПЕШНЫЙ ВЗЛОМ УЗЛА!' : 'ПРОВАЛ ВЗЛОМА!'}
                </div>
                <div>{hackResult.textSummary}</div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-zinc-800">
              <button
                onClick={() => setHackModalFloor(null)}
                className="px-4 py-1.5 text-zinc-400 hover:text-white rounded"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
