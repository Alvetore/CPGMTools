export type NetNodeType = 'Password' | 'File' | 'ControlNode' | 'BlackIce' | 'Demon';

export interface BlackIceProgram {
  id: string;
  nameRu: string;
  nameEn: string;
  category: 'Anti-Program' | 'Anti-Personnel';
  spd: number;
  atk: number;
  def: number;
  rezMax: number;
  effectRu: string;
  icon?: string;
}

export interface NetFloor {
  id: string;
  floorNumber: number;
  name: string;
  type: NetNodeType;
  dv: number;
  description: string;
  blackIce?: {
    id: string;
    name: string;
    category: 'Anti-Program' | 'Anti-Personnel';
    spd: number;
    atk: number;
    def: number;
    rezCurrent: number;
    rezMax: number;
    effect: string;
    isDerezed: boolean;
  };
  controlTarget?: string;
  isUnlocked: boolean;
  notes?: string;
}

export interface NetArchitecture {
  id: string;
  title: string;
  difficulty: 'Basic' | 'Standard' | 'Advanced' | 'Military';
  systemName: string;
  floors: NetFloor[];
  notes?: string;
  createdAt: number;
}
