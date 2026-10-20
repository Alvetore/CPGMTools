import React, { useRef, useState } from 'react';
import { 
  Users, 
  Upload, 
  Plus, 
  Trash2, 
  Heart, 
  Shield, 
  Eye, 
  Sparkles, 
  Zap, 
  Swords, 
  RefreshCw,
  FileText
} from 'lucide-react';
import { PartyMember } from '../../types/party';
import { Character } from '../../types/character';
import { convertCharSheetToPartyMember } from '../../utils/storage';
import { sfx } from '../../utils/audio';

interface PartyViewProps {
  party: PartyMember[];
  setParty: React.Dispatch<React.SetStateAction<PartyMember[]>>;
  onAddPartyToCombat: () => void;
}

export const PartyView: React.FC<PartyViewProps> = ({
  party,
  setParty,
  onAddPartyToCombat
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [editingMember, setEditingMember] = useState<PartyMember | null>(null);

  // File import handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content);

          // Check if it's a single character or an array
          if (Array.isArray(parsed)) {
            const importedMembers = parsed.map((char: Character) => convertCharSheetToPartyMember(char));
            setParty(prev => [...prev, ...importedMembers]);
            sfx.playCritSuccess();
          } else if (parsed && typeof parsed === 'object') {
            // Check if it's an export of entire GM database or single character
            if (parsed.party && Array.isArray(parsed.party)) {
              setParty(prev => [...prev, ...parsed.party]);
            } else {
              const newMember = convertCharSheetToPartyMember(parsed as Character);
              setParty(prev => {
                // If member with same ID exists, update it, otherwise add
                const existingIdx = prev.findIndex(p => p.id === newMember.id || (p.name === newMember.name && p.handle === newMember.handle));
                if (existingIdx >= 0) {
                  const copy = [...prev];
                  copy[existingIdx] = newMember;
                  return copy;
                }
                return [...prev, newMember];
              });
            }
            sfx.playCritSuccess();
          }
        } catch (err) {
          console.error('Ошибка чтения JSON персонажа:', err);
          alert('Не удалось прочитать файл персонажа. Убедитесь, что это корректный JSON лист из CyberpunkCharSheetG.');
        }
      };
      reader.readAsText(file);
    });

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveMember = (id: string) => {
    if (confirm('Удалить персонажа из постоянной партии?')) {
      sfx.playClick();
      setParty(prev => prev.filter(p => p.id !== id));
    }
  };

  // Rest & Heal party (1 day of natural healing in CPR = BODY to HP, restore LUCK)
  const handleRestParty = () => {
    sfx.playCritSuccess();
    setParty(prev => prev.map(p => ({
      ...p,
      hpCurrent: Math.min(p.hpMax, p.hpCurrent + p.body),
      luckCurrent: p.luckMax,
      headSp: p.headSpMax,
      bodySp: p.bodySpMax
    })));
  };

  return (
    <div className="space-y-4">
      
      {/* Top Banner & Actions */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h2 className="font-orbitron font-bold text-white text-base">
              ПОСТОЯННАЯ ПАРТИЯ ИГРОКОВ
            </h2>
            <span className="text-xs font-tech px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 font-bold">
              {party.length} бегущих
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-tech mt-1">
            Импортируйте персонажей напрямую из интерактивного чарника <strong>CyberpunkCharSheetG</strong> в один клик!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json"
            multiple
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-orbitron font-bold text-xs rounded transition-all clip-cyber-sm shadow-md"
          >
            <Upload className="w-4 h-4" />
            <span>ИМПОРТ ИЗ ЧАРНИКА (.JSON)</span>
          </button>

          <button
            onClick={onAddPartyToCombat}
            disabled={party.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-orbitron font-bold text-xs rounded transition-all clip-cyber-sm shadow-md"
          >
            <Swords className="w-4 h-4" />
            <span>ОТПРАВИТЬ ПАРТИЮ В БОЙ</span>
          </button>

          <button
            onClick={handleRestParty}
            disabled={party.length === 0}
            title="Естественное исцеление (1 день): +ТЕЛО к HP, восстановление Удачи и ремонт брони"
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 font-tech font-bold text-xs rounded border border-zinc-700 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>ОТДЫХ И ИСЦЕЛЕНИЕ</span>
          </button>
        </div>
      </div>

      {/* Party Members Grid */}
      {party.length === 0 ? (
        <div className="bg-zinc-900/60 border border-dashed border-zinc-800 p-10 rounded-lg text-center space-y-3">
          <FileText className="w-12 h-12 text-zinc-600 mx-auto" />
          <h3 className="font-orbitron font-bold text-zinc-300 text-base">Партия пуста</h3>
          <p className="text-xs text-zinc-500 max-w-lg mx-auto font-tech">
            Попросите ваших игроков выгрузить JSON-файл их персонажа из <strong>CyberpunkCharSheetG</strong> (кнопка Экспорт в шапке чарника) и загрузите файлы сюда. Все статы, оружие, броня и здоровье подтянутся автоматически!
          </p>
          <div className="pt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-orbitron font-bold text-xs rounded clip-cyber-btn shadow-lg"
            >
              ВЫБРАТЬ JSON ФАЙЛЫ ЧАРНИКОВ
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {party.map((member) => (
            <div
              key={member.id}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3 hover:border-zinc-700 transition-all shadow-md relative group clip-cyber-sm"
            >
              {/* Header: Name, Handle, Role */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-orbitron font-black text-white text-base">
                    {member.name}
                  </h3>
                  <div className="text-xs text-zinc-400 font-tech">
                    «<span className="text-cyan-400 font-bold">{member.handle}</span>» | Роль: <strong className="text-amber-400">{member.role}</strong>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveMember(member.id)}
                  title="Удалить из партии"
                  className="text-zinc-600 hover:text-red-400 p-1 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Core Stats Bar */}
              <div className="grid grid-cols-5 gap-1 bg-zinc-950 p-2 rounded border border-zinc-800 text-center font-tech text-xs">
                <div>
                  <div className="text-[10px] text-zinc-500">РЕФ</div>
                  <strong className="text-cyan-400">{member.ref}</strong>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500">ЛОВ</div>
                  <strong className="text-cyan-400">{member.dex}</strong>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500">СКО</div>
                  <strong className="text-cyan-400">{member.move}</strong>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500">ТЕЛО</div>
                  <strong className="text-cyan-400">{member.body}</strong>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500">УДАЧА</div>
                  <strong className="text-amber-400">{member.luckCurrent}/{member.luckMax}</strong>
                </div>
              </div>

              {/* Health and Armor Indicators */}
              <div className="space-y-1.5 text-xs font-tech">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-red-500" />
                    <span>Здоровье (HP):</span>
                  </span>
                  <strong className="text-white">{member.hpCurrent} / {member.hpMax}</strong>
                </div>

                <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
                  <div
                    className={`h-full ${
                      member.hpCurrent <= member.hpMax / 2 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(0, Math.min(100, (member.hpCurrent / member.hpMax) * 100))}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="bg-zinc-950 p-1.5 rounded border border-zinc-800 flex items-center justify-between">
                    <span className="text-zinc-500 text-[11px]">Голова ОС:</span>
                    <strong className="text-cyan-300 font-orbitron">{member.headSp} / {member.headSpMax}</strong>
                  </div>
                  <div className="bg-zinc-950 p-1.5 rounded border border-zinc-800 flex items-center justify-between">
                    <span className="text-zinc-500 text-[11px]">Тело ОС:</span>
                    <strong className="text-cyan-300 font-orbitron">{member.bodySp} / {member.bodySpMax}</strong>
                  </div>
                </div>

                <div className="bg-zinc-950 p-1.5 rounded border border-zinc-800 flex items-center justify-between">
                  <span className="text-zinc-500 text-[11px] flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>Пассивное Восприятие:</span>
                  </span>
                  <strong className="text-amber-300 font-orbitron">{member.passivePerception}</strong>
                </div>
              </div>

              {/* Weapons list preview */}
              {member.weapons && member.weapons.length > 0 && (
                <div className="pt-1 border-t border-zinc-800/80">
                  <div className="text-[10px] font-tech text-zinc-500 uppercase mb-1">Вооружение:</div>
                  <div className="space-y-1">
                    {member.weapons.slice(0, 2).map((w, i) => (
                      <div key={i} className="text-[11px] font-tech text-zinc-300 flex items-center justify-between bg-zinc-950 px-2 py-0.5 rounded">
                        <span>{w.name}</span>
                        <strong className="text-amber-400">{w.damage}</strong>
                      </div>
                    ))}
                    {member.weapons.length > 2 && (
                      <div className="text-[10px] text-zinc-500 font-tech text-right">
                        + еще {member.weapons.length - 2} предм.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
