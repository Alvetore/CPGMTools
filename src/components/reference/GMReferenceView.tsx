import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  CloudRain, 
  Coins, 
  Crosshair, 
  AlertTriangle, 
  Shield, 
  FileText,
  Dices,
  RefreshCw,
  Search,
  Sliders,
  DollarSign,
  Bomb,
  Flame,
  Zap,
  Eye,
  CheckCircle,
  HelpCircle,
  Coffee,
  Car,
  Award,
  Plus,
  Play
} from 'lucide-react';
import { 
  CPR_RANGE_DV_TABLE, 
  CPR_SKILL_DVS, 
  CPR_CRITICAL_INJURIES_HEAD, 
  CPR_CRITICAL_INJURIES_BODY, 
  CPR_ARMORS 
} from '../../data/cprRules';
import { 
  SITUATIONAL_MODIFIERS,
  SKILL_IMPROVEMENT_TABLE,
  VEHICLE_MANOEUVRES,
  COVER_MATERIALS,
  NIGHT_CITY_ECONOMY_SERVICES,
  MERC_TIER_REWARDS,
  DRONES_CATALOG,
  TRAPS_CATALOG,
  FLASHBACK_LUCK_TIERS,
  STREET_INCIDENTS_D100,
  VENDING_MACHINE_ITEMS,
  SituationalModifier,
  StreetIncidentEvent
} from '../../data/cprExpandedRules';
import { WEATHER_CONDITIONS, GIG_GENERATOR_DATA, POCKET_JUNK_TABLE } from '../../data/nightCityData';
import { GeneratedGig, GeneratedWeather, PocketLootItem } from '../../types/generators';
import { rollD10, rollD6 } from '../../utils/dice';
import { sfx } from '../../utils/audio';

type ReferenceTab = 
  | 'tables' 
  | 'modifiers' 
  | 'economic' 
  | 'traps' 
  | 'special' 
  | 'incidents' 
  | 'gigs' 
  | 'weather' 
  | 'loot';

interface GMReferenceViewProps {
  onAddNpcToCombat?: (npc: any, count: number) => void;
}

export const GMReferenceView: React.FC<GMReferenceViewProps> = ({ onAddNpcToCombat }) => {
  const [subTab, setSubTab] = useState<ReferenceTab>('tables');

  // 1. Situational Modifiers Interactive State
  const [activeModifierIds, setActiveModifierIds] = useState<string[]>([]);

  // 2. Skill Improvement Calculator State
  const [calcSkillType, setCalcSkillType] = useState<'regular' | 'difficultX2' | 'roleAbility'>('regular');
  const [calcFromLevel, setCalcFromLevel] = useState<number>(2);
  const [calcToLevel, setCalcToLevel] = useState<number>(6);

  // 3. Economy & Services Search State
  const [serviceSearch, setServiceSearch] = useState<string>('');
  const [serviceCategory, setServiceCategory] = useState<string>('all');

  // 4. Intoxication Calculator
  const [drinksCount, setDrinksCount] = useState<number>(2);

  // 5. Street Incidents State
  const [incidentTimeFilter, setIncidentTimeFilter] = useState<'all' | 'day' | 'evening' | 'night'>('all');
  const [currentIncident, setCurrentIncident] = useState<StreetIncidentEvent | null>(null);

  // 6. Vending Machine Roll
  const [vendingResult, setVendingResult] = useState<any | null>(null);

  // 7. Ambush Step State
  const [ambushAttackerStealth, setAmbushAttackerStealth] = useState<number>(14);
  const [ambushDefenderPerception, setAmbushDefenderPerception] = useState<number>(12);

  // 8. Gig Generator State
  const [generatedGig, setGeneratedGig] = useState<GeneratedGig | null>(null);

  // 9. Weather State
  const [currentWeather, setCurrentWeather] = useState<GeneratedWeather>(WEATHER_CONDITIONS[0]);

  // 10. Pocket Loot State
  const [rolledLoot, setRolledLoot] = useState<PocketLootItem | null>(null);
  const [rolledLootHistory, setRolledLootHistory] = useState<PocketLootItem[]>([]);

  // Toggle modifier checkbox
  const toggleModifier = (id: string) => {
    sfx.playClick();
    setActiveModifierIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const totalSituationalModifier = SITUATIONAL_MODIFIERS
    .filter(m => activeModifierIds.includes(m.id))
    .reduce((sum, m) => sum + m.modifier, 0);

  // Calculate IP cost
  const calculateIpCost = () => {
    const list = SKILL_IMPROVEMENT_TABLE[calcSkillType];
    const from = Math.max(0, Math.min(9, calcFromLevel));
    const to = Math.max(from + 1, Math.min(10, calcToLevel));
    let total = 0;
    for (let lvl = from + 1; lvl <= to; lvl++) {
      const item = list.find(x => x.targetLevel === lvl);
      if (item) total += item.cost;
    }
    return total;
  };

  // Roll Street Incident
  const handleRollIncident = () => {
    sfx.playDiceRoll();
    const filtered = STREET_INCIDENTS_D100.filter(inc => 
      incidentTimeFilter === 'all' || inc.timeOfDay === 'any' || inc.timeOfDay === incidentTimeFilter
    );
    const item = filtered[Math.floor(Math.random() * filtered.length)] || STREET_INCIDENTS_D100[0];
    setCurrentIncident(item);
  };

  // Roll Vending Machine
  const handleRollVending = () => {
    sfx.playClick();
    const item = VENDING_MACHINE_ITEMS[Math.floor(Math.random() * VENDING_MACHINE_ITEMS.length)];
    setVendingResult(item);
  };

  // Gig generator
  const handleGenerateGig = () => {
    sfx.playCritSuccess();
    const clients = GIG_GENERATOR_DATA.clients;
    const missions = GIG_GENERATOR_DATA.missions;
    const twists = GIG_GENERATOR_DATA.twists;
    const locations = GIG_GENERATOR_DATA.locations;

    const client = clients[Math.floor(Math.random() * clients.length)];
    const mission = missions[Math.floor(Math.random() * missions.length)];
    const twist = twists[Math.floor(Math.random() * twists.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];

    const payouts = [1000, 1500, 2000, 2500, 3000, 4000, 5000];
    const payoutEb = payouts[Math.floor(Math.random() * payouts.length)];

    setGeneratedGig({
      id: `gig-${Date.now()}`,
      title: `Заказ: ${mission.objective} в районе ${location.district}`,
      client,
      mission,
      twist,
      location,
      payoutEb,
      repReward: payoutEb >= 3000 ? 2 : 1,
      createdAt: Date.now()
    });
  };

  // Weather roll
  const handleRollWeather = () => {
    sfx.playClick();
    const w = WEATHER_CONDITIONS[Math.floor(Math.random() * WEATHER_CONDITIONS.length)];
    setCurrentWeather(w);
  };

  // Pocket Loot roll
  const handleRollPocketLoot = () => {
    sfx.playDiceRoll();
    const item = POCKET_JUNK_TABLE[Math.floor(Math.random() * POCKET_JUNK_TABLE.length)];
    setRolledLoot(item);
    setRolledLootHistory(prev => [item, ...prev.slice(0, 9)]);
  };

  const filteredServices = NIGHT_CITY_ECONOMY_SERVICES.filter(srv => {
    const matchesCat = serviceCategory === 'all' || srv.category === serviceCategory;
    const matchesSearch = !serviceSearch.trim() || 
      srv.nameRu.toLowerCase().includes(serviceSearch.toLowerCase()) || 
      srv.notes.toLowerCase().includes(serviceSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-4 animate-in fade-in">
      
      {/* Sub Tabs Navigation */}
      <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg flex flex-wrap gap-1.5 shadow-lg">
        {[
          { id: 'tables', label: 'Таблицы боя и брони', icon: <BookOpen className="w-3.5 h-3.5 text-red-500" /> },
          { id: 'modifiers', label: 'Модификаторы & Прокачка (IP)', icon: <Sliders className="w-3.5 h-3.5 text-cyan-400" /> },
          { id: 'economic', label: 'Экономика & Прайсы', icon: <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> },
          { id: 'traps', label: 'Ловушки & Дроны', icon: <Bomb className="w-3.5 h-3.5 text-amber-400" /> },
          { id: 'special', label: 'Спецправила: Засада & Удача', icon: <Zap className="w-3.5 h-3.5 text-purple-400" /> },
          { id: 'incidents', label: 'Случайные ситуации & Кафе', icon: <Flame className="w-3.5 h-3.5 text-orange-400" /> },
          { id: 'gigs', label: 'Генератор заказов (Gigs)', icon: <FileText className="w-3.5 h-3.5" /> },
          { id: 'weather', label: 'Погода и атмосфера', icon: <CloudRain className="w-3.5 h-3.5 text-sky-400" /> },
          { id: 'loot', label: 'Обыск карманов (1d100)', icon: <Coins className="w-3.5 h-3.5 text-yellow-400" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              sfx.playClick();
              setSubTab(tab.id as any);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-orbitron font-bold rounded transition-all clip-cyber-sm ${
              subTab === tab.id
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* SUBTAB 1: RULES TABLES */}
      {subTab === 'tables' && (
        <div className="space-y-4">
          {/* Range DV Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Crosshair className="w-5 h-5 text-red-500" />
                <h3 className="font-orbitron font-bold text-white text-base">
                  ТАБЛИЦА ДИСТАНЦИЙ ОРУЖИЯ (RANGE DV) И ОЧЕРЕДЕЙ (AUTOFIRE)
                </h3>
              </div>
              <span className="text-xs font-tech text-zinc-500">Cyberpunk RED Corebook & Data Pool</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-tech border-collapse">
                <thead>
                  <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 uppercase text-[11px]">
                    <th className="p-2.5">Тип оружия</th>
                    <th className="p-2.5 text-center">0–6 м</th>
                    <th className="p-2.5 text-center">7–12 м</th>
                    <th className="p-2.5 text-center">13–25 м</th>
                    <th className="p-2.5 text-center">26–50 м</th>
                    <th className="p-2.5 text-center">51–100 м</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {Object.entries(CPR_RANGE_DV_TABLE).map(([key, item]) => (
                    <tr key={key} className="hover:bg-zinc-850/50 transition-colors">
                      <td className="p-2.5 font-bold text-white">
                        {item.categoryRu}
                        <div className="text-[10px] text-zinc-500 font-normal">{item.categoryEn}</div>
                      </td>
                      <td className="p-2.5 text-center font-orbitron font-bold text-cyan-400">
                        {item.dvs['0-6m'] ?? '—'}
                      </td>
                      <td className="p-2.5 text-center font-orbitron font-bold text-cyan-400">
                        {item.dvs['7-12m'] ?? '—'}
                      </td>
                      <td className="p-2.5 text-center font-orbitron font-bold text-cyan-400">
                        {item.dvs['13-25m'] ?? '—'}
                      </td>
                      <td className="p-2.5 text-center font-orbitron font-bold text-cyan-400">
                        {item.dvs['26-50m'] ?? '—'}
                      </td>
                      <td className="p-2.5 text-center font-orbitron font-bold text-cyan-400">
                        {item.dvs['51-100m'] ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-zinc-400 font-tech">
              * При стрельбе очередью (Autofire) урон равен: <strong className="text-amber-300">(Бросок - DV) × 2d6</strong> (максимум множителя: 3 для обычного ПП, 4 для Тяжелого ПП и Штурмовой винтовки).
            </p>
          </div>

          {/* Cover Materials & Armor Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Cover HP Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 shadow-md">
              <h3 className="font-orbitron font-bold text-white text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                <span>ПРОЧНОСТЬ УКРЫТИЙ (COVER HP)</span>
              </h3>
              <p className="text-xs text-zinc-400 font-tech">
                Укрытие полностью поглощает пули, пока его HP не упадёт до 0. Избыточный урон пробивает укрытие и попадает в персонажа.
              </p>

              <div className="space-y-1.5 text-xs font-tech">
                {COVER_MATERIALS.map((cov, idx) => (
                  <div key={idx} className="bg-zinc-950 p-2 rounded border border-zinc-800 flex items-center justify-between">
                    <div>
                      <strong className="text-white">{cov.materialRu}</strong>
                      <div className="text-[10px] text-zinc-500">{cov.example}</div>
                    </div>
                    <span className="font-orbitron font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-700/60">
                      {cov.hp} HP
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Armors Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 shadow-md">
              <h3 className="font-orbitron font-bold text-white text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <span>ТАБЛИЦА БРОНИ И ШТРАФОВ (ARMOR & SP)</span>
              </h3>

              <div className="space-y-1.5 text-xs font-tech">
                {CPR_ARMORS.map((arm, idx) => (
                  <div key={idx} className="bg-zinc-950 p-2 rounded border border-zinc-800 flex items-center justify-between">
                    <div>
                      <strong className="text-white">{arm.nameRu}</strong>
                      {arm.penalty !== 0 && (
                        <span className="text-red-400 ml-2 font-bold font-tech">Штраф: {arm.penalty} REF/DEX/MOVE</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-500">{arm.costEb} eb</span>
                      <span className="font-orbitron font-black text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-700/60">
                        ОС {arm.sp}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Critical Injuries Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 shadow-md">
            <h3 className="font-orbitron font-bold text-white text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span>ТАБЛИЦА КРИТИЧЕСКИХ ТРАВМ (2d6 при двух шестёрках урона)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-tech">
              <div className="space-y-2">
                <h4 className="font-orbitron font-bold text-red-400 uppercase">Голова (Head)</h4>
                {CPR_CRITICAL_INJURIES_HEAD.slice(0, 6).map((inj) => (
                  <div key={inj.id} className="bg-zinc-950 p-2 rounded border border-zinc-800">
                    <div className="flex items-center justify-between">
                      <strong className="text-white">{inj.rollNumber}: {inj.nameRu}</strong>
                      <span className="text-[10px] text-zinc-500">СЛ {inj.treatmentDv}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">{inj.effectRu}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h4 className="font-orbitron font-bold text-cyan-400 uppercase">Тело (Body)</h4>
                {CPR_CRITICAL_INJURIES_BODY.slice(0, 6).map((inj) => (
                  <div key={inj.id} className="bg-zinc-950 p-2 rounded border border-zinc-800">
                    <div className="flex items-center justify-between">
                      <strong className="text-white">{inj.rollNumber}: {inj.nameRu}</strong>
                      <span className="text-[10px] text-zinc-500">СЛ {inj.treatmentDv}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">{inj.effectRu}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: MODIFIERS & IP UPGRADE CALCULATOR */}
      {subTab === 'modifiers' && (
        <div className="space-y-4">
          {/* Situational Modifiers Interactive Calculator */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div>
                <h3 className="font-orbitron font-bold text-white text-base flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-cyan-400" />
                  <span>КАЛЬКУЛЯТОР СИТУАЦИОННЫХ МОДИФИКАТОРОВ</span>
                </h3>
                <p className="text-xs text-zinc-400 font-tech">
                  Отметьте факторы обстановки, чтобы мгновенно вычислить общий штраф или бонус к броску проверки:
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-tech text-zinc-400 uppercase">Итоговый модификатор:</span>
                <span className={`px-4 py-1.5 rounded font-orbitron font-black text-lg border ${
                  totalSituationalModifier > 0 
                    ? 'bg-emerald-950 border-emerald-600 text-emerald-300' 
                    : totalSituationalModifier < 0 
                    ? 'bg-red-950 border-red-600 text-red-300' 
                    : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                }`}>
                  {totalSituationalModifier > 0 ? `+${totalSituationalModifier}` : totalSituationalModifier} к проверке
                </span>
                {activeModifierIds.length > 0 && (
                  <button
                    onClick={() => setActiveModifierIds([])}
                    className="text-xs text-zinc-500 hover:text-white underline font-tech"
                  >
                    Сбросить
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {SITUATIONAL_MODIFIERS.map(mod => {
                const isActive = activeModifierIds.includes(mod.id);
                return (
                  <button
                    key={mod.id}
                    onClick={() => toggleModifier(mod.id)}
                    className={`p-2.5 rounded-lg border text-left transition-all flex items-start justify-between gap-2 ${
                      isActive 
                        ? mod.modifier > 0 
                          ? 'bg-emerald-950/60 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                          : 'bg-red-950/60 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-white flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isActive ? (mod.modifier > 0 ? 'bg-emerald-400' : 'bg-red-400') : 'bg-zinc-700'}`}></span>
                        <span>{mod.nameRu}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 font-tech mt-0.5">{mod.description}</div>
                    </div>
                    <span className={`font-orbitron font-bold text-xs px-2 py-0.5 rounded shrink-0 ${
                      mod.modifier > 0 ? 'bg-emerald-900 text-emerald-200' : 'bg-red-900 text-red-200'
                    }`}>
                      {mod.modifier > 0 ? `+${mod.modifier}` : mod.modifier}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Skill IP Improvement Calculator & Vehicle Stunts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* IP Calculator */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 shadow-md">
              <h3 className="font-orbitron font-bold text-white text-base flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span>КАЛЬКУЛЯТОР ПРОКАЧКИ НАВЫКОВ (IP)</span>
              </h3>
              <p className="text-xs text-zinc-400 font-tech">
                В Cyberpunk RED нельзя перескакивать через уровни. Стоимость рассчитывается за каждый шаг прокачки.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="text-zinc-400 block mb-1 font-tech uppercase text-[10px]">Тип навыка</label>
                  <select
                    value={calcSkillType}
                    onChange={e => setCalcSkillType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-white font-orbitron"
                  >
                    <option value="regular">Обычный (x1)</option>
                    <option value="difficultX2">Сложный (x2)</option>
                    <option value="roleAbility">Способность Роли</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 font-tech uppercase text-[10px]">Текущий ур.</label>
                  <input
                    type="number"
                    min={0}
                    max={9}
                    value={calcFromLevel}
                    onChange={e => setCalcFromLevel(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-white font-orbitron"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1 font-tech uppercase text-[10px]">Желаемый ур.</label>
                  <input
                    type="number"
                    min={calcFromLevel + 1}
                    max={10}
                    value={calcToLevel}
                    onChange={e => setCalcToLevel(parseInt(e.target.value) || 10)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-white font-orbitron"
                  />
                </div>
              </div>

              <div className="bg-zinc-950 p-3 rounded border border-amber-600/50 flex items-center justify-between">
                <span className="text-xs text-zinc-300 font-tech">
                  Стоимость прокачки с {calcFromLevel} до {calcToLevel} уровня:
                </span>
                <span className="font-orbitron font-black text-amber-400 text-lg">
                  {calculateIpCost()} О.У. (IP)
                </span>
              </div>
            </div>

            {/* Vehicle Stunts DVs */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 shadow-md">
              <h3 className="font-orbitron font-bold text-white text-base flex items-center gap-2">
                <Car className="w-5 h-5 text-cyan-400" />
                <span>СЛОЖНОСТИ МАНЕВРОВ НА ТРАНСПОРТЕ (Т/С)</span>
              </h3>
              <div className="space-y-1.5 text-xs font-tech">
                {VEHICLE_MANOEUVRES.map((v, i) => (
                  <div key={i} className="bg-zinc-950 p-2 rounded border border-zinc-800 flex items-center justify-between">
                    <div>
                      <strong className="text-white">{v.nameRu}</strong>
                      <div className="text-[10px] text-zinc-500">{v.description}</div>
                    </div>
                    <span className="font-orbitron font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-700/60">
                      СЛ {v.dv}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: ECONOMY & SERVICES */}
      {subTab === 'economic' && (
        <div className="space-y-4">
          {/* Header & Filters */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-orbitron font-bold text-white text-base flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <span>ГОРОДСКИЕ УСЛУГИ, МЕДИЦИНА И ПРАЙС-ЛИСТЫ</span>
                </h3>
                <p className="text-xs text-zinc-400 font-tech">
                  Официальные расценки Найт-Сити на медицину, бодискульптинг, жилье, развлечения и наемников
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={serviceCategory}
                  onChange={e => setServiceCategory(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white font-orbitron"
                >
                  <option value="all">Все категории</option>
                  <option value="medical">Медицина и Импланты</option>
                  <option value="therapy">Терапия Человечности</option>
                  <option value="body">Бодискульптинг</option>
                  <option value="trauma">Trauma Team</option>
                  <option value="bars">Бары и Алкоголь</option>
                  <option value="housing">Жилье и Отели</option>
                </select>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={serviceSearch}
                    onChange={e => setServiceSearch(e.target.value)}
                    placeholder="Поиск по услугам..."
                    className="bg-zinc-950 border border-zinc-800 rounded pl-8 pr-3 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Services Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-96 overflow-y-auto pr-1">
              {filteredServices.map(srv => (
                <div key={srv.id} className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg flex flex-col justify-between text-xs font-tech">
                  <div>
                    <strong className="text-white text-sm block leading-snug">{srv.nameRu}</strong>
                    <p className="text-[11px] text-zinc-400 mt-1">{srv.notes}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-900">
                    <span className="text-[10px] text-zinc-500 uppercase">{srv.priceCategory}</span>
                    <span className="font-orbitron font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700/60">
                      {srv.costEb} eb
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Intoxication Rules & Merc Tiers Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Carmotrine & Intoxication Calculator */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 shadow-md">
              <h3 className="font-orbitron font-bold text-white text-base flex items-center gap-2">
                <Coffee className="w-5 h-5 text-amber-400" />
                <span>ПРАВИЛА ОПЬЯНЕНИЯ (КАРМОТРИН И АЛКОГОЛЬ)</span>
              </h3>
              <p className="text-xs text-zinc-400 font-tech">
                В Cyberpunk RED алкоголь рассчитывается в единицах кармотрина (4 ед. = 1 банка пива 0.33л).
              </p>

              <div className="bg-zinc-950 p-3 rounded border border-zinc-800 space-y-2 text-xs font-tech">
                <div className="flex items-center justify-between">
                  <span>Количество выпитых порций алкоголя:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDrinksCount(Math.max(1, drinksCount - 1))}
                      className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded border border-zinc-700 font-bold"
                    >
                      -
                    </button>
                    <span className="font-orbitron font-bold text-amber-300 px-2 text-sm">{drinksCount}</span>
                    <button
                      onClick={() => setDrinksCount(drinksCount + 1)}
                      className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded border border-zinc-700 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="p-2.5 bg-zinc-900 rounded border border-amber-600/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">СЛ проверки Сопротивления наркотикам:</span>
                    <strong className="font-orbitron text-amber-400 text-sm">СЛ {11 + (drinksCount - 1) * 2}</strong>
                  </div>
                  <div className="text-[11px] text-zinc-300">
                    {drinksCount <= 2 ? (
                      <span className="text-emerald-400">Персонаж слегка подвыпил: штраф -2 ко всем проверкам.</span>
                    ) : (
                      <span className="text-red-400">Тяжелое опьянение: штраф -4 ко всем проверкам (рефлексы, стрельба, вождение).</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Merc Tiers & Payouts */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 shadow-md">
              <h3 className="font-orbitron font-bold text-white text-base flex items-center gap-2">
                <Award className="w-5 h-5 text-cyan-400" />
                <span>НАГРАДЫ ЗА МИССИИ ПО РАНГАМ НАЁМНИКОВ</span>
              </h3>
              <div className="space-y-2 text-xs font-tech">
                {MERC_TIER_REWARDS.map((tier, idx) => (
                  <div key={idx} className="bg-zinc-950 p-2.5 rounded border border-zinc-800">
                    <div className="flex items-center justify-between">
                      <strong className="text-white text-sm">{tier.tierRu}</strong>
                      <span className="font-orbitron font-bold text-emerald-400 text-xs bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700/60">
                        {tier.typicalRewardEb}
                      </span>
                    </div>
                    <div className="text-zinc-400 mt-1 text-[11px]">{tier.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: TRAPS & DRONES */}
      {subTab === 'traps' && (
        <div className="space-y-4">
          {/* Drones Catalog */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 shadow-md">
            <h3 className="font-orbitron font-bold text-white text-base flex items-center gap-2">
              <Bomb className="w-5 h-5 text-amber-400" />
              <span>КАТАЛОГ БОЕВЫХ ОХРАННЫХ ДРОНОВ НАЙТ-СИТИ</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {DRONES_CATALOG.map(drone => (
                <div key={drone.id} className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg flex flex-col justify-between text-xs font-tech space-y-2">
                  <div>
                    <div className="flex items-center justify-between">
                      <strong className="text-white text-sm">{drone.nameRu}</strong>
                      <span className="text-[10px] text-zinc-500 font-orbitron">{drone.typeRu}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px]">
                      <span>HP: <strong className="text-amber-400">{drone.hp}</strong></span>
                      <span>ОС: <strong className="text-cyan-400">{drone.sp}</strong></span>
                      <span>СКО: <strong className="text-emerald-400">{drone.move}</strong></span>
                      <span>Взлом: <strong className="text-purple-400">СЛ {drone.hackDv}</strong></span>
                    </div>
                    <p className="text-zinc-400 text-[11px] mt-1.5">{drone.description}</p>
                    <div className="mt-1 text-[11px] text-zinc-300">
                      <strong>Оружие:</strong> {drone.weapons.join(', ')}
                    </div>
                  </div>

                  {onAddNpcToCombat && (
                    <button
                      onClick={() => {
                        sfx.playHit();
                        onAddNpcToCombat({
                          id: `drone-${drone.id}`,
                          nameRu: drone.nameRu,
                          threatLevel: 'Drone',
                          hpMax: drone.hp,
                          headSp: drone.sp,
                          bodySp: drone.sp,
                          stats: { INT: 2, REF: 6, DEX: 6, TECH: 2, COOL: 1, WILL: 1, LUCK: 0, MOVE: drone.move, BODY: 4, EMP: 0 },
                          weapons: drone.weapons.map((w, idx) => ({
                            id: `w-dr-${idx}`,
                            name: w,
                            category: 'Drone Weapon',
                            damage: '3d6',
                            standardRof: 1,
                            magCapacity: 30,
                            currentAmmo: 30,
                            ammoType: 'Стандарт'
                          })),
                          description: drone.description
                        }, 1);
                        alert(`Дрон «${drone.nameRu}» отправлен в боевой трекер!`);
                      }}
                      className="mt-2 w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-orbitron font-bold rounded text-[11px] flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      + В БОЕВОЙ ТРЕКЕР
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Traps Catalog */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 shadow-md">
            <h3 className="font-orbitron font-bold text-white text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span>КАТАЛОГ ЛОВУШЕК И МИН (ОБНАРУЖЕНИЕ И ОБЕЗВРЕЖИВАНИЕ)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-tech">
              {TRAPS_CATALOG.map(trap => (
                <div key={trap.id} className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg space-y-2">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                    <strong className="text-white text-sm">{trap.nameRu}</strong>
                    <div className="flex items-center gap-2 font-orbitron text-[11px]">
                      <span className="text-amber-400 bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800">
                        Поиск: СЛ {trap.detectDv}
                      </span>
                      <span className="text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800">
                        Взлом: СЛ {trap.disarmDv}
                      </span>
                    </div>
                  </div>
                  <p className="text-zinc-400 text-[11px]">{trap.description}</p>
                  <div className="p-2 bg-red-950/30 border border-red-900/60 rounded text-red-300 text-[11px]">
                    <strong>Эффект срабатывания:</strong> {trap.effect}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 5: SPECIAL RULES (AMBUSH & LUCK FLASHBACKS) */}
      {subTab === 'special' && (
        <div className="space-y-4">
          {/* Ambush & Surprise Round */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="font-orbitron font-bold text-white text-base flex items-center gap-2">
                <Eye className="w-5 h-5 text-red-500" />
                <span>ПРАВИЛА ЗАСАДЫ И РАУНДА НЕОЖИДАННОСТИ (AMBUSH)</span>
              </h3>
              <span className="text-xs text-zinc-500 font-tech">Data Pool & CP:R Ambush Mechanics</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs font-tech">
              <div className="lg:col-span-2 space-y-2 bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                <h4 className="font-orbitron font-bold text-white text-sm">Как работает засада:</h4>
                <ul className="list-disc list-inside space-y-1.5 text-zinc-300">
                  <li><strong>Скрытность против Восприятия:</strong> проверка Скрытности всех атакующих должна превзойти проверку Восприятия всех защищающихся. Если хоть один защитник превзошел проверку — засада сорвана, бросается обычная инициатива.</li>
                  <li><strong>Бесплатный раунд скрытного боя (ROF 1):</strong> каждый нападающий совершает одно скрытное действие с ROF 1 (даже если у оружия ROF 2).</li>
                  <li><strong>Автопопадание в ближнем бою:</strong> атаки холодным оружием, драка и захваты попадают автоматически! Защитник не знает об атаке и не может защититься. Идеально для прицельного удара в голову ($x2$ урон).</li>
                  <li><strong>Запрет уклонения от пуль:</strong> стрельба из огнестрела идет против стандартного DV дистанции, но цель не может уклоняться от пуль, даже если у нее РЕФ 8+.</li>
                  <li><strong>Мгновенное бесшумное убийство:</strong> по решению ГМа, при атаке из засады рядовой часовой с небольшим HP может быть устранен мгновенно.</li>
                </ul>
              </div>

              {/* Interactive Ambush Checker */}
              <div className="bg-zinc-950 p-3 rounded-lg border border-red-900/60 space-y-3">
                <h4 className="font-orbitron font-bold text-amber-400 text-xs uppercase">Быстрая проверка засады:</h4>
                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1">Скрытность нападающего (ИНТ + Навык + d10)</label>
                  <input
                    type="number"
                    value={ambushAttackerStealth}
                    onChange={e => setAmbushAttackerStealth(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white font-orbitron font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 block mb-1">База Восприятия цели (ИНТ + Навык)</label>
                  <input
                    type="number"
                    value={ambushDefenderPerception}
                    onChange={e => setAmbushDefenderPerception(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white font-orbitron font-bold text-sm"
                  />
                </div>

                <div className={`p-2.5 rounded border text-center font-orbitron font-bold text-xs ${
                  ambushAttackerStealth > ambushDefenderPerception
                    ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300'
                    : 'bg-red-950/70 border-red-500 text-red-300'
                }`}>
                  {ambushAttackerStealth > ambushDefenderPerception
                    ? '✓ ЗАСАДА УДАЛАСЬ! Цель застигнута врасплох.'
                    : '✕ ЗАСАДА СОРВАНА! Тревога, бросайте инициативу.'}
                </div>
              </div>
            </div>
          </div>

          {/* Flashback Luck */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 shadow-md">
            <h3 className="font-orbitron font-bold text-white text-base flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              <span>МЕХАНИКА «ВСПЫШКА УДАЧИ» (FLASHBACK LUCK)</span>
            </h3>
            <p className="text-xs text-zinc-400 font-tech">
              Официальное правило для ограблений и стелса: игроки не тратят часы на планирование, а тратят очки Удачи (LUCK) на реткон прошлых действий в текущую пользу (максимум 1 раз за сцену и 3 раза за операцию).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-tech">
              {FLASHBACK_LUCK_TIERS.map((tier, idx) => (
                <div key={idx} className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg flex flex-col justify-between space-y-2">
                  <div>
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                      <strong className="text-white text-xs">{tier.titleRu}</strong>
                      <span className="font-orbitron font-black text-purple-400 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                        {tier.luckCost} Удачи
                      </span>
                    </div>
                    <p className="text-zinc-300 text-[11px] mt-2"><strong>Пример:</strong> {tier.examples}</p>
                  </div>
                  <div className="text-[10px] text-zinc-500 italic border-t border-zinc-900 pt-1">
                    {tier.limits}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 6: STREET INCIDENTS D100 & VENDING */}
      {subTab === 'incidents' && (
        <div className="space-y-4">
          {/* Street Incidents d100 */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-4 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-orbitron font-bold text-white text-base flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <span>ГЕНЕРАТОР СЛУЧАЙНЫХ УЛИЧНЫХ СИТУАЦИЙ (d100)</span>
                </h3>
                <p className="text-xs text-zinc-400 font-tech mt-0.5">
                  Неожиданные встречи на улицах Найт-Сити: патрули, банды, слежка, пьяные драки и киберпсихоз
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={incidentTimeFilter}
                  onChange={e => setIncidentTimeFilter(e.target.value as any)}
                  className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white font-orbitron"
                >
                  <option value="all">Любое время суток</option>
                  <option value="day">День</option>
                  <option value="evening">Вечер</option>
                  <option value="night">Ночь</option>
                </select>

                <button
                  onClick={handleRollIncident}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-orbitron font-bold text-xs rounded clip-cyber-btn shadow-md flex items-center gap-1.5"
                >
                  <Dices className="w-4 h-4" />
                  <span>БРОСИТЬ СИТУАЦИЮ (d100)</span>
                </button>
              </div>
            </div>

            {currentIncident ? (
              <div className="bg-zinc-950 border border-orange-600/60 p-4 rounded-lg space-y-3 font-tech text-xs animate-in fade-in">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
                  <h4 className="font-orbitron font-bold text-orange-400 text-base">
                    [{currentIncident.rollMin}–{currentIncident.rollMax}] {currentIncident.titleRu}
                  </h4>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
                    Время: {currentIncident.timeOfDay}
                  </span>
                </div>

                <p className="text-zinc-200 text-sm leading-relaxed">{currentIncident.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 bg-zinc-900 rounded border border-zinc-800">
                    <strong className="text-white block text-xs mb-1">Участники сцены:</strong>
                    <div className="text-zinc-300">{currentIncident.unitsSummary}</div>
                  </div>
                  <div className="p-2.5 bg-zinc-900 rounded border border-zinc-800">
                    <strong className="text-amber-400 block text-xs mb-1">Тактика и поведение:</strong>
                    <div className="text-zinc-300">{currentIncident.tactics}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-950/60 border border-dashed border-zinc-800 p-8 rounded-lg text-center space-y-2">
                <Flame className="w-8 h-8 text-zinc-600 mx-auto" />
                <div className="text-xs text-zinc-400 font-tech">Нажмите кнопку сверху, чтобы сгенерировать случайное уличное происшествие.</div>
              </div>
            )}
          </div>

          {/* Vending Machines & Street Cafe */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-orbitron font-bold text-white text-base flex items-center gap-2">
                  <Coffee className="w-5 h-5 text-amber-400" />
                  <span>ВЕНДИНГОВЫЙ АВТОМАТ И УЛИЧНОЕ КАФЕ</span>
                </h3>
                <p className="text-xs text-zinc-400 font-tech">
                  Что герои могут купить на углу в круглосуточном автомате или забегаловке
                </p>
              </div>

              <button
                onClick={handleRollVending}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-orbitron font-bold text-xs rounded clip-cyber-btn shadow-md flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>БРОСИТЬ ВЕНДИНГ</span>
              </button>
            </div>

            {vendingResult && (
              <div className="p-3 bg-zinc-950 border border-amber-500/70 rounded-lg flex items-center justify-between text-xs font-tech animate-in fade-in">
                <div>
                  <strong className="text-white text-sm block">{vendingResult.nameRu}</strong>
                  <div className="text-zinc-400">{vendingResult.effectRu}</div>
                </div>
                <span className="font-orbitron font-bold text-amber-300 bg-amber-950 px-2.5 py-1 rounded border border-amber-700">
                  {vendingResult.costEb} eb
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 7: GIG GENERATOR */}
      {subTab === 'gigs' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-orbitron font-bold text-white text-base">
                ГЕНЕРАТОР ЗАКАЗОВ НАЙТ-СИТИ (GIGS & SCREAMSHEETS)
              </h3>
              <p className="text-xs text-zinc-400 font-tech mt-0.5">
                Мгновенное создание миссий с заказчиком, целью, сюжетным твистом и наградой
              </p>
            </div>

            <button
              onClick={handleGenerateGig}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-orbitron font-bold text-xs rounded transition-all clip-cyber-btn shadow-lg"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>СГЕНЕРИРОВАТЬ ЗАКАЗ</span>
            </button>
          </div>

          {generatedGig ? (
            <div className="bg-zinc-950 border border-red-900/60 rounded-lg p-4 space-y-4 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                <h4 className="font-orbitron font-black text-amber-400 text-lg">
                  {generatedGig.title}
                </h4>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-emerald-950 border border-emerald-700 text-emerald-400 font-orbitron font-bold text-xs rounded">
                    Награда: {generatedGig.payoutEb} eb
                  </span>
                  <span className="px-2 py-1 bg-zinc-900 border border-zinc-700 text-zinc-300 font-tech text-xs rounded">
                    Репутация: +{generatedGig.repReward}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-tech">
                <div className="bg-zinc-900 p-3 rounded border border-zinc-800 space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase block">Заказчик</span>
                  <strong className="text-white text-sm">{generatedGig.client.name}</strong>
                  <div className="text-zinc-400">Фракция: {generatedGig.client.faction}</div>
                  <div className="text-zinc-500 italic">Скрытая цель: {generatedGig.client.agenda}</div>
                </div>

                <div className="bg-zinc-900 p-3 rounded border border-zinc-800 space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase block">Задача</span>
                  <strong className="text-cyan-400 text-sm">{generatedGig.mission.objective}</strong>
                  <div className="text-zinc-300">Цель: {generatedGig.mission.target}</div>
                  <div className="text-zinc-400">{generatedGig.mission.details}</div>
                </div>

                <div className="bg-zinc-900 p-3 rounded border border-zinc-800 space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase block">Локация</span>
                  <strong className="text-white text-sm">{generatedGig.location.name}</strong>
                  <div className="text-amber-400">Район: {generatedGig.location.district}</div>
                  <div className="text-zinc-400">{generatedGig.location.features}</div>
                </div>

                <div className="bg-zinc-900 p-3 rounded border border-red-800/80 space-y-1">
                  <span className="text-[10px] text-red-400 uppercase block font-bold">Сюжетный поворот (Твист)</span>
                  <strong className="text-red-300 text-sm">{generatedGig.twist.title}</strong>
                  <div className="text-zinc-300">{generatedGig.twist.description}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-950/60 border border-dashed border-zinc-800 p-8 rounded-lg text-center space-y-2">
              <FileText className="w-10 h-10 text-zinc-600 mx-auto" />
              <div className="text-zinc-400 text-sm font-tech">Нажмите кнопку сверху, чтобы сгенерировать контракт для бегущих по краю.</div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 8: WEATHER & ATMOSPHERE */}
      {subTab === 'weather' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-orbitron font-bold text-white text-base">
                ПОГОДА И АТМОСФЕРА НАЙТ-СИТИ
              </h3>
              <p className="text-xs text-zinc-400 font-tech mt-0.5">
                Генератор погодных аномалий Красного Времени и случайных уличных происшествий
              </p>
            </div>

            <button
              onClick={handleRollWeather}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-orbitron font-bold text-xs rounded transition-all clip-cyber-btn shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              <span>БРОСИТЬ ПОГОДУ</span>
            </button>
          </div>

          <div className="bg-zinc-950 border border-cyan-900/60 rounded-lg p-4 space-y-3 font-tech text-xs">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block">Погодное явление</span>
                <strong className="font-orbitron font-black text-cyan-400 text-base">
                  {currentWeather.condition}
                </strong>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-500 uppercase block">Видимость</span>
                <span className="text-zinc-300 font-bold">{currentWeather.visibility}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-zinc-500 uppercase block">Описание окружения:</span>
              <p className="text-zinc-300 mt-0.5 text-sm">{currentWeather.atmosphere}</p>
            </div>

            {currentWeather.mechanicalEffect && (
              <div className="p-2.5 bg-red-950/40 border border-red-800/60 rounded text-red-200">
                <strong className="block text-[11px] uppercase text-red-400">Игровой эффект (Правила):</strong>
                {currentWeather.mechanicalEffect}
              </div>
            )}

            <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded text-amber-200">
              <strong className="block text-[11px] uppercase text-amber-400">Случайное уличная сцена прямо сейчас:</strong>
              {currentWeather.streetIncident}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 9: POCKET JUNK 1d100 */}
      {subTab === 'loot' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-orbitron font-bold text-white text-base">
                СОДЕРЖИМОЕ КАРМАНОВ (1d100 POCKET JUNK)
              </h3>
              <p className="text-xs text-zinc-400 font-tech mt-0.5">
                Что находят игроки при обыске тел бандитов, прохожих или корпоратов
              </p>
            </div>

            <button
              onClick={handleRollPocketLoot}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-orbitron font-bold text-xs rounded transition-all clip-cyber-btn shadow-md"
            >
              <Dices className="w-4 h-4 fill-current" />
              <span>ОБЫСКАТЬ КАРМАНЫ (1d100)</span>
            </button>
          </div>

          {rolledLoot && (
            <div className="bg-zinc-950 border border-amber-500/70 rounded-lg p-4 space-y-2 animate-in fade-in font-tech">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 uppercase">Бросок 1d100 ➔ [{rolledLoot.roll}]</span>
                <span className="text-xs font-orbitron font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700">
                  Стоимость: {rolledLoot.valueEb} eb
                </span>
              </div>

              <h4 className="font-orbitron font-bold text-white text-base">
                {rolledLoot.nameRu}
              </h4>
              <div className="text-xs text-zinc-400">Категория: {rolledLoot.category}</div>
              <p className="text-zinc-300 text-xs bg-zinc-900 p-2 rounded border border-zinc-800">
                {rolledLoot.notes}
              </p>
            </div>
          )}

          {/* History */}
          {rolledLootHistory.length > 1 && (
            <div className="space-y-1 pt-2">
              <div className="text-[11px] font-tech text-zinc-500 uppercase">История последних находок:</div>
              <div className="space-y-1">
                {rolledLootHistory.slice(1).map((item, idx) => (
                  <div key={idx} className="bg-zinc-950 p-2 rounded border border-zinc-800 text-xs font-tech flex items-center justify-between">
                    <span className="text-zinc-300">{item.nameRu}</span>
                    <strong className="text-amber-400 font-orbitron text-[11px]">{item.valueEb} eb</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
