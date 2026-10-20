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
  Search
} from 'lucide-react';
import { CPR_RANGE_DV_TABLE, CPR_SKILL_DVS, CPR_CRITICAL_INJURIES_HEAD, CPR_CRITICAL_INJURIES_BODY, CPR_ARMORS } from '../../data/cprRules';
import { WEATHER_CONDITIONS, GIG_GENERATOR_DATA, POCKET_JUNK_TABLE } from '../../data/nightCityData';
import { GeneratedGig, GeneratedWeather, PocketLootItem } from '../../types/generators';
import { rollD10, rollD6 } from '../../utils/dice';
import { sfx } from '../../utils/audio';

export const GMReferenceView: React.FC = () => {
  const [subTab, setSubTab] = useState<'tables' | 'gigs' | 'weather' | 'loot'>('tables');

  // Gig Generator State
  const [generatedGig, setGeneratedGig] = useState<GeneratedGig | null>(null);

  // Weather State
  const [currentWeather, setCurrentWeather] = useState<GeneratedWeather>(WEATHER_CONDITIONS[0]);

  // Pocket Loot State
  const [rolledLoot, setRolledLoot] = useState<PocketLootItem | null>(null);
  const [rolledLootHistory, setRolledLootHistory] = useState<PocketLootItem[]>([]);

  // Generator: Gig
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

  // Generator: Weather
  const handleRollWeather = () => {
    sfx.playClick();
    const w = WEATHER_CONDITIONS[Math.floor(Math.random() * WEATHER_CONDITIONS.length)];
    setCurrentWeather(w);
  };

  // Generator: Pocket Junk 1d100
  const handleRollPocketLoot = () => {
    sfx.playDiceRoll();
    const item = POCKET_JUNK_TABLE[Math.floor(Math.random() * POCKET_JUNK_TABLE.length)];
    setRolledLoot(item);
    setRolledLootHistory(prev => [item, ...prev.slice(0, 9)]);
  };

  return (
    <div className="space-y-4">
      
      {/* Sub Tabs Navigation */}
      <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg flex flex-wrap gap-2 shadow-lg">
        {[
          { id: 'tables', label: 'Таблицы правил (DV & Броня)', icon: <BookOpen className="w-4 h-4" /> },
          { id: 'gigs', label: 'Генератор заказов (Gigs)', icon: <FileText className="w-4 h-4" /> },
          { id: 'weather', label: 'Погода и уличные события', icon: <CloudRain className="w-4 h-4" /> },
          { id: 'loot', label: 'Лут из карманов (1d100)', icon: <Coins className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              sfx.playClick();
              setSubTab(tab.id as any);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-orbitron font-bold rounded transition-all clip-cyber-sm ${
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
        <div className="space-y-5">
          
          {/* Range DV Table */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crosshair className="w-5 h-5 text-red-500" />
                <h3 className="font-orbitron font-bold text-white text-base">
                  ОФИЦИАЛЬНАЯ ТАБЛИЦА ДИСТАНЦИЙ ОРУЖИЯ (RANGE DV)
                </h3>
              </div>
              <span className="text-xs font-tech text-zinc-500">Cyberpunk RED Corebook</span>
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
          </div>

          {/* Skill DVs & Armors Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Skill DV Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 shadow-md">
              <h3 className="font-orbitron font-bold text-white text-base flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <span>СЛОЖНОСТИ ПРОВЕРОК НАВЫКОВ (SKILL DVS)</span>
              </h3>

              <div className="space-y-2 text-xs font-tech">
                {CPR_SKILL_DVS.map((s, idx) => (
                  <div key={idx} className="bg-zinc-950 p-2.5 rounded border border-zinc-800 flex items-center justify-between">
                    <div>
                      <strong className="text-white text-sm">{s.levelRu}</strong>
                      <div className="text-[11px] text-zinc-400 mt-0.5">{s.example}</div>
                    </div>
                    <div className="bg-zinc-900 px-3 py-1 rounded border border-amber-600/60 font-orbitron font-bold text-amber-400 text-sm">
                      DV {s.dv}
                    </div>
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

          {/* Critical Injuries Quick Reference */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 shadow-md">
            <h3 className="font-orbitron font-bold text-white text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span>ТАБЛИЦА КРИТИЧЕСКИХ ТРАВМ (2d6)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-tech">
              {/* Head */}
              <div className="space-y-2">
                <h4 className="font-orbitron font-bold text-red-400 uppercase">Травмы головы</h4>
                {CPR_CRITICAL_INJURIES_HEAD.slice(0, 6).map((inj) => (
                  <div key={inj.id} className="bg-zinc-950 p-2 rounded border border-zinc-800">
                    <div className="flex items-center justify-between">
                      <strong className="text-white">{inj.rollNumber}: {inj.nameRu}</strong>
                      <span className="text-[10px] text-zinc-500">Сл {inj.treatmentDv}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">{inj.effectRu}</div>
                  </div>
                ))}
              </div>

              {/* Body */}
              <div className="space-y-2">
                <h4 className="font-orbitron font-bold text-cyan-400 uppercase">Травмы тела</h4>
                {CPR_CRITICAL_INJURIES_BODY.slice(0, 6).map((inj) => (
                  <div key={inj.id} className="bg-zinc-950 p-2 rounded border border-zinc-800">
                    <div className="flex items-center justify-between">
                      <strong className="text-white">{inj.rollNumber}: {inj.nameRu}</strong>
                      <span className="text-[10px] text-zinc-500">Сл {inj.treatmentDv}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 mt-0.5">{inj.effectRu}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: GIG GENERATOR */}
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
                {/* Client */}
                <div className="bg-zinc-900 p-3 rounded border border-zinc-800 space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase block">Заказчик</span>
                  <strong className="text-white text-sm">{generatedGig.client.name}</strong>
                  <div className="text-zinc-400">Фракция: {generatedGig.client.faction}</div>
                  <div className="text-zinc-500 italic">Скрытая цель: {generatedGig.client.agenda}</div>
                </div>

                {/* Mission Objective */}
                <div className="bg-zinc-900 p-3 rounded border border-zinc-800 space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase block">Задача</span>
                  <strong className="text-cyan-400 text-sm">{generatedGig.mission.objective}</strong>
                  <div className="text-zinc-300">Цель: {generatedGig.mission.target}</div>
                  <div className="text-zinc-400">{generatedGig.mission.details}</div>
                </div>

                {/* Location */}
                <div className="bg-zinc-900 p-3 rounded border border-zinc-800 space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase block">Локация</span>
                  <strong className="text-white text-sm">{generatedGig.location.name}</strong>
                  <div className="text-amber-400">Район: {generatedGig.location.district}</div>
                  <div className="text-zinc-400">{generatedGig.location.features}</div>
                </div>

                {/* Plot Twist */}
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

      {/* SUBTAB 3: WEATHER & INCIDENTS */}
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

      {/* SUBTAB 4: POCKET JUNK 1d100 */}
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
