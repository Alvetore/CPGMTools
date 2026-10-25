// JSON crosses a runtime trust boundary. Keep unknown properties, validate every known
// structure used by rendering/calculations, and reject before changing browser data.
type Obj = Record<string, any>;
export const isObject = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const string = (v: unknown) => typeof v === 'string';
const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
const nonnegative = (v: unknown) => num(v) && Number.isInteger(v) && (v as number) >= 0;
const bool = (v: unknown) => typeof v === 'boolean';
const optional = (v: unknown, test: (v: any) => boolean) => v === undefined || test(v);
const list = (v: unknown, test: (v: any) => boolean) => Array.isArray(v) && v.every(test);
const numericFields = (o: Obj, fields: string[]) => fields.every(k => nonnegative(o[k]));
const uniqueIds = (v: Obj[]) => new Set(v.map(o => o.id)).size === v.length;
const withIds = (v: unknown, test: (o: Obj) => boolean) => list(v, o => isObject(o) && string(o.id) && o.id.length > 0 && test(o)) && uniqueIds(v as Obj[]);
const skills = (v: unknown) => list(v, o => isObject(o) && optional(o.id, string) && optional(o.nameRu, string) && optional(o.stat, string) && optional(o.base, num) && optional(o.level, nonnegative));
const damage = (v: unknown) => string(v) && (v === '' || /^(?:[1-9]\d?|100)d6(?:\+\d+)?$/i.test((v as string).trim()));
const weaponOptions = (v: Obj): boolean => optional(v.category,string) && optional(v.skillId,string) &&
  optional(v.quality,q => ['Poor','Standard','Excellent'].includes(q)) && optional(v.ammoType,string) &&
  ['standardRof','magCapacity','bodyRequirement','autofireLimit'].every(k => optional(v[k],nonnegative)) &&
  optional(v.armorPenetration,p => ['none','half','ignore'].includes(p)) && optional(v.canCrit,bool) && optional(v.attackRequiresRoll,bool);
export const validWeapon = (v: unknown): boolean => isObject(v) && string(v.id) && string(v.name) && string(v.category) &&
  damage(v.damage) && numericFields(v, ['standardRof','magCapacity','currentAmmo']) && weaponOptions(v) && optional(v.sourceCyberwareId,string) &&
  optional(v.damageProfiles,p => list(p,o => isObject(o) && string(o.name) && damage(o.damage) && weaponOptions(o))) &&
  optional(v.selectedProfile,p => nonnegative(p) && p < Math.max(1,v.damageProfiles?.length ?? 0)) &&
  optional(v.profileAmmo,a => isObject(a) && Object.values(a).every(nonnegative));
const injuries = (v: unknown) => list(v, i => isObject(i) && string(i.id) && string(i.nameRu) && string(i.effectRu) && ['head','body'].includes(i.location) && bool(i.isActive) &&
  ['deathSaveModifier','actionModifier','rangedModifier','meleeModifier','moveModifier','headMultiplier','recurringDamage'].every(k => optional(i[k], num)));
const condition = (v: unknown) => isObject(v) && string(v.id) && string(v.name) && (v.roundsRemaining === null || nonnegative(v.roundsRemaining));
const combatStats = (o: Obj) => numericFields(o, ['ref','dex','move','body','hpCurrent','hpMax','headSp','headSpMax','bodySp','bodySpMax']) && o.hpMax > 0 &&
  o.hpCurrent <= o.hpMax && o.headSp <= o.headSpMax && o.bodySp <= o.bodySpMax && list(o.weapons, validWeapon) &&
  optional(o.skills, skills) && optional(o.armorPenalty, num) && optional(o.roleRank, nonnegative) &&
    optional(o.isDead, bool) && optional(o.isStabilized, bool) && optional(o.luckCurrent, nonnegative) && optional(o.deathSavePenalties, nonnegative) && optional(o.coverHp, nonnegative);
export const validParty = (v: unknown) => withIds(v, o => string(o.name) && string(o.handle) && string(o.role) && combatStats(o) &&
  numericFields(o, ['emp','luckMax','luckCurrent','passivePerception']) && num(o.humanity) && optional(o.criticalInjuries, injuries) && optional(o.sourceCharSheet, c => { try { validateCharacter(c); return true; } catch { return false; } }));
const validCombatant = (o: Obj) => string(o.name) && ['player','enemy','ally','neutral','drone'].includes(o.type) && combatStats(o) && num(o.initiative) &&
  nonnegative(o.deathSavePenalties) && bool(o.isDefeated) && bool(o.isDelayed) && injuries(o.criticalInjuries) && list(o.conditions, condition);
export const validCombat = (v: unknown) => isObject(v) && bool(v.isActive) && nonnegative(v.round) && v.round >= 1 &&
  nonnegative(v.currentTurnIndex) && withIds(v.combatants, validCombatant) && v.currentTurnIndex <= Math.max(0, v.combatants.length - 1) &&
  list(v.log, l => isObject(l) && string(l.id) && string(l.message) && string(l.timestamp) && nonnegative(l.round) && string(l.type));
export const validBestiary = (v: unknown) => withIds(v, o => string(o.nameRu) && string(o.nameEn) && string(o.description) && string(o.armorName) && isObject(o.stats) &&
  Object.values(o.stats).every(num) && ['REF','DEX','BODY','MOVE'].every(k => nonnegative(o.stats[k])) &&
  numericFields(o, ['hpMax','headSp','bodySp']) && list(o.weapons, validWeapon) && skills(o.skills) && list(o.cyberware,string) && list(o.gear,string));
export const validEncounters = (v: unknown) => withIds(v, o => string(o.title) && list(o.tags,string) &&
  withIds(o.npcs, n => string(n.name) && numericFields(n, ['count','ref','dex','body','hpMax','headSp','bodySp']) && n.count <= 100 && list(n.weapons,validWeapon) && optional(n.skills,skills)));
export const validNetworks = (v: unknown) => withIds(v, o => string(o.title) && string(o.systemName) && string(o.difficulty) &&
  Array.isArray(o.floors) && o.floors.length > 0 && o.floors.every((f: Obj, i: number) => f?.floorNumber === i + 1) &&
  withIds(o.floors, f => nonnegative(f.floorNumber) && f.floorNumber >= 1 && string(f.name) && string(f.description) && bool(f.isUnlocked) &&
    ['Password','File','ControlNode','BlackIce','Demon'].includes(f.type) && nonnegative(f.dv) && optional(f.blackIce, i => isObject(i) &&
      string(i.name) && string(i.effect) && numericFields(i, ['spd','atk','def','rezCurrent','rezMax']) && bool(i.isDerezed))));
export const validChase = (v: unknown) => isObject(v) && nonnegative(v.round) && v.round > 0 && list(v.log,string) &&
  withIds(v.vehicles, o => string(o.name) && string(o.driverName) && num(o.driverBase) &&
    numericFields(o, ['sdpCurrent','sdpMax','armorSp']) && [60,40,20,15,10,8].includes(o.speedCombat) && Number.isInteger(o.gridSquare) &&
    ['hasNos','isPitSuffering','isPulledClose','isEscaped','isWrecked'].every(k => bool(o[k])) &&
    optional(o.side, s => ['pursuer','evader'].includes(s)) && ['hasActed','positioned','needsControlResolution'].every(k => optional(o[k],bool)));
export const validGigs = (v: unknown) => withIds(v, o => string(o.title) &&
  [['client',['name','faction','agenda']],['mission',['objective','target','details']],['twist',['title','description']],['location',['name','district','features']]].every(([field, keys]) => isObject(o[field as string]) && (keys as string[]).every(k => string(o[field as string][k]))) && numericFields(o,['payoutEb','repReward','createdAt']));
const validNetrun = (v: unknown) => isObject(v) && numericFields(v, ['activeArchIndex','currentRunnerFloor','netrunnerInterface','netActionsLeft']) &&
  v.currentRunnerFloor > 0 && v.netrunnerInterface >= 1 && v.netrunnerInterface <= 10 && v.netActionsLeft <= 5 && list(v.runnerLog,string);

const validators: Record<string, (v: unknown) => boolean> = {
  cpgm_party: validParty, cpgm_combat: validCombat, cpgm_custom_bestiary: validBestiary,
  cpgm_encounters: validEncounters, cpgm_networks: validNetworks, cpgm_chase: validChase, cpgm_gigs: validGigs, cpgm_netrun: validNetrun,
};
export function validateStored(key: string, value: unknown): void {
  if (!validators[key]?.(value)) throw new Error(`Некорректная структура данных: ${key}. Старые данные сохранены.`);
}
export function validateCharacter(value: unknown): asserts value is import('../types/character').Character {
  if (!isObject(value) || !isObject(value.stats) || !Object.values(value.stats).every(num) ||
    !optional(value.weapons, v => list(v, validWeapon)) || !optional(value.skills, skills) ||
    !optional(value.statMods, o => isObject(o) && Object.values(o).every(num)) ||
    !['id','name','handle','role','notes','avatarUrl'].every(k => optional(value[k],string)) ||
    !['hpCurrent','hpMaxManual','luckCurrent','deathSavePenalties','roleRank'].every(k => optional(value[k],nonnegative)) ||
    !optional(value.humanityCurrent,num) || !optional(value.criticalInjuries, injuries) ||
    !optional(value.automaticCyberwareEffects,bool) ||
    !optional(value.cyberware,c => list(c,i => isObject(i) && string(i.id) && string(i.name) && optional(i.isInstalled,bool) && optional(i.installedIn,t => list(t,string)))) ||
    !optional(value.armor, a => isObject(a) && ['head','body','shield'].every(k => optional(a[k], p => isObject(p) && numericFields(p,['spCurrent','spMax']) && optional(p.penalty,num))))) {
    throw new Error('Некорректный лист персонажа. Импорт отменён.');
  }
}
