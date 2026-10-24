import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { NpcTemplate } from '../../types/bestiary';

interface NpcSkillsEditorProps {
  skills: NpcTemplate['skills'];
  onChange: (skills: NpcTemplate['skills']) => void;
}

export const NpcSkillsEditor: React.FC<NpcSkillsEditorProps> = ({ skills, onChange }) => (
  <fieldset className="space-y-2 border border-zinc-800 rounded p-3">
    <legend className="px-1 text-xs text-emerald-400 font-bold">Навыки NPC</legend>
    <p className="text-[11px] text-zinc-400">База — готовая сумма STAT + уровень навыка, без d10. Например, REF 6 + Handgun 4 = база 10. Введите свои числа; изменение характеристик их не пересчитывает.</p>
    {skills.map((skill, index) => (
      <div key={index} className="flex items-end gap-2">
        <label className="flex-1 min-w-0 text-[11px] text-zinc-400">Название навыка
          <input aria-label={`Название навыка ${index + 1}`} required value={skill.nameRu}
            onChange={e => onChange(skills.map((s, i) => i === index ? { ...s, nameRu: e.target.value } : s))}
            placeholder="Например, Восприятие"
            className="block w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-white" />
        </label>
        <label className="w-24 shrink-0 text-[11px] text-zinc-400">База
          <input aria-label={`База навыка ${index + 1}`} type="number" required min="0" step="1"
            value={Number.isFinite(skill.base) ? skill.base : ''}
            onChange={e => onChange(skills.map((s, i) => i === index ? { ...s, base: e.target.value === '' ? NaN : Number(e.target.value) } : s))}
            className="block w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-amber-300" />
        </label>
        <button type="button" aria-label={`Удалить навык ${index + 1}`} onClick={() => onChange(skills.filter((_, i) => i !== index))}
          className="p-2 text-zinc-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
      </div>
    ))}
    <button type="button" onClick={() => onChange([...skills, { nameRu: '', base: 0 }])}
      className="flex items-center gap-1 border border-zinc-700 rounded px-2 py-1.5 text-xs text-emerald-300">
      <Plus className="w-3.5 h-3.5" />Добавить навык
    </button>
  </fieldset>
);
