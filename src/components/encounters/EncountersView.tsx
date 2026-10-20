import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Copy, 
  Pencil, 
  Trash2, 
  Play, 
  Layers, 
  MapPin, 
  Tag, 
  Skull, 
  Swords, 
  ShieldAlert, 
  Users,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { Encounter, NpcTemplate } from '../../types/bestiary';
import { EncounterFormModal } from './EncounterFormModal';
import { sfx } from '../../utils/audio';

interface EncountersViewProps {
  encounters: Encounter[];
  templates: NpcTemplate[];
  isCombatActive: boolean;
  combatantsCount: number;
  partyCount: number;
  onSaveEncounter: (encounter: Encounter) => void;
  onDeleteEncounter: (id: string) => void;
  onDuplicateEncounter: (encounter: Encounter) => void;
  onStartCombat: (encounter: Encounter, includeParty: boolean) => void;
  onAddAsReinforcement: (encounter: Encounter) => void;
}

export const EncountersView: React.FC<EncountersViewProps> = ({
  encounters,
  templates,
  isCombatActive,
  combatantsCount,
  partyCount,
  onSaveEncounter,
  onDeleteEncounter,
  onDuplicateEncounter,
  onStartCombat,
  onAddAsReinforcement
}) => {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEncounter, setEditingEncounter] = useState<Encounter | null>(null);
  const [includePartyOnStart, setIncludePartyOnStart] = useState<boolean>(true);

  // All unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    encounters.forEach(e => {
      if (Array.isArray(e.tags)) {
        e.tags.forEach(tag => set.add(tag));
      }
    });
    return Array.from(set).sort();
  }, [encounters]);

  const filteredEncounters = useMemo(() => {
    return encounters.filter(e => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        e.title.toLowerCase().includes(q) ||
        (e.location && e.location.toLowerCase().includes(q)) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.tags && e.tags.some(t => t.toLowerCase().includes(q))) ||
        (e.npcs && e.npcs.some(n => n.name.toLowerCase().includes(q)));

      const matchesTag = selectedTag === null || (e.tags && e.tags.includes(selectedTag));

      return matchesSearch && matchesTag;
    });
  }, [encounters, search, selectedTag]);

  const handleOpenCreate = () => {
    sfx.playClick();
    setEditingEncounter(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (enc: Encounter) => {
    sfx.playClick();
    setEditingEncounter(enc);
    setIsModalOpen(true);
  };

  const getThreatBadge = (threat?: Encounter['threatLevel']) => {
    switch (threat) {
      case 'Low':
        return { label: 'НИЗКАЯ ОПАСНОСТЬ (MOOK)', cls: 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60' };
      case 'Medium':
        return { label: 'СРЕДНЯЯ (LIEUTENANT)', cls: 'bg-blue-950/80 text-cyan-300 border-blue-700/60' };
      case 'High':
        return { label: 'ВЫСОКАЯ (MINI-BOSS)', cls: 'bg-amber-950/80 text-amber-300 border-amber-600/60' };
      case 'Deadly':
        return { label: 'СМЕРТЕЛЬНАЯ (BOSS)', cls: 'bg-red-950/90 text-red-400 border-red-600/80' };
      default:
        return { label: 'ОСОБЫЙ', cls: 'bg-zinc-800 text-zinc-300 border-zinc-700' };
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Top Cyberpunk Banner */}
      <div className="bg-gradient-to-r from-red-950/60 via-zinc-900 to-zinc-900 border border-red-900/50 p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-red-500" />
            <h2 className="font-orbitron font-bold text-lg sm:text-xl text-white tracking-wide">
              ЗАГОТОВЛЕННЫЕ ЭНКАУНТЕРЫ ({encounters.length})
            </h2>
          </div>
          <p className="text-xs text-zinc-400 font-tech max-w-2xl">
            Сохраняйте боевые сцены заранее: настраивайте состав противников, их снаряжение и тактику. 
            Запускайте бой в один клик или вводите энкаунтер в качестве подкрепления (Волна 2) во время перестрелки!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-zinc-300 font-tech cursor-pointer bg-zinc-950 px-3 py-2 rounded border border-zinc-800 hover:border-zinc-700">
            <input
              type="checkbox"
              checked={includePartyOnStart}
              onChange={e => setIncludePartyOnStart(e.target.checked)}
              className="accent-red-600 rounded cursor-pointer"
            />
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Включать партию ({partyCount} чел.)</span>
          </label>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-orbitron font-bold text-xs rounded transition-all clip-cyber-btn shadow-lg shadow-red-900/30 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>СОЗДАТЬ ЭНКАУНТЕР</span>
          </button>
        </div>
      </div>

      {/* Search & Tag Filter */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по названию энкаунтера, локации, банде или описанию..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => {
                sfx.playClick();
                setSelectedTag(null);
              }}
              className={`px-3 py-1.5 rounded text-xs font-orbitron font-bold whitespace-nowrap transition ${
                selectedTag === null
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              ВСЕ ТЕГИ
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => {
                  sfx.playClick();
                  setSelectedTag(selectedTag === tag ? null : tag);
                }}
                className={`px-2.5 py-1.5 rounded text-xs font-tech font-bold whitespace-nowrap transition ${
                  selectedTag === tag
                    ? 'bg-red-950 border border-red-500 text-red-200'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Encounters Grid */}
      {filteredEncounters.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-xl p-8 space-y-3">
          <Skull className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="font-orbitron font-bold text-zinc-300 text-base">Энкаунтеры не найдены</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto font-tech">
            {search || selectedTag
              ? 'Попробуйте изменить поисковый запрос или сбросить фильтр тегов.'
              : 'Создайте ваш первый заготовленный энкаунтер к предстоящей сессии Cyberpunk RED!'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-orbitron font-bold text-xs rounded transition inline-flex items-center gap-1.5 clip-cyber-btn"
          >
            <Plus className="w-4 h-4" /> СОЗДАТЬ ПЕРВЫЙ ЭНКАУНТЕР
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredEncounters.map(encounter => {
            const threatBadge = getThreatBadge(encounter.threatLevel);
            const totalNpcs = encounter.npcs.reduce((acc, m) => acc + m.count, 0);

            return (
              <div
                key={encounter.id}
                className="bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700/80 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-lg transition group clip-cyber"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-orbitron font-bold uppercase tracking-wider border ${threatBadge.cls}`}>
                          {threatBadge.label}
                        </span>
                        {encounter.location && (
                          <span className="text-xs text-zinc-400 font-tech flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                            {encounter.location}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-orbitron font-bold text-white group-hover:text-red-400 transition leading-snug">
                        {encounter.title}
                      </h3>
                    </div>

                    {/* Quick Tools */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition shrink-0">
                      <button
                        onClick={() => {
                          sfx.playClick();
                          onDuplicateEncounter(encounter);
                        }}
                        title="Дублировать энкаунтер"
                        className="p-1.5 text-zinc-400 hover:text-amber-400 rounded hover:bg-zinc-800 transition"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(encounter)}
                        title="Редактировать энкаунтер"
                        className="p-1.5 text-zinc-400 hover:text-cyan-400 rounded hover:bg-zinc-800 transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Удалить заготовленный энкаунтер "${encounter.title}"?`)) {
                            sfx.playClick();
                            onDeleteEncounter(encounter.id);
                          }
                        }}
                        title="Удалить"
                        className="p-1.5 text-zinc-400 hover:text-red-400 rounded hover:bg-zinc-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Description / Notes */}
                  {encounter.description && (
                    <p className="text-xs text-zinc-400 line-clamp-2 mb-3 bg-zinc-950/70 p-2.5 rounded border border-zinc-800/60 font-tech">
                      {encounter.description}
                    </p>
                  )}

                  {/* NPCs breakdown */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 mb-1.5">
                      <span className="flex items-center gap-1.5 text-zinc-400 font-tech uppercase">
                        <Skull className="w-3.5 h-3.5 text-red-500" /> Состав ({totalNpcs}):
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {encounter.npcs.map(m => (
                        <div
                          key={m.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs text-zinc-200"
                        >
                          <span className="font-bold text-white">{m.name}</span>
                          <span className="px-1.5 py-0.2 bg-red-950 text-red-300 border border-red-800/80 rounded font-orbitron font-bold text-[10px]">
                            ×{m.count}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-tech">
                            (HP:{m.hpMax} ОС:{m.headSp}/{m.bodySp} РЕФ:{m.ref})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  {encounter.tags && encounter.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {encounter.tags.map(t => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded text-[10px] bg-zinc-950 text-zinc-400 border border-zinc-800 font-tech"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Launch Actions */}
                <div className="pt-3 border-t border-zinc-800 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      if (combatantsCount > 0) {
                        if (!confirm(`В активном бое уже есть участники (${combatantsCount} комбатантов). Перезапустить бой по этому энкаунтеру?`)) {
                          return;
                        }
                      }
                      sfx.playCritSuccess();
                      onStartCombat(encounter, includePartyOnStart);
                    }}
                    className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-500 text-white font-orbitron font-bold rounded text-xs shadow-md transition flex items-center justify-center gap-2 clip-cyber-btn"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>ЗАПУСТИТЬ ЭТОТ БОЙ</span>
                  </button>

                  {combatantsCount > 0 && (
                    <button
                      onClick={() => {
                        sfx.playHit();
                        onAddAsReinforcement(encounter);
                      }}
                      title="Добавить всех противников из этого энкаунтера к текущему идущему бою как подкрепление (Волна 2)"
                      className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-600/50 font-orbitron font-bold rounded text-xs transition flex items-center gap-1.5"
                    >
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      <span>+ В АКТИВНЫЙ БОЙ</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for create/edit */}
      <EncounterFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveEncounter}
        templates={templates}
        initialEncounter={editingEncounter}
      />
    </div>
  );
};
