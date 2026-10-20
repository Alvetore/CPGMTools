import { StatKey, Weapon } from './character';
import { CombatantType } from './combat';

export type ThreatLevel = 'Mook' | 'Lieutenant' | 'Boss' | 'Drone';

export interface NpcTemplate {
  id: string;
  nameRu: string;
  nameEn: string;
  threatLevel: ThreatLevel;
  faction?: string;
  description: string;
  stats: Record<StatKey, number>;
  hpMax: number;
  headSp: number;
  bodySp: number;
  armorName: string;
  weapons: Weapon[];
  skills: { nameRu: string; base: number }[];
  cyberware: string[];
  gear: string[];
  tactics?: string;
  isCustom?: boolean;
}

export interface EncounterNpcItem {
  id: string;
  templateId?: string;
  name: string;
  count: number;
  threatLevel: ThreatLevel;
  hpMax: number;
  headSp: number;
  bodySp: number;
  ref: number;
  dex: number;
  body: number;
  weapons: Weapon[];
  notes?: string;
}

export interface Encounter {
  id: string;
  title: string;
  description?: string;
  location?: string;
  threatLevel?: 'Low' | 'Medium' | 'High' | 'Deadly';
  tags: string[];
  npcs: EncounterNpcItem[];
  createdAt: number;
  updatedAt: number;
}
