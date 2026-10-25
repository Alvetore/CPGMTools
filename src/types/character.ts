export type StatKey = 
  | 'INT' 
  | 'REF' 
  | 'DEX' 
  | 'TECH' 
  | 'COOL' 
  | 'WILL' 
  | 'LUCK' 
  | 'MOVE' 
  | 'BODY' 
  | 'EMP';

export type RoleType = 
  | 'Solo' 
  | 'Netrunner' 
  | 'Tech' 
  | 'Medtech' 
  | 'Rockerboy' 
  | 'Media' 
  | 'Lawman' 
  | 'Exec' 
  | 'Fixer' 
  | 'Nomad';

export interface Weapon {
  id: string;
  name: string;
  category: string;
  damage: string; // e.g. "3d6", "4d6", "5d6"
  standardRof: number;
  magCapacity: number;
  currentAmmo: number;
  ammoType: string;
  concealable?: boolean;
  notes?: string;
  quality?: 'Poor' | 'Standard' | 'Excellent';
  skillId?: string;
  damageProfiles?: ({ name: string; damage: string } & Partial<Pick<Weapon, 'category' | 'skillId' | 'standardRof' | 'magCapacity' | 'ammoType' | 'quality' | 'armorPenetration' | 'canCrit' | 'bodyRequirement' | 'autofireLimit' | 'attackRequiresRoll'>>)[];
  selectedProfile?: number;
  profileAmmo?: Record<string, number>;
  sourceCyberwareId?: string;
  armorPenetration?: 'none' | 'half' | 'ignore';
  canCrit?: boolean;
  attackRequiresRoll?: boolean;
  bodyRequirement?: number;
  autofireLimit?: number;
}

export interface ArmorItem {
  id: string;
  name: string;
  location: 'head' | 'body' | 'shield';
  spMax: number;
  spCurrent: number;
  penalty: number; // REF/DEX/MOVE penalty
  notes?: string;
}

export interface CriticalInjury {
  id: string;
  nameRu: string;
  nameEn: string;
  location: 'head' | 'body';
  rollNumber: number;
  effectRu: string;
  effectEn: string;
  quickFixDv: number;
  treatmentDv: number;
  quickFixTextRu?: string;
  quickFixTextEn?: string;
  treatmentTextRu?: string;
  treatmentTextEn?: string;
  isActive: boolean;
  deathSaveModifier?: number;
  actionModifier?: number;
  rangedModifier?: number;
  meleeModifier?: number;
  moveModifier?: number;
  noDodge?: boolean;
  headMultiplier?: number;
  recurringDamage?: number;
}

export interface Character {
  id: string;
  name: string;
  handle: string;
  role: RoleType;
  roleRank: number;
  avatarUrl?: string;
  notes?: string;
  stats: Record<StatKey, number>;
  statMods?: Record<StatKey, number>;
  hpCurrent: number;
  hpMaxManual?: number;
  humanityCurrent: number;
  luckCurrent: number;
  deathSavePenalties: number;
  armor: {
    head: ArmorItem;
    body: ArmorItem;
    shield?: ArmorItem;
  };
  skills?: any[];
  weapons: Weapon[];
  cyberware?: any[];
  automaticCyberwareEffects?: boolean;
  gear?: any[];
  criticalInjuries?: CriticalInjury[];
}
