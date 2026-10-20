import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Users, 
  Skull, 
  Network, 
  BookOpen, 
  Dices, 
  Download, 
  Upload, 
  Volume2, 
  VolumeX, 
  Sparkles 
} from 'lucide-react';
import { sfx } from '../utils/audio';
import { exportEntireGmDatabase } from '../utils/storage';

export type ActiveTab = 'combat' | 'chase' | 'party' | 'bestiary' | 'netrunning' | 'reference';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenDiceRoller: () => void;
  onOpenImportModal: () => void;
  partyCount: number;
  combatantCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenDiceRoller,
  onOpenImportModal,
  partyCount,
  combatantCount
}) => {
  const [isMuted, setIsMuted] = useState(sfx.getMuted());

  const toggleSound = () => {
    const next = !isMuted;
    sfx.setMuted(next);
    setIsMuted(next);
  };

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'combat', label: 'Боевой трекер', icon: <Skull className="w-4 h-4" />, badge: combatantCount },
    { id: 'chase', label: 'Погони (Hot Pursuit)', icon: <ShieldAlert className="w-4 h-4 text-amber-400" /> },
    { id: 'party', label: 'Партия игроков', icon: <Users className="w-4 h-4" />, badge: partyCount },
    { id: 'bestiary', label: 'Бестиарий и Банды', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'netrunning', label: 'Архитектура Сети', icon: <Network className="w-4 h-4" /> },
    { id: 'reference', label: 'Ширма ГМа & Генераторы', icon: <BookOpen className="w-4 h-4" /> }
  ];

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-red-900/40 shadow-xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-600 flex items-center justify-center font-orbitron font-black text-black text-xl clip-cyber shadow-[0_0_15px_rgba(239,68,68,0.5)]">
              CP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-orbitron font-black tracking-wider text-white text-base sm:text-lg">
                  CYBERPUNK <span className="text-red-500">RED</span>
                </span>
                <span className="text-[10px] font-tech px-1.5 py-0.5 rounded bg-red-950 border border-red-700/60 text-red-400 font-bold tracking-widest uppercase">
                  GM TOOLS
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 font-tech flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>NIGHT CITY OS // GM TERMINAL</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => {
                sfx.playClick();
                onOpenDiceRoller();
              }}
              title="Встроенный дайсроллер Cyberpunk RED"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-orbitron font-bold text-amber-300 bg-amber-950/40 border border-amber-600/50 hover:bg-amber-900/60 transition-all rounded clip-cyber-sm"
            >
              <Dices className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">ДАЙСРОЛЛЕР</span>
            </button>

            <button
              onClick={toggleSound}
              title={isMuted ? 'Включить звук' : 'Выключить звук'}
              className="p-2 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>

            <button
              onClick={() => {
                sfx.playClick();
                exportEntireGmDatabase();
              }}
              title="Экспорт базы данных ГМа в JSON файл"
              className="p-2 text-zinc-400 hover:text-emerald-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                sfx.playClick();
                onOpenImportModal();
              }}
              title="Импорт базы данных или персонажей из чарника Cyberpunk RED"
              className="p-2 text-zinc-400 hover:text-cyan-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded transition-colors"
            >
              <Upload className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1.5 -mb-px">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  sfx.playClick();
                  setActiveTab(item.id);
                }}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-orbitron font-bold whitespace-nowrap transition-all rounded-t border-b-2 ${
                  isActive
                    ? 'border-red-500 text-white bg-gradient-to-t from-red-950/60 to-transparent'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-1.5 py-0.2 text-[10px] font-tech font-bold rounded-full ${
                    isActive ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
