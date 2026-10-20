import React, { useRef } from 'react';
import { Download, Upload, X, AlertTriangle, RefreshCw, FileText, CheckCircle } from 'lucide-react';
import { exportEntireGmDatabase, saveStoredData, STORAGE_KEYS, convertCharSheetToPartyMember } from '../../utils/storage';
import { PartyMember } from '../../types/party';
import { Character } from '../../types/character';
import { sfx } from '../../utils/audio';

interface DataManagementModalProps {
  onClose: () => void;
  onDataRestored: () => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  onClose,
  onDataRestored
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);

        // Check if it's a full backup
        if (data.exportVersion) {
          if (data.party) saveStoredData(STORAGE_KEYS.PARTY, data.party);
          if (data.combat) saveStoredData(STORAGE_KEYS.COMBAT, data.combat);
          if (data.customBestiary) saveStoredData(STORAGE_KEYS.CUSTOM_BESTIARY, data.customBestiary);
          if (data.encounters) saveStoredData(STORAGE_KEYS.ENCOUNTERS, data.encounters);
          if (data.networks) saveStoredData(STORAGE_KEYS.NETWORKS, data.networks);
          if (data.gigs) saveStoredData(STORAGE_KEYS.GIGS, data.gigs);

          sfx.playCritSuccess();
          alert('Резервная копия базы ГМа успешно восстановлена!');
          onDataRestored();
          onClose();
        } else if (data.stats && data.armor) {
          // Single character from Cyberpunk RED CharSheet
          const member = convertCharSheetToPartyMember(data as Character);
          const currentParty = JSON.parse(localStorage.getItem(STORAGE_KEYS.PARTY) || '[]') as PartyMember[];
          currentParty.push(member);
          saveStoredData(STORAGE_KEYS.PARTY, currentParty);

          sfx.playCritSuccess();
          alert(`Персонаж ${member.name} (${member.handle}) успешно импортирован в партию!`);
          onDataRestored();
          onClose();
        } else {
          alert('Неизвестный формат файла. Убедитесь, что это бэкап CPGMTools или лист из Cyberpunk RED CharSheet.');
        }
      } catch (err) {
        console.error('Ошибка импорта:', err);
        alert('Ошибка при чтении файла JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetAllData = () => {
    if (confirm('ВНИМАНИЕ: Это полностью очистит базу данных ГМа (партию, текущий бой, кастомных NPC). Продолжить?')) {
      localStorage.clear();
      sfx.playClick();
      alert('База данных очищена.');
      onDataRestored();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg max-w-lg w-full p-5 space-y-4 clip-cyber shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="font-orbitron font-bold text-white text-base flex items-center gap-2">
            <Upload className="w-5 h-5 text-cyan-400" />
            <span>УПРАВЛЕНИЕ ДАННЫМИ И БЭКАП</span>
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-zinc-400 font-tech">
          Все ваши данные (состав партии, активный бой, кастомные бандиты и сети) сохраняются локально в вашем браузере (LocalStorage). Вы можете экспортировать их в единый JSON файл и перенести на любой компьютер или планшет.
        </p>

        {/* Buttons */}
        <div className="space-y-3 pt-2">
          {/* Export */}
          <button
            onClick={() => {
              sfx.playClick();
              exportEntireGmDatabase();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-zinc-950 border border-emerald-600/70 hover:bg-emerald-950/40 text-emerald-300 font-orbitron font-bold text-xs rounded transition-all clip-cyber-sm shadow"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>СКАЧАТЬ ПОЛНЫЙ БЭКАП БАЗЫ (.JSON)</span>
          </button>

          {/* Import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-zinc-950 border border-cyan-600/70 hover:bg-cyan-950/40 text-cyan-300 font-orbitron font-bold text-xs rounded transition-all clip-cyber-sm shadow"
          >
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>ЗАГРУЗИТЬ БЭКАП ИЛИ ЧАРНИК (.JSON)</span>
          </button>
        </div>

        {/* Reset Warning */}
        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500 font-tech">Сброс к заводским настройкам</span>
          <button
            onClick={handleResetAllData}
            className="text-xs text-red-400 hover:text-red-300 font-tech underline"
          >
            Очистить все данные
          </button>
        </div>
      </div>
    </div>
  );
};
