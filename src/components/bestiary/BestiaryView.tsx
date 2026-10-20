import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Plus, 
  Sparkles, 
  Swords, 
  Crosshair, 
  Shield, 
  Heart, 
  Skull,
  Zap,
  Tag,
  Trash2,
  X
} from 'lucide-react';
import { NpcTemplate, ThreatLevel } from '../../types/bestiary';
import { Combatant } from '../../types/combat';
import { OFFICIAL_CPR_BESTIARY } from '../../data/bestiaryData';
import { NIGHT_CITY_GANGS, POCKET_JUNK_TABLE } from '../../data/nightCityData';
import { sfx } from '../../utils/audio';

interface BestiaryViewProps {
  customBestiary: NpcTemplate[];
  setCustomBestiary: React.Dispatch<React.SetStateAction<NpcTemplate[]>>;
  onAddNpcToCombat: (npc: NpcTemplate, count: number) => void;
}

export const BestiaryView: React.FC<BestiaryViewProps> = ({
  customBestiary,
  setCustomBestiary,
  onAddNpcToCombat
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedThreat, setSelectedThreat] = useState<string>('all');
  const [selectedFaction, setSelectedFaction] = useState<string>('all');
  const [addCounts, setAddCounts] = useState<Record<string, number>>({});

  // Procedural Quick Gang NPC Generator Modal
  const [isGeneratorOpen, setIsGeneratorOpen] = useState<boolean>(false);
  const [genFaction, setGenFaction] = useState<string>(NIGHT_CITY_GANGS[0].id);
  const [genThreat, setGenThreat] = useState<ThreatLevel>('Mook');

  // Manual NPC Builder Modal
  const [isManualBuilderOpen, setIsManualBuilderOpen] = useState<boolean>(false);
  const [npcName, setNpcName] = useState<string>('');
  const [npcFaction, setNpcFaction] = useState<string>('Уличная банда');
  const [npcThreat, setNpcThreat] = useState<ThreatLevel>('Mook');
  const [npcDesc, setNpcDesc] = useState<string>('');
  const [npcRef, setNpcRef] = useState<number>(6);
  const [npcDex, setNpcDex] = useState<number>(6);
  const [npcMove, setNpcMove] = useState<number>(5);
  const [npcBody, setNpcBody] = useState<number>(6);
  const [npcInt, setNpcInt] = useState<number>(4);
  const [npcHp, setNpcHp] = useState<number>(35);
  const [npcHeadSp, setNpcHeadSp] = useState<number>(11);
  const [npcBodySp, setNpcBodySp] = useState<number>(11);
  const [npcWeaponName, setNpcWeaponName] = useState<string>('Тяжёлый пистолет');
  const [npcWeaponDamage, setNpcWeaponDamage] = useState<string>('3d6');
  const [npcTactics, setNpcTactics] = useState<string>('');

  const allNpcs = [...OFFICIAL_CPR_BESTIARY, ...customBestiary];

  // Filtering
  const filteredNpcs = allNpcs.filter(npc => {
    const matchesSearch = 
      npc.nameRu.toLowerCase().includes(searchTerm.toLowerCase()) ||
      npc.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (npc.faction && npc.faction.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesThreat = selectedThreat === 'all' || npc.threatLevel === selectedThreat;
    const matchesFaction = selectedFaction === 'all' || (npc.faction && npc.faction.includes(selectedFaction));

    return matchesSearch && matchesThreat && matchesFaction;
  });

  const getCount = (id: string) => addCounts[id] || 1;
  const setCount = (id: string, count: number) => {
    setAddCounts(prev => ({ ...prev, [id]: Math.max(1, count) }));
  };

  const handleOpenManualBuilder = () => {
    setNpcName('');
    setNpcFaction('Уличная банда');
    setNpcThreat('Mook');
    setNpcDesc('');
    setNpcRef(6);
    setNpcDex(6);
    setNpcMove(5);
    setNpcBody(6);
    setNpcInt(4);
    setNpcHp(35);
    setNpcHeadSp(11);
    setNpcBodySp(11);
    setNpcWeaponName('Тяжёлый пистолет');
    setNpcWeaponDamage('3d6');
    setNpcTactics('');
    setIsManualBuilderOpen(true);
  };

  const handleSaveManualNpc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!npcName.trim()) return;

    const newNpc: NpcTemplate = {
      id: `custom-npc-${Date.now()}`,
      nameRu: npcName.trim(),
      nameEn: npcName.trim(),
      threatLevel: npcThreat,
      faction: npcFaction.trim() || 'Независимый',
      description: npcDesc.trim() || 'Созданный мастером противник',
      stats: {
        INT: npcInt,
        REF: npcRef,
        DEX: npcDex,
        TECH: 3,
        COOL: 4,
        WILL: 4,
        LUCK: npcThreat === 'Boss' ? 4 : 0,
        MOVE: npcMove,
        BODY: npcBody,
        EMP: 3
      },
      hpMax: npcHp,
      headSp: npcHeadSp,
      bodySp: npcBodySp,
      armorName: `ОС ${npcHeadSp}/${npcBodySp}`,
      weapons: [
        {
          id: `w-c-${Date.now()}`,
          name: npcWeaponName.trim() || 'Оружие',
          category: 'Heavy Pistol',
          damage: npcWeaponDamage.trim() || '3d6',
          standardRof: 1,
          magCapacity: 8,
          currentAmmo: 8,
          ammoType: 'Стандартные'
        }
      ],
      skills: [
        { nameRu: 'Стрельба', base: npcRef + 4 },
        { nameRu: 'Уклонение', base: npcDex + 3 },
        { nameRu: 'Драка', base: npcDex + 4 }
      ],
      cyberware: [],
      gear: [],
      tactics: npcTactics.trim() || 'Атакует из укрытий',
      isCustom: true
    };

    setCustomBestiary(prev => [newNpc, ...prev]);
    sfx.playCritSuccess();
    setIsManualBuilderOpen(false);
  };

  const handleDeleteCustomNpc = (id: string) => {
    if (confirm('Удалить этого созданного NPC из бестиария?')) {
      sfx.playClick();
      setCustomBestiary(prev => prev.filter(n => n.id !== id));
    }
  };

  // Procedural Generator logic
  const handleGenerateNpc = () => {
    sfx.playCritSuccess();
    const gang = NIGHT_CITY_GANGS.find(g => g.id === genFaction) || NIGHT_CITY_GANGS[0];
    
    const nicknames = ['Бритва', 'Кирпич', 'Свеча', 'Вектор', 'Ноль', 'Штырь', 'Глитч', 'Хром', 'Призрак', 'Токсик'];
    const randomNick = nicknames[Math.floor(Math.random() * nicknames.length)];

    let baseHp = 25;
    let baseRef = 6;
    let baseDex = 5;
    let baseSp = 7;
    let armorTitle = 'Кевлар (ОС 7)';

    if (genThreat === 'Lieutenant') {
      baseHp = 45;
      baseRef = 7;
      baseDex = 7;
      baseSp = 11;
      armorTitle = 'Лёгкий арморджек (ОС 11)';
    } else if (genThreat === 'Boss') {
      baseHp = 60;
      baseRef = 8;
      baseDex = 8;
      baseSp = 13;
      armorTitle = 'Тяжёлый арморджек (ОС 13)';
    }

    const randomJunk = POCKET_JUNK_TABLE[Math.floor(Math.random() * POCKET_JUNK_TABLE.length)];

    const generatedNpc: NpcTemplate = {
      id: `gen-npc-${Date.now()}`,
      nameRu: `${gang.nameRu.split(' ')[0]} ${randomNick}`,
      nameEn: `${gang.nameEn} ${randomNick}`,
      threatLevel: genThreat,
      faction: gang.nameRu,
      description: `${gang.style} ${gang.attitude}`,
      stats: {
        INT: 4,
        REF: baseRef,
        DEX: baseDex,
        TECH: 3,
        COOL: 5,
        WILL: 4,
        LUCK: genThreat === 'Boss' ? 4 : 0,
        MOVE: 5,
        BODY: genThreat === 'Boss' ? 8 : 5,
        EMP: 3
      },
      hpMax: baseHp,
      headSp: baseSp,
      bodySp: baseSp,
      armorName: armorTitle,
      weapons: [
        {
          id: `w-gen-${Date.now()}-1`,
          name: genThreat === 'Boss' ? 'Штурмовая винтовка (5d6)' : 'Очень тяжёлый пистолет (4d6)',
          category: genThreat === 'Boss' ? 'Assault Rifle' : 'Very Heavy Pistol',
          damage: genThreat === 'Boss' ? '5d6' : '4d6',
          standardRof: 1,
          magCapacity: genThreat === 'Boss' ? 30 : 8,
          currentAmmo: genThreat === 'Boss' ? 30 : 8,
          ammoType: 'Стандартные'
        }
      ],
      skills: [
        { nameRu: 'Стрельба', base: baseRef + 4 },
        { nameRu: 'Уклонение', base: baseDex + 3 },
        { nameRu: 'Драка', base: baseDex + 4 }
      ],
      cyberware: [gang.cyberwarePreference],
      gear: [`Лут в карманах: ${randomJunk.nameRu} (${randomJunk.valueEb} eb)`],
      tactics: 'Атакует слаженно, держится укрытий, отступает при получении тяжелого ранения.',
      isCustom: true
    };

    setCustomBestiary(prev => [generatedNpc, ...prev]);
    setIsGeneratorOpen(false);
  };

  return (
    <div className="space-y-4">
      
      {/* Top Banner & Filters */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg space-y-3 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              <h2 className="font-orbitron font-bold text-white text-base">
                БЕСТИАРИЙ И БАНДЫ НАЙТ-СИТИ
              </h2>
              <span className="text-xs font-tech px-2 py-0.5 rounded bg-red-950 border border-red-700 text-red-300 font-bold">
                {allNpcs.length} шаблонов
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-tech mt-0.5">
              Официальные архетипы из Corebook, «Досье Danger Gal», быстрый генератор банд и конструктор своих NPC
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleOpenManualBuilder}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-orbitron font-bold text-xs rounded transition-all clip-cyber-sm shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>СОЗДАТЬ NPC ВРУЧНУЮ</span>
            </button>

            <button
              onClick={() => setIsGeneratorOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-500 text-white font-orbitron font-bold text-xs rounded transition-all clip-cyber-sm shadow-md"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>ГЕНЕРАТОР БАНДИТА</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-zinc-800/80">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Поиск по имени или фракции..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500"
            />
          </div>

          <div>
            <select
              value={selectedThreat}
              onChange={(e) => setSelectedThreat(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white outline-none focus:border-red-500 font-tech"
            >
              <option value="all">Все уровни угрозы</option>
              <option value="Mook">Шпана / Шестёрки (Mook)</option>
              <option value="Lieutenant">Лейтенанты (Lieutenant)</option>
              <option value="Boss">Боссы / Элита (Boss)</option>
              <option value="Drone">Дроны и Турели (Drone)</option>
            </select>
          </div>

          <div>
            <select
              value={selectedFaction}
              onChange={(e) => setSelectedFaction(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white outline-none focus:border-red-500 font-tech"
            >
              <option value="all">Все фракции и банды</option>
              <option value="Бозо">Бозо (Bozos)</option>
              <option value="Danger Gal">Danger Gal: Отряд Puma</option>
              <option value="NCPD">NCPD (Полиция)</option>
              <option value="Пираньи">Пираньи (Piranhas)</option>
              <option value="Maelstrom">Мальстрём (Maelstrom)</option>
              <option value="Корпоратив">Корпоративная охрана</option>
              <option value="Кочевник">Кочевники / Пустоши</option>
              <option value="Синдикат">Синдикат / Наёмники</option>
            </select>
          </div>
        </div>
      </div>

      {/* NPC Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNpcs.map((npc) => (
          <div
            key={npc.id}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 hover:border-zinc-700 transition-all shadow-md flex flex-col justify-between clip-cyber-sm"
          >
            <div className="space-y-2.5">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-orbitron font-black text-white text-base">
                      {npc.nameRu}
                    </h3>
                    {npc.isCustom && (
                      <span className="text-[9px] font-tech px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-700 text-emerald-400 font-bold uppercase">
                        Кастомный
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400 font-tech">
                    {npc.faction}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-tech font-bold px-2 py-0.5 rounded border uppercase ${
                    npc.threatLevel === 'Boss' ? 'bg-red-950 border-red-600 text-red-400' :
                    npc.threatLevel === 'Lieutenant' ? 'bg-amber-950 border-amber-600 text-amber-400' :
                    npc.threatLevel === 'Drone' ? 'bg-purple-950 border-purple-600 text-purple-400' :
                    'bg-zinc-800 border-zinc-700 text-zinc-300'
                  }`}>
                    {npc.threatLevel}
                  </span>

                  {npc.isCustom && (
                    <button
                      onClick={() => handleDeleteCustomNpc(npc.id)}
                      title="Удалить созданного NPC"
                      className="text-zinc-600 hover:text-red-400 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-zinc-400 font-tech line-clamp-2">
                {npc.description}
              </p>

              {/* Stats Bar */}
              <div className="grid grid-cols-5 gap-1 bg-zinc-950 p-1.5 rounded border border-zinc-800 text-center font-tech text-xs">
                <div>
                  <div className="text-[9px] text-zinc-500">РЕФ</div>
                  <strong className="text-cyan-400">{npc.stats.REF}</strong>
                </div>
                <div>
                  <div className="text-[9px] text-zinc-500">ЛОВ</div>
                  <strong className="text-cyan-400">{npc.stats.DEX}</strong>
                </div>
                <div>
                  <div className="text-[9px] text-zinc-500">СКО</div>
                  <strong className="text-cyan-400">{npc.stats.MOVE}</strong>
                </div>
                <div>
                  <div className="text-[9px] text-zinc-500">ТЕЛО</div>
                  <strong className="text-cyan-400">{npc.stats.BODY}</strong>
                </div>
                <div>
                  <div className="text-[9px] text-zinc-500">ИНТ</div>
                  <strong className="text-cyan-400">{npc.stats.INT}</strong>
                </div>
              </div>

              {/* Health & Armor */}
              <div className="grid grid-cols-2 gap-2 text-xs font-tech">
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-red-500" />
                    <span>ПЗ (HP):</span>
                  </span>
                  <strong className="text-white font-orbitron">{npc.hpMax}</strong>
                </div>

                <div className="bg-zinc-950 p-2 rounded border border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Броня ОС:</span>
                  </span>
                  <strong className="text-cyan-300 font-orbitron">{npc.headSp} / {npc.bodySp}</strong>
                </div>
              </div>

              {/* Weapons */}
              <div className="space-y-1">
                <div className="text-[10px] font-tech text-zinc-500 uppercase">Вооружение:</div>
                {npc.weapons.map((w, idx) => (
                  <div key={idx} className="bg-zinc-950 p-1.5 rounded border border-zinc-850 text-xs font-tech flex items-center justify-between">
                    <span className="text-zinc-300">{w.name}</span>
                    <strong className="text-amber-400 font-orbitron text-[11px]">{w.damage}</strong>
                  </div>
                ))}
              </div>

              {/* Skills preview */}
              {npc.skills && npc.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 text-[11px] font-tech">
                  {npc.skills.slice(0, 4).map((s, idx) => (
                    <span key={idx} className="px-1.5 py-0.2 rounded bg-zinc-950 border border-zinc-800 text-zinc-400">
                      {s.nameRu}: <strong className="text-white">{s.base}</strong>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Add to Combat Bar */}
            <div className="pt-2 border-t border-zinc-800 flex items-center gap-2">
              <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded px-2 py-1">
                <span className="text-[10px] font-tech text-zinc-500 mr-1.5 uppercase">Кол-во:</span>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={getCount(npc.id)}
                  onChange={(e) => setCount(npc.id, parseInt(e.target.value) || 1)}
                  className="w-8 bg-transparent text-center font-orbitron font-bold text-amber-400 text-xs outline-none"
                />
              </div>

              <button
                onClick={() => {
                  sfx.playHit();
                  onAddNpcToCombat(npc, getCount(npc.id));
                }}
                className="flex-1 py-1.5 px-3 bg-red-600 hover:bg-red-500 text-white font-orbitron font-bold text-xs rounded transition-all clip-cyber-btn shadow flex items-center justify-center gap-1.5"
              >
                <Swords className="w-3.5 h-3.5" />
                <span>В БОЙ ({getCount(npc.id)})</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Manual NPC Builder Modal */}
      {isManualBuilderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form 
            onSubmit={handleSaveManualNpc}
            className="bg-zinc-900 border border-emerald-600/70 rounded-lg max-w-lg w-full max-h-[90dvh] overflow-y-auto p-3.5 sm:p-5 space-y-4 clip-cyber shadow-2xl text-xs font-tech"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-orbitron font-bold text-white text-base flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-400" />
                <span>СОЗДАТЬ NPC ВРУЧНУЮ</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setIsManualBuilderOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Имя / Название противника *</label>
                <input
                  type="text"
                  required
                  value={npcName}
                  onChange={(e) => setNpcName(e.target.value)}
                  placeholder="например, Элитный штурмовик Арасака"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-white font-bold outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Уровень угрозы</label>
                <select
                  value={npcThreat}
                  onChange={(e) => setNpcThreat(e.target.value as ThreatLevel)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-white outline-none focus:border-emerald-500 font-orbitron"
                >
                  <option value="Mook">Шестёрка (Mook)</option>
                  <option value="Lieutenant">Лейтенант (Lieutenant)</option>
                  <option value="Boss">Босс (Boss)</option>
                  <option value="Drone">Дрон / Турель (Drone)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Фракция / Банда</label>
                <input
                  type="text"
                  value={npcFaction}
                  onChange={(e) => setNpcFaction(e.target.value)}
                  placeholder="Arasaka / Мальстрём / Бозо"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Краткое описание стиля</label>
                <input
                  type="text"
                  value={npcDesc}
                  onChange={(e) => setNpcDesc(e.target.value)}
                  placeholder="Тяжелая броня, тактический шлем"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-white outline-none"
                />
              </div>
            </div>

            {/* Core Stats */}
            <div>
              <span className="text-[10px] text-zinc-500 uppercase block mb-1.5 font-bold">Характеристики:</span>
              <div className="grid grid-cols-5 gap-2 text-center">
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 block">РЕФ</span>
                  <input
                    type="number"
                    value={npcRef}
                    onChange={(e) => setNpcRef(parseInt(e.target.value) || 2)}
                    className="w-full bg-transparent text-center font-orbitron font-bold text-cyan-400 text-sm outline-none"
                  />
                </div>
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 block">ЛОВ</span>
                  <input
                    type="number"
                    value={npcDex}
                    onChange={(e) => setNpcDex(parseInt(e.target.value) || 2)}
                    className="w-full bg-transparent text-center font-orbitron font-bold text-cyan-400 text-sm outline-none"
                  />
                </div>
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 block">СКО</span>
                  <input
                    type="number"
                    value={npcMove}
                    onChange={(e) => setNpcMove(parseInt(e.target.value) || 2)}
                    className="w-full bg-transparent text-center font-orbitron font-bold text-cyan-400 text-sm outline-none"
                  />
                </div>
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 block">ТЕЛО</span>
                  <input
                    type="number"
                    value={npcBody}
                    onChange={(e) => setNpcBody(parseInt(e.target.value) || 2)}
                    className="w-full bg-transparent text-center font-orbitron font-bold text-cyan-400 text-sm outline-none"
                  />
                </div>
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 block">ИНТ</span>
                  <input
                    type="number"
                    value={npcInt}
                    onChange={(e) => setNpcInt(parseInt(e.target.value) || 2)}
                    className="w-full bg-transparent text-center font-orbitron font-bold text-cyan-400 text-sm outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Health & Armor */}
            <div className="grid grid-cols-3 gap-2 bg-zinc-950 p-3 rounded border border-zinc-800">
              <div>
                <label className="text-zinc-400 block mb-1 uppercase text-[10px]">HP (ПЗ)</label>
                <input
                  type="number"
                  value={npcHp}
                  onChange={(e) => setNpcHp(parseInt(e.target.value) || 10)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-white font-orbitron font-bold"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Голова ОС</label>
                <input
                  type="number"
                  value={npcHeadSp}
                  onChange={(e) => setNpcHeadSp(parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-cyan-300 font-orbitron font-bold"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Тело ОС</label>
                <input
                  type="number"
                  value={npcBodySp}
                  onChange={(e) => setNpcBodySp(parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-cyan-300 font-orbitron font-bold"
                />
              </div>
            </div>

            {/* Weapons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Оружие</label>
                <input
                  type="text"
                  value={npcWeaponName}
                  onChange={(e) => setNpcWeaponName(e.target.value)}
                  placeholder="Штурмовая винтовка"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Урон (например, 3d6, 4d6, 5d6)</label>
                <input
                  type="text"
                  value={npcWeaponDamage}
                  onChange={(e) => setNpcWeaponDamage(e.target.value)}
                  placeholder="5d6"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-amber-400 font-orbitron font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Тактика и повадки в бою</label>
              <input
                type="text"
                value={npcTactics}
                onChange={(e) => setNpcTactics(e.target.value)}
                placeholder="Держится укрытий, фокусит сольных бойцов"
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1 text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsManualBuilderOpen(false)}
                className="px-3 py-1.5 text-zinc-400 hover:text-white"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-orbitron font-bold text-xs rounded clip-cyber-sm shadow"
              >
                СОХРАНИТЬ В БЕСТИАРИЙ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Procedural Gang NPC Generator Modal */}
      {isGeneratorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-red-600/70 rounded-lg max-w-md w-full max-h-[90dvh] overflow-y-auto p-3.5 sm:p-5 space-y-4 clip-cyber shadow-2xl">
            <h3 className="font-orbitron font-bold text-white text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>ГЕНЕРАТОР БАНДИТА НАЙТ-СИТИ</span>
            </h3>

            <div>
              <label className="text-xs font-tech text-zinc-400 block mb-1 uppercase">Выберите банду</label>
              <select
                value={genFaction}
                onChange={(e) => setGenFaction(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-white font-medium outline-none focus:border-red-500"
              >
                {NIGHT_CITY_GANGS.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.nameRu} ({g.territory})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-tech text-zinc-400 block mb-1 uppercase">Уровень опасности</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Mook', 'Lieutenant', 'Boss'] as ThreatLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setGenThreat(level)}
                    className={`py-2 px-2 text-xs font-orbitron font-bold rounded border transition-all ${
                      genThreat === level
                        ? 'bg-red-950 border-red-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {level === 'Mook' ? 'Шестёрка' : level === 'Lieutenant' ? 'Лейтенант' : 'Босс'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsGeneratorOpen(false)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white rounded"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleGenerateNpc}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-orbitron font-bold text-xs rounded clip-cyber-sm shadow"
              >
                Сгенерировать NPC
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
