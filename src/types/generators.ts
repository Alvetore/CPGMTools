export interface GeneratedGig {
  id: string;
  title: string;
  client: {
    name: string;
    faction: string;
    reputation?: string;
    agenda: string;
  };
  mission: {
    objective: string;
    target: string;
    details: string;
  };
  twist: {
    title: string;
    description: string;
  };
  location: {
    name: string;
    district: string;
    features: string;
  };
  payoutEb: number;
  repReward: number;
  createdAt: number;
}

export interface GeneratedWeather {
  condition: string;
  visibility: string;
  atmosphere: string;
  mechanicalEffect?: string;
  streetIncident: string;
}

export interface PocketLootItem {
  id: string;
  roll: number;
  nameRu: string;
  nameEn: string;
  category: 'Credchip' | 'Drug' | 'Weapon' | 'Cyberware' | 'Curio' | 'Junk';
  valueEb: number;
  notes: string;
}
