/* Regression probes. Runs actual TS/TSX through the installed TypeScript compiler.
 * React hooks are simulated synchronously; audio, confetti, timers and browser storage
 * are isolated. This is component-handler verification, not a browser/E2E test.
 * Run: node audit/probe.cjs (nonzero exit means rule/behavior expectations failed).
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
const storage = new Map();
let hooks;
const react = {
  createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
  useState: initial => {
    const owner = hooks, index = owner.cursor++;
    if (!(index in owner.values)) owner.values[index] = typeof initial === 'function' ? initial() : initial;
    return [owner.values[index], next => {
      const value = typeof next === 'function' ? next(owner.values[index]) : next;
      if (!Object.is(value, owner.values[index])) owner.dirty = true;
      owner.values[index] = value;
    }];
  },
  useEffect: (run, deps) => {
    const owner = hooks, index = owner.effectCursor++;
    const old = owner.effectDeps[index];
    if (!deps || !old || deps.some((v, i) => !Object.is(v, old[i]))) {
      owner.effectDeps[index] = deps;
      owner.pendingEffects.push(run);
    }
  },
  useRef: value => {
    const index = hooks.refCursor++;
    return hooks.refs[index] ??= { current: value };
  },
};
const globals = {
  console, Math: Object.create(Math), Date, Blob,
  setTimeout: () => 0,
  alert: () => {}, confirm: () => true,
  window: { confirm: () => true, prompt: () => null, addEventListener() {}, removeEventListener() {} },
  localStorage: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key),
    clear: () => storage.clear(),
  },
  FileReader: class {
    readAsText(file) { this.onload({ target: { result: file.text } }); }
  },
};
function load(file) {
  file = path.resolve(root, file);
  if (cache.has(file)) return cache.get(file);
  if (file.endsWith(path.join('utils', 'audio.ts'))) return { sfx: new Proxy({}, { get: () => () => {} }) };
  const source = fs.readFileSync(file, 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.React, esModuleInterop: true,
  }, fileName: file }).outputText;
  const module = { exports: {} };
  cache.set(file, module.exports);
  const localRequire = name => {
    if (name === 'react') return react;
    if (name === 'lucide-react') return new Proxy({}, { get: (_, key) => key === '__esModule' ? false : () => null });
    if (name === 'canvas-confetti') return () => {};
    if (name.startsWith('.')) {
      const candidate = path.resolve(path.dirname(file), name);
      return load(['.ts', '.tsx', ''].map(ext => candidate + ext).find(f => fs.existsSync(f)));
    }
    return require(name);
  };
  vm.runInNewContext('(function(require,module,exports){' + code + '\n})', globals, { filename: file })(localRequire, module, module.exports);
  cache.set(file, module.exports);
  return module.exports;
}
function mount(file, exportName, props = {}) {
  const component = load(file)[exportName];
  const names = [...fs.readFileSync(path.join(root, file), 'utf8').matchAll(/const \[(\w+),\s*\w+\] = useState/g)].map(m => m[1]);
  const owner = { cursor: 0, values: [], refs: [], props, tree: null, effectCursor: 0, effectDeps: [], pendingEffects: [] };
  owner.render = () => {
    let count = 0;
    do {
      if (++count > 25) throw Error('Component effect loop');
      hooks = owner; owner.cursor = 0; owner.refCursor = 0; owner.effectCursor = 0; owner.pendingEffects = []; owner.dirty = false;
      owner.tree = component(owner.props);
      owner.pendingEffects.forEach(run => run());
    } while (owner.dirty);
    return owner.tree;
  };
  owner.get = name => owner.values[names.indexOf(name)];
  owner.set = (name, value) => {
    if (!names.includes(name)) throw Error('Unknown state: ' + name);
    owner.values[names.indexOf(name)] = value;
  };
  owner.render();
  return owner;
}
function nodes(node, predicate, found = []) {
  if (Array.isArray(node)) node.forEach(n => nodes(n, predicate, found));
  else if (node && typeof node === 'object') {
    if (predicate(node)) found.push(node);
    nodes(node.props?.children, predicate, found);
  }
  return found;
}
function textOf(node) {
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (node && typeof node === 'object') return textOf(node.props?.children);
  return typeof node === 'string' || typeof node === 'number' ? String(node) : '';
}
function button(owner, label, index = 0) {
  const result = nodes(owner.tree, n => n.type === 'button' && textOf(n).includes(label))[index];
  if (!result) throw Error('Button not found: ' + label);
  return result;
}
function click(owner, label, index = 0) { button(owner, label, index).props.onClick(); owner.render(); }
function fixedRandom(value, fn) {
  const prev = globals.Math.random;
  globals.Math.random = () => value;
  try { return fn(); } finally { globals.Math.random = prev; }
}
const results = [];
function check(id, expected, run) {
  try {
    persist.clearGmDatabase(); storage.clear();
    const actual = run();
    const passed = JSON.stringify(expected) === JSON.stringify(actual);
    results.push({ id, passed, expected, actual });
  } catch (error) { results.push({ id, passed: false, error: String(error.stack) }); }
}
const dice = load('src/utils/dice.ts');
const combat = load('src/utils/cprCombat.ts');
const persist = load('src/utils/storage.ts');
const rules = load('src/data/cprRules.ts');
const ice = load('src/data/blackIceData.ts');
const bestiary = load('src/data/bestiaryData.ts');
const pharma = load('src/data/cprDrugsAndCyberpsychosis.ts');
const weapon = (category = 'Heavy Pistol') => ({ id: 'w', name: category, category, damage: '2d6', standardRof: 1, currentAmmo: 8, magCapacity: 8 });
const actor = (id, extra = {}) => ({ id, name: id, type: 'enemy', initiative: 12, ref: 6, dex: 6, body: 6, move: 6, hpCurrent: 30, hpMax: 40,
  headSp: 11, headSpMax: 11, bodySp: 11, bodySpMax: 11, weapons: [weapon()], criticalInjuries: [], conditions: [], deathSavePenalties: 0, isDefeated: false, isDelayed: false, ...extra });
function attack(extra = {}, targetExtra = {}) {
  const a = actor('a', extra), b = actor('b', targetExtra);
  return mount('src/components/combat/AttackResolverModal.tsx', 'AttackResolverModal', {
    initialAttacker: a, initialTarget: b, combatants: [a,b], onClose: () => {}, onApplyDamage: () => {},
  });
}
function rollAttack(owner) {
  const b = nodes(owner.tree, n => n.type === 'button' && n.props.onClick?.name === 'handleRollAttack')[0];
  if (!b) throw Error('Attack button absent');
  fixedRandom(0.45, () => b.props.onClick()); owner.render();
}
check('baseline: equality with DV fails', false, () => dice.executeCPRCheck(10, 0, 0, 15, { firstDie: 5 }).isSuccess);
check('baseline: a 10 adds one extra die', 30, () => dice.executeCPRCheck(10, 0, 0, 15, { firstDie: 10, explodedDie: 10 }).grandTotal);
check('baseline: a 1 subtracts one die', 1, () => dice.executeCPRCheck(10, 0, 0, 15, { firstDie: 1, botchDie: 10 }).grandTotal);
check('baseline: natural 10 death save dies', false, () => dice.executeDeathSave(14, 0, 10).isSaved);
check('baseline: death save equality fails', false, () => dice.executeDeathSave(6, 1, 5).isSaved);
check('baseline: head multiplier after armor', 8, () => combat.resolveCprDamage({ rawDamage: 15, targetSp: 11, location: 'head' }).finalHpLoss);
check('baseline: AP ablation', 9, () => combat.resolveCprDamage({ rawDamage: 15, targetSp: 11, location: 'body', isApAmmo: true }).newSp);
check('baseline: melee ignores half SP rounded up', 5, () => combat.resolveCprDamage({ rawDamage: 15, targetSp: 11, location: 'body', isMelee: true }).effectiveSp);
check('R01: 6+6 against SP11 body loses 6HP', 6, () => fixedRandom(0.999, () => {
  const d = dice.rollDamageFormula('2d6');
  return combat.resolveCprDamage({ rawDamage: d.totalDamage, targetSp: 11, location: 'body', isCritInjuryRoll: d.isCriticalInjury }).finalHpLoss;
}));
check('R01: 6+6 against SP15 must not ablate armor', 15, () => fixedRandom(0.999, () => {
  const d = dice.rollDamageFormula('2d6');
  return combat.resolveCprDamage({ rawDamage: d.totalDamage, targetSp: 15, location: 'body', isCritInjuryRoll: d.isCriticalInjury }).newSp;
}));
check('R01: 6+6 against SP11 head loses 7HP', 7, () => fixedRandom(0.999, () => {
  const d = dice.rollDamageFormula('2d6');
  return combat.resolveCprDamage({ rawDamage: d.totalDamage, targetSp: 11, location: 'head', isCritInjuryRoll: d.isCriticalInjury }).finalHpLoss;
}));
check('R02: ordinary shot cannot damage actor through intact cover', 0, () => {
  const o = attack({}, { bodySp: 0 }); o.set('coverHp', 5); o.set('damageMode', 'manual'); o.set('manualDamageTotal', 20);
  o.set('attackMode', 'player_total'); o.set('directPlayerTotal', 30); o.render(); rollAttack(o);
  return o.get('damageResolution').finalHpLoss;
});
check('R03: Assault Rifle at 7-12m uses DV16', 16, () => {
  const o = attack({ weapons: [weapon('Assault Rifle')] }); rollAttack(o); return o.get('attackRoll').targetDv;
});
check('R03: Sniper Rifle at 7-12m uses DV25', 25, () => {
  const o = attack({ weapons: [weapon('Sniper Rifle')] }); rollAttack(o); return o.get('attackRoll').targetDv;
});
check('R04: seriously wounded attacker receives -2', 13, () => {
  const o = attack({ hpCurrent: 10 }); rollAttack(o); return o.get('attackRoll').grandTotal;
});
check('R05: melee attack is blocked until a defense roll is provided', null, () => {
  const o = attack({ weapons: [weapon('Heavy Melee')] }); rollAttack(o); return o.get('attackRoll');
});
check('R06: initiative natural 10 adds extra die', 26, () => {
  let state = { isActive: false, round: 1, currentTurnIndex: 0, combatants: [actor('a')], log: [] };
  const o = mount('src/components/combat/CombatTrackerView.tsx', 'CombatTrackerView', { combatState: state,
    setCombatState: f => state = typeof f === 'function' ? f(state) : f });
  fixedRandom(0.999, () => click(o, 'ВСЕМ'));
  return state.combatants[0].initiative;
});
check('R07: first death save starts without accumulated failed-time penalty', 0, () => {
  let state = { isActive: true, round: 1, currentTurnIndex: 0, combatants: [actor('a'), actor('b', { hpCurrent: 0 })], log: [] };
  const o = mount('src/components/combat/CombatTrackerView.tsx', 'CombatTrackerView', { combatState: state,
    setCombatState: f => state = typeof f === 'function' ? f(state) : f });
  const next = nodes(o.tree, n => n.type === 'button' && n.props.onClick?.name === 'handleNextTurn')[0];
  next.props.onClick(); return state.combatants[1].deathSavePenalties;
});
check('R08: exact half HP is not Seriously Wounded', 0, () => combat.getWoundedStatus(20, 40).penalty);
check('R09: Asp attack stat is 2', 2, () => ice.OFFICIAL_BLACK_ICE.find(x => x.nameEn === 'Asp').atk);
check('R09: Dragon is anti-program', 'Anti-Program', () => ice.OFFICIAL_BLACK_ICE.find(x => x.nameEn === 'Dragon').category);
check('R09: Giant is anti-personnel', 'Anti-Personnel', () => ice.OFFICIAL_BLACK_ICE.find(x => x.nameEn === 'Giant').category);
check('R09: Dragon REZ is 30', 30, () => ice.OFFICIAL_BLACK_ICE.find(x => x.nameEn === 'Dragon').rezMax);
check('R10: Imp Interface is 3', 3, () => ice.DEMON_PROGRAMS.find(x => x.id === 'dem-imp').interfaceRank);
check('R10: Efreet Interface is 4', 4, () => ice.DEMON_PROGRAMS.find(x => x.id === 'dem-efreet').interfaceRank);
check('R10: Balron Interface is 7', 7, () => ice.DEMON_PROGRAMS.find(x => x.id === 'dem-balron').interfaceRank);
check('baseline: Armorjack medium price is 100eb', 100, () => rules.CPR_ARMORS.find(x => x.sp === 12).costEb);
check('R12: zero Humanity retains EMP0 stage (negative triggers GM takeover)', 'cyberpsychosis', () => pharma.getCyberpsychosisStage(0).status);
check('baseline: changing location hides old damage apply button', 0, () => {
  const o = attack(); o.set('attackMode', 'player_total'); o.set('directPlayerTotal', 30); o.render();
  rollAttack(o); click(o, 'Голова (-8');
  return nodes(o.tree, n => n.type === 'button' && textOf(n).includes('ПРИМЕНИТЬ УРОН К ЦЕЛИ')).length;
});
check('B02: editing character name preserves both weapons', 2, () => {
  let party = [{ ...persist.convertCharSheetToPartyMember({ id: 'p', name: 'Test', stats: { BODY: 6, WILL: 6 }, weapons: [weapon(), weapon('Assault Rifle')] }) }];
  const o = mount('src/components/party/PartyView.tsx', 'PartyView', { party, setParty: f => party = f(party) });
  const edit = nodes(o.tree, n => n.type === 'button' && n.props.title?.includes('Редакт'))[0];
  if (!edit) throw Error('Edit button absent'); edit.props.onClick(); o.render();
  nodes(o.tree, n => n.type === 'form')[0].props.onSubmit({ preventDefault() {} }); return party[0].weapons.length;
});
check('B03: malformed backup is rejected before overwriting party', undefined, () => {
  storage.clear(); const o = mount('src/components/common/DataManagementModal.tsx', 'DataManagementModal', { onClose() {}, onDataRestored() {} });
  nodes(o.tree, n => n.type === 'input' && n.props.type === 'file')[0].props.onChange({ target: { files: [{ text: JSON.stringify({ exportVersion: '1.0.0', party: {} }) }] } });
  return storage.get('cpgm_party');
});
check('B04: reset must preserve other apps storage on same origin', 'keep', () => {
  storage.clear(); storage.set('another-app-data', 'keep');
  const o = mount('src/components/common/DataManagementModal.tsx', 'DataManagementModal', { onClose() {}, onDataRestored() {} });
  click(o, 'Очистить все данные'); return storage.get('another-app-data');
});
check('B05: zero HP party import is mortal, not already defeated', false, () => {
  const p = persist.convertCharSheetToPartyMember({ id: 'p', stats: {}, hpCurrent: 0 }); return persist.partyMemberToCombatant(p).isDefeated;
});
check('R13: vehicles together at squares 8 and 8 cannot escape by advancing together', [false, false], () => {
  const o = mount('src/components/chase/ChaseTrackerView.tsx', 'ChaseTrackerView');
  o.set('vehicles', o.get('vehicles').map(v => ({ ...v, gridSquare: 8 }))); o.render();
  const all = nodes(o.tree, n => n.type === 'button' && n.props.onClick?.name === 'handleRollAllPositioning')[0];
  fixedRandom(0.85, () => all.props.onClick()); return o.get('vehicles').map(v => v.isEscaped);
});
check('R14: Pull in Close requires a successful DV13 check', false, () => {
  const o = mount('src/components/chase/ChaseTrackerView.tsx', 'ChaseTrackerView');
  const v = o.get('vehicles')[0]; o.set('activeManeuverModal', { vehicle: v, maneuverId: 'm-pull-close', title: 'test', dv: 13 });
  o.set('maneuverMode', 'manual'); o.set('maneuverManualD10', 1); o.render();
  fixedRandom(0.95, () => click(o, 'Применить ручной бросок манёвра'));
  return o.get('vehicles')[0].isPulledClose;
});
check('B06: NET generation survives component remount', true, () => {
  storage.clear(); const a = mount('src/components/netrun/NetArchitectureView.tsx', 'NetArchitectureView');
  click(a, 'Basic');
  const id = a.get('architectures')[0].id;
  const b = mount('src/components/netrun/NetArchitectureView.tsx', 'NetArchitectureView');
  return b.get('architectures').some(n => n.id === id);
});
check('R15: cannot teleport through locked Password floor', 1, () => {
  const o = mount('src/components/netrun/NetArchitectureView.tsx', 'NetArchitectureView');
  click(o, 'Перейти', 4); return o.get('currentRunnerFloor');
});
check('R16: drug check equality must fail', false, () => {
  const o = mount('src/components/reference/GMReferenceView.tsx', 'GMReferenceView');
  o.set('subTab', 'drugs'); o.set('selectedDrugForCheck', pharma.STREET_DRUGS[0]); o.set('resistBaseStat', 12); o.set('manualResistRoll', 5); o.render();
  const b = nodes(o.tree, n => n.type === 'button' && /handleManualDrugResist/.test(String(n.props.onClick)))[0];
  if (!b) throw Error('Drug manual check button absent'); b.props.onClick(); return o.get('resistTestResult').isSuccess;
});
check('R07: each performed successful death save increases next-save penalty', 1, () => {
  let state = { isActive: true, round: 1, currentTurnIndex: 0, combatants: [actor('a', { hpCurrent: 0 })], log: [] };
  const o = mount('src/components/combat/CombatTrackerView.tsx', 'CombatTrackerView', { combatState: state,
    setCombatState: f => state = typeof f === 'function' ? f(state) : f });
  o.set('deathSaveModalTarget', state.combatants[0]); o.set('deathSaveMode', 'manual'); o.set('manualDeathD10', 2); o.render();
  click(o, 'Применить ручной бросок'); return state.combatants[0].deathSavePenalties;
});
check('R19: hit damaging a mortally wounded actor adds injury and death-save penalty', [1, 1], () => {
  let state = { isActive: true, round: 1, currentTurnIndex: 0, combatants: [actor('a'), actor('b', { hpCurrent: 0 })], log: [] };
  const o = mount('src/components/combat/CombatTrackerView.tsx', 'CombatTrackerView', { combatState: state,
    setCombatState: f => state = typeof f === 'function' ? f(state) : f });
  o.set('attackModalData', { attacker: state.combatants[0], target: state.combatants[1] }); o.render();
  const modal = nodes(o.tree, n => n.type?.name === 'AttackResolverModal')[0];
  modal.props.onApplyDamage('b', 1, 'body', 10, 'probe');
  return [state.combatants[1].criticalInjuries.length, state.combatants[1].deathSavePenalties];
});
check('R19: existing critical injury must be rerolled', 1, () => {
  const injury = { ...rules.CPR_CRITICAL_INJURIES_BODY[0], isActive: true };
  let state = { isActive: true, round: 1, currentTurnIndex: 0, combatants: [actor('a'), actor('b', { criticalInjuries: [injury] })], log: [] };
  const o = mount('src/components/combat/CombatTrackerView.tsx', 'CombatTrackerView', { combatState: state,
    setCombatState: f => state = typeof f === 'function' ? f(state) : f });
  o.set('attackModalData', { attacker: state.combatants[0], target: state.combatants[1] }); o.render();
  nodes(o.tree, n => n.type?.name === 'AttackResolverModal')[0].props.onApplyDamage('b', 5, 'body', 11, 'probe', injury);
  return state.combatants[1].criticalInjuries.filter(i => i.id === injury.id).length;
});
check('R14: NOS moves forward even if control check fails', 2, () => {
  const o = mount('src/components/chase/ChaseTrackerView.tsx', 'ChaseTrackerView'), v = o.get('vehicles')[1];
  o.set('activeManeuverModal', { vehicle: v, maneuverId: 'm-nos', title: 'test', dv: 13 });
  o.set('maneuverMode', 'manual'); o.set('maneuverManualD10', 1); o.render();
  fixedRandom(0.95, () => click(o, 'Применить ручной бросок манёвра')); return o.get('vehicles')[1].gridSquare;
});
check('R14: PIT can target an adjacent grid square', true, () => {
  const o = mount('src/components/chase/ChaseTrackerView.tsx', 'ChaseTrackerView');
  o.set('vehicles', o.get('vehicles').map((v, i) => ({ ...v, gridSquare: 2 + i })));
  const v = o.get('vehicles')[0]; o.set('activeManeuverModal', { vehicle: v, maneuverId: 'm-pit', title: 'test', dv: 15 });
  o.set('maneuverMode', 'manual'); o.set('maneuverManualD10', 9); o.render();
  click(o, 'Применить ручной бросок манёвра'); return o.get('vehicles')[1].isPitSuffering;
});
check('R14: Pull in Close expires at the end of the round', false, () => {
  const o = mount('src/components/chase/ChaseTrackerView.tsx', 'ChaseTrackerView');
  o.set('vehicles', o.get('vehicles').map(v => ({ ...v, isPulledClose: true }))); o.render();
  fixedRandom(0.45, () => nodes(o.tree, n => n.type === 'button' && n.props.onClick?.name === 'handleRollAllPositioning')[0].props.onClick());
  return o.get('vehicles')[0].isPulledClose;
});
check('B06: chase survives component remount', 7, () => {
  const a = mount('src/components/chase/ChaseTrackerView.tsx', 'ChaseTrackerView'); a.set('chaseRound', 7); a.render();
  return mount('src/components/chase/ChaseTrackerView.tsx', 'ChaseTrackerView').get('chaseRound');
});
check('B07: reinforcement preserves current actor by id when reordering initiative', 'b', () => {
  storage.clear();
  storage.set('cpgm_combat', JSON.stringify({ isActive: true, round: 2, currentTurnIndex: 1, combatants: [actor('a', { initiative: 15 }), actor('b', { initiative: 10 })], log: [] }));
  const app = mount('src/App.tsx', 'App');
  nodes(app.tree, n => n.type?.name === 'Header')[0].props.setActiveTab('encounters'); app.render();
  const enc = nodes(app.tree, n => n.type?.name === 'EncountersView')[0];
  fixedRandom(0.45, () => enc.props.onAddAsReinforcement({ title: 'probe', npcs: [{ name: 'c', count: 1, ref: 20, hpMax: 30, weapons: [] }] }));
  const state = app.get('combatState'); return state.combatants[state.currentTurnIndex].id;
});
check('R16: manual drug roll 10 needs extra d10', 27, () => {
  const o = mount('src/components/reference/GMReferenceView.tsx', 'GMReferenceView');
  o.set('subTab', 'drugs'); o.set('selectedDrugForCheck', pharma.STREET_DRUGS[0]); o.set('resistBaseStat', 12); o.set('manualResistRoll', 10); o.render();
  const b = nodes(o.tree, n => n.type === 'button' && /handleManualDrugResist/.test(String(n.props.onClick)))[0];
  fixedRandom(0.45, () => b.props.onClick()); return o.get('resistTestResult').total;
});
check('R15: a 6-floor NET Architecture cannot have more than 2 Control Nodes', true, () => {
  const o = mount('src/components/netrun/NetArchitectureView.tsx', 'NetArchitectureView');
  fixedRandom(0.5, () => click(o, 'Standard'));
  return o.get('architectures')[0].floors.filter(f => f.type === 'ControlNode').length <= 2;
});
check('storage: migrate v1 without deleting legacy or other app data', [true, '[]', 'keep'], () => {
  storage.set('cpgm_party','[]'); storage.set('other','keep');
  persist.saveStoredData('cpgm_networks',[]);
  return [JSON.parse(storage.get('cpgm_database_v2')).cpgm_party.length === 0, storage.get('cpgm_party'), storage.get('other')];
});
check('storage: reject whole malformed restore before any write', true, () => {
  persist.saveStoredData('cpgm_party',[]); const before = storage.get('cpgm_database_v2');
  try { persist.restoreGmDatabase({ exportVersion:'2.0.0', party:[], networks:[{}] }); } catch {}
  return storage.get('cpgm_database_v2') === before;
});
check('storage: quota failure retains persistent value and pending sections for retry', [false,true,7,2], () => {
  const o = mount('src/components/chase/ChaseTrackerView.tsx','ChaseTrackerView');
  const chase = { vehicles:o.get('vehicles'), round:7, log:[] };
  const old = storage.get('cpgm_database_v2'), setItem = globals.localStorage.setItem;
  let saved;
  try { globals.localStorage.setItem = () => { throw Error('quota'); }; saved = persist.saveStoredData('cpgm_chase',chase); }
  finally { globals.localStorage.setItem = setItem; }
  const unchanged = storage.get('cpgm_database_v2') === old;
  persist.saveStoredData('cpgm_netrun',{ activeArchIndex:0,currentRunnerFloor:1,netrunnerInterface:1,netActionsLeft:2,runnerLog:[] });
  const db = JSON.parse(storage.get('cpgm_database_v2'));
  return [saved, unchanged, db.cpgm_chase.round, db.cpgm_netrun.netActionsLeft];
});
check('storage: backup preserves unknown nesting, zero, false and null', {zero:0,no:false,nil:null,nested:{extra:['x']}}, () => {
  const o = mount('src/components/chase/ChaseTrackerView.tsx','ChaseTrackerView');
  const extra = {zero:0,no:false,nil:null,nested:{extra:['x']}};
  persist.restoreGmDatabase({exportVersion:'1.0.0', chase:{vehicles:o.get('vehicles'),round:1,log:[],extra}});
  return persist.loadStoredData('cpgm_chase',null).extra;
});
check('storage: export includes pending data after quota failure', 9, () => {
  const o = mount('src/components/chase/ChaseTrackerView.tsx','ChaseTrackerView');
  const setItem = globals.localStorage.setItem;
  try { globals.localStorage.setItem = () => { throw Error('quota'); }; persist.saveStoredData('cpgm_chase',{vehicles:o.get('vehicles'),round:9,log:[]}); }
  finally { globals.localStorage.setItem = setItem; }
  let dump;
  globals.Blob = class { constructor(parts) { dump = JSON.parse(parts.join('')); } };
  globals.URL = {createObjectURL:()=> 'blob:test', revokeObjectURL:()=>{}};
  globals.document = {createElement:()=>({click(){}})};
  try { persist.exportEntireGmDatabase(); } finally { globals.Blob = Blob; }
  return dump.chase.round;
});
check('storage: complete backup roundtrip includes empty networks and all subsystems', [0,3,1,0], () => {
  const o = mount('src/components/chase/ChaseTrackerView.tsx','ChaseTrackerView');
  persist.restoreGmDatabase({exportVersion:'2.0.0',party:[],combat:{isActive:false,round:1,currentTurnIndex:0,combatants:[],log:[]},customBestiary:[],encounters:[],networks:[],gigs:[],chase:{round:3,vehicles:o.get('vehicles'),log:[]},netrun:{activeArchIndex:0,currentRunnerFloor:1,netrunnerInterface:1,netActionsLeft:0,runnerLog:[]}});
  let dump; globals.Blob = class {constructor(parts){dump=JSON.parse(parts.join(''));}};
  try { persist.exportEntireGmDatabase(); } finally { globals.Blob = Blob; }
  persist.clearGmDatabase(); persist.restoreGmDatabase(dump);
  return [persist.loadStoredData('cpgm_networks',null).length,persist.loadStoredData('cpgm_chase',null).round,persist.loadStoredData('cpgm_netrun',null).currentRunnerFloor,persist.loadStoredData('cpgm_gigs',null).length];
});
check('attack: input edits invalidate old hit and damage', [null,null], () => {
  const o = attack(); o.set('attackerSkillBase',30); o.render(); rollAttack(o);
  o.set('luckSpent',1); o.render(); return [o.get('attackRoll'),o.get('damageResolution')];
});
for (const hit of [true,false]) check(`attack: ${hit?'hit':'miss'} spends ammo and Luck once on confirmation`, [[1,2]], () => {
  const o = attack({luckCurrent:3}); let spent=[];
  o.props.onSpendResources = (_id,_index,ammo,luck) => spent.push([ammo,luck]);
  o.set('attackerSkillBase',hit?30:0); o.set('luckSpent',2); o.render(); rollAttack(o);
  const apply = button(o,hit?'ПРИМЕНИТЬ УРОН К ЦЕЛИ':'Зафиксировать промах');
  apply.props.onClick(); apply.props.onClick(); o.render(); return spent;
});
check('attack: insufficient ammo cannot roll or spend resources', [null,0], () => {
  const o=attack({weapons:[{...weapon(),currentAmmo:0}]}); let spent=0; o.props.onSpendResources=()=>spent++;
  rollAttack(o); return [o.get('attackRoll'),spent];
});
check('attack: melee requires and uses actual Evasion total', [15,false], () => {
  const o=attack({weapons:[weapon('Melee')]}); o.set('defenseTotal',15); o.set('attackerSkillBase',10); o.render(); rollAttack(o);
  return [o.get('attackRoll').targetDv,o.get('attackRoll').isSuccess];
});
check('attack: autofire multiplies rolled damage but critical bonus only once', [48,53], () => {
  const o=attack({weapons:[{...weapon('Assault Rifle'),currentAmmo:30,magCapacity:30}]},{bodySp:0});
  o.set('attackerSkillBase',30); o.set('autofire',true); o.set('damageMode','manual'); o.set('manualDamageTotal',12); o.set('manualIsCrit',true); o.render(); rollAttack(o);
  return [o.get('damageRoll').totalDamage,o.get('damageResolution').finalHpLoss];
});
check('combat: Cracked Skull multiplies penetration by three, bonus remains five', 17, () => combat.resolveCprDamage({rawDamage:15,targetSp:11,location:'head',isCritInjuryRoll:true,existingInjuries:[{...rules.CPR_CRITICAL_INJURIES_HEAD.find(i=>i.nameEn==='Cracked Skull'),isActive:true}]}).finalHpLoss);
check('combat: brawling uses full SP', 1, () => combat.resolveCprDamage({rawDamage:12,targetSp:11,location:'body',isMelee:true,isBrawling:true}).finalHpLoss);
check('chase: escape depends on distance from every pursuer', [false,true], () => {
  const chase=load('src/utils/chase.ts'); const o=mount('src/components/chase/ChaseTrackerView.tsx','ChaseTrackerView'); const v=o.get('vehicles')[0];
  return [8,9].map(distance=>chase.markEscapes([{...v,id:'p',side:'pursuer',gridSquare:100},{...v,id:'e',side:'evader',gridSquare:100+distance}])[1].isEscaped);
});
check('chase: all active vehicles remain visible after long travel', true, () => {
  const o=mount('src/components/chase/ChaseTrackerView.tsx','ChaseTrackerView'); o.set('vehicles',o.get('vehicles').map((v,i)=>({...v,gridSquare:100+i}))); o.render();
  return textOf(o.tree).includes('101');
});
check('chase: second maneuver in the round is blocked', 2, () => {
  const o=mount('src/components/chase/ChaseTrackerView.tsx','ChaseTrackerView'); const v=o.get('vehicles')[1];
  o.set('activeManeuverModal',{vehicle:v,maneuverId:'m-nos',title:'test',dv:13}); o.set('maneuverMode','manual'); o.set('maneuverManualD10',9); o.render();
  click(o,'Применить ручной бросок манёвра'); o.set('activeManeuverModal',{vehicle:v,maneuverId:'m-nos',title:'test',dv:13}); o.render(); click(o,'Применить ручной бросок манёвра');
  return o.get('vehicles')[1].gridSquare;
});
check('netrun: loaded action pool capped at Interface allowance', 2, () => {
  persist.saveStoredData('cpgm_netrun',{activeArchIndex:0,currentRunnerFloor:1,netrunnerInterface:1,netActionsLeft:5,runnerLog:[]});
  return mount('src/components/netrun/NetArchitectureView.tsx','NetArchitectureView').get('netActionsLeft');
});
check('netrun: negative damage cannot heal Black ICE', true, () => {
  const o=mount('src/components/netrun/NetArchitectureView.tsx','NetArchitectureView');
  const before=JSON.stringify(o.get('architectures')); o.set('customIceDmg',-10); o.render();
  const b=nodes(o.tree,n=>n.type==='button' && String(n.props.onClick).includes('customIceDmg'))[0];
  if (!b) throw Error('Black ICE custom damage control absent'); b.props.onClick(); o.render();
  return before===JSON.stringify(o.get('architectures'));
});
function npcBuilder(initial = []) {
  let saved = initial;
  const o = mount('src/components/bestiary/BestiaryView.tsx', 'BestiaryView', {
    customBestiary: initial, setCustomBestiary: update => { saved = typeof update === 'function' ? update(saved) : update; }, onAddNpcToCombat() {},
  });
  o.saved = () => saved;
  o.submit = () => nodes(o.tree, n => n.type === 'form')[0].props.onSubmit({preventDefault(){}});
  return o;
}
function sameJsonData(a, b) {
  const sort = value => Array.isArray(value) ? value.map(sort) : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, sort(value[key])])) : value;
  return JSON.stringify(sort(a)) === JSON.stringify(sort(b));
}
check('NPC: manual skills preserve exact bases, zero and additional skills through save and combat', [17,0,15,17], () => {
  const o = npcBuilder(); click(o,'СОЗДАТЬ NPC ВРУЧНУЮ'); o.set('npcName','Scout');
  nodes(o.tree,n=>n.type?.name==='NpcSkillsEditor')[0].props.onChange([
    {nameRu:'Короткоствольное (Handgun)',base:17},{nameRu:'Уклонение',base:0},{nameRu:'Восприятие',base:15}]);
  o.set('npcRef',8); o.render(); o.submit();
  if (!persist.saveStoredData('cpgm_custom_bestiary',o.saved())) throw Error('NPC not persisted');
  const loaded = persist.loadStoredData('cpgm_custom_bestiary',[])[0];
  const app = mount('src/App.tsx','App');
  nodes(app.tree,n=>n.type?.name==='Header')[0].props.setActiveTab('bestiary'); app.render();
  nodes(app.tree,n=>n.type?.name==='BestiaryView')[0].props.onAddNpcToCombat(loaded,1); app.render();
  const c = app.get('combatState').combatants[0];
  return [...c.skills.map(s=>s.base),combat.attackBase(c,c.weapons[0],false)];
});
check('NPC: editing skills preserves weapons, other stats, gear and unknown fields without duplicating NPC', [1,true,true,true,true,19], () => {
  const source = JSON.parse(JSON.stringify(bestiary.OFFICIAL_CPR_BESTIARY[0]));
  Object.assign(source,{id:'custom-preserve',isCustom:true,extra:{zero:0,no:false}});
  const original = JSON.stringify(source), o=npcBuilder([source]); click(o,'Редактировать NPC');
  nodes(o.tree,n=>n.type?.name==='NpcSkillsEditor')[0].props.onChange([...source.skills,{nameRu:'Электроника',base:19}]);
  o.render(); o.submit(); const saved=o.saved()[0];
  return [o.saved().length, JSON.stringify(source)===original,sameJsonData(saved.weapons,source.weapons),
    sameJsonData(saved.stats,source.stats),sameJsonData(saved.extra,source.extra)&&sameJsonData(saved.gear,source.gear),saved.skills.at(-1).base];
});
check('NPC: copying an official template creates a separate custom NPC', [true,true,18], () => {
  const before=JSON.stringify(bestiary.OFFICIAL_CPR_BESTIARY[0]),o=npcBuilder(); click(o,'Создать копию NPC');
  o.set('npcSkills',[{nameRu:'Уклонение',base:18}]); o.render(); o.submit(); const saved=o.saved()[0];
  return [saved.id!==bestiary.OFFICIAL_CPR_BESTIARY[0].id&&saved.isCustom,JSON.stringify(bestiary.OFFICIAL_CPR_BESTIARY[0])===before,saved.skills[0].base];
});
for (const base of [NaN,-1,1.5]) check(`NPC: invalid skill base ${base} cannot save`, 0, () => {
  const o=npcBuilder(); click(o,'СОЗДАТЬ NPC ВРУЧНУЮ'); o.set('npcName','Invalid'); o.set('npcSkills',[{nameRu:'Уклонение',base}]); o.render(); o.submit(); return o.saved().length;
});
check('NPC: skill editor adds, edits and removes rows while preserving zero', [{nameRu:'Восприятие',base:0}], () => {
  let skills=[];
  const o=mount('src/components/bestiary/NpcSkillsEditor.tsx','NpcSkillsEditor',{skills,onChange:value=>{skills=value;o.props.skills=value;}});
  click(o,'Добавить навык');
  nodes(o.tree,n=>n.type==='input'&&n.props['aria-label']==='Название навыка 1')[0].props.onChange({target:{value:'Восприятие'}});o.render();
  click(o,'Добавить навык');
  nodes(o.tree,n=>n.type==='button'&&n.props['aria-label']==='Удалить навык 2')[0].props.onClick();o.render();return skills;
});
check('NPC: legacy Shooting base is used, specific weapon skill takes priority', [18,14,undefined], () => {
  const c=actor('shoot',{skills:[{nameRu:'Стрельба',base:18}]});
  const generic=combat.attackBase(c,weapon(),false);
  c.skills.push({nameRu:'Короткоствольное оружие',base:14});
  return [generic,combat.attackBase(c,weapon(),false),combat.attackBase(c,weapon('Autofire Assault Rifle'),false)];
});
check('NPC: individual encounter skills stay separate from template and other NPCs, then reach combat', [20,10,10,20], () => {
  const template=JSON.parse(JSON.stringify(bestiary.OFFICIAL_CPR_BESTIARY[0])); template.skills=[{nameRu:'Уклонение',base:10}];
  let saved;
  const o=mount('src/components/encounters/EncounterFormModal.tsx','EncounterFormModal',{isOpen:true,onClose(){},onSave:e=>saved=e,templates:[template]});
  o.set('title','Skills test');o.render();click(o,'Из бестиария');click(o,'+ Свой NPC');
  nodes(o.tree,n=>n.type?.name==='NpcSkillsEditor')[1].props.onChange([{nameRu:'Уклонение',base:10}]);o.render();
  nodes(o.tree,n=>n.type?.name==='NpcSkillsEditor')[0].props.onChange([{nameRu:'Уклонение',base:20}]);o.render();
  nodes(o.tree,n=>n.type==='form')[0].props.onSubmit({preventDefault(){}});
  persist.saveStoredData('cpgm_encounters',[saved]);
  const loaded=persist.loadStoredData('cpgm_encounters',[])[0];
  const app=mount('src/App.tsx','App');nodes(app.tree,n=>n.type?.name==='Header')[0].props.setActiveTab('encounters');app.render();
  nodes(app.tree,n=>n.type?.name==='EncountersView')[0].props.onStartCombat(loaded,false);app.render();
  const first=app.get('combatState').combatants[0];
  return [loaded.npcs[0].skills[0].base,template.skills[0].base,loaded.npcs[1].skills[0].base,combat.skillBase(first,/уклонение/i,'dex')];
});
// Fixture serialized by the current sheet's real exportSingleCharacter (dfced0c).
// Descriptions and personal data were replaced with synthetic values before export.
const cyberSheet = JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/charsheet-cyberware.json'),'utf8'));
const weaponsUtil = load('src/utils/weapons.ts');
check('charsheet: linked weapons, installed slots and inventory survive import, combat and backup restore', true, () => {
  const original=JSON.stringify(cyberSheet);
  const [member]=persist.importPartyMembers(cyberSheet);
  persist.saveStoredData('cpgm_party',[member]);
  const loaded=persist.loadStoredData('cpgm_party',[])[0];
  const fighter=persist.partyMemberToCombatant(loaded);
  const backup=JSON.parse(JSON.stringify({exportVersion:'2.0.0',party:[loaded]}));
  persist.clearGmDatabase();persist.restoreGmDatabase(backup);
  return JSON.stringify(persist.loadStoredData('cpgm_party',[])[0].sourceCharSheet)===original &&
    JSON.stringify(fighter.weapons)===JSON.stringify(cyberSheet.weapons) &&
    cyberSheet.cyberware.some(i=>i.isInstalled===false) &&
    JSON.stringify(cyberSheet)===original;
});
check('charsheet: Export All accepted by both import entry points and reimport replaces matching IDs', [2,2,2], () => {
  const other={...cyberSheet,id:'compat-other'};
  let party=[];
  const o=mount('src/components/party/PartyView.tsx','PartyView',{party,setParty:f=>party=f(party)});
  const files=nodes(o.tree,n=>n.type==='input'&&n.props.type==='file')[0];
  files.props.onChange({target:{files:[{text:JSON.stringify([cyberSheet,other])}]}});
  const partyCount=party.length;
  const data=mount('src/components/common/DataManagementModal.tsx','DataManagementModal',{onClose(){},onDataRestored(){}});
  const upload=nodes(data.tree,n=>n.type==='input'&&n.props.type==='file')[0];
  upload.props.onChange({target:{files:[{text:JSON.stringify([cyberSheet,other])}]}});
  upload.props.onChange({target:{files:[{text:JSON.stringify(cyberSheet)}]}});
  return [partyCount,persist.loadStoredData('cpgm_party',[]).length,party[0].weapons.filter(w=>w.damage==='').length];
});
check('charsheet: one invalid sheet rejects the entire array without changing the stored party', true, () => {
  persist.saveStoredData('cpgm_party',persist.importPartyMembers(cyberSheet));
  const before=storage.get('cpgm_database_v2');
  const o=mount('src/components/common/DataManagementModal.tsx','DataManagementModal',{onClose(){},onDataRestored(){}});
  nodes(o.tree,n=>n.type==='input'&&n.props.type==='file')[0].props.onChange({target:{files:[{text:JSON.stringify([cyberSheet,{...cyberSheet,id:'bad',weapons:[{...cyberSheet.weapons[0],selectedProfile:99}]}])}]}});
  return storage.get('cpgm_database_v2')===before;
});
check('charsheet: malformed profile, flags and magazine data are rejected', [true,true,true,true,true,true], () => {
  const validate=load('src/utils/validation.ts').validWeapon;
  const base=cyberSheet.weapons[0];
  return [{selectedProfile:-1},{profileAmmo:{x:-1}},{damageProfiles:[{name:'bad',damage:'x'}]},
    {attackRequiresRoll:'false'},{canCrit:0},{armorPenetration:'all'}].map(change=>!validate({...base,...change}));
});
check('charsheet: selected profile spends its own magazine without changing original ammo or implant ownership', [6,0,1,0,0,'cat-cyber-162'], () => {
  const raw=cyberSheet.weapons[0];const selected=weaponsUtil.selectedWeaponProfile(raw);
  const spent=weaponsUtil.spendWeaponAmmo(raw,1);
  return [Number(selected.damage[0]),raw.currentAmmo,selected.currentAmmo,spent.currentAmmo,
    weaponsUtil.selectedWeaponProfile(spent).currentAmmo,spent.sourceCyberwareId];
});
check('charsheet: profiles sharing a magazine consume the base magazine', [2,1,undefined], () => {
  const w={...weapon(),currentAmmo:2,damageProfiles:[{name:'mode',damage:'3d6'}]};
  const spent=weaponsUtil.spendWeaponAmmo(w,1);
  return [w.currentAmmo,spent.currentAmmo,spent.profileAmmo];
});
check('charsheet: combat confirmation spends selected profile ammo', [0,0], () => {
  const fighter=actor('profile-user',{weapons:[cyberSheet.weapons[0]]});
  let state={isActive:false,round:1,currentTurnIndex:0,combatants:[fighter],log:[]};
  const o=mount('src/components/combat/CombatTrackerView.tsx','CombatTrackerView',{combatState:state,setCombatState:f=>state=f(state)});
  o.set('attackModalData',{attacker:fighter});o.render();
  const resolver=nodes(o.tree,n=>n.type?.name==='AttackResolverModal')[0];
  if(!resolver)throw Error('Resolver not open');
  resolver.props.onSpendResources(fighter.id,0,1,0);
  return [state.combatants[0].weapons[0].currentAmmo,weaponsUtil.selectedWeaponProfile(state.combatants[0].weapons[0]).currentAmmo];
});
check('charsheet: no-damage and no-roll implant effects do not invent attacks or damage', [null,null,true,true], () => {
  const outcomes=[cyberSheet.weapons[1],{...weapon(),attackRequiresRoll:false}].map(w=>{
    const o=attack({weapons:[w]});rollAttack(o);
    return {attack:o.get('attackRoll'),damage:o.get('damageRoll'),error:o.get('attackError')};
  });
  return [outcomes[0].attack,outcomes[1].damage,...outcomes.map(r=>r.error.includes('вручную'))];
});
check('charsheet: selected profile drives attack skill and damage', [12,12], () => {
  const w={...weapon(),damageProfiles:[{name:'Melee mode',damage:'4d6',category:'Heavy Melee',skillId:'melee_weapon'}]};
  const o=attack({weapons:[w],skills:[{id:'handgun',base:5},{id:'melee_weapon',base:12}]},{bodySp:0});
  o.set('isAmbush',true);o.render();rollAttack(o);
  return [o.get('attackerSkillBase'),o.get('damageRoll').totalDamage];
});
check('charsheet: cyberweapon penetration overrides category defaults', [11,5,0], () => ['none','half','ignore'].map(armorPenetration=>combat.resolveCprDamage({rawDamage:12,location:'body',targetSp:11,isMelee:true,armorPenetration}).effectiveSp));
check('charsheet: canCrit=false suppresses automatic and manual double-six injury', [false,false], () => {
  const auto=attack({weapons:[{...weapon(),canCrit:false}]},{bodySp:0});auto.set('attackMode','player_total');auto.set('directPlayerTotal',30);auto.render();
  fixedRandom(0.99,()=>nodes(auto.tree,n=>n.type==='button'&&n.props.onClick?.name==='handleRollAttack')[0].props.onClick());auto.render();
  const manual=attack({weapons:[{...weapon(),canCrit:false}]},{bodySp:0});manual.set('damageMode','manual');manual.set('manualIsCrit',true);manual.set('attackMode','player_total');manual.set('directPlayerTotal',30);manual.render();rollAttack(manual);
  return [auto.get('damageRoll').isCriticalInjury,manual.get('damageRoll').isCriticalInjury];
});
check('charsheet: editing name preserves a non-damaging first weapon', '', () => {
  let party=persist.importPartyMembers({...cyberSheet,weapons:[cyberSheet.weapons[1]]});
  const o=mount('src/components/party/PartyView.tsx','PartyView',{party,setParty:f=>party=f(party)});
  nodes(o.tree,n=>n.type==='button'&&n.props.title?.includes('Редакт'))[0].props.onClick();o.render();
  o.set('name','Renamed');o.render();nodes(o.tree,n=>n.type==='form')[0].props.onSubmit({preventDefault(){}});
  return party[0].weapons[0].damage;
});
check('charsheet: automatic implant stat effects have an explicit manual-review warning', [true,undefined], () => [!!persist.charSheetImportWarning(persist.importPartyMembers(cyberSheet)[0]),persist.charSheetImportWarning(persist.importPartyMembers({...cyberSheet,automaticCyberwareEffects:false})[0])]);
check('charsheet: increased implant HP imports without discarding current health', [60,60,true], () => {
  const [member]=persist.importPartyMembers({...cyberSheet,hpCurrent:60});
  return [member.hpCurrent,member.hpMax,!!persist.charSheetImportWarning(member)];
});

const errors = results.filter(r => r.error);
const output = { generatedAt: new Date().toISOString(), method: 'actual TS/TSX functions and synchronous component-handler/effect harness; no browser or real storage',
  passed: results.filter(r => r.passed).length, failed: results.filter(r => !r.passed).length, harnessErrors: errors.length, results };
fs.writeFileSync(path.join(__dirname, 'probe-results.json'), JSON.stringify(output, null, 2) + '\n');
for (const r of results) console.log(`${r.error ? 'ERROR' : r.passed ? 'PASS' : 'FAIL'} ${r.id}: ${r.error || JSON.stringify(r.actual)}`);
console.log(`Passed ${output.passed}; failed ${output.failed}; harness errors ${output.harnessErrors}`);
process.exitCode = output.failed ? 1 : 0;
