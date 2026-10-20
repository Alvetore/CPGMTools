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
  Swords, 
  RefreshCw,
  FileText,
  Edit2,
  X
} from 'lucide-react';
import { PartyMember } from '../../types/party';
import { Character, Weapon } from '../../types/character';
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

  // Manual Add / Edit Modal state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [handle, setHandle] = useState<string>('');
  const [role, setRole] = useState<string>('Solo');
  const [ref, setRef] = useState<number>(8);
  const [dex, setDex] = useState<number>(7);
  const [move, setMove] = useState<number>(6);
  const [body, setBody] = useState<number>(7);
  const [will, setWill] = useState<number>(6);
  const [luck, setLuck] = useState<number>(5);
  const [hpMax, setHpMax] = useState<number>(45);
  const [headSp, setHeadSp] = useState<number>(11);
  const [bodySp, setBodySp] = useState<number>(11);
  const [passivePerception, setPassivePerception] = useState<number>(13);
  const [weaponName, setWeaponName] = useState<string>('Очень тяжёлый пистолет');
  const [weaponDamage, setWeaponDamage] = useState<string>('4d6');
  const [notes, setNotes] = useState<string>('');

  const openCreateModal = () => {
    setEditingId(null);
    setName('');
    setHandle('');
    setRole('Solo');
    setRef(8);
    setDex(7);
    setMove(6);
    setBody(7);
    setWill(6);
    setLuck(5);
    setHpMax(45);
    setHeadSp(11);
    setBodySp(11);
    setPassivePerception(13);
    setWeaponName('Очень тяжёлый пистолет');
    setWeaponDamage('4d6');
    setNotes('');
    setIsFormOpen(true);
  };

  const openEditModal = (member: PartyMember) => {
    setEditingId(member.id);
    setName(member.name);
    setHandle(member.handle);
    setRole(member.role);
    setRef(member.ref);
    setDex(member.dex);
    setMove(member.move);
    setBody(member.body);
    setWill(6);
    setLuck(member.luckMax);
    setHpMax(member.hpMax);
    setHeadSp(member.headSpMax);
    setBodySp(member.bodySpMax);
    setPassivePerception(member.passivePerception);
    const mainW = member.weapons[0];
    setWeaponName(mainW?.name || 'Очень тяжёлый пистолет');
    setWeaponDamage(mainW?.damage || '4d6');
    setNotes(member.notes || '');
    setIsFormOpen(true);
  };

  const handleAutoCalcHp = () => {
    const calc = 10 + 5 * Math.ceil((body + will) / 2);
    setHpMax(calc);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const weaponsList: Weapon[] = [
      {
        id: `w-${Date.now()}`,
        name: weaponName.trim() || 'Очень тяжёлый пистолет',
        category: 'Heavy Pistol',
        damage: weaponDamage.trim() || '4d6',
        standardRof: 1,
        magCapacity: 8,
        currentAmmo: 8,
        ammoType: 'Стандартные'
      }
    ];

    if (editingId) {
      // Update
      setParty(prev => prev.map(m => m.id === editingId ? {
        ...m,
        name: name.trim(),
        handle: handle.trim() || name.trim(),
        role,
        ref,
        dex,
        move,
        body,
        luckMax: luck,
        luckCurrent: Math.min(m.luckCurrent, luck),
        hpMax,
        hpCurrent: Math.min(m.hpCurrent, hpMax),
        headSp: Math.min(m.headSp, headSp),
        headSpMax: headSp,
        bodySp: Math.min(m.bodySp, bodySp),
        bodySpMax: bodySp,
        passivePerception,
        weapons: weaponsList,
        notes
      } : m));
    } else {
      // Create new
      const newMember: PartyMember = {
        id: `party-${Date.now()}`,
        name: name.trim(),
        handle: handle.trim() || name.trim(),
        role,
        hpMax,
        hpCurrent: hpMax,
        headSp,
        headSpMax: headSp,
        bodySp,
        bodySpMax: bodySp,
        ref,
        dex,
        move,
        body,
        emp: 5,
        humanity: 50,
        luckMax: luck,
        luckCurrent: luck,
        passivePerception,
        weapons: weaponsList,
        notes
      };
      setParty(prev => [...prev, newMember]);
    }

    sfx.playCritSuccess();
    setIsFormOpen(false);
  };

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

          if (Array.isArray(parsed)) {
            const importedMembers = parsed.map((char: Character) => convertCharSheetToPartyMember(char));
            setParty(prev => [...prev, ...importedMembers]);
            sfx.playCritSuccess();
          } else if (parsed && typeof parsed === 'object') {
            if (parsed.party && Array.isArray(parsed.party)) {
              setParty(prev => [...prev, ...parsed.party]);
            } else {
              const newMember = convertCharSheetToPartyMember(parsed as Character);
              setParty(prev => {
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
          alert('Не удалось прочитать файл персонажа. Убедитесь, что это корректный JSON лист из Cyberpunk RED CharSheet.');
        }
      };
      reader.readAsText(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveMember = (id: string) => {
    if (confirm('Удалить персонажа из постоянной партии?')) {
      sfx.playClick();
      setParty(prev => prev.filter(p => p.id !== id));
    }
  };

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
            Добавляйте персонажей через простую форму основных параметров или загружайте JSON-файлы из{' '}
            <a href="https://alvetore.github.io/CyberpunkREDCharSheet/" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-bold hover:text-cyan-300">
              Cyberpunk RED CharSheet
            </a>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Manual Add Button */}
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-orbitron font-bold text-xs rounded transition-all clip-cyber-sm shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>ДОБАВИТЬ ВРУЧНУЮ</span>
          </button>

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
            Создайте персонажа через быструю форму основных параметров прямо сейчас или загрузите JSON-файл из чарника!
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={openCreateModal}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-orbitron font-bold text-xs rounded clip-cyber-btn shadow-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>СОЗДАТЬ ПЕРСОНАЖА ВРУЧНУЮ</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-orbitron font-bold text-xs rounded clip-cyber-btn shadow-lg flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>ИМПОРТИРОВАТЬ JSON</span>
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

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(member)}
                    title="Редактировать параметры"
                    className="text-zinc-500 hover:text-amber-400 p-1 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    title="Удалить из партии"
                    className="text-zinc-600 hover:text-red-400 p-1 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
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
                    {member.weapons.map((w, i) => (
                      <div key={i} className="text-[11px] font-tech text-zinc-300 flex items-center justify-between bg-zinc-950 px-2 py-0.5 rounded">
                        <span>{w.name}</span>
                        <strong className="text-amber-400">{w.damage}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Manual Party Member Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <form 
            onSubmit={handleSaveMember}
            className="bg-zinc-900 border border-emerald-600/70 rounded-lg max-w-lg w-full max-h-[92vh] overflow-y-auto p-5 space-y-4 clip-cyber shadow-2xl text-xs font-tech"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-orbitron font-bold text-white text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <span>{editingId ? 'РЕДАКТИРОВАТЬ ПЕРСОНАЖА' : 'ДОБАВИТЬ ПЕРСОНАЖА В ПАРТИЮ'}</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setIsFormOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Имя персонажа *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Винсент"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-white font-bold outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Позывной / Кличка</label>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="Ви"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Роль</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-white outline-none focus:border-emerald-500"
                >
                  {['Solo', 'Netrunner', 'Tech', 'Medtech', 'Rockerboy', 'Fixer', 'Nomad', 'Lawman', 'Exec', 'Media'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Core Stats */}
            <div>
              <span className="text-[10px] text-zinc-500 uppercase block mb-1.5 font-bold">Характеристики (Stats):</span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 block">РЕФ (REF)</span>
                  <input
                    type="number"
                    value={ref}
                    onChange={(e) => setRef(parseInt(e.target.value) || 2)}
                    className="w-full bg-transparent text-center font-orbitron font-bold text-cyan-400 text-sm outline-none"
                  />
                </div>
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 block">ЛОВ (DEX)</span>
                  <input
                    type="number"
                    value={dex}
                    onChange={(e) => setDex(parseInt(e.target.value) || 2)}
                    className="w-full bg-transparent text-center font-orbitron font-bold text-cyan-400 text-sm outline-none"
                  />
                </div>
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 block">СКО (MOVE)</span>
                  <input
                    type="number"
                    value={move}
                    onChange={(e) => setMove(parseInt(e.target.value) || 2)}
                    className="w-full bg-transparent text-center font-orbitron font-bold text-cyan-400 text-sm outline-none"
                  />
                </div>
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 block">ТЕЛО (BODY)</span>
                  <input
                    type="number"
                    value={body}
                    onChange={(e) => setBody(parseInt(e.target.value) || 2)}
                    className="w-full bg-transparent text-center font-orbitron font-bold text-cyan-400 text-sm outline-none"
                  />
                </div>
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 block">ВОЛЯ (WILL)</span>
                  <input
                    type="number"
                    value={will}
                    onChange={(e) => setWill(parseInt(e.target.value) || 2)}
                    className="w-full bg-transparent text-center font-orbitron font-bold text-cyan-400 text-sm outline-none"
                  />
                </div>
                <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 block">УДАЧА</span>
                  <input
                    type="number"
                    value={luck}
                    onChange={(e) => setLuck(parseInt(e.target.value) || 0)}
                    className="w-full bg-transparent text-center font-orbitron font-bold text-amber-400 text-sm outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Health & Perception */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-950 p-3 rounded border border-zinc-800">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-zinc-400 text-[10px] uppercase">Максимальное здоровье (HP)</label>
                  <button
                    type="button"
                    onClick={handleAutoCalcHp}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 underline"
                  >
                    Авторасчет (ТЕЛО+ВОЛЯ)
                  </button>
                </div>
                <input
                  type="number"
                  value={hpMax}
                  onChange={(e) => setHpMax(parseInt(e.target.value) || 10)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 text-white font-orbitron font-bold"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Пассивное восприятие (ИНТ + Навык)</label>
                <input
                  type="number"
                  value={passivePerception}
                  onChange={(e) => setPassivePerception(parseInt(e.target.value) || 10)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 text-amber-300 font-orbitron font-bold"
                />
              </div>
            </div>

            {/* Armor SP */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Броня головы (Head SP)</label>
                <input
                  type="number"
                  value={headSp}
                  onChange={(e) => setHeadSp(parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-cyan-400 font-orbitron font-bold"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Броня тела (Body SP)</label>
                <input
                  type="number"
                  value={bodySp}
                  onChange={(e) => setBodySp(parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-cyan-400 font-orbitron font-bold"
                />
              </div>
            </div>

            {/* Weapon & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Основное оружие</label>
                <input
                  type="text"
                  value={weaponName}
                  onChange={(e) => setWeaponName(e.target.value)}
                  placeholder="Очень тяжёлый пистолет"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Урон оружия (например, 3d6, 4d6, 5d6)</label>
                <input
                  type="text"
                  value={weaponDamage}
                  onChange={(e) => setWeaponDamage(e.target.value)}
                  placeholder="4d6"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-amber-400 font-orbitron font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1 uppercase text-[10px]">Краткие заметки / Снаряжение</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Керензиков, патроны AP..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1 text-white"
              />
            </div>

            {/* Submit buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-3 py-1.5 text-zinc-400 hover:text-white"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-orbitron font-bold text-xs rounded clip-cyber-sm shadow"
              >
                {editingId ? 'СОХРАНИТЬ ИЗМЕНЕНИЯ' : 'ДОБАВИТЬ В ПАРТИЮ'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
