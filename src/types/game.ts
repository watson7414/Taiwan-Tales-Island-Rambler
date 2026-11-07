export type StatType = 'STR' | 'INT' | 'AGI' | 'LUK';

export interface CoreStats {
  STR: number; // 力量: 物理體能、近戰、破障
  INT: number; // 智力: 知識、古籍符文、地脈分析
  AGI: number; // 敏捷: 反應、閃避、穿梭人潮
  LUK: number; // 幸運: 奇遇、抽籤、靈感
}

export interface VitalGauges {
  hp: number;
  maxHp: number;
  san: number;
  maxSan: number;
  stamina: number;
  maxStamina: number;
  twd: number;
  lv: number;
  exp: number;
  maxExp: number;
}

export interface Item {
  id: string;
  name: string;
  type: 'consumable' | 'material' | 'talisman' | 'curio';
  description: string;
  value: number; // TWD value
  effects?: {
    hp?: number;
    san?: number;
    stamina?: number;
    buffStat?: StatType;
    buffAmount?: number;
    buffDurationTurns?: number;
  };
  quantity: number;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  resultItemId: string;
  resultItemName: string;
  resultDescription: string;
  ingredients: { itemId: string; itemName: string; count: number }[];
  requiredInt: number;
}

export interface IncidentChoice {
  id: string;
  text: string;
  statCheck?: {
    stat: StatType;
    dc: number;
  };
  autoSuccess?: boolean;
  successText: string;
  successReward: {
    exp: number;
    twd?: number;
    san?: number;
    hp?: number;
    stamina?: number;
    items?: { id: string; name: string; quantity: number }[];
  };
  failureText?: string;
  failurePenalty?: {
    hp?: number;
    san?: number;
    stamina?: number;
  };
}

export interface Incident {
  id: string;
  title: string;
  districtId: string;
  tag: string;
  description: string;
  choices: IncidentChoice[];
}

export interface District {
  id: string;
  name: string;
  county: string;
  region: string;
  landmark: string;
  atmosphere: string;
  occultLevel: number; // 1 to 5
  hasStation: {
    thsr: boolean;
    tra: boolean;
    bus: boolean;
    taxi: boolean;
    ferry?: boolean;
  };
  innCost: number;
  storeItems: Item[];
  incidents: Incident[];
}

export interface County {
  id: string;
  name: string;
  districts: District[];
}

export interface Region {
  id: string;
  name: string;
  description: string;
  counties: County[];
}

export type TransitType = 'THSR' | 'TRA' | 'BUS' | 'TAXI' | 'FERRY';

export interface TransitVehicle {
  type: TransitType;
  name: string;
  fareEstimate: number;
  staminaCost: number;
  incidentChance: number;
  speed: string;
  description: string;
  icon: string;
}

export interface PlayerCharacter {
  name: string;
  title: string;
  archetype: string;
  stats: CoreStats;
  vitals: VitalGauges;
  currentDistrictId: string;
  inventory: Item[];
  investigatedIncidents: string[];
  solvedCount: number;
  transitCount: number;
  buffs: {
    stat: StatType;
    amount: number;
    turnsRemaining: number;
  }[];
  journal: {
    timestamp: string;
    text: string;
    type: 'explore' | 'check' | 'travel' | 'craft' | 'rest';
  }[];
}

export interface SaveSlotData {
  slot: number;
  timestamp: string;
  player: PlayerCharacter;
  checksum: string;
  isAutosave?: boolean;
}
