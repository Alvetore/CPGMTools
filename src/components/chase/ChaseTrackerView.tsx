import React, { useState, useEffect } from 'react';
import { 
  Car, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  Gauge, 
  FastForward, 
  Zap,
  HelpCircle,
  Dices,
  Edit3,
  X
} from 'lucide-react';
import { 
  ChaseVehicle, 
  CombatSpeed, 
  HOT_PURSUIT_RANGE_BANDS, 
  SPEED_POSITIONING_DVS, 
  HOT_PURSUIT_MANEUVERS 
} from '../../types/chase';
import { executeCPRCheck, rollD10 } from '../../utils/dice';
import { sfx } from '../../utils/audio';
import { loadStoredData, saveStoredData, STORAGE_KEYS } from '../../utils/storage';
import { getEffectiveSpeed, positionVehicle, finishChaseRound, markEscapes } from '../../utils/chase';

export const ChaseTrackerView: React.FC = () => {
  const [chaseRound, setChaseRound] = useState<number>(() => loadStoredData(STORAGE_KEYS.CHASE, { round: 1 }).round);
  const [chaseLog, setChaseLog] = useState<string[]>(() => loadStoredData(STORAGE_KEYS.CHASE, { log: [] as string[] }).log);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState<boolean>(false);
  const [isRoundPositioningModalOpen, setIsRoundPositioningModalOpen] = useState<boolean>(false);
  const [positioningDraft, setPositioningDraft] = useState<{ [id: string]: number }>({});

  // Maneuver execution modal state
  const [activeManeuverModal, setActiveManeuverModal] = useState<{
    vehicle: ChaseVehicle;
    maneuverId: string;
    title: string;
    dv: number;
  } | null>(null);
  const [maneuverMode, setManeuverMode] = useState<'auto' | 'manual'>('auto');
  const [maneuverManualD10, setManeuverManualD10] = useState<number>(5);
  const [maneuverResult, setManeuverResult] = useState<any | null>(null);

  // Initial sample vehicles
  const [vehicles, setVehicles] = useState<ChaseVehicle[]>(() => loadStoredData(STORAGE_KEYS.CHASE, { vehicles: [
    {
      id: 'v-lead-1', side: 'evader',
      name: 'Грузовик беглецов (Armored Van)',
      vehicleType: 'Truck',
      driverName: 'Вор-наёмник',
      driverBase: 12,
      sdpCurrent: 60,
      sdpMax: 60,
      armorSp: 11,
      speedCombat: 20,
      gridSquare: 3, // Starts 2-3 squares ahead
      hasNos: false,
      isPitSuffering: false,
      isPulledClose: false,
      isEscaped: false,
      isWrecked: false,
      notes: 'Перевозит украденную партию имплантов'
    },
    {
      id: 'v-team-1', side: 'pursuer',
      name: 'Машина партии (Quadra Turbo-R)',
      vehicleType: 'Car',
      driverName: 'Водитель команды',
      driverBase: 14,
      sdpCurrent: 50,
      sdpMax: 50,
      armorSp: 11,
      speedCombat: 20,
      gridSquare: 1, // Starts at 0-6m base
      hasNos: true,
      isPitSuffering: false,
      isPulledClose: false,
      isEscaped: false,
      isWrecked: false,
      notes: 'Оснащена системой закиси азота (NOS)'
    }
  ] as ChaseVehicle[] }).vehicles);

  useEffect(() => { saveStoredData(STORAGE_KEYS.CHASE, { round: chaseRound, log: chaseLog, vehicles }); }, [chaseRound, chaseLog, vehicles]);
  const [maneuverTargetId, setManeuverTargetId] = useState('');
  const [newVehSide, setNewVehSide] = useState<'pursuer' | 'evader'>('pursuer');

  // Quick Add Vehicle Form Modal
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState<boolean>(false);
  const [newVehName, setNewVehName] = useState<string>('');
  const [newVehDriver, setNewVehDriver] = useState<string>('');
  const [newVehDriverBase, setNewVehDriverBase] = useState<number>(12);
  const [newVehSdp, setNewVehSdp] = useState<number>(50);
  const [newVehSp, setNewVehSp] = useState<number>(11);
  const [newVehSpeed, setNewVehSpeed] = useState<CombatSpeed>(20);
  const [newVehSquare, setNewVehSquare] = useState<number>(1);
  const [newVehNos, setNewVehNos] = useState<boolean>(false);

  const addLog = (msg: string) => {
    setChaseLog(prev => [msg, ...prev.slice(0, 39)]);
  };

  const handleRollPositioningForVehicle = (snapshot: ChaseVehicle, manualD10?: number) => {
    const v = vehicles.find(v => v.id === snapshot.id);
    if (!v) return;
    const result = positionVehicle(v, manualD10 === undefined ? undefined : { firstDie: manualD10 });
    setVehicles(prev => prev.map(vehicle => vehicle.id === v.id ? result.vehicle : vehicle));
    if (result.check) addLog(v.name + ': позиционирование ' + result.check.textSummary);
    return result.check;
  };

  const finishRound = (manual: Record<string, { firstDie: number }> = {}) => {
    const result = finishChaseRound(vehicles, manual);
    setVehicles(result.vehicles);
    result.outcomes.forEach(({ vehicle, check }) => {
      if (check) addLog(vehicle.name + ': ' + check.textSummary);
    });
    setChaseRound(r => r + 1);
    addLog('Конец раунда ' + chaseRound + '. Временные эффекты PIT и Pull in Close сняты.');
  };
  const handleRollAllPositioning = () => finishRound();
  const handleUpdateVehicle = (id: string, updates: Partial<ChaseVehicle>) => {
    setVehicles(prev => markEscapes(prev.map(v => v.id === id ? { ...v, ...updates } : v)));
  };
  const handleDamageSdp = (id: string, amount: number) => {
    const v = vehicles.find(x => x.id === id);
    if (!v) return;
    const sdpCurrent = Math.min(v.sdpMax, Math.max(0, v.sdpCurrent - amount));
    handleUpdateVehicle(id, { sdpCurrent, isWrecked: sdpCurrent === 0 });
    addLog(v.name + ': SDP ' + sdpCurrent + '/' + v.sdpMax);
  };

  const handleExecuteManeuver = (snapshot: ChaseVehicle, mId: string, manualD10?: number) => {
    const v = vehicles.find(x => x.id === snapshot.id);
    if (!v || v.isWrecked || v.isEscaped || v.needsControlResolution) return;
    if (v.hasActed) { alert('Стандартное действие водителя уже потрачено в этом раунде.'); return; }
    if (v.driverBase < 9) { alert('При базе управления ниже 9 стандартное действие уходит на управление.'); return; }
    if (mId === 'm-nos' && !v.hasNos) { alert('На этом ТС нет NOS.'); return; }
    const targetCandidates = vehicles.filter(x => x.id !== v.id && !x.isWrecked && !x.isEscaped && (
      mId === 'm-ram' ? x.gridSquare === v.gridSquare : Math.abs(x.gridSquare - v.gridSquare) === 1
    ));
    const target = maneuverTargetId ? targetCandidates.find(x => x.id === maneuverTargetId) : targetCandidates.length === 1 ? targetCandidates[0] : undefined;
    if (['m-pit','m-overtake'].includes(mId) && !target) { alert('Выберите цель на соседней клетке.'); return; }
    if (mId === 'm-ram' && !target) { alert('Выберите цель на той же клетке.'); return; }
    const dv = mId === 'm-pit' ? 15 : ['m-overtake','m-ram'].includes(mId) ? 17 : 13;
    const check = executeCPRCheck(v.driverBase, 0, 0, dv, manualD10 === undefined ? undefined : { firstDie: manualD10 });
    let updated = vehicles.map(x => x.id === v.id ? { ...x, hasActed: true } : x);
    const update = (id: string, patch: Partial<ChaseVehicle>) => { updated = updated.map(x => x.id === id ? { ...x, ...patch } : x); };
    if (mId === 'm-nos') update(v.id, { gridSquare: v.gridSquare + 1, needsControlResolution: !check.isSuccess });
    if (mId === 'm-pit' && check.isSuccess) update(target!.id, { isPitSuffering: true });
    if (mId === 'm-overtake') {
      if (check.isSuccess) update(v.id, { gridSquare: target!.gridSquare + 1 });
      else update(v.id, { needsControlResolution: true });
    }
    if (mId === 'm-pull-close' && check.isSuccess) update(v.id, { isPulledClose: true });
    setVehicles(markEscapes(updated));
    addLog(v.name + ': ' + mId + ' — ' + check.textSummary);
    if (mId === 'm-ram' && check.isSuccess) addLog('Таран: ГМ применяет урон столкновения к обоим ТС и пассажирам по core p.192.');
    if (!check.isSuccess && ['m-nos','m-overtake'].includes(mId)) addLog(v.name + ': потеря управления; дальнейшие действия заблокированы до решения ГМа на карточке ТС.');
    return check;
  };

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehName.trim()) return;

    const newV: ChaseVehicle = {
      id: `veh-${Date.now()}`,
      name: newVehName.trim(),
      vehicleType: 'Car',
      driverName: newVehDriver.trim() || 'Водитель',
      driverBase: newVehDriverBase,
      sdpCurrent: newVehSdp,
      sdpMax: newVehSdp,
      armorSp: newVehSp,
      speedCombat: newVehSpeed,
      gridSquare: newVehSquare,
      hasNos: newVehNos,
      side: newVehSide,
      isPitSuffering: false,
      isPulledClose: false,
      isEscaped: false,
      isWrecked: false
    };

    setVehicles(prev => [...prev, newV]);
    setIsAddVehicleOpen(false);
    setNewVehName('');
    sfx.playClick();
    addLog(`В погоню добавлено новое ТС: ${newV.name} (Клетка ${newV.gridSquare}, СКО ${newV.speedCombat}).`);
  };

  const activeSquares = vehicles.filter(v => !v.isEscaped && !v.isWrecked).map(v => v.gridSquare);
  const firstSquare = Math.min(...activeSquares, Infinity);
  const trackSquares = [...new Set([...Array.from({ length: 8 }, (_, i) => firstSquare + i), ...activeSquares])]
    .filter(Number.isFinite).sort((a, b) => a - b);

  return (
    <div className="space-y-4">
      
      {/* Top Banner & Control Bar */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-amber-400" />
            <h2 className="font-orbitron font-bold text-white text-base">
              ПОГОНИ CYBERPUNK RED (DLC HOT PURSUIT)
            </h2>
            <span className="text-xs font-tech px-2 py-0.5 rounded bg-amber-950 border border-amber-600 text-amber-300 font-bold">
              РАУНД {chaseRound}
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-tech mt-0.5">
            Сетка дистанций, проверка позиционирования по боевой скорости и манёвры (PIT, NOS, таран) из официального DLC Hot Pursuit
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none touch-pan-x pb-1 -mx-1 px-1">
          <button
            onClick={handleRollAllPositioning}
            className="flex items-center gap-2 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-black font-orbitron font-bold text-xs rounded transition-all clip-cyber-btn shadow-md whitespace-nowrap flex-shrink-0"
          >
            <FastForward className="w-4 h-4 fill-current" />
            <span>ИТОГ РАУНДА (АВТО)</span>
          </button>

          <button
            onClick={() => {
              const draft: { [id: string]: number } = {};
              vehicles.forEach(v => {
                if (!v.isWrecked && !v.isEscaped) {
                  draft[v.id] = 5;
                }
              });
              setPositioningDraft(draft);
              setIsRoundPositioningModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-950/60 border border-amber-600/70 hover:bg-amber-900/60 text-amber-300 font-orbitron font-bold text-xs rounded transition-all whitespace-nowrap flex-shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>✍️ РУЧНОЙ ВВОД РАУНДА</span>
          </button>

          <button
            onClick={() => setIsAddVehicleOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-500 text-white font-orbitron font-bold text-xs rounded clip-cyber-sm transition-all whitespace-nowrap flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>ДОБАВИТЬ ТС</span>
          </button>

          <button
            onClick={() => setIsRulesModalOpen(true)}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 transition-colors flex-shrink-0"
            title="Справка по правилам Hot Pursuit"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Visual Chase Grid (1 to 8 squares) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 sm:p-4 space-y-3 shadow-lg">
        <div className="flex items-center justify-between text-xs font-tech">
          <span className="text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-amber-400" />
            <span>Сетка погони (Дистанции между участниками)</span>
          </span>
          <span className="text-zinc-500 hidden sm:inline">
            Побег: расстояние до всех преследователей больше 8 клеток
          </span>
        </div>

        {/* The 8 Track Bands */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {trackSquares.map(square => {
            const offset = square - firstSquare + 1;
            const bandInfo = HOT_PURSUIT_RANGE_BANDS.find(b => b.square === offset);
            return {
              square,
              range: bandInfo ? bandInfo.range : (offset > 8 ? '> 800 м' : ''),
              description: bandInfo ? bandInfo.description : 'Координата погони'
            };
          }).map((band) => {
            const vehiclesHere = vehicles.filter(v => v.gridSquare === band.square && !v.isWrecked && !v.isEscaped);

            return (
              <div
                key={band.square}
                className={`p-2 sm:p-2.5 rounded border flex flex-col justify-between min-h-[90px] sm:min-h-[120px] transition-all ${
                  vehiclesHere.length > 0
                    ? 'bg-zinc-950 border-amber-500/80 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                    : 'bg-zinc-950/60 border-zinc-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-1">
                    <span className="font-orbitron font-black text-amber-400 text-xs">#{band.square}</span>
                    <span className="font-tech font-bold text-cyan-400 text-[11px]">{band.range}</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 font-tech mt-1">{band.description}</div>
                </div>

                {/* Vehicles placed on this square */}
                <div className="space-y-1.5 mt-2">
                  {vehiclesHere.map(v => (
                    <div
                      key={v.id}
                      className="p-1.5 rounded bg-zinc-900 border border-zinc-700 text-xs font-tech space-y-0.5"
                    >
                      <strong className="text-white block font-orbitron text-[11px] truncate">{v.name}</strong>
                      <div className="text-[10px] text-zinc-400 flex items-center justify-between">
                        <span>СКО: <strong className="text-cyan-400">{v.speedCombat}</strong></span>
                        <span>ПСП: <strong className="text-emerald-400">{v.sdpCurrent}/{v.sdpMax}</strong></span>
                      </div>
                      {v.isPitSuffering && (
                        <span className="text-[9px] text-red-400 font-bold block">⚠️ PIT штраф</span>
                      )}
                      {v.isPulledClose && (
                        <span className="text-[9px] text-cyan-400 font-bold block">📍 Вплотную</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vehicle Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vehicles.map((v) => {
          const { effectiveSpeed, isHalved } = getEffectiveSpeed(v);
          const positioningDv = effectiveSpeed !== 'crashed' ? SPEED_POSITIONING_DVS[effectiveSpeed] : '—';

          return (
            <div
              key={v.id}
              className={`bg-zinc-900 border rounded-lg p-4 space-y-3 shadow-md clip-cyber-sm transition-all ${
                v.isWrecked
                  ? 'border-zinc-800 opacity-60 bg-zinc-950'
                  : v.isEscaped
                  ? 'border-emerald-600 bg-emerald-950/20'
                  : 'border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-orbitron font-bold text-white text-base">{v.name}</h3>
                    {v.isEscaped && (
                      <span className="px-1.5 py-0.2 bg-emerald-950 border border-emerald-600 text-emerald-400 font-tech font-bold text-[10px] rounded uppercase">
                        СБЕЖАЛ (ПОБЕДА)
                      </span>
                    )}
                    {v.isWrecked && (
                      <span className="px-1.5 py-0.2 bg-red-950 border border-red-600 text-red-400 font-tech font-bold text-[10px] rounded uppercase">
                        РАЗБИТ / ВЫВЕДЕН
                      </span>
                    )}
                    {v.isPulledClose && (
                      <span className="px-1.5 py-0.2 bg-cyan-950 border border-cyan-600 text-cyan-300 font-tech font-bold text-[10px] rounded uppercase">
                        Вплотную (Ближний бой)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-400 font-tech mt-0.5">
                    Водитель: <strong className="text-amber-400">{v.driverName}</strong> (База управления: {v.driverBase})
                  </div>
                </div>

                <button
                  onClick={() => setVehicles(prev => prev.filter(x => x.id !== v.id))}
                  title="Удалить ТС"
                  className="text-zinc-600 hover:text-red-400 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <label className="text-xs text-zinc-400">Сторона: <select value={v.side ?? 'pursuer'} onChange={e => handleUpdateVehicle(v.id, { side: e.target.value as 'pursuer' | 'evader' })} className="bg-zinc-950 border rounded">
                <option value="pursuer">Преследователь</option><option value="evader">Уходящий</option>
              </select></label>
              {v.needsControlResolution && <div role="alert" className="text-xs text-red-300 border border-red-700 p-2 rounded">Потеря управления. ГМ разрешает последствия по core p.192:
                <button className="block border px-2 py-1 mt-1" onClick={() => { handleUpdateVehicle(v.id, { needsControlResolution: false, gridSquare: v.gridSquare - 1 }); addLog(v.name + ': ГМ разрешил потерю управления, ТС отстало.'); }}>ГМ: продолжить после разрешения, −1 клетка</button>
                <button className="block border px-2 py-1 mt-1" onClick={() => { handleUpdateVehicle(v.id, { needsControlResolution: false, isWrecked: true }); addLog(v.name + ': ГМ подтвердил аварию; урон применяется вручную.'); }}>ГМ: авария, вывести из погони</button>
              </div>}
              <p className="text-xs text-zinc-500">{v.hasActed ? 'Стандартное действие потрачено' : 'Стандартное действие доступно'}; {v.positioned ? 'позиционирование выполнено' : 'позиционирование в конце раунда'}</p>
              {/* Vehicle Stats Bar */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs font-tech bg-zinc-950 p-2 rounded border border-zinc-800">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Клетка сетки</span>
                  <strong className="font-orbitron text-amber-400 text-sm">#{v.gridSquare}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Боевая СКО</span>
                  <strong className="font-orbitron text-cyan-400 text-sm">{v.speedCombat}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">СЛ Позиционир.</span>
                  <strong className="font-orbitron text-white text-sm">DV {positioningDv}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Броня ОС</span>
                  <strong className="font-orbitron text-cyan-300 text-sm">{v.armorSp}</strong>
                </div>
              </div>

              {/* SDP Health Bar */}
              <div className="space-y-1 text-xs font-tech">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Прочность ТС (ПСП / SDP):</span>
                  <strong className="text-white">{v.sdpCurrent} / {v.sdpMax}</strong>
                </div>

                <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
                  <div
                    className={`h-full ${
                      v.sdpCurrent <= v.sdpMax / 2 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(0, (v.sdpCurrent / v.sdpMax) * 100)}%` }}
                  ></div>
                </div>

                {isHalved && (
                  <div className="text-[11px] text-amber-400 font-tech flex items-center gap-1 pt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>ПСП &lt; 50%: скорость снижена на категорию (СЛ {positioningDv})!</span>
                  </div>
                )}

                {/* Quick SDP damage buttons */}
                <div className="flex items-center gap-1 pt-1">
                  <span className="text-[10px] text-zinc-500 uppercase mr-1">Урон ПСП:</span>
                  {[-20, -10, -5, +10].map(delta => (
                    <button
                      key={delta}
                      onClick={() => handleDamageSdp(v.id, -delta)}
                      className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 hover:border-red-600 text-zinc-300 rounded font-tech text-[11px]"
                    >
                      {delta > 0 ? `+${delta}` : delta}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid Square Quick Move */}
              <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80 text-xs font-tech">
                <span className="text-zinc-500">Положение на сетке:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleUpdateVehicle(v.id, { gridSquare: v.gridSquare - 1 })}
                    className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 rounded font-bold"
                  >
                    -1 назад
                  </button>
                  <span className="font-orbitron font-bold text-amber-400 px-1">#{v.gridSquare}</span>
                  <button
                    onClick={() => {
                      const next = v.gridSquare + 1;
                      setVehicles(prev => markEscapes(prev.map(x => x.id === v.id ? { ...x, gridSquare: next } : x)));
                    }}
                    className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 hover:bg-zinc-800 rounded font-bold"
                  >
                    +1 вперед
                  </button>
                </div>
              </div>

              {/* Maneuvers Action Buttons */}
              <div className="space-y-1.5 pt-1 border-t border-zinc-800/80">
                <span className="text-[10px] text-zinc-500 uppercase font-tech block">Манёвры и проверки (Hot Pursuit):</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => {
                      const { effectiveSpeed } = getEffectiveSpeed(v);
                      if (effectiveSpeed === 'crashed') {
                        handleRollPositioningForVehicle(v);
                        return;
                      }
                      setActiveManeuverModal({
                        vehicle: v,
                        maneuverId: 'positioning',
                        title: `Позиционирование (${effectiveSpeed} СКО)`,
                        dv: SPEED_POSITIONING_DVS[effectiveSpeed]
                      });
                      setManeuverResult(null);
                      setManeuverMode('auto');
                      setManeuverManualD10(5);
                    }}
                    className="px-2 py-1 bg-amber-950/70 border border-amber-500 hover:bg-amber-900 text-amber-300 rounded text-xs font-tech font-bold"
                  >
                    🎲 Позиция
                  </button>
                  <button
                    onClick={() => {
                      setActiveManeuverModal({
                        vehicle: v,
                        maneuverId: 'm-nos',
                        title: '⚡ Нитро NOS (СЛ 13)',
                        dv: 13
                      });
                      setManeuverResult(null);
                      setManeuverMode('auto');
                      setManeuverManualD10(5);
                    }}
                    className="px-2 py-1 bg-amber-950/60 border border-amber-600/70 hover:bg-amber-900/60 text-amber-300 rounded text-xs font-tech font-bold"
                  >
                    ⚡ NOS (13)
                  </button>
                  <button
                    onClick={() => {
                      setActiveManeuverModal({
                        vehicle: v,
                        maneuverId: 'm-pit',
                        title: '🚓 Манёвр PIT (СЛ 15)',
                        dv: 15
                      });
                      setManeuverResult(null);
                      setManeuverMode('auto');
                      setManeuverManualD10(5);
                    }}
                    className="px-2 py-1 bg-blue-950/60 border border-blue-600/70 hover:bg-blue-900/60 text-blue-300 rounded text-xs font-tech font-bold"
                  >
                    🚓 PIT (15)
                  </button>
                  <button
                    onClick={() => {
                      setActiveManeuverModal({
                        vehicle: v,
                        maneuverId: 'm-overtake',
                        title: '🏎️ Опережение (СЛ 17)',
                        dv: 17
                      });
                      setManeuverResult(null);
                      setManeuverMode('auto');
                      setManeuverManualD10(5);
                    }}
                    className="px-2 py-1 bg-red-950/60 border border-red-600/70 hover:bg-red-900/60 text-red-300 rounded text-xs font-tech font-bold"
                  >
                    🏎️ Обгон (17)
                  </button>
                  <button
                    onClick={() => {
                      setActiveManeuverModal({
                        vehicle: v,
                        maneuverId: 'm-ram',
                        title: '💥 Таран на скорости (СЛ 17)',
                        dv: 17
                      });
                      setManeuverResult(null);
                      setManeuverMode('auto');
                      setManeuverManualD10(5);
                    }}
                    className="px-2 py-1 bg-purple-950/60 border border-purple-600/70 hover:bg-purple-900/60 text-purple-300 rounded text-xs font-tech font-bold"
                  >
                    💥 Таран (17)
                  </button>
                  <button
                    onClick={() => { setActiveManeuverModal({ vehicle: v, maneuverId: 'm-pull-close', title: 'Pull in Close (DV13)', dv: 13 }); setManeuverResult(null); }}
                    className="px-2 py-1 bg-zinc-950 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 rounded text-xs font-tech"
                  >
                    🎯 Подтянуться
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chase Log */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3.5 space-y-2 shadow-md">
        <h3 className="font-orbitron font-bold text-white text-xs uppercase tracking-wide">
          Журнал погони
        </h3>
        <div className="bg-zinc-950 rounded p-2.5 max-h-48 overflow-y-auto space-y-1 text-xs font-tech">
          {chaseLog.length === 0 ? (
            <div className="text-zinc-600 text-center py-2">Событий погони пока нет. Нажмите «Итог раунда» или выберите манёвр.</div>
          ) : (
            chaseLog.map((log, idx) => (
              <div key={idx} className="text-zinc-300 border-b border-zinc-800 pb-0.5">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Vehicle Modal */}
      {isAddVehicleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form onSubmit={handleAddVehicle} className="bg-zinc-900 border border-amber-600/70 rounded-lg max-w-md w-full max-h-[90dvh] overflow-y-auto p-3.5 sm:p-5 space-y-4 clip-cyber shadow-2xl">
            <h3 className="font-orbitron font-bold text-white text-base">ДОБАВИТЬ ТРАНСПОРТ В ПОГОНЮ</h3>
            <label className="block text-xs">Сторона <select value={newVehSide} onChange={e => setNewVehSide(e.target.value as 'pursuer' | 'evader')} className="bg-zinc-950 border rounded"><option value="pursuer">Преследователь</option><option value="evader">Уходящий</option></select></label>

            <div>
              <label className="text-xs font-tech text-zinc-400 block mb-1">Название ТС / Модель</label>
              <input
                type="text"
                required
                value={newVehName}
                onChange={(e) => setNewVehName(e.target.value)}
                placeholder="например, Патрульная машина NCPD"
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-white font-medium outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-tech text-zinc-400 block mb-1">Имя водителя</label>
                <input
                  type="text"
                  value={newVehDriver}
                  onChange={(e) => setNewVehDriver(e.target.value)}
                  placeholder="Офицер Смит"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-tech text-zinc-400 block mb-1">База вождения (РЕФ + Навык)</label>
                <input
                  type="number"
                  value={newVehDriverBase}
                  onChange={(e) => setNewVehDriverBase(parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-tech text-zinc-400 block mb-1">ПСП (SDP)</label>
                <input
                  type="number"
                  value={newVehSdp}
                  onChange={(e) => setNewVehSdp(parseInt(e.target.value) || 10)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-tech text-zinc-400 block mb-1">Броня ОС</label>
                <input
                  type="number"
                  value={newVehSp}
                  onChange={(e) => setNewVehSp(parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-tech text-zinc-400 block mb-1">Боевая СКО</label>
                <select
                  value={newVehSpeed}
                  onChange={(e) => setNewVehSpeed(parseInt(e.target.value) as any)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-white outline-none font-orbitron"
                >
                  <option value={60}>60 СКО (СЛ 13)</option>
                  <option value={40}>40 СКО (СЛ 15)</option>
                  <option value={20}>20 СКО (СЛ 17)</option>
                  <option value={15}>15 СКО (СЛ 21)</option>
                  <option value={10}>10 СКО (СЛ 24)</option>
                  <option value={8}>8 СКО (СЛ 29)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-tech text-zinc-400 block mb-1">Клетка старта</label>
                <input
                  type="number"
                  value={newVehSquare}
                  onChange={(e) => setNewVehSquare(parseInt(e.target.value) || 1)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-white outline-none"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-tech text-zinc-300">
                  <input
                    type="checkbox"
                    checked={newVehNos}
                    onChange={(e) => setNewVehNos(e.target.checked)}
                    className="accent-amber-500"
                  />
                  <span>Есть система NOS</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddVehicleOpen(false)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white rounded"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-orbitron font-bold text-xs rounded clip-cyber-sm"
              >
                Добавить ТС
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rules Reference Modal */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg max-w-xl w-full p-3.5 sm:p-5 space-y-4 max-h-[90dvh] overflow-y-auto clip-cyber shadow-2xl text-xs font-tech">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="font-orbitron font-bold text-white text-base flex items-center gap-2">
                <Car className="w-5 h-5 text-amber-400" />
                <span>ПРАВИЛА ПОГОНЬ (HOT PURSUIT)</span>
              </h3>
              <button onClick={() => setIsRulesModalOpen(false)} className="text-zinc-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-zinc-300">
              <p>
                <strong>Сетка погони:</strong> координаты не ограничены восемью клетками. Расстояние между ТС в клетках задаёт полосу дальности. Уходящий скрывается, когда расстояние до каждого действующего преследователя превышает 8 клеток. Соседство для PIT и Pull Ahead — разница координат 1.
              </p>

              <div>
                <strong className="text-amber-400 block mb-1">Проверка позиционирования в конце раунда:</strong>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>60 СКО ➔ СЛ 13</li>
                  <li>40 СКО ➔ СЛ 15</li>
                  <li>20 СКО ➔ СЛ 17</li>
                  <li>15 СКО ➔ СЛ 21</li>
                  <li>10 СКО ➔ СЛ 24</li>
                  <li>8 СКО ➔ СЛ 29</li>
                </ul>
              </div>

              <div className="p-2.5 bg-amber-950/40 border border-amber-700/60 rounded text-amber-200">
                <strong>Правило критического повреждения ПСП:</strong> если текущие пункты структурной прочности (ПСП) меньше половины максимума, проверка позиционирования выполняется так, словно боевая скорость ТС на категорию ниже! Если скорость падает ниже 8 СКО — ТС теряет управление и разбивается!
              </div>

              <div>
                <strong className="text-white block mb-1">Манёвры (Hot Pursuit):</strong>
                <div className="space-y-1">
                  {HOT_PURSUIT_MANEUVERS.map(m => (
                    <div key={m.id} className="bg-zinc-950 p-2 rounded border border-zinc-800">
                      <strong className="text-cyan-300">{m.nameRu} (СЛ {m.dv})</strong>
                      <div className="text-zinc-400 mt-0.5">{m.descriptionRu}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Round Positioning Check Modal (Auto/Manual) */}
      {isRoundPositioningModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-amber-600/70 rounded-lg max-w-lg w-full max-h-[90dvh] overflow-y-auto p-3.5 sm:p-5 space-y-4 clip-cyber shadow-[0_0_30px_rgba(245,158,11,0.25)] text-xs font-tech">
            <div className="flex items-center justify-between border-b border-amber-900/60 pb-3">
              <div className="flex items-center gap-2">
                <FastForward className="w-5 h-5 text-amber-400" />
                <h3 className="font-orbitron font-bold text-white text-base">ИТОГ РАУНДА {chaseRound}: ПОЗИЦИОНИРОВАНИЕ</h3>
              </div>
              <button
                onClick={() => setIsRoundPositioningModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-zinc-400">
              В конце каждого раунда погони каждый водитель проходит проверку навыка управления ТС против СЛ своей боевой скорости. Введите выпавший на столе 1d10 или бросьте автоматически.
            </p>

            <button
              type="button"
              onClick={() => {
                const draft: { [id: string]: number } = {};
                vehicles.forEach(v => {
                  if (!v.isWrecked && !v.isEscaped) {
                    draft[v.id] = rollD10();
                  }
                });
                setPositioningDraft(draft);
              }}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-bold rounded border border-zinc-700 flex items-center gap-1.5"
            >
              <Dices className="w-3.5 h-3.5" />
              Бросить случайные 1d10 для всех ТС
            </button>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {vehicles.filter(v => !v.isWrecked && !v.isEscaped).map(v => {
                const { effectiveSpeed } = getEffectiveSpeed(v);
                const dv = effectiveSpeed !== 'crashed' ? SPEED_POSITIONING_DVS[effectiveSpeed] : 99;
                const rolled = positioningDraft[v.id] ?? 5;
                const total = v.driverBase + rolled;
                const isPass = total > dv;

                return (
                  <div key={v.id} className="bg-zinc-950 p-2.5 rounded border border-zinc-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <strong className="text-white">{v.name}</strong>
                        <span className="text-zinc-400 ml-1.5">({v.driverName}, База {v.driverBase})</span>
                      </div>
                      <span className="font-orbitron font-bold text-amber-400">
                        {effectiveSpeed} СКО ➔ СЛ {dv}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400 text-[11px]">1d10:</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={rolled}
                          onChange={(e) => {
                            const val = Math.min(10, Math.max(1, parseInt(e.target.value) || 1));
                            setPositioningDraft(prev => ({ ...prev, [v.id]: val }));
                          }}
                          className="w-12 bg-zinc-900 border border-amber-500 rounded px-1.5 py-0.5 text-center font-bold text-amber-300"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setPositioningDraft(prev => ({ ...prev, [v.id]: rollD10() }));
                          }}
                          className="text-zinc-400 hover:text-white p-1"
                          title="Бросить 1d10"
                        >
                          🎲
                        </button>
                      </div>

                      <div className="font-orbitron font-bold text-xs">
                        {total} vs СЛ {dv} ➔{' '}
                        <span className={isPass ? 'text-emerald-400' : 'text-red-400'}>
                          {isPass ? 'УСПЕХ (+1 клетка)' : 'ПРОВАЛ (на месте)'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsRoundPositioningModalOpen(false)}
                className="px-3 py-1.5 text-zinc-400 hover:text-white rounded"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  finishRound(Object.fromEntries(Object.entries(positioningDraft).map(([id, firstDie]) => [id, { firstDie }])));
                  setIsRoundPositioningModalOpen(false);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-orbitron font-bold text-xs rounded clip-cyber-sm"
              >
                Применить итоги раунда
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Maneuver Execution Modal (Auto / Manual) */}
      {activeManeuverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-cyan-600/70 rounded-lg max-w-md w-full max-h-[90dvh] overflow-y-auto p-3.5 sm:p-5 space-y-4 clip-cyber shadow-[0_0_30px_rgba(6,182,212,0.25)] text-xs font-tech">
            <div className="flex items-center justify-between border-b border-cyan-900/60 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                <h3 className="font-orbitron font-bold text-white text-base">{activeManeuverModal.title}</h3>
              </div>
              <button
                onClick={() => setActiveManeuverModal(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-zinc-950 p-3 rounded border border-zinc-800 space-y-1">
              <div>
                <strong className="text-white">{activeManeuverModal.vehicle.name}</strong>
                <span className="text-zinc-400 ml-2">Водитель: {activeManeuverModal.vehicle.driverName}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-300">
                <span>База навыка водителя: <strong className="text-amber-400">{activeManeuverModal.vehicle.driverBase}</strong></span>
                <span>Сложность (СЛ / DV): <strong className="text-white font-orbitron">{activeManeuverModal.dv}</strong></span>
              </div>
            </div>

            {/* Mode switch */}
            {['m-pit','m-overtake','m-ram'].includes(activeManeuverModal.maneuverId) && (
              <label className="block text-xs">
                Цель манёвра ({activeManeuverModal.maneuverId === 'm-ram' ? 'на той же клетке' : 'на соседней клетке'})
                <select value={maneuverTargetId} onChange={e => setManeuverTargetId(e.target.value)} className="block w-full bg-zinc-950 border rounded p-1 mt-1">
                  <option value="">
                    {activeManeuverModal.maneuverId === 'm-ram' ? 'Выберите цель на той же клетке (одна цель выбирается авто)' : 'Выберите цель на соседней клетке (одна цель выбирается авто)'}
                  </option>
                  {vehicles.filter(v => v.id !== activeManeuverModal.vehicle.id && !v.isWrecked && !v.isEscaped && (
                    activeManeuverModal.maneuverId === 'm-ram'
                      ? v.gridSquare === activeManeuverModal.vehicle.gridSquare
                      : Math.abs(v.gridSquare - activeManeuverModal.vehicle.gridSquare) === 1
                  )).map(v => (
                    <option key={v.id} value={v.id}>{v.name} — клетка #{v.gridSquare}</option>
                  ))}
                </select>
              </label>
            )}
            <div className="flex items-center justify-between bg-zinc-950 p-2 rounded border border-zinc-800">
              <span className="text-zinc-400 font-bold uppercase text-[11px]">Режим проверки:</span>
              <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setManeuverMode('auto')}
                  className={`px-2.5 py-1 rounded flex items-center gap-1 transition-colors ${
                    maneuverMode === 'auto' ? 'bg-cyan-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Dices className="w-3.5 h-3.5" />
                  Автобросок
                </button>
                <button
                  type="button"
                  onClick={() => setManeuverMode('manual')}
                  className={`px-2.5 py-1 rounded flex items-center gap-1 transition-colors ${
                    maneuverMode === 'manual' ? 'bg-cyan-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Ручной ввод 1d10
                </button>
              </div>
            </div>

            {/* Manual 1d10 input */}
            {maneuverMode === 'manual' && (
              <div className="p-3 bg-zinc-950 rounded border border-cyan-500/50 space-y-2 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <span className="text-zinc-300">Результат 1d10 (1–10):</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={maneuverManualD10}
                    onChange={(e) => setManeuverManualD10(parseInt(e.target.value) || 1)}
                    className="w-16 bg-zinc-900 border border-cyan-500 rounded px-2.5 py-1 text-center font-bold text-cyan-300 text-sm"
                  />
                  {maneuverManualD10 === 10 && (
                    <span className="text-emerald-400 font-bold animate-pulse">Крит. успех (10)!</span>
                  )}
                  {maneuverManualD10 === 1 && (
                    <span className="text-red-400 font-bold animate-pulse">Крит. провал (1)!</span>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                let res;
                if (activeManeuverModal.maneuverId === 'positioning') {
                  res = handleRollPositioningForVehicle(
                    activeManeuverModal.vehicle,
                    maneuverMode === 'manual' ? maneuverManualD10 : undefined
                  );
                } else {
                  res = handleExecuteManeuver(
                    activeManeuverModal.vehicle,
                    activeManeuverModal.maneuverId,
                    maneuverMode === 'manual' ? maneuverManualD10 : undefined
                  );
                }
                setManeuverResult(res);
              }}
              className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-orbitron font-bold text-xs rounded transition-all clip-cyber-btn shadow-md uppercase tracking-wider"
            >
              {maneuverMode === 'manual' ? 'Применить ручной бросок манёвра' : 'Выполнить бросок (авто)'}
            </button>

            {maneuverResult && (
              <div className={`p-3 rounded border text-xs font-tech ${
                maneuverResult.isSuccess ? 'bg-emerald-950/60 border-emerald-600 text-emerald-200' : 'bg-red-950/60 border-red-600 text-red-200'
              }`}>
                <div className="font-orbitron font-bold text-sm mb-1">
                  {maneuverResult.isSuccess ? 'УСПЕШНЫЙ МАНЁВР!' : 'ПРОВАЛ МАНЁВРА!'}
                </div>
                <div>{maneuverResult.textSummary}</div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-zinc-800">
              <button
                onClick={() => setActiveManeuverModal(null)}
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
