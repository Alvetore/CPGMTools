import React, { useState, useEffect } from 'react';
import { Header, ActiveTab } from './components/Header';
import { CombatTrackerView } from './components/combat/CombatTrackerView';
import { EncountersView } from './components/encounters/EncountersView';
import { ChaseTrackerView } from './components/chase/ChaseTrackerView';
import { PartyView } from './components/party/PartyView';
import { BestiaryView } from './components/bestiary/BestiaryView';
import { NetArchitectureView } from './components/netrun/NetArchitectureView';
import { GMReferenceView } from './components/reference/GMReferenceView';
import { DiceRollerModal } from './components/common/DiceRollerModal';
import { DataManagementModal } from './components/common/DataManagementModal';

import { PartyMember } from './types/party';
import { ActiveCombatState, Combatant } from './types/combat';
import { NpcTemplate, Encounter } from './types/bestiary';
import { OFFICIAL_CPR_BESTIARY } from './data/bestiaryData';
import { DEFAULT_ENCOUNTERS } from './data/defaultEncounters';
import { 
  loadStoredData, 
  saveStoredData, 
  STORAGE_KEYS, 
  partyMemberToCombatant 
} from './utils/storage';
import { sfx } from './utils/audio';
import { rollD10 } from './utils/dice';
import { rollInitiative, orderCombatants } from './utils/initiative';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('combat');
  const [storageError, setStorageError] = useState('');
  const [dataRevision, setDataRevision] = useState(0);
  useEffect(() => {
    const handler = (event: Event) => setStorageError((event as CustomEvent<string>).detail);
    window.addEventListener('cpgm-storage-error', handler);
    return () => window.removeEventListener('cpgm-storage-error', handler);
  }, []);

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

  // Encounters state
  const [encounters, setEncounters] = useState<Encounter[]>(() => 
    loadStoredData<Encounter[]>(STORAGE_KEYS.ENCOUNTERS, DEFAULT_ENCOUNTERS)
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

  useEffect(() => {
    saveStoredData(STORAGE_KEYS.ENCOUNTERS, encounters);
  }, [encounters]);

  // Reload state after backup restoration
  const reloadData = () => {
    setStorageError('');
    setDataRevision(r => r + 1);
    setParty(loadStoredData<PartyMember[]>(STORAGE_KEYS.PARTY, []));
    setCombatState(loadStoredData<ActiveCombatState>(STORAGE_KEYS.COMBAT, {
      isActive: false,
      round: 1,
      currentTurnIndex: 0,
      combatants: [],
      log: []
    }));
    setCustomBestiary(loadStoredData<NpcTemplate[]>(STORAGE_KEYS.CUSTOM_BESTIARY, []));
    setEncounters(loadStoredData<Encounter[]>(STORAGE_KEYS.ENCOUNTERS, DEFAULT_ENCOUNTERS));
  };

  const syncCombatToParty = (): PartyMember[] => {
    const byId = new Map(combatState.combatants.filter(c => c.sourceCharacterId).map(c => [c.sourceCharacterId, c]));
    const next = party.map(p => {
      const c = byId.get(p.id);
      return c ? { ...p, hpCurrent: c.hpCurrent, headSp: c.headSp, bodySp: c.bodySp, weapons: c.weapons,
        deathSavePenalties: c.deathSavePenalties, criticalInjuries: c.criticalInjuries, isDead: c.isDead,
        isStabilized: c.isStabilized, luckCurrent: c.luckCurrent ?? p.luckCurrent } : p;
    });
    setParty(next);
    return next;
  };

  // Add party to combat
  const handleAddPartyToCombat = () => {
    if (party.length === 0) {
      alert('В партии пока нет персонажей. Загрузите их на вкладке «Партия игроков» из чарника!');
      return;
    }

    sfx.playCritSuccess();
    const newCombatants: Combatant[] = party.map(member => {
      const combatant = partyMemberToCombatant(member, 0);
      return combatState.isActive ? { ...combatant, initiative: rollInitiative(combatant) } : combatant;
    });

    // Filter out already present combatants with same sourceCharacterId
    const existingIds = new Set(combatState.combatants.map(c => c.sourceCharacterId));
    const toAdd = newCombatants.filter(c => !existingIds.has(c.sourceCharacterId));

    if (toAdd.length === 0) {
      alert('Все члены партии уже находятся в списке участников боя!');
      setActiveTab('combat');
      return;
    }

    setCombatState(prev => ({
      ...orderCombatants(prev, [...prev.combatants, ...toAdd]),
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
        type: npc.threatLevel === 'Drone' ? 'drone' : 'enemy',
        initiative: combatState.isActive ? rollInitiative({ ref: npc.stats.REF }) : 0,
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
        skills: npc.skills,
        conditions: [],
        criticalInjuries: [],
        notes: `${npc.description} | ${npc.tactics || ''}`,
        isDefeated: false,
        isDelayed: false
      });
    }

    setCombatState(prev => ({
      ...orderCombatants(prev, [...prev.combatants, ...newNpcs]),
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

  // Encounters handlers
  const handleSaveEncounter = (encounter: Encounter) => {
    setEncounters(prev => {
      const idx = prev.findIndex(e => e.id === encounter.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = encounter;
        return copy;
      }
      return [encounter, ...prev];
    });
  };

  const handleDeleteEncounter = (id: string) => {
    setEncounters(prev => prev.filter(e => e.id !== id));
  };

  const handleDuplicateEncounter = (enc: Encounter) => {
    sfx.playClick();
    const copy: Encounter = {
      ...enc,
      id: `enc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: `${enc.title} (Копия)`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setEncounters(prev => [copy, ...prev]);
  };

  const handleStartCombatFromEncounter = (encounter: Encounter, includeParty: boolean) => {
    sfx.playCritSuccess();
    const combatants: Combatant[] = [];
    const currentParty = syncCombatToParty();

    // 1. Add Party if selected and available
    if (includeParty && party.length > 0) {
      currentParty.forEach(member => {
        combatants.push(partyMemberToCombatant(member, 0));
      });
    }

    // 2. Add NPCs from encounter
    encounter.npcs.forEach(npc => {
      for (let i = 1; i <= npc.count; i++) {
        const displayName = npc.count > 1 ? `${npc.name} #${i}` : npc.name;
        combatants.push({
          id: `c-enc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${i}`,
          name: displayName,
          role: npc.threatLevel,
          type: npc.type || (npc.threatLevel === 'Drone' ? 'drone' : 'enemy'),
          initiative: 0,
          ref: npc.ref,
          dex: npc.dex,
          move: npc.move || 5,
          body: npc.body,
          hpCurrent: npc.hpMax,
          hpMax: npc.hpMax,
          deathSavePenalties: 0,
          headSp: npc.headSp,
          headSpMax: npc.headSp,
          bodySp: npc.bodySp,
          bodySpMax: npc.bodySp,
          weapons: npc.weapons || [],
          skills: npc.skills,
          conditions: [],
          criticalInjuries: [],
          notes: npc.notes || '',
          isDefeated: false,
          isDelayed: false
        });
      }
    });

    const newCombatState: ActiveCombatState = {
      isActive: false, // Pre-combat phase so GM can review and roll initiative
      round: 1,
      currentTurnIndex: 0,
      combatants,
      log: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          round: 1,
          message: `Подготовлен энкаунтер: "${encounter.title}". Участников: ${combatants.length}${includeParty && party.length > 0 ? ` (партия: ${party.length} чел.)` : ''}.`,
          type: 'system'
        }
      ]
    };

    setCombatState(newCombatState);
    setActiveTab('combat');
  };

  const handleAddAsReinforcement = (encounter: Encounter) => {
    sfx.playHit();
    const newNpcs: Combatant[] = [];

    encounter.npcs.forEach(npc => {
      for (let i = 1; i <= npc.count; i++) {
        const displayName = npc.count > 1 ? `${npc.name} #${i}` : npc.name;
        const initVal = combatState.isActive ? rollInitiative({ ref: npc.ref }) : 0;
        newNpcs.push({
          id: `c-reinf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${i}`,
          name: displayName,
          role: npc.threatLevel,
          type: npc.type || (npc.threatLevel === 'Drone' ? 'drone' : 'enemy'),
          initiative: initVal,
          ref: npc.ref,
          dex: npc.dex,
          move: npc.move || 5,
          body: npc.body,
          hpCurrent: npc.hpMax,
          hpMax: npc.hpMax,
          deathSavePenalties: 0,
          headSp: npc.headSp,
          headSpMax: npc.headSp,
          bodySp: npc.bodySp,
          bodySpMax: npc.bodySp,
          weapons: npc.weapons || [],
          skills: npc.skills,
          conditions: [],
          criticalInjuries: [],
          notes: npc.notes || '',
          isDefeated: false,
          isDelayed: false
        });
      }
    });

    setCombatState(prev => ({
      ...orderCombatants(prev, [...prev.combatants, ...newNpcs]),
      log: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          round: prev.round,
          message: `В активный бой прибыло подкрепление (Волна 2): "${encounter.title}" (+${newNpcs.length} комбатантов).`,
          type: 'system'
        },
        ...prev.log
      ]
    }));

    setActiveTab('combat');
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-zinc-950 text-zinc-100 flex flex-col font-rajdhani selection:bg-red-600 selection:text-white overflow-x-hidden">
      
      {/* Top Cyberpunk Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDiceRoller={() => setIsDiceModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        partyCount={party.length}
        combatantCount={combatState.combatants.length}
        encountersCount={encounters.length}
      />

      {/* Main App Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2.5 sm:p-6 pb-20 pb-safe">
        {storageError && <div role="alert" className="p-3 mb-3 border border-red-600 bg-red-950 text-red-200">Сохранение не выполнено: {storageError} Сделайте экспорт данных; не закрывайте вкладку.</div>}
        {activeTab === 'combat' && (
          <CombatTrackerView
            combatState={combatState}
            setCombatState={setCombatState}
            onOpenBestiaryModal={() => setActiveTab('bestiary')}
            onAddPartyToCombat={handleAddPartyToCombat}
            onOpenEncounters={() => setActiveTab('encounters')}
            onSyncParty={syncCombatToParty}
          />
        )}

        {activeTab === 'encounters' && (
          <EncountersView
            encounters={encounters}
            templates={[...OFFICIAL_CPR_BESTIARY, ...customBestiary]}
            isCombatActive={combatState.isActive}
            combatantsCount={combatState.combatants.length}
            partyCount={party.length}
            onSaveEncounter={handleSaveEncounter}
            onDeleteEncounter={handleDeleteEncounter}
            onDuplicateEncounter={handleDuplicateEncounter}
            onStartCombat={handleStartCombatFromEncounter}
            onAddAsReinforcement={handleAddAsReinforcement}
          />
        )}

        {activeTab === 'chase' && (
          <ChaseTrackerView key={dataRevision} />
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
          <NetArchitectureView key={dataRevision} />
        )}

        {activeTab === 'reference' && (
          <GMReferenceView 
            key={dataRevision}
            onAddNpcToCombat={handleAddNpcToCombat}
          />
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
