import { Character } from '../types/character';
import { PartyMember } from '../types/party';
import { Combatant, ActiveCombatState } from '../types/combat';
import { Encounter, NpcTemplate } from '../types/bestiary';
import { NetArchitecture } from '../types/netrun';
import { GeneratedGig } from '../types/generators';
import { validateStored, validateCharacter, isObject } from './validation';
import { activeInjuries } from './cprCombat';

const STORAGE_KEYS = {
  PARTY: 'cpgm_party',
  COMBAT: 'cpgm_combat',
  CUSTOM_BESTIARY: 'cpgm_custom_bestiary',
  ENCOUNTERS: 'cpgm_encounters',
  NETWORKS: 'cpgm_networks',
  GIGS: 'cpgm_gigs',
  CHASE: 'cpgm_chase',
  NETRUN: 'cpgm_netrun'
};

// A single atomic LocalStorage value owns all new writes. Legacy keys are read on
// migration and retained for recovery; a failed setItem cannot leave a partial restore.
const DATABASE_KEY = 'cpgm_database_v2';
const pendingWrites: Record<string, unknown> = {};
function readDatabase(): Record<string, unknown> {
  const raw = localStorage.getItem(DATABASE_KEY);
  if (raw !== null) {
    const data: unknown = JSON.parse(raw);
    if (!isObject(data)) throw new Error('Повреждена база CPGMTools. Восстановите резервную копию.');
    for (const [key, value] of Object.entries(data)) if (Object.values(STORAGE_KEYS).includes(key)) validateStored(key, value);
    return data;
  }
  const data: Record<string, unknown> = {};
  for (const key of Object.values(STORAGE_KEYS)) {
    const legacy = localStorage.getItem(key);
    if (legacy !== null) { data[key] = JSON.parse(legacy); validateStored(key, data[key]); }
  }
  return data;
}

function reportStorageError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('cpgm-storage-error', { detail: message }));
  }
}

export function loadStoredData<T>(key: string, fallback: T): T {
  try {
    const data = { ...readDatabase(), ...pendingWrites };
    if (!(key in data)) return fallback;
    const value = data[key] as T;
    if (key === STORAGE_KEYS.COMBAT) {
      const combat = value as ActiveCombatState;
      return { ...combat, combatants: combat.combatants.map(c => ({ ...c, criticalInjuries: c.criticalInjuries.map(i => activeInjuries([{ ...i, isActive: true }])[0] ? { ...activeInjuries([{ ...i, isActive: true }])[0], isActive: i.isActive } : i) })) } as T;
    }
    return value;
  } catch (e) {
    console.error(`Failed to load ${key} from localStorage:`, e);
    reportStorageError(e);
    return fallback;
  }
}

export function saveStoredData<T>(key: string, data: T): boolean {
  try {
    validateStored(key, data);
    pendingWrites[key] = data;
    const database = readDatabase();
    localStorage.setItem(DATABASE_KEY, JSON.stringify({ ...database, ...pendingWrites }));
    for (const pending of Object.keys(pendingWrites)) delete pendingWrites[pending];
    reportStorageError('');
    return true;
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage:`, e);
    reportStorageError(e);
    return false;
  }
}

export function restoreGmDatabase(value: unknown): void {
  if (!isObject(value) || !['1.0.0','2.0.0'].includes(value.exportVersion)) throw new Error('Неподдерживаемая версия резервной копии.');
  const fields: Record<string, string> = { party: STORAGE_KEYS.PARTY, combat: STORAGE_KEYS.COMBAT, customBestiary: STORAGE_KEYS.CUSTOM_BESTIARY,
    encounters: STORAGE_KEYS.ENCOUNTERS, networks: STORAGE_KEYS.NETWORKS, gigs: STORAGE_KEYS.GIGS, chase: STORAGE_KEYS.CHASE, netrun: STORAGE_KEYS.NETRUN };
  const updates: Record<string, unknown> = {};
  for (const [field,key] of Object.entries(fields)) if (field in value) { validateStored(key,value[field]); updates[key] = value[field]; }
  if (!Object.keys(updates).length) throw new Error('Резервная копия не содержит данных.');
  // Valid data can repair a corrupt key only when it is actually supplied in the backup.
  const raw = localStorage.getItem(DATABASE_KEY);
  const old = raw ? JSON.parse(raw) : Object.fromEntries(Object.values(STORAGE_KEYS).flatMap(key => {
    const entry = localStorage.getItem(key); return entry === null ? [] : [[key, JSON.parse(entry)]];
  }));
  if (!isObject(old)) throw new Error('Повреждена база. Сохраните её вручную перед сбросом.');
  const current = { ...old, ...pendingWrites, ...updates };
  for (const key of Object.values(STORAGE_KEYS)) if (key in current) validateStored(key,current[key]);
  localStorage.setItem(DATABASE_KEY, JSON.stringify(current));
  for (const key of Object.keys(pendingWrites)) delete pendingWrites[key];
}

export function clearGmDatabase(): void {
  localStorage.removeItem(DATABASE_KEY);
  for (const key of Object.values(STORAGE_KEYS)) localStorage.removeItem(key);
  for (const key of Object.keys(pendingWrites)) delete pendingWrites[key];
}

export { STORAGE_KEYS };

/**
 * Converts a Character JSON exported from Cyberpunk RED CharSheet into a PartyMember
 */
export function convertCharSheetToPartyMember(char: Character): PartyMember {
  validateCharacter(char);
  const stat = (key: keyof Character['stats'], fallback = 6) => Math.max(0, (char.stats[key] ?? fallback) + (char.statMods?.[key] ?? 0));
  const body = stat('BODY');
  const will = stat('WILL');
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
    ref: stat('REF'),
    dex: stat('DEX'),
    move: stat('MOVE', 5),
    body: body,
    emp: char.stats?.EMP ?? 5,
    humanity: char.humanityCurrent ?? 50,
    luckMax: char.stats?.LUCK ?? 5,
    luckCurrent: char.luckCurrent ?? char.stats?.LUCK ?? 5,
    passivePerception: perceptionBase,
    weapons: char.weapons || [],
    notes: char.notes || '',
    avatarUrl: char.avatarUrl,
    sourceCharSheet: char,
    will, armorPenalty: Math.min(0, char.armor?.head?.penalty ?? 0, char.armor?.body?.penalty ?? 0),
    skills: char.skills, roleRank: char.roleRank, deathSavePenalties: char.deathSavePenalties ?? 0,
    criticalInjuries: char.criticalInjuries ?? []
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
    deathSavePenalties: member.deathSavePenalties ?? 0,
    headSp: member.headSp,
    headSpMax: member.headSpMax,
    bodySp: member.bodySp,
    bodySpMax: member.bodySpMax,
    weapons: member.weapons || [],
    conditions: [],
    criticalInjuries: member.criticalInjuries ?? [],
    notes: member.notes,
    isDefeated: false,
    isDead: member.isDead ?? false,
    isStabilized: member.isStabilized ?? false,
    armorPenalty: member.armorPenalty,
    skills: member.skills,
    roleRank: member.roleRank,
    luckCurrent: member.luckCurrent,
    isDelayed: false,
    sourceCharacterId: member.id
  };
}

/**
 * Full export of all GM tools state into a single JSON file
 */
export function exportEntireGmDatabase() {
  let database: Record<string, unknown>;
  try { database = { ...readDatabase(), ...pendingWrites }; }
  catch {
    downloadJson({ recoveryVersion: 1, raw: Object.fromEntries([DATABASE_KEY, ...Object.values(STORAGE_KEYS)].map(key => [key, localStorage.getItem(key)])), pendingWrites }, 'CPGMTools_Recovery');
    alert('Сохранён аварийный снимок исходных данных. Это не обычный бэкап; не сбрасывайте базу до проверки файла.');
    return;
  }
  const dump = {
    exportVersion: '2.0.0',
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
    gigs: loadStoredData<GeneratedGig[]>(STORAGE_KEYS.GIGS, []),
    ...('cpgm_chase' in database ? { chase: database.cpgm_chase } : {}),
    ...('cpgm_netrun' in database ? { netrun: database.cpgm_netrun } : {})
  };

  // Include the latest in-memory values when a quota/storage failure prevented saving.
  const fields: Record<string, string> = { party: STORAGE_KEYS.PARTY, combat: STORAGE_KEYS.COMBAT, customBestiary: STORAGE_KEYS.CUSTOM_BESTIARY, encounters: STORAGE_KEYS.ENCOUNTERS, networks: STORAGE_KEYS.NETWORKS, gigs: STORAGE_KEYS.GIGS, chase: STORAGE_KEYS.CHASE, netrun: STORAGE_KEYS.NETRUN };
  for (const [field, key] of Object.entries(fields)) if (key in database) (dump as Record<string, unknown>)[field] = database[key];
  downloadJson(dump, 'CPGMTools_Backup');
}

function downloadJson(data: unknown, prefix: string) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${prefix}_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
