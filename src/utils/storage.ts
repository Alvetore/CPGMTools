import { Character } from '../types/character';
import { PartyMember } from '../types/party';
import { Combatant, ActiveCombatState } from '../types/combat';
import { Encounter, NpcTemplate } from '../types/bestiary';
import { NetArchitecture } from '../types/netrun';
import { GeneratedGig } from '../types/generators';

const STORAGE_KEYS = {
  PARTY: 'cpgm_party',
  COMBAT: 'cpgm_combat',
  CUSTOM_BESTIARY: 'cpgm_custom_bestiary',
  ENCOUNTERS: 'cpgm_encounters',
  NETWORKS: 'cpgm_networks',
  GIGS: 'cpgm_gigs'
};

export function loadStoredData<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Failed to load ${key} from localStorage:`, e);
    return fallback;
  }
}

export function saveStoredData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage:`, e);
  }
}

export { STORAGE_KEYS };

/**
 * Converts a Character JSON exported from Cyberpunk RED CharSheet into a PartyMember
 */
export function convertCharSheetToPartyMember(char: Character): PartyMember {
  const body = char.stats?.BODY ?? 6;
  const will = char.stats?.WILL ?? 6;
  const calculatedHp = 10 + 5 * Math.ceil((body + will) / 2);
  const hpMax = char.hpMaxManual && char.hpMaxManual > 0 ? char.hpMaxManual : calculatedHp;

  // Find perception skill if available
  let perceptionBase = (char.stats?.INT ?? 6) + 2;
  if (Array.isArray(char.skills)) {
    const pSkill = char.skills.find(s => s.id === 'perception');
    if (pSkill) {
      perceptionBase = (char.stats?.INT ?? 6) + (pSkill.level ?? 0);
    }
  }

  return {
    id: char.id || `char-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: char.name || 'Неизвестный киберпанк',
    handle: char.handle || 'Бегущий по краю',
    role: char.role || 'Solo',
    playerName: '',
    hpMax: hpMax,
    hpCurrent: char.hpCurrent ?? hpMax,
    headSp: char.armor?.head?.spCurrent ?? 0,
    headSpMax: char.armor?.head?.spMax ?? 0,
    bodySp: char.armor?.body?.spCurrent ?? 0,
    bodySpMax: char.armor?.body?.spMax ?? 0,
    ref: char.stats?.REF ?? 6,
    dex: char.stats?.DEX ?? 6,
    move: char.stats?.MOVE ?? 5,
    body: body,
    emp: char.stats?.EMP ?? 5,
    humanity: char.humanityCurrent ?? 50,
    luckMax: char.stats?.LUCK ?? 5,
    luckCurrent: char.luckCurrent ?? 5,
    passivePerception: perceptionBase,
    weapons: char.weapons || [],
    notes: char.notes || '',
    avatarUrl: char.avatarUrl,
    sourceCharSheet: char
  };
}

/**
 * Converts a PartyMember into an active Combatant
 */
export function partyMemberToCombatant(member: PartyMember, initiativeRoll: number = 0): Combatant {
  return {
    id: `combatant-${member.id}-${Date.now()}`,
    name: member.name,
    handle: member.handle,
    role: member.role,
    type: 'player',
    initiative: initiativeRoll,
    ref: member.ref,
    dex: member.dex,
    move: member.move,
    body: member.body,
    hpCurrent: member.hpCurrent,
    hpMax: member.hpMax,
    deathSavePenalties: 0,
    headSp: member.headSp,
    headSpMax: member.headSpMax,
    bodySp: member.bodySp,
    bodySpMax: member.bodySpMax,
    weapons: member.weapons || [],
    conditions: [],
    criticalInjuries: [],
    notes: member.notes,
    isDefeated: member.hpCurrent <= 0,
    isDelayed: false,
    sourceCharacterId: member.id
  };
}

/**
 * Full export of all GM tools state into a single JSON file
 */
export function exportEntireGmDatabase() {
  const dump = {
    exportVersion: '1.0.0',
    exportDate: new Date().toISOString(),
    party: loadStoredData<PartyMember[]>(STORAGE_KEYS.PARTY, []),
    combat: loadStoredData<ActiveCombatState>(STORAGE_KEYS.COMBAT, {
      isActive: false,
      round: 1,
      currentTurnIndex: 0,
      combatants: [],
      log: []
    }),
    customBestiary: loadStoredData<NpcTemplate[]>(STORAGE_KEYS.CUSTOM_BESTIARY, []),
    encounters: loadStoredData<Encounter[]>(STORAGE_KEYS.ENCOUNTERS, []),
    networks: loadStoredData<NetArchitecture[]>(STORAGE_KEYS.NETWORKS, []),
    gigs: loadStoredData<GeneratedGig[]>(STORAGE_KEYS.GIGS, [])
  };

  const jsonStr = JSON.stringify(dump, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CPGMTools_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
