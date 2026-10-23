import { Character, Weapon, CriticalInjury } from './character';

export interface PartyMember {
  id: string;
  name: string;
  handle: string;
  role: string;
  playerName?: string;
  hpMax: number;
  hpCurrent: number;
  headSp: number;
  headSpMax: number;
  bodySp: number;
  bodySpMax: number;
  ref: number;
  dex: number;
  move: number;
  body: number;
  emp: number;
  humanity: number;
  luckMax: number;
  luckCurrent: number;
  passivePerception: number;
  weapons: Weapon[];
  notes?: string;
  avatarUrl?: string;
  sourceCharSheet?: Character;
  will?: number;
  armorPenalty?: number;
  roleRank?: number;
  skills?: { id?: string; nameRu?: string; base?: number; level?: number; stat?: string }[];
  deathSavePenalties?: number;
  criticalInjuries?: CriticalInjury[];
  isDead?: boolean;
  isStabilized?: boolean;
}
