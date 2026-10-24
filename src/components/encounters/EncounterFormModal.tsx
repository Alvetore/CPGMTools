import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Skull, 
  MapPin, 
  Tag, 
  ShieldAlert, 
  Minus,
  Swords,
  Crosshair,
  Sparkles
} from 'lucide-react';
import { Encounter, EncounterNpcItem, NpcTemplate, ThreatLevel } from '../../types/bestiary';
import { CombatantType } from '../../types/combat';
import { sfx } from '../../utils/audio';
import { NpcSkillsEditor } from '../bestiary/NpcSkillsEditor';

interface EncounterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (encounter: Encounter) => void;
  templates: NpcTemplate[];
  initialEncounter?: Encounter | null;
}

const PRESET_TAG_SUGGESTIONS = [
  'Засада', 'Улица', 'Корпо', 'Босс', 'Погоня', 
  'DangerGal', 'NCPD', 'Bozos', 'Мальстрём', 'Piranhas', 'Арасака'
];

export const EncounterFormModal: React.FC<EncounterFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  templates,
  initialEncounter
}) => {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [threatLevel, setThreatLevel] = useState<'Low' | 'Medium' | 'High' | 'Deadly'>('Medium');
  const [tags, setTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [npcs, setNpcs] = useState<EncounterNpcItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialEncounter) {
      setTitle(initialEncounter.title);
      setLocation(initialEncounter.location || '');
      setDescription(initialEncounter.description || '');
      setThreatLevel(initialEncounter.threatLevel || 'Medium');
      setTags([...initialEncounter.tags]);
      setNpcs([...initialEncounter.npcs]);
    } else {
      setTitle('');
      setLocation('');
      setDescription('');
      setThreatLevel('Medium');
      setTags([]);
      setNpcs([]);
    }
    if (templates.length > 0) {
      setSelectedTemplateId(templates[0].id);
    }
    setError('');
  }, [initialEncounter, isOpen, templates]);

  if (!isOpen) return null;

  // Add NPC from Bestiary template
  const handleAddFromTemplate = () => {
    const tpl = templates.find(t => t.id === selectedTemplateId) || templates[0];
    if (!tpl) return;

    sfx.playClick();
    // Check if already in list
    const existingIndex = npcs.findIndex(n => n.templateId === tpl.id);
    if (existingIndex !== -1) {
      setNpcs(prev => prev.map((n, i) => i === existingIndex ? { ...n, count: n.count + 1 } : n));
      return;
    }

    const newNpc: EncounterNpcItem = {
      id: `enc-npc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      templateId: tpl.id,
      name: tpl.nameRu,
      count: 1,
      threatLevel: tpl.threatLevel,
      type: tpl.threatLevel === 'Drone' ? 'drone' : 'enemy',
      hpMax: tpl.hpMax,
      headSp: tpl.headSp,
      bodySp: tpl.bodySp,
      ref: tpl.stats.REF,
      dex: tpl.stats.DEX,
      move: tpl.stats.MOVE,
      body: tpl.stats.BODY,
      weapons: [...(tpl.weapons || [])],
      skills: tpl.skills.map(s => ({ ...s })),
      notes: tpl.tactics || tpl.description || ''
    };

    setNpcs(prev => [...prev, newNpc]);
  };

  // Add custom ad-hoc NPC
  const handleAddCustomNpc = () => {
    sfx.playClick();
    const newNpc: EncounterNpcItem = {
      id: `enc-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: 'Уличный боевик',
      count: 1,
      threatLevel: 'Mook',
      type: 'enemy',
      hpMax: 30,
      headSp: 7,
      bodySp: 7,
      ref: 6,
      dex: 6,
      move: 5,
      body: 6,
      weapons: [
        {
          id: `w-c-${Date.now()}`,
          name: 'Тяжёлый пистолет',
          category: 'Heavy Pistol',
          damage: '3d6',
          standardRof: 2,
          magCapacity: 8,
          currentAmmo: 8,
          ammoType: 'Пистолетные'
        }
      ],
      notes: ''
    };

    setNpcs(prev => [...prev, newNpc]);
  };

  const handleUpdateNpc = (id: string, updates: Partial<EncounterNpcItem>) => {
    setNpcs(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const handleRemoveNpc = (id: string) => {
    sfx.playClick();
    setNpcs(prev => prev.filter(n => n.id !== id));
  };

  const handleAddTag = (tagText: string) => {
    const clean = tagText.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setCustomTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Введите название энкаунтера!');
      return;
    }
    if (npcs.length === 0) {
      setError('Добавьте хотя бы одного NPC или противника в энкаунтер!');
      return;
    }
    if (npcs.some(n => n.skills?.some(s => !s.nameRu.trim() || !Number.isInteger(s.base) || s.base < 0))) {
      setError('У каждого навыка NPC должны быть название и целая неотрицательная база.');
      return;
    }

    const encounterToSave: Encounter = {
      id: initialEncounter ? initialEncounter.id : `enc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      location: location.trim() || undefined,
      description: description.trim() || undefined,
      threatLevel,
      tags,
      npcs,
      createdAt: initialEncounter ? initialEncounter.createdAt : Date.now(),
      updatedAt: Date.now()
    };

    sfx.playCritSuccess();
    onSave(encounterToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in">
      <div className="bg-zinc-900 border border-red-900/60 rounded-xl max-w-3xl w-full p-3.5 sm:p-6 space-y-4 sm:space-y-5 my-auto max-h-[90dvh] overflow-y-auto shadow-2xl clip-cyber">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-red-500" />
            <h3 className="font-orbitron font-bold text-white text-lg">
              {initialEncounter ? 'РЕДАКТИРОВАТЬ ЭНКАУНТЕР' : 'НОВЫЙ ЗАГОТОВЛЕННЫЙ ЭНКАУНТЕР'}
            </h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-950/70 border border-red-600 p-2.5 rounded text-xs text-red-300 font-bold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-tech text-zinc-400 uppercase">Название боевой сцены *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="например: Засада банды Bozos у клуба Totentanz"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-500 rounded p-2 text-sm text-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-tech text-zinc-400 uppercase">Уровень опасности</label>
              <select
                value={threatLevel}
                onChange={e => setThreatLevel(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-500 rounded p-2 text-sm text-white font-orbitron"
              >
                <option value="Low">Низкая (Mook / Шпана)</option>
                <option value="Medium">Средняя (Lieutenant / Опытные)</option>
                <option value="High">Высокая (Mini-Boss / Элита)</option>
                <option value="Deadly">Смертельная (Boss / Киберпсихи)</option>
              </select>
            </div>
          </div>

          {/* Location & Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-tech text-zinc-400 uppercase flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-zinc-500" /> Локация (место действия)
              </label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="например: Нортсайд, заброшенный ангар №7"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-500 rounded p-2 text-sm text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-tech text-zinc-400 uppercase flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-zinc-500" /> Теги энкаунтера
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={customTagInput}
                  onChange={e => setCustomTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag(customTagInput);
                    }
                  }}
                  placeholder="Добавить тег..."
                  className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-red-500 rounded px-2.5 py-1.5 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag(customTagInput)}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Tag Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-red-950/60 border border-red-800 text-red-300"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-white"
                >
                  ×
                </button>
              </span>
            ))}
            {/* Tag suggestions */}
            {PRESET_TAG_SUGGESTIONS.filter(st => !tags.includes(st)).slice(0, 5).map(suggestion => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleAddTag(suggestion)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 border border-zinc-700"
              >
                +{suggestion}
              </button>
            ))}
          </div>

          {/* Description / Tactics */}
          <div className="space-y-1">
            <label className="text-xs font-tech text-zinc-400 uppercase">Описание сцены / Тактика противников</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Тактические заметки: используют дымовые гранаты, нападают с фланга, при падении здоровья отступают..."
              rows={2}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-red-500 rounded p-2 text-xs text-white resize-none"
            />
          </div>

          {/* NPCs in Encounter Section */}
          <div className="border-t border-zinc-800 pt-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Skull className="w-4 h-4 text-red-500" />
                <span className="font-orbitron font-bold text-sm text-white">СОСТАВ ПРОТИВНИКОВ И NPC ({npcs.reduce((a, b) => a + b.count, 0)})</span>
              </div>

              {/* Add buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedTemplateId}
                  onChange={e => setSelectedTemplateId(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-white max-w-[200px]"
                >
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.nameRu} ({t.threatLevel})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAddFromTemplate}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-orbitron font-bold text-xs rounded flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Из бестиария
                </button>

                <button
                  type="button"
                  onClick={handleAddCustomNpc}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-orbitron font-bold text-xs rounded border border-zinc-700"
                >
                  + Свой NPC
                </button>
              </div>
            </div>

            {/* List of NPCs */}
            {npcs.length === 0 ? (
              <div className="text-center py-6 bg-zinc-950/60 border border-dashed border-zinc-800 rounded-lg text-zinc-500 text-xs font-tech">
                В энкаунтере пока нет участников. Выберите шаблон из бестиария или добавьте кастомного противника.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {npcs.map(npc => (
                  <div
                    key={npc.id}
                    className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={npc.name}
                          onChange={e => handleUpdateNpc(npc.id, { name: e.target.value })}
                          className="bg-zinc-900 border border-zinc-700 rounded px-2 py-0.5 text-xs font-bold text-white max-w-[200px]"
                        />
                        <select
                          value={npc.threatLevel}
                          onChange={e => handleUpdateNpc(npc.id, { threatLevel: e.target.value as ThreatLevel })}
                          className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-[10px] text-zinc-300 font-orbitron"
                        >
                          <option value="Mook">Mook</option>
                          <option value="Lieutenant">Lieutenant</option>
                          <option value="Boss">Boss</option>
                          <option value="Drone">Drone</option>
                        </select>
                        <select
                          value={npc.type || 'enemy'}
                          onChange={e => handleUpdateNpc(npc.id, { type: e.target.value as CombatantType })}
                          className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-[10px] text-zinc-300 font-orbitron"
                        >
                          <option value="enemy">Враг</option>
                          <option value="ally">Союзник</option>
                          <option value="drone">Дрон</option>
                          <option value="neutral">Нейтрал</option>
                        </select>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400 font-tech">
                        <span>HP: <strong className="text-white">{npc.hpMax}</strong></span>
                        <span>ОС Голова: <strong className="text-cyan-400">{npc.headSp}</strong></span>
                        <span>ОС Тело: <strong className="text-cyan-400">{npc.bodySp}</strong></span>
                        <span>РЕФ: <strong className="text-amber-400">{npc.ref}</strong></span>
                        <span>ДЕЛ: <strong className="text-amber-400">{npc.dex}</strong></span>
                        <span>ТЕЛО: <strong className="text-amber-400">{npc.body}</strong></span>
                      </div>
                      <NpcSkillsEditor skills={npc.skills ?? []} onChange={skills => handleUpdateNpc(npc.id, { skills })} />
                    </div>

                    {/* Count & Remove */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5">
                        <span className="text-[10px] text-zinc-500 font-tech uppercase">Кол-во:</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateNpc(npc.id, { count: Math.max(1, npc.count - 1) })}
                          className="p-1 hover:text-red-400 text-zinc-400"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-orbitron font-bold text-white px-1">
                          {npc.count}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateNpc(npc.id, { count: npc.count + 1 })}
                          className="p-1 hover:text-emerald-400 text-zinc-400"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveNpc(npc.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 rounded hover:bg-zinc-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="border-t border-zinc-800 pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-orbitron text-xs rounded"
            >
              ОТМЕНА
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-orbitron font-bold text-xs rounded clip-cyber-btn shadow-lg"
            >
              {initialEncounter ? 'СОХРАНИТЬ ИЗМЕНЕНИЯ' : 'СОЗДАТЬ ЭНКАУНТЕР'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
