import { CriticalInjury, Weapon } from '../types/character';

// Corebook pp. 173, 186–188, 220–222.
export const RANGE_BANDS = ["0-6m","7-12m","13-25m","26-50m","51-100m","101-200m","201-400m","401-800m"] as const;
export type RangeBand = typeof RANGE_BANDS[number];
export interface WeaponRangeDVs { categoryRu: string; categoryEn: string; dvs: Record<RangeBand, number | null>; }

export const CPR_RANGE_DV_TABLE: Record<string, WeaponRangeDVs> = {
  "pistol": {
    "categoryRu": "Пистолет (Любой)",
    "categoryEn": "Pistol (Medium, Heavy, Very Heavy)",
    "dvs": {
      "0-6m": 13,
      "7-12m": 15,
      "13-25m": 20,
      "26-50m": 25,
      "51-100m": 30,
      "101-200m": 30,
      "201-400m": null,
      "401-800m": null
    }
  },
  "smg": {
    "categoryRu": "ПП / Тяжёлый ПП (Одиночный)",
    "categoryEn": "SMG / Heavy SMG (Single Shot)",
    "dvs": {
      "0-6m": 15,
      "7-12m": 13,
      "13-25m": 15,
      "26-50m": 20,
      "51-100m": 25,
      "101-200m": 25,
      "201-400m": 30,
      "401-800m": null
    }
  },
  "shotgun_slug": {
    "categoryRu": "Дробовик (Жакан)",
    "categoryEn": "Shotgun (Slug)",
    "dvs": {
      "0-6m": 13,
      "7-12m": 15,
      "13-25m": 20,
      "26-50m": 25,
      "51-100m": 30,
      "101-200m": 35,
      "201-400m": null,
      "401-800m": null
    }
  },
  "shotgun_shell": {
    "categoryRu": "Дробовик (дробь, область 6 м)",
    "categoryEn": "Shotgun (Buckshot Cone)",
    "dvs": {
      "0-6m": 13,
      "7-12m": null,
      "13-25m": null,
      "26-50m": null,
      "51-100m": null,
      "101-200m": null,
      "201-400m": null,
      "401-800m": null
    }
  },
  "assault_rifle": {
    "categoryRu": "Штурмовая винтовка (Одиночный)",
    "categoryEn": "Assault Rifle (Single Shot)",
    "dvs": {
      "0-6m": 17,
      "7-12m": 16,
      "13-25m": 15,
      "26-50m": 13,
      "51-100m": 15,
      "101-200m": 20,
      "201-400m": 25,
      "401-800m": 30
    }
  },
  "sniper_rifle": {
    "categoryRu": "Снайперская винтовка",
    "categoryEn": "Sniper Rifle",
    "dvs": {
      "0-6m": 30,
      "7-12m": 25,
      "13-25m": 25,
      "26-50m": 20,
      "51-100m": 15,
      "101-200m": 16,
      "201-400m": 17,
      "401-800m": 20
    }
  },
  "bow": {
    "categoryRu": "Лук и Арбалет",
    "categoryEn": "Bow & Crossbow",
    "dvs": {
      "0-6m": 15,
      "7-12m": 13,
      "13-25m": 15,
      "26-50m": 17,
      "51-100m": 20,
      "101-200m": 22,
      "201-400m": null,
      "401-800m": null
    }
  },
  "autofire_smg": {
    "categoryRu": "Очередь: ПП",
    "categoryEn": "Autofire: SMG",
    "dvs": {
      "0-6m": 20,
      "7-12m": 17,
      "13-25m": 20,
      "26-50m": 25,
      "51-100m": null,
      "101-200m": null,
      "201-400m": null,
      "401-800m": null
    }
  },
  "autofire_rifle": {
    "categoryRu": "Очередь: Штурмовая винтовка",
    "categoryEn": "Autofire: Assault Rifle",
    "dvs": {
      "0-6m": 22,
      "7-12m": 20,
      "13-25m": 17,
      "26-50m": 20,
      "51-100m": 25,
      "101-200m": null,
      "201-400m": null,
      "401-800m": null
    }
  },
  "grenade_launcher": {
    "categoryRu": "Гранатомёт",
    "categoryEn": "Grenade Launcher",
    "dvs": {
      "0-6m": 16,
      "7-12m": 15,
      "13-25m": 15,
      "26-50m": 17,
      "51-100m": 20,
      "101-200m": 22,
      "201-400m": 25,
      "401-800m": null
    }
  },
  "rocket_launcher": {
    "categoryRu": "Ракетомёт",
    "categoryEn": "Rocket Launcher",
    "dvs": {
      "0-6m": 17,
      "7-12m": 16,
      "13-25m": 15,
      "26-50m": 15,
      "51-100m": 20,
      "101-200m": 20,
      "201-400m": 25,
      "401-800m": 30
    }
  }
};

export const CPR_SKILL_DVS = [
  {
    "levelEn": "Simple",
    "levelRu": "Простая",
    "dv": 9,
    "example": ""
  },
  {
    "levelEn": "Everyday",
    "levelRu": "Обычная",
    "dv": 13,
    "example": ""
  },
  {
    "levelEn": "Difficult",
    "levelRu": "Сложная",
    "dv": 15,
    "example": ""
  },
  {
    "levelEn": "Professional",
    "levelRu": "Профессиональная",
    "dv": 17,
    "example": ""
  },
  {
    "levelEn": "Heroic",
    "levelRu": "Героическая",
    "dv": 21,
    "example": ""
  },
  {
    "levelEn": "Incredible",
    "levelRu": "Невероятная",
    "dv": 24,
    "example": ""
  },
  {
    "levelEn": "Legendary",
    "levelRu": "Легендарная",
    "dv": 29,
    "example": ""
  }
];

export const CPR_CRITICAL_INJURIES_HEAD: CriticalInjury[] = [
  {
    "id": "crit-h-2",
    "nameRu": "Потеря глаза",
    "nameEn": "Lost Eye",
    "location": "head",
    "rollNumber": 2,
    "effectRu": "Глаз потерян. −4 к дальним атакам и зрительному Восприятию. Базовый Death Save +1.",
    "effectEn": "Глаз потерян. −4 к дальним атакам и зрительному Восприятию. Базовый Death Save +1.",
    "quickFixDv": 0,
    "treatmentDv": 17,
    "treatmentTextRu": "Хирургия DV17",
    "isActive": false,
    "quickFixTextRu": "Нет",
    "rangedModifier": -4,
    "deathSaveModifier": 1
  },
  {
    "id": "crit-h-3",
    "nameRu": "Травма мозга",
    "nameEn": "Brain Injury",
    "location": "head",
    "rollNumber": 3,
    "effectRu": "−2 ко всем действиям. Базовый Death Save +1.",
    "effectEn": "−2 ко всем действиям. Базовый Death Save +1.",
    "quickFixDv": 0,
    "treatmentDv": 17,
    "treatmentTextRu": "Хирургия DV17",
    "isActive": false,
    "quickFixTextRu": "Нет",
    "actionModifier": -2,
    "deathSaveModifier": 1
  },
  {
    "id": "crit-h-4",
    "nameRu": "Повреждение глаза",
    "nameEn": "Damaged Eye",
    "location": "head",
    "rollNumber": 4,
    "effectRu": "−2 к дальним атакам и зрительному Восприятию.",
    "effectEn": "−2 к дальним атакам и зрительному Восприятию.",
    "quickFixDv": 15,
    "treatmentDv": 13,
    "quickFixTextRu": "Парамедицина DV15",
    "treatmentTextRu": "Хирургия DV13",
    "isActive": false,
    "rangedModifier": -2
  },
  {
    "id": "crit-h-5",
    "nameRu": "Контузия / Сотрясение",
    "nameEn": "Concussion",
    "location": "head",
    "rollNumber": 5,
    "effectRu": "−2 ко всем действиям.",
    "effectEn": "−2 ко всем действиям.",
    "quickFixDv": 13,
    "treatmentDv": 0,
    "quickFixTextRu": "Первая помощь или Парамедицина DV13",
    "treatmentTextRu": "Быстрая помощь устраняет эффект навсегда",
    "isActive": false,
    "actionModifier": -2
  },
  {
    "id": "crit-h-6",
    "nameRu": "Сломанная челюсть",
    "nameEn": "Fractured Jaw",
    "location": "head",
    "rollNumber": 6,
    "effectRu": "−4 к действиям, требующим речи.",
    "effectEn": "−4 к действиям, требующим речи.",
    "quickFixDv": 13,
    "treatmentDv": 13,
    "quickFixTextRu": "Парамедицина DV13",
    "treatmentTextRu": "Парамедицина или Хирургия DV13",
    "isActive": false
  },
  {
    "id": "crit-h-7",
    "nameRu": "Инородное тело",
    "nameEn": "Foreign Object",
    "location": "head",
    "rollNumber": 7,
    "effectRu": "В конце хода с перемещением пешком более 4 м: повторно 5 урона прямо в HP.",
    "effectEn": "В конце хода с перемещением пешком более 4 м: повторно 5 урона прямо в HP.",
    "quickFixDv": 13,
    "treatmentDv": 0,
    "quickFixTextRu": "Первая помощь или Парамедицина DV13",
    "treatmentTextRu": "Быстрая помощь устраняет эффект навсегда",
    "isActive": false,
    "recurringDamage": 5
  },
  {
    "id": "crit-h-8",
    "nameRu": "Хлыстовая травма шеи",
    "nameEn": "Whiplash",
    "location": "head",
    "rollNumber": 8,
    "effectRu": "Базовый Death Save +1.",
    "effectEn": "Базовый Death Save +1.",
    "quickFixDv": 13,
    "treatmentDv": 13,
    "quickFixTextRu": "Парамедицина DV13",
    "treatmentTextRu": "Парамедицина или Хирургия DV13",
    "isActive": false,
    "deathSaveModifier": 1
  },
  {
    "id": "crit-h-9",
    "nameRu": "Трещина черепа",
    "nameEn": "Cracked Skull",
    "location": "head",
    "rollNumber": 9,
    "effectRu": "Пробивший броню урон прицельного попадания в голову ×3 вместо ×2. Базовый Death Save +1.",
    "effectEn": "Пробивший броню урон прицельного попадания в голову ×3 вместо ×2. Базовый Death Save +1.",
    "quickFixDv": 15,
    "treatmentDv": 15,
    "quickFixTextRu": "Парамедицина DV15",
    "treatmentTextRu": "Парамедицина или Хирургия DV15",
    "isActive": false,
    "headMultiplier": 3,
    "deathSaveModifier": 1
  },
  {
    "id": "crit-h-10",
    "nameRu": "Повреждение уха",
    "nameEn": "Damaged Ear",
    "location": "head",
    "rollNumber": 10,
    "effectRu": "−2 к слуховому Восприятию. После движения пешком более 4 м в следующий ход нельзя использовать Move Action.",
    "effectEn": "−2 к слуховому Восприятию. После движения пешком более 4 м в следующий ход нельзя использовать Move Action.",
    "quickFixDv": 13,
    "treatmentDv": 13,
    "quickFixTextRu": "Парамедицина DV13",
    "treatmentTextRu": "Хирургия DV13",
    "isActive": false
  },
  {
    "id": "crit-h-11",
    "nameRu": "Раздавленная трахея",
    "nameEn": "Crushed Windpipe",
    "location": "head",
    "rollNumber": 11,
    "effectRu": "Нельзя говорить. Базовый Death Save +1.",
    "effectEn": "Нельзя говорить. Базовый Death Save +1.",
    "quickFixDv": 0,
    "treatmentDv": 15,
    "quickFixTextRu": "Нет",
    "treatmentTextRu": "Хирургия DV15",
    "isActive": false,
    "deathSaveModifier": 1
  },
  {
    "id": "crit-h-12",
    "nameRu": "Потеря уха",
    "nameEn": "Lost Ear",
    "location": "head",
    "rollNumber": 12,
    "effectRu": "Ухо потеряно. −4 к слуховому Восприятию. После движения пешком более 4 м в следующий ход нельзя использовать Move Action. Базовый Death Save +1.",
    "effectEn": "Ухо потеряно. −4 к слуховому Восприятию. После движения пешком более 4 м в следующий ход нельзя использовать Move Action. Базовый Death Save +1.",
    "quickFixDv": 0,
    "treatmentDv": 17,
    "treatmentTextRu": "Хирургия DV17",
    "isActive": false,
    "quickFixTextRu": "Нет",
    "deathSaveModifier": 1
  }
];

export const CPR_CRITICAL_INJURIES_BODY: CriticalInjury[] = [
  {
    "id": "crit-b-2",
    "nameRu": "Оторванная рука",
    "nameEn": "Dismembered Arm",
    "location": "body",
    "rollNumber": 2,
    "effectRu": "Рука потеряна, предметы из кисти падают. Базовый Death Save +1.",
    "effectEn": "Рука потеряна, предметы из кисти падают. Базовый Death Save +1.",
    "quickFixDv": 0,
    "treatmentDv": 17,
    "treatmentTextRu": "Хирургия DV17",
    "isActive": false,
    "quickFixTextRu": "Нет",
    "deathSaveModifier": 1
  },
  {
    "id": "crit-b-3",
    "nameRu": "Оторванная кисть",
    "nameEn": "Dismembered Hand",
    "location": "body",
    "rollNumber": 3,
    "effectRu": "Кисть потеряна, предметы падают. Базовый Death Save +1.",
    "effectEn": "Кисть потеряна, предметы падают. Базовый Death Save +1.",
    "quickFixDv": 0,
    "treatmentDv": 17,
    "treatmentTextRu": "Хирургия DV17",
    "isActive": false,
    "quickFixTextRu": "Нет",
    "deathSaveModifier": 1
  },
  {
    "id": "crit-b-4",
    "nameRu": "Коллапс лёгкого",
    "nameEn": "Collapsed Lung",
    "location": "body",
    "rollNumber": 4,
    "effectRu": "−2 MOVE (минимум 1). Базовый Death Save +1.",
    "effectEn": "−2 MOVE (минимум 1). Базовый Death Save +1.",
    "quickFixDv": 15,
    "treatmentDv": 15,
    "quickFixTextRu": "Парамедицина DV15",
    "treatmentTextRu": "Хирургия DV15",
    "isActive": false,
    "moveModifier": -2,
    "deathSaveModifier": 1
  },
  {
    "id": "crit-b-5",
    "nameRu": "Сломанные рёбра",
    "nameEn": "Broken Ribs",
    "location": "body",
    "rollNumber": 5,
    "effectRu": "В конце хода с перемещением пешком более 4 м: повторно 5 урона прямо в HP.",
    "effectEn": "В конце хода с перемещением пешком более 4 м: повторно 5 урона прямо в HP.",
    "quickFixDv": 13,
    "treatmentDv": 15,
    "quickFixTextRu": "Парамедицина DV13",
    "treatmentTextRu": "Парамедицина DV15 или Хирургия DV13",
    "isActive": false,
    "recurringDamage": 5
  },
  {
    "id": "crit-b-6",
    "nameRu": "Сломанная рука",
    "nameEn": "Broken Arm",
    "location": "body",
    "rollNumber": 6,
    "effectRu": "Руку нельзя использовать. Предметы из кисти немедленно падают.",
    "effectEn": "Руку нельзя использовать. Предметы из кисти немедленно падают.",
    "quickFixDv": 13,
    "treatmentDv": 15,
    "quickFixTextRu": "Парамедицина DV13",
    "treatmentTextRu": "Парамедицина DV15 или Хирургия DV13",
    "isActive": false
  },
  {
    "id": "crit-b-7",
    "nameRu": "Инородное тело",
    "nameEn": "Foreign Object",
    "location": "body",
    "rollNumber": 7,
    "effectRu": "В конце хода с перемещением пешком более 4 м: повторно 5 урона прямо в HP.",
    "effectEn": "В конце хода с перемещением пешком более 4 м: повторно 5 урона прямо в HP.",
    "quickFixDv": 13,
    "treatmentDv": 0,
    "quickFixTextRu": "Первая помощь или Парамедицина DV13",
    "treatmentTextRu": "Быстрая помощь устраняет эффект навсегда",
    "isActive": false,
    "recurringDamage": 5
  },
  {
    "id": "crit-b-8",
    "nameRu": "Сломанная нога",
    "nameEn": "Broken Leg",
    "location": "body",
    "rollNumber": 8,
    "effectRu": "−4 MOVE (минимум 1).",
    "effectEn": "−4 MOVE (минимум 1).",
    "quickFixDv": 13,
    "treatmentDv": 15,
    "quickFixTextRu": "Парамедицина DV13",
    "treatmentTextRu": "Парамедицина DV15 или Хирургия DV13",
    "isActive": false,
    "moveModifier": -4
  },
  {
    "id": "crit-b-9",
    "nameRu": "Разорванная мышца",
    "nameEn": "Torn Muscle",
    "location": "body",
    "rollNumber": 9,
    "effectRu": "−2 к атакам ближнего боя.",
    "effectEn": "−2 к атакам ближнего боя.",
    "quickFixDv": 13,
    "treatmentDv": 0,
    "quickFixTextRu": "Первая помощь или Парамедицина DV13",
    "treatmentTextRu": "Быстрая помощь устраняет эффект навсегда",
    "isActive": false,
    "meleeModifier": -2
  },
  {
    "id": "crit-b-10",
    "nameRu": "Травма позвоночника",
    "nameEn": "Spinal Injury",
    "location": "body",
    "rollNumber": 10,
    "effectRu": "В следующий ход доступно только Move Action. Базовый Death Save +1.",
    "effectEn": "В следующий ход доступно только Move Action. Базовый Death Save +1.",
    "quickFixDv": 15,
    "treatmentDv": 15,
    "treatmentTextRu": "Хирургия DV15",
    "isActive": false,
    "quickFixTextRu": "Парамедицина DV15",
    "deathSaveModifier": 1
  },
  {
    "id": "crit-b-11",
    "nameRu": "Раздавленные пальцы",
    "nameEn": "Crushed Fingers",
    "location": "body",
    "rollNumber": 11,
    "effectRu": "−4 к действиям, использующим эту кисть.",
    "effectEn": "−4 к действиям, использующим эту кисть.",
    "quickFixDv": 13,
    "treatmentDv": 15,
    "quickFixTextRu": "Парамедицина DV13",
    "treatmentTextRu": "Хирургия DV15",
    "isActive": false
  },
  {
    "id": "crit-b-12",
    "nameRu": "Оторванная нога",
    "nameEn": "Dismembered Leg",
    "location": "body",
    "rollNumber": 12,
    "effectRu": "Нога потеряна. −6 MOVE (минимум 1), нельзя уклоняться от атак. Базовый Death Save +1.",
    "effectEn": "Нога потеряна. −6 MOVE (минимум 1), нельзя уклоняться от атак. Базовый Death Save +1.",
    "quickFixDv": 0,
    "treatmentDv": 17,
    "treatmentTextRu": "Хирургия DV17",
    "isActive": false,
    "quickFixTextRu": "Нет",
    "moveModifier": -6,
    "noDodge": true,
    "deathSaveModifier": 1
  }
];

export const CPR_ARMORS = [
  {
    "nameRu": "Кожаная куртка (Leather)",
    "sp": 4,
    "penalty": 0,
    "costEb": 20
  },
  {
    "nameRu": "Кевлар (Kevlar)",
    "sp": 7,
    "penalty": 0,
    "costEb": 50
  },
  {
    "nameRu": "Лёгкий арморджек (Light Armorjack)",
    "sp": 11,
    "penalty": 0,
    "costEb": 100
  },
  {
    "nameRu": "Телесный костюм (Bodyweight Suit)",
    "sp": 11,
    "penalty": 0,
    "costEb": 1000
  },
  {
    "nameRu": "Средний арморджек (Medium Armorjack)",
    "sp": 12,
    "penalty": -2,
    "costEb": 100
  },
  {
    "nameRu": "Тяжёлый арморджек (Heavy Armorjack)",
    "sp": 13,
    "penalty": -2,
    "costEb": 500
  },
  {
    "nameRu": "Бронекостюм Флак (Flak)",
    "sp": 15,
    "penalty": -4,
    "costEb": 500
  },
  {
    "nameRu": "Металгир (Metalgear)",
    "sp": 18,
    "penalty": -4,
    "costEb": 5000
  },
  {
    "nameRu": "Пуленепробиваемый щит (10 HP, не SP)",
    "sp": 10,
    "penalty": 0,
    "costEb": 100,
    "isShield": true
  }
];

export function weaponRangeKey(weapon: Pick<Weapon, 'category'>): string | undefined {
  const category = weapon.category.trim().toLowerCase().replace(/[ _-]+/g, ' ');
  if (category.includes('autofire')) return category.includes('smg') ? 'autofire_smg' : category.includes('rifle') ? 'autofire_rifle' : undefined;
  if (category.includes('sniper') || category.includes('снайпер')) return 'sniper_rifle';
  if (category.includes('assault') || category.includes('штурмов')) return 'assault_rifle';
  if (category.includes('grenade launcher') || category.includes('гранатом')) return 'grenade_launcher';
  if (category.includes('rocket') || category.includes('ракетом')) return 'rocket_launcher';
  if (category.includes('shotgun') || category.includes('дробовик')) return /shell|buckshot|дробь|картечь/.test(category) ? 'shotgun_shell' : 'shotgun_slug';
  if (category.includes('smg') || category === 'пп') return 'smg';
  if (category.includes('bow') || category.includes('лук') || category.includes('арбалет')) return 'bow';
  if (category.includes('pistol') || category.includes('пистолет')) return 'pistol';
  return undefined;
}
