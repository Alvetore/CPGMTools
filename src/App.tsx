import React, { useState, useEffect } from 'react';
import { Header, ActiveTab } from './components/Header';
import { CombatTrackerView } from './components/combat/CombatTrackerView';
import { ChaseTrackerView } from './components/chase/ChaseTrackerView';
import { PartyView } from './components/party/PartyView';
import { BestiaryView } from './components/bestiary/BestiaryView';
import { NetArchitectureView } from './components/netrun/NetArchitectureView';
import { GMReferenceView } from './components/reference/GMReferenceView';
import { DiceRollerModal } from './components/common/DiceRollerModal';
import { DataManagementModal } from './components/common/DataManagementModal';

import { PartyMember } from './types/party';
import { ActiveCombatState, Combatant } from './types/combat';
import { NpcTemplate } from './types/bestiary';
import { 
  loadStoredData, 
  saveStoredData, 
  STORAGE_KEYS, 
  partyMemberToCombatant 
} from './utils/storage';
import { sfx } from './utils/audio';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('combat');

  // Party state
  const [party, setParty] = useState<PartyMember[]>(() => 
    loadStoredData<PartyMember[]>(STORAGE_KEYS.PARTY, [])
  );

  // Combat state
  const [combatState, setCombatState] = useState<ActiveCombatState>(() => 
    loadStoredData<ActiveCombatState>(STORAGE_KEYS.COMBAT, {
      isActive: false,
      round: 1,
      currentTurnIndex: 0,
      combatants: [],
      log: []
    })
  );

  // Custom bestiary state
  const [customBestiary, setCustomBestiary] = useState<NpcTemplate[]>(() => 
    loadStoredData<NpcTemplate[]>(STORAGE_KEYS.CUSTOM_BESTIARY, [])
  );

  // Modals
  const [isDiceModalOpen, setIsDiceModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  // Auto-save to LocalStorage
  useEffect(() => {
    saveStoredData(STORAGE_KEYS.PARTY, party);
  }, [party]);

  useEffect(() => {
    saveStoredData(STORAGE_KEYS.COMBAT, combatState);
  }, [combatState]);

  useEffect(() => {
    saveStoredData(STORAGE_KEYS.CUSTOM_BESTIARY, customBestiary);
  }, [customBestiary]);

  // Reload state after backup restoration
  const reloadData = () => {
    setParty(loadStoredData<PartyMember[]>(STORAGE_KEYS.PARTY, []));
    setCombatState(loadStoredData<ActiveCombatState>(STORAGE_KEYS.COMBAT, {
      isActive: false,
      round: 1,
      currentTurnIndex: 0,
      combatants: [],
      log: []
    }));
    setCustomBestiary(loadStoredData<NpcTemplate[]>(STORAGE_KEYS.CUSTOM_BESTIARY, []));
  };

  // Add party to combat
  const handleAddPartyToCombat = () => {
    if (party.length === 0) {
      alert('В партии пока нет персонажей. Загрузите их на вкладке «Партия игроков» из чарника!');
      return;
    }

    sfx.playCritSuccess();
    const newCombatants: Combatant[] = party.map(member => partyMemberToCombatant(member, 0));

    // Filter out already present combatants with same sourceCharacterId
    const existingIds = new Set(combatState.combatants.map(c => c.sourceCharacterId));
    const toAdd = newCombatants.filter(c => !existingIds.has(c.sourceCharacterId));

    if (toAdd.length === 0) {
      alert('Все члены партии уже находятся в списке участников боя!');
      setActiveTab('combat');
      return;
    }

    setCombatState(prev => ({
      ...prev,
      combatants: [...prev.combatants, ...toAdd],
      log: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          round: prev.round,
          message: `Партия игроков (${toAdd.map(p => p.name).join(', ')}) добавлена в боевой трекер.`,
          type: 'system'
        },
        ...prev.log
      ]
    }));

    setActiveTab('combat');
  };

  // Add NPC from bestiary to combat
  const handleAddNpcToCombat = (npc: NpcTemplate, count: number) => {
    sfx.playHit();
    const newNpcs: Combatant[] = [];

    for (let i = 1; i <= count; i++) {
      const displayName = count > 1 ? `${npc.nameRu} #${i}` : npc.nameRu;
      newNpcs.push({
        id: `c-npc-${npc.id}-${Date.now()}-${i}`,
        name: displayName,
        role: npc.threatLevel,
        type: 'enemy',
        initiative: 0,
        ref: npc.stats.REF,
        dex: npc.stats.DEX,
        move: npc.stats.MOVE,
        body: npc.stats.BODY,
        hpCurrent: npc.hpMax,
        hpMax: npc.hpMax,
        deathSavePenalties: 0,
        headSp: npc.headSp,
        headSpMax: npc.headSp,
        bodySp: npc.bodySp,
        bodySpMax: npc.bodySp,
        weapons: npc.weapons || [],
        conditions: [],
        criticalInjuries: [],
        notes: `${npc.description} | ${npc.tactics || ''}`,
        isDefeated: false,
        isDelayed: false
      });
    }

    setCombatState(prev => ({
      ...prev,
      combatants: [...prev.combatants, ...newNpcs],
      log: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          round: prev.round,
          message: `В бой добавлены противники: ${npc.nameRu} x${count}.`,
          type: 'system'
        },
        ...prev.log
      ]
    }));

    setActiveTab('combat');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-rajdhani selection:bg-red-600 selection:text-white">
      
      {/* Top Cyberpunk Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDiceRoller={() => setIsDiceModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        partyCount={party.length}
        combatantCount={combatState.combatants.length}
      />

      {/* Main App Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-20">
        {activeTab === 'combat' && (
          <CombatTrackerView
            combatState={combatState}
            setCombatState={setCombatState}
            onOpenBestiaryModal={() => setActiveTab('bestiary')}
            onAddPartyToCombat={handleAddPartyToCombat}
          />
        )}

        {activeTab === 'chase' && (
          <ChaseTrackerView />
        )}

        {activeTab === 'party' && (
          <PartyView
            party={party}
            setParty={setParty}
            onAddPartyToCombat={handleAddPartyToCombat}
          />
        )}

        {activeTab === 'bestiary' && (
          <BestiaryView
            customBestiary={customBestiary}
            setCustomBestiary={setCustomBestiary}
            onAddNpcToCombat={handleAddNpcToCombat}
          />
        )}

        {activeTab === 'netrunning' && (
          <NetArchitectureView />
        )}

        {activeTab === 'reference' && (
          <GMReferenceView />
        )}
      </main>

      {/* Modals */}
      {isDiceModalOpen && (
        <DiceRollerModal onClose={() => setIsDiceModalOpen(false)} />
      )}

      {isImportModalOpen && (
        <DataManagementModal
          onClose={() => setIsImportModalOpen(false)}
          onDataRestored={reloadData}
        />
      )}

      {/* Footer bar */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-3 text-center text-xs text-zinc-600 font-tech">
        CYBERPUNK RED GM TOOLS // CLIENT-SIDE SPA // READY FOR GITHUB PAGES
      </footer>
    </div>
  );
};
export default App;
