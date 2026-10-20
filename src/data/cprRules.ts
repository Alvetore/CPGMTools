import { CriticalInjury } from '../types/character';

export interface WeaponRangeDVs {
  categoryRu: string;
  categoryEn: string;
  dvs: {
    '0-6m': number | null;
    '7-12m': number | null;
    '13-25m': number | null;
    '26-50m': number | null;
    '51-100m': number | null;
  };
}

export const CPR_RANGE_DV_TABLE: Record<string, WeaponRangeDVs> = {
  pistol: {
    categoryRu: 'Пистолет (Любой)',
    categoryEn: 'Pistol (Medium, Heavy, Very Heavy)',
    dvs: { '0-6m': 13, '7-12m': 15, '13-25m': 20, '26-50m': 25, '51-100m': 30 }
  },
  smg: {
    categoryRu: 'ПП / Тяжёлый ПП (Одиночный)',
    categoryEn: 'SMG / Heavy SMG (Single Shot)',
    dvs: { '0-6m': 15, '7-12m': 13, '13-25m': 15, '26-50m': 20, '51-100m': 25 }
  },
  shotgun_slug: {
    categoryRu: 'Дробовик (Жакан)',
    categoryEn: 'Shotgun (Slug)',
    dvs: { '0-6m': 13, '7-12m': 15, '13-25m': 20, '26-50m': 25, '51-100m': 30 }
  },
  shotgun_shell: {
    categoryRu: 'Дробовик (Картечь - конус 3x3)',
    categoryEn: 'Shotgun (Buckshot Cone)',
    dvs: { '0-6m': 13, '7-12m': 13, '13-25m': null, '26-50m': null, '51-100m': null }
  },
  assault_rifle: {
    categoryRu: 'Штурмовая винтовка (Одиночный)',
    categoryEn: 'Assault Rifle (Single Shot)',
    dvs: { '0-6m': 17, '7-12m': 16, '13-25m': 15, '26-50m': 13, '51-100m': 15 }
  },
  sniper_rifle: {
    categoryRu: 'Снайперская винтовка',
    categoryEn: 'Sniper Rifle',
    dvs: { '0-6m': 30, '7-12m': 25, '13-25m': 20, '26-50m': 15, '51-100m': 13 }
  },
  bow: {
    categoryRu: 'Лук и Арбалет',
    categoryEn: 'Bow & Crossbow',
    dvs: { '0-6m': 15, '7-12m': 13, '13-25m': 15, '26-50m': 17, '51-100m': 20 }
  },
  autofire_smg: {
    categoryRu: 'Очередь: ПП',
    categoryEn: 'Autofire: SMG',
    dvs: { '0-6m': 20, '7-12m': 17, '13-25m': 20, '26-50m': 25, '51-100m': null }
  },
  autofire_rifle: {
    categoryRu: 'Очередь: Штурмовая винтовка',
    categoryEn: 'Autofire: Assault Rifle',
    dvs: { '0-6m': 22, '7-12m': 20, '13-25m': 17, '26-50m': 20, '51-100m': 25 }
  }
};

export const CPR_SKILL_DVS = [
  { levelRu: 'Простая (Simple)', levelEn: 'Simple', dv: 9, example: 'Завести исправный мотоцикл, завязать шнурки' },
  { levelRu: 'Обычная (Everyday)', levelEn: 'Everyday', dv: 13, example: 'Взломать дешёвый замок, оказать базовую первую помощь' },
  { levelRu: 'Сложная (Difficult)', levelEn: 'Difficult', dv: 17, example: 'Починить сложный мотор под обстрелом, распознать ложь профи' },
  { levelRu: 'Профессиональная (Professional)', levelEn: 'Professional', dv: 21, example: 'Выполнить операцию на мозге в полевых условиях, обойти шифрование' },
  { levelRu: 'Героическая (Heroic)', levelEn: 'Heroic', dv: 24, example: 'Трюк на горящем спорткаре над обрывом' },
  { levelRu: 'Невероятная (Incredible)', levelEn: 'Incredible', dv: 29, example: 'Подвиг уровня Джонни Сильверхенда или Моргана Блэкхенда' }
];

export const CPR_CRITICAL_INJURIES_HEAD: CriticalInjury[] = [
  {
    id: 'crit-h-2',
    nameRu: 'Потеря глаза',
    nameEn: 'Lost Eye',
    location: 'head',
    rollNumber: 2,
    effectRu: 'Глаз уничтожен. -2 ко всем проверкам дальнего боя и Восприятия, связанным со зрением.',
    effectEn: 'Eye destroyed. -2 to Ranged Attacks & sight Perception.',
    quickFixDv: 0,
    treatmentDv: 17,
    treatmentTextRu: 'Хирургия (Сл 17) для установки киберглаза или клонирования.',
    isActive: false
  },
  {
    id: 'crit-h-3',
    nameRu: 'Травма мозга',
    nameEn: 'Brain Injury',
    location: 'head',
    rollNumber: 3,
    effectRu: '-2 ко всем проверкам, использующим характеристики INT, TECH и COOL.',
    effectEn: '-2 to all Checks using INT, TECH, and COOL.',
    quickFixDv: 0,
    treatmentDv: 17,
    treatmentTextRu: 'Хирургия (Сл 17).',
    isActive: false
  },
  {
    id: 'crit-h-4',
    nameRu: 'Повреждение глаза',
    nameEn: 'Damaged Eye',
    location: 'head',
    rollNumber: 4,
    effectRu: '-1 ко всем проверкам дальнего боя и проверкам Восприятия, связанным со зрением.',
    effectEn: '-1 to Ranged Attacks & sight Perception.',
    quickFixDv: 15,
    treatmentDv: 15,
    quickFixTextRu: 'Первая помощь / Парамедик (Сл 15).',
    treatmentTextRu: 'Парамедик / Хирургия (Сл 15).',
    isActive: false
  },
  {
    id: 'crit-h-5',
    nameRu: 'Контузия / Сотрясение',
    nameEn: 'Concussion',
    location: 'head',
    rollNumber: 5,
    effectRu: '-2 ко всем проверкам. Персонаж ошеломлен.',
    effectEn: '-2 to all Checks.',
    quickFixDv: 13,
    treatmentDv: 13,
    quickFixTextRu: 'Первая помощь / Парамедик (Сл 13).',
    treatmentTextRu: 'Парамедик / Хирургия (Сл 13).',
    isActive: false
  },
  {
    id: 'crit-h-6',
    nameRu: 'Сломанная челюсть',
    nameEn: 'Fractured Jaw',
    location: 'head',
    rollNumber: 6,
    effectRu: '-4 ко всем речевым проверкам, невозможно нормально есть и говорить внятно.',
    effectEn: '-4 to voice/speech Checks.',
    quickFixDv: 13,
    treatmentDv: 13,
    quickFixTextRu: 'Первая помощь / Парамедик (Сл 13).',
    treatmentTextRu: 'Парамедик / Хирургия (Сл 13).',
    isActive: false
  },
  {
    id: 'crit-h-7',
    nameRu: 'Инородное тело',
    nameEn: 'Foreign Object',
    location: 'head',
    rollNumber: 7,
    effectRu: 'Осколок или пуля застряли. В конце хода, если совершалось движение больше 4м, получаешь 1d6 прямого урона.',
    effectEn: 'Taking Move action inflicts 1d6 direct damage at end of turn.',
    quickFixDv: 13,
    treatmentDv: 13,
    quickFixTextRu: 'Первая помощь / Парамедик (Сл 13) для извлечения.',
    treatmentTextRu: 'Парамедик / Хирургия (Сл 13).',
    isActive: false
  },
  {
    id: 'crit-h-8',
    nameRu: 'Хлыстовая травма шеи',
    nameEn: 'Whiplash',
    location: 'head',
    rollNumber: 8,
    effectRu: '-2 ко всем физическим проверкам и броскам на уклонение.',
    effectEn: '-2 to physical checks and evasion.',
    quickFixDv: 13,
    treatmentDv: 13,
    quickFixTextRu: 'Первая помощь / Парамедик (Сл 13).',
    treatmentTextRu: 'Парамедик / Хирургия (Сл 13).',
    isActive: false
  },
  {
    id: 'crit-h-9',
    nameRu: 'Трещина черепа',
    nameEn: 'Cracked Skull',
    location: 'head',
    rollNumber: 9,
    effectRu: 'Любой урон по голове наносит +1d6 дополнительного урона.',
    effectEn: 'Head damage deals additional 1d6 damage.',
    quickFixDv: 15,
    treatmentDv: 15,
    quickFixTextRu: 'Первая помощь / Парамедик (Сл 15).',
    treatmentTextRu: 'Парамедик / Хирургия (Сл 15).',
    isActive: false
  },
  {
    id: 'crit-h-10',
    nameRu: 'Повреждение уха',
    nameEn: 'Damaged Ear',
    location: 'head',
    rollNumber: 10,
    effectRu: '-2 ко всем проверкам Восприятия, связанным со слухом.',
    effectEn: '-2 to hearing Perception.',
    quickFixDv: 13,
    treatmentDv: 13,
    quickFixTextRu: 'Первая помощь / Парамедик (Сл 13).',
    treatmentTextRu: 'Парамедик / Хирургия (Сл 13).',
    isActive: false
  },
  {
    id: 'crit-h-11',
    nameRu: 'Раздавленная трахея',
    nameEn: 'Crushed Windpipe',
    location: 'head',
    rollNumber: 11,
    effectRu: 'Невозможно говорить. Персонаж начинает задыхаться, если не стабилизировать.',
    effectEn: 'Cannot speak. Begins suffocating.',
    quickFixDv: 15,
    treatmentDv: 17,
    quickFixTextRu: 'Парамедик (Сл 15).',
    treatmentTextRu: 'Хирургия (Сл 17).',
    isActive: false
  },
  {
    id: 'crit-h-12',
    nameRu: 'Потеря уха',
    nameEn: 'Lost Ear',
    location: 'head',
    rollNumber: 12,
    effectRu: 'Ухо оторвано. -4 ко всем слуховым проверкам Восприятия.',
    effectEn: 'Lost ear. -4 to hearing Perception.',
    quickFixDv: 0,
    treatmentDv: 15,
    treatmentTextRu: 'Хирургия (Сл 15) для киберуха.',
    isActive: false
  }
];

export const CPR_CRITICAL_INJURIES_BODY: CriticalInjury[] = [
  {
    id: 'crit-b-2',
    nameRu: 'Оторванная рука',
    nameEn: 'Dismembered Arm',
    location: 'body',
    rollNumber: 2,
    effectRu: 'Рука оторвана. Рука потеряна вместе со всем, что в ней было. -4 к двухручным действиям.',
    effectEn: 'Arm severed at elbow/shoulder. Cannot use 2-handed items.',
    quickFixDv: 0,
    treatmentDv: 17,
    treatmentTextRu: 'Хирургия (Сл 17) для установки киберруки.',
    isActive: false
  },
  {
    id: 'crit-b-3',
    nameRu: 'Оторванная кисть',
    nameEn: 'Dismembered Hand',
    location: 'body',
    rollNumber: 3,
    effectRu: 'Кисть оторвана. Невозможно держать предметы этой рукой.',
    effectEn: 'Hand severed. Cannot hold items in this hand.',
    quickFixDv: 0,
    treatmentDv: 15,
    treatmentTextRu: 'Хирургия (Сл 15).',
    isActive: false
  },
  {
    id: 'crit-b-4',
    nameRu: 'Коллапс лёгкого',
    nameEn: 'Collapsed Lung',
    location: 'body',
    rollNumber: 4,
    effectRu: 'MOVE уменьшается вдвое. Нельзя бежать.',
    effectEn: 'MOVE halved. Cannot run.',
    quickFixDv: 15,
    treatmentDv: 17,
    quickFixTextRu: 'Парамедик (Сл 15).',
    treatmentTextRu: 'Хирургия (Сл 17).',
    isActive: false
  },
  {
    id: 'crit-b-5',
    nameRu: 'Сломанные рёбра',
    nameEn: 'Broken Ribs',
    location: 'body',
    rollNumber: 5,
    effectRu: 'В конце хода, если совершалось движение, получаешь 1d6 прямого урона.',
    effectEn: 'Take 1d6 damage at end of turn if moving.',
    quickFixDv: 13,
    treatmentDv: 13,
    quickFixTextRu: 'Первая помощь / Парамедик (Сл 13).',
    treatmentTextRu: 'Парамедик / Хирургия (Сл 13).',
    isActive: false
  },
  {
    id: 'crit-b-6',
    nameRu: 'Сломанная рука',
    nameEn: 'Broken Arm',
    location: 'body',
    rollNumber: 6,
    effectRu: 'Рука бесполезна. Нельзя использовать для атак или держания предметов.',
    effectEn: 'Arm useless. Cannot hold or attack.',
    quickFixDv: 13,
    treatmentDv: 13,
    quickFixTextRu: 'Первая помощь / Парамедик (Сл 13).',
    treatmentTextRu: 'Парамедик / Хирургия (Сл 13).',
    isActive: false
  },
  {
    id: 'crit-b-7',
    nameRu: 'Инородное тело',
    nameEn: 'Foreign Object',
    location: 'body',
    rollNumber: 7,
    effectRu: 'Пуля или лезвие в теле. В конце хода при движении более 4м наносит 1d6 урона.',
    effectEn: 'Moving takes 1d6 damage.',
    quickFixDv: 13,
    treatmentDv: 13,
    quickFixTextRu: 'Первая помощь / Парамедик (Сл 13).',
    treatmentTextRu: 'Парамедик / Хирургия (Сл 13).',
    isActive: false
  },
  {
    id: 'crit-b-8',
    nameRu: 'Сломанная нога',
    nameEn: 'Broken Leg',
    location: 'body',
    rollNumber: 8,
    effectRu: 'MOVE уменьшается на 4 (минимум 1). Нельзя бежать или уклоняться от пуль.',
    effectEn: 'MOVE reduced by 4 (min 1). Cannot dodge bullets.',
    quickFixDv: 13,
    treatmentDv: 13,
    quickFixTextRu: 'Первая помощь / Парамедик (Сл 13).',
    treatmentTextRu: 'Парамедик / Хирургия (Сл 13).',
    isActive: false
  },
  {
    id: 'crit-b-9',
    nameRu: 'Разорванная мышца',
    nameEn: 'Torn Muscle',
    location: 'body',
    rollNumber: 9,
    effectRu: '-2 ко всем атакам ближнего боя и проверкам атлетики.',
    effectEn: '-2 to Melee & Athletics.',
    quickFixDv: 13,
    treatmentDv: 13,
    quickFixTextRu: 'Первая помощь / Парамедик (Сл 13).',
    treatmentTextRu: 'Парамедик / Хирургия (Сл 13).',
    isActive: false
  },
  {
    id: 'crit-b-10',
    nameRu: 'Травма позвоночника',
    nameEn: 'Spinal Injury',
    location: 'body',
    rollNumber: 10,
    effectRu: 'Персонаж парализован ниже пояса или частично парализован. MOVE = 1.',
    effectEn: 'Paralyzed. MOVE becomes 1.',
    quickFixDv: 0,
    treatmentDv: 17,
    treatmentTextRu: 'Хирургия (Сл 17) или установка киберпозвоночника.',
    isActive: false
  },
  {
    id: 'crit-b-11',
    nameRu: 'Раздавленные пальцы',
    nameEn: 'Crushed Fingers',
    location: 'body',
    rollNumber: 11,
    effectRu: '-4 ко всем действиям этой рукой (стрельба, взлом, подбор предметов).',
    effectEn: '-4 to checks using this hand.',
    quickFixDv: 13,
    treatmentDv: 13,
    quickFixTextRu: 'Первая помощь / Парамедик (Сл 13).',
    treatmentTextRu: 'Парамедик / Хирургия (Сл 13).',
    isActive: false
  },
  {
    id: 'crit-b-12',
    nameRu: 'Оторванная нога',
    nameEn: 'Dismembered Leg',
    location: 'body',
    rollNumber: 12,
    effectRu: 'Нога оторвана. Персонаж падает ничком. MOVE = 1 (ползком).',
    effectEn: 'Leg severed. Prone, MOVE = 1.',
    quickFixDv: 0,
    treatmentDv: 17,
    treatmentTextRu: 'Хирургия (Сл 17) для установки киберноги.',
    isActive: false
  }
];

export const CPR_ARMORS = [
  { nameRu: 'Кожаная куртка (Leather)', sp: 4, penalty: 0, costEb: 20 },
  { nameRu: 'Кевлар (Kevlar)', sp: 7, penalty: 0, costEb: 50 },
  { nameRu: 'Лёгкий арморджек (Light Armorjack)', sp: 11, penalty: 0, costEb: 100 },
  { nameRu: 'Телесный костюм (Bodyweight Suit)', sp: 11, penalty: 0, costEb: 1000 },
  { nameRu: 'Средний арморджек (Medium Armorjack)', sp: 12, penalty: -2, costEb: 100 },
  { nameRu: 'Тяжёлый арморджек (Heavy Armorjack)', sp: 13, penalty: -2, costEb: 500 },
  { nameRu: 'Бронекостюм Флак (Flak)', sp: 15, penalty: -4, costEb: 500 },
  { nameRu: 'Металгир (Metalgear)', sp: 18, penalty: -4, costEb: 5000 },
  { nameRu: 'Пуленепробиваемый щит (Bulletproof Shield)', sp: 10, penalty: 0, costEb: 100, isShield: true }
];
