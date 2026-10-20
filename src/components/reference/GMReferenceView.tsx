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
  Play,
  Pill,
  Brain,
  Skull,
  Activity,
  FlaskConical
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
  VENDING_MACHINE_TABLE,
  VendingTableRow,
  RolledVendingResult,
  SituationalModifier,
  StreetIncidentEvent
} from '../../data/cprExpandedRules';
import {
  STREET_DRUGS,
  MEDTECH_PHARMACEUTICALS,
  COMBAT_CHEMICALS,
  DRUG_INTENSITY_TIERS,
  CYBERPSYCHOSIS_STAGES,
  PSYCHOPATHY_CHECKLIST,
  INSTANT_HUMANITY_LOSS,
  LONG_TERM_HUMANITY_LOSS,
  INSTANT_HUMANITY_GAIN,
  LONG_TERM_HUMANITY_GAIN,
  getCyberpsychosisStage,
  StreetDrug,
  MedtechPharma,
  CombatChemical,
  PsychopathyTrait,
  HumanityEvent
} from '../../data/cprDrugsAndCyberpsychosis';
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
  | 'drugs'
  | 'psycho'
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

  // 6. Vending Machine State
  const [vendingResult, setVendingResult] = useState<RolledVendingResult | null>(null);
  const [showVendingTable, setShowVendingTable] = useState<boolean>(true);
  const [manualVendingD6, setManualVendingD6] = useState<number>(1);
  const [manualVendingD10, setManualVendingD10] = useState<number>(1);

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

  // 11. Drugs & Pharmaceuticals State
  const [drugTabCategory, setDrugTabCategory] = useState<'all' | 'street' | 'pharma' | 'combat' | 'intensity'>('all');
  const [drugSearchQuery, setDrugSearchQuery] = useState<string>('');
  const [selectedDrugForCheck, setSelectedDrugForCheck] = useState<StreetDrug | CombatChemical | null>(null);
  const [resistBaseStat, setResistBaseStat] = useState<number>(12);
  const [manualResistRoll, setManualResistRoll] = useState<number>(5);
  const [resistTestResult, setResistTestResult] = useState<{
    rolledValue: number;
    extraExplode?: number;
    total: number;
    targetDv: number;
    isSuccess: boolean;
    isCritSuccess: boolean;
    isCritFailure: boolean;
    substanceName: string;
  } | null>(null);

  // 12. Cyberpsychosis & Mental Trauma State
  const [calcHumanity, setCalcHumanity] = useState<number>(45);
  const [selectedTrait, setSelectedTrait] = useState<PsychopathyTrait | null>(null);
  const [manualTraitD10, setManualTraitD10] = useState<number>(1);
  const [humanityEventsTab, setHumanityEventsTab] = useState<'instant_loss' | 'longterm_loss' | 'instant_gain' | 'longterm_gain'>('instant_loss');
  const [rolledHumanityResult, setRolledHumanityResult] = useState<{
    tierTitle: string;
    diceNotation: string;
    diceRolls: number[];
    total: number;
    isGain: boolean;
  } | null>(null);

  const handleSelectDrugForResist = (drug: StreetDrug | CombatChemical) => {
    sfx.playClick();
    setSelectedDrugForCheck(drug);
    setResistTestResult(null);
  };

  const handleRollDrugResist = (targetDv: number, substanceName: string) => {
    sfx.playDiceRoll();
    const d10 = rollD10();
    let total = resistBaseStat + d10;
    let extraExplode: number | undefined = undefined;

    if (d10 === 10) {
      const explodeD10 = rollD10();
      extraExplode = explodeD10;
      total += explodeD10;
    } else if (d10 === 1) {
      const fumbleD10 = rollD10();
      extraExplode = -fumbleD10;
      total -= fumbleD10;
    }

    const isSuccess = total >= targetDv;
    if (isSuccess) sfx.playCritSuccess();
    else sfx.playCritFailure();

    setResistTestResult({
      rolledValue: d10,
      extraExplode,
      total,
      targetDv,
      isSuccess,
      isCritSuccess: d10 === 10,
      isCritFailure: d10 === 1,
      substanceName
    });
  };

  const handleManualDrugResist = (targetDv: number, substanceName: string) => {
    sfx.playClick();
    const d10 = Math.max(1, Math.min(10, manualResistRoll));
    const total = resistBaseStat + d10;
    const isSuccess = total >= targetDv;
    if (isSuccess) sfx.playCritSuccess();
    else sfx.playCritFailure();

    setResistTestResult({
      rolledValue: d10,
      total,
      targetDv,
      isSuccess,
      isCritSuccess: d10 === 10,
      isCritFailure: d10 === 1,
      substanceName
    });
  };

  const handleRollTrait = (forcedD10?: number) => {
    sfx.playDiceRoll();
    const roll = forcedD10 !== undefined ? forcedD10 : rollD10();
    const trait = PSYCHOPATHY_CHECKLIST.find(t => t.d10 === roll) || PSYCHOPATHY_CHECKLIST[0];
    setSelectedTrait(trait);
  };

  const handleRollHumanityDice = (tierTitle: string, diceNotation: string, isGain: boolean) => {
    sfx.playDiceRoll();
    let numDice = 1;
    if (diceNotation.includes('2d6') || diceNotation.includes('2к6')) numDice = 2;
    else if (diceNotation.includes('3d6') || diceNotation.includes('3к6')) numDice = 3;
    else if (diceNotation.includes('4d6') || diceNotation.includes('4к6')) numDice = 4;

    const rolls: number[] = [];
    let sum = 0;
    for (let i = 0; i < numDice; i++) {
      const r = rollD6();
      rolls.push(r);
      sum += r;
    }

    if (isGain) sfx.playCritSuccess();
    else sfx.playCritFailure();

    setRolledHumanityResult({
      tierTitle,
      diceNotation,
      diceRolls: rolls,
      total: sum,
      isGain
    });
  };

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

  // Roll Vending Machine (1d6 category + 1d10 item)
  const handleRollVending = (categoryOverride?: 'food' | 'personal' | 'cursed') => {
    sfx.playDiceRoll();
    let d6 = rollD6();
    if (categoryOverride === 'food') d6 = Math.floor(Math.random() * 3) + 1; // 1-3
    else if (categoryOverride === 'personal') d6 = Math.floor(Math.random() * 2) + 4; // 4-5
    else if (categoryOverride === 'cursed') d6 = 6;

    const d10 = rollD10();
    const row = VENDING_MACHINE_TABLE.find(r => r.d10 === d10) || VENDING_MACHINE_TABLE[0];

    let category: 'food' | 'personal' | 'cursed' = 'food';
    let categoryLabel = 'Еда (1d6: 1–3)';
    let name = row.food;

    if (d6 >= 4 && d6 <= 5) {
      category = 'personal';
      categoryLabel = 'Личные (1d6: 4–5)';
      name = row.personal;
    } else if (d6 === 6) {
      category = 'cursed';
      categoryLabel = 'Что-то очень всратое (1d6: 6)';
      name = row.cursed;
    }

    setVendingResult({ d6, d10, category, categoryLabel, name });
  };

  const handleManualVendingSelect = () => {
    sfx.playClick();
    const d6 = Math.max(1, Math.min(6, manualVendingD6));
    const d10 = Math.max(1, Math.min(10, manualVendingD10));
    const row = VENDING_MACHINE_TABLE.find(r => r.d10 === d10) || VENDING_MACHINE_TABLE[0];

    let category: 'food' | 'personal' | 'cursed' = 'food';
    let categoryLabel = 'Еда (1d6: 1–3)';
    let name = row.food;

    if (d6 >= 4 && d6 <= 5) {
      category = 'personal';
      categoryLabel = 'Личные (1d6: 4–5)';
      name = row.personal;
    } else if (d6 === 6) {
      category = 'cursed';
      categoryLabel = 'Что-то очень всратое (1d6: 6)';
      name = row.cursed;
    }

    setVendingResult({ d6, d10, category, categoryLabel, name });
  };

  const handleSelectVendingCell = (d10: number, cat: 'food' | 'personal' | 'cursed') => {
    sfx.playClick();
    const row = VENDING_MACHINE_TABLE.find(r => r.d10 === d10) || VENDING_MACHINE_TABLE[0];
    let d6 = 1;
    let categoryLabel = 'Еда (1d6: 1–3)';
    let name = row.food;

    if (cat === 'personal') {
      d6 = 4;
      categoryLabel = 'Личные (1d6: 4–5)';
      name = row.personal;
    } else if (cat === 'cursed') {
      d6 = 6;
      categoryLabel = 'Что-то очень всратое (1d6: 6)';
      name = row.cursed;
    }

    setVendingResult({ d6, d10, category: cat, categoryLabel, name });
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
          { id: 'drugs', label: 'Фармацевтика & Наркотики', icon: <Pill className="w-3.5 h-3.5 text-pink-400" /> },
          { id: 'psycho', label: 'Киберпсихоз & Травмы', icon: <Brain className="w-3.5 h-3.5 text-rose-500" /> },
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

      {/* SUBTAB: DRUGS & PHARMACEUTICALS */}
      {subTab === 'drugs' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Header & Controls */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-orbitron font-bold text-white text-base flex items-center gap-2">
                  <Pill className="w-5 h-5 text-pink-400" />
                  <span>ФАРМАЦЕВТИКА, УЛИЧНЫЕ НАРКОТИКИ И БОЕВАЯ ХИМИЯ</span>
                </h3>
                <p className="text-xs text-zinc-400 font-tech mt-0.5">
                  Эффекты, длительность, СЛ зависимости, препараты МедТеха и боевые нейротоксины Найт-Сити
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-zinc-500" />
                <input
                  type="text"
                  value={drugSearchQuery}
                  onChange={(e) => setDrugSearchQuery(e.target.value)}
                  placeholder="Поиск по названию или эффекту..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 font-tech"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-zinc-800">
              {[
                { id: 'all', label: `Все вещества (${STREET_DRUGS.length + MEDTECH_PHARMACEUTICALS.length + COMBAT_CHEMICALS.length})` },
                { id: 'street', label: `🧪 Уличные наркотики (${STREET_DRUGS.length})` },
                { id: 'pharma', label: `💉 Препараты МедТеха (${MEDTECH_PHARMACEUTICALS.length})` },
                { id: 'combat', label: `☠️ Боевая химия (${COMBAT_CHEMICALS.length})` },
                { id: 'intensity', label: `⚖️ Шкала интенсивности ядов` }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    sfx.playClick();
                    setDrugTabCategory(cat.id as any);
                  }}
                  className={`px-3 py-1 text-xs font-tech font-bold rounded transition-all ${
                    drugTabCategory === cat.id
                      ? 'bg-pink-600 text-white shadow-md'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Resistance & Addiction Roller Panel */}
          <div className="bg-zinc-900 border border-pink-900/60 rounded-lg p-4 space-y-3 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-pink-400" />
                <h4 className="font-orbitron font-bold text-white text-xs uppercase">
                  ТЕСТ НА СОПРОТИВЛЕНИЕ ПЫТКАМ/НАРКОТИКАМ И ЗАВИСИМОСТЬ
                </h4>
              </div>
              <span className="text-[11px] font-tech text-zinc-400">
                Формула: 1d10 + База Сопротивления (ТЕЛО + ВОЛЯ) vs СЛ вторичного эффекта
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs font-tech items-end">
              <div>
                <label className="text-zinc-400 block mb-1 uppercase text-[10px]">
                  Выбранный препарат:
                </label>
                <div className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-white font-bold truncate">
                  {selectedDrugForCheck ? selectedDrugForCheck.nameRu : 'Любое вещество (вручную)'}
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 uppercase text-[10px]">
                  База навыка персонажа:
                </label>
                <input
                  type="number"
                  value={resistBaseStat}
                  onChange={(e) => setResistBaseStat(parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-cyan-400 font-orbitron font-bold text-center"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 uppercase text-[10px]">
                  Сложность (СЛ / DV):
                </label>
                <div className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-amber-400 font-orbitron font-bold text-center">
                  {selectedDrugForCheck ? `СЛ ${selectedDrugForCheck.secondaryDv}` : 'СЛ 15 (Стандарт)'}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const dv = selectedDrugForCheck ? selectedDrugForCheck.secondaryDv : 15;
                    const name = selectedDrugForCheck ? selectedDrugForCheck.nameRu : 'Вещество';
                    handleRollDrugResist(dv, name);
                  }}
                  className="flex-1 py-2 px-3 bg-pink-600 hover:bg-pink-500 text-white font-orbitron font-bold text-xs rounded clip-cyber-btn shadow-md flex items-center justify-center gap-1.5"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>БРОСИТЬ (1d10)</span>
                </button>
              </div>
            </div>

            {/* Manual Roll input for tabletop IRL */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-tech border-t border-zinc-800/80">
              <span className="text-zinc-500 text-[11px]">Ручной ввод броска кубика игрока (1–10):</span>
              <input
                type="number"
                min={1}
                max={10}
                value={manualResistRoll}
                onChange={(e) => setManualResistRoll(parseInt(e.target.value) || 1)}
                className="w-16 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-white font-orbitron text-center"
              />
              <button
                onClick={() => {
                  const dv = selectedDrugForCheck ? selectedDrugForCheck.secondaryDv : 15;
                  const name = selectedDrugForCheck ? selectedDrugForCheck.nameRu : 'Вещество';
                  handleManualDrugResist(dv, name);
                }}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded font-orbitron text-[11px]"
              >
                Применить ручной бросок
              </button>
            </div>

            {/* Resistance Test Result Display */}
            {resistTestResult && (
              <div className={`p-3 rounded-lg border text-xs font-tech animate-in fade-in flex flex-wrap items-center justify-between gap-3 ${
                resistTestResult.isSuccess
                  ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200'
                  : 'bg-red-950/60 border-red-500/80 text-red-200'
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-orbitron font-bold text-sm">
                      {resistTestResult.isSuccess ? '✓ СПАСБРОСОК УСПЕШЕН!' : '✕ СПАСБРОСОК ПРОВАЛЕН!'}
                    </span>
                    {resistTestResult.isCritSuccess && (
                      <span className="bg-emerald-500 text-black px-1.5 py-0.5 rounded text-[10px] font-bold">
                        КРИТИЧЕСКИЙ УСПЕХ (10)
                      </span>
                    )}
                    {resistTestResult.isCritFailure && (
                      <span className="bg-red-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
                        КРИТИЧЕСКИЙ ПРОВАЛ (1)
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] opacity-90 mt-0.5">
                    Вещество: <strong>{resistTestResult.substanceName}</strong> • Итог: <strong>{resistTestResult.total}</strong> (База {resistBaseStat} + Куб {resistTestResult.rolledValue}{resistTestResult.extraExplode ? ` + взрыв ${resistTestResult.extraExplode}` : ''}) vs СЛ {resistTestResult.targetDv}
                  </div>
                </div>

                <div className="text-right">
                  {resistTestResult.isSuccess ? (
                    <span className="text-emerald-400 font-bold">Зависимость / вторичный эффект предотвращены!</span>
                  ) : (
                    <span className="text-red-400 font-bold">Вступает в силу побочный эффект или зависимость!</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* STREET DRUGS CARDS */}
          {(drugTabCategory === 'all' || drugTabCategory === 'street') && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-orbitron font-bold text-pink-400 uppercase tracking-wider">
                  Уличные Наркотики Найт-Сити
                </span>
                <div className="h-px bg-zinc-800 flex-1"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-tech">
                {STREET_DRUGS
                  .filter(d => {
                    const q = drugSearchQuery.toLowerCase();
                    return !q || d.nameRu.toLowerCase().includes(q) || d.nameEn.toLowerCase().includes(q) || d.primaryEffect.toLowerCase().includes(q);
                  })
                  .map(drug => (
                    <div 
                      key={drug.id} 
                      className={`bg-zinc-950 border rounded-lg p-3.5 flex flex-col justify-between space-y-3 transition-all ${
                        selectedDrugForCheck?.id === drug.id
                          ? 'border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.25)]'
                          : 'border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="space-y-2">
                        {/* Title & Badges */}
                        <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-zinc-800 pb-2">
                          <div>
                            <h4 className="font-orbitron font-bold text-white text-sm">
                              {drug.nameRu}
                            </h4>
                            <span className="text-[11px] text-zinc-500">{drug.nameEn}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 font-bold text-[10px]">
                              ⏳ {drug.duration}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 font-orbitron font-bold text-[10px]">
                              {drug.priceCategory}
                            </span>
                          </div>
                        </div>

                        {drug.description && (
                          <p className="text-zinc-400 text-[11px] italic leading-tight">
                            {drug.description}
                          </p>
                        )}

                        {/* Primary Effect */}
                        <div className="p-2 bg-zinc-900/80 rounded border border-cyan-900/50 space-y-0.5">
                          <strong className="block text-[10px] uppercase font-orbitron text-cyan-400">
                            ★ Первичный эффект:
                          </strong>
                          <p className="text-zinc-200 leading-relaxed text-[11px]">
                            {drug.primaryEffect}
                          </p>
                        </div>

                        {/* Secondary Effect & DV */}
                        <div className="p-2 bg-zinc-900/80 rounded border border-pink-950 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <strong className="text-[10px] uppercase font-orbitron text-pink-400">
                              ⚠ Вторичный эффект & Зависимость:
                            </strong>
                            <span className="px-1.5 py-0.2 rounded bg-pink-950 border border-pink-700 text-pink-300 font-orbitron font-bold text-[10px]">
                              СЛ {drug.secondaryDv}
                            </span>
                          </div>
                          <p className="text-zinc-300 leading-relaxed text-[11px]">
                            {drug.secondaryEffect}
                          </p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleSelectDrugForResist(drug)}
                        className={`w-full py-1.5 px-3 rounded font-orbitron font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 ${
                          selectedDrugForCheck?.id === drug.id
                            ? 'bg-pink-600 text-white'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-pink-300 border border-pink-900/50'
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Тест на сопротивление (СЛ {drug.secondaryDv})</span>
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* MEDTECH PHARMACEUTICALS */}
          {(drugTabCategory === 'all' || drugTabCategory === 'pharma') && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-orbitron font-bold text-cyan-400 uppercase tracking-wider">
                  Препараты и Лекарства МедТеха (MedTech Pharmaceuticals)
                </span>
                <div className="h-px bg-zinc-800 flex-1"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-tech">
                {MEDTECH_PHARMACEUTICALS
                  .filter(p => {
                    const q = drugSearchQuery.toLowerCase();
                    return !q || p.nameRu.toLowerCase().includes(q) || p.nameEn.toLowerCase().includes(q) || p.effect.toLowerCase().includes(q);
                  })
                  .map(pharma => (
                    <div key={pharma.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3.5 flex flex-col justify-between space-y-2.5">
                      <div>
                        <div className="border-b border-zinc-800 pb-1.5 mb-2">
                          <h4 className="font-orbitron font-bold text-white text-sm">
                            {pharma.nameRu}
                          </h4>
                          <span className="text-[11px] text-zinc-500">{pharma.nameEn}</span>
                        </div>

                        <p className="text-zinc-200 text-xs leading-relaxed">
                          {pharma.effect}
                        </p>
                      </div>

                      {pharma.usageLimit && (
                        <div className="p-1.5 bg-zinc-900 rounded border border-zinc-800 text-[10px] text-cyan-300">
                          <strong>Ограничение:</strong> {pharma.usageLimit}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* COMBAT CHEMISTRY */}
          {(drugTabCategory === 'all' || drugTabCategory === 'combat') && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-orbitron font-bold text-red-500 uppercase tracking-wider">
                  Боевая Химия, Нейротоксины и Яды (Combat Chemistry)
                </span>
                <div className="h-px bg-zinc-800 flex-1"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-tech">
                {COMBAT_CHEMICALS
                  .filter(c => {
                    const q = drugSearchQuery.toLowerCase();
                    return !q || c.nameRu.toLowerCase().includes(q) || c.nameEn.toLowerCase().includes(q) || c.primaryEffect.toLowerCase().includes(q);
                  })
                  .map(chem => (
                    <div 
                      key={chem.id} 
                      className={`bg-zinc-950 border rounded-lg p-3.5 flex flex-col justify-between space-y-3 transition-all ${
                        selectedDrugForCheck?.id === chem.id
                          ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                          : 'border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-zinc-800 pb-2">
                          <div>
                            <h4 className="font-orbitron font-bold text-white text-sm">
                              {chem.nameRu}
                            </h4>
                            <span className="text-[11px] text-zinc-500">{chem.nameEn}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 font-bold text-[10px]">
                              ⏳ {chem.duration}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-red-950 border border-red-800 text-red-400 font-orbitron font-bold text-[10px]">
                              {chem.priceCategory}
                            </span>
                          </div>
                        </div>

                        <p className="text-zinc-400 text-[11px] italic leading-tight">
                          {chem.description}
                        </p>

                        <div className="p-2 bg-zinc-900/80 rounded border border-red-900/50 space-y-0.5">
                          <strong className="block text-[10px] uppercase font-orbitron text-red-400">
                            ★ Поражающий эффект:
                          </strong>
                          <p className="text-zinc-200 leading-relaxed text-[11px]">
                            {chem.primaryEffect}
                          </p>
                        </div>

                        <div className="p-2 bg-zinc-900/80 rounded border border-zinc-800 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <strong className="text-[10px] uppercase font-orbitron text-amber-400">
                              Вторичные последствия:
                            </strong>
                            <span className="px-1.5 py-0.2 rounded bg-amber-950 border border-amber-700 text-amber-300 font-orbitron font-bold text-[10px]">
                              СЛ {chem.secondaryDv}
                            </span>
                          </div>
                          <p className="text-zinc-300 leading-relaxed text-[11px]">
                            {chem.secondaryEffect}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSelectDrugForResist(chem)}
                        className={`w-full py-1.5 px-3 rounded font-orbitron font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 ${
                          selectedDrugForCheck?.id === chem.id
                            ? 'bg-red-600 text-white'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-red-300 border border-red-900/50'
                        }`}
                      >
                        <Shield className="w-3.5 h-3.5" />
                        <span>Тест на сопротивление (СЛ {chem.secondaryDv})</span>
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* DRUG INTENSITY TIERS */}
          {(drugTabCategory === 'all' || drugTabCategory === 'intensity') && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 shadow-md">
              <h4 className="font-orbitron font-bold text-white text-xs uppercase flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-purple-400" />
                <span>ШКАЛА ИНТЕНСИВНОСТИ И СЛОЖНОСТИ СОПРОТИВЛЕНИЯ ЯДАМ</span>
              </h4>
              <p className="text-xs text-zinc-400 font-tech">
                Базовые пороги сложности для ядов, газов, токсинов и самодельной химии в Cyberpunk RED:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-tech">
                {DRUG_INTENSITY_TIERS.map((tier, idx) => (
                  <div key={idx} className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg flex flex-col justify-between space-y-1.5">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                      <strong className="text-white text-sm">{tier.intensity}</strong>
                      <span className="font-orbitron font-bold text-purple-400 bg-purple-950 px-2 py-0.5 rounded border border-purple-800">
                        СЛ {tier.dv}
                      </span>
                    </div>
                    <div className="text-zinc-300 text-[11px] pt-1">
                      <strong>Примеры:</strong> {tier.examples}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB: CYBERPSYCHOSIS & MENTAL TRAUMA */}
      {subTab === 'psycho' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Header */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-2 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-orbitron font-bold text-white text-base flex items-center gap-2">
                  <Brain className="w-5 h-5 text-rose-500" />
                  <span>КИБЕРПСИХОЗ, ПСИХОЛОГИЧЕСКИЕ ТРАВМЫ И ТЕРАПИЯ</span>
                </h3>
                <p className="text-xs text-zinc-400 font-tech mt-0.5">
                  «Чумба, ты что, киберпсих?» • Стадии деперсонализации, 10 черт психопатии и таблицы потери Человечности
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-tech text-zinc-400">Cyberpunk RED Core (p.232) & Data Pool</span>
              </div>
            </div>
          </div>

          {/* Interactive Humanity & Stage Calculator */}
          <div className="bg-zinc-900 border border-rose-900/60 rounded-lg p-4 space-y-4 shadow-md font-tech">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
              <h4 className="font-orbitron font-bold text-white text-xs uppercase flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose-500" />
                <span>ИНТЕРАКТИВНЫЙ РАСЧЁТ СТАДИИ КИБЕРПСИХОЗА</span>
              </h4>
              <span className="text-[11px] text-zinc-400">
                ЭМП = Человечность ÷ 10 (округление вниз)
              </span>
            </div>

            {/* Slider & Input */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div className="sm:col-span-2 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-400">Текущая Человечность (Humanity):</span>
                  <strong className="text-white font-orbitron text-sm">{calcHumanity}</strong>
                </div>
                <input
                  type="range"
                  min={-10}
                  max={80}
                  value={calcHumanity}
                  onChange={(e) => setCalcHumanity(parseInt(e.target.value) || 0)}
                  className="w-full accent-rose-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 font-orbitron">
                  <span>-10 (Экстремальный)</span>
                  <span>0 (Киберпсихоз)</span>
                  <span>10 (ЭМП 1)</span>
                  <span>20 (ЭМП 2)</span>
                  <span>30+ (Стабилен)</span>
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-center space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase block">Расчётное значение ЭМП (EMP):</span>
                <strong className={`font-orbitron text-2xl font-black ${
                  calcHumanity <= 0 ? 'text-purple-400' : Math.floor(calcHumanity / 10) === 0 ? 'text-red-500' : Math.floor(calcHumanity / 10) === 1 ? 'text-orange-400' : 'text-emerald-400'
                }`}>
                  {calcHumanity <= 0 ? '0 (Крах)' : Math.max(0, Math.floor(calcHumanity / 10))}
                </strong>
              </div>
            </div>

            {/* Calculated Stage Card */}
            {(() => {
              const stage = getCyberpsychosisStage(calcHumanity);
              return (
                <div className={`p-4 rounded-lg border space-y-3 animate-in fade-in ${stage.badgeColor}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <Skull className="w-5 h-5" />
                      <h5 className="font-orbitron font-black text-base uppercase tracking-wide">
                        {stage.title}
                      </h5>
                    </div>

                    <span className="text-xs font-orbitron font-bold px-2 py-0.5 rounded bg-zinc-950/80 border border-zinc-800 text-white">
                      {stage.requiredTraitsCount > 0 
                        ? `Обязательно черт: ${stage.requiredTraitsCount}` 
                        : 'Психопатических черт нет'}
                    </span>
                  </div>

                  <p className="text-zinc-200 text-xs sm:text-sm leading-relaxed">
                    {stage.description}
                  </p>

                  <div className="bg-zinc-950/70 p-3 rounded border border-zinc-800 space-y-1">
                    <strong className="block text-[11px] uppercase font-orbitron text-amber-400">
                      Рекомендации по отыгрышу роли (Roleplay):
                    </strong>
                    <ul className="list-disc list-inside space-y-1 text-zinc-300 text-xs">
                      {stage.roleplayTips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Psychopathy Checklist 1d10 */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-4 shadow-md font-tech">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div>
                <h4 className="font-orbitron font-bold text-white text-base flex items-center gap-2">
                  <Skull className="w-5 h-5 text-red-500" />
                  <span>КОНТРОЛЬНЫЙ СПИСОК ПСИХОПАТИИ (1d10)</span>
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Черты характера, развивающиеся при потере Человечности (CP:R стр.232 & Data Pool)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleRollTrait()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-orbitron font-bold text-xs rounded clip-cyber-btn shadow-md flex items-center gap-1.5"
                >
                  <Dices className="w-4 h-4" />
                  <span>БРОСИТЬ ЧЕРТУ (1d10)</span>
                </button>
              </div>
            </div>

            {/* Quick 1-10 selector pills */}
            <div className="flex flex-wrap gap-1">
              <span className="text-[11px] text-zinc-500 self-center mr-1">Выбрать кубик:</span>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <button
                  key={n}
                  onClick={() => handleRollTrait(n)}
                  className={`w-7 h-7 rounded text-xs font-orbitron font-bold transition-all ${
                    selectedTrait?.d10 === n
                      ? 'bg-red-600 text-white'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            {/* Active Trait Showcase Card */}
            {selectedTrait && (
              <div className="bg-zinc-950 border border-red-600/70 p-4 rounded-lg space-y-2.5 animate-in fade-in">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-red-600 text-white font-orbitron font-bold text-xs flex items-center justify-center">
                      {selectedTrait.d10}
                    </span>
                    <h5 className="font-orbitron font-bold text-white text-base">
                      {selectedTrait.nameRu}
                    </h5>
                  </div>
                  <span className="text-xs font-tech text-zinc-500">{selectedTrait.nameEn}</span>
                </div>

                <p className="text-zinc-200 text-xs sm:text-sm leading-relaxed">
                  {selectedTrait.description}
                </p>

                <div className="p-2.5 bg-zinc-900 rounded border border-amber-800/60 text-xs text-amber-200">
                  <strong className="block text-[10px] uppercase font-orbitron text-amber-400 mb-0.5">
                    Совет по отыгрышу для игрока:
                  </strong>
                  {selectedTrait.roleplayAdvice}
                </div>
              </div>
            )}

            {/* All 10 Traits Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {PSYCHOPATHY_CHECKLIST.map((trait) => (
                <div
                  key={trait.d10}
                  onClick={() => {
                    sfx.playClick();
                    setSelectedTrait(trait);
                  }}
                  className={`p-2.5 rounded border text-xs cursor-pointer transition-all ${
                    selectedTrait?.d10 === trait.d10
                      ? 'bg-zinc-900 border-red-500 shadow-md'
                      : 'bg-zinc-950 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded bg-zinc-800 text-red-400 font-orbitron font-bold text-[10px] flex items-center justify-center">
                      {trait.d10}
                    </span>
                    <strong className="text-white truncate">{trait.nameRu}</strong>
                  </div>
                  <p className="text-zinc-400 text-[11px] line-clamp-2">
                    {trait.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* HUMANITY LOSS & GAIN TABLES */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-4 shadow-md font-tech">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div>
                <h4 className="font-orbitron font-bold text-white text-base flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400" />
                  <span>ТАБЛИЦЫ ПОТЕРИ И ВОССТАНОВЛЕНИЯ ЧЕЛОВЕЧНОСТИ</span>
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Стресс, травмы, окружение Найт-Сити и позитивные события жизни
                </p>
              </div>

              {/* Subtabs for Events */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'instant_loss', label: '💥 Потеря: Мгновенная' },
                  { id: 'longterm_loss', label: '🏙️ Потеря: Ежемесячная' },
                  { id: 'instant_gain', label: '💖 Восстановление: Мгновенное' },
                  { id: 'longterm_gain', label: '🧘 Восстановление: Долгосрочное' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      sfx.playClick();
                      setHumanityEventsTab(tab.id as any);
                    }}
                    className={`px-2.5 py-1 text-xs font-tech rounded transition-all ${
                      humanityEventsTab === tab.id
                        ? 'bg-amber-600 text-white font-bold'
                        : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rolled Result Alert */}
            {rolledHumanityResult && (
              <div className={`p-3 rounded-lg border text-xs font-tech animate-in fade-in flex items-center justify-between ${
                rolledHumanityResult.isGain
                  ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200'
                  : 'bg-red-950/60 border-red-500/80 text-red-200'
              }`}>
                <div>
                  <span className="font-orbitron font-bold text-sm block">
                    {rolledHumanityResult.isGain ? '+ ВОССТАНОВЛЕНИЕ ЧЕЛОВЕЧНОСТИ' : '- ПОТЕРЯ ЧЕЛОВЕЧНОСТИ'}
                  </span>
                  <div className="text-[11px] opacity-90">
                    Категория: {rolledHumanityResult.tierTitle} • Кубы [{rolledHumanityResult.diceRolls.join(', ')}] = {rolledHumanityResult.total}
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-orbitron font-black text-xl">
                    {rolledHumanityResult.isGain ? `+${rolledHumanityResult.total}` : `-${rolledHumanityResult.total}`} ПЧ
                  </span>
                </div>
              </div>
            )}

            {/* Event List */}
            <div className="space-y-3">
              {(humanityEventsTab === 'instant_loss'
                ? INSTANT_HUMANITY_LOSS
                : humanityEventsTab === 'longterm_loss'
                ? LONG_TERM_HUMANITY_LOSS
                : humanityEventsTab === 'instant_gain'
                ? INSTANT_HUMANITY_GAIN
                : LONG_TERM_HUMANITY_GAIN
              ).map((tier, idx) => {
                const isGain = humanityEventsTab === 'instant_gain' || humanityEventsTab === 'longterm_gain';
                return (
                  <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3.5 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
                      <div>
                        <strong className="text-white font-orbitron text-xs">
                          {tier.description}
                        </strong>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded font-orbitron font-bold text-xs ${
                          isGain 
                            ? 'bg-emerald-950 border border-emerald-700 text-emerald-400' 
                            : 'bg-red-950 border border-red-700 text-red-400'
                        }`}>
                          {isGain ? `+${tier.humanityChange}` : `-${tier.humanityChange}`} ПЧ
                        </span>

                        <button
                          onClick={() => handleRollHumanityDice(tier.description, tier.humanityChange, isGain)}
                          className={`px-3 py-1 rounded font-orbitron font-bold text-[11px] flex items-center gap-1 transition ${
                            isGain
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-black'
                              : 'bg-red-600 hover:bg-red-500 text-white'
                          }`}
                        >
                          <Dices className="w-3.5 h-3.5" />
                          <span>Бросить {tier.humanityChange}</span>
                        </button>
                      </div>
                    </div>

                    <ul className="list-disc list-inside space-y-1 text-zinc-300 text-xs leading-relaxed">
                      {tier.examples.map((ex, i) => (
                        <li key={i}>{ex}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          {/* THERAPY RULES QUICK REFERENCE */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-2 shadow-md font-tech text-xs">
            <h4 className="font-orbitron font-bold text-white text-xs uppercase flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>ПРАВИЛА ТЕРАПИИ И ВОССТАНОВЛЕНИЯ ЧЕЛОВЕЧНОСТИ (CP:R СТР. 229)</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="p-2.5 bg-zinc-950 rounded border border-zinc-800 space-y-1">
                <strong className="text-emerald-400 block font-orbitron text-[11px]">Стандартная терапия</strong>
                <p className="text-zinc-300 text-[11px]">
                  Восстанавливает <strong>2d6 Человечности</strong> за неделю лечения. Стоит 500 eb. Доступна в любой нормальной клинике.
                </p>
              </div>

              <div className="p-2.5 bg-zinc-950 rounded border border-zinc-800 space-y-1">
                <strong className="text-cyan-400 block font-orbitron text-[11px]">Экстремальная терапия</strong>
                <p className="text-zinc-300 text-[11px]">
                  Восстанавливает <strong>4d6 Человечности</strong> за неделю лечения. Стоит 1000 eb. Требует элитных специалистов или стационара.
                </p>
              </div>

              <div className="p-2.5 bg-zinc-950 rounded border border-zinc-800 space-y-1">
                <strong className="text-amber-400 block font-orbitron text-[11px]">Иммуноблокаторы & Удаление</strong>
                <p className="text-zinc-300 text-[11px]">
                  Удаление киберимпланта возвращает потраченную на него Человечность. Иммуноблокаторы дают экстренные +2d6 ПЧ на 1 месяц.
                </p>
              </div>
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

          {/* Vending Machine (Official Cyberpunk RED Table) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-4 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div>
                <h3 className="font-orbitron font-bold text-white text-base flex items-center gap-2">
                  <Coffee className="w-5 h-5 text-amber-400" />
                  <span>ВЕНДИНГОВЫЙ АВТОМАТ НАЙТ-СИТИ</span>
                </h3>
                <p className="text-xs text-zinc-400 font-tech mt-0.5">
                  Официальная таблица: сначала 1d6 определяет категорию, затем 1d10 — выпавший предмет
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleRollVending()}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-orbitron font-bold text-xs rounded clip-cyber-btn shadow-md flex items-center gap-1.5"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>СЛУЧАЙНЫЙ (1d6 + 1d10)</span>
                </button>

                <button
                  onClick={() => handleRollVending('food')}
                  className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/70 text-emerald-300 font-orbitron font-bold text-[11px] rounded transition"
                  title="Бросить только по категории Еда (1d6: 1-3)"
                >
                  🍜 Еда (1–3)
                </button>

                <button
                  onClick={() => handleRollVending('personal')}
                  className="px-2.5 py-1 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600/70 text-cyan-300 font-orbitron font-bold text-[11px] rounded transition"
                  title="Бросить только по категории Личные (1d6: 4-5)"
                >
                  👔 Личные (4–5)
                </button>

                <button
                  onClick={() => handleRollVending('cursed')}
                  className="px-2.5 py-1 bg-fuchsia-950/80 hover:bg-fuchsia-900 border border-fuchsia-600/70 text-fuchsia-300 font-orbitron font-bold text-[11px] rounded transition"
                  title="Бросить только по категории Что-то очень всратое (1d6: 6)"
                >
                  📦 Всратое (6)
                </button>

                <button
                  onClick={() => setShowVendingTable(!showVendingTable)}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-tech text-xs rounded border border-zinc-700 transition"
                >
                  {showVendingTable ? 'Скрыть таблицу' : 'Показать таблицу'}
                </button>
              </div>
            </div>

            {/* Rolled Result Card */}
            {vendingResult && (
              <div className={`p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-tech animate-in fade-in shadow-lg ${
                vendingResult.category === 'food' 
                  ? 'bg-emerald-950/50 border-emerald-500 shadow-emerald-950/30' 
                  : vendingResult.category === 'personal'
                  ? 'bg-cyan-950/50 border-cyan-500 shadow-cyan-950/30'
                  : 'bg-fuchsia-950/50 border-fuchsia-500 shadow-fuchsia-950/30'
              }`}>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="font-orbitron font-bold text-[11px] text-zinc-300 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-700">
                      Кубы: 1d6: [{vendingResult.d6}] ➔ 1d10: [{vendingResult.d10}]
                    </span>
                    <span className={`font-orbitron font-bold text-[11px] px-2.5 py-0.5 rounded border uppercase ${
                      vendingResult.category === 'food'
                        ? 'bg-emerald-900/80 text-emerald-300 border-emerald-600'
                        : vendingResult.category === 'personal'
                        ? 'bg-cyan-900/80 text-cyan-300 border-cyan-600'
                        : 'bg-fuchsia-900/80 text-fuchsia-300 border-fuchsia-600'
                    }`}>
                      {vendingResult.categoryLabel}
                    </span>
                  </div>

                  <div className="font-orbitron font-black text-white text-lg sm:text-xl tracking-wide flex items-center gap-2">
                    <span>{vendingResult.name}</span>
                  </div>
                  <div className="text-zinc-400 text-[11px] mt-0.5">
                    Товар с грохотом падает в металлический лоток выдачи автомата.
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-orbitron font-bold text-amber-400 bg-zinc-950 px-3 py-1 rounded border border-amber-600/60 text-xs">
                    Оплата чипом
                  </span>
                </div>
              </div>
            )}

            {/* Interactive Vending Machine Table */}
            {showVendingTable && (
              <div className="space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-tech border-collapse border border-zinc-800">
                    <thead>
                      <tr className="bg-zinc-950 border-b border-red-900/60 text-xs font-orbitron font-bold">
                        <th className="p-2.5 text-center text-blue-400 border-r border-zinc-800 w-16">
                          1d10
                        </th>
                        <th className="p-2.5 text-emerald-400 border-r border-zinc-800">
                          Еда (1d6: 1–3)
                        </th>
                        <th className="p-2.5 text-cyan-400 border-r border-zinc-800">
                          Личные (1d6: 4–5)
                        </th>
                        <th className="p-2.5 text-fuchsia-400">
                          Что-то очень всратое (1d6: 6)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {VENDING_MACHINE_TABLE.map((row) => {
                        const isRowRolled = vendingResult?.d10 === row.d10;
                        const isFoodSelected = isRowRolled && vendingResult?.category === 'food';
                        const isPersonalSelected = isRowRolled && vendingResult?.category === 'personal';
                        const isCursedSelected = isRowRolled && vendingResult?.category === 'cursed';

                        return (
                          <tr key={row.d10} className="hover:bg-zinc-850/40 transition-colors">
                            {/* d10 column */}
                            <td className="p-2.5 text-center font-orbitron font-bold text-blue-400 bg-zinc-950/80 border-r border-zinc-800">
                              {row.d10}
                            </td>

                            {/* Food column */}
                            <td 
                              onClick={() => handleSelectVendingCell(row.d10, 'food')}
                              title="Кликните, чтобы выбрать этот предмет"
                              className={`p-2.5 border-r border-zinc-800 cursor-pointer transition-all ${
                                isFoodSelected
                                  ? 'bg-emerald-950/90 text-emerald-200 font-bold border-2 border-emerald-500 shadow-[inset_0_0_10px_rgba(16,185,129,0.4)]'
                                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
                              }`}
                            >
                              <span className="px-2 py-0.5 rounded bg-zinc-950/70 border border-zinc-800 inline-block">
                                {row.food}
                              </span>
                            </td>

                            {/* Personal column */}
                            <td 
                              onClick={() => handleSelectVendingCell(row.d10, 'personal')}
                              title="Кликните, чтобы выбрать этот предмет"
                              className={`p-2.5 border-r border-zinc-800 cursor-pointer transition-all ${
                                isPersonalSelected
                                  ? 'bg-cyan-950/90 text-cyan-200 font-bold border-2 border-cyan-500 shadow-[inset_0_0_10px_rgba(6,182,212,0.4)]'
                                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
                              }`}
                            >
                              <span className="px-2 py-0.5 rounded bg-zinc-950/70 border border-zinc-800 inline-block">
                                {row.personal}
                              </span>
                            </td>

                            {/* Cursed column */}
                            <td 
                              onClick={() => handleSelectVendingCell(row.d10, 'cursed')}
                              title="Кликните, чтобы выбрать этот предмет"
                              className={`p-2.5 cursor-pointer transition-all ${
                                isCursedSelected
                                  ? 'bg-fuchsia-950/90 text-fuchsia-200 font-bold border-2 border-fuchsia-500 shadow-[inset_0_0_10px_rgba(217,70,239,0.4)]'
                                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
                              }`}
                            >
                              <span className="px-2 py-0.5 rounded bg-zinc-950/70 border border-zinc-800 inline-block">
                                {row.cursed}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Manual Tabletop Dice Entry */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-zinc-950 rounded border border-zinc-800 text-xs font-tech">
                  <div className="text-zinc-400">
                    💡 <strong className="text-zinc-300">Ручной ввод при игре вживую (ИРЛ):</strong> бросьте кубы за столом и введите значения:
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">1d6:</span>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={manualVendingD6}
                      onChange={e => setManualVendingD6(parseInt(e.target.value) || 1)}
                      className="w-12 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-center font-orbitron font-bold text-white text-xs"
                    />

                    <span className="text-zinc-400 ml-1">1d10:</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={manualVendingD10}
                      onChange={e => setManualVendingD10(parseInt(e.target.value) || 1)}
                      className="w-14 bg-zinc-900 border border-zinc-700 rounded px-1.5 py-0.5 text-center font-orbitron font-bold text-white text-xs"
                    />

                    <button
                      onClick={handleManualVendingSelect}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-orbitron font-bold text-xs rounded transition ml-1"
                    >
                      Выбрать
                    </button>
                  </div>
                </div>
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
