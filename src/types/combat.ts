import { CriticalInjury, Weapon } from './character';

export type CombatantType = 'player' | 'enemy' | 'ally' | 'neutral' | 'drone';

export interface Condition {
  id: string;
  name: string;
  roundsRemaining: number | null; // null = persistent until removed
  color?: string;
  notes?: string;
}

export interface Combatant {
  id: string;
  name: string;
  handle?: string;
  role?: string;
  type: CombatantType;
  initiative: number;
  
  // CPR Core Combat Stats
  ref: number;
  dex: number;
  move: number;
  body: number;
  
  // Health & Death Save
  hpCurrent: number;
  hpMax: number;
  deathSavePenalties: number; // +1 per round at 0 HP
  
  // Armor (Separated Head and Body SP)
  headSp: number;
  headSpMax: number;
  bodySp: number;
  bodySpMax: number;
  shieldHp?: number;
  shieldHpMax?: number;

  // Equipment & State
  weapons: Weapon[];
  conditions: Condition[];
  criticalInjuries: CriticalInjury[];
  notes?: string;
  
  isDefeated: boolean;
  isDelayed: boolean;
  sourceCharacterId?: string; // If imported from CyberpunkCharSheetG
}

export interface CombatLogEntry {
  id: string;
  timestamp: string;
  round: number;
  message: string;
  type: 'attack' | 'damage' | 'heal' | 'deathsave' | 'turn' | 'condition' | 'system';
}

export interface ActiveCombatState {
  isActive: boolean;
  round: number;
  currentTurnIndex: number;
  combatants: Combatant[];
  log: CombatLogEntry[];
}
